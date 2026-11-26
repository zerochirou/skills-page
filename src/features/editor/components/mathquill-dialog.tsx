"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, KeyboardIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardFooter, CardPanel } from "@/components/ui/card";
import { Dialog, FramedDialogContent } from "@/components/ui/dialog";
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

const DESMOS_KEYPAD: KeypadAction[] = [
  { label: "a/b", title: "Fraction (/)", action: "cmd", value: "\\frac" },
  { label: "x²", title: "Square (^2)", action: "write", value: "^2" },
  { label: "xⁿ", title: "Exponent (^)", action: "cmd", value: "^" },
  { label: "xₙ", title: "Subscript (_)", action: "cmd", value: "_" },
  { label: "√", title: "Square root (sqrt)", action: "cmd", value: "\\sqrt" },
  { label: "ⁿ√", title: "nth root (nthroot)", action: "cmd", value: "\\nthroot" },
  { label: "|x|", title: "Absolute value (|)", action: "cmd", value: "|" },
  { label: "π", title: "Pi (pi)", action: "cmd", value: "\\pi" },
  { label: "θ", title: "Theta (theta)", action: "cmd", value: "\\theta" },
  { label: "∞", title: "Infinity (infty)", action: "cmd", value: "\\infty" },
  { label: "∑", title: "Summation (sum)", action: "cmd", value: "\\sum" },
  { label: "∫", title: "Integral (int)", action: "cmd", value: "\\int" },
  { label: "≤", title: "Less or equal (<=)", action: "cmd", value: "\\le" },
  { label: "≥", title: "Greater or equal (>=)", action: "cmd", value: "\\ge" },
  { label: "≠", title: "Not equal (neq)", action: "cmd", value: "\\neq" },
  { label: "±", title: "Plus or minus (pm)", action: "cmd", value: "\\pm" },
];

const DESMOS_AUTO_COMMANDS =
  "pi theta sqrt sum prod int nthroot alpha beta gamma delta epsilon zeta eta iota kappa lambda mu nu xi rho sigma tau phi chi psi omega infty infinity pm mp leq geq neq approx equiv forall exists partial nabla";

const DESMOS_AUTO_OPERATORS =
  "sin cos tan csc sec cot arcsin arccos arctan sinh cosh tanh arcsinh arccosh arctanh ln log exp lim max min det gcd lcm mod";

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
  const [hasContent, setHasContent] = useState(
    Boolean(initialTarget.latex.trim())
  );
  const [mode, setMode] = useState<EquationMode>(initialTarget.mode);
  const [showKeypad, setShowKeypad] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Imperatively owned mount container so React reconciler never strips MathQuill DOM classes.
  const fieldContainerRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<MathQuillField | null>(null);
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
    let focusTimer: number | undefined;
    const container = fieldContainerRef.current;

    async function mountMathQuill() {
      try {
        const MQ = await loadMathQuill();
        if (cancelled || !container) return;

        container.innerHTML = "";
        const mqNode = document.createElement("span");
        container.appendChild(mqNode);

        const field = MQ.MathField(mqNode, {
          spaceBehavesLikeTab: true,
          leftRightIntoCmdGoes: "up",
          restrictMismatchedBrackets: true,
          supSubsRequireOperand: true,
          autoSubscriptNumerals: true,
          charsThatBreakOutOfSupSub: "+-=<>",
          sumStartsWithNEquals: true,
          autoCommands: DESMOS_AUTO_COMMANDS,
          autoOperatorNames: DESMOS_AUTO_OPERATORS,
          handlers: {
            edit: (mf) => {
              setHasContent(Boolean(mf.latex().trim()));
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
          field.latex(initialLatexRef.current);
          setHasContent(Boolean(field.latex().trim()));
        }

        setStatus("ready");
        requestAnimationFrame(() => {
          if (!cancelled) field.focus();
        });
        focusTimer = window.setTimeout(() => {
          if (!cancelled && container && !container.contains(document.activeElement)) {
            field.focus();
          }
        }, 80);
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
      if (focusTimer !== undefined) {
        window.clearTimeout(focusTimer);
      }
      fieldRef.current = null;
      if (container) {
        container.innerHTML = "";
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
    setHasContent(Boolean(field.latex().trim()));
    field.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const current = fieldRef.current?.latex().trim() ?? "";
    if (!current) return;
    onSave({
      latex: current,
      mode,
      pos: initialTarget.pos,
    });
  }

  const isEditing = initialTarget.pos !== undefined;

  return (
    <FramedDialogContent
      initialFocus={false}
      className="sm:max-w-xl"
      title={isEditing ? "Edit Equation" : "Insert Equation"}
      titleClassName="font-serif text-2xl font-normal tracking-tight text-primary"
      description={
        <>
          Write naturally just like Desmos: type{" "}
          <code className="font-mono text-foreground">a/b</code> for fractions,{" "}
          <code className="font-mono text-foreground">x^2</code> for powers,{" "}
          <code className="font-mono text-foreground">sqrt</code>,{" "}
          <code className="font-mono text-foreground">sum</code>,{" "}
          <code className="font-mono text-foreground">int</code>, or{" "}
          <code className="font-mono text-foreground">pi</code>.
        </>
      }
      headerAction={
        !isEditing ? (
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
              Inline
            </Button>
            <Button
              type="button"
              size="xs"
              variant={mode === "block" ? "secondary" : "ghost"}
              onClick={() => setMode("block")}
            >
              Display
            </Button>
          </div>
        ) : undefined
      }
    >
      <form onSubmit={handleSubmit}>
        <CardPanel className="flex flex-col gap-3">
          {/* Desmos-style expression input row */}
          <div
            onMouseDown={(e) => {
              if (
                e.target === e.currentTarget ||
                !(e.target as HTMLElement).closest(".mq-root-block")
              ) {
                e.preventDefault();
                fieldRef.current?.focus();
              }
            }}
            className="flex min-h-[104px] w-full cursor-text overflow-hidden rounded-xl border border-border bg-card text-foreground transition-colors focus-within:border-primary"
          >
            <div
              aria-hidden="true"
              className="flex w-10 shrink-0 flex-col items-center justify-center border-r border-border bg-muted/45 font-mono text-[11px] text-muted-foreground select-none"
            >
              <span>fx</span>
            </div>

            <div className="relative flex flex-1 items-center px-4 py-3">
              {status === "loading" ? (
                <span className="text-xs text-muted-foreground">
                  Preparing math input...
                </span>
              ) : status === "error" ? (
                <span className="text-xs text-destructive">
                  {errorMessage ?? "Unable to initialize equation editor."}
                </span>
              ) : null}

              <div
                ref={fieldContainerRef}
                className={cn(
                  "w-full text-[22px] leading-normal transition-opacity",
                  status !== "ready" && "pointer-events-none opacity-0"
                )}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <button
              type="button"
              onClick={() => setShowKeypad((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/35 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <KeyboardIcon className="size-3.5" />
              <span>{showKeypad ? "Hide Keypad" : "Show Keypad"}</span>
              {showKeypad ? (
                <ChevronUpIcon className="size-3.5 text-muted-foreground" />
              ) : (
                <ChevronDownIcon className="size-3.5 text-muted-foreground" />
              )}
            </button>

            <span className="font-mono">
              Space exits · Enter inserts
            </span>
          </div>

          {showKeypad ? (
            <div
              aria-label="Desmos math symbols keypad"
              className="grid grid-cols-4 gap-1.5 rounded-xl border border-border bg-muted/25 p-2 sm:grid-cols-8"
            >
              {DESMOS_KEYPAD.map((item) => (
                <Button
                  key={item.title}
                  type="button"
                  variant="outline"
                  size="sm"
                  title={item.title}
                  disabled={status !== "ready"}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleKeypadClick(item)}
                  className="h-9 bg-card font-serif text-sm font-normal"
                >
                  {item.label}
                </Button>
              ))}
            </div>
          ) : null}
        </CardPanel>

        <CardFooter className="items-center justify-between border-t border-border/60 pt-4">
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
              disabled={!hasContent}
              className="bg-primary text-primary-foreground hover:bg-primary-active"
            >
              {isEditing ? "Update Equation" : "Insert Equation"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </FramedDialogContent>
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
      {open ? (
        <MathQuillDialogInner
          key={`${initialTarget.pos ?? "new"}-${initialTarget.mode}-${initialTarget.latex}`}
          initialTarget={initialTarget}
          onCancel={() => onOpenChange(false)}
          onSave={onSave}
          onDelete={onDelete}
        />
      ) : null}
    </Dialog>
  );
}
