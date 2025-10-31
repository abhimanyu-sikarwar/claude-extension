// SPDX-License-Identifier: Apache-2.0
// This script runs in the page context (MAIN world) to intercept fetch calls

(function() {
  const CLAUDE_URL_PATTERN = /^https:\/\/claude\.ai\/api\/organizations\/[\w-]+\/chat_conversations\/[\w-]+\?tree=True.*?/;
  
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    
    if (url && CLAUDE_URL_PATTERN.test(url)) {
      const clonedResponse = response.clone();
      
      try {
        const jsonData = await clonedResponse.json();
        
        // Extract organization ID from URL
        const orgMatch = url.match(/organizations\/([a-f0-9-]{36})/);
        const orgId = orgMatch ? orgMatch[1] : null;

        // Post message to content script
        window.postMessage({
          type: 'CLAUDE_CONVERSATION_INTERCEPTED',
          data: {
            timestamp: new Date().toISOString(),
            url: url,
            content: jsonData,
            organizationId: orgId
          }
        }, '*');
      } catch (e) {
        console.log('Error parsing Claude response:', e);
      }
    }
    
    return response;
  };
  
  console.log('Claude to Markdown: Fetch interceptor installed');
})();