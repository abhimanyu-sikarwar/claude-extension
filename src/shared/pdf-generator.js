// SPDX-License-Identifier: Apache-2.0
// PDF generator with custom CSS support for Claude chat exports

(function (global) {
    /**
     * Convert markdown to HTML
     * @param {string} markdown - Markdown text
     * @returns {string} HTML string
     */
    function markdownToHtml(markdown) {
        if (!markdown) return '';
        console.log(markdown.toString(),'markdown');
        markdown = markdown.replace(/\n/g, '\n'); // Normalize line endings
        // Preserve code blocks first
        const codeBlocks = [];
        let html = markdown.replace(/```(\w+)?\n([\s\S]*?)```/g, function(_, lang, code) {
            const placeholder = `___CODEBLOCK_${codeBlocks.length}___`;
            codeBlocks.push('<pre><code class="language-' + (lang || '') + '">' + escapeHtml(code.trim()) + '</code></pre>');
            return placeholder;
        });

        // Preserve inline code
        const inlineCode = [];
        html = html.replace(/`([^`]+)`/g, function(_, code) {
            const placeholder = `___INLINE_${inlineCode.length}___`;
            inlineCode.push('<code>' + escapeHtml(code) + '</code>');
            return placeholder;
        });

        // Headers (h4-h6 first, then h3, h2, h1 to avoid conflicts)
        html = html.replace(/^###### (.*?)$/gm, '<h6>$1</h6>');
        html = html.replace(/^##### (.*?)$/gm, '<h5>$1</h5>');
        html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
        html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

        // // Handle all bold text ending with colon - put on new line
        // // This covers patterns like **Prevalence:**, **Histologic Types:**, **Vignette 1:**, **Answer:**, etc.
        // html = html.replace(/\*\*([^*]+:)\*\*\s*/g, function(_, text) {
        //     // Add a line break after any bold text ending with colon
        //     return '<strong>' + text + '</strong><br>\n';
        // });

        // Bold (must come before italic to handle remaining **text** without colons)
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Horizontal rules
        html = html.replace(/^---+$/gm, '<hr>');

        // Blockquotes
        html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');

        // Handle lists more carefully
        const lines = html.split('\n');
        let inList = false;
        let inOrderedList = false;
        let processedLines = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Check for unordered list items
            if (line.match(/^\* (.+)$/)) {
                if (!inList) {
                    processedLines.push('<ul>');
                    inList = true;
                    inOrderedList = false;
                } else if (inOrderedList) {
                    processedLines.push('</ol>');
                    processedLines.push('<ul>');
                    inOrderedList = false;
                }
                line = line.replace(/^\* (.+)$/, '<li>$1</li>');
            }
            // Check for ordered list items
            else if (line.match(/^\d+\. (.+)$/)) {
                if (!inList) {
                    processedLines.push('<ol>');
                    inList = true;
                    inOrderedList = true;
                } else if (!inOrderedList) {
                    processedLines.push('</ul>');
                    processedLines.push('<ol>');
                    inOrderedList = true;
                }
                line = line.replace(/^\d+\. (.+)$/, '<li>$1</li>');
            }
            // End list if we hit a non-list line
            else if (inList && line.trim() !== '') {
                processedLines.push(inOrderedList ? '</ol>' : '</ul>');
                inList = false;
                inOrderedList = false;
            }

            processedLines.push(line);
        }

        // Close any open lists
        if (inList) {
            processedLines.push(inOrderedList ? '</ol>' : '</ul>');
        }

        html = processedLines.join('\n');

        // Paragraphs (wrap non-HTML content)
        html = html.split('\n\n').map(para => {
            para = para.trim();
            if (para && !para.startsWith('<') && !para.startsWith('___')) {
                return '<p>' + para.replace(/\n/g, '<br>') + '</p>';
            }
            return para;
        }).join('\n\n');

        // Restore code blocks
        codeBlocks.forEach((block, i) => {
            html = html.replace(`___CODEBLOCK_${i}___`, block);
        });

        // Restore inline code
        inlineCode.forEach((code, i) => {
            html = html.replace(`___INLINE_${i}___`, code);
        });

        return html;
    }

    /**
     * Escape HTML characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Load custom CSS file
     * @returns {Promise<string>} CSS content
     */
    async function loadCustomCss() {
        try {
            const cssUrl = chrome.runtime.getURL('styles/download_as_pdf.css');
            const response = await fetch(cssUrl);
            if (response.ok) {
                return await response.text();
            }
        } catch (error) {
            console.error('Error loading custom CSS:', error);
        }
        return '';
    }

    /**
     * Generate PDF from markdown with custom CSS
     * @param {string} markdown - Markdown content
     * @param {string} filename - Filename for the PDF
     * @param {boolean} useCustomCss - Whether to apply custom CSS
     */
    async function generatePdf(markdown, filename, useCustomCss = true) {
        // Convert markdown to HTML
        const htmlContent = markdownToHtml(markdown);

        // Get custom CSS if requested
        let customCss = '';
        if (useCustomCss) {
            customCss = await loadCustomCss();
        }

        // Create full HTML document
        const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename}</title>
    ${useCustomCss ? `<style>${customCss}</style>` : ''}
    <style>
        /* Default styles if custom CSS is not used */
        ${!useCustomCss ? `
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; margin-top: 20px; }
        code {
            background-color: #f4f4f4;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: "Courier New", Courier, monospace;
        }
        pre {
            background-color: #f8f8f8;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        pre code {
            background-color: transparent;
            padding: 0;
        }
        strong { font-weight: 600; }
        ul, ol { margin: 10px 0; padding-left: 30px; }
        li { margin: 5px 0; }
        ` : ''}
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

        // Create a blob URL for the HTML content to avoid cross-origin issues
        const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);

        try {
            // Try to open in new window/tab with the blob URL
            const printWindow = window.open(blobUrl, '_blank');

            if (printWindow) {
                // Give the window time to load, then trigger print
                setTimeout(() => {
                    try {
                        // Try to trigger print (may not work in all browsers)
                        printWindow.print();

                        // Clean up blob URL after a delay
                        setTimeout(() => {
                            URL.revokeObjectURL(blobUrl);
                        }, 10000); // Wait 10 seconds before cleanup
                    } catch (e) {
                        console.log('Could not trigger print automatically:', e);
                        // User will need to manually print
                        URL.revokeObjectURL(blobUrl);
                    }
                }, 1000); // Wait 1 second for content to load
            } else {
                // Fallback: Download as HTML if popup blocked
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename.replace('.md', '.html');
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Clean up
                setTimeout(() => {
                    URL.revokeObjectURL(blobUrl);
                }, 1000);

                alert('Popup blocked. The file has been downloaded. Please open it and print to PDF using your browser\'s print function (Ctrl+P or Cmd+P)');
            }
        } catch (error) {
            console.error('Error opening print window:', error);

            // Final fallback: Just download the HTML
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename.replace('.md', '.html');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
            }, 1000);

            alert('Please open the downloaded HTML file and print it to PDF using your browser\'s print function (Ctrl+P or Cmd+P)');
        }
    }

    // Export functions
    global.ClaudePdfGenerator = {
        markdownToHtml,
        generatePdf,
        loadCustomCss
    };
})(window);