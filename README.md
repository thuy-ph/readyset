# readyset

**From reported to ready.** Readyset is an intake/clarification layer for commercial property facilities teams. It sits in front of the work-order system you already use: reads maintenance requests from every channel (email, phone, SMS, portal), extracts the fields that stall a job, asks the requester one clarifying question, flags likely duplicates without merging them, and hands a human a dispatch-ready work order.

**Hero metric — Time-to-Ready: 2.4 days → 4 minutes.**

Hackathon prototype. All demo data is simulated and fictional.

## Live site

- `/` — landing page
- `/demo/` — interactive demo of the core loop: multi-channel intake → AI field extraction → **auto ask-back** → **duplicate detection** (suggested, human-confirmed) → dispatch-ready work order

## Repo split (read this before pushing)

| Path | Owner | Notes |
|---|---|---|
| `index.html` | Landing page partner | Replace freely; currently a branded holding page |
| `demo/` | Demo | Don't edit without syncing — the demo is a scripted scene engine |
| `PRODUCT.md`, `DESIGN.md` | Shared | Brand + product context. Palette, fonts and voice live here — use them on the landing page too |

No build step. Plain HTML/CSS/JS, served as-is by GitHub Pages. Push to `main` and it's live.

## Brand quick reference

- Palette: Ink `#0B211B` · Spruce `#14382E` · Field `#5E7A6D` · Signal `#2FD284` (only for "ready"/CTA) · Paper `#F5F2E9`
- Type: Space Grotesk (headlines) · Inter (body) · IBM Plex Mono (IDs, labels, tags)
- Voice: precise, unhurried, credible. "The work order is ready. You just approve it."

## Product guardrails (also true of the demo)

1. Integrates with the existing work-order system — never replaces it.
2. Emergencies are handed to a human immediately; the agent only spots them fast.
3. Duplicate merges are suggested, never automatic.
4. Every write to the system of record is a human approval click.
