# Automated OKLCH Design Token Generator

A zero-dependency, single-file generator that derives a complete, perceptually
uniform semantic color system from one brand color — computed in OKLCH, not
guessed in hex. It is a precision tool, not a palette picker: every token is
mathematically derived, gamut-checked against sRGB, and available in
wide-gamut Display P3 as a progressive enhancement.

## Core model

Give it one brand color. It reads that color as a **structural signature**
in OKLCH space — lightness, chroma held as a percentage of the hue's own
gamut ceiling ("intensity"), and lift from the hue's natural peak lightness
— and reissues that signature across every semantic role. Because intensity
is stored relative to each hue's own ceiling rather than as an absolute
chroma value, the resulting family reads as one system even though hues
like yellow and blue can support very different amounts of saturation at
the same lightness.

Every role expands into an 11-stop lightness ladder (`50`–`950`). Any stop
can be locked to hold an exact value through regeneration; its neighbors
re-smooth around the lock so the rest of the ramp stays coherent. A separate
dark-mode ladder is generated per role rather than derived by inverting the
light one — chroma is pulled down at high lightness (saturated light text
vibrates against dark surfaces) and the neutral tint leans further toward
the brand.

### Perceptual safety, automatically enforced

- **Role collision guarding** — semantic roles (error/warning/success/info)
  sit at fixed anchor hues, pulled toward the brand hue only within a
  bounded window and only when the brand is within 90° of the anchor. If two
  resolved roles land within `ΔEOK < 0.10` of each other in OKLab, the tool
  rotates one away in 3° steps until they're perceptually distinct, and
  surfaces a note explaining what moved and why.
- **CVD survival check** — error and success are additionally verified to
  stay distinguishable under simulated deuteranopia; if they collide, error
  is darkened and success lightened in lockstep until they clear a `ΔEOK`
  threshold under the color-blind simulation, not just in full color.
- **Contrast auto-correction** — each role's `600` stop is walked darker in
  small steps until it clears 4.5:1 against that role's own `50`, so the
  mid-range "text on tint" stop is never silently non-compliant.

## Interface features

The app is a single scrollable workspace with a live-updating inspector,
organized into ten sections:

| Section | What it does |
|---|---|
| **Family signature** | The five extracted properties (intensity, lift, hue, chroma envelope peak/steepness, blue-hue drift correction) as directly editable sliders — override any of them and every ramp below regenerates immediately. |
| **Brand ramp** | The 11-stop ladder derived from the signature, with per-stop locking. |
| **Semantic system** | Error, warning, success, and info ramps, each with tunable anchor hue and pull strength toward the brand, plus live notes when the collision guard or CVD check has to intervene. |
| **Neutrals** | Pure (zero-chroma) or hue-tinted neutral, warm, and cool ramps — the warm/cool pair sit ±40° off the brand hue. |
| **Accents** | Non-semantic hues placed directly in OKLCH hue space, via analogous, split-complementary, triadic, tetradic, or an N-hue wide-sweep scheme. |
| **Light and dark** | Both ladders for every role, shown side by side. |
| **Live preview** | A mock UI (buttons, fields, a table, a bar chart, toasts) rendered from the live token set, in light or dark, so the system can be judged in context rather than as isolated swatches. |
| **Accessibility** | A full contrast matrix (every stop against every other stop in a chosen ramp) toggled between WCAG 2.1 ratios and APCA `Lc`, plus a color-vision-deficiency simulator applied to the entire interface. |
| **Analyze an existing palette** | Paste arbitrary hex values to read their OKLCH structure and get a diagnosis of what's inconsistent (intensity spread, uneven lightness steps, hues sitting in the low-chroma cyan trough) — or **harmonize** them onto the current signature while preserving each hue. |
| **Export** | Seven output formats, generated live from current state. |

### Input methods

The brand-color field accepts `#hex` (3/4/6/8-digit), `rgb()`/`rgba()`,
`hsl()`/`hsla()`, `oklch()`, and CSS named colors — parsed without a lookup
table (named colors are resolved via a throwaway `<canvas>` fill). Two
additional capture methods are available as progressive enhancements:

- **Pick from screen** — the native [`EyeDropper`](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper) API, shown only when the browser supports it.
- **From image** — upload an image; it's downsampled to a 72px-wide canvas
  and clustered into 6 dominant colors with k-means run directly in OKLab
  space (14 iterations), so the extracted swatches reflect perceptual color
  groups rather than raw pixel frequency.

### Persistence and sharing

Working state autosaves to `localStorage` (debounced) and restores on
reload. Up to 8 named snapshots can be saved separately and reloaded from
the sidebar. A "Share link" action base64-encodes the entire state object
into the URL hash, so a fully reproducible system can be sent as a link with
no backend involved.

## Export formats

All seven formats are generated from the same live token list on demand —
nothing is pre-baked:

| Format | Output |
|---|---|
| **CSS** | `:root` custom properties as hex, with an `@supports (color: oklch(...))` block upgrading every token to native `oklch()`, and an optional `@media (color-gamut: p3)` block emitting `color(display-p3 ...)` values. |
| **Tailwind v4** | A `@theme { --color-*: oklch(...) }` block, ready to drop into Tailwind's CSS-based config. |
| **SCSS** | One Sass map per ramp (`$brand: (50: #.., 100: #.., ...)`). |
| **JSON** | Flat `{ "brand-500": "#.." }`. |
| **JSON (nested)** | Grouped by ramp: `{ "brand": { "500": "#.." } }`. |
| **DTCG** | [Design Tokens Community Group](https://design-tokens.org/) format — `$type`/`$value`/`$description` per token, the description carrying the exact OKLCH triple, under the standard `$schema`. |
| **SVG sheet** | A single self-contained swatch sheet, every ramp as a row, with hex labels colored for legibility against their own swatch. |

Dark-mode tokens are included in every format alongside light. Copy-to-
clipboard and syntax highlighting (comments, tokens, color literals) are
built in.

## Color science under the hood

- **sRGB ↔ OKLCH** via the reference OKLab matrices (linear sRGB → LMS →
  cube-root nonlinearity → OKLab → polar OKLCH), implemented from scratch —
  no color library.
- **Gamut mapping** by binary search: `maxChroma(L, H)` bisects on chroma
  (28 iterations) to find the exact in-gamut ceiling for a given lightness
  and hue before converting to sRGB, so no color silently clips.
- **Display P3** conversion via the OKLab → CIE XYZ (D65) → linear P3 →
  P3 transfer-function path, used for the P3 export upgrade block.
- **WCAG 2.1** relative-luminance contrast ratios *and* **APCA** perceptual
  lightness contrast (`Lc`), computed and shown side by side, because WCAG
  is known to misjudge light-text-on-dark-background pairs that APCA
  handles correctly.
- **ΔEOK** — Euclidean distance in OKLab — used as the perceptual-distance
  metric for both the semantic-role collision guard and the palette-analysis
  diagnostics.
- **CVD simulation** via the Viénot–Brettel–Mollon LMS transform, applied in
  linear RGB, covering protanopia, deuteranopia, tritanopia, and
  achromatopsia — applied as a live SVG `feColorMatrix` filter over the
  *entire* interface (including its own chrome), not just the swatches.
- **Self-verifying on load**: a boot-time self-test round-trips 400 random
  hex colors through `hex → OKLCH → hex` and reports whether the conversion
  was lossless, alongside a live readout of the derived semantic hue and
  intensity delta — visible at the bottom of the page as a running canary.

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
manager. The only external dependency is Google Fonts for typography; the
`EyeDropper` capture method degrades gracefully in browsers that don't
support it.
