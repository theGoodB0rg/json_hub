import { jsonToCsv } from './jsonToCsv';
import { jsonToXlsx } from './jsonToXlsx';
import { jsonToHtml } from './jsonToHtml';

describe('CSV Converter', () => {
    const testData = [
        { name: 'John', age: 30, city: 'NYC' },
        { name: 'Jane', age: 25, city: 'LA' },
    ];
    const schema = ['name', 'age', 'city'];

    it('should convert JSON to CSV with headers', () => {
        const csv = jsonToCsv(testData, schema);
        expect(csv).toContain('name,age,city');
        expect(csv).toContain('John,30,NYC');
        expect(csv).toContain('Jane,25,LA');
    });

    it('should escape values with commas', () => {
        const data = [{ name: 'Smith, John', age: 30 }];
        const csv = jsonToCsv(data, ['name', 'age']);
        expect(csv).toContain('"Smith, John"');
    });

    it('should escape values with quotes', () => {
        const data = [{ name: 'John "Johnny" Doe', age: 30 }];
        const csv = jsonToCsv(data, ['name', 'age']);
        expect(csv).toContain('"John ""Johnny"" Doe"');
    });

    it('should handle null values', () => {
        const data = [{ name: 'John', age: null }];
        const csv = jsonToCsv(data, ['name', 'age']);
        expect(csv).toContain('John,');
    });

    it('should include UTF-8 BOM', () => {
        const csv = jsonToCsv(testData, schema);
        expect(csv.charCodeAt(0)).toBe(0xfeff);
    });
});

describe('Excel Converter', () => {
    const testData = [
        { name: 'John', age: 30, city: 'NYC' },
        { name: 'Jane', age: 25, city: 'LA' },
    ];
    const schema = ['name', 'age', 'city'];

    it('should create workbook with data', () => {
        const workbook = jsonToXlsx(testData, schema);
        expect(workbook.SheetNames).toContain('Data');
        expect(workbook.Sheets['Data']).toBeDefined();
    });

    it('should handle null values', () => {
        const data = [{ name: 'John', age: null }];
        const workbook = jsonToXlsx(data, ['name', 'age']);
        expect(workbook.Sheets['Data']).toBeDefined();
    });
});

describe('HTML Converter', () => {
    const testData = [
        { name: 'John', age: 30, city: 'NYC' },
        { name: 'Jane', age: 25, city: 'LA' },
    ];
    const schema = ['name', 'age', 'city'];

    it('should create HTML table', () => {
        const html = jsonToHtml(testData, schema);
        expect(html).toContain('<table');
        expect(html).toContain('<th>name</th>');
        expect(html).toContain('John</td>');
    });

    it('should escape HTML entities', () => {
        const data = [{ name: '<script>alert("xss")</script>' }];
        const html = jsonToHtml(data, ['name']);
        expect(html).not.toContain('<script>alert');
        expect(html).toContain('&lt;script&gt;');
    });

    it('should handle null values', () => {
        const data = [{ name: 'John', age: null }];
        const html = jsonToHtml(data, ['name', 'age']);
        expect(html).toContain('<em>null</em>');
    });

    it('should include metadata', () => {
        const html = jsonToHtml(testData, schema);
        expect(html).toContain('2 rows');
        expect(html).toContain('3 columns');
    });
});
