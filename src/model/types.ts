export const RANKS = ['Newbie', 'Experienced', 'Veteran', 'Master'] as const;
export type Rank = typeof RANKS[number];
export type RankIndex = 0 | 1 | 2 | 3;
export type RankValues = [number, number, number, number];

export const FACTIONS = [
    'Neutral', 'Bandit', 'Mercenaries', 'Scientists', 'Militaries', 'Monolith',
    'Duty', 'Freedom', 'Varta', 'Noon', 'Spark', 'Corpus',
] as const;
export type FactionId = typeof FACTIONS[number];
export type FactionScope = FactionId | 'Generic_settings';
export type NpcFactionId = `${'GeneralNPC' | 'GuardNPC'}_${FactionId}`;
export const NPC_CLASSES = ['CloseCombat', 'Recon', 'Sniper', 'Stormtrooper', 'Heavy'] as const;
export type NpcClassId = typeof NPC_CLASSES[number];
export type FactionClassId = `${NpcFactionId}_${NpcClassId}`;

export const CATEGORIES = [
    'Primary', 'Secondary', 'Pistols', 'Helmets', 'Armor',
    'Artifacts', 'Consumables', 'Ammo', 'Grenades',
] as const;
export type CategoryId = typeof CATEGORIES[number];
export interface ViewState {
    faction: FactionScope;
    category: CategoryId;
}

// SID lists remain extensible. Existence of references requires runtime validation.
export type ItemId = string;
export type ItemWeights = Record<ItemId, RankValues>;
export type WeaponSettings = Partial<Record<NpcFactionId, Partial<Record<NpcClassId, ItemWeights>>>>;
export type ArmorSettings = Partial<Record<NpcFactionId, ItemWeights>>;
export type PistolSettings = Partial<Record<NpcFactionId, ItemWeights>>;
export type HelmetSettings = Record<ItemId, RankValues>;

// Counts: nonnegative integers. Conditions: percentages 0–100.
// Omitted property inherits the default; explicit 0 is an override.
export interface WeaponOverrides {
    minAmmo?: number;
    maxAmmo?: number;
    minCondition?: number;
    maxCondition?: number;
}
export type WeaponList = Record<ItemId, WeaponOverrides>;

export interface ArmorSpawnSettings {
    drop: boolean;
    dropItem?: ItemId;
    helmet?: ItemId;
    // Legacy defaults contain true. Preserve it until a reviewed runtime migration.
    // Numeric values are percentages; boolean is NOT a new model convention.
    helmetSpawn?: number | boolean;
}
export type ArmorList = Record<ItemId, ArmorSpawnSettings>;
export interface DropSettings {
    createDroppableArmor: boolean;
    nMinDurability: number; // probability-scale durability, 0–1
    nMaxDurability: number; // 0–1; min <= max
    nLootChance: number; // probability, 0–1
}
export interface GrenadeSettings {
    chances: RankValues; // percentages, 0–100, not relative weights
    minAmmo: RankValues; // nonnegative integers
    maxAmmo: RankValues; // nonnegative integers; min <= max at each rank
}
export type GrenadeLoadoutSettings = { Default: Record<ItemId, GrenadeSettings> };
export const WEAPON_CLASSES = ['SG', 'PP', 'ST', 'SP', 'HG', 'MG', 'GL', 'DMR'] as const;
export type WeaponClassId = typeof WEAPON_CLASSES[number];
export type AmmoRange = [min: number, max: number];
export type AmmoSettings = Record<WeaponClassId, AmmoRange>;

// Keep the existing full JSON field names and their nesting.
// These types describe data; they do not validate JSON.parse or legacy JS writes.
export interface LoadoutConfig {
    WeaponSettings: WeaponSettings;
    ArmorSettings: ArmorSettings;
    GrenadeSettings: GrenadeLoadoutSettings;
    AmmoSettings: AmmoSettings;
    WeaponList: WeaponList;
    DropConfigs: DropSettings;
    Compatibility: { SHA: boolean };
    ArmorSpawnSettings: ArmorList;
    HelmetsSettings: HelmetSettings;
    PistolSettings: PistolSettings;
    PistolSpawnChance: number; // percentage, 0–100
    MinWeaponDurability: number; // percentage, 0–100
    MaxWeaponDurability: number; // percentage, 0–100; min <= max
}

export type DeepReadonly<T> = T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export interface EditorState {
    readonly baseConfig: DeepReadonly<LoadoutConfig>;
    config: LoadoutConfig;
    view: ViewState;
    readonly document: Readonly<DocumentMetadata>;
}

export interface DocumentMetadata {
    name: string;
    source: 'defaults' | 'json' | 'server';
    serverId?: string;
    version?: string;
}

export type ValidationResult<T> =
    | { ok: true; value: T }
    | { ok: false; path: string; error: string };
