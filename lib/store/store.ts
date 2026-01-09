import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
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
    selectedFormat: 'csv' as ExportFormat,
    isLoading: false,
    downloadProgress: 0,

    // Configuration
    prettyPrint: true,
    rowLimit: 100000, // Max rows to display for performance
    fileSizeLimit: 10 * 1024 * 1024, // 10MB in bytes
};

export const useAppStore = create<AppState>()(
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
                set({ isLoading: true, downloadProgress: 0 });

                try {
                    // TODO: Implement actual export logic with converter modules
                    console.log(`Exporting as ${format}...`);

                    // Simulate progress
                    for (let i = 0; i <= 100; i += 10) {
                        await new Promise((resolve) => setTimeout(resolve, 100));
                        set({ downloadProgress: i });
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

            // Set pretty print option
            setPrettyPrint: (value: boolean) => {
                set({ prettyPrint: value });
            },
        }),
        {
            name: 'json-hub-store',
        }
    )
);
