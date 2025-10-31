# Claude to Markdown - Chrome Extension

A Chrome extension that exports Claude.ai chat conversations to Markdown format with optional GitHub Gist integration.

## Overview

This extension intercepts and captures Claude.ai conversation data, allowing you to:
- Export conversations as Markdown files
- Bulk export multiple conversations from chat history
- Create/update GitHub Gists for easy sharing
- Filter exports by message type (all messages or assistant-only)
- Include or exclude thinking blocks in exports
- Add a download button directly to the Claude.ai interface

## Features

### 1. Automatic Conversation Capture
- Intercepts Claude.ai API responses containing conversation data
- Stores conversation data locally in Chrome storage
- Updates in real-time as conversations progress

### 2. Markdown Export Options
- **All Messages**: Exports both user and assistant messages
- **Assistant Only**: Exports only Claude's responses
- **Include Thinking**: Option to include/exclude Claude's thinking blocks

### 3. GitHub Gist Integration
- Create private GitHub Gists from conversations
- Update existing Gists for the same conversation
- Automatic expiry management for stored Gist IDs (30-day retention)

### 4. In-Page Download Button
- Adds a "Download MD" button directly to Claude.ai interface
- Dropdown menu with export options
- Remembers your export preferences

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
│       └── markdown-builder.js  # Markdown generation
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

## Installation

### From Source
1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extension directory

### For Firefox
The extension includes Firefox-specific settings in manifest.json:
- Gecko ID: `{@id}`
- Minimum version: 109.0

## Usage

### Basic Export
1. Navigate to Claude.ai and have a conversation
2. Click the extension icon in Chrome toolbar
3. View the captured conversation in markdown format
4. Use "Refresh Page" to capture latest data

### In-Page Download
1. Look for "Download MD" button in Claude.ai interface (next to Share button)
2. Click to open export options
3. Select message type and thinking inclusion preferences
4. Click "Download MD" to save file

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

### Markdown Generation Features
- Converts Claude artifacts to code blocks
- Handles tool use (repl, artifacts)
- Preserves attachments with collapsible details
- Formats timestamps in readable format
- Supports artifact updates with before/after display

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