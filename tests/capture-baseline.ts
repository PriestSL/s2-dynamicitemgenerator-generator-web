// Explicit, review-only capture. Never called by npm test.
import { mkdir, writeFile } from 'node:fs/promises';
import { AppState } from '../src/js/state.ts';
import { createLoadout } from '../src/js/textGenerators.ts';

if (!process.argv.includes('--write')) {
    throw new Error('Pass --write only when intentionally reviewing a new historical baseline.');
}
// Historical stage-0 fixtures remain evidence. Review candidates separately.
const directory = new URL('./fixtures/candidates/', import.meta.url);
await mkdir(directory, { recursive: true });
const initial = new AppState();
const changed = new AppState();
const neutral = changed.modifiedWeaponSettings.GeneralNPC_Neutral?.CloseCombat;
if (!neutral) throw new Error('Missing Neutral CloseCombat defaults');
neutral.GunObrez_SG = [200, 80, 40, 10];
changed.modifiedWeaponList.GunObrez_SG = { minAmmo: 0, maxAmmo: 0, minCondition: 67, maxCondition: 90 };
changed.modifiedAmmoByWeaponClass.SG = [2, 7];
changed.modifiedPistolSpawnChance = 35;
changed.modifiedMinWeaponDurability = 20;
changed.modifiedMaxWeaponDurability = 80;
changed.modifiedArmorSettings.GeneralNPC_Neutral = { ...changed.modifiedArmorSettings.GeneralNPC_Neutral, Jemmy_Neutral_Armor: [10, 20, 30, 40] };
changed.modifiedHelmetSpawnSettings.Light_Neutral_Helmet = [10, 25, 50, 100];
changed.modifiedPistolSettings.GeneralNPC_Neutral = { ...changed.modifiedPistolSettings.GeneralNPC_Neutral, GunPM_HG: [10, 20, 30, 40] };
const grenade = changed.modifiedGrenadeSettings.Default.GrenadeF1;
if (!grenade) throw new Error('Missing GrenadeF1 defaults');
grenade.chances = [10, 20, 30, 40];

for (const [name, state] of [['defaults', initial], ['changed', changed]] as const) {
    await writeFile(new URL(`${name}.json`, directory), JSON.stringify(state.exportState(), null, 2) + '\n');
    await writeFile(new URL(`${name}.cfg`, directory), await createLoadout(state));
}
