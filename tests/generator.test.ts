import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLoadout } from '../src/generator/loadout.ts';
import { createLoadout } from '../src/js/textGenerators.ts';
import { AppState } from '../src/js/state.ts';
import { createDefaultConfig, createEditorState } from '../src/model/config.ts';
import { validateConfig } from '../src/model/validation.ts';
import { editedConfig, fixture, fixtureText } from './fixtures.ts';

function blocks(cfg: string, sid: string): string[] {
    const matches = Array.from(cfg.matchAll(new RegExp(`ItemPrototypeSID = ${sid}\\r?\\n[\\s\\S]*?struct.end`, 'g')), m => m[0]);
    assert.ok(matches.length, `${sid} must be emitted`);
    return matches;
}

test('defaults JSON and CFG preserve the historical output and AppState entry', async () => {
    const state = new AppState();
    assert.deepEqual(state.exportState(), await fixture('defaults'));
    const cfg = generateLoadout(state.config);
    assert.equal(cfg.replace(/\r\n/g, '\n'), await fixtureText('defaults.cfg'));
    assert.equal(await createLoadout(state), cfg);
    assert.doesNotMatch(cfg, /undefined|NaN/);
    for (const rank of ['Newbie', 'Experienced', 'Veteran', 'Master']) assert.ok(cfg.includes(`ERank::${rank}`));
});

test('historical invalid changed fixture is rejected; a valid repair changes only reviewed F07 fields', async () => {
    const historical = await fixture('changed');
    assert.throws(() => validateConfig(historical), /GunObrez_SG.ammo/);
    // Repair only the conflicting lower ammo bound, without rewriting the evidence.
    assert.ok(historical && typeof historical === 'object' && 'WeaponList' in historical);
    const list = historical.WeaponList;
    assert.ok(list && typeof list === 'object' && 'GunObrez_SG' in list);
    const weapon = list.GunObrez_SG;
    assert.ok(weapon && typeof weapon === 'object');
    Object.assign(weapon, { minAmmo: 0 });
    const cfg = generateLoadout(validateConfig(historical)).replace(/\r\n/g, '\n');
    const expected = (await fixtureText('changed.cfg')).replace(
        /ItemPrototypeSID = (?:Guard)?GunObrez_SG\n[\s\S]*?struct.end/g,
        block => block.replace('MinDurability = 0.2', 'MinDurability = 0.67')
            .replace('AmmoMinCount = 2', 'AmmoMinCount = 0').replace('AmmoMaxCount = 7', 'AmmoMaxCount = 0'),
    );
    assert.equal(cfg, expected);
});

test('primary and Guard weapons use positive, absent and zero overrides', () => {
    const config = createDefaultConfig();
    config.MinWeaponDurability = 20;
    config.MaxWeaponDurability = 80;
    config.AmmoSettings.SG = [2, 7];
    config.WeaponList.GunObrez_SG = {};
    for (const block of blocks(generateLoadout(config), 'GunObrez_SG')) {
        assert.match(block, /MinDurability = 0.2\n/);
        assert.match(block, /MaxDurability = 0.8\n/);
        assert.match(block, /AmmoMinCount = 2\n/);
        assert.match(block, /AmmoMaxCount = 7\n/);
    }
    config.WeaponList.GunObrez_SG = { minCondition: 67, maxCondition: 90, minAmmo: 3, maxAmmo: 5 };
    for (const sid of ['GunObrez_SG', 'GuardGunObrez_SG']) for (const block of blocks(generateLoadout(config), sid)) {
        assert.match(block, /MinDurability = 0.67\n/);
        assert.match(block, /MaxDurability = 0.9\n/);
        assert.match(block, /AmmoMinCount = 3\n/);
        assert.match(block, /AmmoMaxCount = 5\n/);
    }
    config.WeaponList.GunObrez_SG = { minCondition: 0, maxCondition: 0, minAmmo: 0, maxAmmo: 0 };
    for (const block of blocks(generateLoadout(config), 'GunObrez_SG')) {
        for (const field of ['MinDurability', 'MaxDurability', 'AmmoMinCount', 'AmmoMaxCount']) assert.ok(block.includes(`${field} = 0\n`));
    }
});

test('pistols share primary weapon inheritance, individual ammo and zero semantics', () => {
    const config = createDefaultConfig();
    config.MinWeaponDurability = 20;
    config.MaxWeaponDurability = 80;
    config.AmmoSettings.HG = [2, 9];
    for (const [overrides, expected] of [
        [{}, [0.2, 0.8, 2, 9]],
        [{ minCondition: 40, maxCondition: 70, minAmmo: 3, maxAmmo: 5 }, [0.4, 0.7, 3, 5]],
        [{ minCondition: 0, maxCondition: 0, minAmmo: 0, maxAmmo: 0 }, [0, 0, 0, 0]],
    ] as const) {
        config.WeaponList.GunPM_HG = overrides;
        for (const block of blocks(generateLoadout(config), 'GunPM_HG')) {
            ['MinDurability', 'MaxDurability', 'AmmoMinCount', 'AmmoMaxCount'].forEach((field, i) => assert.ok(block.includes(`${field} = ${expected[i]}\n`)));
        }
    }
});

test('A → B → A and concurrent compatibility calls keep config and base snapshots unchanged', async () => {
    const a = new AppState();
    const b = new AppState();
    b.importState(editedConfig());
    const beforeA = structuredClone(a.config);
    const beforeB = structuredClone(b.config);
    const baseA = structuredClone(a.baseConfig);
    // Deeply frozen input is supported as well (runtime trust boundary still validates).
    const frozen = createEditorState().baseConfig;
    assert.equal(generateLoadout(frozen), generateLoadout(a.config));
    const [first, middle, last] = await Promise.all([createLoadout(a), createLoadout(b), createLoadout(a)]);
    assert.notEqual(first, middle);
    assert.equal(first, last);
    assert.deepEqual(a.config, beforeA);
    assert.deepEqual(b.config, beforeB);
    assert.deepEqual(a.baseConfig, baseA);
});

test('generation rejects invalid legacy config instead of emitting a corrupt file', () => {
    const config = createDefaultConfig();
    config.WeaponList.GunObrez_SG = { minAmmo: 8, maxAmmo: 0 };
    assert.throws(() => generateLoadout(config), /GunObrez_SG.ammo/);
    config.WeaponList.GunObrez_SG = { minAmmo: NaN };
    assert.throws(() => generateLoadout(config), /finite number/);
});

test('partial configuration cannot produce empty loadouts or unresolved generated kit references', () => {
    const empty = createDefaultConfig();
    empty.WeaponSettings = {};
    assert.throws(() => generateLoadout(empty), /No NPC loadouts/);
    const missingKit = createDefaultConfig();
    delete missingKit.PistolSettings.GeneralNPC_Neutral;
    assert.throws(() => generateLoadout(missingKit), /Missing armor or pistol settings/);
    const missingSecondary = createDefaultConfig();
    delete missingSecondary.WeaponList.GunRpg7_GL;
    for (const classes of Object.values(missingSecondary.WeaponSettings)) {
        for (const items of Object.values(classes)) delete items.GunRpg7_GL;
    }
    assert.throws(() => generateLoadout(missingSecondary), /GunRpg7_GL: Unknown item/);
});
