/**
 * OpenAI Provider 实现
 */

import axios, { AxiosInstance } from 'axios';
import { AIProvider, AIRequest, AIResponse, AIProviderError } from '../AIProvider';
import { AIModelConfig } from '@shared/types';

export class OpenAIProvider extends AIProvider {
  private client: AxiosInstance;

  constructor(config: AIModelConfig) {
    super(config);
    
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.openai.com/v1',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60秒超时
    });
  }

  async sendRequest(request: AIRequest): Promise<AIResponse> {
    if (!this.isConfigValid()) {
      throw new AIProviderError('OpenAI配置无效', 'openai', 'INVALID_CONFIG');
    }

    if (!this.config.apiKey) {
      throw new AIProviderError('OpenAI API密钥未设置', 'openai', 'MISSING_API_KEY');
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
        throw new AIProviderError('OpenAI返回空响应', 'openai', 'EMPTY_RESPONSE');
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
          provider: 'openai',
        },
      };
    } catch (error: any) {
      if (error instanceof AIProviderError) {
        throw error;
      }

      if (error.response) {
        const { status, data } = error.response;
        let message = `OpenAI API错误 (${status})`;
        
        if (data?.error?.message) {
          message += `: ${data.error.message}`;
        }

        throw new AIProviderError(message, 'openai', data?.error?.code, status);
      }

      if (error.code === 'ECONNABORTED') {
        throw new AIProviderError('OpenAI请求超时', 'openai', 'TIMEOUT');
      }

      throw new AIProviderError(
        `OpenAI请求失败: ${error.message}`,
        'openai',
        'REQUEST_FAILED'
      );
    }
  }

  async validateConfig(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      await this.client.get('/models', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    if (!this.config.apiKey) {
      throw new AIProviderError('OpenAI API密钥未设置', 'openai', 'MISSING_API_KEY');
    }

    try {
      const response = await this.client.get('/models');
      const models = response.data.data || [];
      
      // 过滤出聊天模型
      return models
        .filter((model: any) => model.id.includes('gpt'))
        .map((model: any) => model.id)
        .sort();
    } catch (error: any) {
      throw new AIProviderError(
        `获取OpenAI模型列表失败: ${error.message}`,
        'openai',
        'GET_MODELS_FAILED'
      );
    }
  }
}

