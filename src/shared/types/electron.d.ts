// Electron API 类型定义
export interface ElectronAPI {
  // 应用控制
  app: {
    quit: () => void;
    getVersion: () => Promise<string>;
    getPath: (name: string) => Promise<string>;
  };

  // 数据库操作
  database: {
    query: (query: string, params?: any[]) => Promise<any[]>;
    run: (query: string, params?: any[]) => Promise<any>;
    get: (query: string, params?: any[]) => Promise<any>;
  };

  // 配置管理
  config: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };

  // AI服务
  ai: {
    sendMessage: (agentId: string, projectId: string, message: string, context?: Record<string, any>) => Promise<any>;
    getConversationHistory: (projectId: string, agentId: string, limit?: number) => Promise<any[]>;
    clearConversation: (projectId: string, agentId: string) => Promise<void>;
    getAvailableAgents: () => Promise<any[]>;
    validateConfig: () => Promise<any>;
    testProvider: (providerKey: string) => Promise<any>;
    getAvailableModels: (providerKey: string) => Promise<any[]>;
    getProviderStats: () => Promise<any>;
    getUsageStats: (projectId: string) => Promise<any>;
  };

  // 智能体管理
  agents: {
    listAgents: () => Promise<any[]>;
    getAgent: (agentId: string) => Promise<any>;
    executeAgent: (agentId: string, input: any) => Promise<any>;
    createCollaboration: (agentIds: string[], task: any) => Promise<any>;
  };

  // 智能体管理 (单数形式，用于兼容现有代码)
  agent: {
    sendMessage: (agentId: string, context: any) => Promise<any>;
    sendToType: (agentType: string, context: any) => Promise<any>;
    executeWorkflow: (workflowId: string, context: any) => Promise<any>;
    startCollaboration: (projectId: string, topic: string, agentTypes: string[]) => Promise<any>;
    getAvailable: () => Promise<any[]>;
    getByType: (agentType: string) => Promise<any>;
    isAvailable: (agentId: string) => Promise<boolean>;
    updateConfig: (agentId: string, config: any) => Promise<void>;
    setEnabled: (agentId: string, enabled: boolean) => Promise<void>;
    getStats: (projectId?: string) => Promise<any>;
    test: (agentId: string, testContext: any) => Promise<any>;
    getCollaborationHistory: (projectId: string, agentId?: string) => Promise<any[]>;
    batchProcess: (requests: any[]) => Promise<any[]>;
    getWorkflows: (projectType: string, currentStage: string) => Promise<any[]>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
