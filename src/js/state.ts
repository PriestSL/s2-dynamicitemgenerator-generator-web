import { createEditorState } from '../model/config.ts';
import type { LoadoutConfig } from '../model/types.ts';
import { editConfig } from '../model/editing.ts';
import type { EditCommand } from '../model/editing.ts';
import { validateConfig } from '../model/validation.ts';

// Legacy setters intentionally preserve the existing PresetsManager assignment
// contract. Local UI uses edit(); external DTO validation belongs to stage 7.
export class AppState {
    private editor = createEditorState();
    get config() { return this.editor.config; }
    get baseConfig() { return this.editor.baseConfig; }
    get view() { return this.editor.view; }
    get modifiedWeaponSettings() { return this.config.WeaponSettings; }
    set modifiedWeaponSettings(value: LoadoutConfig['WeaponSettings']) { this.config.WeaponSettings = value; }
    get modifiedArmorSettings() { return this.config.ArmorSettings; }
    set modifiedArmorSettings(value: LoadoutConfig['ArmorSettings']) { this.config.ArmorSettings = value; }
    get modifiedArmorSpawnSettings() { return this.config.ArmorSpawnSettings; }
    set modifiedArmorSpawnSettings(value: LoadoutConfig['ArmorSpawnSettings']) { this.config.ArmorSpawnSettings = value; }
    get modifiedHelmetSpawnSettings() { return this.config.HelmetsSettings; }
    set modifiedHelmetSpawnSettings(value: LoadoutConfig['HelmetsSettings']) { this.config.HelmetsSettings = value; }
    get modifiedGrenadeSettings() { return this.config.GrenadeSettings; }
    set modifiedGrenadeSettings(value: LoadoutConfig['GrenadeSettings']) { this.config.GrenadeSettings = value; }
    get modifiedAmmoByWeaponClass() { return this.config.AmmoSettings; }
    set modifiedAmmoByWeaponClass(value: LoadoutConfig['AmmoSettings']) { this.config.AmmoSettings = value; }
    get modifiedWeaponList() { return this.config.WeaponList; }
    set modifiedWeaponList(value: LoadoutConfig['WeaponList']) { this.config.WeaponList = value; }
    get modifiedDropConfigs() { return this.config.DropConfigs; }
    set modifiedDropConfigs(value: LoadoutConfig['DropConfigs']) { this.config.DropConfigs = value; }
    get modifiedPistolSettings() { return this.config.PistolSettings; }
    set modifiedPistolSettings(value: LoadoutConfig['PistolSettings']) { this.config.PistolSettings = value; }
    get modifiedPistolSpawnChance() { return this.config.PistolSpawnChance; }
    set modifiedPistolSpawnChance(value: LoadoutConfig['PistolSpawnChance']) { this.config.PistolSpawnChance = value; }
    get modifiedMinWeaponDurability() { return this.config.MinWeaponDurability; }
    set modifiedMinWeaponDurability(value: LoadoutConfig['MinWeaponDurability']) { this.config.MinWeaponDurability = value; }
    get modifiedMaxWeaponDurability() { return this.config.MaxWeaponDurability; }
    set modifiedMaxWeaponDurability(value: LoadoutConfig['MaxWeaponDurability']) { this.config.MaxWeaponDurability = value; }
    get modsCompatibility() { return this.config.Compatibility; }
    set modsCompatibility(value: LoadoutConfig['Compatibility']) { this.config.Compatibility = value; }
    get typeToTable() {
        return { weapon: this.config.WeaponList, armor: this.config.ArmorSpawnSettings,
            pistol: Object.fromEntries(Object.entries(this.config.WeaponList).filter(([key]) => key.endsWith('_HG'))) };
    }
    getChancesSettings() {
        return { weapon: this.config.WeaponSettings, armor: this.config.ArmorSettings,
            pistol: this.config.PistolSettings, grenade: this.config.GrenadeSettings,
            helmet: this.config.HelmetsSettings, ammo: this.config.AmmoSettings,
            weaponList: this.config.WeaponList, armorList: this.config.ArmorSpawnSettings,
            helmetList: this.config.HelmetsSettings };
    }
    edit(command: EditCommand): void { this.editor.config = editConfig(this.config, command); }
    importState(data: unknown): void { this.editor.config = validateConfig(data); }
    exportState(): LoadoutConfig { return structuredClone(this.config); }
    resetState(): void { this.editor = createEditorState(); }
    updateWeaponSettings(value: LoadoutConfig['WeaponSettings']): void {
        this.editor.config = validateConfig({ ...this.config, WeaponSettings: value });
    }
    updateArmorSettings(value: LoadoutConfig['ArmorSettings']): void {
        this.editor.config = validateConfig({ ...this.config, ArmorSettings: value });
    }
    updateArmorSpawnSettings(value: LoadoutConfig['ArmorSpawnSettings']): void {
        this.editor.config = validateConfig({ ...this.config, ArmorSpawnSettings: value });
    }
    updateHelmetSpawnSettings(value: LoadoutConfig['HelmetsSettings']): void {
        this.editor.config = validateConfig({ ...this.config, HelmetsSettings: value });
    }
    updateGrenadeSettings(value: LoadoutConfig['GrenadeSettings']): void {
        this.editor.config = validateConfig({ ...this.config, GrenadeSettings: value });
    }
    updateAmmoSettings(value: LoadoutConfig['AmmoSettings']): void {
        this.editor.config = validateConfig({ ...this.config, AmmoSettings: value });
    }
    updateWeaponList(value: LoadoutConfig['WeaponList']): void {
        this.editor.config = validateConfig({ ...this.config, WeaponList: value });
    }
    updateDropConfigs(value: LoadoutConfig['DropConfigs']): void {
        this.editor.config = validateConfig({ ...this.config, DropConfigs: value });
    }
    updatePistolSettings(value: LoadoutConfig['PistolSettings']): void {
        this.editor.config = validateConfig({ ...this.config, PistolSettings: value });
    }
    updatePistolSpawnChance(value: LoadoutConfig['PistolSpawnChance']): void {
        this.editor.config = validateConfig({ ...this.config, PistolSpawnChance: value });
    }
    updateModsCompatibility(value: LoadoutConfig['Compatibility']): void {
        this.editor.config = validateConfig({ ...this.config, Compatibility: value });
    }
    updateWeaponDurability(min: number, max: number): void {
        this.editor.config = validateConfig({ ...this.config, MinWeaponDurability: min, MaxWeaponDurability: max });
    }
}
