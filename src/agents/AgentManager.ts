/**
 * 智能体管理器
 * 统一管理所有智能体的注册、配置和调用
 */

import { BaseAgent, AgentContext, AgentOutput } from './BaseAgent';
import { AgentCollaborationHub } from './AgentCollaborationHub';
import { ThemePlannerAgent } from './ThemePlannerAgent';
import { OutlineArchitectAgent } from './OutlineArchitectAgent';
import { WorldBuilderAgent } from './WorldBuilderAgent';
import { CharacterDesignerAgent } from './CharacterDesignerAgent';
import { RelationshipMapperAgent } from './RelationshipMapperAgent';
import { DialogueMasterAgent } from './DialogueMasterAgent';
import { PlotAdvisorAgent } from './PlotAdvisorAgent';

import { AIService } from '@services/AIService';
import { ConfigManager } from '@services/ConfigManager';
import { DatabaseManager } from '@database/DatabaseManager';
import { AIAgent } from '@shared/types';

export class AgentManager {
  private agents: Map<string, BaseAgent> = new Map();
  private collaborationHub: AgentCollaborationHub;
  private aiService: AIService;
  private configManager: ConfigManager;
  private databaseManager: DatabaseManager;

  constructor(
    aiService: AIService,
    configManager: ConfigManager,
    databaseManager: DatabaseManager
  ) {
    this.aiService = aiService;
    this.configManager = configManager;
    this.databaseManager = databaseManager;
    this.collaborationHub = new AgentCollaborationHub(aiService, databaseManager);
    
    this.initializeAgents();
  }

  // 初始化所有智能体
  private initializeAgents(): void {
    const agentConfigs = this.configManager.getAgents();
    
    for (const config of agentConfigs) {
      if (!config.enabled) continue;
      
      try {
        const agent = this.createAgent(config);
        if (agent) {
          this.agents.set(config.id, agent);
          this.collaborationHub.registerAgent(agent);
          console.log(`Agent initialized: ${config.name} (${config.type})`);
        }
      } catch (error) {
        console.error(`Failed to initialize agent ${config.id}:`, error);
      }
    }
  }

  // 创建智能体实例
  private createAgent(config: AIAgent): BaseAgent | null {
    switch (config.type) {
      case 'theme':
        return new ThemePlannerAgent(config, this.aiService);
      case 'outline':
        return new OutlineArchitectAgent(config, this.aiService);
      case 'world':
        return new WorldBuilderAgent(config, this.aiService);
      case 'character':
        return new CharacterDesignerAgent(config, this.aiService);
      case 'relationship':
        return new RelationshipMapperAgent(config, this.aiService);
      case 'dialogue':
        return new DialogueMasterAgent(config, this.aiService);
      case 'plot':
        return new PlotAdvisorAgent(config, this.aiService);
      default:
        console.warn(`Unknown agent type: ${config.type}`);
        return null;
    }
  }

  // 发送消息给指定智能体
  async sendMessage(
    agentId: string,
    context: AgentContext
  ): Promise<AgentOutput> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    return await this.collaborationHub.sendMessageToAgent(agentId, context);
  }

  // 发送消息给指定类型的智能体
  async sendMessageToAgentType(
    agentType: string,
    context: AgentContext
  ): Promise<AgentOutput> {
    const agent = Array.from(this.agents.values()).find(
      a => a.getAgentInfo().type === agentType
    );
    
    if (!agent) {
      throw new Error(`No agent found for type: ${agentType}`);
    }

    return await this.collaborationHub.sendMessageToAgent(
      agent.getAgentInfo().id,
      context
    );
  }

  // 执行协作工作流
  async executeWorkflow(
    workflowId: string,
    context: AgentContext
  ): Promise<Map<string, AgentOutput>> {
    return await this.collaborationHub.executeWorkflow(workflowId, context);
  }

  // 启动协作会话
  async startCollaboration(
    projectId: string,
    topic: string,
    agentTypes: string[]
  ): Promise<string> {
    return await this.collaborationHub.startCollaborationSession(
      projectId,
      topic,
      agentTypes
    );
  }

  // 获取所有可用智能体
  getAvailableAgents(): Array<{ id: string; name: string; type: string; description: string }> {
    return this.collaborationHub.getAvailableAgents();
  }

  // 获取指定类型的智能体
  getAgentsByType(agentType: string): Array<{ id: string; name: string; type: string; description: string }> {
    return this.getAvailableAgents().filter(agent => agent.type === agentType);
  }

  // 检查智能体是否可用
  isAgentAvailable(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    return agent ? agent.isEnabled() : false;
  }

  // 重新加载智能体配置
  reloadAgents(): void {
    // 清理现有智能体
    for (const [agentId] of this.agents) {
      this.collaborationHub.unregisterAgent(agentId);
    }
    this.agents.clear();

    // 重新初始化
    this.initializeAgents();
  }

  // 更新智能体配置
  updateAgentConfig(agentId: string, config: Partial<AIAgent>): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.updateConfig(config);
    }

    // 同时更新配置管理器中的配置
    const agents = this.configManager.getAgents();
    const updatedAgents = agents.map(a => 
      a.id === agentId ? { ...a, ...config } : a
    );
    this.configManager.setAgents(updatedAgents);
  }

  // 启用/禁用智能体
  setAgentEnabled(agentId: string, enabled: boolean): void {
    this.updateAgentConfig(agentId, { enabled });
    
    if (enabled && !this.agents.has(agentId)) {
      // 如果启用且当前未加载，则创建并注册
      const config = this.configManager.getAgentById(agentId);
      if (config) {
        const agent = this.createAgent(config);
        if (agent) {
          this.agents.set(agentId, agent);
          this.collaborationHub.registerAgent(agent);
        }
      }
    } else if (!enabled && this.agents.has(agentId)) {
      // 如果禁用且当前已加载，则注销
      this.collaborationHub.unregisterAgent(agentId);
      this.agents.delete(agentId);
    }
  }

  // 获取智能体使用统计
  async getAgentUsageStats(projectId?: string): Promise<Record<string, any>> {
    const stats: Record<string, any> = {
      totalAgents: this.agents.size,
      enabledAgents: Array.from(this.agents.values()).filter(a => a.isEnabled()).length,
      agentTypes: {},
    };

    // 统计各类型智能体数量
    for (const agent of this.agents.values()) {
      const type = agent.getAgentInfo().type;
      stats.agentTypes[type] = (stats.agentTypes[type] || 0) + 1;
    }

    // 如果指定了项目ID，获取该项目的使用统计
    if (projectId) {
      try {
        const usageData = await this.aiService.getAgentUsageStats(projectId);
        stats.projectUsage = usageData;
      } catch (error) {
        console.error('Failed to get project usage stats:', error);
      }
    }

    return stats;
  }

  // 测试智能体连接
  async testAgent(agentId: string, testContext: AgentContext): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        return {
          success: false,
          responseTime: 0,
          error: `Agent not found: ${agentId}`,
        };
      }

      if (!agent.isEnabled()) {
        return {
          success: false,
          responseTime: 0,
          error: `Agent is disabled: ${agentId}`,
        };
      }

      // 发送测试消息
      const testMessage = {
        ...testContext,
        userInput: 'Hello, this is a connection test.',
      };

      await agent.processInput(testMessage);
      
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

  // 获取智能体协作历史
  async getCollaborationHistory(projectId: string, agentId?: string) {
    return await this.collaborationHub.getCollaborationHistory(projectId, agentId);
  }

  // 批量处理智能体请求
  async batchProcess(
    requests: Array<{
      agentId: string;
      context: AgentContext;
    }>
  ): Promise<Array<{ agentId: string; result?: AgentOutput; error?: string }>> {
    const results = [];

    for (const request of requests) {
      try {
        const result = await this.sendMessage(request.agentId, request.context);
        results.push({ agentId: request.agentId, result });
      } catch (error: any) {
        results.push({ 
          agentId: request.agentId, 
          error: error.message 
        });
      }
    }

    return results;
  }

  // 获取推荐的智能体工作流
  getRecommendedWorkflows(projectType: string, currentStage: string): string[] {
    const workflows = [];

    if (currentStage === 'planning') {
      workflows.push('full-creation');
    } else if (currentStage === 'character-development') {
      workflows.push('character-development');
    } else if (currentStage === 'plot-review') {
      workflows.push('plot-optimization');
    }

    return workflows;
  }

  // 清理资源
  cleanup(): void {
    for (const [agentId] of this.agents) {
      this.collaborationHub.unregisterAgent(agentId);
    }
    this.agents.clear();
  }
}

