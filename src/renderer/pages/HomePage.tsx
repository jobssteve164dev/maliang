import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Book as BookIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@renderer/contexts/AppContext';
import { NovelProject } from '@shared/types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { state, createProject, setCurrentProject } = useAppContext();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    genre: '',
    targetAudience: '',
  });

  const genres = [
    '科幻小说',
    '奇幻小说',
    '悬疑推理',
    '言情小说',
    '历史小说',
    '武侠小说',
    '都市小说',
    '青春小说',
    '其他',
  ];

  const audiences = [
    '青少年',
    '成年人',
    '全年龄',
    '专业读者',
  ];

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) return;

    try {
      setCreating(true);
      const project = await createProject({
        ...newProject,
        status: 'planning',
        wordCount: 0,
        chapterCount: 0,
      });
      
      setCurrentProject(project);
      setCreateDialogOpen(false);
      setNewProject({ title: '', description: '', genre: '', targetAudience: '' });
      navigate(`/project/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenProject = (project: NovelProject) => {
    setCurrentProject(project);
    navigate(`/project/${project.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'writing': return 'primary';
      case 'editing': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning': return '规划中';
      case 'writing': return '写作中';
      case 'editing': return '编辑中';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  if (!state.isInitialized) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* 页面标题和创建按钮 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          我的小说项目
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          创建新项目
        </Button>
      </Box>

      {/* 项目列表 */}
      {state.projects.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="400px"
          textAlign="center"
        >
          <BookIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            还没有任何项目
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            创建你的第一个小说项目，开始AI辅助创作之旅
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            创建新项目
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {state.projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {project.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {project.description || '暂无描述'}
                  </Typography>
                  
                  <Box display="flex" gap={1} mb={2}>
                    <Chip label={project.genre} size="small" />
                    <Chip 
                      label={getStatusText(project.status)} 
                      size="small" 
                      color={getStatusColor(project.status)}
                    />
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    字数: {project.wordCount.toLocaleString()} | 
                    章节: {project.chapterCount} | 
                    更新: {project.updatedAt.toLocaleDateString()}
                  </Typography>
                </CardContent>
                
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => handleOpenProject(project)}
                  >
                    打开项目
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 创建项目对话框 */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>创建新的小说项目</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="项目标题"
            fullWidth
            variant="outlined"
            value={newProject.title}
            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="项目描述"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            select
            margin="dense"
            label="小说类型"
            fullWidth
            variant="outlined"
            value={newProject.genre}
            onChange={(e) => setNewProject({ ...newProject, genre: e.target.value })}
            sx={{ mb: 2 }}
          >
            {genres.map((genre) => (
              <MenuItem key={genre} value={genre}>
                {genre}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            select
            margin="dense"
            label="目标读者"
            fullWidth
            variant="outlined"
            value={newProject.targetAudience}
            onChange={(e) => setNewProject({ ...newProject, targetAudience: e.target.value })}
          >
            {audiences.map((audience) => (
              <MenuItem key={audience} value={audience}>
                {audience}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            取消
          </Button>
          <Button 
            onClick={handleCreateProject}
            variant="contained"
            disabled={!newProject.title.trim() || creating}
          >
            {creating ? <CircularProgress size={20} /> : '创建'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
