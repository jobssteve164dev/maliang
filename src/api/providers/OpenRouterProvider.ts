/**
 * OpenRouter Provider 实现
 */

import axios, { AxiosInstance } from 'axios';
import { AIProvider, AIRequest, AIResponse, AIProviderError } from '../AIProvider';
import { AIModelConfig } from '@shared/types';

export class OpenRouterProvider extends AIProvider {
  private client: AxiosInstance;

  constructor(config: AIModelConfig) {
    super(config);
    
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://novel-ai-assistant.app',
        'X-Title': 'Novel AI Assistant',
      },
      timeout: 90000, // 90秒超时（OpenRouter可能较慢）
    });
  }

  async sendRequest(request: AIRequest): Promise<AIResponse> {
    if (!this.isConfigValid()) {
      throw new AIProviderError('OpenRouter配置无效', 'openrouter', 'INVALID_CONFIG');
    }

    if (!this.config.apiKey) {
      throw new AIProviderError('OpenRouter API密钥未设置', 'openrouter', 'MISSING_API_KEY');
    }

    const messages = this.formatMessages(request.messages, request.systemPrompt);

    const payload = {
      model: this.config.model,
      messages,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
      stream: false,
    };

    try {
      const response = await this.withRetry(async () => {
        const result = await this.client.post('/chat/completions', payload);
        return result.data;
      });

      if (!response.choices || response.choices.length === 0) {
        throw new AIProviderError('OpenRouter返回空响应', 'openrouter', 'EMPTY_RESPONSE');
      }

      const choice = response.choices[0];
      
      return {
        content: choice.message.content || '',
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
        model: response.model,
        finishReason: choice.finish_reason,
        metadata: {
          id: response.id,
          created: response.created,
          provider: 'openrouter',
        },
      };
    } catch (error: any) {
      if (error instanceof AIProviderError) {
        throw error;
      }

      if (error.response) {
        const { status, data } = error.response;
        let message = `OpenRouter API错误 (${status})`;
        
        if (data?.error?.message) {
          message += `: ${data.error.message}`;
        }

        throw new AIProviderError(message, 'openrouter', data?.error?.code, status);
      }

      if (error.code === 'ECONNABORTED') {
        throw new AIProviderError('OpenRouter请求超时', 'openrouter', 'TIMEOUT');
      }

      throw new AIProviderError(
        `OpenRouter请求失败: ${error.message}`,
        'openrouter',
        'REQUEST_FAILED'
      );
    }
  }

  async validateConfig(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      await this.client.get('/models');
      return true;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return false;
      }
      return true;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    if (!this.config.apiKey) {
      throw new AIProviderError('OpenRouter API密钥未设置', 'openrouter', 'MISSING_API_KEY');
    }

    try {
      const response = await this.client.get('/models');
      const models = response.data.data || [];
      
      // 返回模型ID列表
      return models
        .map((model: any) => model.id)
        .sort();
    } catch (error: any) {
      // 如果获取失败，返回常用模型列表
      return [
        'anthropic/claude-3-sonnet',
        'anthropic/claude-3-haiku',
        'openai/gpt-4',
        'openai/gpt-3.5-turbo',
        'meta-llama/llama-2-70b-chat',
        'mistralai/mixtral-8x7b-instruct',
      ];
    }
  }
}

