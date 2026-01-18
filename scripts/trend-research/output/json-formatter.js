/**
 * JSON Output Formatter
 * Creates the structured JSON report for programmatic use
 */

/**
 * Create the full JSON report
 */
function createJsonReport(data) {
    const {
        trendsData,
        redditData,
        paaData,
        contentGapData,
        prioritizedOpportunities,
        metadata
    } = data;

    const report = {
        // Metadata
        generated_at: new Date().toISOString(),
        report_week: getWeekString(),
        version: '1.0.0',

        // Summary for quick overview
        summary: {
            total_opportunities: prioritizedOpportunities?.summary?.total || 0,
            high_priority: prioritizedOpportunities?.summary?.high || 0,
            medium_priority: prioritizedOpportunities?.summary?.medium || 0,
            low_priority: prioritizedOpportunities?.summary?.low || 0,
            top_opportunity: prioritizedOpportunities?.summary?.topOpportunity ? {
                keyword: prioritizedOpportunities.summary.topOpportunity.keyword,
                title: prioritizedOpportunities.summary.topOpportunity.titleSuggestion,
                score: prioritizedOpportunities.summary.topOpportunity.priorityScore
            } : null,
            data_sources: {
                google_trends: trendsData ? 'success' : 'failed',
                reddit: redditData ? 'success' : 'failed',
                people_also_ask: paaData ? 'success' : 'failed',
                content_gap: contentGapData ? 'success' : 'failed'
            }
        },

        // Prioritized opportunities (main content)
        opportunities: (prioritizedOpportunities?.all || []).map(opp => ({
            priority: opp.priority,
            priority_score: opp.priorityScore,
            title_suggestion: opp.titleSuggestion,
            primary_keyword: opp.keyword,
            estimated_monthly_searches: opp.estimatedMonthlySearches,
            search_volume_tier: opp.searchVolumeTier,
            keyword_difficulty: opp.keywordDifficulty,
            trending: opp.trending,
            trending_score: opp.trendingScore,
            is_breakout: opp.isBreakout,
            is_content_gap: opp.isContentGap,
            source: opp.source,
            scores_breakdown: opp.scores,
            related_questions: opp.relatedQuestions,
            suggested_outline: opp.suggestedOutline,
            writing_notes: opp.writingNotes
        })),

        // Your blog coverage analysis
        your_blog_coverage: contentGapData ? {
            total_articles: contentGapData.existingContent?.totalArticles || 0,
            covered_platforms: contentGapData.existingContent?.coveredPlatforms || [],
            covered_use_cases: contentGapData.existingContent?.coveredUseCases || [],
            existing_articles: contentGapData.existingContent?.articles || []
        } : null,

        // Platform gaps (specific suggestions)
        platform_gaps: contentGapData?.platformGaps?.map(gap => ({
            platform: gap.platform,
            priority: gap.priority,
            reason: gap.reason,
            suggested_title: gap.suggestedTitle,
            suggested_keyword: gap.suggestedKeyword
        })) || [],

        // Use case gaps
        use_case_gaps: contentGapData?.useCaseGaps?.map(gap => ({
            use_case: gap.useCase,
            priority: gap.priority,
            reason: gap.reason,
            suggested_title: gap.suggestedTitle
        })) || [],

        // Reddit trending discussions
        reddit_trending: redditData?.contentIdeas?.slice(0, 15).map(idea => ({
            title: idea.title,
            subreddit: idea.source?.split('/r/')[1] || 'unknown',
            url: idea.source,
            upvotes: idea.score,
            comments: idea.comments,
            relevance_score: idea.relevanceScore
        })) || [],

        // People Also Ask questions
        people_also_ask: {
            how_to_questions: paaData?.categorizedQuestions?.howTo?.slice(0, 10) || [],
            troubleshooting_questions: paaData?.categorizedQuestions?.troubleshooting?.slice(0, 10) || [],
            comparison_questions: paaData?.categorizedQuestions?.comparison?.slice(0, 10) || [],
            tools_questions: paaData?.categorizedQuestions?.tools?.slice(0, 10) || []
        },

        // Google Trends insights
        google_trends_insights: {
            rising_opportunities: trendsData?.risingOpportunities?.slice(0, 10) || [],
            breakout_queries: trendsData?.breakoutQueries?.slice(0, 10) || []
        },

        // Errors and warnings
        errors: [
            ...(trendsData?.errors || []).map(e => ({ source: 'google_trends', ...e })),
            ...(redditData?.errors || []).map(e => ({ source: 'reddit', ...e })),
            ...(paaData?.errors || []).map(e => ({ source: 'paa', ...e }))
        ],

        // Metadata
        metadata: {
            script_version: '1.0.0',
            run_duration_seconds: metadata?.duration || 0,
            ...metadata
        }
    };

    return report;
}

/**
 * Get current week in ISO format (e.g., "2026-W03")
 */
function getWeekString() {
    const now = new Date();
    const onejan = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Validate the report structure
 */
function validateReport(report) {
    const required = ['generated_at', 'summary', 'opportunities'];
    const missing = required.filter(field => !report[field]);

    if (missing.length > 0) {
        throw new Error(`Report validation failed. Missing fields: ${missing.join(', ')}`);
    }

    return true;
}

module.exports = {
    createJsonReport,
    getWeekString,
    validateReport
};
