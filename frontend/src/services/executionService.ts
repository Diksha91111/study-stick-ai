import api from './api';

export type SupportedLanguage = 'python' | 'javascript' | 'c' | 'cpp' | 'java';

export interface ExecutionResponseData {
  status:
    | 'success'
    | 'compilation_error'
    | 'runtime_error'
    | 'timeout'
    | 'memory_limit_exceeded'
    | 'error';
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTime: number; // in milliseconds
  memoryUsage: number; // in KB
  sandboxIsolated: boolean;
  sandboxType: 'docker_container' | 'development_only_adapter';
  warning?: string;
}

export const runCode = async (
  language: SupportedLanguage,
  code: string,
  stdin?: string,
  timeoutMs?: number
): Promise<ExecutionResponseData> => {
  const response = await api.post('/execution/run', {
    language,
    code,
    stdin,
    timeoutMs,
  });
  return response.data.data;
};
