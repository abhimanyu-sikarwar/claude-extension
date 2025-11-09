// SPDX-License-Identifier: Apache-2.0
// Add bulk export functionality to chat list page

(function () {
    let exportButtonAdded = false;

    // Extract chat UUID from URL
    function getChatUuidFromUrl(url) {
        const match = url.match(/\/chat\/([a-f0-9-]+)/);
        return match ? match[1] : null;
    }

    // Get organization ID from the page
    async function getOrganizationId() {
        // Method 1: Check cookies for lastActiveOrg (most reliable)
        try {
            // Get all cookies
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'lastActiveOrg' && value) {
                    const decodedValue = decodeURIComponent(value);
                    // The cookie might be JSON or just the org ID
                    try {
                        const parsed = JSON.parse(decodedValue);
                        if (parsed.uuid || parsed.id || parsed.organizationId) {
                            const orgId = parsed.uuid || parsed.id || parsed.organizationId;
                            console.log('Got org ID from lastActiveOrg cookie (JSON):', orgId);
                            return orgId;
                        }
                    } catch {
                        // Not JSON, might be direct value
                        if (decodedValue.match(/^[a-f0-9-]{36}$/)) {
                            console.log('Got org ID from lastActiveOrg cookie (direct):', decodedValue);
                            return decodedValue;
                        }
                    }
                }
            }
        } catch (e) {
            console.log('Could not get org ID from cookies:', e);
        }

        // Method 2: Check if we have it in storage from previous interceptions
        try {
            const data = await chrome.storage.local.get('lastIntercepted');
            if (data.lastIntercepted && data.lastIntercepted.url) {
                const match = data.lastIntercepted.url.match(/organizations\/([a-f0-9-]+)/);
                if (match) {
                    console.log('Got org ID from storage:', match[1]);
                    return match[1];
                }
            }
        } catch (e) {
            console.log('Could not get org ID from storage:', e);
        }

        // Method 3: Try to extract from current page's script tags
        try {
            const scripts = document.querySelectorAll('script');
            for (const script of scripts) {
                const content = script.textContent || script.innerHTML || '';
                // Look for organization ID in various formats
                const patterns = [
                    /["']organizationId["']\s*:\s*["']([a-f0-9-]{36})["']/,
                    /organizations\/([a-f0-9-]{36})/,
                    /org[_-]?id["']\s*:\s*["']([a-f0-9-]{36})["']/i,
                    /["']uuid["']\s*:\s*["']([a-f0-9-]{36})["']/
                ];

                for (const pattern of patterns) {
                    const match = content.match(pattern);
                    if (match && match[1]) {
                        console.log('Got org ID from script tag:', match[1]);
                        return match[1];
                    }
                }
            }
        } catch (e) {
            console.log('Could not get org ID from script tags:', e);
        }

        // Method 4: Try to extract from page HTML/scripts
        try {
            const pageContent = document.documentElement.innerHTML;
            const match = pageContent.match(/organizations\/([a-f0-9-]{36})/);
            if (match) {
                console.log('Got org ID from page content:', match[1]);
                return match[1];
            }
        } catch (e) {
            console.log('Could not get org ID from page content:', e);
        }

        // Method 5: Try to extract from meta tags or data attributes
        try {
            // Check meta tags
            const metaTags = document.querySelectorAll('meta[name*="org"], meta[property*="org"]');
            for (const meta of metaTags) {
                const content = meta.getAttribute('content') || '';
                const match = content.match(/([a-f0-9-]{36})/);
                if (match) {
                    console.log('Got org ID from meta tag:', match[1]);
                    return match[1];
                }
            }

            // Check data attributes
            const elementsWithData = document.querySelectorAll('[data-org-id], [data-organization-id], [data-org]');
            for (const elem of elementsWithData) {
                const orgId = elem.getAttribute('data-org-id') ||
                             elem.getAttribute('data-organization-id') ||
                             elem.getAttribute('data-org');
                if (orgId && orgId.match(/^[a-f0-9-]{36}$/)) {
                    console.log('Got org ID from data attribute:', orgId);
                    return orgId;
                }
            }
        } catch (e) {
            console.log('Could not get org ID from meta/data attributes:', e);
        }

        // Method 6: Use a fallback/default org ID if available
        // Try to extract from any visible chat link without fetching
        try {
            const chatLinks = document.querySelectorAll('a[href*="/chat/"]');
            for (const link of chatLinks) {
                // Try to extract from onclick or other attributes
                const onclick = link.getAttribute('onclick') || '';
                const dataHref = link.getAttribute('data-href') || '';
                const combinedText = onclick + dataHref + link.outerHTML;

                const match = combinedText.match(/organizations\/([a-f0-9-]{36})/);
                if (match) {
                    console.log('Got org ID from link attributes:', match[1]);
                    return match[1];
                }
            }
        } catch (e) {
            console.log('Could not get org ID from link attributes:', e);
        }

        // Method 7: Try window object with more patterns
        try {
            // Check various window properties without using eval
            const windowObjs = [
                { name: 'window.__NEXT_DATA__', obj: window.__NEXT_DATA__ },
                { name: 'window.__INITIAL_STATE__', obj: window.__INITIAL_STATE__ },
                { name: 'window.__PRELOADED_STATE__', obj: window.__PRELOADED_STATE__ },
                { name: 'window.__APP_CONFIG__', obj: window.__APP_CONFIG__ },
                { name: 'window.claude_config', obj: window.claude_config }
            ];

            for (const { name, obj } of windowObjs) {
                try {
                    if (obj) {
                        const jsonString = JSON.stringify(obj);
                        const match = jsonString.match(/([a-f0-9-]{36})/);
                        if (match) {
                            console.log(`Got org ID from ${name}:`, match[1]);
                            return match[1];
                        }
                    }
                } catch {}
            }
        } catch (e) {
            console.log('Could not get org ID from window object:', e);
        }

        // Method 8: As last resort, try to make a synchronous XHR request (Firefox compatible)
        try {
            const chatLink = document.querySelector('a[href*="/chat/"]');
            if (chatLink && typeof XMLHttpRequest !== 'undefined') {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', chatLink.href, false); // Synchronous request
                xhr.setRequestHeader('Accept', 'text/html');
                xhr.withCredentials = true;

                try {
                    xhr.send();
                    if (xhr.status === 200) {
                        const match = xhr.responseText.match(/organizations\/([a-f0-9-]{36})/);
                        if (match) {
                            console.log('Got org ID from XHR request:', match[1]);
                            return match[1];
                        }
                    }
                } catch (xhrError) {
                    console.log('XHR request failed:', xhrError);
                }
            }
        } catch (e) {
            console.log('Could not get org ID via XHR:', e);
        }

        console.error('Failed to determine organization ID after trying all methods');
        return null;
    }

    // Fetch chat data directly from API
    async function fetchChatData(orgId, chatUuid) {
        const url = `https://claude.ai/api/organizations/${orgId}/chat_conversations/${chatUuid}?tree=True&rendering_mode=messages&render_all_tools=true`;

        try {
            const response = await fetch(url, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch chat: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching chat ${chatUuid}:`, error);
            throw error;
        }
    }

    // Build markdown for a chat
    function buildMarkdown(parsed, messageType = 'all', includeThinking = true) {
        // Use the shared markdown builder with proper messageType
        return window.ClaudeMarkdownBuilder.buildMarkdown(parsed, messageType, includeThinking);
    }

    // Download single markdown file
    function downloadMarkdown(markdown, filename) {
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Show export format popover
    function showExportFormatPopover(buttonElement) {
        // Remove existing popover if any
        const existingPopover = document.getElementById('bulk-export-format-popover');
        if (existingPopover) {
            existingPopover.remove();
            return;
        }

        // Get button position
        const rect = buttonElement.getBoundingClientRect();

        // Create popover wrapper
        const wrapper = document.createElement('div');
        wrapper.id = 'bulk-export-format-popover';
        wrapper.setAttribute('data-radix-popper-content-wrapper', '');
        wrapper.setAttribute('dir', 'ltr');
        wrapper.style.cssText = `
          position: fixed;
          left: 0px;
          top: 0px;
          transform: translate(${rect.left}px, ${rect.bottom + 4}px);
          min-width: max-content;
          z-index: 50;
          will-change: transform;
        `;

        // Create popover content
        const popover = document.createElement('div');
        popover.setAttribute('data-side', 'bottom');
        popover.setAttribute('data-align', 'start');
        popover.setAttribute('role', 'menu');
        popover.setAttribute('data-state', 'open');
        popover.className = 'z-dropdown bg-bg-000 border-0.5 border-border-300 backdrop-blur-xl rounded-xl min-w-[14rem] overflow-hidden p-1.5 text-text-300 shadow-diffused shadow-[hsl(var(--always-black)/4%)] overflow-y-auto';
        popover.style.cssText = 'outline: none; pointer-events: auto;';

        popover.innerHTML = `
          <div class="px-2 py-1.5 text-xs font-medium text-text-200 uppercase tracking-wide">Export Format</div>

          <button class="export-format-option w-full py-1.5 px-2 rounded-md cursor-pointer whitespace-nowrap overflow-hidden flex items-center gap-2 hover:bg-bg-200 hover:text-text-000 text-sm transition-colors" data-format="markdown">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 2h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm1 9v2h2V7L4 7v4zm4 2v-2l2-2 2 2v2h1V7h-1l-2.5 2.5L7 7H6v6h2z"/>
            </svg>
            <span>Markdown (.md)</span>
          </button>

          <button class="export-format-option w-full py-1.5 px-2 rounded-md cursor-pointer whitespace-nowrap overflow-hidden flex items-center gap-2 hover:bg-bg-200 hover:text-text-000 text-sm transition-colors" data-format="pdf">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 2a2 2 0 0 1 2-2h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm7.5 1.5v-2l3 3h-2a1 1 0 0 1-1-1z"/>
              <path d="M5.5 9a.5.5 0 0 0 0 1h1a1.5 1.5 0 0 0 0-3h-1a.5.5 0 0 0 0 1h1a.5.5 0 0 1 0 1h-1zm2 1.5v1a.5.5 0 0 0 1 0v-1h.5a1.5 1.5 0 0 0 0-3H8v3h.5zm1-1.5h.5a.5.5 0 0 1 0 1H8.5V9z"/>
            </svg>
            <span>PDF (Custom Style)</span>
          </button>
        `;

        wrapper.appendChild(popover);
        document.body.appendChild(wrapper);

        // Handle format selection
        const formatOptions = popover.querySelectorAll('.export-format-option');
        formatOptions.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const format = btn.getAttribute('data-format');
                wrapper.remove();
                await handleBulkExport(format);
            });
        });

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closePopover(e) {
                if (!wrapper.contains(e.target) && e.target !== buttonElement) {
                    wrapper.remove();
                    document.removeEventListener('click', closePopover);
                }
            });
        }, 0);
    }

    // Show progress toast
    function showProgressToast(total) {
        const toast = document.createElement('div');
        toast.id = 'bulk-export-progress';
        toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: white;
      border-radius: 8px;
      padding: 16px;
      min-width: 320px;
      max-width: 400px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -5px rgba(0, 0, 0, 0.04);
      z-index: 10000;
      border: 1px solid #e5e7eb;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s ease;
    `;

        // Create toast structure using DOM APIs for security
        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;';

        const title = document.createElement('h3');
        title.style.cssText = 'margin: 0; font-size: 14px; font-weight: 600; color: #1a1a1a;';
        title.textContent = 'Exporting Chats';

        const cancelButton = document.createElement('button');
        cancelButton.id = 'cancel-export';
        cancelButton.title = 'Cancel export';
        cancelButton.style.cssText = 'background: none; border: none; color: #6b7280; cursor: pointer; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: background 0.2s;';
        cancelButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 1L1 13M1 1L13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

        headerDiv.appendChild(title);
        headerDiv.appendChild(cancelButton);

        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = 'margin-bottom: 8px;';

        const progressInfo = document.createElement('div');
        progressInfo.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;';

        const countSpan = document.createElement('span');
        countSpan.style.cssText = 'font-size: 12px; color: #6b7280;';

        const currentSpan = document.createElement('span');
        currentSpan.id = 'export-current';
        currentSpan.textContent = '0';

        const totalSpan = document.createElement('span');
        totalSpan.id = 'export-total';
        totalSpan.textContent = String(total);

        countSpan.appendChild(currentSpan);
        countSpan.appendChild(document.createTextNode(' / '));
        countSpan.appendChild(totalSpan);

        const percentageSpan = document.createElement('span');
        percentageSpan.id = 'export-percentage';
        percentageSpan.style.cssText = 'font-size: 12px; color: #6b7280;';
        percentageSpan.textContent = '0%';

        progressInfo.appendChild(countSpan);
        progressInfo.appendChild(percentageSpan);

        const progressBarContainer = document.createElement('div');
        progressBarContainer.style.cssText = 'width: 100%; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;';

        const progressBar = document.createElement('div');
        progressBar.id = 'export-progress-bar';
        progressBar.style.cssText = 'height: 100%; background: #2563eb; width: 0%; transition: width 0.3s ease;';

        progressBarContainer.appendChild(progressBar);
        progressContainer.appendChild(progressInfo);
        progressContainer.appendChild(progressBarContainer);

        const statusDiv = document.createElement('div');
        statusDiv.id = 'export-status';
        statusDiv.style.cssText = 'font-size: 12px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        statusDiv.title = '';

        toast.appendChild(headerDiv);
        toast.appendChild(progressContainer);
        toast.appendChild(statusDiv);

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        }, 10);

        // Handle cancel hover
        const cancelBtn = toast.querySelector('#cancel-export');
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = '#f3f4f6';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = 'none';
        });

        return toast;
    }

    // Update progress
    function updateProgress(current, total, status) {
        const currentEl = document.getElementById('export-current');
        const progressBar = document.getElementById('export-progress-bar');
        const statusEl = document.getElementById('export-status');
        const percentageEl = document.getElementById('export-percentage');

        const percentage = Math.round((current / total) * 100);

        if (currentEl) currentEl.textContent = current;
        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (percentageEl) percentageEl.textContent = `${percentage}%`;
        if (statusEl) {
            statusEl.textContent = status;
            statusEl.title = status; // Show full text on hover
        }
    }

    // Handle bulk export by fetching API directly
    async function handleBulkExport(format = 'markdown') {
        // Get all selected checkboxes
        const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        const selectedChats = [];

        // Extract chat UUIDs from selected items
        selectedCheckboxes.forEach(checkbox => {
            const listItem = checkbox.closest('li');
            if (listItem) {
                const link = listItem.querySelector('a[href*="/chat/"]');
                if (link) {
                    const uuid = getChatUuidFromUrl(link.href);
                    const title = listItem.querySelector('.truncate')?.textContent || 'Untitled';
                    if (uuid) {
                        selectedChats.push({ uuid, title });
                    }
                }
            }
        });

        if (selectedChats.length === 0) {
            alert('No chats selected. Please select at least one chat to export.');
            return;
        }

        console.log('Starting bulk export for', selectedChats.length, 'chats');

        // Get organization ID
        updateProgress(0, selectedChats.length, 'Getting organization info...');
        let orgId = await getOrganizationId();

        if (!orgId) {
            // Try to get from storage as fallback
            const storedOrgId = await chrome.storage.local.get('organizationId');
            orgId = storedOrgId.organizationId;

            if (!orgId) {
                // Ask user to provide it manually
                const userInput = prompt(
                    'Could not automatically detect organization ID.\n\n' +
                    'Please enter your organization ID manually.\n' +
                    'You can find it in the URL when viewing any Claude chat:\n' +
                    'claude.ai/api/organizations/[YOUR-ORG-ID]/chat_conversations/...\n\n' +
                    'Organization ID (36 characters):'
                );

                if (userInput && userInput.match(/^[a-f0-9-]{36}$/)) {
                    orgId = userInput;
                    // Save it for future use
                    await chrome.storage.local.set({ organizationId: orgId });
                    console.log('User provided org ID:', orgId);
                } else {
                    alert('Invalid or missing organization ID. Export cancelled.');
                    return;
                }
            }
        }

        // Also save the detected org ID for future use
        if (orgId) {
            await chrome.storage.local.set({ organizationId: orgId });
        }

        console.log('Organization ID:', orgId);

        // Get preferences
        const prefs = await chrome.storage.local.get(['exportPreferences']);
        const includeThinking = prefs.exportPreferences?.includeThinking ?? true;
        const messageType = prefs.exportPreferences?.messageType || 'all'; // Get message type, default to 'all'

        // Show progress toast
        const toast = showProgressToast(selectedChats.length);
        let cancelled = false;

        // Handle cancel button
        const cancelBtn = toast.querySelector('#cancel-export');
        cancelBtn.addEventListener('click', () => {
            cancelled = true;
            // Animate out
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        });

        try {
            for (let i = 0; i < selectedChats.length; i++) {
                if (cancelled) break;

                const chat = selectedChats[i];
                console.log(`Processing chat ${i + 1}/${selectedChats.length}:`, chat.title);
                updateProgress(i, selectedChats.length, `Fetching: ${chat.title}`);

                try {
                    // Fetch chat data directly from API
                    const chatData = await fetchChatData(orgId, chat.uuid);
                    console.log('Chat data fetched successfully');

                    // Build markdown
                    updateProgress(i, selectedChats.length, `Exporting: ${chat.title}`);
                    const markdown = buildMarkdown(chatData, messageType, includeThinking);

                    // Download file based on format
                    const baseFilename = chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

                    if (format === 'pdf') {
                        // Use styled HTML generator for PDF
                        if (window.ClaudeStyledHTMLGenerator && window.ClaudeStyledHTMLGenerator.generateStyledHTML) {
                            const styledHtml = window.ClaudeStyledHTMLGenerator.generateStyledHTML(markdown, baseFilename);

                            // Create blob and download as HTML for user to print
                            const blob = new Blob([styledHtml], { type: 'text/html;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${baseFilename}.html`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);

                            setTimeout(() => {
                                URL.revokeObjectURL(url);
                            }, 1000);
                        } else if (window.ClaudePdfGenerator && window.ClaudePdfGenerator.generatePdf) {
                            // Fallback to old PDF generator
                            await window.ClaudePdfGenerator.generatePdf(markdown, baseFilename, true);
                        } else {
                            console.error('[Bulk Export] PDF generator not available');
                            const filename = `${baseFilename}.md`;
                            downloadMarkdown(markdown, filename);
                        }
                    } else {
                        const filename = `${baseFilename}.md`;
                        downloadMarkdown(markdown, filename);
                    }

                    updateProgress(i + 1, selectedChats.length, `Completed: ${chat.title}`);
                    console.log('Export completed for:', chat.title);

                } catch (error) {
                    console.error(`Failed to export chat ${chat.uuid}:`, error);
                    updateProgress(i + 1, selectedChats.length, `Failed: ${chat.title} - ${error.message}`);
                }

                // Small delay between downloads to avoid overwhelming the browser
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            if (!cancelled) {
                updateProgress(selectedChats.length, selectedChats.length, '✓ All exports completed!');

                // Animate out toast after brief delay
                setTimeout(() => {
                    toast.style.transform = 'translateY(100px)';
                    toast.style.opacity = '0';
                    setTimeout(() => toast.remove(), 300);
                }, 2000);
            }

        } catch (error) {
            console.error('Bulk export error:', error);

            // Update toast to show error
            updateProgress(selectedChats.length, selectedChats.length, `❌ Error: ${error.message}`);

            // Change progress bar color to red
            const progressBar = document.getElementById('export-progress-bar');
            if (progressBar) progressBar.style.background = '#ef4444';

            // Remove toast after delay
            setTimeout(() => {
                toast.style.transform = 'translateY(100px)';
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }

    // Add export button to the toolbar
    function addExportButton() {
        // Check if we're on the chat history page - look for multiple indicators
        const isHistoryPage =
            window.location.pathname.includes('/recents') ||
            window.location.pathname === '/' ||
            document.querySelector('h1.font-heading')?.textContent?.toLowerCase().includes('chat') ||
            document.querySelector('[data-testid="chat-list"]') ||
            document.querySelector('ul[role="list"]')?.querySelector('input[type="checkbox"]');

        console.log('[Bulk Export] History page check:', isHistoryPage);
        console.log('[Bulk Export] Path check:', window.location.pathname);

        if (!isHistoryPage) {
            console.log('[Bulk Export] Not on history page, skipping...');
            return;
        }

        // Find the toolbar with delete buttons - try multiple selectors
        let toolbar = document.querySelector('.flex.items-center.z-header');
        if (!toolbar) {
            // Try alternative selectors for the toolbar
            toolbar = document.querySelector('[role="toolbar"]');
            if (!toolbar) {
                // Look for a container with delete button
                const deleteBtn = Array.from(document.querySelectorAll('button')).find(btn =>
                    btn.textContent?.toLowerCase().includes('delete') ||
                    btn.title?.toLowerCase().includes('delete')
                );
                if (deleteBtn) {
                    toolbar = deleteBtn.parentElement?.parentElement;
                }
            }
        }

        if (!toolbar) {
            // If still no toolbar, look for any selected checkboxes and create our own toolbar
            const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
            if (selectedCheckboxes.length > 0) {
                // Find a good place to insert our button
                const header = document.querySelector('header') || document.querySelector('[role="banner"]');
                if (header) {
                    // Create a simple toolbar container
                    let customToolbar = document.getElementById('custom-export-toolbar');
                    if (!customToolbar) {
                        customToolbar = document.createElement('div');
                        customToolbar.id = 'custom-export-toolbar';
                        customToolbar.className = 'flex items-center gap-2 px-4 py-2';
                        customToolbar.style.cssText = 'background: var(--bg-100, #fff); border-bottom: 1px solid var(--border-200, #e5e7eb);';
                        header.appendChild(customToolbar);
                    }
                    toolbar = customToolbar;
                }
            }
        }

        if (!toolbar) {
            return;
        }

        // Check for selected items
        const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        const selectedCount = selectedCheckboxes.length;

        // Find existing export button
        const existingButton = document.getElementById('bulk-export-button');

        // Remove button if no items are selected
        if (selectedCount === 0) {
            if (existingButton) {
                existingButton.remove();
                exportButtonAdded = false;
            }
            return;
        }

        // Add button only if it doesn't exist and we have selected items
        if (!existingButton && selectedCount > 0) {
            // Create export button matching Claude's style
            const exportButton = document.createElement('button');
            exportButton.id = 'bulk-export-button';
            exportButton.className = `inline-flex
  items-center
  justify-center
  relative
  shrink-0
  can-focus
  select-none
  disabled:pointer-events-none
  disabled:opacity-50
  disabled:shadow-none
  disabled:drop-shadow-none border-transparent
          transition
          font-base
          duration-300
          ease-[cubic-bezier(0.165,0.85,0.45,1)] h-9 w-9 rounded-md active:scale-95 shrink-0 Button_ghost__Ywhj1`;

            exportButton.type = 'button';
            exportButton.title = `Export ${selectedCount} selected chat${selectedCount > 1 ? 's' : ''}`;

            // Create button content using DOM APIs for security
            const iconContainer = document.createElement('div');
            iconContainer.className = 'flex items-center justify-center';
            iconContainer.style.cssText = 'width: 20px; height: 20px;';

            // SVG can be set via innerHTML since it's static content (no user input)
            iconContainer.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.5 2.5C10.5 2.22386 10.2761 2 10 2C9.72386 2 9.5 2.22386 9.5 2.5V10.2929L7.35355 8.14645C7.15829 7.95118 6.84171 7.95118 6.64645 8.14645C6.45118 8.34171 6.45118 8.65829 6.64645 8.85355L9.64645 11.8536C9.84171 12.0488 10.1583 12.0488 10.3536 11.8536L13.3536 8.85355C13.5488 8.65829 13.5488 8.34171 13.3536 8.14645C13.1583 7.95118 12.8417 7.95118 12.6464 8.14645L10.5 10.2929V2.5Z"/>
          <path d="M3 12.5C3.27614 12.5 3.5 12.7239 3.5 13V15.5C3.5 16.0523 3.94772 16.5 4.5 16.5H15.5C16.0523 16.5 16.5 16.0523 16.5 15.5V13C16.5 12.7239 16.7239 12.5 17 12.5C17.2761 12.5 17.5 12.7239 17.5 13V15.5C17.5 16.6046 16.6046 17.5 15.5 17.5H4.5C3.39543 17.5 2.5 16.6046 2.5 15.5V13C2.5 12.7239 2.72386 12.5 3 12.5Z"/>
        </svg>
      `;

            exportButton.appendChild(iconContainer);

            exportButton.addEventListener('click', (e) => {
                e.stopPropagation();
                showExportFormatPopover(exportButton);
            });

            // Insert after the delete buttons - try multiple insertion points
            let buttonContainer = toolbar.querySelector('.mr-auto.flex.gap-1');

            if (!buttonContainer) {
                // Try to find any flex container in the toolbar
                buttonContainer = toolbar.querySelector('.flex');
            }

            if (!buttonContainer) {
                // If no container found, append directly to toolbar
                buttonContainer = toolbar;
            }

            // Check if the button is already added
            if (!document.getElementById('bulk-export-button')) {
                buttonContainer.appendChild(exportButton);
                exportButtonAdded = true;
                console.log('[Bulk Export] Button added successfully to:', buttonContainer.className || 'toolbar');
            }
        } else if (existingButton && selectedCount > 0) {
            // Update tooltip if button exists and selection changed
            existingButton.title = `Export ${selectedCount} selected chat${selectedCount > 1 ? 's' : ''}`;
        }
    }

    // Initialize
    function init() {
        console.log('[Bulk Export] Initializing...');
        console.log('[Bulk Export] Current URL:', window.location.href);

        // Initial attempt to add button
        addExportButton();

        // Monitor for checkbox changes and DOM updates
        const observer = new MutationObserver(() => {
            // Always check if we should add/remove button based on selection
            addExportButton();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['checked']
        });

        // Also listen for change events on checkboxes
        document.addEventListener('change', (e) => {
            if (e.target && e.target.type === 'checkbox') {
                console.log('[Bulk Export] Checkbox changed, updating button...');
                // Small delay to let the DOM update
                setTimeout(() => {
                    addExportButton();
                }, 10);
            }
        });

        // Also try to add button after a delay in case the page loads slowly
        setTimeout(() => {
            console.log('[Bulk Export] Delayed button check...');
            addExportButton();
        }, 2000);
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();