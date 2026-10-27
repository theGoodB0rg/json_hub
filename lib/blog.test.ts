import { getSortedPostsData } from './blog';

describe('blog metadata', () => {
    const posts = getSortedPostsData();

    it('gives every post a meta description (excerpt stands in for description)', () => {
        const missing = posts.filter((p) => !p.description?.trim()).map((p) => p.id);
        expect(missing).toEqual([]);
    });

    it('does not leak the raw excerpt key onto the post object', () => {
        expect(posts.every((p) => !('excerpt' in p))).toBe(true);
    });
});
