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

// Inject the script after setting up listener
function injectScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    script.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
}

// Inject as early as possible
if (document.documentElement) {
    injectScript();
} else {
    // Wait for document to be ready
    const observer = new MutationObserver(() => {
        if (document.documentElement) {
            injectScript();
            observer.disconnect();
        }
    });
    observer.observe(document, { childList: true });
}