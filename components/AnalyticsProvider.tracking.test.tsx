/** @jest-environment jsdom */
import { render, fireEvent } from '@testing-library/react';

const tracked: Array<{ name: string; payload: Record<string, unknown> }> = [];
let mockPath = '/blog/some-post';
jest.mock('next/navigation', () => ({ usePathname: () => mockPath }));
jest.mock('@/lib/telemetry/conversion-events', () => ({
    trackConversionEvent: (name: string, payload: Record<string, unknown>) => tracked.push({ name, payload }),
}));
jest.mock('@/lib/analytics', () => ({
    ensureClientInfo: jest.fn(), ensureSession: jest.fn(), trackPageView: jest.fn(), trackFunnelStep: jest.fn(),
}));
jest.mock('./PostExportUpsell', () => ({ PostExportUpsell: () => null }));
jest.mock('@/lib/license/activation', () => ({ verifyCachedLicense: jest.fn() }));

import { AnalyticsProvider } from './AnalyticsProvider';

const pageViews = () => tracked.filter((t) => t.name === 'page_view');

describe('AnalyticsProvider tracking', () => {
    beforeEach(() => { tracked.length = 0; mockPath = '/blog/some-post'; });

    it('REGRESSION: in-app navigation reports the previous page as referrer', () => {
        const { rerender } = render(<AnalyticsProvider><div /></AnalyticsProvider>);
        expect(pageViews()[0].payload.referrer).toBeUndefined(); // first load keeps document.referrer

        mockPath = '/json-to-excel';
        rerender(<AnalyticsProvider><div /></AnalyticsProvider>);
        expect(pageViews()[1].payload).toEqual({
            path: '/json-to-excel',
            referrer: `${window.location.origin}/blog/some-post`,
        });
    });

    it('sends only the data-track key of a clicked control', () => {
        const { getByText } = render(
            <AnalyticsProvider>
                <button data-track="upload"><span>Upload my secret.json</span></button>
                <button>untracked</button>
            </AnalyticsProvider>,
        );
        fireEvent.click(getByText('Upload my secret.json'));
        fireEvent.click(getByText('untracked'));
        const ui = tracked.filter((t) => t.name === 'ui_interaction');
        expect(ui).toEqual([{ name: 'ui_interaction', payload: { format: 'upload' } }]);
    });
});
