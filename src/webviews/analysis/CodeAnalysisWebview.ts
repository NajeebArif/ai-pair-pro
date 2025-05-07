import * as vscode from 'vscode';
import { SettingsProvider } from '../../providers/SettingsProvider';

export class CodeAnalysisWebview {
  private static panel: vscode.WebviewPanel | undefined;

  static show(content: string) {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        'codeAnalysis',
        'AI Code Analysis',
        vscode.ViewColumn.Beside,
        { enableScripts: true }
      );
      
      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });
    }

    this.panel.webview.html = this.getWebviewContent(content);
    this.panel.reveal();
  }

  private static getWebviewContent(analysis: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { padding: 20px; font-family: var(--vscode-font-family); }
              .issue { margin: 10px 0; padding: 10px; border-left: 3px solid var(--vscode-inputValidation-warningBorder); }
              .severity-high { border-color: var(--vscode-inputValidation-errorBorder); }
              .severity-low { border-color: var(--vscode-inputValidation-infoBorder); }
              .suggestion { margin-top: 5px; font-style: italic; }
              code { background: var(--vscode-textCodeBlock-background); padding: 2px 4px; }
          </style>
      </head>
      <body>
          <h2>Code Analysis Results</h2>
          ${this.parseAnalysis(analysis)}
      </body>
      </html>
    `;
  }

  private static parseAnalysis(analysis: string): string {
    // Implement parsing logic based on your LLM's response format
    return analysis.replace(/\n/g, '<br>');
  }
}