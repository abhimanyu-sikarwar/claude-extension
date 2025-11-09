// SPDX-License-Identifier: Apache-2.0
// Styled HTML generator with Prism.js support for Claude chat exports

(function (global) {
    /**
     * Enhanced markdown to HTML converter with better formatting
     * @param {string} markdown - Markdown text
     * @returns {string} HTML string
     */
    function convertMarkdownToStyledHTML(markdown) {
        if (!markdown) return '';

        // Normalize line endings
        markdown = markdown.replace(/\r\n/g, '\n');

        // Preserve code blocks first
        const codeBlocks = [];
        let html = markdown.replace(/```(\w+)?\n([\s\S]*?)```/g, function(_, lang, code) {
            const placeholder = `___CODEBLOCK_${codeBlocks.length}___`;
            const language = lang || 'plaintext';
            codeBlocks.push(`<pre><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>`);
            return placeholder;
        });

        // Preserve inline code
        const inlineCode = [];
        html = html.replace(/`([^`]+)`/g, function(_, code) {
            const placeholder = `___INLINE_${inlineCode.length}___`;
            inlineCode.push(`<code>${escapeHtml(code)}</code>`);
            return placeholder;
        });

        // Headers (process in order from h6 to h1) - handle optional leading spaces
        html = html.replace(/^\s*###### (.*?)$/gm, '<h6>$1</h6>');
        html = html.replace(/^\s*##### (.*?)$/gm, '<h5>$1</h5>');
        html = html.replace(/^\s*#### (.*?)$/gm, '<h4>$1</h4>');
        html = html.replace(/^\s*### (.*?)$/gm, '<h3>$1</h3>');
        html = html.replace(/^\s*## (.*?)$/gm, '<h2>$1</h2>');
        html = html.replace(/^\s*# (.*?)$/gm, '<h1>$1</h1>');


        // Horizontal rules
        html = html.replace(/^---+$/gm, '<hr>');

        // Blockquotes
        html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');

        // Tables - Enhanced processing
        html = processTablesEnhanced(html);

        // Lists - Enhanced processing
        html = processListsEnhanced(html);

        // Process paragraphs
        html = processParagraphs(html);

        // Handle special patterns for Vignettes and Answers
        html = html.replace(/<p><strong>(Vignette \d+:)<\/strong>\s*/g, '<p><strong>$1</strong> ');
        html = html.replace(/<br><strong>(Answer:)<\/strong>\s*/g, '<br><strong>$1</strong> ');

        // Restore code blocks
        codeBlocks.forEach((block, i) => {
            html = html.replace(`___CODEBLOCK_${i}___`, block);
        });

        // Restore inline code
        inlineCode.forEach((code, i) => {
            html = html.replace(`___INLINE_${i}___`, code);
        });


        // Process bold labels with colons BEFORE processing lists
        // This ensures "**Dysplasia Distribution:**" becomes "<strong>Dysplasia Distribution:</strong>"
        html = html.replace(/\*\*([^*]+:)\*\*/g, '<strong>$1</strong>');

        // Process remaining bold and italic markdown
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>'); // Bold + Italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
        // Skip processing single asterisks that might be list markers
        html = html.replace(/(?<!^|\n)\*([^*\n]+)\*/g, '<em>$1</em>'); // Italic (not at line start)

        return html;
    }

    /**
     * Process tables with better structure
     */
    function processTablesEnhanced(html) {
        const lines = html.split('\n');
        const result = [];
        let inTable = false;
        let tableLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Check if line is a table row
            if (line.startsWith('|') && line.endsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    tableLines = [];
                }
                tableLines.push(line);
            } else if (inTable) {
                // Process the collected table
                if (tableLines.length > 1) {
                    result.push(createHTMLTable(tableLines));
                }
                inTable = false;
                tableLines = [];
                result.push(line);
            } else {
                result.push(line);
            }
        }

        // Handle table at end of content
        if (inTable && tableLines.length > 1) {
            result.push(createHTMLTable(tableLines));
        }

        return result.join('\n');
    }

    /**
     * Create HTML table from markdown table lines
     */
    function createHTMLTable(tableLines) {
        let html = '<table>\n';

        // Process header (first line)
        const headerCells = tableLines[0].split('|').slice(1, -1).map(cell => cell.trim());
        html += '<thead>\n<tr>\n';
        headerCells.forEach(cell => {
            // Process markdown formatting in header cells
            cell = processInlineMarkdown(cell);
            html += `<th>${cell}</th>\n`;
        });
        html += '</tr>\n</thead>\n';

        // Process body (skip separator line at index 1)
        html += '<tbody>\n';
        for (let i = 2; i < tableLines.length; i++) {
            const cells = tableLines[i].split('|').slice(1, -1).map(cell => cell.trim());
            html += '<tr>\n';
            cells.forEach(cell => {
                // Process markdown formatting in body cells
                cell = processInlineMarkdown(cell);
                html += `<td>${cell}</td>\n`;
            });
            html += '</tr>\n';
        }
        html += '</tbody>\n</table>';

        return html;
    }

    /**
     * Process inline markdown formatting (bold, italic, code) within text
     */
    function processInlineMarkdown(text) {
        // First escape HTML to prevent XSS
        text = escapeHtml(text);

        // Then process markdown formatting
        // Bold + Italic
        text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        // Bold
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

        return text;
    }

    /**
     * Process lists with better structure
     */
    function processListsEnhanced(html) {
        const lines = html.split('\n');
        const result = [];
        let inUnorderedList = false;
        let inOrderedList = false;
        let listItems = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Check for unordered list items
            if (line.match(/^[\*\-\+] (.+)$/)) {
                if (inOrderedList) {
                    result.push('<ol>\n' + listItems.join('\n') + '\n</ol>');
                    inOrderedList = false;
                    listItems = [];
                }
                if (!inUnorderedList) {
                    inUnorderedList = true;
                }
                line = line.replace(/^[\*\-\+] (.+)$/, '<li>$1</li>');
                // Extract list item content and process inline markdown
                // const itemContent = line.replace(/^[\*\-\+] (.+)$/, '$1');
                // line = '<li>' + processInlineMarkdown(itemContent) + '</li>';
                listItems.push(line);
            }
            // Check for ordered list items
            else if (line.match(/^\d+\. (.+)$/)) {
                if (inUnorderedList) {
                    result.push('<ul>\n' + listItems.join('\n') + '\n</ul>');
                    inUnorderedList = false;
                    listItems = [];
                }
                if (!inOrderedList) {
                    inOrderedList = true;
                }
                line = line.replace(/^\d+\. (.+)$/, '<li>$1</li>');
                // // Extract list item content and process inline markdown
                // const itemContent = line.replace(/^\d+\. (.+)$/, '$1');
                // line = '<li>' + processInlineMarkdown(itemContent) + '</li>';
                listItems.push(line);
            }
            // End of list
            else {
                if (inUnorderedList) {
                    result.push('<ul>\n' + listItems.join('\n') + '\n</ul>');
                    inUnorderedList = false;
                    listItems = [];
                } else if (inOrderedList) {
                    result.push('<ol>\n' + listItems.join('\n') + '\n</ol>');
                    inOrderedList = false;
                    listItems = [];
                }
                result.push(line);
            }
        }

        // Handle list at end of content
        if (inUnorderedList) {
            result.push('<ul>\n' + listItems.join('\n') + '\n</ul>');
        } else if (inOrderedList) {
            result.push('<ol>\n' + listItems.join('\n') + '\n</ol>');
        }

        return result.join('\n');
    }

    /**
     * Process paragraphs
     */
    function processParagraphs(html) {
        const blocks = html.split('\n\n');
        return blocks.map(block => {
            block = block.trim();
            // Skip blocks that are already HTML elements or placeholders
            if (block &&
                !block.startsWith('<') &&
                !block.startsWith('___') &&
                !block.includes('<ul>') &&
                !block.includes('<ol>') &&
                !block.includes('<table>')) {

                // Split by newlines to check for mixed content
                const lines = block.split('\n');
                const processedLines = [];

                for (let line of lines) {
                    // Check if line contains HTML tags that shouldn't be in a paragraph
                    if (line.includes('<ul>') || line.includes('<ol>') ||
                        line.includes('<li>') || line.includes('</ul>') ||
                        line.includes('</ol>') || line.includes('</li>')) {
                        // This is list HTML, don't wrap it
                        processedLines.push(line);
                    } else if (line.trim()) {
                        // Regular text, process inline markdown
                        processedLines.push(processInlineMarkdown(line));
                    }
                }

                // Only wrap in paragraph if no HTML list elements found
                const joined = processedLines.join('<br>');
                if (!joined.includes('<ul>') && !joined.includes('<ol>') &&
                    !joined.includes('<li>')) {
                    return '<p>' + joined + '</p>';
                }
                return joined;
            }
            return block;
        }).join('\n\n');
    }

    /**
     * Escape HTML characters
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
     * Generate complete styled HTML document
     */
    function generateStyledHTML(markdown, title = 'Document') {
        const content = convertMarkdownToStyledHTML(markdown);

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>${escapeHtml(title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet">
    <style>
        /* Default styles */
        pre {
            background: #2d2d2d;
            border-radius: 4px;
            margin: 0.5em 0;
            padding: 1em;
            overflow-x: auto;
        }

        pre code {
            color: #ccc;
            background: transparent;
            font-size: 0.9em;
            line-height: 1.5;
        }

        code {
            font-family: 'Roboto Mono', 'Fira Code', Consolas, Monaco, monospace;
        }

        /* Custom CSS */
        body {
            font-family: Arial, 'Times New Roman', serif;
            line-height: 1.6;
            padding: 20px;
            margin: 0 auto;
            max-width: 1200px;
            color: #333;
        }

        :not(pre)>code {
            background: #f0f0f0;
            padding: 2px 4px;
            border-radius: 3px;
            color: #e83e8c;
            font-size: 0.9em;
        }

        img {
            max-width: 100%;
            height: auto;
        }

        table {
            font-family: Arial, 'Times New Roman', serif;
            border-collapse: collapse;
            width: 100%;
            margin: 1.5em 0;
            font-size: 0.95em;
        }

        th, td {
            font-family: Arial, 'Times New Roman', serif;
            border: 1px solid #ddd;
            padding: 10px 12px;
            text-align: left;
        }

        th {
            background-color: #f4f4f4;
            font-weight: bold;
        }

        tbody tr:hover {
            background-color: #f9f9f9;
        }

        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 1em;
            margin-left: 0;
            color: #666;
            font-style: italic;
        }

        h1 {
            font-family: Arial, 'Times New Roman', serif;
            font-size: 1.6em;
            color: #000;
            border-bottom: 2px solid #eee;
            padding-bottom: 0.5rem;
            margin: 1.5rem 0;
        }

        h2 {
            font-family: Arial, 'Times New Roman', serif;
            font-size: 1.3em;
            color: #000;
            margin: 1.5rem 0;
        }

        h3 {
            font-family: Arial, 'Times New Roman', serif;
            font-size: 1em;
            color: #000;
            margin: 1.2rem 0;
        }

        h4 {
            font-family: Arial, 'Times New Roman', serif;
            font-size: 0.8em;
            color: #546e7a;
            margin: 1rem 0;
        }

        ul, ol {
            margin: 1em 0;
            padding-left: 2em;
        }

        li {
            margin: 0.5em 0;
        }

        p {
            margin: 1em 0;
        }

        strong {
            font-weight: 600;
            color: #000;
        }

        em {
            font-style: italic;
        }

        hr {
            border: none;
            border-top: 2px solid #eee;
            margin: 2em 0;
        }

        /* Print styles for better PDF output */
        @media print {
            @page {
                size: A4;
                /* Remove default headers and footers */
                @top-left {
                    content: none;
                }
                @top-center {
                    content: none;
                }
                @top-right {
                    content: none;
                }
                @bottom-left {
                    content: none;
                }
                @bottom-center {
                    content: none;
                }
                @bottom-right {
                    content: none;
                }
            }

            /* Additional rules to hide browser-added headers/footers */

            body {
                padding: 0;
                font-size: 11pt;
                font-family: Arial, 'Times New Roman', serif;
                line-height: 1.5;
                color: #000;
                max-width: none;
                /* Ensure content starts at top of page */
                margin: 0;
            }

            /* Ensure headers don't break from content */
            h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid;
                font-family: Arial, 'Times New Roman', serif;
            }

            /* Better table handling for print */
            table {
                page-break-inside: auto;
                width: 100%;
                font-size: 10pt;
            }

            thead {
                display: table-header-group;
            }

            tr {
                page-break-inside: avoid;
            }

            td, th {
                padding: 6pt 8pt;
            }

            /* Keep lists together */
            ul, ol {
                page-break-inside: avoid;
            }

            li {
                page-break-inside: avoid;
            }

            /* Better code block printing */
            pre {
                page-break-inside: auto;
                border: 1pt solid #ddd;
                padding: 8pt;
                background: #f5f5f5 !important;
            }

            pre code {
                background: transparent !important;
                color: #000 !important;
            }

            /* Hide unnecessary elements */
            .no-print {
                display: none !important;
            }

            /* Ensure colors print */
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }

            /* Better link handling */
            a {
                color: #000;
                text-decoration: none;
            }

            /* Ensure blockquotes are visible */
            blockquote {
                border-left: 3pt solid #666;
                padding-left: 10pt;
                margin-left: 0;
            }

            /* Better spacing */
            p {
                margin: 8pt 0;
            }

            /* Vignettes and answers formatting */
            strong {
                font-weight: bold;
                color: #000;
            }
        }
        @media print {
            @page {
                size: auto; /* auto or specific size like A4 */
                margin:  10mm;
                margin-top: 0pt; /* Removes default browser margins */
                margin-bottom: 8pt; /* Removes default browser margins */
            }

            /* Optionally, hide specific elements if they are part of your HTML structure */
            header, footer {
                display: none !important;
            }

            /* Adjust body padding if needed after removing margins */
            body {
                padding-top: 0cm !important;
                padding-bottom: 0cm !important;
            }
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-sql.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-go.min.js"></script>
</head>
<body>
    ${content}
    <script>
        // Initialize Prism.js syntax highlighting
        if (typeof Prism !== 'undefined') {
            Prism.highlightAll();
        }

        // Help ensure clean printing without headers/footers
        window.addEventListener('beforeprint', function() {
            // Try to set print margins and remove headers/footers
            // Note: Most browsers don't allow this for security reasons,
            // but it's worth trying
            if (window.matchMedia) {
                const mediaQueryList = window.matchMedia('print');
                mediaQueryList.addListener(function(mql) {
                    if (mql.matches) {
                        console.log('Printing - headers and footers should be hidden');
                    }
                });
            }
        });

        // Auto-suggest print settings when loaded from blob URL
        if (window.location.protocol === 'blob:') {
            // This is opened for printing
            document.addEventListener('DOMContentLoaded', function() {
                // Add a note for the user
                console.log('For best results: In print dialog, disable "Headers and footers" option');
            });
        }
    </script>
</body>
</html>`;

        return html;
    }

    /**
     * Download HTML file
     */
    function downloadStyledHTML(markdown, filename = 'document') {
        const html = generateStyledHTML(markdown, filename);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename.endsWith('.html') ? filename : filename + '.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    // Export functions
    global.ClaudeStyledHTMLGenerator = {
        convertMarkdownToStyledHTML,
        generateStyledHTML,
        downloadStyledHTML,
        escapeHtml
    };
})(window);