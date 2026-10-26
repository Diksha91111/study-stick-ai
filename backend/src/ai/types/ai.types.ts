export type AIProviderName = 'openai' | 'gemini' | 'anthropic';

export type AICodeAction =
  | 'explain'
  | 'teach'
  | 'hint'
  | 'debug'
  | 'interview'
  | 'exam';

export type AITaskType =
  | 'chat'
  | 'streamingChat'
  | 'codeGeneration'
  | 'codeExplanation'
  | 'reasoning'
  | 'summarization'
  | 'codeFix'
  | 'codeRefactor'
  | 'codeOptimize'
  | 'codeTestGen'
  | 'codeConvert'
  | 'codeReview'
  | 'codeComments'
  | 'codeDebug';

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
  preferredProvider?: AIProviderName;
}

export interface AICodeAssistantResponseData {
  action: AICodeAction;
  explanation: string;
  proposedCode?: string;
  hasCodeChanges: boolean;
  language: string;
  provider: AIProviderName;
  model: string;
  conversationId: string;
}

export type AIMessageRole = 'system' | 'user' | 'assistant';

export interface AIMessage {
  role: AIMessageRole;
  content: string;
  name?: string;
}

export interface AICompletionRequest {
  message?: string;
  messages?: AIMessage[];
  taskType?: AITaskType;
  tutorMode?: 'learn' | 'explain' | 'practice' | 'quiz' | 'exam' | 'coach';
  conversationId?: string;
  studentId?: string;
  preferredProvider?: AIProviderName;
  resourceIds?: string[];
  inlineImages?: Array<{ mimeType: string; data: string; filename: string }>;
  options?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    systemInstruction?: string;
    resourceContext?: string;
  };
}

export interface AICompletionResponse {
  text: string;
  provider: AIProviderName;
  model: string;
  conversationId?: string;
  taskType?: AITaskType;
  sources?: Array<{ resourceId: string; filename: string; page?: number; slide?: number; time?: string }>;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: string;
}

export interface AIStreamChunk {
  textChunk: string;
  provider: AIProviderName;
  model: string;
  done: boolean;
  sources?: Array<{
    filename: string;
    pageNumber?: number;
    slideNumber?: number;
    timestamp?: string;
    sectionTitle?: string;
  }>;
}

export interface IAIProvider {
  name: AIProviderName;
  isConfigured(): boolean;
  getDefaultModel(taskType?: AITaskType): string;
  generateResponse(request: AICompletionRequest): Promise<AICompletionResponse>;
  generateStream(
    request: AICompletionRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void>;
}

export interface StudentContext {
  studentId: string;
  name?: string;
  email?: string;
  collegeName?: string;
  degree?: string;
  branch?: string;
  currentSemester?: number;
  targetCompetitiveExams?: Array<{ examName: string; targetYear?: number }>;
  enrolledSubjects?: Array<{ name: string; code: string; progress: number }>;
  pendingTasks?: Array<{ title: string; priority: string; dueDate?: Date }>;
  upcomingExams?: Array<{ title: string; examDate: Date }>;
}

export interface AIToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (userId: string, params: Record<string, any>) => Promise<any>;
}

export interface AIToolResult {
  toolName: string;
  success: boolean;
  result?: any;
  error?: string;
}
