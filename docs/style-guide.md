# Inkfight V2

Keep the notebook background, handwritten title and simple controls. Ink is `#221f33`,
paper is `#fbf7ec`, Red is `#e5484d`, and Blue is `#3e7bfa`.

The roster contains Honk, Thor, Tiny Arms (T-Rex), Encore (phoenix), Scorch (dragon),
Coral Chorus (siren) and No Thanks (ninja), plus Water, Tower and Tree terrain.
Original 48×48 artwork is baked at 3× resolution.
`src/game/art.ts` holds the shared drawing helpers. `units.ts` registers the seven fighters,
team sprites, Thor's empty-handed pose and the lightning X-ray overlay.

- Honk (`goose.ts`, from main): 45 HP, 150 px/s, 5 damage, 0.3-second pecks and a
  35% chance to cause 0.8 seconds of panic. Keep the little honk arcs and sweat drop.
  `GOOSE_SWOOP` adds a 25% roll every 0.3 seconds while approaching a grounded enemy
  beyond peck reach and within 120 px. A successful roll starts a 0.35-second flight
  and a two-second skill cooldown. Follow the target, stop at peck reach and deal
  one normal peck on contact, including its scare chance. Reset the peck cooldown
  on landing. Show raised wings, tucked feet, an arc and a separate ground shadow;
  aim at the target's face height. Reuse the existing charge state and airborne
  separation rules. Stun, fear or a dead target interrupts the swoop.
- Thor (`thor.ts`): 600 HP, 95 px/s, 26 hammer damage, a 1.1-second normal attack
  cooldown, 240 hammer knockback and 1.4× size. The hammer travels at 420 px/s,
  40 px past its target, then homes, hitting each enemy once per pass. It no longer
  calls down automatic lightning at its turn. Attack reach is 320 px beyond the
  fighters' collision radii; enemy detection is a separate 640 px radius. Once
  spotted, enemies can still be chased beyond detection range.

Thor prioritizes a ground smash when a grounded enemy is within 70 px plus its
collision radius and his hammer is in hand. `THOR_MELEE` sets 32 damage, a 75 px
area and 240 radial knockback. It hits grounded enemies once, spares allies, uses
the normal 1.1-second cooldown and does not consume the shared skill cooldown.
Reuse the slam pose and shockwave from the flying landing. Ranged skill rolls
apply farther away; committed charges and casts finish unless interrupted.

Thor's three skills are configured in `THOR_SKILLS`. When a skill is available,
each eligible attack rolls once: 40% lightning shot, 30% marked storm, 25% flying
charge, and 5% normal hammer. Any selected skill starts a three-second shared cooldown;
normal hammer attacks continue between skills. Stun, fear and an airborne hammer
prevent casting. Setup and pause freeze warnings, flight, projectiles and cooldowns.

- Lightning shot: 28 damage, 400 px range. Thor stands still, raises his hammer and
  charges for 0.7 seconds. Growing hammer sparks and a body shake build with charge
  progress. Stun, fear or a dead target cancels it. At release he aims at the target's
  current position and strikes the first enemy along the line, passing through allies.
  Then chain to the nearest unhit enemy within 130 px of the previous victim, up to
  five enemies total. Every victim takes 28 damage once. Continue from the previous
  victim's position even if that hit killed it; skip dead enemies and allies when
  selecting the next victim. Each hop gets its own visible full-sized lightning link.
  Show the full strike for 0.3 seconds: a thick icy-white core, blue glow, side branches
  and an expanding impact ring. It damages once, then fades without repeated hits.
  Shake uses the simulation tick so it freezes during pause; do not shake the screen.
- Marked storm: a 70 px circle with a filling progress arc warns for 0.9 seconds.
  Then a vertical lightning bolt deals 24 damage and stuns enemies for 1.1 seconds.
  The circle stays at its original position so enemies can dodge. Allies are safe.
  Keep lightning, hammer charge sparks, storm markers and impact rings blue/cyan.
- Flying charge: a raised-hammer 0.4-second windup precedes a 0.45-second flight to
  a fixed point. The body follows an arc above a ground shadow. Landing deals 36
  damage and 460 knockback to grounded enemies within 65 px, once. Show a hammer
  slam pose and a small spreading shockwave. Airborne fighters bypass separation
  and ground melee. Stun or fear interrupts the charge; a dead target cancels its
  windup. Target death during flight does not cancel the already committed landing.
  The flying-charge windup also shakes Thor's body with increasing strength.

Use object references for skill owners and locked targets. Caster death cancels
pending casts and shots. Finished impact visuals can fade out. Clear removes all
fighters and effects and resets all skill state. Do not add a general ability framework.

`battle.ts` runs movement and combat at 60 Hz. Pair scans are capped at 300 fighters;
add a spatial grid only if the cap needs to grow. Keep effects small and quiet.

Mei Yuanzhi is the deliberate exception to small, quiet effects: his talismans spin
with ink-brush trails and leave rune-seal bursts, his barrage has a conjuring circle,
and his fox form keeps an ember aura. Keep the extra flourish inside his own draw
helpers, cap the particles, and add no screen shake.

Yan Jin (`yanjin.ts`, Hero) carries two swords: a slender long sword in hand and a colossal
greatsword slung across his back. White hair with a pink lock, a gold mark around the eye,
a high dark scarf, an open dark coat over a white robe with crossed straps and a rope belt,
and striped trousers. His combo (`YAN_JIN_COMBO`) is three quick long-sword slices, a short
pause, then a greatsword slam (`YAN_JIN_SLAM`) in front of him that knocks every grounded
enemy in range into the air (`knockup`), leaving a crack. Knocked-up fighters are not
grounded, drift with the slam's knockback and land with a brief stun.

With no enemy around and hurt, Yan Jin meditates (`YAN_JIN_REST`): he sits cross-legged with
eyes closed, both swords spin up overhead and plunge point-first into the ground, the long
sword on one side and the greatsword on the other, with a ring, dust and lasting cracks. He
then floats above a turning yin-yang seal on the ground, healing until an enemy appears or
he is hit. The animation is drawn live from the meditation's elapsed time; the float is
visual only and does not change his elevation.
After a moment the swords pull free and circle him on a faint gold ring, opposite each
other, passing in front of and behind him; the cracks stay where they struck.

His effects are ink painting in yin and yang: the long sword's slices leave white (yang)
brush strokes with dry-brush hairs and flicked drops, and the greatsword's smash is a heavy
black (yin) brush stroke ending in an ink splash, with an ink-coloured impact ring.

Yan Jin controls gravity. His first skill, Gravity Seal (`YAN_JIN_SEAL`), fires when an enemy
comes within 80 px: he drives the long sword point-first into the ground and an inked circle
of rotating characters (重力引浮天地陰陽) opens under him, 120 px wide and drawn and tested at
0.6 depth. Every grounded enemy in it, including ones that walk in, floats about 40 px up,
tumbling and unable to act (`float`). After three seconds he pulls the sword out and they all
slam down for 30 damage and a 1.6-second stun. Stun, fear, freeze, being grabbed or thrown, or
his death pulls the sword early and drops them. Nine-second cooldown.
The seal is white with black characters: white is reverse gravity (things float), black, his
black hole, is gravity.

Yang Ward (`YAN_JIN_WARD`): when an enemy projectile (shuriken, spear, spirit sword or talisman)
within 120 px is heading at him, he presses the long sword into the ground and a white yang dome
46 px wide rises with the yang emblem above it. Every enemy projectile entering it hangs still,
haloed in white, for one second; then he spins twice and sends each one back at whoever threw
it (or back the way it came if they died), 1.2 times faster and now his. Seven-second cooldown;
stun, freeze or being moved breaks it and the held projectiles fly on.

His second skill, Catastrophe (`YAN_JIN_CATASTROPHE`), fires when at least two enemies are
within 100 px (22-second cooldown, first available six seconds after spawning). He plants the
long sword and a Gravity Seal lifts them; he leaves the sword standing, backflips back and up,
and hovering there grows the greatsword into a colossal black blade trailing ink smoke. He
cleaves down through the floaters (35 damage) with a giant black brush stroke and lands; a
black hole opens above the spot and spins them inward for two seconds, then bursts: a white
flash, an ink shock ring and thrown ink, 70 damage to every floater and to grounded enemies
within 140 px, and everyone, Yan Jin included, is thrown clear. Once started it cannot be
interrupted, and he cannot be hit while airborne. Plain impact rings must keep a life of at
most 0.4 seconds, or their radius goes negative.

Object references keep hammer owners and hit targets distinct when fighters die.

Wandering follows the pre-V2 stash: at 40% of normal speed, choose a heading every
90 ticks (1.5 seconds), with every third leg a rest. Stable fighter IDs stagger
headings and rests so a death does not reshuffle the crowd's movement. Find enemies
in Honk's original local search area (32 px cells, at least five cells in each direction)
or the explicit detection radius (Thor: 640 px, Tiny Arms: 520 px);
already spotted enemies can be chased beyond that area. Combat, stun and an airborne
hammer take priority over wandering. Clear resets the clock and IDs.

When an enemy attacks a fighter, that fighter and its entire allied group target
the attacker, even outside passive sight. Red and Blue rally teammates across
species; free-for-all rallies the victim's species. Keep this retaliation target
ahead of nearest-enemy selection until another attack rallies them to a new
attacker, or the attacker dies or becomes an egg. A lethal hit still rallies the
survivors. Temporarily held attackers cannot be hit until released. Damage to an
occupied tower alerts its occupant and group, as do charm and fear attacks.

Retaliating Thor fights instead of seeking an empty tower; perched Thor directs
his summoned lightning at the group's attacker. Movement, range, tower protection,
flight, water boundaries, cooldowns, committed skills and control effects still
apply. Falling damage has no attacker and does not rally a group. Clear removes
retaliation references along with ordinary targets.

Spawn with the hit-size timer at zero. Setup freezes simulation timers, so starting
new fighters with a size pop would leave them enlarged until Start. Keep the brief
size pop for actual hits. Thor catches with a brief raised-hand pose instead of
a size pop; throwing uses a small recoil and an extended arm. His ready, empty,
throw and catch sprites share one hammer drawing with the projectile. Keep the
metal facets, small rune, beard strands and helmet highlights readable at game size.

`src/App.tsx` owns placement, selection and setup/running/paused controls.
`src/index.css` owns the page. Setup and pause freeze all simulation and effects.
Clear removes all fighters and effects, returns to setup and keeps the selected team
and fighter. Selected Red or Blue teams cooperate across species. As on main,
free-for-all means alliances by species, with different species fighting each other.

Tiny Arms (`rex.ts`, migrated from the pre-V2 stash) has 850 HP, 80 px/s,
40 bite damage, 0.9-second attacks and 120 knockback. His polished artwork uses
one curved tail/body/head silhouette, a cream belly, a broad snout, a large
expressive eye and sturdy clawed feet. He is 2× sprite size (one third larger than
the first migration), with radius 19 and 74 px placement spacing to match.
Draw the body, hinged jaw and tiny arm separately, with the caught fighter dangling
inside the jaw. Each surviving bite on a smaller grounded enemy rolls a 35% grab
chance. Hold for 0.7 seconds, deal quarter-bite damage every ten ticks, then fling
at 330 px/s for 264 px in the facing direction with a little random spread.
Thrown fighters follow an arc, tumble, ignore ground separation and cannot steer
or attack until landing. Landing deals 18 damage to the victim and 9 damage with
150 knockback to nearby enemies of the thrower within 22 px plus their radius.
Show orbiting stars and slow the victim for 1.5 seconds. Held fighters cannot act
or be selected or hit by other fighters; grabbing cancels pending charge actions.
Stun pauses shaking. Holder death drops the victim; victim death frees the jaw.
Clear removes grab and throw state. Team rules apply to both bites and landings.

`TREX_ROAR` gives Tiny Arms a 25% roar chance when a live enemy is within 180 px,
his attack cooldown is ready and he is free to act. A successful roar replaces
that bite, scares every unheld, unthrown enemy within 180 px for 1.5 seconds and
starts a five-second skill cooldown. Reuse fear and `scaredBy` so victims run away
from the roaring T-Rex; allies remain calm. Failed rolls wait 0.9 seconds before
retrying, including during pursuit. For 0.55 seconds show a wide-open jaw, a slight
body tremble and expanding sound arcs; he stands still during the roar. Stun or
fear cancels the remaining pose. Setup and pause freeze all timers; death and Clear
remove roar state. Detection reaches 520 px independently of his bite and roar ranges.

Encore (`phoenix.ts`, migrated from main) keeps her orange flame tail and crest,
with swept crimson-and-gold tail feathers, a layered folded wing, cream chest
markings, a flame crown, tiny claws and a bright, mischievous eye. Keep these
details broad enough to read at game size and the team bandanna visible.
She has
200 HP, 70 px/s, 1.25× size, 3-damage fire cone every 0.15 seconds and a two-second
burn at 9 HP/s. Once per second on a breath hit, a flame ring heals Encore and
allies within 80 px of the hit for 10 HP, capped at their current form's maximum.
Her first death clears burns, fear, stun and grab/throw state and becomes an
invulnerable stationary egg. Enemies ignore the egg. After 2.5 seconds it hatches
into a furious 70-HP chick: 190 px/s, 4-damage pecks every 0.16 seconds, 15 knockback
and a 1.5-second burn. Eight seconds later she grows back at full health, with
rebirth spent. A chick death is final too. Use the original egg and chick artwork;
keep team bandannas on the adult and chick. Fire, healing and lifecycle timers
freeze with pause/setup and Clear removes their effects.

Scorch (`dragon.ts`, migrated from main) keeps his green body, with a scalloped
wing membrane and finger bones, a curling spined tail, plated cream belly,
stocky clawed feet, ridged horns, scale clusters and an expressive, bright eye.
Keep these details readable at game size. His original stats are 700 HP, 42 px/s,
1.7× size, radius 16 and spacing 70. Every 0.15 seconds, breathe a 95 px fire cone
for 5 damage and 25 knockback, leaving a 3.5-second burn at 9 HP/s. Reuse Encore's
cone and flame drawing; healing rings remain exclusive to Encore. Team rules,
egg immunity, pause, setup, death and Clear follow the existing battle loop.

Coral Chorus (`siren.ts`, migrated from main) has flowing pink hair with bright
strands, a coral ornament, pearls, a scalloped seashell top, a curling scaled teal
tail with layered fins and a microphone with a silver grille. Keep her singing
expression and team bandanna clear. She has 90 HP, 40 px/s and a 220 px ballad.
She is water-bound: dry placement creates a small pond. Movement, fear, shoves,
separation and throws stop at dry shores, including gaps between separate ponds.
While held she follows the holder, then returns to the last reachable wet position
on release. Resize rehomes her to surviving water, or creates a new small pond.
Enemies follow the song for 0.3 seconds after each pulse and cannot attack while
charmed. Charm interrupts windups, releases grabs and ends when the singer dies.
After at least two seconds of ballad, an enemy within 70 px plus its radius
triggers three seconds of death metal. Metal hits enemies in that area for 7
damage and 45 knockback every 0.2 seconds, and releases the charm so they can fight.
Show floating pink notes, charm hearts, and lime lightning shapes for metal.
Both songs spare allies; pause/setup freeze all song and charm timers.

No Thanks (`ninja.ts`, restored from the pre-V2 roster) has a layered dark hood,
armour panels, wrapped gloves, boots, belt pouches, mint scarf and a curved katana
with a bright edge and gold guard. Bake ready, poke and slash poses. He has 70 HP, 115 px/s movement,
9 damage, 155 px range, a 0.75-second attack cooldown, 35 knockback and 26 px
placement spacing. Use his katana for close attacks. Shuriken spin as they travel at 420 px/s, stop on the first
enemy they hit, pass through allies and respect tower protection. Damage uses
the shared hit path so victims and their allies retaliate.

With his skill ready, a grounded enemy within 125 px and beyond the combined
collision radii plus 12 px triggers a 0.22-second dash at 520 px/s. Land one
2.2× damage hit with 180 knockback and start a 3.2-second skill cooldown. Dash
does not make him fly; stun, fear, charm, grabbing or an invalid target cancel
it. Within 130 px of an enemy, he retreats for 1.1 seconds when below 40% HP,
when its radius exceeds 1.4× his own, when its damage is at least 65% of his
remaining HP, or when three enemies are within 80 px. Preserve team and FFA
alliances, group targeting, water movement, pause and Clear. Clear and death
remove his dash and travelling shuriken. The Character shortcut is 7.

Ninja prefers a tree within 420 px over an empty tower. On reaching a tree, hide
him in the foliage at 62 px elevation, with the canopy drawn over his body.
Hidden Ninja is excluded from enemy target selection, retaliation, lightning
chains and locked pursuit. Damage reveals him; burning or control effects keep
him exposed. Incidental area damage can still hit him. Each tree shelters only
one Ninja, regardless of team. Claim its slot on entry and settle for 0.4 seconds
before attacking. Leaving to slash frees the slot; reserve an available slot
before starting the return backflip. If another Ninja claimed the home tree,
choose another free tree or remain on the ground. Death, capture, interruption
and Clear release claimed slots.

When an enemy comes within 180 px and his 3.2-second skill cooldown is ready,
Ninja reveals himself and blinks from the tree through a grounded target over
0.18 seconds, ending 36 px beyond the target's initial position. There is no
walking approach or preliminary poke. Sweep the whole travelled segment for one
19.8-damage katana slice with 180 knockback. Show a mint movement streak, drawn
blade and broad pale slash arc. Both tree ambushes and ordinary dash hits leave
a bright, mint-edged crescent and impact streaks at the enemy for 0.3 seconds.
Animate their expansion and fading with simulation time so Pause freezes them
and Clear removes them. After the slash, stay visible and grounded for two
seconds, then run on the ground until within 64 px of an available tree before
backflipping into it over 0.55 seconds, with a 44 px
jump arc and one backward
rotation; hide again on landing. If the target dies or becomes unavailable, jump
back instead of pursuing another enemy mid-combo. Control effects or grabbing
interrupt the ambush. The two-second tree re-entry cooldown also applies after
an ordinary dash slash and cannot be bypassed by another tree or an interruption.
Ninja may fight or retreat on the ground while recovering. Pause freezes every phase and Clear/death remove all cover
and combo references. Retain the old timid behavior outside tree ambushes.

Ninja can also occupy a tower, respecting its single slot, climb and protection
rules. Throw shuriken downward from the roof with matching projectile elevation;
use the katana against a close enemy at roof height. Lightning stays exclusive
to Thor. If a tree becomes available within 64 px, Ninja backflips out of the tower to
hide there, freeing its slot. Resize keeps the home tree as the return destination.

Water uses the original `water.ts` renderer: smooth pale shallows, teal shores,
deeper blue centers on broad ponds and softly drifting patches. `terrain.ts`
stores an 8 px mask and overlapping brush stamps, preserving terrain on resize.
Use W or the Water tray button to paint ponds with click/drag or Enter. Water is
independent of team and the fighter cap. Grounded land movement is halved; Coral Chorus
swims at full speed. Airborne movement is unaffected. Show translucent submerged
bodies and a pale waterline. Surface drift follows battle ticks so setup/pause
freeze it. Clear removes the water too. Keep the tray scrollable on small screens.

Tree (E) is a cover brush in Terrain, with a leafy green crown, branching brown
trunk, roots and a soft ground shadow. Reuse its drawing for the tray icon and
battlefield. Click, drag or press Enter to plant trees; use 60 px placement
spacing and a 200-tree cap. Preserve them on resize, keeping the 108 px tree in
view, and remove them with Clear. Draw trees and towers after characters,
projectiles and battle effects so their opaque shapes cover anything overlapping
them. Sort trees and towers together by their base Y position, ascending, so
lower bases appear in front of higher ones regardless of placement order. Use
base X to resolve equal Y positions without reordering the simulation arrays.
Ninja can hide in
the crown and return to it after a katana ambush.

The Terrain category also contains Tower (T), a stone structure 164 px tall with
battlements, narrow windows, a wooden door and a gold flag. Click, drag or press
Enter on the battlefield to place towers. Keep their bases at least 80 px apart,
cap placement at 100 towers, and leave room above the roof for its occupant when
resizing. Clear removes towers alongside the water and releases their occupants.

Each tower has 500 HP and holds one character, Thor or Ninja, including during ascent. Thor
seeks the nearest empty tower within his 640 px detection range, runs to its base
and climbs to the 128 px roof over 0.8 seconds. From there he stays in place and
always summons his marked lightning instead of rolling for another skill. Use
the existing 0.9-second warning, 24 damage, 70 px area, 1.1-second stun and
three-second cooldown. Team and species alliances still apply.

Ground enemies target an enemy occupant's tower and damage the structure with
their normal attack damage and cooldown. Ground projectiles and lightning cannot
bypass it to damage or stun its occupant; charm, roar and ground melee cannot
reach the roof. Cracks and a health bar show tower damage. At zero HP it collapses
over 0.7 seconds and releases its occupant, who visibly falls, takes 25 damage and
is stunned for one second on landing. Dead occupants free their tower immediately.

Scorch, adult/reborn Encore and Honk can fly up to the occupied roof and attack
the occupant directly with their existing fire or pecks. An egg or phoenix chick
cannot fly. Flight does not consume the tower's one occupant slot. Flyers descend
when their target leaves the tower. Keep attack and burn visuals at their current
elevation, and freeze climbing, flight and collapse during setup or pause.

Honk, Scorch and adult/reborn Encore flap their wings during flight, tower
ascent, hovering and descent. Bake eight wing poses per team and reuse them;
only the wings change shape, keeping faces, bodies and team markings steady.
Use faster beats for Honk and slower ones for Scorch, with a per-fighter phase
offset. Select frames from battle ticks so setup and pause freeze wing motion.
Flying stun overlays use the matching wing frame. Ground poses, phoenix eggs
and chicks keep their existing artwork.

Every fighter walks. Standing poses (and Spartan guard, mantis carry/guard,
Sword Saint on foot) get an eight-frame walk cycle: each draw function takes
an optional stride and swings its legs from the hip with `leg()`/`stride()` in
`art.ts` — partners half a stride apart, diagonal pairs for the dragon, a tripod
gait for ants, shoes shuffling under Mei's robe and a swaying tail for the siren.
Cycles are registered in `units.ts` (`walks`) and built the first time a pose
moves; zombie variants tint the same frames. Frames follow `fighter.phase`, so
pause freezes them, and they only play while grounded, unstunned and unfrozen.
Mounted cavalry keep their gallop; eggs, nests and anthills stay still.

Ant (0) uses its original rust-red three-part body, six legs, antennae, one large
eye and mandibles, with a small team band. Keep its 0.65 sprite scale and 14 px
placement spacing. It bites for 3 damage every 0.45 seconds and moves at 85 px/s.
Ants build at 10, 20, 40, 80 living same-side workers, preserving builders and
doubling only on completion. Gather at a nearby dry site with 70 px clearance
from other hills or towers, enter over 0.25 seconds, then dig for three seconds.
Show the original earthy mound rising, worker counts, a progress bar and hopping
dirt flecks. Workers disappear underground and emerge alive after completion or
destruction. Hills stay rooted, take damage, and hatch an ant every four seconds.
They count toward the current 300-entity cap and wait at capacity. Hide Anthill
from paint brushes; keep its count in the tally. Free-for-all ants and hills ally.

Available ants carry permanent enemy remains to completed friendly hills in
crews of two to eight. Draw still fallen sprites, thin grip lines and a hauling
lean; full crews must be present before a body moves. Interrupted workers stop
the load; replacements can join. Deliveries shrink through the entrance over
0.6 seconds, without changing production. A lost hill releases its workers and
drops incoming bodies. Construction preempts hauling, dragon meals are exclusive,
and a phoenix's temporary rebirth leaves no collectable body. Keep at most 4,000
ant remains. Pause/setup freeze activity; Clear resets bodies and colony progress.

Migrate one creature at a time from `main` or the stash `Before Inkfight V2 restart`,
bringing only what it needs. Do not restore the whole old simulation or roster.

Do not run tests, builds, linters, type checks, dev servers or browser verification
without the owner's permission. Finish each change, then ask whether to test it.

Meng Chuan (`mengchuan.ts`, Hero). His first skill, Autumn Breeze (`MENG_BREEZE`), fires when an enemy is
50–220 px away: he dashes straight through it at 950 px/s, stops 22 px behind its far side and turns to face its
back. Every grounded enemy within 20 px of the blade's path is cut once for 42 damage and frozen mid-recoil (held
in a leaning-back hit pose, stunned, with a turning ring of blue-green wind and circling ginkgo and bamboo leaves
instead of stun stars) until the painting has played, then moves normally. Stun, fear, freeze, a lure, a grab or a
throw ends the dash. Seven-second cooldown.
While he dashes, only a thin painted cut follows him. When he stops it swells into the main stroke, and five
slashes in blue, green and gold sweep across it one after another as curved arcs, then two long white hairline
cuts. Each slash is an ink-brush stroke: colour ghosts fringing it like misregistered print, an ink underlayer, a
colour wash brightening to white at the head, broken dry-brush hairs, a razor-white edge and flicked ink, with
shards spinning off. `drawMengSlashes` takes `curve`; 0 gives a straight version, kept for later.
Behind the slashes a painting of the autumn wind spreads along the cut straight onto the battlefield, with no scroll,
silk or frame: blue far peaks and green near hills rising out of nothing at both ends, with ink texture strokes,
drifting mist, a pale gold sun, wild geese, three flowing wind ribbons with cloud curls, a swaying ginkgo branch,
the inscription 秋风 and a red seal. Ginkgo and bamboo leaves blow out of it and gusts race past. Everything
dissolves after 2.4 seconds.
He is a master of the parry (`MENG_PARRY`): each enemy hit (melee or projectile) has a 75% chance to be turned aside
for no damage while he is on his feet and free (not stunned, frozen, scared, grabbed, thrown or mid-dash).
Damage over time is never parried. He turns to the attacker and holds a guard pose, the jian raised across his face,
for 0.25 seconds. The parry spark is a curved ink-cyan-white blade flash, a four-point glint, a pale ring, gold
sparks sprayed back at the attacker and a ginkgo leaf knocked loose; only one spark shows per guard.
Five Autumn Shadows (五影秋斩, `MENG_CLONE`): each parry against a grounded enemy within 260 px has a 30% chance
(10-second cooldown) to split him into five figures that surround it evenly in a circle, cyan-glowing clones and
him among them, he on his own side. He cannot be hit until it ends. The enemy is held, glancing from figure to figure under a brush
question mark, then strikes a clone, which shatters into ink, shards and a leaf. He and the other three dash straight
through it to the opposite side of the circle, crossing like a star, and cut for 64 damage; he lands at its back. It freezes in its hit pose under the straight slashes (`drawMengSlashes`, `curve` 0)
while the clones dissolve into ink, and the name 五影秋斩 is drawn above it. The characters slide in and float,
filled with the slash colours flowing through them, with colour fringes and a brush stroke sweeping under them.
The enemy's death or escape ends it early.
His palette is yellow, blue and green; that is the deliberate difference from Yan Jin's black-and-white yin and yang.
