/**
 * Market Research System - Main Orchestrator
 * 
 * Usage: node scripts/market-research/index.js
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

// Import modules (will be created next)
const redditExplorer = require('./sources/reddit-explorer');
const googleTrends = require('./sources/google-trends');
const serpAnalyzer = require('./sources/serp-analyzer');
const opportunityScorer = require('./analyzers/opportunity-scorer');
const reportGenerator = require('./output/report-generator');

// Logger
function log(msg, type = 'INFO') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [${type}] ${msg}`);
}

async function main() {
    log('Starting Market Research System...', 'INIT');

    // Ensure output directory exists
    if (!fs.existsSync(config.paths.output)) {
        fs.mkdirSync(config.paths.output, { recursive: true });
    }

    try {
        // Phase 1: Discover Pain Points from Reddit
        log('Phase 1: Discovering pain points from Reddit...', 'STEP');
        const painPoints = await redditExplorer.discoverPainPoints();
        log(`Found ${painPoints.length} potential pain points.`, 'SUCCESS');

        if (painPoints.length === 0) {
            log('No pain points found. Exiting.', 'WARN');
            return;
        }

        // Phase 2: Validate with Google Trends
        log('Phase 2: Validating with Google Trends...', 'STEP');
        const validOpportunities = await googleTrends.validateKeywords(painPoints);
        log(`Validated ${validOpportunities.length} opportunities with search volume.`, 'SUCCESS');

        // Phase 3: Analyze Competition (SERP)
        log('Phase 3: Analyzing SERP competition...', 'STEP');
        const fullyAnalyzedDetails = await serpAnalyzer.analyzeCompetition(validOpportunities);
        log(`Analyzed competition for ${fullyAnalyzedDetails.length} items.`, 'SUCCESS');

        // Phase 4: Score & Rank
        log('Phase 4: Scoring opportunities...', 'STEP');
        const scoredOpportunities = opportunityScorer.scoreOpportunities(fullyAnalyzedDetails);

        // Phase 5: Generate Report
        log('Phase 5: Generating final report...', 'STEP');
        const reportPath = await reportGenerator.generateReport(scoredOpportunities);

        log(`Research complete! Report saved to: ${reportPath}`, 'DONE');

    } catch (error) {
        log(`Fatal Error: ${error.message}`, 'ERROR');
        console.error(error);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}
