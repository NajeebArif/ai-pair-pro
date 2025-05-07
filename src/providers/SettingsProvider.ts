import * as vscode from 'vscode';
import { AITask, ExtensionSettings, ModelConfig, MonitoringConfig, StorageConfig } from '../types';

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
      storage: _config.get<StorageConfig>('storage') || {dbPath: '', retentionDays: 1},
      monitoring: _config.get<MonitoringConfig>('monitoring') || {enabled: false, contextLines: 20, tasks: [AITask.CodeReview], interval: 2000}
    };
  }

  static getMonitoringConfig(): MonitoringConfig {
    return this.getSettings().monitoring;
  }
  
  static async updateMonitoringConfig(config: Partial<MonitoringConfig>) {
    const _config = vscode.workspace.getConfiguration('aiPair');
    await _config.update('monitoring', 
      { ...SettingsProvider.getMonitoringConfig(), ..._config },
      vscode.ConfigurationTarget.Global
    );
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
      await _config.update('storage', settings.storage, vscode.ConfigurationTarget.Global);
    }
    if (settings.monitoring) {
      await _config.update('monitoring', settings.monitoring, vscode.ConfigurationTarget.Global);
    }
    
    // Force refresh the workspace configuration
    vscode.workspace.getConfiguration('aiPair').get('models');
    vscode.workspace.getConfiguration('aiPair').get('taskMappings');
    vscode.workspace.getConfiguration('aiPair').get('storage');
    vscode.workspace.getConfiguration('aiPair').get('monitoring');
  }
}