import LZString from 'lz-string';
import { buildShareUrl, readSharePayload } from './shareLink';
import { campaignReferrer } from '@/lib/platform/siteOrigin';

jest.mock('@tauri-apps/api/core', () => ({ invoke: jest.fn() }));

const json = '[{"a":1,"b":"two"}]';

describe('share links', () => {
    it('puts the payload in the fragment so it never reaches a server', () => {
        const url = new URL(buildShareUrl('https://jsonexport.com', json)!);
        expect(url.search).toBe('');
        expect(url.hash.startsWith('#share=')).toBe(true);
        expect(readSharePayload(url.hash, url.search)).toBe(json);
    });

    it('adds a ref tag when asked', () => {
        const url = new URL(buildShareUrl('https://jsonexport.com', json, { ref: 'mcp' })!);
        expect(url.searchParams.get('ref')).toBe('mcp');
        expect(readSharePayload(url.hash, url.search)).toBe(json);
    });

    it('still opens older ?share= links', () => {
        const legacy = `?share=${LZString.compressToEncodedURIComponent(json)}`;
        expect(readSharePayload('', legacy)).toBe(json);
    });

    it('returns null when the data is over the size limit or missing', () => {
        expect(buildShareUrl('https://x', 'z'.repeat(100), { maxCompressed: 5 })).toBeNull();
        expect(readSharePayload('', '')).toBeNull();
        expect(readSharePayload('#share=%%%', '')).toBeNull();
    });
});

describe('campaignReferrer', () => {
    it('tags valid refs and ignores junk', () => {
        expect(campaignReferrer('?ref=mcp')).toBe('ref:mcp');
        expect(campaignReferrer('?ref=<script>')).toBeNull();
        expect(campaignReferrer('')).toBeNull();
    });
});
