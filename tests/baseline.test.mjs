import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { AppState } from '../src/js/state.js';
import { createLoadout } from '../src/js/textGenerators.js';
import { fixture, fixtureText, editor } from './helpers.mjs';

test('defaults JSON records the full current export contract', async () => {
    assert.deepEqual(new AppState().exportState(), await fixture('defaults'));
    assert.deepEqual(Object.keys(await fixture('defaults')).sort(), [
        'WeaponSettings', 'ArmorSettings', 'GrenadeSettings', 'AmmoSettings', 'WeaponList',
        'DropConfigs', 'Compatibility', 'ArmorSpawnSettings', 'HelmetsSettings', 'PistolSettings',
        'PistolSpawnChance', 'MinWeaponDurability', 'MaxWeaponDurability',
    ].sort());
});

for (const name of ['defaults', 'changed']) {
    test(`${name}: direct AppState JSON round-trip preserves all fields`, async () => {
        const data = await fixture(name);
        const { state } = editor(data);
        assert.deepEqual(JSON.parse(JSON.stringify(state.exportState())), data);
    });
    test(`${name}: historical CFG comparison (not a correctness oracle)`, async () => {
        const { state } = editor(await fixture(name));
        const cfg = await createLoadout(state);
        assert.equal(cfg.replace(/\r\n/g, '\n'), await fixtureText(`${name}.cfg`));
        assert.doesNotMatch(cfg, /undefined|NaN/);
        for (const rank of ['Newbie', 'Experienced', 'Veteran', 'Master']) assert.ok(cfg.includes(`ERank::${rank}`));
        assert.ok(cfg.includes('GeneralNPC_Neutral_CloseCombat_ItemGenerator'));
    });
}

test('generation A → B → A is repeatable and does not mutate either input', async () => {
    const a = editor(await fixture('defaults')).state;
    const b = editor(await fixture('changed')).state;
    const beforeA = structuredClone(a.exportState());
    const beforeB = structuredClone(b.exportState());
    const first = await createLoadout(a);
    assert.notEqual(await createLoadout(b), first);
    assert.equal(await createLoadout(a), first);
    assert.deepEqual(a.exportState(), beforeA);
    assert.deepEqual(b.exportState(), beforeB);
});

test('local JSZip round-trip preserves CFG at the documented game path', async () => {
    // Library-level check, not the generateConfig download handler or server PAK.
    const cfg = await createLoadout(editor(await fixture('changed')).state);
    const path = 'Stalker2/Content/GameLite/GameData/ItemGeneratorPrototypes/New_NPC_Loadouts.cfg';
    const zip = new JSZip();
    zip.file(path, cfg);
    const restored = await JSZip.loadAsync(await zip.generateAsync({ type: 'nodebuffer' }));
    assert.deepEqual(Object.values(restored.files).filter(f => !f.dir).map(f => f.name), [path]);
    assert.equal(await restored.file(path).async('string'), cfg);
});
