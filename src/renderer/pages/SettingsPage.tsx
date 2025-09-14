import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Science as TestIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAppContext } from '@renderer/contexts/AppContext';
import { AIModelConfig } from '@shared/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div 
      hidden={value !== index}
      style={{ 
        flex: 1, 
        overflow: 'hidden',
        display: value === index ? 'flex' : 'none',
        flexDirection: 'column'
      }}
    >
      {value === index && (
        <Box sx={{ 
          p: { xs: 1, sm: 2, md: 3 }, // 响应式内边距
          flex: 1,
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: { xs: '6px', sm: '8px' }, // 响应式滚动条宽度
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#a8a8a8',
          },
        }}>
          {children}
        </Box>
      )}
    </div>
  );
};

interface TestResult {
  provider: string;
  status: 'testing' | 'success' | 'error' | 'idle';
  message?: string;
  models?: string[];
}

export const SettingsPage: React.FC = () => {
  const { state, updateConfig, loadConfig } = useAppContext();
  const [tabValue, setTabValue] = useState(0);
  const [aiModels, setAiModels] = useState<AIModelConfig[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  // 初始化AI模型配置
  useEffect(() => {
    console.log('🔍 [DEBUG] SettingsPage: state.config changed', state.config);
    console.log('🔍 [DEBUG] SettingsPage: state.config?.aiModels', state.config?.aiModels);
    console.log('🔍 [DEBUG] SettingsPage: aiModels length before update', aiModels.length);
    
    if (state.config?.aiModels && Array.isArray(state.config.aiModels) && state.config.aiModels.length > 0) {
      console.log('🔍 [DEBUG] SettingsPage: setting aiModels from config', state.config.aiModels.length);
      setAiModels(state.config.aiModels);
    } else {
      // 如果没有配置，使用默认配置
      const defaultModels: AIModelConfig[] = [
        {
          provider: 'openai',
          model: 'gpt-4',
          maxTokens: 4000,
          temperature: 0.7,
          enabled: false
        },
        {
          provider: 'deepseek',
          model: 'deepseek-chat',
          maxTokens: 4000,
          temperature: 0.7,
          enabled: false
        },
        {
          provider: 'openrouter',
          model: 'anthropic/claude-3-sonnet',
          baseUrl: 'https://openrouter.ai/api/v1',
          maxTokens: 4000,
          temperature: 0.7,
          enabled: false
        },
        {
          provider: 'ollama',
          model: 'llama2',
          baseUrl: 'http://localhost:11434',
          maxTokens: 4000,
          temperature: 0.7,
          enabled: false
        }
      ];
      console.log('🔍 [DEBUG] SettingsPage: using default aiModels', defaultModels.length);
      setAiModels(defaultModels);
    }
  }, [state.config]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleModelConfigChange = (index: number, field: keyof AIModelConfig, value: any) => {
    const updatedModels = [...aiModels];
    updatedModels[index] = { ...updatedModels[index], [field]: value };
    setAiModels(updatedModels);
  };

  const handleSaveAIModels = async () => {
    try {
      setSaving(true);
      await updateConfig({ aiModels });
      setSaveMessage('AI模型配置已保存');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage('保存失败，请重试');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (provider: string, model: AIModelConfig) => {
    console.log('🔍 [DEBUG] Testing connection for provider:', provider);
    
    setTestResults(prev => ({
      ...prev,
      [provider]: { provider, status: 'testing' }
    }));

    try {
      // 调用后端测试API连接
      const result = await window.electronAPI.ai.testProvider(provider);
      console.log('🔍 [DEBUG] Test result:', result);
      
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          provider,
          status: 'success',
          message: '连接成功',
          models: result.models || []
        }
      }));
    } catch (error) {
      console.error('❌ [ERROR] Test connection failed:', error);
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          provider,
          status: 'error',
          message: error instanceof Error ? error.message : '连接失败'
        }
      }));
    }
  };

  const handleRefreshModels = async (provider: string) => {
    try {
      const models = await window.electronAPI.ai.getAvailableModels(provider);
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          models: models || []
        }
      }));
    } catch (error) {
      console.error('Failed to refresh models:', error);
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'openai': return 'OpenAI';
      case 'deepseek': return 'DeepSeek';
      case 'openrouter': return 'OpenRouter';
      case 'ollama': return 'Ollama';
      default: return provider;
    }
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      maxWidth: '1400px', // 限制最大宽度
      mx: 'auto', // 水平居中
      px: { xs: 1, sm: 2, md: 3 }, // 响应式内边距
    }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        sx={{ 
          pt: 2, 
          pb: 1,
          textAlign: { xs: 'center', sm: 'left' }, // 小屏幕居中，大屏幕左对齐
          fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } // 响应式字体大小
        }}
      >
        设置
      </Typography>

      <Paper sx={{ 
        width: '100%', 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: { xs: 1, sm: 2 }, // 响应式圆角
        boxShadow: { xs: 1, sm: 2, md: 3 } // 响应式阴影
      }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="AI 模型" />
          <Tab label="智能体" />
          <Tab label="通用设置" />
        </Tabs>

        {/* AI 模型配置 */}
        <TabPanel value={tabValue} index={0}>
          {saveMessage && (
            <Alert severity={saveMessage.includes('失败') ? 'error' : 'success'} sx={{ mb: 2 }}>
              {saveMessage}
            </Alert>
          )}
          
          <Typography variant="h6" gutterBottom>
            AI 模型配置
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            配置不同的AI模型提供商，用于驱动智能体功能
          </Typography>

                    <Grid container spacing={{ xs: 2, sm: 3 }}>
                      {aiModels.map((model, index) => (
                        <Grid item xs={12} sm={12} md={6} lg={6} xl={4} key={`${model.provider}-${index}`}>
                <Card>
                  <CardContent>
                    <Box 
                      display="flex" 
                      justifyContent="space-between" 
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      flexDirection={{ xs: 'column', sm: 'row' }}
                      mb={2}
                      gap={{ xs: 1, sm: 0 }}
                    >
                      <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                        {getProviderName(model.provider)}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        {testResults[model.provider] && testResults[model.provider].status !== 'idle' && (
                          <Tooltip title={testResults[model.provider].message || ''}>
                            <Box display="inline-flex">
                              {testResults[model.provider].status === 'testing' ? (
                                <CircularProgress size={16} />
                              ) : testResults[model.provider].status === 'success' ? (
                                <CheckIcon color="success" fontSize="small" />
                              ) : testResults[model.provider].status === 'error' ? (
                                <ErrorIcon color="error" fontSize="small" />
                              ) : (
                                <InfoIcon color="info" fontSize="small" />
                              )}
                            </Box>
                          </Tooltip>
                        )}
                        <Chip 
                          label={model.enabled ? '已启用' : '未启用'} 
                          color={model.enabled ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={model.enabled}
                          onChange={(e) => handleModelConfigChange(index, 'enabled', e.target.checked)}
                        />
                      }
                      label="启用此模型"
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="模型名称"
                      value={model.model}
                      onChange={(e) => handleModelConfigChange(index, 'model', e.target.value)}
                      sx={{ mb: 2 }}
                      size="small"
                    />

                    {model.provider !== 'ollama' && (
                      <TextField
                        fullWidth
                        label="API Key"
                        type="password"
                        value={model.apiKey || ''}
                        onChange={(e) => handleModelConfigChange(index, 'apiKey', e.target.value)}
                        sx={{ mb: 2 }}
                        size="small"
                        placeholder="请输入API密钥"
                      />
                    )}

                    {(model.provider === 'ollama' || model.provider === 'openrouter') && (
                      <TextField
                        fullWidth
                        label="Base URL"
                        value={model.baseUrl || ''}
                        onChange={(e) => handleModelConfigChange(index, 'baseUrl', e.target.value)}
                        sx={{ mb: 2 }}
                        size="small"
                        placeholder={model.provider === 'ollama' ? 'http://localhost:11434' : 'https://openrouter.ai/api/v1'}
                      />
                    )}

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="最大Token数"
                          type="number"
                          value={model.maxTokens}
                          onChange={(e) => handleModelConfigChange(index, 'maxTokens', parseInt(e.target.value))}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="温度"
                          type="number"
                          inputProps={{ min: 0, max: 2, step: 0.1 }}
                          value={model.temperature}
                          onChange={(e) => handleModelConfigChange(index, 'temperature', parseFloat(e.target.value))}
                          size="small"
                        />
                      </Grid>
                    </Grid>

                    {/* 提供商特定说明 */}
                    <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {model.provider === 'openai' && '需要OpenAI API密钥，支持GPT-3.5、GPT-4等模型'}
                        {model.provider === 'deepseek' && '需要DeepSeek API密钥，支持deepseek-chat、deepseek-coder等模型'}
                        {model.provider === 'openrouter' && '需要OpenRouter API密钥，可访问多种开源和商业模型'}
                        {model.provider === 'ollama' && '需要本地运行Ollama服务，支持Llama、Mistral等开源模型'}
                      </Typography>
                    </Box>

                    {/* 可用模型列表 */}
                    {testResults[model.provider]?.models && testResults[model.provider].models!.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          可用模型:
                        </Typography>
                        <Box sx={{ maxHeight: 100, overflow: 'auto' }}>
                          {testResults[model.provider].models!.map((modelName, idx) => (
                            <Chip
                              key={idx}
                              label={modelName}
                              size="small"
                              variant="outlined"
                              sx={{ m: 0.5 }}
                              onClick={() => handleModelConfigChange(index, 'model', modelName)}
                              color={model.model === modelName ? 'primary' : 'default'}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ 
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 0 },
                    alignItems: { xs: 'stretch', sm: 'center' }
                  }}>
                    <Button
                      size="small"
                      startIcon={testResults[model.provider]?.status === 'testing' ? 
                        <CircularProgress size={16} /> : <TestIcon />}
                      onClick={() => handleTestConnection(model.provider, model)}
                      disabled={testResults[model.provider]?.status === 'testing' || 
                        (model.provider !== 'ollama' && !model.apiKey)}
                      sx={{ 
                        minWidth: { xs: 'auto', sm: '120px' },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      测试连接
                    </Button>
                    
                    {model.provider !== 'ollama' && (
                      <Button
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={() => handleRefreshModels(model.provider)}
                        disabled={!model.apiKey}
                        sx={{ 
                          minWidth: { xs: 'auto', sm: '120px' },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      >
                        刷新模型
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ 
            mt: 3, 
            display: 'flex', 
            justifyContent: { xs: 'center', sm: 'flex-end' },
            px: { xs: 1, sm: 0 }
          }}>
            <Button
              variant="contained"
              onClick={handleSaveAIModels}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : undefined}
              sx={{
                minWidth: { xs: '200px', sm: '140px' },
                fontSize: { xs: '0.875rem', sm: '0.875rem' },
                py: { xs: 1.5, sm: 1 }
              }}
            >
              {saving ? '保存中...' : '保存配置'}
            </Button>
          </Box>
        </TabPanel>

        {/* 智能体配置 */}
        <TabPanel value={tabValue} index={1}>
          <Typography 
            variant="h5" 
            component="h2" 
            gutterBottom
            sx={{ 
              mb: 1,
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            智能体配置
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            paragraph
            sx={{ mb: 3 }}
          >
            管理AI智能体的启用状态和配置
          </Typography>

          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {state.agents.map((agent) => (
              <Grid item xs={12} sm={12} md={6} lg={6} xl={4} key={agent.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {agent.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {agent.description}
                    </Typography>
                    <Chip 
                      label={agent.enabled ? '已启用' : '未启用'} 
                      color={agent.enabled ? 'success' : 'default'}
                      size="small"
                    />
                  </CardContent>
                  <CardActions sx={{ 
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 0 },
                    alignItems: { xs: 'stretch', sm: 'center' }
                  }}>
                    <Button 
                      size="small"
                      sx={{ 
                        minWidth: { xs: 'auto', sm: '80px' },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      配置
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* 通用设置 */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ 
            minWidth: { xs: '100%', sm: '600px', md: '800px', lg: '1000px' },
            width: '100%'
          }}>
            <Typography 
              variant="h5" 
              component="h2" 
              gutterBottom
              sx={{ 
                mb: 1,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              通用设置
            </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            paragraph
            sx={{ mb: 3 }}
          >
            配置应用的基本设置和偏好
          </Typography>
          
          <Grid 
            container 
            spacing={{ xs: 2, sm: 3 }}
            sx={{ 
              minWidth: { xs: '100%', sm: '600px', md: '800px', lg: '1000px' },
              width: '100%'
            }}
          >
            <Grid item xs={12} sm={12} md={6} lg={6} xl={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    自动保存
                  </Typography>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="启用自动保存"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary" paragraph>
                    自动保存项目更改
                  </Typography>
                  <TextField
                    fullWidth
                    label="自动保存间隔（秒）"
                    type="number"
                    defaultValue={30}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={12} md={6} lg={6} xl={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    外观设置
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    label="主题"
                    defaultValue="auto"
                    size="small"
                    SelectProps={{ native: true }}
                    sx={{ mb: 2 }}
                  >
                    <option value="light">浅色</option>
                    <option value="dark">深色</option>
                    <option value="auto">跟随系统</option>
                  </TextField>
                  
                  <TextField
                    select
                    fullWidth
                    label="语言"
                    defaultValue="zh-CN"
                    size="small"
                    SelectProps={{ native: true }}
                  >
                    <option value="zh-CN">简体中文</option>
                    <option value="en-US">English</option>
                  </TextField>
                  
                  <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      主题和语言设置将在重启应用后生效
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ 
            mt: 3, 
            display: 'flex', 
            justifyContent: { xs: 'center', sm: 'flex-end' },
            px: { xs: 1, sm: 0 }
          }}>
            <Button 
              variant="contained"
              sx={{
                minWidth: { xs: '200px', sm: '140px' },
                fontSize: { xs: '0.875rem', sm: '0.875rem' },
                py: { xs: 1.5, sm: 1 }
              }}
            >
              保存设置
            </Button>
          </Box>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};
