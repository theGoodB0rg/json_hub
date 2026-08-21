'use client';

import { useEffect } from 'react';
import { platformAdapter } from '@/lib/platform';

/**
 * Global Link Guard that intercepts external links and non-SPA asset navigations
 * in desktop mode, delegating them directly to the system browser (open_external_url)
 * so the chromeless Tauri WebView window is never hijacked or stuck in dead-ends.
 */
export function DesktopLinkGuard() {
    useEffect(() => {
        if (!platformAdapter.isDesktopEnvironment()) {
            return;
        }

        const handleDocumentClick = (event: MouseEvent) => {
            // Only handle standard left clicks without modifier keys
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }

            const target = event.target as HTMLElement | null;
            if (!target) return;

            const anchor = target.closest('a');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
                return;
            }

            const isExternalProtocol = /^https?:\/\//i.test(href) || /^mailto:/i.test(href);
            const isBlankTarget = anchor.getAttribute('target') === '_blank';
            const isRawFileAsset = /\.(xml|pdf|zip|exe|msi|gz|tar)$/i.test(href);

            if (isExternalProtocol || isBlankTarget || isRawFileAsset) {
                event.preventDefault();
                event.stopPropagation();

                const fullUrl = isExternalProtocol 
                    ? href 
                    : new URL(href, window.location.href).toString();

                const engine = platformAdapter.getEngine();
                if (engine.openExternalUrl) {
                    engine.openExternalUrl(fullUrl);
                } else {
                    window.open(fullUrl, '_blank', 'noopener,noreferrer');
                }
            }
        };

        document.addEventListener('click', handleDocumentClick, true);

        return () => {
            document.removeEventListener('click', handleDocumentClick, true);
        };
    }, []);

    return null;
}
