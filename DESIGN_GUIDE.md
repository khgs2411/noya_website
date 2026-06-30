# Noya Website Design Guide

This guide documents the current visual system. New product surfaces should feel
like part of Noya's Flow, not like a generic SaaS dashboard.

## Design Direction

- Mobile first. Build the mobile layout first, then widen it with responsive
  grids.
- Warm, intimate, studio-like, and editorial. Avoid generic admin dashboards,
  oversized marketing cards, and decorative gradients that do not come from the
  existing system.
- Product pages should still feel branded: use real dance imagery, soft borders,
  warm surfaces, and restrained controls.
- Keep layouts calm and scannable. Dense manager tools are allowed later, but
  they should still use the same typography, color, spacing, and control style.

## Typography

- Body text: Montserrat.
- Serif headings and menu rows: Cormorant Garamond via `font-serif`.
- Brand/display script: Story Script via `font-display`.
- Eyebrows: uppercase, semibold, wide tracking, blush or muted foreground.
- Do not use viewport-width font scaling.
- Do not use negative letter spacing.
- Long values such as email addresses must wrap safely with `min-w-0` and
  `[overflow-wrap:anywhere]`.

## Color And Surfaces

- Use the theme tokens in `src/index.css`; do not introduce one-off hex colors.
- Core surfaces use `bg-background`, `bg-card/78`, `bg-background/42`, and
  blush borders.
- Primary actions use blush fills and rounded pills.
- Secondary actions use transparent or background-tinted outline buttons.
- Keep dark and light themes supported through the existing CSS variables.

## Shape, Spacing, And Layout

- Default page padding: `px-5` on mobile, `sm:px-8` when widened.
- Main content width: usually `max-w-5xl` for app pages and `max-w-6xl` for the
  landing page.
- Cards and framed sections use about `rounded-[1.4rem]` for large feature
  panels and `rounded-xl` for inner rows.
- Do not nest decorative cards inside decorative cards.
- Use stable dimensions for icon buttons, menu controls, and fixed-format rows.
- Avoid overlapping text and controls at all breakpoints.

## Imagery

- Use actual Noya/dance imagery from `src/content/site-content.ts`.
- Account and manager pages should use image-led split layouts on larger
  screens and stacked layouts on mobile.
- Use grayscale imagery with a warm background gradient overlay when text is
  placed on top.
- Image panels are decorative unless the image carries meaningful page content;
  keep decorative `alt=""`.

## Navigation And Controls

- The hamburger menu is a branded side panel, not a plain system drawer.
- Menu rows use the same serif typography. If a row is a `button`, apply the
  typography to the inner label too because global button font reset can override
  Tailwind utilities.
- Use lucide icons for standard controls.
- Use icon buttons for theme, language, account, close, and menu controls.
- Account and manager access should be capability-aware:
  - signed-out account entry goes to auth
  - signed-in account entry goes to profile
  - management is visible only when ClassKit says the user can enter

## Tailwind And shadcn

- Use Tailwind utilities for layout, spacing, responsive behavior, and visual
  polish.
- Use the existing shadcn-compatible setup from `components.json`.
- Prefer `src/components/ui` primitives for controls and `src/components/site`
  primitives for branded website patterns.
- Use `cn` from `src/lib/utils.ts` when composing conditional classes.
- Keep shadcn primitives visually adapted to this brand; do not drop in default
  neutral dashboard styling without applying the site typography, blush borders,
  rounded surfaces, and theme tokens.
- Add new shadcn primitives only when they solve a real reusable interaction.
  Do not add a dependency for a one-off layout.

## Account And Manager Pages

- Account/profile pages should explain what a student or client understands:
  email, class access, studio, sign out.
- Do not expose raw permissions or capability lists to end users.
- Manager pages are separate from profile pages.
- Manager access is gated by `capabilities.dashboard.can_enter`.
- Manager UI should start from the same branded shell before adding operational
  class, template, and schedule tools.
- Manager list and calendar surfaces should stay focused on browsing and quick
  actions. Item details should open in an overlay surface instead of expanding
  inline into the main view.
- Use a mobile bottom drawer for item details and a compact dialog-style surface
  on wider screens. The surrounding backdrop should close the surface on blur;
  clicks inside the drawer/dialog must not close it.

## Internationalization

- Every visible string must exist in English, Hebrew, and Russian.
- Hebrew layouts must remain RTL-safe.
- Icons that imply direction should account for RTL when needed.

## ClassKit UI Boundary

- Use ClassKit SDK state and methods from `@class-kit/react`.
- The website decides visibility, copy, and layout.
- The SDK/backend remain authoritative for auth mode, signup policy, manager
  access, and data authorization.
