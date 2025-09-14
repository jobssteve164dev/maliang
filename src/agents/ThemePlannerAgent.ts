/**
 * 主题策划师智能体
 * 专注于分析市场趋势，提供主题建议和创作方向
 */

import { BaseAgent, AgentContext, AgentOutput, CollaborationMessage } from './BaseAgent';
import { AIService } from '@services/AIService';
import { AIAgent } from '@shared/types';

export class ThemePlannerAgent extends BaseAgent {
  constructor(config: AIAgent, aiService: AIService) {
    super(config, aiService);
  }

  async processInput(context: AgentContext): Promise<AgentOutput> {
    if (!this.validateContext(context)) {
      return this.handleError(new Error('Invalid context'), 'processInput');
    }

    try {
      const analysisPrompt = this.buildAnalysisPrompt(context);
      const response = await this.sendAIRequest(analysisPrompt, context);
      
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          themeAnalysis: parsed.data.themeAnalysis || {},
          marketTrends: parsed.data.marketTrends || [],
          targetAudienceInsights: parsed.data.targetAudienceInsights || {},
          recommendedDirections: parsed.data.recommendedDirections || [],
          genreConsiderations: parsed.data.genreConsiderations || {},
        },
        0.85
      );
    } catch (error) {
      return this.handleError(error, '主题分析');
    }
  }

  generateSystemPrompt(context: AgentContext): string {
    const collaborationPrompt = this.generateCollaborationPrompt(context.collaborationData || {});
    
    return `你是一位专业的小说主题策划师，具有丰富的市场分析经验和创作指导能力。

【核心职责】
1. 分析当前市场趋势和读者偏好
2. 评估主题的商业潜力和创作可行性
3. 提供具体的主题发展方向和建议
4. 考虑目标读者群体的特点和需求
5. 结合类型特色提供个性化建议

【分析框架】
- 主题深度：探讨主题的哲学内涵和社会意义
- 市场适应性：分析主题在当前市场的接受度
- 创新潜力：评估主题的独特性和差异化空间
- 执行难度：考虑主题实现的技术和创作要求
- 读者共鸣：预测目标读者的情感反应

【输出格式】
请按以下格式组织回答：

1. 主题分析总结
2. 市场趋势洞察
3. 创作方向建议

【建议】
- 具体的主题发展建议
- 需要注意的创作要点
- 推荐的参考作品或案例

【数据】
{
  "themeAnalysis": {
    "coreTheme": "核心主题",
    "subThemes": ["子主题1", "子主题2"],
    "philosophicalDepth": "哲学深度评分(1-10)",
    "emotionalImpact": "情感冲击力评分(1-10)"
  },
  "marketTrends": [
    {
      "trend": "趋势名称",
      "relevance": "相关度评分(1-10)",
      "description": "趋势描述"
    }
  ],
  "targetAudienceInsights": {
    "primaryAudience": "主要读者群体",
    "interests": ["兴趣点1", "兴趣点2"],
    "readingHabits": "阅读习惯分析"
  },
  "recommendedDirections": [
    {
      "direction": "发展方向",
      "rationale": "推荐理由",
      "difficulty": "实现难度(1-10)"
    }
  ],
  "genreConsiderations": {
    "strengths": ["类型优势1", "类型优势2"],
    "challenges": ["类型挑战1", "类型挑战2"],
    "opportunities": ["机会点1", "机会点2"]
  }
}

【项目信息】
- 项目标题：${context.project.title}
- 项目类型：${context.project.genre}
- 目标读者：${context.project.targetAudience}
- 项目描述：${context.project.description || '暂无'}

${collaborationPrompt}

请基于以上信息，为这个项目提供专业的主题策划建议。`;
  }

  async handleCollaboration(
    message: CollaborationMessage,
    context: AgentContext
  ): Promise<AgentOutput | null> {
    try {
      if (message.messageType === 'request') {
        const content = message.content;
        
        if (content.includes('[theme-evaluation]')) {
          // 评估其他智能体提出的主题
          return await this.evaluateTheme(message.data?.theme, context);
        } else if (content.includes('[market-analysis]')) {
          // 提供市场分析
          return await this.provideMarketAnalysis(context);
        }
      }
      
      return null;
    } catch (error) {
      return this.handleError(error, '协作处理');
    }
  }

  protected getCollaborationTags(): string[] {
    return ['world', 'character', 'outline', 'plot'];
  }

  protected getSuggestedCollaborators(): string[] {
    return ['world-builder', 'character-designer', 'outline-architect'];
  }

  private buildAnalysisPrompt(context: AgentContext): string {
    let prompt = `请为以下小说项目进行深入的主题分析和策划：

用户需求：${context.userInput}

项目背景：
- 标题：${context.project.title}
- 类型：${context.project.genre}
- 目标读者：${context.project.targetAudience}
- 描述：${context.project.description || '暂无详细描述'}`;

    // 添加现有内容信息
    if (context.characters && context.characters.length > 0) {
      prompt += `\n- 已有角色数量：${context.characters.length}`;
    }

    if (context.worldBuilding && context.worldBuilding.length > 0) {
      prompt += `\n- 已有世界设定数量：${context.worldBuilding.length}`;
    }

    if (context.plotLines && context.plotLines.length > 0) {
      prompt += `\n- 已有情节线数量：${context.plotLines.length}`;
    }

    prompt += `

请从主题策划师的专业角度，提供全面的分析和建议。重点关注：
1. 主题的深度和广度分析
2. 当前市场环境下的可行性
3. 目标读者的接受度预测
4. 具体的创作方向指导
5. 需要避免的常见陷阱`;

    return prompt;
  }

  private async evaluateTheme(theme: any, context: AgentContext): Promise<AgentOutput> {
    const evaluationPrompt = `请评估以下主题方案：

主题内容：${JSON.stringify(theme, null, 2)}

项目信息：
- 类型：${context.project.genre}
- 目标读者：${context.project.targetAudience}

请从市场角度和创作可行性角度给出专业评估。`;

    try {
      const response = await this.sendAIRequest(evaluationPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          evaluation: parsed.data.evaluation || {},
          marketScore: parsed.data.marketScore || 0,
          feasibilityScore: parsed.data.feasibilityScore || 0,
        }
      );
    } catch (error) {
      return this.handleError(error, '主题评估');
    }
  }

  private async provideMarketAnalysis(context: AgentContext): Promise<AgentOutput> {
    const analysisPrompt = `请为${context.project.genre}类型的小说提供当前市场分析：

目标读者：${context.project.targetAudience}

请重点分析：
1. 当前市场热点和趋势
2. 读者偏好变化
3. 成功案例分析
4. 市场机会点`;

    try {
      const response = await this.sendAIRequest(analysisPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          marketTrends: parsed.data.marketTrends || [],
          opportunities: parsed.data.opportunities || [],
          risks: parsed.data.risks || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '市场分析');
    }
  }
}

