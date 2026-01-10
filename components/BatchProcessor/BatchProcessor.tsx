'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Files, Upload, Download, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import JSZip from 'jszip';
import { flattenJSON } from '@/lib/parsers/flattener';
import { smartUnwrap } from '@/lib/parsers/unwrapper';
import * as XLSX from 'xlsx';

interface BatchFile {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'success' | 'error';
    error?: string;
}

export function BatchProcessor() {
    const [isOpen, setIsOpen] = useState(false);
    const [files, setFiles] = useState<BatchFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        const newFiles: BatchFile[] = selectedFiles.map(file => ({
            id: crypto.randomUUID(),
            file,
            status: 'pending'
        }));
        setFiles(prev => [...prev, ...newFiles]);
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const clearAll = () => {
        setFiles([]);
    };

    const processFiles = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        const zip = new JSZip();

        for (const batchFile of files) {
            // Update status to processing
            setFiles(prev => prev.map(f =>
                f.id === batchFile.id ? { ...f, status: 'processing' } : f
            ));

            try {
                // Read file
                const text = await batchFile.file.text();
                const parsed = JSON.parse(text);

                // Process JSON
                const { data: unwrapped } = smartUnwrap(parsed);
                const { rows, schema } = flattenJSON(unwrapped);

                // Generate output filename
                const baseName = batchFile.file.name.replace(/\.json$/i, '');

                if (exportFormat === 'xlsx') {
                    // Create Excel file
                    const worksheetData = [schema, ...rows.map(row => schema.map(col => row[col] ?? null))];
                    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

                    // Write to buffer
                    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
                    zip.file(`${baseName}.xlsx`, excelBuffer);
                } else {
                    // Create CSV file
                    const csvContent = [
                        schema.join(','),
                        ...rows.map(row => schema.map(col => {
                            const value = row[col];
                            if (value === null || value === undefined) return '';
                            const str = String(value);
                            return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
                        }).join(','))
                    ].join('\n');

                    zip.file(`${baseName}.csv`, csvContent);
                }

                // Update status to success
                setFiles(prev => prev.map(f =>
                    f.id === batchFile.id ? { ...f, status: 'success' } : f
                ));

            } catch (error) {
                // Update status to error
                setFiles(prev => prev.map(f =>
                    f.id === batchFile.id ? {
                        ...f,
                        status: 'error',
                        error: error instanceof Error ? error.message : 'Failed to process'
                    } : f
                ));
            }
        }

        // Download ZIP
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch-conversion-${Date.now()}.zip`;
        a.click();
        URL.revokeObjectURL(url);

        setIsProcessing(false);
    };

    const pendingCount = files.filter(f => f.status === 'pending').length;
    const successCount = files.filter(f => f.status === 'success').length;
    const errorCount = files.filter(f => f.status === 'error').length;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
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
                                        <p className="text-sm font-medium truncate">{batchFile.file.name}</p>
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
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                        <Button
                            onClick={processFiles}
                            disabled={files.length === 0 || isProcessing}
                            className="flex-1"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Convert & Download ({files.length})
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={clearAll}
                            disabled={files.length === 0 || isProcessing}
                        >
                            Clear All
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
