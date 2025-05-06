import { SettingsProvider } from "../../providers/SettingsProvider";
import { AITask, ModelConfig } from "../../types";
import * as vscode from 'vscode';

export function getWebviewContent(context: vscode.ExtensionContext): string {
    const settings = SettingsProvider.getSettings();
    const tasks = Object.values(AITask);
    const models = settings.models;

    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Pair Settings</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/webview-ui-toolkit@1.3.0/dist/toolkit.min.css">
      <style>
          ${getStyles()}
      </style>
  </head>
  <body>
      <div class="container">
          <h1>🛠 AI Pair Programming Settings</h1>
          
          <div class="tabs">
              <button class="tab-button active" onclick="switchTab('models')">Models</button>
              <button class="tab-button" onclick="switchTab('tasks')">Task Mapping</button>
          </div>

          <div id="models-tab" class="tab-content">
              <section class="section">
                  <h2>Model Configurations</h2>
                  <div id="models-container">
                      ${models.map(renderModelForm).join('')}
                  </div>
              </section>
          </div>

          <div id="tasks-tab" class="tab-content" style="display:none;">
              <section class="section">
                  <h2>Task to Model Mapping</h2>
                  <div id="task-mapping-container">
                      ${tasks.map(task => renderTaskMapping(task, settings.taskMappings[task])).join('')}
                  </div>
              </section>
          </div>

          <div class="footer">
              <button class="primary" onclick="saveSettings()">💾 Save All Settings</button>
          </div>

          <div class="status-message" id="statusMessage"></div>
      </div>

      <script>
      const vscode = acquireVsCodeApi();
          function switchTab(tabName) {
              document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
              document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));
              document.getElementById(\`\${tabName}-tab\`).style.display = 'block';
              event.target.classList.add('active');
          }

          function showStatus(message, isError = false) {
              const statusEl = document.getElementById('statusMessage');
              statusEl.textContent = message;
              statusEl.style.display = 'block';
              statusEl.style.backgroundColor = isError ? 
                  'var(--vscode-errorForeground)' : 
                  'var(--vscode-statusBar-background)';
              
              setTimeout(() => {
                  statusEl.style.display = 'none';
              }, 3000);
          }

          async function saveSettings() {
              const saveBtn = document.querySelector('button.primary');
              saveBtn.disabled = true;
              saveBtn.innerHTML = '⏳ Saving...';
              const models = [];
              const taskMappings = {};
              
              try {
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
                  
                  showStatus('Settings saved successfully!');
              } catch (error) {
                  showStatus(\`Error: \${error.message}\`, true);
              } finally {
                  saveBtn.disabled = false;
                  saveBtn.innerHTML = '💾 Save All Settings';
              }
          }
      </script>
  </body>
  </html>
`;
}

export function getOldHtml(): string {
    const settings = SettingsProvider.getSettings();
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
              ${getStyles()}
          </style>
      </head>
      <body>
          <div class="container">
              <h1>AI Pair Programming Settings</h1>
              
              <section class="models-section">
                  <h2>Model Configurations</h2>
                  <div id="models-container">
                      ${models.map(renderModelForm).join('')}
                  </div>
              </section>

              <section class="task-mapping">
                  <h2>Task Mapping</h2>
                  <div id="task-mapping-container">
                      ${tasks.map(task => renderTaskMapping(task, settings.taskMappings[task])).join('')}
                  </div>
              </section>

              <button onclick="saveSettings()" type="submit">Save All Settings</button>
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

export function getStyles(): string {
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


export function renderModelForm(model: ModelConfig): string {
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

export function renderTaskMapping(task: AITask, currentModelId: string): string {
    const models = SettingsProvider.getSettings().models;
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