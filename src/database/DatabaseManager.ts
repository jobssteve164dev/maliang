import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';
import { NovelProject, Chapter, Character, WorldBuilding, AIConversation } from '@shared/types';

export class DatabaseManager {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'novel-ai-assistant.db');
  }

  async initialize(): Promise<void> {
    try {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      
      await this.createTables();
      console.log('Database initialized at:', this.dbPath);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // 项目表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        genre TEXT NOT NULL,
        target_audience TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'planning',
        word_count INTEGER DEFAULT 0,
        chapter_count INTEGER DEFAULT 0
      )
    `);

    // 章节表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chapters (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        order_index INTEGER NOT NULL,
        word_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // 角色表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        age INTEGER,
        gender TEXT,
        occupation TEXT,
        personality TEXT DEFAULT '[]',
        appearance TEXT DEFAULT '',
        background TEXT DEFAULT '',
        goals TEXT DEFAULT '',
        conflicts TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // 角色关系表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS character_relationships (
        id TEXT PRIMARY KEY,
        from_character_id TEXT NOT NULL,
        to_character_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL,
        description TEXT DEFAULT '',
        strength INTEGER DEFAULT 5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_character_id) REFERENCES characters(id) ON DELETE CASCADE,
        FOREIGN KEY (to_character_id) REFERENCES characters(id) ON DELETE CASCADE
      )
    `);

    // 世界观设定表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS world_building (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        details TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // AI对话记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_conversations (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        messages TEXT DEFAULT '[]',
        context TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_chapters_project_id ON chapters(project_id);
      CREATE INDEX IF NOT EXISTS idx_characters_project_id ON characters(project_id);
      CREATE INDEX IF NOT EXISTS idx_world_building_project_id ON world_building(project_id);
      CREATE INDEX IF NOT EXISTS idx_ai_conversations_project_id ON ai_conversations(project_id);
    `);
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const stmt = this.db.prepare(sql);
      return stmt.all(params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async run(sql: string, params: any[] = []): Promise<Database.RunResult> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const stmt = this.db.prepare(sql);
      return stmt.run(params);
    } catch (error) {
      console.error('Database run error:', error);
      throw error;
    }
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const stmt = this.db.prepare(sql);
      return stmt.get(params);
    } catch (error) {
      console.error('Database get error:', error);
      throw error;
    }
  }

  async transaction<T>(callback: () => T): Promise<T> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(callback);
    return transaction();
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
