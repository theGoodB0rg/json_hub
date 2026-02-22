const fs = require('fs');

const mainPath = './lib/platform-data.ts';
const extraPath = './lib/platform-data-extra.ts';

let mainContent = fs.readFileSync(mainPath, 'utf8');
const extraContent = fs.readFileSync(extraPath, 'utf8');

// Parse the array out of extraContent
const match = extraContent.match(/export const extraConverterPages = \[([\s\S]+)\];/);
if (match) {
    const newItems = match[1];
    mainContent = mainContent.replace(/\];$/, `,${newItems}];\n`);
    fs.writeFileSync(mainPath, mainContent);
    fs.unlinkSync(extraPath); // Clean up
    console.log('Successfully appended 30+ new platforms to lib/platform-data.ts!');
} else {
    console.error('Failed to parse extra platforms!');
}
