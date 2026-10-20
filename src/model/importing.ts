import { createDefaultConfig } from './config.ts';
import { invalid, validateConfig, validateConfigShape } from './validation.ts';
import { effectiveWeapon } from './effective.ts';
import { RANKS } from './types.ts';
import type { LoadoutConfig } from './types.ts';

export interface ImportNotice { path: string; kind: 'number' | 'default' | 'legacy' | 'range'; before?: unknown; after?: unknown }
export interface ImportedConfig { config: LoadoutConfig; notices: ImportNotice[] }

function object(value: unknown, path: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(path, 'Expected an object');
    return Object.fromEntries(Object.entries(value));
}
function safeKeys(value: unknown, path: string): void {
    if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) invalid(`${path}.${key}`, 'Reserved key');
        safeKeys(child, `${path}.${key}`);
    }
}

/** Compatibility belongs only at the import boundary; model validation stays strict. */
export function normalizeImport(value: unknown): ImportedConfig {
    safeKeys(value, 'config');
    const input = object(value, 'config');
    const defaults = createDefaultConfig();
    const notices: ImportNotice[] = [];
    const defaultRecord = object(defaults, 'defaults');
    if (!Object.keys(input).some(key => Object.hasOwn(defaultRecord, key))) invalid('config', 'Unrecognized configuration');
    for (const key of Object.keys(input)) if (!Object.hasOwn(defaultRecord, key)) invalid(`config.${key}`, 'Unknown field');
    const missingSections = Object.keys(defaults).filter(key => !Object.hasOwn(input, key));
    function fill(source: Record<string, unknown>, fallback: object, path: string): Record<string, unknown> {
        const next = { ...source };
        for (const [key, child] of Object.entries(fallback)) if (!Object.hasOwn(next, key)) {
            next[key] = structuredClone(child);
            notices.push({ path: `${path}.${key}`, kind: 'default' });
        }
        return next;
    }
    const next = fill(input, defaults, 'config');
    const numeric = (v: unknown, path: string): unknown => {
        if (typeof v !== 'string') return v;
        if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(v.trim()) || !Number.isFinite(Number(v))) invalid(path, 'Expected a finite number');
        const result = Number(v);
        notices.push({ path, kind: 'number', before: v, after: result });
        return result;
    };
    const array = (v: unknown, path: string): unknown => Array.isArray(v) ? v.map((n, i) => numeric(n, `${path}[${i}]`)) : v;
    const map = (v: unknown, path: string, convert: (child: unknown, path: string) => unknown): Record<string, unknown> =>
        Object.fromEntries(Object.entries(object(v, path)).map(([key, child]) => [key, convert(child, `${path}.${key}`)]));

    next.WeaponSettings = map(next.WeaponSettings, 'WeaponSettings', (roles, p) => map(roles, p, (items, q) => map(items, q, array)));
    for (const key of ['ArmorSettings', 'PistolSettings']) next[key] = map(next[key], key, (items, p) => map(items, p, array));
    const ammo = object(next.AmmoSettings, 'AmmoSettings');
    let legacy = missingSections.length > 0 || !Object.hasOwn(ammo, 'DMR');
    next.AmmoSettings = map(fill(ammo, defaults.AmmoSettings, 'AmmoSettings'), 'AmmoSettings', array);
    let helmets = object(next.HelmetsSettings, 'HelmetsSettings');
    if (Object.hasOwn(helmets, 'Generic_settings')) {
        if (Object.keys(helmets).length !== 1) invalid('HelmetsSettings', 'Ambiguous legacy wrapper');
        helmets = object(helmets.Generic_settings, 'HelmetsSettings.Generic_settings');
        notices.push({ path: 'HelmetsSettings', kind: 'legacy' });
    }
    next.HelmetsSettings = map(helmets, 'HelmetsSettings', (h, path) => {
        if (Array.isArray(h)) return array(h, path);
        const old = object(h, path);
        if (Object.keys(old).some(k => k !== 'drop' && k !== 'spawn') || old.drop !== true) invalid(path, 'Unsupported legacy helmet (expected drop: true and spawn)');
        const spawn = object(old.spawn, `${path}.spawn`);
        if (Object.keys(spawn).some(k => !RANKS.some(r => r === k))) invalid(path, 'Unknown legacy rank');
        legacy = true;
        notices.push({ path, kind: 'legacy' });
        const id = path.slice('HelmetsSettings.'.length);
        return RANKS.map((rank, index) => {
            if (!Object.hasOwn(spawn, rank)) {
                const fallback = defaults.HelmetsSettings[id]?.[index];
                if (fallback === undefined) invalid(`${path}.${rank}`, 'Missing rank without default');
                notices.push({ path: `${path}.${rank}`, kind: 'default' });
                return fallback;
            }
            const n = numeric(spawn[rank], `${path}.${rank}`);
            if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 1) invalid(`${path}.${rank}`, 'Expected legacy probability 0–1');
            return n * 100;
        });
    });
    for (const key of ['WeaponList', 'ArmorSpawnSettings'] as const) {
        const catalog = object(next[key], key);
        next[key] = legacy ? fill(catalog, defaults[key], key) : catalog;
    }
    next.WeaponList = map(next.WeaponList, 'WeaponList', (attrs, path) => map(attrs, path, numeric));
    next.ArmorSpawnSettings = map(next.ArmorSpawnSettings, 'ArmorSpawnSettings', (attrs, path) => {
        const a = object(attrs, path);
        const id = path.slice('ArmorSpawnSettings.'.length);
        if (!Object.hasOwn(a, 'drop') && defaults.ArmorSpawnSettings[id]) {
            a.drop = defaults.ArmorSpawnSettings[id].drop;
            notices.push({ path: `${path}.drop`, kind: 'default' });
        }
        if (Object.hasOwn(a, 'helmetSpawn')) a.helmetSpawn = numeric(a.helmetSpawn, `${path}.helmetSpawn`);
        return a;
    });
    for (const key of ['DropConfigs', 'Compatibility'] as const) {
        const a = fill(object(next[key], key), defaults[key], key);
        next[key] = key === 'DropConfigs' ? Object.fromEntries(Object.entries(a).map(([k, v]) => [k, k === 'createDroppableArmor' ? v : numeric(v, `${key}.${k}`)])) : a;
    }
    const grenades = fill(object(next.GrenadeSettings, 'GrenadeSettings'), defaults.GrenadeSettings, 'GrenadeSettings');
    grenades.Default = map(grenades.Default, 'GrenadeSettings.Default', (attrs, path) => {
        const id = path.slice('GrenadeSettings.Default.'.length);
        return map(fill(object(attrs, path), defaults.GrenadeSettings.Default[id] ?? {}, path), path, array);
    });
    next.GrenadeSettings = grenades;
    for (const key of ['PistolSpawnChance', 'MinWeaponDurability', 'MaxWeaponDurability']) next[key] = numeric(next[key], key);

    // Validate all individual values before repairing relations: no clamping invalid units.
    const config = validateConfigShape(next, 'config');
    function max(min: number, value: number, path: string): number {
        if (min <= value) return value;
        notices.push({ path, kind: 'range', before: value, after: min });
        return min;
    }
    config.MaxWeaponDurability = max(config.MinWeaponDurability, config.MaxWeaponDurability, 'MaxWeaponDurability');
    config.DropConfigs.nMaxDurability = max(config.DropConfigs.nMinDurability, config.DropConfigs.nMaxDurability, 'DropConfigs.nMaxDurability');
    for (const [key, pair] of Object.entries(config.AmmoSettings)) pair[1] = max(pair[0], pair[1], `AmmoSettings.${key}[1]`);
    for (const [id, attrs] of Object.entries(config.GrenadeSettings.Default)) for (const i of [0, 1, 2, 3] as const) {
        attrs.maxAmmo[i] = max(attrs.minAmmo[i], attrs.maxAmmo[i], `GrenadeSettings.Default.${id}.maxAmmo[${i}]`);
    }
    for (const [id, attrs] of Object.entries(config.WeaponList)) {
        const effective = effectiveWeapon(config, id);
        if (effective.minAmmo > effective.maxAmmo) attrs.maxAmmo = max(effective.minAmmo, effective.maxAmmo, `WeaponList.${id}.maxAmmo`);
        if (effective.minCondition > effective.maxCondition) attrs.maxCondition = max(effective.minCondition, effective.maxCondition, `WeaponList.${id}.maxCondition`);
    }
    return { config: validateConfig(config), notices };
}

export function serverConfig(response: unknown): unknown {
    return object(response, 'preset').data;
}

export function importSummary(notices: readonly ImportNotice[]): string {
    if (!notices.length) return 'Configuration loaded.';
    const counts = (kind: ImportNotice['kind']) => notices.filter(n => n.kind === kind).length;
    const repairs = notices.filter(n => n.kind === 'range').map(n => `${n.path}: ${String(n.before)} → ${String(n.after)}`);
    return `Configuration loaded. Numeric conversions: ${counts('number')}; defaults: ${counts('default')}; legacy structures: ${counts('legacy')}; range repairs: ${counts('range')}. ${repairs.join('; ')}`;
}
