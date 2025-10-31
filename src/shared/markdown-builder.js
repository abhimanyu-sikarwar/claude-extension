// SPDX-License-Identifier: Apache-2.0
// Shared markdown builder function for all export features

(function (global) {
    const typeLookup = {
        "application/vnd.ant.react": "jsx",
        "text/html": "html"
    };

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

    /**
     * Build markdown from parsed chat data
     * @param {Object} parsed - Chat conversation data
     * @param {string} messageType - 'all' or 'assistant' 
     * @param {boolean} includeThinking - Whether to include thinking blocks
     * @returns {string} Markdown formatted string
     */
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

    // Export to global scope
    global.ClaudeMarkdownBuilder = {
        buildMarkdown: buildMarkdown,
        typeLookup: typeLookup,
        replaceArtifactTags: replaceArtifactTags
    };

})(window);