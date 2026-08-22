# Automated OKLCH Design Token Generator

A zero-dependency, single-file generator that derives a complete, perceptually
uniform semantic color system from one brand color — computed in OKLCH, not
guessed in hex.

## What it does

Give it one brand color. It reads that color as a structural signature in
OKLCH space and reissues it across every semantic role — accent, error,
warning, success, info, and neutral — each expanded into a full lightness
ramp. Intensity is held as a share of each hue's gamut ceiling, so the
system stays consistent across hues even where absolute chroma capacity
differs. Roles that land perceptually too close together are detected via
OKLab distance and nudged apart automatically.

This is a precision tool, not a palette picker: every token is
mathematically derived, gamut-checked against sRGB, and available in
wide-gamut Display P3 as a progressive enhancement.

## Output

Export the resulting token set as:

- CSS custom properties (with P3 fallback via `@supports`)
- Flat JSON
- Nested JSON
- **DTCG-format JSON** (`design-tokens.org` schema) for direct interop with
  design token pipelines
- An SVG swatch sheet

State persists to `localStorage` and encodes into the URL for shareable
links — no backend, no build step.

## Running it

Open [`index.html`](index.html) directly in a browser. There is nothing to
install and nothing to build.

## Documentation

- [`docs/design.md`](docs/design.md) — design specification and internal
  model
- [`docs/color-system-builder-prompt.md`](docs/color-system-builder-prompt.md)
  — the original build specification

## Stack

Plain HTML, CSS, and JavaScript. No framework, no bundler, no package
manager. The only external dependency is Google Fonts for typography.
