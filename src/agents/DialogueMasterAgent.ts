/**
 * 对话大师智能体
 * 专注于优化角色对话和语言风格，提升对话的真实感
 */

import { BaseAgent, AgentContext, AgentOutput, CollaborationMessage } from './BaseAgent';
import { AIService } from '@services/AIService';
import { AIAgent } from '@shared/types';

export class DialogueMasterAgent extends BaseAgent {
  constructor(config: AIAgent, aiService: AIService) {
    super(config, aiService);
  }

  async processInput(context: AgentContext): Promise<AgentOutput> {
    if (!this.validateContext(context)) {
      return this.handleError(new Error('Invalid context'), 'processInput');
    }

    try {
      const dialoguePrompt = this.buildDialoguePrompt(context);
      const response = await this.sendAIRequest(dialoguePrompt, context);
      
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          dialogueStyles: parsed.data.dialogueStyles || {},
          characterVoices: parsed.data.characterVoices || [],
          conversationPatterns: parsed.data.conversationPatterns || [],
          languageFeatures: parsed.data.languageFeatures || {},
          examples: parsed.data.examples || [],
          guidelines: parsed.data.guidelines || {},
        },
        0.89
      );
    } catch (error) {
      return this.handleError(error, '对话设计');
    }
  }

  generateSystemPrompt(context: AgentContext): string {
    const collaborationPrompt = this.generateCollaborationPrompt(context.collaborationData || {});
    
    return `你是一位专业的对话写作专家，擅长为不同角色设计独特的语言风格和对话模式。

【核心职责】
1. 为每个角色设计独特的说话方式和语言特色
2. 优化对话的自然度和真实感
3. 设计符合角色性格的对话模式
4. 确保对话推进情节和揭示角色
5. 平衡对话的功能性和艺术性

【对话原则】
- 角色区分度：每个角色都有独特的语言标识
- 情境适应性：对话应符合场景和情绪氛围
- 功能性：对话应推进情节或揭示信息
- 自然性：避免生硬的信息堆砌
- 层次感：表面含义与深层含义的结合

【输出格式】
请按以下格式组织回答：

1. 对话风格分析
2. 角色语言特色
3. 对话技巧建议

【建议】
- 具体的对话改进建议
- 需要注意的语言特点
- 对话场景的设计要点

【数据】
{
  "dialogueStyles": {
    "overallTone": "整体语调",
    "formalityLevel": "正式程度(1-10)",
    "culturalInfluence": "文化影响",
    "timeperiodFeatures": "时代特征"
  },
  "characterVoices": [
    {
      "character": "角色名",
      "speechPattern": "说话模式",
      "vocabulary": "词汇特色",
      "tone": "语调特点",
      "pace": "说话节奏",
      "quirks": ["语言癖好1", "语言癖好2"],
      "emotionalRange": "情感表达范围",
      "examples": ["示例对话1", "示例对话2"]
    }
  ],
  "conversationPatterns": [
    {
      "situation": "对话情境",
      "participants": ["参与者1", "参与者2"],
      "dynamic": "对话动态",
      "purpose": "对话目的",
      "techniques": ["技巧1", "技巧2"],
      "example": "示例对话"
    }
  ],
  "languageFeatures": {
    "dialect": "方言特色",
    "slang": "俚语使用",
    "formality": "正式程度变化",
    "emotionalMarkers": ["情感标记1", "情感标记2"],
    "culturalReferences": ["文化引用1", "文化引用2"]
  },
  "examples": [
    {
      "scenario": "场景描述",
      "dialogue": "对话内容",
      "analysis": "分析说明",
      "techniques": ["使用技巧1", "使用技巧2"]
    }
  ],
  "guidelines": [
    {
      "principle": "原则名称",
      "description": "原则描述",
      "application": "应用方法",
      "examples": ["应用示例1", "应用示例2"]
    }
  ]
}

【项目信息】
- 项目标题：${context.project.title}
- 项目类型：${context.project.genre}
- 目标读者：${context.project.targetAudience}
- 项目描述：${context.project.description || '暂无'}

${collaborationPrompt}

请基于以上信息，为这个项目提供专业的对话设计和语言风格建议。`;
  }

  async handleCollaboration(
    message: CollaborationMessage,
    context: AgentContext
  ): Promise<AgentOutput | null> {
    try {
      if (message.messageType === 'request') {
        const content = message.content;
        
        if (content.includes('[dialogue-optimization]')) {
          // 优化现有对话
          return await this.optimizeDialogue(message.data?.dialogue, context);
        } else if (content.includes('[voice-development]')) {
          // 开发角色语音
          return await this.developCharacterVoice(message.data?.characterId, context);
        } else if (content.includes('[conversation-design]')) {
          // 设计对话场景
          return await this.designConversation(message.data?.scenario, context);
        }
      }
      
      return null;
    } catch (error) {
      return this.handleError(error, '协作处理');
    }
  }

  protected getCollaborationTags(): string[] {
    return ['character', 'relationship', 'plot', 'world'];
  }

  protected getSuggestedCollaborators(): string[] {
    return ['character-designer', 'relationship-mapper', 'world-builder'];
  }

  private buildDialoguePrompt(context: AgentContext): string {
    let prompt = `请为以下小说项目设计对话风格和语言特色：

用户需求：${context.userInput}

项目信息：
- 标题：${context.project.title}
- 类型：${context.project.genre}
- 目标读者：${context.project.targetAudience}
- 描述：${context.project.description || '暂无详细描述'}`;

    // 添加角色信息
    if (context.characters && context.characters.length > 0) {
      prompt += `\n\n需要设计对话的角色：`;
      context.characters.forEach((char: any, index: number) => {
        prompt += `\n${index + 1}. ${char.name}`;
        if (char.description) prompt += ` - ${char.description}`;
        if (char.personality && char.personality.length > 0) {
          prompt += ` (性格：${char.personality.join('、')})`;
        }
        if (char.background) prompt += ` (背景：${char.background})`;
        if (char.occupation) prompt += ` (职业：${char.occupation})`;
      });
    }

    // 添加世界观背景
    if (context.worldBuilding && context.worldBuilding.length > 0) {
      prompt += `\n\n世界观背景：`;
      context.worldBuilding.slice(0, 3).forEach((world: any, index: number) => {
        prompt += `\n${index + 1}. ${world.title}：${world.description}`;
      });
    }

    // 添加关系信息
    if (context.characters && context.characters.length > 1) {
      prompt += `\n\n角色关系考虑：需要设计${context.characters.length}个角色间的对话互动模式`;
    }

    prompt += `

请从对话大师的专业角度，提供完整的对话设计建议。重点包括：
1. 每个角色独特的语言风格和说话方式
2. 符合世界观和时代背景的语言特色
3. 不同情境下的对话模式设计
4. 对话的功能性和艺术性平衡
5. 角色间对话的区分度和识别性
6. 具体的对话示例和技巧指导
7. 需要避免的对话写作陷阱`;

    return prompt;
  }

  private async optimizeDialogue(dialogue: string, context: AgentContext): Promise<AgentOutput> {
    const optimizationPrompt = `请优化以下对话内容：

原对话：
${dialogue}

角色信息：${context.characters ? 
      context.characters.map((c: any) => `${c.name}: ${c.description || '暂无描述'}`).join('\n') 
      : '暂无角色信息'}

项目类型：${context.project.genre}

请分析对话的问题并提供优化版本。`;

    try {
      const response = await this.sendAIRequest(optimizationPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          originalDialogue: dialogue,
          optimizedDialogue: parsed.data.optimizedDialogue || '',
          improvements: parsed.data.improvements || [],
          techniques: parsed.data.techniques || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '对话优化');
    }
  }

  private async developCharacterVoice(characterId: string, context: AgentContext): Promise<AgentOutput> {
    const character = context.characters?.find((c: any) => c.id === characterId);
    
    const voicePrompt = `请为以下角色开发独特的语言风格：

角色信息：${character ? JSON.stringify(character, null, 2) : '角色信息缺失'}

世界观背景：${context.worldBuilding ? 
      context.worldBuilding.map((w: any) => `${w.title}: ${w.description}`).join('\n') 
      : '暂无世界观'}

项目类型：${context.project.genre}

请设计角色的说话方式、用词习惯、语调特点等，并提供具体的对话示例。`;

    try {
      const response = await this.sendAIRequest(voicePrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          characterId,
          voiceProfile: parsed.data.voiceProfile || {},
          speechPatterns: parsed.data.speechPatterns || [],
          examples: parsed.data.examples || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '角色语音开发');
    }
  }

  private async designConversation(scenario: string, context: AgentContext): Promise<AgentOutput> {
    const conversationPrompt = `请为以下场景设计对话：

场景描述：${scenario}

可用角色：${context.characters ? 
      context.characters.map((c: any) => `${c.name}: ${c.description || '暂无描述'}`).join('\n') 
      : '暂无角色'}

项目背景：${context.project.description}

请设计完整的对话场景，包括对话内容、情感变化和技巧运用。`;

    try {
      const response = await this.sendAIRequest(conversationPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          scenario,
          conversationDesign: parsed.data.conversationDesign || {},
          dialogue: parsed.data.dialogue || '',
          techniques: parsed.data.techniques || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '对话场景设计');
    }
  }
}

