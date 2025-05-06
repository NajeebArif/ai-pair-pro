import * as vscode from 'vscode';
import { ExtensionSettings, ModelConfig, AITask } from '../../types';
import { SettingsProvider } from '../../providers/SettingsProvider';

export class SettingsWebview {
  private static currentPanel: vscode.WebviewPanel | undefined;

  static show(context: vscode.ExtensionContext) {
    if (this.currentPanel) {
      this.currentPanel.reveal();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'aiPairSettings',
      'AI Pair Settings',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    this.currentPanel = panel;
    panel.webview.html = this.getWebviewContent(context);

    // Handle messages from webview
    panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'saveSettings':
          await SettingsProvider.getInstance().updateSettings(message.data);
          vscode.window.showInformationMessage('Settings saved successfully!');
          return;
      }
    });

    panel.onDidDispose(() => {
      this.currentPanel = undefined;
    });
  }

  private static getWebviewContent(context: vscode.ExtensionContext): string {
    const settings = SettingsProvider.getInstance().getSettings();
    const tasks = Object.values(AITask);
    const models = settings.models;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AI Pair Settings</title>
          <style>
              ${this.getStyles()}
          </style>
      </head>
      <body>
          <div class="container">
              <h1>AI Pair Programming Settings</h1>
              
              <section class="models-section">
                  <h2>Model Configurations</h2>
                  <div id="models-container">
                      ${models.map(this.renderModelForm).join('')}
                  </div>
              </section>

              <section class="task-mapping">
                  <h2>Task Mapping</h2>
                  <div id="task-mapping-container">
                      ${tasks.map(task => this.renderTaskMapping(task, settings.taskMappings[task])).join('')}
                  </div>
              </section>

              <button onclick="saveSettings()">Save All Settings</button>
          </div>

          <script>
              function saveSettings() {
                  const models = [];
                  const taskMappings = {};

                  // Collect model data
                  document.querySelectorAll('.model-form').forEach(form => {
                      models.push({
                          id: form.dataset.modelId,
                          type: form.querySelector('[name="type"]').value,
                          label: form.querySelector('[name="label"]').value,
                          endpoint: form.querySelector('[name="endpoint"]').value,
                          apiKey: form.querySelector('[name="apiKey"]')?.value || '',
                          modelName: form.querySelector('[name="modelName"]')?.value || ''
                      });
                  });

                  // Collect task mappings
                  document.querySelectorAll('.task-mapping-item').forEach(item => {
                      const task = item.dataset.task;
                      const modelId = item.querySelector('select').value;
                      taskMappings[task] = modelId;
                  });

                  vscode.postMessage({
                      command: 'saveSettings',
                      data: {
                          models: models,
                          taskMappings: taskMappings
                      }
                  });
              }
          </script>
      </body>
      </html>
    `;
  }

  private static renderModelForm(model: ModelConfig): string {
    return `
      <div class="model-form" data-model-id="${model.id}">
          <h3>${model.label}</h3>
          <div class="form-group">
              <label>Type:</label>
              <select name="type" ${model.id === 'wca' ? 'disabled' : ''}>
                  <option value="watsonx" ${model.type === 'watsonx' ? 'selected' : ''}>Watsonx</option>
                  <option value="ollama" ${model.type === 'ollama' ? 'selected' : ''}>Ollama</option>
              </select>
          </div>
          <div class="form-group">
              <label>Label:</label>
              <input type="text" name="label" value="${model.label}">
          </div>
          <div class="form-group">
              <label>Endpoint:</label>
              <input type="text" name="endpoint" value="${model.endpoint}">
          </div>
          ${model.type === 'watsonx' ? `
              <div class="form-group">
                  <label>API Key:</label>
                  <input type="password" name="apiKey" value="${model.apiKey || ''}">
              </div>
          ` : `
              <div class="form-group">
                  <label>Model Name:</label>
                  <input type="text" name="modelName" value="${model.modelName || ''}">
              </div>
          `}
      </div>
    `;
  }

  private static renderTaskMapping(task: AITask, currentModelId: string): string {
    const models = SettingsProvider.getInstance().getSettings().models;
    return `
      <div class="task-mapping-item" data-task="${task}">
          <label>${task}:</label>
          <select>
              ${models.map(model => `
                  <option value="${model.id}" ${model.id === currentModelId ? 'selected' : ''}>
                      ${model.label}
                  </option>
              `).join('')}
          </select>
      </div>
    `;
  }

  private static getStyles(): string {
    return `
      body { padding: 20px; font-family: Arial, sans-serif; }
      .container { max-width: 800px; margin: 0 auto; }
      .models-section, .task-mapping { margin-bottom: 30px; }
      .model-form { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; }
      .form-group { margin-bottom: 10px; }
      label { display: inline-block; width: 100px; }
      input, select { width: 300px; padding: 5px; }
      button { padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; }
      button:hover { background: #0062a3; }
    `;
  }
}