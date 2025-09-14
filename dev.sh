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

# 检查Node.js环境
check_nodejs() {
    log_info "检查 Node.js 环境..."
    
    if ! command_exists node; then
        log_error "Node.js 未安装！"
        log_info "请访问 https://nodejs.org/ 下载并安装 Node.js (推荐 LTS 版本)"
        
        local os=$(detect_os)
        case $os in
            "macos")
                log_info "macOS 用户可以使用 Homebrew 安装: brew install node"
                ;;
            "windows")
                log_info "Windows 用户请下载 .msi 安装包或使用 Chocolatey: choco install nodejs"
                ;;
            "linux")
                log_info "Linux 用户可以使用包管理器安装: sudo apt install nodejs npm (Ubuntu/Debian)"
                ;;
        esac
        exit 1
    fi
    
    local node_version=$(node --version)
    local npm_version=$(npm --version)
    
    log_success "Node.js 版本: $node_version"
    log_success "npm 版本: $npm_version"
    
    # 检查Node.js版本是否满足要求 (>=16.0.0)
    local major_version=$(echo $node_version | sed 's/v//' | cut -d. -f1)
    if [ "$major_version" -lt 16 ]; then
        log_warning "Node.js 版本过低，推荐使用 16.0.0 或更高版本"
    fi
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

# 启动开发服务器
start_dev_server() {
    log_info "启动开发环境..."
    
    # 检查关键端口
    check_port 3000 "React 开发服务器"
    
    log_info "启动 Electron 开发环境..."
    log_info "应用将在几秒钟后启动..."
    log_info ""
    log_info "开发服务器信息:"
    log_info "  - React 开发服务器: http://localhost:3000"
    log_info "  - Electron 主窗口将自动打开"
    log_info ""
    log_info "按 Ctrl+C 停止开发服务器"
    log_info ""
    
    # 启动开发环境
    npm run dev
}

# 显示帮助信息
show_help() {
    echo "Novel AI Assistant - 开发环境启动脚本"
    echo ""
    echo "用法: ./dev.sh [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -c, --clean    清理构建文件后启动"
    echo "  -i, --install  强制重新安装依赖"
    echo "  -t, --type     执行类型检查"
    echo "  -l, --lint     执行代码风格检查"
    echo "  --no-check     跳过所有检查直接启动"
    echo ""
    echo "示例:"
    echo "  ./dev.sh              # 正常启动开发环境"
    echo "  ./dev.sh --clean      # 清理后启动"
    echo "  ./dev.sh --install    # 重新安装依赖后启动"
    echo "  ./dev.sh --type       # 类型检查后启动"
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
            --no-check)
                skip_checks=true
                shift
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 执行启动流程
    if [ "$clean_build_flag" = true ]; then
        clean_build
    fi
    
    if [ "$skip_checks" = false ]; then
        check_nodejs
        
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
    
    start_dev_server
}

# 捕获中断信号
trap 'log_info "开发服务器已停止"; exit 0' INT TERM

# 运行主函数
main "$@"
