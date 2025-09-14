import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { App } from './App';
import { AppProvider } from './contexts/AppContext';

// 调试信息：检查关键依赖
console.log('🚀 [DEBUG] Renderer process starting...');
console.log('🔍 [DEBUG] React version:', React.version);
console.log('🔍 [DEBUG] Window object:', typeof window);
console.log('🔍 [DEBUG] ElectronAPI available:', typeof window.electronAPI);
console.log('🔍 [DEBUG] Document ready state:', document.readyState);

// 创建Material-UI主题
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
});

const container = document.getElementById('root');
console.log('🔍 [DEBUG] Root container found:', !!container);

if (!container) {
  console.error('❌ [ERROR] Root element not found');
  throw new Error('Root element not found');
}

console.log('🔍 [DEBUG] Creating React root...');
const root = createRoot(container);

console.log('🔍 [DEBUG] Rendering React app...');

// 错误边界组件
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error?: Error}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('❌ [ERROR] React Error Boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('❌ [ERROR] React Error Boundary details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', fontFamily: 'monospace' }}>
          <h2>应用启动失败</h2>
          <p>错误信息: {this.state.error?.message}</p>
          <p>错误堆栈: {this.state.error?.stack}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

try {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppProvider>
              <App />
            </AppProvider>
          </ThemeProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('✅ [DEBUG] React app rendered successfully');
} catch (error) {
  console.error('❌ [ERROR] Failed to render React app:', error);
  // 显示基本的错误信息
  if (container) {
    container.innerHTML = `
      <div style="padding: 20px; color: red; font-family: monospace;">
        <h2>渲染失败</h2>
        <p>错误: ${error}</p>
      </div>
    `;
  }
}
