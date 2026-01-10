import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ConversionRecord {
    id: string;
    timestamp: number;
    fileName: string;
    originalJSON: string;
    exportFormat: 'csv' | 'xlsx' | 'html' | 'zip';
    exportMode: 'flat' | 'relational';
    rowCount: number;
}

interface ConversionDB extends DBSchema {
    conversions: {
        key: string;
        value: ConversionRecord;
        indexes: { 'by-timestamp': number };
    };
}

class ConversionHistoryStore {
    private db: IDBPDatabase<ConversionDB> | null = null;
    private readonly DB_NAME = 'json-hub-history';
    private readonly DB_VERSION = 1;
    private readonly MAX_RECORDS = 10;

    async init() {
        if (this.db) return;

        this.db = await openDB<ConversionDB>(this.DB_NAME, this.DB_VERSION, {
            upgrade(db) {
                const store = db.createObjectStore('conversions', { keyPath: 'id' });
                store.createIndex('by-timestamp', 'timestamp');
            },
        });
    }

    async saveConversion(record: Omit<ConversionRecord, 'id' | 'timestamp'>) {
        await this.init();

        const id = crypto.randomUUID();
        const timestamp = Date.now();

        await this.db!.add('conversions', { id, timestamp, ...record });

        // Keep only last 10 conversions
        await this.pruneOldConversions();

        return id;
    }

    async getRecentConversions(limit = 10): Promise<ConversionRecord[]> {
        await this.init();

        const tx = this.db!.transaction('conversions', 'readonly');
        const index = tx.store.index('by-timestamp');

        const records = await index.getAll();
        return records.reverse().slice(0, limit);
    }

    async getConversion(id: string): Promise<ConversionRecord | undefined> {
        await this.init();
        return await this.db!.get('conversions', id);
    }

    async deleteConversion(id: string) {
        await this.init();
        await this.db!.delete('conversions', id);
    }

    async clearAll() {
        await this.init();
        await this.db!.clear('conversions');
    }

    private async pruneOldConversions() {
        const all = await this.getRecentConversions(100);
        if (all.length > this.MAX_RECORDS) {
            const toDelete = all.slice(this.MAX_RECORDS);
            for (const record of toDelete) {
                await this.deleteConversion(record.id);
            }
        }
    }
}

export const conversionHistory = new ConversionHistoryStore();
export type { ConversionRecord };
