import { pluginRegistry } from './registry';

describe('PluginRegistry', () => {
    it('registers core default plugins on initialization', () => {
        const ids = pluginRegistry.getAllIds();
        expect(ids).toContain('json-to-excel');
        expect(ids).toContain('json-to-csv');
        expect(ids).toContain('csv-to-json');
        expect(ids).toContain('xml-to-excel');
        expect(ids).toContain('xml-to-json');
        expect(ids).toContain('csv-to-excel');
    });

    it('retrieves plugin by exact id', () => {
        const plugin = pluginRegistry.get('csv-to-json');
        expect(plugin).toBeDefined();
        expect(plugin?.sourceFormat).toBe('csv');
        expect(plugin?.targetFormat).toBe('json');
    });

    it('returns default plugin for unknown id or null', () => {
        const fallback = pluginRegistry.getOrDefault('unknown-id');
        expect(fallback.id).toBe('json-to-excel');
    });

    it('finds plugin by source and target formats', () => {
        const plugin = pluginRegistry.findByFormats('xml', 'xlsx');
        expect(plugin?.id).toBe('xml-to-excel');
    });

    it('executes parse method through plugin interface', async () => {
        const csvPlugin = pluginRegistry.get('csv-to-json')!;
        const result = await csvPlugin.parse('id,name\n1,Alice');
        expect(result.success).toBe(true);
        expect(result.flatData).toEqual([{ id: 1, name: 'Alice' }]);
    });
});
