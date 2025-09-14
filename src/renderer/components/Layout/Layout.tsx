import React, { ReactNode } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { Menu as MenuIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAppContext } from '@renderer/contexts/AppContext';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* 顶部应用栏 */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#1976d2'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            onClick={handleToggleSidebar}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Novel AI Assistant
            {state.currentProject && ` - ${state.currentProject.title}`}
          </Typography>
          
          <IconButton
            color="inherit"
            aria-label="settings"
            onClick={handleSettingsClick}
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 侧边栏 */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* 主内容区域 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8, // 为AppBar留出空间
          ml: sidebarOpen ? '280px' : 0,
          transition: (theme) => theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
