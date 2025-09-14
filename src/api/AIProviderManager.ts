/**
 * AI Provider 管理器
 * 统一管理所有AI模型提供商
 */

import { AIProvider, AIRequest, AIResponse, AIProviderError } from './AIProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { DeepSeekProvider } from './providers/DeepSeekProvider';
import { OpenRouterProvider } from './providers/OpenRouterProvider';
import { OllamaProvider } from './providers/OllamaProvider';
import { AIModelConfig } from '@shared/types';

export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProvider: string | null = null;

  constructor() {
    // 初始化时不创建任何provider，等待配置加载
  }

  // 初始化所有providers
  initializeProviders(configs: AIModelConfig[]): void {
    this.providers.clear();

    for (const config of configs) {
      if (!config.enabled) continue;

      try {
        const provider = this.createProvider(config);
        const key = `${config.provider}-${config.model}`;
        this.providers.set(key, provider);

        // 设置第一个启用的provider为默认provider
        if (!this.defaultProvider) {
          this.defaultProvider = key;
        }
      } catch (error) {
        console.error(`Failed to initialize provider ${config.provider}:`, error);
      }
    }
  }

  // 创建provider实例
  private createProvider(config: AIModelConfig): AIProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'deepseek':
        return new DeepSeekProvider(config);
      case 'openrouter':
        return new OpenRouterProvider(config);
      case 'ollama':
        return new OllamaProvider(config);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  // 发送请求到指定provider
  async sendRequest(
    request: AIRequest,
    providerKey?: string
  ): Promise<AIResponse> {
    const targetProvider = providerKey || this.defaultProvider;
    
    if (!targetProvider) {
      throw new AIProviderError(
        '没有可用的AI Provider',
        'manager',
        'NO_PROVIDER_AVAILABLE'
      );
    }

    const provider = this.providers.get(targetProvider);
    if (!provider) {
      throw new AIProviderError(
        `Provider不存在: ${targetProvider}`,
        'manager',
        'PROVIDER_NOT_FOUND'
      );
    }

    try {
      return await provider.sendRequest(request);
    } catch (error) {
      if (error instanceof AIProviderError) {
        // 如果当前provider失败，尝试使用其他可用的provider
        if (this.providers.size > 1) {
          console.warn(`Provider ${targetProvider} failed, trying fallback...`);
          return await this.sendRequestWithFallback(request, targetProvider);
        }
      }
      throw error;
    }
  }

  // 使用备用provider发送请求
  private async sendRequestWithFallback(
    request: AIRequest,
    excludeProvider: string
  ): Promise<AIResponse> {
    const availableProviders = Array.from(this.providers.keys())
      .filter(key => key !== excludeProvider);

    if (availableProviders.length === 0) {
      throw new AIProviderError(
        '所有AI Provider都不可用',
        'manager',
        'ALL_PROVIDERS_FAILED'
      );
    }

    // 尝试第一个可用的备用provider
    const fallbackProvider = availableProviders[0];
    const provider = this.providers.get(fallbackProvider)!;
    
    return await provider.sendRequest(request);
  }

  // 验证所有provider配置
  async validateAllConfigs(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const [key, provider] of this.providers) {
      try {
        const isValid = await provider.validateConfig();
        results.set(key, isValid);
      } catch (error) {
        console.error(`Failed to validate provider ${key}:`, error);
        results.set(key, false);
      }
    }

    return results;
  }

  // 获取指定provider的可用模型
  async getAvailableModels(providerKey: string): Promise<string[]> {
    const provider = this.providers.get(providerKey);
    if (!provider) {
      throw new AIProviderError(
        `Provider不存在: ${providerKey}`,
        'manager',
        'PROVIDER_NOT_FOUND'
      );
    }

    return await provider.getAvailableModels();
  }

  // 获取所有可用的providers
  getAvailableProviders(): Array<{ key: string; provider: string; model: string }> {
    return Array.from(this.providers.entries()).map(([key, provider]) => ({
      key,
      provider: provider.getProviderName(),
      model: provider.getModelName(),
    }));
  }

  // 设置默认provider
  setDefaultProvider(providerKey: string): void {
    if (!this.providers.has(providerKey)) {
      throw new Error(`Provider不存在: ${providerKey}`);
    }
    this.defaultProvider = providerKey;
  }

  // 获取默认provider
  getDefaultProvider(): string | null {
    return this.defaultProvider;
  }

  // 移除provider
  removeProvider(providerKey: string): void {
    this.providers.delete(providerKey);
    
    if (this.defaultProvider === providerKey) {
      // 如果删除的是默认provider，选择第一个可用的作为新默认
      const availableKeys = Array.from(this.providers.keys());
      this.defaultProvider = availableKeys.length > 0 ? availableKeys[0] : null;
    }
  }

  // 更新provider配置
  updateProvider(config: AIModelConfig): void {
    const key = `${config.provider}-${config.model}`;
    
    if (config.enabled) {
      const provider = this.createProvider(config);
      this.providers.set(key, provider);
      
      if (!this.defaultProvider) {
        this.defaultProvider = key;
      }
    } else {
      this.removeProvider(key);
    }
  }

  // 获取provider统计信息
  getProviderStats(): {
    total: number;
    enabled: number;
    byProvider: Record<string, number>;
  } {
    const stats = {
      total: this.providers.size,
      enabled: this.providers.size,
      byProvider: {} as Record<string, number>,
    };

    for (const provider of this.providers.values()) {
      const providerName = provider.getProviderName();
      stats.byProvider[providerName] = (stats.byProvider[providerName] || 0) + 1;
    }

    return stats;
  }

  // 测试provider连接
  async testProvider(providerKey: string): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> {
    const provider = this.providers.get(providerKey);
    if (!provider) {
      return {
        success: false,
        responseTime: 0,
        error: `Provider不存在: ${providerKey}`,
      };
    }

    const startTime = Date.now();
    
    try {
      const testRequest: AIRequest = {
        messages: [{ 
          id: 'test', 
          role: 'user', 
          content: 'Hello', 
          timestamp: new Date() 
        }],
        maxTokens: 10,
        temperature: 0.1,
      };

      await provider.sendRequest(testRequest);
      
      return {
        success: true,
        responseTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }
}

