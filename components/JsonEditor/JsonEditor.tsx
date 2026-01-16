'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, ClipboardPaste, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TemplateSelector } from '@/components/TemplateSelector/TemplateSelector';
import { LightJsonEditor, isLargeFileSize, needsStreaming } from './LightJsonEditor';
import { cn } from "@/lib/utils";
import { Progress } from '@/components/ui/progress';

// Size limits
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB absolute max
const LARGE_FILE_THRESHOLD = 500 * 1024; // 500KB

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
        streamingProgress
    } = useAppStore();

    const [isMaximized, setIsMaximized] = useState(false);
    const [fileSize, setFileSize] = useState<number>(0);
    const [isLargeFile, setIsLargeFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-parse with debounce (only for small files)
    useEffect(() => {
        if (isLargeFile) return; // Don't auto-parse large files

        const timer = setTimeout(() => {
            if (rawInput.trim()) {
                parseInput();
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [rawInput, parseInput, isLargeFile]);

    const handleEditorChange = useCallback((value: string) => {
        setRawInput(value);
        // Reset large file flag if user is typing
        if (isLargeFile && value.length < LARGE_FILE_THRESHOLD) {
            setIsLargeFile(false);
            setFileSize(0);
        }
    }, [setRawInput, isLargeFile]);

    const handleClear = useCallback(() => {
        setRawInput('');
        setSourceFilename(null);
        setFileSize(0);
        setIsLargeFile(false);
    }, [setRawInput, setSourceFilename]);

    const processFile = useCallback(async (file: File) => {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            alert(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
            return;
        }

        setFileSize(file.size);
        setSourceFilename(file.name);
        const isLarge = isLargeFileSize(file.size);
        setIsLargeFile(isLarge);

        if (needsStreaming(file.size)) {
            // Use streaming for very large files (5MB+)
            parseInputStreaming(file);
        } else {
            // Standard file read
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setRawInput(content);

                // Auto-parse unless it's a large file
                if (!isLarge) {
                    setTimeout(() => parseInput(), 100);
                }
            };
            reader.readAsText(file);
        }
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
            setRawInput(text);
            setSourceFilename('clipboard_data');
            setFileSize(text.length);
            setIsLargeFile(isLargeFileSize(text.length));
        } catch (err) {
            console.error('Failed to read clipboard', err);
            alert('Could not access clipboard. Please paste manually (Ctrl+V or Cmd+V).');
        }
    }, [setRawInput, setSourceFilename]);

    const handleManualParse = useCallback(() => {
        parseInput();
    }, [parseInput]);

    return (
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
                            <p>Upload File (up to 100MB)</p>
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

            {/* Streaming progress */}
            {isLoading && streamingProgress && (
                <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing large file...
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
                <LightJsonEditor
                    value={rawInput}
                    onChange={handleEditorChange}
                    parseErrors={parseErrors}
                    isLargeFile={isLargeFile}
                    fileSize={fileSize}
                    readOnly={isLoading}
                />

                {/* Loading overlay */}
                {isLoading && !streamingProgress && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Parsing JSON...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Large file manual parse button */}
            {isLargeFile && !isParsed && !isLoading && (
                <div className="mt-4">
                    <Button onClick={handleManualParse} className="w-full">
                        Parse Large File ({(fileSize / (1024 * 1024)).toFixed(1)}MB)
                    </Button>
                </div>
            )}

            {/* Parse errors - only show if not already shown in editor */}
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
    );
}
