# Kunlun Legend: lightning skill kit

## Intent

Kunlun Legend (`kunlun.ts`) is today a plain swordsman: one standing pose and a basic melee hit (800 HP, 145 px/s,
30 damage, 0.6 s swing). The user wants him to be "a spam dude": a blue-lightning swordsman who fires skills
constantly instead of trading plain hits. The user listed seven abilities; the user picked the walls layout (a
line facing the shooter) and the whole-fight sword charge. Numbers below are proposals; tune later.

## Goals

- A skill every second or two in a fight, with plain swings in between.
- Seven readable lightning abilities in his blue palette (`VOLT`, `VOLT_PALE` in `kunlun.ts`), outlined in ink like
  the rest of the game.
- Strong at range as well as up close (instant strike and sparks reach far targets).

## Non-goals

- A transformation or second form (so no tray variant for him).
- Changing other fighters, except that their projectiles can now be blocked by his walls.

## Anti-goals

- Hard-countering whole fighters: the walls stop projectiles only, never dragon breath, sky strikes or bodies.
- Unreadable spam: each skill keeps its own pose and effect so you can tell what he just did.

## Approaches

1. **Follow the existing hero pattern (picked).** State fields on `Fighter`, `tryKunlun…`/`stepKunlun…` methods
   in `Battle`, constants plus sprite and effect drawing in `kunlun.ts`, the way Yan Jin, Mei and Meng Chuan are
   built. It fits the codebase, and those heroes already provide the mechanics to reuse.
2. A separate Kunlun module with its own update loop. It would be cleaner in isolation, but `Battle`'s
   internals (`hit`, `bolts`, `storms`, projectile lists) are private, so it would need a new interface. Rejected.
3. A generic data-driven skill system for every hero. Too big for one hero. Rejected.

## The kit

Base stats stay as they are. Zombie Kunluns use none of these skills.

**Skill choice (the spam).** Whenever his attack cooldown is ready and he has a target within his detection
(470 px), he tries his offensive skills in this order: Thunder Dive, Crescent Slash, Spark Sway, Heaven Strike,
Storm Spin. A skill fires if its own cooldown is ready, its range condition holds and its chance roll passes. If
none fires and the target is in sword reach, he swings normally; otherwise he keeps closing in. The ranged skills
mean he spams from a distance too. While a skill pose plays he does not start another.

**0. Thunder Charge (entrance, passive afterwards).** The first time he gets a target, he stops and raises his sword
(0.8 s). A blue bolt drops onto the blade with a flash, and the sword stays charged for the rest of his life: the
blade crackles (a glow plus small moving sparks). While charged, every plain swing also zaps the target with a short
bolt for +12 damage and a 0.3 s shock. This happens once per spawn. If he is stunned, grabbed or thrown before the
bolt lands, the charge is cancelled and he tries again the next time he has a target (builder's call).
Any skill pose is cancelled the same way, and that skill still goes on cooldown.

**1. Storm Spin (speed).** Cooldown 12 s, 30% chance, and it always fires if the target is more than 200 px
away. He raises the sword and spins for 0.6 s, then a bolt strikes him. For 5 s afterwards his movement speed is
doubled, and while he moves he leaves fading blue afterimages of himself: one copy every 0.05 s, each lasting
0.3 s. (Attack speed stays the same; the user asked for movement.)

**2. Lightning Walls (reactive).** Cooldown 8 s. He casts it when a ranged attack hits him: a projectile, or any hit
from an attacker more than 40 px from touching him (the same rule as Mei's ranged counter). The trigger is not part
of the attack roll. He swings his sword toward the shooter, and five lightning wall segments appear in a gentle arc
45 px in front of him on that side. Each segment is about 22 px wide, and together they span about 110 px. The walls
stay where they were cast (they do not follow him) for 4 s. Any enemy projectile that enters a segment fizzles out
with a small blue spark. This covers shuriken of every kind (shuriken, spear, flying sword, talisman), giant swords,
fish throws and lightning waves. Thor's hammer is turned back to Thor instead of destroyed, so he does not lose it.
The walls do not stop dragon breath, storm strikes from the sky, phoenix fireballs dropped from above, Thor's
instant lightning shots, or fighters walking through. Allies behind the walls are covered too.

**3. Thunder Dive.** Cooldown 6 s, 35% chance, target 60–220 px away. He front-flips through the air onto the target
(0.5 s arc, body rotating one full turn) and cannot be hit while airborne. He slams his sword into the ground,
a bolt strikes the landing spot, and every enemy within 70 px takes 40 damage and is knocked up a little: the
existing `knockup` with a 0.45 s flight, lower than Yan Jin's slam. Then they get a 0.5 s stun.

**4. Crescent Slash.** Cooldown 4 s, 40% chance, target within 120 px. He swings, and a blue crescent-moon wave
(about 60 px across) flies forward 160 px at 500 px/s. Every enemy it touches takes 32 damage once and is knocked
away hard (knockback 300).

**5. Heaven Strike (instant lightning).** Cooldown 3.5 s, 30% chance, any target in detection. He points his
sword at the sky for 0.25 s and a bolt lands straight on the target with no warning circle: 35 damage, 0.6 s shock
and 15 damage to other enemies within 30 px.

**6. Spark Sway.** Cooldown 7 s, 30% chance, any target in detection. He raises the sword and sways for 0.9 s while
three blue sparks orbit him at about 26 px. At the end each spark becomes a bolt and flies at 600 px/s, homing on
up to three different nearby enemies (the main target takes any spares): 22 damage and a 0.3 s shock each. The
bolts count as projectiles, so an enemy Kunlun's walls stop them.

## How it gets built

- `kunlun.ts`: a `KUNLUN_SKILLS` constant block (one entry per skill holding the numbers above); new poses `raise`,
  `point` and `slash` in `buildKunlunSprite`; drawing for the charged blade, walls, crescent, sparks/bolts and
  afterimages. The spin, sway and flip reuse those poses with rotation or flipping at draw time.
- `units.ts`: add the new poses to `Poses` (a `kunlun?` slot like `yan?`/`mei?`).
- `battle.ts`: new `Fighter` fields (`kunlunCharged`, a `kunlun` skill-in-progress record like `mei`, one cooldown
  per skill, a speed-buff timer); `Battle` lists for walls, crescents, spark bolts and afterimages; dispatch in the
  melee branch where `kunlun` currently shares the cavalry hit (around the `species === 'kunlun'` line); the speed
  buff in `fighterDef`; the wall check inside each projectile's step; drawing in `renderBattle`.
- Reuse: `bolts` for every lightning flash, `impacts` for flashes and sparks, `hit()` for damage, `knockup`/
  `knockupAir` for the dive, the Mei ranged-hit rule in `hit()` for the wall trigger, and `MAX_FIGHTERS`-safe
  patterns already used by other heroes. Clear all new state in `clear()`, and in the death and zombie paths the
  way the other heroes do.
- `checks/kunlun.check.ts`, following the other `checks/*.check.ts`: the charge happens once; each skill fires and
  deals its damage; the walls destroy an enemy shuriken and turn back a hammer, but not a dragon flame.
- README: a Kunlun entry in the style of the Mei Yuanzhi one.

## Phases (one per session; update the progress table)

1. Constants, `raise`/`point` poses, Thunder Charge and the charged hit, Heaven Strike, and the skill-choice loop.
2. Crescent Slash and Thunder Dive (`slash` pose, flip rotation, knock-up).
3. Spark Sway and Storm Spin (orbiting sparks, homing bolts, speed buff, afterimages).
4. Lightning Walls (segments, the projectile checks in every flying list, hammer turn-back), plus the README.

## Left to the builder

Exact art: pose drawings, glow amounts, crescent shape, wall flicker. Timings within a skill. How a 0.6 s spin is
drawn (flipping facing fast, adding spin streaks, or both). Fine-tuning numbers after a look.

## Progress

| Phase | Status | Notes |
|-------|--------|-------|
| 1–4 | written in one pass (2026-11-18), not yet run or built | The user asked to skip phasing. `checks/kunlun.check.ts` covers each skill. |

Deviations: fish throws aren't blocked (they have no position in flight, only a timer). The dive's landing stun is
the shared knock-up landing stun (0.4 s), not 0.5 s.
