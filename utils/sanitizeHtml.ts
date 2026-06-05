
// utils/sanitizeHtml.ts

/**
 * Whitelist-based HTML sanitizer (same strategy as MarkdownRenderer).
 * Everything is escaped first, then ONLY bare formatting tags (no attributes)
 * are re-enabled. Scripts, event handlers, iframes, styles and attribute-based
 * payloads can never survive this.
 */

const ALLOWED_TAGS = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'em', 'b', 'i', 'u',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre'
];

export const sanitizeHtml = (html: string): string => {
    if (!html) return '';
    let safe = html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    for (const tag of ALLOWED_TAGS) {
        safe = safe
            .replace(new RegExp('&lt;' + tag + '&gt;', 'gi'), '<' + tag + '>')
            .replace(new RegExp('&lt;/' + tag + '&gt;', 'gi'), '</' + tag + '>')
            .replace(new RegExp('&lt;' + tag + ' ?/&gt;', 'gi'), '<' + tag + '/>');
    }
    return safe;
};
