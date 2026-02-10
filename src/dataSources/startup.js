// src/dataSources/startup.js
// 创业与 HackerNews 资讯数据源

import { fetchData, getISODate, escapeHtml } from '../helpers.js';

const StartupDataSource = {
    type: 'startup-news',
    
    fetch: async (env) => {
        console.log('Fetching startup and HN data...');
        const allNews = [];
        
        // 1. HackerNews 热门（创业相关）
        try {
            const hnData = await fetchHackerNews();
            allNews.push(...hnData);
        } catch (error) {
            console.error("HN fetch error:", error.message);
        }
        
        // 2. Product Hunt 热门
        try {
            const phData = await fetchProductHunt();
            allNews.push(...phData);
        } catch (error) {
            console.error("PH fetch error:", error.message);
        }
        
        // 3. Indie Hackers
        try {
            const ihData = await fetchIndieHackers();
            allNews.push(...ihData);
        } catch (error) {
            console.error("IH fetch error:", error.message);
        }
        
        return removeDuplicates(allNews, 'url').slice(0, 20);
    },
    
    transform: (rawData, sourceType) => {
        const unifiedData = [];
        const now = getISODate();
        
        if (Array.isArray(rawData)) {
            rawData.forEach((item, index) => {
                unifiedData.push({
                    id: item.id || `startup-${index}`,
                    type: sourceType,
                    url: item.url,
                    title: item.title,
                    description: item.description || "",
                    published_date: item.published_date || now,
                    authors: item.authors || [{ name: item.author || "创业社区" }],
                    source: item.source || "创业资讯",
                    details: {
                        category: item.category || "startup",
                        tags: item.tags || ["创业", "startup"],
                        score: item.score,
                        comments: item.comments,
                        ...item.details
                    }
                });
            });
        }
        
        return unifiedData;
    },
    
    generateHtml: (item) => {
        const scoreBadge = item.details?.score 
            ? `<span class="score-badge">🔥 ${item.details.score} 热度</span>` 
            : '';
        
        return `
            <div class="startup-news-item">
                ${scoreBadge}
                <h4><a href="${escapeHtml(item.url)}" target="_blank">${escapeHtml(item.title)}</a></h4>
                <p class="description">${escapeHtml(item.description) || '暂无描述'}</p>
                <div class="meta">
                    <small>
                        来源: ${escapeHtml(item.source)} | 
                        ${item.details?.comments ? `💬 ${item.details.comments} 评论 | ` : ''}
                        日期: ${new Date(item.published_date).toLocaleDateString('zh-CN')}
                    </small>
                </div>
            </div>
        `;
    }
};

// HackerNews API
async function fetchHackerNews() {
    // 获取 top stories
    const topStoriesUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json';
    const itemUrl = (id) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
    
    const response = await fetch(topStoriesUrl);
    const storyIds = await response.json();
    
    // 取前15个
    const topIds = storyIds.slice(0, 15);
    
    const stories = await Promise.all(
        topIds.map(async (id) => {
            try {
                const res = await fetch(itemUrl(id));
                const item = await res.json();
                
                if (!item || item.deleted || item.dead) return null;
                
                return {
                    id: `hn-${item.id}`,
                    url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
                    title: item.title,
                    description: item.text ? stripHtml(item.text).substring(0, 200) + '...' : '',
                    published_date: new Date(item.time * 1000).toISOString(),
                    author: item.by,
                    source: 'HackerNews',
                    category: '技术创业',
                    tags: ['HackerNews', 'startup', 'tech'],
                    score: item.score,
                    comments: item.descendants || 0
                };
            } catch (e) {
                return null;
            }
        })
    );
    
    return stories.filter(Boolean);
}

// Product Hunt（通过 RSS 或第三方 API）
async function fetchProductHunt() {
    // Product Hunt 需要认证，这里提供 RSS 方案
    // 实际使用时需要配置 PH API Token
    return []; 
}

// Indie Hackers
async function fetchIndieHackers() {
    // Indie Hackers RSS
    try {
        const rssUrl = 'https://www.indiehackers.com/feed';
        const response = await fetch(rssUrl);
        const xmlText = await response.text();
        
        const items = parseRSS(xmlText);
        
        return items.slice(0, 5).map((item, index) => ({
            id: `ih-${index}`,
            url: item.link,
            title: item.title,
            description: item.description?.substring(0, 200) + '...' || '',
            published_date: item.pubDate,
            author: item.author || 'Indie Hacker',
            source: 'Indie Hackers',
            category: '独立开发者',
            tags: ['indie', 'startup', 'bootstrapping']
        }));
    } catch (error) {
        console.error("IH fetch error:", error);
        return [];
    }
}

// 工具函数
function stripHtml(html) {
    return html.replace(/<[^>]*>?/gm, '');
}

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

export default StartupDataSource;
