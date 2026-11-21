---
name: codegen-help
description: Quick reference guide for all /codegen skills, workflow phases, PR creation, antislop, and memory commands.
---

# /codegen-help — Command & Skill Reference

Present this concise reference when the user asks what `/codegen` can do or which skill to use.

## 1. End-to-End Autonomous Pipelines
- **`/codegen <task>`** — Full structured pipeline (`recall` → `architect` → `impact` → `build` → `review` → `ship`).
- **`/codegen-auto-pilot <task>`** — Autonomous `/codegen` pipeline that dynamically detects and loads other relevant domain skills and MCP tools.

## 2. Single-Phase Engineering & Git Workflow
- **`/recall <topic>`** — Search `codegen-memory` for preferences, past decisions, and project context.
- **`/architect <task>`** — Clarify ambiguities/edge cases and draft a technical blueprint.
- **`/impact`** — Analyze blast radius of the plan on existing code, callers, and tests before editing.
- **`/build`** — Implement modular, clean, zero-duplication code.
- **`/review`** — Self-audit diff like a Staff Engineer and run real tests, linters, or builds.
- **`/ship`** — Persist durable decisions to `codegen-memory` and deliver a verified summary.
- **`/create-pr`** — Verify branch/diff/PR template, push safely, and open a GitHub PR via `gh pr create`.

## 3. Anti-Slop Quality Filter (Auto-Active Every Session)
Adapted from `miqdadbadjuber/anti-slop` (MIT) and auto-activated in `during` mode via always-on rules installed by `codegen init`:
- **`/antislop`** — Core filter (Purpose Test, Craftsmanship `C-1..C-5`, Delivery Gate).
- **`/antislop-ui`** — UI/visual hierarchy, color, components, and motion checks.
- **`/antislop-copywriting`** — Product prose, headlines, CTAs, and cutting AI marketing buzzwords.
- **`/antislop-human`** — Accessibility checks (WCAG contrast script, keyboard focus, empty/loading/error states).
- **`/antislop-layoutmobile`** — Responsive breakpoints, grid reflow, overflow, and tap targets.
- **`/antislop-code`** — Code comment hygiene (strip decorative separators/narrations, keep concise "why" comments).

## 4. Memory Management
- **`/remember <info>`** — Save an atomic knowledge node (`node_type`, `links`, `tags`) without duplicates.
- **`/update-memory`** — Update an existing memory node in-place by `memory_id`.
- **`/forget`** — Find and delete obsolete or incorrect memory nodes.
- **`/codegen-memory`** — Guidelines for tagging, sizing, and organizing memory nodes for clean retrieval and `Session Context` TUI display.

## 5. Handoff, Setup, & Stress Testing
- **`/handoff`** — Save or resume an active workflow checkpoint when switching agents or sessions.
- **`/codegen-setup`** — Set up and verify the full `codegen` ecosystem (Go CLI, MCP, ChromaDB, skills, TUI).
- **`/setup-codegen-memory`** — Troubleshoot `codegen-memory` MCP server, ChromaDB path scoping, and MemoryTUI.
- **`/the-opposite`** — Adversarial red-team mode to challenge assumptions or stress-test tests and `/review`.
