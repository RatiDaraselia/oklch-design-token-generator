# Build Prompt — Color System Generator

Build a single-file, zero-dependency web tool that generates a complete
semantic color system from one brand color, using OKLCH as the working color
space.

## Requirements

1. **Input**: accept one brand hex color.
2. **Derivation**: read the brand color as a structural signature in OKLCH
   (lightness, chroma, hue) and reissue that signature across every semantic
   role — accent, error, warning, success, info, neutral — plus any
   additional non-semantic hues. Store intensity as a share of each hue's
   gamut ceiling so the family reads as one system regardless of a given
   hue's maximum chroma.
3. **Scales**: generate a full lightness ramp per role (e.g. 50 through
   950), each stop individually lockable for manual override without
   breaking the derived relationships of the rest of the ramp.
4. **Perceptual safety**: detect when two semantic roles land too close
   together (ΔE in OKLab below a threshold) and nudge them apart
   automatically, surfacing a note to the user when this happens.
5. **Gamut correctness**: validate every generated color against the sRGB
   gamut before emitting a hex value; additionally support Display P3 output
   for wide-gamut displays via `@supports (color: oklch(...))`.
6. **Editing surface**: a three-pane layout — navigation sidebar (brand
   field, semantic tree, saved palettes), a main working column (scales,
   grouped by role), and an inspector panel showing the OKLCH signature of
   the selected token.
7. **Export**: support at minimum CSS custom properties (with P3
   fallback), flat JSON, nested JSON, DTCG-format JSON
   (`design-tokens.org` schema), and an SVG swatch sheet.
8. **Persistence**: state should survive a reload via `localStorage`, and be
   shareable via a URL-encoded state hash.
9. **Constraints**: no build step, no external JS dependencies — plain
   HTML/CSS/JS in a single file. Google Fonts for typography is the only
   external network dependency permitted.
10. **Theming**: support light and dark mode via a root class toggle,
    redefining the semantic/neutral custom properties per theme rather than
    duplicating component styles.
