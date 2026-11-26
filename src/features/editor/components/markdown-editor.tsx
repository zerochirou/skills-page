"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import { AlertCircleIcon, CheckIcon, CopyIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { WikiLink } from "../extensions/wiki-link";
import {
  compressImageForEditor,
  dataUrlToImageFile,
  isDirectImageUrl,
  isSupportedImageFile,
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
  const [copiedAction, setCopiedAction] = useState<"image" | "url" | null>(null);
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
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

  const markdownTextareaRef = useRef<HTMLTextAreaElement>(null);

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
    onSelectionUpdate({ editor: currentEditor }) {
      if (readOnly) return;
      if (currentEditor.isActive("image")) {
        const attrs = currentEditor.getAttributes("image");
        const src = typeof attrs?.src === "string" ? attrs.src : "";
        const alt = typeof attrs?.alt === "string" ? attrs.alt : "";
        setSelectedImage(src ? { src, alt } : null);
      } else {
        setSelectedImage(null);
      }
    },
  });

  const getCurrentImageCount = useCallback(() => {
    if (mode === "markdown" || !editor) {
      return countMarkdownImages(value);
    }
    let docImages = 0;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "image") docImages += 1;
    });
    return Math.max(docImages, countMarkdownImages(editor.getMarkdown()));
  }, [editor, mode, value]);

  const insertUploadedImage = useCallback(
    (src: string, alt: string) => {
      if (mode === "markdown") {
        const textarea = markdownTextareaRef.current;
        const snippet = `![${alt}](${src})`;
        if (textarea) {
          const start = textarea.selectionStart ?? value.length;
          const end = textarea.selectionEnd ?? start;
          const prefix =
            start > 0 && !value.slice(0, start).endsWith("\n") ? "\n" : "";
          const suffix =
            end < value.length && !value.slice(end).startsWith("\n") ? "\n" : "";
          const next = `${value.slice(0, start)}${prefix}${snippet}${suffix}${value.slice(end)}`;
          onChange(next);
          const cursorPos = start + prefix.length + snippet.length + suffix.length;
          requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(cursorPos, cursorPos);
          });
        } else {
          onChange(value ? `${value}\n\n${snippet}` : snippet);
        }
        return;
      }

      editor?.chain().focus().setImage({ src, alt }).run();
    },
    [editor, mode, onChange, value]
  );

  const handleUploadImageSources = useCallback(
    async (
      sources: Array<
        | { kind: "file"; file: File }
        | { kind: "url"; url: string; alt?: string }
      >
    ) => {
      if (readOnly || sources.length === 0) return;

      const currentCount = getCurrentImageCount();
      const remaining = MAX_IMAGES_PER_DOCUMENT - currentCount;

      if (remaining <= 0) {
        setMediaNotice({
          kind: "error",
          text: `Image limit reached: maximum ${MAX_IMAGES_PER_DOCUMENT} images per overview, sub-skill, or unit.`,
        });
        return;
      }

      const accepted = sources.slice(0, remaining);
      const skipped = sources.length - accepted.length;

      setIsUploadingImage(true);
      setMediaNotice(null);

      try {
        let runningCount = currentCount;
        for (const source of accepted) {
          if (source.kind === "url") {
            let isAlreadyImageKit = false;
            try {
              const parsed = new URL(source.url);
              isAlreadyImageKit = parsed.hostname === "ik.imagekit.io";
            } catch {
              isAlreadyImageKit = false;
            }

            if (isAlreadyImageKit) {
              insertUploadedImage(
                source.url,
                source.alt?.trim() || "image"
              );
              runningCount += 1;
              continue;
            }

            let fetchedFile: File | null = null;
            try {
              const clientRes = await fetch(source.url);
              if (clientRes.ok) {
                const blob = await clientRes.blob();
                if (blob.type.startsWith("image/")) {
                  const ext = blob.type.split("/")[1]?.split("+")[0] || "png";
                  fetchedFile = new File([blob], `copied-image.${ext}`, {
                    type: blob.type,
                  });
                }
              }
            } catch {
              fetchedFile = null;
            }

            const payload = new FormData();
            let resolvedAlt = source.alt?.trim() || "copied-image";

            if (fetchedFile) {
              const compressed = await compressImageForEditor(fetchedFile);
              payload.append("file", compressed.blob, compressed.fileName);
              resolvedAlt =
                source.alt?.trim() ||
                compressed.fileName.replace(/\.[^.]+$/, "");
            } else {
              payload.append("imageUrl", source.url);
            }
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

            insertUploadedImage(data.url, resolvedAlt);
            runningCount += 1;
            continue;
          }

          const compressed = await compressImageForEditor(source.file);
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

          insertUploadedImage(
            data.url,
            compressed.fileName.replace(/\.[^.]+$/, "")
          );
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
    [getCurrentImageCount, insertUploadedImage, readOnly]
  );

  const handleUploadImages = useCallback(
    (files: File[]) =>
      handleUploadImageSources(
        files.map((file) => ({ kind: "file" as const, file }))
      ),
    [handleUploadImageSources]
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

  function handlePasteCapture(
    event: ClipboardEvent<HTMLDivElement | HTMLTextAreaElement>
  ) {
    if (readOnly) return;
    const clipboard = event.clipboardData;
    if (!clipboard) return;

    const directFiles = Array.from(clipboard.files ?? []).filter(
      isSupportedImageFile
    );

    const itemFiles =
      directFiles.length > 0
        ? directFiles
        : Array.from(clipboard.items ?? [])
            .filter(
              (item) =>
                item.kind === "file" &&
                (item.type.startsWith("image/") || item.type === "")
            )
            .map((item) => item.getAsFile())
            .filter(
              (file): file is File =>
                file !== null && isSupportedImageFile(file)
            );

    if (itemFiles.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      void handleUploadImages(itemFiles);
      return;
    }

    const html = clipboard.getData("text/html");
    const plainText = clipboard.getData("text/plain")?.trim() ?? "";

    if (html && /<img\b/i.test(html)) {
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const imgEls = Array.from(parsed.querySelectorAll("img[src]"));
      const extractedSources: Array<
        | { kind: "file"; file: File }
        | { kind: "url"; url: string; alt?: string }
      > = [];

      imgEls.forEach((img, idx) => {
        const src = img.getAttribute("src")?.trim() ?? "";
        const alt = img.getAttribute("alt")?.trim() || undefined;
        const w = img.getAttribute("width");
        const h = img.getAttribute("height");
        if (w === "1" && h === "1") return;

        if (src.startsWith("data:image/")) {
          const converted = dataUrlToImageFile(src, `pasted-${idx + 1}`);
          if (converted) extractedSources.push({ kind: "file", file: converted });
        } else if (src.startsWith("https://") || src.startsWith("http://")) {
          extractedSources.push({ kind: "url", url: src, alt });
        }
      });

      const hasOnlyImages = !(parsed.body.textContent ?? "").trim();
      if (extractedSources.length > 0 && (hasOnlyImages || isDirectImageUrl(plainText))) {
        event.preventDefault();
        event.stopPropagation();
        void handleUploadImageSources(extractedSources);
        return;
      }
    }

    if (plainText && isDirectImageUrl(plainText)) {
      event.preventDefault();
      event.stopPropagation();
      void handleUploadImageSources([{ kind: "url", url: plainText }]);
    }
  }

  function handleDropCapture(
    event: DragEvent<HTMLDivElement | HTMLTextAreaElement>
  ) {
    if (readOnly) return;
    const dropped = Array.from(event.dataTransfer?.files ?? []).filter(
      isSupportedImageFile
    );
    if (dropped.length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    void handleUploadImages(dropped);
  }

  async function handleCopySelectedImage() {
    if (!selectedImage?.src || typeof navigator === "undefined") return;
    try {
      const res = await fetch(selectedImage.src, { mode: "cors" });
      const blob = await res.blob();
      let pngBlob: Blob = blob;

      if (blob.type !== "image/png" && typeof document !== "undefined") {
        const bitmapUrl = URL.createObjectURL(blob);
        try {
          const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new globalThis.Image();
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error("Image decode failed"));
            el.src = bitmapUrl;
          });
          const canvas = document.createElement("canvas");
          canvas.width = imgEl.naturalWidth || imgEl.width;
          canvas.height = imgEl.naturalHeight || imgEl.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(imgEl, 0, 0);
            const encoded = await new Promise<Blob | null>((resolve) =>
              canvas.toBlob((b) => resolve(b), "image/png")
            );
            if (encoded) pngBlob = encoded;
          }
        } finally {
          URL.revokeObjectURL(bitmapUrl);
        }
      }

      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ [pngBlob.type || "image/png"]: pngBlob }),
        ]);
        setCopiedAction("image");
        window.setTimeout(() => setCopiedAction(null), 1600);
        return;
      }
    } catch {
      // Fallback to copying image URL if image binary clipboard is restricted.
    }

    await handleCopySelectedImageUrl();
  }

  async function handleCopySelectedImageUrl() {
    if (!selectedImage?.src || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(selectedImage.src);
      setCopiedAction("url");
      window.setTimeout(() => setCopiedAction(null), 1600);
    } catch {
      setMediaNotice({
        kind: "error",
        text: "Clipboard access was blocked by the browser.",
      });
    }
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

          {mode === "wysiwyg" && selectedImage ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-1.5 text-xs">
              <span className="truncate font-mono text-[11px] text-muted-foreground">
                Selected image: {selectedImage.alt || "image"}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void handleCopySelectedImage()}
                  className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {copiedAction === "image" ? (
                    <CheckIcon className="size-3" />
                  ) : (
                    <CopyIcon className="size-3" />
                  )}
                  <span>{copiedAction === "image" ? "Copied" : "Copy Image"}</span>
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void handleCopySelectedImageUrl()}
                  className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <span>{copiedAction === "url" ? "Link Copied" : "Copy URL"}</span>
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().deleteSelection().run();
                    setSelectedImage(null);
                  }}
                  aria-label="Remove selected image"
                  className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-1 text-[11px] text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2Icon className="size-3" />
                  <span>Remove</span>
                </button>
              </div>
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
          ref={markdownTextareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPasteCapture={handlePasteCapture}
          onDropCapture={handleDropCapture}
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
