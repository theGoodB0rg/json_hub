import { getPostData, getSortedPostsData } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Metadata } from 'next';

interface Props {
    params: {
        slug: string;
    };
}

export async function generateStaticParams() {
    const posts = getSortedPostsData();
    return posts.map((post) => ({
        slug: post.id,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const postData = await getPostData(params.slug);
    if (!postData) {
        return {};
    }

    return {
        title: `${postData.title} - JsonExport`,
        description: postData.description,
        openGraph: {
            title: postData.title,
            description: postData.description,
            type: 'article',
            publishedTime: postData.date,
            url: `https://jsonexport.com/blog/${params.slug}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: postData.title,
            description: postData.description,
        },
        alternates: {
            canonical: `/blog/${params.slug}`,
        }
    };
}



import MDXComponents from "@/components/mdx/MDXComponents";
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';

export default async function Post({ params }: Props) {
    const postData = await getPostData(params.slug);

    if (!postData) {
        notFound();
    }

    return (
        <article className="container mx-auto px-4 py-12 max-w-3xl">
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
                    <Link href="/blog" className="flex items-center gap-2">
                        <ChevronLeft className="h-4 w-4" />
                        Back to Blog
                    </Link>
                </Button>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 text-foreground">
                    {postData.title}
                </h1>
                <div className="flex items-center text-muted-foreground">
                    <time dateTime={postData.date}>{postData.date}</time>
                </div>
            </div>

            <div className="prose prose-neutral dark:prose-invert max-w-none 
        prose-headings:font-bold prose-headings:tracking-tight 
        prose-a:text-primary prose-code:text-primary prose-code:bg-muted prose-code:p-1 prose-code:rounded-sm
        prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border">
                <MDXRemote
                    source={postData.content || ''}
                    components={MDXComponents}
                    options={{
                        mdxOptions: {
                            remarkPlugins: [remarkGfm],
                        }
                    }}
                />
            </div>
        </article>
    );
}
