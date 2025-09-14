/**
 * 共享类型定义
 */

// 项目相关类型
export interface NovelProject {
  id: string;
  title: string;
  description?: string;
  genre: string;
  targetAudience: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'planning' | 'writing' | 'editing' | 'completed';
  wordCount: number;
  chapterCount: number;
}

// 章节类型
export interface Chapter {
  id: string;
  projectId: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  status: 'draft' | 'writing' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

// 角色类型
export interface Character {
  id: string;
  projectId: string;
  name: string;
  description: string;
  age?: number;
  gender?: string;
  occupation?: string;
  personality: string[];
  appearance: string;
  background: string;
  goals: string;
  conflicts: string;
  relationships: CharacterRelationship[];
  createdAt: Date;
  updatedAt: Date;
}

// 角色关系类型
export interface CharacterRelationship {
  id: string;
  fromCharacterId: string;
  toCharacterId: string;
  relationshipType: string;
  description: string;
  strength: number; // 1-10
}

// 世界观设定类型
export interface WorldBuilding {
  id: string;
  projectId: string;
  category: 'geography' | 'history' | 'culture' | 'technology' | 'magic' | 'politics' | 'economy';
  title: string;
  description: string;
  details: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// AI模型配置类型
export interface AIModelConfig {
  provider: 'openai' | 'deepseek' | 'openrouter' | 'ollama';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
}

// AI智能体类型
export interface AIAgent {
  id: string;
  name: string;
  type: 'theme' | 'outline' | 'world' | 'character' | 'relationship' | 'dialogue' | 'plot';
  description: string;
  systemPrompt: string;
  modelConfig: AIModelConfig;
  enabled: boolean;
}

// AI对话记录类型
export interface AIConversation {
  id: string;
  projectId: string;
  agentId: string;
  messages: AIMessage[];
  context: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// AI消息类型
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// 应用配置类型
export interface AppConfig {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  autoSave: boolean;
  autoSaveInterval: number; // 秒
  aiModels: AIModelConfig[];
  agents: AIAgent[];
  recentProjects: string[];
}

// API响应类型
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
