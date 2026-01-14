import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { validateAndParse } from '@/lib/parsers/smartParse';
import { flattenJSON } from '@/lib/parsers/flattener';
import { smartUnwrap } from '@/lib/parsers/unwrapper';
import type { AppState, ParseError, ExportFormat } from '@/types/store.types';

const initialState = {
    // Input State
    // Input State
    rawInput: '',
    isParsed: false,
    parseErrors: [] as ParseError[],
    sourceFilename: null as string | null,

    // Processed Data
    parsedData: null,
    flatData: [] as Record<string, any>[],
    schema: [] as string[],

    // UI State
    activeTab: 'input' as const,
    selectedFormat: 'xlsx' as ExportFormat,
    viewMode: 'flat' as const,
    isLoading: false,
    downloadProgress: 0,

    // Configuration
    prettyPrint: true,
    rowLimit: 100000, // Max rows to display for performance
    fileSizeLimit: 50 * 1024 * 1024, // Increased to 50MB
    exportSettings: {
        structure: 'flat' as const,
        askForPreference: true,
    },

    // Project State
    currentProjectId: null,
    projectName: null,
    lastSaved: null,
    savedProjects: [],

    // Internal
    worker: null as Worker | null,
};

export const useAppStore = create<AppState>()(
    persist(
        devtools(
            (set, get) => ({
                ...initialState,

                initWorker: () => {
                    if (typeof window === 'undefined' || get().worker) return;

                    const worker = new Worker(new URL('../workers/parser.worker.ts', import.meta.url));

                    worker.onmessage = (event) => {
                        const { type, payload } = event.data;
                        const state = get();

                        if (type === 'PARSE_SUCCESS') {
                            set({
                                parsedData: payload,
                                isParsed: true,
                                parseErrors: [],
                                isLoading: false,
                            });
                            // Trigger flatten after parse
                            get().flattenData();
                        } else if (type === 'PARSE_ERROR') {
                            set({
                                parsedData: null,
                                isParsed: false,
                                parseErrors: payload,
                                flatData: [],
                                schema: [],
                                isLoading: false,
                            });
                        } else if (type === 'FLATTEN_SUCCESS') {
                            set({
                                flatData: payload.rows,
                                schema: payload.schema,
                                isLoading: false,
                            });
                        } else if (type === 'ERROR') {
                            set({
                                isLoading: false,
                                parseErrors: payload
                            });
                        }
                    };

                    set({ worker });
                },

                // Set raw input
                setRawInput: (input: string) => {
                    set({ rawInput: input, isParsed: false, parseErrors: [] });
                },

                setSourceFilename: (name: string | null) => {
                    set({ sourceFilename: name });
                },

                // Parse the raw input
                parseInput: () => {
                    const { rawInput, worker } = get();
                    set({ isLoading: true });

                    if (worker) {
                        worker.postMessage({ type: 'PARSE', payload: rawInput });
                    } else {
                        // Fallback if worker not ready (shouldn't happen if initialized)
                        console.warn('Worker not ready, processing on main thread');
                        try {
                            const result = validateAndParse(rawInput);
                            if (result.success) {
                                set({ parsedData: result.data, isParsed: true, parseErrors: [], isLoading: false });
                                get().flattenData();
                            } else {
                                set({ parsedData: null, isParsed: false, parseErrors: result.errors || [], flatData: [], schema: [], isLoading: false });
                            }
                        } catch (e) {
                            set({ isLoading: false, parseErrors: [{ message: String(e) }] });
                        }
                    }
                },

                // Flatten the parsed data
                flattenData: () => {
                    const { parsedData, worker, exportSettings } = get();
                    if (!parsedData) return;

                    set({ isLoading: true });

                    if (worker) {
                        const mode = exportSettings.structure === 'nested' ? 'relational' : 'flat';
                        worker.postMessage({ type: 'FLATTEN', payload: { data: parsedData, mode } });
                    } else {
                        // Fallback
                        try {
                            const { smartUnwrap } = require('@/lib/parsers/unwrapper');
                            const { data: dataToFlatten } = smartUnwrap(parsedData);
                            const result = flattenJSON(dataToFlatten);
                            set({ flatData: result.rows, schema: result.schema, isLoading: false });
                        } catch (error) {
                            set({ isLoading: false, parseErrors: [{ message: String(error) }] });
                        }
                    }
                },

                // Update a cell value in the flat data
                updateCell: (rowIndex: number, column: string, value: any) => {
                    const { flatData } = get();

                    if (rowIndex < 0 || rowIndex >= flatData.length) {
                        return;
                    }

                    const newFlatData = [...flatData];
                    newFlatData[rowIndex] = {
                        ...newFlatData[rowIndex],
                        [column]: value,
                    };

                    set({ flatData: newFlatData });
                },

                // Export data
                exportData: async (format: ExportFormat) => {
                    const { parsedData, exportSettings, rawInput, sourceFilename } = get();

                    if (!parsedData) {
                        set({
                            parseErrors: [{ message: 'No data to export' }],
                        });
                        return;
                    }

                    set({ isLoading: true, downloadProgress: 0 });

                    try {
                        // Format Date: MM-DD-YY
                        const now = new Date();
                        const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getFullYear()).slice(-2)}`;

                        // Clean source filename (remove extension)
                        const cleanSourceName = sourceFilename
                            ? sourceFilename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_")
                            : 'data';

                        // Viral Filename: jsonExport.com_OriginalName_MM-DD-YY
                        const fileName = `jsonExport.com_${cleanSourceName}_${dateStr}`;

                        // Use the selected structure for export
                        const { smartUnwrap } = require('@/lib/parsers/unwrapper');
                        const { data: dataToExport } = smartUnwrap(parsedData);

                        let rows, schema;

                        if (exportSettings.structure === 'table') {
                            // Use table view expansion
                            const { expandToTableView } = require('@/lib/parsers/tableView');
                            const result = expandToTableView(dataToExport);
                            rows = result.rows;
                            schema = result.schema;
                        } else {
                            // Use existing flattener (flat or relational mode)
                            const mode = exportSettings.structure === 'nested' ? 'relational' : 'flat';
                            const result = flattenJSON(dataToExport, { mode });
                            rows = result.rows;
                            schema = result.schema;
                        }


                        switch (format) {
                            case 'csv': {
                                const { downloadCsv } = await import('@/lib/converters/jsonToCsv');
                                downloadCsv(rows, schema, `${fileName}.csv`);
                                break;
                            }
                            case 'xlsx': {
                                if (exportSettings.structure === 'table') {
                                    const { jsonToXlsxTableView } = await import('@/lib/converters/jsonToXlsxTableView');
                                    jsonToXlsxTableView(dataToExport, `${fileName}.xlsx`);
                                } else if (exportSettings.structure === 'nested') {
                                    const { downloadXlsxHierarchical } = await import('@/lib/converters/jsonToXlsx');
                                    // Use original dataToExport (unwrapped but not flattened)
                                    downloadXlsxHierarchical(dataToExport, `${fileName}.xlsx`);
                                } else {
                                    const { downloadXlsx } = await import('@/lib/converters/jsonToXlsx');
                                    downloadXlsx(rows, schema, `${fileName}.xlsx`);
                                }
                                break;
                            }
                            case 'html': {
                                if (exportSettings.structure === 'table') {
                                    const { downloadHtmlTableView } = await import('@/lib/converters/jsonToHtmlTableView');
                                    downloadHtmlTableView(dataToExport, `${fileName}.html`);
                                } else {
                                    const { downloadHtml } = await import('@/lib/converters/jsonToHtml');
                                    downloadHtml(rows, schema, `${fileName}.html`);
                                }
                                break;
                            }
                            case 'zip': {
                                const { downloadZip } = await import('@/lib/converters/zipExporter');
                                await downloadZip(rows, schema, parsedData, `json-hub-${fileName}.zip`);
                                break;
                            }
                            default:
                                throw new Error(`Unsupported format: ${format}`);
                        }

                        // Save to conversion history (async, don't block UI)
                        try {
                            const { conversionHistory } = await import('@/lib/storage/conversionHistory');
                            const exportMode = exportSettings.structure === 'nested' ? 'relational' :
                                exportSettings.structure === 'table' ? 'table' : 'flat';
                            await conversionHistory.saveConversion({
                                fileName: `${fileName}.${format}`,
                                originalJSON: rawInput,
                                exportFormat: format as 'csv' | 'xlsx' | 'html' | 'zip',
                                exportMode: exportMode as any,
                                rowCount: rows.length,
                            });
                        } catch (historyError) {
                            console.error('Failed to save to history:', historyError);
                            // Don't fail the export if history save fails
                        }

                        set({ isLoading: false, downloadProgress: 100 });
                    } catch (error) {
                        set({
                            isLoading: false,
                            downloadProgress: 0,
                            parseErrors: [
                                {
                                    message: `Export error: ${error instanceof Error ? error.message : 'Unknown error'
                                        }`,
                                },
                            ],
                        });
                    }
                },

                // Reset state to initial values
                resetState: () => {
                    set(initialState);
                },

                // Set active tab
                setActiveTab: (tab: 'input' | 'preview' | 'export') => {
                    set({ activeTab: tab });
                },

                // Set selected export format
                setSelectedFormat: (format: ExportFormat) => {
                    set({ selectedFormat: format });
                },

                // Set view mode
                setViewMode: (mode: 'flat' | 'nested' | 'table') => {
                    set({ viewMode: mode });

                    // When switching to table view, update flatData using table transformer
                    if (mode === 'table') {
                        const { parsedData } = get();
                        if (parsedData) {
                            try {
                                const { smartUnwrap } = require('@/lib/parsers/unwrapper');
                                const { expandToTableView } = require('@/lib/parsers/tableView');
                                const { data: dataToExpand } = smartUnwrap(parsedData);
                                const result = expandToTableView(dataToExpand);
                                set({ flatData: result.rows, schema: result.schema });
                            } catch (error) {
                                console.error('Table view error:', error);
                            }
                        }
                    } else if (mode === 'flat') {
                        // Re-flatten using normal flattener
                        get().flattenData();
                    }
                },

                setPrettyPrint: (value: boolean) => {
                    set({ prettyPrint: value });
                },

                updateExportSettings: (settings: Partial<AppState['exportSettings']>) => {
                    set((state) => ({
                        exportSettings: { ...state.exportSettings, ...settings },
                    }));
                },

                // --- Project Management Actions ---

                createNewProject: () => {
                    set({
                        ...initialState,
                        currentProjectId: null,
                        projectName: null,
                        savedProjects: get().savedProjects, // Keep the list loaded
                    });
                },

                loadProjectsList: async () => {
                    try {
                        const { projectService } = await import('@/lib/db');
                        const projects = await projectService.getProjects();
                        set({ savedProjects: projects });
                    } catch (error) {
                        console.error('Failed to load projects list', error);
                    }
                },

                saveCurrentProject: async (name: string) => {
                    const state = get();
                    const { projectService } = await import('@/lib/db');

                    const projectData = {
                        rawInput: state.rawInput,
                        isParsed: state.isParsed,
                        parseErrors: state.parseErrors,
                        parsedData: state.parsedData,
                        flatData: state.flatData,
                        schema: state.schema,
                        selectedFormat: state.selectedFormat,
                    };

                    const newProject = {
                        id: state.currentProjectId || crypto.randomUUID(),
                        name: name,
                        createdAt: state.currentProjectId ? (state.lastSaved || Date.now()) : Date.now(),
                        updatedAt: Date.now(),
                        data: projectData,
                    };

                    try {
                        await projectService.saveProject(newProject);
                        set({
                            currentProjectId: newProject.id,
                            projectName: newProject.name,
                            lastSaved: newProject.updatedAt,
                        });
                        // Reload list to reflect changes
                        get().loadProjectsList();
                    } catch (error) {
                        console.error('Failed to save project', error);
                        set({
                            parseErrors: [{ message: 'Failed to save project locally.' }],
                        });
                    }
                },

                loadProject: async (id: string) => {
                    set({ isLoading: true });
                    try {
                        const { projectService } = await import('@/lib/db');
                        const project = await projectService.getProject(id);

                        if (project) {
                            set({
                                ...project.data,
                                currentProjectId: project.id,
                                projectName: project.name,
                                lastSaved: project.updatedAt,
                                isLoading: false,
                            });
                        } else {
                            set({ isLoading: false });
                        }
                    } catch (error) {
                        console.error('Failed to load project', error);
                        set({ isLoading: false });
                    }
                },

                deleteProject: async (id: string) => {
                    try {
                        const { projectService } = await import('@/lib/db');
                        await projectService.deleteProject(id);

                        // If deleting current project, reset ID but keep data (unsaved state)
                        const { currentProjectId } = get();
                        if (currentProjectId === id) {
                            set({
                                currentProjectId: null,
                                projectName: null,
                                lastSaved: null
                            });
                        }

                        get().loadProjectsList();
                    } catch (error) {
                        console.error('Failed to delete project', error);
                    }
                },
            }),
            {
                name: 'json-hub-store',
            }
        ),
        {
            name: 'json-hub-settings',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                viewMode: state.viewMode,
                prettyPrint: state.prettyPrint,
                exportSettings: state.exportSettings,
            }),
        }
    )
);
