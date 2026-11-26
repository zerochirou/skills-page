export interface MathQuillField {
  latex: (() => string) & ((next: string) => void);
  cmd: (latexCmd: string) => void;
  write: (latex: string) => void;
  focus: () => void;
  blur: () => void;
  keystroke: (keys: string) => void;
}

export interface MathQuillInterface {
  MathField: (
    el: HTMLElement,
    config?: {
      spaceBehavesLikeTab?: boolean;
      leftRightIntoCmdGoes?: "up" | "down";
      restrictMismatchedBrackets?: boolean;
      supSubsRequireOperand?: boolean;
      autoSubscriptNumerals?: boolean;
      charsThatBreakOutOfSupSub?: string;
      sumStartsWithNEquals?: boolean;
      autoCommands?: string;
      autoOperatorNames?: string;
      handlers?: {
        edit?: (field: MathQuillField) => void;
        enter?: (field: MathQuillField) => void;
      };
    }
  ) => MathQuillField;
}

declare global {
  interface Window {
    jQuery?: unknown;
    $?: unknown;
    MathQuill?: {
      getInterface: (version: 1 | 2) => MathQuillInterface;
    };
  }
}

let mathQuillLoader: Promise<MathQuillInterface> | null = null;

export async function loadMathQuill(): Promise<MathQuillInterface> {
  if (typeof window === "undefined") {
    throw new Error("MathQuill can only run in the browser.");
  }

  if (window.MathQuill) {
    return window.MathQuill.getInterface(2);
  }

  if (!mathQuillLoader) {
    mathQuillLoader = (async () => {
      const jqMod = await import("jquery");
      const jq = jqMod.default ?? jqMod;
      window.jQuery = jq;
      window.$ = jq;

      await import("@edtr-io/mathquill/build/mathquill.js");
      if (!window.MathQuill) {
        throw new Error("Failed to initialize MathQuill.");
      }
      return window.MathQuill.getInterface(2);
    })().catch((err) => {
      mathQuillLoader = null;
      throw err;
    });
  }

  return mathQuillLoader;
}
