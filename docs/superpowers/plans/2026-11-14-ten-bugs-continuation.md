# Ten Bugs Continuation Plan

> Continue inline from Claude's source. All execution of checks, builds, linters,
> type checkers and browser verification remains prohibited until owner approval.

**Goal:** Complete the ten Bug fighters in the pasted handoff while preserving the
existing five bugs, mythicals, teams and other unfinished work in this checkout.
**Architecture:** Finish the current `Bugs` hooks and shared simulation lifecycle;
reuse existing sprites, typed arrays, damage and terrain masks. No dependencies.
**Spec:** `docs/superpowers/specs/2026-11-14-ten-bugs-design.md`, with the original
ten-fighter table supplied in the owner's pasted conversation.

## Remaining implementation

- [x] Complete Twig's stationary concealment and attacks from behind; include
  resting Bed Rot and watched gargoyles in bed-bug targets, dropping awake targets.
- [x] Finish sting timing, implantation on lethal stings, queued wasp offspring
  at the fighter limit, and generation-safe handling of victims and new occupants.
- [x] Anchor antlions and buried cicadas; synchronize a mound cohort after 17
  seconds and reset it on Clear; preserve mayfly's twenty-second deadline.
- [x] Make locust meals wait for spawn capacity, validate terrain removal and
  preserve overlapping water/lawn masks while exposing fighters whose cover is gone.
- [x] Extend the existing unrun scenes, update README/design and record a handoff.
- [ ] Ask the owner whether to run the focused scenes, existing checks and build.

## Focus

No hidden tests or runtime probes. Source reading guides implementation only.
Avoid changing unrelated balance or earlier abilities. Preserve slots, type/team
identity, immunity/roots, temporary rebirths and physical projectile behaviour.
