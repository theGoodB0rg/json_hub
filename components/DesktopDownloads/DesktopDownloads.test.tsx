/**
 * Verifies DesktopDownloads correctly classifies real Tauri artifact
 * filenames into OS buckets and handles the three terminal states:
 * loading, no-release-yet, and release-with-assets.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DesktopDownloads } from './DesktopDownloads';

const REAL_TAURI_ASSET_NAMES = [
    'JsonExport_0.1.0_x64-setup.exe',
    'JsonExport_0.1.0_x64_en-US.msi',
    'JsonExport_0.1.0_x64.dmg',
    'JsonExport_0.1.0_aarch64.dmg',
    'json-export_0.1.0_amd64.deb',
    'json-export_0.1.0_amd64.AppImage',
    'JsonExport-0.1.0-1.x86_64.rpm',
    'latest.json',
    'latest.json.sig',
    'JsonExport_0.1.0_x64-setup.exe.sig',
];

function mockGhRelease(assetNames: string[]) {
    return {
        tag_name: 'v0.1.0',
        name: 'JsonExport v0.1.0',
        published_at: new Date().toISOString(),
        html_url: 'https://github.com/theGoodB0rg/json_hub/releases/tag/v0.1.0',
        assets: assetNames.map((name, i) => ({
            name,
            browser_download_url: `https://example.com/${name}`,
            size: (i + 1) * 1024 * 1024,
        })),
    };
}

const originalFetch = global.fetch;

afterEach(() => {
    global.fetch = originalFetch;
});

describe('DesktopDownloads', () => {
    it('shows loading state initially', () => {
        global.fetch = jest.fn().mockReturnValue(new Promise(() => { /* never resolves */ }));
        render(<DesktopDownloads />);
        expect(screen.getByText(/loading latest release/i)).toBeInTheDocument();
    });

    it('shows "coming soon" when no release exists (404)', async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 } as any);
        render(<DesktopDownloads />);
        await waitFor(() => {
            expect(screen.getByText(/desktop app coming soon/i)).toBeInTheDocument();
        });
        // Pre-order link is present so revenue capture isn't blocked by a missing release
        const preorderLink = screen.getByRole('link', { name: /pre-order/i });
        expect(preorderLink.getAttribute('href')).toContain('pro.jsonexport.com/l/json_hub');
    });

    it('classifies real Tauri artifact names into the right OS buckets', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockGhRelease(REAL_TAURI_ASSET_NAMES),
        } as any);

        render(<DesktopDownloads />);

        // Each OS row renders
        await waitFor(() => {
            expect(screen.getByText('Windows')).toBeInTheDocument();
        });
        expect(screen.getByText('macOS (Apple Silicon)')).toBeInTheDocument();
        expect(screen.getByText('macOS (Intel)')).toBeInTheDocument();
        expect(screen.getByText('Linux (AppImage)')).toBeInTheDocument();
        expect(screen.getByText('Linux (.deb)')).toBeInTheDocument();
        expect(screen.getByText('Linux (.rpm)')).toBeInTheDocument();

        // Each OS has a download link pointing to a real artifact name
        expect(screen.getByText(/JsonExport_0\.1\.0_x64-setup\.exe/)).toBeInTheDocument();
        expect(screen.getByText(/JsonExport_0\.1\.0_aarch64\.dmg/)).toBeInTheDocument();
        expect(screen.getByText(/JsonExport_0\.1\.0_x64\.dmg/)).toBeInTheDocument();
        expect(screen.getByText(/amd64\.AppImage/)).toBeInTheDocument();
        expect(screen.getByText(/amd64\.deb/)).toBeInTheDocument();
        expect(screen.getByText(/x86_64\.rpm/)).toBeInTheDocument();

        // No "Not in this release" placeholder should appear with a full matrix
        expect(screen.queryByText(/not in this release/i)).not.toBeInTheDocument();
    });

    it('skips .sig signature files from download buckets', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockGhRelease(REAL_TAURI_ASSET_NAMES),
        } as any);

        render(<DesktopDownloads />);
        await waitFor(() => {
            expect(screen.getByText('Windows')).toBeInTheDocument();
        });
        // A .sig file for the exe would be a bad download — bucket should pick the real exe
        const windowsRow = screen.getByText('Windows').closest('li')!;
        expect(windowsRow.textContent).toContain('.exe');
        expect(windowsRow.textContent).not.toMatch(/\.exe\.sig/);
    });

    it('shows "Not in this release" placeholder when a bucket has no matching asset', async () => {
        // Windows-only release — mac + linux buckets should show as unavailable
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockGhRelease(['JsonExport_0.1.0_x64-setup.exe']),
        } as any);

        render(<DesktopDownloads />);
        await waitFor(() => {
            expect(screen.getByText('Windows')).toBeInTheDocument();
        });
        // 4 of 5 buckets have no asset (3 non-win rows + something)
        const placeholders = screen.getAllByText(/not in this release/i);
        expect(placeholders.length).toBeGreaterThanOrEqual(4);
    });

    it('surfaces API errors with a fallback link', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
        render(<DesktopDownloads />);
        await waitFor(() => {
            expect(screen.getByText(/couldn't fetch the latest release/i)).toBeInTheDocument();
        });
        const link = screen.getByRole('link', { name: /browse releases on github/i });
        expect(link.getAttribute('href')).toBe('https://github.com/theGoodB0rg/json_hub/releases/latest');
    });
});
