/**
 * Orchestrator fallback tests.
 *
 * These assert the behavior that makes the whole Pillar 2 architecture work:
 *   1. fetch-keepalive is tried first
 *   2. on fetch failure, we fall through to XHR (and then image pixel)
 *   3. a winning transport is remembered for subsequent calls (biasing
 *      away from the broken transport, which is the point)
 *
 * We mock the browser APIs at a low level so each transport's success /
 * failure is independently controllable, mirroring how real blockers
 * selectively neutralize some APIs but not others.
 */

import { sendViaChain, _resetPreference, _currentPreference } from './orchestrator';

const originalFetch = global.fetch;
const originalXHR = global.XMLHttpRequest;
const originalImage = global.Image;

type XhrLike = {
    open: jest.Mock;
    setRequestHeader: jest.Mock;
    send: jest.Mock;
    withCredentials?: boolean;
    timeout?: number;
    status?: number;
    onload?: () => void;
    onerror?: () => void;
    ontimeout?: () => void;
    onabort?: () => void;
};

function makeXhrFactory(behaviour: 'ok' | 'error' | 'timeout'): () => XhrLike {
    return () => {
        const xhr: XhrLike = {
            open: jest.fn(),
            setRequestHeader: jest.fn(),
            send: jest.fn(() => {
                setTimeout(() => {
                    if (behaviour === 'ok') { xhr.status = 202; xhr.onload?.(); }
                    else if (behaviour === 'error') { xhr.onerror?.(); }
                    else { xhr.ontimeout?.(); }
                }, 0);
            }),
        };
        return xhr;
    };
}

function makeImageFactory(behaviour: 'load' | 'error'): any {
    return class {
        set src(_url: string) {
            setTimeout(() => {
                if (behaviour === 'load') (this as any).onload?.();
                else (this as any).onerror?.();
            }, 0);
        }
        onload?: () => void;
        onerror?: () => void;
    };
}

const ENDPOINT = 'https://jsonexport.com/_i/test/i';
// jsdom in some Node builds lacks a global TextEncoder; pull from node:util.
const { TextEncoder: NodeTextEncoder } = require('util');
const BODY = new NodeTextEncoder().encode('{"ping":1}');
const CT = 'application/json';

describe('transport orchestrator', () => {
    beforeEach(() => {
        _resetPreference();
    });
    afterEach(() => {
        global.fetch = originalFetch;
        global.XMLHttpRequest = originalXHR;
        global.Image = originalImage;
    });

    it('uses fetch-keepalive first and reports delivered on 202', async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 202 } as any);
        const res = await sendViaChain(ENDPOINT, BODY, CT);
        expect(res.delivered).toBe(true);
        expect(res.transport).toBe('fetch-keepalive');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('falls through to XHR when fetch rejects (simulated blocker)', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('blocked'));
        global.XMLHttpRequest = jest.fn().mockImplementation(makeXhrFactory('ok')) as any;
        const res = await sendViaChain(ENDPOINT, BODY, CT);
        expect(res.delivered).toBe(true);
        expect(res.transport).toBe('xhr-async');
        expect(res.attempts.length).toBe(2);
        expect(res.attempts[0].transport).toBe('fetch-keepalive');
        expect(res.attempts[0].result.delivered).toBe(false);
    });

    it('falls all the way through to image-pixel when fetch and XHR both fail', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('blocked'));
        global.XMLHttpRequest = jest.fn().mockImplementation(makeXhrFactory('error')) as any;
        global.Image = makeImageFactory('load') as any;
        const res = await sendViaChain(ENDPOINT, BODY, CT);
        expect(res.delivered).toBe(true);
        expect(res.transport).toBe('image-pixel');
        expect(res.attempts.length).toBe(3);
    });

    it('reports delivered=false and no winner when every transport fails', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('blocked'));
        global.XMLHttpRequest = jest.fn().mockImplementation(makeXhrFactory('error')) as any;
        global.Image = makeImageFactory('error') as any;
        const res = await sendViaChain(ENDPOINT, BODY, CT);
        expect(res.delivered).toBe(false);
        expect(res.transport).toBe('none');
        expect(_currentPreference()).toBeNull();
    });

    it('remembers the winning transport and skips earlier failed ones on next call', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('blocked'));
        global.XMLHttpRequest = jest.fn().mockImplementation(makeXhrFactory('ok')) as any;

        // First call: fetch fails, xhr wins
        const first = await sendViaChain(ENDPOINT, BODY, CT);
        expect(first.transport).toBe('xhr-async');
        expect(_currentPreference()).toBe('xhr-async');

        // Second call: should start at xhr (skip fetch) — fetch mock should NOT be called again
        (global.fetch as jest.Mock).mockClear();
        const second = await sendViaChain(ENDPOINT, BODY, CT);
        expect(second.transport).toBe('xhr-async');
        expect(global.fetch).not.toHaveBeenCalled();
    });
});
