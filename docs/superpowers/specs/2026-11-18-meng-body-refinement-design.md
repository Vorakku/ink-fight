# Meng Chuan: Body Refinement Divine-Demon form (炼体神魔)

## Intent

Meng Chuan's third transformation, the orange bar in his half-health ritual, which so far only rolls gold
(Thunder Saint) or blue (Devil Saint). From Cang Yuan Tu: his body-refinement path and the Red Lotus Karmic
Fire divine-demon body (红莲业火神魔体): red hair, red-gold armour with fire patterns, blazing fists. He drops the
jian and fights with his fists. Sha qi refined into his flesh leaks out of every punch in seven colours.
The user approved the kit below in conversation and asked that the effects follow the game's ink-painting style.

## Goals

- A third form chosen by the ritual: the roll becomes one in three (fire, gold, blue).
- A tanky close-range brawler, clearly different from the Thunder Saint's ranged cuts.
- Every punch leaks one sha colour in turn: red, orange, yellow, green, blue, black, white.
- Effects painted like his existing ones: brush strokes, ink wash and blots, calligraphy title with a seal.

## Non-goals

- The Three Corpses United (三尸归一) upgrade, Xiuluo, or any limit on how long the form lasts.
- A slow effect for the lotus (nothing in the game slows today; the burn carries it).
- Changes to his base, Devil Saint or Thunder Saint kits beyond the ritual roll.

## Anti-goals

- Looking like the Thunder form recoloured: no jian, no crescents, no lightning.
- Neon/glow-heavy effects that drop the ink look. Colour sits in ink wash and brush strokes, outlined in ink.

## The kit (approved numbers; tune later)

Form name: Body Refinement Divine-Demon (`MENG_BODY`), ritual index 0 (the orange bar).

- **Stats:** speed 175, range 16, cooldown 0.3, damage 22, knockback 120 (heavy for a punch). Colour: red-orange.
- **Undying Body (passive):** takes 30% less damage from enemies; regenerates 10 HP/s while alive, in or out of
  combat. Keeps the shared parry (90%, projectiles batted back), now a forearm block: the parry pose raises a
  blazing gauntlet across his face instead of a jian.
- **Basic combo:** four punches: left jab, right, left, then a heavy straight. The fourth hits everything in a short
  cone in front of him (about 40 px reach, 60° wide) for 1.5x damage and double knockback. Each punch (each cone
  burst counts as one) advances the sha colour by one.
- **Skill 1, Seven Sha Fists (七煞拳):** an enemy 1..250 px away makes him rush to it (fast dash, like Autumn Breeze's
  speed) and throw seven punches about 0.06 s apart, one per colour, 7 damage each, then a burst of all seven colours:
  12 damage and knockback 260 to every enemy within 50 px. Shares `skillCooldown`, 7 s. Ends early if he is stunned,
  grabbed, etc.
- **Skill 2, Sha Kasaya (煞袈裟):** when an enemy is within 120 px and it is ready, a seven-colour mantle wraps him for
  4 s: he cannot be stunned, frozen, scared, knocked up, lured or grabbed (the same clearing Yan Jin's unstoppable
  states use, applied every tick), and any enemy touching him (within both radii + 10 px) is set burning. Own
  cooldown, 12 s. It does not stop him acting.
- **Ultimate, Red Lotus Karmic Fire (红莲业火):** 3 s into the form and every 20 s after, an enemy within 200 px makes
  him leap up (untouchable and unstoppable throughout, like Divine Thunder Slash) and drive both fists down. A red
  lotus of fire 110 px across blooms where he lands: 70 damage and knockback 300 on impact to enemies inside, then it
  burns for 3 s, setting every enemy standing in it burning. The name 红莲业火 slams in over him.
- **Rest:** meditates like the other heroes (red-orange aura). No devils, no bodies, as in the Thunder form.

## How it gets built (approach)

One sensible way: follow the Thunder Saint form exactly. A form flag (`mengBody`), a stats override in
`fighterDef`, its own look table for the sprite, its own `try…`/`step…` pairs in the battle loop, and draw functions
in `mengchuan.ts`. Alternatives considered: a separate species for the form (rejected: breaks the ritual, team
sprites and every `species === 'mengchuan'` check) and a generic "form" system (rejected: one more form doesn't
justify it; three hand-wired forms are still readable).

## Art direction

All effects drawn live in the existing style (`mengchuan.ts` strokes: colour ghosts fringing an ink underlayer, a
colour wash brightening to white, dry-brush hairs, flicked ink; ink blots from `yanjin.ts`'s approach).

- **Sha palette:** red `#d8322a`, orange `#f07a1e`, yellow `#f2c230`, green `#3fa45a`, blue `#2f6be0`, black
  (ink `#221f33`), white `#f6f2ea`. White is always outlined in ink and black is ink with a pale wash halo, so both read on paper.
- **Sha puff (per punch):** at the fist and at the hit point, a small ink blot of the colour with a paler wash
  bleeding past it, three or four dry-brush wisps curling up and away, fading in about 0.4 s.
- **Punch streak:** a short, thick pressed brush stroke along the punch, ink underlayer with the colour wash and a
  white head, from the fist forward; the heavy straight's stroke is longer and splits into dry hairs.
- **Seven Sha Fists:** each punch leaves a fist-shaped afterimage stroke in its colour around the target, the strokes
  overlapping in a fan; the burst blooms like a painted flower of the seven colours with ink splatter and drops.
- **Sha Kasaya:** layered translucent brushed ribbons in the seven colours flowing from his shoulders down around
  him like a monk's robe, edges dry-brushed, rippling; small embers lift off it.
- **Red Lotus Karmic Fire:** a red lotus painted onto the ground in the xieyi manner: petals brushed open one by one,
  each a red wash darkening to the base with an ink outline and vein strokes, a gold seed pod in the middle;
  brush-stroke flames licking up from the petal tips with embers rising; it fades out as it burns down. Title
  in red-gold calligraphy edged in ink and white, with a red seal stamp.
- **Sprite (all poses):** spiky red hair with dark roots and red marks on the face; bare chest with red-gold flame
  armour over the chest and shoulders and a red crack down the middle; both forearms wrapped to the fist in blazing
  gauntlets; dark smoky wing shapes behind the shoulders; dark layered belts with silver buckles, black trousers
  and boots. Eyes of two colours. Poses: ready (fists up), punch (front fist extended), parry (forearm across the
  face), meditate, raise (both fists overhead for the ultimate).

## Constraints

- Canvas 2D, sprites at 48x48 per pose, effects drawn live each frame; follow the file's constant-block-plus-comment
  style (`MENG_THUNDER`, `MENG_STEP`, `MENG_GOD`).
- README and `docs/style-guide.md` describe every character; update both.
- User rule: no tests or runs before asking them (overrides TDD for this task).

## Left to the builder

Exact pixel art, effect timings and easing, how the four-punch combo alternates fists in the sprite (one punch
pose mirrored by a flag, or the streak alone showing which fist), and where the kasaya and lotus draw in the layer order.
