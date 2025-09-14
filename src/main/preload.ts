import { contextBridge, ipcRenderer } from 'electron';

// 定义安全的API接口
const electronAPI = {
  // 数据库操作
  database: {
    query: (query: string, params?: any[]) => 
      ipcRenderer.invoke('db-query', query, params),
    run: (query: string, params?: any[]) => 
      ipcRenderer.invoke('db-run', query, params)
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
