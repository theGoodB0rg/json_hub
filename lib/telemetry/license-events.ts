/**
 * Telemetry vocabulary for license activation.
 *
 * Two constraints shape this file.
 *
 * 1. Nothing about the key may leave the browser. Not the key, not a hash,
 *    not its length — a length is a free oracle for anyone reading the table
 *    and buys us no analysis we would ever act on. The only thing we send is
 *    *why* an activation failed, drawn from the closed set below.
 *
 * 2. The failure code cannot be forwarded verbatim. `activateLicense` fills
 *    `error` from the worker's JSON (`body.error`) or from `http_<status>`,
 *    so its value is whatever the server said — including free text with
 *    spaces such as "license_key and device_id required". Sending that
 *    straight to D1 would put an unbounded server-controlled string in the
 *    analytics table and make the reason column impossible to group by.
 *    classifyActivationFailure maps it onto a fixed enum and answers
 *    'unknown' for anything it does not recognise.
 */

export type LicenseFailureReason =
    /** Gumroad does not know this key — typo, or never purchased. */
    | 'invalid_license'
    /** Refunded or disabled after purchase. */
    | 'license_revoked'
    /** Already on the maximum number of devices. */
    | 'max_uses_exceeded'
    /** Submitted with an empty box; never reaches the worker. */
    | 'empty_key'
    /** The request never completed — offline, blocked, DNS, CORS. */
    | 'network'
    /** The worker rejected the shape of the request (400). */
    | 'bad_request'
    /** Route missing or worker not deployed (404/405). */
    | 'not_found'
    /** The worker threw (5xx). A paying customer is blocked by us. */
    | 'server_error'
    /** Recognised as a failure, but not as any reason above. */
    | 'unknown';

const EXACT: Record<string, LicenseFailureReason> = {
    invalid_license: 'invalid_license',
    license_revoked: 'license_revoked',
    max_uses_exceeded: 'max_uses_exceeded',
    empty_key: 'empty_key',
    network: 'network',
    internal: 'server_error',
    not_found: 'not_found',
};

/** `http_<status>` from activateLicense when the worker sent no code. */
const HTTP_CODE = /^http_(\d{3})$/;

export function classifyActivationFailure(code: string | undefined | null): LicenseFailureReason {
    if (!code) return 'unknown';
    const normalized = String(code).trim().toLowerCase();

    const exact = EXACT[normalized];
    if (exact) return exact;

    const http = HTTP_CODE.exec(normalized);
    if (http) {
        const status = Number(http[1]);
        if (status === 404 || status === 405) return 'not_found';
        if (status >= 500) return 'server_error';
        if (status >= 400) return 'bad_request';
        return 'unknown';
    }

    // The worker's 400 branch answers with a sentence, not a code.
    if (normalized.includes('required')) return 'bad_request';

    return 'unknown';
}

/**
 * The payload for a failed activation. Deliberately tiny: an enum and
 * nothing else. Returning a typed object rather than letting each call site
 * assemble one is what keeps a future `key` or `email` field from being
 * added here by reflex — D1 would drop an unknown field today, but the local
 * event log in localStorage keeps whatever it is given.
 */
export function activationFailurePayload(code: string | undefined | null) {
    return { error_type: classifyActivationFailure(code) } as const;
}
