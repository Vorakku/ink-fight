# Dragon Nests Implementation Plan

> Execute inline in the existing checkout, preserving the current V2 work.

**Goal:** Restore adult nesting, resting, timed eggs and activity-grown hatchlings.

**Architecture:** Adapt the original lifecycle to Fighter references. Nests and
eggs use internal roster entries, existing target/damage rules, and cached Canvas
sprites. Hatchlings reuse dragon combat and feeding, with maturity gating forms.

**Tech Stack:** Existing TypeScript, React and Canvas, without dependencies.

**Spec:** `docs/superpowers/specs/2026-11-16-dragon-nests-design.md`

## Constraints

- Keep the existing checkout, 300-entity limit and current evolution thresholds.
- Resting lays one egg every 12 seconds; two live eggs per nest; incubation 20s.
- Hatchlings start at 45% scale and need 120 damage plus four nutrition to mature.
- No tests or verification commands until the owner says yes. Do not commit.

## Implementation

- [x] Add nest/egg definitions and cached nest, egg and sleeping dragon sprites;
  register internal species and population counts.
- [x] Add nest placement, construction, rest, defense, egg incubation and hatching;
  integrate immobile buildings, loss/conversion cleanup and Clear.
- [x] Scale hatchling stats and growth using actual damage and existing nutrition;
  gate evolution and nesting until adult; keep combat ahead of food and rest.
- [x] Add unrun checks for two-egg limits, hatching and growth, nest defense,
  nest/parent loss, FFA, blocked exits, capacity and reset; document behavior.
- [ ] Ask whether the owner wants testing; only run checks after authorization.
