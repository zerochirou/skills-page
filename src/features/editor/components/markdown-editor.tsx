"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type MouseEvent,
} from "react";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Color } from "@tiptap/extension-color";
import {
  Details,
  DetailsContent,
  DetailsSummary,
} from "@tiptap/extension-details";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
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
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { WikiLink } from "../extensions/wiki-link";
import {
  compressImageForEditor,
  dataUrlToImageFile,
} from "../lib/image-compression";
import {
  countMarkdownImages,
  MAX_IMAGES_PER_DOCUMENT,
} from "../lib/image-limit";
import type { WikiLinkItem, WikiLinkTargetType } from "../types";
import { EditorToolbar } from "./editor-toolbar";
import {
  MathQuillDialog,
  type EquationModalTarget,
  type EquationMode,
} from "./mathquill-dialog";
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
  placeholder = "Write in Markdown or type @ to link a skill, sub-skill, or unit...",
  readOnly = false,
  className,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<"wysiwyg" | "markdown">("wysiwyg");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [mediaNotice, setMediaNotice] = useState<{
    kind: "error" | "info";
    text: string;
  } | null>(null);
  const [equationModal, setEquationModal] = useState<{
    open: boolean;
    target: EquationModalTarget;
  }>({
    open: false,
    target: { mode: "inline", latex: "" },
  });

  const imageCount = useMemo(() => countMarkdownImages(value), [value]);

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
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          loading: "lazy",
          decoding: "async",
        },
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
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
        },
      }),
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
        class: cn(
          "tiptap-editor min-h-[280px] text-sm leading-relaxed outline-none",
          readOnly ? "px-0 py-1 text-[15px] leading-[1.68]" : "px-5 py-4"
        ),
        "data-placeholder": placeholder,
      },
    },
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.getMarkdown());
    },
  });

  const handleUploadImages = useCallback(
    async (files: File[]) => {
      if (!editor || readOnly || files.length === 0) return;

      let docImages = 0;
      editor.state.doc.descendants((node) => {
        if (node.type.name === "image") docImages += 1;
      });
      const currentCount = Math.max(docImages, countMarkdownImages(editor.getMarkdown()));
      const remaining = MAX_IMAGES_PER_DOCUMENT - currentCount;

      if (remaining <= 0) {
        setMediaNotice({
          kind: "error",
          text: `Image limit reached: maximum ${MAX_IMAGES_PER_DOCUMENT} images per overview, sub-skill, or unit.`,
        });
        return;
      }

      const accepted = files.slice(0, remaining);
      const skipped = files.length - accepted.length;

      setIsUploadingImage(true);
      setMediaNotice(null);

      try {
        let runningCount = currentCount;
        for (const file of accepted) {
          const compressed = await compressImageForEditor(file);
          const payload = new FormData();
          payload.append("file", compressed.blob, compressed.fileName);
          payload.append("currentImageCount", String(runningCount));

          const response = await fetch("/api/images/upload", {
            method: "POST",
            body: payload,
            credentials: "include",
          });

          const data = (await response.json().catch(() => ({}))) as {
            url?: string;
            error?: string;
          };

          if (!response.ok || !data.url) {
            throw new Error(data.error || "Image upload failed.");
          }

          editor
            .chain()
            .focus()
            .setImage({
              src: data.url,
              alt: compressed.fileName.replace(/\.[^.]+$/, ""),
            })
            .run();

          runningCount += 1;
        }

        if (skipped > 0) {
          setMediaNotice({
            kind: "info",
            text: `Uploaded ${accepted.length} image(s). ${skipped} skipped due to the ${MAX_IMAGES_PER_DOCUMENT}-image per-document limit.`,
          });
        }
      } catch (err) {
        setMediaNotice({
          kind: "error",
          text:
            err instanceof Error
              ? err.message
              : "Failed to upload image to ImageKit.",
        });
      } finally {
        setIsUploadingImage(false);
      }
    },
    [editor, readOnly]
  );

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

  function handlePasteCapture(event: ClipboardEvent<HTMLDivElement>) {
    if (readOnly) return;
    const clipboard = event.clipboardData;
    if (!clipboard) return;

    const directFiles = Array.from(clipboard.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );

    const itemFiles =
      directFiles.length > 0
        ? directFiles
        : Array.from(clipboard.items ?? [])
            .filter(
              (item) => item.kind === "file" && item.type.startsWith("image/")
            )
            .map((item) => item.getAsFile())
            .filter((file): file is File => file !== null);

    if (itemFiles.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      void handleUploadImages(itemFiles);
      return;
    }

    const html = clipboard.getData("text/html");
    if (html && html.includes("data:image/")) {
      const dataMatches = html.match(
        /data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+/gi
      );
      if (dataMatches && dataMatches.length > 0) {
        const converted = dataMatches
          .map((uri, idx) => dataUrlToImageFile(uri, `pasted-${idx + 1}`))
          .filter((f): f is File => f !== null);
        if (converted.length > 0) {
          event.preventDefault();
          event.stopPropagation();
          void handleUploadImages(converted);
        }
      }
    }
  }

  function handleDropCapture(event: DragEvent<HTMLDivElement>) {
    if (readOnly) return;
    const dropped = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (dropped.length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    void handleUploadImages(dropped);
  }

  function handleMathClick(event: MouseEvent<HTMLDivElement>) {
    if (readOnly || !editor) return;
    const targetEl = event.target as HTMLElement | null;
    const mathEl = targetEl?.closest<HTMLElement>(
      '[data-type="inline-math"], [data-type="block-math"]'
    );
    if (!mathEl) return;

    const isBlock = mathEl.getAttribute("data-type") === "block-math";
    let foundPos: number | undefined;
    let foundLatex = mathEl.getAttribute("data-latex") ?? "";

    editor.state.doc.descendants((node, pos) => {
      if (
        (isBlock && node.type.name === "blockMath") ||
        (!isBlock && node.type.name === "inlineMath")
      ) {
        const dom = editor.view.nodeDOM(pos);
        if (dom === mathEl) {
          foundPos = pos;
          foundLatex = String(node.attrs?.latex ?? foundLatex);
          return false;
        }
      }
      return true;
    });

    setEquationModal({
      open: true,
      target: {
        mode: isBlock ? "block" : "inline",
        latex: foundLatex,
        pos: foundPos,
      },
    });
  }

  function handleModeChange(nextMode: "wysiwyg" | "markdown") {
    if (nextMode === mode) return;
    if (nextMode === "wysiwyg" && editor) {
      editor.commands.setContent(value, { contentType: "markdown" });
    }
    setMode(nextMode);
  }

  function handleSaveEquation(payload: {
    latex: string;
    mode: EquationMode;
    pos?: number;
  }) {
    if (!editor) return;
    if (payload.pos !== undefined) {
      if (payload.mode === "inline") {
        editor
          .chain()
          .focus()
          .updateInlineMath({ latex: payload.latex, pos: payload.pos })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .updateBlockMath({ latex: payload.latex, pos: payload.pos })
          .run();
      }
    } else if (payload.mode === "inline") {
      editor.chain().focus().insertInlineMath({ latex: payload.latex }).run();
    } else {
      editor.chain().focus().insertBlockMath({ latex: payload.latex }).run();
    }
    setEquationModal((prev) => ({ ...prev, open: false }));
  }

  function handleDeleteEquation(payload: { mode: EquationMode; pos: number }) {
    if (!editor) return;
    if (payload.mode === "inline") {
      editor.chain().focus().deleteInlineMath({ pos: payload.pos }).run();
    } else {
      editor.chain().focus().deleteBlockMath({ pos: payload.pos }).run();
    }
    setEquationModal((prev) => ({ ...prev, open: false }));
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[8px] border border-border bg-card text-card-foreground",
        className
      )}
    >
      {!readOnly ? (
        <>
          <EditorToolbar
            editor={editor}
            mode={mode}
            imageCount={imageCount}
            isUploadingImage={isUploadingImage}
            onModeChange={handleModeChange}
            onOpenEquationModal={() =>
              setEquationModal({
                open: true,
                target: { mode: "inline", latex: "" },
              })
            }
            onUploadImages={(files) => void handleUploadImages(files)}
          />

          {isUploadingImage ? (
            <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
              <Loader2Icon className="size-3.5 animate-spin" />
              <span>Compressing &amp; uploading image to ImageKit...</span>
            </div>
          ) : null}

          {mediaNotice ? (
            <div
              role={mediaNotice.kind === "error" ? "alert" : "status"}
              className={cn(
                "flex items-center justify-between gap-2 border-b px-4 py-2 text-xs",
                mediaNotice.kind === "error"
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-border bg-muted/40 text-muted-foreground"
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <AlertCircleIcon className="size-3.5 shrink-0" />
                {mediaNotice.text}
              </span>
              <button
                type="button"
                onClick={() => setMediaNotice(null)}
                className="underline underline-offset-2 hover:opacity-80"
              >
                Dismiss
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {mode === "wysiwyg" ? (
        <div
          onPasteCapture={handlePasteCapture}
          onDropCapture={handleDropCapture}
          onClick={handleMathClick}
        >
          <EditorContent editor={editor} />
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          className="min-h-[320px] w-full resize-y bg-transparent px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground outline-none"
        />
      )}

      {!readOnly ? (
        <MathQuillDialog
          open={equationModal.open}
          initialTarget={equationModal.target}
          onOpenChange={(open) =>
            setEquationModal((prev) => ({ ...prev, open }))
          }
          onSave={handleSaveEquation}
          onDelete={handleDeleteEquation}
        />
      ) : null}
    </div>
  );
}
