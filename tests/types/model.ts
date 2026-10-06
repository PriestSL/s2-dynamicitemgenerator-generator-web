// Compile-only contract checks. Each expect-error must correspond to a real error;
// TypeScript fails if a contract is accidentally widened and the error disappears.
import { createEditorState } from '../../src/model/config.ts';
import type { CategoryId, FactionClassId, LoadoutConfig, RankIndex, RankValues, WeaponOverrides } from '../../src/model/types.ts';

function accept<T>(value: T): void { void value; }
accept<RankValues>([0, 1, 2, 3]);
accept<RankIndex>(3);
accept<CategoryId>('Pistols');
accept<FactionClassId>('GuardNPC_Monolith_Stormtrooper');
accept<WeaponOverrides>({ maxAmmo: 0 });
accept<WeaponOverrides>({});

// @ts-expect-error Exactly four ranks are required.
accept<RankValues>([0, 1, 2]);
// @ts-expect-error Rank 4 does not exist (zero-based index).
accept<RankIndex>(4);
// @ts-expect-error Values read from input must be parsed before model writes.
accept<RankValues>(['0', 1, 2, 3]);
// @ts-expect-error Unknown category is not a navigation identifier.
accept<CategoryId>('Weapons');
// @ts-expect-error A faction/class identifier must use catalog identifiers.
accept<FactionClassId>('GeneralNPC_Unknown_Stormtrooper');
// @ts-expect-error Empty input must remove an override, never store a string.
accept<WeaponOverrides>({ maxAmmo: '' });
// @ts-expect-error Absent optional property and explicit undefined are distinct.
accept<WeaponOverrides>({ maxAmmo: undefined });
// @ts-expect-error A full JSON contract cannot omit required sections.
accept<LoadoutConfig>({ WeaponSettings: {} });

const editor = createEditorState();
// @ts-expect-error Base snapshot fields are readonly.
editor.baseConfig.PistolSpawnChance = 0;
// @ts-expect-error Base snapshot nested tuples are readonly too.
editor.baseConfig.AmmoSettings.SG[0] = 9;
// @ts-expect-error Dynamic SID lookup must handle a missing item.
editor.config.WeaponList['unknown'].maxAmmo = 0;

declare const untrustedJSON: unknown;
// @ts-expect-error Unknown JSON must be validated before entering the typed model.
createEditorState(untrustedJSON);
