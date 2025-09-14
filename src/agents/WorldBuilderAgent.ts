/**
 * 世界构建师智能体
 * 专注于创建详细的世界观设定，包括地理、历史、文化等
 */

import { BaseAgent, AgentContext, AgentOutput, CollaborationMessage } from './BaseAgent';
import { AIService } from '@services/AIService';
import { AIAgent } from '@shared/types';

export class WorldBuilderAgent extends BaseAgent {
  constructor(config: AIAgent, aiService: AIService) {
    super(config, aiService);
  }

  async processInput(context: AgentContext): Promise<AgentOutput> {
    if (!this.validateContext(context)) {
      return this.handleError(new Error('Invalid context'), 'processInput');
    }

    try {
      const worldPrompt = this.buildWorldPrompt(context);
      const response = await this.sendAIRequest(worldPrompt, context);
      
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          worldElements: parsed.data.worldElements || {},
          geography: parsed.data.geography || {},
          history: parsed.data.history || {},
          culture: parsed.data.culture || {},
          society: parsed.data.society || {},
          technology: parsed.data.technology || {},
          magic: parsed.data.magic || {},
          politics: parsed.data.politics || {},
          economy: parsed.data.economy || {},
          religion: parsed.data.religion || {},
        },
        0.87
      );
    } catch (error) {
      return this.handleError(error, '世界构建');
    }
  }

  generateSystemPrompt(context: AgentContext): string {
    const collaborationPrompt = this.generateCollaborationPrompt(context.collaborationData || {});
    
    return `你是一位专业的世界观构建师，擅长创造丰富详细的虚构世界。

【核心职责】
1. 设计完整的世界地理环境和自然法则
2. 构建深层的历史背景和文明发展脉络
3. 创造独特的文化体系和社会结构
4. 设计政治制度、经济体系和宗教信仰
5. 确保世界观的内在逻辑一致性和可信度

【构建原则】
- 内在一致性：所有元素都应符合世界的基本法则
- 文化深度：每个文化都有其独特的价值观和传统
- 历史厚重感：世界应有丰富的历史层次和传承
- 地理影响：地理环境塑造文明和文化特色
- 冲突张力：不同势力和文化间的矛盾推动故事发展

【输出格式】
请按以下格式组织回答：

1. 世界概览
2. 核心设定详解
3. 文化与社会结构

【建议】
- 世界观扩展的方向建议
- 需要深入发展的设定要素
- 与故事情节的结合点

【数据】
{
  "worldElements": {
    "name": "世界名称",
    "type": "世界类型(奇幻/科幻/现实向等)",
    "scale": "世界规模(星球/大陆/城市等)",
    "uniqueFeatures": ["独特特征1", "独特特征2"]
  },
  "geography": {
    "continents": [
      {
        "name": "大陆名",
        "climate": "气候类型",
        "terrain": "地形特征",
        "resources": ["资源1", "资源2"]
      }
    ],
    "naturalLaws": "自然法则描述"
  },
  "history": {
    "timeline": [
      {
        "era": "时代名称",
        "period": "时间段",
        "keyEvents": ["重大事件1", "重大事件2"],
        "significance": "历史意义"
      }
    ],
    "ancientCivilizations": ["古代文明1", "古代文明2"]
  },
  "culture": {
    "majorCultures": [
      {
        "name": "文化名称",
        "values": ["核心价值观1", "核心价值观2"],
        "traditions": ["传统1", "传统2"],
        "language": "语言特色",
        "arts": "艺术形式"
      }
    ]
  },
  "society": {
    "socialStructure": "社会结构描述",
    "classes": ["社会阶层1", "社会阶层2"],
    "institutions": ["重要机构1", "重要机构2"]
  },
  "technology": {
    "level": "科技水平",
    "keyTechnologies": ["关键技术1", "关键技术2"],
    "limitations": ["技术限制1", "技术限制2"]
  },
  "magic": {
    "exists": true/false,
    "system": "魔法体系描述",
    "rules": ["魔法规则1", "魔法规则2"],
    "practitioners": ["施法者类型1", "施法者类型2"]
  },
  "politics": {
    "governments": [
      {
        "name": "政权名称",
        "type": "政治制度",
        "territory": "统治范围",
        "leadership": "领导结构"
      }
    ],
    "conflicts": ["政治冲突1", "政治冲突2"]
  },
  "economy": {
    "system": "经济制度",
    "currency": "货币体系",
    "trade": "贸易特色",
    "resources": ["主要资源1", "主要资源2"]
  },
  "religion": {
    "majorReligions": [
      {
        "name": "宗教名称",
        "beliefs": "核心信仰",
        "practices": "宗教仪式",
        "influence": "社会影响力"
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

请基于以上信息，为这个项目提供专业的世界观构建建议。`;
  }

  async handleCollaboration(
    message: CollaborationMessage,
    context: AgentContext
  ): Promise<AgentOutput | null> {
    try {
      if (message.messageType === 'request') {
        const content = message.content;
        
        if (content.includes('[world-expansion]')) {
          // 扩展世界设定
          return await this.expandWorldSetting(message.data?.category, context);
        } else if (content.includes('[consistency-check]')) {
          // 检查世界观一致性
          return await this.checkConsistency(context);
        } else if (content.includes('[culture-detail]')) {
          // 详化文化设定
          return await this.detailCulture(message.data?.cultureName, context);
        }
      }
      
      return null;
    } catch (error) {
      return this.handleError(error, '协作处理');
    }
  }

  protected getCollaborationTags(): string[] {
    return ['theme', 'character', 'outline', 'plot'];
  }

  protected getSuggestedCollaborators(): string[] {
    return ['theme-planner', 'character-designer', 'outline-architect'];
  }

  private buildWorldPrompt(context: AgentContext): string {
    let prompt = `请为以下小说项目构建详细的世界观设定：

用户需求：${context.userInput}

项目信息：
- 标题：${context.project.title}
- 类型：${context.project.genre}
- 目标读者：${context.project.targetAudience}
- 描述：${context.project.description || '暂无详细描述'}`;

    // 添加现有世界设定信息
    if (context.worldBuilding && context.worldBuilding.length > 0) {
      prompt += `\n\n现有世界设定：`;
      context.worldBuilding.forEach((world: any, index: number) => {
        prompt += `\n${index + 1}. ${world.title}(${world.category})：${world.description}`;
      });
    }

    // 添加角色信息以便世界观与角色背景匹配
    if (context.characters && context.characters.length > 0) {
      prompt += `\n\n需要考虑的角色背景：`;
      context.characters.slice(0, 3).forEach((char: any, index: number) => {
        prompt += `\n${index + 1}. ${char.name}：${char.background || char.description || '暂无背景'}`;
      });
    }

    prompt += `

请从世界构建师的专业角度，提供完整的世界观设计。重点包括：
1. 世界的基本框架和核心特征
2. 地理环境和自然法则
3. 历史发展脉络和重要事件
4. 文化体系和社会结构
5. 政治、经济、宗教等制度设计
6. 与故事主题和角色的有机结合
7. 确保世界观的内在逻辑一致性`;

    return prompt;
  }

  private async expandWorldSetting(category: string, context: AgentContext): Promise<AgentOutput> {
    const expansionPrompt = `请扩展以下世界设定类别的详细内容：

设定类别：${category}
项目类型：${context.project.genre}

现有相关设定：${context.worldBuilding ? 
      context.worldBuilding
        .filter((w: any) => w.category === category)
        .map((w: any) => `${w.title}: ${w.description}`)
        .join('\n') 
      : '暂无'}

请提供该类别的深度扩展和细节补充。`;

    try {
      const response = await this.sendAIRequest(expansionPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          expandedCategory: category,
          details: parsed.data.details || {},
          connections: parsed.data.connections || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '世界设定扩展');
    }
  }

  private async checkConsistency(context: AgentContext): Promise<AgentOutput> {
    const consistencyPrompt = `请检查当前世界观设定的一致性：

项目类型：${context.project.genre}

现有世界设定：${context.worldBuilding ? 
      JSON.stringify(context.worldBuilding, null, 2) 
      : '暂无设定'}

请分析设定间的逻辑关系，指出可能的矛盾和需要完善的地方。`;

    try {
      const response = await this.sendAIRequest(consistencyPrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          consistencyReport: parsed.data.consistencyReport || {},
          conflicts: parsed.data.conflicts || [],
          recommendations: parsed.data.recommendations || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '一致性检查');
    }
  }

  private async detailCulture(cultureName: string, context: AgentContext): Promise<AgentOutput> {
    const culturePrompt = `请详细描述以下文化的各个方面：

文化名称：${cultureName}
项目类型：${context.project.genre}
世界背景：${context.project.description}

请从以下角度进行详细描述：
1. 核心价值观和世界观
2. 社会结构和等级制度
3. 传统习俗和节日庆典
4. 艺术形式和审美观念
5. 语言特色和交流方式
6. 宗教信仰和精神追求
7. 与其他文化的关系`;

    try {
      const response = await this.sendAIRequest(culturePrompt, context);
      const parsed = this.parseStructuredOutput(response);
      
      return this.formatOutput(
        parsed.mainContent,
        parsed.suggestions,
        {
          cultureName,
          cultureDetails: parsed.data.cultureDetails || {},
          traditions: parsed.data.traditions || [],
          relationships: parsed.data.relationships || [],
        }
      );
    } catch (error) {
      return this.handleError(error, '文化详化');
    }
  }
}

