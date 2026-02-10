// src/dataSources/rust.js
// Rust 编程资讯数据源 - 获取 Rust 社区最新动态

import { fetchData, getISODate, removeMarkdownCodeBlock, escapeHtml } from '../helpers.js';
import { callChatAPI } from '../chatapi.js';

const RustDataSource = {
    type: 'rust-news',
    
    fetch: async (env) => {
        console.log('Fetching Rust news from multiple sources...');
        
        const rustNews = [];
        
        // 1. 从 Reddit r/rust 获取讨论
        try {
            const redditData = await fetchRedditRust(env);
            rustNews.push(...redditData);
        } catch (error) {
            console.error("Error fetching Reddit r/rust:", error.message);
        }
        
        // 2. 从 GitHub 获取 Trending Rust 项目
        try {
            const githubData = await fetchGitHubRustTrending(env);
            rustNews.push(...githubData);
        } catch (error) {
            console.error("Error fetching GitHub Rust trending:", error.message);
        }
        
        // 3. 从 Rust 官方博客获取更新
        try {
            const blogData = await fetchRustBlog(env);
            rustNews.push(...blogData);
        } catch (error) {
            console.error("Error fetching Rust blog:", error.message);
        }
        
        // 去重并限制数量
        const uniqueNews = removeDuplicates(rustNews, 'url');
        return uniqueNews.slice(0, 20);
    },
    
    transform: (rawData, sourceType) => {
        const unifiedData = [];
        const now = getISODate();
        
        if (Array.isArray(rawData)) {
            rawData.forEach((item, index) => {
                unifiedData.push({
                    id: item.id || `rust-${index}`,
                    type: sourceType,
                    url: item.url,
                    title: item.title,
                    description: item.description || "",
                    published_date: item.published_date || now,
                    authors: item.authors || [{ name: item.author || "Rust 社区" }],
                    source: item.source || "Rust 资讯",
                    details: {
                        category: item.category || "news",
                        language: "Rust",
                        tags: item.tags || ["Rust"],
                        ...item.details
                    }
                });
            });
        }
        
        return unifiedData;
    },
    
    generateHtml: (item) => {
        const categoryBadge = item.details?.category 
            ? `<span class="category-badge rust">${escapeHtml(item.details.category)}</span>` 
            : '';
        
        return `
            <div class="rust-news-item">
                ${categoryBadge}
                <h4><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a></h4>
                <p class="description">${escapeHtml(item.description) || '暂无描述'}</p>
                <div class="meta">
                    <small>
                        来源: ${escapeHtml(item.source)} | 
                        作者: ${item.authors.map(a => escapeHtml(a.name)).join(', ')} | 
                        日期: ${new Date(item.published_date).toLocaleDateString('zh-CN')}
                    </small>
                </div>
            </div>
        `;
    }
};

// 获取 Reddit r/rust 热门内容
async function fetchRedditRust(env) {
    const redditUrl = 'https://www.reddit.com/r/rust/hot.json?limit=15';
    
    try {
        const response = await fetch(redditUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Rust-Daily-Bot/1.0)'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Reddit API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return data.data.children
            .filter(post => !post.data.stickied) // 排除置顶帖
            .map((post, index) => ({
                id: `reddit-rust-${post.data.id}`,
                url: post.data.url,
                title: post.data.title,
                description: post.data.selftext.substring(0, 300) + (post.data.selftext.length > 300 ? '...' : ''),
                published_date: new Date(post.data.created_utc * 1000).toISOString(),
                author: post.data.author,
                source: 'Reddit r/rust',
                category: '社区讨论',
                tags: ['Rust', 'Reddit', '社区'],
                details: {
                    score: post.data.score,
                    num_comments: post.data.num_comments,
                    permalink: `https://reddit.com${post.data.permalink}`
                }
            }));
    } catch (error) {
        console.error("Reddit fetch error:", error);
        return [];
    }
}

// 获取 GitHub Trending Rust 项目
async function fetchGitHubRustTrending(env) {
    try {
        // 使用 GitHub Search API 获取最近更新的 Rust 项目
        const searchUrl = 'https://api.github.com/search/repositories?q=language:rust+created:>' + getDateDaysAgo(7) + '&sort=stars&order=desc&per_page=10';
        
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Rust-Daily-Bot/1.0'
        };
        
        // 如果配置了 GitHub Token，添加认证
        if (env.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${env.GITHUB_TOKEN}`;
        }
        
        const response = await fetch(searchUrl, { headers });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return data.items.map((repo, index) => ({
            id: `github-rust-${repo.id}`,
            url: repo.html_url,
            title: `${repo.name} - ${repo.description || 'Rust 项目'}`,
            description: `${repo.description || '暂无描述'} | ⭐ ${repo.stargazers_count} stars | 🍴 ${repo.forks_count} forks`,
            published_date: repo.created_at,
            author: repo.owner.login,
            source: 'GitHub Trending',
            category: '开源项目',
            tags: ['Rust', 'GitHub', '开源'],
            details: {
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                language: repo.language,
                topics: repo.topics || []
            }
        }));
    } catch (error) {
        console.error("GitHub fetch error:", error);
        return [];
    }
}

// 获取 Rust 官方博客内容
async function fetchRustBlog(env) {
    // Rust 官方博客 RSS feed
    const rssUrl = 'https://blog.rust-lang.org/feed.xml';
    
    try {
        const response = await fetch(rssUrl);
        if (!response.ok) {
            throw new Error(`RSS fetch error: ${response.status}`);
        }
        
        const xmlText = await response.text();
        
        // 简单的 RSS XML 解析
        const items = parseRSS(xmlText);
        
        return items.slice(0, 5).map((item, index) => ({
            id: `rust-blog-${index}`,
            url: item.link,
            title: item.title,
            description: item.description?.substring(0, 200) + '...' || 'Rust 官方博客更新',
            published_date: item.pubDate,
            author: item.author || 'Rust Team',
            source: 'Rust 官方博客',
            category: '官方动态',
            tags: ['Rust', '官方', '博客'],
            details: {
                category: '官方公告'
            }
        }));
    } catch (error) {
        console.error("Rust blog fetch error:", error);
        return [];
    }
}

// 简单的 RSS 解析器
function parseRSS(xmlText) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemXml = match[1];
        
        const title = extractXmlTag(itemXml, 'title') || '';
        const link = extractXmlTag(itemXml, 'link') || '';
        const description = extractXmlTag(itemXml, 'description') || '';
        const pubDate = extractXmlTag(itemXml, 'pubDate') || '';
        const author = extractXmlTag(itemXml, 'author') || extractXmlTag(itemXml, 'dc:creator') || '';
        
        items.push({ title, link, description, pubDate, author });
    }
    
    return items;
}

function extractXmlTag(xml, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() : null;
}

// 去重函数
function removeDuplicates(array, key) {
    const seen = new Set();
    return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
}

// 获取 N 天前的日期字符串
function getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
}

export default RustDataSource;
