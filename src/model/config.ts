import * as defaults from './defaults.ts';
import type { DocumentMetadata, EditorState, LoadoutConfig } from './types.ts';

export function createDefaultConfig(): LoadoutConfig {
    return structuredClone({
        WeaponSettings: defaults.oWeaponLoadoutSettings,
        ArmorSettings: defaults.oArmorLoadoutSettings,
        GrenadeSettings: defaults.oGrenadesSettings,
        AmmoSettings: defaults.oAmmoByWeaponClass,
        WeaponList: defaults.oWeaponList,
        DropConfigs: defaults.oDropConfigs,
        Compatibility: { SHA: false },
        ArmorSpawnSettings: defaults.oArmorSpawnSettings,
        HelmetsSettings: defaults.oHelmetsGlobalSpawnSettings,
        PistolSettings: defaults.oPistolLoadoutSettings,
        PistolSpawnChance: defaults.nPistolLootChance,
        MinWeaponDurability: defaults.nMinWeaponDurability,
        MaxWeaponDurability: defaults.nMaxWeaponDurability,
    });
}

function freezeDeep(value: unknown): void {
    if (value !== null && typeof value === 'object') {
        for (const child of Object.values(value)) freezeDeep(child);
        Object.freeze(value);
    }
}

// Trusted typed input only. Unknown JSON must be validated before calling this API.
export function createEditorState(initial: LoadoutConfig = createDefaultConfig(), metadata: DocumentMetadata = { name: 'Defaults', source: 'defaults' }): EditorState {
    const baseConfig = structuredClone(initial);
    freezeDeep(baseConfig);
    return {
        baseConfig,
        config: structuredClone(initial),
        view: { faction: 'Generic_settings', category: 'Primary' },
        document: Object.freeze({ ...metadata }),
    };
}
