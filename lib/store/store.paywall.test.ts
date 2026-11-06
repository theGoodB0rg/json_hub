/** @jest-environment jsdom */

const tracked: Array<{ name: string; payload: Record<string, unknown> }> = [];
jest.mock('@/lib/telemetry/conversion-events', () => ({
    trackConversionEvent: (name: string, payload: Record<string, unknown>) => tracked.push({ name, payload }),
}));
jest.mock('@/lib/analytics', () => ({ trackFunnelStep: jest.fn() }));

const downloadCsv = jest.fn(async (..._args: unknown[]) => undefined);
jest.mock('@/lib/converters/jsonToCsv', () => ({ downloadCsv: (...args: unknown[]) => downloadCsv(...args) }));
jest.mock('@/lib/storage/conversionHistory', () => ({ conversionHistory: { saveConversion: jest.fn(async () => undefined) } }));

import { FREE_EXPORT_LIMIT_BYTES } from '@/lib/license/limits';

const ROWS = [{ a: 1 }, { a: 2 }, { a: 3 }];

function loadStores(sourceBytes: number) {
    jest.resetModules();
    tracked.length = 0;
    downloadCsv.mockClear();
    const { useAppStore } = require('./store') as typeof import('./store');
    const { useProStore } = require('./proStore') as typeof import('./proStore');
    useAppStore.setState({
        parsedData: ROWS,
        flatData: ROWS,
        schema: ['a'],
        columnOrder: ['a'],
        excludedColumns: [],
        sourceBytes,
        exportSettings: { ...useAppStore.getState().exportSettings, structure: 'flat' },
    });
    return { app: useAppStore, pro: useProStore };
}

const exportedRows = () => downloadCsv.mock.calls[0][0] as unknown[];

describe('free-tier export limit', () => {
    it('exports files at or under the limit for everyone', async () => {
        const { app } = loadStores(FREE_EXPORT_LIMIT_BYTES);
        await app.getState().exportData('csv');
        expect(app.getState().paywall).toBeNull();
        expect(exportedRows()).toHaveLength(3);
    });

    it('opens the paywall instead of exporting a larger file for a free user', async () => {
        const { app } = loadStores(FREE_EXPORT_LIMIT_BYTES + 1);
        await app.getState().exportData('csv');
        expect(app.getState().paywall).toBe('large_file');
        expect(downloadCsv).not.toHaveBeenCalled();
        expect(tracked.find((t) => t.name === 'paywall_shown')?.payload.format).toBe('large_file');
    });

    it('lets a free user download the first rows of a larger file', async () => {
        const { app } = loadStores(FREE_EXPORT_LIMIT_BYTES + 1);
        await app.getState().exportData('csv', { sampleRows: 2 });
        expect(app.getState().paywall).toBeNull();
        expect(exportedRows()).toEqual([{ a: 1 }, { a: 2 }]);
    });

    it('exports the whole larger file for Pro', async () => {
        const { app, pro } = loadStores(FREE_EXPORT_LIMIT_BYTES + 1);
        pro.getState().setIsPro(true);
        await app.getState().exportData('csv');
        expect(app.getState().paywall).toBeNull();
        expect(exportedRows()).toHaveLength(3);
    });

    it('counts a streamed file by its size, not by leftover pasted text', () => {
        const { app } = loadStores(0);
        (global as any).Worker = class { onmessage = null; onerror = null; postMessage() {} terminate() {} };
        app.getState().setRawInput('{"a":1}');
        expect(app.getState().sourceBytes).toBe(7);
        // jsdom's File has no stream(); the size is all this test needs.
        const reader = { read: async () => ({ done: true }), cancel: async () => undefined };
        const file = { name: 'big.json', size: 10, stream: () => ({ getReader: () => reader }) };
        app.getState().parseInputStreaming(file as unknown as File);
        expect(app.getState().sourceBytes).toBe(10);
    });
});
