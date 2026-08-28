'use client';

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sendUserFeedback } from '@/lib/telemetry/conversion-events';

interface ConversionFeedbackProps {
    platform?: string;
    format?: string;
    onDismiss?: () => void;
}

export function ConversionFeedback({ platform, format, onDismiss }: ConversionFeedbackProps) {
    const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRating = async (selected: 'positive' | 'negative') => {
        setRating(selected);
        await sendUserFeedback({
            rating: selected,
            platform: platform || 'generic',
            format: format || 'xlsx',
        });

        if (selected === 'positive') {
            setSubmitted(true);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await sendUserFeedback({
                rating: rating || 'negative',
                comment: comment.trim(),
                platform: platform || 'generic',
                format: format || 'xlsx',
            });
            setSubmitted(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>
                        {rating === 'positive'
                            ? 'Thank you for the feedback! Glad it worked cleanly.'
                            : 'Thank you for helping us improve! We are looking into it.'}
                    </span>
                </div>
                {onDismiss && (
                    <Button variant="ghost" size="sm" onClick={onDismiss} className="h-6 text-[10px] px-2">
                        Dismiss
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="p-3.5 rounded-xl border border-primary/20 bg-card/60 backdrop-blur-sm text-xs shadow-sm space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 font-medium text-foreground">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    <span>Did your spreadsheet export cleanly?</span>
                </div>

                {!rating ? (
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRating('positive')}
                            className="h-7 px-2.5 text-xs gap-1.5 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30"
                        >
                            <ThumbsUp className="w-3 h-3 text-emerald-500" />
                            <span>Looks Great</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRating('negative')}
                            className="h-7 px-2.5 text-xs gap-1.5 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30"
                        >
                            <ThumbsDown className="w-3 h-3 text-red-500" />
                            <span>Formatting Broken</span>
                        </Button>
                    </div>
                ) : (
                    <span className="text-muted-foreground text-[11px]">Tell us what happened below:</span>
                )}
            </div>

            {rating === 'negative' && (
                <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center pt-1 animate-in fade-in duration-200">
                    <Input
                        placeholder="What went wrong? (e.g. nested column mangled, missing rows)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="h-7 text-xs flex-1 bg-background"
                        autoFocus
                    />
                    <Button type="submit" size="sm" disabled={!comment.trim() || isSubmitting} className="h-7 px-2.5 text-xs gap-1">
                        <Send className="w-3 h-3" />
                        <span>Send Note</span>
                    </Button>
                </form>
            )}
        </div>
    );
}
