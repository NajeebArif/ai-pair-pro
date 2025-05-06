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
  };
  
  export type TaskMappingOverride = {
    task: AITask;
    modelId: string;
  };