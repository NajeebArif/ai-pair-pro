export enum AITask {
    CodeCompletion = 'codeCompletion',
    CodeReview = 'codeReview',
    GeneralQA = 'generalQA',
    CodeExplanation = 'codeExplanation',
    TestGeneration = 'testGeneration'
}

export type ModelConfig = {
    id: string;
    type: 'watsonx' | 'ollama';
    label: string;
    endpoint: string;
    apiKey?: string;
    modelName?: string;
};

export type ExtensionSettings = {
    models: ModelConfig[];
    taskMappings: Record<AITask, string>;
    storage: StorageConfig;
    monitoring: MonitoringConfig;
};

export type TaskMappingOverride = {
    task: AITask;
    modelId: string;
};

export interface StorageConfig {
    dbPath: string;
    retentionDays: number;
}

// LLM Types.
export interface LLMRequest {
    prompt: string;
    task?: AITask;
    overrideModelId?: string;
    options?: {
        temperature?: number;
        maxTokens?: number;
    };
}

export interface LLMResponse {
    success: boolean;
    content?: string;
    error?: string;
    modelUsed?: string;
    task?: AITask;
}

// Chat Message Type
export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'bot';
    timestamp: number;
    modelId?: string;
    task?: AITask;
}

export function isChatMessage(row: any): row is ChatMessage {
    return typeof row.id === 'string' &&
        typeof row.content === 'string' &&
        (row.role === 'user' || row.role === 'bot') &&
        typeof row.timestamp === 'number';
}

export interface MonitoringConfig {
    enabled: boolean;
    contextLines: number;
    tasks: AITask[];
    interval: number;
}

export interface CodeIssue {
    type: 'performance' | 'antipattern' | 'security';
    severity: 'high' | 'medium' | 'low';
    description: string;
    suggestion: string;
    lineRange: [number, number];
}