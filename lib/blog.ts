import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'content/blog');

export type FAQItem = {
    question: string;
    answer: string;
};

export type BlogPost = {
    id: string;
    title: string;
    date: string;
    description?: string;
    content?: string;
    faqs?: FAQItem[];
};

/**
 * Extract FAQ items from markdown content.
 * Looks for patterns like:
 * ### Q: Question here?
 * **A:** Answer here.
 */
function extractFAQsFromContent(content: string): FAQItem[] {
    const faqs: FAQItem[] = [];

    // Pattern: Q: / A: format
    const qaPattern = /###?\s*Q:\s*(.+?)\s*\n+\*\*A:\*\*\s*(.+?)(?=\n\n###|\n\n---|\n\n##|\n\n\*\*|$)/gs;
    let match;

    while ((match = qaPattern.exec(content)) !== null) {
        faqs.push({
            question: match[1].trim().replace(/\*\*/g, ''),
            answer: match[2].trim().replace(/\*\*/g, '').replace(/\n/g, ' ')
        });
    }

    // If no Q:/A: format found, try to find FAQ section with ### headers
    if (faqs.length === 0) {
        const faqSectionPattern = /##\s*FAQ\s*\n([\s\S]*?)(?=\n##\s|$)/i;
        const faqSection = faqSectionPattern.exec(content);

        if (faqSection) {
            const qPattern = /###\s*(.+?\?)\s*\n+([\s\S]*?)(?=\n###|\n##|$)/g;
            while ((match = qPattern.exec(faqSection[1])) !== null) {
                const question = match[1].trim().replace(/^Q:\s*/i, '');
                const answer = match[2].trim().replace(/\*\*A:\*\*\s*/i, '').replace(/\n+/g, ' ').trim();
                if (question && answer) {
                    faqs.push({ question, answer });
                }
            }
        }
    }

    return faqs;
}



export function getSortedPostsData(): BlogPost[] {
    // Get file names under /posts
    if (!fs.existsSync(postsDirectory)) {
        return [];
    }
    const fileNames = fs.readdirSync(postsDirectory);
    const allPostsData = fileNames.map((fileName) => {
        // Remove ".md" from file name to get id
        const id = fileName.replace(/\.md$/, '');

        // Read markdown file as string
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');

        // Use gray-matter to parse the post metadata section
        const matterResult = matter(fileContents);

        // Combine the data with the id
        return {
            id,
            ...(matterResult.data as { date: string; title: string; description?: string }),
        };
    });
    // Sort posts by date
    return allPostsData.sort((a, b) => {
        if (a.date < b.date) {
            return 1;
        } else {
            return -1;
        }
    });
}


export async function getPostData(id: string): Promise<BlogPost | null> {
    const fullPath = path.join(postsDirectory, `${id}.md`);
    if (!fs.existsSync(fullPath)) {
        return null; // Handle missing file gracefully
    }
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents);

    // Extract FAQs from content for schema markup
    const faqs = extractFAQsFromContent(matterResult.content);

    // Return raw content for next-mdx-remote/rsc
    return {
        id,
        content: matterResult.content,
        faqs: faqs.length > 0 ? faqs : undefined,
        ...(matterResult.data as { date: string; title: string; description?: string }),
    };
}
