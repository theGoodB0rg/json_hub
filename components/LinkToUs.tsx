"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Heart, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

export function LinkToUs() {
    const [copied, setCopied] = useState(false);
    const linkCode = `<a href="https://jsonexport.com">Free JSON to Excel Converter</a>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(linkCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="hover:text-primary transition-colors flex items-center gap-2 text-left">
                    <Heart className="w-3.5 h-3.5 text-red-500" /> Link to Us
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share the Love ❤️</DialogTitle>
                    <DialogDescription>
                        If JsonExport helped you, a link back helps us keep improving it.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2 mt-4">
                    <div className="grid flex-1 gap-2">
                        <Input
                            defaultValue={linkCode}
                            readOnly
                            className="bg-muted font-mono text-sm h-9"
                        />
                    </div>
                    <Button type="submit" size="sm" className="px-3" onClick={handleCopy}>
                        {copied ? (
                            <Check className="h-4 w-4" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                        <span className="sr-only">Copy</span>
                    </Button>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                    Copy and paste this snippet into your website, blog, or documentation.
                </div>
            </DialogContent>
        </Dialog>
    );
}
