import Image from "@tiptap/extension-image";

function parsePositiveInt(raw: unknown): number | null {
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : null;
  }
  if (typeof raw === "string") {
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function unescapeHtmlAttr(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function parseHtmlImgTag(rawTag: string): {
  src: string;
  alt: string | null;
  title: string | null;
  width: number | null;
  height: number | null;
} | null {
  const openMatch = /^<img\b([^>]*?)\/?>(?:\s*(?:\n|$))/i.exec(rawTag);
  if (!openMatch) return null;

  const attrStr = openMatch[1];
  const attrs: Record<string, string> = {};
  const attrRe = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let match: RegExpExecArray | null;
  while ((match = attrRe.exec(attrStr)) !== null) {
    const key = match[1].toLowerCase();
    const val = match[2] ?? match[3] ?? match[4] ?? "";
    attrs[key] = unescapeHtmlAttr(val);
  }

  const src = attrs.src?.trim();
  if (!src || /^data:/i.test(src)) return null;

  return {
    src,
    alt: attrs.alt ?? null,
    title: attrs.title ?? null,
    width: parsePositiveInt(attrs.width),
    height: parsePositiveInt(attrs.height),
  };
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) =>
          parsePositiveInt(
            element.getAttribute("width") ?? element.style.width
          ),
        renderHTML: (attributes) => {
          const width = parsePositiveInt(attributes.width);
          if (!width) return {};
          return {
            width: String(width),
            style: `width: ${width}px; max-width: 100%; height: auto;`,
          };
        },
      },
      height: {
        default: null,
        parseHTML: (element) =>
          parsePositiveInt(
            element.getAttribute("height") ?? element.style.height
          ),
        renderHTML: () => ({}),
      },
    };
  },

  renderMarkdown: (node) => {
    const src = String(node.attrs?.src ?? "");
    const alt = String(node.attrs?.alt ?? "");
    const title = String(node.attrs?.title ?? "");
    const width = parsePositiveInt(node.attrs?.width);

    if (width) {
      const attrs = [
        `src="${escapeHtmlAttr(src)}"`,
        `alt="${escapeHtmlAttr(alt)}"`,
        ...(title ? [`title="${escapeHtmlAttr(title)}"`] : []),
        `width="${width}"`,
      ];
      return `<img ${attrs.join(" ")} />`;
    }

    return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
  },

  markdownTokenizer: {
    name: "image",
    level: "block",
    start: (src: string) => src.indexOf("<img"),
    tokenize: (src: string) => {
      const match = /^<img\b[^>]*?\/?>(?:\s*(?:\n|$))/i.exec(src);
      if (!match) return;
      const parsed = parseHtmlImgTag(match[0]);
      if (!parsed) return;
      return {
        type: "image",
        raw: match[0],
        href: parsed.src,
        text: parsed.alt ?? "",
        title: parsed.title ?? undefined,
        attrs: parsed,
      };
    },
  },

  parseMarkdown: (token, helpers) => {
    const customAttrs = (
      token as {
        attrs?: {
          src?: string;
          alt?: string | null;
          title?: string | null;
          width?: number | null;
          height?: number | null;
        };
      }
    ).attrs;

    if (customAttrs?.src) {
      return helpers.createNode("image", {
        src: customAttrs.src,
        alt: customAttrs.alt ?? null,
        title: customAttrs.title ?? null,
        width: customAttrs.width ?? null,
        height: customAttrs.height ?? null,
      });
    }

    return helpers.createNode("image", {
      src: token.href,
      title: token.title ?? null,
      alt: token.text ?? null,
    });
  },
});
