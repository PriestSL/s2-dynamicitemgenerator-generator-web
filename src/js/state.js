/**
 * State Management Module
 * Centralized application state management
 */

import { createEditorState } from '../model/config.ts';

// Transitional JS facade: existing renderers, PresetsManager and the generator
// still write these names. Each property forwards to the single working config.
// Their writes/imports are NOT runtime-validated by the TypeScript model yet.
const legacyFields = {
    modifiedWeaponSettings: 'WeaponSettings',
    modifiedArmorSettings: 'ArmorSettings',
    modifiedArmorSpawnSettings: 'ArmorSpawnSettings',
    modifiedHelmetSpawnSettings: 'HelmetsSettings',
    modifiedGrenadeSettings: 'GrenadeSettings',
    modifiedAmmoByWeaponClass: 'AmmoSettings',
    modifiedWeaponList: 'WeaponList',
    modifiedDropConfigs: 'DropConfigs',
    modifiedPistolSettings: 'PistolSettings',
    modifiedPistolSpawnChance: 'PistolSpawnChance',
    modifiedMinWeaponDurability: 'MinWeaponDurability',
    modifiedMaxWeaponDurability: 'MaxWeaponDurability',
    modsCompatibility: 'Compatibility',
};

export class AppState {
    constructor() {
        Object.assign(this, createEditorState());
        for (const [legacyName, configName] of Object.entries(legacyFields)) {
            Object.defineProperty(this, legacyName, {
                enumerable: true,
                get: () => this.config[configName],
                set: value => { this.config[configName] = value; },
            });
        }
        
        // Create pistol type table
        this.typeToTable = {
            weapon: this.modifiedWeaponList,
            armor: this.modifiedArmorSpawnSettings,
            pistol: this._createPistolTable()
        };
    }
    
    _createPistolTable() {
        let oTemp = {};
        for (let key in this.modifiedWeaponList) {
            if (key.substring(key.length - 2) === 'HG') {
                oTemp[key] = this.modifiedWeaponList[key];
            }
        }
        return oTemp;
    }
    
    updateWeaponSettings(settings) {
        this.modifiedWeaponSettings = settings;
    }
    
    updateArmorSettings(settings) {
        this.modifiedArmorSettings = settings;
    }
    
    updateArmorSpawnSettings(settings) {
        this.modifiedArmorSpawnSettings = settings;
        this.typeToTable.armor = settings;
    }
    
    updateHelmetSpawnSettings(settings) {
        this.modifiedHelmetSpawnSettings = settings;
    }
    
    updateGrenadeSettings(settings) {
        this.modifiedGrenadeSettings = settings;
    }
    
    updateAmmoSettings(settings) {
        this.modifiedAmmoByWeaponClass = settings;
    }
    
    updateWeaponList(settings) {
        this.modifiedWeaponList = settings;
        this.typeToTable.weapon = settings;
        this.typeToTable.pistol = this._createPistolTable();
    }
    
    updateDropConfigs(settings) {
        this.modifiedDropConfigs = settings;
    }
    
    updatePistolSettings(settings) {
        this.modifiedPistolSettings = settings;
    }
    
    updatePistolSpawnChance(chance) {
        this.modifiedPistolSpawnChance = chance;
    }
    
    updateWeaponDurability(min, max) {
        this.modifiedMinWeaponDurability = min;
        this.modifiedMaxWeaponDurability = max;
    }
    
    updateModsCompatibility(compatibility) {
        this.modsCompatibility = compatibility;
    }
    
    getChancesSettings() {
        return {
            weapon: this.modifiedWeaponSettings,
            armor: this.modifiedArmorSettings,
            helmet: this.modifiedHelmetSpawnSettings,
            grenade: this.modifiedGrenadeSettings,
            ammo: this.modifiedAmmoByWeaponClass,
            weaponList: this.modifiedWeaponList,
            armorList: this.modifiedArmorSpawnSettings,
            helmetList: this.modifiedHelmetSpawnSettings
        };
    }
    
    exportState() {
        return {
            WeaponSettings: this.modifiedWeaponSettings,
            ArmorSettings: this.modifiedArmorSettings,
            GrenadeSettings: this.modifiedGrenadeSettings,
            AmmoSettings: this.modifiedAmmoByWeaponClass,
            WeaponList: this.modifiedWeaponList,
            DropConfigs: this.modifiedDropConfigs,
            Compatibility: this.modsCompatibility,
            ArmorSpawnSettings: this.modifiedArmorSpawnSettings,
            HelmetsSettings: this.modifiedHelmetSpawnSettings,
            PistolSettings: this.modifiedPistolSettings,
            PistolSpawnChance: this.modifiedPistolSpawnChance,
            MinWeaponDurability: this.modifiedMinWeaponDurability,
            MaxWeaponDurability: this.modifiedMaxWeaponDurability
        };
    }
    
    importState(data) {
        // Import data with backward compatibility
        if (data.WeaponSettings) this.modifiedWeaponSettings = data.WeaponSettings;
        if (data.ArmorSettings) this.modifiedArmorSettings = data.ArmorSettings;
        if (data.GrenadeSettings) this.modifiedGrenadeSettings = data.GrenadeSettings;
        if (data.AmmoSettings) this.modifiedAmmoByWeaponClass = data.AmmoSettings;
        if (data.WeaponList) this.updateWeaponList(data.WeaponList);
        if (data.DropConfigs) this.modifiedDropConfigs = data.DropConfigs;
        if (data.Compatibility) this.modsCompatibility = data.Compatibility;
        if (data.ArmorSpawnSettings) this.updateArmorSpawnSettings(data.ArmorSpawnSettings);
        if (data.HelmetsSettings) this.modifiedHelmetSpawnSettings = data.HelmetsSettings;
        if (data.PistolSettings) this.modifiedPistolSettings = data.PistolSettings;
        if (data.PistolSpawnChance !== undefined) this.modifiedPistolSpawnChance = data.PistolSpawnChance;
        if (data.MinWeaponDurability !== undefined) this.modifiedMinWeaponDurability = data.MinWeaponDurability;
        if (data.MaxWeaponDurability !== undefined) this.modifiedMaxWeaponDurability = data.MaxWeaponDurability;
    }
    
    resetState() {
        // Reset to initial values
        Object.assign(this, new AppState());
    }
}
