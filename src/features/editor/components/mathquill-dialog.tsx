"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { loadMathQuill, type MathQuillField } from "../lib/load-mathquill";
import "../styles/mathquill.css";

export type EquationMode = "inline" | "block";

export interface EquationModalTarget {
  mode: EquationMode;
  latex: string;
  pos?: number;
}

interface MathQuillDialogProps {
  open: boolean;
  initialTarget: EquationModalTarget;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: {
    latex: string;
    mode: EquationMode;
    pos?: number;
  }) => void;
  onDelete?: (payload: { mode: EquationMode; pos: number }) => void;
}

interface KeypadAction {
  label: string;
  title: string;
  action: "cmd" | "write";
  value: string;
}

const KEYPAD_GROUPS: KeypadAction[] = [
  { label: "a/b", title: "Fraction (/)", action: "cmd", value: "\\frac" },
  { label: "x²", title: "Exponent (^)", action: "write", value: "^2" },
  { label: "xⁿ", title: "Power (^)", action: "cmd", value: "^" },
  { label: "xₙ", title: "Subscript (_)", action: "cmd", value: "_" },
  { label: "√x", title: "Square root (sqrt)", action: "cmd", value: "\\sqrt" },
  { label: "ⁿ√x", title: "nth root (nthroot)", action: "cmd", value: "\\nthroot" },
  { label: "( )", title: "Parentheses", action: "cmd", value: "(" },
  { label: "|x|", title: "Absolute value", action: "cmd", value: "|" },
  { label: "∑", title: "Summation (sum)", action: "cmd", value: "\\sum" },
  { label: "∫", title: "Integral (int)", action: "cmd", value: "\\int" },
  { label: "lim", title: "Limit", action: "write", value: "\\lim_{x \\to \\infty}" },
  { label: "π", title: "Pi (pi)", action: "cmd", value: "\\pi" },
  { label: "θ", title: "Theta (theta)", action: "cmd", value: "\\theta" },
  { label: "∞", title: "Infinity (infinity)", action: "cmd", value: "\\infty" },
  { label: "≤", title: "Less or equal (<=)", action: "cmd", value: "\\le" },
  { label: "≥", title: "Greater or equal (>=)", action: "cmd", value: "\\ge" },
  { label: "≠", title: "Not equal", action: "cmd", value: "\\neq" },
  { label: "±", title: "Plus or minus (pm)", action: "cmd", value: "\\pm" },
  { label: "·", title: "Multiply", action: "cmd", value: "\\cdot" },
  { label: "→", title: "Arrow", action: "cmd", value: "\\to" },
];

function MathQuillDialogInner({
  initialTarget,
  onCancel,
  onSave,
  onDelete,
}: {
  initialTarget: EquationModalTarget;
  onCancel: () => void;
  onSave: (payload: {
    latex: string;
    mode: EquationMode;
    pos?: number;
  }) => void;
  onDelete?: (payload: { mode: EquationMode; pos: number }) => void;
}) {
  const [latex, setLatex] = useState(initialTarget.latex);
  const [mode, setMode] = useState<EquationMode>(initialTarget.mode);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fieldHostRef = useRef<HTMLSpanElement>(null);
  const fieldRef = useRef<MathQuillField | null>(null);
  const isSyncingFromRawRef = useRef(false);
  const initialLatexRef = useRef(initialTarget.latex);
  const onSaveRef = useRef(onSave);
  const modeRef = useRef(mode);
  const posRef = useRef(initialTarget.pos);

  useEffect(() => {
    onSaveRef.current = onSave;
    modeRef.current = mode;
    posRef.current = initialTarget.pos;
  });

  useEffect(() => {
    let cancelled = false;
    const host = fieldHostRef.current;

    async function mountMathQuill() {
      try {
        const MQ = await loadMathQuill();
        if (cancelled || !host) return;

        host.innerHTML = "";
        const field = MQ.MathField(host, {
          spaceBehavesLikeTab: true,
          leftRightIntoCmdGoes: "up",
          restrictMismatchedBrackets: true,
          supSubsRequireOperand: true,
          autoCommands:
            "pi theta sqrt sum prod int nthroot alpha beta gamma delta epsilon lambda mu sigma phi omega infinity pm mp leq geq neq approx equiv",
          autoOperatorNames:
            "sin cos tan csc sec cot arcsin arccos arctan sinh cosh tanh ln log exp lim max min det gcd lcm",
          handlers: {
            edit: (mf) => {
              if (isSyncingFromRawRef.current) return;
              setLatex(mf.latex());
            },
            enter: (mf) => {
              const current = mf.latex().trim();
              if (current) {
                onSaveRef.current({
                  latex: current,
                  mode: modeRef.current,
                  pos: posRef.current,
                });
              }
            },
          },
        });

        fieldRef.current = field;
        if (initialLatexRef.current) {
          isSyncingFromRawRef.current = true;
          field.latex(initialLatexRef.current);
          isSyncingFromRawRef.current = false;
        }
        setStatus("ready");
        requestAnimationFrame(() => field.focus());
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Unable to load MathQuill."
        );
      }
    }

    void mountMathQuill();

    return () => {
      cancelled = true;
      fieldRef.current = null;
      if (host) {
        host.innerHTML = "";
      }
    };
  }, []);

  function handleKeypadClick(item: KeypadAction) {
    const field = fieldRef.current;
    if (!field) return;
    if (item.action === "cmd") {
      field.cmd(item.value);
    } else {
      field.write(item.value);
    }
    setLatex(field.latex());
    field.focus();
  }

  function handleRawLatexChange(nextValue: string) {
    setLatex(nextValue);
    const field = fieldRef.current;
    if (!field) return;
    isSyncingFromRawRef.current = true;
    field.latex(nextValue);
    isSyncingFromRawRef.current = false;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = latex.trim();
    if (!trimmed) return;
    onSave({
      latex: trimmed,
      mode,
      pos: initialTarget.pos,
    });
  }

  const isEditing = initialTarget.pos !== undefined;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
          <DialogTitle className="font-serif text-2xl font-normal tracking-tight text-primary">
            {isEditing ? "Edit Equation" : "Insert Equation"}
          </DialogTitle>

          {!isEditing ? (
            <div
              role="group"
              aria-label="Equation layout mode"
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 p-0.5"
            >
              <Button
                type="button"
                size="xs"
                variant={mode === "inline" ? "secondary" : "ghost"}
                onClick={() => setMode("inline")}
              >
                Inline ($...$)
              </Button>
              <Button
                type="button"
                size="xs"
                variant={mode === "block" ? "secondary" : "ghost"}
                onClick={() => setMode("block")}
              >
                Block ($$...$$)
              </Button>
            </div>
          ) : null}
        </div>
        <DialogDescription>
          Type naturally like Desmos: use <code className="font-mono">/</code>{" "}
          for fractions, <code className="font-mono">^</code> for exponents, or{" "}
          <code className="font-mono">sqrt</code>,{" "}
          <code className="font-mono">sum</code>,{" "}
          <code className="font-mono">int</code>,{" "}
          <code className="font-mono">pi</code>. Press Enter to insert.
        </DialogDescription>
      </DialogHeader>

      {/* Interactive MathQuill field */}
      <div className="flex flex-col gap-2">
        <div
          onClick={() => fieldRef.current?.focus()}
          className="relative flex min-h-[84px] w-full cursor-text items-center justify-center rounded-lg border border-border bg-card px-4 py-3 text-foreground focus-within:border-primary"
        >
          {status === "loading" ? (
            <span className="text-xs text-muted-foreground">
              Loading MathQuill editor...
            </span>
          ) : status === "error" ? (
            <span className="text-xs text-destructive">
              {errorMessage ?? "MathQuill failed to load. Use the LaTeX field below."}
            </span>
          ) : null}

          <span
            ref={fieldHostRef}
            className={cn(
              "w-full border-0! px-1 py-1 text-center text-xl shadow-none!",
              status !== "ready" && "sr-only"
            )}
          />
        </div>

        {/* Desmos-style math keypad */}
        <div
          aria-label="Math symbols keypad"
          className="grid grid-cols-5 gap-1.5 sm:grid-cols-10"
        >
          {KEYPAD_GROUPS.map((item) => (
            <Button
              key={item.title}
              type="button"
              variant="outline"
              size="sm"
              title={item.title}
              disabled={status !== "ready"}
              onClick={() => handleKeypadClick(item)}
              className="h-9 font-serif text-sm font-normal"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Synchronized LaTeX field */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="mathquill-raw-latex"
          className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
        >
          LaTeX
        </label>
        <Input
          id="mathquill-raw-latex"
          value={latex}
          onChange={(e) => handleRawLatexChange(e.target.value)}
          placeholder="e.g. \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
          className="font-mono text-xs"
        />
      </div>

      <DialogFooter className="items-center justify-between sm:justify-between">
        {isEditing && onDelete && initialTarget.pos !== undefined ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() =>
              onDelete({
                mode: initialTarget.mode,
                pos: initialTarget.pos!,
              })
            }
          >
            <Trash2Icon data-icon="inline-start" />
            Remove
          </Button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!latex.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary-active"
          >
            {isEditing ? "Update Equation" : "Insert Equation"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

export function MathQuillDialog({
  open,
  initialTarget,
  onOpenChange,
  onSave,
  onDelete,
}: MathQuillDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {open ? (
          <MathQuillDialogInner
            key={`${initialTarget.pos ?? "new"}-${initialTarget.mode}-${initialTarget.latex}`}
            initialTarget={initialTarget}
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
            onDelete={onDelete}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
