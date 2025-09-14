/**
 * 智能体协作中心
 * 管理智能体间的协作和信息共享
 */

import { BaseAgent, CollaborationMessage, AgentContext, AgentOutput } from './BaseAgent';
import { AIService } from '@services/AIService';
import { DatabaseManager } from '@database/DatabaseManager';

// 协作会话
export interface CollaborationSession {
  id: string;
  projectId: string;
  participants: string[]; // 参与的智能体ID列表
  topic: string;
  messages: CollaborationMessage[];
  sharedContext: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'completed' | 'paused';
}

// 协作工作流
export interface CollaborationWorkflow {
  id: string;
  name: string;
  description: string;
  steps: Array<{
    agentType: string;
    action: string;
    dependencies?: string[]; // 依赖的前置步骤
    parallel?: boolean; // 是否可以并行执行
  }>;
  triggers: string[]; // 触发条件
}

export class AgentCollaborationHub {
  private agents: Map<string, BaseAgent> = new Map();
  private activeSessions: Map<string, CollaborationSession> = new Map();
  private workflows: Map<string, CollaborationWorkflow> = new Map();
  private aiService: AIService;
  private databaseManager: DatabaseManager;

  constructor(aiService: AIService, databaseManager: DatabaseManager) {
    this.aiService = aiService;
    this.databaseManager = databaseManager;
    this.initializeWorkflows();
  }

  // 注册智能体
  registerAgent(agent: BaseAgent): void {
    const agentInfo = agent.getAgentInfo();
    this.agents.set(agentInfo.id, agent);
    console.log(`Agent registered: ${agentInfo.name} (${agentInfo.type})`);
  }

  // 注销智能体
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    console.log(`Agent unregistered: ${agentId}`);
  }

  // 获取所有可用智能体
  getAvailableAgents(): Array<{ id: string; name: string; type: string; description: string }> {
    return Array.from(this.agents.values())
      .filter(agent => agent.isEnabled())
      .map(agent => agent.getAgentInfo());
  }

  // 发送消息给智能体
  async sendMessageToAgent(
    agentId: string,
    context: AgentContext
  ): Promise<AgentOutput> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (!agent.isEnabled()) {
      throw new Error(`Agent is disabled: ${agentId}`);
    }

    // 添加协作上下文
    const enhancedContext = await this.enhanceContextWithCollaboration(context, agentId);
    
    try {
      const output = await agent.processInput(enhancedContext);
      
      // 保存协作数据
      if (output.data && Object.keys(output.data).length > 0) {
        await this.saveCollaborationData(context.project.id, agentId, output.data);
      }

      return output;
    } catch (error) {
      console.error(`Error processing input for agent ${agentId}:`, error);
      throw error;
    }
  }

  // 启动协作会话
  async startCollaborationSession(
    projectId: string,
    topic: string,
    participantTypes: string[]
  ): Promise<string> {
    const sessionId = `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 获取参与的智能体ID
    const participants: string[] = [];
    for (const type of participantTypes) {
      const agent = Array.from(this.agents.values()).find(a => a.getAgentInfo().type === type);
      if (agent && agent.isEnabled()) {
        participants.push(agent.getAgentInfo().id);
      }
    }

    const session: CollaborationSession = {
      id: sessionId,
      projectId,
      participants,
      topic,
      messages: [],
      sharedContext: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
    };

    this.activeSessions.set(sessionId, session);
    
    // 保存到数据库
    await this.saveCollaborationSession(session);

    return sessionId;
  }

  // 执行协作工作流
  async executeWorkflow(
    workflowId: string,
    context: AgentContext
  ): Promise<Map<string, AgentOutput>> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const results = new Map<string, AgentOutput>();
    const executedSteps = new Set<string>();

    // 按依赖关系执行步骤
    for (const step of workflow.steps) {
      // 检查依赖是否已完成
      if (step.dependencies) {
        const unmetDependencies = step.dependencies.filter(dep => !executedSteps.has(dep));
        if (unmetDependencies.length > 0) {
          console.warn(`Skipping step ${step.agentType} due to unmet dependencies: ${unmetDependencies.join(', ')}`);
          continue;
        }
      }

      // 找到对应的智能体
      const agent = Array.from(this.agents.values()).find(a => a.getAgentInfo().type === step.agentType);
      if (!agent || !agent.isEnabled()) {
        console.warn(`Agent not available for step: ${step.agentType}`);
        continue;
      }

      try {
        // 构建包含前置步骤结果的上下文
        const enhancedContext = {
          ...context,
          collaborationData: this.buildCollaborationData(results),
        };

        const output = await agent.processInput(enhancedContext);
        results.set(step.agentType, output);
        executedSteps.add(step.agentType);

        console.log(`Workflow step completed: ${step.agentType}`);
      } catch (error) {
        console.error(`Workflow step failed: ${step.agentType}`, error);
      }
    }

    return results;
  }

  // 发送协作消息
  async sendCollaborationMessage(message: CollaborationMessage): Promise<AgentOutput | null> {
    const targetAgent = this.agents.get(message.toAgent);
    if (!targetAgent || !targetAgent.isEnabled()) {
      console.warn(`Target agent not available: ${message.toAgent}`);
      return null;
    }

    // 构建临时上下文（实际使用中需要从数据库获取完整上下文）
    const context: AgentContext = {
      project: { id: 'temp' } as any, // 需要从消息中获取项目信息
      userInput: message.content,
      collaborationData: message.data,
    };

    try {
      return await targetAgent.handleCollaboration(message, context);
    } catch (error) {
      console.error(`Collaboration message failed: ${message.fromAgent} -> ${message.toAgent}`, error);
      return null;
    }
  }

  // 获取协作历史
  async getCollaborationHistory(projectId: string, agentId?: string): Promise<CollaborationMessage[]> {
    // 从数据库查询协作历史
    let query = 'SELECT * FROM collaboration_messages WHERE project_id = ?';
    const params: any[] = [projectId];

    if (agentId) {
      query += ' AND (from_agent = ? OR to_agent = ?)';
      params.push(agentId, agentId);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    try {
      const rows = await this.databaseManager.query(query, params);
      return rows.map(row => ({
        fromAgent: row.from_agent,
        toAgent: row.to_agent,
        messageType: row.message_type,
        content: row.content,
        data: row.data ? JSON.parse(row.data) : undefined,
        timestamp: new Date(row.created_at),
      }));
    } catch (error) {
      console.error('Failed to get collaboration history:', error);
      return [];
    }
  }

  // 增强上下文与协作信息
  private async enhanceContextWithCollaboration(
    context: AgentContext,
    currentAgentId: string
  ): Promise<AgentContext> {
    // 获取其他智能体的协作数据
    const collaborationData = await this.getCollaborationData(context.project.id, currentAgentId);
    
    return {
      ...context,
      collaborationData,
    };
  }

  // 获取协作数据
  private async getCollaborationData(
    projectId: string,
    excludeAgentId: string
  ): Promise<Record<string, any>> {
    try {
      const query = `
        SELECT agent_id, data 
        FROM collaboration_data 
        WHERE project_id = ? AND agent_id != ? 
        ORDER BY updated_at DESC
      `;
      
      const rows = await this.databaseManager.query(query, [projectId, excludeAgentId]);
      
      const collaborationData: Record<string, any> = {};
      for (const row of rows) {
        if (row.data) {
          collaborationData[row.agent_id] = JSON.parse(row.data);
        }
      }

      return collaborationData;
    } catch (error) {
      console.error('Failed to get collaboration data:', error);
      return {};
    }
  }

  // 保存协作数据
  private async saveCollaborationData(
    projectId: string,
    agentId: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      await this.databaseManager.run(
        `INSERT OR REPLACE INTO collaboration_data 
         (project_id, agent_id, data, updated_at) 
         VALUES (?, ?, ?, ?)`,
        [projectId, agentId, JSON.stringify(data), now]
      );
    } catch (error) {
      console.error('Failed to save collaboration data:', error);
    }
  }

  // 构建协作数据
  private buildCollaborationData(results: Map<string, AgentOutput>): Record<string, any> {
    const collaborationData: Record<string, any> = {};
    
    for (const [agentType, output] of results) {
      if (output.data && Object.keys(output.data).length > 0) {
        collaborationData[agentType] = output.data;
      }
    }

    return collaborationData;
  }

  // 保存协作会话
  private async saveCollaborationSession(session: CollaborationSession): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      await this.databaseManager.run(
        `INSERT INTO collaboration_sessions 
         (id, project_id, participants, topic, messages, shared_context, created_at, updated_at, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session.id,
          session.projectId,
          JSON.stringify(session.participants),
          session.topic,
          JSON.stringify(session.messages),
          JSON.stringify(session.sharedContext),
          now,
          now,
          session.status,
        ]
      );
    } catch (error) {
      console.error('Failed to save collaboration session:', error);
    }
  }

  // 初始化预定义工作流
  private initializeWorkflows(): void {
    // 完整创作工作流
    this.workflows.set('full-creation', {
      id: 'full-creation',
      name: '完整创作工作流',
      description: '从主题到完整故事大纲的全流程协作',
      steps: [
        { agentType: 'theme', action: 'analyze-theme' },
        { agentType: 'world', action: 'build-world', dependencies: ['theme'] },
        { agentType: 'character', action: 'create-characters', dependencies: ['theme', 'world'] },
        { agentType: 'relationship', action: 'map-relationships', dependencies: ['character'] },
        { agentType: 'outline', action: 'create-outline', dependencies: ['theme', 'world', 'character'] },
        { agentType: 'plot', action: 'analyze-plot', dependencies: ['outline'] },
      ],
      triggers: ['new-project', 'major-revision'],
    });

    // 角色开发工作流
    this.workflows.set('character-development', {
      id: 'character-development',
      name: '角色开发工作流',
      description: '专注于角色创建和关系构建',
      steps: [
        { agentType: 'character', action: 'create-character' },
        { agentType: 'relationship', action: 'analyze-relationships', dependencies: ['character'] },
        { agentType: 'dialogue', action: 'develop-voice', dependencies: ['character'] },
      ],
      triggers: ['new-character', 'character-revision'],
    });

    // 情节优化工作流
    this.workflows.set('plot-optimization', {
      id: 'plot-optimization',
      name: '情节优化工作流',
      description: '分析和优化故事情节',
      steps: [
        { agentType: 'plot', action: 'analyze-structure' },
        { agentType: 'outline', action: 'suggest-improvements', dependencies: ['plot'] },
        { agentType: 'character', action: 'check-arcs', dependencies: ['plot'], parallel: true },
      ],
      triggers: ['plot-review', 'structure-analysis'],
    });
  }
}

