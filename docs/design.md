# Design Specification — Automated OKLCH Design Token Generator

## Purpose

A single-file, zero-dependency tool for deriving a complete, perceptually
uniform semantic color system from one brand color, using the OKLCH color
space instead of hex/HSL guesswork.

## Core Model

- **Input**: one brand hex color, read as a structural signature (lightness,
  chroma, hue relationships) in OKLCH.
- **Derivation**: every semantic hue (accent, error, warning, success, info,
  neutral) is reissued from that signature. Intensity is stored as a share of
  each hue's gamut ceiling, so families stay visually consistent even where
  absolute chroma differs by hue.
- **Scales**: each semantic role expands into a full lightness ramp (e.g.
  50–950 steps), computed rather than hand-picked, with optional per-stop
  locking for manual overrides.
- **Collision guarding**: semantic roles that land perceptually too close
  together (via ΔE in OKLab) are nudged apart automatically, with a note
  surfaced to the user.

## Color Math

- `hexToOklch` / `oklchToHex`: sRGB ⟷ OKLCH conversion.
- `oklchToLinear` + gamut check: validates a given L/C/H triple is
  displayable in sRGB before conversion.
- `oklchToP3`: wide-gamut Display P3 output for `@supports (color: oklch(...))`
  progressive enhancement.
- `oklab`: OKLab conversion used for perceptual distance (ΔE) comparisons
  between generated tokens.

## Application Structure

- **Sidebar (nav)**: brand color field, semantic group tree, saved palettes
  (persisted to `localStorage`).
- **Main column**: brand scale, accent scale, semantic system (tunable
  intensity/lift), neutral scale, non-semantic hues placed in OKLCH hue
  space.
- **Inspector**: signature readout for the selected token.
- **Export**: renders the current token set as CSS custom properties (with
  P3 fallback), flat JSON, nested JSON, DTCG-format JSON
  (`https://design-tokens.org/schema.json`), or an SVG swatch sheet.

## State

- Working state is a plain JS object, deep-cloned from a `DEF` default,
  mutated in place, and persisted to `localStorage` plus encoded into the
  URL hash (`base64` of URI-encoded JSON) for shareable links.

## Non-Goals

- No build step, bundler, or external runtime dependency — the generator is
  a single static HTML file (`index.html`) that runs entirely client-side.
- No server-side persistence; all state is local to the browser.
