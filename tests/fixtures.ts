import { readFile } from 'node:fs/promises';
import { createDefaultConfig } from '../src/model/config.ts';

export const fixtureText = async (name: string): Promise<string> =>
    (await readFile(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
export const fixture = async (name: string): Promise<unknown> => JSON.parse(await fixtureText(`${name}.json`));

export function editedConfig() {
    const config = createDefaultConfig();
    config.PistolSpawnChance = 35;
    config.MinWeaponDurability = 20;
    config.MaxWeaponDurability = 80;
    config.WeaponList.GunObrez_SG = { minAmmo: 0, maxAmmo: 0, minCondition: 67, maxCondition: 90 };
    config.AmmoSettings.SG = [2, 7];
    config.HelmetsSettings.Light_Neutral_Helmet = [10, 25, 50, 100];
    return config;
}
