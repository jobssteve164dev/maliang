/**
 * DeepSeek Provider 实现
 */

import axios, { AxiosInstance } from 'axios';
import { AIProvider, AIRequest, AIResponse, AIProviderError } from '../AIProvider';
import { AIModelConfig } from '@shared/types';

export class DeepSeekProvider extends AIProvider {
  private client: AxiosInstance;

  constructor(config: AIModelConfig) {
    super(config);
    
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.deepseek.com/v1',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60秒超时
    });
  }

  async sendRequest(request: AIRequest): Promise<AIResponse> {
    if (!this.isConfigValid()) {
      throw new AIProviderError('DeepSeek配置无效', 'deepseek', 'INVALID_CONFIG');
    }

    if (!this.config.apiKey) {
      throw new AIProviderError('DeepSeek API密钥未设置', 'deepseek', 'MISSING_API_KEY');
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
        throw new AIProviderError('DeepSeek返回空响应', 'deepseek', 'EMPTY_RESPONSE');
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
          provider: 'deepseek',
        },
      };
    } catch (error: any) {
      if (error instanceof AIProviderError) {
        throw error;
      }

      if (error.response) {
        const { status, data } = error.response;
        let message = `DeepSeek API错误 (${status})`;
        
        if (data?.error?.message) {
          message += `: ${data.error.message}`;
        }

        throw new AIProviderError(message, 'deepseek', data?.error?.code, status);
      }

      if (error.code === 'ECONNABORTED') {
        throw new AIProviderError('DeepSeek请求超时', 'deepseek', 'TIMEOUT');
      }

      throw new AIProviderError(
        `DeepSeek请求失败: ${error.message}`,
        'deepseek',
        'REQUEST_FAILED'
      );
    }
  }

  async validateConfig(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      // DeepSeek使用类似OpenAI的API结构
      const testPayload = {
        model: this.config.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 1,
      };

      await this.client.post('/chat/completions', testPayload);
      return true;
    } catch (error: any) {
      // 如果是认证错误，说明API密钥无效
      if (error.response?.status === 401) {
        return false;
      }
      // 其他错误可能是网络问题，暂时认为配置有效
      return true;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    // DeepSeek的常用模型列表
    return [
      'deepseek-chat',
      'deepseek-coder',
    ];
  }
}

