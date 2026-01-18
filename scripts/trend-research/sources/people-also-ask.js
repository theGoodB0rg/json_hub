/**
 * People Also Ask Scraper
 * Fetches "People Also Ask" questions from Google search results
 * Uses direct scraping since Google doesn't have a public API for this
 */

const https = require('https');

// Keywords to get PAA questions for
const PAA_KEYWORDS = [
    'json to excel',
    'convert json to csv',
    'json file excel import',
    'flatten nested json',
    'json to spreadsheet',
    'api response to excel',
    'parse json without coding',
    'json to excel online',
    'large json file excel',
    'json array to excel columns'
];

/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch HTML from URL
 */
function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'identity',
                'Cache-Control': 'no-cache'
            }
        };

        https.get(url, options, (res) => {
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                fetchHtml(res.headers.location).then(resolve).catch(reject);
                return;
            }

            let data = '';
            res.setEncoding('utf8');

            res.on('data', chunk => {
                data += chunk;
            });

            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (e) => {
            reject(e);
        });
    });
}

/**
 * Extract PAA questions from Google search HTML
 * Note: Google's HTML structure changes frequently, so this may need updates
 */
function extractPAAQuestions(html) {
    const questions = [];

    // Multiple regex patterns to catch PAA in different HTML structures
    const patterns = [
        // Pattern 1: data-q attribute
        /data-q="([^"]+)"/g,
        // Pattern 2: aria-label with question
        /aria-label="([^"]*\?[^"]*)"/g,
        // Pattern 3: Common PAA container patterns
        /<div[^>]*class="[^"]*related-question[^"]*"[^>]*>([^<]+)/gi,
        // Pattern 4: Direct question text in specific divs
        /<span[^>]*>([A-Z][^<]*\?)<\/span>/g
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
            const question = match[1].trim();
            // Filter: must be a question (ends with ?) and reasonable length
            if (question.endsWith('?') && question.length > 15 && question.length < 200) {
                // Decode HTML entities
                const decoded = question
                    .replace(/&quot;/g, '"')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&#39;/g, "'");

                if (!questions.includes(decoded)) {
                    questions.push(decoded);
                }
            }
        }
    }

    return questions;
}

/**
 * Alternative: Generate common question patterns
 * More reliable than scraping and provides useful SEO-focused questions
 */
function generateCommonQuestions(keyword) {
    const templates = [
        `How do I ${keyword}?`,
        `What is the best way to ${keyword}?`,
        `Can I ${keyword} without coding?`,
        `Is there a free tool to ${keyword}?`,
        `How to ${keyword} for free?`,
        `What is the easiest way to ${keyword}?`,
        `How to ${keyword} in Excel?`,
        `How to ${keyword} online?`,
        `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} not working - how to fix?`,
        `Why is ${keyword} so difficult?`
    ];

    return templates;
}

/**
 * Fetch PAA questions for a keyword
 */
async function getPAAForKeyword(keyword, retries = 2) {
    const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=en`;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const html = await fetchHtml(url);
            const questions = extractPAAQuestions(html);

            // If scraping didn't work well, supplement with generated questions
            if (questions.length < 3) {
                const generated = generateCommonQuestions(keyword);
                return {
                    keyword,
                    questions: [...new Set([...questions, ...generated])].slice(0, 10),
                    source: questions.length > 0 ? 'mixed' : 'generated',
                    error: null
                };
            }

            return {
                keyword,
                questions: questions.slice(0, 10),
                source: 'scraped',
                error: null
            };
        } catch (error) {
            console.warn(`[PAA] Attempt ${attempt}/${retries} failed for "${keyword}": ${error.message}`);

            if (attempt < retries) {
                await sleep(3000 * attempt);
            } else {
                // Fall back to generated questions
                const generated = generateCommonQuestions(keyword);
                return {
                    keyword,
                    questions: generated,
                    source: 'generated',
                    error: error.message
                };
            }
        }
    }
}

/**
 * Deduplicate and categorize questions
 */
function categorizeQuestions(allQuestions) {
    const categories = {
        howTo: [],      // "How do I...", "How to..."
        whatIs: [],     // "What is...", "What are..."
        comparison: [], // "Which is better...", "vs", "alternative"
        troubleshooting: [], // "not working", "error", "fix"
        tools: [],      // "tool", "software", "app"
        other: []
    };

    for (const q of allQuestions) {
        const lower = q.toLowerCase();

        if (lower.startsWith('how')) {
            categories.howTo.push(q);
        } else if (lower.startsWith('what')) {
            categories.whatIs.push(q);
        } else if (lower.includes('vs') || lower.includes('alternative') || lower.includes('better') || lower.includes('comparison')) {
            categories.comparison.push(q);
        } else if (lower.includes('error') || lower.includes('fix') || lower.includes('not working') || lower.includes('issue')) {
            categories.troubleshooting.push(q);
        } else if (lower.includes('tool') || lower.includes('software') || lower.includes('app') || lower.includes('program')) {
            categories.tools.push(q);
        } else {
            categories.other.push(q);
        }
    }

    return categories;
}

/**
 * Main function: Fetch all PAA data
 */
async function fetchPAAData() {
    console.log('[PAA] Starting People Also Ask data collection...');

    const results = {
        fetchedAt: new Date().toISOString(),
        keywords: [],
        allQuestions: [],
        categorizedQuestions: {},
        errors: []
    };

    for (let i = 0; i < PAA_KEYWORDS.length; i++) {
        const keyword = PAA_KEYWORDS[i];
        console.log(`[PAA] Processing ${i + 1}/${PAA_KEYWORDS.length}: "${keyword}"`);

        // Rate limiting (important for Google)
        if (i > 0) {
            await sleep(3000);
        }

        const paaResult = await getPAAForKeyword(keyword);

        results.keywords.push({
            keyword,
            questions: paaResult.questions,
            source: paaResult.source
        });

        // Collect all unique questions
        for (const q of paaResult.questions) {
            if (!results.allQuestions.includes(q)) {
                results.allQuestions.push(q);
            }
        }

        if (paaResult.error) {
            results.errors.push({ keyword, error: paaResult.error });
        }
    }

    // Categorize all questions
    results.categorizedQuestions = categorizeQuestions(results.allQuestions);

    // Summary
    results.summary = {
        totalKeywordsProcessed: PAA_KEYWORDS.length,
        totalUniqueQuestions: results.allQuestions.length,
        howToQuestions: results.categorizedQuestions.howTo.length,
        troubleshootingQuestions: results.categorizedQuestions.troubleshooting.length,
        comparisonQuestions: results.categorizedQuestions.comparison.length,
        errorsCount: results.errors.length
    };

    console.log(`[PAA] Complete. Found ${results.summary.totalUniqueQuestions} unique questions.`);

    return results;
}

module.exports = {
    fetchPAAData,
    getPAAForKeyword,
    generateCommonQuestions,
    categorizeQuestions,
    PAA_KEYWORDS
};
