---
name: build-form
description: "Build or review accessible, production-ready form UX: labels, validation, errors, focus, submit behavior. Use when creating or modifying forms and inputs."
license: Apache-2.0
metadata:
  author: noir-nahuel
  version: "2.0"
---

# Build Form

Use the project's existing form stack, design system, language, and conventions. Do not introduce React Hook Form, Zod, or Tailwind unless the project already uses them. Not for static UI without editable fields. References: https://www.w3.org/WAI/tutorials/forms/ and https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Attributes/aria-invalid

## Fields

- Every control has a visible, programmatically associated `<label>` (or `fieldset`/`legend` for groups). Placeholders are never the only guidance; put format examples in helper text.
- Use native types and attributes (`type`, `inputMode`, `autocomplete`, `required`) where they help.
- Helper and error text are associated via `aria-describedby`. Replace or supplement helper text with a specific error for an invalid field.
- Set `aria-invalid="true"` on invalid controls, including individual radio inputs when the group is invalid. Associate the group's error text with the `fieldset` (or each radio) via `aria-describedby`.
- Native radio groups use `<fieldset>` and `<legend>`; keep `name`, `ref`, and `onBlur` bound if a form library manages them.
- Refs are allowed (e.g. to focus the first invalid field).
- On iOS, form controls with font-size below 16px trigger zoom on focus; keep control text at 16px or more on small screens.

## Validation

- No errors on initial render. Show a field's error after blur/touched or after a submit attempt.
- Validate on submit before sending; if invalid, do not submit, and move focus to the first invalid field or to an error summary that links to the invalid fields. Make the summary announced (e.g. `role="alert"` or focus on it).
- Trim and normalize values before validating, keeping displayed values user-friendly. Validate each field by its domain meaning (e.g. email format, numeric ranges, locale-appropriate names and phones); avoid restrictive universal patterns that reject real values.
- Preserve cursor position, paste, and IME composition: do not rewrite `event.target.value` mid-typing. Normalize on blur or submit, or via controlled state that retains the caret. Apply live formatting masks only when required.
- Duplicate submits: this is separate from validation feedback. Keep the submit button available for validation feedback. Once a valid submission is in flight, block repeat submits (guard the handler, not only `disabled`) and expose a pending state (`aria-busy` or status text).
- Repeat the same rules on the server; show server errors per field when possible, otherwise as a summary. Do not rely on client validation for security.

## Behavior and structure

- Fully keyboard operable: logical tab order, Enter submits, visible focus.
- Mark invalid state with the design system's error token and not by color alone (text or icon too).
- Split large forms into section components when they become hard to read; keep field-array errors attached to a focusable section.
- When the backend is missing or mocked, still implement real validation, pending, success, and error states and state the mock assumptions.
