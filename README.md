# Inkfight V2

A fresh starting point for Inkfight, keeping the notebook page and basic controls.

- Red, Blue and Free-for-all selection (R / B / F).
- The original category tabs group the current fighters: Animals (Honk, Tiny
  Arms), People (No Thanks, Spartan, Cavalry), Mythical (Encore, Scorch), Water (Coral Chorus), Bug
  (Ant, Praying Mantis), Hero (Thor, Sword Saint, Mei Yuanzhi), and Miscellaneous (Zombie, Count Chomp). Terrain keeps its
  own tab. Number shortcuts select the fighter and open its category.
- Picking a fighter that has forms shows a row of them under the tray; new fighters start in
  the chosen one at its full health: dragon (up to the golden Super Dragon), phoenix, Tiny Arms
  (Alpha, Black), mantis (Blades, Wings, Hunter), every ant caste and the anthill, and the hero
  transformations (Sword Saint's bamboo, Mei's fox and spirits, Yan Jin's demon, Meng Chuan's
  three). Forms are listed in `VARIANTS` (`units.ts`) and applied by `Battle.applyVariant`.
- Mei Yuanzhi, a calm cultivator with long dark hair, a grey layered robe, purple vest and red
  sash, throws purple talisman bombs with alternating hands (front hand straight forward,
  back hand swung up and over, each released from that hand): 580 HP, 115 px/s, 280 px range, one every 0.7 seconds.
  A talisman flies at 380 px/s and bursts on the first enemy it meets, or where the target
  stood, for 20 damage and 80 knockback to enemies within 40 px. Tuning lives in
  `MEI_YUANZHI` and `MEI_TALISMAN` in `meiyuanzhi.ts`.
  His attacks read as talisman sorcery: thrown charms spin with ink-brush trails and
  burst into a white flash, an ink splash, tumbling paper and a rune seal; the barrage
  conjures from a rotating circle, the escape leaves a crescent streak, the shield is a
  segmented charm barrier, and fox form keeps a quiet ember aura.
  Overwhelmed: each hit on him adds to a melee or ranged count (melee when the attacker is
  within 40 px of touching him) that drains one per second; three triggers a skill. Up close
  he backflips (immune), drops a talisman that stuns enemies within 75 px for 1.6 seconds in
  purple smoke, vanishes at the top and reappears at throwing range on the side farthest from
  other enemies (4-second cooldown). Under ranged fire he raises a talisman shield for two
  seconds that absorbs every hit, then throws it back as one talisman dealing 1.5× the
  absorbed damage in a wider blast (5-second cooldown). The two share one cooldown.
  Tuning: `MEI_PRESSURE`, `MEI_ESCAPE`, `MEI_SHIELD`.
  Flying Fox Talisman: with its 3-second cooldown ready, each throw has a 35% chance to be a
  big purple paper fox head. It explodes on the first enemy, or where the target stood, in a
  90 px purple blast with a rising ghost fox: every enemy inside takes 35 damage, knockback, a
  1.3-second stun and a 2.5-second burn shown as purple flames. Tuning: `MEI_FOX`.
  Talisman Barrage: with its 6-second cooldown ready, each attack has a 25% chance to summon
  sixteen bomb talismans, one every 0.08 seconds, on an arc around his upper body. Each hovers
  for 0.4 seconds, then flies at a point within 50 px of the target (or his current target if
  that one is gone). He stands still while summoning and stops early if the target is gone.
  Tuning: `MEI_BARRAGE`.
  With no enemy around and hurt, he sits cross-legged with closed eyes in a purple aura and
  heals 50 HP per second (`MEI_REST`); he does not fish.
  Nine-Tailed Fox: the first time he drops to 75% health he rises 80 px in a purple aura (immune),
  hangs, then slams down: every enemy within 110 px takes 45 damage, knockback and a 0.8-second stun.
  He lands transformed, with horns, wild hair, a bare red-marked chest, dark flowing trousers with a
  purple hem, clawed hands and nine swaying purple fox tails. In this form an enemy within 30 px of
  touching him is clawed (32 damage, purple claw streaks) instead of getting a talisman, and close
  pressure no longer makes him backflip away. At 50% health three purple nine-tailed Fox Spirits
  (160 HP, 170 px/s, 12-damage claws) appear around him in smoke and go for his foe. Tuning:
  `MEI_TRANSFORM`, `MEI_CLAW`, `MEI_SPIRITS`, `MEI_SPIRIT`.
  Talisman Mine: with its 4-second cooldown ready, each throw has a 30% chance to stick a bomb talisman
  flat on the ground 45% of the way to the target instead (up to four per Mei, lasting 25 seconds). It arms
  after 0.5 seconds with a pulsing rune ring; the first enemy to step on it sets it off, and every grounded
  enemy within 60 px takes 28 damage and is thrown through the air away from it, crashing down dizzy as
  from a T-Rex throw. Tuning: `MEI_MINE`.
  Star Dash: once his Fox Spirits are out, with its 8-second cooldown ready each attack has a 30% chance to
  dash in and trace a five-pointed star 90 px around the target on the ground (six 0.08-second dashes,
  immune), leaving a glowing purple trail. From the last point he throws a big talisman into the centre;
  0.35 seconds later it explodes: every enemy within 150 px takes 70 damage, knockback, a 1.2-second stun and
  a purple burn. Tuning: `MEI_STAR`.
- Kunlun Legend, a lightning swordsman who spams skills: 1150 HP, 165 px/s, a 40-damage swing every 0.45 s.
  Before his first fight he raises his great blade and blue lightning charges it; from then on every plain hit also
  zaps for 20 and a short stun. With no enemy around and hurt, he meditates and heals 50 HP per second. Each time his
  swing is ready he tries, in order: Thunder Shield (below 80% health: lightning strikes him and a crackling dome cuts
  enemy damage by 60% for 6 seconds, 9-second cooldown), Lightning Step (a target within 150 px, 7-second cooldown:
  he laps round it twice in a second, untouchable and trailing afterimages and a lightning ring, dashes through it
  with a 50-damage slice, then lightning strikes it four times for 35 each), Lightning Clones (18-second cooldown:
  lightning hits four spots round him; he reappears at one and three clones at the others, and enemies within 220 px
  are dazed for a second and lose track of him; clones have 120 HP, hit at 20% strength, use his kit except walls,
  Lightning Step, Thunder Shield and more clones, flicker, and fade without a body after 8 seconds or when he falls), Thunder Dive (front flip
  onto a target 60–220 px away, immune in the air, slamming down a lightning strike: 75 damage and a small knock-up
  within 85 px), Crescent Slash (a blue crescent wave flying 200 px: 55 damage, hard knockback), Spark Sway (five
  sparks circle him, then fly as homing bolts at up to five enemies for 35 each), Heaven Strike (instant lightning
  on any target in sight: 60 damage and a stun, 30 to others within 45 px) and Storm Spin (lightning strikes him:
  double speed for 6 seconds, leaving blue afterimages). Shot at from range, he raises five Lightning Walls in an
  arc toward the shooter for 5 seconds (6-second cooldown); they stop shuriken, spears, flying swords, talismans,
  giant swords, lightning waves, Demon Assault fists and enemy sparks, and turn Thor's hammer back. Tuning lives in
  `KUNLUN_SKILLS` in `kunlun.ts`.
- Cavalry, a spear rider on a brown horse: 320 HP, 230 px/s. Mounted, it gallops in and
  circles its target, switching direction every 1.4 seconds, and never stops to attack: every
  0.7 seconds it sweeps its spear, hitting every enemy within 34 px of its edge for 16 damage
  and knocking them outward. At 40% health it falls off the horse (0.8-second stun) and fights
  on foot as a 90 px/s spearman (14 damage, 40 px reach). Tuning: `CAVALRY`, `CAVALRY_RIDE`,
  `CAVALRY_FOOT` in `cavalry.ts`.
- Honk, the white goose (1): quick 5-damage pecks, knockback and a chance to scare enemies.
  While approaching an enemy within 120 px, he has a 25% chance per attack attempt
  to fly into their face. The wing-spread swoop lasts 0.35 seconds, follows the enemy
  and lands one normal peck, with a two-second skill cooldown. Stun, fear or losing
  the target cancels the swoop.
- Sword Saint, a green-robed wuxia swordsman in a conical bamboo hat (team colour
  on the hat band), rides a flying jian with a jade glow and hovers above the page
  (and over water without slowing). He has 550 HP and 130 px/s and keeps 300 px away.
  Spirit swords drift loosely around him, some in front and some behind, each
  trailing green vapour. One gathers every 0.5 seconds, up to ten; he spawns with
  all ten. In a fight he looses one every 0.5 seconds: it swings horizontal for
  0.15 seconds, then snakes toward his target in a weaving curve, trailing vapour, for 18 damage,
  passing allies. Sword Storm: with at least five swords floating, each attack has
  a 30% chance to loose every sword at once with a jade flash (6-second cooldown).
  Close combat: when an enemy comes within 36 px he backflips off his sword while
  every floating sword and his ridden sword fly at it. After 0.45 seconds he blinks
  behind the enemy with a sonic slash (50 damage, jade streak), then fights on foot
  with a five-slash combo (below). The thrown swords
  fly back and float beside him; with each cut one of them (two in bamboo form) steps in,
  either stabbing alongside (+12 damage, +24 on the dash) or standing guard to deflect
  the next whole hit. When the enemy falls he backflips back onto his sword. He is immune to all damage during both backflips.
  With no enemy in sight he rests on his sword: hurt, he sits cross-legged and
  meditates in a jade aura while his floating swords circle him point-down, healing 40 HP per second; at full health he flies to the
  nearest water and fishes with a bamboo rod. Any enemy ends the rest.
  Giant sword: ranged attacks roll his skills when ready (6-second shared cooldown):
  20% giant sword, 30% Sword Storm. Eight spirit swords (not his floating ones)
  converge over 0.8 seconds into a huge blade above him, which charges the enemy
  in 0.45 seconds. Impact cracks a crater (6 seconds) and deals 60 damage, 420
  knockback and a 1.5-second stun to enemies within 75 px.
  On foot he chains five quick slashes 0.16 seconds apart (10 + 2 per sword), then
  a finishing dash through the enemy (30 + 4 per sword) and a 0.7-second recovery.
  While fishing he waits, sometimes adjusts the rod, reels up a fish, boot, tin can,
  seaweed or fish bone, and drifts to new spots on the water. He ignores enemies he can
  merely see while fishing; hit while fishing, he swings the rod and flings a fish into the attacker's face: 8 damage and 2 seconds
  blinded (stunned), with the fish stuck on their face.
  His slashes have their own look: a jade crescent cut with bamboo leaves bursting
  out and drifting down.
  His hover is visual, so ground melee can
  still reach him. Tuning lives in `SWORD_SAINT` and `SWORD_SAINT_SWORDS` in `swordsaint.ts`.
- Thor (2) has 600 HP and three chance-based skills: a charged lightning shot, a marked
  area strike that stuns enemies, and a charged flight ending in a knockback slam.
  When his skills are ready, each attack rolls 40% / 30% / 25% for those skills;
  the remaining 5% throws his returning hammer. Skills share a three-second cooldown.
  During that cooldown he uses the normal hammer, hitting once on each pass.
  His attack reach is 320 px beyond the fighters' radii, with 640 px enemy detection
  and 400 px lightning-shot range.
- Tiny Arms, the T-Rex (3), has a rounded orange silhouette, cream belly, expressive
  face, clawed feet, snapping jaw and flailing arms. At 2× sprite size he is a third
  bigger than his first V2 appearance, with matching collision and placement spacing:
  850 HP, 80 px/s and a 40-damage bite every 0.9 seconds.
  A bite on a smaller grounded enemy has a 35% chance to grab it, shake it for
  0.7 seconds and fling it 264 px. Shaking deals extra damage every ten ticks;
  landing deals 18 damage, leaves the victim seeing stars for 1.5 seconds and
  bowls over nearby enemies. Allies of the thrower are spared. A holder dying
  releases its catch, and Clear removes all held and thrown state.
  He detects enemies within 520 px. With enemies within 180 px, he has a 25%
  chance to roar instead of biting, frightening nearby enemies away for 1.5 seconds.
  A roar opens his jaw and sends out sound arcs for 0.55 seconds, with a five-second
  skill cooldown. Failed rolls wait 0.9 seconds before another attempt. Allies are safe.
  Tiny Arms now eats his kills after combat, healing to full health and gaining
  eight maximum HP per nutrition point. Larger bodies give more nutrition, but
  each completed body counts as one meal. Size and bite reach grow gradually,
  capped at 40% above starting size. At 50 meals he becomes an albino alpha with
  red eyes: 1500 base HP plus earned nutrition, 75-damage bites every 0.8 seconds,
  and 110 px/s movement. Alpha bites bleed living enemies for eight HP per second
  for four seconds; further bites refresh the effect without stacking it. Bleed
  kills leave food for the living T-Rex that caused them. Allies and buildings
  cannot bleed. Feeding pauses for threats or incapacitation, and a corpse can
  only be eaten once. Conversion disables feeding and alpha combat abilities.
  Each adult Tiny Arms can lay one egg in its entire lifetime after twelve
  peaceful seconds. It lays on clear dry ground; combat takes priority, and a full
  creature cap preserves the pending egg. Twenty seconds later the egg hatches
  into a baby at 55% adult size, health and bite damage, using the egg's existing
  slot. Babies grow through five meals before laying their own single egg; normal
  feeding growth and alpha/black progression continue afterward. Eggs cooperate
  with allied T-Rexes in free-for-all and can hatch after their parent dies.
  Losing an egg or child never restores the parent's allowance.
  At 100 permanent enemy kills, independently of meals, he becomes a black,
  spiked T-Rex with armored scales that reduce enemy damage by 25%. Black keeps
  alpha strength and capped size. Its exclusive ram winds up for 0.4 seconds,
  dashes at 360 px/s, catches a smaller grounded enemy and drives it into a battlefield
  edge. A larger creature takes the 50-damage impact and knockback but resists
  being carried or pinned. The wall slam deals 100, stuns for two seconds,
  and pins briefly before release. The ram has a ten-second cooldown.
  Every living T-Rex form can charge a raised-leg stomp for 0.45 seconds against
  even one nearby enemy, dealing 1.25 times bite damage in a 100 px area and
  knocking enemies away. Stomps have a three-second cooldown and take priority
  over roaring when ready, keeping them frequent alongside bites and grab-throws.
  Allies are spared. Stun, freeze, fear, charm, capture, death and conversion
  interrupt these abilities and release ram victims. Clear resets progression.
  Below half of maximum health, a black T-Rex first screams for 0.9 seconds and
  calls three ordinary allied T-Rexes. After that call, while below half health,
  bloodlust adds 40% movement speed and 30% bite damage. The call happens once
  per individual; healing removes the boosts, and reinjury restores them without
  summoning again. Helpers inherit the caller's side, including Free-for-all.
  Full battlefields or blocked dry ground delay only the missing helpers;
  death, conversion and Clear cancel any pending reinforcements.
  The bloodlust aura now has layered red-gold energy, white-gold lightning,
  rising sparks and lifting dust. At the scream's climax, exposed enemies within
  280 px are shocked for 0.35 seconds and flee for three seconds; allies are safe.
  Black T-Rex can also lift creatures smaller than itself and aim its grab-throw at an enemy
  group within 420 px. The marked landing deals 100 damage to the thrown creature,
  plus 75 area damage, strong knockback and two seconds of stun in a 140 px area.
  Allies and sheltered/airborne creatures are spared, and towers protect occupants.
- Thor moves at 95 px/s. With his hammer in hand, enemies within 70 px plus their
  collision radius trigger a ground smash instead of a ranged attack. It deals
  32 area damage in a 75 px radius, knocks enemies away and spares allies. The
  smash uses his normal 1.1-second attack cooldown and shows a spreading shockwave.
- Thor raises his hammer and shakes harder through a 0.7-second lightning charge,
  then releases a thick, branching strike along the firing line. From the first
  enemy it chains to the nearest unhit enemy within 130 px, up to five enemies total.
  Each takes 28 damage once, with visible lightning connecting the hops. Allies are
  skipped, and the strike fades over 0.3 seconds. Stun, fear or losing the target interrupts
  the charge. His flying-slam windup also shakes as energy builds.
- The summoned strike marks a circle for 0.9 seconds before lightning lands, dealing
  damage and stunning enemies for 1.1 seconds. Enemies can leave the circle to dodge.
- The flying attack charges for 0.4 seconds, then flies to a fixed landing point
  over 0.45 seconds. The landing damages and knocks nearby enemies away. Stun or
  fear interrupts the charge; a target dying during the windup cancels it.
- Free-for-all is selected by default and combat starts automatically. Click or drag
  to place the selected fighter. Pause/Play freezes and
  resumes the battle; P toggles pause. You can place more fighters at any time.
- Clear removes all fighters, painted water, hammers, skill effects and ink splats and keeps combat running.
- Red and Blue allies cooperate across species. In Free-for-all, each species is
  its own side: Honks fight Thors, while fighters of the same species are allies.
- Attacking a character rallies its whole allied group against the attacker.
  For example, hit one of five allied phoenixes and all five focus that enemy,
  even beyond their normal sight. They keep that target until a new attack
  redirects the group or the attacker dies. Occupied towers also rally allies
  when attacked. Existing movement restrictions and control effects still apply.
- Encore, the phoenix (4), breathes a broad 120° fan of fire, hitting every enemy
  in its area and leaving a two-second burn.
  Once per second when her breath hits, a ring heals her and nearby allies for
  10 HP. Each final enemy kill also heals her for 20 HP, capped at her current
  maximum health. She has 400 HP and takes 60% less fire and burn damage. At 50 final kills,
  she becomes a large, sleek adult with 650 HP and eight mortar fireballs. At
  100 kills, she becomes a 900-HP legend with three Encore fire sweeps. She has
  one rebirth: an invulnerable, stationary egg for
  2.5 seconds, then a fast 70-HP chick with burning pecks for eight seconds,
  before returning to her evolved form at full health. Kill progress survives
  rebirth; a second death is final.
- Scorch, the green dragon (5), has 700 HP, 1.7× size and moves at 42 px/s.
  His fire cone deals 5 damage every 0.15 seconds with 25 knockback, leaving a
  3.5-second burn at 9 HP/s. Fire spares teammates; free-for-all dragons cooperate
  with other dragons. He uses his original winged, horned artwork.
- Dragons evolve every **50 progress points**: Ice at **50**, Lightning at **100**,
  and Super at **150**. Each permanent kill grants one point, including kills from
  lingering fire and lightning waves. Eating larger prey grants additional progress.
  The green fire dragon becomes a blue **Ice Dragon** at 50 points:
  900 HP, 6 damage and icy breath that slows enemies for 1.4 seconds. At 100 points,
  the violet-and-gold **Lightning Dragon** has 1100 HP, 7 damage and chain lightning
  that briefly stuns up to three enemies every 1.2 seconds. At 150 points, the gold
  **Super Dragon** has multicolored wings, 1800 HP and an 18-damage golden energy
  blast. The basic blast no longer burns or chills; its separate chain-lightning
  skill remains available. Each form has longer reach,
  recolored ground and flying artwork, matching breath effects and an evolution
  glow. Evolution adds the new health capacity while preserving existing wounds.
  Allies stay safe and the phoenix's first rebirth does not count as a kill.
  Each permanent kill leaves fallen prey for the dragon that earned it. Once free
  to act, the dragon approaches and eats it, restoring full health and permanently
  gaining health based on the prey's body size. A goose is worth **1 progress point
  and +25 maximum HP**, a T-Rex **4 points and +100 HP**, and a fully evolved dragon
  **9 points and +225 HP**. These totals include the point already earned for the
  kill; the feeding bonus arrives only when the body is eaten. Fifty small kills
  still earn one evolution, while eating larger creatures gets there faster.
  Excess progress carries forward. Feeding health carries through every evolution and
  continues growing in the final form. Prey remains for 30 seconds; interrupted
  feeding can resume, and each body can be eaten once. Eating does not add kills.
  Evolved silhouettes gain crystal spines, forked lightning horns, layered armor,
  a second wing and a prismatic crown. Dragons open their jaws while breathing;
  the connected plume flows outward, widens and fades, with traveling frost
  crystals and branching electricity for the later forms.
  Lightning breath and dragon chain strikes use flickering, irregular bolts with
  branching forks, violet halos, white cores, and discharge sparks. Evolved auras
  gain electrical cracks; Super Dragon has scattered golden lightning bursts with
  changing positions, angles, lengths and brightness, and no pulsing circle.
  Its energy blast also uses golden tones.
  Ice, Lightning and Super Dragons grow to **1.2×, 1.45× and 1.75×** the starting
  dragon's size, with matching collision space, combat reach and page boundaries.
  Starting with Ice Dragon, a nearby ground enemy triggers an **ice dive** every
  eight seconds: rise 140 px, hover, then slam back down and create an expanding
  circle of ice. The landing damages nearby ground enemies and freezes them in
  ice for 1.8 seconds, followed by a lingering slow. Later forms retain the dive
  with a larger ring and more damage. Allies and airborne enemies are spared.
  Stun, fear, charm, capture, conversion or death cancels an unfinished dive.
  Lightning Dragon also forms a **lightning sword in its mouth**, charges it for
  0.45 seconds, then swings through nearby enemies and releases three traveling
  electrical crescents. The blade deals 36 damage; the piercing waves deal 18
  damage once per enemy across the whole volley. The skill has its own six-second
  cooldown and alternates with the ice dive. Super Dragon retains the sword with
  48-damage slashes and 24-damage waves. Allies and airborne enemies are spared;
  occupied enemy towers block the waves. Control effects interrupt the windup,
  and death, conversion and Clear remove its released waves.
  Only the golden **Super Dragon** gets one **Fire Domain** per lifetime, triggered below
  half maximum health with an exposed enemy within 340 px. It rises for 0.8 s,
  screams for 0.9 s, seals the arena, and lands over 0.4 s. Captured enemies focus
  the caster. The fire wall holds for three seconds, then shrinks over twelve
  seconds; its timer and instruction to defeat the dragon appear above the ring.
  The arena has a scorched molten rim, glowing claw runes, a dragon seal, twisting
  layered flames, smoke and rising sparks. The far wall burns behind creatures
  while the near wall rises in front. Embers spiral inward and flames intensify
  as it closes, ending in a fiery starburst and an expanding heat shockwave.
  Flight, dashes, throws and knockback cannot escape a sealed domain. The caster
  is also kept inside and can fight after landing. Other exposed enemies entering
  the ring join its captives. Allies, buildings and sheltered residents are safe.
  Killing or converting the caster ends the domain; control effects can interrupt
  the opening cast. Healing does not recharge it. A completed collapse kills all
  surviving captives regardless of armor or elevation, with normal kill credit
  and Phoenix rebirth rules. Clear removes the arena and resets its use.
- Coral Chorus, the siren (6), has 90 HP and swims at normal speed, staying in water.
  Placing her on dry paper creates a small pond. Chasing, fear, knockback and
  throws cannot take her across a dry shore. Her artwork includes flowing pink
  hair, a scaled curling tail, layered fins, pearls and a detailed microphone.
  Her ballad draws enemies within 220 px toward her, interrupting their attacks.
  After at least two seconds of ballad, a close audience triggers three seconds
  of death metal: 7 damage and 45 knockback every 0.2 seconds within 70 px.
  Enemies can fight back during death metal. Allies are spared by both songs.
- Water (W): click or drag to paint connected ponds, with the original pale
  shores, deeper blue centers, drifting patches and translucent wading sprites.
  Grounded land fighters move at half speed in water; Coral Chorus swims freely.
  Water can be painted during setup, pause or battle. Surface movement freezes
  during setup and pause, and resizing preserves the painted terrain.
- Tower (T), under Terrain: a 500-HP stone tower with room for one character.
  Thor and Ninja can climb empty towers. Thor always summons marked lightning
  every three seconds; Ninja throws shuriken from the roof. Ground enemies must
  destroy the tower before reaching its occupant; Scorch, adult Encore and Honk
  can fly up and attack directly. A broken
  tower collapses and drops its occupant, dealing 25 fall damage and a brief stun.
  Clear removes towers and frees occupants; Pause freezes climbing and falling.
- Tree (E), under Terrain: click or drag to plant leafy trees with branching
  trunks and roots. Ninja prefers hiding in their foliage, where enemies cannot
  target him. Each tree holds one Ninja. Trees stay on the page when resized and are removed by Clear.
  Up to 200 trees can be planted, at least 60 px apart.
- No Thanks, the ninja (7), now has a detailed hood, armour, mint scarf and katana.
  He prefers trees within 420 px, waiting in concealment for an enemy within
  180 px. He reveals himself and dashes through the enemy in 0.18 seconds for
  one 19.8-damage katana slice, then stays exposed on the ground for two seconds
  before running within 64 px of an available tree, backflipping into it and hiding again. Enemies
  lose their target when he hides; incidental area damage can reveal him.
  A bright crescent and impact streaks linger for 0.3 seconds after each dash
  slash, making the hit visible even after he finishes moving.
  Without tree cover he can use an empty tower, keeps his shuriken at range and
  uses the katana up close. His original health, movement, dash cooldown and
  retreat behavior outside cover remain. Team, water and tower rules apply.
- Zombie (8) returns with 90 HP, outstretched arms, a shambling walk and 7-damage
  bites every 0.75 seconds. Surviving a bite starts a two-second infection; the
  first biter's team wins. Victims keep their body and remaining health, turn
  green, lose their old special attacks and start spreading infection themselves.
  Free-for-all zombies cooperate across converted species. Death cancels infection,
  and converted phoenixes cannot rebirth. All undead count under Zombie in the tally.
- Count Chomp, the vampire (9), returns with his original cape, fangs and bat form.
  He has 90 HP, detects enemies within 480 px and flies toward distant prey at
  290 px/s. He lands before biting for 16 damage every 0.6 seconds, healing 16 HP
  per successful bite up to full health. Both fire hits and lingering burns deal
  eightfold damage to him. Stun, fear, charm, capture, conversion and Clear stop
  bat flight. Free-for-all vampires cooperate with each other.
- Ant (0): ten workers build a 200-HP base in three seconds. Further worker
  milestones (20/40/80/160) upgrade that same base through five tiers instead of
  building more hills. Each tier adds 250 HP and 35% of the original size. Wooden
  defenses, bones, a dragon skull, and T-Rex hand trophies appear as it grows.
  Builders survive as residents; the first construction funds twenty residents.
  The fourth completed tier earns the sheltered Ant Queen, doubling the ordinary
  brood from one to two hatchlings every four seconds. Destroying her home kills
  her; Clear resets milestones. Residents count toward the 1,000-creature cap.
  Food crews of two to eight workers retrieve enemy bodies, including workers
  emerging from underground. Each delivery adds at least two recruits (four per
  unit of corpse size), with up to four food recruits hatched per production batch.
  Full capacity preserves pending births. Dragons and T-Rexes keep their claimed
  meals. Construction takes priority; a destroyed base releases residents and
  drops food crews' cargo.
  On attack or a nearby threat, up to twenty defenders emerge one every quarter
  second. The base favors three tanks, two transports, and slashers for its main
  attacking force. Surviving attackers return underground when the threat ends;
  up to two tanks remain on guard even in peacetime. Birth rolls unlock tank ants
  at tier two (340 HP, 30% armor), slashers at tier three (17-damage bites and
  four-second bleeding), and flyers at tier four. Tanks stay near base and use
  Provoke every seven seconds to draw enemies within 125 px for three seconds.
  Flyers beat both pairs of wings while moving, deployed, or carrying allies.
  They carry deployed workers or slashers toward enemies, releasing passengers
  near combat or when interrupted, killed, or converted. All ant castes cooperate
  in free-for-all and have distinct sprites and population counts.
- Adult dragons build a massive personal nest on nearby dry ground, then return
  to sleep and heal when combat and feeding are clear. Building takes three seconds;
  sleeping heals 3% of maximum health per second. Attacks on the dragon, its nest
  or its eggs wake the parent to defend them. Destroyed nests can be rebuilt.
  Resting lays one egg every 12 seconds, with a lifetime maximum of two eggs per
  dragon. Hatching, losing offspring or eggs, and rebuilding a nest do not reset
  that allowance. Each baby starts with its own allowance when it grows up.
  After 20 seconds, each egg becomes a baby dragon at 45% adult size, health and
  damage. A blocked dry exit delays hatching; eggs reuse their slots at the page
  limit. Babies need both 120 direct damage dealt and four food nutrition points
  to reach adulthood. They keep earned evolution progress, but must mature before
  unlocking normal forms or building their own nests. Eggs inherit the parent's
  side, including Free-for-all. Parent death leaves eggs intact; nest destruction
  destroys its eggs. Clear resets everything, and Pause freezes the lifecycle.
  Nests lie beneath bodies, creatures and effects. Every creature can walk or
  fly over them, regardless of side; nests still take damage and shelter eggs.
- Honk, Thor, Tiny Arms, Encore, Scorch, Coral Chorus, No Thanks, Zombie, Count Chomp, Ant, Spartan, Praying Mantis and Sword Saint. Up to 1,000 creatures and buildings total.
- Praying Mantis returns under Bug with its original green artwork, 85 HP,
  95 speed, 10-damage claws and 0.6-second attacks. Four to six allied mantises
  can kidnap a small grounded enemy, carry it to a large dry ring (150 px radius
  on a normal battlefield) and bow before a one-on-one duel. Only the active
  Mantis challenger can attack the captive, including when other mantises are
  outside the recruited group. The captive can only attack that challenger.
  The others wait their turns; defeating a challenger brings
  the next one forward. Outsiders can break up the club with rescue hits.
  Capture has a 0.35-second windup, transport lasts at most four seconds, bows
  take half a second. The circle keeps both duelists inside after movement,
  knockback, dashes and flight, removing outward momentum. Walking past the rim
  never cancels the fight. Failed setup times out after thirty seconds; an active
  duel lasts until victory, death, or the club being broken up.
  Large enemies, buildings, flyers and water-bound Siren cannot be kidnapped.
  Personal final Bug kills heal the mantis to full, add 10% of its original HP
  and damage and 5% original size, and consume the body. Other species and
  zombies are not meals. Death, conversion, an invalid resize and Clear release
  participants; an eight-second cooldown and two-second captive grace prevent
  immediate recapture. Pause freezes the sequence.
- Spartan joins People with a crested bronze helmet, red cloak, round lambda
  shield and spear. He has 240 HP and deals 18 damage every 0.8 seconds at 44 px
  spear reach. Enemies within 8 px beyond collision reach instead receive a
  24-damage shield bash with 220 knockback and a 0.6-second stun, available every
  five seconds. Structures take normal spear damage. Spartan supports Red, Blue,
  Free-for-all and zombie conversion. Select him from People; number shortcuts
  remain assigned to the original ten fighters.
- Spartan's special throws his spear at an enemy 90–320 px away for 36 physical
  damage. It becomes available after two seconds and has an eight-second cooldown.
  He switches to a short knife (10 damage every 0.45 seconds, 7 px reach) and
  pursues the enemy that catches the spear. Personally killing that marked enemy
  restores the spear, including a lethal spear hit. A different kill, an ally's
  finishing blow or temporary Phoenix rebirth does not restore it; a missed spear
  leaves him with the knife. In formations, rear ranks may throw while the front
  holds its spears. Knife finishers can step out and rejoin after recovery;
  defensive circles keep their positions. Spear ownership, knife poses and
  projectiles respect teams, towers, death, conversion, Clear and Pause.
- Ordinary stuns (shield bashes, throws and falls) show yellow stars. The skeleton
  flash is exclusive to electrical hits: Thor's lightning and the Dragon's
  lightning breath, chain, sword and waves. Its visual timer is independent of
  the gameplay stun; damage-only lightning does not gain an extra stun. Freeze
  keeps its ice effect, and conversion, rebirth and Clear remove old flashes.
- Six or more nearby allied Spartans assemble into squads of 6–12. **Shield
  Wall** is the default: two ranks advance slowly, settled rear spears gain 28 px
  reach, and shields reduce direct frontal damage by 30%. Healthy squads above
  65% average HP use **Spear Wedge** against isolated/exposed or wounded enemies;
  the tip closes to shield-bash range while the others support it with spears.
  Below 40% average HP, when surrounded, or when heavily outnumbered, they use
  **Defensive Circle**: injured members move inside, guards face outward with
  35% frontal protection, and damage falls by 20% while they hold position.
  Formation choices last at least three simulation seconds. Dragon/Phoenix
  threats double spacing; their elemental attacks bypass formation shields,
  as do burns, bleed and attacks from behind. Protection requires six members
  in position. Bashes are staggered instead of firing together. Death or
  conversion that drops a squad below six breaks it immediately. Ground marks,
  raised shields and a small label show the current formation; Pause freezes it.
- With no nearby enemies, fighters wander at 40% speed, change heading every
  1.5 seconds and rest every third turn. Nearby enemies interrupt wandering;
  spotted enemies can be chased beyond sight. Setup and pause keep everyone still.

New fighters are placed at their normal size. The brief size pop is reserved for
hits, so pressing Start does not shrink them. Thor has distinct throw and catch
poses, a detailed iron hammer and a subtle trail on its return.

Tab to the battlefield and press Enter to place the selected fighter in the centre.

## Development

All three Hero characters heal while resting without enemies nearby. Sword Saint
and Mei Yuanzhi meditate with their existing healing auras. Thor raises his hammer
for two seconds, shaking the battlefield as blue sparks gather, then calls
lightning onto himself to restore 120 HP. He repeats until fully healed, including
when resting on a tower. The self-strike shows a blue impact ring and damages no
one. Nearby enemies, damage, disabling effects and an absent hammer interrupt
meditation. Pause freezes the ritual and its effects; death, conversion and Clear
remove unfinished meditation.

Meng Chuan (Devil Saint form) sits cross-legged with his jian across his lap and
meditates in a blue aura, healing 45 HP per second. Every enemy he kills leaves a
body for 30 seconds; with no enemy near he meditates even at full health while a
body remains, and two fanged devil orbs with smoky tails come out of him, chew it
for 1.2 seconds and heal him 160 HP per unit of the body's size squared, then move
on to the next body or go back inside him. Buildings and devils leave no body.

The first time he drops to half health he raises his jian, untouchable and unstoppable (stuns, knockups, lures and grabs fall away), and three
bars of light rise over his head: fire orange, gold and the tallest, blue. A light
flickers across them and settles at random on one of the three.

Fire, the Body Refinement Divine-Demon (炼体神魔): sha qi refined into his flesh
turns his hair red and spiky, red-gold flame armour covers his bare chest (split by
a red crack), his forearms blaze to the fist and dark smoky wings rise off his
shoulders. He drops the jian and fights with his fists: speed 175, a punch every
0.3 s for 22. Undying Body: he takes 30% less damage from enemies and regenerates
10 HP per second at all times. Every punch leaks one colour of seven-colour sha in
turn (red, orange, yellow, green, blue, black, white), and every fourth is a heavy
straight that hits everyone in a short cone in front of him for 1.5x damage and
double knockback. He still parries (with a blazing forearm), and no devils or
bodies come with this form. Seven Sha Fists (七煞拳): an enemy up to 250 px away
makes him rush it and throw seven punches, one per colour, for 7 each, then burst
all seven colours for 12 and heavy knockback around it (7 s cooldown). Sonic Dash:
an enemy 80 to 320 px away makes him streak to it at 1400 px/s and hit it for 30,
knocking it up (6 s cooldown). Every punch throws a painted fist of its sha colour
off his knuckles (ink-outlined, gold wrist band, speed strokes behind it) that
bursts where it lands in a ragged splash with ink-edged rays and flung drops; the
heavy straight's fist is bigger. Demon Assault: an enemy 30 to 230 px away makes
him plant his feet and machine-gun sixteen fists at it, one every 0.09 s, fanned a
little, each hitting the first enemy in its way for 9 (9 s cooldown). Sha Kasaya
(煞袈裟): an enemy within 120 px wraps him in a seven-colour mantle for 4 s (12 s
cooldown); nothing stuns, freezes, scares, lifts, lures or grabs him and enemies
touching him catch fire. His ultimate is Red Lotus Karmic Fire (红莲业火): 3 s into
the form and every 20 s after, an enemy within 200 px makes him leap up,
untouchable, and drive both fists down. A red lotus of fire 110 px across blooms
where he lands: 70 damage and big knockback, then 3 s of burning for everyone
standing in it, while the name slams in over him with a red seal.
Below 25% HP he goes on a rampage for the rest of the fight, wreathed in red flame:
nothing can stun, freeze, scare, lift, lure or grab him, and his attacks become a
chain of a left hook, a right hook (1.3x damage each) and a ground slam that hits
every enemy within 80 px for 2.4x damage, knocks them all up and leaves a burning
handprint in the ground.

Gold, the Lightning and Thunder Saint: lightning strikes him and he changes to
spiky white hair, gold armour on his arms and shoulders, a bare chest with a fiery
tattoo and a blade of glowing lightning. He moves at 235 instead of 140 and cuts
from up to 170 px away; every slash throws a crescent of lightning wrapped in wind
that flies 320 px, hitting each enemy in its path once for 30. This form has no
devils and leaves no bodies; he meditates in a gold aura with the usual heal.
Lightning crackles round him all the time and now and then a bolt jumps out from him
to a random spot nearby (just for show, it deals no damage).
His first skill is Lightning Step in place of Autumn Breeze: an enemy up to 620
px away makes him zig-zag at it in four lightning flashes, untouchable while he
flashes and leaving crackling gold trails, then cut it as lightning falls from the
sky (55 damage, 0.5 s stun, 6 s cooldown). Autumn Breeze and Five Autumn Shadows
are gone in this form, but he still parries (90% of hits in every form, batting
projectiles back the way they came). His ultimate is Divine Thunder Slash (神雷斩), once per fight: the first time he
drops below 25% HP with an enemy on the field, the battle stops to watch. Every enemy
freezes in shock while he jumps to the centre of the field and levitates. Behind him
a door of fire and lightning gathers into a colossal face, its eyes open and blaze blue-white, and it swings
open in a flash that lights up the whole screen: behind it his lightning emperor god
sits towering, majestic, leaning on one raised knee, his eyes glowing red. The screen shakes harder and harder as
lightning rains on the field, striking every enemy once for 20. A bolt falls into his
hand and he cuts toward the thickest group: one colossal painted crescent that grows
until it leaves the field, hitting every enemy it crosses once for 200 with heavy
knockback and a 1 s stun. Untouchable throughout, he lands about 6 s after it began,
while 神雷斩 is brushed in white beside the crescent over a red 秘技 seal.

Blue, the Devil Saint: his two devils burst out to fight beside him (220
HP each, biting for 22). A fallen devil returns after he or a devil kills an
enemy, up to two at a time, and they die with him. With no enemy near they eat his
bodies for him instead of coming out of him. He also gains 悲苍一画秋风: an enemy
within 90 px makes him cut all the way round himself, 36 damage to every enemy
within 90 px and binding them in place for 1 s (9 s cooldown).

Encore's adult artwork now has broad layered flame-feather wings, a swept crest,
a hooked bird beak and long curling crimson-and-gold tail feathers. Her healing
pulse is centered on herself: allies within 80 px receive 10 HP, at most once
per second on a breath hit. A red ground circle and rising red plus signs show
the area under her feet.

Before the 50-kill evolution, grown/reborn phoenixes rise 180 px, hover and dive into a marked location
within 300 px. Landing deals 100 damage in a 140 px area, knocks enemies away,
and applies six seconds of burning. The impact leaves three seconds of ground
fire that deals another 12 damage per second and refreshes burns. Allies are
spared; towers protect their occupants, and airborne or sheltered creatures avoid
the ground fire. The move has a two-second opening delay and ten-second cooldown.
Control effects, conversion and death cancel unfinished dives; eggs and chicks
cannot dive. Finished ground fire may outlast its caster's rebirth, while
conversion and Clear remove it. Pause freezes flight and fire timers.

At 50 final kills, Encore grows into a sleek adult with longer flight feathers,
650 HP, 5-damage breath and 105 px reach. Her dive becomes an eight-shot mortar
barrage: rise 200 px and spit arcing fireballs into a marked area within 360 px.
Each shot deals 36 damage in a 52 px radius and leaves four seconds of ground
fire. She returns to the ground after the volley; the ability recharges in nine
seconds. At 100 kills she becomes a crownless Legend Phoenix with red-to-gold
gradient plumage and animated glitter across her body and feathers: 900 HP,
6-damage breath and 120 px reach. Her signature Encore rises into three alternating
straight-line sweeps, each dealing 50 damage once per enemy and laying ground fire
along the route. Encore recharges in 18 seconds, with mortar barrages between uses.

All living Phoenix forms, including chicks, take 60% less fire and burn damage;
ice, lightning and physical attacks retain full damage. Evolution preserves
wounds, grants no extra rebirth, and counts only final enemy creature kills from
breath, burns, fireballs, dives or sweeps. Overlapping ground fires from the same
Phoenix apply only their strongest damage. Pending shots end on death/conversion;
completed ground fires may persist through rebirth. New flight stages keep the
same control-effect interruptions and ground-target protections as the dive.

React, TypeScript and Vite. Install dependencies with `npm install` and start the
local server with `npm run dev` when requested. Build with `npm run build`, lint
with `npm run lint`, and run the battle checks with `npm run check` only with permission.
To share it, run `npm run dev` and, in a second terminal, `ngrok http 5173`; send the `https://….ngrok-free.app` link.

## Migrating creatures

The previous implementation remains on `main`. Additional uncommitted work is saved
in the stash named `Before Inkfight V2 restart`, which includes Thor's source.
Bring creatures across one at a time, including only their required art and behaviour.

`src/game/goose.ts`, `src/game/thor.ts`, `src/game/rex.ts`, `src/game/phoenix.ts` and
`src/game/dragon.ts`, `src/game/siren.ts`, `src/game/ninja.ts`, `src/game/zombie.ts`,
`src/game/vampire.ts`, `src/game/ant.ts`, `src/game/spartan.ts`, `src/game/mantis.ts` and `src/game/swordsaint.ts` hold the thirteen fighters. Shared drawing
helpers live in `art.ts`, the roster and sprites in `units.ts`, and the small battle
loop in `battle.ts`. Thor's skill chances, timings and damage are in `THOR_SKILLS`
in `thor.ts`. Water painting and its mask live in `terrain.ts`; `water.ts` brings
the original pond renderer into V2. The old simulation has not been restored.

`checks/battle.check.ts` includes checks for T-Rex bites, grabs, shakes, throws,
landing damage, allies and death cleanup, alongside alliances, pecks, panic, placement limits, resizing,
death, both hammer passes, all three skill choices, warnings, dodging, stuns,
flight interruption, friendly fire, cooldowns, death cleanup and Clear.
See [the style guide](docs/style-guide.md) for the current baseline.

Do not run tests, builds, linters, type checks, dev servers or verification commands
without the owner's permission. Finish the change, then ask whether to test it.
