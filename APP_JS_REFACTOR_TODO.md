# app.js Refactor Plan

Status: Draft
Scope: Incrementally refactor the monolithic `src/js/app.js` into a modular, testable, accessible, and secure front‑end codebase.
Target: Preserve user‑visible behavior while reducing technical debt.

---
## Guiding Principles
1. Pure data vs. DOM separation.
2. Single responsibility per module.
3. Explicit dependencies (ES module imports / DI).
4. Immutable or clearly controlled mutable state.
5. No ad‑hoc innerHTML (build DOM structurally / sanitize via library).
6. Deterministic rendering (no arbitrary timeouts).
7. Event delegation over many per‑node listeners.
8. Schema/version validation for imported/exported configs.
9. Progressive enhancement + accessibility.
10. Measurable performance (baseline + regression checks).

---
## Phase 0 – Baseline & Safety
- [ ] Add a simple manual smoke checklist (load app, change settings, export, import, open presets) to `README.md`.
- [ ] Capture current bundle size & initial render timestamp (performance marks) for comparison.
- [ ] Add `// @deprecated` comments where replacements will arrive (do NOT remove yet).

Deliverable: Metrics + annotated code (no behavior change).

---
## Phase 1 – State Management Extraction
Problems: Scattered globals (`modifiedWeaponSettings`, etc.), reassignment after import, risk of stale references.

Tasks:
- [ ] Create `src/js/state/store.js` exporting a singleton with:
  - `getState()` (readonly snapshot)
  - `select(keys[])`
  - `update(patch)` (merges, emits events)
  - `replace(newState)` (full swap)
  - `subscribe(listener)` (returns unsubscribe)
- [ ] Initialize store with current lazy getters (migrate logic from app.js)
- [ ] Replace direct variable exports with selectors (keep legacy names re‑exporting from a compatibility adapter file `state/legacyExports.js`).
- [ ] Add unit tests (if test harness available later) for store behavior (subscribe/unsubscribe, shallow vs. deep patch).

Acceptance: All existing UI still works using legacy exports; new code can consume store API.

---
## Phase 2 – Services Layer
Problems: Implicit globals (`configLoader`, `fetchHeaders`, preset CRUD placeholders, JSON import logic without schema validation).

Modules to create:
- `services/configService.js` – wrap get/update operations, version tagging.
- `services/presetService.js` – load official/public presets, save/update/delete (abstract fetch API; stub until backend robust). Provides: `listOfficial()`, `listCommunity()`, `load(id)`, `create(data)`, `update(id,data)`, `remove(id,pin)`.
- `services/fileIO.js` – `exportConfig(state, name)`, `importConfig(file) -> parsed`. Enforce schema & version.
- `services/spinnerService.js` – reference counted `show()`/`hide()` plus convenience `withSpinner(promiseFactory)`.
- `validation/schema.js` – JSON schema or Zod-like manual object validation; returns structured error list.

Tasks:
- [ ] Move import/export logic into `fileIO.js`.
- [ ] Add config `schemaVersion` field on export.
- [ ] Implement backward compatibility adapter for old helmet format in schema module.
- [ ] Replace usage in `app.js` with service calls.

Acceptance: Import/export & presets work via service layer; failures produce user-friendly errors.

---
## Phase 3 – UI Componentization
Problems: Large procedural DOM code; repeated card patterns; inconsistent accessibility.

Tasks:
- [ ] Create `ui/components/`:
  - `card.js` (generic card + collapsible variant)
  - `modal.js` (wrapper around Bootstrap creation, ensures id uniqueness, focus mgmt)
  - `tableChances.js` (encapsulate `fillChancesTable` usage & change event dispatch)
  - `alerts.js` (createAlert abstraction)
- [ ] Replace inline `createPresetCard` with reusable `presetCard()`.
- [ ] Remove `createElementFromHtml`; rebuild help/settings windows via pure DOM builders in separate modules (`ui/help.js`, `ui/fileSettings.js`).
- [ ] Add ARIA attributes updates (e.g., toggle `aria-expanded`).

Acceptance: Visual appearance unchanged; DOM builders free of raw innerHTML (except trusted template anchors if absolutely needed).

---
## Phase 4 – Event System & Cleanup
Problems: Many per-node listeners; partial cleanup tracking.

Tasks:
- [ ] Implement delegation: one listener on `#content` handling clicks via `data-action` attributes.
- [ ] Standardize action mapping in `events/router.js`.
- [ ] Replace manual arrays of listeners & `registerElement` with deterministic teardown via component unmount functions.
- [ ] Ensure modals automatically unregister on `hidden.bs.modal`.

Acceptance: Listener count drastically reduced (verify via `getEventListeners` in dev tools or manual log instrumentation).

---
## Phase 5 – Naming & Consistency
Tasks:
- [ ] Rename `curentFaction` → `currentFaction` (introduce new property; keep old reading with deprecation warning for one release cycle).
- [ ] Normalize file & symbol naming (camelCase for functions, PascalCase only for classes/constructors).
- [ ] Centralize magic strings (categories, faction prefix) in `constants.js`.
- [ ] Replace `substring(...) === 'HG'` with `endsWith('HG')` & guard for length.

Acceptance: Lint passes with new naming rules; deprecation log appears only when old property accessed.

---
## Phase 6 – Validation & Security
Tasks:
- [ ] Unified validator interface: `(value, context?) => ({ valid, sanitized, error? })`.
- [ ] Update all `addInputValidation` calls to new contract.
- [ ] Add sanitizer wrapper using DOMPurify or fallback structural creation (if external deps allowed).
- [ ] Disallow `javascript:` URLs & enforce length limits on user strings (preset name, author, description, pin length fixed to 8 numeric).

Acceptance: Fuzz test sample malicious inputs (script tags, onerror attributes) are neutralized.

---
## Phase 7 – Performance
Tasks:
- [ ] Remove `setTimeout(...,100)` label updates; call update after synchronous render or via microtask (`queueMicrotask`).
- [ ] Add `performance.mark` around main render paths; expose `window.getPerfMetrics()`.
- [ ] Optional: Virtualize large tables if row count > threshold.

Acceptance: Equal or improved initial render time; no flicker from delayed updates.

---
## Phase 8 – Testing & Tooling
Tasks:
- [ ] Add basic test runner config (if not present) – choose lightweight (Vitest/Jest).
- [ ] Unit tests: state store, schema validation, preset service (mock fetch), validator functions.
- [ ] Add ESLint rule set (already present config?) augment with: no-implicit-globals, max-lines-per-file, complexity thresholds.
- [ ] Add `npm script` for `lint`, `test`, `build`.

Acceptance: CI (future) runs lint + tests green.<

---
## Phase 9 – Progressive Enhancements & Accessibility
Tasks:
- [ ] Provide keyboard navigation for preset cards (role=button, Enter/Space triggers).
- [ ] Ensure spinner has `aria-live="polite"` or is hidden from AT if purely decorative.
- [ ] Modal focus trapping verified.
- [ ] Add `lang` attribute (HTML) and prepare i18n hook for future localization.

Acceptance: Basic axe-core scan passes (no critical issues).

---
## Phase 10 – Decommission Legacy
Tasks:
- [ ] Remove deprecated global exports.
- [ ] Remove fallback properties (`curentFaction`).
- [ ] Delete commented placeholder code (`{…}` elisions) after real implementations migrated.

Acceptance: Bundle free of transitional shims; documentation updated.

---
## Risk Mitigation
- Incremental commits per phase (avoid giant diff).
- Feature flag where feasible (e.g., new presets modal rendering path) to enable rollback.
- Manual QA after each phase using baseline checklist.

---
## Open Questions (Collect Before Implementation)
- Is adding a dependency like DOMPurify acceptable? If not, need internal allow‑list builder.
- Expected backend contract for presets (saving/updating) – status codes? conflict semantics?
- Max config file size / need for compression?

---
## Acceptance Summary
Refactor considered complete when:
- Cyclomatic complexity of any single file < 15 (except config data files).
- No file over ~400 lines except data schemas.
- All user flows unchanged (export/import/presets/settings) and covered by smoke tests.
- Security & accessibility checks pass.
- Documentation (architecture + contribution guide) reflects new structure.

---
## Quick Start (First Implementation Steps)
1. Create `state/store.js` + legacy adapter.
2. Migrate import/export into `services/fileIO.js` with schema validation.
3. Replace innerHTML helpers for help/settings windows with structured DOM.

(Deliver incremental PR after these before proceeding.)
