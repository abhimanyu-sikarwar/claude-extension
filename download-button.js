// SPDX-License-Identifier: Apache-2.0
// Add download button with export options to Claude UI

(function () {
    let isButtonAdded = false;
    let popoverOpen = false;

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

    function createPopover(buttonElement) {
        // Remove existing popover if any
        const existingPopover = document.getElementById('claude-md-export-popover');
        if (existingPopover) {
            existingPopover.remove();
            popoverOpen = false;
            return;
        }

        // Get button position
        const rect = buttonElement.getBoundingClientRect();

        // Create popover wrapper
        const wrapper = document.createElement('div');
        wrapper.id = 'claude-md-export-popover';
        wrapper.setAttribute('data-radix-popper-content-wrapper', '');
        wrapper.setAttribute('dir', 'ltr');
        wrapper.style.cssText = `
      position: fixed;
      left: 0px;
      top: 0px;
      transform: translate(${rect.right - 220}px, ${rect.bottom + 4}px);
      min-width: max-content;
      z-index: 50;
      will-change: transform;
    `;

        // Create popover content
        const popover = document.createElement('div');
        popover.setAttribute('data-side', 'bottom');
        popover.setAttribute('data-align', 'end');
        popover.setAttribute('role', 'menu');
        popover.setAttribute('data-state', 'open');
        popover.className = 'z-dropdown bg-bg-000 border-0.5 border-border-300 backdrop-blur-xl rounded-xl min-w-[14rem] overflow-hidden p-1.5 text-text-300 shadow-diffused shadow-[hsl(var(--always-black)/4%)] overflow-y-auto';
        popover.style.cssText = 'outline: none; pointer-events: auto;';

        popover.innerHTML = `
      <div class="px-2 py-1.5 text-xs font-medium text-text-200 uppercase tracking-wide">Message Type</div>
      
      <button class="export-option w-full py-1.5 px-2 rounded-md cursor-pointer whitespace-nowrap overflow-hidden flex items-center gap-2 hover:bg-bg-200 hover:text-text-000 text-sm transition-colors" data-option="all">
        <div class="w-4 h-4 rounded-full border-2 border-border-300 flex items-center justify-center">
          <div class="w-2 h-2 rounded-full bg-accent-main hidden checked" style="background: hsl(var(--accent-secondary-100));"></div>
        </div>
        <span>All messages</span>
      </button>
      
      <button class="export-option w-full py-1.5 px-2 rounded-md cursor-pointer whitespace-nowrap overflow-hidden flex items-center gap-2 hover:bg-bg-200 hover:text-text-000 text-sm transition-colors" data-option="assistant">
        <div class="w-4 h-4 rounded-full border-2 border-border-300 flex items-center justify-center">
          <div class="w-2 h-2 rounded-full bg-accent-main hidden checked" style="background: hsl(var(--accent-secondary-100));"></div>
        </div>
        <span>Assistant only</span>
      </button>

      <div class="h-px bg-border-300 my-1.5"></div>

      <button class="thinking-toggle w-full py-1.5 px-2 rounded-md cursor-pointer whitespace-nowrap overflow-hidden flex items-center gap-2 hover:bg-bg-200 hover:text-text-000 text-sm transition-colors" data-thinking="true">
        <div class="w-4 h-4 rounded border-2 border-border-300 flex items-center justify-center">
          <svg class="w-3 h-3 text-accent-main" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span>Include thinking</span>
      </button>

      <div class="h-px bg-border-300 my-1.5"></div>

      <button class="download-button w-full py-1.5 px-2 rounded-md cursor-pointer whitespace-nowrap overflow-hidden text-center hover:bg-accent-main hover:text-text-000 text-sm font-medium bg-bg-200 text-text-100 transition-colors">
        Download MD
      </button>
    `;

        wrapper.appendChild(popover);
        document.body.appendChild(wrapper);
        popoverOpen = true;

        // Load saved preferences
        chrome.storage.local.get(['exportPreferences'], (result) => {
            const prefs = result.exportPreferences || { messageType: 'all', includeThinking: true };

            // State management with saved preferences
            let selectedOption = prefs.messageType;
            let includeThinking = prefs.includeThinking;

            // Handle option selection
            const optionButtons = popover.querySelectorAll('.export-option');

            // Set initial state based on saved preferences
            optionButtons.forEach(btn => {
                const option = btn.getAttribute('data-option');
                if (option === selectedOption) {
                    btn.querySelector('.checked').classList.remove('hidden');
                }
            });

            optionButtons.forEach(btn => {
                const option = btn.getAttribute('data-option');

                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Update selection
                    selectedOption = option;

                    // Update UI - hide all checks first
                    optionButtons.forEach(b => {
                        b.querySelector('.checked').classList.add('hidden');
                    });
                    // Show check on selected option
                    btn.querySelector('.checked').classList.remove('hidden');

                    // Save preference
                    chrome.storage.local.set({
                        exportPreferences: { messageType: selectedOption, includeThinking }
                    });
                });
            });

            // Handle thinking toggle
            const thinkingToggle = popover.querySelector('.thinking-toggle');
            const thinkingCheck = thinkingToggle.querySelector('svg');

            // Set initial state based on saved preference
            if (includeThinking) {
                thinkingCheck.style.display = 'block';
            } else {
                thinkingCheck.style.display = 'none';
            }

            thinkingToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                includeThinking = !includeThinking;
                if (includeThinking) {
                    thinkingCheck.style.display = 'block';
                } else {
                    thinkingCheck.style.display = 'none';
                }

                // Save preference
                chrome.storage.local.set({
                    exportPreferences: { messageType: selectedOption, includeThinking }
                });
            });

            // Handle download
            const downloadBtn = popover.querySelector('.download-button');
            downloadBtn.addEventListener('click', async () => {
                wrapper.remove();
                popoverOpen = false;
                await handleDownload(selectedOption, includeThinking);
            });
        });

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closePopover(e) {
                if (!wrapper.contains(e.target) && e.target !== buttonElement) {
                    wrapper.remove();
                    popoverOpen = false;
                    document.removeEventListener('click', closePopover);
                }
            });
        }, 0);
    }

    async function handleDownload(messageType = 'all', includeThinking = true) {
        try {
            const data = await chrome.storage.local.get('lastIntercepted');

            if (!data.lastIntercepted) {
                alert('No conversation loaded. Please reload the page to capture the conversation.');
                return;
            }

            const markdown = buildMarkdown(data.lastIntercepted.content, messageType, includeThinking);
            const suffix = messageType === 'assistant' ? '_assistant_only' : '';
            const filename = `${data.lastIntercepted.content.name || 'claude_chat'}${suffix}.md`;

            downloadMarkdown(markdown, filename);
        } catch (error) {
            console.error('Error downloading markdown:', error);
            alert('Failed to download markdown. Please try again.');
        }
    }

    function addDownloadButton() {
        const chatActions = document.querySelector('[data-testid="chat-actions"]');

        if (!chatActions || isButtonAdded) {
            return;
        }

        const downloadButton = document.createElement('button');
        downloadButton.className = `inline-flex
    items-center
    justify-center
    relative
    shrink-0
    can-focus
    select-none
    disabled:pointer-events-none
    disabled:opacity-50
    disabled:shadow-none
    disabled:drop-shadow-none font-base-bold
            border-0.5
            relative
            overflow-hidden
            transition
            duration-100
            backface-hidden h-8 rounded-md px-3 min-w-[4rem] active:scale-[0.985] whitespace-nowrap !text-xs Button_secondary__x7x_y`;

        downloadButton.type = 'button';
        downloadButton.textContent = 'Download MD';
        downloadButton.style.marginRight = '0.5rem';

        downloadButton.addEventListener('click', (e) => {
            e.stopPropagation();
            createPopover(downloadButton);
        });

        const shareButton = chatActions.querySelector('button');
        if (shareButton) {
            chatActions.insertBefore(downloadButton, shareButton);
            isButtonAdded = true;
            console.log('Download button added successfully');
        }
    }

    function init() {
        addDownloadButton();

        if (!isButtonAdded) {
            const observer = new MutationObserver(() => {
                if (!isButtonAdded) {
                    addDownloadButton();
                } else {
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Enhanced markdown builder with filtering options
    function buildMarkdown(parsed, messageType = 'all', includeThinking = true) {
        if (!parsed.chat_messages) {
            return "";
        }
        const bits = [];
        bits.push(`# ${parsed.name}`);

        parsed.chat_messages.forEach((message) => {
            // Filter by message type
            if (messageType === 'assistant' && message.sender !== 'assistant') {
                return; // Skip human messages
            }

            if (messageType === 'all') {
                bits.push(
                    `**${message.sender}** (${new Date(message.created_at).toLocaleString(
                        "en-US",
                        {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    )})`
                );
                // return; // Skip human messages
            }
            

            message.content.forEach((content) => {
                // Handle thinking blocks
                if (content.type === "thinking") {
                    if (includeThinking && content.thinking) {
                        bits.push(`**Thinking:**\n\n${content.thinking}`);
                    }
                    return; // Skip to next content item
                }

                if (content.type == "tool_use") {
                    if (content.name == "repl") {
                        bits.push(
                            "**Analysis**\n```" +
                            `javascript\n${content.input.code.trim()}` +
                            "\n```"
                        );
                    } else if (content.name == "artifacts") {
                        let lang =
                            content.input.language || typeLookup[content.input.type] || "";
                        const input = content.input;
                        if (input.command == "create" || input.command == "rewrite") {
                            bits.push(
                                `#### ${input.command} ${content.input.title || "Untitled"
                                }\n\n\`\`\`${lang}\n${content.input.content}\n\`\`\``
                            );
                        } else if (input.command == "update") {
                            bits.push(
                                `#### update ${content.input.id}\n\nFind this:\n\`\`\`\n${content.input.old_str}\n\`\`\`\nReplace with this:\n\`\`\`\n${content.input.new_str}\n\`\`\``
                            );
                        }
                    }
                } else if (content.type == "tool_result") {
                    if (content.name != "artifacts") {
                        try {
                            let logs = JSON.parse(content.content[0].text).logs;
                            bits.push(
                                `**Result**\n<pre style="white-space: pre-wrap">\n${logs.join(
                                    "\n"
                                )}\n</pre>`
                            );
                        } catch (e) {
                            console.log('Error parsing tool result:', e);
                        }
                    }
                } else if (content.type === "text") {
                    // Handle text content
                    if (content.text) {
                        bits.push(
                            replaceArtifactTags(
                                content.text.replace(/<\/antArtifact>/g, "\n```")
                            )
                        );
                    }
                } else {
                    // Handle other content types
                    if (content.text) {
                        bits.push(
                            replaceArtifactTags(
                                content.text.replace(/<\/antArtifact>/g, "\n```")
                            )
                        );
                    } else {
                        bits.push(JSON.stringify(content));
                    }
                }
            });

            const backtick = String.fromCharCode(96);
            if (message.attachments && message.attachments.length > 0) {
                message.attachments.forEach((attachment) => {
                    bits.push(`<details><summary>${attachment.file_name}</summary>`);
                    bits.push("\n\n");
                    bits.push(backtick.repeat(5));
                    bits.push(attachment.extracted_content);
                    bits.push(backtick.repeat(5));
                    bits.push("</details>");
                });
            }
        });

        return bits.join("\n\n");
    }

    function replaceArtifactTags(input) {
        const regex = /<antArtifact[^>]*>/g;

        function extractAttributes(tag) {
            const attributes = {};
            const attrRegex = /(\w+)=("([^"]*)"|'([^']*)')/g;
            let match;
            while ((match = attrRegex.exec(tag)) !== null) {
                const key = match[1];
                const value = match[3] || match[4];
                attributes[key] = value;
            }
            return attributes;
        }

        return input.replace(regex, (match) => {
            const attributes = extractAttributes(match);
            const lang = attributes.language || typeLookup[attributes.type] || "";
            return `### ${attributes.title || "Untitled"}\n\n\`\`\`${lang}`;
        });
    }

    const typeLookup = {
        "application/vnd.ant.react": "jsx",
        "text/html": "html"
    };
})();