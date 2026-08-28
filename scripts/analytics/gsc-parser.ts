import fs from 'fs';
import path from 'path';

export interface GscQuery {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number; // percentage as number e.g. 5.2 for 5.2%
    position: number;
    opportunityScore?: number;
}

export interface GscPage {
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

export interface GscCountry {
    country: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

export interface GscDevice {
    device: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

export interface GscSummary {
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
    topQueries: GscQuery[];
    opportunityQueries: GscQuery[];
    topPages: GscPage[];
    countries: GscCountry[];
    devices: GscDevice[];
    source: string;
}

function parseCsvLines(content: string): string[][] {
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    const result: string[][] = [];

    for (const line of lines) {
        const row: string[] = [];
        let inQuotes = false;
        let currentValue = '';

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        row.push(currentValue.trim());
        result.push(row);
    }
    return result;
}

export function loadGscData(gscDir?: string): GscSummary {
    const targetDir = gscDir || path.resolve(process.cwd(), 'docs', 'gsc_data');

    const summary: GscSummary = {
        totalClicks: 0,
        totalImpressions: 0,
        avgCtr: 0,
        avgPosition: 0,
        topQueries: [],
        opportunityQueries: [],
        topPages: [],
        countries: [],
        devices: [],
        source: 'docs/gsc_data'
    };

    if (!fs.existsSync(targetDir)) {
        return summary;
    }

    // 1. Parse Queries.csv
    const queriesFile = path.join(targetDir, 'Queries.csv');
    if (fs.existsSync(queriesFile)) {
        const rows = parseCsvLines(fs.readFileSync(queriesFile, 'utf-8'));
        // Header: Top queries,Clicks,Impressions,CTR,Position
        for (let i = 1; i < rows.length; i++) {
            const [query, clicksStr, impressionsStr, ctrStr, posStr] = rows[i];
            if (!query) continue;

            const clicks = Number(clicksStr || 0);
            const impressions = Number(impressionsStr || 0);
            const ctr = parseFloat((ctrStr || '0').replace('%', ''));
            const position = parseFloat(posStr || '0');

            summary.totalClicks += clicks;
            summary.totalImpressions += impressions;

            const entry: GscQuery = {
                query,
                clicks,
                impressions,
                ctr,
                position,
                // High impressions, lower CTR, positioned 3-25 is prime opportunity
                opportunityScore: position > 2 && position <= 25 ? Math.round(impressions * (1 - ctr / 100) / (position / 5)) : 0
            };

            summary.topQueries.push(entry);
        }

        // Sort top queries by clicks descending
        summary.topQueries.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);

        // Find high opportunity queries (impressions >= 20, rank 3-25, sorted by opportunityScore)
        summary.opportunityQueries = summary.topQueries
            .filter(q => q.impressions >= 20 && q.position >= 3 && q.position <= 25)
            .sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0))
            .slice(0, 15);
    }

    // 2. Parse Pages.csv
    const pagesFile = path.join(targetDir, 'Pages.csv');
    if (fs.existsSync(pagesFile)) {
        const rows = parseCsvLines(fs.readFileSync(pagesFile, 'utf-8'));
        for (let i = 1; i < rows.length; i++) {
            const [page, clicksStr, impressionsStr, ctrStr, posStr] = rows[i];
            if (!page) continue;
            summary.topPages.push({
                page: page.replace('https://jsonexport.com', ''),
                clicks: Number(clicksStr || 0),
                impressions: Number(impressionsStr || 0),
                ctr: parseFloat((ctrStr || '0').replace('%', '')),
                position: parseFloat(posStr || '0')
            });
        }
        summary.topPages.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
    }

    // 3. Parse Countries.csv
    const countriesFile = path.join(targetDir, 'Countries.csv');
    if (fs.existsSync(countriesFile)) {
        const rows = parseCsvLines(fs.readFileSync(countriesFile, 'utf-8'));
        for (let i = 1; i < rows.length; i++) {
            const [country, clicksStr, impressionsStr, ctrStr, posStr] = rows[i];
            if (!country) continue;
            summary.countries.push({
                country,
                clicks: Number(clicksStr || 0),
                impressions: Number(impressionsStr || 0),
                ctr: parseFloat((ctrStr || '0').replace('%', '')),
                position: parseFloat(posStr || '0')
            });
        }
        summary.countries.sort((a, b) => b.clicks - a.clicks);
    }

    // 4. Parse Devices.csv
    const devicesFile = path.join(targetDir, 'Devices.csv');
    if (fs.existsSync(devicesFile)) {
        const rows = parseCsvLines(fs.readFileSync(devicesFile, 'utf-8'));
        for (let i = 1; i < rows.length; i++) {
            const [device, clicksStr, impressionsStr, ctrStr, posStr] = rows[i];
            if (!device) continue;
            summary.devices.push({
                device,
                clicks: Number(clicksStr || 0),
                impressions: Number(impressionsStr || 0),
                ctr: parseFloat((ctrStr || '0').replace('%', '')),
                position: parseFloat(posStr || '0')
            });
        }
    }

    if (summary.totalImpressions > 0) {
        summary.avgCtr = Number(((summary.totalClicks / summary.totalImpressions) * 100).toFixed(2));
    }

    return summary;
}
