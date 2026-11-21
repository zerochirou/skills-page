import type { Metadata } from "next";
import {
  ArticleLayout,
  type GlossaryItem,
  type TocItem,
} from "@/components/learning/article-layout";
import {
  CalloutBox,
  CodeBlock,
  ComparisonTable,
} from "@/components/learning/prose-elements";

export const metadata: Metadata = {
  title: "Cognitive Ergonomics in Digital Reading | skills-page",
  description:
    "WCAG 2.1 AAA learning layout demo with anti-halation colors, 65ch measure, and Major Third typography.",
};

const TOC: TocItem[] = [
  { id: "cognitive-load", label: "1. Cognitive Load & Chunking", level: 2 },
  { id: "measure-rhythm", label: "2. Optimal Measure & Rhythm", level: 2 },
  { id: "anti-halation", label: "3. Anti-Halation Contrast", level: 2 },
  { id: "code-clarity", label: "4. Code & Numeric Clarity", level: 3 },
];

const GLOSSARY: GlossaryItem[] = [
  {
    term: "Halation",
    definition:
      "Optical bleeding of pure white (#FFFFFF) text on pure black (#000000) backgrounds that strains the ciliary muscle.",
  },
  {
    term: "Measure (65ch)",
    definition:
      "Line width constrained to 50–75 characters so the eye can jump smoothly from the end of one line to the start of the next.",
  },
  {
    term: "Doubling",
    definition:
      "Re-reading the same line twice because tight line-height (< 1.45) makes adjacent baselines visually blur together.",
  },
  {
    term: "Cognitive Chunking",
    definition:
      "Separating prose into discrete 1.5rem–1.75rem paragraphs so working memory encodes one concept per block.",
  },
];

const SAMPLE_CODE = `// Clear distinction between 0 (zero) and O, 1 and l/I
export function computeContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}`;

export default function LearningDemoPage() {
  return (
    <ArticleLayout
      eyebrow="Module 01 · Cognitive Ergonomics"
      title="Designing Distraction-Free E-Learning Interfaces"
      readingTime="6 min read · WCAG 2.1 AAA"
      toc={TOC}
      glossary={GLOSSARY}
    >
      <section aria-labelledby="cognitive-load">
        <p>
          Effective digital learning depends on minimizing extraneous visual
          friction so a student&apos;s working memory stays focused on the
          subject matter. When typography, line spacing, and contrast are
          calibrated to human visual perception, comprehension improves and
          reading fatigue drops significantly.
        </p>

        <h2 id="cognitive-load">1. Cognitive Load &amp; Chunking</h2>
        <p>
          Long walls of uninterrupted text overwhelm working memory. By keeping
          each paragraph focused on a single idea and separating blocks with
          generous vertical spacing (<code>1.625rem</code>), learners naturally
          pause to consolidate each concept before moving forward.
        </p>

        <CalloutBox variant="tip" title="Left-Aligned Prose Only">
          Always use left-aligned text (<code>text-align: left</code>) for
          instructional content. Justified text creates irregular gaps between
          words-known as rivers of white-that disrupt saccadic eye movement.
        </CalloutBox>
      </section>

      <section aria-labelledby="measure-rhythm">
        <h2 id="measure-rhythm">2. Optimal Measure &amp; Rhythm</h2>
        <p>
          Lines that stretch across wide monitors force excessive horizontal head
          and eye travel, making it easy to lose your place on the return sweep.
          Constraining the primary reading column to <code>65ch</code> keeps
          lines within the 50–75 character sweet spot.
        </p>

        <CalloutBox variant="formula" title="WCAG 2.1 AAA Contrast Formula">
          Relative luminance contrast must reach at least <strong>7:1</strong>{" "}
          for body text: <code>(L1 + 0.05) / (L2 + 0.05) &gt;= 7.0</code>.
        </CalloutBox>
      </section>

      <section aria-labelledby="anti-halation">
        <h2 id="anti-halation">3. Anti-Halation Contrast</h2>
        <p>
          Pure black (<code>#000000</code>) and pure white (<code>#FFFFFF</code>)
          create harsh luminance extremes that trigger halation-especially for
          readers with astigmatism. Off-white slate (<code>#F8FAFC</code>) paired
          with deep slate ink (<code>#1E293B</code>) preserves crispness without
          glare.
        </p>

        <ComparisonTable
          caption="Anti-Halation Palette Tokens"
          headers={["Mode", "Background", "Primary Text", "Secondary Text"]}
          rows={[
            ["Light Anti-Halation", "#F8FAFC", "#1E293B", "#475569"],
            ["Dark Anti-Halation", "#0F172A", "#E2E8F0", "#94A3B8"],
          ]}
        />

        <h3 id="code-clarity">4. Code &amp; Numeric Clarity</h3>
        <p>
          Technical learners frequently switch between prose and code. Pairing{" "}
          <code>Plus Jakarta Sans</code> with <code>JetBrains Mono</code>{" "}
          ensures unambiguous character shapes across <code>0</code>,{" "}
          <code>O</code>, <code>1</code>, <code>l</code>, and <code>I</code>.
        </p>

        <CodeBlock
          language="ts"
          title="contrast-ratio.ts"
          code={SAMPLE_CODE}
        />
      </section>
    </ArticleLayout>
  );
}
