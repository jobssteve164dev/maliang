import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Home as HomeIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  Assessment as StatsIcon,
  SmartToy as AgentIcon,
  MenuBook as ChapterIcon,
  Person as CharacterIcon,
  Public as WorldIcon,
  Timeline as PlotIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { NovelProject } from '@shared/types';
import { ProjectService } from '../services/ProjectService';
import { AgentPanel } from '../components/AgentPanel';
import { AgentChat } from '../components/AgentChat';

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
      {value === index && children}
    </div>
  );
}

interface AgentInfo {
  id: string;
  name: string;
  type: string;
  description: string;
}

export const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<NovelProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [availableAgents, setAvailableAgents] = useState<AgentInfo[]>([]);
  const [projectStats, setProjectStats] = useState<any>(null);

  // 加载项目数据
  const loadProject = async () => {
    if (!projectId) {
      setError('项目ID无效');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [projectData, stats, agents] = await Promise.all([
        ProjectService.getProjectById(projectId),
        ProjectService.getProjectStats(projectId),
        window.electronAPI.agent.getAvailable()
      ]);

      if (!projectData) {
        setError('项目不存在');
        return;
      }

      setProject(projectData);
      setProjectStats(stats);
      setAvailableAgents(agents);
      
      // 默认选择第一个智能体
      if (agents.length > 0) {
        setSelectedAgent(agents[0]);
      }

      setError(null);
    } catch (err: any) {
      console.error('Failed to load project:', err);
      setError('加载项目失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAgentSelect = (agent: AgentInfo) => {
    setSelectedAgent(agent);
    setTabValue(0); // 切换到智能体对话标签
  };

  const handleStartCollaboration = () => {
    // TODO: 实现协作工作流
    console.log('Starting collaboration workflow');
  };

  const handleEditProject = () => {
    // TODO: 打开项目编辑对话框
    console.log('Edit project');
  };

  const handleViewStats = () => {
    // TODO: 打开项目统计对话框
    console.log('View project stats');
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" height={40} width={300} />
        <Skeleton variant="text" height={20} width={200} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button size="small" onClick={() => navigate('/')}>
            返回首页
          </Button>
        }>
          {error || '项目不存在'}
        </Alert>
      </Box>
    );
  }

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

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 头部导航 */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            {/* 面包屑导航 */}
            <Breadcrumbs sx={{ mb: 1 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/')}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <HomeIcon fontSize="small" />
                首页
              </Link>
              <Typography variant="body2" color="text.primary">
                {project.title}
              </Typography>
            </Breadcrumbs>

            {/* 项目标题和信息 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h5" component="h1">
                {project.title}
              </Typography>
              <Chip 
                label={getStatusText(project.status)} 
                color={getStatusColor(project.status) as any}
                size="small"
              />
              <Chip 
                label={project.genre} 
                variant="outlined" 
                size="small"
              />
            </Box>

            {project.description && (
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600 }}>
                {project.description}
              </Typography>
            )}
          </Box>

          {/* 操作按钮 */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="查看统计">
              <IconButton onClick={handleViewStats}>
                <StatsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="编辑项目">
              <IconButton onClick={handleEditProject}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="项目设置">
              <IconButton>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 项目统计 */}
        {projectStats && (
          <Box sx={{ display: 'flex', gap: 4, mt: 2 }}>
            <Box textAlign="center">
              <Typography variant="h6" color="primary">
                {projectStats.chapters}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                章节
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" color="primary">
                {projectStats.characters}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                角色
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" color="primary">
                {projectStats.worldBuilding}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                世界设定
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" color="primary">
                {(projectStats.totalWords / 1000).toFixed(1)}k
              </Typography>
              <Typography variant="caption" color="text.secondary">
                总字数
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      {/* 主要内容区域 */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧智能体面板 */}
        <Paper sx={{ width: 320, borderRadius: 0, borderRight: 1, borderColor: 'divider' }}>
          <AgentPanel
            selectedAgent={selectedAgent}
            onAgentSelect={handleAgentSelect}
            onStartCollaboration={handleStartCollaboration}
            projectId={projectId}
          />
        </Paper>

        {/* 右侧内容区域 */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* 标签页导航 */}
          <Paper sx={{ borderRadius: 0, borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab 
                icon={<AgentIcon />} 
                label="AI助手" 
                iconPosition="start"
              />
              <Tab 
                icon={<ChapterIcon />} 
                label="章节管理" 
                iconPosition="start"
              />
              <Tab 
                icon={<CharacterIcon />} 
                label="角色设定" 
                iconPosition="start"
              />
              <Tab 
                icon={<WorldIcon />} 
                label="世界构建" 
                iconPosition="start"
              />
              <Tab 
                icon={<PlotIcon />} 
                label="情节规划" 
                iconPosition="start"
              />
            </Tabs>
          </Paper>

          {/* 标签页内容 */}
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <TabPanel value={tabValue} index={0}>
              {selectedAgent ? (
                <AgentChat
                  projectId={projectId!}
                  selectedAgent={selectedAgent}
                  onAgentChange={setSelectedAgent}
                  availableAgents={availableAgents}
                />
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    请选择一个智能体
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    从左侧面板选择一个智能体开始对话
                  </Typography>
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  章节管理
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  章节管理功能正在开发中...
                </Typography>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  角色设定
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  角色管理功能正在开发中...
                </Typography>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  世界构建
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  世界观编辑器正在开发中...
                </Typography>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  情节规划
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  情节规划工具正在开发中...
                </Typography>
              </Box>
            </TabPanel>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
