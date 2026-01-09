import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { validateAndParse } from '@/lib/parsers/smartParse';
import { flattenJSON } from '@/lib/parsers/flattener';
import type { AppState, ParseError, ExportFormat } from '@/types/store.types';

const initialState = {
    // Input State
    rawInput: '',
    isParsed: false,
    parseErrors: [] as ParseError[],

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
    fileSizeLimit: 10 * 1024 * 1024, // 10MB in bytes

    // Project State
    currentProjectId: null,
    projectName: null,
    lastSaved: null,
    savedProjects: [],
};

export const useAppStore = create<AppState>()(
    persist(
        devtools(
            (set, get) => ({
                ...initialState,

                // Set raw input
                setRawInput: (input: string) => {
                    set({ rawInput: input, isParsed: false, parseErrors: [] });
                },

                // Parse the raw input
                parseInput: () => {
                    const { rawInput } = get();

                    set({ isLoading: true });

                    try {
                        const result = validateAndParse(rawInput);

                        if (result.success) {
                            set({
                                parsedData: result.data,
                                isParsed: true,
                                parseErrors: [],
                                isLoading: false,
                            });

                            // Automatically flatten after successful parse
                            get().flattenData();
                        } else {
                            set({
                                parsedData: null,
                                isParsed: false,
                                parseErrors: result.errors || [],
                                flatData: [],
                                schema: [],
                                isLoading: false,
                            });
                        }
                    } catch (error) {
                        set({
                            parsedData: null,
                            isParsed: false,
                            parseErrors: [
                                {
                                    message: error instanceof Error ? error.message : 'Unknown error',
                                },
                            ],
                            flatData: [],
                            schema: [],
                            isLoading: false,
                        });
                    }
                },

                // Flatten the parsed data
                flattenData: () => {
                    const { parsedData } = get();

                    if (!parsedData) {
                        return;
                    }

                    set({ isLoading: true });

                    try {
                        const result = flattenJSON(parsedData);

                        set({
                            flatData: result.rows,
                            schema: result.schema,
                            isLoading: false,
                        });
                    } catch (error) {
                        set({
                            flatData: [],
                            schema: [],
                            isLoading: false,
                            parseErrors: [
                                {
                                    message: `Flattening error: ${error instanceof Error ? error.message : 'Unknown error'
                                        }`,
                                },
                            ],
                        });
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

                // Export data (placeholder - will be implemented with converter modules)
                exportData: async (format: ExportFormat) => {
                    const { flatData, schema, parsedData } = get();

                    if (flatData.length === 0) {
                        set({
                            parseErrors: [{ message: 'No data to export' }],
                        });
                        return;
                    }

                    set({ isLoading: true, downloadProgress: 0 });

                    try {
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

                        switch (format) {
                            case 'csv': {
                                const { downloadCsv } = await import('@/lib/converters/jsonToCsv');
                                downloadCsv(flatData, schema, `export-${timestamp}.csv`);
                                break;
                            }
                            case 'xlsx': {
                                const { downloadXlsx } = await import('@/lib/converters/jsonToXlsx');
                                downloadXlsx(flatData, schema, `export-${timestamp}.xlsx`);
                                break;
                            }
                            case 'html': {
                                const { downloadHtml } = await import('@/lib/converters/jsonToHtml');
                                downloadHtml(flatData, schema, `export-${timestamp}.html`);
                                break;
                            }
                            case 'zip': {
                                const { downloadZip } = await import('@/lib/converters/zipExporter');
                                await downloadZip(flatData, schema, parsedData, `json-hub-export-${timestamp}.zip`);
                                break;
                            }
                            default:
                                throw new Error(`Unsupported format: ${format}`);
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
                setViewMode: (mode: 'flat' | 'nested') => {
                    set({ viewMode: mode });
                },

                setPrettyPrint: (value: boolean) => {
                    set({ prettyPrint: value });
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
            }),
        }
    )
);
