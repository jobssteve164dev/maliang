import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { isDev } from '@shared/utils/environment';
import { DatabaseManager } from '@database/DatabaseManager';
import { ConfigManager } from '@services/ConfigManager';
import { AIService } from '@services/AIService';
import { AgentManager } from '@agents/AgentManager';

class NovelAIApp {
  private mainWindow: BrowserWindow | null = null;
  private databaseManager: DatabaseManager;
  private configManager: ConfigManager;
  private aiService: AIService;
  private agentManager: AgentManager;

  constructor() {
    this.databaseManager = new DatabaseManager();
    this.configManager = new ConfigManager();
    this.aiService = new AIService(this.configManager, this.databaseManager);
    this.agentManager = new AgentManager(this.aiService, this.configManager, this.databaseManager);
    this.initializeApp();
  }

  private initializeApp(): void {
    // 确保应用单例运行
    if (!app.requestSingleInstanceLock()) {
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) {
          this.mainWindow.restore();
        }
        this.mainWindow.focus();
      }
    });

    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupMenu();
      this.setupIpcHandlers();
      this.initializeDatabase();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      show: false
    });

    // 窗口准备好后显示，避免闪烁
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      
      if (isDev()) {
        this.mainWindow?.webContents.openDevTools();
      }
    });

    // 加载应用
    if (isDev()) {
      this.mainWindow.loadURL('http://localhost:3333');
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Project',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow?.webContents.send('menu-new-project');
            }
          },
          {
            label: 'Open Project',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              this.mainWindow?.webContents.send('menu-open-project');
            }
          },
          { type: 'separator' },
          {
            label: 'Save',
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              this.mainWindow?.webContents.send('menu-save');
            }
          },
          { type: 'separator' },
          {
            role: 'quit'
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'AI Agents',
        submenu: [
          {
            label: 'Theme Planner',
            click: () => {
              this.mainWindow?.webContents.send('menu-open-agent', 'theme');
            }
          },
          {
            label: 'Outline Architect',
            click: () => {
              this.mainWindow?.webContents.send('menu-open-agent', 'outline');
            }
          },
          {
            label: 'World Builder',
            click: () => {
              this.mainWindow?.webContents.send('menu-open-agent', 'world');
            }
          },
          {
            label: 'Character Designer',
            click: () => {
              this.mainWindow?.webContents.send('menu-open-agent', 'character');
            }
          }
        ]
      },
      {
        role: 'help',
        submenu: [
          {
            label: 'About Novel AI Assistant',
            click: () => {
              this.mainWindow?.webContents.send('menu-about');
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIpcHandlers(): void {
    // 数据库操作
    ipcMain.handle('db-query', async (event, query: string, params?: any[]) => {
      return this.databaseManager.query(query, params);
    });

    ipcMain.handle('db-run', async (event, query: string, params?: any[]) => {
      return this.databaseManager.run(query, params);
    });

    ipcMain.handle('db-get', async (event, query: string, params?: any[]) => {
      return this.databaseManager.get(query, params);
    });

    // 配置管理
    ipcMain.handle('config-get', async (event, key: string) => {
      if (!key || key === '') {
        // 如果没有指定key或key为空，返回完整配置
        return this.configManager.getAll();
      }
      return this.configManager.get(key as any);
    });

    ipcMain.handle('config-set', async (event, key: string, value: any) => {
      const result = this.configManager.set(key as any, value);
      
      // 如果更新的是AI模型配置，重新初始化AI服务
      if (key === 'aiModels') {
        console.log('🔍 [DEBUG] AI models config updated, reloading AI service...');
        this.aiService.reloadConfig();
        this.agentManager.reloadConfig();
      }
      
      return result;
    });

    // AI服务相关
    ipcMain.handle('ai-send-message', async (event, agentId: string, projectId: string, message: string, context?: Record<string, any>) => {
      return this.aiService.sendMessage(agentId, projectId, message, context);
    });

    ipcMain.handle('ai-get-conversation-history', async (event, projectId: string, agentId: string, limit?: number) => {
      return this.aiService.getConversationHistory(projectId, agentId, limit);
    });

    ipcMain.handle('ai-clear-conversation', async (event, projectId: string, agentId: string) => {
      return this.aiService.clearConversationHistory(projectId, agentId);
    });

    ipcMain.handle('ai-get-available-agents', () => {
      return this.aiService.getAvailableAgents();
    });

    ipcMain.handle('ai-validate-config', async () => {
      return this.aiService.validateConfiguration();
    });

    ipcMain.handle('ai-test-provider', async (event, providerKey: string) => {
      return this.aiService.testProvider(providerKey);
    });

    ipcMain.handle('ai-get-available-models', async (event, providerKey: string) => {
      return this.aiService.getAvailableModels(providerKey);
    });

    ipcMain.handle('ai-get-provider-stats', () => {
      return this.aiService.getProviderStats();
    });

    ipcMain.handle('ai-get-usage-stats', async (event, projectId: string) => {
      return this.aiService.getAgentUsageStats(projectId);
    });

    // 智能体管理相关
    ipcMain.handle('agent-send-message', async (event, agentId: string, context: any) => {
      console.log('🔍 [DEBUG] Main: Received agent-send-message request');
      console.log('🔍 [DEBUG] Main: Agent ID:', agentId);
      console.log('🔍 [DEBUG] Main: Context:', context);
      return this.agentManager.sendMessage(agentId, context);
    });

    ipcMain.handle('agent-send-to-type', async (event, agentType: string, context: any) => {
      return this.agentManager.sendMessageToAgentType(agentType, context);
    });

    ipcMain.handle('agent-execute-workflow', async (event, workflowId: string, context: any) => {
      return this.agentManager.executeWorkflow(workflowId, context);
    });

    ipcMain.handle('agent-start-collaboration', async (event, projectId: string, topic: string, agentTypes: string[]) => {
      return this.agentManager.startCollaboration(projectId, topic, agentTypes);
    });

    ipcMain.handle('agent-get-available', () => {
      return this.agentManager.getAvailableAgents();
    });

    ipcMain.handle('agent-get-by-type', (event, agentType: string) => {
      return this.agentManager.getAgentsByType(agentType);
    });

    ipcMain.handle('agent-is-available', (event, agentId: string) => {
      return this.agentManager.isAgentAvailable(agentId);
    });

    ipcMain.handle('agent-update-config', (event, agentId: string, config: any) => {
      return this.agentManager.updateAgentConfig(agentId, config);
    });

    ipcMain.handle('agent-set-enabled', (event, agentId: string, enabled: boolean) => {
      return this.agentManager.setAgentEnabled(agentId, enabled);
    });

    ipcMain.handle('agent-get-stats', async (event, projectId?: string) => {
      return this.agentManager.getAgentUsageStats(projectId);
    });

    ipcMain.handle('agent-test', async (event, agentId: string, testContext: any) => {
      return this.agentManager.testAgent(agentId, testContext);
    });

    ipcMain.handle('agent-get-collaboration-history', async (event, projectId: string, agentId?: string) => {
      return this.agentManager.getCollaborationHistory(projectId, agentId);
    });

    ipcMain.handle('agent-batch-process', async (event, requests: any[]) => {
      return this.agentManager.batchProcess(requests);
    });

    ipcMain.handle('agent-get-workflows', (event, projectType: string, currentStage: string) => {
      return this.agentManager.getRecommendedWorkflows(projectType, currentStage);
    });

    // 应用控制
    ipcMain.handle('app-quit', () => {
      app.quit();
    });

    ipcMain.handle('app-minimize', () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('app-maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await this.databaseManager.initialize();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
}

// 启动应用
new NovelAIApp();
