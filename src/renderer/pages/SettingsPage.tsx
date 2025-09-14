import React, { useState } from 'react';
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
} from '@mui/material';
import { useAppContext } from '@renderer/contexts/AppContext';
import { AIModelConfig } from '@shared/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const { state, updateConfig } = useAppContext();
  const [tabValue, setTabValue] = useState(0);
  const [aiModels, setAiModels] = useState<AIModelConfig[]>(state.config?.aiModels || []);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        设置
      </Typography>

      <Paper sx={{ width: '100%' }}>
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

          <Grid container spacing={3}>
            {aiModels.map((model, index) => (
              <Grid item xs={12} md={6} key={`${model.provider}-${index}`}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        {getProviderName(model.provider)}
                      </Typography>
                      <Chip 
                        label={model.enabled ? '已启用' : '未启用'} 
                        color={model.enabled ? 'success' : 'default'}
                        size="small"
                      />
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
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSaveAIModels}
              disabled={saving}
            >
              {saving ? '保存中...' : '保存配置'}
            </Button>
          </Box>
        </TabPanel>

        {/* 智能体配置 */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            智能体配置
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            管理AI智能体的启用状态和配置
          </Typography>

          <Grid container spacing={2}>
            {state.agents.map((agent) => (
              <Grid item xs={12} sm={6} md={4} key={agent.id}>
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
                  <CardActions>
                    <Button size="small">配置</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* 通用设置 */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            通用设置
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="自动保存"
              />
              <Typography variant="body2" color="text.secondary">
                自动保存项目更改
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="自动保存间隔（秒）"
                type="number"
                defaultValue={30}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="主题"
                defaultValue="auto"
                size="small"
                SelectProps={{ native: true }}
              >
                <option value="light">浅色</option>
                <option value="dark">深色</option>
                <option value="auto">跟随系统</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
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
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained">
              保存设置
            </Button>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};
