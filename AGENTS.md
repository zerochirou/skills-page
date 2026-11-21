<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## UI & Design System Rules

Always read `DESIGN.md` before building or editing any UI, layout, or styling.
- Light-only editorial cream canvas (`#f7f7f4`) with warm near-black ink (`#26251e`) — no dark mode.
- Single brand accent: Cursor Orange (`#f54e00`, active `#d04200`) reserved for primary CTAs and key accents.
- Display typography stays at weight `400` with tight negative letter-spacing; use `JetBrains Mono` / `--font-mono` for code surfaces.
- Hairline-only depth (`1px` `#e6e5e0` borders, white `#ffffff` cards on cream `#f7f7f4` canvas) — no drop shadows.
- Timeline pastels (`#dfa88f`, `#9fc9a2`, `#9fbbe0`, `#c0a8dd`, `#c08532`) are strictly scoped to agent/timeline stage indicators.

