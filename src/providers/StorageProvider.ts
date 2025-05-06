import * as vscode from 'vscode';
import * as fs from 'fs';
import Database from 'better-sqlite3';
import path from 'path';
import { AITask, ChatMessage, isChatMessage, StorageConfig } from '../types';

export class StorageProvider {
    private static instance: StorageProvider;
    private db: Database.Database;

    private constructor() {
        const config = this.getConfig();
        this.ensureDbPath(config.dbPath);
        this.db = new Database(config.dbPath);
        this.initializeSchema();
    }

    static getInstance(): StorageProvider {
        if (!StorageProvider.instance) {
            StorageProvider.instance = new StorageProvider();
        }
        return StorageProvider.instance;
    }

    private getConfig(): StorageConfig {
        const config = vscode.workspace.getConfiguration('aiPair').get<StorageConfig>('storage')!;
        return {
            dbPath: this.replaceVariables(config.dbPath),
            retentionDays: config.retentionDays
        };
    }

    private replaceVariables(path: string): string {
        return path.replace(/\${workspaceFolder}/g,
            vscode.workspace.workspaceFolders?.[0].uri.fsPath || '');
    }

    private ensureDbPath(dbPath: string): void {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private initializeSchema(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                role TEXT CHECK(role IN ('user', 'bot')) NOT NULL,
                timestamp INTEGER NOT NULL,
                modelId TEXT,
                task TEXT
            );
            
            CREATE INDEX IF NOT EXISTS idx_timestamp 
            ON messages(timestamp);
        `);
    }

    saveMessage(message: ChatMessage): void {
        const stmt = this.db.prepare(`
            INSERT INTO messages 
            (id, content, role, timestamp, modelId, task)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            message.id,
            message.content,
            message.role,
            message.timestamp,
            message.modelId,
            message.task
        );
    }

    getHistory(limit = 100): ChatMessage[] {
        const stmt = this.db.prepare(`
            SELECT * FROM messages 
            ORDER BY timestamp DESC
            LIMIT ?
        `);

        return stmt.all(limit)
        .map((row: any) => ({
            id: row.id,
            content: row.content,
            role: row.role as 'user' | 'bot',
            timestamp: Number(row.timestamp),
            modelId: row.modelId || undefined,
            task: row.task ? row.task as AITask : undefined
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
    }

    clearAllMessages(): void {
        this.db.prepare(`DELETE FROM messages`).run();
    }

    clearOldMessages(): void {
        const config = this.getConfig();
        const cutoff = Date.now() - (config.retentionDays * 86400000);

        this.db.prepare(`
            DELETE FROM messages 
            WHERE timestamp < ?
            `).run(cutoff);
    }
}