import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';
import { AppState } from '../src/js/state.ts';
import { createDefaultConfig } from '../src/model/config.ts';
import { normalizeImport, importSummary } from '../src/model/importing.ts';
import { compareConfig, resetConfig, resetPaths, sameValue, valueAt, viewPaths } from '../src/model/comparison.ts';
import type { ConfigPath } from '../src/model/comparison.ts';
import { validateConfig } from '../src/model/validation.ts';
import { generateLoadout } from '../src/generator/loadout.ts';
import { CFG_PATH, packZip } from '../src/files/zip.ts';
import { importJSONText } from '../src/files/json.ts';
import { controlPath } from '../src/ui/comparison.ts';

for (const [name, numericCount, repairs] of [['BNPL_Rei_2_0.json', 1232, 2], ['My new loadout.json', 950, 0], ['Vonamorio_BNPL.json', 1211, 0]] as const) {
    test(`legacy ${name}: real import, unchanged source, independent base, JSON and CFG/ZIP round-trip`, async () => {
        const text = await readFile(new URL(`./fixtures/legacy/${name}`, import.meta.url), 'utf8');
        const input: unknown = JSON.parse(text);
        const { config, notices } = normalizeImport(input);
        assert.equal(notices.filter(n => n.kind === 'number').length, numericCount);
        assert.equal(notices.filter(n => n.kind === 'range').length, repairs);
        assert.deepEqual(input, JSON.parse(text));
        assert.deepEqual(normalizeImport(config), { config, notices: [] });
        const state = new AppState();
        state.view.faction = 'Bandit';
        let renders = 0;
        const summary = importJSONText(state, text, () => renders++, name);
        assert.equal(renders, 1);
        assert.match(summary, /Configuration loaded/);
        assert.equal(state.document.name, name);
        assert.equal(state.view.faction, 'Bandit');
        assert.deepEqual(state.baseConfig, config);
        assert.deepEqual(state.config, config);
        assert.notEqual(state.baseConfig.WeaponList, state.config.WeaponList);
        assert.ok(Object.isFrozen(state.baseConfig.WeaponList));
        assert.equal(state.changes.length, 0);
        const server = new AppState();
        server.importPreset({ _id: 'test', data: input }, { name, serverId: 'test', version: '2' });
        assert.deepEqual(server.config, state.config);
        assert.equal(server.document.version, '2');
        assert.equal(server.document.source, 'server');
        assert.deepEqual(normalizeImport(JSON.parse(JSON.stringify(state.exportState()))).config, config);
        assert.equal(Object.keys(state.exportState()).length, 13);
        const cfg = generateLoadout(config);
        assert.doesNotMatch(cfg, /NaN|undefined/);
        const zip = await JSZip.loadAsync(await (await packZip(cfg)).arrayBuffer());
        assert.equal(await zip.file(CFG_PATH)?.async('string'), cfg);
        if (name === 'BNPL_Rei_2_0.json') {
            assert.equal(config.WeaponList.GunObrez_SG?.maxAmmo, 7);
            assert.equal(config.WeaponList.GunTOZ_SG?.maxAmmo, 7);
            assert.deepEqual(config.AmmoSettings.SG, [7, 25]);
            assert.match(importSummary(notices), /GunTOZ_SG.maxAmmo: 4 → 7/);
        }
        if (name === 'My new loadout.json') {
            assert.deepEqual(config.HelmetsSettings.Light_Military_Helmet, [70, 70, 70, 70]);
            assert.deepEqual(config.HelmetsSettings.Light_Bandit_Helmet, [0, 70, 70, 70]);
            assert.deepEqual(config.PistolSettings, createDefaultConfig().PistolSettings);
            assert.deepEqual(config.AmmoSettings.DMR, createDefaultConfig().AmmoSettings.DMR);
            assert.equal(Object.keys(config.WeaponList).length, 38);
        }
    });
}

test('import repairs each range after inheritance and leaves strict model validation intact', () => {
    const input = createDefaultConfig();
    input.MinWeaponDurability = 90;
    input.MaxWeaponDurability = 20;
    input.DropConfigs.nMinDurability = 0.9;
    input.DropConfigs.nMaxDurability = 0.1;
    input.AmmoSettings.HG = [10, 2];
    input.WeaponList.GunPM_HG = { maxAmmo: 0, maxCondition: 0 };
    input.GrenadeSettings.Default.GrenadeF1!.minAmmo[2] = 6;
    input.GrenadeSettings.Default.GrenadeF1!.maxAmmo[2] = 2;
    assert.throws(() => validateConfig(input), /Minimum/);
    const { config } = normalizeImport(input);
    assert.equal(config.MaxWeaponDurability, 90);
    assert.equal(config.DropConfigs.nMaxDurability, 0.9);
    assert.deepEqual(config.AmmoSettings.HG, [10, 10]);
    assert.deepEqual(config.WeaponList.GunPM_HG, { maxAmmo: 10, maxCondition: 90 });
    assert.equal(config.GrenadeSettings.Default.GrenadeF1?.maxAmmo[2], 6);
    const invalidUnit = { ...input, MinWeaponDurability: 101 };
    assert.throws(() => normalizeImport(invalidUnit), /Maximum/);
    assert.equal(input.MaxWeaponDurability, 20);
});

test('defaults fill fixed missing keys without reviving removed list members, empty lists, zero, false or absent overrides', () => {
    const d = createDefaultConfig();
    const source: Record<string, unknown> = { ...d };
    delete source.PistolSpawnChance;
    source.Compatibility = {};
    source.AmmoSettings = { HG: [0, 0] };
    source.DropConfigs = { createDroppableArmor: false, nLootChance: 0 };
    d.WeaponSettings.GeneralNPC_Neutral!.CloseCombat = {};
    d.WeaponList.GunObrez_SG = {};
    delete d.ArmorSettings.GeneralNPC_Neutral!.Jemmy_Neutral_Armor;
    const { config } = normalizeImport(source);
    assert.deepEqual(config.WeaponSettings.GeneralNPC_Neutral?.CloseCombat, {});
    assert.equal(Object.hasOwn(config.ArmorSettings.GeneralNPC_Neutral!, 'Jemmy_Neutral_Armor'), false);
    assert.deepEqual(config.WeaponList.GunObrez_SG, {});
    assert.equal(config.DropConfigs.nLootChance, 0);
    assert.equal(config.DropConfigs.createDroppableArmor, false);
    assert.deepEqual(config.AmmoSettings.HG, [0, 0]);
    assert.equal(config.Compatibility.SHA, false);
    assert.equal(config.PistolSpawnChance, createDefaultConfig().PistolSpawnChance);
    const state = new AppState();
    state.edit({ kind: 'global', field: 'PistolSpawnChance', value: 99 });
    state.importState(source);
    assert.deepEqual(state.config, config);
});

test('helmet migration is structural: modern fractional percentages stay unchanged and historical wrapper unwraps once', () => {
    const c = createDefaultConfig();
    c.HelmetsSettings.Light_Neutral_Helmet = [0, 0.7, 1, 0];
    const result = normalizeImport({ ...c, HelmetsSettings: { Generic_settings: c.HelmetsSettings } });
    assert.deepEqual(result.config.HelmetsSettings, c.HelmetsSettings);
    assert.throws(() => validateConfig({ ...c, HelmetsSettings: { Generic_settings: c.HelmetsSettings } }), /four rank/);
    const legacy = { ...c, HelmetsSettings: { ...c.HelmetsSettings, Light_Neutral_Helmet: { drop: true, spawn: { Newbie: '0.7', Master: 0 } } } };
    assert.deepEqual(normalizeImport(legacy).config.HelmetsSettings.Light_Neutral_Helmet, [70, 70, 70, 0]);
    assert.throws(() => normalizeImport({ ...c, HelmetsSettings: { H: { drop: false, spawn: { Newbie: 1 } } } }), /Unsupported/);
    assert.throws(() => normalizeImport({ ...c, HelmetsSettings: { H: { drop: true, spawn: { Newbie: 70 } } } }), /probability/);
});

test('invalid imports preserve all editor state and never render or coerce unsafe scalar values', () => {
    const state = new AppState();
    state.importState(createDefaultConfig(), { name: 'Selected', source: 'json' });
    state.edit({ kind: 'global', field: 'PistolSpawnChance', value: 42 });
    const before = { config: state.config, base: state.baseConfig, document: state.document, view: state.view };
    const invalid: unknown[] = [null, [], {}, { message: 'server failure' },
        ...['', ' ', '12x', 'Infinity', '0x20', true, null, -1, 101].map(v => ({ ...createDefaultConfig(), PistolSpawnChance: v })),
        { ...createDefaultConfig(), HelmetsSettings: { H: [1, 2, 3, 4, 5] } },
        { ...createDefaultConfig(), WeaponList: JSON.parse('{"__proto__":{}}') },
        { ...createDefaultConfig(), HelmetsSettings: { Generic_settings: {}, H: [0, 0, 0, 0] } },
    ];
    for (const input of invalid) {
        let renders = 0;
        assert.throws(() => importJSONText(state, JSON.stringify(input), () => renders++));
        assert.equal(renders, 0);
        assert.equal(state.config, before.config);
        assert.equal(state.baseConfig, before.base);
        assert.equal(state.document, before.document);
        assert.equal(state.view, before.view);
    }
    assert.throws(() => state.importPreset({ error: 'not found' }, { name: 'Broken' }));
    assert.equal(state.config, before.config);
});

test('comparison ignores property order but distinguishes rank order, absent overrides and added/removed structure', () => {
    const a = createDefaultConfig();
    const b = createDefaultConfig();
    b.WeaponList = Object.fromEntries(Object.entries(b.WeaponList).reverse());
    assert.deepEqual(compareConfig(a, b), []);
    b.WeaponList.GunObrez_SG!.minAmmo = 0;
    assert.equal(compareConfig(a, b)[0]?.kind, 'added');
    delete b.WeaponSettings.GeneralNPC_Neutral!.CloseCombat!.GunObrez_SG;
    b.WeaponSettings.GeneralNPC_Neutral!.CloseCombat!.GunPM_HG = [0, 0, 0, 0];
    const changes = compareConfig(a, b);
    assert.ok(changes.some(c => c.kind === 'removed' && c.path.at(-1) === 'GunObrez_SG'));
    assert.ok(changes.some(c => c.kind === 'added' && c.path.at(-1) === 'GunPM_HG'));
    assert.equal(sameValue([1, 2, 3, 4], [2, 1, 3, 4]), false);
});

test('delete, re-add, reset and brand-new reset stay within the current faction/class/list', () => {
    const state = new AppState();
    const base = state.baseConfig;
    const list = { kind: 'list', list: 'weapon', faction: 'Neutral', role: 'CloseCombat' } as const;
    const path: ConfigPath = ['WeaponSettings', 'GeneralNPC_Neutral', 'CloseCombat', 'GunObrez_SG'];
    state.edit({ ...list, item: 'GunObrez_SG', operation: 'remove' });
    assert.equal(valueAt(state.config, path), undefined);
    state.edit({ ...list, item: 'GunObrez_SG', operation: 'add' });
    assert.deepEqual(valueAt(state.config, path), [0, 0, 0, 0]);
    state.reset([path]);
    assert.deepEqual(state.config, base);
    state.edit({ ...list, item: 'GunPM_HG', operation: 'add' });
    assert.ok(state.changes.some(c => c.kind === 'added'));
    // A per-rank reset on a new item removes the item, never leaves a hole in its tuple.
    state.reset([['WeaponSettings', 'GeneralNPC_Neutral', 'CloseCombat', 'GunPM_HG', '0']]);
    assert.deepEqual(state.config, base);
    state.edit({ ...list, item: 'GunPM_HG', operation: 'add' });
    state.reset([['WeaponSettings', 'GeneralNPC_Neutral', 'CloseCombat', 'GunPM_HG']]);
    assert.deepEqual(state.config, base);
    state.edit({ kind: 'weight', list: 'weapon', faction: 'Bandit', role: 'CloseCombat', item: 'GunObrez_SG', index: '0', value: 321 });
    state.edit({ ...list, item: 'GunObrez_SG', operation: 'remove' });
    state.reset([['WeaponSettings', 'GeneralNPC_Neutral', 'CloseCombat']]);
    assert.equal(state.config.WeaponSettings.GeneralNPC_Bandit?.CloseCombat?.GunObrez_SG?.[0], 321);
    assert.equal(state.baseConfig, base);
    state.reset();
    assert.deepEqual(state.config, base);
    assert.notEqual(state.config.WeaponSettings, base.WeaponSettings);
});

test('all field range resets restore pairs, exact override absence and only the selected grenade rank', () => {
    const base = createDefaultConfig();
    const current = createDefaultConfig();
    current.MinWeaponDurability = 40; current.MaxWeaponDurability = 60;
    current.DropConfigs.nMinDurability = 0.5; current.DropConfigs.nMaxDurability = 0.6;
    current.AmmoSettings.SG = [0, 99];
    current.WeaponList.GunObrez_SG = { minAmmo: 20, maxAmmo: 30, minCondition: 45, maxCondition: 55 };
    current.GrenadeSettings.Default.GrenadeF1!.minAmmo = [2, 2, 2, 2];
    current.GrenadeSettings.Default.GrenadeF1!.maxAmmo = [3, 3, 3, 3];
    let reset = resetConfig(current, base, [['WeaponList', 'GunObrez_SG', 'maxAmmo']]);
    assert.equal(Object.hasOwn(reset.WeaponList.GunObrez_SG!, 'minAmmo'), false);
    assert.equal(reset.WeaponList.GunObrez_SG?.maxAmmo, 4);
    reset = resetConfig(reset, base, [['WeaponList', 'GunObrez_SG', 'maxCondition']]);
    assert.equal(Object.hasOwn(reset.WeaponList.GunObrez_SG!, 'minCondition'), false);
    assert.equal(Object.hasOwn(reset.WeaponList.GunObrez_SG!, 'maxCondition'), false);
    for (const path of [['MaxWeaponDurability'], ['DropConfigs', 'nMaxDurability'], ['AmmoSettings', 'SG', '1']] as const) reset = resetConfig(reset, base, [path]);
    assert.equal(reset.MinWeaponDurability, base.MinWeaponDurability);
    assert.equal(reset.DropConfigs.nMinDurability, base.DropConfigs.nMinDurability);
    assert.deepEqual(reset.AmmoSettings.SG, base.AmmoSettings.SG);
    reset = resetConfig(reset, base, [['GrenadeSettings', 'Default', 'GrenadeF1', 'maxAmmo', '2']]);
    assert.equal(reset.GrenadeSettings.Default.GrenadeF1?.minAmmo[2], base.GrenadeSettings.Default.GrenadeF1?.minAmmo[2]);
    assert.equal(reset.GrenadeSettings.Default.GrenadeF1?.maxAmmo[2], base.GrenadeSettings.Default.GrenadeF1?.maxAmmo[2]);
    assert.equal(reset.GrenadeSettings.Default.GrenadeF1?.minAmmo[1], 2);
    assert.equal(current.WeaponList.GunObrez_SG?.minAmmo, 20);
});

test('reset validation is atomic when inherited values outside its scope conflict with base overrides', () => {
    const state = new AppState();
    const input = createDefaultConfig();
    input.AmmoSettings.SG = [7, 25];
    state.importState(input); // imports repair both low shotgun overrides to 7
    const current = state.config;
    assert.throws(() => resetConfig(current, createDefaultConfig(), [['WeaponList', 'GunObrez_SG']]), /Minimum/);
    assert.equal(state.config, current);
    assert.deepEqual(current.AmmoSettings.SG, [7, 25]);
    assert.throws(() => state.reset([['WeaponList', '__proto__', 'maxAmmo']]), /Reserved|Invalid/);
});

test('UI field mapping and category scopes use local lists, paired controls and global properties explicitly', () => {
    assert.deepEqual(controlPath({ id: '', dataset: { type: 'Primary', faction: 'Neutral', classification: 'Recon', item: 'GunViper_PP', level: '2' } }), ['WeaponSettings', 'GeneralNPC_Neutral', 'Recon', 'GunViper_PP', '2']);
    assert.deepEqual(controlPath({ id: '', dataset: { type: 'Grenades', item: 'GrenadeF1', attr: 'minAmmo', level: '1' } }), ['GrenadeSettings', 'Default', 'GrenadeF1', 'minAmmo', '1']);
    assert.deepEqual(controlPath({ id: 'min_condition', dataset: {} }), ['DropConfigs', 'nMinDurability']);
    assert.deepEqual(resetPaths(['AmmoSettings', 'SG', '0']), [['AmmoSettings', 'SG']]);
    assert.deepEqual(viewPaths({ faction: 'Bandit', category: 'Primary' }), [['WeaponSettings', 'GeneralNPC_Bandit']]);
    assert.deepEqual(viewPaths({ faction: 'Generic_settings', category: 'Pistols' }), [['PistolSpawnChance']]);
});
