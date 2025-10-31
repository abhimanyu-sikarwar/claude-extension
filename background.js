// SPDX-License-Identifier: Apache-2.0

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message.type);

    if (message.type === 'CLAUDE_CONVERSATION') {
        chrome.storage.local.set({
            lastIntercepted: message.data
        }).then(() => {
            console.log('Stored Claude conversation');
            sendResponse({ success: true });
        }).catch(e => {
            console.error('Error storing conversation:', e);
            sendResponse({ success: false, error: e.message });
        });
        return true; // Keep channel open for async response
    }

    // Handle bulk export tab creation
    if (message.type === 'CREATE_TAB') {
        console.log('Creating tab for:', message.url);
        chrome.tabs.create({
            url: message.url,
            active: false
        }).then(tab => {
            console.log('Tab created:', tab.id);
            sendResponse({ success: true, tabId: tab.id });
        }).catch(error => {
            console.error('Error creating tab:', error);
            sendResponse({ success: false, error: error.message });
        });
        return true; // Keep channel open for async response
    }

    // Handle tab closing
    if (message.type === 'CLOSE_TAB') {
        console.log('Closing tab:', message.tabId);
        chrome.tabs.remove(message.tabId).then(() => {
            console.log('Tab closed:', message.tabId);
            sendResponse({ success: true });
        }).catch(error => {
            console.error('Error closing tab:', error);
            sendResponse({ success: false, error: error.message });
        });
        return true; // Keep channel open for async response
    }

    // Check if tab exists
    if (message.type === 'CHECK_TAB') {
        console.log('Checking tab:', message.tabId);
        chrome.tabs.get(message.tabId).then(tab => {
            console.log('Tab exists:', tab.id, tab.status, tab.url);
            sendResponse({ success: true, exists: true, status: tab.status, url: tab.url });
        }).catch(error => {
            console.error('Tab does not exist:', error);
            sendResponse({ success: true, exists: false, error: error.message });
        });
        return true; // Keep channel open for async response
    }

    // Handle sending messages to specific tabs
    if (message.type === 'SEND_TO_TAB') {
        console.log('Sending message to tab:', message.tabId, 'Payload:', message.payload.type);
        chrome.tabs.sendMessage(message.tabId, message.payload).then(() => {
            console.log('Message sent successfully to tab:', message.tabId);
            sendResponse({ success: true });
        }).catch(error => {
            console.error('Error sending message to tab:', error);
            // Try to check if tab still exists
            chrome.tabs.get(message.tabId).then(tab => {
                console.error('Tab exists but message failed. Tab status:', tab.status);
                sendResponse({ success: false, error: `Tab exists but message failed: ${error.message}` });
            }).catch(() => {
                console.error('Tab no longer exists');
                sendResponse({ success: false, error: 'Tab no longer exists' });
            });
        });
        return true; // Keep channel open for async response
    }

    // If we don't recognize the message type, still send a response
    return false;
});

// Create alarm for cleanup
chrome.alarms.create("cleanExpiredData", { periodInMinutes: 24 * 60 });

// Listen for the alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "cleanExpiredData") {
        cleanExpiredData();
    }
});

// Periodic cleanup function
async function cleanExpiredData() {
    const allData = await chrome.storage.local.get();
    const now = Date.now();
    const keysToRemove = [];

    for (const [key, item] of Object.entries(allData)) {
        if (key.startsWith("gist-") && item.expiry && now > item.expiry) {
            keysToRemove.push(key);
        }
    }

    if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        console.log(`Cleaned up ${keysToRemove.length} expired items`);
    }
}