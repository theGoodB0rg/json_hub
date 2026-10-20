import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivateForm } from './ActivateForm';
import { trackConversionEvent } from '@/lib/telemetry/conversion-events';
import { activateLicense } from '@/lib/license/activation';

jest.mock('@/lib/telemetry/conversion-events', () => ({ trackConversionEvent: jest.fn() }));
jest.mock('@/lib/license/activation', () => ({ activateLicense: jest.fn() }));
jest.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({ push: jest.fn() }),
}));

const tracked = trackConversionEvent as jest.Mock;
const activate = activateLicense as jest.Mock;

const KEY = 'ABCD-1234-EFGH-5678';

function submitKey(key = KEY) {
    render(<ActivateForm />);
    fireEvent.change(screen.getByLabelText(/License key/i), { target: { value: key } });
    fireEvent.click(screen.getByRole('button'));
}

describe('ActivateForm telemetry', () => {
    beforeEach(() => {
        tracked.mockClear();
        activate.mockReset();
    });

    it('records the attempt without anything about the key', async () => {
        activate.mockResolvedValue({ ok: true });
        submitKey();

        await waitFor(() => expect(tracked).toHaveBeenCalledWith('license_activation_started'));
        // No second argument at all: not the key, not its length.
        const call = tracked.mock.calls.find((c) => c[0] === 'license_activation_started')!;
        expect(call[1]).toBeUndefined();
    });

    it('records a success as license_activated, not as feedback', async () => {
        activate.mockResolvedValue({ ok: true, devicesUsed: 1, devicesAllowed: 3, email: 'jane@example.com' });
        submitKey();

        await waitFor(() => expect(tracked).toHaveBeenCalledWith('license_activated'));
        expect(tracked).not.toHaveBeenCalledWith('feedback_submitted', expect.anything());
    });

    it('never sends the buyer email that activation returns', async () => {
        activate.mockResolvedValue({ ok: true, email: 'jane@example.com' });
        submitKey();

        await waitFor(() => expect(tracked).toHaveBeenCalledWith('license_activated'));
        expect(JSON.stringify(tracked.mock.calls)).not.toMatch(/jane|example\.com/);
    });

    it('records a rejection with its reason code', async () => {
        activate.mockResolvedValue({ ok: false, error: 'max_uses_exceeded', message: 'too many' });
        submitKey();

        await waitFor(() =>
            expect(tracked).toHaveBeenCalledWith('license_activation_failed', { error_type: 'max_uses_exceeded' })
        );
    });

    it('collapses an unrecognised server message instead of forwarding it', async () => {
        activate.mockResolvedValue({ ok: false, error: 'Gumroad says key ABCD-1234 is bad', message: 'nope' });
        submitKey();

        await waitFor(() =>
            expect(tracked).toHaveBeenCalledWith('license_activation_failed', { error_type: 'unknown' })
        );
        expect(JSON.stringify(tracked.mock.calls)).not.toMatch(/Gumroad|ABCD/);
    });

    it('never puts the key itself into any event', async () => {
        activate.mockResolvedValue({ ok: false, error: 'invalid_license' });
        submitKey();

        await waitFor(() => expect(tracked).toHaveBeenCalledWith('license_activation_failed', expect.anything()));
        expect(JSON.stringify(tracked.mock.calls)).not.toMatch(/ABCD|1234|EFGH|5678/);
    });
});
