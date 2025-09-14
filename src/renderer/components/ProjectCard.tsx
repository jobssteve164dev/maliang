/**
 * 项目卡片组件
 * 显示项目基本信息和操作按钮
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  FolderOpen as OpenIcon,
  Assessment as StatsIcon,
  Schedule as TimeIcon
} from '@mui/icons-material';
import { NovelProject } from '@shared/types';

interface ProjectCardProps {
  project: NovelProject;
  stats?: {
    chapters: number;
    characters: number;
    worldBuilding: number;
    plotLines: number;
    totalWords: number;
  };
  onOpen: (projectId: string) => void;
  onEdit: (project: NovelProject) => void;
  onDelete: (projectId: string) => void;
  onViewStats: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  stats,
  onOpen,
  onEdit,
  onDelete,
  onViewStats
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit(project);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete(project.id);
  };

  const handleViewStats = () => {
    handleMenuClose();
    onViewStats(project.id);
  };

  // 计算进度百分比
  const getProgress = () => {
    if (project.status === 'completed') return 100;
    if (project.status === 'editing') return 80;
    if (project.status === 'writing') return 60;
    if (project.status === 'planning') return 30;
    return 0;
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'editing': return 'warning';
      case 'writing': return 'primary';
      case 'planning': return 'info';
      default: return 'default';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'editing': return '编辑中';
      case 'writing': return '写作中';
      case 'planning': return '规划中';
      default: return '未知';
    }
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* 标题和菜单 */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography 
            variant="h6" 
            component="h3" 
            sx={{ 
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.3,
              minHeight: '2.6em'
            }}
          >
            {project.title}
          </Typography>
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{ ml: 1, flexShrink: 0 }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* 描述 */}
        {project.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.4,
              minHeight: '4.2em'
            }}
          >
            {project.description}
          </Typography>
        )}

        {/* 标签 */}
        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          <Chip 
            label={project.genre} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
          <Chip 
            label={getStatusText(project.status)} 
            size="small" 
            color={getStatusColor(project.status) as any}
          />
          <Chip 
            label={project.targetAudience} 
            size="small" 
            variant="outlined"
          />
        </Box>

        {/* 进度条 */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="caption" color="text.secondary">
              进度
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getProgress()}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={getProgress()} 
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* 统计信息 */}
        {stats && (
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Box textAlign="center">
              <Typography variant="h6" color="primary">
                {stats.chapters}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                章节
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" color="primary">
                {stats.characters}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                角色
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" color="primary">
                {(stats.totalWords / 1000).toFixed(1)}k
              </Typography>
              <Typography variant="caption" color="text.secondary">
                字数
              </Typography>
            </Box>
          </Box>
        )}

        {/* 时间信息 */}
        <Box display="flex" alignItems="center" gap={0.5}>
          <TimeIcon fontSize="small" color="disabled" />
          <Typography variant="caption" color="text.secondary">
            更新于 {formatDate(project.updatedAt)}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          variant="contained"
          startIcon={<OpenIcon />}
          onClick={() => onOpen(project.id)}
          size="small"
        >
          打开项目
        </Button>
        
        <Box>
          <Tooltip title="查看统计">
            <IconButton size="small" onClick={() => onViewStats(project.id)}>
              <StatsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="编辑项目">
            <IconButton size="small" onClick={() => onEdit(project)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>

      {/* 菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => onOpen(project.id)}>
          <OpenIcon fontSize="small" sx={{ mr: 1 }} />
          打开项目
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          编辑信息
        </MenuItem>
        <MenuItem onClick={handleViewStats}>
          <StatsIcon fontSize="small" sx={{ mr: 1 }} />
          查看统计
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          删除项目
        </MenuItem>
      </Menu>
    </Card>
  );
};

