# Lui Feng Dismount and Foot Kit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When Lui Feng drops to 50% HP his horse dies and he fights on foot with sword, spear and longbow (six new skills) until the horse returns and heals him.

**Architecture:** One `Fighter` with a foot flag (approach A). `fighterDef` returns a foot profile on foot, the renderer picks foot poses, and the foot logic lives in `battle.ts` beside his mounted skills. Foot constants and all foot art live in a new `src/game/luifeng-foot.ts`.

**Tech Stack:** TypeScript, HTML canvas 2D, Vite, React shell (unchanged).

**Spec:** `docs/superpowers/specs/2026-11-21-lui-feng-dismount-design.md`

## Global Constraints

- The owner's CLAUDE.md overrides TDD and verification: **write no tests and run no checks, builds or the game during implementation.** After the last task, ask: "Done. Want me to verify (analyze / tests / run), or will you check it yourself?" The "Deferred checks" at the end run only if the owner says so.
- **No commits** unless the owner asks. Preserve the existing uncommitted edits in `battle.ts`, `luifeng.ts`, `inkcharge.ts`, `units.ts`, `App.tsx`.
- The mounted kit is unchanged and mounted-only. Other heroes are unchanged.
- No new dependencies. Use the battle's seeded `this.random()` for every roll; never `Math.random` inside simulation.
- Every hit goes through `this.hit(...)`, spares allies (`targetable`), and edge-to-edge projectiles hit each enemy once (`hits: Set<Fighter>`).
- Art matches the existing black-and-white ink style and Lui Feng's palette (`INK`, `RED`, `GOLD`, `ARMOR`, `SKIN`, `HAIR`, `WHITE` from `luifeng.ts`).
- New `Fighter` fields are initialised in `spawn` (near `battle.ts:935`) and reset where mounted state resets (`battle.ts:1046-1052`). New battle arrays are cleared in `clear()` (near `battle.ts:1121`).

## Review Focus

1. **Damage taken during the remount sequence takes him back to ≤ 50%:** the horse must not die mid-entrance. Dismount only triggers while fully mounted (not during `luiRemount`).
2. **A single huge hit takes him from > 50% straight to ≤ 0:** he dies normally, with no dismount and no remount afterwards.
3. **Zombie conversion while on foot or mid-remount:** the remount is cancelled, the foot zombie stays on foot, and no horse timer runs.
4. **The arena is cleared (`clear()`) mid-skill:** foot skill records, piercers, corpses and slashes all vanish, and nothing keeps stale fighter references.
5. **Piercers on a huge arena or a tiny one:** removal is by arena bounds (`this.width`/`this.height` plus a margin), never by age alone, so no piercer lingers off-screen forever.

---

### Task 1: Foot state, dismount and horse return

**Files:**
- Create: `src/game/luifeng-foot.ts`
- Modify: `src/game/battle.ts` (Fighter interface near `:100-109`, spawn defaults `:935-937`, reset `:1046-1052`, `fighterDef` near `:571`, HP tick near `:7357`, `canMeditate` `:359`, per-step dispatch near `:7475`, mounted `try*` gates)

**Interfaces:**
- Produces in `luifeng-foot.ts`:
  - `LUI_FOOT = { radius: 11, speed: 110, size: 1.25 }` (merged over `UNITS.luifeng`, so HP and detection 600 are kept)
  - `LUI_HORSE = { threshold: 0.5, fall: 1, corpse: 2, returnAfter: 15, idleReturn: 5, remount: 1.5, heal: 0.5 }`
  - `export type LuiWeapon = 'sword' | 'spear' | 'bow'`
- Produces on `Fighter`: `luiFoot: boolean`, `luiHorseTimer: number` (s since the horse died), `luiIdle: number` (s in a row with no enemy within detection), `luiRemount: number | null` (s into the return sequence).
- Produces on `Battle`: `luiHorseCorpses: { x: number; y: number; facing: number; team: Team; time: number }[]`.

- [ ] **Step 1:** Add the constants and type to `luifeng-foot.ts`, and add the fields with their defaults: `false`, `0`, `0`, `null`.
- [ ] **Step 2:** In `fighterDef`, put the branch `fighter.species === 'luifeng' && fighter.luiFoot` → `{ ...UNITS.luifeng, ...LUI_FOOT }` before the existing `luiAura` branch.
- [ ] **Step 3: Dismount.** In the per-tick HP checks next to Cavalry's dismount (`:7357`): if `species === 'luifeng'`, not a zombie, not on foot, `luiRemount === null`, `hp > 0` and `hp <= def.hp * LUI_HORSE.threshold`, then:
  - set `luiFoot = true`, `luiHorseTimer = luiIdle = 0`, `stun = max(stun, LUI_HORSE.fall)`;
  - push a corpse;
  - cancel the mounted state: `cancelLuiBow`, `luiCharge = luiCarnage = null`, `luiEnhance = null`, `luiAura = 0`, `saintRest = null`, `luiBowMode = false`, `cavalryMounted = false`.
- [ ] **Step 4: Return timer.** Each tick while `luiFoot` and not a zombie:
  - `luiHorseTimer += DT`;
  - `luiIdle` goes up by DT when no targetable enemy is within `LUI_FENG.detection`, and resets to 0 otherwise;
  - when `luiHorseTimer >= returnAfter || luiIdle >= idleReturn`, he isn't mid foot skill (Task 4 field `luiFootSkill === null`), and `stun/frozen/knockup/heldBy/thrown` are all clear, set `luiRemount = 0`.
- [ ] **Step 5: Remount sequence.** Add `stepLuiRemount(fighter): boolean`, dispatched before the other Lui steps at `:7475`. While running:
  - zero `stun/fear/frozen/dizzy/knockup`, and `move(fighter, 0, 0)`;
  - `luiRemount += DT`;
  - at `>= LUI_HORSE.remount`: `luiFoot = false`, `cavalryMounted = true`, `luiRemount = null`, `hp = min(def.hp, hp + UNITS.luifeng.hp * LUI_HORSE.heal)`.
  
  If he becomes a zombie, set `luiRemount = null`. Corpses age by DT and are removed at `LUI_HORSE.corpse`; clear them in `clear()`.
- [ ] **Step 6: Gates.** Block on foot: add `!fighter.luiFoot && fighter.luiRemount === null` to the Lui clause of `canMeditate`, and an early `return false` when `luiFoot || luiRemount !== null` in `tryLuiEnhance`, `tryLuiCarnage`, `tryLuiCharge`, `tryLuiBowSkill`, `stepLuiArchery`, and the `luiBowMode` update at `:7513`.

### Task 2: Foot and horse art

**Files:**
- Modify: `src/game/luifeng-foot.ts`, `src/game/luifeng.ts` (export the helpers the foot art reuses: `halberd`, `pauldron`, `sleeve`, `inkBrushArc`, `inkArrow`, the colour constants), `src/game/units.ts:129,344`, `src/game/battle.ts` (pose choice near `:8527`, live overlays near `:8596`, corpse and remount drawing in `renderBattle`)

**Interfaces:**
- Produces: `buildLuiFootPoses(color?: string)` returning `{ stand: Record<LuiWeapon, HTMLCanvasElement>; walk: Record<LuiWeapon, HTMLCanvasElement[]>; slash: HTMLCanvasElement; thrust: HTMLCanvasElement; fallen: HTMLCanvasElement; leap: HTMLCanvasElement; lean: HTMLCanvasElement; dive: HTMLCanvasElement; flip: HTMLCanvasElement; dash: HTMLCanvasElement; spin: HTMLCanvasElement; plant: HTMLCanvasElement; buttPlant: HTMLCanvasElement }`.
  - `walk[w]` has `WALK_FRAMES` frames, built with the existing `walks()` helper in `units.ts`.
  - Bow poses have no arms baked in: the arms are drawn live with `drawLuiFootBow`.
- Produces: `drawLuiFootBow(c: C, angle: number, draw: number, after?: number)`, the foot equivalent of `drawLuiBow` using the same geometry constants scaled to the standing rider.
- Produces: `drawLuiHorseCorpse(c: C, corpse, time: number)`, which collapses, lies still, then dissolves into ink over `LUI_HORSE.corpse`.
- Produces: `drawLuiRemount(c: C, time: number, front: boolean)`, the ink cover, horse reveal and backflip arc over `LUI_HORSE.remount`. While `luiRemount !== null`, the renderer draws the mounted pose for the last ~30% and the foot `buttPlant` pose before that.
- Produces: `units.ts` `luiFoot?: ReturnType<typeof buildLuiFootPoses>`, built only for `species === 'luifeng'`.

- [ ] **Step 1:** Draw the standing general in `luifeng-foot.ts`: same crown, hair, armour, red cape, gold trim and team-band anchor as `general()`. Add a black-and-gold sword drawing (`drawLuiSword(c, x, y, angle)`) and build the poses. Use pixel scale 3 (size 1.25).
- [ ] **Step 2:** Register `luiFoot` in `units.ts`.
- [ ] **Step 3:** In the renderer pose chain, before the `luiRest` line, add: `poses.luiFoot && fighter.luiFoot` → `fallen` while in the dismount stun, else the skill pose (Tasks 4–6 set `luiFootSkill`), else `slash`/`thrust` while `fighter.attack > 0`, else `walk[weapon]` / `stand[weapon]`. Draw the corpses and the remount effect.

### Task 3: Weapon choice, hold-range movement and normal attacks

**Files:**
- Modify: `src/game/luifeng-foot.ts`, `src/game/battle.ts` (`Shuriken` interface `:372`, shuriken damage `:5245-5247`, the targeting/attack section near `:7513` and `:7577`)

**Interfaces:**
- Produces: `LUI_WEAPON_BANDS = { sword: 70, bow: 220, hysteresis: 15 }`.
- Produces: `LUI_FOOT_ATTACKS = { sword: { damage: 22, cooldown: 0.55, knockback: 70, range: 70 }, spear: { damage: 26, cooldown: 0.8, knockback: 110, range: 150 }, bow: { damage: 20, cooldown: 1, knockback: 50, speed: 780, draw: 0.25 } }`.
- Produces on `Fighter`: `luiWeapon: LuiWeapon` (default `'spear'`).
- Produces on `Shuriken`: optional `damage?: number; knockback?: number`. When present they replace the per-kind numbers at `:5245-5247`.
- Produces: `stepLuiFoot(fighter: Fighter, target: Fighter): boolean`, called in place of `stepLuiArchery` when `luiFoot`.

- [ ] **Step 1: Weapon choice.** Each tick on foot, set the weapon by distance with hysteresis:
  - sword when `d <= 70`, and it stays sword until `d > 85`;
  - bow when `d > 220`, and it stays bow until `d < 205`;
  - spear otherwise.
  
  An active foot skill's weapon overrides this.
- [ ] **Step 2: Movement (hold range).**
  - **Bow:** reuse the `moveLuiArchery` pull/strafe logic with spacing ~300, and walk in when `d > LUI_BOW.range`.
  - **Spear:** keep ~130 px, backing off when closer than 100 and approaching when farther than 160.
  - **Sword:** approach to melee reach.
- [ ] **Step 3: Normal attacks** on `fighter.cooldown`:
  - **sword:** `hit` within `range + target radius`;
  - **spear:** `hit` at reach 150 (a thrust; set `fighter.attack` for the pose);
  - **bow:** a short draw, then push an `'arrow'` shuriken carrying `damage`/`knockback` from `LUI_FOOT_ATTACKS.bow`.
  
  Draw the live bow with `drawLuiFootBow` while the weapon is bow.

### Task 4: Skill choice and the bow skills

**Files:**
- Modify: `src/game/luifeng-foot.ts`, `src/game/battle.ts`

**Interfaces:**
- Produces: `type LuiFootSkillKind = 'pierce' | 'barrage' | 'strike' | 'moon' | 'cutter' | 'stars'`, and `LUI_FOOT_SKILL_WEAPON: Record<LuiFootSkillKind, LuiWeapon>` (pierce/barrage → bow, strike/moon → spear, cutter/stars → sword).
- Produces on `Fighter`: `luiFootSkill: { kind: LuiFootSkillKind; time: number; target: Fighter | null; x: number; y: number; angle: number; stage: number; hits: Set<Fighter> } | null`, and `luiFootCooldowns: Record<LuiFootSkillKind, number>` (all 0 at spawn). It ticks every frame, mounted or not, and never resets.
- Produces: `LUI_SKILL_ROLL = 0.35`, the chance per second.
- Produces on `Battle`: `luiPiercers: { owner: Fighter; kind: 'arrow' | 'moon'; x: number; y: number; vx: number; vy: number; hits: Set<Fighter> }[]`, removed when outside `[-60, width + 60] × [-60, height + 60]` or when the owner dies or is converted.
- Produces: `LUI_PIERCE = { charge: 0.8, damage: 45, knockback: 140, speed: 900, radius: 18, cooldown: 10 }` and `LUI_BARRAGE = { charge: 0.6, arrows: 20, duration: 1, spread: 2.09, damage: 10, knockback: 40, speed: 1100, cooldown: 12 }`.
- Produces: `luiFootScore(fighter, target, kind): number`. It returns 0 when the skill can't apply here, otherwise a weight ≥ 1 that grows with how well enemy positions fit.

- [ ] **Step 1: Choosing.** `tryLuiFootSkill(fighter, target): boolean`. The candidates are the current weapon's ready skills with a score above 0. Roll `this.random() < 1 - (1 - LUI_SKILL_ROLL) ** DT` once per tick. On success, pick the candidate with the highest `score * (0.75 + 0.5 * this.random())`, spend its cooldown, and start `luiFootSkill`.
  - Scores per the spec:
    - **stars:** needs 2+ enemies within 150 px; weight = their count.
    - **cutter:** 2 when the target is alone within 120 px, else 1.
    - **strike:** 1 + the number of enemies within 110 px of the target.
    - **moon/pierce:** 1 + enemies within 30 px of the line from him through the target.
    - **barrage:** needs at least 1 enemy; 1 + enemies within the cone at range, doubled when there are 3+.
- [ ] **Step 2:** `stepLuiFootSkill(fighter): boolean`, dispatched beside `stepLuiBowCast`. It switches on kind, and cancels the skill under stun, freeze, fear, charm, capture, throw, knock-up, death or conversion (cooldown stays spent).
- [ ] **Step 3: Piercing Shot.** Stand still and draw, with `drawInkCharge` at the arrow tip. At `charge`, push a `luiPiercers` arrow aimed at the target's current position.
  - `stepLuiPiercers()` moves each piercer and hits each enemy once within `radius + victim radius`, ground targets only (like `stepMengMoons`).
  - Draw it with a scaled-up `inkArrow`.
- [ ] **Step 4: Arrow Barrage.** After the charge, spend `duration` firing `arrows` shuriken arrows at an even rate. Each heading is the target angle plus `(this.random() - 0.5) * spread`, with damage/knockback overrides. Stop early if the shared cap (`MAX_FIGHTERS * 2`) is hit.

### Task 5: Spear skills and the slow status

**Files:**
- Modify: `src/game/luifeng-foot.ts`, `src/game/battle.ts` (`move` at `:1946`, Fighter fields, the status tick near `:7365`)

**Interfaces:**
- Produces on `Fighter`: `slow: number` (seconds left) and `slowAmount: number`. `move` multiplies speed by `1 - slowAmount` while `slow > 0`, and the status tick decays it.
- Produces: `LUI_STRIKE = { rise: 0.45, lean: 0.35, throw: 0.2, dive: 0.35, height: 140, damage: 40, slow: 2, slowAmount: 0.5, landRadius: 110, stun: 1, cooldown: 14 }` and `LUI_MOON = { charge: 0.7, damage: 35, knockback: 90, speed: 520, radius: 34, cooldown: 10 }`.

- [ ] **Step 1: Heavenly Strike stages.**
  - **rise:** `elevation` up to `height`.
  - **lean:** hold.
  - **throw:** the spear flies from him to the target's position, captured at the throw. On arrival, if the target is within 30 px it takes `hit(damage)` and gets `slow`/`slowAmount`. The spear plants at `skill.x, skill.y` either way.
  - **dive:** he moves in a straight line from his air position to the spear, with elevation going to 0.
  - **land:** every enemy within `landRadius` gets `hit` + `knockup = knockupAir = YAN_JIN_SLAM.air` + `stun` (reuse the Yan Jin knock-up fields), then he pulls the spear out.
  
  While airborne, reuse the existing airborne-immunity rule (`elevation > 40`).
- [ ] **Step 2: Heavenly Slash.** Charge with the spear drawn back, then push a `luiPiercers` moon toward the target. Draw it with `inkBrushArc` as a thick crescent (the same look family as `drawLuiCarnageSlash`).

### Task 6: Sword skills

**Files:**
- Modify: `src/game/luifeng-foot.ts`, `src/game/battle.ts`

**Interfaces:**
- Produces on `Battle`: `luiInkSlashes: { x: number; y: number; angle: number; radius: number; time: number }[]`, cosmetic, life 0.4 s, cleared in `clear()`.
- Produces: `LUI_CUTTER = { flip: 0.45, flipHeight: 50, land: 0.15, dash: 0.2, dashDistance: 120, damage: 30, cooldown: 9 }` and `LUI_STARS = { spin: 1.2, radius: 150, pull: 160, tick: 0.2, tickDamage: 4, damage: 40, knockback: 520, cooldown: 16 }`.

- [ ] **Step 1: Sky Cutter.**
  - **flip:** an arc from his position over the target to a point 50 px past it, with elevation `sin(πt) * flipHeight`. Halfway over, the target takes `hit(damage)` (if still within 50 px) and an ink slash is pushed.
  - **land:** a short pause, facing the target.
  - **dash:** move `dashDistance` through the target at constant speed. The first contact with the target takes `hit(damage)` and pushes another ink slash.
- [ ] **Step 2: Playful Stars.**
  - **spin:** for `spin` s, enemies within `radius` are pulled toward him at `pull` px/s (direct position nudge like Siren's lure, ground targets only), with `tickDamage` every `tick`.
  - **plant:** the sword stabs the ground; everyone within `radius` takes `hit(damage, outward * knockback)` and an impact.
  - The ring of crescents is drawn live with `inkBrushArc` at several radii rotating fast. The ground pierce reuses the `drawLuiGround`-style shockwave.

---

## Deferred checks (only if the owner authorises verification)

Add these to `checks/` with plain `assert`, in the style of `checks/battle.check.ts` (`new Battle(() => 0.1)`, `resize(1400, 800)`):
- Dismount at exactly ≤ 50%: on foot, stunned, mounted states cleared, aura 0.
- Remount after 15 s: back to mounted, healed by 450 (capped). After 5 s idle: remounts early.
- Remount can't be interrupted (a stun mid-sequence is ignored), and it isn't triggered while a foot skill runs.
- Review Focus 1–5.
- A piercer hits each enemy once and is removed outside the bounds. Barrage respects the projectile cap.
- Heavenly Strike slows the hit target, and its landing knocks up and stuns nearby enemies only.
- Playful Stars pulls, then knocks enemies outward. Allies are untouched by every skill.
- Then run `npm run check` and `npx tsc -b`.
