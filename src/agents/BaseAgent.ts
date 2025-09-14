/**
 * 智能体基础类
 * 定义所有智能体的通用接口和行为
 */

import { AIService } from '@services/AIService';
import { AIMessage, NovelProject, AIAgent } from '@shared/types';

// 智能体输入上下文
export interface AgentContext {
  project: NovelProject;
  currentChapter?: any;
  characters?: any[];
  worldBuilding?: any[];
  plotLines?: any[];
  userInput: string;
  conversationHistory?: AIMessage[];
  collaborationData?: Record<string, any>; // 来自其他智能体的数据
}

// 智能体输出结果
export interface AgentOutput {
  content: string;
  suggestions?: string[];
  data?: Record<string, any>; // 结构化数据供其他智能体使用
  confidence?: number; // 0-1，建议的置信度
  requiresFollowUp?: boolean; // 是否需要后续交互
  collaborationTags?: string[]; // 标记哪些智能体可能需要这些信息
}

// 智能体协作消息
export interface CollaborationMessage {
  fromAgent: string;
  toAgent: string;
  messageType: 'request' | 'response' | 'notification' | 'data_share';
  content: string;
  data?: Record<string, any>;
  timestamp: Date;
}

export abstract class BaseAgent {
  protected config: AIAgent;
  protected aiService: AIService;
  protected agentId: string;
  protected agentName: string;
  protected agentType: string;

  constructor(config: AIAgent, aiService: AIService) {
    this.config = config;
    this.aiService = aiService;
    this.agentId = config.id;
    this.agentName = config.name;
    this.agentType = config.type;
  }

  // 抽象方法：处理用户输入
  abstract processInput(context: AgentContext): Promise<AgentOutput>;

  // 抽象方法：生成系统提示词
  abstract generateSystemPrompt(context: AgentContext): string;

  // 抽象方法：处理协作消息
  abstract handleCollaboration(message: CollaborationMessage, context: AgentContext): Promise<AgentOutput | null>;

  // 通用方法：发送AI请求
  protected async sendAIRequest(
    message: string,
    context: AgentContext,
    customSystemPrompt?: string
  ): Promise<string> {
    const systemPrompt = customSystemPrompt || this.generateSystemPrompt(context);
    
    const response = await this.aiService.sendMessage(
      this.agentId,
      context.project.id,
      message,
      {
        systemPrompt,
        projectContext: this.extractProjectContext(context),
        agentType: this.agentType,
      }
    );

    return response.content;
  }

  // 提取项目上下文信息
  protected extractProjectContext(context: AgentContext): Record<string, any> {
    return {
      projectTitle: context.project.title,
      projectGenre: context.project.genre,
      projectDescription: context.project.description,
      targetAudience: context.project.targetAudience,
      projectStatus: context.project.status,
      wordCount: context.project.wordCount,
      chapterCount: context.project.chapterCount,
      charactersCount: context.characters?.length || 0,
      worldBuildingCount: context.worldBuilding?.length || 0,
      plotLinesCount: context.plotLines?.length || 0,
    };
  }

  // 格式化输出结果
  protected formatOutput(
    content: string,
    suggestions: string[] = [],
    data: Record<string, any> = {},
    confidence: number = 0.8
  ): AgentOutput {
    return {
      content,
      suggestions,
      data,
      confidence,
      requiresFollowUp: false,
      collaborationTags: this.getCollaborationTags(),
    };
  }

  // 获取协作标签（子类可重写）
  protected getCollaborationTags(): string[] {
    return [];
  }

  // 解析结构化输出
  protected parseStructuredOutput(content: string): {
    mainContent: string;
    suggestions: string[];
    data: Record<string, any>;
  } {
    const result = {
      mainContent: content,
      suggestions: [] as string[],
      data: {} as Record<string, any>,
    };

    // 尝试解析建议列表
    const suggestionsMatch = content.match(/【建议】([\s\S]*?)(?=【|$)/);
    if (suggestionsMatch) {
      const suggestionsText = suggestionsMatch[1].trim();
      result.suggestions = suggestionsText
        .split(/\n/)
        .map(s => s.replace(/^[-*•]\s*/, '').trim())
        .filter(s => s.length > 0);
    }

    // 尝试解析数据块
    const dataMatch = content.match(/【数据】([\s\S]*?)(?=【|$)/);
    if (dataMatch) {
      try {
        result.data = JSON.parse(dataMatch[1].trim());
      } catch (error) {
        console.warn('Failed to parse data block:', error);
      }
    }

    // 提取主要内容（移除特殊标记）
    result.mainContent = content
      .replace(/【建议】[\s\S]*?(?=【|$)/, '')
      .replace(/【数据】[\s\S]*?(?=【|$)/, '')
      .trim();

    return result;
  }

  // 生成协作提示
  protected generateCollaborationPrompt(
    collaborationData: Record<string, any>
  ): string {
    if (!collaborationData || Object.keys(collaborationData).length === 0) {
      return '';
    }

    let prompt = '\n\n【协作信息】\n';
    
    for (const [agentType, data] of Object.entries(collaborationData)) {
      if (data && typeof data === 'object') {
        prompt += `来自${agentType}智能体的信息：\n`;
        
        if (data.summary) {
          prompt += `- 总结：${data.summary}\n`;
        }
        
        if (data.keyPoints && Array.isArray(data.keyPoints)) {
          prompt += `- 关键点：${data.keyPoints.join('、')}\n`;
        }
        
        if (data.recommendations && Array.isArray(data.recommendations)) {
          prompt += `- 建议：${data.recommendations.join('、')}\n`;
        }
        
        prompt += '\n';
      }
    }

    return prompt;
  }

  // 验证输入上下文
  protected validateContext(context: AgentContext): boolean {
    return !!(context.project && context.userInput);
  }

  // 获取智能体信息
  getAgentInfo(): { id: string; name: string; type: string; description: string } {
    return {
      id: this.agentId,
      name: this.agentName,
      type: this.agentType,
      description: this.config.description,
    };
  }

  // 检查智能体是否启用
  isEnabled(): boolean {
    return this.config.enabled;
  }

  // 更新配置
  updateConfig(config: Partial<AIAgent>): void {
    this.config = { ...this.config, ...config };
  }

  // 获取建议的协作智能体
  protected getSuggestedCollaborators(): string[] {
    // 子类可重写此方法来指定特定的协作关系
    return [];
  }

  // 生成协作请求
  protected createCollaborationRequest(
    targetAgent: string,
    requestType: string,
    content: string,
    data?: Record<string, any>
  ): CollaborationMessage {
    return {
      fromAgent: this.agentId,
      toAgent: targetAgent,
      messageType: 'request',
      content: `[${requestType}] ${content}`,
      data,
      timestamp: new Date(),
    };
  }

  // 处理错误
  protected handleError(error: any, context: string): AgentOutput {
    console.error(`Agent ${this.agentId} error in ${context}:`, error);
    
    return {
      content: `抱歉，在${context}过程中遇到了问题。请稍后重试或检查配置。`,
      suggestions: ['检查网络连接', '验证AI模型配置', '重新尝试请求'],
      data: { error: error.message },
      confidence: 0,
      requiresFollowUp: true,
    };
  }
}

