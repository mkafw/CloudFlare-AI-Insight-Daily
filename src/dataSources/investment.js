// src/dataSources/investment.js
// 投资与金融市场资讯数据源 - 加密货币、股票、宏观经济

import { fetchData, getISODate, escapeHtml } from '../helpers.js';

const InvestmentDataSource = {
    type: 'investment-news',
    
    fetch: async (env) => {
        console.log('Fetching investment and market data...');
        const allNews = [];
        
        // 1. CoinDesk - 加密货币新闻
        try {
            const cryptoData = await fetchCoinDesk();
            allNews.push(...cryptoData);
        } catch (error) {
            console.error("CoinDesk fetch error:", error.message);
        }
        
        // 2. Reddit r/investing
        try {
            const redditData = await fetchRedditInvesting();
            allNews.push(...redditData);
        } catch (error) {
            console.error("Reddit investing fetch error:", error.message);
        }
        
        // 3. HackerNews 投资相关讨论
        try {
            const hnData = await fetchHNInvesting();
            allNews.push(...hnData);
        } catch (error) {
            console.error("HN investing fetch error:", error.message);
        }
        
        return removeDuplicates(allNews, 'url').slice(0, 20);
    },
    
    transform: (rawData, sourceType) => {
        const unifiedData = [];
        const now = getISODate();
        
        if (Array.isArray(rawData)) {
            rawData.forEach((item, index) => {
                unifiedData.push({
                    id: item.id || `inv-${index}`,
                    type: sourceType,
                    url: item.url,
                    title: item.title,
                    description: item.description || "",
                    published_date: item.published_date || now,
                    authors: item.authors || [{ name: item.author || "财经媒体" }],
                    source: item.source || "投资资讯",
                    details: {
                        category: item.category || "investment",
                        market: item.market || "General",
                        tags: item.tags || ["投资", "finance"],
                        sentiment: item.sentiment,
                        ...item.details
                    }
                });
            });
        }
        
        return unifiedData;
    },
    
    generateHtml: (item) => {
        const marketBadge = item.details?.market 
            ? `<span class="market-badge">${item.details.market}</span>` 
            : '';
        
        const sentimentEmoji = {
            'bullish': '📈',
            'bearish': '📉',
            'neutral': '➡️'
        }[item.details?.sentiment] || '';
        
        return `
            <div class="investment-news-item">
                <div class="badges">
                    ${marketBadge}
                    ${sentimentEmoji}
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

// CoinDesk RSS
async function fetchCoinDesk() {
    try {
        const rssUrl = 'https://www.coindesk.com/arc/outboundfeeds/rss/';
        const response = await fetch(rssUrl);
        const xmlText = await response.text();
        
        const items = parseRSS(xmlText);
        
        return items.slice(0, 10).map((item, index) => ({
            id: `coindesk-${index}`,
            url: item.link,
            title: item.title,
            description: item.description?.substring(0, 200) + '...' || '',
            published_date: item.pubDate,
            author: item.author || 'CoinDesk',
            source: 'CoinDesk',
            category: '加密货币',
            market: 'Crypto',
            tags: ['crypto', 'bitcoin', 'blockchain', 'investment']
        }));
    } catch (error) {
        console.error("CoinDesk fetch error:", error);
        return [];
    }
}

// Reddit r/investing
async function fetchRedditInvesting() {
    const subreddits = ['investing', 'stocks', 'personalfinance', 'CryptoCurrency'];
    const allPosts = [];
    
    for (const subreddit of subreddits) {
        try {
            const redditUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=5`;
            const response = await fetch(redditUrl, {
                headers: {
                    'User-Agent': 'Investment-Daily-Bot/1.0'
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
                        category: '投资讨论',
                        market: subreddit === 'CryptoCurrency' ? 'Crypto' : 'Stocks',
                        tags: ['investment', subreddit, 'discussion'],
                        score: post.data.score
                    });
                });
        } catch (error) {
            console.error(`Reddit r/${subreddit} fetch error:`, error);
        }
    }
    
    return allPosts.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);
}

// HackerNews 投资相关
async function fetchHNInvesting() {
    // 获取 HN 前100个故事，然后筛选投资相关的
    try {
        const topStoriesUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json';
        const response = await fetch(topStoriesUrl);
        const storyIds = await response.json();
        
        const topIds = storyIds.slice(0, 100);
        const investingKeywords = ['invest', 'funding', 'valuation', 'ipo', 'acquisition', 'startup funding', 'venture', 'series'];
        
        const stories = await Promise.all(
            topIds.map(async (id) => {
                try {
                    const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                    const item = await res.json();
                    
                    if (!item || item.deleted || item.dead) return null;
                    
                    // 筛选投资相关内容
                    const title = item.title?.toLowerCase() || '';
                    const isInvestingRelated = investingKeywords.some(kw => title.includes(kw.toLowerCase()));
                    
                    if (!isInvestingRelated) return null;
                    
                    return {
                        id: `hn-inv-${item.id}`,
                        url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
                        title: item.title,
                        description: item.text ? stripHtml(item.text).substring(0, 200) + '...' : '',
                        published_date: new Date(item.time * 1000).toISOString(),
                        author: item.by,
                        source: 'HackerNews',
                        category: '投资/融资',
                        market: 'Tech',
                        tags: ['investment', 'startup', 'funding', 'HN'],
                        score: item.score
                    };
                } catch (e) {
                    return null;
                }
            })
        );
        
        return stories.filter(Boolean).slice(0, 10);
    } catch (error) {
        console.error("HN investing fetch error:", error);
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

export default InvestmentDataSource;
