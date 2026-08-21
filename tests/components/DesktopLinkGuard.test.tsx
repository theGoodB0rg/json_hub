import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { DesktopLinkGuard } from '@/components/DesktopLinkGuard';
import { platformAdapter } from '@/lib/platform';

describe('DesktopLinkGuard', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('does nothing when in web environment', () => {
        jest.spyOn(platformAdapter, 'isDesktopEnvironment').mockReturnValue(false);

        const { container } = render(
            <div>
                <DesktopLinkGuard />
                <a href="https://example.com" data-testid="link">External</a>
            </div>
        );

        const link = container.querySelector('[data-testid="link"]') as HTMLAnchorElement;
        const defaultPrevented = !fireEvent.click(link);
        expect(defaultPrevented).toBe(false);
    });

    test('intercepts external https link in desktop mode and calls openExternalUrl', () => {
        jest.spyOn(platformAdapter, 'isDesktopEnvironment').mockReturnValue(true);

        const mockOpenExternal = jest.fn();
        jest.spyOn(platformAdapter, 'getEngine').mockReturnValue({
            isDesktop: true,
            getEnvironmentInfo: jest.fn(),
            openExternalUrl: mockOpenExternal,
        } as any);

        const { container } = render(
            <div>
                <DesktopLinkGuard />
                <a href="https://github.com/theGoodB0rg/json_hub" data-testid="ext-link">GitHub</a>
            </div>
        );

        const link = container.querySelector('[data-testid="ext-link"]') as HTMLAnchorElement;
        fireEvent.click(link);

        expect(mockOpenExternal).toHaveBeenCalledWith('https://github.com/theGoodB0rg/json_hub');
    });

    test('intercepts target="_blank" links in desktop mode', () => {
        jest.spyOn(platformAdapter, 'isDesktopEnvironment').mockReturnValue(true);

        const mockOpenExternal = jest.fn();
        jest.spyOn(platformAdapter, 'getEngine').mockReturnValue({
            isDesktop: true,
            getEnvironmentInfo: jest.fn(),
            openExternalUrl: mockOpenExternal,
        } as any);

        const { container } = render(
            <div>
                <DesktopLinkGuard />
                <a href="/guide" target="_blank" data-testid="blank-link">Guide</a>
            </div>
        );

        const link = container.querySelector('[data-testid="blank-link"]') as HTMLAnchorElement;
        fireEvent.click(link);

        expect(mockOpenExternal).toHaveBeenCalled();
    });

    test('intercepts raw file asset links like .xml or .pdf in desktop mode', () => {
        jest.spyOn(platformAdapter, 'isDesktopEnvironment').mockReturnValue(true);

        const mockOpenExternal = jest.fn();
        jest.spyOn(platformAdapter, 'getEngine').mockReturnValue({
            isDesktop: true,
            getEnvironmentInfo: jest.fn(),
            openExternalUrl: mockOpenExternal,
        } as any);

        const { container } = render(
            <div>
                <DesktopLinkGuard />
                <a href="/sitemap.xml" data-testid="xml-link">Sitemap XML</a>
            </div>
        );

        const link = container.querySelector('[data-testid="xml-link"]') as HTMLAnchorElement;
        fireEvent.click(link);

        expect(mockOpenExternal).toHaveBeenCalled();
    });

    test('allows internal SPA navigation without interception in desktop mode', () => {
        jest.spyOn(platformAdapter, 'isDesktopEnvironment').mockReturnValue(true);

        const mockOpenExternal = jest.fn();
        jest.spyOn(platformAdapter, 'getEngine').mockReturnValue({
            isDesktop: true,
            getEnvironmentInfo: jest.fn(),
            openExternalUrl: mockOpenExternal,
        } as any);

        const { container } = render(
            <div>
                <DesktopLinkGuard />
                <a href="/converters" data-testid="spa-link">Converters</a>
            </div>
        );

        const link = container.querySelector('[data-testid="spa-link"]') as HTMLAnchorElement;
        fireEvent.click(link);

        expect(mockOpenExternal).not.toHaveBeenCalled();
    });
});
