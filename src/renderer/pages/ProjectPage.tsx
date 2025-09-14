import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, LinearProgress } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useAppContext } from '@renderer/contexts/AppContext';

export const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { state } = useAppContext();
  
  const project = state.projects.find(p => p.id === projectId);

  if (!project) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          项目未找到
        </Typography>
      </Box>
    );
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning': return '规划中';
      case 'writing': return '写作中';
      case 'editing': return '编辑中';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'planning': return 25;
      case 'writing': return 50;
      case 'editing': return 75;
      case 'completed': return 100;
      default: return 0;
    }
  };

  return (
    <Box>
      {/* 项目标题和基本信息 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {project.title}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {project.description || '暂无描述'}
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              类型
            </Typography>
            <Typography variant="body1">
              {project.genre}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              目标读者
            </Typography>
            <Typography variant="body1">
              {project.targetAudience}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              状态
            </Typography>
            <Typography variant="body1">
              {getStatusText(project.status)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              进度
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={getProgressValue(project.status)} 
                sx={{ flexGrow: 1, mr: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {getProgressValue(project.status)}%
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 统计信息 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                {project.wordCount.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                总字数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                {project.chapterCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                章节数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                {Math.ceil((Date.now() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                创作天数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                {project.wordCount > 0 ? Math.round(project.wordCount / Math.max(project.chapterCount, 1)) : 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                平均章节字数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 快速操作区域 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                章节管理
              </Typography>
              <Typography variant="body2" color="text.secondary">
                管理小说章节，编辑内容，调整结构
              </Typography>
              {/* TODO: 添加章节管理功能 */}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                角色管理
              </Typography>
              <Typography variant="body2" color="text.secondary">
                创建和管理小说角色，设定人物关系
              </Typography>
              {/* TODO: 添加角色管理功能 */}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                世界设定
              </Typography>
              <Typography variant="body2" color="text.secondary">
                构建小说世界观，设定背景环境
              </Typography>
              {/* TODO: 添加世界设定功能 */}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI 助手
              </Typography>
              <Typography variant="body2" color="text.secondary">
                使用AI智能体获得创作建议和灵感
              </Typography>
              {/* TODO: 添加AI助手功能 */}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
