import { LangChainProvider } from '../providers/LangChainProvider';
import { AITask, LLMRequest, LLMResponse } from '../types';

export class LLMService {
  private static instance: LLMService;
  private llmProvider = LangChainProvider.getInstance();

  private constructor() {}

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    console.log('LLM Request:', request);
    try {
      const result = await this.llmProvider.generate(
        request.prompt,
        request.task,
        request.overrideModelId,
        request.options
      );
      console.log('LLM Response:', result);
      return {
        success: true,
        content: result,
        modelUsed: request.overrideModelId
      };
    } catch (error) {
      console.error('LLM Error:', error);
      return {
        success: false,
        error: error + ""
      };
    }
  }
}