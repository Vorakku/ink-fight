# Dragon nests and hatchlings in V2

Adults build one massive personal nest on nearby dry ground, return when combat
and feeding are clear, and sleep there. Reuse the original three-second building
time, 3% maximum-health regeneration per second, nest defense and 20-second egg
incubation. Any adult can nest; the current V2 fire/ice/lightning/super evolution
and combat-before-feeding priority remain.

The owner selected timed egg laying while resting, with at most two live eggs per
nest. Implementation default: one egg every 12 seconds of rest. Eggs remain allied
to their parent's side, including FFA. Nests and eggs are attackable; hitting either
wakes the parent. Losing a nest destroys its eggs but not hatched children. Losing
the parent leaves its existing nest and eggs. A surviving adult can rebuild.

Reuse the former 45% starting scale for hatchlings. Size, health, damage and reach
grow together. Unlike the former passive timer, adulthood requires both combat
and eating: 120 actual direct damage and four nutrition points each supply half
of maturity. Existing kill and meal evolution progress is retained, but elemental
evolutions and personal nesting wait for adulthood. Painted dragons start adult.

Approach: adapt the old `dragons.ts` lifecycle and original cave/egg Canvas art to
V2 Fighter references, the existing feeding rewards, building damage and roster.
Avoid restoring the obsolete numeric-slot simulation. Reuse the egg's Fighter
slot when hatching, so a full page never exceeds 300 entities; blocked dry exits
delay hatching. Reuse cached sprites for nests, eggs and sleeping forms.

Pause already stops simulation time. Clear removes lifecycle state and objects.
No dependencies, commits, tests, builds, linters, type checks, dev servers or
verification commands without the owner's explicit testing permission.
