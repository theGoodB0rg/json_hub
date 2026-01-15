import { Shield, Lock, Zap, DollarSign } from "lucide-react";

interface Badge {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
}

const badges: Badge[] = [
    {
        icon: Lock,
        label: "No Data Upload",
        description: "100% client-side processing"
    },
    {
        icon: Shield,
        label: "GDPR/HIPAA Compliant",
        description: "Privacy-first design"
    },
    {
        icon: Zap,
        label: "No File Size Limits",
        description: "Handle 50MB+ files"
    },
    {
        icon: DollarSign,
        label: "Free Forever",
        description: "No hidden fees"
    }
];

export function SecurityBadges() {
    return (
        <div className="flex flex-wrap items-center justify-center gap-4 py-6">
            {badges.map((badge, index) => {
                const Icon = badge.icon;
                return (
                    <div
                        key={index}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                    >
                        <Icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
                            <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                                {badge.label}
                            </span>
                            <span className="hidden sm:inline text-green-600 dark:text-green-500">•</span>
                            <span className="text-xs text-green-600 dark:text-green-500">
                                {badge.description}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
