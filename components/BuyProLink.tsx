'use client';

import type { AnchorHTMLAttributes } from 'react';
import { trackConversionEvent } from '@/lib/telemetry/conversion-events';

/** Gumroad checkout for JsonExport Pro. `src` attributes the sale in Gumroad. */
export function checkoutUrl(source: string): string {
    return `https://pro.jsonexport.com/l/json_hub?src=${encodeURIComponent(source)}`;
}

/**
 * Records a click on any "buy Pro" link as `checkout_clicked`.
 *
 * The D1 `events` table has no free-form payload column, so the source is
 * sent as `format` — the only text column that survives ingestion. The
 * analytics report reads it back from there.
 */
export function trackCheckoutClick(source: string) {
    trackConversionEvent('checkout_clicked', { format: source });
}

interface BuyProLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
    /** Where the link lives, e.g. `desktop_hero`. Used for Gumroad `src` and telemetry. */
    source: string;
}

export function BuyProLink({ source, onClick, children, ...rest }: BuyProLinkProps) {
    return (
        <a
            href={checkoutUrl(source)}
            target="_blank"
            rel="noopener noreferrer"
            {...rest}
            onClick={(e) => {
                trackCheckoutClick(source);
                onClick?.(e);
            }}
        >
            {children}
        </a>
    );
}
