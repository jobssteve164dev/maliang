import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './pages/HomePage';
import { ProjectPage } from './pages/ProjectPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAppContext } from './contexts/AppContext';

export const App: React.FC = () => {
  console.log('🔍 [DEBUG] App component rendering...');
  
  const { initializeApp } = useAppContext();
  
  console.log('🔍 [DEBUG] App got initializeApp function:', typeof initializeApp);

  useEffect(() => {
    console.log('🔍 [DEBUG] App useEffect running, calling initializeApp...');
    initializeApp();
  }, [initializeApp]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/project/:projectId" element={<ProjectPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </Box>
  );
};
