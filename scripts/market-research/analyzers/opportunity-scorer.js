/**
 * Opportunity Scorer
 * Aggregates all data points into a single 0-100 score
 */

const config = require('../config');

function scoreOpportunities(fullyAnalyzedData) {
    console.log('[Scorer] Scoring and ranking opportunities...');

    const scored = fullyAnalyzedData.map(item => {
        // Normalize sub-scores to 0-100 scale first

        // 1. Reddit Score (already roughly 0-100 based on my formula, but let's cap it)
        const redditScore = Math.min(100, item.painScore);

        // 2. Trend Score
        // If trending, base is 70. Add growth % up to 100.
        let trendScore = 0;
        if (item.trendData && item.trendData.currentInterest > 0) {
            trendScore = 50 + (item.trendData.trendGrowth / 2); // 50 base, + growth
            if (item.trendData.isTrending) trendScore += 20;
            if (item.trendData.currentInterest > 75) trendScore += 10;
        }
        trendScore = Math.min(100, Math.max(0, trendScore));

        // 3. Competition Score (Winnability)
        const competitionScore = item.serpAnalysis.winnabilityScore;

        // Calculate Weighted Final Score
        // Weights from config
        const finalScore = (
            (redditScore * config.scoring.redditEngagement) +
            (trendScore * config.scoring.trendGrowth) +
            (competitionScore * config.scoring.competitionGap) +
            (50 * config.scoring.searchVolume) // Base volume assumption since we don't have exact vol
        );

        // Product Type Recommendation
        let productType = 'Content/Guide';
        const title = item.title.toLowerCase();

        if (title.includes('tool') || title.includes('app') || title.includes('software')) {
            productType = 'SaaS / Web Tool';
        } else if (title.includes('how to') || title.includes('tutorial')) {
            productType = 'Info Product / Course';
        } else if (title.includes('template') || title.includes('sheet')) {
            productType = 'Digital Asset (Template)';
        }

        return {
            ...item,
            scores: {
                final: Math.round(finalScore),
                reddit: Math.round(redditScore),
                trend: Math.round(trendScore),
                competition: Math.round(competitionScore)
            },
            recommendation: productType
        };
    });

    // Sort by final score descending
    return scored.sort((a, b) => b.scores.final - a.scores.final);
}

module.exports = {
    scoreOpportunities
};
