/**
 * Opportunity Prioritizer
 * Scores and ranks content opportunities based on multiple factors
 */

/**
 * Priority score weights
 */
const WEIGHTS = {
    searchVolume: 20,      // Estimated monthly searches
    trendingScore: 15,     // How much interest is growing
    keywordDifficulty: 15, // Inverse - easier = higher score
    contentGap: 10,        // Not covered yet = bonus
    redditBuzz: 10,        // Community interest
    platformValue: 10,     // High-value platforms
    commercialIntent: 20   // High intent (buy/hire/convert)
};

/**
 * Estimate search volume from trending data
 * (Note: Real search volume requires paid APIs like Ahrefs/SEMrush)
 * This uses the Google Trends interest as a proxy
 */
function estimateSearchVolume(interestLevel) {
    // Interest 0-100 mapped to estimated monthly searches
    // This is approximate - real data would be more accurate
    if (interestLevel >= 80) return { estimate: 10000, tier: 'very_high' };
    if (interestLevel >= 60) return { estimate: 5000, tier: 'high' };
    if (interestLevel >= 40) return { estimate: 2000, tier: 'medium' };
    if (interestLevel >= 20) return { estimate: 800, tier: 'low' };
    return { estimate: 200, tier: 'very_low' };
}

/**
 * Score based on estimated search volume
 */
function scoreSearchVolume(estimate) {
    if (estimate >= 10000) return 25;
    if (estimate >= 5000) return 22;
    if (estimate >= 2000) return 18;
    if (estimate >= 800) return 14;
    if (estimate >= 300) return 10;
    return 5;
}

/**
 * Score based on trending status
 */
function scoreTrending(trendingScore, isBreakout = false) {
    if (isBreakout) return 20;
    if (trendingScore >= 80) return 18;
    if (trendingScore >= 50) return 15;
    if (trendingScore >= 30) return 12;
    if (trendingScore >= 10) return 8;
    if (trendingScore > 0) return 5;
    return 0;
}

/**
 * Score based on keyword difficulty (estimated)
 * Lower difficulty = higher score
 */
function scoreKeywordDifficulty(keyword) {
    const lower = keyword.toLowerCase();

    // Long-tail keywords are generally easier
    const wordCount = keyword.split(' ').length;
    let difficultyScore = Math.min(wordCount * 3, 12);

    // Specific platforms/tools make it easier (more specific)
    const specificTerms = ['hubspot', 'salesforce', 'mongodb', 'stripe', 'shopify', 'notion', 'airtable', 'firebase', 'postman', 'zapier', 'quickbooks', 'zendesk', 'jira'];
    if (specificTerms.some(term => lower.includes(term))) {
        difficultyScore += 5;
    }

    // Problem-specific keywords are easier
    const problemTerms = ['fix', 'error', 'not working', 'without', 'alternative', 'free'];
    if (problemTerms.some(term => lower.includes(term))) {
        difficultyScore += 3;
    }

    return Math.min(difficultyScore, 20);
}

/**
 * Score based on Reddit interest
 */
function scoreRedditBuzz(relevanceScore, upvotes = 0, comments = 0) {
    let score = 0;

    // Relevance score from Reddit analyzer
    if (relevanceScore >= 70) score += 5;
    else if (relevanceScore >= 50) score += 3;
    else if (relevanceScore >= 30) score += 2;

    // Engagement
    if (upvotes >= 100) score += 3;
    else if (upvotes >= 50) score += 2;
    else if (upvotes >= 20) score += 1;

    if (comments >= 25) score += 2;
    else if (comments >= 10) score += 1;

    return Math.min(score, 10);
}

/**
 * Score based on platform value
 */
function scorePlatformValue(keyword) {
    const lower = keyword.toLowerCase();

    // Tier 1: Highest value platforms (large user bases, common pain point)
    const tier1 = ['hubspot', 'salesforce', 'mongodb', 'stripe', 'shopify', 'notion', 'airtable'];
    if (tier1.some(p => lower.includes(p))) return 10;

    // Tier 2: Good value
    const tier2 = ['firebase', 'postman', 'google analytics', 'ga4', 'zapier', 'quickbooks', 'zendesk', 'jira'];
    if (tier2.some(p => lower.includes(p))) return 7;

    // Tier 3: Moderate value
    const tier3 = ['twilio', 'sendgrid', 'mailchimp', 'intercom', 'contentful', 'webflow', 'github'];
    if (tier3.some(p => lower.includes(p))) return 5;

    // Generic JSON/Excel keywords
    if (lower.includes('json') || lower.includes('excel') || lower.includes('csv')) return 3;

    return 0;
}

/**
 * Score based on commercial intent
 * Detects words that indicate a user is ready to Convert
 */
function scoreCommercialIntent(keyword) {
    const lower = keyword.toLowerCase();
    let score = 0;

    // High Intent (Buy/Sign up)
    const highIntent = ['best', 'top', 'review', 'vs', 'comparison', 'price', 'cost', 'pricing', 'buy', 'subscription', 'software', 'tool', 'platform', 'hiring', 'consultant'];
    if (highIntent.some(w => lower.includes(w))) score += 10;

    // Action Oriented
    const actionIntent = ['convert', 'export', 'transform', 'parse', 'automate', 'integrate', 'analyze'];
    if (actionIntent.some(w => lower.includes(w))) score += 5;

    // Professional/Enterprise
    const proIntent = ['enterprise', 'business', 'secure', 'api', 'bulk', 'large', 'big data'];
    if (proIntent.some(w => lower.includes(w))) score += 5;

    return Math.min(score, 20);
}

/**
 * Create an opportunity object from various data sources
 */
function createOpportunity(data) {
    const {
        keyword,
        title,
        source,
        trendingScore = 0,
        isBreakout = false,
        interestLevel = 0,
        redditRelevance = 0,
        redditUpvotes = 0,
        redditComments = 0,
        isContentGap = true,
        relatedQuestions = [],
        suggestedOutline = null,
        writingNotes = null
    } = data;

    // Calculate individual scores
    const searchVolumeData = estimateSearchVolume(interestLevel);
    const scores = {
        searchVolume: scoreSearchVolume(searchVolumeData.estimate),
        trending: scoreTrending(trendingScore, isBreakout),
        keywordDifficulty: scoreKeywordDifficulty(keyword),
        contentGap: isContentGap ? WEIGHTS.contentGap : 0,
        redditBuzz: scoreRedditBuzz(redditRelevance, redditUpvotes, redditComments),
        platformValue: scorePlatformValue(keyword),
        commercialIntent: scoreCommercialIntent(keyword)
    };

    // Total priority score
    const priorityScore = Object.values(scores).reduce((a, b) => a + b, 0);

    // Determine priority tier
    let priority;
    if (priorityScore >= 70) priority = 'HIGH';
    else if (priorityScore >= 50) priority = 'MEDIUM';
    else priority = 'LOW';

    // Determine keyword difficulty label
    const keywordDifficultyLabel = scores.keywordDifficulty >= 15 ? 'LOW'
        : scores.keywordDifficulty >= 10 ? 'MEDIUM'
            : 'HIGH';

    return {
        keyword,
        titleSuggestion: title || generateTitle(keyword),
        priority,
        priorityScore,
        priorityScore,
        scores,
        commercialIntentScore: scores.commercialIntent,
        estimatedMonthlySearches: searchVolumeData.estimate,
        searchVolumeTier: searchVolumeData.tier,
        keywordDifficulty: keywordDifficultyLabel,
        trending: trendingScore > 10,
        trendingScore,
        isBreakout,
        isContentGap,
        source,
        relatedQuestions: relatedQuestions.slice(0, 5),
        suggestedOutline: suggestedOutline || generateOutline(keyword),
        writingNotes: writingNotes || generateWritingNotes(keyword)
    };
}

/**
 * Generate a title suggestion from a keyword
 */
function generateTitle(keyword) {
    const lower = keyword.toLowerCase();

    // Platform-specific titles
    const platforms = ['hubspot', 'salesforce', 'mongodb', 'stripe', 'shopify', 'notion', 'airtable', 'firebase', 'postman', 'zapier', 'jira', 'zendesk', 'quickbooks', 'mailchimp'];
    for (const platform of platforms) {
        if (lower.includes(platform)) {
            const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
            return `${platformName} JSON Export to Excel: Complete Guide (${new Date().getFullYear()})`;
        }
    }

    // Problem-specific titles
    if (lower.includes('error') || lower.includes('fix') || lower.includes('not working')) {
        return `How to Fix "${keyword}" - Step-by-Step Solution`;
    }

    if (lower.includes('without')) {
        return `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} - Easy Guide for Non-Developers`;
    }

    if (lower.includes('alternative')) {
        return `Best ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} (${new Date().getFullYear()} Comparison)`;
    }

    // Generic how-to
    return `How to ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} (${new Date().getFullYear()} Guide)`;
}

/**
 * Generate a suggested outline
 */
function generateOutline(keyword) {
    const lower = keyword.toLowerCase();

    // Platform-specific outline
    const platforms = ['hubspot', 'salesforce', 'mongodb', 'stripe', 'shopify', 'notion', 'airtable', 'firebase'];
    for (const platform of platforms) {
        if (lower.includes(platform)) {
            const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
            return [
                `Introduction: Why export ${platformName} data to Excel?`,
                `${platformName}'s native export options (and their limitations)`,
                `Method 1: Direct CSV export (basic)`,
                `Method 2: API export + JSON conversion (recommended)`,
                `Step-by-step tutorial using JsonExport`,
                `Handling nested ${platformName} data`,
                `Common issues and solutions`,
                `FAQs`,
                `Conclusion`
            ];
        }
    }

    // Generic outline
    return [
        'Introduction: The problem',
        'Why this matters for data analysts',
        'Method comparison',
        'Step-by-step solution',
        'Tips and best practices',
        'FAQs',
        'Conclusion'
    ];
}

/**
 * Generate writing notes for the content
 */
function generateWritingNotes(keyword) {
    const lower = keyword.toLowerCase();
    const notes = [];

    if (lower.includes('api') || lower.includes('postman')) {
        notes.push('Target developers and QA engineers. Include code examples.');
    }

    if (scoreCommercialIntent(keyword) > 10) {
        notes.push('This is a HIGH INTENT keyword. Focus on "Best X for Y" or comparison format. Clear CTA to use the tool.');
    }

    if (lower.includes('excel') && !lower.includes('python')) {
        notes.push('Target non-technical users. Avoid jargon.');
    }

    if (lower.includes('large') || lower.includes('big')) {
        notes.push('Emphasize performance and memory handling.');
    }

    if (lower.includes('privacy') || lower.includes('secure')) {
        notes.push('Emphasize client-side processing and no data upload.');
    }

    if (lower.includes('automate') || lower.includes('weekly') || lower.includes('recurring')) {
        notes.push('Focus on time savings. Include specific hour estimates.');
    }

    if (notes.length === 0) {
        notes.push('Write in conversational, technical-but-accessible tone.');
        notes.push('Include practical examples and screenshots.');
    }

    return notes.join(' ');
}

/**
 * Main function: Prioritize all opportunities
 */
function prioritizeOpportunities(trendsData, redditData, paaData, contentGapData) {
    console.log('[Prioritizer] Scoring and ranking opportunities...');

    const opportunities = [];
    const seenKeywords = new Set();

    // Process Google Trends data
    if (trendsData && trendsData.keywords) {
        for (const keywordData of trendsData.keywords) {
            if (seenKeywords.has(keywordData.keyword.toLowerCase())) continue;
            seenKeywords.add(keywordData.keyword.toLowerCase());

            opportunities.push(createOpportunity({
                keyword: keywordData.keyword,
                source: 'google_trends',
                trendingScore: keywordData.interest?.trendingScore || 0,
                interestLevel: keywordData.interest?.current || 0,
                relatedQuestions: (paaData?.allQuestions || []).filter(q =>
                    q.toLowerCase().includes(keywordData.keyword.toLowerCase().split(' ')[0])
                )
            }));

            // Also add breakout queries
            for (const rising of keywordData.risingQueries || []) {
                if (seenKeywords.has(rising.query.toLowerCase())) continue;
                seenKeywords.add(rising.query.toLowerCase());

                opportunities.push(createOpportunity({
                    keyword: rising.query,
                    source: 'google_trends_rising',
                    trendingScore: 80,
                    isBreakout: rising.isBreakout,
                    interestLevel: 50
                }));
            }
        }
    }

    // Process content gap platform suggestions
    if (contentGapData && contentGapData.platformGaps) {
        for (const gap of contentGapData.platformGaps) {
            if (seenKeywords.has(gap.suggestedKeyword.toLowerCase())) continue;
            seenKeywords.add(gap.suggestedKeyword.toLowerCase());

            opportunities.push(createOpportunity({
                keyword: gap.suggestedKeyword,
                title: gap.suggestedTitle,
                source: 'content_gap_platform',
                interestLevel: gap.priority === 'HIGH' ? 60 : gap.priority === 'MEDIUM' ? 40 : 20,
                writingNotes: gap.reason
            }));
        }
    }

    // Process Reddit content ideas
    if (redditData && redditData.contentIdeas) {
        for (const idea of redditData.contentIdeas.slice(0, 10)) {
            // Extract keyword from Reddit title
            const keyword = idea.title
                .replace(/\?$/, '')
                .replace(/^(How (do I|to|can I)|What is the best way to|Is there a) /i, '')
                .substring(0, 60);

            if (seenKeywords.has(keyword.toLowerCase())) continue;
            seenKeywords.add(keyword.toLowerCase());

            opportunities.push(createOpportunity({
                keyword,
                title: idea.title,
                source: 'reddit',
                redditRelevance: idea.relevanceScore,
                redditUpvotes: idea.score,
                redditComments: idea.comments
            }));
        }
    }

    // Sort by priority score (descending)
    opportunities.sort((a, b) => b.priorityScore - a.priorityScore);

    // Categorize
    const categorized = {
        high: opportunities.filter(o => o.priority === 'HIGH'),
        medium: opportunities.filter(o => o.priority === 'MEDIUM'),
        low: opportunities.filter(o => o.priority === 'LOW')
    };

    console.log(`[Prioritizer] Complete. Scored ${opportunities.length} opportunities: ${categorized.high.length} HIGH, ${categorized.medium.length} MEDIUM, ${categorized.low.length} LOW`);

    return {
        all: opportunities,
        categorized,
        summary: {
            total: opportunities.length,
            high: categorized.high.length,
            medium: categorized.medium.length,
            low: categorized.low.length,
            topOpportunity: opportunities[0] || null
        }
    };
}

module.exports = {
    prioritizeOpportunities,
    createOpportunity,
    scoreSearchVolume,
    scoreTrending,
    scoreKeywordDifficulty,
    scoreRedditBuzz,
    scorePlatformValue,
    scoreCommercialIntent,
    generateTitle,
    generateOutline,
    WEIGHTS
};
