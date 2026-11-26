export const MAX_IMAGES_PER_DOCUMENT = 5;

const FENCED_CODE_BLOCK_RE = /```[\s\S]*?```|~~~[\s\S]*?~~~/g;
const INLINE_CODE_RE = /`[^`\n]+`/g;
const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\([^)\s]+(?:\s+["'][^"']*["'])?\)/g;
const HTML_IMAGE_RE = /<img\b[^>]*\bsrc\s*=\s*["'][^"']+["'][^>]*>/gi;

export function countMarkdownImages(markdown: string): number {
  if (!markdown) return 0;
  const withoutCode = markdown
    .replace(FENCED_CODE_BLOCK_RE, "")
    .replace(INLINE_CODE_RE, "");

  const mdMatches = withoutCode.match(MARKDOWN_IMAGE_RE) ?? [];
  const htmlMatches = withoutCode.match(HTML_IMAGE_RE) ?? [];
  return mdMatches.length + htmlMatches.length;
}

export function buildOptimizedImageKitUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.searchParams.has("tr")) {
      parsed.searchParams.set("tr", "f-auto,q-80,w-1440,c-at_max");
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}
