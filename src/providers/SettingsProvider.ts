import * as vscode from 'vscode';
import { ExtensionSettings, ModelConfig } from '../types';

export class SettingsProvider {
  private static instance: SettingsProvider;
  private config: vscode.WorkspaceConfiguration;

  private constructor() {
    this.config = vscode.workspace.getConfiguration('aiPair');
  }

  static getInstance(): SettingsProvider {
    if (!SettingsProvider.instance) {
      SettingsProvider.instance = new SettingsProvider();
    }
    return SettingsProvider.instance;
  }

  getSettings(): ExtensionSettings {
    return {
      models: this.config.get<ModelConfig[]>('models') || [],
      taskMappings: this.config.get<Record<string, string>>('taskMappings') || {}
    };
  }

  async updateSettings(settings: Partial<ExtensionSettings>) {
    if (settings.models) {
      await this.config.update('models', settings.models, vscode.ConfigurationTarget.Global);
    }
    if (settings.taskMappings) {
      await this.config.update('taskMappings', settings.taskMappings, vscode.ConfigurationTarget.Global);
    }
  }
}