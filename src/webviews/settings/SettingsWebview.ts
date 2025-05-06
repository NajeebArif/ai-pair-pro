import * as vscode from 'vscode';
import { SettingsProvider } from '../../providers/SettingsProvider';
import { getWebviewContent } from './settingsHtmlProvider';

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
        panel.webview.html = getWebviewContent(context);

        // Handle messages from webview
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'saveSettings':
                    try {
                        await SettingsProvider.getInstance().updateSettings(message.data);
                        panel.webview.html = getWebviewContent(context);
                        panel.webview.postMessage({
                            command: 'saveResult',
                            success: true,
                            message: 'Settings saved successfully!'
                        });
                    } catch (error) {
                        panel.webview.postMessage({
                            command: 'saveResult',
                            success: false,
                            message: `Failed to save settings: ${error}`
                        });
                    }
                    return;
            }
        });

        panel.onDidDispose(() => {
            this.currentPanel = undefined;
        });
    }

}