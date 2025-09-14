/**
 * 关系网络师智能体
 * 专注于管理复杂的人物关系网络，设计角色间的互动
 */

import { BaseAgent, AgentContext, AgentOutput, CollaborationMessage } from './BaseAgent';
import { AIService } from '@services/AIService';
import { AIAgent } from '@shared/types';

export class RelationshipMapperAgent extends BaseAgent {
  constructor(config: AIAgent, aiService: AIService) {
    super(config, aiService);
  }

  async processInput(context: AgentContext): Promise<AgentOutput> {
    if (!this.validateContext(context)) {
      return this.handleError(new Error('Invalid context'), 'processInput');
    }

    try {
      const relationshipPrompt = this.buildRelationshipPrompt(context);
      const response = await this.sendAIRequest(relationshipPrompt, context);
      
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          relationshipNetwork: parsed.data.relationshipNetwork || {},
          keyRelationships: parsed.data.keyRelationships || [],
          conflictPoints: parsed.data.conflictPoints || [],
          alliances: parsed.data.alliances || [],
          dynamics: parsed.data.dynamics || [],
          evolutionPlan: parsed.data.evolutionPlan || {},
        },
        0.84
      );
    } catch (error) {
      return this.handleError(error, '关系网络分析');
    }
  }

  generateSystemPrompt(context: AgentContext): string {
    const collaborationPrompt = this.generateCollaborationPrompt(context.collaborationData || {});
    
    return `你是一位专业的人物关系分析师，擅长设计和管理复杂的角色关系网络。

【核心职责】
1. 分析和设计角色间的各种关系类型
2. 规划关系的发展轨迹和变化节点
3. 识别关系中的冲突点和张力来源
4. 设计有趣的互动模式和对话场景
5. 确保关系网络为故事情节服务

【分析维度】
- 关系类型：血缘、友情、爱情、师徒、敌对、合作等
- 关系强度：从陌生到亲密的不同层次
- 关系动态：静态关系vs动态发展关系
- 权力结构：上下级、平等、依赖等权力关系
- 情感色彩：正面、负面、复杂矛盾的情感

【输出格式】
请按以下格式组织回答：

1. 关系网络概览
2. 核心关系分析
3. 关系发展规划

【建议】
- 关系发展的具体建议
- 需要重点刻画的互动场景
- 关系冲突的处理方式

【数据】
{
  "relationshipNetwork": {
    "totalCharacters": "角色总数",
    "networkComplexity": "网络复杂度(1-10)",
    "centralCharacters": ["核心角色1", "核心角色2"],
    "isolatedCharacters": ["孤立角色1", "孤立角色2"]
  },
  "keyRelationships": [
    {
      "character1": "角色1",
      "character2": "角色2",
      "type": "关系类型",
      "strength": "关系强度(1-10)",
      "status": "当前状态",
      "history": "关系历史",
      "significance": "故事意义",
      "conflictPotential": "冲突潜力(1-10)"
    }
  ],
  "conflictPoints": [
    {
      "participants": ["参与角色1", "参与角色2"],
      "conflictType": "冲突类型",
      "cause": "冲突原因",
      "intensity": "冲突强度(1-10)",
      "resolution": "可能解决方式",
      "storyImpact": "对故事的影响"
    }
  ],
  "alliances": [
    {
      "members": ["成员1", "成员2", "成员3"],
      "purpose": "联盟目的",
      "strength": "联盟强度(1-10)",
      "stability": "稳定性评估",
      "threats": ["威胁因素1", "威胁因素2"]
    }
  ],
  "dynamics": [
    {
      "pattern": "互动模式",
      "participants": ["参与者1", "参与者2"],
      "triggers": ["触发条件1", "触发条件2"],
      "outcomes": ["可能结果1", "可能结果2"],
      "frequency": "发生频率"
    }
  ],
  "evolutionPlan": {
    "phases": [
      {
        "phase": "阶段名称",
        "timeframe": "时间范围",
        "keyChanges": ["主要变化1", "主要变化2"],
        "catalysts": ["催化事件1", "催化事件2"]
      }
    ]
  }
}

【项目信息】
- 项目标题：${context.project.title}
- 项目类型：${context.project.genre}
- 目标读者：${context.project.targetAudience}
- 项目描述：${context.project.description || '暂无'}

${collaborationPrompt}

请基于以上信息，为这个项目提供专业的人物关系网络分析和设计建议。`;
  }

  async handleCollaboration(
    message: CollaborationMessage,
    context: AgentContext
  ): Promise<AgentOutput | null> {
    try {
      if (message.messageType === 'request') {
        const content = message.content;
        
        if (content.includes('[relationship-analysis]')) {
          // 分析特定关系
          return await this.analyzeSpecificRelationship(message.data?.characters, context);
        } else if (content.includes('[conflict-design]')) {
          // 设计关系冲突
          return await this.designConflict(message.data?.conflictType, context);
        } else if (content.includes('[network-optimization]')) {
          // 优化关系网络
          return await this.optimizeNetwork(context);
        }
      }
      
      return null;
    } catch (error) {
      return this.handleError(error, '协作处理');
    }
  }

  protected getCollaborationTags(): string[] {
    return ['character', 'dialogue', 'plot', 'outline'];
  }

  protected getSuggestedCollaborators(): string[] {
    return ['character-designer', 'dialogue-master', 'plot-advisor'];
  }

  private buildRelationshipPrompt(context: AgentContext): string {
    let prompt = `请为以下小说项目分析和设计人物关系网络：

用户需求：${context.userInput}

项目信息：
- 标题：${context.project.title}
- 类型：${context.project.genre}
- 目标读者：${context.project.targetAudience}
- 描述：${context.project.description || '暂无详细描述'}`;

    // 添加角色信息
    if (context.characters && context.characters.length > 0) {
      prompt += `\n\n现有角色：`;
      context.characters.forEach((char: any, index: number) => {
        prompt += `\n${index + 1}. ${char.name}`;
        if (char.description) prompt += ` - ${char.description}`;
        if (char.background) prompt += ` (背景：${char.background})`;
        if (char.personality && char.personality.length > 0) {
          prompt += ` (性格：${char.personality.join('、')})`;
        }
      });
    }

    // 添加世界观背景
    if (context.worldBuilding && context.worldBuilding.length > 0) {
      prompt += `\n\n世界观背景：`;
      context.worldBuilding.slice(0, 3).forEach((world: any, index: number) => {
        prompt += `\n${index + 1}. ${world.title}：${world.description}`;
      });
    }

    // 添加情节信息
    if (context.plotLines && context.plotLines.length > 0) {
      prompt += `\n\n相关情节：`;
      context.plotLines.forEach((plot: any, index: number) => {
        prompt += `\n${index + 1}. ${plot.title}：${plot.description}`;
      });
    }

    prompt += `

请从关系网络师的专业角度，提供完整的人物关系分析和设计。重点包括：
1. 角色间的各种关系类型和强度分析
2. 关系网络的整体结构和核心节点
3. 潜在的冲突点和张力来源
4. 关系的发展轨迹和变化节点
5. 有趣的互动模式和对话场景
6. 关系网络如何服务于故事情节
7. 需要特别关注的关系动态`;

    return prompt;
  }

  private async analyzeSpecificRelationship(
    characters: string[],
    context: AgentContext
  ): Promise<AgentOutput> {
    const analysisPrompt = `请深入分析以下角色间的关系：

涉及角色：${characters.join('、')}

角色详情：${context.characters ? 
      context.characters
        .filter((c: any) => characters.includes(c.name))
        .map((c: any) => `${c.name}: ${c.description || '暂无描述'}`)
        .join('\n') 
      : '角色信息缺失'}

项目类型：${context.project.genre}

请分析这些角色间的关系动态、发展潜力和故事价值。`;

    try {
      const response = await this.sendAIRequest(analysisPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          analyzedCharacters: characters,
          relationshipAnalysis: parsed.data.relationshipAnalysis || {},
          developmentPotential: parsed.data.developmentPotential || {},
          storyValue: parsed.data.storyValue || {},
        }
      );
    } catch (error) {
      return this.handleError(error, '特定关系分析');
    }
  }

  private async designConflict(conflictType: string, context: AgentContext): Promise<AgentOutput> {
    const conflictPrompt = `请设计以下类型的人物关系冲突：

冲突类型：${conflictType}

可用角色：${context.characters ? 
      context.characters.map((c: any) => `${c.name}: ${c.description || '暂无描述'}`).join('\n') 
      : '暂无角色'}

项目背景：${context.project.description}

请设计具体的冲突场景、发展过程和可能的解决方案。`;

    try {
      const response = await this.sendAIRequest(conflictPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          conflictType,
          conflictDesign: parsed.data.conflictDesign || {},
          scenarios: parsed.data.scenarios || [],
          resolutions: parsed.data.resolutions || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '冲突设计');
    }
  }

  private async optimizeNetwork(context: AgentContext): Promise<AgentOutput> {
    const optimizationPrompt = `请优化当前的人物关系网络：

现有角色：${context.characters ? 
      JSON.stringify(context.characters, null, 2) 
      : '暂无角色'}

项目类型：${context.project.genre}
故事情节：${context.plotLines ? 
      JSON.stringify(context.plotLines, null, 2) 
      : '暂无情节'}

请分析网络结构的优势和不足，提供优化建议。`;

    try {
      const response = await this.sendAIRequest(optimizationPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          networkAnalysis: parsed.data.networkAnalysis || {},
          optimizations: parsed.data.optimizations || [],
          recommendations: parsed.data.recommendations || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '网络优化');
    }
  }
}

