# 项目长期记忆 (PROJECT_MEMORY.md)

*最后更新: 2025-09-14 15:30:00*

---

## 1. 项目概述 (Project Overview)

### a. 核心目标 (High-Level Goal)
创建一个基于大模型能力的跨平台小说创作辅助应用，通过多智能体协作为作者提供从构思到完成的全流程创作支持。

### b. 技术栈 (Tech Stack)
*   **前端**: Electron + React + TypeScript
*   **后端**: Node.js + Express
*   **数据库**: SQLite (本地存储) + JSON文件 (配置和临时数据)
*   **AI集成**: DeepSeek API, Ollama, OpenRouter, OpenAI API
*   **部署环境**: 跨平台桌面应用 (macOS, Windows, Linux)

---

## 2. 核心架构决策 (Key Architectural Decisions)

*   **[2025-09-14]**: 选择Electron作为跨平台框架。**原因**: 能够使用Web技术栈快速开发，同时支持所有目标平台，便于集成AI API。
*   **[2025-09-14]**: 采用多智能体架构设计。**原因**: 不同创作环节需要专门的AI能力，分工协作能提供更专业的建议。
*   **[2025-09-14]**: 使用本地SQLite数据库。**原因**: 保护用户创作隐私，支持离线工作，避免云端依赖。

---

## 3. 模块职责表 (Codebase Map)

*   `src/main/`: Electron主进程代码，负责窗口管理和系统集成
*   `src/renderer/`: React前端代码，用户界面和交互逻辑
*   `src/shared/`: 前后端共享的类型定义和工具函数
*   `src/agents/`: AI智能体实现，包括各专业领域的智能体
*   `src/api/`: AI模型API集成和管理
*   `src/database/`: 数据库模型和操作逻辑
*   `src/services/`: 业务逻辑服务层

---

## 4. 标准工作流与命令 (Standard Workflows & Commands)

*   **安装依赖**: `npm install`
*   **启动开发环境**: `npm run dev`
*   **构建应用**: `npm run build`
*   **打包分发**: `npm run dist`
*   **运行测试**: `npm test`
*   **代码风格检查**: `npm run lint`

---

## 5. 用户特定偏好与规范 (User-Specific Conventions)

*   **代码风格**: 使用TypeScript严格模式，遵循ESLint和Prettier配置
*   **组件设计**: 采用函数式组件和React Hooks
*   **API设计**: RESTful风格，统一错误处理和响应格式
*   **数据流**: 使用Context API进行状态管理，避免过度复杂的状态库

---

## 6. 重要提醒 (Critical Reminders)

*   **API密钥安全**: 所有AI模型API密钥必须加密存储在本地配置文件中
*   **数据隐私**: 用户创作内容仅存储在本地，不上传到任何云端服务
*   **跨平台兼容**: 所有文件路径和系统调用必须考虑不同操作系统的差异
*   **所见即可用原则**: 严禁使用模拟数据，所有功能必须连接真实的AI API和数据存储
