# Automatic Spartan formations

The owner approved three formations for more than five nearby allied Spartans:
Shield Wall by default, Spear Wedge for healthy aggressive opportunities, and
Defensive Circle when wounded, surrounded or outnumbered. Keep wider spacing
against Dragon/Phoenix, hold choices for a few seconds, and break formations
below six survivors. Implement in the current Canvas battle system without
dependencies, changing the existing checkout without committing.

Implementation choices:

- Local squads contain 6–12 living, grounded Spartans of the same exact side.
  FFA Spartans cooperate; other species never fill a squad. Stun, freeze, fear,
  charm, taunt, shelter, capture, flight and conversion suspend eligibility.
- Discover allies within 180 px; a 280 px leash separates distant groups.
  Cap squads at twelve, splitting dense armies into multiple useful squads.
- Assess exposed enemies within 360 px and average squad health. Use Circle below
  40% HP, enemies in three directional sectors, or over 1.25 enemies per Spartan.
  Use Wedge above 65% HP against a wounded target, a lone target, or an exposed
  ranged target. Other cases use Wall. Each choice lasts three simulation seconds.
- Wall has two ranks, advances at 45% speed, adds 28 px rear spear reach and
  reduces frontal direct damage by 30%. Wedge uses triangular rows, advances at
  90% speed, focuses one enemy and closes enough for its tip to bash. Circle holds
  position, puts the weakest injured members inside, faces guards outward, adds
  35% frontal protection and reduces attacks by 20%.
- A squad grants its benefits only after six members reach their positions;
  individual members must also remain within 20 px of their own slots. Frontal
  protection covers a 120-degree arc. Dragon/Phoenix attacks, burns, bleeding,
  environmental damage and flanking hits bypass shields. Stagger squad bashes
  by 0.25 seconds. Existing individual five-second bash cooldowns remain.
- Use 28 px spacing, doubled to 56 px against Dragon/Phoenix. Clamp the shape to
  the battlefield. Existing terrain movement and body separation still apply.
- Share fixed slot targets, move naturally into position, show raised shield
  poses, quiet ground marks and formation names. Pause uses the simulation clock.
- Death and conversion detach members immediately and disband squads under six.
  Clear removes every group and member reference. Domain combat takes precedence.

Write focused checks for grouping, formation decisions, health priorities,
movement, protection, fire, staggered bashes and lifecycle. Do not run tests,
builds, linters, type checks, previews or verification without owner approval.
