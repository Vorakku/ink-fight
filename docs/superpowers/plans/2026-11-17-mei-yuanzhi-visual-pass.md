# Mei Yuanzhi Signature Visual Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every Mei Yuanzhi attack and skill a readable talisman-sorcery look, changing drawing code only.

**Architecture:** Extend the drawing helpers in `meiyuanzhi.ts`, add a few visual-only impact flags and call sites in `battle.ts`, and leave the simulation untouched. All new geometry is deterministic from `tick`, so Pause freezes it and Clear removes it.

**Tech Stack:** TypeScript, Canvas 2D, Vite.

**Spec:** `docs/superpowers/specs/2026-11-17-mei-yuanzhi-visual-design.md`

## Global Constraints

- Do not change any `MEI_*` gameplay value except visual lifetimes `MEI_TALISMAN.burst`, `MEI_FOX.blast`, `MEI_CLAW.show`.
- Do not add screen shake.
- Do not run tests, builds, linters, type checks or dev servers without the owner's permission (README rule).
- Never exceed 12 tumbling scraps, 8 embers or 6 charm ornaments in any single effect.
- Draw new ambient effects only for Mei (`species === 'meiyuanzhi'`), never for every fighter.
- Existing check file `checks/meiyuanzhi.check.ts` must remain valid and untouched.

## Review Focus

- **Crowded fights:** effects must not cover fighters; keep all cores under 12 px and outlines thin.
- **Pause/setup:** new animations must read `battle.tick`, not wall time, so they freeze.
- **Clear/reset:** no state leaks, so no new fields on `Fighter` or `Battle`; everything derives from existing timers.
- **Projectile direction:** trail must sit behind the flight heading, not the paper's spin angle.
- **Zombie/other species:** no fox or talisman draw may appear for a converted or unrelated fighter.

---

### Task 1: Talisman burst language and impact dispatch

**Files:**
- Modify: `src/game/meiyuanzhi.ts` (imports already include `C`, `line`, `poly`, `box`, `ellipse`, `INK`)
- Modify: `src/game/battle.ts:214` (Impact), `:3337-3351`, `:3438-3447`, `:3573-3592`, `:5240-5272`

**Interfaces:**
- Consumes: existing `MEI_TALISMAN`, `MEI_FLAME`.
- Produces:
  - `MEI_TALISMAN.burst: 0.7`
  - `drawTalismanBurst(c: C, x: number, y: number, radius: number, progress: number, tick: number): void`
  - `Impact.talisman?: boolean`

- [ ] **Step 1:** Add `burst: 0.7` to `MEI_TALISMAN` and write `drawTalismanBurst` in `meiyuanzhi.ts`:
  white core for `progress < 0.22`; an 8-lobe irregular ink-splash path expanding to `radius * (0.4 + progress * 0.7)`; a thin `FOX_TIP` ring; 9 tumbling paper scraps placed by `Math.sin(k * 12.9898 + tick)` hashed angles; a ground seal ring at `y` with 5 tick marks and a pentagon, alpha `1 - progress`. Clamp via `Math.min(1, Math.max(0, progress))`.
- [ ] **Step 2:** Add `talisman?: boolean` to the `Impact` interface and, in the impact render loop, branch before the generic render: `if (impact.talisman) { drawTalismanBurst(c, impact.x, impact.y, impact.radius, 1 - impact.life / MEI_TALISMAN.burst, battle.tick); continue }`.
- [ ] **Step 3:** In `talismanBurst`, `mineBlast` and `meiStunBomb`, replace the generic `this.impacts.push({ ..., life: 0.4, color: MEI_TALISMAN.color })` with `talisman: true` and `life: MEI_TALISMAN.burst`. Keep the existing smoke impact beside it. Do not change radius or damage.
- [ ] **Step 4:** Ask the owner before running `npm run build`; expected: clean build. No visual verification without the dev server.

---

### Task 2: Flying talismans and hovering charms

**Files:**
- Modify: `src/game/meiyuanzhi.ts` (near `drawTalisman`, `drawFoxTalisman`)
- Modify: `src/game/battle.ts:6100-6112` (projectile render)

**Interfaces:**
- Consumes: `MEI_TALISMAN`, `MEI_BARRAGE.ring`, `FOX`, `FOX_TIP`.
- Produces:
  - `drawTalismanShot(c: C, x: number, y: number, heading: number, tick: number, power: number): void`
  - `drawTalismanHover(c: C, x: number, y: number, tick: number): void`
  - `drawFoxShot(c: C, x: number, y: number, heading: number, tick: number): void`

- [ ] **Step 1:** `drawTalismanShot` draws, behind the slip: a tapered line from `x - cos(heading) * 26` to `x` (width 6→1, `MEI_AURA[0]`, alpha 0.18) and two ghost slips at `-12` and `-24` px along `heading` at alpha 0.25/0.12. Then call `drawTalisman(c, x, y, heading + Math.sin(tick * 0.4) * 0.25, 1 + Math.min(3, power / 40))` and 3 ember dots shed along the heading with a hashed jitter. Cap ember radius at 1.6 px.
- [ ] **Step 2:** `drawTalismanHover` draws a `FOX_TIP` halo ring of `MEI_BARRAGE.ring * 0.55` at alpha `0.25 + 0.15 * sin(tick * 0.2)` plus the slip via `drawTalisman(c, x, y, Math.PI / 2 + tick * 0.06, 1)`.
- [ ] **Step 3:** `drawFoxShot` draws a three-ghost flame wake behind the head along `heading` (each a `FOX` circle of radius `8 - k * 2` at alpha `0.2`) then calls the existing `drawFoxTalisman(c, x, y, tick)`.
- [ ] **Step 4:** In the projectile render loop, pass the heading: `const heading = Math.atan2(star.vy, star.vx)`; for a fox talisman call `drawFoxShot(c, star.x, star.y - star.elevation, heading, battle.tick + star.owner.id)`; for a hovering talisman (`star.hold !== undefined`) call `drawTalismanHover`; otherwise `drawTalismanShot(c, star.x, star.y - star.elevation, heading, battle.tick + star.owner.id, star.power ?? 0)`.
- [ ] **Step 5:** Ask the owner before building.

---

### Task 3: Barrage circle, flip streak, shield barrier

**Files:**
- Modify: `src/game/meiyuanzhi.ts` (`drawMeiShield`, new helpers)
- Modify: `src/game/battle.ts:5609-5621` (fighter render), `:1582-1585` (shield absorb)

**Interfaces:**
- Consumes: `MEI_BARRAGE`, `MEI_ESCAPE`, `MEI_AURA`, `drawTalisman`.
- Produces:
  - `drawMeiConjure(c: C, tick: number, progress: number): void` — local sprite coords, feet at origin.
  - `drawMeiFlipStreak(c: C, progress: number, facing: number): void` — local sprite coords.
  - rewritten `drawMeiShield(c, tick, fill)`.

- [ ] **Step 1:** `drawMeiConjure` draws a ground ellipse rune ring (`ctx.ellipse(0, 0, 26, 9)`) in `MEI_AURA[0]`, two counter-rotating pentagon paths (`tick * 0.03` and `-0.045`), 6 orbiting charms from `drawTalisman` at radius 24, and rising motes. Alpha scales `0.35 + progress * 0.35`; overall alpha capped at 0.75.
- [ ] **Step 2:** `drawMeiFlipStreak` draws a single crescent arc behind him: `ctx.arc(0, -16, 22, Math.PI * 0.15, Math.PI * 0.85)` in `FOX` with line width `4` and alpha `0.35 * (1 - progress)`, plus a white inner arc at width 1.2.
- [ ] **Step 3:** Rewrite `drawMeiShield`: replace the bubble circle with six hex segments (`for k in 0..5`) at radius 24, stroke `#8a4fd0` plus a `FOX_TIP` highlight arc; keep the soft fill; add a rune ring rotating at `tick * 0.05`, 6 charms (down from 5), and brightness `fill`-driven: outer stroke alpha `0.5 + fill * 0.4`.
- [ ] **Step 4:** In the fighter render, before `drawImage` (after the meditation aura block): if `fighter.mei?.kind === 'barrage'`, call `drawMeiConjure(c, battle.tick, 1 - fighter.mei.time / (MEI_BARRAGE.count * MEI_BARRAGE.interval))`; if `meiFlip !== null`, call `drawMeiFlipStreak(c, meiFlip, fighter.facing)` just before the sprite threshold so the streak sits behind him.
- [ ] **Step 5:** In `hit`, inside the shield branch, after `absorbed += damage`: `this.impacts.push({ x: target.x, y: target.y - 20, radius: 20, life: 0.2, color: '#f2e6ff' })`.
- [ ] **Step 6:** In `stepMei`'s flip branch, add a takeoff kick (`radius 16, life 0.3, color: MEI_TALISMAN.color, talisman: true`) when `elapsed - DT < 0` and a reappear burst at the end beside the existing landing smoke. Keep all existing impacts.
- [ ] **Step 7:** Ask the owner before building.

---

### Task 4: Fox kit — blast, transformation, aura, claw, summons

**Files:**
- Modify: `src/game/meiyuanzhi.ts` (`MEI_FOX`, `MEI_CLAW`, `drawFoxBlast`, `drawFoxClaw`, new helpers)
- Modify: `src/game/battle.ts:3486-3513` (slam/summon), `:5609-5618` (fighter render)

**Interfaces:**
- Consumes: `MEI_TRANSFORM`, `MEI_FOX`, `MEI_FLAME`, `drawFoxTails`.
- Produces:
  - `MEI_FOX.blast: 0.75`, `MEI_CLAW.show: 0.3`
  - `drawMeiTransform(c: C, tick: number, rise: number, progress: number): void` — local sprite coords.
  - `drawFoxAura(c: C, tick: number, id: number): void` — local sprite coords.
  - rewritten `drawFoxBlast` and `drawFoxClaw` (signatures unchanged).

- [ ] **Step 1:** In `drawFoxBlast`, keep the signature. Add an early white flash (`progress < 0.18`), a second shockwave ring at `r * 0.7` delayed by 0.12 progress, 12 rays (up from 10), 7 tumbling scraps, a ground seal at `y` with tick marks, and raise the ghost fox to `2 + progress * 3.4`. Replace the fill-only rising head with a head that has an open-mouth `poly` gap. Keep alpha changes monotonic. Cap `r` growth as today.
- [ ] **Step 2:** In `drawFoxClaw`, thicken the outer stroke to 5, add a `FOX_TIP` core at 1.6, extend each claw curve by 2 px, and add 5 ink flecks at the ends (hashed by `k`). Alpha already fades by progress.
- [ ] **Step 3:** `drawMeiTransform` draws a vertical cone of light from `(0, 0)` to `(0, -90)` (gradient `MEI_AURA[0]` → transparent), two rings at `y = -rise * 80` that rotate opposite ways, 6 charms spiralling up with `angle = tick * 0.05 + k`, and a ground seal at feet whose alpha rises with `rise`. At `progress > 0.75` add inward radial brush strokes (8 lines from radius 60 to 20).
- [ ] **Step 4:** `drawFoxAura` draws a quiet ground ellipse (`FOX` at alpha 0.12 + 0.04·sin), 3 drifting embers using `tick` and `id`, and a faint tail-shaped arc. Overall alpha ≤ 0.3.
- [ ] **Step 5:** In the fighter render: if `meiFox`, call `drawFoxAura(c, battle.tick, fighter.id)` before `drawFoxTails`; if `transform !== null`, call `drawMeiTransform(c, battle.tick, meiRise, transform / (T.rise + T.hover + T.slam))` after the existing `drawMeditationAura`.
- [ ] **Step 6:** In `meiSlam`, add a wide talisman burst (`radius: T.radius * 1.15, life: MEI_TALISMAN.burst, talisman: true`) after the existing fox blast. In `summonMeiSpirits`, add `this.impacts.push({ x: spirit.x, y: spirit.y, radius: 24, life: 0.45, talisman: true })` beside each smoke puff.
- [ ] **Step 7:** Ask the owner before building.

---

### Task 5: Star dash, meditation, documentation

**Files:**
- Modify: `src/game/meiyuanzhi.ts` (`drawMeiStar`, new `drawMeiMeditate`)
- Modify: `src/game/battle.ts:5609-5610` (meditation aura block)
- Modify: `README.md` (Mei section), `docs/style-guide.md` (effects rule)

**Interfaces:**
- Consumes: existing `drawMeiStar` signature, `starVertex`, `MEI_STAR`.
- Produces: `drawMeiMeditate(c: C, tick: number, id: number): void`.

- [ ] **Step 1:** In `drawMeiStar`, keep the signature. Widen the outer trail to `9 + thrown * 6`, add a white inner core line at 1.2 px, place a polygon seal at the centre once `s > 1` (alpha ramps to 0.5, shrinks as `thrown` approaches 1), and at each completed vertex draw a 4-point rune flash (alpha `max(0, 1 - (s - j) / 1.5)`). Add 5 spark dots hashed along the drawn path.
- [ ] **Step 2:** `drawMeiMeditate` draws 4 charms orbiting at radius 22 (`tick * 0.03 + k`) and 6 soft specks rising, alpha ≤ 0.4.
- [ ] **Step 3:** In the fighter render, inside the `meditating` aura branch, add `if (poses.mei && !fighter.zombie) drawMeiMeditate(c, battle.tick, fighter.id)`.
- [ ] **Step 4:** Append one sentence to Mei's README paragraph describing the signature look (spinning talismans with ink trails, rune-seal bursts, conjuring circle, fox aura) and add to `docs/style-guide.md`: "Mei Yuanzhi is the deliberate exception to small, quiet effects: his talismans spin with ink-brush trails and leave rune-seal bursts. Keep the extra flourish inside his own draw helpers; no screen shake."
- [ ] **Step 5:** Ask the owner before building.

---

### Task 6: Verification

**Files:** none.

- [ ] **Step 1:** Ask the owner for permission, then run `npm run build`; expected: clean TypeScript build.
- [ ] **Step 2:** Ask the owner for permission, then run `npm run check`; expected: every check passes, including `checks/meiyuanzhi.check.ts`.
- [ ] **Step 3:** Ask the owner for permission, then run `npm run dev` and place Mei against a mixed field; confirm each effect reads, Pause freezes it, and Clear removes it.
- [ ] **Step 4:** Commit the code and docs together.
