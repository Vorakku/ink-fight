# Two Animals Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans in this session.

**Goal:** Add the two animal fighters approved by the owner.

**Architecture:** Extend the existing roster, typed-array simulation and renderer.
Reuse projectile ownership, hit effects, contact handling and fleeing.

**Tech Stack:** TypeScript, Canvas 2D, React.

**Spec:** ../specs/2026-11-14-two-animals-design.md

## Global Constraints

No dependencies or unrelated changes. Keep work in the current checkout. The
owner prohibits all verification commands until asked after implementation.

## Review Focus

Recycled projectile owners/targets; teams and returned-shot effects; full or
disabled pouches; feigning without healing or invulnerability; cancellation and
one contact bite followed by flight. Leave focused assertion scenes unrun.

## Tasks

- [x] Add `pouch` and `feign`, two sprites, a kicking alternate, and roster entries.
- [x] Add/reset pouch and feign state. Catch/return small projectiles with valid
  ownership. Trigger feigning on surviving low-health damage, drop enemy targets,
  bite on contact and flee, cancel on interruption.
- [x] Draw the held shot, kick and motionless playing-dead pose.
- [x] Add focused unrun checks and update README/style guide.
- [ ] Stop and ask the owner whether to test.

## Execution

The owner's request to make the approved fighters authorizes implementation in
this session. Test execution and automated review remain deferred by AGENTS.md.
