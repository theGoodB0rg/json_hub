import { parseXmlToTree, xmlNodeToJson, parseXml } from './xmlParser';

describe('XML Parser', () => {
    describe('parseXmlToTree', () => {
        it('parses valid XML structure into node tree', () => {
            const xml = `
                <root id="123">
                    <user>
                        <name>John Doe</name>
                        <active>true</active>
                    </user>
                </root>
            `;
            const { root, errors } = parseXmlToTree(xml);
            expect(errors).toHaveLength(0);
            expect(root?.name).toBe('root');
            expect(root?.attributes.id).toBe('123');
            expect(root?.children[0].name).toBe('user');
        });

        it('handles self-closing tags and attributes', () => {
            const xml = '<item id="45" status="ready" />';
            const { root, errors } = parseXmlToTree(xml);
            expect(errors).toHaveLength(0);
            expect(root?.name).toBe('item');
            expect(root?.attributes.status).toBe('ready');
        });

        it('detects unclosed tags', () => {
            const xml = '<catalog><book><title>Test</catalog>';
            const { errors } = parseXmlToTree(xml);
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('xmlNodeToJson & parseXml', () => {
        it('converts repeated elements into JSON arrays', () => {
            const xml = `
                <store name="Bookstore">
                    <book category="fiction">
                        <title>The Hobbit</title>
                        <price>14.99</price>
                    </book>
                    <book category="sci-fi">
                        <title>Dune</title>
                        <price>19.99</price>
                    </book>
                </store>
            `;
            const result = parseXml(xml);
            expect(result.success).toBe(true);
            expect(result.data?.store?.book).toHaveLength(2);
            expect(result.data?.store?.book[0].title).toBe('The Hobbit');
            expect(result.data?.store?.book[0].price).toBe(14.99);
            expect(result.data?.store?.book[0]['@_category']).toBe('fiction');
        });

        it('flattens XML into tabular rows and schemas for Excel conversion', () => {
            const xml = `
                <orders>
                    <order id="ord_1">
                        <customer>Alice</customer>
                        <total>150</total>
                    </order>
                    <order id="ord_2">
                        <customer>Bob</customer>
                        <total>220</total>
                    </order>
                </orders>
            `;
            const result = parseXml(xml);
            expect(result.success).toBe(true);
            expect(result.flatData?.length).toBe(2);
            expect(result.schema).toContain('customer');
            expect(result.schema).toContain('total');
            expect(result.flatData?.[0].customer).toBe('Alice');
        });

        it('handles empty or malformed input gracefully', () => {
            const result = parseXml('');
            expect(result.success).toBe(false);
            expect(result.errors?.[0]?.message).toBe('Input is empty');
        });
    });
});
