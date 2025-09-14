import Store from 'electron-store';
import { AppConfig, AIModelConfig, AIAgent } from '@shared/types';

export class ConfigManager {
  private store: Store<AppConfig>;

  constructor() {
    this.store = new Store<AppConfig>({
      name: 'novel-ai-config',
      defaults: this.getDefaultConfig()
    });
  }

  private getDefaultConfig(): AppConfig {
    return {
      theme: 'auto',
      language: 'zh-CN',
      autoSave: true,
      autoSaveInterval: 30,
      aiModels: [
        {
          provider: 'openai',
          model: 'gpt-4',
          maxTokens: 4000,
          temperature: 0.7,
          enabled: false
        },
        {
          provider: 'deepseek',
          model: 'deepseek-chat',
          maxTokens: 4000,
          temperature: 0.7,
          enabled: false
        },
        {
          provider: 'openrouter',
          model: 'anthropic/claude-3-sonnet',
          maxTokens: 4000,
          temperature: 0.7,
          enabled: false
        },
        {
          provider: 'ollama',
          model: 'llama2',
          baseUrl: 'http://localhost:11434',
          maxTokens: 4000,
          temperature: 0.7,
          enabled: false
        }
      ],
      agents: [
        {
          id: 'theme-planner',
          name: '主题策划师',
          type: 'theme',
          description: '分析市场趋势，提供主题建议和创作方向',
          systemPrompt: '你是一位专业的小说主题策划师，擅长分析市场趋势和读者喜好，能够为作者提供有价值的主题建议和创作方向。',
          modelConfig: {
            provider: 'openai',
            model: 'gpt-4',
            maxTokens: 2000,
            temperature: 0.8,
            enabled: true
          },
          enabled: true
        },
        {
          id: 'outline-architect',
          name: '大纲架构师',
          type: 'outline',
          description: '构建故事结构和情节线，确保故事逻辑性和吸引力',
          systemPrompt: '你是一位专业的故事大纲架构师，精通各种叙事结构和情节设计技巧，能够帮助作者构建引人入胜的故事框架。',
          modelConfig: {
            provider: 'openai',
            model: 'gpt-4',
            maxTokens: 3000,
            temperature: 0.7,
            enabled: true
          },
          enabled: true
        },
        {
          id: 'world-builder',
          name: '世界构建师',
          type: 'world',
          description: '创建详细的世界观设定，包括地理、历史、文化等',
          systemPrompt: '你是一位专业的世界观构建师，擅长创造丰富详细的虚构世界，包括地理环境、历史背景、文化体系等各个方面。',
          modelConfig: {
            provider: 'openai',
            model: 'gpt-4',
            maxTokens: 3000,
            temperature: 0.8,
            enabled: true
          },
          enabled: true
        },
        {
          id: 'character-designer',
          name: '人物设计师',
          type: 'character',
          description: '塑造立体的角色形象，设计人物背景和性格特征',
          systemPrompt: '你是一位专业的人物设计师，擅长创造立体丰满的角色形象，能够设计出有深度的人物背景、性格特征和成长弧线。',
          modelConfig: {
            provider: 'openai',
            model: 'gpt-4',
            maxTokens: 2500,
            temperature: 0.8,
            enabled: true
          },
          enabled: true
        },
        {
          id: 'relationship-mapper',
          name: '关系网络师',
          type: 'relationship',
          description: '管理复杂的人物关系网络，设计角色间的互动',
          systemPrompt: '你是一位专业的人物关系分析师，擅长设计和管理复杂的角色关系网络，能够创造有趣的人物互动和冲突。',
          modelConfig: {
            provider: 'openai',
            model: 'gpt-4',
            maxTokens: 2000,
            temperature: 0.7,
            enabled: true
          },
          enabled: true
        },
        {
          id: 'dialogue-master',
          name: '对话大师',
          type: 'dialogue',
          description: '优化角色对话和语言风格，提升对话的真实感',
          systemPrompt: '你是一位专业的对话写作专家，擅长为不同角色设计独特的语言风格和对话模式，让每个角色都有鲜明的语言特色。',
          modelConfig: {
            provider: 'openai',
            model: 'gpt-4',
            maxTokens: 2000,
            temperature: 0.9,
            enabled: true
          },
          enabled: true
        },
        {
          id: 'plot-advisor',
          name: '情节顾问',
          type: 'plot',
          description: '分析情节合理性和吸引力，提供改进建议',
          systemPrompt: '你是一位专业的情节分析顾问，擅长评估故事情节的合理性、吸引力和节奏感，能够提供具体的改进建议。',
          modelConfig: {
            provider: 'openai',
            model: 'gpt-4',
            maxTokens: 2500,
            temperature: 0.6,
            enabled: true
          },
          enabled: true
        }
      ],
      recentProjects: []
    };
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.store.get(key);
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.store.set(key, value);
  }

  getAll(): AppConfig {
    return this.store.store;
  }

  reset(): void {
    this.store.clear();
  }

  // AI模型相关配置
  getAIModels(): AIModelConfig[] {
    return this.get('aiModels');
  }

  setAIModels(models: AIModelConfig[]): void {
    this.set('aiModels', models);
  }

  getEnabledAIModels(): AIModelConfig[] {
    return this.getAIModels().filter(model => model.enabled);
  }

  // 智能体相关配置
  getAgents(): AIAgent[] {
    return this.get('agents');
  }

  setAgents(agents: AIAgent[]): void {
    this.set('agents', agents);
  }

  getEnabledAgents(): AIAgent[] {
    return this.getAgents().filter(agent => agent.enabled);
  }

  getAgentById(id: string): AIAgent | undefined {
    return this.getAgents().find(agent => agent.id === id);
  }

  // 最近项目管理
  addRecentProject(projectId: string): void {
    const recentProjects = this.get('recentProjects');
    const filtered = recentProjects.filter(id => id !== projectId);
    filtered.unshift(projectId);
    
    // 只保留最近10个项目
    this.set('recentProjects', filtered.slice(0, 10));
  }

  removeRecentProject(projectId: string): void {
    const recentProjects = this.get('recentProjects');
    this.set('recentProjects', recentProjects.filter(id => id !== projectId));
  }
}
