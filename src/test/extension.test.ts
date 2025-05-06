import * as assert from 'assert';

import * as vscode from 'vscode';
import { SettingsProvider } from '../settingsProvider';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Configuration Test', async () => {
    const initialSettings = SettingsProvider.getSettings();
    assert.strictEqual(initialSettings.models.length, 3);
    
    const newModels = [...initialSettings.models];
    newModels[0].label = "Updated Label";
    await SettingsProvider.updateModelConfig(newModels);
    
    const updatedSettings = SettingsProvider.getSettings();
    assert.strictEqual(updatedSettings.models[0].label, "Updated Label");
  });
});
