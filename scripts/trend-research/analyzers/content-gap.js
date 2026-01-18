/**
 * Content Gap Analyzer
 * Compares research findings with existing blog content to identify gaps
 */

const fs = require('fs');
const path = require('path');

// Path to blog content (relative to project root)
const BLOG_CONTENT_PATH = 'content/blog';

/**
 * Read all existing blog posts and extract their topics/keywords
 */
function getExistingBlogTopics(projectRoot) {
    const blogPath = path.join(projectRoot, BLOG_CONTENT_PATH);
    const existingTopics = {
        articles: [],
        coveredKeywords: new Set(),
        coveredPlatforms: new Set(),
        coveredUseCases: new Set()
    };

    try {
        const files = fs.readdirSync(blogPath).filter(f => f.endsWith('.md'));

        for (const file of files) {
            const filePath = path.join(blogPath, file);
            const content = fs.readFileSync(filePath, 'utf8');

            // Extract frontmatter - handle both Unix (LF) and Windows (CRLF) line endings
            const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
            if (!frontmatterMatch) continue;

            const frontmatter = frontmatterMatch[1];

            // Parse title
            const titleMatch = frontmatter.match(/title:\s*["']?(.+?)["']?\s*$/m);
            const title = titleMatch ? titleMatch[1].replace(/["']/g, '') : file;

            // Parse description
            const descMatch = frontmatter.match(/description:\s*["']?(.+?)["']?\s*$/m);
            const description = descMatch ? descMatch[1].replace(/["']/g, '') : '';

            // Parse keywords
            const keywordsMatch = frontmatter.match(/keywords:\s*\[([\s\S]*?)\]/);
            const keywords = keywordsMatch
                ? keywordsMatch[1].match(/"([^"]+)"/g)?.map(k => k.replace(/"/g, '').toLowerCase()) || []
                : [];

            const articleData = {
                file: file.replace('.md', ''),
                title,
                description,
                keywords,
                slug: file.replace('.md', '')
            };

            existingTopics.articles.push(articleData);

            // Add to covered sets
            keywords.forEach(kw => existingTopics.coveredKeywords.add(kw));

            // Extract platforms from title/keywords
            const platformPatterns = ['hubspot', 'salesforce', 'mongodb', 'stripe', 'shopify', 'notion', 'airtable', 'firebase', 'postman', 'power query', 'python', 'pandas', 'supabase', 'zapier', 'google analytics', 'ga4'];
            const contentLower = (title + ' ' + description + ' ' + keywords.join(' ')).toLowerCase();

            for (const platform of platformPatterns) {
                if (contentLower.includes(platform)) {
                    existingTopics.coveredPlatforms.add(platform);
                }
            }

            // Extract use cases
            const useCasePatterns = ['export', 'import', 'convert', 'flatten', 'parse', 'debug', 'analyze', 'automate', 'weekly report', 'large file', 'api response', 'nested json', 'object object'];
            for (const useCase of useCasePatterns) {
                if (contentLower.includes(useCase)) {
                    existingTopics.coveredUseCases.add(useCase);
                }
            }
        }
    } catch (error) {
        console.error(`[ContentGap] Error reading blog posts: ${error.message}`);
    }

    // Convert sets to arrays for JSON serialization
    return {
        articles: existingTopics.articles,
        coveredKeywords: [...existingTopics.coveredKeywords],
        coveredPlatforms: [...existingTopics.coveredPlatforms],
        coveredUseCases: [...existingTopics.coveredUseCases],
        totalArticles: existingTopics.articles.length
    };
}

/**
 * Identify gaps based on trending topics not yet covered
 */
function identifyPlatformGaps(existingTopics) {
    // High-value platforms that should be covered
    const targetPlatforms = [
        { name: 'notion', priority: 'HIGH', reason: 'Very popular productivity tool, many users export data' },
        { name: 'airtable', priority: 'HIGH', reason: 'Database tool with JSON exports, growing user base' },
        { name: 'firebase', priority: 'HIGH', reason: 'Popular backend, complex JSON structures' },
        { name: 'supabase', priority: 'MEDIUM', reason: 'Growing Postgres alternative with JSON support' },
        { name: 'zapier', priority: 'MEDIUM', reason: 'Automation tool, JSON data between services' },
        { name: 'make', priority: 'MEDIUM', reason: 'Make.com (formerly Integromat), Zapier competitor' },
        { name: 'mixpanel', priority: 'MEDIUM', reason: 'Analytics tool with JSON exports' },
        { name: 'amplitude', priority: 'MEDIUM', reason: 'Product analytics, JSON event data' },
        { name: 'segment', priority: 'MEDIUM', reason: 'CDP with JSON tracking data' },
        { name: 'twilio', priority: 'LOW', reason: 'Communication API logs in JSON' },
        { name: 'github', priority: 'LOW', reason: 'GitHub API responses are JSON' },
        { name: 'jira', priority: 'MEDIUM', reason: 'Project management exports' },
        { name: 'asana', priority: 'LOW', reason: 'Task management exports' },
        { name: 'quickbooks', priority: 'MEDIUM', reason: 'Finance data exports' },
        { name: 'xero', priority: 'LOW', reason: 'Accounting API data' },
        { name: 'zendesk', priority: 'MEDIUM', reason: 'Support tickets in JSON' },
        { name: 'intercom', priority: 'MEDIUM', reason: 'Customer messaging data' },
        { name: 'mailchimp', priority: 'MEDIUM', reason: 'Email campaign data' },
        { name: 'sendgrid', priority: 'LOW', reason: 'Email API logs' },
        { name: 'contentful', priority: 'MEDIUM', reason: 'Headless CMS JSON content' },
        { name: 'sanity', priority: 'LOW', reason: 'CMS JSON exports' },
        { name: 'webflow', priority: 'MEDIUM', reason: 'Website CMS exports' }
    ];

    const gaps = [];

    for (const platform of targetPlatforms) {
        if (!existingTopics.coveredPlatforms.includes(platform.name)) {
            gaps.push({
                platform: platform.name,
                priority: platform.priority,
                reason: platform.reason,
                suggestedTitle: `${platform.name.charAt(0).toUpperCase() + platform.name.slice(1)} JSON Export to Excel: Complete Guide`,
                suggestedKeyword: `${platform.name} json to excel`,
                type: 'platform_gap'
            });
        }
    }

    // Sort by priority
    const priorityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
    gaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return gaps;
}

/**
 * Identify use case gaps
 */
function identifyUseCaseGaps(existingTopics) {
    const targetUseCases = [
        { name: 'real-time api monitoring', priority: 'HIGH', reason: 'Common dev need, track API health' },
        { name: 'bulk data migration', priority: 'HIGH', reason: 'Moving between systems, JSON intermediary' },
        { name: 'log file analysis', priority: 'MEDIUM', reason: 'Server logs often JSON, need Excel analysis' },
        { name: 'e-commerce inventory', priority: 'MEDIUM', reason: 'Product data in JSON format' },
        { name: 'social media analytics', priority: 'MEDIUM', reason: 'API data from social platforms' },
        { name: 'IoT sensor data', priority: 'LOW', reason: 'Growing IoT space, JSON sensor readings' },
        { name: 'survey responses', priority: 'MEDIUM', reason: 'Form tools export JSON' },
        { name: 'A/B test results', priority: 'MEDIUM', reason: 'Experimentation data analysis' },
        { name: 'webhook payloads', priority: 'HIGH', reason: 'Debugging webhooks from services' },
        { name: 'GraphQL responses', priority: 'HIGH', reason: 'Complex nested GraphQL data' }
    ];

    const gaps = [];

    for (const useCase of targetUseCases) {
        const covered = existingTopics.coveredUseCases.some(uc =>
            uc.includes(useCase.name.split(' ')[0]) || useCase.name.includes(uc)
        );

        if (!covered) {
            gaps.push({
                useCase: useCase.name,
                priority: useCase.priority,
                reason: useCase.reason,
                suggestedTitle: `How to Analyze ${useCase.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} JSON in Excel`,
                type: 'usecase_gap'
            });
        }
    }

    const priorityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
    gaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return gaps;
}

/**
 * Check if a keyword/topic is already covered
 */
function isTopicCovered(topic, existingTopics) {
    const topicLower = topic.toLowerCase();

    // Check against covered keywords
    for (const keyword of existingTopics.coveredKeywords) {
        if (topicLower.includes(keyword) || keyword.includes(topicLower)) {
            return true;
        }
    }

    // Check against article titles
    for (const article of existingTopics.articles) {
        if (article.title.toLowerCase().includes(topicLower) || topicLower.includes(article.title.toLowerCase().split(':')[0])) {
            return true;
        }
    }

    return false;
}

/**
 * Main function: Analyze content gaps
 */
function analyzeContentGaps(projectRoot, trendsData, redditData, paaData) {
    console.log('[ContentGap] Analyzing content gaps...');

    const existingTopics = getExistingBlogTopics(projectRoot);

    const results = {
        analyzedAt: new Date().toISOString(),
        existingContent: {
            totalArticles: existingTopics.totalArticles,
            coveredPlatforms: existingTopics.coveredPlatforms,
            coveredUseCases: existingTopics.coveredUseCases,
            articles: existingTopics.articles.map(a => ({ title: a.title, slug: a.slug }))
        },
        platformGaps: identifyPlatformGaps(existingTopics),
        useCaseGaps: identifyUseCaseGaps(existingTopics),
        uncoveredTrendingTopics: [],
        uncoveredRedditQuestions: [],
        uncoveredPAAQuestions: []
    };

    // Check trending topics from Google Trends
    if (trendsData && trendsData.keywords) {
        for (const keywordData of trendsData.keywords) {
            if (keywordData.interest?.trending && !isTopicCovered(keywordData.keyword, existingTopics)) {
                results.uncoveredTrendingTopics.push({
                    keyword: keywordData.keyword,
                    trendingScore: keywordData.interest.trendingScore,
                    currentInterest: keywordData.interest.current
                });
            }

            // Also check rising queries
            for (const rising of keywordData.risingQueries || []) {
                if (!isTopicCovered(rising.query, existingTopics)) {
                    results.uncoveredTrendingTopics.push({
                        keyword: rising.query,
                        trendingScore: rising.isBreakout ? 100 : 50,
                        source: 'rising_query'
                    });
                }
            }
        }
    }

    // Check Reddit content ideas
    if (redditData && redditData.contentIdeas) {
        for (const idea of redditData.contentIdeas) {
            if (!isTopicCovered(idea.title, existingTopics)) {
                results.uncoveredRedditQuestions.push({
                    title: idea.title,
                    source: idea.source,
                    relevanceScore: idea.relevanceScore
                });
            }
        }
    }

    // Check PAA questions
    if (paaData && paaData.allQuestions) {
        for (const question of paaData.allQuestions) {
            const questionTopic = question.replace(/\?$/, '').replace(/^How (do I|to|can I) /, '');
            if (!isTopicCovered(questionTopic, existingTopics)) {
                results.uncoveredPAAQuestions.push(question);
            }
        }
    }

    // Deduplicate
    results.uncoveredTrendingTopics = [...new Map(results.uncoveredTrendingTopics.map(t => [t.keyword, t])).values()];
    results.uncoveredRedditQuestions = results.uncoveredRedditQuestions.slice(0, 15);
    results.uncoveredPAAQuestions = [...new Set(results.uncoveredPAAQuestions)].slice(0, 15);

    // Summary
    results.summary = {
        existingArticles: existingTopics.totalArticles,
        platformGapsCount: results.platformGaps.length,
        useCaseGapsCount: results.useCaseGaps.length,
        uncoveredTrendingCount: results.uncoveredTrendingTopics.length,
        uncoveredRedditCount: results.uncoveredRedditQuestions.length,
        uncoveredPAACount: results.uncoveredPAAQuestions.length,
        totalOpportunities: results.platformGaps.length + results.useCaseGaps.length + results.uncoveredTrendingTopics.length
    };

    console.log(`[ContentGap] Complete. Found ${results.summary.platformGapsCount} platform gaps, ${results.summary.useCaseGapsCount} use case gaps, ${results.summary.uncoveredTrendingCount} trending opportunities.`);

    return results;
}

module.exports = {
    analyzeContentGaps,
    getExistingBlogTopics,
    identifyPlatformGaps,
    identifyUseCaseGaps,
    isTopicCovered
};
