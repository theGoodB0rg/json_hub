/**
 * Reddit Explorer - Pain Point Discovery
 */

const https = require('https');
const config = require('../config');

// Helper for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simple HTTPS fetch for Reddit JSON
function fetchRedditJson(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'MarketResearchBot/1.0 (Research)'
            }
        };

        https.get(url, options, (res) => {
            let data = '';

            if (res.statusCode !== 200) {
                res.resume(); // Consume response data to free up memory
                if (res.statusCode === 429) {
                    return reject(new Error('Rate limited'));
                }
                return reject(new Error(`Status Code: ${res.statusCode}`));
            }

            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Failed to parse JSON'));
                }
            });
        }).on('error', (e) => reject(e));
    });
}

/**
 * Clean text for analysis
 */
function cleanText(text) {
    return text.replace(/[^\w\s]/gi, '').toLowerCase();
}

/**
 * Extract potential product keywords from a title
 * Very basic extraction: removes common stop words to find the "noun" of the problem
 */
function extractKeywords(title) {
    const stopWords = ['how', 'do', 'i', 'to', 'the', 'a', 'an', 'is', 'are', 'was', 'in', 'on', 'at', 'for', 'with', 'help', 'need', 'please', 'any', 'anyone', 'know', 'way', 'best', 'tool', 'app', 'software', 'good', 'recommend', 'suggestion'];

    return title.toLowerCase()
        .split(' ')
        .map(w => w.replace(/[^\w]/g, '')) // Remove punctuation
        .filter(w => w.length > 2 && !stopWords.includes(w))
        .slice(0, 5); // Take top 5 meaningful words as the "topic cluster"
}

/**
 * Score a post based on configuration criteria
 */
function scorePost(post) {
    let score = 0;

    // Engagement score
    const engagement = post.data.score + (post.data.num_comments * 2);
    if (engagement > 100) score += 30;
    else if (engagement > 50) score += 20;
    else if (engagement > 10) score += 10;

    // Recency boost (last 30 days)
    const daysOld = (Date.now() - (post.data.created_utc * 1000)) / (1000 * 60 * 60 * 24);
    if (daysOld < 30) score += 20;

    // Pain text match
    const title = post.data.title.toLowerCase();
    const painTerms = config.painPointTerms;
    const hasPainTerm = painTerms.some(term => title.includes(term.toLowerCase()));

    if (hasPainTerm) score += 50;

    return score;
}

/**
 * Main discovery function
 */
async function discoverPainPoints() {
    console.log('[Reddit] Starting discovery across', config.subreddits.length, 'subreddits...');

    const allPainPoints = [];
    const seenIds = new Set();

    for (const subreddit of config.subreddits) {
        console.log(`[Reddit] Scanning r/${subreddit}...`);

        try {
            // 1. Fetch Hot posts (for currently popular problems)
            const hotUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;
            const hotData = await fetchRedditJson(hotUrl);

            // 2. Fetch "New" posts + search for "help" (for immediate unfiltered problems)
            // Note: We'll stick to 'hot' + specific searches to be efficient with rate limits

            // 3. Search for pain terms directly
            // We search for just "help" or "how" as a proxy for questions
            const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=title%3A(help+OR+how)&restrict_sr=1&sort=relevance&t=month&limit=25`;

            // Rate limit wait
            await sleep(2000);

            let searchData;
            try {
                searchData = await fetchRedditJson(searchUrl);
            } catch (e) {
                console.log(`[Reddit] Search failed for r/${subreddit}: ${e.message}`);
                searchData = { data: { children: [] } }; // Fallback to empty
            }

            const posts = [
                ...(hotData.data?.children || []),
                ...(searchData.data?.children || [])
            ];

            let subredditPoints = 0;

            for (const post of posts) {
                if (seenIds.has(post.data.id)) continue;
                seenIds.add(post.data.id);

                // Filter by basic engagement threshold
                if (post.data.score < 5 && post.data.num_comments < 2) continue;

                // Calculate relevance score
                const score = scorePost(post);

                // Only keep high scoring pain points
                if (score >= 60) {
                    allPainPoints.push({
                        source: 'reddit',
                        id: post.data.id,
                        title: post.data.title,
                        subreddit: subreddit,
                        url: `https://reddit.com${post.data.permalink}`,
                        score: post.data.score,
                        comments: post.data.num_comments,
                        created: new Date(post.data.created_utc * 1000).toISOString(),
                        keywords: extractKeywords(post.data.title),
                        painScore: score
                    });
                    subredditPoints++;
                }
            }
            console.log(`[Reddit] Found ${subredditPoints} high-quality pain points in r/${subreddit}`);

            // Respect rate limits between subreddits
            await sleep(2000);

        } catch (error) {
            console.error(`[Reddit] Error scanning r/${subreddit}: ${error.message}`);
        }
    }

    // Sort by pain score
    return allPainPoints.sort((a, b) => b.painScore - a.painScore);
}

module.exports = {
    discoverPainPoints
};
