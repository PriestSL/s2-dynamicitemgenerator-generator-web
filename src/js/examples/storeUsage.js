/**
 * Example usage of the new State Management System (Phase 1)
 * This demonstrates the new reactive state store functionality
 */

import store from './state/store.js';

// Example 1: Getting current state
console.log('Current state:', store.getState());

// Example 2: Selecting specific parts of state
const weaponData = store.select(['weaponSettings', 'weaponList']);
console.log('Weapon configuration:', weaponData);

// Example 3: Subscribing to state changes
const unsubscribe = store.subscribe((changeEvent) => {
    console.log('State changed:', {
        previous: changeEvent.previousState,
        current: changeEvent.currentState,
        patch: changeEvent.patch
    });
});

// Don't forget to cleanup subscriptions when component unmounts
// Call unsubscribe() when cleanup needed
window.cleanupStoreExample = unsubscribe;

// Example 4: Updating state
store.update({
    minWeaponDurability: 85,
    maxWeaponDurability: 100,
    ui: {
        currentFaction: 'Bandits',
        currentCategory: 'Primary'
    }
});

// Example 5: Replacing entire state (used during import/preset loading)
store.replace({
    weaponSettings: { /* new weapon settings */ },
    armorSettings: { /* new armor settings */ },
    // ... other configuration data
    version: "1.1",
    compatibility: { SHA: true }
});

// Example 6: Using individual getters for backward compatibility
console.log('Weapon settings:', store.getWeaponSettings());
console.log('Armor settings:', store.getArmorSettings());

export { store };
