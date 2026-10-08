import { FACTIONS, NPC_CLASSES } from './types.ts';
import { effectiveWeapon, weaponClass } from './effective.ts';
export { weaponClass } from './effective.ts';
import type { LoadoutConfig, RankValues, WeaponOverrides, ArmorSpawnSettings, AmmoRange, AmmoSettings } from './types.ts';
import { validateRange, validateValue } from './values.ts';
import type { NumericUnit } from './values.ts';

type Parser<T> = (value: unknown, path: string) => T;
export function invalid(path: string, message: string): never {
    throw new Error(`${path}: ${message}`);
}
function object(value: unknown, path: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(path, 'Expected an object');
    return Object.fromEntries(Object.entries(value));
}
function shape<T>(fields: { [K in keyof T]-?: Parser<T[K]> }): Parser<T> {
    return (value, path) => {
        const source = object(value, path);
        for (const key of Object.keys(source)) {
            if (!Object.hasOwn(fields, key)) invalid(`${path}.${key}`, 'Unknown field');
        }
        // Every field is constructed by its parser, including optional fields.
        const result = {} as T;
        for (const key in fields) {
            const parsed = fields[key](source[key], `${path}.${key}`);
            if (parsed !== undefined) result[key] = parsed;
        }
        return result;
    };
}
const bool: Parser<boolean> = (value, path) => typeof value === 'boolean' ? value : invalid(path, 'Expected a boolean');
const sid: Parser<string> = (value, path) => typeof value === 'string' && (value === '' || /^[A-Za-z][A-Za-z0-9_]*$/.test(value))
    ? value : invalid(path, 'Expected an item identifier');
const optional = <T>(parse: Parser<T>): Parser<T | undefined> => (value, path) => value === undefined ? undefined : parse(value, path);
const numeric = (unit: NumericUnit): Parser<number> => (value, path) => {
    const result = validateValue(value, unit, path);
    return result.ok ? result.value : invalid(result.path, result.error);
};
function record<T>(parse: Parser<T>, allowed?: readonly string[]): Parser<Record<string, T>> {
    return (value, path) => Object.fromEntries(Object.entries(object(value, path)).map(([key, child]) => {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) invalid(`${path}.${key}`, 'Reserved key');
        if (allowed && !allowed.includes(key)) invalid(`${path}.${key}`, 'Unknown identifier');
        sid(key, path);
        return [key, parse(child, `${path}.${key}`)];
    }));
}
const ranks = (unit: NumericUnit): Parser<RankValues> => (value, path) => {
    if (!Array.isArray(value) || value.length !== 4) invalid(path, 'Expected four rank values');
    const n = numeric(unit);
    return [n(value[0], `${path}[0]`), n(value[1], `${path}[1]`), n(value[2], `${path}[2]`), n(value[3], `${path}[3]`)];
};
const factions = FACTIONS.flatMap(f => [`GeneralNPC_${f}`, `GuardNPC_${f}`]);
const weights = record(ranks('weight'));
const count = numeric('count');
const percent = numeric('percentage');
const probability = numeric('probability');
const ammoRange: Parser<AmmoRange> = (value, path) => {
    if (!Array.isArray(value) || value.length !== 2) invalid(path, 'Expected [min, max]');
    return [count(value[0], `${path}[0]`), count(value[1], `${path}[1]`)];
};
const schema = shape<LoadoutConfig>({
    WeaponSettings: record(record(weights, NPC_CLASSES), factions),
    ArmorSettings: record(weights, factions),
    PistolSettings: record(weights, factions),
    HelmetsSettings: record(ranks('percentage')),
    WeaponList: record(shape<WeaponOverrides>({ minAmmo: optional(count), maxAmmo: optional(count), minCondition: optional(percent), maxCondition: optional(percent) })),
    ArmorSpawnSettings: record(shape<ArmorSpawnSettings>({ drop: bool, dropItem: optional(sid), helmet: optional(sid), helmetSpawn: optional((value, path) => typeof value === 'boolean' ? value : percent(value, path)) })),
    GrenadeSettings: shape({ Default: record(shape({ chances: ranks('percentage'), minAmmo: ranks('count'), maxAmmo: ranks('count') })) }),
    AmmoSettings: shape<AmmoSettings>({ SG: ammoRange, PP: ammoRange, ST: ammoRange, SP: ammoRange, HG: ammoRange, MG: ammoRange, GL: ammoRange, DMR: ammoRange }),
    DropConfigs: shape({ createDroppableArmor: bool, nMinDurability: probability, nMaxDurability: probability, nLootChance: probability }),
    Compatibility: shape({ SHA: bool }),
    PistolSpawnChance: percent,
    MinWeaponDurability: percent,
    MaxWeaponDurability: percent,
});

function range(min: number, max: number, unit: NumericUnit, path: string): void {
    const result = validateRange(min, max, unit, path);
    if (!result.ok) invalid(result.path, result.error);
}
function reference(item: string, catalog: object, path: string): void {
    if (item !== '' && !Object.hasOwn(catalog, item)) invalid(path, `Unknown item ${item}`);
}

/** Full current wire format only. No guessed migrations or coercion of JSON strings. */
export function validateConfig(value: unknown): LoadoutConfig {
    const config = schema(value, 'config');
    range(config.MinWeaponDurability, config.MaxWeaponDurability, 'percentage', 'Min/MaxWeaponDurability');
    range(config.DropConfigs.nMinDurability, config.DropConfigs.nMaxDurability, 'probability', 'DropConfigs');
    for (const [key, [min, max]] of Object.entries(config.AmmoSettings)) range(min, max, 'count', `AmmoSettings.${key}`);
    for (const item of Object.keys(config.WeaponList)) {
        const effective = effectiveWeapon(config, item);
        range(effective.minAmmo, effective.maxAmmo, 'count', `WeaponList.${item}.ammo`);
        range(effective.minCondition, effective.maxCondition, 'percentage', `WeaponList.${item}.condition`);
    }
    for (const [faction, roles] of Object.entries(config.WeaponSettings)) {
        for (const [role, items] of Object.entries(roles)) {
            for (const item of Object.keys(items)) reference(item, config.WeaponList, `WeaponSettings.${faction}.${role}`);
        }
    }
    for (const [faction, items] of Object.entries(config.PistolSettings)) {
        for (const item of Object.keys(items)) {
            reference(item, config.WeaponList, `PistolSettings.${faction}`);
            if (item && weaponClass(item) !== 'HG') invalid(`PistolSettings.${faction}.${item}`, 'Expected a pistol');
        }
    }
    for (const [faction, items] of Object.entries(config.ArmorSettings)) {
        for (const item of Object.keys(items)) reference(item, config.ArmorSpawnSettings, `ArmorSettings.${faction}`);
    }
    for (const [item, attrs] of Object.entries(config.ArmorSpawnSettings)) {
        if (attrs.dropItem) reference(attrs.dropItem, config.ArmorSpawnSettings, `ArmorSpawnSettings.${item}.dropItem`);
        if (attrs.helmet) reference(attrs.helmet, config.HelmetsSettings, `ArmorSpawnSettings.${item}.helmet`);
    }
    for (const [item, attrs] of Object.entries(config.GrenadeSettings.Default)) {
        for (const rank of [0, 1, 2, 3] as const) range(attrs.minAmmo[rank], attrs.maxAmmo[rank], 'count', `GrenadeSettings.Default.${item}[${rank}]`);
    }
    return config;
}

export function parseConfig(text: string): LoadoutConfig {
    const value: unknown = JSON.parse(text);
    return validateConfig(value);
}
export function serializeConfig(config: LoadoutConfig): string {
    return JSON.stringify(validateConfig(config), null, 2);
}
