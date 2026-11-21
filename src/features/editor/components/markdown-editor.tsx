"use client";

import { useEffect, useState } from "react";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Color } from "@tiptap/extension-color";
import { Details, DetailsContent, DetailsSummary } from "@tiptap/extension-details";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Mathematics } from "@tiptap/extension-mathematics";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TextStyle } from "@tiptap/extension-text-style";
import Youtube from "@tiptap/extension-youtube";
import { common, createLowlight } from "lowlight";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import "katex/dist/katex.min.css";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/lib/utils";
import { WikiLink } from "../extensions/wiki-link";
import type { WikiLinkItem, WikiLinkTargetType } from "../types";
import { EditorToolbar } from "./editor-toolbar";
import { MermaidNode } from "./mermaid-node";

const lowlight = createLowlight(common);

export interface MarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  wikiLinkItems?: WikiLinkItem[];
  onWikiLinkClick?: (target: {
    targetType: WikiLinkTargetType;
    targetId: number;
    label: string;
  }) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  wikiLinkItems = [],
  onWikiLinkClick,
  placeholder = "Write in Markdown or type [[ to link a skill, sub-skill, or unit...",
  readOnly = false,
  className,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<"wysiwyg" | "markdown">("wysiwyg");

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          HTMLAttributes: {
            class: "text-brand underline underline-offset-4",
          },
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Subscript,
      Superscript,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      FontFamily,
      Details.configure({
        persist: true,
      }),
      DetailsSummary,
      DetailsContent,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
      Markdown,
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Mathematics,
      MermaidNode,
      WikiLink.configure({
        getItems: () => wikiLinkItems,
        onWikiLinkClick,
      }),
    ],
    content: value,
    contentType: "markdown",
    editorProps: {
      attributes: {
        class:
          "tiptap-editor min-h-[280px] px-5 py-4 text-sm leading-relaxed outline-none",
        "data-placeholder": placeholder,
      },
    },
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.getMarkdown());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const wikiExt = editor.extensionManager.extensions.find(
      (ext) => ext.name === "wikiLink"
    );
    if (wikiExt) {
      wikiExt.options.getItems = () => wikiLinkItems;
      wikiExt.options.onWikiLinkClick = onWikiLinkClick;
    }
  }, [editor, onWikiLinkClick, wikiLinkItems]);

  function handleModeChange(nextMode: "wysiwyg" | "markdown") {
    if (nextMode === mode) return;
    if (nextMode === "wysiwyg" && editor) {
      editor.commands.setContent(value, { contentType: "markdown" });
    }
    setMode(nextMode);
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[8px] border border-border bg-card text-card-foreground",
        className
      )}
    >
      {!readOnly ? (
        <EditorToolbar
          editor={editor}
          mode={mode}
          onModeChange={handleModeChange}
        />
      ) : null}

      {mode === "wysiwyg" ? (
        <EditorContent editor={editor} />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          className="min-h-[320px] w-full resize-y bg-transparent px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground outline-none"
        />
      )}
    </div>
  );
}
