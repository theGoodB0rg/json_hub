/**
 * Quick Performance Test - Measures parsing and flattening time directly
 * 
 * Run with: node scripts/quick-perf-test.js
 * 
 * This tests the core parsing/flattening logic without the browser,
 * providing baseline performance measurements.
 */

const fs = require('fs');
const path = require('path');

// We need to compile TypeScript first, so we'll use require-esm for the parsers
// For now, we'll test with native JSON.parse which is what the worker uses

const TEST_DATA_DIR = path.join(__dirname, '..', 'test-data');

const COLORS = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m',
};

function formatSize(bytes) {
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    if (bytes > 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${bytes}B`;
}

function formatTime(ms) {
    if (ms > 1000) return `${(ms / 1000).toFixed(2)}s`;
    return `${ms.toFixed(0)}ms`;
}

/**
 * Simple flattener (mirroring lib/parsers/flattener.ts logic)
 */
function flattenObject(obj, prefix = '') {
    const result = {};

    for (const key of Object.keys(obj)) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (value === null || value === undefined) {
            result[newKey] = value;
        } else if (Array.isArray(value)) {
            // For arrays of primitives, join them
            if (value.every(v => typeof v !== 'object' || v === null)) {
                result[newKey] = value.join(', ');
            } else {
                // For array of objects, flatten first few
                value.slice(0, 3).forEach((item, i) => {
                    if (typeof item === 'object' && item !== null) {
                        Object.assign(result, flattenObject(item, `${newKey}[${i}]`));
                    } else {
                        result[`${newKey}[${i}]`] = item;
                    }
                });
                if (value.length > 3) {
                    result[`${newKey}._count`] = value.length;
                }
            }
        } else if (typeof value === 'object') {
            Object.assign(result, flattenObject(value, newKey));
        } else {
            result[newKey] = value;
        }
    }

    return result;
}

function flattenArray(data) {
    return data.map(item => flattenObject(item));
}

function runTest(fileName) {
    const filePath = path.join(TEST_DATA_DIR, fileName);

    if (!fs.existsSync(filePath)) {
        console.log(`${COLORS.yellow}⚠️  Skipping ${fileName} (not found)${COLORS.reset}`);
        return null;
    }

    const stats = fs.statSync(filePath);
    console.log(`\n${COLORS.cyan}Testing: ${fileName} (${formatSize(stats.size)})${COLORS.reset}`);

    // Measure file read time
    const readStart = performance.now();
    const content = fs.readFileSync(filePath, 'utf-8');
    const readTime = performance.now() - readStart;

    // Measure JSON.parse time
    const parseStart = performance.now();
    let data;
    try {
        data = JSON.parse(content);
    } catch (e) {
        console.log(`${COLORS.red}❌ JSON parse failed: ${e.message}${COLORS.reset}`);
        return null;
    }
    const parseTime = performance.now() - parseStart;

    // Measure flattening time
    const flattenStart = performance.now();
    const flatData = flattenArray(data);
    const flattenTime = performance.now() - flattenStart;

    // Calculate stats
    const recordCount = data.length;
    const columnCount = Object.keys(flatData[0] || {}).length;
    const totalTime = readTime + parseTime + flattenTime;

    // Memory usage
    const memUsage = process.memoryUsage();
    const heapUsed = formatSize(memUsage.heapUsed);

    console.log(`   📖 Read:     ${formatTime(readTime)}`);
    console.log(`   🔍 Parse:    ${formatTime(parseTime)} (${recordCount.toLocaleString()} records)`);
    console.log(`   📊 Flatten:  ${formatTime(flattenTime)} (${columnCount} columns)`);
    console.log(`   ${COLORS.bold}⏱️  Total:    ${formatTime(totalTime)}${COLORS.reset}`);
    console.log(`   💾 Memory:   ${heapUsed}`);

    return {
        fileName,
        fileSize: stats.size,
        recordCount,
        columnCount,
        readTime,
        parseTime,
        flattenTime,
        totalTime,
        heapUsed: memUsage.heapUsed,
    };
}

// Main
console.log(`${COLORS.bold}${COLORS.blue}`);
console.log('═'.repeat(60));
console.log('  JsonExport Performance Test - Core Parsing Benchmark');
console.log('═'.repeat(60));
console.log(`${COLORS.reset}`);

const testFiles = [
    'test-1mb.json',
    'test-3mb.json',
    'test-5mb.json',
    'test-10mb.json',
];

const results = [];

for (const file of testFiles) {
    const result = runTest(file);
    if (result) results.push(result);

    // Force GC if available
    if (global.gc) global.gc();
}

// Summary
console.log(`\n${COLORS.bold}${COLORS.green}`);
console.log('═'.repeat(60));
console.log('  RESULTS SUMMARY');
console.log('═'.repeat(60));
console.log(`${COLORS.reset}`);

console.log('\n| File           | Size    | Records | Parse   | Flatten | Total   |');
console.log('|----------------|---------|---------|---------|---------|---------|');

for (const r of results) {
    console.log(
        `| ${r.fileName.padEnd(14)} | ` +
        `${formatSize(r.fileSize).padStart(7)} | ` +
        `${r.recordCount.toLocaleString().padStart(7)} | ` +
        `${formatTime(r.parseTime).padStart(7)} | ` +
        `${formatTime(r.flattenTime).padStart(7)} | ` +
        `${formatTime(r.totalTime).padStart(7)} |`
    );
}

// Performance assessment
console.log(`\n${COLORS.bold}Performance Assessment:${COLORS.reset}`);
const largest = results[results.length - 1];
if (largest) {
    const throughput = (largest.fileSize / (1024 * 1024)) / (largest.totalTime / 1000);
    console.log(`   📈 Throughput: ${throughput.toFixed(2)} MB/s`);
    console.log(`   ⚡ Estimated 50MB: ${formatTime((50 / throughput) * 1000)}`);
}

console.log(`\n${COLORS.green}✅ Performance test complete!${COLORS.reset}\n`);
