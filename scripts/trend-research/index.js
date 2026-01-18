#!/usr/bin/env node

/**
 * SEO Trend Research Bot - Main Orchestrator
 * 
 * This script coordinates all data sources and analyzers to produce
 * a comprehensive SEO trend report for JsonExport content strategy.
 * 
 * Usage:
 *   npm run trend-research
 *   node scripts/trend-research/index.js
 * 
 * Output:
 *   - scripts/trend-research/output/trends_report.json
 *   - scripts/trend-research/output/trends_report.md
 */

const fs = require('fs');
const path = require('path');

// Data sources
const { fetchGoogleTrendsData } = require('./sources/google-trends');
const { fetchRedditData } = require('./sources/reddit');
const { fetchPAAData } = require('./sources/people-also-ask');

// Analyzers
const { analyzeContentGaps } = require('./analyzers/content-gap');
const { prioritizeOpportunities } = require('./analyzers/prioritizer');

// Output formatters
const { createJsonReport, validateReport } = require('./output/json-formatter');
const { createMarkdownReport } = require('./output/markdown-formatter');

// Configuration
const CONFIG = {
    outputDir: path.join(__dirname, 'output'),
    projectRoot: path.join(__dirname, '..', '..'),
    enableGoogleTrends: true,
    enableReddit: true,
    enablePAA: true,
    enableContentGap: true,
    retryAttempts: 3,
    verbose: true
};

/**
 * Logger with timestamps
 */
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const prefix = {
        'INFO': 'ℹ️ ',
        'SUCCESS': '✅',
        'WARNING': '⚠️ ',
        'ERROR': '❌',
        'PROGRESS': '🔄'
    }[level] || '';

    console.log(`[${timestamp}] ${prefix} ${message}`);
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir() {
    if (!fs.existsSync(CONFIG.outputDir)) {
        fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        log(`Created output directory: ${CONFIG.outputDir}`);
    }
}

/**
 * Write file with error handling
 */
function writeOutputFile(filename, content) {
    const filepath = path.join(CONFIG.outputDir, filename);
    try {
        fs.writeFileSync(filepath, content, 'utf8');
        log(`Written: ${filepath}`, 'SUCCESS');
        return true;
    } catch (error) {
        log(`Failed to write ${filepath}: ${error.message}`, 'ERROR');
        return false;
    }
}

/**
 * Execute a data source with error handling
 */
async function executeDataSource(name, fetchFn) {
    log(`Starting ${name}...`, 'PROGRESS');
    const startTime = Date.now();

    try {
        const data = await fetchFn();
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        log(`${name} completed in ${duration}s`, 'SUCCESS');
        return { success: true, data, duration: parseFloat(duration) };
    } catch (error) {
        log(`${name} failed: ${error.message}`, 'ERROR');
        if (CONFIG.verbose) {
            console.error(error.stack);
        }
        return { success: false, data: null, error: error.message };
    }
}

/**
 * Main execution function
 */
async function main() {
    const startTime = Date.now();

    log('='.repeat(60));
    log('SEO Trend Research Bot - Starting');
    log('='.repeat(60));
    log(`Project root: ${CONFIG.projectRoot}`);
    log(`Output directory: ${CONFIG.outputDir}`);

    // Ensure output directory exists
    ensureOutputDir();

    // Results storage
    const results = {
        trendsData: null,
        redditData: null,
        paaData: null,
        contentGapData: null,
        prioritizedData: null,
        metadata: {
            startTime: new Date().toISOString(),
            sources: {}
        }
    };

    // =========================================
    // PHASE 1: Data Collection
    // =========================================
    log('\n--- PHASE 1: Data Collection ---\n');

    // 1.1 Google Trends
    if (CONFIG.enableGoogleTrends) {
        const trendsResult = await executeDataSource('Google Trends', fetchGoogleTrendsData);
        results.trendsData = trendsResult.data;
        results.metadata.sources.googleTrends = {
            success: trendsResult.success,
            duration: trendsResult.duration,
            error: trendsResult.error
        };
    }

    // 1.2 Reddit
    if (CONFIG.enableReddit) {
        const redditResult = await executeDataSource('Reddit', fetchRedditData);
        results.redditData = redditResult.data;
        results.metadata.sources.reddit = {
            success: redditResult.success,
            duration: redditResult.duration,
            error: redditResult.error
        };
    }

    // 1.3 People Also Ask
    if (CONFIG.enablePAA) {
        const paaResult = await executeDataSource('People Also Ask', fetchPAAData);
        results.paaData = paaResult.data;
        results.metadata.sources.paa = {
            success: paaResult.success,
            duration: paaResult.duration,
            error: paaResult.error
        };
    }

    // =========================================
    // PHASE 2: Analysis
    // =========================================
    log('\n--- PHASE 2: Analysis ---\n');

    // 2.1 Content Gap Analysis
    if (CONFIG.enableContentGap) {
        log('Starting Content Gap Analysis...', 'PROGRESS');
        try {
            results.contentGapData = analyzeContentGaps(
                CONFIG.projectRoot,
                results.trendsData,
                results.redditData,
                results.paaData
            );
            log('Content Gap Analysis completed', 'SUCCESS');
        } catch (error) {
            log(`Content Gap Analysis failed: ${error.message}`, 'ERROR');
            results.contentGapData = null;
        }
    }

    // 2.2 Prioritization
    log('Starting Priority Scoring...', 'PROGRESS');
    try {
        results.prioritizedData = prioritizeOpportunities(
            results.trendsData,
            results.redditData,
            results.paaData,
            results.contentGapData
        );
        log('Priority Scoring completed', 'SUCCESS');
    } catch (error) {
        log(`Priority Scoring failed: ${error.message}`, 'ERROR');
        results.prioritizedData = { all: [], categorized: { high: [], medium: [], low: [] }, summary: { total: 0, high: 0, medium: 0, low: 0 } };
    }

    // =========================================
    // PHASE 3: Report Generation
    // =========================================
    log('\n--- PHASE 3: Report Generation ---\n');

    // Calculate total duration
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    results.metadata.duration = parseFloat(totalDuration);
    results.metadata.endTime = new Date().toISOString();

    // 3.1 Create JSON Report
    log('Generating JSON report...', 'PROGRESS');
    try {
        const jsonReport = createJsonReport({
            trendsData: results.trendsData,
            redditData: results.redditData,
            paaData: results.paaData,
            contentGapData: results.contentGapData,
            prioritizedOpportunities: results.prioritizedData,
            metadata: results.metadata
        });

        validateReport(jsonReport);

        const jsonSuccess = writeOutputFile('trends_report.json', JSON.stringify(jsonReport, null, 2));

        if (jsonSuccess) {
            // 3.2 Create Markdown Report
            log('Generating Markdown report...', 'PROGRESS');
            const mdReport = createMarkdownReport(jsonReport);
            writeOutputFile('trends_report.md', mdReport);
        }
    } catch (error) {
        log(`Report generation failed: ${error.message}`, 'ERROR');
        if (CONFIG.verbose) {
            console.error(error.stack);
        }
    }

    // =========================================
    // SUMMARY
    // =========================================
    log('\n' + '='.repeat(60));
    log('SEO Trend Research Bot - Complete');
    log('='.repeat(60));

    const summary = results.prioritizedData?.summary || {};
    log(`Total Duration: ${totalDuration}s`);
    log(`Total Opportunities Found: ${summary.total || 0}`);
    log(`  - HIGH Priority: ${summary.high || 0}`);
    log(`  - MEDIUM Priority: ${summary.medium || 0}`);
    log(`  - LOW Priority: ${summary.low || 0}`);

    if (summary.topOpportunity) {
        log(`\nTop Opportunity: "${summary.topOpportunity.titleSuggestion}"`);
        log(`  Keyword: ${summary.topOpportunity.keyword}`);
        log(`  Score: ${summary.topOpportunity.priorityScore}/100`);
    }

    log('\nOutput files:');
    log(`  - ${path.join(CONFIG.outputDir, 'trends_report.json')}`);
    log(`  - ${path.join(CONFIG.outputDir, 'trends_report.md')}`);

    // Check for critical failures
    const sourceResults = Object.values(results.metadata.sources);
    const failedSources = sourceResults.filter(s => !s.success).length;

    if (failedSources > 0) {
        log(`\n⚠️  Warning: ${failedSources} data source(s) failed. Check logs above.`, 'WARNING');
    }

    log('\n✨ Done! Check the output files for your weekly SEO opportunities.');

    // Exit with appropriate code
    process.exit(failedSources === sourceResults.length ? 1 : 0);
}

// Run the script
main().catch(error => {
    log(`Fatal error: ${error.message}`, 'ERROR');
    console.error(error.stack);
    process.exit(1);
});
