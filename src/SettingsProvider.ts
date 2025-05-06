import * as vscode from 'vscode';
import { ExtensionSettings, ModelConfig } from './types';

export class SettingsProvider {
  static getSettings(): ExtensionSettings {
    const config = vscode.workspace.getConfiguration('aiPair');
    return {
      models: config.get<ModelConfig[]>('models') || [],
      taskMappings: config.get<Record<string, string>>('taskMappings') || {}
    };
  }

  static async updateModelConfig(updatedModels: ModelConfig[]) {
    await vscode.workspace.getConfiguration('aiPair').update(
      'models',
      updatedModels,
      vscode.ConfigurationTarget.Global
    );
  }

  static async updateTaskMappings(mappings: Record<string, string>) {
    await vscode.workspace.getConfiguration('aiPair').update(
      'taskMappings',
      mappings,
      vscode.ConfigurationTarget.Global
    );
  }
}