import type { DeepReadonly, LoadoutConfig, ViewState } from './types.ts';
import { validateConfig, invalid } from './validation.ts';

export type ConfigPath = readonly [keyof LoadoutConfig, ...string[]];
export interface ConfigChange { path: ConfigPath; kind: 'added' | 'removed' | 'modified'; base: unknown; current: unknown }

export function valueAt(value: unknown, path: readonly string[]): unknown {
    for (const key of path) {
        if (!value || typeof value !== 'object' || !Object.hasOwn(value, key)) return undefined;
        value = Object.entries(value).find(([k]) => k === key)?.[1];
    }
    return value;
}
export function sameValue(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(k => Object.hasOwn(b, k) && sameValue(valueAt(a, [k]), valueAt(b, [k])));
}
export function compareConfig(base: DeepReadonly<LoadoutConfig>, current: LoadoutConfig): ConfigChange[] {
    const changes: ConfigChange[] = [];
    function walk(a: unknown, b: unknown, path: ConfigPath): void {
        if (sameValue(a, b)) return;
        if (a !== undefined && b !== undefined && a !== null && b !== null && typeof a === 'object' && typeof b === 'object') {
            for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) walk(valueAt(a, [key]), valueAt(b, [key]), [...path, key]);
        } else changes.push({ path, kind: a === undefined ? 'added' : b === undefined ? 'removed' : 'modified', base: a, current: b });
    }
    for (const key of Object.keys(current) as (keyof LoadoutConfig)[]) walk(base[key], current[key], [key]);
    return changes;
}

/** A field in a range always expands to both endpoints, including absent overrides. */
export function resetPaths(path: ConfigPath): ConfigPath[] {
    const [section, item, attribute, rank] = path;
    if (section === 'MinWeaponDurability' || section === 'MaxWeaponDurability') return [['MinWeaponDurability'], ['MaxWeaponDurability']];
    if (section === 'AmmoSettings' && path.length === 3 && item !== undefined) return [['AmmoSettings', item]];
    if (section === 'WeaponList' && item !== undefined && attribute) {
        if (attribute === 'minAmmo' || attribute === 'maxAmmo') return [['WeaponList', item, 'minAmmo'], ['WeaponList', item, 'maxAmmo']];
        if (attribute === 'minCondition' || attribute === 'maxCondition') return [['WeaponList', item, 'minCondition'], ['WeaponList', item, 'maxCondition']];
    }
    if (section === 'DropConfigs' && (item === 'nMinDurability' || item === 'nMaxDurability')) return [['DropConfigs', 'nMinDurability'], ['DropConfigs', 'nMaxDurability']];
    if (section === 'GrenadeSettings' && item === 'Default' && attribute !== undefined && (rank === 'minAmmo' || rank === 'maxAmmo')) {
        const index = path[4];
        return index === undefined ? [['GrenadeSettings', 'Default', attribute, 'minAmmo'], ['GrenadeSettings', 'Default', attribute, 'maxAmmo']]
            : [['GrenadeSettings', 'Default', attribute, 'minAmmo', index], ['GrenadeSettings', 'Default', attribute, 'maxAmmo', index]];
    }
    return [path];
}
export function resetTargets(base: DeepReadonly<LoadoutConfig>, path: ConfigPath): ConfigPath[] {
    // A field of a newly added item has no independent baseline: reset removes that item.
    for (let length = 2; length < path.length; length++) {
        const parent: ConfigPath = [path[0], ...path.slice(1, length)];
        if (valueAt(base, parent) === undefined) return [parent];
    }
    return resetPaths(path);
}
function write(root: object, path: readonly string[], value: unknown): void {
    const key = path[0];
    if (key === undefined || ['__proto__', 'prototype', 'constructor'].includes(key)) invalid('reset', 'Invalid path');
    if (path.length === 1) {
        if (value === undefined) Reflect.deleteProperty(root, key);
        else Reflect.set(root, key, structuredClone(value));
        return;
    }
    let child = valueAt(root, [key]);
    if (child === undefined) { child = {}; Reflect.set(root, key, child); }
    if (!child || typeof child !== 'object') invalid(path.join('.'), 'Invalid reset path');
    write(child, path.slice(1), value);
}
export function resetConfig(current: LoadoutConfig, base: DeepReadonly<LoadoutConfig>, paths?: readonly ConfigPath[]): LoadoutConfig {
    if (!paths) return validateConfig(structuredClone(base));
    const next = structuredClone(current);
    for (const path of paths) if (path.some(key => ['__proto__', 'prototype', 'constructor'].includes(key))) invalid('reset', 'Reserved path');
    for (const requested of paths) for (const path of resetTargets(base, requested)) {
        if (valueAt(current, path) === undefined && valueAt(base, path) === undefined) continue;
        write(next, path, valueAt(base, path));
    }
    return validateConfig(next);
}

export function viewPaths(view: ViewState): ConfigPath[] {
    const faction = `GeneralNPC_${view.faction}`;
    switch (view.category) {
        case 'Primary': return view.faction === 'Generic_settings' ? [['WeaponList'], ['MinWeaponDurability'], ['MaxWeaponDurability']] : [['WeaponSettings', faction]];
        case 'Pistols': return view.faction === 'Generic_settings' ? [['PistolSpawnChance']] : [['PistolSettings', faction]];
        case 'Armor': return view.faction === 'Generic_settings' ? [['ArmorSpawnSettings'], ['DropConfigs']] : [['ArmorSettings', faction]];
        case 'Helmets': return [['HelmetsSettings']];
        case 'Ammo': return [['AmmoSettings']];
        case 'Grenades': return [['GrenadeSettings']];
        default: return [];
    }
}

export function isChanged(base: DeepReadonly<LoadoutConfig>, config: LoadoutConfig, paths: readonly ConfigPath[]): boolean {
    return paths.some(path => !sameValue(valueAt(base, path), valueAt(config, path)));
}
