
import * as vscode from 'vscode';
import { SettingsWebview } from './webviews/settings/SettingsWebview';
import { SettingsProvider } from './providers/SettingsProvider';
import { ChatWebview } from './webviews/chat/ChatWebview';
import { StorageProvider } from './providers/StorageProvider';

export function activate(context: vscode.ExtensionContext) {
	const chatWebview = new ChatWebview(context);

	console.log('Congratulations, your extension "pair-programer" is now active!');

	const disposable = vscode.commands.registerCommand('pair-programer.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from pair-programer!');
	});
	context.subscriptions.push(disposable);

	const settingsPanelDisposable = vscode.commands.registerCommand('aiPair.openSettings', () => {
		SettingsWebview.show(context);
	  });
	context.subscriptions.push(settingsPanelDisposable);

	context.subscriptions.push(
        vscode.commands.registerCommand('aiPair.openChat', () => {
            chatWebview.show();
        })
    );

	// Register command to creat the chat history.
	context.subscriptions.push(
		vscode.commands.registerCommand('aiPair.clearChatHistory', async () => {
			const confirm = await vscode.window.showWarningMessage(
				'Are you sure you want to clear all chat history?', 
				{ modal: true }, 
				'Yes'
			);
			
			if (confirm === 'Yes') {
				StorageProvider.getInstance().clearAllMessages();
				ChatWebview.clearHistory();
				vscode.window.showInformationMessage('Chat history cleared');
			}
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
