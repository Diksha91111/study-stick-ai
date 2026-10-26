import { spawn, execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  ExecutionRequest,
  ExecutionResult,
  IExecutionEngine,
  MAX_OUTPUT_SIZE_BYTES,
  DEFAULT_TIMEOUT_MS,
  MAX_TIMEOUT_MS,
} from './executionEngine.js';

export class DockerSandboxAdapter implements IExecutionEngine {
  /**
   * Helper to check if Docker daemon is available and responsive on the system.
   */
  public static isDockerAvailable(): boolean {
    try {
      execSync('docker info', { stdio: 'ignore', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  public async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const timeoutMs = Math.min(
      Math.max(request.timeoutMs || DEFAULT_TIMEOUT_MS, 1000),
      MAX_TIMEOUT_MS
    );

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codelab-docker-'));

    try {
      switch (request.language) {
        case 'python':
          return await this.runDocker(
            'python:3.11-alpine',
            ['python', '/code/main.py'],
            request.code,
            'main.py',
            request.stdin,
            timeoutMs,
            tempDir
          );
        case 'javascript':
          return await this.runDocker(
            'node:20-alpine',
            ['node', '/code/main.js'],
            request.code,
            'main.js',
            request.stdin,
            timeoutMs,
            tempDir
          );
        case 'c':
          return await this.runDockerCompiled(
            'gcc:alpine',
            ['sh', '-c', 'gcc /code/main.c -o /tmp/main && /tmp/main'],
            request.code,
            'main.c',
            request.stdin,
            timeoutMs,
            tempDir
          );
        case 'cpp':
          return await this.runDockerCompiled(
            'gcc:alpine',
            ['sh', '-c', 'g++ /code/main.cpp -o /tmp/main && /tmp/main'],
            request.code,
            'main.cpp',
            request.stdin,
            timeoutMs,
            tempDir
          );
        case 'java':
          let className = 'Main';
          const classMatch = request.code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
          if (classMatch) className = classMatch[1];
          return await this.runDockerCompiled(
            'openjdk:17-alpine',
            ['sh', '-c', `javac /code/${className}.java -d /tmp && java -cp /tmp ${className}`],
            request.code,
            `${className}.java`,
            request.stdin,
            timeoutMs,
            tempDir
          );
        default:
          return {
            status: 'error',
            stdout: '',
            stderr: `Unsupported language: ${request.language}`,
            exitCode: 1,
            executionTime: 0,
            memoryUsage: 0,
            sandboxIsolated: true,
            sandboxType: 'docker_container',
          };
      }
    } finally {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  private async runDocker(
    image: string,
    commandArgs: string[],
    code: string,
    fileName: string,
    stdin: string | undefined,
    timeoutMs: number,
    tempDir: string
  ): Promise<ExecutionResult> {
    await fs.writeFile(path.join(tempDir, fileName), code, 'utf-8');

    // Docker run arguments with strict isolation flags
    const dockerArgs = [
      'run',
      '--rm',
      '--net=none', // No network access
      '--memory=128m', // 128MB Memory Limit
      '--cpus=0.5', // 0.5 CPU limit
      '--pids-limit=64', // Process limit
      '--read-only', // Read-only root filesystem
      '--cap-drop=ALL', // Drop all Linux capabilities
      '--security-opt=no-new-privileges:true', // Prevent privilege escalation
      '--user=1000:1000', // Unprivileged user
      '--tmpfs',
      '/tmp:rw,exec,size=32m',
      '-v',
      `${tempDir}:/code:ro`, // Read-only mount of user code
      image,
      ...commandArgs,
    ];

    return this.spawnDockerProcess(dockerArgs, stdin, timeoutMs);
  }

  private async runDockerCompiled(
    image: string,
    commandArgs: string[],
    code: string,
    fileName: string,
    stdin: string | undefined,
    timeoutMs: number,
    tempDir: string
  ): Promise<ExecutionResult> {
    await fs.writeFile(path.join(tempDir, fileName), code, 'utf-8');

    const dockerArgs = [
      'run',
      '--rm',
      '--net=none',
      '--memory=128m',
      '--cpus=0.5',
      '--pids-limit=64',
      '--read-only',
      '--cap-drop=ALL',
      '--security-opt=no-new-privileges:true',
      '--user=1000:1000',
      '--tmpfs',
      '/tmp:rw,exec,size=32m',
      '-v',
      `${tempDir}:/code:ro`,
      image,
      ...commandArgs,
    ];

    return this.spawnDockerProcess(dockerArgs, stdin, timeoutMs);
  }

  private spawnDockerProcess(
    dockerArgs: string[],
    stdin: string | undefined,
    timeoutMs: number
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const startTime = process.hrtime.bigint();

      const child = spawn('docker', dockerArgs, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        try {
          child.kill('SIGKILL');
        } catch {
          // Ignore kill errors
        }
      }, timeoutMs);

      if (stdin && child.stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      } else if (child.stdin) {
        child.stdin.end();
      }

      if (child.stdout) {
        child.stdout.on('data', (data: Buffer) => {
          if (stdout.length < MAX_OUTPUT_SIZE_BYTES) {
            stdout += data.toString('utf-8');
          }
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data: Buffer) => {
          if (stderr.length < MAX_OUTPUT_SIZE_BYTES) {
            stderr += data.toString('utf-8');
          }
        });
      }

      child.on('close', (code) => {
        clearTimeout(timer);
        const endTime = process.hrtime.bigint();
        const executionTime = Math.round(Number(endTime - startTime) / 1_000_000);

        let status: ExecutionResult['status'] = 'success';
        if (timedOut) {
          status = 'timeout';
          stderr += '\nExecution Timed Out (exceeded time limit)';
        } else if (stderr.includes('error:') || stderr.includes('javac') || stderr.includes('SyntaxError')) {
          status = code !== 0 ? 'compilation_error' : 'runtime_error';
        } else if (code !== 0 && code !== null) {
          status = 'runtime_error';
        }

        resolve({
          status,
          stdout,
          stderr,
          exitCode: code,
          executionTime,
          memoryUsage: 128 * 1024, // 128MB container limit
          sandboxIsolated: true,
          sandboxType: 'docker_container',
        });
      });
    });
  }
}
