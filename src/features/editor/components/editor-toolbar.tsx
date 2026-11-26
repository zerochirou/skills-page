"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  AtSignIcon,
  BoldIcon,
  Code2Icon,
  CornerDownLeftIcon,
  GitBranchIcon,
  Heading2Icon,
  HighlighterIcon,
  ImagePlusIcon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  ItalicIcon,
  LinkIcon,
  ListCollapseIcon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  PlusIcon,
  QuoteIcon,
  Redo2Icon,
  SigmaIcon,
  StrikethroughIcon,
  SubscriptIcon,
  SuperscriptIcon,
  TableIcon,
  Trash2Icon,
  Undo2Icon,
  UnlinkIcon,
  VideoIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MAX_IMAGES_PER_DOCUMENT } from "../lib/image-limit";

interface EditorToolbarProps {
  editor: Editor | null;
  mode: "wysiwyg" | "markdown";
  imageCount: number;
  isUploadingImage?: boolean;
  onModeChange: (mode: "wysiwyg" | "markdown") => void;
  onOpenEquationModal: () => void;
  onUploadImages: (files: File[]) => void;
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={onClick}
            aria-label={label}
            className={cn(
              "text-muted-foreground hover:text-foreground",
              active && "bg-muted text-foreground"
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function EditorToolbar({
  editor,
  mode,
  imageCount,
  isUploadingImage = false,
  onModeChange,
  onOpenEquationModal,
  onUploadImages,
}: EditorToolbarProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRaw = mode === "markdown";
  const inTable = Boolean(editor?.isActive("table"));
  const imageLimitReached = imageCount >= MAX_IMAGES_PER_DOCUMENT;

  function handleOpenLink() {
    if (!editor) return;
    const currentHref = editor.getAttributes("link").href as string | undefined;
    setLinkUrl(currentHref ?? "");
  }

  function handleApplyLink(e: React.FormEvent) {
    e.preventDefault();
    if (!editor) return;
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const normalized =
        /^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")
          ? trimmed
          : `https://${trimmed}`;
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: normalized })
        .run();
    }
    setLinkOpen(false);
  }

  return (
    <div className="flex flex-nowrap items-center justify-between gap-2 overflow-x-auto border-b border-border px-2.5 py-1.5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) {
            onUploadImages(files);
          }
          e.target.value = "";
        }}
      />

      <div className="flex shrink-0 flex-nowrap items-center gap-0.5">
        <ToolbarButton
          label="Heading 2"
          active={editor?.isActive("heading", { level: 2 })}
          disabled={isRaw || !editor}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2Icon />
        </ToolbarButton>
        <ToolbarButton
          label="Bold"
          active={editor?.isActive("bold")}
          disabled={isRaw || !editor}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <BoldIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor?.isActive("italic")}
          disabled={isRaw || !editor}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor?.isActive("strike")}
          disabled={isRaw || !editor}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <StrikethroughIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Subscript"
          active={editor?.isActive("subscript")}
          disabled={isRaw || !editor}
          onClick={() => editor?.chain().focus().toggleSubscript().run()}
        >
          <SubscriptIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Superscript"
          active={editor?.isActive("superscript")}
          disabled={isRaw || !editor}
          onClick={() => editor?.chain().focus().toggleSuperscript().run()}
        >
          <SuperscriptIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Highlight"
          active={editor?.isActive("highlight")}
          disabled={isRaw || !editor}
          onClick={() => editor?.chain().focus().toggleHighlight().run()}
        >
          <HighlighterIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Inline code"
          active={editor?.isActive("code")}
          disabled={isRaw || !editor}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          <Code2Icon />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <ToolbarButton
          label="Bullet list"
          active={editor?.isActive("bulletList")}
          disabled={isRaw || !editor}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <ListIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Ordered list"
          active={editor?.isActive("orderedList")}
          disabled={isRaw || !editor}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrderedIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Indent list (Tab)"
          disabled={isRaw || !editor?.can().sinkListItem("listItem")}
          onClick={() => editor?.chain().focus().sinkListItem("listItem").run()}
        >
          <IndentIncreaseIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Outdent list (Shift+Tab)"
          disabled={isRaw || !editor?.can().liftListItem("listItem")}
          onClick={() => editor?.chain().focus().liftListItem("listItem").run()}
        >
          <IndentDecreaseIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Blockquote"
          active={editor?.isActive("blockquote")}
          disabled={isRaw || !editor}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <QuoteIcon />
        </ToolbarButton>

        <Popover
          open={linkOpen}
          onOpenChange={(open) => {
            setLinkOpen(open);
            if (open) handleOpenLink();
          }}
        >
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={isRaw || !editor}
                aria-label="Insert or edit link"
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  editor?.isActive("link") && "bg-muted text-foreground"
                )}
              />
            }
          >
            <LinkIcon />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-3">
            <form onSubmit={handleApplyLink} className="flex flex-col gap-2">
              <label className="text-xs font-medium text-foreground">
                Link URL
              </label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                autoFocus
              />
              <div className="flex items-center justify-between gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
                    setLinkOpen(false);
                  }}
                >
                  <UnlinkIcon data-icon="inline-start" />
                  Remove
                </Button>
                <Button type="submit" size="sm">
                  Apply
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>

        <ToolbarButton
          label="Task list"
          active={editor?.isActive("taskList")}
          disabled={isRaw || !editor}
          onClick={() => editor?.chain().focus().toggleTaskList().run()}
        >
          <ListTodoIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Details"
          active={editor?.isActive("details")}
          disabled={isRaw || !editor}
          onClick={() => editor?.chain().focus().setDetails().run()}
        >
          <ListCollapseIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Hard break"
          disabled={isRaw || !editor}
          onClick={() => editor?.chain().focus().setHardBreak().run()}
        >
          <CornerDownLeftIcon />
        </ToolbarButton>
        <ToolbarButton
          label={
            imageLimitReached
              ? `Image limit reached (${imageCount}/${MAX_IMAGES_PER_DOCUMENT})`
              : `Upload image (${imageCount}/${MAX_IMAGES_PER_DOCUMENT})`
          }
          disabled={isRaw || !editor || isUploadingImage || imageLimitReached}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlusIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Insert equation (MathQuill)"
          disabled={isRaw || !editor}
          onClick={onOpenEquationModal}
        >
          <SigmaIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Embed YouTube"
          disabled={isRaw || !editor}
          onClick={() => {
            const url = window.prompt("YouTube URL");
            if (url) {
              editor?.chain().focus().setYoutubeVideo({ src: url }).run();
            }
          }}
        >
          <VideoIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Insert diagram"
          disabled={isRaw || !editor}
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .insertContent({
                type: "mermaid",
                attrs: {
                  code: "graph TD\n  A[Start] --> B[Process]\n  B --> C[End]",
                },
              })
              .run()
          }
        >
          <GitBranchIcon />
        </ToolbarButton>

        <ToolbarButton
          label="Insert 3x3 table"
          active={inTable}
          disabled={isRaw || !editor}
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <TableIcon />
        </ToolbarButton>

        {inTable && !isRaw ? (
          <>
            <ToolbarButton
              label="Add row below"
              onClick={() => editor?.chain().focus().addRowAfter().run()}
            >
              <PlusIcon />
            </ToolbarButton>
            <ToolbarButton
              label="Delete table"
              onClick={() => editor?.chain().focus().deleteTable().run()}
            >
              <Trash2Icon />
            </ToolbarButton>
          </>
        ) : null}

        <ToolbarButton
          label="Insert Wiki-Link (@)"
          disabled={isRaw || !editor}
          onClick={() => editor?.chain().focus().insertContent("@").run()}
        >
          <AtSignIcon />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <ToolbarButton
          label="Undo"
          disabled={isRaw || !editor?.can().undo()}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2Icon />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={isRaw || !editor?.can().redo()}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2Icon />
        </ToolbarButton>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
          {imageCount}/{MAX_IMAGES_PER_DOCUMENT} img
        </span>
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          <Button
            type="button"
            variant={mode === "wysiwyg" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => onModeChange("wysiwyg")}
          >
            Editor
          </Button>
          <Button
            type="button"
            variant={mode === "markdown" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => onModeChange("markdown")}
          >
            Markdown
          </Button>
        </div>
      </div>
    </div>
  );
}
