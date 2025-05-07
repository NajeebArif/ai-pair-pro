import { LangChainProvider } from '../providers/LangChainProvider';
import { AITask, LLMRequest, LLMResponse } from '../types';
import { RouterService } from "./RouterService";

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
    try {
      const result = await this.llmProvider.generate(
        request.prompt,
        request.task || AITask.GeneralQA,
        request.overrideModelId,
        request.options
      );
      return {
        success: true,
        content: result,
        modelUsed: request.overrideModelId
      };
    } catch (error) {
      return {
        success: false,
        error: error + ""
      };
    }
  }

  async generateCompletionV2(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Auto-detect task if not specified
      const task = request.task || RouterService.determineTask(request.prompt);
      const llmProvider = LangChainProvider.getInstance();
      const modelId = request.overrideModelId || 
          llmProvider.getModelIdForTask(task);
      
      const result = await this.llmProvider.generate(
        request.prompt,
        task,
        request.overrideModelId,
        request.options
      );
      
      return {
        success: true,
        content: result,
        task,
        modelUsed: modelId
      };
    } catch (error) {
      return {
        success: false,
        error: error + ""
      };
    }
  }
}