/**
 * 情节顾问智能体
 * 专注于分析情节合理性和吸引力，提供改进建议
 */

import { BaseAgent, AgentContext, AgentOutput, CollaborationMessage } from './BaseAgent';
import { AIService } from '@services/AIService';
import { AIAgent } from '@shared/types';

export class PlotAdvisorAgent extends BaseAgent {
  constructor(config: AIAgent, aiService: AIService) {
    super(config, aiService);
  }

  async processInput(context: AgentContext): Promise<AgentOutput> {
    if (!this.validateContext(context)) {
      return this.handleError(new Error('Invalid context'), 'processInput');
    }

    try {
      const plotPrompt = this.buildPlotPrompt(context);
      const response = await this.sendAIRequest(plotPrompt, context);
      
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          plotAnalysis: parsed.data.plotAnalysis || {},
          strengths: parsed.data.strengths || [],
          weaknesses: parsed.data.weaknesses || [],
          improvements: parsed.data.improvements || [],
          pacing: parsed.data.pacing || {},
          logic: parsed.data.logic || {},
          engagement: parsed.data.engagement || {},
        },
        0.87
      );
    } catch (error) {
      return this.handleError(error, '情节分析');
    }
  }

  generateSystemPrompt(context: AgentContext): string {
    const collaborationPrompt = this.generateCollaborationPrompt(context.collaborationData || {});
    
    return `你是一位专业的情节分析顾问，擅长评估故事情节的合理性、吸引力和节奏感。

【核心职责】
1. 分析情节的逻辑性和合理性
2. 评估故事的吸引力和读者参与度
3. 检查情节节奏和张力分布
4. 识别情节中的薄弱环节和改进空间
5. 提供具体的情节优化建议

【分析框架】
- 逻辑一致性：情节发展的因果关系和合理性
- 冲突设计：冲突的层次性和解决的满意度
- 节奏控制：紧张与舒缓的平衡分布
- 角色驱动：情节与角色动机的匹配度
- 读者体验：悬念、惊喜和情感投入

【输出格式】
请按以下格式组织回答：

1. 情节整体评估
2. 具体问题分析
3. 改进建议方案

【建议】
- 具体的情节改进建议
- 需要加强的故事元素
- 节奏和张力的调整方向

【数据】
{
  "plotAnalysis": {
    "overallRating": "整体评分(1-10)",
    "genre": "类型适配度",
    "complexity": "复杂度评估",
    "originality": "原创性评分(1-10)",
    "marketAppeal": "市场吸引力(1-10)"
  },
  "strengths": [
    {
      "aspect": "优势方面",
      "description": "具体描述",
      "impact": "影响程度",
      "examples": ["示例1", "示例2"]
    }
  ],
  "weaknesses": [
    {
      "aspect": "薄弱方面",
      "description": "问题描述",
      "severity": "严重程度(1-10)",
      "consequences": ["后果1", "后果2"],
      "solutions": ["解决方案1", "解决方案2"]
    }
  ],
  "improvements": [
    {
      "area": "改进领域",
      "priority": "优先级(1-10)",
      "description": "改进描述",
      "methods": ["方法1", "方法2"],
      "expectedOutcome": "预期效果"
    }
  ],
  "pacing": {
    "overallRhythm": "整体节奏评估",
    "slowSections": ["缓慢段落位置"],
    "rushSections": ["匆忙段落位置"],
    "climaxTiming": "高潮时机评估",
    "recommendations": ["节奏建议1", "节奏建议2"]
  },
  "logic": {
    "consistency": "逻辑一致性评分(1-10)",
    "plotHoles": ["逻辑漏洞1", "逻辑漏洞2"],
    "causality": "因果关系评估",
    "believability": "可信度评分(1-10)"
  },
  "engagement": {
    "hooks": ["吸引点1", "吸引点2"],
    "suspense": "悬念设计评估",
    "emotionalImpact": "情感冲击力(1-10)",
    "readerInvestment": "读者投入度预测"
  }
}

【项目信息】
- 项目标题：${context.project.title}
- 项目类型：${context.project.genre}
- 目标读者：${context.project.targetAudience}
- 项目描述：${context.project.description || '暂无'}

${collaborationPrompt}

请基于以上信息，为这个项目提供专业的情节分析和改进建议。`;
  }

  async handleCollaboration(
    message: CollaborationMessage,
    context: AgentContext
  ): Promise<AgentOutput | null> {
    try {
      if (message.messageType === 'request') {
        const content = message.content;
        
        if (content.includes('[plot-review]')) {
          // 审查情节
          return await this.reviewPlot(context);
        } else if (content.includes('[pacing-analysis]')) {
          // 分析节奏
          return await this.analyzePacing(context);
        } else if (content.includes('[logic-check]')) {
          // 检查逻辑
          return await this.checkLogic(context);
        } else if (content.includes('[engagement-optimization]')) {
          // 优化吸引力
          return await this.optimizeEngagement(context);
        }
      }
      
      return null;
    } catch (error) {
      return this.handleError(error, '协作处理');
    }
  }

  protected getCollaborationTags(): string[] {
    return ['outline', 'character', 'theme', 'world'];
  }

  protected getSuggestedCollaborators(): string[] {
    return ['outline-architect', 'character-designer', 'theme-planner'];
  }

  private buildPlotPrompt(context: AgentContext): string {
    let prompt = `请为以下小说项目进行深入的情节分析：

用户需求：${context.userInput}

项目信息：
- 标题：${context.project.title}
- 类型：${context.project.genre}
- 目标读者：${context.project.targetAudience}
- 描述：${context.project.description || '暂无详细描述'}
- 当前状态：${context.project.status}`;

    // 添加情节线信息
    if (context.plotLines && context.plotLines.length > 0) {
      prompt += `\n\n现有情节线：`;
      context.plotLines.forEach((plot: any, index: number) => {
        prompt += `\n${index + 1}. ${plot.title}(${plot.type})`;
        prompt += `\n   描述：${plot.description}`;
        if (plot.status) prompt += `\n   状态：${plot.status}`;
      });
    }

    // 添加角色信息
    if (context.characters && context.characters.length > 0) {
      prompt += `\n\n主要角色：`;
      context.characters.slice(0, 5).forEach((char: any, index: number) => {
        prompt += `\n${index + 1}. ${char.name}`;
        if (char.goals) prompt += ` (目标：${char.goals})`;
        if (char.conflicts) prompt += ` (冲突：${char.conflicts})`;
      });
    }

    // 添加章节信息
    if (context.currentChapter) {
      prompt += `\n\n当前章节信息：`;
      prompt += `\n标题：${context.currentChapter.title}`;
      if (context.currentChapter.summary) {
        prompt += `\n摘要：${context.currentChapter.summary}`;
      }
    }

    prompt += `

请从情节顾问的专业角度，提供全面的情节分析和建议。重点包括：
1. 情节的整体逻辑性和合理性评估
2. 故事节奏和张力分布分析
3. 冲突设计的有效性和层次性
4. 角色动机与情节发展的匹配度
5. 读者吸引力和参与度预测
6. 具体的改进建议和优化方案
7. 潜在的情节陷阱和解决方法`;

    return prompt;
  }

  private async reviewPlot(context: AgentContext): Promise<AgentOutput> {
    const reviewPrompt = `请全面审查当前项目的情节设计：

项目类型：${context.project.genre}
目标读者：${context.project.targetAudience}

情节线：${context.plotLines ? 
      JSON.stringify(context.plotLines, null, 2) 
      : '暂无情节线'}

角色设定：${context.characters ? 
      context.characters.map((c: any) => `${c.name}: ${c.description}`).join('\n') 
      : '暂无角色'}

请从情节的完整性、逻辑性、吸引力等角度进行全面评估。`;

    try {
      const response = await this.sendAIRequest(reviewPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          reviewSummary: parsed.data.reviewSummary || {},
          scores: parsed.data.scores || {},
          criticalIssues: parsed.data.criticalIssues || [],
          recommendations: parsed.data.recommendations || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '情节审查');
    }
  }

  private async analyzePacing(context: AgentContext): Promise<AgentOutput> {
    const pacingPrompt = `请分析当前项目的故事节奏：

项目类型：${context.project.genre}
章节数：${context.project.chapterCount}

情节发展：${context.plotLines ? 
      JSON.stringify(context.plotLines, null, 2) 
      : '暂无情节信息'}

请分析节奏的快慢分布、张力变化和读者体验。`;

    try {
      const response = await this.sendAIRequest(pacingPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          pacingAnalysis: parsed.data.pacingAnalysis || {},
          rhythmMap: parsed.data.rhythmMap || [],
          adjustments: parsed.data.adjustments || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '节奏分析');
    }
  }

  private async checkLogic(context: AgentContext): Promise<AgentOutput> {
    const logicPrompt = `请检查当前情节的逻辑一致性：

项目设定：${context.project.description}
世界观：${context.worldBuilding ? 
      context.worldBuilding.map((w: any) => `${w.title}: ${w.description}`).join('\n') 
      : '暂无世界观'}

情节线：${context.plotLines ? 
      JSON.stringify(context.plotLines, null, 2) 
      : '暂无情节'}

请识别逻辑漏洞、因果关系问题和不合理之处。`;

    try {
      const response = await this.sendAIRequest(logicPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          logicCheck: parsed.data.logicCheck || {},
          issues: parsed.data.issues || [],
          fixes: parsed.data.fixes || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '逻辑检查');
    }
  }

  private async optimizeEngagement(context: AgentContext): Promise<AgentOutput> {
    const engagementPrompt = `请优化故事的读者吸引力：

项目类型：${context.project.genre}
目标读者：${context.project.targetAudience}

当前情节：${context.plotLines ? 
      JSON.stringify(context.plotLines, null, 2) 
      : '暂无情节'}

请分析如何提升故事的吸引力、悬念和情感冲击力。`;

    try {
      const response = await this.sendAIRequest(engagementPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          engagementAnalysis: parsed.data.engagementAnalysis || {},
          optimizations: parsed.data.optimizations || [],
          techniques: parsed.data.techniques || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '吸引力优化');
    }
  }
}

