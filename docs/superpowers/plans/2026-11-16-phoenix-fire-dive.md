# Phoenix Fire Dive Implementation Plan

> Execute inline in the existing checkout, preserve current work, do not commit.

**Goal:** Redesign Encore, show healing at her feet and add an explosive fire dive.

**Architecture:** Keep cached Canvas sprite poses and existing rebirth stages.
Center shared healing on the caster; add one dive state and timed ground-fire
effects using existing damage, burn, impact and interruption paths.

**Tech Stack:** Existing TypeScript and Canvas; no dependencies.

**Spec:** `docs/superpowers/specs/2026-11-16-phoenix-fire-dive-design.md`

- [x] Replace adult artwork with broad flame wings, crest and flowing tail;
  preserve muzzle, cached flapping, chick and egg artwork.
- [x] Center healing on the caster; replace flame rings with red circles/pluses.
- [x] Add dive rise/hover/plunge, landing blast, attributed ground fire and burn;
  integrate grounding, cooldowns, cancellation, conversion, rebirth and Clear.
- [x] Add dive/fire visuals and unrun checks for healing area, impact timing,
  allies, lingering fire, airborne exclusions, interruptions and cleanup.
- [ ] Update README and ask whether the owner wants testing. Run nothing yet.
