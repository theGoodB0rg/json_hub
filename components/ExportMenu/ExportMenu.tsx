'use client';

import { useAppStore } from '@/lib/store/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ExportMenu() {
    const { flatData, selectedFormat, setSelectedFormat, exportData } = useAppStore();

    const formats = [
        { value: 'csv', label: 'CSV' },
        { value: 'xlsx', label: 'Excel' },
        { value: 'html', label: 'HTML' },
        { value: 'zip', label: 'Download All (ZIP)' },
    ] as const;

    const handleExport = async () => {
        await exportData(selectedFormat);
    };

    if (flatData.length === 0) {
        return null;
    }

    return (
        <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Export Options</h3>
            <div className="flex flex-wrap gap-2 mb-3">
                {formats.map((format) => (
                    <Button
                        key={format.value}
                        variant={selectedFormat === format.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedFormat(format.value)}
                    >
                        {format.label}
                    </Button>
                ))}
            </div>
            <Button onClick={handleExport} className="w-full" size="sm">
                Download {formats.find((f) => f.value === selectedFormat)?.label}
            </Button>
        </Card>
    );
}
