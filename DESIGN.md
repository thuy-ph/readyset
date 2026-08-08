# Design

## Theme

Monochromatic green system — depth, not variety. All contrast comes from tonal steps of one hue plus a warm off-white. No pure white anywhere. Light "Paper" page frame; the demo app stage runs dark (Ink) like a product screen at 7am.

## Colour Palette

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#0B211B` | Near-black green; primary text on light, dark stage background |
| `--spruce` | `#14382E` | Deep brand green; panels, logo on light |
| `--field` | `#5E7A6D` | Muted sage; secondary surfaces, borders, muted text on light |
| `--signal` | `#2FD284` | The "ready" accent. ONLY for: ready status, hero metric, primary CTA. Never decorative |
| `--paper` | `#F5F2E9` | Warm off-white; light backgrounds, text on dark |

Usage rule: ~60% paper, ~30% dark greens, <10% signal.
Semantic extras (demo states): amber `#E8A13D` for waiting/escalated, red only inside the emergency tag.

## Typography (all Google Fonts)

- **Space Grotesk** (500/600) — headlines, wordmark (lowercase "readyset"), large numerals.
- **Inter** (400/500/600) — body and UI text.
- **IBM Plex Mono** (400/500) — the system voice: IDs (`WO-4831`), timestamps, field labels (`SITE`, `ZONE`, `ACCESS`), status tags (`READY`). Small and sparing.

Scale: product register — fixed rem scale, ratio ~1.2. Hero numeral is the one large display moment.

## Logo

Monoline mark: a letter **r** whose leg resolves into a forward arrow (vague report in → ready order out). Stroke weight matched to wordmark. Wordmark lowercase Space Grotesk.

## Components

- **Status tags** (mono, uppercase): `INCOMPLETE` (field-muted), `WAITING` (amber outline), `DUPLICATE?` (amber), `READY` (signal solid, ink text), `ESCALATED` (amber solid), `SENT` (spruce outline).
- **Field rows**: mono label + Inter value; missing = dashed underline + muted; filled-by-reply animates to confirmed.
- **Agent timeline**: quiet feed of agent actions with reasoning lines; drafts render as message cards.
- **Human gate buttons**: the only pulsing elements on the page; signal green for the approve moment.

## Motion

150–250ms state transitions, ease-out. Typing/streaming effects only in the agent feed. Autoplay pauses at human gates. `prefers-reduced-motion`: instant state swaps, no typing effect, no pulse.
