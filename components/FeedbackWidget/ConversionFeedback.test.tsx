import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConversionFeedback } from './ConversionFeedback';
import * as telemetry from '@/lib/telemetry/conversion-events';

jest.mock('@/lib/telemetry/conversion-events', () => ({
    sendUserFeedback: jest.fn().mockResolvedValue(undefined),
}));

describe('ConversionFeedback Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders initial prompt with thumbs up and thumbs down buttons', () => {
        render(<ConversionFeedback platform="trello" format="xlsx" />);
        expect(screen.getByText(/did your spreadsheet export cleanly/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /looks great/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /formatting broken/i })).toBeInTheDocument();
    });

    it('submits positive rating immediately when thumbs up is clicked', async () => {
        render(<ConversionFeedback platform="trello" format="xlsx" />);
        fireEvent.click(screen.getByRole('button', { name: /looks great/i }));

        await waitFor(() => {
            expect(telemetry.sendUserFeedback).toHaveBeenCalledWith(
                expect.objectContaining({
                    rating: 'positive',
                    platform: 'trello',
                    format: 'xlsx',
                })
            );
        });

        expect(screen.getByText(/thank you for the feedback/i)).toBeInTheDocument();
    });

    it('expands comment input on negative rating and submits user note', async () => {
        render(<ConversionFeedback platform="jira" format="csv" />);
        fireEvent.click(screen.getByRole('button', { name: /formatting broken/i }));

        await waitFor(() => {
            expect(telemetry.sendUserFeedback).toHaveBeenCalledWith(
                expect.objectContaining({
                    rating: 'negative',
                    platform: 'jira',
                    format: 'csv',
                })
            );
        });

        expect(screen.getByPlaceholderText(/what went wrong/i)).toBeInTheDocument();

        const input = screen.getByPlaceholderText(/what went wrong/i);
        fireEvent.change(input, { target: { value: 'Changelog author is missing' } });
        fireEvent.click(screen.getByRole('button', { name: /send note/i }));

        await waitFor(() => {
            expect(telemetry.sendUserFeedback).toHaveBeenCalledWith(
                expect.objectContaining({
                    rating: 'negative',
                    comment: 'Changelog author is missing',
                    platform: 'jira',
                    format: 'csv',
                })
            );
        });

        expect(screen.getByText(/thank you for helping us improve/i)).toBeInTheDocument();
    });
});
