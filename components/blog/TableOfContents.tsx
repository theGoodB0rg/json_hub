'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TOCItem {
    id: string;
    title: string;
    level: number;
}

interface TableOfContentsProps {
    items: TOCItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '0% 0% -80% 0%' }
        );

        items.forEach((item) => {
            const element = document.getElementById(item.id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, [items]);

    return (
        <nav className="space-y-2">
            <h4 className="font-semibold text-sm mb-4">On this page</h4>
            <ul className="space-y-2 border-l border-border/50">
                {items.map((item) => (
                    <li key={item.id} style={{ paddingLeft: item.level === 3 ? '1rem' : '0' }}>
                        <a
                            href={`#${item.id}`}
                            className={cn(
                                "block pl-4 text-sm transition-colors relative py-1",
                                activeId === item.id
                                    ? "text-primary font-medium"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(item.id)?.scrollIntoView({
                                    behavior: 'smooth'
                                });
                                setActiveId(item.id);
                            }}
                        >
                            {activeId === item.id && (
                                <motion.div
                                    layoutId="active-toc"
                                    className="absolute left-[-1px] top-0 bottom-0 w-[2px] bg-primary"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                />
                            )}
                            {item.title}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
