import * as vscode from 'vscode';
import { ExtensionSettings, ModelConfig, StorageConfig } from '../types';

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

  static getSettings(): ExtensionSettings {
    const _config = vscode.workspace.getConfiguration('aiPair');
    return {
      models: _config.get<ModelConfig[]>('models') || [],
      taskMappings: _config.get<Record<string, string>>('taskMappings') || {},
      storage: _config.get<StorageConfig>('storage') || {dbPath: '', retentionDays: 1}
    };
  }

  async updateSettings(settings: Partial<ExtensionSettings>) {
    const _config = vscode.workspace.getConfiguration('aiPair');
    
    if (settings.models) {
      await _config.update('models', settings.models, vscode.ConfigurationTarget.Global);
    }
    if (settings.taskMappings) {
      await _config.update('taskMappings', settings.taskMappings, vscode.ConfigurationTarget.Global);
    }
    if (settings.storage) {
      await _config.update('storageConfig', settings.storage, vscode.ConfigurationTarget.Global);
    }
    
    // Force refresh the workspace configuration
    vscode.workspace.getConfiguration('aiPair').get('models');
    vscode.workspace.getConfiguration('aiPair').get('taskMappings');
  }
}