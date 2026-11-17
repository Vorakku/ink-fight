# Ten bugs: Claude continuation

2026-11-14, Asia/Phnom_Penh. The owner asked Codex to continue the pasted Claude
conversation. Work is in `/home/vorak/Projects/inkfight`, alongside substantial
pre-existing changes. No commits, resets, cleanup, merges or publishing were done.

The requested ten Bug fighters have their roster entries, drawings, visible
effects and mechanics written. Claude's source is retained; continuation closes
the integration gaps described in the updated
[design](../superpowers/specs/2026-11-14-ten-bugs-design.md).

Completed continuation:

- Twig waits for enemies to pass and attacks from behind; proximity alone cannot
  reveal it through normal targeting while it is stationary.
- Bed bugs recognize resting Bed Rot and watched gargoyles, refuse awake victims
  at attack time, and drop a target when it wakes.
- Stingers pulse from delivery time and do not follow reused slots.
- Wasp eggs implant before damage, including lethal stings, retain their side,
  survive temporary revivals, and wait for offspring capacity at final death.
- Antlions and buried cicadas remain anchored and cannot be thrown or kidnapped.
- Cicada mound cohorts surface together after seventeen seconds, with symmetric
  opposing screams and a fresh wait after Clear.
- Locusts leave meals intact on full pages. Removing cover exposes hiders while
  preserving water/other stamps; stale terrain indices cannot corrupt the mask.
- Focused scenes were extended for these interactions and remain unrun.

## Pending owner decision

**No tests, builds, lint, type checks, verification commands, dev server or browser
checks have been run. Do not interpret source completion as validation.**

The current user-provided AGENTS.md prohibits running them until the owner says
yes. The next step is to ask whether the owner wants testing. If they approve:

```sh
node checks/bugs.check.ts
npm run check
npm run build
```

If browser testing is authorized, inspect all ten in the Bug tray, including a
Twig ambush, mass cicada emergence, locusts eating a lawn near a pond, and wasp
hatching on a dying host. Preserve unrelated pending work while fixing failures;
the wider roster and earlier mythical additions are also unverified.
