const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../public/images/readme');
const outputDir = path.join(__dirname, '../public/images/readme');

if (!fs.existsSync(inputDir)) {
    console.log('No readme images directory found. Skipping optimization.');
    process.exit(0);
}

const files = fs.readdirSync(inputDir);

files.forEach(file => {
    if (file.endsWith('.png') && !file.includes('optimized')) {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, file.replace('.png', '.webp'));

        sharp(inputPath)
            .webp({ quality: 85, effort: 6 })
            .toFile(outputPath)
            .then(info => {
                const originalSize = fs.statSync(inputPath).size;
                const newSize = info.size;
                const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
                console.log(`✓ ${file} → ${path.basename(outputPath)} (${savings}% smaller)`);
            })
            .catch(err => console.error(`✗ Failed to optimize ${file}:`, err.message));
    }
});

console.log('\nImage optimization complete!');
