---
name: create-pr
description: Create a clean, well-structured GitHub pull request using git and the gh CLI. Use when the user asks to create a PR, open a pull request, or submit a branch for review.
---

# /create-pr — Create GitHub Pull Request

Follow this workflow to create an accurate, well-structured pull request without fabricated claims or leftover AI filler.

## Steps

1. **Pre-flight checks**
   - Confirm `gh --version` and `gh auth status`. If `gh` is unavailable or unauthenticated, stop and tell the user what to run (`gh auth login`).
   - Check current branch (`git branch --show-current`) and status (`git status --short`).
   - **Never open a PR directly from `main` or `master`.** If currently on `main`/`master`, create a descriptive feature branch (`git checkout -b <type>/<short-slug>`) or ask before committing/pushing.

2. **Inspect branch changes & PR template**
   - Identify the target base branch (default `main` or `master`, or the `--base` branch requested by the user).
   - Review all commits and diff stat going into the PR:
     ```bash
     git log --oneline <base>..HEAD
     git diff --stat <base>...HEAD
     ```
   - Check if a repo PR template exists:
     - `.github/pull_request_template.md`
     - `.github/PULL_REQUEST_TEMPLATE.md`
     - `.github/PULL_REQUEST_TEMPLATE/*.md`
   - If a template exists, follow its exact headings and checkboxes.

3. **Verify before opening**
   - Ensure intended changes are committed cleanly (no accidental untracked/temp files).
   - Check what tests/linters/builds were actually run after the final edit. Never check test boxes or report passing checks unless you directly observed them pass.

4. **Push branch & open PR**
   - Push the current branch with upstream tracking:
     ```bash
     git push -u origin HEAD
     ```
   - Draft a crisp title (`type(scope): short summary` matching repo convention) and a concise body (Summary + Verification/Checks run + Notes if any). Keep prose direct and scannable—no hype or AI buzzwords.
   - Write the PR body to a temporary file and run `gh pr create`:
     ```bash
     gh pr create --title "<title>" --body-file /tmp/gh-pr-body.md
     ```
     Add `--draft` or `--base <branch>` when requested.
   - Clean up `/tmp/gh-pr-body.md` and return the created PR URL.
