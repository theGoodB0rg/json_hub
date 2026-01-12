'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store/store';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, ClipboardPaste } from 'lucide-react';
import { TemplateSelector } from '@/components/TemplateSelector/TemplateSelector';

// Dynamically import Monaco Editor with SSR disabled
const Editor = dynamic(() => import('@monaco-editor/react'), {
    ssr: false,
    loading: () => (
        <div className="h-full flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">Loading editor...</p>
        </div>
    ),
});

export function JsonEditor() {
    const { rawInput, setRawInput, parseInput, isParsed, parseErrors, prettyPrint } = useAppStore();

    // Auto-parse with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (rawInput.trim()) {
                parseInput();
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [rawInput, parseInput]);

    const handleEditorChange = (value: string | undefined) => {
        setRawInput(value || '');
    };

    const handleClear = () => {
        setRawInput('');
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('File size exceeds 10MB limit');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setRawInput(content);
        };
        reader.readAsText(file);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (!file) return;

        // Check file size
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('File size exceeds 10MB limit');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setRawInput(content);
        };
        reader.readAsText(file);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    return (
        <Card className="h-full flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground hidden sm:block">JSON Input</h2>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <TemplateSelector />
                    <input
                        type="file"
                        accept=".json,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                    />
                    <Button
                        onClick={() => document.getElementById('file-upload')?.click()}
                        variant="outline"
                        size="sm"
                        title="Upload File"
                        className="px-2 sm:px-3"
                    >
                        <Upload className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Upload File</span>
                    </Button>
                    <Button
                        onClick={handleClear}
                        variant="outline"
                        size="sm"
                        title="Clear"
                        className="px-2 sm:px-3"
                    >
                        <Trash2 className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Clear</span>
                    </Button>
                    <Button
                        onClick={async () => {
                            try {
                                const text = await navigator.clipboard.readText();
                                setRawInput(text);
                            } catch (err) {
                                console.error('Failed to read clipboard', err);
                                alert('Could not access clipboard. Please paste manually (Ctrl+V or Cmd+V).');
                            }
                        }}
                        variant="outline"
                        size="sm"
                        title="Paste from Clipboard"
                        className="px-2 sm:px-3"
                    >
                        <ClipboardPaste className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Paste</span>
                    </Button>
                </div>
            </div>

            <div
                className="flex-1 border rounded-md overflow-hidden relative"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={rawInput}
                    onChange={handleEditorChange}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                    }}
                />
            </div>

            {parseErrors.length > 0 && (
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
