/**
 * AI服务层
 * 封装所有AI相关的业务逻辑
 */

import { AIProviderManager } from '@api/AIProviderManager';
import { AIRequest, AIResponse, AIProviderError } from '@api/AIProvider';
import { ConfigManager } from './ConfigManager';
import { DatabaseManager } from '@database/DatabaseManager';
import { AIMessage, AIConversation, AIAgent } from '@shared/types';

export class AIService {
  private providerManager: AIProviderManager;
  private configManager: ConfigManager;
  private databaseManager: DatabaseManager;

  constructor(
    configManager: ConfigManager,
    databaseManager: DatabaseManager
  ) {
    this.configManager = configManager;
    this.databaseManager = databaseManager;
    this.providerManager = new AIProviderManager();
    
    this.initializeProviders();
  }

  // 初始化AI Providers
  private initializeProviders(): void {
    const aiModels = this.configManager.getAIModels();
    this.providerManager.initializeProviders(aiModels);
  }

  // 重新加载配置
  reloadConfig(): void {
    this.initializeProviders();
  }

  // 发送AI请求
  async sendMessage(
    agentId: string,
    projectId: string,
    message: string,
    context?: Record<string, any>
  ): Promise<AIResponse> {
    // 获取智能体配置
    const agent = this.configManager.getAgentById(agentId);
    if (!agent || !agent.enabled) {
      throw new AIProviderError(
        `智能体不可用: ${agentId}`,
        'service',
        'AGENT_NOT_AVAILABLE'
      );
    }

    // 获取对话历史
    const conversation = await this.getOrCreateConversation(projectId, agentId);
    
    // 构建消息列表
    const messages: AIMessage[] = [
      ...conversation.messages,
      {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      }
    ];

    // 构建AI请求
    const request: AIRequest = {
      messages,
      systemPrompt: agent.systemPrompt,
      maxTokens: agent.modelConfig.maxTokens,
      temperature: agent.modelConfig.temperature,
      context: { ...conversation.context, ...context },
    };

    // 发送请求
    const providerKey = `${agent.modelConfig.provider}-${agent.modelConfig.model}`;
    const response = await this.providerManager.sendRequest(request, providerKey);

    // 保存对话记录
    await this.saveConversationMessage(conversation.id, messages[messages.length - 1]);
    await this.saveConversationMessage(conversation.id, {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      metadata: response.metadata,
    });

    return response;
  }

  // 获取或创建对话
  private async getOrCreateConversation(
    projectId: string,
    agentId: string
  ): Promise<AIConversation> {
    // 查找现有对话
    const existingConversations = await this.databaseManager.query(
      'SELECT * FROM ai_conversations WHERE project_id = ? AND agent_id = ? ORDER BY updated_at DESC LIMIT 1',
      [projectId, agentId]
    );

    if (existingConversations.length > 0) {
      const conv = existingConversations[0];
      return {
        id: conv.id,
        projectId: conv.project_id,
        agentId: conv.agent_id,
        messages: JSON.parse(conv.messages || '[]'),
        context: JSON.parse(conv.context || '{}'),
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
      };
    }

    // 创建新对话
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await this.databaseManager.run(
      `INSERT INTO ai_conversations (id, project_id, agent_id, messages, context, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [conversationId, projectId, agentId, '[]', '{}', now, now]
    );

    return {
      id: conversationId,
      projectId,
      agentId,
      messages: [],
      context: {},
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  // 保存对话消息
  private async saveConversationMessage(
    conversationId: string,
    message: AIMessage
  ): Promise<void> {
    // 获取当前对话
    const conversation = await this.databaseManager.get(
      'SELECT messages FROM ai_conversations WHERE id = ?',
      [conversationId]
    );

    if (!conversation) {
      throw new Error(`对话不存在: ${conversationId}`);
    }

    // 更新消息列表
    const messages: AIMessage[] = JSON.parse(conversation.messages || '[]');
    messages.push(message);

    // 保存到数据库
    const now = new Date().toISOString();
    await this.databaseManager.run(
      'UPDATE ai_conversations SET messages = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(messages), now, conversationId]
    );
  }

  // 获取对话历史
  async getConversationHistory(
    projectId: string,
    agentId: string,
    limit: number = 50
  ): Promise<AIMessage[]> {
    const conversation = await this.databaseManager.get(
      'SELECT messages FROM ai_conversations WHERE project_id = ? AND agent_id = ? ORDER BY updated_at DESC LIMIT 1',
      [projectId, agentId]
    );

    if (!conversation) {
      return [];
    }

    const messages: AIMessage[] = JSON.parse(conversation.messages || '[]');
    return messages.slice(-limit); // 返回最近的消息
  }

  // 清除对话历史
  async clearConversationHistory(projectId: string, agentId: string): Promise<void> {
    await this.databaseManager.run(
      'UPDATE ai_conversations SET messages = ?, updated_at = ? WHERE project_id = ? AND agent_id = ?',
      ['[]', new Date().toISOString(), projectId, agentId]
    );
  }

  // 获取所有可用的智能体
  getAvailableAgents(): AIAgent[] {
    return this.configManager.getEnabledAgents();
  }

  // 验证AI配置
  async validateConfiguration(): Promise<Map<string, boolean>> {
    return await this.providerManager.validateAllConfigs();
  }

  // 获取Provider统计信息
  getProviderStats() {
    return this.providerManager.getProviderStats();
  }

  // 测试Provider连接
  async testProvider(providerKey: string) {
    return await this.providerManager.testProvider(providerKey);
  }

  // 获取可用的模型列表
  async getAvailableModels(providerKey: string): Promise<string[]> {
    return await this.providerManager.getAvailableModels(providerKey);
  }

  // 更新智能体配置
  updateAgentConfig(agentId: string, config: Partial<AIAgent>): void {
    const agents = this.configManager.getAgents();
    const updatedAgents = agents.map(agent => 
      agent.id === agentId ? { ...agent, ...config } : agent
    );
    
    this.configManager.setAgents(updatedAgents);
    this.reloadConfig();
  }

  // 批量发送消息（用于智能体协作）
  async sendBatchMessages(
    requests: Array<{
      agentId: string;
      projectId: string;
      message: string;
      context?: Record<string, any>;
    }>
  ): Promise<AIResponse[]> {
    const responses: AIResponse[] = [];

    for (const request of requests) {
      try {
        const response = await this.sendMessage(
          request.agentId,
          request.projectId,
          request.message,
          request.context
        );
        responses.push(response);
      } catch (error) {
        console.error(`Failed to send message to agent ${request.agentId}:`, error);
        // 继续处理其他请求，不中断整个批处理
      }
    }

    return responses;
  }

  // 获取智能体使用统计
  async getAgentUsageStats(projectId: string): Promise<Record<string, number>> {
    const stats = await this.databaseManager.query(
      `SELECT agent_id, COUNT(*) as usage_count 
       FROM ai_conversations 
       WHERE project_id = ? 
       GROUP BY agent_id`,
      [projectId]
    );

    const result: Record<string, number> = {};
    for (const stat of stats) {
      result[stat.agent_id] = stat.usage_count;
    }

    return result;
  }
}

