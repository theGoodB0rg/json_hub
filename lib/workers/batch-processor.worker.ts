/**
 * Batch Processor Worker
 * 
 * Handles batch JSON file processing off the main thread:
 * - JSON parsing
 * - Smart unwrapping (double-encoded JSON)
 * - Flattening to tabular format
 * - Excel/CSV generation
 * - ZIP creation
 */

import { flattenJSON } from '@/lib/parsers/flattener';
import { smartUnwrap } from '@/lib/parsers/unwrapper';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

const ctx: Worker = self as unknown as Worker;

interface BatchFile {
    id: string;
    name: string;
    buffer: ArrayBuffer;
}

interface BatchStartPayload {
    files: BatchFile[];
    format: 'xlsx' | 'csv';
}

let isCancelled = false;

ctx.addEventListener('message', async (event: MessageEvent) => {
    const { type, payload } = event.data as { type: string; payload?: unknown };

    try {
        switch (type) {
            case 'BATCH_START':
                isCancelled = false;
                await processBatch(payload as BatchStartPayload);
                break;

            case 'BATCH_CANCEL':
                isCancelled = true;
                ctx.postMessage({ type: 'BATCH_CANCELLED' });
                break;
        }
    } catch (error) {
        ctx.postMessage({
            type: 'BATCH_ERROR',
            payload: { message: error instanceof Error ? error.message : 'Unknown worker error' }
        });
    }
});

async function processBatch({ files, format }: BatchStartPayload) {
    const zip = new JSZip();
    const decoder = new TextDecoder();
    const totalFiles = files.length;
    let completedFiles = 0;

    for (const file of files) {
        if (isCancelled) {
            ctx.postMessage({ type: 'BATCH_CANCELLED' });
            return;
        }

        try {
            // Report start
            ctx.postMessage({
                type: 'FILE_PROGRESS',
                payload: {
                    fileId: file.id,
                    status: 'processing',
                    percent: 0,
                    stage: 'Parsing JSON'
                }
            });

            // Decode ArrayBuffer to string
            const text = decoder.decode(file.buffer);

            // Parse JSON
            let parsed: unknown;
            try {
                parsed = JSON.parse(text);
            } catch (parseError) {
                throw new Error(`Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Parse failed'}`);
            }

            if (isCancelled) return;

            ctx.postMessage({
                type: 'FILE_PROGRESS',
                payload: { fileId: file.id, percent: 25, stage: 'Unwrapping' }
            });

            // Unwrap (handles double-encoded JSON, wrapped arrays, etc.)
            const { data: unwrapped } = smartUnwrap(parsed);

            if (isCancelled) return;

            ctx.postMessage({
                type: 'FILE_PROGRESS',
                payload: { fileId: file.id, percent: 50, stage: 'Flattening' }
            });

            // Flatten to tabular format
            const { rows, schema } = flattenJSON(unwrapped, { mode: 'flat' });

            if (isCancelled) return;

            ctx.postMessage({
                type: 'FILE_PROGRESS',
                payload: { fileId: file.id, percent: 75, stage: 'Generating output' }
            });

            // Generate output file
            const baseName = file.name.replace(/\.json$/i, '');

            if (format === 'xlsx') {
                // Create worksheet data: header row + data rows
                const worksheetData = [
                    schema,
                    ...rows.map(row => schema.map(col => row[col] ?? null))
                ];
                const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

                // Write to buffer
                const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
                zip.file(`${baseName}.xlsx`, excelBuffer);
            } else {
                // Generate CSV
                const csvContent = [
                    schema.join(','),
                    ...rows.map(row => schema.map(col => {
                        const value = row[col];
                        if (value === null || value === undefined) return '';
                        const str = String(value);
                        // Escape commas and quotes
                        return str.includes(',') || str.includes('"') || str.includes('\n')
                            ? `"${str.replace(/"/g, '""')}"`
                            : str;
                    }).join(','))
                ].join('\n');

                zip.file(`${baseName}.csv`, csvContent);
            }

            completedFiles++;

            // Report file complete
            ctx.postMessage({
                type: 'FILE_COMPLETE',
                payload: {
                    fileId: file.id,
                    rowCount: rows.length,
                    columnCount: schema.length
                }
            });

            // Report total progress
            ctx.postMessage({
                type: 'BATCH_PROGRESS',
                payload: {
                    completedFiles,
                    totalFiles,
                    percent: Math.round((completedFiles / totalFiles) * 100)
                }
            });

        } catch (error) {
            // Report file error (but continue with other files)
            ctx.postMessage({
                type: 'FILE_ERROR',
                payload: {
                    fileId: file.id,
                    error: error instanceof Error ? error.message : 'Processing failed'
                }
            });
            completedFiles++;
        }

        // Allow GC to collect the buffer
        file.buffer = null as unknown as ArrayBuffer;
    }

    if (isCancelled) return;

    // Generate ZIP blob
    ctx.postMessage({
        type: 'BATCH_PROGRESS',
        payload: { completedFiles, totalFiles, percent: 100, stage: 'Creating ZIP' }
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Send ZIP blob back to main thread
    ctx.postMessage({
        type: 'BATCH_COMPLETE',
        payload: { zipBlob }
    });
}
