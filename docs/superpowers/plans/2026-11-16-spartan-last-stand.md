# Spartan Last Stand Implementation Plan

**Goal:** Give the last 40% of each side's Spartan army one shared directional
charge inside a dragon-head aura large enough to enclose every participant.

**Architecture:** Track recruited Spartan totals per side independently of local
squads. Merge survivors into one formation with rally, windup, dash and recovery
phases and shared swept-collision hit tracking. Fit the Canvas dragon aura to
participant sprite bounds; use the existing browser audio controller.

**Tech Stack:** TypeScript, Canvas 2D, Web Audio, existing React application.

**Spec:** `docs/superpowers/specs/2026-11-16-spartan-last-stand-design.md`

## Constraints

- Work in the existing checkout, without dependencies or commits.
- Do not run tests, builds, linters, type checks or verification without approval.
- Each side's recruited Spartan total, rather than health or local squad losses,
  controls the 40% trigger.

## Tasks

- [x] Add checks in `checks/spartan-charge.check.ts` for casualty thresholds,
  incapacitation, direction locking, swept hits, edge completion and clear.
- [x] Extend `spartan.ts` tuning and `spartan-formations.ts` charge state.
  Track recruitments in `battle.ts`, merge all surviving Spartans on the same side,
  and preserve normal squad and individual behavior outside the charge.
- [x] Integrate charge movement, damage, poses and shake in `battle.ts`.
- [x] Add dragon aura, arrow marks, windup meter and scream waves in the Canvas
  formation renderer. Connect a synthesized scream to browser user gestures.
- [x] Scale and center the dragon skull around actual and intended full sprite
  bounds, with padding, and keep its fill translucent.
- [x] Update charge checks for independent sides, the army-wide threshold, distant
  survivors sharing one charge and the skull enclosing all participant bounds.
- [x] Keep the original local-squad disband check.
- [x] Fix undercounted reinforcements and individual status effects blocking the
  collective summon. Rally for at most three seconds and use a shared 2.4-second
  windup that does not reset. Pull the army into slots together and show the
  survivor/recruited count on its label.
- [x] Add checks for HP not triggering summoning, reinforcements after casualties,
  natural army gathering despite fear/stun/freeze, one shared scream, late
  recruits, displaced members and airborne enemies. These checks are unexecuted.
- [ ] Run checks only if the user approves. No checks have been executed.

## Review focus

Temporary incapacitation must not count as death. Conversion must not carry a
former army's benefits. A marked spear target must not divert the charge.
Targets may die or move without changing its direction. Each crossed enemy is
hit once, and even diagonal charges stop at the edge without repeating forever.
