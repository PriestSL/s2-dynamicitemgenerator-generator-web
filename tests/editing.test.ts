import test from 'node:test';
import assert from 'node:assert/strict';
import { AppState } from '../src/js/state.ts';
import { createDefaultConfig } from '../src/model/config.ts';
import { editConfig, factionScope, categoryId, itemWeights, parseInput, relativePercent } from '../src/model/editing.ts';
import type { EditCommand } from '../src/model/editing.ts';
import { parseConfig, serializeConfig, validateConfig } from '../src/model/validation.ts';
import { importJSONText } from '../src/files/json.ts';
import { editedConfig, fixture } from './fixtures.ts';
import { MAX_ITEM_WEIGHT } from '../src/model/values.ts';

test('all relative-weight lists accept thousands up to the shared maximum, including JSON import', () => {
    const state = new AppState();
    assert.equal(MAX_ITEM_WEIGHT, 10_000);
    for (const [list, item] of [['pistol', 'GunPM_HG'], ['armor', 'Jemmy_Neutral_Armor'], ['weapon', 'GunObrez_SG']] as const) {
        const command = { kind: 'weight', list, faction: 'Neutral', role: 'CloseCombat', item, index: '0' } as const;
        for (const value of [200, 1000, MAX_ITEM_WEIGHT]) {
            state.edit({ ...command, value: String(value) });
            state.importState(parseConfig(serializeConfig(state.config)));
            assert.equal(itemWeights(state.config, list, 'Neutral', 'CloseCombat')[item]?.[0], value);
        }
        const before = state.config;
        assert.throws(() => state.edit({ ...command, value: MAX_ITEM_WEIGHT + 1 }), /Maximum is 10000/);
        assert.equal(state.config, before);
        const invalid = state.exportState();
        itemWeights(invalid, list, 'Neutral', 'CloseCombat')[item] = [MAX_ITEM_WEIGHT + 1, 0, 0, 0];
        assert.throws(() => state.importState(invalid), /Maximum is 10000/);
        assert.equal(state.config, before);
    }
});

test('full JSON defaults and edited config round-trip without helmets wrapping or shared objects', async () => {
    assert.deepEqual(validateConfig(await fixture('defaults')), createDefaultConfig());
    for (const original of [createDefaultConfig(), editedConfig()]) {
        const state = new AppState();
        const base = state.baseConfig;
        let renders = 0;
        importJSONText(state, serializeConfig(original), () => renders++);
        assert.deepEqual(state.exportState(), original);
        assert.notEqual(state.config, original);
        assert.equal(state.baseConfig, base); // replacement of base is stage 4
        assert.equal(renders, 1);
        assert.deepEqual(state.config.HelmetsSettings, original.HelmetsSettings);
        const exported = state.exportState();
        exported.PistolSpawnChance = 99;
        assert.equal(state.config.PistolSpawnChance, original.PistolSpawnChance);
    }
});

const badJSON: [string, (c: Record<string, unknown>) => void, RegExp][] = [
    ['missing section', c => { delete c.PistolSettings; }, /PistolSettings/],
    ['unknown field', c => { c.typo = 0; }, /typo/],
    ['wrong type', c => { c.Compatibility = { SHA: 'false' }; }, /boolean/],
    ['rank length', c => { c.HelmetsSettings = { Helmet: [1, 2, 3] }; }, /four rank/],
    ['string number', c => { c.PistolSpawnChance = '30'; }, /finite number/],
    ['percentage', c => { c.PistolSpawnChance = 101; }, /Maximum/],
    ['negative', c => { c.MinWeaponDurability = -1; }, /nonnegative/],
    ['range', c => { c.MinWeaponDurability = 90; c.MaxWeaponDurability = 20; }, /Minimum/],
    ['fractional ammo', c => { c.AmmoSettings = { ...createDefaultConfig().AmmoSettings, SG: [0, 1.2] }; }, /integer/],
    ['missing ammo class', c => { c.AmmoSettings = {}; }, /AmmoSettings.SG/],
    ['item reference', c => { c.PistolSettings = { GeneralNPC_Neutral: { Missing_HG: [1, 2, 3, 4] } }; }, /Unknown item/],
    ['wrong pistol class', c => { c.PistolSettings = { GeneralNPC_Neutral: { GunObrez_SG: [1, 2, 3, 4] } }; }, /pistol/],
    ['faction', c => { c.ArmorSettings = { GeneralNPC_Unknown: {} }; }, /Unknown identifier/],
    ['role', c => { c.WeaponSettings = { GeneralNPC_Neutral: { Unknown: {} } }; }, /Unknown identifier/],
    ['old guessed helmet wrapper', c => { c.HelmetsSettings = { Generic_settings: createDefaultConfig().HelmetsSettings }; }, /four rank/],
    ['inherited ammo range', c => { c.WeaponList = { GunPM_HG: { maxAmmo: 0 } }; }, /Minimum/],
    ['drop probability', c => { c.DropConfigs = { ...createDefaultConfig().DropConfigs, nLootChance: 10 }; }, /Maximum is 1/],
    ['armor reference', c => { c.ArmorSpawnSettings = { ...createDefaultConfig().ArmorSpawnSettings, Jemmy_Neutral_Armor: { drop: false, helmet: 'Missing' } }; }, /Unknown item/],
];
for (const [name, corrupt, expected] of badJSON) {
    test(`invalid JSON is atomic: ${name}`, () => {
        const state = new AppState();
        state.edit({ kind: 'global', field: 'PistolSpawnChance', value: '42' });
        const before = state.config;
        const base = state.baseConfig;
        const data: Record<string, unknown> = { ...state.exportState() };
        corrupt(data);
        let renders = 0;
        assert.throws(() => importJSONText(state, JSON.stringify(data), () => renders++), expected);
        assert.equal(state.config, before);
        assert.equal(state.baseConfig, base);
        assert.equal(renders, 0);
    });
}
test('syntax errors, nonfinite numbers, reserved keys and historical invalid fixture are rejected', async () => {
    assert.throws(() => parseConfig('{'));
    for (const value of [null, [], false]) assert.throws(() => validateConfig(value));
    assert.throws(() => validateConfig({ ...createDefaultConfig(), PistolSpawnChance: Infinity }), /finite/);
    const config = createDefaultConfig();
    config.WeaponList = JSON.parse('{"__proto__":{}}');
    assert.throws(() => validateConfig(config), /Reserved/);
    const awaitValue = await fixture('changed');
    assert.throws(() => validateConfig(awaitValue), /Minimum/);
});

test('all editable categories store numbers, survive navigation, import and a subsequent edit', () => {
    const state = new AppState();
    const commands: EditCommand[] = [
        { kind: 'weight', list: 'weapon', faction: 'Neutral', role: 'CloseCombat', item: 'GunObrez_SG', index: '0', value: '200' },
        { kind: 'weight', list: 'pistol', faction: 'Neutral', item: 'GunPM_HG', index: '1', value: '51' },
        { kind: 'weight', list: 'armor', faction: 'Neutral', item: 'Jemmy_Neutral_Armor', index: '2', value: '13' },
        { kind: 'rank', section: 'helmet', item: 'Light_Neutral_Helmet', index: '3', value: '25' },
        { kind: 'rank', section: 'ammo', item: 'SG', index: '1', value: '8' },
        { kind: 'rank', section: 'grenade', item: 'GrenadeF1', attribute: 'chances', index: '0', value: '25' },
        { kind: 'attribute', list: 'armor', item: 'Jemmy_Neutral_Armor', attribute: 'drop', value: false },
    ];
    for (const command of commands) state.edit(command);
    state.view.faction = factionScope('Bandit');
    state.view.category = categoryId('Ammo');
    const exported = state.exportState();
    state.importState(JSON.parse(serializeConfig(exported)));
    assert.deepEqual(state.config, exported);
    state.edit({ kind: 'weight', list: 'pistol', faction: 'Neutral', item: 'GunPM_HG', index: '1', value: '52' });
    assert.equal(state.config.PistolSettings.GeneralNPC_Neutral?.GunPM_HG?.[1], 52);
    assert.equal(state.config.WeaponSettings.GeneralNPC_Neutral?.CloseCombat?.GunObrez_SG?.[0], 200);
    assert.equal(state.config.ArmorSpawnSettings.Jemmy_Neutral_Armor?.drop, false);
    assert.equal(state.config.HelmetsSettings.Light_Neutral_Helmet?.[3], 25);
    assert.equal(state.config.GrenadeSettings.Default.GrenadeF1?.chances[0], 25);
    assert.equal(state.config.AmmoSettings.SG[1], 8);
});

test('add/remove pistol, armor and primary items validates references and avoids duplicate resets', () => {
    const state = new AppState();
    for (const [list, item] of [['pistol', 'GunPM_HG'], ['armor', 'Jemmy_Neutral_Armor'], ['weapon', 'GunObrez_SG']] as const) {
        const action = { kind: 'list', list, faction: 'Neutral', role: 'CloseCombat', item } as const;
        state.edit({ ...action, operation: 'remove' });
        assert.equal(Object.hasOwn(itemWeights(state.config, list, 'Neutral', 'CloseCombat'), item), false);
        state.edit({ ...action, operation: 'add' });
        state.edit({ kind: 'weight', list, faction: 'Neutral', role: 'CloseCombat', item, index: '0', value: '7' });
        state.edit({ ...action, operation: 'add' });
        assert.deepEqual(itemWeights(state.config, list, 'Neutral', 'CloseCombat')[item], [7, 0, 0, 0]);
        assert.throws(() => state.edit({ ...action, item: 'Missing', operation: 'add' }), /Unknown item/);
    }
});

test('invalid edits never commit; clearing an override removes it and zero remains numeric', () => {
    const state = new AppState();
    const base = state.baseConfig;
    for (const value of ['', '-1', 'NaN', 'Infinity', '12x', true]) {
        const before = state.config;
        assert.throws(() => state.edit({ kind: 'weight', list: 'pistol', faction: 'Neutral', item: 'GunPM_HG', index: '0', value }));
        assert.equal(state.config, before);
    }
    const attr = { kind: 'attribute', list: 'weapon', item: 'GunObrez_SG', attribute: 'maxAmmo' } as const;
    state.edit({ ...attr, value: '0' });
    assert.equal(state.config.WeaponList.GunObrez_SG?.maxAmmo, 0);
    state.edit({ ...attr, value: '' });
    assert.equal(Object.hasOwn(state.config.WeaponList.GunObrez_SG!, 'maxAmmo'), false);
    assert.throws(() => state.edit({ ...attr, attribute: 'minAmmo', value: '8' }), /Minimum/);
    assert.throws(() => state.edit({ ...attr, value: '0.5' }), /integer/);
    assert.throws(() => state.edit({ kind: 'rank', section: 'helmet', item: 'Light_Neutral_Helmet', index: '0', value: '200' }), /Maximum/);
    assert.throws(() => state.edit({ kind: 'attribute', list: 'armor', item: 'Jemmy_Neutral_Armor', attribute: 'helmet', value: 'Missing' }), /Unknown item/);
    assert.throws(() => state.edit({ kind: 'attribute', list: 'armor', item: 'Jemmy_Neutral_Armor', attribute: 'drop', value: 'on' }), /checkbox/);
    state.edit({ kind: 'drop', field: 'nLootChance', value: '0.25' });
    assert.equal(state.config.DropConfigs.nLootChance, 0.25);
    assert.throws(() => state.edit({ kind: 'drop', field: 'nMinDurability', value: '0.9' }), /Minimum/);
    assert.equal(state.baseConfig, base);
});

test('independent edit result and finite shares for zero or relative weights', () => {
    const config = createDefaultConfig();
    const result = editConfig(config, { kind: 'global', field: 'PistolSpawnChance', value: '0' });
    assert.equal(result.PistolSpawnChance, 0);
    assert.equal(config.PistolSpawnChance, 30);
    assert.equal(relativePercent({ a: [0, 0, 0, 0] }, 'a', 0), 0);
    assert.equal(relativePercent({}, 'missing', 0), 0);
    assert.equal(relativePercent({ a: [200, 0, 0, 0], b: [600, 0, 0, 0] }, 'a', 0), 25);
    assert.equal(parseInput('1e2'), 100);
    assert.throws(() => factionScope('Unknown'));
    assert.throws(() => categoryId('Unknown'));
});

test('legacy facade getters and setters stay live for PresetsManager and generator consumers', () => {
    const state = new AppState();
    const data = editedConfig();
    state.modifiedWeaponList = data.WeaponList;
    state.modifiedArmorSpawnSettings = data.ArmorSpawnSettings;
    assert.equal(state.typeToTable.weapon, data.WeaponList);
    assert.equal(state.typeToTable.armor, data.ArmorSpawnSettings);
    assert.equal(state.getChancesSettings().pistol, state.config.PistolSettings);
    state.importState(createDefaultConfig());
    assert.equal(state.typeToTable.weapon, state.config.WeaponList);
    assert.notEqual(state.typeToTable.weapon, data.WeaponList);
    assert.ok(Object.keys(state.typeToTable.pistol).every(key => key.endsWith('_HG')));
    state.resetState();
    assert.deepEqual(state.exportState(), createDefaultConfig());
});
