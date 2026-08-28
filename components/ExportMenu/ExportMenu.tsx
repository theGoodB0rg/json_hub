'use client';

import { useAppStore } from '@/lib/store/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { FileSpreadsheet, FileText, FileCode, FolderArchive, FileJson, Download, Settings2, LayoutGrid, Layers } from 'lucide-react';
import { useState } from 'react';
import { ExportSettingsDialog } from './ExportSettingsDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProStore } from '@/lib/store/proStore';
import { LicenseModal } from '../LicenseModal';
import { pluginRegistry } from '@/lib/plugins/registry';
import { ConversionFeedback } from '@/components/FeedbackWidget/ConversionFeedback';

export function ExportMenu() {
    const {
        flatData,
        selectedFormat,
        setSelectedFormat,
        exportData,
        exportSettings,
        updateExportSettings,
        rawInput,
        activePluginId,
    } = useAppStore();

    const { isPro, setIsPro } = useProStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
    const [hasExported, setHasExported] = useState(false);

    const currentPlugin = pluginRegistry.getOrDefault(activePluginId);

    const allFormats = [
        { value: 'csv', label: 'CSV', icon: FileText },
        { value: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
        { value: 'json', label: 'JSON', icon: FileJson },
        { value: 'html', label: 'HTML', icon: FileCode },
        { value: 'zip', label: 'Download All (ZIP)', icon: FolderArchive },
    ] as const;

    const formats = allFormats.filter((f) =>
        currentPlugin.uiConfig.availableExportFormats.includes(f.value as any)
    );

    const handleExportClick = () => {
        const isOversized = rawInput.length > 10 * 1024 * 1024;
        if (isOversized && !isPro) {
            setIsLicenseModalOpen(true);
            return;
        }

        if (exportSettings.askForPreference) {
            setIsDialogOpen(true);
        } else {
            exportData(selectedFormat);
            setHasExported(true);
        }
    };

    if (flatData.length === 0) {
        return null;
    }

    return (
        <Card className="p-4 border-none shadow-xl bg-card/50 backdrop-blur-sm ring-1 ring-white/10 relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Download className="w-20 h-20" />
            </div>

            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                    <Download className="w-4 h-4 text-primary" />
                    Export Options
                </h3>

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
            </div>

            <div className="grid grid-cols-2 gap-2">
                {formats.map((format) => (
                    <Button
                        key={format.value}
                        variant={selectedFormat === format.value ? 'default' : 'outline'}
                        size="sm"
                        className={`justify-start border-white/5 ${selectedFormat === format.value ? 'shadow-lg shadow-primary/20' : ''}`}
                        onClick={() => setSelectedFormat(format.value)}
                    >
                        <format.icon className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="truncate">{format.label}</span>
                    </Button>
                ))}
            </div>

            <Button
                onClick={handleExportClick}
                className="w-full font-bold shadow-lg shadow-primary/20 relative group overflow-hidden"
                size="lg"
                data-testid="export-download-button"
            >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                Download {formats.find((f) => f.value === selectedFormat)?.label}
            </Button>

            {hasExported && (
                <ConversionFeedback
                    platform={activePluginId}
                    format={selectedFormat}
                    onDismiss={() => setHasExported(false)}
                />
            )}

            <ExportSettingsDialog
                isOpen={isDialogOpen}
                setIsOpen={setIsDialogOpen}
                onConfirm={(format) => {
                    exportData(format);
                    setHasExported(true);
                }}
            />

            <LicenseModal 
                isOpen={isLicenseModalOpen}
                onOpenChange={setIsLicenseModalOpen}
                onSuccess={async (key) => {
                    setIsLicenseModalOpen(false);
                    setIsPro(true);
                    try {
                        const { load } = await import('@tauri-apps/plugin-store');
                        const store = await load('store.bin', { autoSave: false });
                        await store.set('gumroad_license', key);
                        await store.save();
                    } catch (e) {
                        // ignore error
                    }
                }}
            />
        </Card>
    );
}
