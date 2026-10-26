import api from './api';

export type AICodeAction =
  | 'explain'
  | 'teach'
  | 'hint'
  | 'debug'
  | 'interview'
  | 'exam'
  | 'fix'
  | 'generate'
  | 'refactor'
  | 'optimize'
  | 'generateTests'
  | 'convertLanguage'
  | 'addComments'
  | 'codeReview';

export interface AICodeAssistantRequestPayload {
  action: AICodeAction;
  language: string;
  code?: string;
  selectedCode?: string;
  userPrompt?: string;
  targetLanguage?: string;
  errorContext?: {
    stderr?: string;
    stdout?: string;
    exitCode?: number | null;
  };
  conversationId?: string;
  preferredProvider?: string;
}

export interface AICodeAssistantResponseData {
  action: AICodeAction;
  explanation: string;
  proposedCode?: string;
  hasCodeChanges: boolean;
  language: string;
  provider: string;
  model: string;
  conversationId: string;
}

export const codeAssistantService = {
  requestAssistantAction: async (
    payload: AICodeAssistantRequestPayload,
    signal?: AbortSignal
  ): Promise<AICodeAssistantResponseData> => {
    const response = await api.post('/ai/code-assistant', payload, { signal });
    return response.data.data;
  },
};
