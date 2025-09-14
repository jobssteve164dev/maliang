/**
 * AI Provider 统一接口
 * 支持多种AI模型提供商的统一调用
 */

import { AIModelConfig, AIMessage } from '@shared/types';

// AI请求参数
export interface AIRequest {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  context?: Record<string, any>;
}

// AI响应结果
export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'function_call';
  metadata?: Record<string, any>;
}

// AI Provider错误类型
export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

// AI Provider基础接口
export abstract class AIProvider {
  protected config: AIModelConfig;

  constructor(config: AIModelConfig) {
    this.config = config;
  }

  // 抽象方法：发送请求
  abstract sendRequest(request: AIRequest): Promise<AIResponse>;

  // 抽象方法：验证配置
  abstract validateConfig(): Promise<boolean>;

  // 抽象方法：获取可用模型列表
  abstract getAvailableModels(): Promise<string[]>;

  // 通用方法：检查配置是否完整
  protected isConfigValid(): boolean {
    return this.config.enabled && !!this.config.model;
  }

  // 通用方法：处理重试逻辑
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // 指数退避
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError!;
  }

  // 通用方法：格式化消息
  protected formatMessages(messages: AIMessage[], systemPrompt?: string): any[] {
    const formattedMessages = [];

    // 添加系统提示
    if (systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt
      });
    }

    // 添加对话消息
    formattedMessages.push(...messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })));

    return formattedMessages;
  }

  // 通用方法：计算token数量（简单估算）
  protected estimateTokens(text: string): number {
    // 简单的token估算：英文约4字符/token，中文约1.5字符/token
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherChars = text.length - chineseChars;
    
    return Math.ceil(chineseChars / 1.5 + otherChars / 4);
  }

  // 获取Provider名称
  getProviderName(): string {
    return this.config.provider;
  }

  // 获取模型名称
  getModelName(): string {
    return this.config.model;
  }

  // 更新配置
  updateConfig(config: Partial<AIModelConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

