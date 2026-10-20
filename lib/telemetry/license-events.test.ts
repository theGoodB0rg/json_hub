import { classifyActivationFailure, activationFailurePayload } from './license-events';

describe('classifyActivationFailure', () => {
    it.each([
        ['invalid_license', 'invalid_license'],
        ['license_revoked', 'license_revoked'],
        ['max_uses_exceeded', 'max_uses_exceeded'],
        ['empty_key', 'empty_key'],
        ['network', 'network'],
        ['internal', 'server_error'],
        ['not_found', 'not_found'],
    ])('maps the worker code %s', (code, expected) => {
        expect(classifyActivationFailure(code)).toBe(expected);
    });

    it.each([
        ['http_400', 'bad_request'],
        ['http_403', 'bad_request'],
        ['http_404', 'not_found'],
        ['http_405', 'not_found'],
        ['http_500', 'server_error'],
        ['http_503', 'server_error'],
    ])('maps the synthesised code %s', (code, expected) => {
        expect(classifyActivationFailure(code)).toBe(expected);
    });

    it('maps the worker 400 branch, which answers with a sentence not a code', () => {
        expect(classifyActivationFailure('license_key and device_id required')).toBe('bad_request');
    });

    it('is case and whitespace insensitive', () => {
        expect(classifyActivationFailure('  INVALID_LICENSE  ')).toBe('invalid_license');
    });

    it.each([undefined, null, ''])('answers unknown for %s', (code) => {
        expect(classifyActivationFailure(code)).toBe('unknown');
    });

    // The point of the enum: `error` is whatever the server said, so an
    // unrecognised value must collapse to 'unknown' rather than travel.
    it.each([
        'Gumroad HTTP 404: seller not found',
        'key ABCD-1234-EFGH-5678 rejected',
        'user jane@example.com is not licensed',
        '<script>alert(1)</script>',
        'x'.repeat(5000),
    ])('never passes through unrecognised server text', (code) => {
        expect(classifyActivationFailure(code)).toBe('unknown');
    });
});

describe('activationFailurePayload', () => {
    it('carries the reason and nothing else', () => {
        const payload = activationFailurePayload('invalid_license');
        expect(payload).toEqual({ error_type: 'invalid_license' });
        expect(Object.keys(payload)).toHaveLength(1);
    });

    it('cannot leak a key, an email or a message even when one is in the code', () => {
        const payload = activationFailurePayload('key ABCD-1234 for jane@example.com rejected');
        const serialized = JSON.stringify(payload);
        expect(serialized).not.toMatch(/ABCD|1234|jane|example\.com/);
        expect(payload.error_type).toBe('unknown');
    });
});
