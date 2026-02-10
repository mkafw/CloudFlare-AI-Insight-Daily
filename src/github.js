// src/github.js

/**
 * Generic wrapper for calling the GitHub API.
 */
export async function callGitHubApi(env, path, method = 'GET', body = null) {
    const GITHUB_TOKEN = env.GITHUB_TOKEN;
    const GITHUB_REPO_OWNER = env.GITHUB_REPO_OWNER;
    const GITHUB_REPO_NAME = env.GITHUB_REPO_NAME;

    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
        console.warn("⚠️ GitHub 配置缺失: GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME");
        console.warn("⚠️ GitHub 功能（如自动发布到 Pages）将不可用");
        console.warn("⚠️ 如需启用，请在 wrangler.toml 中配置这些变量");
        return { 
            error: "GitHub not configured", 
            message: "GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME are not set in environment variables." 
        };
    }

    const url = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}${path}`;
    const headers = {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Cloudflare-Worker-ContentBot/1.0'
    };

    if (method !== 'GET' && method !== 'DELETE' && body) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        method: method,
        headers: headers,
        body: body ? JSON.stringify(body) : null
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorJsonMessage = errorText;
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson && errorJson.message) {
                errorJsonMessage = errorJson.message;
                 if (errorJson.errors) {
                     errorJsonMessage += ` Details: ${JSON.stringify(errorJson.errors)}`;
                 }
            }
        } catch (e) { /* Ignore */ }
        console.error(`GitHub API Error: ${response.status} ${response.statusText} for ${method} ${url}. Message: ${errorJsonMessage}`);
        throw new Error(`GitHub API request to ${path} failed: ${response.status} - ${errorJsonMessage}`);
    }

    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return null;
    }
    return response.json();
}

/**
 * Gets the SHA of a file from GitHub.
 */
export async function getGitHubFileSha(env, filePath) {
    const GITHUB_BRANCH = env.GITHUB_BRANCH || 'main';
    try {
        const data = await callGitHubApi(env, `/contents/${filePath}?ref=${GITHUB_BRANCH}`);
        return data && data.sha ? data.sha : null;
    } catch (error) {
        if (error.message.includes("404") || error.message.toLowerCase().includes("not found")) {
            console.log(`File not found on GitHub: ${filePath} (branch: ${GITHUB_BRANCH})`);
            return null;
        }
        console.error(`Error getting SHA for ${filePath}:`, error);
        throw error;
    }
}

/**
 * Creates a new file or updates an existing one on GitHub.
 */
export async function createOrUpdateGitHubFile(env, filePath, content, commitMessage, existingSha = null) {
    const GITHUB_BRANCH = env.GITHUB_BRANCH || 'main';
    const base64Content = b64EncodeUnicode(content);

    const payload = {
        message: commitMessage,
        content: base64Content,
        branch: GITHUB_BRANCH
    };

    if (existingSha) {
        payload.sha = existingSha;
    }
    return callGitHubApi(env, `/contents/${filePath}`, 'PUT', payload);
}

/**
 * Gets the content of a file from GitHub.
 */
export async function getDailyReportContent(env, filePath) {
    const GITHUB_BRANCH = env.GITHUB_BRANCH || 'main';
    const GITHUB_REPO_OWNER = env.GITHUB_REPO_OWNER;
    const GITHUB_REPO_NAME = env.GITHUB_REPO_NAME;

    if (!GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
        console.warn("⚠️ GitHub 配置缺失: GITHUB_REPO_OWNER, GITHUB_REPO_NAME");
        return null;
    }

    try {
        const data = await callGitHubApi(env, `/contents/${filePath}?ref=${GITHUB_BRANCH}`);
        if (data && data.error) {
            console.warn("⚠️ 无法获取日报内容:", data.message);
            return null;
        }
        return b64DecodeUnicode(data.content);
    } catch (error) {
        console.error(`Error fetching daily report content:`, error);
        return null;
    }
}

// Base64 encode (UTF-8 safe)
function b64EncodeUnicode(str) {
    // Replacing '+' with '-' and '/' with '_' makes it URL-safe, but GitHub API expects standard Base64
    // Using btoa directly after encodeURIComponent is standard
    try {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            function toSolidBytes(match, p1) {
                return String.fromCharCode('0x' + p1);
        }));
    } catch (e) {
        console.error("Base64 Encoding Error:", e);
        showStatus("Error: Could not encode content for GitHub.", true);
        return null; // Return null on error
    }
}

// Base64 decode (UTF-8 safe)
function b64DecodeUnicode(str) {
    try {
        // Standard Base64 decoding
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    } catch(e) {
        console.error("Base64 Decoding Error:", e);
        showStatus("Error: Could not decode file content from GitHub.", true);
        return null; // Return null on error
    }
}