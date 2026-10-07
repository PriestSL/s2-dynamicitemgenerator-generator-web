import test from 'node:test';
import assert from 'node:assert/strict';
import { createLoadout } from '../src/js/textGenerators.js';
import { editor } from './helpers.mjs';

function weaponBlock(cfg) {
    const block = cfg.match(/ItemPrototypeSID = GunObrez_SG\r?\n[\s\S]*?struct.end/);
    assert.ok(block, 'GunObrez_SG must be emitted');
    return block[0];
}

test('KNOWN F07: positive minCondition is ignored', async () => {
    const { state } = editor();
    const before = await createLoadout(state);
    state.modifiedWeaponList.GunObrez_SG.minCondition = 67;
    assert.equal(await createLoadout(state), before);
});

test('KNOWN F07: numeric zero falls back; positive/absent overrides act differently', async () => {
    const { state } = editor();
    const weapon = state.modifiedWeaponList.GunObrez_SG;
    state.modifiedAmmoByWeaponClass.SG = [2, 7];
    delete weapon.maxAmmo;
    assert.match(weaponBlock(await createLoadout(state)), /AmmoMaxCount = 7\b/);
    weapon.maxAmmo = 0;
    assert.match(weaponBlock(await createLoadout(state)), /AmmoMaxCount = 7\b/);
    weapon.maxAmmo = 3;
    assert.match(weaponBlock(await createLoadout(state)), /AmmoMaxCount = 3\b/);
    weapon.maxCondition = 0;
    state.modifiedMaxWeaponDurability = 80;
    assert.match(weaponBlock(await createLoadout(state)), /MaxDurability = 0.8\b/);
});
