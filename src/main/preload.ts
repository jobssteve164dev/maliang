import { contextBridge, ipcRenderer } from 'electron';

// 定义安全的API接口
const electronAPI = {
  // 数据库操作
  database: {
    query: (query: string, params?: any[]) => 
      ipcRenderer.invoke('db-query', query, params),
    run: (query: string, params?: any[]) => 
      ipcRenderer.invoke('db-run', query, params),
    get: (query: string, params?: any[]) => 
      ipcRenderer.invoke('db-get', query, params)
  },

  // 配置管理
  config: {
    get: (key: string) => ipcRenderer.invoke('config-get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('config-set', key, value)
  },

  // 应用控制
  app: {
    quit: () => ipcRenderer.invoke('app-quit'),
    minimize: () => ipcRenderer.invoke('app-minimize'),
    maximize: () => ipcRenderer.invoke('app-maximize')
  },

  // AI服务
  ai: {
    sendMessage: (agentId: string, projectId: string, message: string, context?: Record<string, any>) =>
      ipcRenderer.invoke('ai-send-message', agentId, projectId, message, context),
    getConversationHistory: (projectId: string, agentId: string, limit?: number) =>
      ipcRenderer.invoke('ai-get-conversation-history', projectId, agentId, limit),
    clearConversation: (projectId: string, agentId: string) =>
      ipcRenderer.invoke('ai-clear-conversation', projectId, agentId),
    getAvailableAgents: () =>
      ipcRenderer.invoke('ai-get-available-agents'),
    validateConfig: () =>
      ipcRenderer.invoke('ai-validate-config'),
    testProvider: (providerKey: string) =>
      ipcRenderer.invoke('ai-test-provider', providerKey),
    getAvailableModels: (providerKey: string) =>
      ipcRenderer.invoke('ai-get-available-models', providerKey),
    getProviderStats: () =>
      ipcRenderer.invoke('ai-get-provider-stats'),
    getUsageStats: (projectId: string) =>
      ipcRenderer.invoke('ai-get-usage-stats', projectId)
  },

  // 智能体管理
  agent: {
    sendMessage: (agentId: string, context: any) =>
      ipcRenderer.invoke('agent-send-message', agentId, context),
    sendToType: (agentType: string, context: any) =>
      ipcRenderer.invoke('agent-send-to-type', agentType, context),
    executeWorkflow: (workflowId: string, context: any) =>
      ipcRenderer.invoke('agent-execute-workflow', workflowId, context),
    startCollaboration: (projectId: string, topic: string, agentTypes: string[]) =>
      ipcRenderer.invoke('agent-start-collaboration', projectId, topic, agentTypes),
    getAvailable: () =>
      ipcRenderer.invoke('agent-get-available'),
    getByType: (agentType: string) =>
      ipcRenderer.invoke('agent-get-by-type', agentType),
    isAvailable: (agentId: string) =>
      ipcRenderer.invoke('agent-is-available', agentId),
    updateConfig: (agentId: string, config: any) =>
      ipcRenderer.invoke('agent-update-config', agentId, config),
    setEnabled: (agentId: string, enabled: boolean) =>
      ipcRenderer.invoke('agent-set-enabled', agentId, enabled),
    getStats: (projectId?: string) =>
      ipcRenderer.invoke('agent-get-stats', projectId),
    test: (agentId: string, testContext: any) =>
      ipcRenderer.invoke('agent-test', agentId, testContext),
    getCollaborationHistory: (projectId: string, agentId?: string) =>
      ipcRenderer.invoke('agent-get-collaboration-history', projectId, agentId),
    batchProcess: (requests: any[]) =>
      ipcRenderer.invoke('agent-batch-process', requests),
    getWorkflows: (projectType: string, currentStage: string) =>
      ipcRenderer.invoke('agent-get-workflows', projectType, currentStage)
  },

  // 菜单事件监听
  menu: {
    onNewProject: (callback: () => void) => 
      ipcRenderer.on('menu-new-project', callback),
    onOpenProject: (callback: () => void) => 
      ipcRenderer.on('menu-open-project', callback),
    onSave: (callback: () => void) => 
      ipcRenderer.on('menu-save', callback),
    onOpenAgent: (callback: (event: any, agentType: string) => void) => 
      ipcRenderer.on('menu-open-agent', callback),
    onAbout: (callback: () => void) => 
      ipcRenderer.on('menu-about', callback),
    
    // 清理监听器
    removeAllListeners: (channel: string) => 
      ipcRenderer.removeAllListeners(channel)
  }
};

// 暴露安全的API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型声明
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
