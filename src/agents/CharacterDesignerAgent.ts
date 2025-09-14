/**
 * 人物设计师智能体
 * 专注于塑造立体的角色形象，设计人物背景和性格特征
 */

import { BaseAgent, AgentContext, AgentOutput, CollaborationMessage } from './BaseAgent';
import { AIService } from '@services/AIService';
import { AIAgent } from '@shared/types';

export class CharacterDesignerAgent extends BaseAgent {
  constructor(config: AIAgent, aiService: AIService) {
    super(config, aiService);
  }

  async processInput(context: AgentContext): Promise<AgentOutput> {
    if (!this.validateContext(context)) {
      return this.handleError(new Error('Invalid context'), 'processInput');
    }

    try {
      const characterPrompt = this.buildCharacterPrompt(context);
      const response = await this.sendAIRequest(characterPrompt, context);
      
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          characterProfile: parsed.data.characterProfile || {},
          personality: parsed.data.personality || {},
          background: parsed.data.background || {},
          motivations: parsed.data.motivations || {},
          relationships: parsed.data.relationships || [],
          characterArc: parsed.data.characterArc || {},
          dialogue: parsed.data.dialogue || {},
          physicalDescription: parsed.data.physicalDescription || {},
        },
        0.86
      );
    } catch (error) {
      return this.handleError(error, '人物设计');
    }
  }

  generateSystemPrompt(context: AgentContext): string {
    const collaborationPrompt = this.generateCollaborationPrompt(context.collaborationData || {});
    
    return `你是一位专业的人物设计师，擅长创造立体丰满的角色形象。

【核心职责】
1. 设计具有深度和复杂性的角色性格
2. 构建合理的人物背景和成长经历
3. 规划角色的成长弧线和发展轨迹
4. 设计角色间的关系网络和互动模式
5. 确保角色与世界观和故事主题的有机融合

【设计原则】
- 立体性：角色应有优点、缺点和矛盾之处
- 动机驱动：每个行为都有合理的内在动机
- 成长性：角色在故事中应有变化和发展
- 独特性：每个角色都有鲜明的个人特色
- 相关性：角色应与故事主题和情节紧密相关

【输出格式】
请按以下格式组织回答：

1. 角色概览
2. 性格与动机分析
3. 背景与关系设定

【建议】
- 角色发展的具体建议
- 需要重点刻画的特质
- 与其他角色的互动要点

【数据】
{
  "characterProfile": {
    "name": "角色姓名",
    "age": "年龄",
    "gender": "性别",
    "occupation": "职业",
    "role": "故事中的角色定位",
    "importance": "重要程度(1-5)"
  },
  "personality": {
    "coreTraits": ["核心特质1", "核心特质2"],
    "strengths": ["优点1", "优点2"],
    "weaknesses": ["缺点1", "缺点2"],
    "fears": ["恐惧1", "恐惧2"],
    "desires": ["渴望1", "渴望2"],
    "values": ["价值观1", "价值观2"],
    "contradictions": ["内在矛盾1", "内在矛盾2"]
  },
  "background": {
    "birthplace": "出生地",
    "family": "家庭背景",
    "education": "教育经历",
    "keyEvents": ["关键事件1", "关键事件2"],
    "formativeExperiences": ["塑造性经历1", "塑造性经历2"],
    "secrets": ["秘密1", "秘密2"]
  },
  "motivations": {
    "primaryGoal": "主要目标",
    "secondaryGoals": ["次要目标1", "次要目标2"],
    "obstacles": ["障碍1", "障碍2"],
    "stakes": "利害关系",
    "internalConflict": "内心冲突"
  },
  "relationships": [
    {
      "character": "相关角色",
      "relationship": "关系类型",
      "dynamic": "互动模式",
      "history": "关系历史",
      "tension": "关系张力"
    }
  ],
  "characterArc": {
    "startingPoint": "起始状态",
    "catalyst": "转变催化剂",
    "midpoint": "中点变化",
    "climax": "高潮时刻",
    "resolution": "最终状态",
    "theme": "角色主题"
  },
  "dialogue": {
    "speechPattern": "说话模式",
    "vocabulary": "词汇特色",
    "tone": "语调特点",
    "quirks": ["语言癖好1", "语言癖好2"]
  },
  "physicalDescription": {
    "appearance": "外貌描述",
    "distinctiveFeatures": ["显著特征1", "显著特征2"],
    "mannerisms": ["行为习惯1", "行为习惯2"],
    "clothing": "服装风格"
  }
}

【项目信息】
- 项目标题：${context.project.title}
- 项目类型：${context.project.genre}
- 目标读者：${context.project.targetAudience}
- 项目描述：${context.project.description || '暂无'}

${collaborationPrompt}

请基于以上信息，为这个项目提供专业的人物设计建议。`;
  }

  async handleCollaboration(
    message: CollaborationMessage,
    context: AgentContext
  ): Promise<AgentOutput | null> {
    try {
      if (message.messageType === 'request') {
        const content = message.content;
        
        if (content.includes('[character-development]')) {
          // 深化角色发展
          return await this.developCharacter(message.data?.characterId, context);
        } else if (content.includes('[relationship-analysis]')) {
          // 分析角色关系
          return await this.analyzeRelationships(context);
        } else if (content.includes('[arc-planning]')) {
          // 规划角色弧线
          return await this.planCharacterArc(message.data?.characterId, context);
        } else if (content.includes('[dialogue-style]')) {
          // 设计对话风格
          return await this.designDialogueStyle(message.data?.characterId, context);
        }
      }
      
      return null;
    } catch (error) {
      return this.handleError(error, '协作处理');
    }
  }

  protected getCollaborationTags(): string[] {
    return ['theme', 'world', 'outline', 'relationship', 'dialogue'];
  }

  protected getSuggestedCollaborators(): string[] {
    return ['world-builder', 'relationship-mapper', 'dialogue-master'];
  }

  private buildCharacterPrompt(context: AgentContext): string {
    let prompt = `请为以下小说项目设计详细的角色形象：

用户需求：${context.userInput}

项目信息：
- 标题：${context.project.title}
- 类型：${context.project.genre}
- 目标读者：${context.project.targetAudience}
- 描述：${context.project.description || '暂无详细描述'}`;

    // 添加现有角色信息
    if (context.characters && context.characters.length > 0) {
      prompt += `\n\n现有角色：`;
      context.characters.forEach((char: any, index: number) => {
        prompt += `\n${index + 1}. ${char.name}：${char.description || '暂无描述'}`;
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

    // 添加情节线信息
    if (context.plotLines && context.plotLines.length > 0) {
      prompt += `\n\n相关情节线：`;
      context.plotLines.slice(0, 2).forEach((plot: any, index: number) => {
        prompt += `\n${index + 1}. ${plot.title}：${plot.description}`;
      });
    }

    prompt += `

请从人物设计师的专业角度，提供完整的角色设计。重点包括：
1. 角色的核心性格特征和心理动机
2. 详细的背景故事和成长经历
3. 角色在故事中的发展弧线
4. 与其他角色的关系设定
5. 独特的对话风格和行为特征
6. 外貌描述和个人特色
7. 角色与世界观和主题的契合度`;

    return prompt;
  }

  private async developCharacter(characterId: string, context: AgentContext): Promise<AgentOutput> {
    const character = context.characters?.find((c: any) => c.id === characterId);
    
    const developmentPrompt = `请深化以下角色的设计：

角色信息：${character ? JSON.stringify(character, null, 2) : '角色信息缺失'}

项目类型：${context.project.genre}
世界观：${context.worldBuilding ? 
      context.worldBuilding.map((w: any) => `${w.title}: ${w.description}`).join('\n') 
      : '暂无世界观'}

请提供角色的深度发展建议，包括心理层面、关系层面和成长层面。`;

    try {
      const response = await this.sendAIRequest(developmentPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          characterId,
          development: parsed.data.development || {},
          psychologicalDepth: parsed.data.psychologicalDepth || {},
          growthPotential: parsed.data.growthPotential || {},
        }
      );
    } catch (error) {
      return this.handleError(error, '角色深化');
    }
  }

  private async analyzeRelationships(context: AgentContext): Promise<AgentOutput> {
    const relationshipPrompt = `请分析当前角色间的关系网络：

现有角色：${context.characters ? 
      JSON.stringify(context.characters, null, 2) 
      : '暂无角色'}

项目类型：${context.project.genre}

请分析角色间的潜在关系，设计有趣的互动模式和冲突点。`;

    try {
      const response = await this.sendAIRequest(relationshipPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          relationshipMap: parsed.data.relationshipMap || {},
          conflicts: parsed.data.conflicts || [],
          alliances: parsed.data.alliances || [],
          dynamics: parsed.data.dynamics || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '关系分析');
    }
  }

  private async planCharacterArc(characterId: string, context: AgentContext): Promise<AgentOutput> {
    const character = context.characters?.find((c: any) => c.id === characterId);
    
    const arcPrompt = `请为以下角色规划完整的成长弧线：

角色信息：${character ? JSON.stringify(character, null, 2) : '角色信息缺失'}

故事情节：${context.plotLines ? 
      JSON.stringify(context.plotLines, null, 2) 
      : '暂无情节信息'}

请设计角色从故事开始到结束的完整发展轨迹。`;

    try {
      const response = await this.sendAIRequest(arcPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          characterId,
          arc: parsed.data.arc || {},
          milestones: parsed.data.milestones || [],
          challenges: parsed.data.challenges || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '弧线规划');
    }
  }

  private async designDialogueStyle(characterId: string, context: AgentContext): Promise<AgentOutput> {
    const character = context.characters?.find((c: any) => c.id === characterId);
    
    const dialoguePrompt = `请为以下角色设计独特的对话风格：

角色信息：${character ? JSON.stringify(character, null, 2) : '角色信息缺失'}

世界观背景：${context.worldBuilding ? 
      context.worldBuilding.map((w: any) => `${w.title}: ${w.description}`).join('\n') 
      : '暂无世界观'}

请设计角色的说话方式、用词习惯、语调特点等。`;

    try {
      const response = await this.sendAIRequest(dialoguePrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          characterId,
          dialogueStyle: parsed.data.dialogueStyle || {},
          examples: parsed.data.examples || [],
          guidelines: parsed.data.guidelines || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '对话风格设计');
    }
  }
}

