# Product

## Register

product

## Users

- **Buyer:** Aisha — portfolio facilities manager running 5–50 mixed-use commercial buildings in Australia. Owns cost, contractor performance and reporting KPIs. Hard boundary: will not replace the existing work-order platform.
- **Primary user:** Leo — facilities coordinator. Drowning in incomplete requests across email, phone, SMS and tenant portal; spends 2.4 days median chasing a room number, an access window and a site contact before dispatch.
- **Zero-adoption-cost parties:** Emily (tenant, reports issues, wants acknowledgment) and Marco (contractor, refuses new apps, wants an exact zone/asset/access window).

## Product Purpose

Readyset is an intake/clarification layer that sits in front of the work-order system a facilities team already uses. It reads maintenance requests from every channel, extracts the fields that stall a job, asks the requester one clarifying question, flags likely duplicates without merging them, and hands a human a dispatch-ready work order. Hero metric: **Time-to-Ready — 2.4 days down to 4 minutes.**

This repo is the hackathon deliverable: a public landing page (root, owned by partner) plus an interactive simulated demo of the core loop (`/demo/`, this work). The demo must sell two capabilities above all: **auto-deduplication** (suggest, never auto-merge) and **auto ask-back** (one clarifying question, answer flows back into the record).

## Brand Personality

Precise, unhurried, credible. "Operational calm" — a well-run building at 7am; everything checked, nothing hurried. Never hyped, never playful-startup, never corporate-cold. Tagline: "From reported to ready."

## Anti-references

- Hyped SaaS ("Supercharge your maintenance ops with AI!") — the brand voice is "The work order is ready. You just approve it."
- Handshake stock photos, hard-hat clichés, glossy 3D renders, saturated corporate blue.
- Confetti/celebration moments; loud gradients; startup-playful microcopy.

## Design Principles

1. **The brand feels like the state it sells.** Restraint is the proof of "operational calm" — a hyped identity promising calm contradicts itself.
2. **Colour with operational meaning.** Signal green appears only when something is *ready* (status, hero metric, CTA) — never decoratively.
3. **Humans decide, the agent prepares.** Every demo beat that involves judgment (duplicate merge, write to system of record) visibly pauses for a human click. The approval click is the product moment.
4. **The system voice is mono.** Work-order IDs, timestamps, field labels and status tags render in IBM Plex Mono — small and sparing.
5. **Show the reasoning.** The agent's confidence and why (same zone, same asset, 2 days apart) is displayed, not asserted.

## Accessibility & Inclusion

- WCAG AA contrast throughout (body ≥4.5:1 on both Paper and Ink surfaces).
- Full `prefers-reduced-motion` alternative: crossfades/instant state changes, no typing effects.
- Demo is fully keyboard-operable (play/pause/step/gate buttons are real buttons).
