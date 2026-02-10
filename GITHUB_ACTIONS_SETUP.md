# GitHub Actions 配置指南

## 🚀 自动部署流程

代码已推送到 GitHub 仓库，现在需要配置 GitHub Actions 来实现自动部署。

---

## 📋 配置步骤

### 1. 打开 GitHub Secrets 设置

访问以下链接：
```
https://github.com/mkafw/CloudFlare-AI-Insight-Daily/settings/secrets/actions
```

### 2. 添加以下 Secrets

点击 **"New repository secret"** 按钮，逐个添加：

#### 必需 Secrets

| Secret 名称 | 值 | 说明 |
|------------|-----|------|
| `CF_API_TOKEN` | `你的_Cloudflare_API_Token` | Cloudflare API Token |
| `CF_ACCOUNT_ID` | `你的_Cloudflare_Account_ID` | Cloudflare Account ID |

#### 可选 Secrets（用于 GitHub Pages 发布）

| Secret 名称 | 值 | 说明 |
|------------|-----|------|
| `GITHUB_TOKEN` | `你的_GitHub_Token` | GitHub Personal Access Token |

### 3. 配置 GitHub Variables（可选）

在同一页面切换到 **Variables** 标签，添加：

| Variable 名称 | 值 |
|--------------|-----|
| `WRITE_RSS_URL` | `https://ai-rust-daily.tiklt1.workers.dev/writeRssData` |
| `RSS_FEED_URL` | `https://ai-rust-daily.tiklt1.workers.dev/getRss` |

（注意：这些 URL 需要等 Worker 部署后才能确定）

---

## 🔄 部署流程说明

### 自动触发部署
当你推送代码到 `main` 分支时，GitHub Actions 会自动：
1. 运行测试
2. 部署到 Cloudflare Workers
3. 更新 Worker 配置

### 手动触发部署
也可以手动运行工作流：
1. 访问 `https://github.com/mkafw/CloudFlare-AI-Insight-Daily/actions`
2. 选择 **"Deploy Worker"** 工作流
3. 点击 **"Run workflow"**

---

## 📝 本地配置说明

### wrangler.toml 配置

在本地开发时，你需要创建 `wrangler.toml` 文件：

```bash
# 复制示例配置
cp wrangler.toml.example wrangler.toml

# 编辑并填入你的真实凭证
vim wrangler.toml
```

填入以下信息：
- KV namespace ID
- Gemini API Key
- GitHub Token
- 其他配置

### 重要提醒

⚠️ **wrangler.toml 包含敏感信息，不要提交到 GitHub！**

`.gitignore` 已配置忽略此文件，但请确保你没有意外提交过包含真实凭证的版本。

---

## 🎯 部署后访问

部署成功后，你可以通过以下地址访问：

- **Worker 后台**: `https://ai-rust-daily.tiklt1.workers.dev`
- **GitHub Pages**: `https://mkafw.github.io/CloudFlare-AI-Insight-Daily`

---

## 🐛 故障排除

### GitHub Actions 运行失败

1. 检查 Secrets 是否正确设置
2. 查看 Actions 日志获取详细错误信息
3. 确保 Cloudflare Token 有权限部署 Workers

### Worker 部署成功但无法访问

1. 检查 Worker 是否已启用
2. 查看 Cloudflare Dashboard 中的 Worker 日志
3. 确认 KV 命名空间已正确绑定

---

## 📚 相关文档

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

---

## ✅ 配置清单

- [ ] 添加 `CF_API_TOKEN` Secret
- [ ] 添加 `CF_ACCOUNT_ID` Secret
- [ ] （可选）添加 `GITHUB_TOKEN` Secret
- [ ] （可选）添加 GitHub Variables
- [ ] 推送代码触发自动部署
- [ ] 验证 Worker 是否正常运行

配置完成后，推送到 main 分支即可自动部署！
