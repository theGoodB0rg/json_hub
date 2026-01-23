/**
 * Google Trends Data Source
 * Fetches trending topics and interest data for JSON/Excel related keywords
 */

const googleTrends = require('google-trends-api');

// Fallback data generator in case of API blocks
function generateFallbackInterest(keyword) {
    // Generate pseudo-random data based on string hash to be potential deterministic
    const hash = keyword.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    const baseInterest = Math.abs(hash % 60) + 20; // 20-80
    const trending = Math.abs(hash % 10) > 7; // 30% chance of trending

    return {
        keyword,
        averageInterest: baseInterest,
        currentInterest: trending ? baseInterest + 20 : baseInterest,
        trending,
        trendingScore: trending ? Math.abs(hash % 50) + 20 : 0,
        weekOverWeekChange: trending ? 25 : 0,
        error: null,
        isFallback: true
    };
}

// Keywords to track for JsonExport's niche
const SEED_KEYWORDS = [
    'json to excel',
    'json to csv',
    'convert json to spreadsheet',
    'api response to excel',
    'flatten nested json',
    'json parser excel',
    'export json data',
    'json data analysis',
    'postman export data',
    'api data excel'
];

// Related topics to expand coverage
const EXPANSION_KEYWORDS = [
    'hubspot export excel',
    'salesforce json export',
    'mongodb export json',
    'stripe api json',
    'shopify json data',
    'firebase json export',
    'airtable export json',
    'notion database export',
    'zapier json',
    'power query json'
];

// Commercial intent modifiers to find high-value keywords
const COMMERCIAL_MODIFIERS = [
    'best',
    'vs',
    'review',
    'tool',
    'converter',
    'software',
    'platform',
    'solution',
    'automation'
];

// Random User Agents to avoid simple blocking
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0'
];

/**
 * Get a random User Agent
 */
function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Sleep helper for rate limiting with Jitter
 * Adding randomness (jitter) makes the bot look more human
 */
function sleep(ms, jitter = false) {
    let finalMs = ms;
    if (jitter) {
        // Add random jitter between 0% and 50% of the base time
        // e.g., 2000ms -> 2000ms to 3000ms
        const randomAdd = Math.floor(Math.random() * (ms * 0.5));
        finalMs = ms + randomAdd;
    }
    return new Promise(resolve => setTimeout(resolve, finalMs));
}

/**
 * Fetch interest over time for a keyword
 * Returns trending score (0-100) and whether it's rising
 */
async function getKeywordInterest(keyword, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const results = await googleTrends.interestOverTime({
                keyword: keyword,
                startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
                geo: '',  // Worldwide
                hl: 'en-US'
            });

            const data = JSON.parse(results);

            if (!data.default || !data.default.timelineData || data.default.timelineData.length === 0) {
                return {
                    keyword,
                    averageInterest: 0,
                    currentInterest: 0,
                    trending: false,
                    trendingScore: 0,
                    error: null
                };
            }

            const timelineData = data.default.timelineData;
            const values = timelineData.map(point => point.value[0]);

            // Calculate average and current interest
            const averageInterest = values.reduce((a, b) => a + b, 0) / values.length;
            const currentInterest = values[values.length - 1];
            const previousWeekInterest = values.length > 1 ? values[values.length - 2] : currentInterest;

            // Calculate if trending (current > average by 20%+)
            const trending = currentInterest > averageInterest * 1.2;
            const trendingScore = averageInterest > 0
                ? Math.round(((currentInterest - averageInterest) / averageInterest) * 100)
                : 0;

            return {
                keyword,
                averageInterest: Math.round(averageInterest),
                currentInterest,
                previousWeekInterest,
                trending,
                trendingScore,
                weekOverWeekChange: previousWeekInterest > 0
                    ? Math.round(((currentInterest - previousWeekInterest) / previousWeekInterest) * 100)
                    : 0,
            };
        } catch (error) {
            // Check for HTML response (blocking/rate limit)
            const isBlocked = error.message.includes('<') || error.message.includes('SyntaxError');

            if (isBlocked) {
                console.warn(`[GoogleTrends] Rate limit detected for "${keyword}". Waiting 60s before retry...`);
                await sleep(60000); // 1 minute wait to clear block

                if (attempt === retries) {
                    return {
                        keyword,
                        averageInterest: 0,
                        currentInterest: 0,
                        trending: false,
                        trendingScore: 0,
                        error: "Rate Limited (Real Data Unavailable)"
                    };
                }
                continue; // Retry loop
            }

            console.warn(`[GoogleTrends] Attempt ${attempt}/${retries} failed for "${keyword}": ${error.message}`);

            if (attempt < retries) {
                // Exponential backoff with jitter
                // 2000, 4000, 6000 + randomness
                await sleep(2000 * attempt, true);
            } else {
                return {
                    keyword,
                    averageInterest: 0,
                    currentInterest: 0,
                    trending: false,
                    trendingScore: 0,
                    error: error.message
                };
            }
        }
    }
}

/**
 * Fetch related queries for a keyword
 * These are potential content ideas
 */
async function getRelatedQueries(keyword, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const results = await googleTrends.relatedQueries({
                keyword: keyword,
                geo: '',
                hl: 'en-US'
            });

            const data = JSON.parse(results);

            if (!data.default || !data.default.rankedList) {
                return {
                    keyword,
                    topQueries: [],
                    risingQueries: [],
                    error: null
                };
            }

            const rankedList = data.default.rankedList;

            const topQueries = rankedList[0]?.rankedKeyword?.map(item => ({
                query: item.query,
                value: item.value
            })) || [];

            const risingQueries = rankedList[1]?.rankedKeyword?.map(item => ({
                query: item.query,
                value: item.formattedValue, // "Breakout" or percentage
                isBreakout: item.formattedValue === 'Breakout'
            })) || [];

            return {
                keyword,
                topQueries: topQueries.slice(0, 10),
                risingQueries: risingQueries.slice(0, 10),
            };
        } catch (error) {
            // Check for HTML response (blocking/rate limit)
            if (error.message.includes('<') || error.message.includes('SyntaxError')) {
                console.warn(`[GoogleTrends] Rate limit on RelatedQueries. Skipping "${keyword}" to protect IP.`);
                return {
                    keyword,
                    topQueries: [],
                    risingQueries: [],
                    error: 'Rate Limited'
                };
            }

            console.warn(`[GoogleTrends] RelatedQueries attempt ${attempt}/${retries} failed for "${keyword}": ${error.message}`);

            if (attempt < retries) {
                // Exponential backoff with jitter
                await sleep(5000 * attempt, true);
            } else {
                return {
                    keyword,
                    topQueries: [],
                    risingQueries: [],
                    error: error.message
                };
            }
        }
    }
}

/**
 * Fetch related topics (broader category suggestions)
 */
async function getRelatedTopics(keyword, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const results = await googleTrends.relatedTopics({
                keyword: keyword,
                geo: '',
                hl: 'en-US'
            });

            const data = JSON.parse(results);

            if (!data.default || !data.default.rankedList) {
                return {
                    keyword,
                    topTopics: [],
                    risingTopics: [],
                    error: null
                };
            }

            const rankedList = data.default.rankedList;

            const topTopics = rankedList[0]?.rankedKeyword?.map(item => ({
                title: item.topic?.title || item.query,
                type: item.topic?.type || 'Query',
                value: item.value
            })) || [];

            const risingTopics = rankedList[1]?.rankedKeyword?.map(item => ({
                title: item.topic?.title || item.query,
                type: item.topic?.type || 'Query',
                value: item.formattedValue,
                isBreakout: item.formattedValue === 'Breakout'
            })) || [];

            return {
                keyword,
                topTopics: topTopics.slice(0, 10),
                risingTopics: risingTopics.slice(0, 10),
                error: null
            };
        } catch (error) {
            console.warn(`[GoogleTrends] RelatedTopics attempt ${attempt}/${retries} failed for "${keyword}": ${error.message}`);

            console.warn(`[GoogleTrends] RelatedTopics attempt ${attempt}/${retries} failed for "${keyword}": ${error.message}`);

            if (attempt < retries) {
                await sleep(2000 * attempt, true);
            } else {
                return {
                    keyword,
                    topTopics: [],
                    risingTopics: [],
                    error: error.message
                };
            }
        }
    }
}

/**
 * Main function: Fetch all Google Trends data
 */
async function fetchGoogleTrendsData() {
    console.log('[GoogleTrends] Starting data collection...');

    // Generate combined keywords for high intent
    const combinedKeywords = [];

    // 1. Add original seed keywords
    combinedKeywords.push(...SEED_KEYWORDS);

    // 2. Add expansion keywords
    combinedKeywords.push(...EXPANSION_KEYWORDS);

    // 3. Create high-intent combinations (limit to avoid API rate limits)
    // We'll pick top 5 seed keywords and combine with commercial modifiers
    const topSeeds = SEED_KEYWORDS.slice(0, 5);
    for (const seed of topSeeds) {
        for (const modifier of COMMERCIAL_MODIFIERS) {
            // "json to excel tool", "best json to excel"
            combinedKeywords.push(`${seed} ${modifier}`);
            combinedKeywords.push(`${modifier} ${seed}`);
        }
    }

    // Deduplicate
    const uniqueKeywords = [...new Set(combinedKeywords)];

    console.log(`[GoogleTrends] Generated ${uniqueKeywords.length} keywords to analyze (including high-intent combinations)`);

    const results = {
        fetchedAt: new Date().toISOString(),
        keywords: [],
        risingOpportunities: [],
        breakoutQueries: [],
        errors: []
    };

    // Limit total keywords to prevent massive execution time/rate limits
    // Taking random sample of combinations + all seeds
    const maxKeywords = 15; // REDUCED from 30 to help with rate limits
    const finalKeywords = uniqueKeywords.slice(0, maxKeywords);

    for (let i = 0; i < finalKeywords.length; i++) {
        const keyword = finalKeywords[i];
        console.log(`[GoogleTrends] Processing ${i + 1}/${finalKeywords.length}: "${keyword}"`);
        if (true) console.log(`[GoogleTrends] User-Agent: ${getRandomUserAgent()}`);

        // Rate limiting: wait between requests
        // Add significant jitter (1.5s to 3s)
        if (i > 0) {
            await sleep(1500, true);
        }

        // Fetch interest data
        const interest = await getKeywordInterest(keyword);

        // Fetch related queries
        // Random delay between steps (1s to 1.5s)
        await sleep(1000, true);
        const relatedQueries = await getRelatedQueries(keyword);

        // Fetch related topics
        // Random delay between steps
        await sleep(1000, true);
        const relatedTopics = await getRelatedTopics(keyword);

        const keywordData = {
            keyword,
            interest: {
                average: interest.averageInterest,
                current: interest.currentInterest,
                trending: interest.trending,
                trendingScore: interest.trendingScore,
                weekOverWeekChange: interest.weekOverWeekChange
            },
            relatedQueries: relatedQueries.topQueries,
            risingQueries: relatedQueries.risingQueries,
            relatedTopics: relatedTopics.topTopics,
            risingTopics: relatedTopics.risingTopics
        };

        results.keywords.push(keywordData);

        // Track errors
        if (interest.error) results.errors.push({ keyword, type: 'interest', error: interest.error });
        if (relatedQueries.error) results.errors.push({ keyword, type: 'relatedQueries', error: relatedQueries.error });
        if (relatedTopics.error) results.errors.push({ keyword, type: 'relatedTopics', error: relatedTopics.error });

        // Collect rising opportunities
        if (interest.trending && interest.trendingScore > 30) {
            results.risingOpportunities.push({
                keyword,
                trendingScore: interest.trendingScore,
                currentInterest: interest.currentInterest
            });
        }

        // Collect breakout queries
        const breakouts = relatedQueries.risingQueries.filter(q => q.isBreakout);
        for (const breakout of breakouts) {
            results.breakoutQueries.push({
                sourceKeyword: keyword,
                query: breakout.query
            });
        }
    }

    // Sort rising opportunities by score
    results.risingOpportunities.sort((a, b) => b.trendingScore - a.trendingScore);

    console.log(`[GoogleTrends] Complete. Found ${results.risingOpportunities.length} rising opportunities, ${results.breakoutQueries.length} breakout queries.`);

    return results;
}

module.exports = {
    fetchGoogleTrendsData,
    getKeywordInterest,
    getRelatedQueries,
    getRelatedTopics,
    SEED_KEYWORDS,
    EXPANSION_KEYWORDS
};
