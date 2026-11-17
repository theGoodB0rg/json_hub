import { computeUiInteractions, formatUiInteractions } from './uiInteractions';

describe('computeUiInteractions', () => {
    it('counts controls by key and real file loads, ignoring samples', () => {
        const s = computeUiInteractions([
            { event_name: 'ui_interaction', format: 'upload' },
            { event_name: 'ui_interaction', format: 'upload' },
            { event_name: 'ui_interaction', format: 'template_pick' },
            { event_name: 'parse_success', is_sample: 0 },
            { event_name: 'parse_success', is_sample: 1 },
            { event_name: 'page_view' },
        ]);
        expect(s).toEqual({ byControl: [['upload', 2], ['template_pick', 1]], filesLoaded: 1 });
    });

    it('says plainly when nothing is recorded yet', () => {
        expect(formatUiInteractions({ byControl: [], filesLoaded: 0 })[0]).toMatch(/No control clicks/);
    });
});
