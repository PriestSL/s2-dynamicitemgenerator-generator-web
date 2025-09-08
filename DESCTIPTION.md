# Application Architecture (Current & Target)

This document describes the present structure of the web app and the intended modular architecture after the refactor outlined in `APP_JS_REFACTOR_TODO.md`.

---
## 1. Purpose
A browser-based configuration generator for S.T.A.L.K.E.R. 2 dynamic item generation. Users adjust loot/spawn probabilities, export/import JSON configs, and manage public/official presets.

---
## 2. Current Architecture (Phase 1 - State Management Refactored)

### New State Management Layer (✅ Implemented)
- **Central Store**: `src/js/state/store.js` - Reactive state container with event emission
- **Legacy Compatibility**: `src/js/state/legacyExports.js` - Temporary compatibility layer for existing code
- **Clean API**: `getState()`, `update(patch)`, `replace(newState)`, `subscribe(listener)`

### Remaining Monolithic Structure
- Single large orchestration file: `src/js/app.js` (~ many responsibilities) handling:
  - DOM creation for settings, tables, modals, alerts, help, todo, info.
  - Event listener binding for categories/factions/buttons.
  - Import/export JSON logic (including legacy helmet format migration) - **Now uses store.replace()**
  - Preset modal creation & (placeholder) CRUD operations - **Now uses store.replace()**
  - Ad-hoc sanitization of HTML (`createElementFromHtml`).
  - Manual spinner overlay management.
  - Partial cleanup utilities (`registerElement`, `cleanupElement`).

### Phase 1 Improvements ✅
- **Centralized State**: All configuration data now flows through a single reactive store
- **Event-Driven Updates**: State changes emit events for automatic UI synchronization
- **Immutable State**: State snapshots prevent accidental mutations
- **Lazy Loading Preserved**: Configuration data still loads on-demand for performance
- **Backward Compatibility**: Existing code continues to work via proxy-based legacy exports
- **Deprecation Warnings**: Console warnings guide migration to new API

### Current State Shape
```javascript
{
  version: "1.0",
  weaponSettings: {...},      // Lazy loaded via store.getWeaponSettings()
  armorSettings: {...},       // Lazy loaded via store.getArmorSettings()
  grenadeSettings: {...},     // Lazy loaded via store.getGrenadeSettings()
  ammoByWeaponClass: {...},   // Lazy loaded via store.getAmmoByWeaponClass()
  weaponList: {...},          // Lazy loaded via store.getWeaponList()
  dropConfigs: {...},         // Lazy loaded via store.getDropConfigs()
  compatibility: { SHA: false },
  armorSpawnSettings: {...},  // Lazy loaded via store.getArmorSpawnSettings()
  helmetSpawnSettings: {...}, // Lazy loaded via store.getHelmetSpawnSettings()
  pistolSettings: {...},      // Lazy loaded via store.getPistolSettings()
  pistolSpawnChance: 25,
  minWeaponDurability: 25,
  maxWeaponDurability: 90,
  ui: {
    currentFaction: "Generic_settings",
    currentCategory: "Primary",
    spinnerDepth: 0
  }
}
```

### Migration Status
- ✅ **State Store**: Implemented with reactive updates and subscriptions
- ✅ **Lazy Loading**: Preserved existing performance optimizations 
- ✅ **Legacy Exports**: Compatibility layer with deprecation warnings
- ✅ **Import/Export**: Updated to use `store.replace()` instead of direct assignments
- ✅ **Preset Loading**: Updated to use `store.replace()` for data updates
- ✅ **Variable Updates**: Event handlers now use `store.update()` for changes

### Remaining Issues (Next Phases)
- Tight coupling: UI logic and data assembly still intertwined.
- Hard to test: Some hidden dependencies on globals remain.
- Security risk: regex-based sanitization still used.
- Accessibility gaps: inconsistent ARIA usage, limited keyboard semantics.
- Maintainability: Large functions, repeated patterns, unclear state transitions.
- Performance: Unnecessary timeouts, many direct listeners, potential memory leaks.

---
## 3. Target Modular Architecture
```
src/js/
  state/
    store.js              # Central reactive state store
    legacyExports.js      # Temporary shim re-exporting old globals
  services/
    configService.js      # Abstraction over configLoader + schema versioning
    fileIO.js             # Import/export + schema validation + adapters
    presetService.js      # Preset CRUD (fetch abstraction)
    spinnerService.js     # Reference-counted spinner controller
  validation/
    schema.js             # JSON schema objects + adapters (helmet legacy)
    validators.js         # Field-level validators (pin, percentage, names)
  ui/
    components/
      card.js             # Generic & collapsible card factories
      modal.js            # Bootstrap modal wrapper + lifecycle mgmt
      alerts.js           # Alert/attention elements
      presetCard.js       # Renders a preset card (official/community)
      chancesTable.js     # Encapsulates chance table render & events
    views/
      settingsView.js     # Weapon/armor/helmet/grenade settings mount
      fileSettingsView.js # Compatibility + drop settings modal
      helpView.js         # Installation guide
      infoView.js         # About dialog
      todoView.js         # TODO list dialog
      presetsView.js      # Orchestrates preset modal composition
    router.js             # Category/faction -> view mapping
    a11y.js               # Accessibility helpers (aria sync, focus trap)
  constants.js            # Magic strings & enums
  events/
    bus.js                # Simple Pub/Sub or event emitter
  utils/
    dom.js                # Safe DOM creation helpers (no innerHTML)
    performance.js        # Perf marks & reporting
    sanitize.js           # (If no external lib) strict element allow-list
  appBootstrap.js         # Entry: init store, bind router, initial render
```

### Core Layers
1. State Layer (Reactive): Clean API, no DOM, serializable.
2. Services Layer: Side-effects (network, file download, schema adaptation).
3. UI Components: Pure functions returning DOM nodes (idempotent). Minimal side-effects.
4. Views: Compose components + subscribe to state changes.
5. Router: Chooses which view to mount based on user selections (faction/category).
6. Utilities: Shared foundational helpers (DOM, validation, perf, sanitization).

---
## 4. Data Flow (Current - Phase 1)

### Current Implementation ✅
**User Action** -> **Event Handler** -> **store.update()** -> **State Change Event** -> **(Future: Subscribed Views re-render)**

**Import Flow (✅ Implemented):**
File -> Import Handler -> Parse JSON -> `store.replace(normalizedData)` -> ConfigLoader updates -> UI refresh

**Export Flow:**
Export button -> `generateConfig()` -> Uses current store state -> Triggers download

**Preset Load Flow (✅ Implemented):**
Select preset card -> API call -> Success -> `store.replace(presetData)` -> UI refresh

### State Updates (✅ Current)
- **Weapon durability**: `store.update({ minWeaponDurability: value, maxWeaponDurability: value })`
- **Pistol spawn chance**: `store.update({ pistolSpawnChance: value })`
- **Full config import**: `store.replace(importedConfig)`
- **Preset loading**: `store.replace(presetConfig)`

### Legacy Compatibility (✅ Active)
- Old variable names (`modifiedWeaponSettings`, etc.) work via Proxy objects
- Deprecation warnings logged on access
- Read-only enforcement prevents direct mutation
- Will be removed in Phase 10

---
## 5. State Shape (Illustrative)
```
{
  version: "1.x",
  weaponSettings: {...},
  armorSettings: {...},
  grenadeSettings: {...},
  ammoSettings: {...},
  weaponList: {...},
  dropConfigs: {...},
  compatibility: { SHA: false },
  armorSpawnSettings: {...},
  helmetSettings: {...},
  ui: {
    currentFaction: "Generic_settings",
    currentCategory: "Primary",
    spinnerDepth: 0
  }
}
```

---
## 6. Validation & Schema Versioning
- `schemaVersion` incremented when structure changes.
- Import logic:
  1. Detect version (default if absent).
  2. Apply migration adapters (e.g., legacy helmet format).
  3. Validate required keys & value ranges.
  4. Return normalized state object.

---
## 7. Accessibility Strategy
- All interactive elements: role + keyboard activation (Enter/Space).
- Collapsible cards: manage `aria-expanded` + `aria-controls`.
- Modals: rely on Bootstrap focus trapping; supply descriptive titles.
- Spinner: `aria-busy="true"` on main region; spinner itself `aria-hidden="true"`.

---
## 8. Performance Strategy
- Avoid layout thrash: build fragments, single append.
- Eliminate arbitrary `setTimeout` for label sync (synchronous render pipeline).
- Instrument with `performance.mark` around major view renders.
- Optional virtualization if counts exceed threshold.

---
## 9. Security Model
- No arbitrary HTML injection; only structured element creation.
- If rich text is ever needed: integrate DOMPurify (strict config) or internal whitelist sanitizer.
- Validate all external data (preset responses) before rendering.
- Reject overlarge imports (> configurable size, e.g., 1MB).

---
## 10. Migration & Compatibility
- Phase-based introduction; maintain `legacyExports.js` mapping old globals to new store selectors.
- Deprecation console warnings when legacy names accessed.
- Final phase removes legacy shim once downstream code updated.

---
## 11. Error Handling Pattern
- Central `handleError(context, error)` producing:
  - Console structured log (with context + stack).
  - Optional user alert / toast.
  - Optional telemetry hook (future).

---
## 12. Testing Approach (Future)
- Unit: store, validators, schema adapters, preset service.
- DOM (lightweight): component output shape given deterministic inputs.
- Integration: import->render->export round trip snapshot.

---
## 13. Deployment & Build
- Vite builds ES modules; tree-shaking improved by modularization.
- Future opportunity: code-split rarely used modals (help, info, todo) via dynamic import.

---
## 14. Contribution Guidelines (Summary)
- One module = one responsibility.
- Keep functions < ~50 lines where possible.
- Prefer pure functions for UI composition.
- Update architecture + refactor TODO when adding new feature surfaces.

---
## 15. Open Extensions
- Localization layer (string table + key lookup) to slot into views.
- Theming (CSS variables) for future dark mode.
- Service worker for offline usage (cache static + last config).

---
## 16. Glossary
- *Store*: Central reactive container for application state.
- *View*: Coordinated section of UI, mounts components based on state.
- *Component*: Stateless (or minimally stateful) factory returning DOM subtree.
- *Service*: Handles side-effects (network, file, localStorage, etc.).
- *Adapter*: Function converting legacy or external data into normalized internal state.

---
## 18. Phase 1 Implementation Summary (✅ Complete)

### What Was Accomplished
1. **Central State Store** (`src/js/state/store.js`):
   - Reactive state container with event emission system
   - Immutable state snapshots via `getState()`
   - Selective state access via `select(keys[])`
   - State updates via `update(patch)` and `replace(newState)`
   - Subscription system with `subscribe(listener)`

2. **Legacy Compatibility Layer** (`src/js/state/legacyExports.js`):
   - Proxy-based access to maintain old variable names
   - Deprecation warnings for migration guidance
   - Read-only enforcement to prevent direct mutations
   - Backward compatible function exports

3. **Migration of app.js**:
   - Removed old lazy loading variables and getter functions
   - Updated import/export functions to use `store.replace()`
   - Updated preset loading to use `store.replace()`
   - Updated form event handlers to use `store.update()`
   - Preserved all existing functionality

4. **Performance Preserved**:
   - Lazy loading still occurs on first access
   - Configuration data loaded only when needed
   - Memory footprint unchanged

### Migration Path Provided
- **Immediate**: All existing code continues to work unchanged
- **Gradual**: New code can use the store API directly
- **Guided**: Console warnings help identify areas for upgrade
- **Safe**: Read-only legacy exports prevent accidental state corruption

### Next Steps (Phase 2+)
The foundation is now in place for:
- Services layer (configService, fileIO, presetService)
- UI componentization
- Event system cleanup
- Enhanced validation and security

### Developer Usage
```javascript
// New recommended approach
import store from './state/store.js';

// Get current state
const currentState = store.getState();

// Subscribe to changes
const unsubscribe = store.subscribe((changeEvent) => {
    console.log('State updated:', changeEvent);
});

// Update specific values
store.update({ 
    minWeaponDurability: 50,
    ui: { currentFaction: 'Freedom' }
});

// Replace entire state (for imports)
store.replace(importedConfiguration);
```

---
## 17. Summary
The target architecture replaces the monolithic imperative `app.js` with layered, testable modules. Benefits include easier maintenance, clearer data flow, reduced security risk, and groundwork for future enhancements (i18n, theming, offline). Follow the phased refactor plan to mitigate risk and preserve current functionality while incrementally improving structure.
