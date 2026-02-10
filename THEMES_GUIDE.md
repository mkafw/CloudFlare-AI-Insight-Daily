# 🎨 多主题配置指南

本项目支持 **6个预设主题**，你可以轻松切换不同的资讯专题：

---

## 📋 可用主题列表

| 主题键 | 名称 | 描述 | 数据源 |
|--------|------|------|--------|
| `aiRust` | **AI + Rust 资讯日报** | AI科技 + Rust编程 | 新闻、项目、论文、社交平台、Rust |
| `startup` | **创业洞察日报** | HN热门 + 创业资讯 | 创业、项目、新闻、社区 |
| `security` | **网络安全日报** | CVE + 安全公告 | 安全、Rust安全、安全工具、新闻 |
| `agents` | **AI Agent 日报** | AutoGPT + LangChain | Agent、项目、论文、新闻 |
| `investment` | **投资观察日报** | 加密 + 股市 | 投资、融资、市场、社区 |
| `fullstack` | **技术全栈日报** | 全覆盖综合版 | 全部6个数据源 |

---

## 🚀 切换主题方法

### 方法：修改配置文件

打开 `src/config/themes.js`，修改第106行：

```javascript
// 当前主题配置
export const CURRENT_THEME = 'aiRust'; // 修改这里的值
```

可选值：
- `'aiRust'` - AI + Rust 资讯
- `'startup'` - 创业洞察
- `'security'` - 网络安全
- `'agents'` - AI Agent
- `'investment'` - 投资观察
- `'fullstack'` - 全栈综合

修改后重新部署：
```bash
npm run deploy
```

---

## 📊 各主题详情

### 1️⃣ AI + Rust 资讯日报 (`aiRust`)

**适合人群：** AI从业者、Rust开发者

**数据源：**
- 🤖 AI新闻（Folo订阅源）
- 🦀 Rust资讯（Reddit/GitHub/官方博客）
- 📄 学术论文（HuggingFace）
- 💻 开源项目（GitHub Trending）
- 🐦 社交平台（Twitter/X, Reddit）

**Prompt示例：**
```
日报标题：AI + Rust 资讯日报
播客开场：欢迎来到今天的 AI 和 Rust 资讯时间！
```

---

### 2️⃣ 创业洞察日报 (`startup`)

**适合人群：** 创业者、投资人、独立开发者

**数据源：**
- 🚀 创业资讯（HackerNews热门）
- 📰 行业新闻（AI/科技）
- 💡 Product Hunt热门
- 👥 Indie Hackers社区
- 💻 热门项目（GitHub）

**Prompt示例：**
```
日报标题：创业洞察日报
播客开场：创业者们早上好！今天有哪些值得关注的创业动态？
```

---

### 3️⃣ 网络安全日报 (`security`)

**适合人群：** 安全研究员、渗透测试人员、运维工程师

**数据源：**
- 🔴 CVE漏洞（NVD数据库）
- 🔒 GitHub Security Advisories
- 🐛 HackerOne公开报告
- 🛡️ Reddit r/netsec
- 🦀 Rust安全相关项目

**Prompt示例：**
```
日报标题：网络安全日报
播客开场：安全研究员们注意！今日CVE漏洞播报开始。
```

---

### 4️⃣ AI Agent 日报 (`agents`)

**适合人群：** AI Agent开发者、LLM应用开发者

**数据源：**
- 🤖 Agent动态（AutoGPT、LangChain等）
- 📚 Agent论文
- 🛠️ Agent开源项目
- 💬 Reddit Agent社区
- 📰 AI新闻

**Prompt示例：**
```
日报标题：AI Agent 日报
播客开场：Agent爱好者们好！今天有哪些智能体新突破？
```

---

### 5️⃣ 投资观察日报 (`investment`)

**适合人群：** 投资者、交易员、DeFi参与者

**数据源：**
- 📈 加密货币新闻（CoinDesk）
- 💰 投资社区（Reddit r/investing）
- 🏢 融资动态（HN投资相关）
- 📊 市场讨论

**Prompt示例：**
```
日报标题：投资观察日报
播客开场：各位投资者早上好！今天的市场有哪些机会？
```

---

### 6️⃣ 技术全栈日报 (`fullstack`)

**适合人群：** 全栈开发者、技术管理者

**数据源：**
- 包含全部6个主题的数据源
- AI新闻、Rust、安全、Agent、创业

**Prompt示例：**
```
日报标题：技术全栈日报
播客开场：技术人早上好！今日技术圈有哪些新鲜事？
```

---

## 🛠️ 自定义主题

如果你想创建自己的主题：

### 1. 创建新的数据源文件
```bash
src/dataSources/your-theme.js
```

### 2. 在 `themes.js` 中添加新主题
```javascript
export const themes = {
    // ... 现有主题
    
    yourTheme: {
        name: '你的主题名称',
        shortName: '简称',
        description: '主题描述',
        dataSources: {
            yourCategory: { name: '分类名', sources: [YourDataSource] },
            // ...
        },
        prompts: {
            dailyTitle: '日报标题',
            podcastTitle: '播客标题',
            podcastBegin: '开场白',
            podcastEnd: '结束语'
        }
    }
};
```

### 3. 切换到你的主题
```javascript
export const CURRENT_THEME = 'yourTheme';
```

---

## 📁 主题配置文件位置

```
src/
├── config/
│   └── themes.js          # 主题配置文件
├── dataSources/
│   ├── rust.js            # Rust资讯
│   ├── startup.js         # 创业资讯
│   ├── security.js        # 安全资讯
│   ├── agents.js          # Agent资讯
│   └── investment.js      # 投资资讯
└── dataFetchers.js        # 数据获取器
```

---

## 🎯 快速开始建议

**如果你是...**

- **Rust开发者** → 使用 `aiRust` 主题
- **创业者** → 使用 `startup` 主题
- **安全研究员** → 使用 `security` 主题
- **AI应用开发者** → 使用 `agents` 主题
- **投资者** → 使用 `investment` 主题
- **技术全栈** → 使用 `fullstack` 主题

---

## 💡 主题切换最佳实践

1. **测试模式**
   ```bash
   npm run dev  # 本地测试新主题
   ```

2. **备份配置**
   切换主题前备份 `wrangler.toml`

3. **逐步迁移**
   先在小范围测试，确认无误后再切换

4. **监控数据**
   切换后观察几天，确保数据源正常工作

---

## 🔄 多实例部署

你可以部署多个Worker实例，每个使用不同主题：

```bash
# AI + Rust 日报
wrangler deploy --name ai-rust-daily

# 创业日报
wrangler deploy --name startup-daily

# 安全日报
wrangler deploy --name security-daily
```

每个实例独立运行，互不干扰！

---

## 📚 相关文档

- [主题配置详解](./src/config/themes.js)
- [数据源开发指南](./docs/EXTENDING.md)
- [部署指南](./DEPLOYMENT_GUIDE.md)

---

## 🤝 贡献新主题

欢迎提交 Pull Request 添加新主题！

**提交要求：**
1. 新主题必须包含至少2个数据源
2. 提供完整的Prompt配置
3. 更新本README说明新主题
4. 测试数据源能正常工作

---

**🎨 选择你的主题，开始打造专属资讯日报吧！**
