import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

// Custom components Mapping
const MDXComponents = {
    // Headings
    h1: ({ className, ...props }: ComponentProps<'h1'>) => (
        <h1
            className={cn(
                "mt-2 scroll-m-20 text-4xl font-bold tracking-tight",
                className
            )}
            {...props}
        />
    ),
    h2: ({ className, ...props }: ComponentProps<'h2'>) => (
        <h2
            className={cn(
                "mt-10 scroll-m-20 border-b pb-1 text-3xl font-semibold tracking-tight first:mt-0",
                className
            )}
            {...props}
        />
    ),
    h3: ({ className, ...props }: ComponentProps<'h3'>) => (
        <h3
            className={cn(
                "mt-8 scroll-m-20 text-2xl font-semibold tracking-tight",
                className
            )}
            {...props}
        />
    ),
    // Text
    p: ({ className, ...props }: ComponentProps<'p'>) => (
        <p
            className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
            {...props}
        />
    ),
    blockquote: ({ className, ...props }: ComponentProps<'blockquote'>) => (
        <blockquote
            className={cn(
                "mt-6 border-l-2 pl-6 italic text-muted-foreground",
                className
            )}
            {...props}
        />
    ),
    // Lists
    ul: ({ className, ...props }: ComponentProps<'ul'>) => (
        <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)} {...props} />
    ),
    ol: ({ className, ...props }: ComponentProps<'ol'>) => (
        <ol className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", className)} {...props} />
    ),
    // Code
    code: ({ className, ...props }: ComponentProps<'code'>) => (
        <code
            className={cn(
                "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
                className
            )}
            {...props}
        />
    ),
    // Images (Optimized)
    img: ({ className, alt, ...props }: ComponentProps<'img'>) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            className={cn("rounded-md border", className)}
            alt={alt}
            {...props}
        />
    ),
    // Tables (Crucial for Data Analyst Content)
    table: ({ className, ...props }: ComponentProps<'table'>) => (
        <div className="my-6 w-full overflow-y-auto">
            <table className={cn("w-full", className)} {...props} />
        </div>
    ),
    tr: ({ className, ...props }: ComponentProps<'tr'>) => (
        <tr className={cn("m-0 border-t p-0 even:bg-muted", className)} {...props} />
    ),
    th: ({ className, ...props }: ComponentProps<'th'>) => (
        <th
            className={cn(
                "border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
                className
            )}
            {...props}
        />
    ),
    td: ({ className, ...props }: ComponentProps<'td'>) => (
        <td
            className={cn(
                "border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
                className
            )}
            {...props}
        />
    ),
    // Links
    // Links
    a: ({ className, href, ...props }: ComponentProps<'a'>) => {
        const url = href || '';
        const isInternal = url.startsWith('/') || url.startsWith('#');

        if (isInternal) {
            return (
                <Link
                    href={url}
                    className={cn("font-medium underline underline-offset-4 hover:text-primary", className)}
                    {...props}
                />
            );
        }

        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("font-medium underline underline-offset-4 hover:text-primary", className)}
                {...props}
            />
        );
    },
};

export default MDXComponents;
