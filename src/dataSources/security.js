// src/dataSources/security.js
// 漏洞安全资讯数据源 - CVE、安全公告、漏洞利用

import { fetchData, getISODate, escapeHtml } from '../helpers.js';

const SecurityDataSource = {
    type: 'security-news',
    
    fetch: async (env) => {
        console.log('Fetching security and vulnerability data...');
        const allNews = [];
        
        // 1. NVD - 美国国家漏洞数据库
        try {
            const nvdData = await fetchNVD();
            allNews.push(...nvdData);
        } catch (error) {
            console.error("NVD fetch error:", error.message);
        }
        
        // 2. GitHub Security Advisories
        try {
            const ghData = await fetchGitHubSecurity(env);
            allNews.push(...ghData);
        } catch (error) {
            console.error("GitHub Security fetch error:", error.message);
        }
        
        // 3. HackerOne Hacktivity（公开报告）
        try {
            const h1Data = await fetchHackerOne();
            allNews.push(...h1Data);
        } catch (error) {
            console.error("HackerOne fetch error:", error.message);
        }
        
        // 4. Reddit r/netsec
        try {
            const redditData = await fetchRedditNetsec();
            allNews.push(...redditData);
        } catch (error) {
            console.error("Reddit netsec fetch error:", error.message);
        }
        
        return removeDuplicates(allNews, 'url').slice(0, 20);
    },
    
    transform: (rawData, sourceType) => {
        const unifiedData = [];
        const now = getISODate();
        
        if (Array.isArray(rawData)) {
            rawData.forEach((item, index) => {
                unifiedData.push({
                    id: item.id || `sec-${index}`,
                    type: sourceType,
                    url: item.url,
                    title: item.title,
                    description: item.description || "",
                    published_date: item.published_date || now,
                    authors: item.authors || [{ name: item.author || "安全社区" }],
                    source: item.source || "安全资讯",
                    details: {
                        category: item.category || "vulnerability",
                        severity: item.severity || "Unknown",
                        cvss: item.cvss,
                        cve: item.cve,
                        tags: item.tags || ["security", "vulnerability"],
                        ...item.details
                    }
                });
            });
        }
        
        return unifiedData;
    },
    
    generateHtml: (item) => {
        const severityColors = {
            'Critical': '🔴',
            'High': '🟠',
            'Medium': '🟡',
            'Low': '🟢',
            'Unknown': '⚪'
        };
        
        const severityEmoji = severityColors[item.details?.severity] || '⚪';
        const cveBadge = item.details?.cve 
            ? `<span class="cve-badge">${item.details.cve}</span>` 
            : '';
        
        return `
            <div class="security-news-item">
                <div class="severity-header">
                    ${severityEmoji} <strong>${item.details?.severity || 'Unknown'} Severity</strong>
                    ${cveBadge}
                </div>
                <h4><a href="${escapeHtml(item.url)}" target="_blank">${escapeHtml(item.title)}</a></h4>
                <p class="description">${escapeHtml(item.description) || '暂无描述'}</p>
                <div class="meta">
                    <small>
                        来源: ${escapeHtml(item.source)} | 
                        ${item.details?.cvss ? `CVSS: ${item.details.cvss} | ` : ''}
                        日期: ${new Date(item.published_date).toLocaleDateString('zh-CN')}
                    </small>
                </div>
            </div>
        `;
    }
};

// NVD - National Vulnerability Database
async function fetchNVD() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    // NVD API 2.0
    const nvdUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0/?pubStartDate=${formatDate(thirtyDaysAgo)}T00:00:00.000&pubEndDate=${formatDate(today)}T23:59:59.999&resultsPerPage=20`;
    
    try {
        const response = await fetch(nvdUrl, {
            headers: {
                'User-Agent': 'Rust-Daily-Security-Bot/1.0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`NVD API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return (data.vulnerabilities || []).map((vuln, index) => {
            const cve = vuln.cve;
            const cveId = cve.id;
            const description = cve.descriptions?.find(d => d.lang === 'en')?.value || '';
            const metrics = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0];
            
            return {
                id: cveId,
                url: `https://nvd.nist.gov/vuln/detail/${cveId}`,
                title: `${cveId}: ${description.substring(0, 80)}...`,
                description: description,
                published_date: cve.published,
                author: 'NVD',
                source: 'National Vulnerability Database',
                category: 'CVE',
                tags: ['CVE', 'vulnerability', 'security'],
                severity: metrics?.cvssData?.baseSeverity || 'Unknown',
                cvss: metrics?.cvssData?.baseScore,
                cve: cveId
            };
        });
    } catch (error) {
        console.error("NVD fetch error:", error);
        return [];
    }
}

// GitHub Security Advisories
async function fetchGitHubSecurity(env) {
    // 获取 GitHub 公开的 security advisories
    const query = `query {
        securityAdvisories(first: 10, orderBy: {field: PUBLISHED_AT, direction: DESC}) {
            nodes {
                ghsaId
                severity
                cvss {
                    score
                }
                summary
                description
                publishedAt
                references {
                    url
                }
            }
        }
    }`;
    
    try {
        if (!env.GITHUB_TOKEN) {
            console.log("No GitHub token, skipping GitHub Security Advisories");
            return [];
        }
        
        const response = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        
        return (data.data?.securityAdvisories?.nodes || []).map(adv => ({
            id: adv.ghsaId,
            url: `https://github.com/advisories/${adv.ghsaId}`,
            title: adv.summary,
            description: adv.description?.substring(0, 300) + '...' || '',
            published_date: adv.publishedAt,
            author: 'GitHub Security',
            source: 'GitHub Security Advisory',
            category: 'Security Advisory',
            tags: ['GitHub', 'security', 'advisory'],
            severity: adv.severity,
            cvss: adv.cvss?.score
        }));
    } catch (error) {
        console.error("GitHub Security fetch error:", error);
        return [];
    }
}

// HackerOne Hacktivity（公开报告）
async function fetchHackerOne() {
    // HackerOne Hacktivity RSS
    try {
        const rssUrl = 'https://hackerone.com/hacktivity.rss';
        const response = await fetch(rssUrl);
        const xmlText = await response.text();
        
        const items = parseRSS(xmlText);
        
        return items.slice(0, 10).map((item, index) => ({
            id: `h1-${index}`,
            url: item.link,
            title: item.title,
            description: item.description?.substring(0, 200) + '...' || '',
            published_date: item.pubDate,
            author: item.author || 'HackerOne',
            source: 'HackerOne',
            category: 'Bug Bounty',
            tags: ['bug-bounty', 'hacking', 'security']
        }));
    } catch (error) {
        console.error("HackerOne fetch error:", error);
        return [];
    }
}

// Reddit r/netsec
async function fetchRedditNetsec() {
    try {
        const redditUrl = 'https://www.reddit.com/r/netsec/hot.json?limit=10';
        const response = await fetch(redditUrl, {
            headers: {
                'User-Agent': 'Security-Daily-Bot/1.0'
            }
        });
        
        const data = await response.json();
        
        return data.data.children
            .filter(post => !post.data.stickied)
            .map(post => ({
                id: `netsec-${post.data.id}`,
                url: post.data.url,
                title: post.data.title,
                description: post.data.selftext?.substring(0, 200) + '...' || '',
                published_date: new Date(post.data.created_utc * 1000).toISOString(),
                author: post.data.author,
                source: 'Reddit r/netsec',
                category: '网络安全',
                tags: ['security', 'networking', 'infosec'],
                score: post.data.score
            }));
    } catch (error) {
        console.error("Reddit netsec fetch error:", error);
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

export default SecurityDataSource;
