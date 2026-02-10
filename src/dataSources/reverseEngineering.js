// src/dataSources/reverseEngineering.js
// 逆向工程与二进制安全数据源 - RE、恶意软件分析、漏洞挖掘

import { fetchData, getISODate, escapeHtml } from '../helpers.js';

const ReverseEngineeringDataSource = {
    type: 'reverse-engineering',
    
    fetch: async (env) => {
        console.log('Fetching reverse engineering news...');
        const allNews = [];
        
        // 1. Reddit r/ReverseEngineering
        try {
            const redditData = await fetchRedditRE();
            allNews.push(...redditData);
        } catch (error) {
            console.error("Reddit RE fetch error:", error.message);
        }
        
        // 2. Reddit r/Malware
        try {
            const malwareData = await fetchRedditMalware();
            allNews.push(...malwareData);
        } catch (error) {
            console.error("Reddit malware fetch error:", error.message);
        }
        
        // 3. GitHub 逆向工程工具
        try {
            const ghData = await fetchGitHubRETools(env);
            allNews.push(...ghData);
        } catch (error) {
            console.error("GitHub RE fetch error:", error.message);
        }
        
        // 4. Phrack 杂志（经典黑客杂志）
        try {
            const phrackData = await fetchPhrack();
            allNews.push(...phrackData);
        } catch (error) {
            console.error("Phrack fetch error:", error.message);
        }
        
        // 5. 0day.today 或其他漏洞平台（RSS）
        try {
            const exploitData = await fetchExploitDB();
            allNews.push(...exploitData);
        } catch (error) {
            console.error("ExploitDB fetch error:", error.message);
        }
        
        return removeDuplicates(allNews, 'url').slice(0, 20);
    },
    
    transform: (rawData, sourceType) => {
        const unifiedData = [];
        const now = getISODate();
        
        if (Array.isArray(rawData)) {
            rawData.forEach((item, index) => {
                unifiedData.push({
                    id: item.id || `re-${index}`,
                    type: sourceType,
                    url: item.url,
                    title: item.title,
                    description: item.description || "",
                    published_date: item.published_date || now,
                    authors: item.authors || [{ name: item.author || "RE社区" }],
                    source: item.source || "逆向工程",
                    details: {
                        category: item.category || "reverse-engineering",
                        difficulty: item.difficulty || "Intermediate",
                        platform: item.platform || "General",
                        tags: item.tags || ["reverse-engineering", "binary"],
                        ...item.details
                    }
                });
            });
        }
        
        return unifiedData;
    },
    
    generateHtml: (item) => {
        const platformBadge = item.details?.platform 
            ? `<span class="platform-badge">${item.details.platform}</span>` 
            : '';
        
        const difficultyBadge = item.details?.difficulty
            ? `<span class="difficulty-badge">${item.details.difficulty}</span>`
            : '';
        
        return `
            <div class="re-news-item">
                <div class="badges">
                    ${platformBadge}
                    ${difficultyBadge}
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

// Reddit r/ReverseEngineering
async function fetchRedditRE() {
    try {
        const redditUrl = 'https://www.reddit.com/r/ReverseEngineering/hot.json?limit=10';
        const response = await fetch(redditUrl, {
            headers: {
                'User-Agent': 'RE-Daily-Bot/1.0'
            }
        });
        
        if (!response.ok) throw new Error(`Reddit error: ${response.status}`);
        
        const data = await response.json();
        
        return data.data.children
            .filter(post => !post.data.stickied)
            .map(post => ({
                id: `re-${post.data.id}`,
                url: post.data.url,
                title: post.data.title,
                description: post.data.selftext?.substring(0, 200) + '...' || '',
                published_date: new Date(post.data.created_utc * 1000).toISOString(),
                author: post.data.author,
                source: 'Reddit r/ReverseEngineering',
                category: '逆向工程',
                platform: detectPlatform(post.data.title),
                tags: ['reverse-engineering', 'binary', 'analysis'],
                score: post.data.score
            }));
    } catch (error) {
        console.error("Reddit RE fetch error:", error);
        return [];
    }
}

// Reddit r/Malware
async function fetchRedditMalware() {
    try {
        const redditUrl = 'https://www.reddit.com/r/Malware/hot.json?limit=8';
        const response = await fetch(redditUrl, {
            headers: {
                'User-Agent': 'RE-Daily-Bot/1.0'
            }
        });
        
        if (!response.ok) throw new Error(`Reddit error: ${response.status}`);
        
        const data = await response.json();
        
        return data.data.children
            .filter(post => !post.data.stickied)
            .map(post => ({
                id: `malware-${post.data.id}`,
                url: post.data.url,
                title: `[恶意软件] ${post.data.title}`,
                description: post.data.selftext?.substring(0, 200) + '...' || '',
                published_date: new Date(post.data.created_utc * 1000).toISOString(),
                author: post.data.author,
                source: 'Reddit r/Malware',
                category: '恶意软件分析',
                platform: 'Malware',
                tags: ['malware', 'reverse-engineering', 'analysis'],
                score: post.data.score
            }));
    } catch (error) {
        console.error("Reddit malware fetch error:", error);
        return [];
    }
}

// GitHub 逆向工程工具
async function fetchGitHubRETools(env) {
    const keywords = ['reverse-engineering', 'decompiler', 'disassembler', 'debugger', 'ida', 'ghidra', 'radare2'];
    const allRepos = [];
    
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'RE-Daily-Bot/1.0'
    };
    
    if (env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${env.GITHUB_TOKEN}`;
    }
    
    for (const keyword of keywords.slice(0, 3)) { // 限制关键词数量
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const dateStr = thirtyDaysAgo.toISOString().split('T')[0];
            
            const searchUrl = `https://api.github.com/search/repositories?q=${keyword}+created:>${dateStr}&sort=stars&order=desc&per_page=3`;
            
            const response = await fetch(searchUrl, { headers });
            
            if (!response.ok) continue;
            
            const data = await response.json();
            
            data.items?.forEach(repo => {
                allRepos.push({
                    id: `gh-re-${repo.id}`,
                    url: repo.html_url,
                    title: `${repo.name} - ${repo.description || '逆向工程工具'}`,
                    description: `${repo.description || '暂无描述'} | ⭐ ${repo.stargazers_count}`,
                    published_date: repo.created_at,
                    author: repo.owner.login,
                    source: 'GitHub',
                    category: 'RE工具',
                    platform: keyword.charAt(0).toUpperCase() + keyword.slice(1),
                    tags: ['reverse-engineering', 'tools', keyword],
                    stars: repo.stargazers_count
                });
            });
        } catch (error) {
            console.error(`GitHub search error for ${keyword}:`, error);
        }
    }
    
    return allRepos
        .sort((a, b) => (b.stars || 0) - (a.stars || 0))
        .slice(0, 10);
}

// Phrack 杂志（经典黑客技术杂志）
async function fetchPhrack() {
    try {
        // Phrack 网站 scrape 或 RSS
        const phrackUrl = 'http://www.phrack.org/';
        // 注意：Phrack 更新很慢，这里返回空或模拟数据
        // 实际使用时可能需要解析 HTML
        return [];
    } catch (error) {
        console.error("Phrack fetch error:", error);
        return [];
    }
}

// Exploit-DB（通过 RSS 或 API）
async function fetchExploitDB() {
    try {
        // Exploit-DB RSS
        const rssUrl = 'https://www.exploit-db.com/rss.xml';
        const response = await fetch(rssUrl);
        const xmlText = await response.text();
        
        const items = parseRSS(xmlText);
        
        return items.slice(0, 8).map((item, index) => ({
            id: `exploitdb-${index}`,
            url: item.link,
            title: `[EXPLOIT] ${item.title}`,
            description: item.description?.substring(0, 200) + '...' || '',
            published_date: item.pubDate,
            author: item.author || 'Exploit-DB',
            source: 'Exploit-DB',
            category: '漏洞利用',
            platform: 'Multiple',
            tags: ['exploit', 'vulnerability', 'poc'],
            difficulty: 'Advanced'
        }));
    } catch (error) {
        console.error("ExploitDB fetch error:", error);
        return [];
    }
}

// 检测平台（从标题推断）
function detectPlatform(title) {
    const platforms = {
        'windows': 'Windows',
        'linux': 'Linux',
        'android': 'Android',
        'ios': 'iOS',
        'macos': 'macOS',
        'x64': 'x64',
        'x86': 'x86',
        'arm': 'ARM',
        'mips': 'MIPS',
        'firmware': 'Firmware',
        'kernel': 'Kernel'
    };
    
    const lowerTitle = title.toLowerCase();
    for (const [key, value] of Object.entries(platforms)) {
        if (lowerTitle.includes(key)) return value;
    }
    return 'General';
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

export default ReverseEngineeringDataSource;
