import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestDataActions } from './TestDataActions';
import { trackConversionEvent } from '@/lib/telemetry/conversion-events';

jest.mock('@/lib/telemetry/conversion-events', () => ({
    trackConversionEvent: jest.fn(),
}));

const tracked = trackConversionEvent as jest.Mock;

const props = {
    jsonString: '{"a":1}',
    fileName: 'sample',
    converterHref: '/converters/nested-arrays-to-excel',
    platform: 'Generic',
};

describe('TestDataActions telemetry', () => {
    beforeEach(() => {
        tracked.mockClear();
        sessionStorage.clear();
    });

    it('records a download with the dataset and its size', () => {
        // jsdom has no real download; the anchor click is a no-op.
        global.URL.createObjectURL = jest.fn(() => 'blob:x');
        global.URL.revokeObjectURL = jest.fn();

        render(<TestDataActions {...props} />);
        fireEvent.click(screen.getByText(/Download \.json/i));

        expect(tracked).toHaveBeenCalledWith('sample_downloaded', {
            platform: 'Generic',
            format: 'json',
            file_size_bytes: props.jsonString.length,
            is_sample: true,
        });
    });

    it('records a copy only once the clipboard accepted it', async () => {
        Object.assign(navigator, {
            clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
        });

        render(<TestDataActions {...props} />);
        fireEvent.click(screen.getByText(/Copy JSON/i));

        await waitFor(() => expect(tracked).toHaveBeenCalledWith('sample_copied', expect.any(Object)));
    });

    it('does NOT record a copy the browser refused', async () => {
        Object.assign(navigator, {
            clipboard: { writeText: jest.fn().mockRejectedValue(new Error('denied')) },
        });

        render(<TestDataActions {...props} />);
        fireEvent.click(screen.getByText(/Copy JSON/i));

        await waitFor(() => expect(screen.getByText(/Copy JSON/i)).toBeInTheDocument());
        expect(tracked).not.toHaveBeenCalledWith('sample_copied', expect.any(Object));
    });

    it('records the converter bridge click and still seeds the payload', () => {
        render(<TestDataActions {...props} />);
        fireEvent.click(screen.getByText(/Convert Generic to Excel Online/i));

        expect(tracked).toHaveBeenCalledWith('converter_bridge_clicked', expect.objectContaining({
            platform: 'Generic',
        }));
        expect(sessionStorage.getItem('jsonexport_seed_payload')).toBe(props.jsonString);
    });

    it('still records the bridge click when sessionStorage throws', () => {
        const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });

        render(<TestDataActions {...props} />);
        expect(() => fireEvent.click(screen.getByText(/Convert Generic to Excel Online/i))).not.toThrow();
        expect(tracked).toHaveBeenCalledWith('converter_bridge_clicked', expect.any(Object));

        setItem.mockRestore();
    });
});
