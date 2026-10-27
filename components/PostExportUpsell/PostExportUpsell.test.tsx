/**
 * Verifies the PostExportUpsell actually responds to real export_success
 * events (not just that it mounts). These tests fire the same custom DOM
 * event that `trackConversionEvent` dispatches in production, so a
 * regression that silently stops the toast from appearing would fail here.
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { PostExportUpsell } from './PostExportUpsell';
import { useProStore } from '@/lib/store/proStore';

const EVENT = 'jsonexport:conversion-event';
const COOLDOWN_KEY = 'jsonexport:post-export-upsell-last';

function fireExport(payload: Record<string, unknown> = {}) {
    const detail = { id: 'test-' + Date.now(), name: 'export_success', timestamp: Date.now(), payload };
    act(() => {
        window.dispatchEvent(new CustomEvent(EVENT, { detail }));
    });
}

async function waitForToast() {
    // Component defers the toast by 800ms so it doesn't collide with the
    // browser download prompt. Advance timers and wait for the DOM to settle.
    act(() => { jest.advanceTimersByTime(900); });
    return screen.findByRole('dialog');
}

describe('PostExportUpsell', () => {
    beforeEach(() => {
        localStorage.clear();
        useProStore.setState({ isPro: false });
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('shows a toast after a real export_success event', async () => {
        render(<PostExportUpsell />);
        fireExport({ platform: 'trello', format: 'xlsx' });

        const dialog = await waitForToast();
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveTextContent(/Get Desktop Pro/i);
    });

    it('skips sample/demo exports', async () => {
        render(<PostExportUpsell />);
        fireExport({ platform: 'jira', format: 'xlsx', is_sample: true });
        act(() => { jest.advanceTimersByTime(900); });
        // Nothing should be rendered.
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('never shows for Pro users', async () => {
        useProStore.setState({ isPro: true });
        render(<PostExportUpsell />);
        fireExport({ platform: 'stripe', format: 'csv' });
        act(() => { jest.advanceTimersByTime(900); });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('respects the 24h cooldown', async () => {
        // Prime localStorage with a recent impression.
        localStorage.setItem(COOLDOWN_KEY, String(Date.now() - 60_000));
        render(<PostExportUpsell />);
        fireExport({ platform: 'shopify', format: 'xlsx' });
        act(() => { jest.advanceTimersByTime(900); });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('writes the cooldown timestamp when shown so subsequent exports are suppressed in-session', async () => {
        render(<PostExportUpsell />);
        fireExport({ platform: 'trello', format: 'xlsx' });
        await waitForToast();

        const stored = Number(localStorage.getItem(COOLDOWN_KEY));
        expect(stored).toBeGreaterThan(Date.now() - 5_000);

        // A second export in the same session should NOT re-show.
        fireExport({ platform: 'trello', format: 'csv' });
        act(() => { jest.advanceTimersByTime(900); });
        // Dialog from the first fire is still there, no duplicate shown
        expect(screen.getAllByRole('dialog')).toHaveLength(1);
    });

    it('leads with the file size for a large export', async () => {
        render(<PostExportUpsell />);
        fireExport({ platform: 'json-to-excel', format: 'xlsx', file_size_bytes: 3 * 1024 * 1024 });

        const dialog = await waitForToast();
        expect(dialog).toHaveTextContent(/3\.0 MB file/);
        expect(dialog).toHaveTextContent(/1 GB\+/);
    });

    it('speaks to workflow once the browser has exported before', async () => {
        localStorage.setItem('jsonexport:real-export-count', '2');
        render(<PostExportUpsell />);
        fireExport({ platform: 'json-to-excel', format: 'xlsx', file_size_bytes: 120_000 });

        const dialog = await waitForToast();
        expect(dialog).toHaveTextContent(/Converting these regularly/);
        expect(dialog).toHaveTextContent(/folder/i);
    });

    it('keeps the first-time small-file message free of big-file claims', async () => {
        render(<PostExportUpsell />);
        fireExport({ platform: 'json-to-excel', format: 'xlsx', file_size_bytes: 120_000 });

        const dialog = await waitForToast();
        expect(dialog).toHaveTextContent(/never left your browser/);
        expect(dialog).not.toHaveTextContent(/MB file/);
    });

    it('counts exports the cooldown suppresses so history is not lost', async () => {
        localStorage.setItem(COOLDOWN_KEY, String(Date.now() - 60_000));
        render(<PostExportUpsell />);
        fireExport({ platform: 'trello', format: 'xlsx' });
        fireExport({ platform: 'trello', format: 'csv' });
        expect(localStorage.getItem('jsonexport:real-export-count')).toBe('2');
    });

    it('does not count sample exports toward history', async () => {
        render(<PostExportUpsell />);
        fireExport({ platform: 'jira', format: 'xlsx', is_sample: true });
        expect(localStorage.getItem('jsonexport:real-export-count')).toBeNull();
    });

    it('ignores non-export events', async () => {
        render(<PostExportUpsell />);
        act(() => {
            window.dispatchEvent(new CustomEvent(EVENT, {
                detail: { id: 'x', name: 'page_view', timestamp: Date.now(), payload: {} }
            }));
            jest.advanceTimersByTime(900);
        });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
