import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrandIcon, normalizePlatformKey, BRAND_COLORS } from '@/components/ui/BrandIcon';
import { converterPages } from '@/lib/platform-data';
import { conversionMatrix } from '@/lib/content-matrix/matrix';

describe('BrandIcon Component & Registry', () => {
    it('normalizes platform names correctly', () => {
        expect(normalizePlatformKey('Stripe')).toBe('stripe');
        expect(normalizePlatformKey('Shopify')).toBe('shopify');
        expect(normalizePlatformKey('Salesforce CRM')).toBe('salesforce');
        expect(normalizePlatformKey('HubSpot')).toBe('hubspot');
        expect(normalizePlatformKey('Jira Software')).toBe('jira');
        expect(normalizePlatformKey('QuickBooks')).toBe('quickbooks');
        expect(normalizePlatformKey('Mixpanel')).toBe('mixpanel');
        expect(normalizePlatformKey('Amplitude')).toBe('amplitude');
        expect(normalizePlatformKey('CSV')).toBe('csv');
        expect(normalizePlatformKey('XML')).toBe('xml');
        expect(normalizePlatformKey('Excel')).toBe('excel');
        expect(normalizePlatformKey('JSON')).toBe('json');
    });

    it('renders vector SVG for core platforms', () => {
        const platforms = [
            'stripe',
            'shopify',
            'salesforce',
            'hubspot',
            'jira',
            'trello',
            'asana',
            'quickbooks',
            'xero',
            'slack',
            'discord',
            'mongodb',
            'postgresql',
            'youtube',
            'mixpanel',
            'amplitude',
        ];

        platforms.forEach((platform) => {
            const { container } = render(<BrandIcon platform={platform} />);
            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();
            expect(svg).toHaveAttribute('viewBox');
        });
    });

    it('renders vector SVG for all file formats', () => {
        const formats: ('json' | 'csv' | 'xml' | 'excel' | 'xlsx')[] = ['json', 'csv', 'xml', 'excel', 'xlsx'];

        formats.forEach((format) => {
            const { container } = render(<BrandIcon format={format} />);
            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();
            expect(svg).toHaveAttribute('viewBox');
        });
    });

    it('renders every platform in platform-data without throwing', () => {
        converterPages.forEach((page) => {
            const { container } = render(<BrandIcon platform={page.platformName} />);
            expect(container.firstChild).toBeInTheDocument();
        });
    });

    it('renders every matrix item format without throwing', () => {
        conversionMatrix.forEach((item) => {
            const { container } = render(
                <BrandIcon platform={item.platformName} format={item.sourceFormat} />
            );
            expect(container.firstChild).toBeInTheDocument();
        });
    });

    it('renders deterministic branded monogram fallback for obscure/custom platforms', () => {
        const { container } = render(<BrandIcon platform="CustomPlatform123" />);
        expect(container.textContent).toContain('CU');
        expect(container.firstChild).toHaveClass('rounded-lg');
    });
});
