# Mei Yuanzhi — signature visual pass

**Date:** 2026-11-17
**Status:** awaiting approval

## Intent

Mei's moves work but don't read. The throw is a 6×9 px slip with a faint glow and
no trail; its burst is the same 6-ray ring every fighter uses. The barrage reads as
confetti, the mine/escape/shield are generic ring + smoke, and the transformation is
a meditation aura with a sprite swap. The star dash is the only effect with presence,
and it is locked behind two health thresholds.

Make every attack and skill *look* like talisman sorcery, without changing a single
stat, hitbox, cooldown or probability.

## Goals

- One coherent language across all his effects: ink-brush purple/white energy, paper
  charms, rune seals on the ground, a white-hot core in every burst.
- Every frequently seen effect gets presence; rare moves stay the loudest.
- Keep the notebook/ink look: brushy strokes and torn paper, not neon or glow-blur.
- Visual-only change. `checks/meiyuanzhi.check.ts` must pass untouched.

## Non-goals

- No balance, AI, timing or hitbox changes.
- No new skills, no new mechanics.
- No screen shake (the style guide forbids it outside Spartan charge/Thor).
- No re-theme of his body or palette; the calm robed cultivator stays.

## Constraint to update

`docs/style-guide.md` says "keep effects small and quiet." Mei becomes the deliberate
loud exception. Record that one line in the guide so a future change doesn't revert it.

## Approach chosen

**Signature pass** (option 1 of 3): upgrade the existing draw functions and branch the
existing impact renderer; no new gameplay state.

Rejected: showpieces-only (ordinary fights stay plain) and full re-theme (rewrites his
silhouette and all effects for a change nobody asked for).

## Palette

Reuse existing tokens: `TALISMAN #9b5de5`, `FOX #8e4fd6`, `FOX_TIP #eadcff`,
`MEI_FLAME` purple→white, `INK #221f33`, `MEI_AURA #a35ee0`.

## Per-effect spec

1. **Talisman throw.** Spin the slip along its flight heading with a small wobble;
   draw a tapered ink-brush trail and 2 fading ghost slips behind it; bright core +
   halo scaled by `power`; a few ember specks shed along the path.
2. **Talisman burst.** Replace the generic ring for his bursts: white flash core
   (~0.1 s), irregular ink-splash blob, brush ring, 8–12 tumbling paper scraps, and a
   rune seal on the ground that lingers ~0.6 s with 4–6 tick marks. Ghost copies of
   the seal shrink inward as they fade.
3. **Barrage.** A rotating conjuring seal at his feet for the cast (runes + motes);
   each hovering charm carries a bright spawn halo and a slow orbit streak; released
   charms inherit the new projectile trail.
4. **Mine.** Armed: brighter seal, rising purple motes, pre-detonation blink. Blast:
   talisman burst plus a wider ink splash; the thrown victims keep the existing arc.
5. **Escape.** Ink kick at takeoff, a crescent motion streak following the flip, a
   white flash at the vanish point, and a charm-ring seal at the reappear point on top
   of the existing smoke.
6. **Shield.** Segmented hexagonal barrier with a rotating rune ring, inner ink swirl,
   brighter as `absorbed` fills, and a visible flare on each absorbed hit.
7. **Fox talisman.** A wispy flame trail and ember wake behind the paper fox head.
8. **Fox blast.** Two expanding rings, 12 rays, tumbling paper, a ground seal, rising
   embers, a larger ghost fox with a scream pose. Extend the visual life to ~0.7 s.
9. **Transformation.** Pillar of purple ink light and spiralling charms on the rise;
   inward-collapsing rings at the hover; double fox blast, big seal and radial brush
   strokes on the slam.
10. **Fox form ambience.** While `meiForm > 0`, a quiet ground ember ring and drifting
    embers behind him so the form reads as active between skills.
11. **Claw.** Tapered purple gradient claws, white-hot inner edge, ink flecks and a
    small shockwave; slightly longer visual life.
12. **Star dash.** Thicker gradient trail, rune flashes at each vertex, orbiting charms,
    and a seal under the centre before the blast.
13. **Fox spirit summon.** A purple seal and fox-head flash per spirit, not just smoke.
14. **Meditation.** Floating charms orbiting in the aura.

## Where it lives

- `src/game/meiyuanzhi.ts` — all drawing helpers and any new visual constants.
- `src/game/battle.ts` — pass velocity/tick into projectile draws; add visual-only
  impact flags and dispatch; ambient fox aura / barrage circle / flip streak in the
  fighter render; new impact entries at skill moments. No simulation values change.
- `README.md`, `docs/style-guide.md` — describe the new look and the exception.

## Risks

- **Performance:** 1,000 fighters allowed; particles must be cheap, bounded and drawn
  only for Mei's own effects.
- **Readability:** effects must not hide the fighters or each other in a crowded fight.
  Keep cores small, use outlines, cap particles per effect.
- **No-regression:** visual flags must not be confused with gameplay fields; checks
  cannot run without the owner's permission, so gameplay paths stay untouched by
  construction.
