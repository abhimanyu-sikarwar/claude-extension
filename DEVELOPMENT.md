# Development Guide

## Project Setup

### Prerequisites
- Node.js v14+ and npm
- Chrome browser (for testing Chrome extension)
- Firefox browser (for testing Firefox add-on)
- Git

### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd claude-extension

# Install dependencies (if any)
npm install

# Build for both browsers
npm run build
```

## Cross-Browser Development

This extension supports both Chrome (Manifest V3) and Firefox (Manifest V2 with polyfill).

### Key Differences

#### Chrome (Manifest V3)
- Uses service workers for background scripts
- Uses `chrome` API
- Requires `world: "MAIN"` for injected scripts
- Uses `action` for browser action

#### Firefox (Manifest V2)
- Uses background scripts (non-persistent)
- Uses `browser` API (polyfilled to `chrome`)
- Uses `browser_action` instead of `action`
- Requires browser polyfill for compatibility

### Browser API Compatibility

The extension uses the following approach for cross-browser compatibility:

1. **Browser Polyfill**: Firefox builds include `webextension-polyfill` which provides a Promise-based API
2. **API Normalization**: Build script adds compatibility layer to handle both `chrome` and `browser` APIs
3. **Manifest Separation**: Separate manifest files for each browser (`manifest.chrome.json`, `manifest.firefox.json`)

## File Structure

```
claude-extension/
├── src/                      # Source code
│   ├── background/          # Background scripts
│   ├── content/            # Content scripts
│   ├── popup/              # Popup scripts
│   ├── options/            # Options page scripts
│   └── shared/             # Shared utilities
├── pages/                   # HTML pages
├── styles/                  # CSS files
├── icons/                   # Extension icons
├── scripts/                 # Build scripts
├── lib/                     # Third-party libraries (polyfill)
├── dist/                    # Build output (gitignored)
│   ├── chrome/             # Chrome build
│   └── firefox/            # Firefox build
├── manifest.chrome.json     # Chrome manifest (v3)
├── manifest.firefox.json    # Firefox manifest (v2)
└── package.json            # NPM scripts and metadata
```

## Build Process

### Development Builds
```bash
# Build for Chrome only
npm run build:chrome

# Build for Firefox only
npm run build:firefox

# Build for both
npm run build
```

### Production Builds
```bash
# Create distributable packages
npm run package:chrome  # Creates dist/claude-to-markdown-chrome.zip
npm run package:firefox # Creates dist/claude-to-markdown-firefox.zip
```

### What the Build Script Does

1. Creates `dist/{browser}/` directory
2. Copies all source files maintaining structure
3. Copies appropriate manifest file as `manifest.json`
4. For Firefox:
   - Downloads browser polyfill if not present
   - Adds compatibility code to JS files
   - Includes polyfill in lib directory

## Testing

### Chrome Testing
1. Open `chrome://extensions/`
2. Enable Developer Mode
3. Click "Load unpacked"
4. Select `dist/chrome` directory

### Firefox Testing
1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select any file in `dist/firefox`

### Testing Checklist
- [ ] Extension loads without errors
- [ ] Popup opens and displays correctly
- [ ] Options page saves settings
- [ ] Content scripts inject on Claude.ai
- [ ] Download button appears on Claude.ai
- [ ] Bulk export works on chat history page
- [ ] Markdown export formats correctly
- [ ] GitHub Gist integration works
- [ ] Storage permissions work
- [ ] All features work in both browsers

## Common Issues and Solutions

### Issue: Extension not loading in Firefox
**Solution**: Ensure browser polyfill is present in `lib/browser-polyfill.min.js`

### Issue: API calls failing in Firefox
**Solution**: Check that compatibility layer is added to scripts

### Issue: Manifest errors
**Solution**: Verify correct manifest version for target browser

### Issue: Content scripts not injecting
**Solution**: Check URL permissions in manifest match Claude.ai domain

## Publishing

### Chrome Web Store
1. Create production build: `npm run package:chrome`
2. Upload `dist/claude-to-markdown-chrome.zip` to Chrome Web Store Developer Dashboard
3. Fill in listing details and screenshots
4. Submit for review

### Firefox Add-ons (AMO)
1. Create production build: `npm run package:firefox`
2. Upload `dist/claude-to-markdown-firefox.zip` to addons.mozilla.org
3. Fill in listing details
4. Submit for review

### Version Updates
1. Update version in `package.json`
2. Update version in both manifest files
3. Build and test both versions
4. Create git tag: `git tag v0.0.1`
5. Push tag: `git push origin v0.0.1`

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes and test in both browsers
4. Commit changes: `git commit -am 'Add feature'`
5. Push branch: `git push origin feature-name`
6. Create Pull Request

## CI/CD

GitHub Actions workflow (`.github/workflows/build.yml`) automatically:
- Builds for both browsers on push/PR
- Runs tests (if configured)
- Creates artifacts for both versions
- Can create releases on tags

## License

Apache 2.0 - See COPYING file for details