import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { NovelProject, AppConfig, AIAgent } from '@shared/types';

// 应用状态类型
interface AppState {
  isInitialized: boolean;
  currentProject: NovelProject | null;
  projects: NovelProject[];
  config: AppConfig | null;
  agents: AIAgent[];
  loading: boolean;
  error: string | null;
}

// 动作类型
type AppAction =
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_CURRENT_PROJECT'; payload: NovelProject | null }
  | { type: 'SET_PROJECTS'; payload: NovelProject[] }
  | { type: 'ADD_PROJECT'; payload: NovelProject }
  | { type: 'UPDATE_PROJECT'; payload: NovelProject }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_CONFIG'; payload: AppConfig }
  | { type: 'SET_AGENTS'; payload: AIAgent[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// 初始状态
const initialState: AppState = {
  isInitialized: false,
  currentProject: null,
  projects: [],
  config: null,
  agents: [],
  loading: false,
  error: null,
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => 
          p.id === action.payload.id ? action.payload : p
        ),
        currentProject: state.currentProject?.id === action.payload.id 
          ? action.payload 
          : state.currentProject
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        currentProject: state.currentProject?.id === action.payload 
          ? null 
          : state.currentProject
      };
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    case 'SET_AGENTS':
      return { ...state, agents: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

// Context类型
interface AppContextType {
  state: AppState;
  initializeApp: () => Promise<void>;
  loadProjects: () => Promise<void>;
  createProject: (project: Omit<NovelProject, 'id' | 'createdAt' | 'updatedAt'>) => Promise<NovelProject>;
  updateProject: (project: NovelProject) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  setCurrentProject: (project: NovelProject | null) => void;
  loadConfig: () => Promise<void>;
  updateConfig: (config: Partial<AppConfig>) => Promise<void>;
}

// 创建Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider组件
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  console.log('🔍 [DEBUG] AppProvider initializing...');
  
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  console.log('🔍 [DEBUG] AppProvider state:', state);

  // 初始化应用
  const initializeApp = useCallback(async () => {
    console.log('🔍 [DEBUG] initializeApp called');
    try {
      console.log('🔍 [DEBUG] Setting loading to true');
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('🔍 [DEBUG] Loading config...');
      // 加载配置
      await loadConfig();
      
      console.log('🔍 [DEBUG] Loading projects...');
      // 加载项目列表
      await loadProjects();
      
      console.log('🔍 [DEBUG] Setting initialized to true');
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } catch (error) {
      console.error('❌ [ERROR] Failed to initialize app:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize application' });
    } finally {
      console.log('🔍 [DEBUG] Setting loading to false');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // 加载项目列表
  const loadProjects = useCallback(async () => {
    try {
      const projects = await window.electronAPI.database.query(
        'SELECT * FROM projects ORDER BY updated_at DESC'
      );
      
      const formattedProjects: NovelProject[] = projects.map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        genre: p.genre,
        targetAudience: p.target_audience,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
        status: p.status,
        wordCount: p.word_count,
        chapterCount: p.chapter_count,
      }));
      
      dispatch({ type: 'SET_PROJECTS', payload: formattedProjects });
    } catch (error) {
      console.error('Failed to load projects:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load projects' });
    }
  }, []);

  // 创建项目
  const createProject = useCallback(async (projectData: Omit<NovelProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<NovelProject> => {
    try {
      const id = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      await window.electronAPI.database.run(
        `INSERT INTO projects (id, title, description, genre, target_audience, status, word_count, chapter_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, projectData.title, projectData.description, projectData.genre, projectData.targetAudience, 
         projectData.status, projectData.wordCount, projectData.chapterCount, now, now]
      );
      
      const newProject: NovelProject = {
        id,
        ...projectData,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };
      
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      
      // 添加到最近项目
      await window.electronAPI.config.set('recentProjects', 
        [id, ...(await window.electronAPI.config.get('recentProjects') || [])].slice(0, 10)
      );
      
      return newProject;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw new Error('Failed to create project');
    }
  }, []);

  // 更新项目
  const updateProject = useCallback(async (project: NovelProject) => {
    try {
      const now = new Date().toISOString();
      
      await window.electronAPI.database.run(
        `UPDATE projects SET title = ?, description = ?, genre = ?, target_audience = ?, 
         status = ?, word_count = ?, chapter_count = ?, updated_at = ? WHERE id = ?`,
        [project.title, project.description, project.genre, project.targetAudience,
         project.status, project.wordCount, project.chapterCount, now, project.id]
      );
      
      const updatedProject = { ...project, updatedAt: new Date(now) };
      dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
    } catch (error) {
      console.error('Failed to update project:', error);
      throw new Error('Failed to update project');
    }
  }, []);

  // 删除项目
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await window.electronAPI.database.run('DELETE FROM projects WHERE id = ?', [projectId]);
      dispatch({ type: 'DELETE_PROJECT', payload: projectId });
      
      // 从最近项目中移除
      const recentProjects = (await window.electronAPI.config.get('recentProjects') || [])
        .filter((id: string) => id !== projectId);
      await window.electronAPI.config.set('recentProjects', recentProjects);
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw new Error('Failed to delete project');
    }
  }, []);

  // 设置当前项目
  const setCurrentProject = useCallback((project: NovelProject | null) => {
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });
  }, []);

  // 加载配置
  const loadConfig = useCallback(async () => {
    try {
      const config = await window.electronAPI.config.get('');
      dispatch({ type: 'SET_CONFIG', payload: config as AppConfig });
      
      if (config && config.agents) {
        dispatch({ type: 'SET_AGENTS', payload: config.agents });
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load configuration' });
    }
  }, []);

  // 更新配置
  const updateConfig = useCallback(async (configUpdate: Partial<AppConfig>) => {
    try {
      const currentConfig = state.config || {} as AppConfig;
      const newConfig = { ...currentConfig, ...configUpdate };
      
      for (const [key, value] of Object.entries(configUpdate)) {
        await window.electronAPI.config.set(key, value);
      }
      
      dispatch({ type: 'SET_CONFIG', payload: newConfig });
      
      if (configUpdate.agents) {
        dispatch({ type: 'SET_AGENTS', payload: configUpdate.agents });
      }
    } catch (error) {
      console.error('Failed to update config:', error);
      throw new Error('Failed to update configuration');
    }
  }, [state.config]);

  const contextValue: AppContextType = {
    state,
    initializeApp,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    loadConfig,
    updateConfig,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
