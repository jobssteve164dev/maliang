/**
 * 项目创建/编辑对话框
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert
} from '@mui/material';
import { NovelProject } from '@shared/types';

interface ProjectDialogProps {
  open: boolean;
  project?: NovelProject | null;
  onClose: () => void;
  onSave: (project: Omit<NovelProject, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const GENRES = [
  '奇幻', '科幻', '都市', '历史', '武侠', '仙侠', '玄幻', 
  '悬疑', '推理', '恐怖', '言情', '青春', '军事', '商战',
  '网游', '竞技', '同人', '轻小说', '其他'
];

const TARGET_AUDIENCES = [
  '青少年', '成年男性', '成年女性', '全年龄', '儿童', '老年人'
];

const STATUS_OPTIONS = [
  { value: 'planning', label: '规划中' },
  { value: 'writing', label: '写作中' },
  { value: 'editing', label: '编辑中' },
  { value: 'completed', label: '已完成' }
];

export const ProjectDialog: React.FC<ProjectDialogProps> = ({
  open,
  project,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    genre: string;
    targetAudience: string;
    status: 'planning' | 'writing' | 'editing' | 'completed';
    wordCount: number;
    chapterCount: number;
  }>({
    title: '',
    description: '',
    genre: '',
    targetAudience: '',
    status: 'planning',
    wordCount: 0,
    chapterCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(project);

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title,
        description: project.description || '',
        genre: project.genre,
        targetAudience: project.targetAudience,
        status: project.status,
        wordCount: project.wordCount || 0,
        chapterCount: project.chapterCount || 0
      });
    } else {
      setFormData({
        title: '',
        description: '',
        genre: '',
        targetAudience: '',
        status: 'planning',
        wordCount: 0,
        chapterCount: 0
      });
    }
    setError(null);
  }, [project, open]);

  const handleChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError(null);
  };

  const handleSubmit = async () => {
    // 验证必填字段
    if (!formData.title.trim()) {
      setError('请输入项目标题');
      return;
    }
    if (!formData.genre) {
      setError('请选择项目类型');
      return;
    }
    if (!formData.targetAudience) {
      setError('请选择目标读者');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave({
        title: formData.title.trim(),
        description: formData.description.trim(),
        genre: formData.genre,
        targetAudience: formData.targetAudience,
        status: formData.status,
        wordCount: formData.wordCount,
        chapterCount: formData.chapterCount
      });
      onClose();
    } catch (err: any) {
      setError(err.message || '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        {isEdit ? '编辑项目' : '创建新项目'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 基本信息 */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
            基本信息
          </Typography>

          <TextField
            fullWidth
            label="项目标题"
            value={formData.title}
            onChange={handleChange('title')}
            margin="normal"
            required
            placeholder="输入您的小说标题"
            helperText="一个吸引人的标题是成功的开始"
          />

          <TextField
            fullWidth
            label="项目描述"
            value={formData.description}
            onChange={handleChange('description')}
            margin="normal"
            multiline
            rows={3}
            placeholder="简要描述您的小说内容、主题或特色"
            helperText="详细的描述有助于AI更好地理解您的创作意图"
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel required>项目类型</InputLabel>
              <Select
                value={formData.genre}
                onChange={handleChange('genre')}
                label="项目类型"
              >
                {GENRES.map(genre => (
                  <MenuItem key={genre} value={genre}>
                    {genre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel required>目标读者</InputLabel>
              <Select
                value={formData.targetAudience}
                onChange={handleChange('targetAudience')}
                label="目标读者"
              >
                {TARGET_AUDIENCES.map(audience => (
                  <MenuItem key={audience} value={audience}>
                    {audience}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* 项目状态和统计 */}
          {isEdit && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                项目状态
              </Typography>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>状态</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={handleChange('status')}
                    label="状态"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="字数统计"
                  type="number"
                  value={formData.wordCount}
                  onChange={handleChange('wordCount')}
                  InputProps={{ inputProps: { min: 0 } }}
                  sx={{ width: 150 }}
                />

                <TextField
                  label="章节数量"
                  type="number"
                  value={formData.chapterCount}
                  onChange={handleChange('chapterCount')}
                  InputProps={{ inputProps: { min: 0 } }}
                  sx={{ width: 150 }}
                />
              </Box>
            </>
          )}

          {/* 提示信息 */}
          {!isEdit && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
              <Typography variant="body2" color="primary.main">
                💡 创建项目后，您可以：
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                <Typography component="li" variant="body2" color="text.secondary">
                  使用AI智能体协助构建世界观和角色
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  自动生成故事大纲和情节线
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  获得专业的写作建议和改进意见
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          取消
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={loading}
        >
          {loading ? '保存中...' : (isEdit ? '保存更改' : '创建项目')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

