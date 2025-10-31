// SPDX-License-Identifier: Apache-2.0
// Firefox-specific background script using webRequest API

const CLAUDE_URL_PATTERN = /^https:\/\/claude\.ai\/api\/organizations\/[\w-]+\/chat_conversations\/[\w-]+\?tree=True.*?/;

// Use webRequest API to intercept and read response data
browser.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (details.type === "xmlhttprequest" && CLAUDE_URL_PATTERN.test(details.url)) {
      console.log('Claude to Markdown: Intercepting request:', details.url);

      try {
        // Create a filter to read the response data
        let filter = browser.webRequest.filterResponseData(details.requestId);
        let decoder = new TextDecoder("utf-8");
        let encoder = new TextEncoder();
        let str = '';

        filter.ondata = event => {
          str += decoder.decode(event.data, {stream: true});
          filter.write(event.data);
        };

        filter.onstop = event => {
          try {
            const jsonData = JSON.parse(str);
            console.log('Claude to Markdown: Successfully parsed response');

            // Extract organization ID from URL
            const orgMatch = details.url.match(/organizations\/([a-f0-9-]{36})/);
            const orgId = orgMatch ? orgMatch[1] : null;

            // Store the intercepted data
            const storageData = {
              lastIntercepted: {
                timestamp: new Date().toISOString(),
                url: details.url,
                content: jsonData,
                organizationId: orgId
              }
            };

            // Also store organization ID separately if found
            if (orgId) {
              storageData.organizationId = orgId;
            }

            browser.storage.local.set(storageData).then(() => {
              console.log('Claude to Markdown: Stored conversation data');
            });
          } catch (e) {
            console.error('Claude to Markdown: Error parsing JSON:', e);
          }
          filter.disconnect();
        };

        filter.onerror = event => {
          console.error('Claude to Markdown: Filter error:', event);
          filter.disconnect();
        };
      } catch (e) {
        console.error('Claude to Markdown: Error setting up filter:', e);
      }
    }
    return { cancel: false };
  },
  {
    urls: ["*://claude.ai/api/organizations/*/chat_conversations/*"],
    types: ["xmlhttprequest"]
  },
  ["blocking"]
);

// Handle messages from content scripts (for compatibility)
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message.type);

    if (message.type === 'CLAUDE_CONVERSATION') {
        // Store data from content script as fallback
        const storageData = {
            lastIntercepted: message.data
        };

        if (message.data && message.data.organizationId) {
            storageData.organizationId = message.data.organizationId;
            console.log('Storing organization ID:', message.data.organizationId);
        }

        browser.storage.local.set(storageData).then(() => {
            console.log('Stored Claude conversation from content script');
            sendResponse({ success: true });
        }).catch(e => {
            console.error('Error storing conversation:', e);
            sendResponse({ success: false, error: e.message });
        });
        return true; // Keep channel open for async response
    }

    return false;
});

// Create alarm for cleanup
browser.alarms.create("cleanExpiredData", { periodInMinutes: 24 * 60 });

// Listen for the alarm
browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "cleanExpiredData") {
        cleanExpiredData();
    }
});

// Periodic cleanup function
async function cleanExpiredData() {
    const allData = await browser.storage.local.get();
    const now = Date.now();
    const keysToRemove = [];

    for (const [key, item] of Object.entries(allData)) {
        if (key.startsWith("gist-") && item.expiry && now > item.expiry) {
            keysToRemove.push(key);
        }
    }

    if (keysToRemove.length > 0) {
        await browser.storage.local.remove(keysToRemove);
        console.log(`Cleaned up ${keysToRemove.length} expired items`);
    }
}