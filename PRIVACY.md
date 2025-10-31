# Privacy Policy for Claude to Markdown

**Last Updated:** Nov 1, 2025

## Overview
Claude to Markdown is a browser extension that allows users to export their Claude.ai conversations to Markdown format. We are committed to protecting your privacy and being transparent about our data practices.

## Data Collection
**Claude to Markdown does NOT collect, store, or transmit any personal data to external servers operated by the developer.**

## What Data is Processed Locally

### 1. Conversation Data
- **What:** Content from your Claude.ai conversations
- **Why:** To generate Markdown exports when you request them
- **Where:** Processed entirely in your browser's memory
- **How Long:** Temporarily stored until you load a different conversation
- **Access:** Only you have access to this data

### 2. Export Preferences
- **What:** Your export settings (message type, include thinking blocks)
- **Why:** To remember your preferences between sessions
- **Where:** Stored locally using Chrome's storage API
- **How Long:** Until you clear browser data or uninstall the extension
- **Access:** Only accessible within your browser

### 3. GitHub Integration (Optional)
If you choose to configure GitHub Gist integration:
- **GitHub Token:** Stored locally in your browser
- **Gist Mappings:** Conversation ID to Gist URL mappings stored for 30 days
- **Data Sent to GitHub:** Only the markdown content you explicitly choose to export as a Gist

## Third-Party Services

### Claude.ai
- The extension must access claude.ai to read conversation data
- This is required for the core export functionality
- No data is sent back to Claude.ai beyond normal website operations

### GitHub (Optional)
- Only used if you configure a GitHub personal access token
- Markdown content is sent directly to GitHub's API when you create/update Gists
- We do not intermediate or store this data
- Subject to [GitHub's Privacy Policy](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement)

## Permissions Explained

### Host Permissions (claude.ai)
- **Purpose:** Access conversation data for export
- **Scope:** Only claude.ai domain
- **Usage:** Reading conversation content when you click export

### Storage Permission
- **Purpose:** Save your preferences and temporary data
- **Scope:** Local browser storage only
- **Usage:** Storing export preferences and recent conversation data

### Tabs Permission
- **Purpose:** Refresh pages and manage bulk exports
- **Scope:** Only claude.ai tabs
- **Usage:** Opening/closing tabs during bulk export

### Alarms Permission
- **Purpose:** Clean up expired data
- **Scope:** Background cleanup task
- **Usage:** Automatically remove Gist mappings older than 30 days

## Data Retention

| Data Type | Retention Period | Deletion Method |
|-----------|------------------|-----------------|
| Conversation Cache | Until next conversation loads | Automatic overwrite |
| Export Preferences | Until browser data cleared | Clear browser storage |
| GitHub Gist Mappings | 30 days | Automatic cleanup |
| GitHub Token | Until manually removed | Clear in extension settings |

## Data Security
- All data is stored using Chrome's secure storage API
- No data is transmitted over the internet except for optional GitHub Gist uploads
- GitHub tokens are stored locally and transmitted only over HTTPS to GitHub's API

## Your Rights

### Access
You can view all stored data by:
1. Opening Chrome DevTools (F12)
2. Going to Application → Storage → Extension Storage

### Deletion
You can delete all extension data by:
1. Right-clicking the extension icon
2. Selecting "Remove from Chrome"
3. Or clearing browser data for the extension

### Control
You have complete control over:
- When to export conversations
- What data to include in exports
- Whether to use GitHub integration
- When to delete your data

## Children's Privacy
This extension is not intended for use by children under 13 years of age. We do not knowingly collect data from children.

## Changes to Privacy Policy
We may update this privacy policy from time to time. Changes will be posted on this page with an updated "Last Updated" date.

## Contact
For privacy concerns or questions:
- **GitHub Issues:** [\[Repository URL\]](https://github.com/abhimanyu-sikarwar/claude-extension)/issues

## Compliance
This extension complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)

## Developer Information
- **Developer:** Abhimanyu Sikrwar
- **Extension ID:** hpmejedgaglmmbogjgmbphhdopeaglfe
- **Repository:** https://github.com/abhimanyu-sikarwar/claude-extension

## No Sale of Data
**We do not sell, rent, or trade your data to third parties under any circumstances.**

## Disclaimer
This extension is not affiliated with, endorsed by, or officially connected to Anthropic (makers of Claude.ai).