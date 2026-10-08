import { WEAPON_CLASSES } from './types.ts';
import type { LoadoutConfig, WeaponOverrides, WeaponClassId } from './types.ts';

export function weaponClass(item: string): WeaponClassId {
    const found = WEAPON_CLASSES.find(key => item.endsWith(`_${key}`));
    if (!found) throw new Error(`WeaponList.${item}: Unknown weapon class suffix`);
    return found;
}

/** Editor percentages and counts, shared by validation and CFG generation. */
export function effectiveWeapon(config: LoadoutConfig, item: string): Required<WeaponOverrides> {
    const overrides = config.WeaponList[item];
    if (!overrides) throw new Error(`WeaponList.${item}: Unknown item`);
    const ammo = config.AmmoSettings[weaponClass(item)];
    return {
        minAmmo: overrides.minAmmo ?? ammo[0],
        maxAmmo: overrides.maxAmmo ?? ammo[1],
        minCondition: overrides.minCondition ?? config.MinWeaponDurability,
        maxCondition: overrides.maxCondition ?? config.MaxWeaponDurability,
    };
}

export const percentage = (value: number): number => value / 100;
