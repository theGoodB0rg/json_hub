/**
 * Google Trends Data Source
 * Fetches trending topics and interest data for JSON/Excel related keywords
 */

const googleTrends = require('google-trends-api');

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

/**
 * Sleep helper for rate limiting
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
                error: null
            };
        } catch (error) {
            console.warn(`[GoogleTrends] Attempt ${attempt}/${retries} failed for "${keyword}": ${error.message}`);

            if (attempt < retries) {
                // Exponential backoff
                await sleep(2000 * attempt);
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
                error: null
            };
        } catch (error) {
            console.warn(`[GoogleTrends] RelatedQueries attempt ${attempt}/${retries} failed for "${keyword}": ${error.message}`);

            if (attempt < retries) {
                await sleep(2000 * attempt);
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

            if (attempt < retries) {
                await sleep(2000 * attempt);
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

    const allKeywords = [...SEED_KEYWORDS, ...EXPANSION_KEYWORDS];
    const results = {
        fetchedAt: new Date().toISOString(),
        keywords: [],
        risingOpportunities: [],
        breakoutQueries: [],
        errors: []
    };

    for (let i = 0; i < allKeywords.length; i++) {
        const keyword = allKeywords[i];
        console.log(`[GoogleTrends] Processing ${i + 1}/${allKeywords.length}: "${keyword}"`);

        // Rate limiting: wait between requests
        if (i > 0) {
            await sleep(1500);
        }

        // Fetch interest data
        const interest = await getKeywordInterest(keyword);

        // Fetch related queries
        await sleep(1000);
        const relatedQueries = await getRelatedQueries(keyword);

        // Fetch related topics
        await sleep(1000);
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
