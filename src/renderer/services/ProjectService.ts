/**
 * 项目服务层
 * 处理项目相关的业务逻辑和数据操作
 */

import { NovelProject, Chapter, Character, WorldBuilding, PlotLine } from '@shared/types';

export class ProjectService {
  // 获取所有项目
  static async getAllProjects(): Promise<NovelProject[]> {
    try {
      const projects = await window.electronAPI.database.query(
        'SELECT * FROM projects ORDER BY updated_at DESC'
      );
      
      return projects.map((project: any) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        genre: project.genre,
        targetAudience: project.target_audience,
        status: project.status,
        wordCount: project.word_count || 0,
        chapterCount: project.chapter_count || 0,
        settings: JSON.parse(project.settings || '{}'),
        metadata: JSON.parse(project.metadata || '{}'),
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
      }));
    } catch (error) {
      console.error('Failed to get projects:', error);
      return [];
    }
  }

  // 根据ID获取项目
  static async getProjectById(projectId: string): Promise<NovelProject | null> {
    try {
      const project = await window.electronAPI.database.get(
        'SELECT * FROM projects WHERE id = ?',
        [projectId]
      );
      
      if (!project) {
        return null;
      }
      
      return {
        id: project.id,
        title: project.title,
        description: project.description,
        genre: project.genre,
        targetAudience: project.target_audience,
        status: project.status,
        wordCount: project.word_count || 0,
        chapterCount: project.chapter_count || 0,
        settings: JSON.parse(project.settings || '{}'),
        metadata: JSON.parse(project.metadata || '{}'),
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
      };
    } catch (error) {
      console.error('Failed to get project:', error);
      return null;
    }
  }

  // 创建新项目
  static async createProject(project: Omit<NovelProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    try {
      await window.electronAPI.database.run(
        `INSERT INTO projects (id, title, description, genre, target_audience, status, word_count, chapter_count, settings, metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          projectId,
          project.title,
          project.description || '',
          project.genre,
          project.targetAudience,
          project.status || 'planning',
          project.wordCount || 0,
          project.chapterCount || 0,
          JSON.stringify(project.settings || {}),
          JSON.stringify(project.metadata || {}),
          now,
          now
        ]
      );

      // 添加到最近项目
      await window.electronAPI.config.set('recentProjects', [projectId]);

      return projectId;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }

  // 更新项目
  static async updateProject(projectId: string, updates: Partial<NovelProject>): Promise<void> {
    const now = new Date().toISOString();

    try {
      const setClause = [];
      const values = [];

      if (updates.title !== undefined) {
        setClause.push('title = ?');
        values.push(updates.title);
      }
      if (updates.description !== undefined) {
        setClause.push('description = ?');
        values.push(updates.description);
      }
      if (updates.genre !== undefined) {
        setClause.push('genre = ?');
        values.push(updates.genre);
      }
      if (updates.targetAudience !== undefined) {
        setClause.push('target_audience = ?');
        values.push(updates.targetAudience);
      }
      if (updates.status !== undefined) {
        setClause.push('status = ?');
        values.push(updates.status);
      }
      if (updates.wordCount !== undefined) {
        setClause.push('word_count = ?');
        values.push(updates.wordCount);
      }
      if (updates.chapterCount !== undefined) {
        setClause.push('chapter_count = ?');
        values.push(updates.chapterCount);
      }
      if (updates.settings !== undefined) {
        setClause.push('settings = ?');
        values.push(JSON.stringify(updates.settings));
      }
      if (updates.metadata !== undefined) {
        setClause.push('metadata = ?');
        values.push(JSON.stringify(updates.metadata));
      }

      setClause.push('updated_at = ?');
      values.push(now);
      values.push(projectId);

      await window.electronAPI.database.run(
        `UPDATE projects SET ${setClause.join(', ')} WHERE id = ?`,
        values
      );
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  }

  // 删除项目
  static async deleteProject(projectId: string): Promise<void> {
    try {
      await window.electronAPI.database.run(
        'DELETE FROM projects WHERE id = ?',
        [projectId]
      );
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  // 获取项目统计信息
  static async getProjectStats(projectId: string): Promise<{
    chapters: number;
    characters: number;
    worldBuilding: number;
    plotLines: number;
    totalWords: number;
  }> {
    try {
      const [chapters, characters, worldBuilding, plotLines] = await Promise.all([
        window.electronAPI.database.query(
          'SELECT COUNT(*) as count, COALESCE(SUM(word_count), 0) as words FROM chapters WHERE project_id = ?',
          [projectId]
        ),
        window.electronAPI.database.query(
          'SELECT COUNT(*) as count FROM characters WHERE project_id = ?',
          [projectId]
        ),
        window.electronAPI.database.query(
          'SELECT COUNT(*) as count FROM world_building WHERE project_id = ?',
          [projectId]
        ),
        window.electronAPI.database.query(
          'SELECT COUNT(*) as count FROM plot_lines WHERE project_id = ?',
          [projectId]
        )
      ]);

      return {
        chapters: chapters[0]?.count || 0,
        characters: characters[0]?.count || 0,
        worldBuilding: worldBuilding[0]?.count || 0,
        plotLines: plotLines[0]?.count || 0,
        totalWords: chapters[0]?.words || 0,
      };
    } catch (error) {
      console.error('Failed to get project stats:', error);
      return {
        chapters: 0,
        characters: 0,
        worldBuilding: 0,
        plotLines: 0,
        totalWords: 0,
      };
    }
  }

  // 获取项目的章节列表
  static async getProjectChapters(projectId: string): Promise<Chapter[]> {
    try {
      const chapters = await window.electronAPI.database.query(
        'SELECT * FROM chapters WHERE project_id = ? ORDER BY order_index ASC',
        [projectId]
      );
      
      return chapters.map((chapter: any) => ({
        ...chapter,
        createdAt: new Date(chapter.created_at),
        updatedAt: new Date(chapter.updated_at),
      }));
    } catch (error) {
      console.error('Failed to get project chapters:', error);
      return [];
    }
  }

  // 获取项目的角色列表
  static async getProjectCharacters(projectId: string): Promise<Character[]> {
    try {
      const characters = await window.electronAPI.database.query(
        'SELECT * FROM characters WHERE project_id = ? ORDER BY importance_level DESC, created_at ASC',
        [projectId]
      );
      
      return characters.map((character: any) => ({
        ...character,
        personality: JSON.parse(character.personality || '[]'),
        tags: JSON.parse(character.tags || '[]'),
        createdAt: new Date(character.created_at),
        updatedAt: new Date(character.updated_at),
      }));
    } catch (error) {
      console.error('Failed to get project characters:', error);
      return [];
    }
  }

  // 获取项目的世界观设定
  static async getProjectWorldBuilding(projectId: string): Promise<WorldBuilding[]> {
    try {
      const worldBuilding = await window.electronAPI.database.query(
        'SELECT * FROM world_building WHERE project_id = ? ORDER BY category, order_index ASC',
        [projectId]
      );
      
      return worldBuilding.map((world: any) => ({
        ...world,
        details: JSON.parse(world.details || '{}'),
        tags: JSON.parse(world.tags || '[]'),
        createdAt: new Date(world.created_at),
        updatedAt: new Date(world.updated_at),
      }));
    } catch (error) {
      console.error('Failed to get project world building:', error);
      return [];
    }
  }

  // 获取项目的情节线
  static async getProjectPlotLines(projectId: string): Promise<PlotLine[]> {
    try {
      const plotLines = await window.electronAPI.database.query(
        'SELECT * FROM plot_lines WHERE project_id = ? ORDER BY importance_level DESC, created_at ASC',
        [projectId]
      );
      
      return plotLines.map((plot: any) => ({
        ...plot,
        createdAt: new Date(plot.created_at),
        updatedAt: new Date(plot.updated_at),
      }));
    } catch (error) {
      console.error('Failed to get project plot lines:', error);
      return [];
    }
  }

  // 搜索项目
  static async searchProjects(query: string): Promise<NovelProject[]> {
    try {
      const projects = await window.electronAPI.database.query(
        `SELECT * FROM projects 
         WHERE title LIKE ? OR description LIKE ? OR genre LIKE ?
         ORDER BY updated_at DESC`,
        [`%${query}%`, `%${query}%`, `%${query}%`]
      );
      
      return projects.map((project: any) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        genre: project.genre,
        targetAudience: project.target_audience,
        status: project.status,
        wordCount: project.word_count || 0,
        chapterCount: project.chapter_count || 0,
        settings: JSON.parse(project.settings || '{}'),
        metadata: JSON.parse(project.metadata || '{}'),
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
      }));
    } catch (error) {
      console.error('Failed to search projects:', error);
      return [];
    }
  }

  // 导出项目数据
  static async exportProject(projectId: string): Promise<any> {
    try {
      const [project, chapters, characters, worldBuilding, plotLines] = await Promise.all([
        this.getProjectById(projectId),
        this.getProjectChapters(projectId),
        this.getProjectCharacters(projectId),
        this.getProjectWorldBuilding(projectId),
        this.getProjectPlotLines(projectId)
      ]);

      return {
        project,
        chapters,
        characters,
        worldBuilding,
        plotLines,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Failed to export project:', error);
      throw error;
    }
  }

  // 获取最近项目
  static async getRecentProjects(): Promise<NovelProject[]> {
    try {
      const recentProjectIds = await window.electronAPI.config.get('recentProjects') || [];
      
      if (recentProjectIds.length === 0) {
        return [];
      }

      const placeholders = recentProjectIds.map(() => '?').join(',');
      const projects = await window.electronAPI.database.query(
        `SELECT * FROM projects WHERE id IN (${placeholders}) ORDER BY updated_at DESC`,
        recentProjectIds
      );

      return projects.map((project: any) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        genre: project.genre,
        targetAudience: project.target_audience,
        status: project.status,
        wordCount: project.word_count || 0,
        chapterCount: project.chapter_count || 0,
        settings: JSON.parse(project.settings || '{}'),
        metadata: JSON.parse(project.metadata || '{}'),
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
      }));
    } catch (error) {
      console.error('Failed to get recent projects:', error);
      return [];
    }
  }
}

