import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JiraChangelogNotice } from './JiraChangelogNotice';

describe('JiraChangelogNotice', () => {
    it('renders nothing when the changelog is present', () => {
        const { container } = render(<JiraChangelogNotice status="present" />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing for non-Jira payloads', () => {
        const { container } = render(<JiraChangelogNotice status={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('tells the user how to re-export when the changelog key is missing', () => {
        render(<JiraChangelogNotice status="missing" />);
        expect(screen.getByRole('status')).toHaveTextContent(/expand=changelog/);
    });

    it('says the audit trail is empty when no changes are recorded', () => {
        render(<JiraChangelogNotice status="empty" />);
        expect(screen.getByRole('status')).toHaveTextContent(/zero changes/);
    });
});
