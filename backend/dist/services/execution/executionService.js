"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executionService = exports.ExecutionService = void 0;
const executionEngine_js_1 = require("./executionEngine.js");
const developmentAdapter_js_1 = require("./developmentAdapter.js");
const dockerAdapter_js_1 = require("./dockerAdapter.js");
const MAX_CONCURRENT_EXECUTIONS = 5;
class ExecutionService {
    devAdapter;
    dockerAdapter;
    activeExecutions = 0;
    constructor() {
        this.devAdapter = new developmentAdapter_js_1.DevelopmentSandboxAdapter();
        this.dockerAdapter = new dockerAdapter_js_1.DockerSandboxAdapter();
    }
    /**
     * Main entry point for executing untrusted code.
     */
    async execute(request) {
        // 1. Input Validation
        if (!request.language || !executionEngine_js_1.SUPPORTED_LANGUAGES.includes(request.language)) {
            return {
                status: 'error',
                stdout: '',
                stderr: `Invalid or unsupported language: '${request.language}'. Supported languages: ${executionEngine_js_1.SUPPORTED_LANGUAGES.join(', ')}`,
                exitCode: 400,
                executionTime: 0,
                memoryUsage: 0,
                sandboxIsolated: false,
                sandboxType: 'development_only_adapter',
            };
        }
        if (!request.code || request.code.trim() === '') {
            return {
                status: 'error',
                stdout: '',
                stderr: 'Execution rejected: Provided code snippet is empty.',
                exitCode: 400,
                executionTime: 0,
                memoryUsage: 0,
                sandboxIsolated: false,
                sandboxType: 'development_only_adapter',
            };
        }
        // 2. Concurrency Limit Check
        if (this.activeExecutions >= MAX_CONCURRENT_EXECUTIONS) {
            return {
                status: 'error',
                stdout: '',
                stderr: `Server busy: Reached maximum concurrent code executions (${MAX_CONCURRENT_EXECUTIONS}). Please try again shortly.`,
                exitCode: 429,
                executionTime: 0,
                memoryUsage: 0,
                sandboxIsolated: false,
                sandboxType: 'development_only_adapter',
            };
        }
        // 3. Select Adapter with Production Fail-Closed Policy
        const adapterResult = this.selectAdapter();
        if ('errorResult' in adapterResult) {
            return adapterResult.errorResult;
        }
        const engine = adapterResult.engine;
        // 4. Track Execution Concurrency & Run
        this.activeExecutions++;
        try {
            return await engine.execute(request);
        }
        finally {
            this.activeExecutions--;
        }
    }
    selectAdapter() {
        const isProduction = process.env.NODE_ENV === 'production';
        const forcedMode = process.env.EXECUTION_SANDBOX_MODE;
        const isDockerAvailable = dockerAdapter_js_1.DockerSandboxAdapter.isDockerAvailable();
        if (forcedMode === 'docker') {
            if (!isDockerAvailable) {
                return {
                    errorResult: {
                        status: 'error',
                        stdout: '',
                        stderr: 'Execution Rejected: EXECUTION_SANDBOX_MODE is set to "docker", but Docker daemon is unavailable or not running.',
                        exitCode: 503,
                        executionTime: 0,
                        memoryUsage: 0,
                        sandboxIsolated: true,
                        sandboxType: 'docker_container',
                    },
                };
            }
            return { engine: this.dockerAdapter };
        }
        if (forcedMode === 'development') {
            if (isProduction) {
                return {
                    errorResult: {
                        status: 'error',
                        stdout: '',
                        stderr: 'Security Error: Development Sandbox Adapter cannot be forced in production environment.',
                        exitCode: 403,
                        executionTime: 0,
                        memoryUsage: 0,
                        sandboxIsolated: false,
                        sandboxType: 'development_only_adapter',
                    },
                };
            }
            return { engine: this.devAdapter };
        }
        // Default Behavior:
        // If Docker is available, use Docker Sandbox Adapter
        if (isDockerAvailable) {
            return { engine: this.dockerAdapter };
        }
        // Strict Production Fail-Closed Rule:
        // In production, NEVER fall back to Development Sandbox Adapter
        if (isProduction) {
            return {
                errorResult: {
                    status: 'error',
                    stdout: '',
                    stderr: 'Production Security Error: Container sandbox isolation (Docker) is required for code execution in production mode, but Docker is unavailable.',
                    exitCode: 503,
                    executionTime: 0,
                    memoryUsage: 0,
                    sandboxIsolated: true,
                    sandboxType: 'docker_container',
                },
            };
        }
        // In local development / test mode only, fall back to Development Sandbox Adapter with transparent labeling
        return { engine: this.devAdapter };
    }
}
exports.ExecutionService = ExecutionService;
exports.executionService = new ExecutionService();
