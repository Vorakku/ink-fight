# Lui Feng Meditation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the explicitly requested spear spin, ground strike and mounted meditation healing.

**Architecture:** Register Lui Feng in the existing hero rest path and reuse `saintRest` timing, cancellation and HP capping.
Use the existing overhead spin, one cached planted-spear pose and the shared meditation aura in black and white.

**Tech Stack:** Current TypeScript/Canvas; no dependencies or new skill state.

**Spec:** The user's earlier spin -> ground strike -> meditation healing request, reaffirmed by "Also add the meditate for him as well".

## Global Constraints

- Preserve all prior spear, Carnage and longbow work in the current checkout. No staging or commits.
- Follow other heroes: only rest without an enemy, stop on damage/control, and cap at max HP. Zombies do not heal.
- Reuse Enhance's 0.8-second spin and 0.35-second settling period; heal at 50 HP/s afterwards, like Mei and Kunlun.
- The resting ground strike is cosmetic: no attack damage, combat buff or cooldown consumption.
- Do not write tests, run checks/analyze/build, launch the game or perform final verification before asking.

## Review Focus

- Full health clears rest without entering the Sword Saint's fishing behavior.
- Combat or displacement cannot resume stale meditation or heal during another Lui Feng cast.
- Health starts after the intro; the ground effect occurs once per rest, not on each healing tick.
- His planted spear reaches the effect anchor, and he remains mounted without a bow/spear overlap.

## Task: Restore the existing hero rest behavior for Lui Feng

- [x] `src/game/luifeng.ts`: add `LUI_REST`, planted-spear pose and its matching tip anchor; cache the standing pose.
- [x] `src/game/battle.ts`: include Lui Feng in rest eligibility, time the intro and heal, and clear rest at full HP.
- [x] `src/game/battle.ts`: render the spin followed by planted-spear meditation and a restrained ink aura.
- [x] Record implementation and stop at the owner's verification question.

## Execution record

- Root cause: `stepHeroRest` explicitly excludes Lui Feng from its supported hero list.
- Scope is the user's fully specified, focused follow-up; reuse the established healing behavior rather than another skill system.
- Verification and test writing remain deferred under AGENTS.md. No checks or game launch performed.
- Status: implemented, awaiting the owner's verification decision. Health timing, interruption behavior and visual
  appearance have not been verified by checks or a game run. `units.ts` needed no change because pose types are inferred.
