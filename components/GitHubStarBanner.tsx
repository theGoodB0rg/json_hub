'use client';

import { Star, Github } from 'lucide-react';
import { trackConversionEvent } from '@/lib/telemetry/conversion-events';

export function GitHubStarBanner() {
    return (
        <>
            <style>{`
                @keyframes star-pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.18); opacity: 0.7; }
                }
                .star-pulse {
                    animation: star-pulse 4s ease-in-out infinite;
                    animation-delay: 2s;
                }
            `}</style>
            <div className="sticky top-16 z-40 mx-2 md:mx-4 my-2 rounded-xl border bg-[#0d1117] dark:bg-green-950/30 border-[#30363d] dark:border-green-800/40 shadow-sm">
                <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-center gap-x-6 gap-3">
                    <div className="flex flex-col gap-0.5">
                        <a
                            href="https://github.com/theGoodB0rg/json_hub"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackConversionEvent('github_star_click', { location: 'banner' })}
                            className="flex items-center gap-2 text-sm font-semibold text-[#c9d1d9] dark:text-green-100 hover:text-white dark:hover:text-white transition-colors"
                        >
                            <Star className="star-pulse w-4 h-4 text-[#e3b341] fill-[#e3b341]" />
                            Your star fuels development
                        </a>
                        <p className="text-xs text-[#8b949e] dark:text-green-200/70">
                            Star the repo to show you care{' '}
                            <a
                                href="https://github.com/theGoodB0rg/json_hub/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackConversionEvent('github_issues_click', { location: 'banner' })}
                                className="text-[#58a6ff] dark:text-green-400 hover:underline"
                            >
                                + file issues
                            </a>
                            {' '}on GitHub
                        </p>
                    </div>
                    <a
                        href="https://github.com/theGoodB0rg/json_hub"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackConversionEvent('github_star_click', { location: 'banner-button' })}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[#21262d] dark:bg-green-900/40 border border-[#30363d] dark:border-green-800/40 px-3 py-1.5 text-xs font-medium text-[#c9d1d9] dark:text-green-100 hover:bg-[#30363d] dark:hover:bg-green-800/50 hover:text-white transition-colors shrink-0"
                    >
                        <Github className="w-3.5 h-3.5" />
                        Star
                    </a>
                </div>
            </div>
        </>
    );
}
