// src/dataSources/agents.js
// AI Agent 智能体资讯数据源 - AutoGPT、LangChain、Agent框架等

import { fetchData, getISODate, escapeHtml } from '../helpers.js';

const AgentsDataSource = {
    type: 'agent-news',
    
    fetch: async (env) => {
        console.log('Fetching AI Agent news...');
        const allNews = [];
        
        // 1. GitHub Trending Agent 相关项目
        try {
            const ghData = await fetchGitHubAgents(env);
            allNews.push(...ghData);
        } catch (error) {
            console.error("GitHub Agents fetch error:", error.message);
        }
        
        // 2. Reddit r/AutoGPT
        try {
            const redditData = await fetchRedditAgents();
            allNews.push(...redditData);
        } catch (error) {
            console.error("Reddit agents fetch error:", error.message);
        }
        
        // 3. LangChain Blog/Updates
        try {
            const langchainData = await fetchLangChain();
            allNews.push(...langchainData);
        } catch (error) {
            console.error("LangChain fetch error:", error.message);
        }
        
        return removeDuplicates(allNews, 'url').slice(0, 20);
    },
    
    transform: (rawData, sourceType) => {
        const unifiedData = [];
        const now = getISODate();
        
        if (Array.isArray(rawData)) {
            rawData.forEach((item, index) => {
                unifiedData.push({
                    id: item.id || `agent-${index}`,
                    type: sourceType,
                    url: item.url,
                    title: item.title,
                    description: item.description || "",
                    published_date: item.published_date || now,
                    authors: item.authors || [{ name: item.author || "Agent社区" }],
                    source: item.source || "Agent资讯",
                    details: {
                        category: item.category || "agent",
                        framework: item.framework || "General",
                        tags: item.tags || ["AI", "Agent"],
                        stars: item.stars,
                        ...item.details
                    }
                });
            });
        }
        
        return unifiedData;
    },
    
    generateHtml: (item) => {
        const frameworkBadge = item.details?.framework 
            ? `<span class="framework-badge">${item.details.framework}</span>` 
            : '';
        
        const starsBadge = item.details?.stars 
            ? `<span class="stars-badge">⭐ ${item.details.stars}</span>` 
            : '';
        
        return `
            <div class="agent-news-item">
                <div class="badges">
                    ${frameworkBadge}
                    ${starsBadge}
                </div>
                <h4><a href="${escapeHtml(item.url)}" target="_blank">${escapeHtml(item.title)}</a></h4>
                <p class="description">${escapeHtml(item.description) || '暂无描述'}</p>
                <div class="meta">
                    <small>
                        来源: ${escapeHtml(item.source)} | 
                        日期: ${new Date(item.published_date).toLocaleDateString('zh-CN')}
                    </small>
                </div>
            </div>
        `;
    }
};

// GitHub 搜索 Agent 相关项目
async function fetchGitHubAgents(env) {
    // 搜索关键词：agent、autogpt、langchain、llama-index 等
    const keywords = ['agent', 'autogpt', 'langchain', 'llama-index', 'crewai', 'autogen'];
    const allRepos = [];
    
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Agent-Daily-Bot/1.0'
    };
    
    if (env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${env.GITHUB_TOKEN}`;
    }
    
    for (const keyword of keywords) {
        try {
            // 搜索最近更新的相关项目
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const dateStr = thirtyDaysAgo.toISOString().split('T')[0];
            
            const searchUrl = `https://api.github.com/search/repositories?q=${keyword}+created:>${dateStr}&sort=stars&order=desc&per_page=5`;
            
            const response = await fetch(searchUrl, { headers });
            
            if (!response.ok) {
                console.warn(`GitHub search for ${keyword} failed: ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            
            data.items?.forEach(repo => {
                allRepos.push({
                    id: `gh-agent-${repo.id}`,
                    url: repo.html_url,
                    title: `${repo.name} - ${repo.description || 'AI Agent 项目'}`,
                    description: `${repo.description || '暂无描述'} | 语言: ${repo.language || 'Unknown'}`,
                    published_date: repo.created_at,
                    author: repo.owner.login,
                    source: 'GitHub',
                    category: 'Agent项目',
                    framework: keyword.charAt(0).toUpperCase() + keyword.slice(1),
                    tags: ['AI', 'Agent', keyword],
                    stars: repo.stargazers_count
                });
            });
        } catch (error) {
            console.error(`Error searching GitHub for ${keyword}:`, error);
        }
    }
    
    // 按星标排序并取前15
    return allRepos
        .sort((a, b) => (b.stars || 0) - (a.stars || 0))
        .slice(0, 15);
}

// Reddit Agent 相关社区
async function fetchRedditAgents() {
    const subreddits = ['AutoGPT', 'LangChain', 'artificial', 'MachineLearning'];
    const allPosts = [];
    
    for (const subreddit of subreddits) {
        try {
            const redditUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=5`;
            const response = await fetch(redditUrl, {
                headers: {
                    'User-Agent': 'Agent-Daily-Bot/1.0'
                }
            });
            
            if (!response.ok) continue;
            
            const data = await response.json();
            
            data.data.children
                .filter(post => !post.data.stickied)
                .forEach(post => {
                    allPosts.push({
                        id: `reddit-${subreddit}-${post.data.id}`,
                        url: post.data.url,
                        title: post.data.title,
                        description: post.data.selftext?.substring(0, 200) + '...' || '',
                        published_date: new Date(post.data.created_utc * 1000).toISOString(),
                        author: post.data.author,
                        source: `Reddit r/${subreddit}`,
                        category: 'Agent社区',
                        framework: subreddit,
                        tags: ['AI', 'Agent', 'community'],
                        score: post.data.score
                    });
                });
        } catch (error) {
            console.error(`Reddit r/${subreddit} fetch error:`, error);
        }
    }
    
    return allPosts.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);
}

// LangChain Blog
async function fetchLangChain() {
    try {
        // LangChain blog RSS
        const rssUrl = 'https://blog.langchain.dev/rss.xml';
        const response = await fetch(rssUrl);
        const xmlText = await response.text();
        
        const items = parseRSS(xmlText);
        
        return items.slice(0, 5).map((item, index) => ({
            id: `langchain-${index}`,
            url: item.link,
            title: item.title,
            description: item.description?.substring(0, 200) + '...' || '',
            published_date: item.pubDate,
            author: item.author || 'LangChain Team',
            source: 'LangChain Blog',
            category: 'Agent框架',
            framework: 'LangChain',
            tags: ['LangChain', 'Agent', 'Framework']
        }));
    } catch (error) {
        console.error("LangChain blog fetch error:", error);
        return [];
    }
}

// 工具函数
function parseRSS(xmlText) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemXml = match[1];
        items.push({
            title: extractXmlTag(itemXml, 'title') || '',
            link: extractXmlTag(itemXml, 'link') || '',
            description: extractXmlTag(itemXml, 'description') || '',
            pubDate: extractXmlTag(itemXml, 'pubDate') || '',
            author: extractXmlTag(itemXml, 'author') || extractXmlTag(itemXml, 'dc:creator') || ''
        });
    }
    
    return items;
}

function extractXmlTag(xml, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>([\s\S]*?)<\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() : null;
}

function removeDuplicates(array, key) {
    const seen = new Set();
    return array.filter(item => {
        if (seen.has(item[key])) return false;
        seen.add(item[key]);
        return true;
    });
}

export default AgentsDataSource;
