# ✅ 部署前检查清单

在部署你的 AI + Rust 资讯日报之前，请确保完成以下所有步骤：

## 📋 必备账号

- [ ] Cloudflare 账号（免费版即可）
- [ ] GitHub 账号
- [ ] Google AI Studio 账号（获取 Gemini API Key）

## 🔧 本地环境

- [ ] 安装 Node.js (v16+)
- [ ] 安装 Wrangler CLI: `npm install -g wrangler`
- [ ] 登录 Wrangler: `wrangler login`

## ⚙️ 配置文件

### wrangler.toml 必须修改的字段：

- [ ] `name` - Worker 名称（英文，小写）
- [ ] `kv_namespaces[0].id` - KV 命名空间 ID
- [ ] `GEMINI_API_KEY` - Gemini API 密钥
- [ ] `GITHUB_TOKEN` - GitHub Personal Access Token
- [ ] `GITHUB_REPO_OWNER` - GitHub 用户名
- [ ] `GITHUB_REPO_NAME` - 仓库名称
- [ ] `LOGIN_USERNAME` - 后台登录用户名
- [ ] `LOGIN_PASSWORD` - 后台登录密码（建议使用强密码）
- [ ] `DAILY_TITLE` - 日报标题
- [ ] `BOOK_LINK` - GitHub Pages 链接
- [ ] `INSERT_APP_URL` - 网站链接

### 可选配置：

- [ ] `IMG_PROXY` - 图片代理（如需处理图片）
- [ ] `GITHUB_TOKEN`（额外）- 用于 GitHub API，提高 Rate Limit
- [ ] `PODCAST_TITLE` - 播客名称
- [ ] `PODCAST_BEGIN` - 播客开场白
- [ ] `PODCAST_END` - 播客结束语

## 🚀 部署步骤

1. **创建 KV 命名空间**
   ```bash
   wrangler kv namespace create "DATA_KV"
   ```
   - [ ] 记录输出的 ID
   - [ ] 将 ID 填入 `wrangler.toml`

2. **部署 Worker**
   ```bash
   wrangler deploy
   ```
   - [ ] 部署成功
   - [ ] 记录 Worker URL

3. **配置 GitHub Pages**
   - [ ] 仓库 Settings → Pages
   - [ ] Source: Deploy from a branch
   - [ ] Branch: main, Folder: / (root)
   - [ ] 保存并等待部署

4. **配置 GitHub Actions Secrets**
   - [ ] `CF_ACCOUNT_ID`: Cloudflare Account ID
   - [ ] `CF_API_TOKEN`: Cloudflare API Token

5. **配置 GitHub Variables**（可选）
   - [ ] `WRITE_RSS_URL`: Worker URL + `/writeRssData`
   - [ ] `RSS_FEED_URL`: Worker URL + `/getRss`

## 🧪 测试检查

- [ ] 访问 Worker URL，确认后台管理界面正常
- [ ] 使用配置的凭据登录
- [ ] 点击 "获取内容"，确认能正常抓取数据
- [ ] 访问 GitHub Pages 链接，确认网站正常
- [ ] 检查是否能访问 `/rss.xml`

## 🦀 Rust 资讯源检查

- [ ] 在后台管理界面查看是否有 "Rust 资讯" 分类
- [ ] 确认能正常获取 Reddit r/rust 内容
- [ ] 确认能正常获取 GitHub Rust Trending 项目
- [ ] 检查 Rust 官方博客内容是否显示

## 🔐 安全建议

- [ ] 使用强密码作为 LOGIN_PASSWORD
- [ ] GitHub Token 仅赋予必要的权限（repo, workflow）
- [ ] 不要将 API Key 提交到公开仓库
- [ ] 定期轮换 API Key 和 Token
- [ ] 启用 GitHub 仓库的 2FA

## 📱 可选配置

- [ ] 配置 Folo Cookie（如需从 Folo 获取内容）
- [ ] 自定义日报样式
- [ ] 添加自定义域名（Cloudflare Pages 或 GitHub Pages）
- [ ] 配置微信公众号推送（需要额外开发）

## 🐛 故障排除准备

- [ ] 熟悉查看 Worker 日志: `wrangler tail`
- [ ] 知道如何查看 GitHub Actions 运行日志
- [ ] 保存所有 API Key 和 Token 的备份

---

## ✅ 部署完成后的验证

- [ ] Worker URL 可以访问
- [ ] 后台登录正常
- [ ] 能手动触发内容获取
- [ ] GitHub Pages 网站正常显示
- [ ] RSS feed 可正常访问
- [ ] 定时任务（GitHub Actions）运行正常

---

**🎉 恭喜！完成以上所有步骤后，你的 AI + Rust 资讯日报就部署成功了！**

如有问题，请参考 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 或提交 Issue。
