@echo off
setlocal enabledelayedexpansion

REM Novel AI Assistant - Windows 开发环境启动脚本

title Novel AI Assistant - Development Environment

echo ========================================
echo   Novel AI Assistant 开发环境启动器
echo ========================================
echo.

REM 检查 Node.js 是否安装
echo [INFO] 检查 Node.js 环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js 未安装！
    echo [INFO] 请访问 https://nodejs.org/ 下载并安装 Node.js ^(推荐 LTS 版本^)
    echo [INFO] Windows 用户可以下载 .msi 安装包或使用 Chocolatey: choco install nodejs
    pause
    exit /b 1
)

REM 显示 Node.js 版本信息
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo [SUCCESS] Node.js 版本: %NODE_VERSION%
echo [SUCCESS] npm 版本: %NPM_VERSION%

REM 检查项目依赖
echo [INFO] 检查项目依赖...
if not exist "node_modules" (
    echo [WARNING] 依赖未安装，正在安装...
    goto install_deps
) else (
    echo [SUCCESS] 依赖已安装
    goto check_complete
)

:install_deps
echo [INFO] 安装项目依赖...
if exist "package-lock.json" (
    echo [INFO] 使用 npm ci 安装依赖^(更快且确定性安装^)...
    npm ci
) else (
    echo [INFO] 使用 npm install 安装依赖...
    npm install
)

if %errorlevel% neq 0 (
    echo [ERROR] 依赖安装失败！
    pause
    exit /b 1
)

echo [SUCCESS] 依赖安装完成

:check_complete
REM 启动开发环境
echo [INFO] 启动开发环境...
echo.
echo 开发服务器信息:
echo   - React 开发服务器: http://localhost:3000
echo   - Electron 主窗口将自动打开
echo.
echo 按 Ctrl+C 停止开发服务器
echo.

REM 启动开发环境
npm run dev

if %errorlevel% neq 0 (
    echo [ERROR] 启动开发环境失败！
    pause
    exit /b 1
)

echo [INFO] 开发服务器已停止
pause
