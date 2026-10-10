/**
 * Platform parser registry.
 *
 * Before this existed, each platform pre-processor had to be wired into two
 * call sites by hand (`flattenJSON` and `smartUnwrap`), and the Trello parser
 * was the only one that ever got wired into both. Registering here is enough.
 *
 * Order matters: the first parser whose `detect` returns true wins, so put
 * narrower detectors ahead of broader ones.
 */

import type { FlattenMode, PlatformParser } from './types';
import { isTrelloBoard, transformTrelloBoard } from './trello';
import { jiraParser } from './jira';

/**
 * What a Trello card sheet deliberately leaves behind.
 *
 * The grain is one row per card, so board-level configuration and the
 * board-wide activity feed are out of scope by construction — `actions[]`
 * alone is 1,000 entries on Trello's own public roadmap board and describes
 * events, not cards. Attachments are NOT in this list: they used to vanish
 * silently, which the LOSSLESS invariant caught, and they are now summarised
 * onto the card row.
 */
const TRELLO_OMISSIONS = [
    // Board-level configuration and quota metadata.
    'id', 'nodeId', 'desc', 'descData', 'closed', 'idEnterprise', 'idOrganization',
    'idMemberCreator', 'pinned', 'starred', 'url', 'shortUrl', 'shortLink',
    'dateLastView', 'datePluginDisable', 'creationMethod', 'ixUpdate',
    'templateGallery', 'enterpriseOwned', 'premiumFeatures', 'subscribed',
    'powerUps', 'switcherViews', 'memberships', 'labelNames',
    'prefs', 'limits', 'myPrefs', 'dateLastActivity', 'type',
    // Board-wide activity feed: events, not cards.
    'actions',
    // Definition lists consumed to resolve names onto the card rows.
    // `labels` here is the board's label PALETTE, not a card's labels. A label
    // defined on the board but applied to no exported card has nothing to
    // attach to; the labels a card actually carries are kept on its row.
    'lists', 'members', 'customFields', 'checklists', 'labels', 'cards[].badges',
    // Per-card presentation chrome and opaque id bags.
    'cards[].cover', 'cards[].idMembersVoted', 'cards[].attachments[].previews',
    // Attachment chrome. Names and URLs ARE carried onto the card row; these
    // are the storage-layer details around them.
    'cards[].attachments[].id', 'cards[].attachments[].idMember',
    'cards[].attachments[].bytes', 'cards[].attachments[].date',
    'cards[].attachments[].edgeColor', 'cards[].attachments[].mimeType',
    'cards[].attachments[].isUpload', 'cards[].attachments[].pos',
    'cards[].attachments[].fileName', 'cards[].attachments[].idAttachment',
    'idTags',
    'cards[].limits', 'cards[].prefs', 'cards[].descData', 'cards[].nodeId',
    '*.avatarHash', '*.avatarUrl', '*.idBoard', '*.idList', '*.idShort',
    '*.idAttachmentCover', '*.idLabels', '*.idChecklists', '*.idMembers',
] as const;

const trelloParser: PlatformParser = {
    id: 'trello',
    label: 'Trello',
    detect: isTrelloBoard as (data: unknown) => data is any,
    // Trello has one sensible grain (1 card = 1 row) in both modes; the
    // relational Cartesian explosion it used to produce was the bug, not a
    // feature worth preserving behind a mode flag.
    transform: (data) => transformTrelloBoard(data),
    intentionalOmissions: TRELLO_OMISSIONS,
    guaranteedColumns: ['id', 'name', 'listName', 'attachments.names'],
};

export const PLATFORM_PARSERS: readonly PlatformParser[] = [
    jiraParser,
    trelloParser,
];

export interface PlatformMatch {
    parser: PlatformParser;
    rows: Record<string, any>[];
}

/**
 * Find the parser that claims this payload and run it.
 * Returns null when nothing matches, so callers fall back to the generic
 * flattener unchanged.
 *
 * A parser that throws is treated as a non-match rather than being allowed to
 * break the conversion: a malformed payload must still produce *some* usable
 * sheet via the generic path.
 */
export function matchPlatform(data: unknown, mode: FlattenMode = 'flat'): PlatformMatch | null {
    for (const parser of PLATFORM_PARSERS) {
        let claims = false;
        try {
            claims = parser.detect(data);
        } catch {
            claims = false;
        }
        if (!claims) continue;

        try {
            return { parser, rows: parser.transform(data as any, mode) };
        } catch {
            return null;
        }
    }
    return null;
}

/** Which platform claims this payload, without doing the work. Used by telemetry. */
export function detectPlatform(data: unknown): string | null {
    for (const parser of PLATFORM_PARSERS) {
        try {
            if (parser.detect(data)) return parser.id;
        } catch {
            /* ignore — detection must never throw into the caller */
        }
    }
    return null;
}

export type { PlatformParser, FlattenMode } from './types';
export { dropEmptyColumns, joinCell } from './types';
