# Meng Chuan: Thunder Saint avatar ultimate rework (神雷斩)

## Intent

The Thunder Saint's ultimate, Divine Thunder Slash, becomes a once-per-fight cinematic: a desperation move where
the whole battle stops to watch his lightning avatar come through a door of smoke, and he ends it with one colossal
painted crescent. The user wants it "super special" and as artistic as their reference image (a giant brush-stroke
crescent with a dark cracked ink body, a blazing gold edge, gold flecks, red ink spatter and white dry-brush
calligraphy with a red 秘技 seal, over an ink-wash landscape).

## Decisions made with the user

- It **replaces** the current ultimate (no more 20 s cooldown version).
- It fires **once per fight**, the first time the Thunder Saint drops **below 25% HP**, wherever he is.
- The slash is **one colossal crescent** aimed at the enemies.

## Goals

- A readable cinematic sequence of about 6 s: jump to the centre, enemies freeze, levitate, smoke door, eagle eyes,
  door opens, avatar, lightning storm, grab, slash, land.
- Every enemy on the field held still and shocked until the slash; allies unaffected.
- Ink-painting art that matches the reference: brush texture, gold light, red spatter, calligraphy and seal.

## Non-goals

- A general cutscene or keyframe system.
- Pausing the battle (allies keep fighting).
- Changing his other Thunder skills (crescent cuts, Lightning Step) or other forms.

## Anti-goals

- Neon glow without ink: gold light always sits on ink shapes and brush strokes.
- A cinematic that can repeat: it must never fire twice in one fight.

## Behaviour (my calls, approved in conversation)

Constants in `MENG_GOD` (rewritten). Times are seconds from the trigger.

- **Trigger:** Thunder form, not zombie, `hp < 25%` of max, never used this fight, at least one targetable enemy on
  the field, and not mid–Lightning Step (it waits for the step to end). Sets a once-per-fight flag.
- **Untouchable and unstoppable** from trigger to landing (as now: `hit()` returns false, `yanUnstoppable` each tick).
- **Freeze:** from the trigger until the slash, every enemy on the field (targetable by him) gets `stun` and `shock`
  topped up each tick, so it stands in its shocked pose. Released at the slash; the crescent's own stun follows.
- **Timeline:**
  - 0.0–0.5 **jump:** an arc from where he stands to the centre of the field, peaking 60 px up.
  - 0.5–1.4 **levitate:** rises slowly to 40 px and hovers, bobbing.
  - 1.0–2.0 **door forms:** a tall arched double door of black smoke coalesces behind him, a gold gradient
    glowing round its edge.
  - 2.0–2.5 **eyes:** a pair of sharp eagle eyes on the door open and blaze gold.
  - 2.5–3.2 **door opens:** the two leaves swing apart, light floods out and the avatar is revealed inside.
  - 3.2–4.4 **storm:** the screen shakes harder and harder; lightning strikes all over the field, and each enemy is
    struck once for 20 damage (no knockback).
  - 4.4–4.8 **grab:** a bolt falls into his raised hand.
  - 4.8 **slash:** he cuts toward the thickest group (the enemy with the most other enemies within 160 px; his
    facing if none are left). The colossal crescent launches from him.
  - 4.8–6.2 the crescent sweeps out and grows until it leaves the field, hitting each enemy it crosses once for
    **200 damage, knockback 480, 1 s stun**. The avatar and door dissolve into smoke from 5.4; he descends and
    lands at 6.2.
- **Title:** from the slash, for 2.4 s.

## Art direction

All drawn live in `mengchuan.ts` in the file's existing brush language; coordinates follow the current
`drawMengGod` / `drawMengDivineWave` / title conventions.

- **Smoke door:** a tall arched two-leaf door (about 220 px tall, scaled) built from many soft, drifting dark ink
  puffs that gather into its outline, leaves and lintel, wisps curling off the edges; a gold-to-orange gradient
  glows round the outline and seams. Opening, the leaves narrow apart (squashed horizontally), and a gold light
  pours out of the gap.
- **Eagle eyes:** two narrow, angled, sharp-cornered eyes high on the door (one per leaf), hooked like an eagle's,
  ink-outlined, irises opening from a slit and blazing gold with a glint, and a light trail when they flare.
- **Avatar:** the existing seated lightning god, repainted in the ink style: ink outlines and a gold wash in place of
  the plain bronze glow, smoke trailing off him into the door, its eyes glowing to match the door's.
- **Levitation:** a gold ring and ink motes under him, his hair and sash lifting.
- **Storm:** jagged bolts dropping from above the screen onto random points and onto each enemy, each with an ink
  splash where it strikes and a white flash; red ink spatter dots flicked across the field.
- **Colossal crescent:** one huge brush stroke curved like a crescent, as in the reference: a dark ink-brown body with
  a dry-brush texture and branching dark cracks, a blazing gold gradient along its outer edge and a thinner gold rim
  inside, gold and white flecks glittering over it, a ragged dry-brush tail where the stroke begins, a few lightning
  threads crawling on it, and red ink spatter thrown off it.
- **Title:** 神雷斩 written vertically beside the crescent in big white dry-brush calligraphy (pale strokes with ragged
  split hairs and an ink edge so they read on paper), characters brushed in one after another, a small red seal
  reading 秘技 stamped under them.

## Constraints

- Canvas 2D, effects drawn live; constants as commented `as const` blocks.
- README and `docs/style-guide.md` describe every character; update both.
- User rules: no tests, type-checks or runs before asking; no commits unless asked.

## Left to the builder

Exact shapes, easing and colours inside the art direction; how many smoke puffs and bolts; whether the door and
avatar draw on the ground layer or the overlay (they must sit behind him); the thickest-group tie-break.
