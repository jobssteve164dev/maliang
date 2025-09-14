@echo off
setlocal enabledelayedexpansion

REM Novel AI Assistant - Windows 开发环境启动脚本

title Novel AI Assistant - Development Environment

REM 检查命令行参数
if "%1"=="cleanup" goto cleanup_environment
if "%1"=="--cleanup" goto cleanup_environment
if "%1"=="help" goto show_help
if "%1"=="--help" goto show_help

echo ========================================
echo   Novel AI Assistant 开发环境启动器
echo ========================================
echo.

REM 检查 Node.js 是否安装
echo [INFO] 检查 Node.js 环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Node.js 未安装！
    echo.
    echo 是否尝试自动安装 Node.js? ^(y/N^)
    set /p AUTO_INSTALL="请输入选择: "
    
    if /i "!AUTO_INSTALL!"=="y" (
        goto auto_install_nodejs
    ) else (
        echo [INFO] 跳过自动安装
        goto show_manual_install
    )
)

goto check_node_version

:auto_install_nodejs
echo [INFO] 尝试自动安装 Node.js...

REM 检查是否有 Chocolatey
where choco >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] 使用 Chocolatey 安装 Node.js...
    choco install nodejs -y
    if %errorlevel% equ 0 (
        echo [SUCCESS] Node.js 安装成功！
        goto check_node_version
    ) else (
        echo [ERROR] Chocolatey 安装失败
        goto try_winget
    )
)

:try_winget
REM 检查是否有 winget
where winget >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] 使用 winget 安装 Node.js...
    winget install OpenJS.NodeJS --silent
    if %errorlevel% equ 0 (
        echo [SUCCESS] Node.js 安装成功！
        goto check_node_version
    ) else (
        echo [ERROR] winget 安装失败
        goto download_installer
    )
)

:download_installer
echo [INFO] 尝试下载 Node.js 安装包...
set NODE_URL=https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi

REM 检查是否有 curl
where curl >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] 使用 curl 下载安装包...
    curl -L -o nodejs-installer.msi "%NODE_URL%"
    if %errorlevel% equ 0 (
        echo [INFO] 下载完成，请运行 nodejs-installer.msi 完成安装
        echo [INFO] 安装完成后请重新运行此脚本
        start nodejs-installer.msi
        pause
        exit /b 1
    )
)

REM 检查是否有 PowerShell
where powershell >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] 使用 PowerShell 下载安装包...
    powershell -Command "Invoke-WebRequest -Uri '%NODE_URL%' -OutFile 'nodejs-installer.msi'"
    if %errorlevel% equ 0 (
        echo [INFO] 下载完成，请运行 nodejs-installer.msi 完成安装
        echo [INFO] 安装完成后请重新运行此脚本
        start nodejs-installer.msi
        pause
        exit /b 1
    )
)

echo [ERROR] 自动安装失败，请手动安装
goto show_manual_install

:show_manual_install
echo.
echo 🪟 Windows 手动安装选项：
echo   1. 官方安装包: https://nodejs.org/ ^(推荐^)
echo   2. Chocolatey: choco install nodejs
echo   3. Scoop: scoop install nodejs
echo   4. winget: winget install OpenJS.NodeJS
echo.
echo 💡 推荐使用 Node.js LTS 版本 ^(当前为 v18.x^)
echo 📚 更多安装方式: https://nodejs.org/en/download/package-manager/
pause
exit /b 1

:check_node_version
REM 重新检查 Node.js 是否可用
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 安装后仍无法找到 Node.js，请检查 PATH 环境变量
    echo [INFO] 可能需要重启命令提示符或重新加载环境变量
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
REM 检查端口占用
echo [INFO] 检查端口占用情况...
netstat -an | findstr ":3333" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [WARNING] 端口 3333 已被占用
    echo [INFO] 将在 8 秒后自动清理，按任意键立即清理...
    
    REM 倒计时清理
    set countdown=8
    :countdown_loop
    if !countdown! gtr 0 (
        echo [INFO] 自动清理倒计时: !countdown! 秒 ^(按任意键立即清理^)
        timeout /t 1 >nul
        set /a countdown-=1
        goto countdown_loop
    )
    
    echo [INFO] 倒计时结束，自动清理端口 3333...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3333" ^| findstr "LISTENING"') do (
        echo [INFO] 终止进程 %%a...
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 >nul
    echo [SUCCESS] 端口清理完成
)

REM 启动开发环境
echo [INFO] 启动开发环境...
echo.
echo 开发服务器信息:
echo   - React 开发服务器: http://localhost:3333
echo   - Electron 主窗口将自动打开
echo.
echo 💡 使用以下命令管理开发环境:
echo   - Ctrl+C: 停止开发服务器
echo   - dev.bat cleanup: 清理环境
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
goto end

:cleanup_environment
echo ========================================
echo   Novel AI Assistant 环境清理工具
echo ========================================
echo.
echo [INFO] 🧹 开始清理开发环境...

REM 清理Node.js开发进程
echo [INFO] 清理Node.js开发进程...
tasklist | findstr "node.exe" >nul
if %errorlevel% equ 0 (
    echo [INFO] 发现Node.js进程，正在终止...
    taskkill /IM node.exe /F >nul 2>&1
)

REM 清理npm进程
tasklist | findstr "npm.cmd" >nul
if %errorlevel% equ 0 (
    echo [INFO] 发现npm进程，正在终止...
    taskkill /IM npm.cmd /F >nul 2>&1
)

REM 清理Electron进程
tasklist | findstr "electron.exe" >nul
if %errorlevel% equ 0 (
    echo [INFO] 发现Electron进程，正在终止...
    taskkill /IM electron.exe /F >nul 2>&1
)

REM 清理端口占用
echo [INFO] 清理端口占用...
for %%p in (3333 5000 8080 9000) do (
    netstat -ano | findstr ":%%p" | findstr "LISTENING" >nul
    if !errorlevel! equ 0 (
        echo [INFO] 清理端口 %%p...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p" ^| findstr "LISTENING"') do (
            taskkill /PID %%a /F >nul 2>&1
        )
    )
)

echo [SUCCESS] ✅ 环境清理完成！
pause
goto end

:show_help
echo Novel AI Assistant - Windows 开发环境启动脚本
echo.
echo 用法: dev.bat [选项]
echo.
echo 选项:
echo   help, --help     显示此帮助信息
echo   cleanup          清理开发环境（进程和端口）
echo.
echo 示例:
echo   dev.bat          # 正常启动开发环境
echo   dev.bat cleanup  # 清理开发环境
echo   dev.bat help     # 显示帮助信息
pause
goto end

:end
