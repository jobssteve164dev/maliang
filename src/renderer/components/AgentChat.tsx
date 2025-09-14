/**
 * 智能体聊天组件
 * 提供与AI智能体的交互界面
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
  Card,
  CardContent
} from '@mui/material';
import {
  Send as SendIcon,
  Psychology as AgentIcon,
  Person as UserIcon,
  MoreVert as MoreVertIcon,
  Clear as ClearIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
  SmartToy as BotIcon
} from '@mui/icons-material';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentType?: string;
  metadata?: any;
}

interface AgentInfo {
  id: string;
  name: string;
  type: string;
  description: string;
}

interface AgentChatProps {
  projectId: string;
  selectedAgent: AgentInfo;
  onAgentChange: (agent: AgentInfo) => void;
  availableAgents: AgentInfo[];
}

export const AgentChat: React.FC<AgentChatProps> = ({
  projectId,
  selectedAgent,
  onAgentChange,
  availableAgents
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 加载对话历史
  const loadConversationHistory = async () => {
    try {
      const history = await window.electronAPI.ai.getConversationHistory(
        projectId,
        selectedAgent.id,
        50
      );
      
      const formattedMessages: Message[] = history.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        agentType: selectedAgent.type,
        metadata: msg.metadata
      }));
      
      setMessages(formattedMessages);
    } catch (err) {
      console.error('Failed to load conversation history:', err);
    }
  };

  useEffect(() => {
    loadConversationHistory();
  }, [projectId, selectedAgent.id]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    console.log('🔍 [DEBUG] AgentChat: Sending message to agent:', selectedAgent.id);
    console.log('🔍 [DEBUG] AgentChat: Project ID:', projectId);

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    setError(null);

    try {
      // 构建上下文
      const context = {
        project: { id: projectId }, // 简化的项目信息，实际使用时需要完整的项目数据
        userInput: userMessage.content,
        conversationHistory: messages.slice(-10) // 最近10条消息作为上下文
      };

      console.log('🔍 [DEBUG] AgentChat: Sending context:', context);
      const response = await window.electronAPI.agent.sendMessage(selectedAgent.id, context);
      console.log('🔍 [DEBUG] AgentChat: Received response:', response);

      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        agentType: selectedAgent.type,
        metadata: response.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || '发送消息失败，请重试');
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // 清空对话
  const handleClearConversation = async () => {
    if (!window.confirm('确定要清空当前对话吗？')) return;

    try {
      await window.electronAPI.ai.clearConversation(projectId, selectedAgent.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear conversation:', err);
    }
  };

  // 导出对话
  const handleExportConversation = () => {
    const conversationText = messages.map(msg => 
      `[${msg.timestamp.toLocaleString()}] ${msg.role === 'user' ? '用户' : selectedAgent.name}: ${msg.content}`
    ).join('\n\n');

    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedAgent.name}_对话记录_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // 获取智能体图标颜色
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

  // 格式化消息内容
  const formatMessageContent = (content: string) => {
    // 简单的格式化：将【】内的内容高亮显示
    return content.split(/(\【[^】]*\】)/).map((part, index) => {
      if (part.startsWith('【') && part.endsWith('】')) {
        return (
          <Typography
            key={index}
            component="span"
            sx={{ 
              fontWeight: 'bold', 
              color: 'primary.main',
              backgroundColor: 'primary.50',
              px: 0.5,
              py: 0.25,
              borderRadius: 0.5,
              fontSize: '0.9em'
            }}
          >
            {part}
          </Typography>
        );
      }
      return part;
    });
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 头部 */}
      <Paper sx={{ 
        p: 2, 
        borderRadius: 0,
        flexShrink: 0,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: getAgentColor(selectedAgent.type) }}>
              <BotIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">
                {selectedAgent.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedAgent.description}
              </Typography>
            </Box>
            <Chip 
              label={selectedAgent.type} 
              size="small" 
              sx={{ bgcolor: getAgentColor(selectedAgent.type), color: 'white' }}
            />
          </Box>

          <Box>
            <Tooltip title="更多操作">
              <IconButton onClick={handleMenuOpen}>
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* 消息列表 */}
      <Box sx={{ 
        flex: 1,
        overflow: 'auto', 
        p: 2,
        minHeight: 0,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(0,0,0,0.3)',
        },
      }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: getAgentColor(selectedAgent.type) }}>
              <BotIcon />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              开始与{selectedAgent.name}对话
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {selectedAgent.description}
            </Typography>
            <Card sx={{ maxWidth: 400, mx: 'auto' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  💡 您可以询问：
                </Typography>
                <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                  {selectedAgent.type === 'theme' && (
                    <>
                      <Typography component="li" variant="body2">分析当前市场热门题材</Typography>
                      <Typography component="li" variant="body2">为我的故事提供主题建议</Typography>
                    </>
                  )}
                  {selectedAgent.type === 'character' && (
                    <>
                      <Typography component="li" variant="body2">帮我设计一个主角</Typography>
                      <Typography component="li" variant="body2">这个角色的性格如何发展</Typography>
                    </>
                  )}
                  {selectedAgent.type === 'world' && (
                    <>
                      <Typography component="li" variant="body2">构建一个奇幻世界</Typography>
                      <Typography component="li" variant="body2">设计世界的历史背景</Typography>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        ) : (
          <Box>
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  mb: 2,
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                {message.role === 'assistant' && (
                  <Avatar sx={{ mr: 1, bgcolor: getAgentColor(selectedAgent.type) }}>
                    <BotIcon />
                  </Avatar>
                )}
                
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    bgcolor: message.role === 'user' ? 'primary.main' : 'grey.100',
                    color: message.role === 'user' ? 'white' : 'text.primary'
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.role === 'assistant' 
                      ? formatMessageContent(message.content)
                      : message.content
                    }
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      mt: 1, 
                      opacity: 0.7,
                      textAlign: message.role === 'user' ? 'right' : 'left'
                    }}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </Paper>

                {message.role === 'user' && (
                  <Avatar sx={{ ml: 1, bgcolor: 'primary.main' }}>
                    <UserIcon />
                  </Avatar>
                )}
              </Box>
            ))}

            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 1, bgcolor: getAgentColor(selectedAgent.type) }}>
                  <BotIcon />
                </Avatar>
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    {selectedAgent.name}正在思考...
                  </Typography>
                </Paper>
              </Box>
            )}
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* 输入区域 - 固定在底部 */}
      <Paper sx={{ 
        p: 2, 
        borderRadius: 0,
        borderTop: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        flexShrink: 0
      }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder={`与${selectedAgent.name}对话...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            variant="outlined"
            size="small"
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || loading}
            sx={{ mb: 0.5 }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* 菜单 */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleMenuClose(); loadConversationHistory(); }}>
          <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
          刷新对话
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); handleExportConversation(); }}>
          <ExportIcon fontSize="small" sx={{ mr: 1 }} />
          导出对话
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleMenuClose(); handleClearConversation(); }}>
          <ClearIcon fontSize="small" sx={{ mr: 1 }} />
          清空对话
        </MenuItem>
      </Menu>
    </Box>
  );
};

