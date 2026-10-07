import { CATEGORIES, FACTIONS, NPC_CLASSES } from './types.ts';
import type { CategoryId, FactionScope, ItemWeights, LoadoutConfig, NpcClassId, RankIndex } from './types.ts';
import { invalid, validateConfig } from './validation.ts';

export type ListKind = 'weapon' | 'armor' | 'pistol';
export type EditCommand =
    | { kind: 'weight'; list: ListKind; faction: string; role?: string; item: string; index: string; value: unknown }
    | { kind: 'list'; list: ListKind; faction: string; role?: string; item: string; operation: 'add' | 'remove' }
    | { kind: 'attribute'; list: string; item: string; attribute: string; value: unknown }
    | { kind: 'rank'; section: 'helmet' | 'grenade' | 'ammo'; item: string; attribute?: string; index: string; value: unknown }
    | { kind: 'global'; field: 'MinWeaponDurability' | 'MaxWeaponDurability' | 'PistolSpawnChance'; value: unknown }
    | { kind: 'drop'; field: string; value: unknown };

export function parseInput(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string' || value.trim() === '' || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) invalid('value', 'Enter a number');
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) invalid('value', 'Enter a finite number');
    return parsed;
}
export function factionScope(value: string): FactionScope {
    if (value === 'Generic_settings') return value;
    return FACTIONS.find(f => f === value) ?? invalid('faction', 'Unknown faction');
}
export function categoryId(value: string): CategoryId {
    return CATEGORIES.find(c => c === value) ?? invalid('category', 'Unknown category');
}
function rankIndex(value: string): RankIndex {
    switch (value) { case '0': return 0; case '1': return 1; case '2': return 2; case '3': return 3; default: return invalid('rank', 'Unknown rank'); }
}
function roleId(value: string | undefined): NpcClassId {
    return NPC_CLASSES.find(r => r === value) ?? invalid('role', 'Unknown NPC class');
}
export function itemWeights(config: LoadoutConfig, list: ListKind, faction: string, role?: string): ItemWeights {
    const scope = factionScope(faction);
    if (scope === 'Generic_settings') invalid('faction', 'Select a faction');
    const key = `GeneralNPC_${scope}` as const;
    const items = list === 'weapon' ? config.WeaponSettings[key]?.[roleId(role)]
        : list === 'armor' ? config.ArmorSettings[key] : config.PistolSettings[key];
    return items ?? invalid(key, 'Missing item list');
}

/** Candidate isolation keeps cross-field validation atomic, including inherited ranges. */
export function editConfig(config: LoadoutConfig, command: EditCommand): LoadoutConfig {
    const next = structuredClone(config);
    switch (command.kind) {
        case 'weight': {
            const values = itemWeights(next, command.list, command.faction, command.role)[command.item];
            if (!values) invalid(command.item, 'Unknown item');
            values[rankIndex(command.index)] = parseInput(command.value);
            break;
        }
        case 'list': {
            const items = itemWeights(next, command.list, command.faction, command.role);
            if (command.operation === 'remove') delete items[command.item];
            else if (!Object.hasOwn(items, command.item)) {
                const catalog = command.list === 'armor' ? next.ArmorSpawnSettings : next.WeaponList;
                if (!Object.hasOwn(catalog, command.item)) invalid(command.item, 'Unknown item');
                items[command.item] = [0, 0, 0, 0];
            }
            break;
        }
        case 'attribute': {
            if (command.list === 'weapon' || command.list === 'pistol') {
                const item = next.WeaponList[command.item];
                if (!item) invalid(command.item, 'Unknown weapon');
                const attr = command.attribute;
                if (attr !== 'minAmmo' && attr !== 'maxAmmo' && attr !== 'minCondition' && attr !== 'maxCondition') invalid(attr, 'Unknown weapon attribute');
                if (command.value === '') delete item[attr];
                else item[attr] = parseInput(command.value);
            } else if (command.list === 'armor') {
                const item = next.ArmorSpawnSettings[command.item];
                if (!item) invalid(command.item, 'Unknown armor');
                switch (command.attribute) {
                    case 'drop':
                        if (typeof command.value !== 'boolean') invalid('drop', 'Expected a checkbox value');
                        item.drop = command.value;
                        break;
                    case 'dropItem': case 'helmet':
                        if (typeof command.value !== 'string') invalid(command.attribute, 'Expected an item identifier');
                        if (command.value === '') delete item[command.attribute];
                        else item[command.attribute] = command.value;
                        break;
                    case 'helmetSpawn':
                        if (command.value === '') delete item.helmetSpawn;
                        else item.helmetSpawn = parseInput(command.value);
                        break;
                    default: invalid(command.attribute, 'Unknown armor attribute');
                }
            } else invalid(command.list, 'Unknown attribute list');
            break;
        }
        case 'rank': {
            const index = rankIndex(command.index);
            let values: number[] | undefined;
            if (command.section === 'helmet') values = next.HelmetsSettings[command.item];
            if (command.section === 'ammo') {
                const key = Object.keys(next.AmmoSettings).find(k => k === command.item);
                if (!key || index > 1) invalid(command.item, 'Unknown ammo field');
                values = Object.entries(next.AmmoSettings).find(([k]) => k === key)?.[1];
            }
            if (command.section === 'grenade') {
                const attr = command.attribute;
                if (attr !== 'chances' && attr !== 'minAmmo' && attr !== 'maxAmmo') invalid('grenade', 'Unknown attribute');
                values = next.GrenadeSettings.Default[command.item]?.[attr];
            }
            if (!values) invalid(command.item, 'Unknown item');
            values[index] = parseInput(command.value);
            break;
        }
        case 'global': next[command.field] = parseInput(command.value); break;
        case 'drop':
            if (command.field === 'createDroppableArmor') {
                if (typeof command.value !== 'boolean') invalid(command.field, 'Expected a checkbox value');
                next.DropConfigs.createDroppableArmor = command.value;
            } else if (command.field === 'nMinDurability' || command.field === 'nMaxDurability' || command.field === 'nLootChance') {
                next.DropConfigs[command.field] = parseInput(command.value);
            } else invalid(command.field, 'Unknown drop setting');
    }
    return validateConfig(next);
}

export function relativePercent(values: ItemWeights, item: string, rank: number): number {
    const total = Object.values(values).reduce((sum, row) => sum + (row[rank] ?? 0), 0);
    return total > 0 ? (values[item]?.[rank] ?? 0) / total * 100 : 0;
}
