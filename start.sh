#!/bin/bash

# Novel AI Assistant - 快速启动脚本
# 最小化检查，快速启动开发环境

set -e

echo "🚀 Novel AI Assistant - 快速启动"
echo ""

# 检查 Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖中..."
    npm install
fi

# 启动开发环境
echo "🎯 启动开发环境..."
npm run dev
