// SPDX-License-Identifier: Apache-2.0

// This runs in the content script context where we have access to chrome APIs
const CLAUDE_URL_PATTERN = /^https:\/\/claude\.ai\/api\/organizations\/[\w-]+\/chat_conversations\/[\w-]+\?tree=True.*?/;

// Listen for messages from the injected script first
window.addEventListener('message', function (event) {
    // Only accept messages from the same window
    if (event.source !== window) return;

    if (event.data.type === 'CLAUDE_CONVERSATION_INTERCEPTED') {
        // Forward to background script using chrome API
        chrome.runtime.sendMessage({
            type: 'CLAUDE_CONVERSATION',
            data: event.data.data
        });
    }
});

// The page-context fetch interceptor (src/content/inject.js) is injected
// declaratively via the manifest's "world": "MAIN" content_scripts entry at
// document_start. No manual injection is needed here — we only forward the
// messages it posts back (handled by the listener above).