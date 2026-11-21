# Contributing to skills-page

Thank you for your interest in contributing to **skills-page**!

## Getting Started

1. Fork the repository and create a new branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Install dependencies with `pnpm`:
   ```bash
   pnpm install
   ```
3. Copy `.env.example` to `.env`, configure the required variables, and apply local D1 migrations:
   ```bash
   cp .env.example .env
   pnpm db:migrate:local
   ```
4. Start the development server:
   ```bash
   pnpm dev
   ```

## Project Conventions

- **File Naming:** Use `kebab-case` for all component, hook, service, and utility files (e.g., `skill-settings-sheet.tsx`, `public-skill.service.ts`).
- **Design System:** Follow [`DESIGN.md`](./DESIGN.md) for all UI, layout, and styling changes:
  - Light canvas (`#f7f7f4`) / dark canvas (`#141411`) with `1px` hairline borders and no drop shadows.
  - Reserve Cursor Orange (`#f54e00`) for primary CTAs and key accents.
  - Use `JetBrains Mono` (`font-mono`) for code/index surfaces.
- **UI Primitives:** Use existing shadcn/ui components (`@base-ui/react` / Radix) in `src/components/ui/` and prefer the `render` prop on Base UI triggers instead of `asChild`.

## Quality Checks

Before opening a pull request, make sure type checking and linting pass (these are also enforced by Husky pre-commit/pre-push hooks):

```bash
pnpm typecheck
pnpm lint
```

## Pull Request Process

1. Keep commits focused and descriptive (e.g., `feat(editor): ...`, `fix(dashboard): ...`, `docs: ...`).
2. Ensure `pnpm typecheck` and `pnpm lint` pass with 0 errors.
3. Describe what changed, why, and include screenshots for UI updates.

## License

By contributing to this project, you agree that your contributions will be licensed under the [GNU General Public License v3.0](./LICENSE).
