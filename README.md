# Novel AI Assistant

基于多智能体协作的跨平台小说创作辅助应用

## 🚀 快速开始

### 环境要求

- **Node.js**: 16.0.0 或更高版本
- **npm**: 7.0.0 或更高版本
- **操作系统**: macOS, Windows, Linux

### 安装与启动

#### 方式一：使用开发脚本（推荐）

**Linux/macOS:**
```bash
# 完整的开发环境启动（包含所有检查）
./dev.sh

# 快速启动（最小化检查）
./start.sh

# 清理后启动
./dev.sh --clean

# 重新安装依赖后启动
./dev.sh --install

# 查看所有选项
./dev.sh --help
```

**Windows:**
```cmd
# 使用批处理文件
dev.bat

# 或在 Git Bash 中使用
./dev.sh
```

#### 方式二：手动启动

```bash
# 1. 安装依赖
npm install

# 2. 启动开发环境
npm run dev
```

### 开发命令

```bash
# 启动开发环境
npm run dev

# 构建应用
npm run build

# 打包分发（所有平台）
npm run dist

# 打包特定平台
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux

# 代码检查
npm run lint        # 检查代码风格
npm run lint:fix    # 自动修复代码风格问题
npm run type-check  # TypeScript 类型检查

# 测试
npm test            # 运行测试
npm run test:watch  # 监听模式运行测试
```

## 🏗️ 项目架构

### 技术栈

- **前端**: Electron + React + TypeScript + Material-UI
- **后端**: Node.js + Express
- **数据库**: SQLite (本地存储)
- **AI集成**: OpenAI, DeepSeek, OpenRouter, Ollama
- **构建工具**: Webpack + Electron Builder

### 目录结构

```
src/
├── main/           # Electron 主进程
│   ├── main.ts     # 应用入口
│   └── preload.ts  # 预加载脚本
├── renderer/       # React 前端
│   ├── components/ # UI 组件
│   ├── pages/      # 页面组件
│   ├── contexts/   # React Context
│   ├── hooks/      # 自定义 Hooks
│   └── utils/      # 工具函数
├── shared/         # 共享代码
│   ├── types/      # TypeScript 类型定义
│   └── utils/      # 共享工具函数
├── agents/         # AI 智能体
├── api/           # AI 模型 API 集成
├── database/      # 数据库管理
└── services/      # 业务服务层
```

## 🤖 AI 智能体系统

### 专业智能体

1. **主题策划师** - 分析市场趋势，提供主题建议
2. **大纲架构师** - 构建故事结构和情节线
3. **世界构建师** - 创建详细的世界观设定
4. **人物设计师** - 塑造立体的角色形象
5. **关系网络师** - 管理复杂的人物关系
6. **对话大师** - 优化角色对话和语言风格
7. **情节顾问** - 分析情节合理性和吸引力

### 支持的 AI 模型

- **OpenAI**: GPT-4, GPT-3.5-turbo
- **DeepSeek**: DeepSeek Chat
- **OpenRouter**: Claude, Llama, 等多种模型
- **Ollama**: 本地运行的开源模型

## 📱 核心功能

### 项目管理
- 创建和管理多个小说项目
- 项目进度追踪和统计
- 自动保存和备份

### 创作工具
- 章节编辑器
- 角色档案管理
- 世界观设定编辑器
- 人物关系图可视化
- 情节时间轴

### AI 辅助
- 多智能体协作创作
- 上下文感知的建议
- 创作灵感生成
- 内容质量分析

### 数据管理
- 本地 SQLite 数据库
- 隐私保护（数据不上传云端）
- 项目导出（Markdown, Word, PDF）

## 🔧 开发指南

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 配置
- 组件使用函数式组件和 Hooks
- 遵循 Material-UI 设计规范

### 提交规范

```bash
# 功能开发
git commit -m "feat: 添加角色关系图可视化功能"

# 问题修复
git commit -m "fix: 修复项目创建时的数据验证问题"

# 文档更新
git commit -m "docs: 更新 API 文档"
```

### 调试技巧

1. **主进程调试**: 使用 VS Code 的 Node.js 调试器
2. **渲染进程调试**: 使用 Chrome DevTools（F12）
3. **数据库调试**: 使用 SQLite 浏览器工具

## 🚨 故障排除

### 常见问题

**Q: 应用启动失败**
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 清理构建缓存
./dev.sh --clean
```

**Q: 端口被占用**
```bash
# 查找占用端口的进程
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# 终止进程或更改端口
```

**Q: TypeScript 类型错误**
```bash
# 运行类型检查
npm run type-check

# 重新生成类型声明
rm -rf dist && npm run build
```

### 性能优化

- 启用 React DevTools Profiler
- 使用 Electron 性能监控
- 优化 SQLite 查询索引

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题，请提交 Issue 或联系开发团队。
