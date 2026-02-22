'use client';

import { Rocket, MessageSquareText, BadgeCheck } from 'lucide-react';
import { trackConversionEvent } from '@/lib/telemetry/conversion-events';
import { getSocialProofChannels } from '@/lib/growth/social-proof';

const CHANNEL_ICONS = {
    product_hunt: Rocket,
    g2: MessageSquareText,
    capterra: BadgeCheck,
} as const;

export function SocialProofBadges() {
    const channels = getSocialProofChannels();

    return (
        <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Social Proof</p>
            <div className="flex flex-wrap gap-2">
                {channels.map((channel) => {
                    const Icon = CHANNEL_ICONS[channel.id];

                    if (channel.status === 'live' && channel.href) {
                        return (
                            <a
                                key={channel.id}
                                href={channel.href}
                                target="_blank"
                                rel="noopener noreferrer nofollow sponsored"
                                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                                onClick={() =>
                                    trackConversionEvent('growth_badge_click', {
                                        channel: channel.id,
                                        location: 'footer',
                                    })
                                }
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {channel.label}
                            </a>
                        );
                    }

                    return (
                        <span
                            key={channel.id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {channel.label} Soon
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

