import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  Home as HomeIcon,
  Book as BookIcon,
  Person as PersonIcon,
  Public as WorldIcon,
  AccountTree as RelationshipIcon,
  Chat as DialogueIcon,
  Timeline as PlotIcon,
  Lightbulb as ThemeIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '@renderer/contexts/AppContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppContext();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const mainMenuItems = [
    { text: '首页', icon: <HomeIcon />, path: '/' },
  ];

  const projectMenuItems = state.currentProject ? [
    { text: '项目概览', icon: <BookIcon />, path: `/project/${state.currentProject.id}` },
    { text: '角色管理', icon: <PersonIcon />, path: `/project/${state.currentProject.id}/characters` },
    { text: '世界设定', icon: <WorldIcon />, path: `/project/${state.currentProject.id}/world` },
    { text: '关系网络', icon: <RelationshipIcon />, path: `/project/${state.currentProject.id}/relationships` },
  ] : [];

  const agentMenuItems = [
    { text: '主题策划师', icon: <ThemeIcon />, agentType: 'theme', color: '#ff9800' },
    { text: '大纲架构师', icon: <BookIcon />, agentType: 'outline', color: '#2196f3' },
    { text: '世界构建师', icon: <WorldIcon />, agentType: 'world', color: '#4caf50' },
    { text: '人物设计师', icon: <PersonIcon />, agentType: 'character', color: '#9c27b0' },
    { text: '关系网络师', icon: <RelationshipIcon />, agentType: 'relationship', color: '#f44336' },
    { text: '对话大师', icon: <DialogueIcon />, agentType: 'dialogue', color: '#00bcd4' },
    { text: '情节顾问', icon: <PlotIcon />, agentType: 'plot', color: '#795548' },
  ];

  const drawerWidth = 280;

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          mt: 8, // 为AppBar留出空间
        },
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%' }}>
        {/* 主导航 */}
        <List>
          {mainMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />

        {/* 项目导航 */}
        {state.currentProject && (
          <>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                当前项目
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {state.currentProject.title}
              </Typography>
              <Chip 
                label={state.currentProject.status} 
                size="small" 
                sx={{ mt: 1 }}
                color={
                  state.currentProject.status === 'completed' ? 'success' :
                  state.currentProject.status === 'writing' ? 'primary' :
                  state.currentProject.status === 'editing' ? 'warning' : 'default'
                }
              />
            </Box>
            
            <List>
              {projectMenuItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    selected={location.pathname === item.path}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>

            <Divider />
          </>
        )}

        {/* AI智能体 */}
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            AI 智能体
          </Typography>
        </Box>
        
        <List>
          {agentMenuItems.map((item) => {
            const agent = state.agents.find(a => a.type === item.agentType);
            const isEnabled = agent?.enabled ?? false;
            
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  disabled={!isEnabled || !state.currentProject}
                  onClick={() => {
                    if (state.currentProject) {
                      // TODO: 打开智能体对话界面
                      console.log(`Opening ${item.agentType} agent`);
                    }
                  }}
                >
                  <ListItemIcon>
                    <Box
                      sx={{
                        color: isEnabled ? item.color : 'text.disabled',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {item.icon}
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    secondary={!isEnabled ? '未启用' : undefined}
                  />
                  {isEnabled && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: item.color,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
};
