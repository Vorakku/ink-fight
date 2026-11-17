# Selective Feeding Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans in this session.

**Goal:** Make suitable predators and omnivores grow from enemy meals without
giving herbivores, parasites, constructs or ambiguous creatures that behavior.

**Architecture:** Explicit `feeding` flags in the roster, a separate typed meal
counter, and feeding at final death in the existing damage/kill path. Keep
Noodle's existing body, growth rates and king ability. No dependency or new AI.

**Tech Stack:** TypeScript, Canvas 2D, React.

**Spec:** ../../feeding-classification.md

## Constraints

Use the current checkout; preserve other abilities and counters. Do not run any
tests, builds, lint, type checks, browser or verification commands before asking
the owner after implementation. Researching diets is not permission to test.

## Tasks

- [x] Research and classify the current roster; record facts versus game choices.
- [x] Explicitly enable 17 eaters with broad edible-prey or Bug-only diets.
- [x] Track meals independently, grow size/health/damage, and consume a body once
  on a final enemy kill. Preserve identity and ownership through nested deaths.
- [x] Keep healing/revival/health thresholds consistent with grown maximum HP.
- [x] Add tooltip information, documentation and focused unrun regression scenes.
- [ ] Ask whether the owner wants testing.

## Review focus

No food from allies, constructs, hallucinations or recoverable deaths. Only the
actual live killer gains a meal, including named ranged attacks; a recycled slot
cannot inherit it. Meal counters do not replace creature ability counters.
Spiders and ants must not collect a body that has already been eaten.
