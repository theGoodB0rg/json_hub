/**
 * Market Research System Configuration
 */

module.exports = {
    // Search settings
    searchSettings: {
        timeRangeDays: 90,
        minRedditScore: 50,
        minComments: 10,
        maxConcurrency: 3  // Requests per second
    },

    // Subreddits to scrape for pain points
    subreddits: [
        // Productivity & Self Improvement
        'productivity', 'getdisciplined', 'ADHD', 'selfimprovement', 'time_management',

        // Entrepreneurship & Side Projects
        'SideProject', 'Entrepreneur', 'startups', 'indiehackers', 'SaaS',

        // Tech & Dev
        'webdev', 'programming', 'nocode', 'automations',

        // Data & Tools
        'dataanalysis', 'excel', 'googlesheets', 'googlescript',

        // Business/Finance (Niche-rich)
        'smallbusiness', 'freelance', 'ecommerce', 'dropshipping'
    ],

    // Search terms to find pain points
    painPointTerms: [
        'how do I',
        'help with',
        'anyone know a tool',
        'best app for',
        'is there a way to',
        'wish there was',
        'tired of',
        'frustrated with',
        'alternative to',
        'too expensive',
        'manual work',
        'automate this'
    ],

    // Scoring weights for opportunities
    scoring: {
        redditEngagement: 0.25, // Validated social interest
        trendGrowth: 0.25,      // Validated search demand growth
        searchVolume: 0.20,     // Total addressable market size
        competitionGap: 0.30    // Ease of winning
    },

    // Paths
    paths: {
        output: './scripts/market-research/output'
    }
};
