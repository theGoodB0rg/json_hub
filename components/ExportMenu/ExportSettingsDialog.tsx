
'use client';

import { useAppStore } from '@/lib/store/store';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { LayoutGrid, Layers, Download } from 'lucide-react';
import { useState } from 'react';
import { ExportFormat } from '@/types/store.types';

export function ExportSettingsDialog({
    isOpen,
    setIsOpen,
    onConfirm
}: {
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    onConfirm: (format: ExportFormat) => void
}) {
    const { exportSettings, updateExportSettings, selectedFormat } = useAppStore();
    const [structure, setStructure] = useState(exportSettings.structure);
    const [dontAskAgain, setDontAskAgain] = useState(!exportSettings.askForPreference);

    const handleConfirm = () => {
        updateExportSettings({
            structure,
            askForPreference: !dontAskAgain
        });
        setIsOpen(false);
        onConfirm(selectedFormat);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[450px] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="w-5 h-5 text-primary" />
                        Download Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Choose how your JSON data should be structured in the spreadsheet.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    <RadioGroup
                        value={structure}
                        onValueChange={(v) => setStructure(v as 'flat' | 'nested')}
                        className="grid grid-cols-1 gap-4"
                    >
                        <div className="relative group">
                            <RadioGroupItem value="flat" id="flat" className="peer sr-only" />
                            <Label
                                htmlFor="flat"
                                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                            >
                                <div className="flex w-full items-start gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <LayoutGrid className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm">Flattened (Recommended)</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Best for Excel analysis. Arrays are expanded into multiple columns (e.g. tags.0, tags.1).
                                        </p>
                                    </div>
                                </div>
                            </Label>
                        </div>

                        <div className="relative group">
                            <RadioGroupItem value="nested" id="nested" className="peer sr-only" />
                            <Label
                                htmlFor="nested"
                                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                            >
                                <div className="flex w-full items-start gap-3">
                                    <div className="bg-violet-500/10 p-2 rounded-lg text-violet-600 dark:text-violet-400">
                                        <Layers className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm">Relational (Hierarchical)</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Best for complex apps. Creates multiple rows for each item in nested arrays.
                                        </p>
                                    </div>
                                </div>
                            </Label>
                        </div>
                    </RadioGroup>

                    <div className="flex items-center space-x-2 px-1">
                        <Checkbox
                            id="dontAsk"
                            checked={dontAskAgain}
                            onCheckedChange={(checked) => setDontAskAgain(checked as boolean)}
                        />
                        <label
                            htmlFor="dontAsk"
                            className="text-xs text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                            Remember my choice and don&apos;t ask again
                        </label>
                    </div>
                </div>

                <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-6">
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} className="px-8 shadow-lg shadow-primary/20">
                        Start Download
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
