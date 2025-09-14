# 🚀 Novel AI Assistant - 快速安装指南

## 📦 自动安装（推荐）

### 🐧 Linux / 🍎 macOS / 🪟 Windows (Git Bash)

```bash
# 一键自动安装环境和依赖
./dev.sh --setup

# 或者交互式安装
./dev.sh
```

### 🪟 Windows (命令提示符)

```cmd
# 交互式安装
dev.bat
```

## 🛠️ 手动安装

### 1. 安装 Node.js

#### 🍎 macOS
```bash
# 使用 Homebrew (推荐)
brew install node

# 或下载官方安装包
# https://nodejs.org/
```

#### 🪟 Windows
```cmd
# 使用 Chocolatey
choco install nodejs

# 使用 winget
winget install OpenJS.NodeJS

# 或下载官方安装包
# https://nodejs.org/
```

#### 🐧 Linux
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install nodejs npm

# CentOS/RHEL/Fedora
sudo dnf install nodejs npm

# Arch Linux
sudo pacman -S nodejs npm

# 使用 NodeSource 仓库 (最新版本)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 克隆项目并安装依赖

```bash
git clone https://github.com/jobssteve164dev/maliang.git
cd maliang
npm install
```

### 3. 启动开发环境

```bash
npm run dev
```

## 🔧 开发脚本选项

### dev.sh (Linux/macOS/Git Bash)

```bash
./dev.sh --help                    # 显示帮助信息
./dev.sh                          # 正常启动（会询问是否自动安装）
./dev.sh --setup                  # 自动安装环境和依赖
./dev.sh --check-env              # 仅检查环境状态
./dev.sh --no-interactive         # 非交互模式
./dev.sh --clean                  # 清理构建文件后启动
./dev.sh --install                # 强制重新安装依赖
./dev.sh --type --lint             # 类型检查和代码风格检查
```

### 环境检查

```bash
# 检查当前环境状态
./dev.sh --check-env
```

输出示例：
```
🔍 环境检查模式

操作系统: linux
✅ Node.js: v18.18.0
✅ npm: 9.8.1
✅ 可用的包管理器: apt
✅ 找到 package.json
✅ 依赖已安装
✅ Git 可用

环境检查完成
```

## 🎯 支持的安装方式

### 自动检测和安装

脚本会自动检测您的操作系统和可用的包管理器：

| 操作系统 | 包管理器 | 安装命令 |
|---------|----------|----------|
| macOS | Homebrew | `brew install node` |
| Windows | Chocolatey | `choco install nodejs -y` |
| Windows | winget | `winget install OpenJS.NodeJS` |
| Ubuntu/Debian | apt | `sudo apt install nodejs npm` |
| CentOS/RHEL | dnf/yum | `sudo dnf install nodejs npm` |
| Arch Linux | pacman | `sudo pacman -S nodejs npm` |

### 备用安装方式

如果包管理器不可用，脚本会：

1. **Windows**: 自动下载官方 .msi 安装包
2. **Linux**: 尝试使用 NodeSource 仓库
3. **所有平台**: 提供手动安装指导

## 🚨 故障排除

### Node.js 安装后无法找到

```bash
# 检查 PATH 环境变量
echo $PATH

# 重新加载环境变量 (Linux/macOS)
source ~/.bashrc
# 或
source ~/.zshrc

# Windows: 重启命令提示符
```

### 权限问题 (Linux/macOS)

```bash
# 如果遇到权限问题，可以使用 nvm 管理 Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts
```

### 网络问题

```bash
# 如果下载失败，可以配置 npm 镜像
npm config set registry https://registry.npmmirror.com/

# 或使用代理
npm config set proxy http://proxy-server:port
```

## 📋 系统要求

- **Node.js**: >= 16.0.0 (推荐 18.x LTS)
- **npm**: >= 8.0.0
- **操作系统**: 
  - Windows 10/11
  - macOS 10.15+
  - Linux (Ubuntu 18.04+, CentOS 7+, 等)
- **内存**: >= 4GB RAM
- **存储**: >= 2GB 可用空间

## 🎉 安装完成

安装成功后，您将看到：

```
✅ Node.js 版本: v18.18.0
✅ npm 版本: 9.8.1
✅ 依赖安装完成
🎉 环境安装完成！

[INFO] 启动开发环境...
[INFO] 应用将在几秒钟后启动...

开发服务器信息:
  - React 开发服务器: http://localhost:3000
  - Electron 主窗口将自动打开

按 Ctrl+C 停止开发服务器
```

现在您可以开始使用 Novel AI Assistant 进行小说创作了！

## 📚 更多信息

- [项目文档](./README.md)
- [开发指南](./docs/DEVELOPMENT.md)
- [API 文档](./docs/API.md)
- [故障排除](./docs/TROUBLESHOOTING.md)

