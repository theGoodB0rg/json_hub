'use client';

import { useAppStore } from '@/lib/store/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { FileSpreadsheet, FileText, FileCode, FolderArchive, Download } from 'lucide-react';

export function ExportMenu() {
    const { flatData, selectedFormat, setSelectedFormat, exportData } = useAppStore();

    const formats = [
        { value: 'csv', label: 'CSV', icon: FileText },
        { value: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
        { value: 'html', label: 'HTML', icon: FileCode },
        { value: 'zip', label: 'Download All (ZIP)', icon: FolderArchive },
    ] as const;

    const handleExport = async () => {
        await exportData(selectedFormat);
    };

    if (flatData.length === 0) {
        return null;
    }

    return (
        <Card className="p-4 border-none shadow-md bg-card/50 backdrop-blur-sm">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Options
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
                {formats.map((format) => (
                    <Button
                        key={format.value}
                        variant={selectedFormat === format.value ? 'default' : 'outline'}
                        size="sm"
                        className="justify-start"
                        onClick={() => setSelectedFormat(format.value)}
                    >
                        <format.icon className="w-4 h-4 mr-2" />
                        {format.label}
                    </Button>
                ))}
            </div>
            <Button onClick={handleExport} className="w-full font-semibold" size="default">
                Download {formats.find((f) => f.value === selectedFormat)?.label}
            </Button>
        </Card>
    );
}
