
import * as vscode from 'vscode';
import { SettingsWebview } from './webviews/settings/SettingsWebview';
import { SettingsProvider } from './providers/SettingsProvider';
import { ChatWebview } from './webviews/chat/ChatWebview';

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
}

// This method is called when your extension is deactivated
export function deactivate() {}
