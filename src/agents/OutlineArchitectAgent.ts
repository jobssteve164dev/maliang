/**
 * 大纲架构师智能体
 * 专注于构建故事结构和情节线，确保故事逻辑性和吸引力
 */

import { BaseAgent, AgentContext, AgentOutput, CollaborationMessage } from './BaseAgent';
import { AIService } from '@services/AIService';
import { AIAgent } from '@shared/types';

export class OutlineArchitectAgent extends BaseAgent {
  constructor(config: AIAgent, aiService: AIService) {
    super(config, aiService);
  }

  async processInput(context: AgentContext): Promise<AgentOutput> {
    if (!this.validateContext(context)) {
      return this.handleError(new Error('Invalid context'), 'processInput');
    }

    try {
      const outlinePrompt = this.buildOutlinePrompt(context);
      const response = await this.sendAIRequest(outlinePrompt, context);
      
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          storyStructure: parsed.data.storyStructure || {},
          plotLines: parsed.data.plotLines || [],
          chapterOutline: parsed.data.chapterOutline || [],
          pacing: parsed.data.pacing || {},
          conflicts: parsed.data.conflicts || [],
          climaxPoints: parsed.data.climaxPoints || [],
        },
        0.88
      );
    } catch (error) {
      return this.handleError(error, '大纲构建');
    }
  }

  generateSystemPrompt(context: AgentContext): string {
    const collaborationPrompt = this.generateCollaborationPrompt(context.collaborationData || {});
    
    return `你是一位专业的故事大纲架构师，精通各种叙事结构和情节设计技巧。

【核心职责】
1. 设计完整的故事结构框架
2. 规划主线和支线情节的发展
3. 确保故事节奏和张力的合理分布
4. 设计关键冲突和转折点
5. 协调角色弧线与整体情节的融合

【架构原则】
- 三幕式结构：开端(25%) - 发展(50%) - 高潮结局(25%)
- 冲突层次：人物内心冲突、人际冲突、环境冲突
- 节奏控制：紧张与舒缓的有机交替
- 因果逻辑：每个情节点都有合理的前因后果
- 读者参与：保持悬念和情感投入

【输出格式】
请按以下格式组织回答：

1. 故事结构分析
2. 情节线规划
3. 章节大纲建议

【建议】
- 具体的结构优化建议
- 情节发展的关键节点
- 需要重点关注的叙事技巧

【数据】
{
  "storyStructure": {
    "type": "结构类型(三幕式/英雄之旅/其他)",
    "acts": [
      {
        "name": "幕名",
        "percentage": "占比",
        "purpose": "主要功能",
        "keyEvents": ["关键事件1", "关键事件2"]
      }
    ]
  },
  "plotLines": [
    {
      "type": "main/subplot/character_arc",
      "title": "情节线标题",
      "description": "情节线描述",
      "startChapter": "起始章节",
      "endChapter": "结束章节",
      "keyMilestones": ["里程碑1", "里程碑2"]
    }
  ],
  "chapterOutline": [
    {
      "chapter": "章节号",
      "title": "章节标题",
      "purpose": "章节功能",
      "keyEvents": ["主要事件"],
      "characterArcs": ["涉及的角色发展"],
      "wordCountEstimate": "预估字数"
    }
  ],
  "pacing": {
    "overallRhythm": "整体节奏描述",
    "tensionCurve": "张力曲线分析",
    "restPoints": ["缓冲点位置"]
  },
  "conflicts": [
    {
      "type": "冲突类型",
      "description": "冲突描述",
      "resolution": "解决方式",
      "impact": "影响程度(1-10)"
    }
  ],
  "climaxPoints": [
    {
      "location": "位置(章节)",
      "type": "高潮类型",
      "description": "高潮描述",
      "buildup": "铺垫要求",
      "aftermath": "后续影响"
    }
  ]
}

【项目信息】
- 项目标题：${context.project.title}
- 项目类型：${context.project.genre}
- 目标读者：${context.project.targetAudience}
- 当前状态：${context.project.status}
- 已有章节：${context.project.chapterCount}

${collaborationPrompt}

请基于以上信息，为这个项目提供专业的大纲架构建议。`;
  }

  async handleCollaboration(
    message: CollaborationMessage,
    context: AgentContext
  ): Promise<AgentOutput | null> {
    try {
      if (message.messageType === 'request') {
        const content = message.content;
        
        if (content.includes('[structure-analysis]')) {
          // 分析现有结构
          return await this.analyzeCurrentStructure(context);
        } else if (content.includes('[plot-integration]')) {
          // 整合情节线
          return await this.integratePlotLines(message.data?.plotLines, context);
        } else if (content.includes('[pacing-optimization]')) {
          // 优化节奏
          return await this.optimizePacing(context);
        }
      }
      
      return null;
    } catch (error) {
      return this.handleError(error, '协作处理');
    }
  }

  protected getCollaborationTags(): string[] {
    return ['theme', 'character', 'world', 'plot', 'dialogue'];
  }

  protected getSuggestedCollaborators(): string[] {
    return ['theme-planner', 'character-designer', 'plot-advisor'];
  }

  private buildOutlinePrompt(context: AgentContext): string {
    let prompt = `请为以下小说项目构建详细的故事大纲：

用户需求：${context.userInput}

项目信息：
- 标题：${context.project.title}
- 类型：${context.project.genre}
- 目标读者：${context.project.targetAudience}
- 描述：${context.project.description || '暂无详细描述'}
- 当前状态：${context.project.status}
- 目标字数：${context.project.wordCount || '待定'}`;

    // 添加现有内容分析
    if (context.characters && context.characters.length > 0) {
      prompt += `\n\n现有角色信息：`;
      context.characters.slice(0, 3).forEach((char: any, index: number) => {
        prompt += `\n${index + 1}. ${char.name}：${char.description || '暂无描述'}`;
      });
      if (context.characters.length > 3) {
        prompt += `\n... 等共${context.characters.length}个角色`;
      }
    }

    if (context.worldBuilding && context.worldBuilding.length > 0) {
      prompt += `\n\n世界设定要素：`;
      context.worldBuilding.slice(0, 3).forEach((world: any, index: number) => {
        prompt += `\n${index + 1}. ${world.title}(${world.category})：${world.description}`;
      });
      if (context.worldBuilding.length > 3) {
        prompt += `\n... 等共${context.worldBuilding.length}个设定`;
      }
    }

    if (context.plotLines && context.plotLines.length > 0) {
      prompt += `\n\n现有情节线：`;
      context.plotLines.forEach((plot: any, index: number) => {
        prompt += `\n${index + 1}. ${plot.title}(${plot.type})：${plot.description}`;
      });
    }

    prompt += `

请从大纲架构师的专业角度，提供完整的故事结构设计。重点包括：
1. 整体故事结构的选择和设计理由
2. 主线和支线情节的详细规划
3. 章节级别的大纲建议
4. 故事节奏和张力的分布
5. 关键冲突和转折点的设置
6. 与现有角色和世界设定的整合方案`;

    return prompt;
  }

  private async analyzeCurrentStructure(context: AgentContext): Promise<AgentOutput> {
    const analysisPrompt = `请分析当前项目的故事结构：

项目信息：
- 类型：${context.project.genre}
- 状态：${context.project.status}
- 章节数：${context.project.chapterCount}

现有情节线：${context.plotLines ? JSON.stringify(context.plotLines, null, 2) : '暂无'}

请分析结构的优势和需要改进的地方。`;

    try {
      const response = await this.sendAIRequest(analysisPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          structureAnalysis: parsed.data.structureAnalysis || {},
          strengths: parsed.data.strengths || [],
          weaknesses: parsed.data.weaknesses || [],
          recommendations: parsed.data.recommendations || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '结构分析');
    }
  }

  private async integratePlotLines(plotLines: any[], context: AgentContext): Promise<AgentOutput> {
    const integrationPrompt = `请帮助整合以下情节线到统一的故事结构中：

待整合的情节线：${JSON.stringify(plotLines, null, 2)}

项目类型：${context.project.genre}
目标读者：${context.project.targetAudience}

请提供整合方案和时间线安排。`;

    try {
      const response = await this.sendAIRequest(integrationPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          integratedStructure: parsed.data.integratedStructure || {},
          timeline: parsed.data.timeline || [],
          conflicts: parsed.data.conflicts || [],
          resolutions: parsed.data.resolutions || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '情节整合');
    }
  }

  private async optimizePacing(context: AgentContext): Promise<AgentOutput> {
    const pacingPrompt = `请为以下项目优化故事节奏：

项目类型：${context.project.genre}
目标读者：${context.project.targetAudience}
当前章节数：${context.project.chapterCount}

请分析当前节奏并提供优化建议。`;

    try {
      const response = await this.sendAIRequest(pacingPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          pacingAnalysis: parsed.data.pacingAnalysis || {},
          optimizations: parsed.data.optimizations || [],
          tensionPoints: parsed.data.tensionPoints || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '节奏优化');
    }
  }
}

