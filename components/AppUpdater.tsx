'use client';

import React, { useEffect, useState } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export default function AppUpdater() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run in Tauri environment
    if (typeof window !== 'undefined' && window.__TAURI_INTERNALS__) {
      checkForUpdates();
    }
  }, []);

  const checkForUpdates = async () => {
    try {
      const availableUpdate = await check();
      if (availableUpdate) {
        setUpdate(availableUpdate);
      }
    } catch (err) {
      console.error('Failed to check for updates:', err);
    }
  };

  const handleUpdate = async () => {
    if (!update) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            console.log(`started downloading ${contentLength} bytes`);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            console.log(`downloaded ${downloaded} from ${contentLength}`);
            break;
          case 'Finished':
            console.log('download finished');
            break;
        }
      });
      
      await relaunch();
    } catch (err: any) {
      console.error('Update failed:', err);
      setError(err.toString());
      setIsUpdating(false);
    }
  };

  if (!update) {
    return null; // Render nothing if no update is available
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-primary text-primary-foreground rounded-lg shadow-lg max-w-sm border border-border/50 animate-in slide-in-from-bottom-5">
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-sm">Update Available</h3>
        <p className="text-xs opacity-90">
          A new version ({update.version}) is available!
        </p>
        
        {error && (
          <p className="text-xs text-destructive font-semibold mt-1">Failed: {error}</p>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <button 
            onClick={() => setUpdate(null)} 
            className="text-xs px-3 py-1.5 rounded hover:bg-black/10 transition-colors"
            disabled={isUpdating}
          >
            Later
          </button>
          <button 
            onClick={handleUpdate} 
            className="text-xs px-3 py-1.5 bg-background text-foreground rounded font-medium hover:opacity-90 transition-opacity flex items-center justify-center min-w-[90px]"
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
