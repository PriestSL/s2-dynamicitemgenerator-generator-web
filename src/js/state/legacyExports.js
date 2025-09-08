/**
 * Legacy compatibility adapter for Phase 1 refactor
 * Re-exports old global variable names using the new store API
 * This file provides backward compatibility during the transition period
 * 
 * @deprecated These exports will be removed in Phase 10 of the refactor
 */

import store from './store.js';

// Create deprecation warning function
const createDeprecationWarning = (oldName, newMethod) => {
    console.warn(
        `DEPRECATED: ${oldName} is deprecated. Use store.${newMethod}() instead. ` +
        `This compatibility layer will be removed in a future version.`
    );
};

// Legacy getter functions with deprecation warnings
export const getModifiedWeaponSettings = () => {
    createDeprecationWarning('getModifiedWeaponSettings', 'getWeaponSettings');
    return store.getWeaponSettings();
};

export const getModifiedArmorSettings = () => {
    createDeprecationWarning('getModifiedArmorSettings', 'getArmorSettings');
    return store.getArmorSettings();
};

export const getModifiedArmorSpawnSettings = () => {
    createDeprecationWarning('getModifiedArmorSpawnSettings', 'getArmorSpawnSettings');
    return store.getArmorSpawnSettings();
};

export const getModifiedHelmetSpawnSettings = () => {
    createDeprecationWarning('getModifiedHelmetSpawnSettings', 'getHelmetSpawnSettings');
    return store.getHelmetSpawnSettings();
};

export const getModifiedGrenadeSettings = () => {
    createDeprecationWarning('getModifiedGrenadeSettings', 'getGrenadeSettings');
    return store.getGrenadeSettings();
};

export const getModifiedAmmoByWeaponClass = () => {
    createDeprecationWarning('getModifiedAmmoByWeaponClass', 'getAmmoByWeaponClass');
    return store.getAmmoByWeaponClass();
};

export const getModifiedWeaponList = () => {
    createDeprecationWarning('getModifiedWeaponList', 'getWeaponList');
    return store.getWeaponList();
};

export const getModifiedDropConfigs = () => {
    createDeprecationWarning('getModifiedDropConfigs', 'getDropConfigs');
    return store.getDropConfigs();
};

export const getModifiedPistolSettings = () => {
    createDeprecationWarning('getModifiedPistolSettings', 'getPistolSettings');
    return store.getPistolSettings();
};

// Legacy variable exports using Proxy to trigger deprecation warnings on access
const createLegacyProxy = (getterFn, varName) => {
    let cached = null;
    let hasWarned = false;
    
    return new Proxy({}, {
        get(target, prop) {
            // Only warn once per variable to avoid spam
            if (!hasWarned) {
                console.warn(
                    `DEPRECATED: Direct access to ${varName} is deprecated. ` +
                    `Use the store API instead. This will be removed in Phase 10.`
                );
                hasWarned = true;
            }
            
            if (cached === null) {
                cached = getterFn();
            }
            
            return cached[prop];
        },
        
        set(target, prop, value) {
            console.error(
                `DEPRECATED: Setting ${varName}.${prop} directly is not allowed. ` +
                `Use store.update() instead. Attempted to set: ${value}`
            );
            return false;
        },
        
        has(target, prop) {
            if (cached === null) {
                cached = getterFn();
            }
            return prop in cached;
        },
        
        ownKeys() {
            if (cached === null) {
                cached = getterFn();
            }
            return Object.keys(cached);
        },
        
        getOwnPropertyDescriptor(target, prop) {
            if (cached === null) {
                cached = getterFn();
            }
            return Object.getOwnPropertyDescriptor(cached, prop);
        }
    });
};

// Create legacy proxied exports
export const modifiedWeaponSettings = createLegacyProxy(
    () => store.getWeaponSettings(), 
    'modifiedWeaponSettings'
);

export const modifiedArmorSettings = createLegacyProxy(
    () => store.getArmorSettings(), 
    'modifiedArmorSettings'
);

export const modifiedArmorSpawnSettings = createLegacyProxy(
    () => store.getArmorSpawnSettings(), 
    'modifiedArmorSpawnSettings'
);

export const modifiedHelmetSpawnSettings = createLegacyProxy(
    () => store.getHelmetSpawnSettings(), 
    'modifiedHelmetSpawnSettings'
);

export const modifiedGrenadeSettings = createLegacyProxy(
    () => store.getGrenadeSettings(), 
    'modifiedGrenadeSettings'
);

export const modifiedAmmoByWeaponClass = createLegacyProxy(
    () => store.getAmmoByWeaponClass(), 
    'modifiedAmmoByWeaponClass'
);

export const modifiedWeaponList = createLegacyProxy(
    () => store.getWeaponList(), 
    'modifiedWeaponList'
);

export const modifiedDropConfigs = createLegacyProxy(
    () => store.getDropConfigs(), 
    'modifiedDropConfigs'
);

export const modifiedPistolSettings = createLegacyProxy(
    () => store.getPistolSettings(), 
    'modifiedPistolSettings'
);

// Legacy non-config variables (these access current store state)
let _state = store.getState();
export const modsCompatibility = _state.compatibility;
export const modifiedPistolSpawnChance = _state.pistolSpawnChance;
export const modifiedMinWeaponDurability = _state.minWeaponDurability;
export const modifiedMaxWeaponDurability = _state.maxWeaponDurability;
