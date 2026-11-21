---
name: redesign-existing-projects
description: Improve the design of an existing website or app by auditing real defects first, then making targeted changes that preserve its brand, content, behavior, and stack.
disable-model-invocation: true
---

# Redesign existing projects

## Principles

- **Diagnose before changing.** Read the code and, when possible, the running UI. Identify the framework, styling system, design tokens, components, and brand assets, plus the project's goals and constraints (ask only if these cannot be inferred).
- **Preserve.** Keep the brand identity, real content, data, copy, URLs, behavior, and tech stack. Do not migrate frameworks or styling libraries, or add dependencies, without need and approval. Check the dependency file before importing anything and the version (for example Tailwind v3 vs v4) before touching config.
- **Do not fabricate.** Never invent statistics, customer names, testimonials, logos, reviews, dates, contact details, or legal/privacy/cookie text. Use clearly marked placeholders or report the gap. Missing legal pages or consent mechanisms are findings for the owner; add them only when the user supplies the content and requirements.
- **Do not force a style.** Fonts, colors, icon sets, layout symmetry, animation, and component patterns change only when the existing ones fail a stated goal or an objective check, or the user asks. "Generic" or "common" alone is not a defect; consistency with the existing design system is the default.
- **Keep changes small and reviewable**, and verify existing functionality still works after each change.

## Audit, in priority order

1. **Accessibility**: text contrast of at least 4.5:1 (3:1 for large text), and 3:1 for UI components and focus indicators; visible `:focus-visible` states; full keyboard operation; semantic landmarks and headings; meaningful alt text; labels and error association on forms; skip link where the page has repeated navigation.
2. **Responsive behavior**: works from narrow phones to wide screens; no horizontal overflow; sensible max-widths; touch targets sized for fingers. Where mobile browser toolbars cause a real viewport defect in a full-screen section, consider `svh` for a stable small viewport or `dvh` for the changing viewport (which may cause resizing), while preserving layout constraints rather than automatically changing fixed heights to minimum heights.
3. **States**: hover, active, focus, disabled, loading, empty, error, and success; current-page indication; no dead `#` links; real validation instead of `alert()`.
4. **Motion**: keep it purposeful; honor `prefers-reduced-motion: reduce`; animate `transform` and `opacity` rather than layout properties; do not hijack or alter native scrolling.
5. **Hierarchy and consistency**: type scale, line length (around 65 characters for body text), spacing rhythm, alignment of repeated elements (card buttons, prices), consistent radius, shadows, and icon weight. `text-wrap: balance` for headings and `pretty` for body text, `tabular-nums` for data columns.
6. **Code quality that affects users**: semantic HTML, no inline-style sprawl, relative units, clean z-index scale, correct `<title>`, description, and social metadata, favicon.
7. **Copy**: replace Lorem ipsum and unhelpful error messages with plain, specific wording drawn from the product's real facts; keep the project's voice.

## Output

Report findings by severity with file locations. An audit-only request authorizes a report only; apply fixes only within the user's existing authorization or requested implementation. Visual enhancements (texture, depth, richer surfaces, motion, new layout) are optional: propose them only when they serve the project's goals and fit its brand, and keep them consistent with accessibility and performance. Mention what you changed, what you left for the owner, and what you verified.
