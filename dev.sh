#!/bin/bash

# Novel AI Assistant - 开发环境启动脚本
# 支持 macOS, Windows (Git Bash), Linux

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检测操作系统
detect_os() {
    case "$(uname -s)" in
        Darwin*)    echo "macos" ;;
        Linux*)     echo "linux" ;;
        CYGWIN*|MINGW*|MSYS*) echo "windows" ;;
        *)          echo "unknown" ;;
    esac
}

# 自动安装Node.js
auto_install_nodejs() {
    local os=$(detect_os)
    log_info "尝试自动安装 Node.js..."
    
    case $os in
        "macos")
            if command_exists brew; then
                log_info "使用 Homebrew 安装 Node.js..."
                brew install node
                return $?
            else
                log_warning "未检测到 Homebrew，请手动安装"
                log_info "1. 安装 Homebrew: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                log_info "2. 安装 Node.js: brew install node"
                return 1
            fi
            ;;
        "windows")
            if command_exists choco; then
                log_info "使用 Chocolatey 安装 Node.js..."
                choco install nodejs -y
                return $?
            elif command_exists winget; then
                log_info "使用 winget 安装 Node.js..."
                winget install OpenJS.NodeJS
                return $?
            else
                log_warning "未检测到包管理器，尝试下载安装包..."
                local node_url="https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi"
                log_info "正在下载 Node.js 安装包..."
                
                if command_exists curl; then
                    curl -L -o nodejs-installer.msi "$node_url"
                elif command_exists wget; then
                    wget -O nodejs-installer.msi "$node_url"
                else
                    log_error "无法下载安装包，请手动安装"
                    log_info "请访问 https://nodejs.org/ 下载并安装 Node.js"
                    return 1
                fi
                
                log_info "请运行下载的 nodejs-installer.msi 文件完成安装"
                log_info "安装完成后请重新运行此脚本"
                return 1
            fi
            ;;
        "linux")
            # 检测Linux发行版
            if [ -f /etc/os-release ]; then
                . /etc/os-release
                case $ID in
                    "ubuntu"|"debian")
                        log_info "检测到 Ubuntu/Debian，使用 apt 安装 Node.js..."
                        sudo apt update
                        sudo apt install -y nodejs npm
                        return $?
                        ;;
                    "centos"|"rhel"|"fedora")
                        if command_exists dnf; then
                            log_info "使用 dnf 安装 Node.js..."
                            sudo dnf install -y nodejs npm
                        elif command_exists yum; then
                            log_info "使用 yum 安装 Node.js..."
                            sudo yum install -y nodejs npm
                        fi
                        return $?
                        ;;
                    "arch")
                        log_info "检测到 Arch Linux，使用 pacman 安装 Node.js..."
                        sudo pacman -S nodejs npm
                        return $?
                        ;;
                    *)
                        log_warning "未识别的 Linux 发行版: $ID"
                        ;;
                esac
            fi
            
            # 尝试使用 NodeSource 仓库安装最新版本
            log_info "尝试使用 NodeSource 仓库安装 Node.js..."
            if command_exists curl; then
                curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
                sudo apt-get install -y nodejs
                return $?
            else
                log_error "无法自动安装，请手动安装"
                log_info "Ubuntu/Debian: sudo apt install nodejs npm"
                log_info "CentOS/RHEL: sudo yum install nodejs npm"
                log_info "Arch: sudo pacman -S nodejs npm"
                return 1
            fi
            ;;
        *)
            log_error "不支持的操作系统，请手动安装 Node.js"
            log_info "请访问 https://nodejs.org/ 下载并安装 Node.js"
            return 1
            ;;
    esac
}

# 检查Node.js环境
check_nodejs() {
    local non_interactive=${1:-false}
    log_info "检查 Node.js 环境..."
    
    if ! command_exists node; then
        log_warning "Node.js 未安装！"
        
        # 询问用户是否自动安装（支持非交互模式）
        local auto_install_choice="n"
        if [ "$non_interactive" = true ]; then
            log_info "非交互模式：自动安装 Node.js"
            auto_install_choice="y"
        else
            echo ""
            read -p "是否尝试自动安装 Node.js? (y/N): " -n 1 -r
            echo ""
            auto_install_choice="$REPLY"
        fi
        
        if [[ $auto_install_choice =~ ^[Yy]$ ]]; then
            if auto_install_nodejs; then
                log_success "Node.js 安装成功！"
                # 重新检查安装结果
                if ! command_exists node; then
                    log_error "安装后仍无法找到 Node.js，请检查 PATH 环境变量"
                    log_info "可能需要重启终端或重新加载环境变量"
                    exit 1
                fi
            else
                log_error "自动安装失败，请手动安装 Node.js"
                show_manual_install_instructions
                exit 1
            fi
        else
            log_info "跳过自动安装"
            show_manual_install_instructions
            exit 1
        fi
    fi
    
    local node_version=$(node --version)
    local npm_version=$(npm --version)
    
    log_success "Node.js 版本: $node_version"
    log_success "npm 版本: $npm_version"
    
    # 检查Node.js版本是否满足要求 (>=16.0.0)
    local major_version=$(echo $node_version | sed 's/v//' | cut -d. -f1)
    if [ "$major_version" -lt 16 ]; then
        log_warning "Node.js 版本过低 ($node_version)，推荐使用 16.0.0 或更高版本"
        
        local upgrade_choice="n"
        if [ "$non_interactive" = true ]; then
            log_info "非交互模式：跳过版本升级"
            upgrade_choice="n"
        else
            echo ""
            read -p "是否尝试升级到最新版本? (y/N): " -n 1 -r
            echo ""
            upgrade_choice="$REPLY"
        fi
        
        if [[ $upgrade_choice =~ ^[Yy]$ ]]; then
            log_info "尝试升级 Node.js..."
            if auto_install_nodejs; then
                log_success "Node.js 升级成功！"
            else
                log_warning "升级失败，但当前版本仍可使用"
            fi
        fi
    fi
}

# 显示手动安装说明
show_manual_install_instructions() {
    local os=$(detect_os)
    
    log_info "手动安装 Node.js 说明："
    echo ""
    
    case $os in
        "macos")
            echo "📱 macOS 安装选项："
            echo "  1. 官方安装包: https://nodejs.org/ (推荐)"
            echo "  2. Homebrew: brew install node"
            echo "  3. MacPorts: sudo port install nodejs18"
            ;;
        "windows")
            echo "🪟 Windows 安装选项："
            echo "  1. 官方安装包: https://nodejs.org/ (推荐)"
            echo "  2. Chocolatey: choco install nodejs"
            echo "  3. Scoop: scoop install nodejs"
            echo "  4. winget: winget install OpenJS.NodeJS"
            ;;
        "linux")
            echo "🐧 Linux 安装选项："
            echo "  1. 官方安装包: https://nodejs.org/"
            echo "  2. Ubuntu/Debian: sudo apt install nodejs npm"
            echo "  3. CentOS/RHEL: sudo yum install nodejs npm"
            echo "  4. Arch: sudo pacman -S nodejs npm"
            echo "  5. 使用 nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
            ;;
    esac
    
    echo ""
    echo "💡 推荐使用 Node.js LTS 版本 (当前为 v18.x)"
    echo "📚 更多安装方式: https://nodejs.org/en/download/package-manager/"
}

# 检查项目依赖
check_dependencies() {
    log_info "检查项目依赖..."
    
    if [ ! -d "node_modules" ]; then
        log_warning "依赖未安装，正在安装..."
        install_dependencies
    else
        log_success "依赖已安装"
    fi
}

# 安装项目依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 检查是否有 package-lock.json，优先使用 npm ci
    if [ -f "package-lock.json" ]; then
        log_info "使用 npm ci 安装依赖（更快且确定性安装）..."
        npm ci
    else
        log_info "使用 npm install 安装依赖..."
        npm install
    fi
    
    log_success "依赖安装完成"
}

# 检查端口是否被占用
check_port() {
    local port=$1
    local service_name=$2
    
    if command_exists lsof; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
            log_warning "$service_name 端口 $port 已被占用"
            return 1
        fi
    elif command_exists netstat; then
        if netstat -an | grep ":$port " | grep -q LISTEN; then
            log_warning "$service_name 端口 $port 已被占用"
            return 1
        fi
    fi
    return 0
}

# 获取占用端口的进程ID
get_port_pid() {
    local port=$1
    
    if command_exists lsof; then
        lsof -ti :$port 2>/dev/null
    elif command_exists netstat; then
        # Windows netstat 格式不同，需要特殊处理
        local os=$(detect_os)
        if [ "$os" = "windows" ]; then
            netstat -ano | grep ":$port " | grep LISTENING | awk '{print $5}' | head -1
        else
            netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | head -1
        fi
    fi
}

# 延时自动清理端口
cleanup_port_with_timeout() {
    local port=$1
    local service_name=$2
    local timeout=${3:-10}
    local force=${4:-false}
    
    local pid=$(get_port_pid $port)
    
    if [ -n "$pid" ] && [ "$pid" != "0" ]; then
        log_warning "$service_name 端口 $port 被进程 $pid 占用"
        
        if [ "$force" = true ]; then
            log_info "强制清理端口 $port (PID: $pid)..."
            if kill -9 $pid 2>/dev/null; then
                log_success "已清理端口 $port"
                sleep 2  # 等待端口释放
                return 0
            else
                log_error "无法清理端口 $port，可能需要管理员权限"
                return 1
            fi
        else
            log_info "将在 $timeout 秒后自动清理，按任意键立即清理，按 Ctrl+C 取消..."
            
            # 倒计时显示
            local countdown=$timeout
            while [ $countdown -gt 0 ]; do
                printf "\r[INFO] 自动清理倒计时: %d 秒 (按任意键立即清理)" $countdown
                
                # 检查是否有按键输入
                if read -t 1 -n 1 key 2>/dev/null; then
                    echo ""
                    log_info "收到用户输入，立即清理..."
                    break
                fi
                
                countdown=$((countdown - 1))
            done
            
            if [ $countdown -eq 0 ]; then
                echo ""
                log_info "倒计时结束，自动清理端口 $port (PID: $pid)..."
            fi
            
            # 执行清理
            if kill -TERM $pid 2>/dev/null; then
                sleep 3  # 给进程时间优雅退出
                
                # 检查进程是否还在运行
                if kill -0 $pid 2>/dev/null; then
                    log_warning "进程仍在运行，强制终止..."
                    kill -9 $pid 2>/dev/null
                fi
                
                log_success "已清理端口 $port"
                sleep 2  # 等待端口释放
                return 0
            else
                log_error "无法清理端口 $port，可能需要管理员权限"
                return 1
            fi
        fi
    fi
    
    return 0
}

# 清理占用端口的进程（保留原有功能）
cleanup_port() {
    local port=$1
    local service_name=$2
    local force=${3:-false}
    
    local pid=$(get_port_pid $port)
    
    if [ -n "$pid" ] && [ "$pid" != "0" ]; then
        log_warning "$service_name 端口 $port 被进程 $pid 占用"
        
        if [ "$force" = true ]; then
            log_info "强制清理端口 $port (PID: $pid)..."
            if kill -9 $pid 2>/dev/null; then
                log_success "已清理端口 $port"
                sleep 2  # 等待端口释放
                return 0
            else
                log_error "无法清理端口 $port，可能需要管理员权限"
                return 1
            fi
        else
            echo ""
            read -p "是否清理占用端口 $port 的进程? (y/N): " -n 1 -r
            echo ""
            
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                log_info "清理端口 $port (PID: $pid)..."
                if kill -TERM $pid 2>/dev/null; then
                    sleep 3  # 给进程时间优雅退出
                    
                    # 检查进程是否还在运行
                    if kill -0 $pid 2>/dev/null; then
                        log_warning "进程仍在运行，强制终止..."
                        kill -9 $pid 2>/dev/null
                    fi
                    
                    log_success "已清理端口 $port"
                    sleep 2  # 等待端口释放
                    return 0
                else
                    log_error "无法清理端口 $port，可能需要管理员权限"
                    return 1
                fi
            else
                log_info "跳过端口清理"
                return 1
            fi
        fi
    fi
    
    return 0
}

# 清理所有开发相关端口
cleanup_dev_ports() {
    local force=${1:-false}
    
    log_info "🧹 清理开发环境端口..."
    
    local ports=(3333 5000 8080 9000)
    local services=("React开发服务器" "后端API服务器" "Webpack开发服务器" "调试端口")
    
    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local service=${services[$i]}
        
        if ! check_port $port "$service"; then
            cleanup_port $port "$service" $force
        fi
    done
    
    log_success "端口清理完成"
}

# 清理构建文件
clean_build() {
    log_info "清理构建文件..."
    
    if [ -d "dist" ]; then
        rm -rf dist
        log_success "已清理 dist 目录"
    fi
    
    if [ -d ".webpack" ]; then
        rm -rf .webpack
        log_success "已清理 .webpack 目录"
    fi
}

# 类型检查
type_check() {
    log_info "执行 TypeScript 类型检查..."
    
    if npm run type-check; then
        log_success "类型检查通过"
    else
        log_error "类型检查失败，请修复类型错误后重试"
        exit 1
    fi
}

# 代码风格检查
lint_check() {
    log_info "执行代码风格检查..."
    
    if npm run lint; then
        log_success "代码风格检查通过"
    else
        log_warning "发现代码风格问题，尝试自动修复..."
        if npm run lint:fix; then
            log_success "代码风格问题已自动修复"
        else
            log_error "无法自动修复所有问题，请手动检查"
        fi
    fi
}

# 全局变量存储开发进程PID
DEV_PIDS=()

# 清理开发进程
cleanup_dev_processes() {
    log_info "🧹 清理开发进程..."
    
    # 清理记录的PID
    for pid in "${DEV_PIDS[@]}"; do
        if [ -n "$pid" ] && kill -0 $pid 2>/dev/null; then
            log_info "终止进程 $pid..."
            kill -TERM $pid 2>/dev/null
            sleep 2
            
            # 如果进程仍在运行，强制终止
            if kill -0 $pid 2>/dev/null; then
                log_warning "强制终止进程 $pid..."
                kill -9 $pid 2>/dev/null
            fi
        fi
    done
    
    # 清理可能的npm/node进程
    local npm_pids=$(pgrep -f "npm.*dev" 2>/dev/null || true)
    local node_pids=$(pgrep -f "webpack.*dev" 2>/dev/null || true)
    local electron_pids=$(pgrep -f "electron.*dev" 2>/dev/null || true)
    
    for pid in $npm_pids $node_pids $electron_pids; do
        if [ -n "$pid" ] && kill -0 $pid 2>/dev/null; then
            log_info "清理开发相关进程 $pid..."
            kill -TERM $pid 2>/dev/null
        fi
    done
    
    sleep 2
    
    # 强制清理仍在运行的进程
    for pid in $npm_pids $node_pids $electron_pids; do
        if [ -n "$pid" ] && kill -0 $pid 2>/dev/null; then
            log_warning "强制终止进程 $pid..."
            kill -9 $pid 2>/dev/null
        fi
    done
    
    log_success "开发进程清理完成"
}

# 完整的环境清理
cleanup_environment() {
    log_info "🧹 执行完整环境清理..."
    
    cleanup_dev_processes
    cleanup_dev_ports true  # 强制清理端口
    
    log_success "环境清理完成"
}

# 启动开发服务器
start_dev_server() {
    local timeout=${1:-8}
    log_info "启动开发环境..."
    
    # 检查关键端口并清理
    if ! check_port 3333 "React 开发服务器"; then
        log_info "检测到端口占用，尝试自动清理..."
        cleanup_port_with_timeout 3333 "React 开发服务器" $timeout false
        
        # 再次检查
        if ! check_port 3333 "React 开发服务器"; then
            log_error "无法清理端口 3333，请手动处理或使用 --force-cleanup 选项"
            exit 1
        fi
    fi
    
    log_info "启动 Electron 开发环境..."
    log_info "应用将在几秒钟后启动..."
    log_info ""
    log_info "开发服务器信息:"
    log_info "  - React 开发服务器: http://localhost:3333"
    log_info "  - Electron 主窗口将自动打开"
    log_info ""
    log_info "💡 使用以下命令管理开发环境:"
    log_info "  - Ctrl+C: 停止开发服务器"
    log_info "  - ./dev.sh --cleanup: 清理环境"
    log_info "  - ./dev.sh --force-cleanup: 强制清理"
    log_info ""
    
    # 启动开发环境并记录PID
    npm run dev &
    local main_pid=$!
    DEV_PIDS+=($main_pid)
    
    # 等待主进程
    wait $main_pid
}

# 显示帮助信息
show_help() {
    echo "Novel AI Assistant - 开发环境启动脚本"
    echo ""
    echo "用法: ./dev.sh [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help           显示此帮助信息"
    echo "  -c, --clean          清理构建文件后启动"
    echo "  -i, --install        强制重新安装依赖"
    echo "  -t, --type           执行类型检查"
    echo "  -l, --lint           执行代码风格检查"
    echo "  --setup              自动安装环境和依赖"
    echo "  --check-env          仅检查环境，不启动应用"
    echo "  --cleanup            清理开发环境（进程和端口）"
    echo "  --force-cleanup      强制清理开发环境"
    echo "  --auto-cleanup=N     自动清理端口，N秒后执行（默认8秒）"
    echo "  --no-check           跳过所有检查直接启动"
    echo "  --no-interactive     非交互模式，自动选择默认选项"
    echo ""
    echo "示例:"
    echo "  ./dev.sh                    # 正常启动开发环境"
    echo "  ./dev.sh --setup           # 自动安装环境和依赖"
    echo "  ./dev.sh --clean           # 清理后启动"
    echo "  ./dev.sh --install         # 重新安装依赖后启动"
    echo "  ./dev.sh --type --lint      # 类型检查和代码风格检查后启动"
    echo "  ./dev.sh --check-env       # 仅检查环境状态"
    echo "  ./dev.sh --cleanup         # 清理开发环境"
    echo "  ./dev.sh --force-cleanup   # 强制清理开发环境"
    echo "  ./dev.sh --auto-cleanup=5  # 5秒后自动清理端口"
    echo "  ./dev.sh --no-interactive  # 非交互模式启动"
}

# 环境检查模式
check_environment_only() {
    log_info "🔍 环境检查模式"
    echo ""
    
    # 检查操作系统
    local os=$(detect_os)
    log_info "操作系统: $os"
    
    # 检查Node.js
    if command_exists node; then
        local node_version=$(node --version)
        local npm_version=$(npm --version)
        log_success "✅ Node.js: $node_version"
        log_success "✅ npm: $npm_version"
        
        # 检查版本
        local major_version=$(echo $node_version | sed 's/v//' | cut -d. -f1)
        if [ "$major_version" -lt 16 ]; then
            log_warning "⚠️  Node.js 版本过低，推荐 16.0.0+"
        fi
    else
        log_error "❌ Node.js 未安装"
    fi
    
    # 检查包管理器
    local package_managers=()
    case $os in
        "macos")
            command_exists brew && package_managers+=("Homebrew")
            ;;
        "windows")
            command_exists choco && package_managers+=("Chocolatey")
            command_exists winget && package_managers+=("winget")
            command_exists scoop && package_managers+=("Scoop")
            ;;
        "linux")
            command_exists apt && package_managers+=("apt")
            command_exists yum && package_managers+=("yum")
            command_exists dnf && package_managers+=("dnf")
            command_exists pacman && package_managers+=("pacman")
            ;;
    esac
    
    if [ ${#package_managers[@]} -gt 0 ]; then
        log_success "✅ 可用的包管理器: ${package_managers[*]}"
    else
        log_warning "⚠️  未检测到包管理器"
    fi
    
    # 检查项目依赖
    if [ -f "package.json" ]; then
        log_success "✅ 找到 package.json"
        if [ -d "node_modules" ]; then
            log_success "✅ 依赖已安装"
        else
            log_warning "⚠️  依赖未安装"
        fi
    else
        log_error "❌ 未找到 package.json"
    fi
    
    # 检查Git
    if command_exists git; then
        log_success "✅ Git 可用"
    else
        log_warning "⚠️  Git 未安装"
    fi
    
    echo ""
    log_info "环境检查完成"
}

# 自动安装模式
auto_setup_environment() {
    log_info "🚀 自动安装模式"
    echo ""
    
    # 设置非交互模式
    export DEBIAN_FRONTEND=noninteractive
    
    # 自动安装Node.js
    if ! command_exists node; then
        log_info "自动安装 Node.js..."
        if auto_install_nodejs; then
            log_success "Node.js 安装成功"
        else
            log_error "Node.js 安装失败"
            exit 1
        fi
    else
        log_success "Node.js 已安装"
    fi
    
    # 自动安装依赖
    log_info "自动安装项目依赖..."
    install_dependencies
    
    log_success "🎉 环境安装完成！"
}

# 主函数
main() {
    echo "========================================"
    echo "  Novel AI Assistant 开发环境启动器"
    echo "========================================"
    echo ""
    
    local clean_build_flag=false
    local force_install=false
    local run_type_check=false
    local run_lint_check=false
    local skip_checks=false
    local auto_setup=false
    local check_env_only=false
    local non_interactive=false
    local cleanup_only=false
    local force_cleanup=false
    local auto_cleanup_timeout=8
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--clean)
                clean_build_flag=true
                shift
                ;;
            -i|--install)
                force_install=true
                shift
                ;;
            -t|--type)
                run_type_check=true
                shift
                ;;
            -l|--lint)
                run_lint_check=true
                shift
                ;;
            --setup)
                auto_setup=true
                shift
                ;;
            --check-env)
                check_env_only=true
                shift
                ;;
            --cleanup)
                cleanup_only=true
                shift
                ;;
            --force-cleanup)
                cleanup_only=true
                force_cleanup=true
                shift
                ;;
            --auto-cleanup=*)
                auto_cleanup_timeout="${1#*=}"
                if ! [[ "$auto_cleanup_timeout" =~ ^[0-9]+$ ]] || [ "$auto_cleanup_timeout" -lt 1 ] || [ "$auto_cleanup_timeout" -gt 60 ]; then
                    log_error "自动清理超时时间必须是1-60之间的数字"
                    exit 1
                fi
                shift
                ;;
            --no-check)
                skip_checks=true
                shift
                ;;
            --no-interactive)
                non_interactive=true
                shift
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 设置非交互模式的环境变量
    if [ "$non_interactive" = true ]; then
        export DEBIAN_FRONTEND=noninteractive
        log_info "🤖 非交互模式已启用"
    fi
    
    # 仅检查环境模式
    if [ "$check_env_only" = true ]; then
        check_environment_only
        exit 0
    fi
    
    # 清理模式
    if [ "$cleanup_only" = true ]; then
        if [ "$force_cleanup" = true ]; then
            log_info "🚨 强制清理模式"
            cleanup_environment
        else
            log_info "🧹 清理模式"
            cleanup_environment
        fi
        exit 0
    fi
    
    # 自动安装模式
    if [ "$auto_setup" = true ]; then
        auto_setup_environment
        # 自动安装后继续启动开发环境
    fi
    
    # 执行启动流程
    if [ "$clean_build_flag" = true ]; then
        clean_build
    fi
    
    if [ "$skip_checks" = false ]; then
        check_nodejs "$non_interactive"
        
        if [ "$force_install" = true ]; then
            log_info "强制重新安装依赖..."
            rm -rf node_modules package-lock.json
            install_dependencies
        else
            check_dependencies
        fi
        
        if [ "$run_type_check" = true ]; then
            type_check
        fi
        
        if [ "$run_lint_check" = true ]; then
            lint_check
        fi
    else
        log_warning "跳过所有检查，直接启动..."
    fi
    
    start_dev_server $auto_cleanup_timeout
}

# 信号处理函数
cleanup_and_exit() {
    local exit_code=${1:-0}
    
    log_info ""
    log_info "🛑 接收到退出信号，正在清理..."
    
    # 清理开发进程和端口
    cleanup_environment
    
    log_info "✅ 清理完成，退出"
    exit $exit_code
}

# 捕获中断信号
trap 'cleanup_and_exit 0' INT TERM
trap 'cleanup_and_exit 1' ERR

# 运行主函数
main "$@"
