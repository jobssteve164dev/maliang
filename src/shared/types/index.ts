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
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

// 章节类型
export interface Chapter {
  id: string;
  projectId: string;
  title: string;
  content: string;
  summary: string;
  order: number;
  wordCount: number;
  status: 'draft' | 'writing' | 'completed';
  notes: string;
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
  arcDescription: string;
  importanceLevel: number; // 1-5
  avatarUrl?: string;
  tags: string[];
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
  isMutual: boolean;
  timelineStart?: string;
  timelineEnd?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 世界观设定类型
export interface WorldBuilding {
  id: string;
  projectId: string;
  category: 'geography' | 'history' | 'culture' | 'technology' | 'magic' | 'politics' | 'economy' | 'society' | 'religion' | 'other';
  title: string;
  description: string;
  details: Record<string, any>;
  parentId?: string;
  orderIndex: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 情节线类型
export interface PlotLine {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: 'main' | 'subplot' | 'character_arc';
  startChapterId?: string;
  endChapterId?: string;
  status: 'planning' | 'active' | 'completed' | 'abandoned';
  importanceLevel: number; // 1-5
  createdAt: Date;
  updatedAt: Date;
}

// 情节事件类型
export interface PlotEvent {
  id: string;
  plotLineId: string;
  chapterId?: string;
  title: string;
  description: string;
  eventType: 'scene' | 'conflict' | 'resolution' | 'twist' | 'climax';
  orderIndex: number;
  charactersInvolved: string[];
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

// 创作会话类型
export interface WritingSession {
  id: string;
  projectId: string;
  chapterId?: string;
  startTime: Date;
  endTime?: Date;
  wordsWritten: number;
  sessionType: 'writing' | 'editing' | 'planning' | 'research';
  notes: string;
  moodRating?: number; // 1-5
  productivityRating?: number; // 1-5
}

// 标签类型
export interface Tag {
  id: string;
  projectId: string;
  name: string;
  color: string;
  description: string;
  createdAt: Date;
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
