# 🤖 AI + Rust 资讯日报

> 你的专属每日 AI 科技 + Rust 编程资讯聚合平台

[![Deploy to Cloudflare Workers](https://img.shields.io/badge/Deploy-Cloudflare%20Workers-F38020?style=flat&logo=cloudflare)](https://workers.cloudflare.com/)
[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini-4285F4?style=flat&logo=google)](https://deepmind.google/technologies/gemini/)

---

## ✨ 新增特性

本项目基于 [CloudFlare-AI-Insight-Daily](https://github.com/mkafw/CloudFlare-AI-Insight-Daily) 定制，**新增 Rust 编程资讯数据源**：

- 🔥 **Reddit r/rust** - 社区热门讨论
- ⭐ **GitHub Trending** - 热门 Rust 开源项目
- 📰 **Rust 官方博客** - 官方动态和公告
- 🦀 **AI 智能摘要** - 自动总结 Rust 相关技术文章

---

## 📊 数据源概览

| 类型 | 数据源 | 说明 |
|------|--------|------|
| 🤖 AI 新闻 | Folo 订阅源 | AI 行业最新动态 |
| 📄 学术论文 | HuggingFace | AI/ML 前沿论文 |
| 💻 开源项目 | GitHub Trending | 热门 AI/ML 项目 |
| 🐦 社交媒体 | Twitter/X, Reddit | AI 大 V 动态 |
| 🦀 **Rust 资讯** | **Reddit + GitHub + 官方博客** | **Rust 生态最新内容** |

---

## 🚀 快速开始

### 1️⃣ 准备工作

- [Cloudflare](https://dash.cloudflare.com/sign-up) 账号
- [GitHub](https://github.com/) 账号
- [Google AI Studio](https://aistudio.google.com/app/apikey) API Key

### 2️⃣ 部署步骤

```bash
# 1. 克隆项目
git clone https://github.com/你的用户名/ai-insight-daily.git
cd ai-insight-daily

# 2. 安装依赖
npm install

# 3. 安装 Wrangler CLI
npm install -g wrangler

# 4. 登录 Cloudflare
wrangler login

# 5. 创建 KV 存储
wrangler kv namespace create "DATA_KV"
# 复制输出的 ID

# 6. 配置 wrangler.toml
cp wrangler.toml.example wrangler.toml
# 编辑 wrangler.toml，填入你的配置

# 7. 部署
wrangler deploy
```

### 3️⃣ 详细部署指南

查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 获取完整部署说明。

---

## 🔧 主要配置

编辑 `wrangler.toml`：

```toml
# Worker 名称
name = "ai-rust-daily"

# AI 模型
GEMINI_API_KEY = "你的-API-Key"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta"

# GitHub 发布
GITHUB_TOKEN = "你的-PAT-Token"
GITHUB_REPO_OWNER = "你的用户名"
GITHUB_REPO_NAME = "你的仓库名"

# 登录凭据
LOGIN_USERNAME = "admin"
LOGIN_PASSWORD = "你的密码"

# 日报标题
DAILY_TITLE = "AI + Rust 资讯日报"
PODCAST_TITLE = "你的播客名称"
```

---

## 📖 项目结构

```
ai-insight-daily/
├── src/
│   ├── dataSources/          # 数据源模块
│   │   ├── rust.js          # 🦀 Rust 资讯源【新增】
│   │   ├── github-trending.js
│   │   ├── papers.js
│   │   └── ...
│   ├── dataFetchers.js       # 数据获取协调器
│   ├── handlers/            # 请求处理器
│   ├── prompt/              # AI 提示词
│   └── index.js            # Worker 入口
├── .github/workflows/       # GitHub Actions
├── docs/                   # 文档
├── wrangler.toml          # Cloudflare 配置
└── README.md
```

---

## 🎯 使用方式

### 后台管理

访问你的 Worker URL：
```
https://your-worker-name.your-subdomain.workers.dev
```

功能：
- 📊 查看所有资讯
- ✏️ 手动筛选内容
- 🤖 生成 AI 摘要
- 🎙️ 生成播客脚本
- 🚀 一键发布日报

### 日报查看

- **网页版**: `https://你的用户名.github.io/你的仓库名`
- **RSS**: `https://你的用户名.github.io/你的仓库名/rss.xml`

---

## 🦀 Rust 资讯特性

新增的 Rust 数据源会自动获取：

### 社区讨论
- Reddit r/rust 热门帖子
- 讨论主题分类标记
- 投票数和评论数统计

### 开源项目
- GitHub Trending Rust 项目
- 星标数和分支数
- 项目标签和语言统计

### 官方动态
- Rust 官方博客更新
- 版本发布和重大公告
- 核心团队博客文章

---

## 🤖 AI 处理流程

1. **数据抓取** - 从多个源获取原始数据
2. **内容筛选** - 在后台管理界面手动勾选
3. **AI 摘要** - Google Gemini 生成内容摘要
4. **播客生成** - 自动生成口播稿
5. **自动发布** - 推送到 GitHub Pages

---

## 📝 自定义内容

### 修改数据源

编辑 `src/dataFetchers.js`：

```javascript
export const dataSources = {
    news: { name: '新闻', sources: [NewsAggregatorDataSource] },
    project: { name: '项目', sources: [GithubTrendingDataSource] },
    paper: { name: '论文', sources: [PapersDataSource] },
    socialMedia: { name: '社交平台', sources: [TwitterDataSource, RedditDataSource] },
    rust: { name: 'Rust 资讯', sources: [RustDataSource] }, // ✅ Rust 资讯
};
```

### 添加更多数据源

参考 `docs/EXTENDING.md` 或查看 `src/dataSources/rust.js` 作为示例。

---

## 🐛 常见问题

**Q: Worker 部署失败？**
> 检查 `wrangler.toml` 中的 KV ID 是否正确，并确保已运行 `wrangler login`

**Q: AI 内容生成失败？**
> 确认 Gemini API Key 有效，并检查 API URL 是否可访问

**Q: Rust 资讯未显示？**
> 需要网络访问 Reddit 和 GitHub。考虑配置 GITHUB_TOKEN 提高 API 限制

**Q: 如何更新内容源？**
> 编辑 `src/dataSources/` 下的对应文件，或使用后台管理界面配置 Folo 订阅

---

## 📚 相关文档

- [部署指南](./DEPLOYMENT_GUIDE.md) - 详细部署步骤
- [项目拓展指南](./docs/EXTENDING.md) - 如何添加新数据源
- [原项目文档](https://github.com/mkafw/CloudFlare-AI-Insight-Daily) - 上游项目

---

## 🙏 致谢

- 原项目：[mkafw/CloudFlare-AI-Insight-Daily](https://github.com/mkafw/CloudFlare-AI-Insight-Daily)
- 前端主题：[Hextra-AI-Insight-Daily](https://github.com/justlovemaki/Hextra-AI-Insight-Daily)
- Cloudflare Workers 平台
- Google Gemini AI

---

## 📄 许可

本项目基于 GPL-3.0 许可证开源。

---

## 💬 反馈与支持

如有问题，欢迎提交 Issue 或 Pull Request！
