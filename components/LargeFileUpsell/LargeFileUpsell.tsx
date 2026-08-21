'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Download, ShieldCheck, Layers, Cpu, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { LicenseModal } from '../LicenseModal';
import { useProStore } from '@/lib/store/proStore';

interface LargeFileUpsellProps {
    isOpen: boolean;
    onClose: () => void;
    onProceedAnyway?: () => void;
    fileSize: number;
}

export function LargeFileUpsell({ isOpen, onClose, onProceedAnyway, fileSize }: LargeFileUpsellProps) {
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(1);
    const [isLicenseOpen, setIsLicenseOpen] = useState(false);
    const { setIsPro } = useProStore();

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-primary font-bold text-lg">
                            <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
                            Large File Detected ({fileSizeMB}MB)
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                            Browser memory limits (V8) make web processing slow and prone to freezing on files over 10MB.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 my-2">
                        {/* Primary Desktop Pro Hero Card */}
                        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground rounded-full">
                                    Recommended
                                </span>
                                <h4 className="font-bold text-base flex items-center gap-1.5">
                                    JsonExport Desktop Pro <Cpu className="w-4 h-4 text-primary" />
                                </h4>
                            </div>

                            <p className="text-xs text-muted-foreground mb-3">
                                Powered by our native Rust streaming engine. Process multi-gigabyte JSON files directly on your machine with constant 20MB RAM.
                            </p>

                            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                                    <span>2GB files in 3 seconds</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Batch 500+ files</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>100% Offline / DLP Safe</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Download className="w-3.5 h-3.5 text-purple-500" />
                                    <span>Right-click OS menu</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    asChild
                                    className="flex-1 font-bold shadow-md shadow-primary/20"
                                >
                                    <a
                                        href="https://gumroad.com/l/json_hub"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Get Desktop Pro — $29 Lifetime
                                    </a>
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        onClose();
                                        setIsLicenseOpen(true);
                                    }}
                                    className="text-xs"
                                >
                                    Enter License Key
                                </Button>
                            </div>
                        </div>

                        {/* Secondary Cloud Pipeline Option */}
                        <div className="text-xs text-muted-foreground flex items-center justify-between px-1">
                            <span>Need live automated scheduled sync?</span>
                            <a
                                href="https://coupler.io/?ref=jsonexport"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1 font-medium"
                            >
                                Coupler.io Cloud Sync <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t">
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            Cancel
                        </Button>
                        {onProceedAnyway && (
                            <Button variant="outline" size="sm" onClick={onProceedAnyway} className="text-xs text-muted-foreground">
                                Try in Browser Anyway
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <LicenseModal
                isOpen={isLicenseOpen}
                onOpenChange={setIsLicenseOpen}
                onSuccess={() => {
                    setIsLicenseOpen(false);
                    setIsPro(true);
                }}
            />
        </>
    );
}
