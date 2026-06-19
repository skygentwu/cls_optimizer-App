#!/bin/zsh
# macOS 一键启动：cls_optimizer-App 移动端 H5 前端（开发模式，端口 5174）
# 双击本文件即可，或在终端执行 ./run.command
set -e

SCRIPT_DIR="${0:A:h}"
cd "$SCRIPT_DIR"

# 确保能找到 node/npm（Finder 双击时 PATH 较窄）
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

if ! command -v npm >/dev/null 2>&1; then
  echo "[App] 未找到 npm，请先安装 Node.js (建议 v18+)：https://nodejs.org/"
  read -k 1 "?按任意键关闭..."
  exit 1
fi

# 首次运行自动安装依赖
if [ ! -d "node_modules" ]; then
  echo "[App] 未检测到 node_modules，正在安装依赖 (npm install)..."
  npm install
fi

# 检查后端是否正常（接口代理到 8080；后端没起则数据功能不可用）
echo "[App] 检查后端服务 http://localhost:8080/healthz ..."
BACKEND_OK=0
if command -v curl >/dev/null 2>&1; then
  if curl -s -m 3 http://localhost:8080/healthz 2>/dev/null | grep -q "cls-optimizer"; then
    BACKEND_OK=1
  fi
fi

if [ "$BACKEND_OK" = "1" ]; then
  echo "[App] ✅ 后端正常 (localhost:8080)"
else
  echo ""
  echo "  ⚠️  ============================================================"
  echo "  ⚠️  警告：未检测到后端服务 (localhost:8080)"
  echo "  ⚠️  前端界面可以打开，但登录/数据等接口将无法使用。"
  echo "  ⚠️  请先启动 cls_optimizer 后端（运行其 start-dev.command），"
  echo "  ⚠️  待后端就绪后刷新浏览器即可。"
  echo "  ⚠️  ============================================================"
  echo ""
fi

echo "[App] 启动开发服务器：http://localhost:5174"

# 后台等待服务就绪后自动打开浏览器
(
  for i in $(seq 1 30); do
    if curl -s -m 1 -o /dev/null http://localhost:5174 2>/dev/null; then
      open http://localhost:5174
      break
    fi
    sleep 1
  done
) &

npm run dev
