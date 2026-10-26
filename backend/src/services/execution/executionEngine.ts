export type SupportedLanguage = 'c' | 'cpp' | 'python' | 'java' | 'javascript';

export interface ExecutionRequest {
  language: SupportedLanguage;
  code: string;
  stdin?: string;
  timeoutMs?: number;
}

export type ExecutionStatus =
  | 'success'
  | 'compilation_error'
  | 'runtime_error'
  | 'timeout'
  | 'memory_limit_exceeded'
  | 'error';

export interface ExecutionResult {
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTime: number; // in milliseconds
  memoryUsage: number; // in KB
  sandboxIsolated: boolean;
  sandboxType: 'docker_container' | 'development_only_adapter';
  warning?: string;
}

export interface IExecutionEngine {
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'c',
  'cpp',
  'python',
  'java',
  'javascript',
];

export const DEFAULT_TIMEOUT_MS = 5000;
export const MAX_TIMEOUT_MS = 10000;
export const MAX_OUTPUT_SIZE_BYTES = 64 * 1024; // 64 KB limit for stdout/stderr to prevent output bombs
