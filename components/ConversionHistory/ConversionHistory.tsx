'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { History, Download, Trash2, FileJson } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { conversionHistory, ConversionRecord } from '@/lib/storage/conversionHistory';
import { useAppStore } from '@/lib/store/store';
import { cn } from '@/lib/utils';

interface ConversionHistoryProps {
    className?: string;
}

export function ConversionHistory({ className }: ConversionHistoryProps) {
    const [conversions, setConversions] = useState<ConversionRecord[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const { setRawInput } = useAppStore();

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    const loadHistory = async () => {
        try {
            const records = await conversionHistory.getRecentConversions();
            setConversions(records);
        } catch (error) {
            console.error('Failed to load conversion history:', error);
        }
    };

    const handleReload = async (record: ConversionRecord) => {
        try {
            setRawInput(record.originalJSON);
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to reload conversion:', error);
        }
    };

    const handleDelete = async (id: string, event: React.MouseEvent) => {
        event.stopPropagation();
        try {
            await conversionHistory.deleteConversion(id);
            loadHistory();
        } catch (error) {
            console.error('Failed to delete conversion:', error);
        }
    };

    const handleClearAll = async () => {
        if (confirm('Are you sure you want to clear all conversion history?')) {
            try {
                await conversionHistory.clearAll();
                setConversions([]);
            } catch (error) {
                console.error('Failed to clear history:', error);
            }
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className={cn("gap-2", className)}>
                            <History className="h-4 w-4" />
                            <span className="hidden sm:inline">History</span>
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Conversion History</p>
                </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Recent Conversions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {conversions.length === 0 ? (
                    <div className="p-8 text-center">
                        <FileJson className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">No conversion history yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Your last 10 conversions will appear here
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="max-h-96 overflow-y-auto">
                            {conversions.map((record) => (
                                <DropdownMenuItem
                                    key={record.id}
                                    className="flex items-start gap-3 p-3 cursor-pointer"
                                    onClick={() => handleReload(record)}
                                >
                                    <FileJson className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">
                                            {record.fileName || 'Untitled'}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {record.rowCount} rows • {record.exportFormat.toUpperCase()} • {formatDate(record.timestamp)}
                                        </div>
                                    </div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 flex-shrink-0"
                                                onClick={(e) => handleDelete(record.id, e)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Delete from History</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </DropdownMenuItem>
                            ))}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleClearAll}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear All History
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
