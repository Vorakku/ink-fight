# Lui Feng Longbow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automatic mounted archery, Thousand Arrow and close-range Piercing Ground.

**Architecture:** Extend Lui Feng's current skill state and pose cache. Ordinary arrows use the shared projectile
path; rain waves and ground impact use short-lived, owner-bound effect records with simulation-timed hits.

**Tech Stack:** Existing TypeScript and Canvas 2D; no dependencies.

**Spec:** `docs/superpowers/specs/2026-11-21-lui-feng-longbow-design.md`, explicitly approved by the user.

## Global Constraints

- Preserve current uncommitted spear/Carnage art and mechanics. Work inline in the current V2 checkout; no staging or commits.
- Do not write tests, run checks/analyze/build, launch the game or perform a final verification review before permission.
- Detection 600 px; bow range 500 px; enter bow preference at 180 px, exit at 140 px; ordinary spacing 260 px.
- Ordinary draw 0.25 s, interval 0.9 s, damage 26, knockback 60, speed 780 px/s.
- Rain charge 1 s, flight 0.6 s, six 18-damage waves 0.22 s apart, radius 130 px, cooldown 12 s.
- Ground charge 0.85 s, flight 0.12 s, damage 50, radius 125 px, knockback 460, stun 1 s, crater 2 s, cooldown 10 s.
- Snapshot Enhance power at release. Keep allies safe and existing projectile defenses effective.
- Healing and sword additions remain outside this approved bow scope.

## Review Focus

- Bow switching near thresholds must not inflate melee reach or oscillate during an active cast.
- Detection and damage must retain their approved values both with and without Enhance.
- Reflection changes ownership without changing arrow damage or applying Enhance twice.
- Locked rain markers, six simulation waves and one ground impact must not depend on render frames or dead target references.
- Interruptions, death, conversion and reset remove pending casts/owned attacks without stranded markers or resumed charges.

Verification for these conditions is deferred to the owner's approval.

### Task 1: Bow and area art

**Files:** `src/game/luifeng.ts`.

**Interfaces:** `LUI_BOW`, `LUI_BOW_HAND`, `luiBowTip(angle)`, `drawLuiBow(c, angle, draw, loaded)`,
`drawLuiArrow(c, x, y, angle, size)`, `LuiRainFx`/`LuiGroundFx` visual records,
`drawLuiRain(c, area, front)` and `drawLuiGround(c, shot, front)`.

- [x] Add explicit detection, constants and cached galloping/standing bow-arm poses without a visible spear.
- [x] Draw the live longbow, moving draw hand, taut string and arrow; return the matching charge/projectile anchor.
- [x] Add deterministic ink arrow art, countdown marker, upward shot, falling streams and ground brush impact.

### Task 2: Shared projectiles and automatic mounted combat

**Files:** `src/game/battle.ts`.

**Interfaces:** `Fighter.luiBowMode`, `luiBowCast`, `luiRainCooldown`, `luiGroundCooldown`; `LuiBowCast`,
`LuiArrowRain`, `LuiGroundShot`; `Battle.luiArrowRains`, `luiGroundShots`; shared projectile kind `arrow`.

- [x] Initialize/reset bow state and cooldowns; add interruption cleanup to all movement-taking/death/conversion paths.
- [x] Add `canLuiBowAct`, `luiBowAim`, `moveLuiArchery`, `stepLuiArchery` and `stepLuiBowCast`.
- [x] Add `tryLuiBowSkill(fighter, target, kind)` and `stepLuiBowEffects` with locked areas and release snapshots.
- [x] Add arrow speed/damage/collision/render branches to shared projectiles, preserving capture/parry/reflection behavior.
- [x] Dispatch existing active skills exclusively; priority is Enhance, close Ground, Carnage, ranged Rain, close spear Charge, basics.

### Task 3: Render integration and handoff

**Files:** `src/game/battle.ts`, this execution record.

- [x] Select cached bow arms when ranged or casting; draw the live bow and charged wind at the actual arrowhead.
- [x] Draw area markers/ground shockwaves below bodies and falling/ground-flight arrows above them.
- [x] Preserve the existing spear/Carnage render paths and all prior work; stop at the verification question.

## Execution record

- Native inline execution: tasks share the same cast/pose interfaces and approved current workspace.
- Ruling: preserve the current V2 checkout and previous uncommitted work rather than isolating or committing it.
- Ruling: implementation is already authorized; no extra plan handoff approval. TDD and final review are deferred by AGENTS.md.
- Pre-flight: Task 2 consumes Task 1's anchors/visual records; Task 3 consumes both. Names are fixed above.
- Implementation: bow art, shared arrows, detection/switching, charged skills, effects and lifecycle are connected.
  No `units.ts` change was needed because its Lui Feng pose type is inferred.
- Deferred: existing isolated spear/Carnage check fixtures will need bow cooldown/preference setup when checks are authorized.
- Status: implemented, awaiting the owner's verification decision. No tests written, check/analyze/build run,
  final code review performed or game launched. Motion, combat balance and visual appearance remain unverified.
- Subsequent follow-up: spear-spin/slam meditation healing is implemented in `2026-11-21-lui-feng-meditation.md`.
  Any future sword kit remains outside this work.
