/**
 * Markdown Output Formatter
 * Creates human-readable report for review and AI prompting
 */

/**
 * Format a date nicely
 */
function formatDate(isoString) {
    const date = new Date(isoString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Get week number string
 */
function getWeekString() {
    const now = new Date();
    const onejan = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return `Week ${weekNum}, ${now.getFullYear()}`;
}

/**
 * Create priority badge
 */
function priorityBadge(priority) {
    switch (priority) {
        case 'HIGH': return '🔴 HIGH';
        case 'MEDIUM': return '🟡 MEDIUM';
        case 'LOW': return '🟢 LOW';
        default: return priority;
    }
}

/**
 * Format an opportunity for markdown
 */
function formatOpportunity(opp, index) {
    let md = '';

    // Use snake_case (from JSON) or camelCase (from prioritizer) with fallbacks
    const title = opp.title_suggestion || opp.titleSuggestion || 'Untitled Opportunity';
    const keyword = opp.primary_keyword || opp.keyword || 'N/A';
    const priorityScore = opp.priority_score || opp.priorityScore || 0;
    const searches = opp.estimated_monthly_searches || opp.estimatedMonthlySearches || 0;
    const tier = opp.search_volume_tier || opp.searchVolumeTier || 'unknown';
    const difficulty = opp.keyword_difficulty || opp.keywordDifficulty || 'N/A';
    const trending = opp.trending || false;
    const trendingScore = opp.trending_score || opp.trendingScore || 0;
    const isBreakout = opp.is_breakout || opp.isBreakout || false;
    const isContentGap = opp.is_content_gap !== undefined ? opp.is_content_gap : (opp.isContentGap !== undefined ? opp.isContentGap : true);
    const source = opp.source || 'unknown';
    const relatedQuestions = opp.related_questions || opp.relatedQuestions || [];
    const suggestedOutline = opp.suggested_outline || opp.suggestedOutline || [];
    const writingNotes = opp.writing_notes || opp.writingNotes || '';

    md += `### ${index}. ${title}\n\n`;
    md += `| Property | Value |\n`;
    md += `|----------|-------|\n`;
    md += `| **Priority** | ${priorityBadge(opp.priority)} (Score: ${priorityScore}/100) |\n`;
    md += `| **Keyword** | \`${keyword}\` |\n`;
    md += `| **Est. Monthly Searches** | ~${searches.toLocaleString()} (${tier}) |\n`;
    md += `| **Keyword Difficulty** | ${difficulty} |\n`;
    md += `| **Trending** | ${trending ? `Yes (+${trendingScore}%)` : 'No'} ${isBreakout ? '🚀 BREAKOUT' : ''} |\n`;
    md += `| **Content Gap** | ${isContentGap ? '✅ Not covered yet' : '⚠️ Similar content exists'} |\n`;
    md += `| **Source** | ${source.replace(/_/g, ' ')} |\n`;
    md += `\n`;

    // Related questions
    if (relatedQuestions.length > 0) {
        md += `**People Also Ask:**\n`;
        for (const q of relatedQuestions.slice(0, 3)) {
            md += `- ${q}\n`;
        }
        md += `\n`;
    }

    // Suggested outline
    if (suggestedOutline.length > 0) {
        md += `**Suggested Outline:**\n`;
        for (let i = 0; i < suggestedOutline.length; i++) {
            md += `${i + 1}. ${suggestedOutline[i]}\n`;
        }
        md += `\n`;
    }

    // Writing notes
    if (writingNotes) {
        md += `**Writing Notes:** ${writingNotes}\n\n`;
    }

    md += `---\n\n`;

    return md;
}


/**
 * Create the full Markdown report
 */
function createMarkdownReport(jsonReport) {
    let md = '';

    // Header
    md += `# 📈 Weekly SEO Trend Report - ${getWeekString()}\n\n`;
    md += `**Generated:** ${formatDate(jsonReport.generated_at)}\n\n`;
    md += `---\n\n`;

    // Quick Summary
    md += `## 📊 Quick Summary\n\n`;
    md += `| Metric | Count |\n`;
    md += `|--------|-------|\n`;
    md += `| **Total Opportunities** | ${jsonReport.summary.total_opportunities} |\n`;
    md += `| 🔴 High Priority | ${jsonReport.summary.high_priority} |\n`;
    md += `| 🟡 Medium Priority | ${jsonReport.summary.medium_priority} |\n`;
    md += `| 🟢 Low Priority | ${jsonReport.summary.low_priority} |\n`;
    md += `\n`;

    // Top opportunity callout
    if (jsonReport.summary.top_opportunity) {
        md += `> **🏆 Top Opportunity This Week:**\n`;
        md += `> \n`;
        md += `> "${jsonReport.summary.top_opportunity.title}"\n`;
        md += `> \n`;
        md += `> Keyword: \`${jsonReport.summary.top_opportunity.keyword}\` | Score: ${jsonReport.summary.top_opportunity.score}/100\n\n`;
    }

    md += `---\n\n`;

    // High Priority Opportunities
    const highPriority = jsonReport.opportunities.filter(o => o.priority === 'HIGH');
    if (highPriority.length > 0) {
        md += `## 🔥 High Priority Opportunities (Write These First!)\n\n`;
        for (let i = 0; i < highPriority.length; i++) {
            md += formatOpportunity(highPriority[i], i + 1);
        }
    }

    // Medium Priority Opportunities
    const mediumPriority = jsonReport.opportunities.filter(o => o.priority === 'MEDIUM');
    if (mediumPriority.length > 0) {
        md += `## 📊 Medium Priority Opportunities\n\n`;
        md += `*Good candidates for next week or when you have more time.*\n\n`;
        for (let i = 0; i < Math.min(mediumPriority.length, 5); i++) {
            md += formatOpportunity(mediumPriority[i], i + 1);
        }
        if (mediumPriority.length > 5) {
            md += `*... and ${mediumPriority.length - 5} more medium priority opportunities. See JSON report for full list.*\n\n`;
        }
    }

    // Platform Gaps Section
    if (jsonReport.platform_gaps && jsonReport.platform_gaps.length > 0) {
        md += `## 🎯 Platform Coverage Gaps\n\n`;
        md += `These platforms are not yet covered on your blog but have SEO potential:\n\n`;
        md += `| Platform | Priority | Reason |\n`;
        md += `|----------|----------|--------|\n`;
        for (const gap of jsonReport.platform_gaps.slice(0, 10)) {
            md += `| **${gap.platform}** | ${priorityBadge(gap.priority)} | ${gap.reason} |\n`;
        }
        md += `\n`;
    }

    // Reddit Trending Section
    if (jsonReport.reddit_trending && jsonReport.reddit_trending.length > 0) {
        md += `## 💬 Reddit Discussions This Week\n\n`;
        md += `*Real questions from data analysts and developers:*\n\n`;
        for (const item of jsonReport.reddit_trending.slice(0, 8)) {
            md += `- **[${item.title}](${item.url})** - ${item.upvotes} upvotes, ${item.comments} comments\n`;
        }
        md += `\n`;
    }

    // People Also Ask Section
    if (jsonReport.people_also_ask) {
        const allQuestions = [
            ...(jsonReport.people_also_ask.how_to_questions || []),
            ...(jsonReport.people_also_ask.troubleshooting_questions || []),
            ...(jsonReport.people_also_ask.comparison_questions || [])
        ];

        if (allQuestions.length > 0) {
            md += `## ❓ People Also Ask (FAQ Ideas)\n\n`;
            md += `*Include these in your articles for featured snippet opportunities:*\n\n`;

            if (jsonReport.people_also_ask.how_to_questions?.length > 0) {
                md += `**How-To Questions:**\n`;
                for (const q of jsonReport.people_also_ask.how_to_questions.slice(0, 5)) {
                    md += `- ${q}\n`;
                }
                md += `\n`;
            }

            if (jsonReport.people_also_ask.troubleshooting_questions?.length > 0) {
                md += `**Troubleshooting Questions:**\n`;
                for (const q of jsonReport.people_also_ask.troubleshooting_questions.slice(0, 5)) {
                    md += `- ${q}\n`;
                }
                md += `\n`;
            }
        }
    }

    // Your Current Coverage
    if (jsonReport.your_blog_coverage) {
        md += `## 📚 Your Current Blog Coverage\n\n`;
        md += `- **Total Articles:** ${jsonReport.your_blog_coverage.total_articles}\n`;
        md += `- **Covered Platforms:** ${jsonReport.your_blog_coverage.covered_platforms.join(', ') || 'None'}\n`;
        md += `- **Covered Use Cases:** ${jsonReport.your_blog_coverage.covered_use_cases.join(', ') || 'None'}\n`;
        md += `\n`;
    }

    // Google Trends Insights
    if (jsonReport.google_trends_insights?.breakout_queries?.length > 0) {
        md += `## 🚀 Breakout Queries (Fast-Rising)\n\n`;
        md += `*These queries are growing rapidly - first-mover advantage!*\n\n`;
        for (const item of jsonReport.google_trends_insights.breakout_queries.slice(0, 5)) {
            md += `- \`${item.query}\` (from: ${item.sourceKeyword})\n`;
        }
        md += `\n`;
    }

    // Errors (if any)
    if (jsonReport.errors && jsonReport.errors.length > 0) {
        md += `## ⚠️ Data Collection Warnings\n\n`;
        md += `Some data sources had issues:\n\n`;
        for (const err of jsonReport.errors.slice(0, 5)) {
            md += `- ${err.source}: ${err.error || err.type}\n`;
        }
        md += `\n`;
    }

    md += `---\n\n`;

    // AI Prompt Template
    md += `## 🤖 How to Use This Report with AI\n\n`;
    md += `Copy this prompt and paste with the HIGH priority opportunities into your AI assistant:\n\n`;
    md += `\`\`\`\n`;
    md += `I need you to write blog articles for my site jsonexport.com.\n`;
    md += `\n`;
    md += `Here are the topics to write about (from my SEO trend research):\n`;
    md += `[PASTE HIGH PRIORITY OPPORTUNITIES HERE]\n`;
    md += `\n`;
    md += `Requirements:\n`;
    md += `- Match the style of my existing articles at content/blog/*.md\n`;
    md += `- Write like a senior developer explaining to a colleague\n`;
    md += `- Include practical examples with code snippets\n`;
    md += `- Add FAQ sections for featured snippets\n`;
    md += `- Target ~1,500-2,500 words per article\n`;
    md += `- Use the suggested outlines but expand with real examples\n`;
    md += `- NO AI slop phrases like "dive into", "unleash", "in today's world"\n`;
    md += `- Be direct, practical, and helpful\n`;
    md += `\`\`\`\n\n`;

    // Footer
    md += `---\n\n`;
    md += `*Report generated by JsonExport SEO Trend Research Bot v1.0*\n`;
    md += `*Data sources: Google Trends, Reddit, People Also Ask, Content Gap Analysis*\n`;

    return md;
}

module.exports = {
    createMarkdownReport,
    formatOpportunity,
    formatDate,
    getWeekString,
    priorityBadge
};
