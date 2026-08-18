import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AppUpdater from './AppUpdater';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

// Mock Tauri API and UI Toast
jest.mock('@tauri-apps/plugin-updater', () => ({
  check: jest.fn(),
}));
jest.mock('@tauri-apps/plugin-process', () => ({
  relaunch: jest.fn(),
}));

describe('AppUpdater Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).__TAURI_INTERNALS__ = true;
  });

  it('renders nothing and does not crash when no update is available', async () => {
    (check as jest.Mock).mockResolvedValue(null);
    render(<AppUpdater />);
    
    // Check is called on mount
    await waitFor(() => {
      expect(check).toHaveBeenCalledTimes(1);
    });

    // We shouldn't see the update banner
    expect(screen.queryByText(/Update Available/i)).not.toBeInTheDocument();
  });

  it('renders the update banner when an update is available', async () => {
    const mockUpdate = {
      version: '1.2.0',
      date: '2026-08-16',
      body: 'Bug fixes and improvements',
      downloadAndInstall: jest.fn(),
    };
    (check as jest.Mock).mockResolvedValue(mockUpdate);
    
    render(<AppUpdater />);
    
    await waitFor(() => {
      expect(screen.getByText(/A new version \(1\.2\.0\) is available!/i)).toBeInTheDocument();
    });
  });

  it('calls downloadAndInstall and relaunches on "Update Now" click', async () => {
    const mockUpdate = {
      version: '1.2.0',
      downloadAndInstall: jest.fn().mockImplementation((onEvent) => {
        onEvent({ event: 'Finished' });
        return Promise.resolve();
      }),
    };
    (check as jest.Mock).mockResolvedValue(mockUpdate);
    
    render(<AppUpdater />);
    
    const updateBtn = await screen.findByRole('button', { name: /Update Now/i });
    fireEvent.click(updateBtn);
    
    await waitFor(() => {
      expect(mockUpdate.downloadAndInstall).toHaveBeenCalledTimes(1);
      expect(relaunch).toHaveBeenCalledTimes(1);
    });
  });
});
