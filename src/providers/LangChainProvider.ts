import { SettingsProvider } from "./SettingsProvider";
import { AITask, ModelConfig } from "../types";
import { Ollama } from "@langchain/ollama";
import { WatsonxAI } from "@langchain/community/llms/watsonx_ai";

export class LangChainProvider {
    private static instance: LangChainProvider;
    private models: Map<string, any> = new Map();

    private constructor() {
        this.initializeModels();
    }

    private validateModelConfig(model: ModelConfig) {
        if (!model.endpoint) {
            throw new Error(`Endpoint required for model ${model.id}`);
        }

        if (model.type === 'watsonx' && !model.apiKey) {
            throw new Error(`API key required for Watsonx model ${model.id}`);
        }

        if (model.type === 'ollama' && !model.modelName) {
            throw new Error(`Model name required for Ollama model ${model.id}`);
        }
    }

    static getInstance(): LangChainProvider {
        if (!LangChainProvider.instance) {
            LangChainProvider.instance = new LangChainProvider();
        }
        return LangChainProvider.instance;
    }

    private initializeModels() {
        const settings = SettingsProvider.getSettings();

        settings.models.forEach(model => {
            // this.validateModelConfig(model);
            switch (model.type) {
                case 'watsonx':
                    this.instantiateWatsonxModel(model);
                    break;

                case 'ollama':
                    this.instantiateOllamaModel(model);
                    break;
            }
        });
    }

    private instantiateOllamaModel(model: ModelConfig) {
        try {
            this.models.set(model.id, new Ollama({
                baseUrl: model.endpoint,
                model: model.modelName || 'llama2',
                temperature: 0.7
            }));
        } catch (error) {
            console.log(`Error while instantiating Ollama Model: ${error}`);
        }
    }

    private instantiateWatsonxModel(model: ModelConfig) {
        try {
            this.models.set(model.id, new WatsonxAI({
                modelId: model.modelName || 'google/flan-ul2',
                ibmCloudApiKey: model.apiKey || '',
                endpoint: model.endpoint,
                projectId: 'default',
            }));
        } catch (error) {
            console.log(`Error while instantiating Watsonx: ${error}`);
        }
        
    }

    getLLMForModel(modelId: string) {
        const llm = this.models.get(modelId);
        if (!llm) {
            throw new Error(`Model ${modelId} not configured`);
        }
        return llm;
    }

    async getLLMForTask(task: AITask, overrideModelId?: string) {
        const settings = SettingsProvider.getSettings();
        const modelId = overrideModelId || settings.taskMappings[task];

        if (!modelId) {
            throw new Error(`No model configured for task ${task}`);
        }

        return this.getLLMForModel(modelId);
    }

    async generate(
        prompt: string,
        task: AITask,
        overrideModelId?: string,
        options?: Record<string, any>
    ): Promise<string> {
        const llm = await this.getLLMForTask(task, overrideModelId);
        return llm.invoke(prompt, options);
    }
}