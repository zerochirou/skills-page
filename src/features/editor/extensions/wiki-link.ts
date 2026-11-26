import { PluginKey } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import {
  mergeAttributes,
  Node,
  ReactNodeViewRenderer,
  ReactRenderer,
} from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import { WikiLinkNodeView } from "../components/wiki-link-node-view";
import {
  WikiLinkSuggestionList,
  type WikiLinkSuggestionHandle,
} from "../components/wiki-link-suggestion";
import type { WikiLinkItem, WikiLinkTargetType } from "../types";

export interface WikiLinkOptions {
  getItems: (query: string) => WikiLinkItem[];
  onWikiLinkClick?: (target: {
    targetType: WikiLinkTargetType;
    targetId: number;
    label: string;
  }) => void;
  HTMLAttributes: Record<string, string>;
}

const WIKI_LINK_REGEX = /^\[\[(skill|sub_skill|unit):(\d+)\|([^\]]+)\]\]/;
const WIKI_LINK_FALLBACK_REGEX = /^\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/;

export const WikiLinkAtPluginKey = new PluginKey("wikiLinkAtSuggestion");
export const WikiLinkPluginKey = new PluginKey("wikiLinkSuggestion");

function createWikiLinkSuggestionConfig({
  editor,
  pluginKey,
  char,
  nodeName,
  getItems,
}: {
  editor: Editor;
  pluginKey: PluginKey;
  char: string;
  nodeName: string;
  getItems: (query: string) => WikiLinkItem[];
}) {
  return Suggestion<WikiLinkItem>({
    editor,
    pluginKey,
    char,
    allowSpaces: true,
    allowedPrefixes: [" ", "\n"],
    items: ({ query }) => {
      const normalized = query.trim().toLowerCase();
      const all = getItems(normalized);
      if (!normalized) {
        return all.slice(0, 8);
      }
      return all
        .filter(
          (item) =>
            item.label.toLowerCase().includes(normalized) ||
            item.subtitle?.toLowerCase().includes(normalized)
        )
        .slice(0, 8);
    },
    command: ({ editor: activeEditor, range, props }) => {
      activeEditor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent([
          {
            type: nodeName,
            attrs: {
              targetType: props.targetType,
              targetId: props.targetId,
              label: props.label,
            },
          },
          { type: "text", text: " " },
        ])
        .run();
    },
    render: () => {
      let component: ReactRenderer<
        WikiLinkSuggestionHandle,
        { items: WikiLinkItem[]; command: (item: WikiLinkItem) => void }
      > | null = null;
      let container: HTMLDivElement | null = null;

      const updatePosition = (clientRect?: (() => DOMRect | null) | null) => {
        if (!container || !clientRect) return;
        const rect = clientRect();
        if (!rect) return;
        container.style.position = "fixed";
        container.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`;
        container.style.top = `${rect.bottom + 6}px`;
        container.style.zIndex = "50";
      };

      return {
        onStart(props) {
          container = document.createElement("div");
          document.body.appendChild(container);
          const renderer = new ReactRenderer(WikiLinkSuggestionList, {
            props: {
              items: props.items,
              command: props.command,
            },
            editor: props.editor,
          });
          component = renderer;
          container.appendChild(renderer.element);
          updatePosition(props.clientRect);
        },
        onUpdate(props) {
          component?.updateProps({
            items: props.items,
            command: props.command,
          });
          updatePosition(props.clientRect);
        },
        onKeyDown(props) {
          if (props.event.key === "Escape") {
            container?.remove();
            container = null;
            component?.destroy();
            component = null;
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },
        onExit() {
          container?.remove();
          container = null;
          component?.destroy();
          component = null;
        },
      };
    },
  });
}

export const WikiLink = Node.create<WikiLinkOptions>({
  name: "wikiLink",
  group: "inline",
  inline: true,
  selectable: true,
  atom: true,

  addOptions() {
    return {
      getItems: () => [],
      onWikiLinkClick: undefined,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      targetType: {
        default: "unit" as WikiLinkTargetType,
        parseHTML: (el) =>
          (el.getAttribute("data-target-type") as WikiLinkTargetType) ?? "unit",
        renderHTML: (attrs) => ({
          "data-target-type": attrs.targetType,
        }),
      },
      targetId: {
        default: 0,
        parseHTML: (el) => Number(el.getAttribute("data-target-id") ?? 0),
        renderHTML: (attrs) => ({
          "data-target-id": String(attrs.targetId),
        }),
      },
      label: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-label") ?? el.textContent ?? "",
        renderHTML: (attrs) => ({
          "data-label": attrs.label,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-wiki-link]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        {
          "data-wiki-link": "",
          class:
            "inline-flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground",
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      `[[${node.attrs.label}]]`,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WikiLinkNodeView);
  },

  renderText({ node }) {
    return `[[${node.attrs.targetType}:${node.attrs.targetId}|${node.attrs.label}]]`;
  },

  markdownTokenizer: {
    name: "wikiLink",
    level: "inline",
    start: (src: string) => src.indexOf("[["),
    tokenize(src: string) {
      const typedMatch = WIKI_LINK_REGEX.exec(src);
      if (typedMatch) {
        const [raw, targetType, targetId, label] = typedMatch;
        return {
          type: "wikiLink",
          raw,
          targetType,
          targetId: Number(targetId),
          label,
        };
      }

      const fallbackMatch = WIKI_LINK_FALLBACK_REGEX.exec(src);
      if (fallbackMatch) {
        const [raw, target, label] = fallbackMatch;
        return {
          type: "wikiLink",
          raw,
          targetType: "unit",
          targetId: 0,
          label: label ?? target,
        };
      }

      return undefined;
    },
  },

  parseMarkdown(token, helpers) {
    return helpers.createNode("wikiLink", {
      targetType: (token.targetType as WikiLinkTargetType) ?? "unit",
      targetId: Number(token.targetId ?? 0),
      label: String(token.label ?? ""),
    });
  },

  renderMarkdown(node) {
    const targetType = String(node.attrs?.targetType ?? "unit");
    const targetId = Number(node.attrs?.targetId ?? 0);
    const label = String(node.attrs?.label ?? "");
    if (targetId > 0) {
      return `[[${targetType}:${targetId}|${label}]]`;
    }
    return `[[${label}]]`;
  },

  addProseMirrorPlugins() {
    const getItems = this.options.getItems;

    return [
      createWikiLinkSuggestionConfig({
        editor: this.editor,
        pluginKey: WikiLinkAtPluginKey,
        char: "@",
        nodeName: this.name,
        getItems,
      }),
      createWikiLinkSuggestionConfig({
        editor: this.editor,
        pluginKey: WikiLinkPluginKey,
        char: "[[",
        nodeName: this.name,
        getItems,
      }),
    ];
  },
});
