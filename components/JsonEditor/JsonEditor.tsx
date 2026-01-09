'use client';

import { useAppStore } from '@/lib/store/store';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

    const handleEditorChange = (value: string | undefined) => {
        setRawInput(value || '');
    };

    const handleParse = () => {
        parseInput();
    };

    const handleClear = () => {
        setRawInput('');
    };

    return (
        <Card className="h-full flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">JSON Input</h2>
                <div className="flex gap-2">
                    <Button onClick={handleClear} variant="outline" size="sm">
                        Clear
                    </Button>
                    <Button onClick={handleParse} size="sm">
                        Parse & Flatten
                    </Button>
                </div>
            </div>

            <div className="flex-1 border rounded-md overflow-hidden">
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
