interface UserPreferences {
    exportFormat: 'csv' | 'xlsx' | 'html';
    exportMode: 'flat' | 'relational';
    dontAskExportMode: boolean;
}

const STORAGE_KEY = 'json-hub-preferences';

function getDefaults(): UserPreferences {
    return {
        exportFormat: 'xlsx',
        exportMode: 'flat',
        dontAskExportMode: false,
    };
}

export const preferences = {
    get(): UserPreferences {
        if (typeof window === 'undefined') return getDefaults();

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? { ...getDefaults(), ...JSON.parse(stored) } : getDefaults();
        } catch (error) {
            console.error('Failed to load preferences:', error);
            return getDefaults();
        }
    },

    set(prefs: Partial<UserPreferences>) {
        if (typeof window === 'undefined') return;

        try {
            const current = this.get();
            const updated = { ...current, ...prefs };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    },

    reset() {
        if (typeof window === 'undefined') return;

        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Failed to reset preferences:', error);
        }
    },
};

export type { UserPreferences };
