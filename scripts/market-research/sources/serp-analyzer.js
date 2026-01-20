/**
 * SERP Analyzer (Competition)
 * Uses DuckDuckGo HTML scraping to avoid API keys
 */

const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');

// Helper for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchDDGResults(query) {
    try {
        // DuckDuckGo HTML version is easier to scrape than JS
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };

        const res = await axios.get(url, { headers });
        const $ = cheerio.load(res.data);

        const results = [];

        $('.result').each((i, elem) => {
            if (i >= 10) return; // Top 10 only

            const title = $(elem).find('.result__title').text().trim();
            const link = $(elem).find('.result__url').attr('href');
            const snippet = $(elem).find('.result__snippet').text().trim();

            if (title && link) {
                // Extract domain
                let domain = '';
                try {
                    // unexpected url format from DDG sometimes needs cleaning
                    // often it's /l/?kh=-1&uddg=https%3A%2F%2Fexample.com...
                    const realUrlMatch = link.match(/uddg=([^&]+)/);
                    const realUrl = realUrlMatch ? decodeURIComponent(realUrlMatch[1]) : link;
                    domain = new URL(realUrl).hostname;
                } catch (e) {
                    domain = 'unknown';
                }

                results.push({
                    position: i + 1,
                    title,
                    url: link,
                    domain,
                    snippet
                });
            }
        });

        return results;

    } catch (e) {
        console.error(`[SERP] Error fetching DDG for "${query}": ${e.message}`);
        return [];
    }
}

/**
 * Determine the type of site based on domain or title
 */
function classifyResult(result) {
    const domain = result.domain.toLowerCase();
    const title = result.title.toLowerCase();

    if (domain.includes('reddit.com') || domain.includes('quora.com') || domain.includes('stackoverflow.com')) {
        return 'FORUM';
    }
    if (domain.includes('youtube.com')) {
        return 'VIDEO';
    }
    if (title.includes('tool') || title.includes('app') || title.includes('software') || title.includes('generator')) {
        return 'TOOL'; // Likely a competitor tool
    }
    return 'CONTENT'; // Blog, article, etc.
}

async function analyzeCompetition(opportunities) {
    const analyzed = [];
    console.log(`[SERP] Analyzing competition for ${opportunities.length} opportunities...`);

    for (const opp of opportunities) {
        // Rate limit
        await sleep(2000);

        console.log(`[SERP] Searching: "${opp.searchQuery}"`);
        const results = await fetchDDGResults(opp.searchQuery);

        // Analyze the SERP landscape
        const landscape = {
            totalResults: results.length,
            forumCount: 0,
            toolCount: 0,
            videoCount: 0,
            topDomain: results[0]?.domain || 'N/A'
        };

        results.forEach(r => {
            const type = classifyResult(r);
            if (type === 'FORUM') landscape.forumCount++;
            if (type === 'TOOL') landscape.toolCount++;
            if (type === 'VIDEO') landscape.videoCount++;
        });

        // Calculate "Winnability" Score (Simple Gap)
        // High score = Easy to win
        let winnability = 50; // Start middle

        // If forums are ranking on page 1, that's a HUGE opportunity (means no good dedicated content/tool)
        if (landscape.forumCount > 0) winnability += 20;
        if (landscape.forumCount > 2) winnability += 15; // Very weak SERP

        // If tools clearly exist, it's harder
        if (landscape.toolCount > 3) winnability -= 20;
        else if (landscape.toolCount === 0) winnability += 10; // Blue ocean?

        // If big brands dominate (e.g. Microsoft, Adobe)
        const bigTech = ['microsoft.com', 'adobe.com', 'google.com', 'apple.com', 'amazon.com'];
        if (bigTech.some(d => landscape.topDomain.includes(d))) winnability -= 15;

        analyzed.push({
            ...opp,
            serpAnalysis: {
                landscape,
                winnabilityScore: Math.max(0, Math.min(100, winnability)),
                topResults: results.slice(0, 3) // Save top 3 for reference
            }
        });
    }

    return analyzed;
}

module.exports = {
    analyzeCompetition
};
