// src/config/themes.js
// 主题配置文件 - 轻松切换不同的资讯主题

import NewsAggregatorDataSource from '../dataSources/newsAggregator.js';
import GithubTrendingDataSource from '../dataSources/github-trending.js';
import PapersDataSource from '../dataSources/papers.js';
import TwitterDataSource from '../dataSources/twitter.js';
import RedditDataSource from '../dataSources/reddit.js';
import RustDataSource from '../dataSources/rust.js';
import StartupDataSource from '../dataSources/startup.js';
import SecurityDataSource from '../dataSources/security.js';
import AgentsDataSource from '../dataSources/agents.js';
import InvestmentDataSource from '../dataSources/investment.js';

// ==================== 主题配置 ====================

export const themes = {
    // 主题1: AI + Rust (默认)
    aiRust: {
        name: 'AI + Rust 资讯日报',
        shortName: 'AI & Rust 日报',
        description: 'AI科技动态 + Rust编程资讯',
        dataSources: {
            news: { name: '新闻', sources: [NewsAggregatorDataSource] },
            project: { name: '项目', sources: [GithubTrendingDataSource] },
            paper: { name: '论文', sources: [PapersDataSource] },
            socialMedia: { name: '社交平台', sources: [TwitterDataSource, RedditDataSource] },
            rust: { name: 'Rust 资讯', sources: [RustDataSource] },
        },
        prompts: {
            dailyTitle: 'AI + Rust 资讯日报',
            podcastTitle: 'AI与Rust播客',
            podcastBegin: '欢迎来到今天的 AI 和 Rust 资讯时间！',
            podcastEnd: '感谢收听，我们明天再见！'
        }
    },

    // 主题2: 创业与孵化
    startup: {
        name: '创业洞察日报',
        shortName: '创业日报',
        description: 'HackerNews热门 + 创业资讯 + 技术趋势',
        dataSources: {
            startup: { name: '创业资讯', sources: [StartupDataSource] },
            project: { name: '热门项目', sources: [GithubTrendingDataSource] },
            news: { name: '行业新闻', sources: [NewsAggregatorDataSource] },
            socialMedia: { name: '社区讨论', sources: [TwitterDataSource, RedditDataSource] },
        },
        prompts: {
            dailyTitle: '创业洞察日报',
            podcastTitle: '创业小酒馆',
            podcastBegin: '创业者们早上好！今天有哪些值得关注的创业动态和技术趋势？',
            podcastEnd: '祝各位创业者今天也有好运气，我们明天见！'
        }
    },

    // 主题3: 安全与漏洞
    security: {
        name: '网络安全日报',
        shortName: '安全日报',
        description: 'CVE漏洞、安全公告、渗透测试',
        dataSources: {
            security: { name: '安全漏洞', sources: [SecurityDataSource] },
            rust: { name: 'Rust安全', sources: [RustDataSource] },
            project: { name: '安全工具', sources: [GithubTrendingDataSource] },
            news: { name: '安全新闻', sources: [NewsAggregatorDataSource] },
        },
        prompts: {
            dailyTitle: '网络安全日报',
            podcastTitle: '安全情报站',
            podcastBegin: '安全研究员们注意！今日CVE漏洞播报开始。',
            podcastEnd: '记得及时更新你的系统，保持警惕，下次见！'
        }
    },

    // 主题4: AI Agent 智能体
    agents: {
        name: 'AI Agent 日报',
        shortName: 'Agent日报',
        description: 'AutoGPT、LangChain、Agent框架最新动态',
        dataSources: {
            agents: { name: 'Agent动态', sources: [AgentsDataSource] },
            project: { name: 'Agent项目', sources: [GithubTrendingDataSource] },
            paper: { name: 'Agent论文', sources: [PapersDataSource] },
            news: { name: 'AI新闻', sources: [NewsAggregatorDataSource] },
        },
        prompts: {
            dailyTitle: 'AI Agent 日报',
            podcastTitle: 'Agent播客',
            podcastBegin: 'Agent爱好者们好！今天有哪些智能体新突破？',
            podcastEnd: '让AI为你工作，我们明天继续探索！'
        }
    },

    // 主题5: 投资与市场
    investment: {
        name: '投资观察日报',
        shortName: '投资日报',
        description: '加密货币、股市、宏观经济',
        dataSources: {
            investment: { name: '投资资讯', sources: [InvestmentDataSource] },
            startup: { name: '融资动态', sources: [StartupDataSource] },
            news: { name: '市场新闻', sources: [NewsAggregatorDataSource] },
            socialMedia: { name: '投资社区', sources: [TwitterDataSource, RedditDataSource] },
        },
        prompts: {
            dailyTitle: '投资观察日报',
            podcastTitle: '投资早报',
            podcastBegin: '各位投资者早上好！今天的市场有哪些值得关注的机会？',
            podcastEnd: '投资有风险，入市需谨慎，明天见！'
        }
    },

    // 主题6: 全栈综合
    fullstack: {
        name: '技术全栈日报',
        shortName: '全栈日报',
        description: 'AI、Rust、安全、Agent、创业全覆盖',
        dataSources: {
            news: { name: '科技新闻', sources: [NewsAggregatorDataSource] },
            project: { name: '开源项目', sources: [GithubTrendingDataSource] },
            rust: { name: 'Rust生态', sources: [RustDataSource] },
            agents: { name: 'AI Agent', sources: [AgentsDataSource] },
            security: { name: '安全动态', sources: [SecurityDataSource] },
            startup: { name: '创业资讯', sources: [StartupDataSource] },
        },
        prompts: {
            dailyTitle: '技术全栈日报',
            podcastTitle: '技术播客',
            podcastBegin: '技术人早上好！今日技术圈有哪些新鲜事？',
            podcastEnd: '保持学习，保持好奇，明天继续！'
        }
    }
};

// ==================== 当前主题配置 ====================
// 修改这里来切换主题
export const CURRENT_THEME = 'aiRust'; // 可选: 'aiRust' | 'startup' | 'security' | 'agents' | 'investment' | 'fullstack'

// 获取当前主题配置
export function getCurrentTheme() {
    return themes[CURRENT_THEME] || themes.aiRust;
}

// 获取当前数据源配置
export function getCurrentDataSources() {
    return getCurrentTheme().dataSources;
}

// 获取当前提示词配置
export function getCurrentPrompts() {
    return getCurrentTheme().prompts;
}

// 列出所有可用主题
export function listThemes() {
    return Object.entries(themes).map(([key, theme]) => ({
        key,
        name: theme.name,
        shortName: theme.shortName,
        description: theme.description
    }));
}

export default themes;
