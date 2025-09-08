# S2 Dynamic Item Generator - Updated Refactoring & Improvement Plan

## Goal
Lean, maintainable, secure JavaScript (no TypeScript migration for now). Focus on: stability, clarity, user experience, and safe extensibility for generating the config text file.

## Phase 1 (DONE): Critical Security & Performance

### 1.1 Security (Completed)
- [x] Eliminated unsafe `innerHTML` in dynamic UI flows
- [x] Added safe DOM helpers (`dom.js`) + `clearContent()`
- [x] Replaced vulnerable insertions in `app.js` & `chances.js`
- [x] Added basic CSP header guidance (to document/deploy)
- [x] Validation utilities cover all user inputs
- [x] Real‑time validation on key numeric & name fields
- [x] Sanitized preset import + name handling
- [ ] (Low risk) Audit static modal template fragments (ensure no user data ever injected there)

### 1.2 Performance (Completed)
- [x] Lazy config loading via `ConfigLoader`
- [x] Removed deep copy hotspots / switched to on-demand clones
- [x] Memory leak prevention (listener tracking + cleanup)
- [x] Performance utilities + `window.debugPerformance()`
- [x] Startup memory reduced substantially

### 1.3 Additional Hardening (New Follow-ups)
- [ ] Add ESLint rule/pattern check to forbid raw `innerHTML` except in vetted utility
- [ ] Add lightweight content security doc (README section) with recommended meta tag
- [ ] Add size & line-count guard on imported preset/config files

## Phase 2: Minimal State & Structure (Priority: HIGH, In Progress)
Rationale: Avoid over-engineering full reactive system; introduce a tiny pub/sub state wrapper and reduce global mutation.

### 2.1 Central State (Lightweight)
- [ ] `src/js/state/configState.js` with:
  - `getState()` returns frozen snapshot
  - `update(partial)` merges + notifies
  - `subscribe(key, fn)` for granular listeners
  - Stored keys: `weaponSettings`, `armorSettings`, `armorSpawnSettings`, `currentPreset`, `dirtyFlags`
- [ ] Replace globals: `modifiedWeaponSettings`, `modifiedArmorSettings`, `modifiedArmorSpawnSettings`
- [ ] Add dirty tracking + `beforeunload` warning if unsaved
- [ ] LocalStorage persistence (debounced) under versioned key

### 2.2 Config Module Organization (Pragmatic Split)
- [ ] Split `configs.js` only where clarity improves (avoid deep tree):
  - `src/js/configs/weapons.js`
  - `src/js/configs/armor.js`
  - `src/js/configs/factions.js`
  - `src/js/configs/index.js` (re-exports + freeze objects)
- [ ] Add a `validateConfigShape(config)` runtime check (no TypeScript)

### 2.3 Services Layer (Slim)
- [ ] `ConfigService.js`: load, clone, validate, reset
- [ ] `FileService.js`: export/import (wrap existing generator + file I/O)
- [ ] `PresetService.js`: create/update/delete + PIN validation reuse

### 2.4 Error Handling & Logging
- [ ] Add `utils/logger.js` (levels: error, warn, info, debug; toggle via `window.__DEBUG__`)
- [ ] Wrap async preset/file operations with try/catch + user-friendly toast/message
- [ ] Central `handleError(err, context)` producing safe UI message
- [ ] Console suppression of raw stack traces in production flag

## Phase 3: Persistence, Integrity & UX Safety (Priority: HIGH)
### 3.1 Persistence Enhancements
- [ ] Version key: `configState_v1` (future migration hook)
- [ ] Automatic autosave every 5s (debounced) when dirty
- [ ] Manual Save button state (disabled if not dirty)
- [ ] Add Reset to Defaults action (with confirm)

### 3.2 Data Integrity
- [ ] Hash/signature of exported data (simple SHA-256) embedded as comment line for tamper awareness
- [ ] On import: recompute & warn if mismatch
- [ ] Add range normalization helper (clamps to allowed domain silently + logs warning)
- [ ] Config diff generator (original vs modified) for preview before export

### 3.3 Import/Export UX
- [ ] Preview modal before final export (shows top-level counts + warnings)
- [ ] File size & structural check on import (reject > X KB or invalid shape)
- [ ] Graceful fallback if parsing fails (show snippet of offending segment)

## Phase 4: UI/UX Improvements (Priority: MEDIUM)
### 4.1 Micro-Templating (No Framework)
- [ ] Introduce `renderFragment(htmlString, bindings)` using `<template>` + safe text node injection (never raw user input)
- [ ] Refactor repeated table row creation to a single function

### 4.2 Interaction Improvements
- [ ] Keyboard shortcuts: Ctrl+S (save), Ctrl+E (export), Esc (close active modal)
- [ ] Focus management after modal close (return to last focused trigger)
- [ ] Add inline validation tooltips (pass/fail icons)
- [ ] Loading spinner standardization (single component)

### 4.3 Accessibility
- [ ] ARIA roles for modals & tables
- [ ] Ensure tab order logical; trap focus inside modal
- [ ] High contrast focus outlines

### 4.4 Feedback & Messaging
- [ ] Unified message/toast system (success / warning / error)
- [ ] Non-blocking success notification after export
- [ ] Undo last field change (single-step per major section)

## Phase 5: Testing & Documentation (Priority: MEDIUM)
### 5.1 Testing Setup
- [ ] Add `vitest` + `@testing-library/dom`
- [ ] Basic test script in `package.json`
- [ ] Minimal smoke test: config load → modify → export string contains expected markers

### 5.2 Unit Tests
- [ ] Validation utilities (edge ranges, invalid formats)
- [ ] State module (subscribe/update, deep immutability)
- [ ] Config diff + hash utilities
- [ ] Generation output stable for known seed/sample

### 5.3 Integration Tests
- [ ] Import malformed file (expect graceful error)
- [ ] Full export flow with modified settings
- [ ] Preset save/load cycle persists changes

### 5.4 Documentation
- [ ] Update README: architecture overview (no TypeScript, rationale)
- [ ] Add security notes (CSP, safe DOM rules)
- [ ] Add contribution guide (coding, commit, lint rules)
- [ ] Inline JSDoc for public functions (inputs/outputs)

## Phase 6: Build & Deployment (Priority: LOW)
### 6.1 Build & Quality
- [ ] ESLint config: forbid `innerHTML` (except allow-list), `no-console` warn, enforce const
- [ ] Add Prettier + formatting script
- [ ] Husky + lint-staged pre-commit (lint + format + vitest --run)

### 6.2 Performance Tweaks
- [ ] Check bundle (Vite analyze) – identify large images / compress
- [ ] Lazy-load image assets not immediately needed
- [ ] Defer non-critical initialization until user interaction

### 6.3 CI (Optional if repo public)
- [ ] GitHub Action: install, lint, test, build
- [ ] Cache node_modules for speed
- [ ] Add Dependabot (security updates)

## Phase 7 (Optional Future): Type Definition Layer (Deferred)
If complexity grows, revisit either JSDoc typedefs expansion or partial TypeScript migration. Currently deferred for speed & simplicity.

## Timeline (Adjusted)
Weeks 1-2: (Done) Security + performance
Weeks 3-4: Phase 2 (state + modular split) & start Phase 3 persistence
Weeks 5-6: Finish Phase 3 + targeted UI/UX (shortcuts, validation feedback)
Weeks 7-8: Testing + docs + basic CI
Weeks 9+: Optional optimizations & deferred items

## Notes / Rationale Changes
- Removed full TypeScript migration (overhead vs current scope). Added deferred phase for possible future adoption.
- Simplified module reorganization to avoid deep nesting that harms discoverability.
- Chose runtime validation + hashing over static type system for now.
- Focused on user safety (integrity, diff, preview) since exported file correctness is core value.
- Introduced minimal state pattern instead of heavy framework.

## Quick Win Order (If Bandwidth Limited)
1. Central state + persistence
2. Hash + diff + safer import
3. Export preview + keyboard shortcuts
4. Logger + unified messaging
5. Tests (core utilities + export flow)

## Definition of Done (Core)
- No uncaught errors in normal flows
- All exports reproducible & validated
- Import rejects malformed/tampered input with clear message
- Lint passes (no unsafe DOM) & tests green

---
Feel free to mark items as complete inline as they are implemented. This file intentionally stays JavaScript-focused and pragmatic.
