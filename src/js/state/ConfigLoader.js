/**
 * Lazy configuration loader to avoid expensive deep copies on startup
 * This reduces memory usage and improves initial load performance
 */

import * as configs from '../configs.js';
import { deepCopy } from '../utils.js';

class ConfigLoader {
    constructor() {
        // Store original configurations (read-only references)
        this._originals = {
            oWeaponLoadoutSettings: configs.oWeaponLoadoutSettings,
            oArmorLoadoutSettings: configs.oArmorLoadoutSettings,
            oArmorSpawnSettings: configs.oArmorSpawnSettings,
            oHelmetsGlobalSpawnSettings: configs.oHelmetsGlobalSpawnSettings,
            oGrenadesSettings: configs.oGrenadesSettings,
            oAmmoByWeaponClass: configs.oAmmoByWeaponClass,
            oWeaponList: configs.oWeaponList,
            oDropConfigs: configs.oDropConfigs,
            oPistolLoadoutSettings: configs.oPistolLoadoutSettings
        };

        // Cache for loaded configurations
        this._cache = new Map();
        
        // Track which configurations have been modified
        this._modified = new Set();
    }

    /**
     * Get a configuration with lazy loading and caching
     * @param {string} configName - Name of the configuration
     * @param {boolean} forModification - Whether the config will be modified (triggers deep copy)
     * @returns {Object} The configuration object
     */
    getConfig(configName, forModification = false) {
        if (!this._originals[configName]) {
            throw new Error(`Unknown configuration: ${configName}`);
        }

        const cacheKey = `${configName}_${forModification ? 'modified' : 'readonly'}`;
        
        // Return cached version if available
        if (this._cache.has(cacheKey)) {
            return this._cache.get(cacheKey);
        }

        let config;
        if (forModification) {
            // Deep copy for modification
            config = deepCopy(this._originals[configName]);
            this._modified.add(configName);
        } else {
            // Return read-only reference
            config = this._originals[configName];
        }

        // Cache the result
        this._cache.set(cacheKey, config);
        return config;
    }

    /**
     * Update a configuration in the cache
     * @param {string} configName - Name of the configuration
     * @param {Object} newConfig - New configuration object
     */
    updateConfig(configName, newConfig) {
        const cacheKey = `${configName}_modified`;
        this._cache.set(cacheKey, newConfig);
        this._modified.add(configName);
    }

    /**
     * Reset a configuration to its original state
     * @param {string} configName - Name of the configuration
     */
    resetConfig(configName) {
        this._cache.delete(`${configName}_modified`);
        this._cache.delete(`${configName}_readonly`);
        this._modified.delete(configName);
    }

    /**
     * Reset all configurations to their original state
     */
    resetAll() {
        this._cache.clear();
        this._modified.clear();
    }

    /**
     * Get list of modified configurations
     * @returns {Array<string>} Array of modified configuration names
     */
    getModified() {
        return Array.from(this._modified);
    }

    /**
     * Check if a configuration has been modified
     * @param {string} configName - Name of the configuration
     * @returns {boolean} True if modified
     */
    isModified(configName) {
        return this._modified.has(configName);
    }

    /**
     * Get memory usage information
     * @returns {Object} Memory usage stats
     */
    getMemoryInfo() {
        return {
            cacheSize: this._cache.size,
            modifiedCount: this._modified.size,
            originalConfigsCount: Object.keys(this._originals).length
        };
    }

    /**
     * Clear cache to free memory (keeps originals)
     */
    clearCache() {
        this._cache.clear();
        // Don't clear _modified as it tracks state
    }
}

// Create singleton instance
export const configLoader = new ConfigLoader();

// Export convenience functions for backward compatibility
export const getWeaponSettings = (forModification = false) => 
    configLoader.getConfig('oWeaponLoadoutSettings', forModification);

export const getArmorSettings = (forModification = false) => 
    configLoader.getConfig('oArmorLoadoutSettings', forModification);

export const getArmorSpawnSettings = (forModification = false) => 
    configLoader.getConfig('oArmorSpawnSettings', forModification);

export const getHelmetSpawnSettings = (forModification = false) => 
    configLoader.getConfig('oHelmetsGlobalSpawnSettings', forModification);

export const getGrenadeSettings = (forModification = false) => 
    configLoader.getConfig('oGrenadesSettings', forModification);

export const getAmmoByWeaponClass = (forModification = false) => 
    configLoader.getConfig('oAmmoByWeaponClass', forModification);

export const getWeaponList = (forModification = false) => 
    configLoader.getConfig('oWeaponList', forModification);

export const getDropConfigs = (forModification = false) => 
    configLoader.getConfig('oDropConfigs', forModification);

export const getPistolSettings = (forModification = false) => 
    configLoader.getConfig('oPistolLoadoutSettings', forModification);
