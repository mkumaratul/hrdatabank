import sanitizeHtml from "sanitize-html";

export function sanitizeJobDescriptionHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "strong", "em", "ul", "ol", "li", "h1", "h2", "h3", "br"],
    allowedAttributes: {},
  });
}
