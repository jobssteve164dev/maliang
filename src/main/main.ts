import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { isDev } from '@shared/utils/environment';
import { DatabaseManager } from '@database/DatabaseManager';
import { ConfigManager } from '@services/ConfigManager';

class NovelAIApp {
  private mainWindow: BrowserWindow | null = null;
  private databaseManager: DatabaseManager;
  private configManager: ConfigManager;

  constructor() {
    this.databaseManager = new DatabaseManager();
    this.configManager = new ConfigManager();
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
        enableRemoteModule: false,
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
      this.mainWindow.loadURL('http://localhost:3000');
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

    // 配置管理
    ipcMain.handle('config-get', async (event, key: string) => {
      return this.configManager.get(key);
    });

    ipcMain.handle('config-set', async (event, key: string, value: any) => {
      return this.configManager.set(key, value);
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
