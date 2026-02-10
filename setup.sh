#!/bin/bash
# setup.sh - AI + Rust 资讯日报快速设置脚本
# 使用方法: ./setup.sh

set -e

echo "🚀 AI + Rust 资讯日报 - 快速设置脚本"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js
echo "📦 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Node.js 版本过低，需要 16+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# 检查 Wrangler
echo ""
echo "☁️  检查 Wrangler CLI..."
if ! command -v wrangler &> /dev/null; then
    echo "安装 Wrangler CLI..."
    npm install -g wrangler
fi
echo -e "${GREEN}✅ Wrangler 已安装${NC}"

# 安装依赖
echo ""
echo "📥 安装项目依赖..."
npm install
echo -e "${GREEN}✅ 依赖安装完成${NC}"

# 登录 Cloudflare
echo ""
echo "🔐 登录 Cloudflare..."
echo "将打开浏览器进行身份验证..."
wrangler login

# 创建 KV 命名空间
echo ""
echo "🗄️  创建 KV 命名空间..."
KV_OUTPUT=$(wrangler kv namespace create "DATA_KV" 2>&1) || true
KV_ID=$(echo "$KV_OUTPUT" | grep -oP 'id = "\K[^"]+' || echo "")

if [ -z "$KV_ID" ]; then
    echo -e "${YELLOW}⚠️  KV 命名空间可能已存在，请检查 wrangler.toml 配置${NC}"
    echo "如需查看现有 KV：wrangler kv namespace list"
else
    echo -e "${GREEN}✅ KV 命名空间创建成功${NC}"
    echo "KV ID: $KV_ID"
    
    # 更新 wrangler.toml
    if [ -f "wrangler.toml" ]; then
        sed -i.bak "s/id = \"你的-KV-ID\"/id = \"$KV_ID\"/" wrangler.toml
        rm -f wrangler.toml.bak
        echo -e "${GREEN}✅ 已更新 wrangler.toml${NC}"
    fi
fi

# 检查 wrangler.toml 配置
echo ""
echo "⚙️  检查 wrangler.toml 配置..."
if [ ! -f "wrangler.toml" ]; then
    echo -e "${YELLOW}⚠️  wrangler.toml 不存在，从模板创建...${NC}"
    cp wrangler.toml.example wrangler.toml
fi

echo ""
echo -e "${YELLOW}⚠️  请手动编辑 wrangler.toml 并配置以下必填项：${NC}"
echo ""
echo "  1. name                    - Worker 名称"
echo "  2. kv_namespaces[0].id    - KV ID (如果上面没有自动设置)"
echo "  3. GEMINI_API_KEY         - Google Gemini API Key"
echo "  4. GITHUB_TOKEN           - GitHub Personal Access Token"
echo "  5. GITHUB_REPO_OWNER      - GitHub 用户名"
echo "  6. GITHUB_REPO_NAME       - 仓库名"
echo "  7. LOGIN_USERNAME         - 后台登录用户名"
echo "  8. LOGIN_PASSWORD         - 后台登录密码"
echo ""

# 创建 .gitignore
echo "📝 创建 .gitignore..."
cat > .gitignore << 'EOF'
node_modules/
.git/
*.log
.env
.DS_Store
dist/
EOF
echo -e "${GREEN}✅ .gitignore 创建完成${NC}"

echo ""
echo "======================================"
echo -e "${GREEN}🎉 基础设置完成！${NC}"
echo ""
echo "📋 下一步操作："
echo ""
echo "1. 编辑 wrangler.toml 配置文件"
echo "   vim wrangler.toml"
echo ""
echo "2. 部署 Worker"
echo "   npm run deploy"
echo "   或: wrangler deploy"
echo ""
echo "3. 配置 GitHub Secrets："
echo "   - CF_API_TOKEN    (Cloudflare API Token)"
echo "   - CF_ACCOUNT_ID   (Cloudflare Account ID)"
echo ""
echo "4. 启用 GitHub Pages："
echo "   仓库 Settings → Pages → Source: Deploy from a branch"
echo ""
echo "📚 详细文档："
echo "   - DEPLOYMENT_GUIDE.md - 完整部署指南"
echo "   - CHECKLIST.md        - 部署检查清单"
echo "   - README_CUSTOM.md    - 项目说明"
echo ""
echo "🚀 开始部署你的 AI + Rust 资讯日报吧！"
echo ""
