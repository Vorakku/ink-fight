# Spartan Commander Implementation Plan

**Goal:** Add one powerful, larger, endlessly armed commander to each Spartan
army exceeding fifty living troops, protected until his last troop dies.

**Architecture:** Reuse Spartan fighter state and the existing per-side army
map. Route the protection through shared damage and kill handling, and extend
the cached Spartan sprite poses and spear projectile handling.

**Tech Stack:** TypeScript, Canvas 2D, existing battle engine.

**Spec:** `docs/superpowers/specs/2026-11-16-spartan-commander-design.md`

## Constraints

- No new dependencies or commits; preserve unrelated changes in this checkout.
- Do not execute tests or verification commands without user approval.
- One added commander per side at 51 regular troops; retain the fighter cap.
- Commanders do not count as regular troops or protect each other.

## Tasks

- [ ] Write `checks/spartan-commander.check.ts` for threshold, side separation,
  triple damage, repeated spear throws, protection, conversion, recruits,
  last-stand membership, clear and the fighter cap; leave it unexecuted.
- [ ] Add tuning and commander art in `spartan.ts`, cache poses in `units.ts`.
- [ ] Integrate spawning, stat scaling, spear replenishment and all damage/death
  protections in `battle.ts`.
- [ ] Keep regular-troop counts independent in `spartan-formations.ts`; put the
  commander first and account for his size in formations and the dragon aura.
- [ ] Update the large-army aura check for the additional commander.
- [ ] Ask the user whether to run the checks after implementation.

## Review focus

Fire/bleed and executions must respect troop protection. Conversion must not
bypass it. Repeated throws must not delete their own projectiles. A living
commander must not create a second leader when fresh troops arrive. Protection
must end immediately when the last regular troop dies or converts.
