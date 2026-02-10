#!/bin/bash
# deploy.sh - 一键部署脚本
# 使用方法:
#   1. 编辑此文件，填入你的配置
#   2. 运行: ./deploy.sh

set -e

# ==================== 颜色定义 ====================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==================== 配置区域（请修改）====================

# Cloudflare 配置
CF_ACCOUNT_ID="YOUR_CLOUDFLARE_ACCOUNT_ID"  # 从 Cloudflare Dashboard 右下角获取
CF_API_TOKEN="YOUR_CLOUDFLARE_API_TOKEN"    # 从 Cloudflare Profile → API Tokens 创建

# AI 模型配置
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"        # 从 https://aistudio.google.com/app/apikey 获取

# GitHub 配置
GITHUB_TOKEN="github_pat_YOUR_TOKEN"        # GitHub Personal Access Token (需要 repo 权限)
GITHUB_USERNAME="YOUR_GITHUB_USERNAME"      # 你的 GitHub 用户名
REPO_NAME="ai-insight-daily"                # 仓库名称

# 项目配置
WORKER_NAME="ai-rust-daily"                 # Worker 名称
LOGIN_USERNAME="admin"                      # 后台登录用户名
LOGIN_PASSWORD="YOUR_STRONG_PASSWORD"       # 后台登录密码

# 日报标题
DAILY_TITLE="AI + Rust 资讯日报"
PODCAST_TITLE="AI与Rust播客"

# ==================== 部署开始 ====================

echo "🚀 AI + Rust 资讯日报 - 一键部署"
echo "=================================="
echo ""

# 检查配置是否已修改
if [ "$CF_ACCOUNT_ID" = "YOUR_CLOUDFLARE_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ 错误: 请先编辑此文件，填入你的 Cloudflare Account ID${NC}"
    echo "提示: 在 Cloudflare Dashboard 右下角可以找到 Account ID"
    exit 1
fi

if [ "$CF_API_TOKEN" = "YOUR_CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}❌ 错误: 请先编辑此文件，填入你的 Cloudflare API Token${NC}"
    echo "提示: 访问 https://dash.cloudflare.com/profile/api-tokens 创建 Token"
    exit 1
fi

if [ "$GEMINI_API_KEY" = "YOUR_GEMINI_API_KEY" ]; then
    echo -e "${RED}❌ 错误: 请先编辑此文件，填入你的 Gemini API Key${NC}"
    echo "提示: 访问 https://aistudio.google.com/app/apikey 获取"
    exit 1
fi

echo -e "${BLUE}ℹ️  配置检查通过，开始部署...${NC}"
echo ""

# 步骤 1: 检查依赖
echo "📦 步骤 1/6: 检查依赖..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

if ! command -v wrangler &> /dev/null; then
    echo "安装 Wrangler CLI..."
    npm install -g wrangler
fi
echo -e "${GREEN}✅ 依赖检查完成${NC}"
echo ""

# 步骤 2: 安装项目依赖
echo "📥 步骤 2/6: 安装项目依赖..."
npm install
echo -e "${GREEN}✅ 依赖安装完成${NC}"
echo ""

# 步骤 3: 登录 Cloudflare
echo "🔐 步骤 3/6: 登录 Cloudflare..."
echo "如果浏览器没有自动打开，请手动访问授权链接"
WRANGLER_LOGIN_OUTPUT=$(npx wrangler login 2>&1) || true
if echo "$WRANGLER_OUTPUT" | grep -q "Successfully"; then
    echo -e "${GREEN}✅ 登录成功${NC}"
else
    echo -e "${YELLOW}⚠️  如果已登录过，请忽略此警告${NC}"
fi
echo ""

# 步骤 4: 创建或获取 KV 命名空间
echo "🗄️  步骤 4/6: 配置 KV 命名空间..."
KV_LIST=$(npx wrangler kv namespace list 2>/dev/null || echo "[]")
KV_ID=$(echo "$KV_LIST" | grep -o '"id":"[^"]*"' | grep -o '[^"]*' | tail -1)

if [ -z "$KV_ID" ]; then
    echo "创建新的 KV 命名空间..."
    KV_OUTPUT=$(npx wrangler kv namespace create "DATA_KV" 2>&1)
    KV_ID=$(echo "$KV_OUTPUT" | grep -oP 'id = "\K[^"]+')
    if [ -z "$KV_ID" ]; then
        echo -e "${RED}❌ KV 命名空间创建失败${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ KV 命名空间创建成功: $KV_ID${NC}"
else
    echo -e "${GREEN}✅ 使用现有 KV 命名空间: $KV_ID${NC}"
fi
echo ""

# 步骤 5: 生成 wrangler.toml
echo "⚙️  步骤 5/6: 生成配置文件..."
cat > wrangler.toml << EOF
# wrangler.toml
# 自动生成于 $(date)
name = "$WORKER_NAME"
main = "src/index.js"
compatibility_date = "2025-05-20"
workers_dev = true

kv_namespaces = [
  { binding = "DATA_KV", id = "$KV_ID" }
]

[vars]
IMG_PROXY = ""
OPEN_TRANSLATE = "true"
USE_MODEL_PLATFORM = "GEMINI"
GEMINI_API_KEY = "$GEMINI_API_KEY"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-preview-05-20"
OPENAI_API_KEY = ""
OPENAI_API_URL = "https://api.openai.com/v1"
DEFAULT_OPEN_MODEL = "gpt-4"
FOLO_COOKIE_KV_KEY = "folo_auth_cookie"
FOLO_DATA_API = "https://api.follow.is/entries"
FOLO_FILTER_DAYS = 1
NEWS_AGGREGATOR_LIST_ID = "158437828119024640"
NEWS_AGGREGATOR_FETCH_PAGES = "1"
HGPAPERS_LIST_ID = "158437917409783808"
HGPAPERS_FETCH_PAGES = "1"
TWITTER_LIST_ID = "153028784690326528"
TWITTER_FETCH_PAGES = "1"
REDDIT_LIST_ID = "167576006499975168"
REDDIT_FETCH_PAGES = "1"
PROJECTS_API_URL = "https://git-trending.justlikemaki.vip/topone/?since=daily"
GITHUB_TOKEN = "$GITHUB_TOKEN"
GITHUB_REPO_OWNER = "$GITHUB_USERNAME"
GITHUB_REPO_NAME = "$REPO_NAME"
GITHUB_BRANCH = "main"
LOGIN_USERNAME = "$LOGIN_USERNAME"
LOGIN_PASSWORD = "$LOGIN_PASSWORD"
DAILY_TITLE = "$DAILY_TITLE"
DAILY_TITLE_MIN = " \`AI & Rust 日报\` "
PODCAST_TITLE = "$PODCAST_TITLE"
PODCAST_BEGIN = "欢迎来到今天的 AI 和 Rust 资讯时间！"
PODCAST_END = "感谢收听，我们明天再见！"
BOOK_LINK = "https://$GITHUB_USERNAME.github.io/$REPO_NAME"
INSERT_FOOT = "false"
INSERT_AD = "false"
INSERT_APP_URL = "<h3>[查看完整版日报↗️](https://$GITHUB_USERNAME.github.io/$REPO_NAME)</h3>"
EOF

echo -e "${GREEN}✅ 配置文件生成完成${NC}"
echo ""

# 步骤 6: 部署 Worker
echo "🚀 步骤 6/6: 部署 Worker..."
npx wrangler deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================="
    echo -e "${GREEN}🎉 部署成功！${NC}"
    echo "=================================="
    echo ""
    echo "📋 下一步："
    echo ""
    echo "1. 设置 GitHub Secrets:"
    echo "   访问: https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/secrets/actions"
    echo "   添加:"
    echo "   - CF_API_TOKEN: $CF_API_TOKEN"
    echo "   - CF_ACCOUNT_ID: $CF_ACCOUNT_ID"
    echo ""
    echo "2. 启用 GitHub Pages:"
    echo "   访问: https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/pages"
    echo "   Source: Deploy from a branch"
    echo "   Branch: main"
    echo ""
    echo "3. 访问你的 Worker:"
    echo "   https://$WORKER_NAME.your-subdomain.workers.dev"
    echo ""
    echo "4. 访问你的日报网站:"
    echo "   https://$GITHUB_USERNAME.github.io/$REPO_NAME"
    echo ""
else
    echo -e "${RED}❌ 部署失败${NC}"
    echo "请检查错误信息并重试"
    exit 1
fi
