// SPDX-License-Identifier: Apache-2.0

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CLAUDE_CONVERSATION') {
        chrome.storage.local.set({
            lastIntercepted: message.data
        }).then(() => {
            console.log('Stored Claude conversation');
        }).catch(e => {
            console.error('Error storing conversation:', e);
        });
    }
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