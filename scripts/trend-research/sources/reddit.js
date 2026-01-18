/**
 * Reddit Data Source
 * Monitors relevant subreddits for trending posts about JSON/Excel conversion
 * Uses Reddit's public JSON API (no auth required)
 */

const https = require('https');

// Subreddits to monitor
const SUBREDDITS = [
    { name: 'dataanalysis', searchTerms: ['json', 'excel', 'csv', 'api', 'export'] },
    { name: 'excel', searchTerms: ['json', 'api', 'convert', 'import'] },
    { name: 'analytics', searchTerms: ['json', 'data export', 'api'] },
    { name: 'learnprogramming', searchTerms: ['json to excel', 'json csv', 'parse json'] },
    { name: 'datascience', searchTerms: ['json', 'export', 'excel'] },
    { name: 'webdev', searchTerms: ['json to csv', 'api response', 'export data'] },
    { name: 'javascript', searchTerms: ['json to excel', 'csv export'] },
    { name: 'Python', searchTerms: ['json to excel', 'pandas json'] }
];

// User agent required by Reddit API
const USER_AGENT = 'JsonExport-TrendResearch/1.0 (SEO Content Research Bot)';

/**
 * Sleep helper for rate limiting
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch JSON from URL using https
 */
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': USER_AGENT
            }
        };

        https.get(url, options, (res) => {
            let data = '';

            res.on('data', chunk => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse JSON: ${e.message}`));
                }
            });
        }).on('error', (e) => {
            reject(e);
        });
    });
}

/**
 * Fetch hot posts from a subreddit
 */
async function getSubredditHotPosts(subreddit, limit = 25, retries = 3) {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const data = await fetchJson(url);

            if (!data.data || !data.data.children) {
                return { subreddit, posts: [], error: 'No data returned' };
            }

            const posts = data.data.children.map(child => ({
                id: child.data.id,
                title: child.data.title,
                selftext: child.data.selftext?.substring(0, 500) || '',
                score: child.data.score,
                numComments: child.data.num_comments,
                url: `https://reddit.com${child.data.permalink}`,
                created: new Date(child.data.created_utc * 1000).toISOString(),
                author: child.data.author,
                flair: child.data.link_flair_text || null
            }));

            return { subreddit, posts, error: null };
        } catch (error) {
            console.warn(`[Reddit] Attempt ${attempt}/${retries} failed for r/${subreddit}: ${error.message}`);

            if (attempt < retries) {
                await sleep(2000 * attempt);
            } else {
                return { subreddit, posts: [], error: error.message };
            }
        }
    }
}

/**
 * Search a subreddit for specific terms
 */
async function searchSubreddit(subreddit, query, limit = 25, retries = 3) {
    const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=relevance&t=month&limit=${limit}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const data = await fetchJson(url);

            if (!data.data || !data.data.children) {
                return { subreddit, query, posts: [], error: 'No data returned' };
            }

            const posts = data.data.children.map(child => ({
                id: child.data.id,
                title: child.data.title,
                selftext: child.data.selftext?.substring(0, 500) || '',
                score: child.data.score,
                numComments: child.data.num_comments,
                url: `https://reddit.com${child.data.permalink}`,
                created: new Date(child.data.created_utc * 1000).toISOString(),
                author: child.data.author,
                flair: child.data.link_flair_text || null
            }));

            return { subreddit, query, posts, error: null };
        } catch (error) {
            console.warn(`[Reddit] Search attempt ${attempt}/${retries} failed for r/${subreddit} "${query}": ${error.message}`);

            if (attempt < retries) {
                await sleep(2000 * attempt);
            } else {
                return { subreddit, query, posts: [], error: error.message };
            }
        }
    }
}

/**
 * Calculate relevance score for a post
 * Higher score = more relevant to JSON/Excel conversion
 */
function calculateRelevanceScore(post) {
    const title = post.title.toLowerCase();
    const text = (post.selftext || '').toLowerCase();
    const combined = `${title} ${text}`;

    let score = 0;

    // High-value keywords (directly related to our tool)
    const highValueKeywords = ['json to excel', 'json to csv', 'convert json', 'export json', 'flatten json', 'nested json', 'api to excel'];
    for (const kw of highValueKeywords) {
        if (combined.includes(kw)) score += 30;
    }

    // Medium-value keywords
    const mediumValueKeywords = ['json', 'excel', 'csv', 'spreadsheet', 'api response', 'export data', 'parse json'];
    for (const kw of mediumValueKeywords) {
        if (combined.includes(kw)) score += 10;
    }

    // Pain point keywords (people struggling = opportunity)
    const painKeywords = ['help', 'how do i', 'struggling', 'issue', 'error', 'problem', 'doesn\'t work', 'can\'t', 'frustrated'];
    for (const kw of painKeywords) {
        if (combined.includes(kw)) score += 15;
    }

    // Engagement boost
    if (post.score > 50) score += 10;
    if (post.score > 100) score += 10;
    if (post.numComments > 10) score += 5;
    if (post.numComments > 25) score += 5;

    return score;
}

/**
 * Extract content ideas from posts
 */
function extractContentIdeas(posts) {
    const ideas = [];

    for (const post of posts) {
        // Look for question patterns in titles
        const title = post.title;
        const questionPatterns = [
            /how (?:do|can|to) (?:i|you|we) (.+?)\?/i,
            /what (?:is|are) the best (.+?)\?/i,
            /is there (?:a|any) (.+?) (?:for|to) (.+?)\?/i,
            /(.+?) not working/i,
            /help with (.+)/i
        ];

        for (const pattern of questionPatterns) {
            const match = title.match(pattern);
            if (match) {
                ideas.push({
                    source: post.url,
                    type: 'question',
                    title: post.title,
                    score: post.score,
                    comments: post.numComments,
                    relevanceScore: calculateRelevanceScore(post)
                });
                break;
            }
        }
    }

    return ideas.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Main function: Fetch all Reddit data
 */
async function fetchRedditData() {
    console.log('[Reddit] Starting data collection...');

    const results = {
        fetchedAt: new Date().toISOString(),
        subreddits: [],
        hotPosts: [],
        searchResults: [],
        contentIdeas: [],
        errors: []
    };

    // Fetch hot posts and search results from each subreddit
    for (let i = 0; i < SUBREDDITS.length; i++) {
        const { name: subreddit, searchTerms } = SUBREDDITS[i];
        console.log(`[Reddit] Processing r/${subreddit} (${i + 1}/${SUBREDDITS.length})`);

        // Rate limiting
        if (i > 0) {
            await sleep(2000);
        }

        // Get hot posts
        const hotResult = await getSubredditHotPosts(subreddit, 25);

        if (hotResult.error) {
            results.errors.push({ subreddit, type: 'hot', error: hotResult.error });
        }

        // Filter relevant hot posts
        const relevantHotPosts = hotResult.posts
            .map(post => ({ ...post, relevanceScore: calculateRelevanceScore(post) }))
            .filter(post => post.relevanceScore > 20)
            .sort((a, b) => b.relevanceScore - a.relevanceScore);

        results.hotPosts.push({
            subreddit,
            posts: relevantHotPosts.slice(0, 10)
        });

        // Search for specific terms
        for (const term of searchTerms) {
            await sleep(1500);

            const searchResult = await searchSubreddit(subreddit, term, 15);

            if (searchResult.error) {
                results.errors.push({ subreddit, type: 'search', term, error: searchResult.error });
                continue;
            }

            // Filter and score
            const relevantSearchPosts = searchResult.posts
                .map(post => ({ ...post, relevanceScore: calculateRelevanceScore(post) }))
                .filter(post => post.relevanceScore > 25)
                .sort((a, b) => b.relevanceScore - a.relevanceScore);

            if (relevantSearchPosts.length > 0) {
                results.searchResults.push({
                    subreddit,
                    searchTerm: term,
                    posts: relevantSearchPosts.slice(0, 5)
                });
            }
        }
    }

    // Extract content ideas from all collected posts
    const allPosts = [
        ...results.hotPosts.flatMap(r => r.posts),
        ...results.searchResults.flatMap(r => r.posts)
    ];

    // Deduplicate by post ID
    const uniquePosts = [...new Map(allPosts.map(p => [p.id, p])).values()];

    results.contentIdeas = extractContentIdeas(uniquePosts).slice(0, 20);

    // Summary stats
    results.summary = {
        totalSubredditsChecked: SUBREDDITS.length,
        totalHotPostsFound: results.hotPosts.reduce((acc, r) => acc + r.posts.length, 0),
        totalSearchResultsFound: results.searchResults.reduce((acc, r) => acc + r.posts.length, 0),
        totalContentIdeas: results.contentIdeas.length,
        errorsCount: results.errors.length
    };

    console.log(`[Reddit] Complete. Found ${results.summary.totalContentIdeas} content ideas from ${results.summary.totalHotPostsFound + results.summary.totalSearchResultsFound} relevant posts.`);

    return results;
}

module.exports = {
    fetchRedditData,
    getSubredditHotPosts,
    searchSubreddit,
    calculateRelevanceScore,
    SUBREDDITS
};
