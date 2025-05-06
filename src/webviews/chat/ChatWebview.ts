import * as vscode from 'vscode';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { AITask, ChatMessage } from '../../types';
import { LLMService } from '../../services/LLMService';
import { StorageProvider } from '../../providers/StorageProvider';

export class ChatWebview {
    private static currentPanel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;
    private history: ChatMessage[] = [];

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    show() {
        if (ChatWebview.currentPanel) {
            ChatWebview.currentPanel.reveal();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'aiPairChat',
            'AI Pair Chat',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.context.extensionUri, 'src/webviews/chat/assets')
                ]
            }
        );
        ChatWebview.currentPanel = panel;

        this.history = StorageProvider.getInstance().getHistory();

        panel.webview.html = this.getWebviewContent(panel.webview);

        panel.webview.postMessage({
            command: 'loadHistory',
            history: this.history
        });

        // Handle messages from webview
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'sendMessage':
                    await this.handleSendMessage(message, panel);
                    break;
                case 'clearHistory':
                    await this.handleClearHistory(panel);
                    break;
            }
        });

        panel.onDidDispose(() => {
            ChatWebview.currentPanel = undefined;
        });
    }

    private async handleClearHistory(panel: vscode.WebviewPanel) {
        console.log("TRYING TO CLEAR THE HISTORY!!.")
        const confirm = await vscode.window.showWarningMessage(
            'Are you sure you want to clear all chat history?',
            { modal: true },
            'Yes'
        );

        if (confirm === 'Yes') {
            StorageProvider.getInstance().clearAllMessages();
            panel.webview.postMessage({ command: 'historyCleared' });
            vscode.window.showInformationMessage('Chat history cleared');
        }
    }

    private async handleSendMessage(message: any, panel: vscode.WebviewPanel) {
        try {
            const userMessage: ChatMessage = {
                id: uuidv4(),
                content: message.text,
                role: 'user',
                timestamp: Date.now()
            };

            // Save user message
            StorageProvider.getInstance().saveMessage(userMessage);
            this.history.unshift(userMessage);

            const request = {
                prompt: message.text,
                task: AITask.GeneralQA
            };

            const response = await LLMService.getInstance().generateCompletion(request);

            // Process response...
            const botMessage: ChatMessage = {
                id: uuidv4(),
                content: response.content + '',
                role: 'bot',
                timestamp: Date.now(),
                modelId: response.modelUsed,
                task: request.task
            };

            // Save bot message
            StorageProvider.getInstance().saveMessage(botMessage);
            this.history.unshift(botMessage);

            panel.webview.postMessage({
                command: 'receiveMessage',
                content: response.success ? response.content : `Error: ${response.error}`,
                isBot: true,
                error: false
            });
        } catch (err) {
            panel.webview.postMessage({
                command: 'receiveMessage',
                content: `Error: ${err}`,
                isBot: true,
                error: true
            });
        }
    }

    static clearHistory() {
        if (this.currentPanel) {
            this.currentPanel.webview.postMessage({
                command: 'historyCleared'
            });
        }
    }


    private getWebviewContent(webview: vscode.Webview): string {
        const cssUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webviews', 'chat', 'assets', 'chat.css')
        );

        const jsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webviews', 'chat', 'assets', 'chat.js')
        );

        // Get HTML template
        const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webviews', 'chat', 'chat.html');
        let html = fs.readFileSync(htmlPath.fsPath, 'utf8');

        // Replace placeholders
        return html
            .replace('{{cssUri}}', cssUri.toString())
            .replace('{{jsUri}}', jsUri.toString());
    }
}