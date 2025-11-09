# Claude to Markdown - Browser Extension

A cross-browser extension for Chrome and Firefox that exports Claude.ai chat conversations to Markdown format with optional GitHub Gist integration.

## Overview

This extension intercepts and captures Claude.ai conversation data, allowing you to:
- Export conversations in multiple formats: Markdown, Styled HTML, or PDF
- Bulk export multiple conversations from chat history
- Create/update GitHub Gists for easy sharing
- Filter exports by message type (all messages or assistant-only)
- Include or exclude thinking blocks in exports
- Add a download button directly to the Claude.ai interface
- Generate professionally styled exports with syntax highlighting and custom CSS

## Features

### 1. Automatic Conversation Capture
- Intercepts Claude.ai API responses containing conversation data
- Stores conversation data locally in Chrome storage
- Updates in real-time as conversations progress

### 2. Export Format Options
- **Markdown (.md)**: Plain markdown format
- **Styled HTML (.html)**: Enhanced HTML with syntax highlighting (Prism.js), custom CSS, and professional styling
- **PDF Export**: Print-ready HTML that opens in a new window for easy PDF generation via browser's print function
- **Message Filtering**: Choose between all messages or assistant-only
- **Include Thinking**: Option to include/exclude Claude's thinking blocks

### 3. GitHub Gist Integration
- Create private GitHub Gists from conversations
- Update existing Gists for the same conversation
- Automatic expiry management for stored Gist IDs (30-day retention)

### 4. In-Page Download Button
- Adds a "Download" button directly to Claude.ai interface
- Dropdown menu with multiple export format options (Markdown, Styled HTML, PDF)
- Remembers your export preferences
- One-click export with customizable settings

### 5. Bulk Export from Chat History
- Export multiple conversations at once from the chat history page
- Smart export button that only appears when chats are selected
- Non-intrusive toast notifications showing progress
- Cancel export operation at any time
- Automatic file naming based on chat titles

## Project Structure

```
claude-extension/
├── src/                     # Source code
│   ├── background/         # Background service worker
│   │   └── background.js   # Message handling and storage
│   ├── content/           # Content scripts
│   │   ├── content.js     # Main content script
│   │   ├── inject.js      # Injected script (MAIN world)
│   │   ├── download-button.js  # In-page download button
│   │   └── bulk-export.js      # Bulk export functionality
│   ├── popup/             # Extension popup
│   │   └── popup.js       # Popup logic
│   ├── options/           # Options page
│   │   └── options.js     # Settings management
│   └── shared/            # Shared utilities
│       ├── markdown-builder.js  # Markdown generation
│       ├── pdf-generator.js     # PDF export with custom CSS
│       └── styled-html-generator.js  # Styled HTML generation with Prism.js
├── pages/                  # HTML pages
│   ├── popup.html         # Extension popup interface
│   └── options.html       # Settings page
├── styles/                # CSS styles
│   ├── popup.css         # Popup styling
│   └── options.css       # Options page styling
├── icons/                # Extension icons
│   ├── icon.svg
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
├── manifest.json         # Extension configuration
├── COPYING              # Apache 2.0 License
└── README.md           # This file
```


## Technical Architecture

### Content Scripts Flow
1. **src/content/inject.js** (MAIN world): Intercepts fetch API calls to Claude.ai endpoints
2. **src/content/content.js** (ISOLATED world): Receives intercepted data via postMessage
3. **src/background/background.js**: Stores conversation data in Chrome storage
4. **src/content/download-button.js**: Adds UI elements to Claude.ai page
5. **src/content/bulk-export.js**: Handles bulk export from chat history

### Key Components

#### manifest.json
- Manifest V3 configuration
- Defines permissions: `alarms`, `storage`, `tabs`
- Host permissions for `*.claude.ai/*`
- Content scripts with different execution contexts

#### src/background/background.js
- Listens for messages from content scripts
- Stores conversation data in Chrome local storage
- Implements periodic cleanup of expired data (24-hour alarm)

#### src/content/content.js
- Bridge between injected script and background script
- Listens for intercepted conversation data
- Forwards data to background script via Chrome runtime API

#### src/content/inject.js
- Overrides native fetch API
- Intercepts Claude API responses matching pattern: `/api/organizations/*/chat_conversations/*?tree=True`
- Posts intercepted data to content script

#### src/content/download-button.js
- Adds download button to Claude.ai interface
- Creates popover menu with export options
- Implements markdown generation with filtering
- Manages user preferences in storage

#### src/content/bulk-export.js
- Enables bulk export from chat history page
- Conditionally shows export button when chats are selected
- Fetches chat data directly from Claude API
- Shows progress in non-intrusive toast notification
- Supports cancellation during export process

#### src/popup/popup.js
- Main popup interface logic
- Markdown generation from conversation JSON
- GitHub Gist creation/update functionality
- Handles artifacts, tool use, and attachments

#### src/options/options.js
- Settings page for GitHub token configuration
- Secure token storage in Chrome local storage

#### src/shared/markdown-builder.js
- Shared markdown generation utilities
- Used by popup, download-button, and bulk-export components
- Handles Claude artifacts, tool use, and message formatting

#### src/shared/pdf-generator.js
- Converts markdown to print-ready HTML for PDF generation
- Supports custom CSS styling via `download_as_pdf.css`
- Opens formatted content in new window for browser-based PDF printing
- Includes fallback to HTML download if popup is blocked

#### src/shared/styled-html-generator.js
- Enhanced HTML generation with professional styling
- Integrates Prism.js for syntax highlighting in code blocks
- Supports multiple programming languages (Python, JavaScript, SQL, Go, Bash, etc.)
- Optimized print styles for clean PDF output
- Custom CSS with proper table formatting, typography, and spacing

## Installation

### Building from Source

#### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

#### Build Steps
1. Clone this repository
   ```bash
   git clone <repository-url>
   cd claude-extension
   ```

2. Install dependencies (if any)
   ```bash
   npm install
   ```

3. Build for your browser:
   ```bash
   # For Chrome
   npm run build:chrome

   # For Firefox
   npm run build:firefox

   # For both
   npm run build
   ```

4. Package the extension (optional):
   ```bash
   # Creates dist/claude-to-markdown-chrome.zip
   npm run package:chrome

   # Creates dist/claude-to-markdown-firefox.zip
   npm run package:firefox
   ```

### Installing in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/chrome` directory (or the root directory for development)

### Installing in Firefox
1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" (left sidebar)
3. Click "Load Temporary Add-on"
4. Select any file in the `dist/firefox` directory (or manifest.json)

### For Firefox Permanent Installation
1. Build and package for Firefox: `npm run package:firefox`
2. Submit to [Firefox Add-ons](https://addons.mozilla.org/developers/) for signing
3. Install the signed .xpi file

### Browser Compatibility
- **Chrome**: Version 100+ (Manifest V3)
- **Firefox**: Version 109+ (Manifest V2 with polyfill)
- **Edge**: Compatible with Chrome build
- **Opera**: Compatible with Chrome build

## Usage

### Basic Export
1. Navigate to Claude.ai and have a conversation
2. Click the extension icon in Chrome toolbar
3. View the captured conversation in markdown format
4. Use "Refresh Page" to capture latest data

### In-Page Download
1. Look for "Download" button in Claude.ai interface (next to Share button)
2. Click to open export options menu
3. Select your preferred export format:
   - **Download MD**: Plain markdown file
   - **Download HTML**: Styled HTML with syntax highlighting
   - **Download PDF**: Opens print-ready HTML in new window (use Ctrl+P/Cmd+P to save as PDF)
4. Configure message filtering and thinking block preferences
5. Your preferences are saved automatically for future exports

### GitHub Gist Integration
1. Click the settings icon in the extension popup
2. Add your GitHub Personal Access Token
   - Create token at: https://github.com/settings/personal-access-tokens/new
   - Required scope: `gist`
3. Click "Create Gist" or "Update Gist" in the popup
4. Gist will open automatically in new tab

### Bulk Export from Chat History
1. Navigate to your Claude chat history page
2. Select one or more conversations using the checkboxes
3. Click the export button that appears in the toolbar
4. Monitor progress in the toast notification at bottom-right
5. Files will download automatically with chat titles as filenames
6. Click the X button on the toast to cancel the export at any time

## Development Guide

### Prerequisites
- Chrome or Firefox browser
- Basic understanding of Chrome Extension APIs
- Node.js (optional, for any build tools)

### Key APIs Used
- Chrome Storage API: Data persistence
- Chrome Runtime API: Message passing
- Chrome Tabs API: Tab management
- Chrome Alarms API: Periodic cleanup
- Fetch API: Network interception

### Message Flow
```
Claude.ai Page
    � (fetch intercepted)
inject.js
    � (postMessage)
content.js
    � (chrome.runtime.sendMessage)
background.js
    � (chrome.storage.local.set)
Chrome Storage
    � (chrome.storage.onChanged)
popup.js / download-button.js
```

### Export Generation Features
- **Markdown**: Converts Claude artifacts to code blocks, handles tool use, preserves attachments
- **Styled HTML**: Professional styling with Prism.js syntax highlighting, responsive tables, optimized typography
- **PDF Export**: Print-optimized HTML with custom CSS, removes browser headers/footers, maintains formatting
- Formats timestamps in readable format
- Supports artifact updates with before/after display
- Code blocks with language-specific syntax highlighting
- Responsive table formatting with proper borders and spacing

### Security Considerations
- Content Security Policy defined for extension pages
- Separate execution contexts (MAIN vs ISOLATED)
- Token stored securely in Chrome storage
- No external dependencies or CDN resources
- HTTPS-only communication with GitHub API

## Contributing

This project is licensed under Apache 2.0 License. See COPYING file for details.

### Adding New Features
1. Follow existing code patterns
2. Maintain SPDX license headers
3. Update this README with new functionality
4. Test in both Chrome and Firefox

### Code Style
- Use consistent indentation (2 spaces)
- Add comments for complex logic
- Keep functions focused and small
- Handle errors gracefully

## Troubleshooting

### Extension Not Capturing Conversations
1. Refresh Claude.ai page after installing extension
2. Check if extension has proper permissions
3. Look for console errors in developer tools

### GitHub Gist Creation Fails
1. Verify GitHub token has `gist` scope
2. Check network connectivity
3. Look for error messages in extension popup

### Download Button Not Appearing
1. Wait for page to fully load
2. Check if on Claude.ai domain
3. Try refreshing the page

## Links

- Homepage: https://abhimanyusikarwar.com/posts/export_claude_chat_to_markdown
- License: Apache 2.0

## Author

Created as an open-source tool for the Claude.ai community. Contributions welcome!