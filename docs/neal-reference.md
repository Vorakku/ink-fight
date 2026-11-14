# How Battle Draw does it (reference)

InkFight is inspired by [Battle Draw](https://neal.fun/battle-draw/) on neal.fun. These notes come from
playing it in a browser and studying zoomed-in screenshots and frame sequences (November 2026). Read
them before adding a fighter, a terrain or an effect.

**Borrow the principles, never the content.** No copying Neal's characters, names, art, sounds or
levels. InkFight keeps its own cast (Sir Toast, Honk, Nana, Karaoke Shelly…). The list of what Battle
Draw has is at the end so we can avoid making look-alikes.

## The one idea behind it

The jokes come from **what happens on screen**, drawn quietly and consistently, not from bold doodles or
jokey text. A soldier knocked flat gets dizzy stars; a dead ape floats up as a little ghost. The page is
plain and the fighters are small, so a big battle reads as a crowd of tiny, expressive characters.

## Page and menus

- Plain white page, no texture. All the colour is in the fighters and the terrain.
- The hand-lettered logo is the only "drawn" text. Everything else is small, plain grey text.
- **Fighter tray**: bottom centre, a white rounded panel with a thin border. Tabs (Army, Animals,
  Mythical, Terrain) sit above a row of icons, and the selected icon gets a pale blue rounded box. The
  icons are the fighter sprites with a soft shadow, and the names only show on hover.
- **Tally**: bottom left, a small white card with one row per fighter type on the page: tiny icon,
  bold count, grey name.
- **Buttons**: top right, round icons with no text (clear, pause, sound).
- **Team battle toggle**: bottom right, small and grey.

## Fighters

- **Small**: about 25–30px tall at 1x. Big ones (giant, dragon) are the exception.
- **Thin outline**: about 1px of near-black, never a thick marker stroke.
- **Soft shading**: each body has a lighter top-left and a darker bottom edge, not flat colour.
- **Ground shadow**: a soft, blurred dark ellipse under the feet.
- **People share one body**: a coloured bean/egg shape with two big white eyes and black pupils, and
  little feet. Who they are comes from the **colour plus one hat and one held prop** (helmet and rifle,
  red bandana and katana, crested helmet with spear and shield). You can tell them apart at a glance.
- **Animals are side-on and long**, with legs that actually run. A cheetah is a stretched gallop, not a
  tilting blob.
- **Props move on their own**: guns recoil and puff smoke, weapons swing. The body stays simple.
- **Faces are calm or determined**, and the situation supplies the comedy.
- **Names are plain** ("Soldier", "Ape"). InkFight deliberately keeps joke names and one-line blurbs.
  That's our voice, but the funny bits should also show up on screen.

### New-fighter checklist (InkFight)

1. It fits in the 48×48 sprite box, feet at (24, 44), facing right (see `units.ts`).
2. Its silhouette plus one prop tells you what it is from across the page.
3. Thin outline, soft shading and a ground shadow, like everything else on the page.
4. Its gimmick has a visible reaction (an effect, a pose, a particle), not just a stat.
5. Effects stay small and subtle, about a third of a fighter's size or less.
6. It doesn't copy anything in the Battle Draw roster below.

## Reactions and effects (where the jokes are)

| Moment | What Battle Draw shows |
|---|---|
| Big knockback | Dizzy stars circling the head |
| Death | A small white ghost floats up; the body turns grey and fades |
| Running fast | Short grey speed lines trailing behind |
| Shooting | A muzzle flash and little grey smoke puffs |
| Getting hit | Small impact bits and a brief flash |
| Tree shot | The tree flashes white and leaves fly off |
| Wading | The fighter sinks in, with foam trailing behind (see Water) |

We also saw small red diamond markers over some cheetahs; their purpose is unclear.

## Terrain

Battle Draw's terrain tab has Wall, Water, Ice, Mines, Banana Peel, Barrel and Tree.

### Water (InkFight's version: `src/game/water.ts`)

- **One soft pond**, never visible circles. The shoreline is smooth with a gentle wave and a thin teal
  edge line.
- **Two depths**: a pale cyan shallow rim, then a deeper blue middle that starts about 25px in from the
  shore and has its own thin, darker edge. Thin strokes never get the deep part.
- **Moving patches**: soft light and dark patches drift slowly across the water while the shore stays
  still.
- **Fighters sink**: below a waterline the body shows faintly through the water, and there's a thin white
  line where it meets the surface. They sink more in the deep middle.
- **Wakes**: white foam trails curve away behind anyone moving.

InkFight colours: shallow `#9fe4eb`, shore line `#72c3cf`, deep `#66b9e6`, deep edge `#5aa5d4`.

### Trees and bushes (InkFight's version: `leafyBush` in `units.ts`)

- **Each plant drawn separately**, overlapping its neighbours, not merged into one flat shape.
- **Canopy in three tones**: dark outline, shaded base, lighter clumps nudged up and left, small curved
  leaf-clump marks, a soft highlight top-left, and fine speckles.
- **Ground**: a trunk with little roots, a soft ground shadow and tiny grass tufts. InkFight's bushes
  have no trunk.
- **Depth**: fighters behind a plant are partly hidden by it, and fighters in front cover it. InkFight
  draws bushes in depth order with the fighters (`bushesTo` in `render.ts`).

## How it's built

- Battle Draw: one WebGL canvas, pixel ratio capped at 2.
- InkFight: Canvas 2D, with sprites drawn once into 48×48 canvases at 3× resolution, then stamped.
  Effects like the water's drifting patches are done with cached canvases and blend modes instead of
  shaders.

## Where InkFight still differs

Do these next, roughly in this order:

1. **Thinner outlines and soft shading on every fighter**. Sprites use a thick 2.2px ink line and flat
   fills; changing the shared helpers in `units.ts` restyles everyone at once.
2. **Reaction gags**: dizzy stars on big knockbacks, a ghost on death (alongside the ink splat), speed
   lines behind fast fighters.
3. **Smaller fighters**, and one shared bean body for the People tab, with our own outfits.
4. **Quieter page and menus**: the notebook-paper background and handwriting font compete with the
   fighters. Keep the handwriting for the logo only.
5. **Smaller siren effects**: Karaoke Shelly's notes, hearts and lightning bolts are too big.

## Re-studying Battle Draw

Use the Playwright browser tools:

- **Get detail**: open a new browser context with `deviceScaleFactor: 3`. The default view is 1×, so
  sprites come out tiny.
- **Paint with the mouse**: pick a tab and an item by role (`getByRole('tab', { name: 'Terrain' })`,
  `getByRole('button', { name: 'Water', exact: true })`), then `mouse.down()`, `mouse.move(x, y, { steps })`,
  `mouse.up()`.
- **See animation**: take a few screenshots 400–900ms apart. That's how we found the drifting water
  patches and the sinking fighters.
- **Tidy up**: close the extra context afterwards.

## What Battle Draw already has (don't make look-alikes)

- **Army**: Soldier, Flamethrower, Sniper, Roman, Grenadier, Archer, Cavalry, Ninja
- **Animals**: Boar, Rat, Ant, Ape, Alligator, Piranha, Snake, Cheetah
- **Mythical**: Zombie, Slime, Mage, Giant, Dragon, Necromancer
- **Terrain**: Wall, Water, Ice, Mines, Banana Peel, Barrel, Tree

InkFight's Scorch (a dragon) predates this list. Give future fighters ideas of their own.

### Owner-requested exceptions (2026-11-14)

The owner explicitly requested a ninja with shuriken, a dash and a cowardly retreat. The shared
archetype is allowed; names, art and the panic behaviour remain InkFight's own. No Battle Draw
assets or code are copied. The public [Battle Draw page](https://neal.fun/battle-draw/) was opened
again during this session, but its text only exposes controls, not fighter animation. No new
claim about Neal's ninja behaviour was established by that read.
