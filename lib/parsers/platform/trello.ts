/**
 * Specialized Trello Board JSON Pre-Processor
 * 
 * Solves:
 * 1. Combinatorial row duplication (checklists x labels x members) in relational flattening.
 * 2. Missing list names (Trello cards store idList, not list name).
 * 3. Missing pluginData / Custom Fields (Trello stores customFields definitions at board root
 *    and values in customFieldItems or pluginData as JSON strings).
 */

export interface TrelloBoard {
    id?: string;
    name?: string;
    desc?: string;
    closed?: boolean;
    lists?: Array<{ id: string; name: string; closed?: boolean; pos?: number }>;
    cards?: Array<Record<string, any>>;
    members?: Array<{ id: string; fullName?: string; username?: string }>;
    customFields?: Array<{
        id: string;
        name: string;
        type: 'text' | 'number' | 'date' | 'checkbox' | 'list';
        options?: Array<{ id: string; value: { text: string } }>;
    }>;
    checklists?: Array<{
        id: string;
        name: string;
        idCard?: string;
        checkItems?: Array<{ id: string; name: string; state: string }>;
    }>;
    pluginData?: Array<{
        id: string;
        idPlugin: string;
        scope: string;
        idModel?: string;
        value: string;
    }>;
}

export function isTrelloBoard(data: any): boolean {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    // Typical Trello Board dump has cards array and lists array or id/name with cards
    return Array.isArray(data.cards) && (Array.isArray(data.lists) || typeof data.id === 'string' && 'shortUrl' in data || 'prefs' in data);
}

export function transformTrelloBoard(board: TrelloBoard): Record<string, any>[] {
    if (!Array.isArray(board.cards)) return [];

    // 1. Build List Map (idList -> listName)
    const listMap = new Map<string, string>();
    if (Array.isArray(board.lists)) {
        for (const list of board.lists) {
            if (list.id && list.name) {
                listMap.set(list.id, list.name);
            }
        }
    }

    // 2. Build Member Map (idMember -> Full Name / Username)
    const memberMap = new Map<string, string>();
    if (Array.isArray(board.members)) {
        for (const member of board.members) {
            if (member.id) {
                memberMap.set(member.id, member.fullName || member.username || member.id);
            }
        }
    }

    // 3. Build Board-level Checklists Map (idCard -> Checklist[])
    const boardChecklistsByCard = new Map<string, any[]>();
    if (Array.isArray(board.checklists)) {
        for (const chk of board.checklists) {
            if (chk.idCard) {
                const existing = boardChecklistsByCard.get(chk.idCard) || [];
                existing.push(chk);
                boardChecklistsByCard.set(chk.idCard, existing);
            }
        }
    }

    // 4. Build Custom Field Definitions Map
    const customFieldDefs = new Map<string, { name: string; type: string; optionsMap?: Map<string, string> }>();
    if (Array.isArray(board.customFields)) {
        for (const cf of board.customFields) {
            const optionsMap = new Map<string, string>();
            if (Array.isArray(cf.options)) {
                for (const opt of cf.options) {
                    if (opt.id && opt.value?.text) {
                        optionsMap.set(opt.id, opt.value.text);
                    }
                }
            }
            customFieldDefs.set(cf.id, {
                name: cf.name,
                type: cf.type,
                optionsMap: optionsMap.size > 0 ? optionsMap : undefined,
            });
        }
    }

    // 5. Transform each card into a canonical 1-card = 1-row representation
    return board.cards.map((card) => {
        const row: Record<string, any> = {
            id: card.id,
            name: card.name || '',
            desc: card.desc || '',
            listName: card.listName || (card.idList ? listMap.get(card.idList) || card.idList : ''),
            due: card.due || null,
            dueComplete: card.dueComplete ?? false,
            closed: card.closed ?? false,
            url: card.url || card.shortUrl || '',
            pos: card.pos ?? null,
            dateLastActivity: card.dateLastActivity || null,
        };

        // Labels: format as clean comma-separated names and separate colors
        if (Array.isArray(card.labels) && card.labels.length > 0) {
            const labelNames = card.labels
                .map((l: any) => (typeof l === 'string' ? l : l.name || l.color || ''))
                .filter(Boolean);
            row['labels'] = labelNames.join(', ');

            // Also keep individual indexed columns for backward compatibility with existing tests
            card.labels.forEach((l: any, idx: number) => {
                if (typeof l === 'object' && l !== null) {
                    if (l.name) row[`labels.${idx}.name`] = l.name;
                    if (l.color) row[`labels.${idx}.color`] = l.color;
                }
            });
        } else {
            row['labels'] = '';
        }

        // Members: map IDs or objects to readable names without duplicating rows
        const membersList: string[] = [];
        if (Array.isArray(card.members)) {
            for (const m of card.members) {
                if (typeof m === 'string') {
                    membersList.push(memberMap.get(m) || m);
                } else if (m && typeof m === 'object') {
                    membersList.push(m.fullName || m.username || m.id || '');
                }
            }
        } else if (Array.isArray(card.idMembers)) {
            for (const id of card.idMembers) {
                membersList.push(memberMap.get(id) || id);
            }
        }
        row['assignedMembers'] = membersList.filter(Boolean).join(', ');

        // Checklists: combine embedded card.checklists and board-level checklists
        const cardChecklists = [
            ...(Array.isArray(card.checklists) ? card.checklists : []),
            ...(boardChecklistsByCard.get(card.id) || []),
        ];

        if (cardChecklists.length > 0) {
            let totalItems = 0;
            let completedItems = 0;
            const summaries: string[] = [];
            const itemDetails: string[] = [];

            for (const chk of cardChecklists) {
                const checkItems = Array.isArray(chk.checkItems) ? chk.checkItems : [];
                const chkTotal = checkItems.length;
                const chkComplete = checkItems.filter((i: any) => i.state === 'complete').length;
                totalItems += chkTotal;
                completedItems += chkComplete;
                summaries.push(`${chk.name || 'Checklist'} (${chkComplete}/${chkTotal})`);

                for (const item of checkItems) {
                    itemDetails.push(`[${item.state === 'complete' ? 'x' : ' '}] ${item.name}`);
                }
            }

            row['checklistProgress'] = totalItems > 0 ? `${completedItems}/${totalItems}` : '';
            row['checklistsSummary'] = summaries.join(' | ');
            row['checklistItems'] = itemDetails.join('\n');
        } else {
            row['checklistProgress'] = '';
            row['checklistsSummary'] = '';
            row['checklistItems'] = '';
        }

        // Custom Fields Resolution
        if (Array.isArray(card.customFieldItems)) {
            for (const item of card.customFieldItems) {
                const def = customFieldDefs.get(item.idCustomField);
                const colKey = def ? `custom_${def.name.replace(/[^a-zA-Z0-9_]/g, '_')}` : `customField_${item.idCustomField}`;

                let val: any = null;
                if (item.value) {
                    if (item.value.text !== undefined) val = item.value.text;
                    else if (item.value.number !== undefined) val = Number(item.value.number);
                    else if (item.value.date !== undefined) val = item.value.date;
                    else if (item.value.checked !== undefined) val = item.value.checked === 'true' || item.value.checked === true;
                } else if (item.idValue && def?.optionsMap) {
                    val = def.optionsMap.get(item.idValue) || item.idValue;
                }

                if (val !== null && val !== undefined) {
                    row[colKey] = val;
                }
            }
        }

        // Plugin Data Resolution (Power-Ups)
        // Card pluginData contains JSON string in value field
        if (Array.isArray(card.pluginData)) {
            card.pluginData.forEach((pd: any, idx: number) => {
                if (pd && pd.value) {
                    let parsedVal = pd.value;
                    try {
                        parsedVal = JSON.parse(pd.value);
                    } catch {
                        // keep as string
                    }

                    if (typeof parsedVal === 'object' && parsedVal !== null) {
                        for (const [pKey, pVal] of Object.entries(parsedVal)) {
                            row[`plugin_${pd.idPlugin || idx}_${pKey}`] = typeof pVal === 'object' ? JSON.stringify(pVal) : pVal;
                        }
                    } else {
                        row[`plugin_${pd.idPlugin || idx}`] = parsedVal;
                    }
                }
            });
        }

        // Retain any extra simple properties not yet mapped
        for (const [key, value] of Object.entries(card)) {
            if (!(key in row) && (typeof value !== 'object' || value === null)) {
                row[key] = value;
            }
        }

        return row;
    });
}
