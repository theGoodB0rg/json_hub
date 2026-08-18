import type { ConversionResult, ParseOptions, ParseError } from '@/types/converter.types';
import { inferValue } from '@/lib/parsers/csv/csvParser';
import { flattenJSON } from '@/lib/parsers/flattener';
import { smartUnwrap } from '@/lib/parsers/unwrapper';

interface XmlNode {
    name: string;
    attributes: Record<string, string>;
    children: XmlNode[];
    text: string;
}

/**
 * Pure TypeScript client-safe XML Tokenizer & Parser.
 * Works uniformly across Node (Jest), Browser, and Web Worker environments without DOM dependencies.
 */
export function parseXmlToTree(xml: string): { root: XmlNode | null; errors: ParseError[] } {
    const errors: ParseError[] = [];
    if (!xml || xml.trim() === '') {
        return { root: null, errors: [{ message: 'Input is empty' }] };
    }

    // Strip XML declarations and comments
    let cleaned = xml
        .replace(/<\?xml[\s\S]*?\?>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
        .trim();

    if (!cleaned) {
        return { root: null, errors: [{ message: 'No XML elements found' }] };
    }

    const tagRegex = /<(\/)?([a-zA-Z0-9_:\.-]+)([^>]*)>|([^<]+)/g;
    const stack: XmlNode[] = [];
    let root: XmlNode | null = null;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(cleaned)) !== null) {
        const [fullMatch, isClosing, tagName, rawAttributes, textContent] = match;

        if (textContent !== undefined && textContent !== null) {
            const text = textContent.trim();
            if (text && stack.length > 0) {
                stack[stack.length - 1].text += (stack[stack.length - 1].text ? ' ' : '') + text;
            }
        } else if (tagName) {
            const isSelfClosing = rawAttributes && rawAttributes.trim().endsWith('/');

            if (isClosing) {
                if (stack.length === 0) {
                    errors.push({ message: `Unexpected closing tag </${tagName}>` });
                    continue;
                }
                const top = stack[stack.length - 1];
                if (top.name !== tagName) {
                    errors.push({ message: `Mismatched closing tag </${tagName}>, expected </${top.name}>` });
                }
                stack.pop();
            } else {
                // Parse attributes
                const attributes: Record<string, string> = {};
                if (rawAttributes) {
                    const attrRegex = /([a-zA-Z0-9_:\.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
                    let attrMatch: RegExpExecArray | null;
                    while ((attrMatch = attrRegex.exec(rawAttributes)) !== null) {
                        const attrKey = attrMatch[1];
                        const attrVal = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
                        attributes[attrKey] = attrVal;
                    }
                }

                const node: XmlNode = {
                    name: tagName,
                    attributes,
                    children: [],
                    text: '',
                };

                if (!root) {
                    root = node;
                }

                if (stack.length > 0) {
                    stack[stack.length - 1].children.push(node);
                }

                if (!isSelfClosing) {
                    stack.push(node);
                }
            }
        }
    }

    if (stack.length > 0) {
        errors.push({
            message: `Unclosed tag <${stack[stack.length - 1].name}> at end of XML document`,
        });
    }

    return { root, errors };
}

/**
 * Recursively converts an XmlNode tree into a clean JSON structure.
 */
export function xmlNodeToJson(node: XmlNode, options: ParseOptions = {}): any {
    const attrPrefix = options.xmlAttributePrefix !== undefined ? options.xmlAttributePrefix : '@_';
    const inferTypes = options.inferTypes !== false;

    // Leaf node with no children and no attributes
    if (node.children.length === 0 && Object.keys(node.attributes).length === 0) {
        return inferValue(node.text, inferTypes);
    }

    const obj: Record<string, any> = {};

    // Map attributes
    for (const [key, val] of Object.entries(node.attributes)) {
        obj[`${attrPrefix}${key}`] = inferValue(val, inferTypes);
    }

    // Map text content if node has both attributes and text
    if (node.text && node.children.length === 0) {
        obj['#text'] = inferValue(node.text, inferTypes);
        return obj;
    }

    // Group child nodes by tag name
    const groupedChildren: Record<string, XmlNode[]> = {};
    for (const child of node.children) {
        if (!groupedChildren[child.name]) {
            groupedChildren[child.name] = [];
        }
        groupedChildren[child.name].push(child);
    }

    for (const [childName, childList] of Object.entries(groupedChildren)) {
        if (childList.length === 1) {
            obj[childName] = xmlNodeToJson(childList[0], options);
        } else {
            obj[childName] = childList.map((c) => xmlNodeToJson(c, options));
        }
    }

    return obj;
}

/**
 * High-level parser converting XML into JSON, flattened tabular data, and schema.
 */
export function parseXml(xml: string, options: ParseOptions = {}): ConversionResult {
    if (!xml || xml.trim() === '') {
        return {
            success: false,
            errors: [{ message: 'Input is empty' }],
            flatData: [],
            schema: [],
        };
    }

    const { root, errors } = parseXmlToTree(xml);

    if (!root) {
        return {
            success: false,
            errors: errors.length > 0 ? errors : [{ message: 'Failed to parse XML document' }],
            flatData: [],
            schema: [],
        };
    }

    // Build structured JSON
    const rootData = xmlNodeToJson(root, options);
    const jsonOutput: Record<string, any> = {
        [root.name]: rootData,
    };

    // Smart unwrapping for tabular / Excel representation
    // e.g. if root is <catalog><book>...</book><book>...</book></catalog>, extract the book array
    let tabularSource: any = rootData;
    if (typeof rootData === 'object' && rootData !== null) {
        const keys = Object.keys(rootData).filter((k) => !k.startsWith('@_'));
        if (keys.length === 1 && Array.isArray(rootData[keys[0]])) {
            tabularSource = rootData[keys[0]];
        } else if (keys.length === 1 && typeof rootData[keys[0]] === 'object') {
            tabularSource = rootData[keys[0]];
        }
    }

    const unwrapped = smartUnwrap(tabularSource);
    const flattened = flattenJSON(unwrapped.data);

    const formattedOutput = JSON.stringify(jsonOutput, null, 2);

    return {
        success: errors.length === 0,
        data: jsonOutput,
        flatData: flattened.rows,
        schema: flattened.schema,
        formattedOutput,
        errors: errors.length > 0 ? errors : undefined,
    };
}
