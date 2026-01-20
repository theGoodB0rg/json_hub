/**
 * Google Trends Validator
 */

const googleTrends = require('google-trends-api');
const config = require('../config');

// Helper for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getInterestForKeyword(keyword) {
    try {
        const results = await googleTrends.interestOverTime({
            keyword: keyword,
            startTime: new Date(Date.now() - (config.searchSettings.timeRangeDays * 24 * 60 * 60 * 1000)),
            geo: '' // Worldwide
        });

        const data = JSON.parse(results);
        if (!data.default?.timelineData?.length) return null;

        const timeline = data.default.timelineData;
        const values = timeline.map(t => t.value[0]);

        // Stats
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const current = values[values.length - 1];

        // Simple linear regression slope for trend
        // (y2 - y1) / (x2 - x1) roughly
        const start = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        const end = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const trendGrowth = ((end - start) / (start || 1)) * 100; // Percentage growth

        return {
            avgInterest: Math.round(avg),
            currentInterest: current,
            trendGrowth: Math.round(trendGrowth),
            isTrending: trendGrowth > 20 && current > 50
        };

    } catch (e) {
        // console.error(`[Trends] Error for "${keyword}": ${e.message}`);
        return null; // Keyword might not have enough data
    }
}

async function validateKeywords(painPoints) {
    const validated = [];
    console.log(`[GoogleTrends] Validating ${painPoints.length} pain points...`);

    // Group similar keywords to avoid spamming Trends
    // (For MVP we'll just take the top 3 keywords from each pain point title to form a query)

    let processedCount = 0;

    for (const point of painPoints) {
        // Construct a search query from the top 3 keywords
        // e.g. "invoice freelance track"
        const searchQuery = point.keywords.slice(0, 3).join(' ');

        if (searchQuery.length < 5) continue; // Skip too short

        // Rate limiting
        await sleep(1500);

        console.log(`[GoogleTrends] Checking interest for: "${searchQuery}"`);
        const trendData = await getInterestForKeyword(searchQuery);

        if (trendData) {
            validated.push({
                ...point,
                searchQuery,
                trendData
            });
        } else {
            // Keep it but mark as low search volume (niche opportunity)
            validated.push({
                ...point,
                searchQuery,
                trendData: {
                    avgInterest: 0,
                    currentInterest: 0,
                    trendGrowth: 0,
                    isTrending: false,
                    note: 'Low/No Data'
                }
            });
        }

        processedCount++;
        if (processedCount >= 20) {
            console.log('[GoogleTrends] Hit safe limit of 20 validations for this run to avoid heavy rate limits.');
            break;
        }
    }

    return validated;
}

module.exports = {
    validateKeywords
};
