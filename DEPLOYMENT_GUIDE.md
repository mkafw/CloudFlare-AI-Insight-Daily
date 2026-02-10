# 🚀 AI + Rust 资讯日报 - 专属部署指南

> 基于 Cloudflare Workers 的内容聚合与生成平台，每日精选 AI 和 Rust 编程领域的最新动态。

## 📋 项目概述

本项目是 [CloudFlare-AI-Insight-Daily](https://github.com/mkafw/CloudFlare-AI-Insight-Daily) 的定制版本，新增了 **Rust 编程资讯** 数据源，包含：

- **AI 科技资讯**：行业新闻、开源项目、学术论文、社交媒体动态
- **Rust 编程资讯**：
  - Reddit r/rust 社区热门讨论
  - GitHub Trending Rust 项目
  - Rust 官方博客更新
- **智能内容生成**：使用 Google Gemini 自动摘要
- **多平台发布**：GitHub Pages 网站、微信公众号、播客脚本

---

## 🛠️ 部署步骤

### 第一步：准备工作

1. **注册必要账号**：
   - [GitHub](https://github.com/) 账号（用于代码托管和 Pages）
   - [Cloudflare](https://dash.cloudflare.com/sign-up) 账号（用于 Workers 和 KV）
   - [Google AI Studio](https://aistudio.google.com/app/apikey)（获取 Gemini API Key）

2. **安装必要工具**：
   ```bash
   # 安装 Node.js（如未安装）
   # https://nodejs.org/

   # 安装 Wrangler CLI
   npm install -g wrangler
   ```

### 第二步：Fork 并配置项目

1. **Fork 本仓库**：
   - 访问你的 GitHub 仓库（你已拥有此项目）
   - 点击右上角 "Fork" 按钮，fork 到你自己的账号

2. **克隆到本地**：
   ```bash
   git clone https://github.com/你的用户名/ai-insight-daily.git
   cd ai-insight-daily
   ```

3. **安装依赖**：
   ```bash
   npm install
   ```

### 第三步：配置 Cloudflare

1. **登录 Wrangler**：
   ```bash
   wrangler login
   ```

2. **创建 KV 命名空间**：
   ```bash
   wrangler kv namespace create "DATA_KV"
   ```
   记录输出的 ID，稍后会用到。

3. **修改 `wrangler.toml` 配置**：

   打开 `wrangler.toml` 文件，修改以下配置：

   ```toml
   # 修改为你的 Worker 名称
   name = "你的-worker-名称"

   kv_namespaces = [
     { binding = "DATA_KV", id = "你的-KV-ID" }
   ]

   [vars]
   # AI 模型配置
   GEMINI_API_KEY = "你的-Gemini-API-Key"
   GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta"
   
   # 或使用 OpenAI 兼容 API
   # OPENAI_API_KEY = "你的-API-Key"
   # OPENAI_API_URL = "https://api.openai.com/v1"
   # DEFAULT_OPEN_MODEL = "gpt-4"

   # GitHub 配置（用于自动发布到 Pages）
   GITHUB_TOKEN = "你的-GitHub-Personal-Access-Token"
   GITHUB_REPO_OWNER = "你的-GitHub-用户名"
   GITHUB_REPO_NAME = "你的-仓库名"
   
   # 日报标题自定义
   DAILY_TITLE = "你的日报名称"
   DAILY_TITLE_MIN = " `你的简称` "
   PODCAST_TITLE = "你的播客名称"
   PODCAST_BEGIN = "你的播客开场白"
   PODCAST_END = "你的播客结束语"
   
   # 登录凭据（用于后台管理）
   LOGIN_USERNAME = "你的用户名"
   LOGIN_PASSWORD = "你的密码"
   
   # 网站链接
   BOOK_LINK = "https://你的用户名.github.io/你的仓库名"
   INSERT_APP_URL = "<h3>[查看完整版日报↗️ https://你的用户名.github.io/你的仓库名](https://你的用户名.github.io/你的仓库名)</h3>"
   ```

### 第四步：获取 API 密钥

1. **Gemini API Key**：
   - 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
   - 点击 "Create API Key"
   - 复制生成的密钥

2. **GitHub Personal Access Token**：
   - 访问 GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - 点击 "Generate new token (classic)"
   - 勾选以下权限：
     - `repo` (完整仓库访问)
     - `workflow` (GitHub Actions)
   - 生成并复制 token

3. **（可选）GitHub Token**：
   - 如需获取 Trending 项目，建议配置 GitHub Token 以提高 API 限制
   - 同上方法生成，只需 `public_repo` 权限

### 第五步：部署到 Cloudflare Workers

1. **部署 Worker**：
   ```bash
   wrangler deploy
   ```

2. **记录 Worker URL**：
   部署成功后会显示类似：
   ```
   Published your-worker-name (2.36 sec)
   https://your-worker-name.your-subdomain.workers.dev
   ```
   保存这个 URL，这是你的后台管理地址。

### 第六步：配置 GitHub Pages

1. **启用 GitHub Pages**：
   - 打开你的 GitHub 仓库
   - Settings → Pages
   - Source 选择 "Deploy from a branch"
   - Branch 选择 "main"，文件夹选择 "/ (root)"
   - 点击 Save

2. **等待部署完成**：
   - 几分钟后访问 `https://你的用户名.github.io/你的仓库名`
   - 你应该能看到日报网站

### 第七步：配置自动化（GitHub Actions）

1. **设置 Secrets**：
   - 打开 GitHub 仓库 → Settings → Secrets and variables → Actions
   - 点击 "New repository secret"
   - 添加以下 secrets：
     - `CF_ACCOUNT_ID`: 你的 Cloudflare Account ID
     - `CF_API_TOKEN`: 你的 Cloudflare API Token

2. **获取 Cloudflare 凭证**：
   - **Account ID**: Cloudflare 控制台右下角查看
   - **API Token**: 
     - 访问 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
     - 点击 "Create Token"
     - 使用 "Edit Cloudflare Workers" 模板
     - 选择你的账号和 Zone
     - 生成 Token

3. **自动化已配置**：
   项目已包含 `.github/workflows/deploy.yml`，会自动：
   - 每日定时生成日报
   - 推送到 GitHub Pages
   - 生成 RSS feed

---

## 🔧 自定义配置

### 修改数据源

编辑 `src/dataFetchers.js` 可以启用/禁用数据源：

```javascript
export const dataSources = {
    news: { name: '新闻', sources: [NewsAggregatorDataSource] },
    project: { name: '项目', sources: [GithubTrendingDataSource] },
    paper: { name: '论文', sources: [PapersDataSource] },
    socialMedia: { name: '社交平台', sources: [TwitterDataSource, RedditDataSource] },
    rust: { name: 'Rust 资讯', sources: [RustDataSource] }, // ✅ 新增 Rust 资讯
};
```

### 配置 Folo 订阅源（可选）

如需从 Folo 获取内容：

1. 访问 [Folo](https://app.follow.is/)
2. 按 F12 打开开发者工具 → Network 标签
3. 刷新页面，找到带有 `cookie` 的请求
4. 复制 cookie 值
5. 在 Worker 后台管理界面配置（访问你的 Worker URL）

### 自定义样式

编辑 `src/index.js` 中的 HTML 模板，可以修改：
- 日报页面样式
- 颜色主题
- 布局结构

---

## 📱 使用方法

### 后台管理

访问你的 Worker URL：
```
https://your-worker-name.your-subdomain.workers.dev
```

登录后可以使用：
- 📊 查看内容列表
- ✏️ 编辑/筛选内容
- 🤖 生成 AI 摘要
- 📝 生成播客脚本
- 🚀 发布日报

### 查看日报

- **网页版**: `https://你的用户名.github.io/你的仓库名`
- **RSS**: `https://你的用户名.github.io/你的仓库名/rss.xml`

---

## 🐛 故障排除

### Worker 部署失败

1. 检查 `wrangler.toml` 配置是否正确
2. 确保已运行 `wrangler login`
3. 检查 KV namespace ID 是否正确

### AI 内容生成失败

1. 检查 Gemini API Key 是否有效
2. 确认 API URL 可访问（可能需要代理）
3. 查看 Worker 日志：`wrangler tail`

### GitHub Pages 未更新

1. 检查 GitHub Token 是否有 `repo` 权限
2. 确认仓库名称和所有者配置正确
3. 查看 Actions 运行状态

### Rust 资讯未显示

1. 检查网络连接（需要访问 Reddit 和 GitHub）
2. 查看 Worker 日志获取详细错误
3. 考虑添加 GitHub Token 提高 API 限制

---

## 📚 技术栈

- **Cloudflare Workers**: 边缘计算平台
- **Cloudflare KV**: 键值存储
- **Google Gemini**: AI 内容生成
- **GitHub Pages**: 静态网站托管
- **GitHub Actions**: CI/CD 自动化

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可

本项目基于 GPL-3.0 许可证开源。
