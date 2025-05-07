import * as vscode from 'vscode';
import { LLMService } from './LLMService';
import { AITask } from '../types';
import { SettingsProvider } from '../providers/SettingsProvider';
import { CodeAnalysisWebview } from '../webviews/analysis/CodeAnalysisWebview';

export class CodeMonitorService {
  private static instance: CodeMonitorService;
  private disposable: vscode.Disposable;
  private timer: NodeJS.Timeout | null = null;
  private lastPosition: vscode.Position | null = null;

  private constructor() {
    this.disposable = vscode.window.onDidChangeTextEditorSelection(this.handleSelectionChange.bind(this));
  }

  static init(context: vscode.ExtensionContext): CodeMonitorService {
    if (!CodeMonitorService.instance) {
      CodeMonitorService.instance = new CodeMonitorService();
      context.subscriptions.push(CodeMonitorService.instance);
    }
    return CodeMonitorService.instance;
  }

  private async handleSelectionChange(event: vscode.TextEditorSelectionChangeEvent) {
    const config = SettingsProvider.getMonitoringConfig();
    if (!config.enabled) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor || event.textEditor !== editor) return;

    const position = editor.selection.active;
    if (this.lastPosition?.isEqual(position)) return;

    this.lastPosition = position;
    this.debouncedAnalyzeCode(config.interval)();
  }

  private debouncedAnalyzeCode = (waitNum: number) => this.debounce(() => {
    this.analyzeCurrentContext();
  }, waitNum);

  private async analyzeCurrentContext() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const config = SettingsProvider.getMonitoringConfig();
    const document = editor.document;
    const position = editor.selection.active;

    const startLine = Math.max(0, position.line - config.contextLines);
    const endLine = Math.min(document.lineCount, position.line + config.contextLines);
    
    const contextCode = document.getText(
      new vscode.Range(startLine, 0, endLine, 0)
    );

    try {
      const response = await LLMService.getInstance().generateCompletion({
        prompt: `Analyze this code for anti-patterns, bad practices, and performance issues:\n\n${contextCode}`,
        task: AITask.CodeReview,
        options: {
          temperature: 0.2,
          maxTokens: 500
        }
      });

      if (response.success && response.content) {
        this.showCodeAnalysis(response.content);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Code analysis failed: ${error}`);
    }
  }

  private showCodeAnalysis(analysis: string) {
    // Implement webview panel for rich display
    CodeAnalysisWebview.show(analysis);
  }

  private debounce(func: () => void, wait: number) {
    let timeout: NodeJS.Timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(func, wait);
    };
  }

  dispose() {
    this.disposable.dispose();
    if (this.timer) clearTimeout(this.timer);
  }
}