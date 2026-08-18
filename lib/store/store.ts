import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { validateAndParse } from '@/lib/parsers/smartParse';
import { flattenJSON } from '@/lib/parsers/flattener';
import { smartUnwrap } from '@/lib/parsers/unwrapper';
import type { AppState, ParseError, ExportFormat } from '@/types/store.types';
import type { OutputViewMode } from '@/types/converter.types';
import { trackConversionEvent } from '@/lib/telemetry/conversion-events';
import { trackFunnelStep } from '@/lib/analytics';
import { pluginRegistry } from '@/lib/plugins/registry';

const initialState = {
    // Input State
    rawInput: '',
    isParsed: false,
    parseErrors: [] as ParseError[],
    sourceFilename: null as string | null,

    // Processed Data
    parsedData: null,
    flatData: [] as Record<string, any>[],
    schema: [] as string[],
    columnOrder: [] as string[],
    excludedColumns: [] as string[],

    // Output / Plugin State
    activePluginId: 'json-to-excel',
    formattedOutput: '',
    outputMode: 'table' as OutputViewMode,

    // UI State
    activeTab: 'input' as const,
    selectedFormat: 'xlsx' as ExportFormat,
    viewMode: 'flat' as const,
    isLoading: false,
    downloadProgress: 0,
    streamingProgress: null as { itemCount: number; bytesProcessed: number; totalBytes: number; percent: number } | null,

    // Configuration
    prettyPrint: true,
    rowLimit: 100000,
    fileSizeLimit: 50 * 1024 * 1024,
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
    streamingWorker: null as Worker | null,
};

export const useAppStore = create<AppState>()(
    temporal(
        persist(
            devtools(
                (set, get) => ({
                    ...initialState,

                    setPluginId: (pluginId: string) => {
                        const plugin = pluginRegistry.getOrDefault(pluginId);
                        set({
                            activePluginId: plugin.id,
                            outputMode: plugin.uiConfig.outputMode,
                            selectedFormat: plugin.uiConfig.defaultExportFormat as ExportFormat,
                        });
                    },

                    setOutputMode: (mode: OutputViewMode) => {
                        set({ outputMode: mode });
                    },

                    // Zundo Actions (placeholder types, temporal handles logic)
                    undo: () => { },
                    redo: () => { },
                    pastStates: [],
                    futureStates: [],

                    initWorker: () => {
                        if (typeof window === 'undefined' || get().worker) return;

                        const worker = new Worker(new URL('../workers/parser.worker.ts', import.meta.url));

                        worker.onmessage = (event) => {
                            const { type, payload } = event.data;

                            if (type === 'PARSE_SUCCESS') {
                                const currentRawInput = get().rawInput;
                                set({
                                    parsedData: payload,
                                    isParsed: true,
                                    parseErrors: [],
                                    isLoading: false,
                                });
                                trackConversionEvent('parse_success', {
                                    source: 'worker',
                                    inputBytes: currentRawInput.length,
                                });
                                trackFunnelStep('parse_success');
                                get().flattenData();
                            } else if (type === 'PARSE_ERROR') {
                                set({
                                    parsedData: null,
                                    isParsed: false,
                                    parseErrors: payload,
                                    flatData: [],
                                    schema: [],
                                    columnOrder: [],
                                    isLoading: false,
                                });
                                trackConversionEvent('parse_error', {
                                    source: 'worker',
                                    message: payload?.[0]?.message ?? 'Parse error',
                                });
                            } else if (type === 'FLATTEN_SUCCESS') {
                                set({
                                    flatData: payload.rows,
                                    schema: payload.schema,
                                    columnOrder: payload.schema,
                                    excludedColumns: [],
                                    isLoading: false,
                                });
                            } else if (type === 'ERROR') {
                                set({
                                    isLoading: false,
                                    parseErrors: payload
                                });
                                trackConversionEvent('parse_error', {
                                    source: 'worker',
                                    message: payload?.[0]?.message ?? 'Worker error',
                                });
                            }
                        };

                        set({ worker });
                    },

                    setRawInput: (input: string) => {
                        set({ rawInput: input, isParsed: false, parseErrors: [] });
                    },

                    setSourceFilename: (name: string | null) => {
                        set({ sourceFilename: name });
                    },

                    parseInput: async () => {
                        const { rawInput, worker, activePluginId } = get();
                        set({ isLoading: true });
                        trackFunnelStep('parse_initiated');

                        const isStandardJsonPlugin = activePluginId === 'json-to-excel' || activePluginId === 'json-to-csv';

                        if (worker && isStandardJsonPlugin) {
                            worker.postMessage({ type: 'PARSE', payload: rawInput });
                        } else {
                            try {
                                const plugin = pluginRegistry.getOrDefault(activePluginId);
                                const result = await plugin.parse(rawInput);
                                if (result.success) {
                                    const parsedObj = result.data ?? result.flatData;
                                    set({
                                        parsedData: parsedObj,
                                        flatData: result.flatData ?? [],
                                        schema: result.schema ?? [],
                                        columnOrder: result.schema ?? [],
                                        excludedColumns: [],
                                        formattedOutput: result.formattedOutput ?? (typeof parsedObj === 'string' ? parsedObj : JSON.stringify(parsedObj, null, 2)),
                                        isParsed: true,
                                        parseErrors: [],
                                        isLoading: false,
                                        outputMode: plugin.uiConfig.outputMode,
                                    });
                                    trackConversionEvent('parse_success', {
                                        source: 'plugin',
                                        inputBytes: rawInput.length,
                                    });
                                    trackFunnelStep('parse_success', { source: 'plugin' });
                                } else {
                                    set({
                                        parsedData: null,
                                        isParsed: false,
                                        parseErrors: result.errors || [{ message: 'Parse error' }],
                                        flatData: [],
                                        schema: [],
                                        columnOrder: [],
                                        formattedOutput: '',
                                        isLoading: false,
                                    });
                                    trackConversionEvent('parse_error', {
                                        source: 'plugin',
                                        message: result.errors?.[0]?.message ?? 'Parse error',
                                    });
                                }
                            } catch (e) {
                                set({ isLoading: false, parseErrors: [{ message: String(e) }] });
                                trackConversionEvent('parse_error', {
                                    source: 'plugin-exception',
                                    message: String(e),
                                });
                            }
                        }
                    },

                    parseInputStreaming: (file: File) => {
                        set({ isLoading: true, streamingProgress: { itemCount: 0, bytesProcessed: 0, totalBytes: file.size, percent: 0 } });
                        trackFunnelStep('parse_initiated', { method: 'streaming', fileName: file.name });

                        let streamingWorker = get().streamingWorker;
                        if (!streamingWorker) {
                            streamingWorker = new Worker(new URL('../workers/streaming-parser.worker.ts', import.meta.url));

                            streamingWorker.onmessage = (event) => {
                                const { type, payload } = event.data;

                                if (type === 'STREAM_PROGRESS') {
                                    set({ streamingProgress: payload });
                                } else if (type === 'STREAM_COMPLETE') {
                                    set({
                                        flatData: payload.rows,
                                        schema: payload.schema,
                                        columnOrder: payload.schema,
                                        excludedColumns: [],
                                        parsedData: payload.rows,
                                        isParsed: true,
                                        parseErrors: [],
                                        isLoading: false,
                                        streamingProgress: null
                                    });
                                    trackConversionEvent('parse_success', {
                                        source: 'streaming-worker',
                                        rowCount: payload.rows?.length ?? 0,
                                        schemaCount: payload.schema?.length ?? 0,
                                    });
                                } else if (type === 'PARSE_ERROR') {
                                    set({
                                        isLoading: false,
                                        streamingProgress: null,
                                        parseErrors: payload
                                    });
                                    trackConversionEvent('parse_error', {
                                        source: 'streaming-worker',
                                        message: payload?.[0]?.message ?? 'Streaming parse error',
                                    });
                                }
                            };

                            set({ streamingWorker });
                        }

                        streamingWorker.postMessage({ type: 'STREAM_START', payload: { totalSize: file.size } });

                        const reader = file.stream().getReader();

                        const readChunks = async () => {
                            try {
                                while (true) {
                                    const { done, value } = await reader.read();
                                    if (done) {
                                        streamingWorker!.postMessage({ type: 'STREAM_END' });
                                        break;
                                    }
                                    streamingWorker!.postMessage({ type: 'STREAM_CHUNK', payload: value.buffer });
                                }
                            } catch (error) {
                                set({
                                    isLoading: false,
                                    streamingProgress: null,
                                    parseErrors: [{ message: `File read error: ${error}` }]
                                });
                                trackConversionEvent('parse_error', {
                                    source: 'streaming-reader',
                                    message: String(error),
                                });
                            }
                        };

                        readChunks();
                    },

                    flattenData: () => {
                        const { parsedData, worker, exportSettings } = get();
                        if (!parsedData) return;

                        set({ isLoading: true });

                        if (worker) {
                            const mode = exportSettings.structure === 'nested' ? 'relational' : 'flat';
                            worker.postMessage({ type: 'FLATTEN', payload: { data: parsedData, mode } });
                        } else {
                            try {
                                const { smartUnwrap } = require('@/lib/parsers/unwrapper');
                                const { data: dataToFlatten } = smartUnwrap(parsedData);
                                const result = flattenJSON(dataToFlatten);
                                set({
                                    flatData: result.rows,
                                    schema: result.schema,
                                    columnOrder: result.schema,
                                    excludedColumns: [],
                                    isLoading: false
                                });
                            } catch (error) {
                                set({ isLoading: false, parseErrors: [{ message: String(error) }] });
                            }
                        }
                    },

                    updateCell: (rowIndex: number, column: string, value: any) => {
                        const { flatData, parsedData } = get();
                        if (rowIndex < 0 || rowIndex >= flatData.length) return;

                        const newFlatData = [...flatData];
                        newFlatData[rowIndex] = { ...newFlatData[rowIndex], [column]: value };
                        set({ flatData: newFlatData });

                        try {
                            const { smartUnwrap } = require('@/lib/parsers/unwrapper');
                            const { data: unwrappedData } = smartUnwrap(parsedData);

                            if (Array.isArray(unwrappedData) && unwrappedData[rowIndex]) {
                                const setDeep = (obj: any, path: string, val: any) => {
                                    const keys = path.split('.');
                                    let current = obj;
                                    for (let i = 0; i < keys.length - 1; i++) {
                                        const k = keys[i];
                                        if (!current[k]) current[k] = {};
                                        current = current[k];
                                    }
                                    current[keys[keys.length - 1]] = val;
                                };

                                setDeep(unwrappedData[rowIndex], column, value);
                                set({ parsedData: Array.isArray(parsedData) ? [...unwrappedData] : { ...parsedData } });
                            }
                        } catch (e) {
                            console.error("Failed to sync edit to parsedData", e);
                        }
                    },

                    updateData: (path: string, value: any) => {
                        const { parsedData } = get();
                        if (!parsedData) return;

                        try {
                            const newData = typeof structuredClone === 'function'
                                ? structuredClone(parsedData)
                                : JSON.parse(JSON.stringify(parsedData));

                            const setDeep = (obj: any, p: string, val: any) => {
                                const keys = p.split('.');
                                let current = obj;
                                for (let i = 0; i < keys.length - 1; i++) {
                                    const k = keys[i];
                                    if (current[k] === undefined) current[k] = {};
                                    current = current[k];
                                }
                                current[keys[keys.length - 1]] = val;
                            };

                            setDeep(newData, path, value);
                            set({ parsedData: newData });
                            get().flattenData();
                        } catch (e) {
                            console.error("Failed to update data", e);
                        }
                    },

                    setColumnOrder: (order: string[]) => {
                        set({ columnOrder: order });
                    },

                    toggleColumnVisibility: (columnId: string) => {
                        const { excludedColumns } = get();
                        if (excludedColumns.includes(columnId)) {
                            set({ excludedColumns: excludedColumns.filter(id => id !== columnId) });
                        } else {
                            set({ excludedColumns: [...excludedColumns, columnId] });
                        }
                    },

                    reorderRow: (fromIndex: number, toIndex: number) => {
                        const { flatData } = get();
                        const newFlatData = [...flatData];
                        const [movedRow] = newFlatData.splice(fromIndex, 1);
                        newFlatData.splice(toIndex, 0, movedRow);
                        set({ flatData: newFlatData });
                    },

                    renameColumn: (oldName: string, newName: string) => {
                        if (oldName === newName || !newName.trim()) return;

                        const { schema, columnOrder, excludedColumns, flatData } = get();

                        const newSchema = schema.map(col => col === oldName ? newName : col);
                        const newColumnOrder = columnOrder.map(col => col === oldName ? newName : col);
                        const newExcludedColumns = excludedColumns.map(col => col === oldName ? newName : col);

                        const needsDataRemap = flatData.length > 0 && oldName in flatData[0];

                        if (!needsDataRemap) {
                            set({
                                schema: newSchema,
                                columnOrder: newColumnOrder,
                                excludedColumns: newExcludedColumns,
                            });
                            return;
                        }

                        const newFlatData = flatData.map(row => {
                            if (!(oldName in row)) return row;
                            const newRow = { ...row };
                            newRow[newName] = newRow[oldName];
                            delete newRow[oldName];
                            return newRow;
                        });

                        set({
                            schema: newSchema,
                            columnOrder: newColumnOrder,
                            excludedColumns: newExcludedColumns,
                            flatData: newFlatData,
                        });
                    },

                    exportData: async (format: ExportFormat) => {
                        const { parsedData, exportSettings, rawInput, sourceFilename, columnOrder, excludedColumns, flatData } = get();

                        if (!parsedData) {
                            set({ parseErrors: [{ message: 'No data to export' }] });
                            return;
                        }

                        set({ isLoading: true, downloadProgress: 0 });
                        trackFunnelStep('export_initiated', { format });

                        try {
                            const now = new Date();
                            const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getFullYear()).slice(-2)}`;
                            const cleanSourceName = sourceFilename
                                ? sourceFilename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_")
                                : 'data';
                            const fileName = `jsonExport.com_${cleanSourceName}_${dateStr}`;

                            const { smartUnwrap } = require('@/lib/parsers/unwrapper');
                            const { data: dataToExport } = smartUnwrap(parsedData);

                            let rows = [], schema = [];

                            if (exportSettings.structure === 'table') {
                                const { expandToTableView } = require('@/lib/parsers/tableView');
                                const result = expandToTableView(dataToExport);
                                rows = result.rows;
                                schema = result.schema;
                            } else {
                                rows = flatData;
                                schema = get().schema;
                            }

                            let effectiveSchema = columnOrder.length > 0 ? columnOrder : schema;
                            effectiveSchema = effectiveSchema.filter((col: string) => !excludedColumns.includes(col));

                            const missingColumns = schema.filter((col: string) => !effectiveSchema.includes(col) && !excludedColumns.includes(col));
                            effectiveSchema = [...effectiveSchema, ...missingColumns];

                            const isHierarchical = exportSettings.structure === 'nested';

                            switch (format) {
                                case 'csv': {
                                    const { downloadCsv } = await import('@/lib/converters/jsonToCsv');
                                    downloadCsv(rows, effectiveSchema, `${fileName}.csv`);
                                    break;
                                }
                                case 'xlsx': {
                                    if (exportSettings.structure === 'table') {
                                        const { jsonToXlsxTableView } = await import('@/lib/converters/jsonToXlsxTableView');
                                        jsonToXlsxTableView(dataToExport, `${fileName}.xlsx`);
                                    } else if (isHierarchical) {
                                        const { downloadXlsxHierarchical } = await import('@/lib/converters/jsonToXlsx');
                                        downloadXlsxHierarchical(dataToExport, `${fileName}.xlsx`);
                                    } else {
                                        const { downloadXlsx } = await import('@/lib/converters/jsonToXlsx');
                                        downloadXlsx(rows, effectiveSchema, `${fileName}.xlsx`);
                                    }
                                    break;
                                }
                                case 'html': {
                                    if (exportSettings.structure === 'table') {
                                        const { downloadHtmlTableView } = await import('@/lib/converters/jsonToHtmlTableView');
                                        downloadHtmlTableView(dataToExport, `${fileName}.html`);
                                    } else {
                                        const { downloadHtml } = await import('@/lib/converters/jsonToHtml');
                                        downloadHtml(rows, effectiveSchema, `${fileName}.html`);
                                    }
                                    break;
                                }
                                case 'zip': {
                                    const { downloadZip } = await import('@/lib/converters/zipExporter');
                                    await downloadZip(rows, schema, parsedData, `json-hub-${fileName}.zip`);
                                    break;
                                }
                                case 'json': {
                                    const jsonStr = get().formattedOutput || JSON.stringify(parsedData, null, 2);
                                    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `${fileName}.json`;
                                    link.click();
                                    URL.revokeObjectURL(url);
                                    break;
                                }
                                default:
                                    throw new Error(`Unsupported format: ${format}`);
                            }

                            try {
                                const { conversionHistory } = await import('@/lib/storage/conversionHistory');
                                const exportMode = exportSettings.structure === 'nested' ? 'relational' :
                                    exportSettings.structure === 'table' ? 'table' : 'flat';
                                await conversionHistory.saveConversion({
                                    fileName: `${fileName}.${format}`,
                                    originalJSON: rawInput,
                                    exportFormat: format as any,
                                    exportMode: exportMode as any,
                                    rowCount: rows.length,
                                });
                            } catch (e) {
                                console.error('Failed to save to history:', e);
                            }

                            trackConversionEvent('export_success', {
                                format,
                                structure: exportSettings.structure,
                                rowCount: rows.length,
                                schemaCount: effectiveSchema.length,
                            });
                            trackFunnelStep('export_complete', {
                                format,
                                structure: exportSettings.structure,
                                rowCount: rows.length,
                            });
                            set({ isLoading: false, downloadProgress: 100 });
                        } catch (error) {
                            trackConversionEvent('export_error', {
                                format,
                                structure: exportSettings.structure,
                                message: error instanceof Error ? error.message : 'Unknown error',
                            });
                            set({
                                isLoading: false,
                                downloadProgress: 0,
                                parseErrors: [{ message: `Export error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
                            });
                        }
                    },

                    resetState: () => {
                        set(initialState);
                    },

                    setActiveTab: (tab) => set({ activeTab: tab }),
                    setSelectedFormat: (format) => set({ selectedFormat: format }),
                    setViewMode: (mode) => {
                        set({ viewMode: mode });
                        if (mode === 'table') {
                            const { parsedData } = get();
                            if (parsedData) {
                                try {
                                    const { smartUnwrap } = require('@/lib/parsers/unwrapper');
                                    const { expandToTableView } = require('@/lib/parsers/tableView');
                                    const { data: dataToExpand } = smartUnwrap(parsedData);
                                    const result = expandToTableView(dataToExpand);
                                    set({ flatData: result.rows, schema: result.schema, columnOrder: result.schema });
                                } catch (error) { console.error(error); }
                            }
                        } else if (mode === 'flat') {
                            get().flattenData();
                        }
                    },
                    setPrettyPrint: (value) => set({ prettyPrint: value }),
                    updateExportSettings: (settings) => set((state) => ({ exportSettings: { ...state.exportSettings, ...settings } })),
                    createNewProject: () => set({ ...initialState, currentProjectId: null, projectName: null, savedProjects: get().savedProjects }),
                    loadProjectsList: async () => {
                        try {
                            const { projectService } = await import('@/lib/db');
                            const projects = await projectService.getProjects();
                            set({ savedProjects: projects });
                        } catch (e) { console.error(e); }
                    },
                    saveCurrentProject: async (name) => {
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
                            columnOrder: state.columnOrder,
                            excludedColumns: state.excludedColumns,
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
                            set({ currentProjectId: newProject.id, projectName: newProject.name, lastSaved: newProject.updatedAt });
                            get().loadProjectsList();
                        } catch (e) {
                            set({ parseErrors: [{ message: 'Failed to save project.' }] });
                        }
                    },
                    loadProject: async (id) => {
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
                            } else { set({ isLoading: false }); }
                        } catch (e) { set({ isLoading: false }); }
                    },
                    deleteProject: async (id) => {
                        try {
                            const { projectService } = await import('@/lib/db');
                            await projectService.deleteProject(id);
                            const { currentProjectId } = get();
                            if (currentProjectId === id) set({ currentProjectId: null, projectName: null, lastSaved: null });
                            get().loadProjectsList();
                        } catch (e) { console.error(e); }
                    },
                }),
                { name: 'json-hub-store' }
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
        ),
        {
            // Zundo Options
            limit: 50,
            partialize: (state) => ({
                flatData: state.flatData,
                columnOrder: state.columnOrder,
                excludedColumns: state.excludedColumns,
            }),
        }
    )
);
