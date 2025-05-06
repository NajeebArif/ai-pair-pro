import * as vscode from 'vscode';
import * as fs from 'fs';
import { AITask } from '../../types';
import { LLMService } from '../../services/LLMService';

export class ChatWebview {
    private static currentPanel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;

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
        panel.webview.html = this.getWebviewContent(panel.webview);

        // Handle messages from webview
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'sendMessage':
                    try {
                        const response = await LLMService.getInstance().generateCompletion({
                            prompt: message.text,
                            task: AITask.GeneralQA
                        });

                        if (!response.success) {
                            throw new Error(response.error);
                        }

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
                    break;
            }
        });

        panel.onDidDispose(() => {
            ChatWebview.currentPanel = undefined;
        });
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

    // private getWebviewContent(webview: vscode.Webview): string {
    //     const styleUri = webview.asWebviewUri(
    //         vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webviews', 'chat', 'assets', 'chat.css')
    //     );
    //     const scriptUri = webview.asWebviewUri(
    //         vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webviews', 'chat', 'assets', 'chat.js')
    //     );

    //     return `
    //         <!DOCTYPE html>
    //         <html>
    //         <head>
    //             <meta charset="UTF-8">
    //             <title>AI Pair Chat</title>
    //             <link href="${styleUri}" rel="stylesheet">
    //             <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    //         </head>
    //         <body>
    //             <div class="chat-container">
    //                 <div class="chat-messages" id="messages"></div>
    //                 <div class="input-container">
    //                     <textarea id="input" placeholder="Type your message..."></textarea>
    //                     <button id="sendBtn">Send</button>
    //                 </div>
    //             </div>
    //             <script src="${scriptUri}"></script>
    //         </body>
    //         </html>
    //     `;
    // }
}