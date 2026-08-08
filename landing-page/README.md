# Landing page

The Readyset marketing page, built on the *Operational Calm* brand system in `../DESIGN.md`.

`dist/index.html` is a **single self-contained file** — fonts, GSAP and imagery are
base64-inlined. It has zero external requests, so it runs under a strict CSP and
works offline, straight off the filesystem.

The repo root `index.html` is a copy of `dist/index.html`, so `/` serves this page.

## Build

```sh
cd landing-page
node src/build.mjs      # → dist/index.html
```

Then copy it to the site root:

```sh
cp dist/index.html ../index.html
```

No dependencies, no install step. Node 18+.

## Layout

| Path | What it is |
|---|---|
| `src/index.html` | The page you edit. Contains `/*__FONTS__*/`, `/*__GSAP__*/` and `__IMG_0n__` tokens. |
| `src/build.mjs` | Inlines everything and writes `dist/index.html`. |
| `src/brand.html` | The brand-system page (`/brand/`). Same tokens, no GSAP. |
| `src/build-brand.mjs` | Builds `dist/brand.html` → copy to `../brand/index.html`. |
| `src/inline-fonts.mjs` | Regenerates `assets/fonts-inline.css` — only needed if the typefaces change. |
| `src/fonts.css` | The Google Fonts CSS the font script parses. |
| `vendor/` | GSAP 3.12.5 core + ScrollTrigger, vendored because CDNs are blocked. |
| `assets/fonts-inline.css` | Space Grotesk 500/700, Inter 400/500, IBM Plex Mono 400/500 — latin subsets, base64. |
| `assets/img/` | Optimised JPEGs (840px, q82) that get inlined. |
| `assets/originals/` | Source PNGs at 928×1152, kept for re-export. |

## Two traps worth knowing

**1. Replace with a function, not a string.** `String.replace` expands `$&` and
`` $` `` inside the *replacement* text, and GSAP's minified source contains those
sequences. A string replacement silently corrupts the bundle — it still parses,
then fails at runtime. `build.mjs` passes replacer functions for this reason.

**2. `[hidden]` loses to any `display` rule.** The work-order fields are shown and
hidden with a `.solved` class, not the `hidden` attribute, because
`.got{display:block}` out-specifies the attribute's user-agent style.

## Regenerating the fonts

Only if the typefaces change:

```sh
cd landing-page/src
curl -A "Mozilla/5.0" \
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap" \
  -o fonts.css
node inline-fonts.mjs     # writes ../assets/fonts-inline.css
```

## The brand page

`/brand/` recreates the *Brand Identity System* deck (originally built in Gemini
Canvas — linked at the bottom of the page) as a native, self-contained page:

```sh
cd landing-page
node src/build-brand.mjs      # → dist/brand.html
cp dist/brand.html ../brand/index.html
```

It reuses `assets/img/01–04` and the inlined fonts; it's linked from the
landing nav ("Brand system") and footer.

## The reel page

`src/reel.html` builds to `../reel/index.html` in the same run. It's a
standalone placeholder that shows the reel once `reel/reel.mp4` exists —
see `reel/README.md`.

## Founder portraits

Two slots are waiting in the founders section. Drop portraits at
`assets/img/06-founder-a.jpg` and `assets/img/07-founder-b.jpg`, replace the
`.fo-slot` placeholder divs in `src/index.html` with
`<img src="__IMG_06__" alt="…">`, fill in the names, and rebuild. The build
matches images to tokens by filename prefix and skips any image whose token
isn't in the page yet, so adding files early is harmless.

4:5 crop, desaturated — the page applies its own duotone.

## Re-exporting imagery

Source PNGs live in `assets/originals/`. To regenerate the inlined JPEGs (macOS):

```sh
cd landing-page/assets
for f in originals/*.png; do
  sips -s format jpeg -s formatOptions 82 -Z 840 "$f" --out "img/$(basename "${f%.png}").jpg"
done
```

840px is 2× the largest display size. The page applies its own duotone (greyscale
+ `mix-blend-mode: luminosity` over Spruce), so **source images should be
desaturated** — saturated originals fight the grade.

## Content accuracy

Two claims on this page were checked against live competitors and are worded
carefully. Please don't loosen them:

- We do **not** claim nobody reads inbound email. Re-Leased ("Credia Action")
  does, in Australia, today. The page names it.
- The defensible claim is **cross-channel duplicate reconciliation** — verified
  absent from ServiceChannel, Corrigo, Building Engines and Ecotrak.

The "What's real, and what's staged" section is deliberate: technical honesty is
part of how the work is judged.
