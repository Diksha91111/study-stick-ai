import { spawn, ChildProcess } from 'child_process';
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

export class DevelopmentSandboxAdapter implements IExecutionEngine {
  public async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const timeoutMs = Math.min(
      Math.max(request.timeoutMs || DEFAULT_TIMEOUT_MS, 1000),
      MAX_TIMEOUT_MS
    );

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codelab-dev-'));

    try {
      switch (request.language) {
        case 'python':
          return await this.executePython(request.code, request.stdin, timeoutMs, tempDir);
        case 'javascript':
          return await this.executeJavaScript(request.code, request.stdin, timeoutMs, tempDir);
        case 'c':
          return await this.executeC(request.code, request.stdin, timeoutMs, tempDir);
        case 'cpp':
          return await this.executeCpp(request.code, request.stdin, timeoutMs, tempDir);
        case 'java':
          return await this.executeJava(request.code, request.stdin, timeoutMs, tempDir);
        default:
          return {
            status: 'error',
            stdout: '',
            stderr: `Unsupported language: ${request.language}`,
            exitCode: 1,
            executionTime: 0,
            memoryUsage: 0,
            sandboxIsolated: false,
            sandboxType: 'development_only_adapter',
            warning: 'DEVELOPMENT ONLY ADAPTER: Process run in unisolated dev environment.',
          };
      }
    } finally {
      // Always cleanup temp directory
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Safe child process execution with purged environment variables, timeout enforcement,
   * stdout/stderr buffering, and process cleanup.
   */
  private runCommand(
    cmd: string,
    args: string[],
    options: { cwd: string; stdin?: string; timeoutMs: number }
  ): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number | null;
    executionTime: number;
    memoryUsage: number;
    timedOut: boolean;
  }> {
    return new Promise((resolve) => {
      const startTime = process.hrtime.bigint();
      const memoryBefore = process.memoryUsage().heapUsed;

      // Purge all backend environment variables (secrets, DB URIs, API keys)
      const sanitizedEnv: Record<string, string> = {
        PATH: process.env.PATH || '',
        SYSTEMROOT: process.env.SYSTEMROOT || '',
        WINDIR: process.env.WINDIR || '',
        TEMP: options.cwd,
        TMP: options.cwd,
        PYTHONIOENCODING: 'utf-8',
      };

      let child: ChildProcess;
      try {
        child = spawn(cmd, args, {
          cwd: options.cwd,
          env: sanitizedEnv,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      } catch (err: any) {
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1_000_000;
        return resolve({
          stdout: '',
          stderr: `Failed to spawn process (${cmd}): ${err?.message || err}`,
          exitCode: 127,
          executionTime,
          memoryUsage: 0,
          timedOut: false,
        });
      }

      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let stdoutCapped = false;
      let stderrCapped = false;

      // Set timeout handler
      const timer = setTimeout(() => {
        timedOut = true;
        try {
          child.kill('SIGKILL');
        } catch {
          // Ignore kill errors
        }
      }, options.timeoutMs);

      // Handle stdin
      if (options.stdin && child.stdin) {
        child.stdin.write(options.stdin);
        child.stdin.end();
      } else if (child.stdin) {
        child.stdin.end();
      }

      // Buffer stdout with cap
      if (child.stdout) {
        child.stdout.on('data', (data: Buffer) => {
          if (stdoutCapped) return;
          if (stdout.length + data.length > MAX_OUTPUT_SIZE_BYTES) {
            stdout += data.subarray(0, MAX_OUTPUT_SIZE_BYTES - stdout.length).toString('utf-8');
            stdout += '\n[Output truncated: Maximum size limit exceeded]';
            stdoutCapped = true;
          } else {
            stdout += data.toString('utf-8');
          }
        });
      }

      // Buffer stderr with cap
      if (child.stderr) {
        child.stderr.on('data', (data: Buffer) => {
          if (stderrCapped) return;
          if (stderr.length + data.length > MAX_OUTPUT_SIZE_BYTES) {
            stderr += data.subarray(0, MAX_OUTPUT_SIZE_BYTES - stderr.length).toString('utf-8');
            stderr += '\n[Output truncated: Maximum size limit exceeded]';
            stderrCapped = true;
          } else {
            stderr += data.toString('utf-8');
          }
        });
      }

      child.on('error', (err) => {
        clearTimeout(timer);
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1_000_000;
        resolve({
          stdout,
          stderr: stderr + `\nProcess error: ${err.message}`,
          exitCode: 1,
          executionTime,
          memoryUsage: 0,
          timedOut: false,
        });
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1_000_000;
        const memoryAfter = process.memoryUsage().heapUsed;
        const memoryUsage = Math.max(0, Math.round((memoryAfter - memoryBefore) / 1024));

        resolve({
          stdout,
          stderr,
          exitCode: code,
          executionTime: Math.round(executionTime * 100) / 100,
          memoryUsage,
          timedOut,
        });
      });
    });
  }

  private formatResult(
    res: {
      stdout: string;
      stderr: string;
      exitCode: number | null;
      executionTime: number;
      memoryUsage: number;
      timedOut: boolean;
    },
    compilationError = false
  ): ExecutionResult {
    let status: ExecutionResult['status'] = 'success';
    if (res.timedOut) {
      status = 'timeout';
    } else if (compilationError) {
      status = 'compilation_error';
    } else if (res.exitCode !== 0 && res.exitCode !== null) {
      status = 'runtime_error';
    }

    let stderr = res.stderr;
    if (res.timedOut) {
      stderr = (stderr ? stderr + '\n' : '') + 'Execution Timed Out (exceeded time limit)';
    }

    return {
      status,
      stdout: res.stdout,
      stderr,
      exitCode: res.exitCode,
      executionTime: res.executionTime,
      memoryUsage: res.memoryUsage,
      sandboxIsolated: false,
      sandboxType: 'development_only_adapter',
      warning:
        'DEVELOPMENT ONLY ADAPTER: Execution process is not container isolated. Do not use in production.',
    };
  }

  // Language Handlers

  private async executePython(
    code: string,
    stdin: string | undefined,
    timeoutMs: number,
    tempDir: string
  ): Promise<ExecutionResult> {
    const filePath = path.join(tempDir, 'main.py');
    await fs.writeFile(filePath, code, 'utf-8');

    // Try python / python3
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const res = await this.runCommand(pythonCmd, [filePath], {
      cwd: tempDir,
      stdin,
      timeoutMs,
    });

    return this.formatResult(res);
  }

  private async executeJavaScript(
    code: string,
    stdin: string | undefined,
    timeoutMs: number,
    tempDir: string
  ): Promise<ExecutionResult> {
    const filePath = path.join(tempDir, 'main.js');
    await fs.writeFile(filePath, code, 'utf-8');

    const res = await this.runCommand('node', [filePath], {
      cwd: tempDir,
      stdin,
      timeoutMs,
    });

    return this.formatResult(res);
  }

  private async executeC(
    code: string,
    stdin: string | undefined,
    timeoutMs: number,
    tempDir: string
  ): Promise<ExecutionResult> {
    const srcPath = path.join(tempDir, 'main.c');
    const exeName = process.platform === 'win32' ? 'main.exe' : 'main';
    const exePath = path.join(tempDir, exeName);
    await fs.writeFile(srcPath, code, 'utf-8');

    // Compile step
    const gccCmd = process.platform === 'win32' ? 'gcc' : 'gcc';
    const compileRes = await this.runCommand(gccCmd, [srcPath, '-o', exePath], {
      cwd: tempDir,
      timeoutMs: 10000,
    });

    if (compileRes.exitCode !== 0) {
      return this.formatResult(compileRes, true);
    }

    // Execute step
    const execRes = await this.runCommand(exePath, [], {
      cwd: tempDir,
      stdin,
      timeoutMs,
    });

    return this.formatResult(execRes);
  }

  private async executeCpp(
    code: string,
    stdin: string | undefined,
    timeoutMs: number,
    tempDir: string
  ): Promise<ExecutionResult> {
    const srcPath = path.join(tempDir, 'main.cpp');
    const exeName = process.platform === 'win32' ? 'main.exe' : 'main';
    const exePath = path.join(tempDir, exeName);
    await fs.writeFile(srcPath, code, 'utf-8');

    // Compile step
    const gppCmd = process.platform === 'win32' ? 'g++' : 'g++';
    const compileRes = await this.runCommand(gppCmd, [srcPath, '-o', exePath], {
      cwd: tempDir,
      timeoutMs: 10000,
    });

    if (compileRes.exitCode !== 0) {
      return this.formatResult(compileRes, true);
    }

    // Execute step
    const execRes = await this.runCommand(exePath, [], {
      cwd: tempDir,
      stdin,
      timeoutMs,
    });

    return this.formatResult(execRes);
  }

  private async executeJava(
    code: string,
    stdin: string | undefined,
    timeoutMs: number,
    tempDir: string
  ): Promise<ExecutionResult> {
    // Extract public class name if present, else default to Main
    let className = 'Main';
    const classMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
    if (classMatch) {
      className = classMatch[1];
    }

    const srcPath = path.join(tempDir, `${className}.java`);
    await fs.writeFile(srcPath, code, 'utf-8');

    // Compile step
    const compileRes = await this.runCommand('javac', [srcPath], {
      cwd: tempDir,
      timeoutMs: 10000,
    });

    if (compileRes.exitCode !== 0) {
      return this.formatResult(compileRes, true);
    }

    // Execute step
    const execRes = await this.runCommand('java', ['-cp', tempDir, className], {
      cwd: tempDir,
      stdin,
      timeoutMs,
    });

    return this.formatResult(execRes);
  }
}
