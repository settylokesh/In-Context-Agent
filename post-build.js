import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Copy manifest.json
fs.copyFileSync(
    path.join(__dirname, 'manifest.json'),
    path.join(__dirname, 'dist', 'manifest.json')
);

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'dist', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Create placeholder icon files if they don't exist
const sizes = [16, 48, 128];
sizes.forEach(size => {
    const iconPath = path.join(iconsDir, `icon${size}.png`);
    if (!fs.existsSync(iconPath)) {
        // Create a simple 1x1 transparent PNG as placeholder
        const placeholder = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
        fs.writeFileSync(iconPath, placeholder);
    }
});

console.log('Post-build: Manifest and icons copied successfully!');
