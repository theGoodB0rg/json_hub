'use client';

import { ModeToggle } from "@/components/mode-toggle";
import { JsonEditor } from '@/components/JsonEditor/JsonEditor';
import { DataGrid } from '@/components/DataGrid/DataGrid';
import { ExportMenu } from '@/components/ExportMenu/ExportMenu';
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from '@/components/ui/resizable';

export default function Home() {
    return (
        <main className="h-screen flex flex-col">
            <header className="border-b px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Securely Convert JSON to Excel & CSV</h1>
                    <p className="text-sm text-muted-foreground">
                        Private, client-side conversion. Your data never leaves your browser.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200">
                        <span role="img" aria-label="lock">🔒</span> 100% Client-Side / Private
                    </div>
                    <ModeToggle />
                </div>
            </header>

            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup orientation="horizontal" className="h-full">
                    <ResizablePanel defaultSize={40} minSize={30}>
                        <div className="h-full p-4">
                            <JsonEditor />
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    <ResizablePanel defaultSize={60} minSize={30}>
                        <div className="h-full p-4 flex flex-col gap-4">
                            <div className="flex-1 overflow-hidden">
                                <DataGrid />
                            </div>
                            <ExportMenu />
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </main>
    );
}
