export interface AppState {
    // Input State
    rawInput: string;
    isParsed: boolean;
    parseErrors: ParseError[];

    // Processed Data
    parsedData: any;
    flatData: Record<string, any>[];
    schema: string[];

    // UI State
    activeTab: 'input' | 'preview' | 'export';
    selectedFormat: 'csv' | 'xlsx' | 'docx' | 'html' | 'zip';
    isLoading: boolean;
    downloadProgress: number;

    // Configuration
    prettyPrint: boolean;
    rowLimit: number;
    fileSizeLimit: number;

    // Project Management
    currentProjectId: string | null;
    projectName: string | null;
    lastSaved: number | null;
    savedProjects: any[]; // Using list type from db

    // Actions
    setRawInput: (input: string) => void;
    parseInput: () => void;
    flattenData: () => void;
    updateCell: (rowIndex: number, column: string, value: any) => void;
    exportData: (format: ExportFormat) => Promise<void>;
    resetState: () => void;
    setActiveTab: (tab: 'input' | 'preview' | 'export') => void;
    setSelectedFormat: (format: ExportFormat) => void;
    setPrettyPrint: (value: boolean) => void;

    // Project Actions
    loadProjectsList: () => Promise<void>;
    saveCurrentProject: (name: string) => Promise<void>;
    loadProject: (id: string) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    createNewProject: () => void;
}

export interface ParseError {
    message: string;
    line?: number;
    column?: number;
}

export type ExportFormat = 'csv' | 'xlsx' | 'docx' | 'html' | 'zip';
