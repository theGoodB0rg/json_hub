'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, ClipboardPaste, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { LargeFileViewer } from './LargeFileViewer';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TemplateSelector } from '@/components/TemplateSelector/TemplateSelector';
import { LightJsonEditor } from './LightJsonEditor';
import { LargeFileUpsell } from '@/components/LargeFileUpsell/LargeFileUpsell';
import { cn } from "@/lib/utils";
import { Progress } from '@/components/ui/progress';

// Realistic file size limits based on testing (January 2026)
const RECOMMENDED_MAX_SIZE = 10 * 1024 * 1024; // 10MB - works instantly
const WARNING_SIZE = 50 * 1024 * 1024; // 50MB - tested, works smoothly
const HARD_MAX_SIZE = 100 * 1024 * 1024; // 100MB - show upsell (device-dependent above this)

export function JsonEditor() {
    const {
        rawInput,
        setRawInput,
        parseInput,
        parseInputStreaming,
        isParsed,
        parseErrors,
        setSourceFilename,
        isLoading,
        streamingProgress,
        sourceFilename
    } = useAppStore();

    const [isMaximized, setIsMaximized] = useState(false);
    const [fileSize, setFileSize] = useState<number>(0);
    const [showUpsell, setShowUpsell] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-parse with debounce
    useEffect(() => {
        // Don't auto-parse if input is large
        if (rawInput.length > RECOMMENDED_MAX_SIZE) return;

        const timer = setTimeout(() => {
            if (rawInput.trim()) {
                parseInput();
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [rawInput, parseInput]);

    const handleEditorChange = useCallback((value: string) => {
        setRawInput(value);
    }, [setRawInput]);

    const handleClear = useCallback(() => {
        setRawInput('');
        setSourceFilename(null);
        setFileSize(0);
    }, [setRawInput, setSourceFilename]);

    const processFile = useCallback((file: File, bypassWarning: boolean = false) => {
        setFileSize(file.size);
        setSourceFilename(file.name);

        // Check if file is too large
        if (!bypassWarning && file.size > HARD_MAX_SIZE) {
            setPendingFile(file);
            setShowUpsell(true);
            return;
        }

        // OPTIMIZATION: For large files (>2MB), verify we can read it AND parse it
        if (file.size > HARD_MAX_SIZE) {
            // 1. Start streaming parser (background worker)
            parseInputStreaming(file);

            // 2. Read content for "Read-Only" display using FileReader
            // Note: Reading 50MB into a string is fast (~200ms), rendering it is the bottleneck.
            // LargeFileViewer handles the rendering bottleneck.
            const reader = new FileReader();
            reader.onload = (e) => {
                setRawInput(e.target?.result as string);
                setSourceFilename(file.name);
                setFileSize(file.size);
            };
            reader.readAsText(file);
            return;
        }

        // Read and process file
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setRawInput(content);

            // Auto-parse if reasonable size
            if (file.size <= WARNING_SIZE) {
                setTimeout(() => parseInput(), 100);
            }
        };
        reader.readAsText(file);
    }, [setRawInput, setSourceFilename, parseInput, parseInputStreaming]);

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processFile(file);
        }
        // Reset input so same file can be uploaded again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [processFile]);

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            processFile(file);
        }
    }, [processFile]);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    }, []);

    const handlePaste = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();

            // Check paste size
            if (text.length > HARD_MAX_SIZE) {
                setFileSize(text.length);
                setPendingFile(null);
                setShowUpsell(true);
                return;
            }

            setRawInput(text);
            setSourceFilename('clipboard_data');
            setFileSize(text.length);
        } catch (err) {
            console.error('Failed to read clipboard', err);
            alert('Could not access clipboard. Please paste manually (Ctrl+V or Cmd+V).');
        }
    }, [setRawInput, setSourceFilename]);

    const handleProceedAnyway = useCallback(() => {
        setShowUpsell(false);
        if (pendingFile) {
            processFile(pendingFile, true);
            setPendingFile(null);
        }
    }, [pendingFile, processFile]);

    const handleManualParse = useCallback(() => {
        parseInput();
    }, [parseInput]);

    // Check if current input is large
    const isLargeInput = rawInput.length > RECOMMENDED_MAX_SIZE;
    const showSizeWarning = fileSize > WARNING_SIZE && fileSize <= HARD_MAX_SIZE;

    return (
        <>
            <Card className={cn(
                "flex flex-col p-4 transition-all duration-300",
                isMaximized ? "fixed inset-0 z-[100] h-[100dvh] w-screen rounded-none bg-background" : "h-full"
            )}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-semibold text-muted-foreground hidden sm:block">JSON Input</h2>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <TemplateSelector />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                    variant="outline"
                                    size="icon"
                                    disabled={isLoading}
                                >
                                    <Upload className="h-4 w-4" />
                                    <span className="sr-only">Upload File</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Upload File (recommended &lt;1MB)</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={handleClear}
                                    variant="outline"
                                    size="icon"
                                    disabled={isLoading}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Clear</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Clear Editor</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={handlePaste}
                                    variant="outline"
                                    size="icon"
                                    disabled={isLoading}
                                >
                                    <ClipboardPaste className="h-4 w-4" />
                                    <span className="sr-only">Paste from Clipboard</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Paste from Clipboard</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() => setIsMaximized(!isMaximized)}
                                    variant="outline"
                                    size="icon"
                                    className="md:hidden"
                                >
                                    {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                    <span className="sr-only">{isMaximized ? "Minimize" : "Maximize"}</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{isMaximized ? "Minimize" : "Maximize"}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Size warning */}
                {showSizeWarning && (
                    <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-md text-sm text-amber-600 dark:text-amber-400">
                        ⚠️ Large file ({(fileSize / (1024 * 1024)).toFixed(1)}MB) - Processing may be slow.
                    </div>
                )}

                {/* Loading/Progress */}
                {isLoading && streamingProgress && (
                    <div className="mb-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </span>
                            <span className="text-muted-foreground">
                                {streamingProgress.percent}% ({streamingProgress.itemCount.toLocaleString()} items)
                            </span>
                        </div>
                        <Progress value={streamingProgress.percent} className="h-2" />
                    </div>
                )}

                <div
                    className="flex-1 border rounded-md overflow-hidden relative"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    {isLargeInput ? (
                        <LargeFileViewer
                            content={rawInput}
                            fileName={sourceFilename || 'Large File'}
                            fileSize={fileSize}
                        />
                    ) : (
                        <LightJsonEditor
                            value={rawInput}
                            onChange={handleEditorChange}
                            parseErrors={parseErrors}
                            isLargeFile={false} // Handled by LargeFileViewer now
                            fileSize={fileSize}
                            readOnly={isLoading}
                        />
                    )}

                    {/* Loading overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
                            <div className="flex flex-col items-center gap-3 p-6 bg-background border rounded-lg shadow-lg">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-sm font-medium">Processing JSON...</p>
                                <p className="text-xs text-muted-foreground">This may take a moment for large files</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Manual parse button for large files */}
                {isLargeInput && !isParsed && !isLoading && (
                    <div className="mt-4">
                        <Button onClick={handleManualParse} className="w-full">
                            Parse JSON ({(rawInput.length / (1024 * 1024)).toFixed(1)}MB)
                        </Button>
                    </div>
                )}

                {/* Parse errors */}
                {parseErrors.length > 0 && !rawInput && (
                    <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-md">
                        <p className="text-sm font-semibold text-destructive mb-1">Parse Errors:</p>
                        {parseErrors.map((error, index) => (
                            <p key={index} className="text-sm text-destructive">
                                {error.line && error.column
                                    ? `Line ${error.line}, Column ${error.column}: `
                                    : ''}
                                {error.message}
                            </p>
                        ))}
                    </div>
                )}

                {isParsed && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500 rounded-md">
                        <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                            ✓ JSON parsed and flattened successfully
                        </p>
                    </div>
                )}
            </Card>

            {/* Large file upsell modal */}
            <LargeFileUpsell
                isOpen={showUpsell}
                onClose={() => setShowUpsell(false)}
                onProceedAnyway={handleProceedAnyway}
                fileSize={fileSize || pendingFile?.size || 0}
            />
        </>
    );
}
