# Meng Chuan Body Refinement Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Meng Chuan's third ritual form, Body Refinement Divine-Demon (炼体神魔): a fist brawler whose punches leak seven-colour sha, with Seven Sha Fists, Sha Kasaya and the Red Lotus Karmic Fire ultimate.

**Architecture:** Mirror the Thunder Saint form: a `mengBody` flag on `Fighter`, a stats override in `fighterDef`, a third look table in `drawMengChuan`, `try…`/`step…` pairs in `Battle.step`, live draw functions in `mengchuan.ts`.

**Tech Stack:** TypeScript, Canvas 2D, no dependencies.

**Spec:** `docs/superpowers/specs/2026-11-18-meng-body-refinement-design.md`

## Global Constraints

- User rule: no tests, type-checks, builds or runs until the user is asked; no commits unless asked. (Overrides the TDD/commit steps of this skill.)
- Sha colours in order: red `#d8322a`, orange `#f07a1e`, yellow `#f2c230`, green `#3fa45a`, blue `#2f6be0`, black `#221f33` (INK), white `#f6f2ea`.
- Effects in the existing ink style; white outlined in ink, black with a pale wash halo.
- Constants as commented `as const` blocks in `mengchuan.ts`, like `MENG_THUNDER` / `MENG_STEP` / `MENG_GOD`.

## Review Focus

- Zombie Meng Chuan in body form: no skills, no regen, base sprite (every new path checks `!fighter.zombie`).
- Body form must not run base/Thunder skills: Autumn Breeze, Five Autumn Shadows, devils/meals, Lightning Step, Divine Thunder Slash all gate on form.
- Lotus/Kasaya burning must not hit allies or buildings badly: use `targetable(owner, victim)`, skip `building(victim)` for burn.
- Battle reset (`battle.ts:~992`) clears the new effect arrays.
- Kasaya while he is mid-skill or meditating: it only triggers with a target, so meditation ends first.

---

### Task 1: Constants, sprite and poses

**Files:**
- Modify: `src/game/mengchuan.ts` (look tables ~50-54, `drawMengChuan` 56-258, `buildMengChuanSprite` 260-263, ritual comment 670-675)
- Modify: `src/game/units.ts:78-79, 230-236`

**Interfaces:**
- Produces: `MENG_BODY = { name, stats: { speed: 175, range: 16, cooldown: 0.3, damage: 22, knockback: 120, color: '#e0482a' }, armor: 0.3, regen: 10, heavy: { every: 4, reach: 40, span: 0.52, damage: 1.5, knockback: 2 } }`; `MENG_BODY_FORM = 0`; `MENG_SHA: readonly string[]` (7 colours above); `type MengForm = 'devil' | 'thunder' | 'body'`; `buildMengChuanSprite(color?, pose: MengPose = 'ready', step?, form: MengForm = 'devil')` with `MengPose` gaining `'punch'`; `poses.meng.body: { ready, punch, parry, meditate, raise }`.
- Change every existing `buildMengChuanSprite(..., true)` call to `'thunder'` (units.ts and anywhere else grep finds).

- [ ] **Step 1:** Add the constants above with comments; update the ritual comment ("fire: Body Refinement").
- [ ] **Step 2:** Replace the `thunder` boolean in `drawMengChuan`/`drawJian` callers with `form`; add `BODY_LOOK` (red-gold armour `#d8452f`/`#8a2a18`, gold trim `#f2c060`, glow `#ff7a1e`, black trousers `#1c1a24`, boots `#2a2833`, hair red `#e0322a` with dark roots).
- [ ] **Step 3:** Draw the body form per spec: spiky red hair, red face marks, bare chest with red-gold flame plates and a red crack, blazing gauntlets (no jian in any pose), smoky dark wing shapes behind the shoulders, layered dark belts with silver buckles, two-colour eyes. Poses: `ready` fists up, `punch` front fist extended, `parry` forearm across the face, `meditate` hands joined, `raise` both fists overhead.
- [ ] **Step 4:** Build `poses.meng.body` in `units.ts` (with `walks(ready, …)` like thunder) and add it to the `meng?` type.

### Task 2: Form state, ritual, passive

**Files:**
- Modify: `src/game/battle.ts` (Fighter interface ~187-197, spawn defaults ~858, `fighterDef` ~493, `incomingDamage` 431, `tryMengRitual`/`stepMengRitual` ~3980-4009, per-tick cooldowns ~5923, skill gates 1584/3891/4191/4907, pose selection ~6748/6984-6990, meditation aura ~7041, swing ~7241)

**Interfaces:**
- Consumes: Task 1 constants and `poses.meng.body`.
- Produces on `Fighter`: `mengBody: boolean`, `mengPunch: number` (punches thrown, drives colour and the heavy every 4th), `mengFists: MengFists | null`, `mengKasaya: number` (s left), `mengKasayaCooldown: number`, `mengLotusCooldown: number`, `mengLeap: MengLeap | null`.

- [ ] **Step 1:** Add fields and defaults; `fighterDef` returns `{ ...UNITS.mengchuan, ...MENG_BODY.stats }` when `mengBody`.
- [ ] **Step 2:** Ritual: roll `Math.floor(this.random() * 3)`, remove the ponytail note; on `MENG_BODY_FORM` set `mengBody`, clear `mengFeast`, `mengLotusCooldown = MENG_LOTUS.opening`, impact burst in `#ff7a1e`.
- [ ] **Step 3:** Gate base skills off in body form wherever `mengThunder` already gates them (breeze, clones, meals/bodies, Thunder skills only check `mengThunder` so they stay off).
- [ ] **Step 4:** `incomingDamage`: body-form Meng (not zombie) takes `damage * (1 - MENG_BODY.armor)` from non-allied owners. Per tick: `hp = min(def.hp, hp + MENG_BODY.regen * DT)` while alive and not zombie.
- [ ] **Step 5:** Poses: `mengBodyPoses` like `mengThunder`; raise during ritual/leap, punch when `attack > 0`, parry, meditate, ready. Meditation aura `['#ff7a1e', '#ffc9a0']`. Skip `drawMengSwing` in body form.

### Task 3: Punch combo and sha

**Files:**
- Modify: `src/game/mengchuan.ts` (new draw functions after the Thunder block)
- Modify: `src/game/battle.ts` (attack dispatch ~6231, new `mengShas` array, step + draw)

**Interfaces:**
- Produces: `drawMengSha(c, x, y, color: string, age: number, seed: number)` (ink blot + wash + 3-4 dry wisps, life `MENG_SHA_LIFE = 0.45`); `drawMengPunch(c, progress: number, color: string, heavy: boolean)` in sprite-local units like `drawMengSwing`; battle `mengShas: { x: number; y: number; color: string; age: number; seed: number }[]`; `private mengPunch(owner, target, nx, ny)`; `private mengShaPuff(x, y, colorIndex)`.

- [ ] **Step 1:** `mengPunch`: colour `MENG_SHA[owner.mengPunch % 7]`; every 4th punch (`(mengPunch + 1) % MENG_BODY.heavy.every === 0`) hits every targetable grounded enemy within `radius + victimRadius + heavy.reach` and inside `heavy.span` of the facing for `damage * heavy.damage`, knockback `* heavy.knockback`; otherwise a normal `hit` like the base branch. Puff at the fist and at each struck victim. Increment `mengPunch`.
- [ ] **Step 2:** Dispatch: `else if (fighter.species === 'mengchuan' && fighter.mengBody) this.mengPunch(...)` before the generic melee branch.
- [ ] **Step 3:** Age/filter `mengShas` each tick, clear on reset; draw them in the effects pass; draw `drawMengPunch` where `drawMengSwing` is drawn, colour from `(mengPunch - 1) % 7`, heavy when `(mengPunch % 4) === 0`.

### Task 4: Seven Sha Fists

**Files:** `src/game/mengchuan.ts`, `src/game/battle.ts` (try/step next to `tryMengStep`, loop ~6057/6113, draw)

**Interfaces:**
- Produces: `MENG_FISTS = { min: 1, range: 250, speed: 950, count: 7, interval: 0.06, damage: 7, burstDamage: 12, burstRadius: 50, burstKnockback: 260, burst: 0.5, cooldown: 7 }`; `interface MengFists { target: Fighter; phase: 'rush' | 'fists' | 'burst'; time: number; thrown: number; x: number; y: number }`; `drawMengFists(c, x, y, thrown: number, time: number, seed: number)` (fan of fist afterimage strokes per colour around the target) and `drawMengBurst(c, x, y, progress: number, seed: number)` (seven-colour painted bloom, ink splatter).

- [ ] **Step 1:** `tryMengFists` gated like `tryMengStep` but on `mengBody`; sets `skillCooldown`.
- [ ] **Step 2:** `stepMengFists`: rush at `speed` until within reach; throw one punch every `interval` (hit `damage`, sha puff of that colour); after `count`, burst: everyone targetable within `burstRadius` takes `burstDamage` + knockback, seven puffs; hold `burst` s then end. Ends if stunned/held/lured/target lost (same guard as `stepMengStep`).
- [ ] **Step 3:** Draw fists afterimages during `fists`, the bloom during `burst`.

### Task 5: Sha Kasaya

**Files:** `src/game/mengchuan.ts`, `src/game/battle.ts`

**Interfaces:**
- Produces: `MENG_KASAYA = { trigger: 120, duration: 4, cooldown: 12, touch: 10, burn: 1.2 }`; `drawMengKasaya(c, tick: number, strength: number, front: boolean)` in sprite-local units (back layer: robe ribbons behind him; front layer: ribbons over him).

- [ ] **Step 1:** Trigger in the target section when `mengBody`, cooldown ready and target within `trigger`; does not `continue` (he keeps acting).
- [ ] **Step 2:** While `mengKasaya > 0`: `yanUnstoppable(fighter)` each tick; each enemy within both radii + `touch` (targetable, not building) gets `burn = max(burn, MENG_KASAYA.burn)`, `burnOwner = fighter`.
- [ ] **Step 3:** Draw back layer before the sprite, front layer after, strength fading in/out over 0.25 s.

### Task 6: Red Lotus Karmic Fire

**Files:** `src/game/mengchuan.ts`, `src/game/battle.ts`

**Interfaces:**
- Produces: `MENG_LOTUS = { range: 200, cooldown: 20, opening: 3, leap: 0.4, height: 50, slam: 0.75, end: 1.1, radius: 55, damage: 70, knockback: 300, burnTime: 3, burn: 1, title: 2.2 }`; `MENG_LOTUS_TITLE = '红莲业火'`; `interface MengLeap { time: number; x: number; y: number; landed: boolean }`; battle `mengLotuses: { owner: Fighter; x: number; y: number; age: number }[]`; `drawMengLotus(c, x, y, age: number, tick: number)` (petals brushed open one by one, ink outline and veins, gold pod, brush flames, embers, fade); `drawMengLotusTitle(c, x, y, time: number, tick: number)` (red-gold calligraphy edged ink/white, red seal).

- [ ] **Step 1:** `tryMengLotus` like `tryMengGod` gated on `mengBody`; loop handles `mengLeap` like `mengGod` (unstoppable, `continue`); `hit()` returns false while `mengLeap`.
- [ ] **Step 2:** `stepMengLeap`: rise to `height` over `leap`, drop by `slam`; at `slam` land: impact `damage`/`knockback` to targetable enemies within `radius` (squashed 0.6 vertically like the seal), push a lotus; end at `end`.
- [ ] **Step 3:** `stepMengLotuses`: age; while `age < burnTime` set burn on enemies inside; keep until `age >= max(burnTime, title)`; clear on reset.
- [ ] **Step 4:** Draw lotus on the ground layer and the title over him at the end of the effects pass.

### Task 7: Docs

**Files:** `README.md` (Meng Chuan section ~444-470), `docs/style-guide.md` (Meng Chuan ~376-405)

- [ ] **Step 1:** README: the ritual picks one of three; describe the Body Refinement form, its numbers and skills.
- [ ] **Step 2:** Style guide: the look and every effect as built.
