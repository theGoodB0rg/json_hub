'use client';

import { Star, Github } from 'lucide-react';
import { trackConversionEvent } from '@/lib/telemetry/conversion-events';

export function GitHubStarBanner() {
    return (
        <div className="w-full bg-[#0d1117] border-b border-[#30363d]">
            <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                    <a
                        href="https://github.com/theGoodB0rg/json_hub"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackConversionEvent('github_star_click', { location: 'banner' })}
                        className="flex items-center gap-2 text-sm font-semibold text-[#c9d1d9] hover:text-white transition-colors"
                    >
                        <Star className="w-4 h-4 text-[#e3b341] fill-[#e3b341]" />
                        Your star fuels development
                    </a>
                    <p className="text-xs text-[#8b949e]">
                        Star the repo to show you care{' '}
                        <a
                            href="https://github.com/theGoodB0rg/json_hub/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackConversionEvent('github_issues_click', { location: 'banner' })}
                            className="text-[#58a6ff] hover:underline"
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
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#21262d] border border-[#30363d] px-3 py-1.5 text-xs font-medium text-[#c9d1d9] hover:bg-[#30363d] hover:text-white transition-colors shrink-0"
                >
                    <Github className="w-3.5 h-3.5" />
                    Star
                </a>
            </div>
        </div>
    );
}
