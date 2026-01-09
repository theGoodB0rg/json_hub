
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface JSONHubDB extends DBSchema {
    projects: {
        key: string;
        value: {
            id: string;
            name: string;
            createdAt: number;
            updatedAt: number;
            data: {
                rawInput: string;
                isParsed: boolean;
                parseErrors: any[];
                parsedData: any;
                flatData: any[];
                schema: string[];
                selectedFormat: string;
            };
        };
        indexes: { 'by-date': number };
    };
}

const DB_NAME = 'json-hub-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<JSONHubDB>>;

export const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<JSONHubDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                const store = db.createObjectStore('projects', {
                    keyPath: 'id',
                });
                store.createIndex('by-date', 'updatedAt');
            },
        });
    }
    return dbPromise;
};

export interface SavedProject {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    data: any; // Full app state snapshot
}

export const projectService = {
    async saveProject(project: SavedProject) {
        const db = await getDB();
        await db.put('projects', project);
        return project;
    },

    async getProjects(): Promise<SavedProject[]> {
        const db = await getDB();
        return db.getAllFromIndex('projects', 'by-date');
    },

    async getProject(id: string): Promise<SavedProject | undefined> {
        const db = await getDB();
        return db.get('projects', id);
    },

    async deleteProject(id: string) {
        const db = await getDB();
        await db.delete('projects', id);
    },
};
