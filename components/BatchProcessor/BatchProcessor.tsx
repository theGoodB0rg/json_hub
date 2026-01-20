'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Files, Upload, Download, Trash2, CheckCircle2, AlertCircle, Loader2, XCircle, AlertTriangle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface BatchProcessorProps {
    className?: string;
}

interface BatchFile {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'success' | 'error';
    error?: string;
    progress?: number;
    stage?: string;
    rowCount?: number;
    columnCount?: number;
}

// 50MB warning threshold
const LARGE_FILE_WARNING_SIZE = 50 * 1024 * 1024;

export function BatchProcessor({ className }: BatchProcessorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [files, setFiles] = useState<BatchFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
    const [overallProgress, setOverallProgress] = useState(0);
    const [showLargeFileWarning, setShowLargeFileWarning] = useState(false);
    const workerRef = useRef<Worker | null>(null);

    // Initialize worker lazily
    const getWorker = useCallback(() => {
        if (!workerRef.current) {
            workerRef.current = new Worker(
                new URL('@/lib/workers/batch-processor.worker.ts', import.meta.url)
            );

            workerRef.current.onmessage = (event) => {
                const { type, payload } = event.data;

                switch (type) {
                    case 'FILE_PROGRESS':
                        setFiles(prev => prev.map(f =>
                            f.id === payload.fileId
                                ? { ...f, progress: payload.percent, stage: payload.stage }
                                : f
                        ));
                        break;

                    case 'FILE_COMPLETE':
                        setFiles(prev => prev.map(f =>
                            f.id === payload.fileId
                                ? {
                                    ...f,
                                    status: 'success',
                                    progress: 100,
                                    rowCount: payload.rowCount,
                                    columnCount: payload.columnCount
                                }
                                : f
                        ));
                        break;

                    case 'FILE_ERROR':
                        setFiles(prev => prev.map(f =>
                            f.id === payload.fileId
                                ? { ...f, status: 'error', error: payload.error }
                                : f
                        ));
                        break;

                    case 'BATCH_PROGRESS':
                        setOverallProgress(payload.percent);
                        break;

                    case 'BATCH_COMPLETE':
                        // Download ZIP
                        const url = URL.createObjectURL(payload.zipBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `batch-conversion-${Date.now()}.zip`;
                        a.click();
                        URL.revokeObjectURL(url);
                        setIsProcessing(false);
                        setOverallProgress(100);
                        break;

                    case 'BATCH_CANCELLED':
                        setIsProcessing(false);
                        setOverallProgress(0);
                        // Reset processing files back to pending
                        setFiles(prev => prev.map(f =>
                            f.status === 'processing' ? { ...f, status: 'pending', progress: 0 } : f
                        ));
                        break;

                    case 'BATCH_ERROR':
                        setIsProcessing(false);
                        console.error('Batch error:', payload.message);
                        break;
                }
            };
        }
        return workerRef.current;
    }, []);

    // Cleanup worker on unmount
    useEffect(() => {
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, []);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);

        // Check for large files
        const hasLargeFiles = selectedFiles.some(f => f.size > LARGE_FILE_WARNING_SIZE);
        if (hasLargeFiles) {
            setShowLargeFileWarning(true);
        }

        const newFiles: BatchFile[] = selectedFiles.map(file => ({
            id: crypto.randomUUID(),
            file,
            status: 'pending'
        }));
        setFiles(prev => [...prev, ...newFiles]);

        // Reset input
        event.target.value = '';
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const clearAll = () => {
        setFiles([]);
        setOverallProgress(0);
        setShowLargeFileWarning(false);
    };

    const cancelProcessing = () => {
        const worker = workerRef.current;
        if (worker) {
            worker.postMessage({ type: 'BATCH_CANCEL' });
        }
    };

    const processFiles = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        setOverallProgress(0);

        // Reset all file statuses
        setFiles(prev => prev.map(f => ({
            ...f,
            status: 'pending' as const,
            progress: 0,
            error: undefined,
            stage: undefined
        })));

        // Read all files as ArrayBuffer (for Transferable Objects)
        const fileBuffers: { id: string; name: string; buffer: ArrayBuffer }[] = [];
        const transferables: ArrayBuffer[] = [];

        for (const batchFile of files) {
            try {
                const buffer = await batchFile.file.arrayBuffer();
                fileBuffers.push({
                    id: batchFile.id,
                    name: batchFile.file.name,
                    buffer
                });
                transferables.push(buffer);
            } catch (error) {
                setFiles(prev => prev.map(f =>
                    f.id === batchFile.id
                        ? { ...f, status: 'error', error: 'Failed to read file' }
                        : f
                ));
            }
        }

        // Send to worker with Transferable Objects for zero-copy performance
        const worker = getWorker();
        worker.postMessage(
            {
                type: 'BATCH_START',
                payload: {
                    files: fileBuffers,
                    format: exportFormat
                }
            },
            transferables
        );
    };

    const pendingCount = files.filter(f => f.status === 'pending').length;
    const processingCount = files.filter(f => f.status === 'processing').length;
    const successCount = files.filter(f => f.status === 'success').length;
    const errorCount = files.filter(f => f.status === 'error').length;

    const largeFilesCount = files.filter(f => f.file.size > LARGE_FILE_WARNING_SIZE).length;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2", className)}>
                    <Files className="h-4 w-4" />
                    <span className="hidden sm:inline">Batch</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Batch File Processing</DialogTitle>
                    <DialogDescription>
                        Upload multiple JSON files and convert them all at once. All files will be exported as a ZIP archive.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    {/* Large File Warning */}
                    {showLargeFileWarning && largeFilesCount > 0 && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-amber-800 dark:text-amber-200">
                                    {largeFilesCount} large file{largeFilesCount > 1 ? 's' : ''} detected (&gt;50MB)
                                </p>
                                <p className="text-amber-700 dark:text-amber-300">
                                    Processing may take longer. The UI will remain responsive.
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="ml-auto -mr-2"
                                onClick={() => setShowLargeFileWarning(false)}
                            >
                                <XCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Upload Area */}
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                        <input
                            type="file"
                            accept=".json"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            id="batch-upload"
                            disabled={isProcessing}
                        />
                        <label htmlFor="batch-upload" className="cursor-pointer">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">Click to upload JSON files</p>
                            <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
                        </label>
                    </div>

                    {/* Format Selection */}
                    {files.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Export as:</span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant={exportFormat === 'xlsx' ? 'default' : 'outline'}
                                    onClick={() => setExportFormat('xlsx')}
                                    disabled={isProcessing}
                                >
                                    Excel (.xlsx)
                                </Button>
                                <Button
                                    size="sm"
                                    variant={exportFormat === 'csv' ? 'default' : 'outline'}
                                    onClick={() => setExportFormat('csv')}
                                    disabled={isProcessing}
                                >
                                    CSV (.csv)
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Overall Progress */}
                    {isProcessing && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span>Overall Progress</span>
                                <span>{overallProgress}%</span>
                            </div>
                            <Progress value={overallProgress} className="h-2" />
                        </div>
                    )}

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                            {files.map(batchFile => (
                                <Card key={batchFile.id} className="p-3 flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                        {batchFile.status === 'pending' && (
                                            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                                        )}
                                        {batchFile.status === 'processing' && (
                                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                        )}
                                        {batchFile.status === 'success' && (
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        )}
                                        {batchFile.status === 'error' && (
                                            <AlertCircle className="w-5 h-5 text-destructive" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium truncate">{batchFile.file.name}</p>
                                            {batchFile.file.size > LARGE_FILE_WARNING_SIZE && (
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                                                    Large
                                                </span>
                                            )}
                                        </div>
                                        {batchFile.status === 'processing' && batchFile.stage && (
                                            <p className="text-xs text-muted-foreground">
                                                {batchFile.stage}... {batchFile.progress}%
                                            </p>
                                        )}
                                        {batchFile.status === 'success' && batchFile.rowCount && (
                                            <p className="text-xs text-green-600">
                                                {batchFile.rowCount.toLocaleString()} rows, {batchFile.columnCount} columns
                                            </p>
                                        )}
                                        {batchFile.error && (
                                            <p className="text-xs text-destructive">{batchFile.error}</p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(batchFile.id)}
                                        disabled={isProcessing}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Stats */}
                    {files.length > 0 && (
                        <div className="text-xs text-muted-foreground flex gap-4">
                            <span>Total: {files.length}</span>
                            {successCount > 0 && <span className="text-green-500">✓ {successCount}</span>}
                            {errorCount > 0 && <span className="text-destructive">✗ {errorCount}</span>}
                            {processingCount > 0 && <span className="text-primary">⟳ {processingCount}</span>}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                        {isProcessing ? (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={cancelProcessing}
                                    className="flex-1"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    onClick={processFiles}
                                    disabled={files.length === 0}
                                    className="flex-1"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Convert & Download ({files.length})
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={clearAll}
                                    disabled={files.length === 0}
                                >
                                    Clear All
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
