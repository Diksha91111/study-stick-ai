"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerSandboxAdapter = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const executionEngine_js_1 = require("./executionEngine.js");
class DockerSandboxAdapter {
    /**
     * Helper to check if Docker daemon is available and responsive on the system.
     */
    static isDockerAvailable() {
        try {
            (0, child_process_1.execSync)('docker info', { stdio: 'ignore', timeout: 3000 });
            return true;
        }
        catch {
            return false;
        }
    }
    async execute(request) {
        const timeoutMs = Math.min(Math.max(request.timeoutMs || executionEngine_js_1.DEFAULT_TIMEOUT_MS, 1000), executionEngine_js_1.MAX_TIMEOUT_MS);
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codelab-docker-'));
        try {
            switch (request.language) {
                case 'python':
                    return await this.runDocker('python:3.11-alpine', ['python', '/code/main.py'], request.code, 'main.py', request.stdin, timeoutMs, tempDir);
                case 'javascript':
                    return await this.runDocker('node:20-alpine', ['node', '/code/main.js'], request.code, 'main.js', request.stdin, timeoutMs, tempDir);
                case 'c':
                    return await this.runDockerCompiled('gcc:alpine', ['sh', '-c', 'gcc /code/main.c -o /tmp/main && /tmp/main'], request.code, 'main.c', request.stdin, timeoutMs, tempDir);
                case 'cpp':
                    return await this.runDockerCompiled('gcc:alpine', ['sh', '-c', 'g++ /code/main.cpp -o /tmp/main && /tmp/main'], request.code, 'main.cpp', request.stdin, timeoutMs, tempDir);
                case 'java':
                    let className = 'Main';
                    const classMatch = request.code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
                    if (classMatch)
                        className = classMatch[1];
                    return await this.runDockerCompiled('openjdk:17-alpine', ['sh', '-c', `javac /code/${className}.java -d /tmp && java -cp /tmp ${className}`], request.code, `${className}.java`, request.stdin, timeoutMs, tempDir);
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
        }
        finally {
            try {
                await fs.rm(tempDir, { recursive: true, force: true });
            }
            catch {
                // Ignore cleanup errors
            }
        }
    }
    async runDocker(image, commandArgs, code, fileName, stdin, timeoutMs, tempDir) {
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
    async runDockerCompiled(image, commandArgs, code, fileName, stdin, timeoutMs, tempDir) {
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
    spawnDockerProcess(dockerArgs, stdin, timeoutMs) {
        return new Promise((resolve) => {
            const startTime = process.hrtime.bigint();
            const child = (0, child_process_1.spawn)('docker', dockerArgs, {
                stdio: ['pipe', 'pipe', 'pipe'],
            });
            let stdout = '';
            let stderr = '';
            let timedOut = false;
            const timer = setTimeout(() => {
                timedOut = true;
                try {
                    child.kill('SIGKILL');
                }
                catch {
                    // Ignore kill errors
                }
            }, timeoutMs);
            if (stdin && child.stdin) {
                child.stdin.write(stdin);
                child.stdin.end();
            }
            else if (child.stdin) {
                child.stdin.end();
            }
            if (child.stdout) {
                child.stdout.on('data', (data) => {
                    if (stdout.length < executionEngine_js_1.MAX_OUTPUT_SIZE_BYTES) {
                        stdout += data.toString('utf-8');
                    }
                });
            }
            if (child.stderr) {
                child.stderr.on('data', (data) => {
                    if (stderr.length < executionEngine_js_1.MAX_OUTPUT_SIZE_BYTES) {
                        stderr += data.toString('utf-8');
                    }
                });
            }
            child.on('close', (code) => {
                clearTimeout(timer);
                const endTime = process.hrtime.bigint();
                const executionTime = Math.round(Number(endTime - startTime) / 1_000_000);
                let status = 'success';
                if (timedOut) {
                    status = 'timeout';
                    stderr += '\nExecution Timed Out (exceeded time limit)';
                }
                else if (stderr.includes('error:') || stderr.includes('javac') || stderr.includes('SyntaxError')) {
                    status = code !== 0 ? 'compilation_error' : 'runtime_error';
                }
                else if (code !== 0 && code !== null) {
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
exports.DockerSandboxAdapter = DockerSandboxAdapter;
