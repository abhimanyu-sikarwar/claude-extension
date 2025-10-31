#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const browser = process.argv[2];

if (!browser || !['chrome', 'firefox'].includes(browser)) {
    console.error('Please specify browser: npm run build:chrome or npm run build:firefox');
    process.exit(1);
}

console.log(`Building for ${browser}...`);

const srcDir = path.resolve(__dirname, '..');
const distDir = path.join(srcDir, 'dist', browser);

// Create dist directory
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(path.join(srcDir, 'dist'), { recursive: true });
    fs.mkdirSync(distDir, { recursive: true });
}

// Function to copy directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Copy common files
const commonDirs = ['src', 'pages', 'styles', 'icons'];
commonDirs.forEach(dir => {
    const srcPath = path.join(srcDir, dir);
    const destPath = path.join(distDir, dir);
    if (fs.existsSync(srcPath)) {
        copyDir(srcPath, destPath);
    }
});

// Copy COPYING file
fs.copyFileSync(path.join(srcDir, 'COPYING'), path.join(distDir, 'COPYING'));

// Copy appropriate manifest
let manifestSrc = path.join(srcDir, `manifest.${browser}.json`);
// Use V3 manifest for Firefox if it exists
if (browser === 'firefox') {
    const v3ManifestPath = path.join(srcDir, 'manifest.firefox.v3.json');
    if (fs.existsSync(v3ManifestPath)) {
        manifestSrc = v3ManifestPath;
        console.log('Using Manifest V3 for Firefox with webRequest API');
    }
}
const manifestDest = path.join(distDir, 'manifest.json');
fs.copyFileSync(manifestSrc, manifestDest);

// Create lib directory for Firefox polyfill
if (browser === 'firefox') {
    const libDir = path.join(distDir, 'lib');
    if (!fs.existsSync(libDir)) {
        fs.mkdirSync(libDir);
    }

    // Download browser polyfill if not exists
    const polyfillPath = path.join(libDir, 'browser-polyfill.min.js');
    if (!fs.existsSync(polyfillPath)) {
        console.log('Downloading browser polyfill for Firefox...');
        const https = require('https');
        const file = fs.createWriteStream(polyfillPath);

        https.get('https://unpkg.com/webextension-polyfill@0.10.0/dist/browser-polyfill.min.js', (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log('Browser polyfill downloaded successfully');
            });
        }).on('error', (err) => {
            fs.unlink(polyfillPath, () => {});
            console.error('Error downloading polyfill:', err.message);
        });
    }
}

// Add browser API compatibility layer to all JS files for Firefox
if (browser === 'firefox') {
    const compatCode = `// Browser API compatibility
if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
    window.browser = chrome;
} else if (typeof chrome === 'undefined' && typeof browser !== 'undefined') {
    window.chrome = browser;
}

`;

    // Add compatibility code to content scripts and popup scripts
    const jsFiles = [
        'src/content/content.js',
        'src/content/download-button.js',
        'src/content/bulk-export.js',
        'src/popup/popup.js',
        'src/options/options.js'
    ];

    jsFiles.forEach(file => {
        const filePath = path.join(distDir, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            if (!content.includes('Browser API compatibility')) {
                fs.writeFileSync(filePath, compatCode + content);
            }
        }
    });
}

console.log(`✅ Build completed for ${browser} in dist/${browser}/`);
console.log(`📦 To package: npm run package:${browser}`);