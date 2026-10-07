// Explicit, review-only capture. Never called by npm test.
import { mkdir, writeFile } from 'node:fs/promises';
import { AppState } from '../src/js/state.ts';
import { createLoadout } from '../src/js/textGenerators.js';

if (!process.argv.includes('--write')) {
    throw new Error('Pass --write only when intentionally reviewing a new historical baseline.');
}
const directory = new URL('./fixtures/', import.meta.url);
await mkdir(directory, { recursive: true });
const initial = new AppState();
const changed = new AppState();
changed.modifiedWeaponSettings.GeneralNPC_Neutral.CloseCombat.GunObrez_SG = [200, 80, 40, 10];
changed.modifiedWeaponList.GunObrez_SG.minCondition = 67;
changed.modifiedWeaponList.GunObrez_SG.maxCondition = 90;
changed.modifiedWeaponList.GunObrez_SG.maxAmmo = 0;
changed.modifiedAmmoByWeaponClass.SG = [2, 7];
changed.modifiedPistolSpawnChance = 35;
changed.modifiedMinWeaponDurability = 20;
changed.modifiedMaxWeaponDurability = 80;
changed.modifiedArmorSettings.GeneralNPC_Neutral.Jemmy_Neutral_Armor = [10, 20, 30, 40];
changed.modifiedHelmetSpawnSettings.Light_Neutral_Helmet = [10, 25, 50, 100];
changed.modifiedPistolSettings.GeneralNPC_Neutral.GunPM_HG = [10, 20, 30, 40];
changed.modifiedGrenadeSettings.Default.GrenadeF1.chances = [10, 20, 30, 40];

for (const [name, state] of [['defaults', initial], ['changed', changed]]) {
    await writeFile(new URL(`${name}.json`, directory), JSON.stringify(state.exportState(), null, 2) + '\n');
    await writeFile(new URL(`${name}.cfg`, directory), await createLoadout(state));
}
