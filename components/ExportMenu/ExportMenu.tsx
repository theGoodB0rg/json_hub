'use client';

import { useAppStore } from '@/lib/store/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { FileSpreadsheet, FileText, FileCode, FolderArchive, Download, Settings2, LayoutGrid, Layers } from 'lucide-react';
import { useState } from 'react';
import { ExportSettingsDialog } from './ExportSettingsDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ExportMenu() {
    const {
        flatData,
        selectedFormat,
        setSelectedFormat,
        exportData,
        exportSettings,
        updateExportSettings
    } = useAppStore();

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const formats = [
        { value: 'csv', label: 'CSV', icon: FileText },
        { value: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
        { value: 'html', label: 'HTML', icon: FileCode },
        { value: 'zip', label: 'Download All (ZIP)', icon: FolderArchive },
    ] as const;

    const handleExportClick = () => {
        if (exportSettings.askForPreference) {
            setIsDialogOpen(true);
        } else {
            exportData(selectedFormat);
        }
    };

    if (flatData.length === 0) {
        return null;
    }

    return (
        <Card className="p-4 border-none shadow-xl bg-card/50 backdrop-blur-sm ring-1 ring-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Download className="w-20 h-20" />
            </div>

            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2">
                    <Download className="w-4 h-4 text-primary" />
                    Export Options
                </h3>

                <TooltipProvider>
                    <div className="flex border rounded-lg p-0.5 bg-muted/50">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={exportSettings.structure === 'flat' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    className="h-6 w-6 rounded-md"
                                    onClick={() => updateExportSettings({ structure: 'flat' })}
                                >
                                    <LayoutGrid className="h-3 w-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-[10px]">Flat Structure</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={exportSettings.structure === 'nested' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    className="h-6 w-6 rounded-md"
                                    onClick={() => updateExportSettings({ structure: 'nested' })}
                                >
                                    <Layers className="h-3 w-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-[10px]">Relational (Nested) Structure</p></TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
                {formats.map((format) => (
                    <Button
                        key={format.value}
                        variant={selectedFormat === format.value ? 'default' : 'outline'}
                        size="sm"
                        className={`justify-start border-white/5 ${selectedFormat === format.value ? 'shadow-lg shadow-primary/20' : ''}`}
                        onClick={() => setSelectedFormat(format.value)}
                    >
                        <format.icon className="w-4 h-4 mr-2" />
                        {format.label}
                    </Button>
                ))}
            </div>

            <Button onClick={handleExportClick} className="w-full font-bold shadow-lg shadow-primary/20 relative group overflow-hidden" size="lg">
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                Download {formats.find((f) => f.value === selectedFormat)?.label}
            </Button>

            <ExportSettingsDialog
                isOpen={isDialogOpen}
                setIsOpen={setIsDialogOpen}
                onConfirm={(format) => exportData(format)}
            />
        </Card>
    );
}

