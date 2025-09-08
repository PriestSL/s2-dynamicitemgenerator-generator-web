/**
 * Central reactive state store for S.T.A.L.K.E.R. 2 Dynamic Item Generator
 * Implements Phase 1 of the refactor plan from APP_JS_REFACTOR_TODO.md
 */

import * as configs from '../configs.js';
import { 
    getWeaponSettings,
    getArmorSettings,
    getArmorSpawnSettings,
    getHelmetSpawnSettings,
    getGrenadeSettings,
    getAmmoByWeaponClass,
    getWeaponList,
    getDropConfigs,
    getPistolSettings
} from './ConfigLoader.js';

/**
 * Event listener management for state subscriptions
 */
class EventEmitter {
    constructor() {
        this.listeners = new Map();
    }

    subscribe(eventType, listener) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(listener);
        
        // Return unsubscribe function
        return () => {
            const eventListeners = this.listeners.get(eventType);
            if (eventListeners) {
                eventListeners.delete(listener);
                if (eventListeners.size === 0) {
                    this.listeners.delete(eventType);
                }
            }
        };
    }

    emit(eventType, data) {
        const eventListeners = this.listeners.get(eventType);
        if (eventListeners) {
            eventListeners.forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`Error in state listener for ${eventType}:`, error);
                }
            });
        }
    }
}

/**
 * Central application state store
 */
class StateStore extends EventEmitter {
    constructor() {
        super();
        this._state = this._initializeState();
        this._initialized = false;
    }

    /**
     * Initialize the default state structure
     * @private
     */
    _initializeState() {
        return {
            version: "1.0",
            // Configuration data (lazily loaded)
            weaponSettings: null,
            armorSettings: null,
            armorSpawnSettings: null,
            helmetSpawnSettings: null,
            grenadeSettings: null,
            ammoByWeaponClass: null,
            weaponList: null,
            dropConfigs: null,
            pistolSettings: null,
            
            // Non-config settings
            compatibility: { SHA: false },
            pistolSpawnChance: configs.nPistolLootChance,
            minWeaponDurability: configs.nMinWeaponDurability,
            maxWeaponDurability: configs.nMaxWeaponDurability,
            
            // UI state
            ui: {
                currentFaction: 'Generic_settings',
                currentCategory: 'Primary',
                spinnerDepth: 0
            }
        };
    }

    /**
     * Lazy initialization of configuration data
     * @private
     */
    _ensureConfigLoaded(key) {
        if (this._state[key] === null) {
            switch (key) {
                case 'weaponSettings':
                    this._state.weaponSettings = getWeaponSettings(true);
                    break;
                case 'armorSettings':
                    this._state.armorSettings = getArmorSettings(true);
                    break;
                case 'armorSpawnSettings':
                    this._state.armorSpawnSettings = getArmorSpawnSettings(true);
                    break;
                case 'helmetSpawnSettings':
                    this._state.helmetSpawnSettings = getHelmetSpawnSettings(true);
                    break;
                case 'grenadeSettings':
                    this._state.grenadeSettings = getGrenadeSettings(true);
                    break;
                case 'ammoByWeaponClass':
                    this._state.ammoByWeaponClass = getAmmoByWeaponClass(true);
                    break;
                case 'weaponList':
                    this._state.weaponList = getWeaponList(true);
                    break;
                case 'dropConfigs':
                    this._state.dropConfigs = getDropConfigs(true);
                    break;
                case 'pistolSettings':
                    this._state.pistolSettings = getPistolSettings(true);
                    break;
                default:
                    console.warn(`Unknown config key: ${key}`);
            }
        }
    }

    /**
     * Get a readonly snapshot of the current state
     * @returns {Object} Readonly state object
     */
    getState() {
        // Ensure all lazy-loaded configs are initialized
        const configKeys = [
            'weaponSettings', 'armorSettings', 'armorSpawnSettings', 
            'helmetSpawnSettings', 'grenadeSettings', 'ammoByWeaponClass',
            'weaponList', 'dropConfigs', 'pistolSettings'
        ];
        
        configKeys.forEach(key => this._ensureConfigLoaded(key));
        
        // Return a deep clone to prevent external mutations
        return JSON.parse(JSON.stringify(this._state));
    }

    /**
     * Select specific keys from state
     * @param {string[]} keys - Array of dot-notation paths to select
     * @returns {Object} Object containing only requested keys
     */
    select(keys) {
        const result = {};
        const state = this.getState();
        
        keys.forEach(key => {
            const value = this._getNestedValue(state, key);
            if (value !== undefined) {
                this._setNestedValue(result, key, value);
            }
        });
        
        return result;
    }

    /**
     * Get nested value using dot notation
     * @private
     */
    _getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    /**
     * Set nested value using dot notation
     * @private
     */
    _setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!(key in current)) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    /**
     * Update state with a partial patch
     * @param {Object} patch - Object containing updates to merge
     */
    update(patch) {
        const previousState = JSON.parse(JSON.stringify(this._state));
        
        // Deep merge the patch into current state
        this._deepMerge(this._state, patch);
        
        // Emit state change event
        this.emit('stateChanged', {
            previousState,
            currentState: JSON.parse(JSON.stringify(this._state)),
            patch
        });
    }

    /**
     * Replace the entire state
     * @param {Object} newState - New state object
     */
    replace(newState) {
        const previousState = JSON.parse(JSON.stringify(this._state));
        this._state = { ...this._initializeState(), ...newState };
        
        this.emit('stateChanged', {
            previousState,
            currentState: JSON.parse(JSON.stringify(this._state)),
            replaced: true
        });
    }

    /**
     * Subscribe to state changes
     * @param {Function} listener - Function to call on state changes
     * @returns {Function} Unsubscribe function
     */
    subscribe(listener) {
        return super.subscribe('stateChanged', listener);
    }

    /**
     * Deep merge utility
     * @private
     */
    _deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key] || typeof target[key] !== 'object') {
                    target[key] = {};
                }
                this._deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }

    /**
     * Get individual config sections (for backward compatibility)
     */
    getWeaponSettings() {
        this._ensureConfigLoaded('weaponSettings');
        return this._state.weaponSettings;
    }

    getArmorSettings() {
        this._ensureConfigLoaded('armorSettings');
        return this._state.armorSettings;
    }

    getArmorSpawnSettings() {
        this._ensureConfigLoaded('armorSpawnSettings');
        return this._state.armorSpawnSettings;
    }

    getHelmetSpawnSettings() {
        this._ensureConfigLoaded('helmetSpawnSettings');
        return this._state.helmetSpawnSettings;
    }

    getGrenadeSettings() {
        this._ensureConfigLoaded('grenadeSettings');
        return this._state.grenadeSettings;
    }

    getAmmoByWeaponClass() {
        this._ensureConfigLoaded('ammoByWeaponClass');
        return this._state.ammoByWeaponClass;
    }

    getWeaponList() {
        this._ensureConfigLoaded('weaponList');
        return this._state.weaponList;
    }

    getDropConfigs() {
        this._ensureConfigLoaded('dropConfigs');
        return this._state.dropConfigs;
    }

    getPistolSettings() {
        this._ensureConfigLoaded('pistolSettings');
        return this._state.pistolSettings;
    }
}

// Create and export singleton instance
const store = new StateStore();

export default store;
export { StateStore };
