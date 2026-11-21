---
name: imagegen-frontend-web
description: Direct and generate website design reference images, one separate horizontal image per section, with a coherent brand, palette, and typography across frames. Use for landing pages, marketing sites, and product comps that developers can recreate. Outputs reference images, not code.
disable-model-invocation: true
---

# Frontend design reference images

## Output contract

- Generate **one separate horizontal image per section** (16:9, 16:10, or 21:9). Never combine sections into one image, a tall page strip, a collage, or a single "best" image.
- **Section count**: use an explicit user count when given. Otherwise: one section or "hero" = 1; "landing page", "site template", "product page", or "portfolio" = 6; "full website" or "marketing site" = 8. If the brief conflicts with a default, the brief wins.
- **Announce the plan first**: "Generating N horizontal images, one per section", then label each result "Section X of N: <name>". Deliver all N; the count of images must equal N.
- The images are **visual references** for developers or coding models to implement from. Do not output frontend code unless asked, and do not make abstract mood art.

## Generator capability

Use only an image generator actually available in this session. If none is available, or a call fails, say so plainly and stop, without claiming images exist, linking images that do not exist, or switching silently to text. Diagnose a failure before any retry; do not retry in a loop. Offer per-section prompts and layout specifications only as an explicitly labeled fallback, and provide them only if the user wants them. If the generator can render only one image per call, make the calls sequentially.

## Workflow

1. **Infer** site type, audience, conversion goal, and the brand's real name, product, and copy. Do not ask unnecessary questions when a strong interpretation exists; do not invent claims, statistics, or customer names as facts.
2. **Fix the section list** (see `Default packs`) and announce the count.
3. **Define one design system** to reuse in every frame:
   - Palette: brand anchor, supporting tone, one sparing accent, neutral scale. Background images must match it; no per-section theme swap.
   - Typography: one family or pairing with a consistent scale and hierarchy.
   - Shared CTA family, corner-radius language, spacing logic, and image treatment (grade, framing, materials), and a consistent icon or illustration mood.
4. **Pick the page-level choices**: hero scale (giant statement, mid editorial, or mini minimalist; commit to one), a narrative spine, and optionally one "second-read" motif that aids scan order or recall.
5. **Per section**, choose a composition anchor, background mode, and CTA style. Vary these across sections while keeping the brand identity.
6. **Generate each section's image**, then run the check below.

## Design direction

- Make each frame readable as a real website section: clear layout, hierarchy, spacing, type scale, CTA priority, component styling, and image treatment.
- Each section has a job (hook, proof, explain, convert). The hero opens with a short, strong headline and one obvious action, with room to breathe.
- Avoid defaulting to left-text / right-image everywhere. Alternatives: centered statement, text over a full-bleed image, bottom-left or bottom-right text, top-left lead, stacked center, inverted split, off-grid editorial, image as canvas. Vary anchors in proportion to the section count and brief; avoid repeating one more than twice in a row when appropriate.
- Vary background modes (solid with inline asset, texture, full-bleed image with a readability overlay, editorial split, color block, tonal gradient, duotone). Use real imagery as a core material and vary crops. Honor restraint when the brief asks for minimalism or typography-only.
- Keep spacing generous and even; mix a few dense sections with calmer ones.
- Avoid AI tells: purple-blue glow, floating blobs, gradient headlines, stacked glassmorphism, identical card rows, decorative filler, fake dashboards or KPI strips, unreadable logo tickers, and clichés such as "unleash", "elevate", "seamless", or placeholder brands like "Acme" or "Nexus". Charts appear only when the site type needs them.
- Match the industry or region named in the brief. Keep tap-friendly sizes and readable captions visually.

Optional ideas for components, backgrounds, and narrative spines: `references/inspiration.md`. Pick from it only when it serves the brief.

## Default packs

- 4: hero, features, proof, CTA.
- 6: hero, trust or proof, features, product showcase, testimonials or pricing, CTA.
- 8: hero, trust bar, features, product showcase, benefits or use cases, testimonials, pricing, CTA.
- 12: hero, trust bar, problem/solution, features, product showcase, benefits or use cases, workflow, metrics or integrations, testimonials, pricing, FAQ, CTA with footer.

Adapt names and order to the brief.

## Check before delivering

- Count equals N, and every image is one horizontal section.
- Palette, type, CTA family, and image treatment match across all frames.
- Hierarchy is clear and the section is implementable from the image.
- Composition and backgrounds vary without breaking the brand.
- No AI-slop patterns or invented facts. Text in images is spelled correctly and legible.

If a frame fails a check or the count is short, correct only the affected sections using the active generator's authorization and retry rules. If another call is not permitted, request the necessary approval and report the partial delivery; never claim the missing images exist.
