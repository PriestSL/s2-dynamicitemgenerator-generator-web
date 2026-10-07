// The controller/renderer implementation remains JS until stage 5.
// This local contract covers its existing consumers without calling REST.
import test from 'node:test';
import assert from 'node:assert/strict';
import { AppState } from '../src/js/state.ts';
import { chancesController } from '../src/js/chances.js';
import { createDefaultConfig } from '../src/model/config.ts';
import * as defaults from '../src/model/defaults.ts';
import * as compatibilityDefaults from '../src/js/configs.js';

test('legacy defaults re-export remains identical for generator consumers', () => {
    assert.deepEqual(Object.keys(compatibilityDefaults), Object.keys(defaults));
    for (const key of Object.keys(defaults)) assert.equal(compatibilityDefaults[key], defaults[key]);
});

test('controller uses current state after import, reset and PresetsManager legacy assignments', () => {
    const state = new AppState();
    const controller = new chancesController(state);
    controller.currentFaction = 'Neutral';
    controller.currentCategory = 'Pistols';
    assert.deepEqual(state.view, { faction: 'Neutral', category: 'Pistols' });
    const oldCatalog = controller.typeToTable.weapon;
    state.importState(createDefaultConfig());
    assert.notEqual(controller.typeToTable.weapon, oldCatalog);
    assert.equal(controller.typeToTable.weapon, state.config.WeaponList);
    const preset = createDefaultConfig();
    preset.WeaponList.Custom_HG = {};
    state.modifiedWeaponList = preset.WeaponList;
    controller.fillSettings(state.getChancesSettings());
    assert.ok(Object.hasOwn(controller.typeToTable.pistol, 'Custom_HG'));
    controller.changeList('pistol', '', 'Custom_HG', 'add');
    assert.deepEqual(state.exportState().PistolSettings.GeneralNPC_Neutral.Custom_HG, [0, 0, 0, 0]);
    assert.equal('settings' in controller, false);
    assert.equal('lists' in controller, false);
    state.resetState();
    assert.equal(controller.currentFaction, 'Generic_settings');
    assert.equal(controller.currentCategory, 'Primary');
    assert.equal(Object.hasOwn(controller.typeToTable.pistol, 'Custom_HG'), false);
});
