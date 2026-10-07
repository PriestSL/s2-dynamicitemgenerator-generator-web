import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultConfig, createEditorState } from '../src/model/config.ts';
import { RANKS, FACTIONS, CATEGORIES, NPC_CLASSES } from '../src/model/types.ts';
import { resolveOverride, validateRange, validateValue } from '../src/model/values.ts';
import * as defaults from '../src/model/defaults.ts';
import { AppState } from '../src/js/state.ts';
import { fixture, editedConfig } from './fixtures.ts';

function objectsIn(value: unknown, objects = new Set<object>()) {
    if (value !== null && typeof value === 'object' && !objects.has(value)) {
        objects.add(value);
        for (const child of Object.values(value)) objectsIn(child, objects);
    }
    return objects;
}

test('typed defaults preserve every full JSON field', async () => {
    assert.deepEqual(createDefaultConfig(), await fixture('defaults'));
});

test('base, working config, supplied config, another editor and defaults share no nested objects', () => {
    const input = createDefaultConfig();
    const first = createEditorState(input);
    const second = createEditorState();
    const roots = [input, first.config, first.baseConfig, second.config, second.baseConfig, defaults];
    const sets = roots.map(root => objectsIn(root));
    for (let i = 0; i < sets.length; i++) {
        for (let j = i + 1; j < sets.length; j++) {
            for (const object of sets[i]!) assert.equal(sets[j]!.has(object), false);
        }
    }
    first.config.WeaponSettings.GeneralNPC_Neutral!.CloseCombat!.GunObrez_SG![0] = 321;
    first.config.WeaponList.GunObrez_SG!.maxAmmo = 0;
    assert.equal(first.baseConfig.WeaponSettings.GeneralNPC_Neutral!.CloseCombat!.GunObrez_SG![0], 90);
    assert.equal(input.WeaponList.GunObrez_SG!.maxAmmo, 4);
    assert.equal(second.config.WeaponList.GunObrez_SG!.maxAmmo, 4);
});

test('base snapshot is deeply frozen; config and view remain separately editable', () => {
    const state = createEditorState();
    for (const object of objectsIn(state.baseConfig)) assert.ok(Object.isFrozen(object));
    assert.equal(Reflect.set(state.baseConfig.WeaponList.GunObrez_SG!, 'maxAmmo', 0), false);
    state.config.WeaponList.GunObrez_SG!.maxAmmo = 0;
    state.view.category = 'Pistols';
    state.view.faction = 'Neutral';
    assert.equal(state.config.WeaponList.GunObrez_SG!.maxAmmo, 0);
    assert.equal(state.baseConfig.WeaponList.GunObrez_SG!.maxAmmo, 4);
    assert.deepEqual(createEditorState().view, { faction: 'Generic_settings', category: 'Primary' });
    assert.equal('view' in state.config, false);
});

test('AppState facade forwards legacy writes, replacements and export to one config', async () => {
    const state = new AppState();
    const base = structuredClone(state.baseConfig);
    state.modifiedWeaponList.GunObrez_SG!.maxAmmo = 0;
    assert.equal(state.config.WeaponList.GunObrez_SG!.maxAmmo, 0);
    state.modifiedPistolSpawnChance = 0;
    assert.equal(state.config.PistolSpawnChance, 0);
    state.config.MinWeaponDurability = 10;
    assert.equal(state.modifiedMinWeaponDurability, 10);
    const imported = editedConfig();
    state.importState(imported);
    assert.deepEqual(state.config, imported);
    assert.deepEqual(state.exportState(), imported);
    assert.equal(state.typeToTable.weapon, state.config.WeaponList);
    assert.equal(state.typeToTable.armor, state.config.ArmorSpawnSettings);
    assert.deepEqual(state.baseConfig, base);
    state.resetState();
    assert.deepEqual(state.exportState(), await fixture('defaults'));
    state.modifiedPistolSpawnChance = 17;
    assert.equal(state.config.PistolSpawnChance, 17);
    assert.equal(state.baseConfig.PistolSpawnChance, 30);
});

test('typed catalogs retain current faction/class/category/rank identifiers', () => {
    assert.deepEqual(RANKS, ['Newbie', 'Experienced', 'Veteran', 'Master']);
    assert.ok(CATEGORIES.includes('Secondary')); // listed does not mean implemented
    for (const [key, roles] of Object.entries(defaults.oWeaponLoadoutSettings)) {
        assert.ok(FACTIONS.some(f => f === key.replace(/^(GeneralNPC|GuardNPC)_/, '')));
        for (const role of Object.keys(roles)) assert.ok(NPC_CLASSES.some(r => r === role));
    }
});

test('model units distinguish relative weights, percentages, probabilities and counts', () => {
    assert.deepEqual(validateValue(200, 'weight'), { ok: true, value: 200 });
    assert.equal(validateValue(200, 'percentage').ok, false);
    assert.equal(validateValue(100, 'percentage').ok, true);
    assert.equal(validateValue(0.1, 'probability').ok, true);
    assert.equal(validateValue(1.1, 'probability').ok, false);
    assert.equal(validateValue(1.5, 'count').ok, false);
    assert.equal(validateValue(0, 'count').ok, true);
    for (const invalid of [-1, NaN, Infinity, -Infinity, '', '0', null, undefined, true]) {
        assert.equal(validateValue(invalid, 'weight').ok, false);
    }
});

test('range rule rejects min > max and preserves explicit zero overrides', () => {
    assert.deepEqual(validateRange(0, 0, 'count'), { ok: true, value: [0, 0] });
    assert.equal(validateRange(8, 7, 'count', 'AmmoSettings.SG').ok, false);
    assert.equal(validateRange(0, 101, 'percentage').ok, false);
    assert.equal(resolveOverride(undefined, 7), 7);
    assert.equal(resolveOverride(0, 7), 0);
    assert.equal(resolveOverride(3, 7), 3);
    assert.equal(validateRange(resolveOverride(8, 2), resolveOverride(undefined, 7), 'count').ok, false);
});
