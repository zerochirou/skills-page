"use client";

import { useEffect, useId, useState } from "react";
import {
  Node,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import mermaid from "mermaid";
import { CodeIcon, EyeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

let mermaidInitialized = false;

function MermaidBlockView({ node, updateAttributes, editor }: NodeViewProps) {
  const code = (node.attrs.code as string) || "";
  const [editing, setEditing] = useState(false);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const rawId = useId();
  const diagramId = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "loose",
      });
      mermaidInitialized = true;
    }

    let cancelled = false;
    async function renderDiagram() {
      if (!code.trim()) {
        setSvg("");
        setError(null);
        return;
      }
      try {
        const { svg: rendered } = await mermaid.render(diagramId, code);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Invalid Mermaid syntax"
          );
        }
      }
    }

    void renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [code, diagramId]);

  const isEditable = editor.isEditable;

  return (
    <NodeViewWrapper className="my-4 rounded-[8px] border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Mermaid Diagram
        </span>
        {isEditable ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setEditing((prev) => !prev)}
          >
            {editing ? (
              <>
                <EyeIcon className="mr-1 size-3.5" />
                Preview
              </>
            ) : (
              <>
                <CodeIcon className="mr-1 size-3.5" />
                Edit
              </>
            )}
          </Button>
        ) : null}
      </div>

      {editing && isEditable ? (
        <textarea
          value={code}
          onChange={(e) => updateAttributes({ code: e.target.value })}
          rows={6}
          spellCheck={false}
          placeholder="graph TD&#10;  A[Start] --> B[End]"
          className="w-full resize-y rounded-md border border-input bg-background p-2.5 font-mono text-xs leading-relaxed text-foreground outline-none focus:border-ring"
        />
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 font-mono text-xs text-destructive">
          {error}
        </div>
      ) : svg ? (
        <div
          className="flex justify-center overflow-x-auto py-2 [&_svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="py-6 text-center text-xs text-muted-foreground">
          Empty diagram
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const MermaidNode = Node.create({
  name: "mermaid",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      code: {
        default: "graph TD\n  A[Start] --> B[Process]\n  B --> C[End]",
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mermaid"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-type": "mermaid" }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidBlockView);
  },
});
