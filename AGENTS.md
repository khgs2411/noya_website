# Noya Website Agent Guide

This is Noya's public website evolving into a ClassKit-backed class management
platform. Keep changes product-focused, mobile-first, and visually consistent
with the existing brand.

## Product Boundaries

- Use `@class-kit/react` for ClassKit product context, auth, profile, manager,
  class, template, and schedule behavior.
- Do not call Supabase directly from UI components.
- Do not call raw ClassKit Edge Functions from this website.
- This repo owns presentation, page composition, copy, routing, and
  product-specific interaction polish.
- ClassKit owns product identity, auth policy, permissions, manager capability
  checks, and data APIs.

## Implementation Rules

- Follow `DESIGN_GUIDE.md` for visual and interaction decisions.
- Build UI with Tailwind utilities and the existing shadcn-compatible component
  pattern.
- Put reusable primitives in `src/components/ui` or `src/components/site`
  before duplicating styling across feature files.
- Keep route state lightweight unless the app actually needs a router.
- Keep components grouped by domain under `src/features`.
- Keep shared site primitives under `src/components/site`.
- Keep copy localized in `src/i18n.ts` for English, Hebrew, and Russian.
- Prefer existing components and classes before adding new abstractions.
- Do not add global state unless the ClassKit SDK cannot reasonably own it.

## Verification

- Do not use `npm run build` as default verification.
- Do not run `npm run build` after routine UI edits, copy changes, focused
  component changes, or every small change.
- Prefer focused inspection, `rg`, and browser smoke checks on the existing dev
  server for narrow UI fixes.
- Never start or host a dev server without explicit user approval.
- Before browser smoke checks, first check whether a localhost dev server
  already exists and use it when available; otherwise ask the user to provide or
  approve a server.
- Run heavier checks only when TypeScript risk, dependency changes, or broader
  behavior changes justify it, or when explicitly requested.
- If a plan includes `npm run build`, apply judgment before running it. Treat it
  as optional unless the current change actually warrants a full build or the
  user explicitly asks for it.
- Report exactly what was checked and what was skipped.

## Git

- Do not commit, push, rebase, reset, or stage files unless explicitly asked.
- Preserve unrelated worktree changes.
- Avoid broad staging commands such as `git add .`.
