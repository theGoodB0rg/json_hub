import {
    Check,
    X,
    Code,
    Lock,
    Zap,
    DollarSign,
    GraduationCap,
} from "lucide-react";

interface ComparisonItem {
    tool: string;
    codingRequired: boolean;
    privacy: "Excellent" | "Good" | "Poor";
    fileSizeLimit: string;
    cost: string;
    learningCurve: "Easy" | "Medium" | "Hard";
    highlight?: boolean;
}

const comparisonData: ComparisonItem[] = [
    {
        tool: "JsonExport",
        codingRequired: false,
        privacy: "Excellent",
        fileSizeLimit: "Up to 1MB",
        cost: "Free Forever",
        learningCurve: "Easy",
        highlight: true,
    },
    {
        tool: "Power Query (Excel)",
        codingRequired: true,
        privacy: "Good",
        fileSizeLimit: "Varies",
        cost: "Included with Excel",
        learningCurve: "Hard",
    },
    {
        tool: "Python + Pandas",
        codingRequired: true,
        privacy: "Excellent",
        fileSizeLimit: "Unlimited",
        cost: "Free",
        learningCurve: "Hard",
    },
    {
        tool: "Online Converters",
        codingRequired: false,
        privacy: "Poor",
        fileSizeLimit: "5-10MB",
        cost: "Free/Paid",
        learningCurve: "Easy",
    },
];

const privacyColors = {
    Excellent: "text-green-600 dark:text-green-400",
    Good: "text-yellow-600 dark:text-yellow-400",
    Poor: "text-red-600 dark:text-red-400",
};

const learningCurveColors = {
    Easy: "text-green-600 dark:text-green-400",
    Medium: "text-yellow-600 dark:text-yellow-400",
    Hard: "text-red-600 dark:text-red-400",
};

export function ComparisonTable() {
    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b-2 border-border">
                        <th className="text-left p-4 font-semibold">Tool</th>
                        <th className="p-4 font-semibold text-center">
                            <div className="flex items-center justify-center gap-2">
                                <Code className="w-4 h-4" />
                                <span className="hidden sm:inline">Coding Required</span>
                                <span className="sm:hidden">Code</span>
                            </div>
                        </th>
                        <th className="p-4 font-semibold text-center">
                            <div className="flex items-center justify-center gap-2">
                                <Lock className="w-4 h-4" />
                                <span className="hidden sm:inline">Privacy</span>
                            </div>
                        </th>
                        <th className="p-4 font-semibold text-center">
                            <div className="flex items-center justify-center gap-2">
                                <Zap className="w-4 h-4" />
                                <span className="hidden sm:inline">File Size Limit</span>
                                <span className="sm:hidden">Max Size</span>
                            </div>
                        </th>
                        <th className="p-4 font-semibold text-center">
                            <div className="flex items-center justify-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                <span className="hidden sm:inline">Cost</span>
                            </div>
                        </th>
                        <th className="p-4 font-semibold text-center">
                            <div className="flex items-center justify-center gap-2">
                                <GraduationCap className="w-4 h-4" />
                                <span className="hidden sm:inline">Learning Curve</span>
                                <span className="sm:hidden">Difficulty</span>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {comparisonData.map((item, index) => (
                        <tr
                            key={item.tool}
                            className={`border-b border-border transition-colors ${item.highlight
                                ? "bg-green-50/50 dark:bg-green-950/20 font-medium"
                                : "hover:bg-muted/30"
                                }`}
                        >
                            <td className="p-4">
                                <div className="flex items-center gap-2">
                                    {item.highlight && (
                                        <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                    )}
                                    <span className={item.highlight ? "font-semibold" : ""}>
                                        {item.tool}
                                    </span>
                                </div>
                            </td>
                            <td className="p-4 text-center">
                                {item.codingRequired ? (
                                    <X className="w-5 h-5 mx-auto text-red-500 dark:text-red-400" />
                                ) : (
                                    <Check className="w-5 h-5 mx-auto text-green-600 dark:text-green-400" />
                                )}
                            </td>
                            <td className={`p-4 text-center font-medium ${privacyColors[item.privacy]}`}>
                                {item.privacy}
                            </td>
                            <td className="p-4 text-center">{item.fileSizeLimit}</td>
                            <td className="p-4 text-center">
                                <span className={item.cost.includes("Free") ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                                    {item.cost}
                                </span>
                            </td>
                            <td className={`p-4 text-center font-medium ${learningCurveColors[item.learningCurve]}`}>
                                {item.learningCurve}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Mobile-friendly legend */}
            <div className="mt-4 p-4 bg-muted/30 rounded-lg text-xs sm:text-sm space-y-2">
                <p className="font-semibold">Why JsonExport?</p>
                <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                    <li><strong>No upload:</strong> Your data never leaves your browser (100% client-side)</li>
                    <li><strong>No upload needed:</strong> Your data never leaves your browser</li>
                    <li><strong>No coding:</strong> Simple drag-and-drop interface</li>
                    <li><strong>No cost:</strong> Free forever, no hidden fees or premium tiers</li>
                </ul>
            </div>
        </div>
    );
}
