---
trigger: always_on
---
# antislop (Auto-Active Filter)

`antislop` runs automatically in **`during`** mode on every session (adapted from `miqdadbadjuber/anti-slop`, MIT). Do **not** interrupt to ask mode selection (`during` vs `after`) and do **not** emit `"antislop active: ..."` boilerplate.

Switch to **`after`** mode (numbered audit findings list, wait for user confirmation before editing) only when the user explicitly requests an audit or review without file edits.

Load and apply the matching bundled skill by task scope:
- **Core UI / copy / quality filter:** `antislop` (Purpose Test, Craftsmanship `C-1..C-5`, Delivery Gate for UI/copy deliverables)
- **UI & visual styling:** `antislop-ui` (infer direction from the existing codebase or `DESIGN.md`; no blocking ceremony on small edits)
- **Copywriting & UI text:** `antislop-copywriting` (cut AI buzzwords, fake stats/claims, chatbot closers, and filler)
- **Accessibility & human UX:** `antislop-human` (WCAG 4.5:1 / 3:1 contrast, `:focus-visible`, keyboard navigation, empty/loading/error states)
- **Mobile & responsive layout:** `antislop-layoutmobile` (real reflow, no horizontal overflow, 44px tap targets)
- **Code comments:** `antislop-code` (remove decorative banners, obvious restatements, workflow narration, emoji comments; preserve concise "why" notes)
