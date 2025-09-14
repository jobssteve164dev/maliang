/**
 * 智能体面板组件
 * 显示可用智能体列表和状态
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  Badge,
  Tooltip,
  IconButton,
  Divider,
  Button,
  Alert,
  Skeleton,
  Card,
  CardContent
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Settings as SettingsIcon,
  PlayArrow as StartIcon,
  Group as CollaborationIcon,
  Psychology as ThemeIcon,
  AccountTree as OutlineIcon,
  Public as WorldIcon,
  Person as CharacterIcon,
  Favorite as RelationshipIcon,
  Chat as DialogueIcon,
  Timeline as PlotIcon
} from '@mui/icons-material';

interface AgentInfo {
  id: string;
  name: string;
  type: string;
  description: string;
  enabled?: boolean;
  status?: 'idle' | 'busy' | 'error';
}

interface AgentPanelProps {
  selectedAgent: AgentInfo | null;
  onAgentSelect: (agent: AgentInfo) => void;
  onStartCollaboration: () => void;
  projectId?: string;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  selectedAgent,
  onAgentSelect,
  onStartCollaboration,
  projectId
}) => {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentStats, setAgentStats] = useState<Record<string, any>>({});

  // 加载智能体列表
  const loadAgents = async () => {
    try {
      setLoading(true);
      const availableAgents = await window.electronAPI.agent.getAvailable();
      setAgents(availableAgents);

      // 加载智能体统计信息
      if (projectId) {
        const stats = await window.electronAPI.agent.getStats(projectId);
        setAgentStats(stats);
      }

      setError(null);
    } catch (err: any) {
      console.error('Failed to load agents:', err);
      setError('加载智能体失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, [projectId]);

  // 获取智能体图标
  const getAgentIcon = (type: string) => {
    const icons: Record<string, React.ReactElement> = {
      theme: <ThemeIcon />,
      outline: <OutlineIcon />,
      world: <WorldIcon />,
      character: <CharacterIcon />,
      relationship: <RelationshipIcon />,
      dialogue: <DialogueIcon />,
      plot: <PlotIcon />
    };
    return icons[type] || <BotIcon />;
  };

  // 获取智能体颜色
  const getAgentColor = (type: string) => {
    const colors: Record<string, string> = {
      theme: '#9c27b0',
      outline: '#2196f3',
      world: '#4caf50',
      character: '#ff9800',
      relationship: '#e91e63',
      dialogue: '#00bcd4',
      plot: '#795548'
    };
    return colors[type] || '#666';
  };

  // 获取智能体状态颜色
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'busy': return 'warning';
      case 'error': return 'error';
      default: return 'success';
    }
  };

  // 获取类型显示名称
  const getTypeDisplayName = (type: string) => {
    const names: Record<string, string> = {
      theme: '主题策划',
      outline: '大纲架构',
      world: '世界构建',
      character: '人物设计',
      relationship: '关系网络',
      dialogue: '对话大师',
      plot: '情节顾问'
    };
    return names[type] || type;
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          智能体助手
        </Typography>
        {[1, 2, 3, 4, 5].map((n) => (
          <Box key={n} sx={{ mb: 2 }}>
            <Skeleton variant="rectangular" height={60} />
          </Box>
        ))}
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" action={
          <Button size="small" onClick={loadAgents}>
            重试
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 头部 */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            智能体助手
          </Typography>
          <Tooltip title="设置">
            <IconButton size="small">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* 协作按钮 */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<CollaborationIcon />}
          onClick={onStartCollaboration}
          sx={{ mb: 2 }}
        >
          启动协作工作流
        </Button>

        {/* 统计信息 */}
        {agentStats.totalAgents && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                智能体状态
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box textAlign="center">
                  <Typography variant="body2" fontWeight="bold">
                    {agentStats.enabledAgents}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    可用
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="body2" fontWeight="bold">
                    {agentStats.totalAgents}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    总计
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="body2" fontWeight="bold">
                    {Object.keys(agentStats.agentTypes || {}).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    类型
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* 智能体列表 */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {agents.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              没有可用的智能体
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {agents.map((agent, index) => (
              <React.Fragment key={agent.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={selectedAgent?.id === agent.id}
                    onClick={() => onAgentSelect(agent)}
                    sx={{ 
                      py: 1.5,
                      '&.Mui-selected': {
                        bgcolor: 'primary.50',
                        borderRight: 3,
                        borderRightColor: 'primary.main'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: agent.enabled !== false ? 'success.main' : 'grey.400',
                              border: 2,
                              borderColor: 'background.paper'
                            }}
                          />
                        }
                      >
                        <Avatar sx={{ bgcolor: getAgentColor(agent.type) }}>
                          {getAgentIcon(agent.type)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {agent.name}
                          </Typography>
                          <Chip 
                            label={getTypeDisplayName(agent.type)} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.7rem',
                              height: 20,
                              borderColor: getAgentColor(agent.type),
                              color: getAgentColor(agent.type)
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.2,
                            mt: 0.5
                          }}
                        >
                          {agent.description}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                
                {index < agents.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* 底部操作区 */}
      {selectedAgent && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Card variant="outlined">
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: getAgentColor(selectedAgent.type) }}>
                  {getAgentIcon(selectedAgent.type)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2">
                    {selectedAgent.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getTypeDisplayName(selectedAgent.type)}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedAgent.description}
              </Typography>

              <Button
                fullWidth
                variant="contained"
                size="small"
                startIcon={<StartIcon />}
                disabled={selectedAgent.enabled === false}
              >
                开始对话
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

