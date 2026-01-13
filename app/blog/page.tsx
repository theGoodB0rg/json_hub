import Link from 'next/link';
import { getSortedPostsData } from '@/lib/blog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const metadata = {
    title: 'Blog - JsonExport',
    description: 'Articles, tutorials, and guides about JSON conversion, data formatting, and developer tools.',
};

export default function BlogIndex() {
    const allPostsData = getSortedPostsData();

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-bold tracking-tight mb-4 text-foreground">
                    Developer Blog
                </h1>
                <p className="text-lg text-muted-foreground">
                    Tips, tricks, and guides for data formatting and conversion.
                </p>
            </div>

            <div className="grid gap-6">
                {allPostsData.map(({ id, date, title, description }) => (
                    <Link href={`/blog/${id}`} key={id} className="block group">
                        <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/30">
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                                        {title}
                                    </CardTitle>
                                </div>
                                <CardDescription className="text-base line-clamp-2">
                                    {description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <time className="text-sm text-muted-foreground">{date}</time>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
