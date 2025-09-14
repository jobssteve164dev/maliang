/**
 * Ollama Provider 实现
 * 支持本地部署的Ollama模型
 */

import axios, { AxiosInstance } from 'axios';
import { AIProvider, AIRequest, AIResponse, AIProviderError } from '../AIProvider';
import { AIModelConfig } from '@shared/types';

export class OllamaProvider extends AIProvider {
  private client: AxiosInstance;

  constructor(config: AIModelConfig) {
    super(config);
    
    this.client = axios.create({
      baseURL: config.baseUrl || 'http://localhost:11434',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 120秒超时（本地模型可能较慢）
    });
  }

  async sendRequest(request: AIRequest): Promise<AIResponse> {
    if (!this.isConfigValid()) {
      throw new AIProviderError('Ollama配置无效', 'ollama', 'INVALID_CONFIG');
    }

    // 检查Ollama服务是否可用
    const isAvailable = await this.checkOllamaAvailability();
    if (!isAvailable) {
      throw new AIProviderError(
        'Ollama服务不可用，请确保Ollama已启动并运行在指定端口',
        'ollama',
        'SERVICE_UNAVAILABLE'
      );
    }

    // 构建prompt（Ollama使用不同的消息格式）
    let prompt = '';
    if (request.systemPrompt) {
      prompt += `System: ${request.systemPrompt}\n\n`;
    }

    for (const message of request.messages) {
      const role = message.role === 'assistant' ? 'Assistant' : 'Human';
      prompt += `${role}: ${message.content}\n\n`;
    }
    prompt += 'Assistant: ';

    const payload = {
      model: this.config.model,
      prompt: prompt.trim(),
      stream: false,
      options: {
        temperature: request.temperature ?? this.config.temperature,
        num_predict: request.maxTokens || this.config.maxTokens,
      },
    };

    try {
      const response = await this.withRetry(async () => {
        const result = await this.client.post('/api/generate', payload);
        return result.data;
      });

      if (!response.response) {
        throw new AIProviderError('Ollama返回空响应', 'ollama', 'EMPTY_RESPONSE');
      }

      return {
        content: response.response.trim(),
        usage: {
          promptTokens: this.estimateTokens(prompt),
          completionTokens: this.estimateTokens(response.response),
          totalTokens: this.estimateTokens(prompt + response.response),
        },
        model: this.config.model,
        finishReason: response.done ? 'stop' : 'length',
        metadata: {
          provider: 'ollama',
          eval_count: response.eval_count,
          eval_duration: response.eval_duration,
        },
      };
    } catch (error: any) {
      if (error instanceof AIProviderError) {
        throw error;
      }

      if (error.response) {
        const { status, data } = error.response;
        let message = `Ollama API错误 (${status})`;
        
        if (data?.error) {
          message += `: ${data.error}`;
        }

        throw new AIProviderError(message, 'ollama', 'API_ERROR', status);
      }

      if (error.code === 'ECONNABORTED') {
        throw new AIProviderError('Ollama请求超时', 'ollama', 'TIMEOUT');
      }

      if (error.code === 'ECONNREFUSED') {
        throw new AIProviderError(
          '无法连接到Ollama服务，请检查服务是否启动',
          'ollama',
          'CONNECTION_REFUSED'
        );
      }

      throw new AIProviderError(
        `Ollama请求失败: ${error.message}`,
        'ollama',
        'REQUEST_FAILED'
      );
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      const isAvailable = await this.checkOllamaAvailability();
      if (!isAvailable) {
        return false;
      }

      // 检查模型是否存在
      const models = await this.getAvailableModels();
      return models.includes(this.config.model);
    } catch (error) {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.client.get('/api/tags');
      const models = response.data.models || [];
      
      return models.map((model: any) => model.name);
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new AIProviderError(
          '无法连接到Ollama服务，请检查服务是否启动',
          'ollama',
          'CONNECTION_REFUSED'
        );
      }

      throw new AIProviderError(
        `获取Ollama模型列表失败: ${error.message}`,
        'ollama',
        'GET_MODELS_FAILED'
      );
    }
  }

  // 检查Ollama服务可用性
  private async checkOllamaAvailability(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/tags', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // 拉取模型（如果模型不存在）
  async pullModel(modelName: string): Promise<void> {
    try {
      const payload = {
        name: modelName,
        stream: false,
      };

      await this.client.post('/api/pull', payload, {
        timeout: 300000, // 5分钟超时（下载模型可能很慢）
      });
    } catch (error: any) {
      throw new AIProviderError(
        `拉取Ollama模型失败: ${error.message}`,
        'ollama',
        'PULL_MODEL_FAILED'
      );
    }
  }

  // 检查模型是否已下载
  async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await this.getAvailableModels();
      return models.includes(modelName);
    } catch (error) {
      return false;
    }
  }
}

