# Teams: red vs blue, with a Start button

Date: 2026-11-14. Approved by the owner in conversation.

## Intent

Today every fighter type is its own team, so you can't stage a proper army-vs-army fight, and two Sir
Toasts never fight each other. The owner wants to build two armies, tell them apart at a glance, and
press Start to set them off.

## What the owner decided

- **Team picker: Red, Blue, Free-for-all.** The picker sets the team of the *next* fighter placed, so one
  page can hold red, blue and free-for-all fighters together. Free-for-all keeps today's rule: its
  team is its type.
- **Team marker:** a bandanna in the team colour on every red or blue fighter. Free-for-all fighters
  wear none.
- **Ally effects cover the whole team:** Phoenix's healing ring, the manager hurrying its staff, and a
  thrown fighter sparing its thrower's side.
- **Setup and Start:** the page is frozen while you scribble. Start runs the battle, you can keep adding
  fighters mid-fight, and Clear goes back to setup. Pause keeps working once the battle has started.
- **No win screen.** When red and blue are both on the page, the tally shows team totals (red count, blue
  count); nothing else happens when one side is wiped out.

## Approaches (bandanna placement)

- **A. Find the top of each drawing automatically (picked).** At sprite build time, scan each unit
  sprite's alpha once for its top edge and width there. At render time, tie a band at that height
  with two short tails that flutter. Nothing to fill in per fighter, and new fighters get it for
  free. An optional per-unit height tweak covers shapes the scan gets wrong.
- B. Set the spot by hand for all ~40 fighters. Exact, but tedious, and every new fighter needs it.
- C. Bake red and blue copies of every sprite. No better at finding the head, twice the sprites,
  and the fluttering tails get harder. Dropped.

## Design

- **Sim:** a new `team` typed array, set in `spawn(t, x, y, team?)`. Values 0 is red, 1 is blue, and
  free-for-all is `2 + type`. Every check of who counts as an enemy or an ally that compares `type`
  compares `team` instead: targeting, area hits, projectiles (`pType` keeps meaning "which fighter fired
  it" for stats; a new `pTeam` holds its side), thrown landings (`airBy` stores a team), and the
  enemy-crowd centroid (indexed by team). Anything a fighter creates inherits its team: hatch/rebirth,
  summoned snakes, projectiles.
- **Default team for spawn() is free-for-all**, so existing check scenes keep their meaning untouched.
- **Setup:** an App-level `started` flag. While it's false the sim doesn't step. The spawn pop
  (`hitT`) still has to settle, so frozen fighters don't sit 22% oversized; ticking `hitT` down in
  the frozen frame is enough.
- **Render:** the bandanna draws in the same transform as the body, so it turns, squashes, hides in
  bushes (alpha) and flies with the fighter. The snake is drawn segment by segment, so its band goes
  on its head sprite position. (The Ninja wears a mint scarf at the neck, not a headband, so it doesn't
  clash.) Battle Draw also has a team toggle; we borrow the idea only, with our own marker.
- **UI:** a Red / Blue / Free-for-all segmented control next to Clear / Pause. The Pause button reads
  Start before the battle begins. The tally adds red and blue totals when either is on the page.

## Non-goals

No win banner, no more than two colour teams, no AI or balance changes, no per-team stats.

## Left to the builder

Bandanna colours (pick from the style guide's palette so they read on paper), tail length and flutter
speed, the scan's alpha threshold, and which fighters need the height tweak after the owner looks at
them.
