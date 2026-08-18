import type { ConverterPlugin, DataFormat } from '@/types/converter.types';
import { jsonToExcelPlugin } from './plugins/jsonToExcel.plugin';
import { jsonToCsvPlugin } from './plugins/jsonToCsv.plugin';
import { csvToJsonPlugin } from './plugins/csvToJson.plugin';
import { xmlToExcelPlugin } from './plugins/xmlToExcel.plugin';
import { xmlToJsonPlugin } from './plugins/xmlToJson.plugin';
import { csvToExcelPlugin } from './plugins/csvToExcel.plugin';

class PluginRegistry {
    private plugins: Map<string, ConverterPlugin> = new Map();

    constructor() {
        this.register(jsonToExcelPlugin);
        this.register(jsonToCsvPlugin);
        this.register(csvToJsonPlugin);
        this.register(xmlToExcelPlugin);
        this.register(xmlToJsonPlugin);
        this.register(csvToExcelPlugin);
    }

    public register(plugin: ConverterPlugin): void {
        this.plugins.set(plugin.id, plugin);
    }

    public get(id: string): ConverterPlugin | undefined {
        return this.plugins.get(id);
    }

    public getOrDefault(id?: string | null): ConverterPlugin {
        if (id && this.plugins.has(id)) {
            return this.plugins.get(id)!;
        }
        return jsonToExcelPlugin;
    }

    public findByFormats(source: DataFormat, target: DataFormat): ConverterPlugin | undefined {
        for (const plugin of this.plugins.values()) {
            if (plugin.sourceFormat === source && plugin.targetFormat === target) {
                return plugin;
            }
        }
        return undefined;
    }

    public getAll(): ConverterPlugin[] {
        return Array.from(this.plugins.values());
    }

    public getAllIds(): string[] {
        return Array.from(this.plugins.keys());
    }
}

export const pluginRegistry = new PluginRegistry();
