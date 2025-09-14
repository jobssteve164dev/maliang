/**
 * 主页组件
 * 显示项目列表、最近项目和快速操作
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Fab,
  Skeleton,
  Alert,
  Chip,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { NovelProject } from '@shared/types';
import { ProjectService } from '../services/ProjectService';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectDialog } from '../components/ProjectDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const HomePage: React.FC = () => {
  const [projects, setProjects] = useState<NovelProject[]>([]);
  const [recentProjects, setRecentProjects] = useState<NovelProject[]>([]);
  const [projectStats, setProjectStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<NovelProject | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 加载项目数据
  const loadProjects = async () => {
    try {
      setLoading(true);
      const [allProjects, recent] = await Promise.all([
        ProjectService.getAllProjects(),
        ProjectService.getRecentProjects()
      ]);

      setProjects(allProjects);
      setRecentProjects(recent);

      // 加载项目统计
      const stats: Record<string, any> = {};
      for (const project of allProjects) {
        stats[project.id] = await ProjectService.getProjectStats(project.id);
      }
      setProjectStats(stats);

      setError(null);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError('加载项目失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // 搜索项目
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadProjects();
      return;
    }

    try {
      const searchResults = await ProjectService.searchProjects(query);
      setProjects(searchResults);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  // 创建项目
  const handleCreateProject = async (projectData: Omit<NovelProject, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await ProjectService.createProject(projectData);
      await loadProjects();
      setDialogOpen(false);
    } catch (err: any) {
      throw new Error(err.message || '创建项目失败');
    }
  };

  // 更新项目
  const handleUpdateProject = async (projectData: Omit<NovelProject, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingProject) return;

    try {
      await ProjectService.updateProject(editingProject.id, projectData);
      await loadProjects();
      setDialogOpen(false);
      setEditingProject(null);
    } catch (err: any) {
      throw new Error(err.message || '更新项目失败');
    }
  };

  // 打开项目
  const handleOpenProject = (projectId: string) => {
    window.location.href = `#/project/${projectId}`;
  };

  // 编辑项目
  const handleEditProject = (project: NovelProject) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  // 删除项目
  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('确定要删除这个项目吗？此操作不可撤销。')) {
      return;
    }

    try {
      await ProjectService.deleteProject(projectId);
      await loadProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('删除项目失败，请重试');
    }
  };

  // 查看项目统计
  const handleViewStats = (projectId: string) => {
    // TODO: 打开项目统计对话框
    console.log('View stats for project:', projectId);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingProject(null);
  };

  const filteredProjects = searchQuery 
    ? projects.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.genre.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : projects;

  const displayProjects = tabValue === 0 ? recentProjects : filteredProjects;

  return (
    <Box sx={{ p: 3 }}>
      {/* 页面标题 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          我的小说项目
        </Typography>
        <Typography variant="body1" color="text.secondary">
          使用AI智能体协助您的创作之旅
        </Typography>
      </Box>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 工具栏 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            size="small"
            placeholder="搜索项目..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          
          <Tooltip title="刷新">
            <IconButton onClick={loadProjects} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="网格视图">
            <IconButton 
              onClick={() => setViewMode('grid')}
              color={viewMode === 'grid' ? 'primary' : 'default'}
            >
              <GridViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="列表视图">
            <IconButton 
              onClick={() => setViewMode('list')}
              color={viewMode === 'list' ? 'primary' : 'default'}
            >
              <ListViewIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ ml: 2 }}
          >
            新建项目
          </Button>
        </Box>
      </Box>

      {/* 标签页 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`最近项目 (${recentProjects.length})`} />
          <Tab label={`所有项目 (${projects.length})`} />
        </Tabs>
      </Box>

      {/* 项目列表 */}
      <TabPanel value={tabValue} index={0}>
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((n) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={n}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" height={32} />
                    <Skeleton variant="text" height={60} />
                    <Skeleton variant="rectangular" height={100} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : recentProjects.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              还没有项目
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              创建您的第一个小说项目，开始AI辅助创作之旅
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              创建新项目
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {recentProjects.map((project) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
                <ProjectCard
                  project={project}
                  stats={projectStats[project.id]}
                  onOpen={handleOpenProject}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                  onViewStats={handleViewStats}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={n}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" height={32} />
                    <Skeleton variant="text" height={60} />
                    <Skeleton variant="rectangular" height={100} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : displayProjects.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchQuery ? '没有找到匹配的项目' : '还没有项目'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchQuery ? '尝试使用不同的关键词搜索' : '创建您的第一个小说项目'}
            </Typography>
            {!searchQuery && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
              >
                创建新项目
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            {displayProjects.map((project) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
                <ProjectCard
                  project={project}
                  stats={projectStats[project.id]}
                  onOpen={handleOpenProject}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                  onViewStats={handleViewStats}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* 浮动操作按钮 */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => setDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* 项目创建/编辑对话框 */}
      <ProjectDialog
        open={dialogOpen}
        project={editingProject}
        onClose={handleDialogClose}
        onSave={editingProject ? handleUpdateProject : handleCreateProject}
      />
    </Box>
  );
};