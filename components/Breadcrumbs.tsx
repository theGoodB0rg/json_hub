import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
    label: string;
    href: string;
    active?: boolean;
}

interface Props {
    items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: Props) {
    return (
        <nav aria-label="Breadcrumb" className="py-4 text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2 duration-500">
            <ol className="flex items-center gap-1.5 flex-wrap">
                <li className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Link href="/" className="flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5" />
                        <span className="sr-only">Home</span>
                    </Link>
                </li>
                {items.map((item, index) => (
                    <li key={item.href} className="flex items-center gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                        {item.active ? (
                            <span
                                className="font-medium text-foreground"
                                aria-current="page"
                            >
                                {item.label}
                            </span>
                        ) : (
                            <Link
                                href={item.href}
                                className="hover:text-foreground transition-colors"
                            >
                                {item.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
