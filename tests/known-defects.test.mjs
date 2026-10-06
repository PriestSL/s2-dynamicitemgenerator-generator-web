// Characterization of observed bugs. Passing means reproduced, NOT fixed.
// On a planned fix, replace the corresponding assertion with the desired behavior.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventManager } from '../src/js/events/eventManager.js';
import { createLoadout } from '../src/js/textGenerators.js';
import { validateGameConfig, validateNumber, validateWeaponChances } from '../src/js/utils/validation.js';
import { editor, fixture, installDOM } from './helpers.mjs';

for (const type of ['weapon', 'armor']) {
    test(`KNOWN F01: rendered ${type} attribute dataset throws on change`, t => {
        const { controller } = editor();
        const { document, elements } = installDOM(t);
        const source = controller.typeToTable[type];
        const item = Object.keys(source)[0];
        const before = structuredClone(source[item]);
        controller.fillAttributesTable({ [item]: source[item] }, document.createElement('div'), type);
        const fields = elements.filter(el => el.dataset.to_item === item);
        assert.ok(fields.length > 0);
        for (const field of fields) {
            field.value = field.type === 'checkbox' ? 'on' : '8';
            field.checked = false;
            assert.throws(() => controller.onAttributeChange({ target: field }), TypeError);
        }
        assert.deepEqual(source[item], before);
    });
}

test('KNOWN F01: even with corrected dataset, checkbox stores value instead of checked', () => {
    const { state, controller } = editor();
    const item = Object.keys(state.modifiedArmorSpawnSettings)[0];
    controller.onAttributeChange({ target: { dataset: { type: 'armor', item, attr: 'drop' }, value: 'on', checked: false } });
    assert.equal(state.modifiedArmorSpawnSettings[item].drop, 'on');
});

test('KNOWN F02: initialized pistol editor cannot edit or add an item', () => {
    const { state, controller } = editor();
    const before = structuredClone(state.modifiedPistolSettings);
    assert.equal(controller.settings.pistol, undefined);
    assert.throws(() => controller.onPistolChanceChange({ target: { value: '12', dataset: { faction: 'Neutral', item: 'GunPM_HG', level: '0' } } }), TypeError);
    assert.throws(() => controller.addPistol(null, 'GunPM_HG'), TypeError);
    assert.deepEqual(state.modifiedPistolSettings, before);
});

// Invoke the actual file-import handler; the file picker/reader and DOM are substitutes.
async function importJSON(t, state, data) {
    const { document, elements } = installDOM(t);
    const active = { id: 'Primary', textContent: '', getAttribute: () => null };
    document.querySelector = () => active;
    let renders = 0;
    const messages = [];
    const manager = new EventManager({ renderPrimary: () => renders++ }, { createMessageBox: (...args) => messages.push(args) }, null, state, null);
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'FileReader');
    Object.defineProperty(globalThis, 'FileReader', { configurable: true, value: class {
        readAsText(file) { this.onload({ target: { result: file } }); }
    } });
    t.after(() => {
        if (previous) Object.defineProperty(globalThis, 'FileReader', previous);
        else delete globalThis.FileReader;
    });
    manager.importFromJSON();
    elements.find(el => el.type === 'file').onchange({ target: { files: [JSON.stringify(data)] } });
    assert.equal(messages[0][0], 'configImportSuccess');
    return { renders };
}

test('KNOWN F03: file import reports success without refresh; subsequent edit mutates stale data', async t => {
    const { state, controller } = editor();
    const imported = await fixture('changed');
    const { renders } = await importJSON(t, state, imported);
    assert.equal(renders, 0);
    assert.notEqual(controller.settings.weapon, state.modifiedWeaponSettings);
    assert.notEqual(controller.lists.weapon, state.modifiedWeaponList);
    controller.onWeaponChanceChange({ target: { value: '123', dataset: { faction: 'Neutral', classification: 'CloseCombat', item: 'GunObrez_SG', level: '0' } } });
    assert.equal(controller.settings.weapon.GeneralNPC_Neutral.CloseCombat.GunObrez_SG[0], '123');
    assert.equal(state.exportState().WeaponSettings.GeneralNPC_Neutral.CloseCombat.GunObrez_SG[0], 200);
});

test('KNOWN F04: actual JSON importer wraps current helmets and removes all Head CFG entries', async t => {
    const { state } = editor();
    const data = JSON.parse(JSON.stringify(state.exportState()));
    const before = await createLoadout(state);
    assert.equal((before.match(/Category = EItemGenerationCategory::Head/g) || []).length, 66);
    await importJSON(t, state, data);
    assert.deepEqual(state.exportState().HelmetsSettings, { Generic_settings: data.HelmetsSettings });
    assert.doesNotMatch(await createLoadout(state), /Category = EItemGenerationCategory::Head/);
});

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

test('KNOWN F08: invalid rendered input is marked but still exported as a string', t => {
    const { state, controller } = editor();
    const { document, elements } = installDOM(t);
    controller.createChances('GunObrez_SG', document.createElement('div'), [90, 10, 0, 0], 'CloseCombat');
    const input = elements.find(el => el.tagName === 'input');
    input.value = '-5';
    input.dispatch('change');
    assert.ok(input.classList.contains('validation-error'));
    controller.onWeaponChanceChange({ target: input });
    const data = JSON.parse(JSON.stringify(state.exportState()));
    assert.equal(data.WeaponSettings.GeneralNPC_Neutral.CloseCombat.GunObrez_SG[0], '-5');
    assert.equal(validateGameConfig(data).isValid, true);
});

test('KNOWN F08: zero total weight produces NaN labels', t => {
    const { controller } = editor();
    const { labels } = installDOM(t);
    controller.updateLabels({ GunObrez_SG: [0, 0, 0, 0] }, 0);
    assert.equal([...labels.values()][0].textContent, '~NaN%');
});

test('KNOWN F09: helmet input accepts 200 as a percentage and generates probability 2', async t => {
    const { state, controller } = editor();
    const { document, elements } = installDOM(t);
    const helmet = 'Light_Neutral_Helmet';
    controller.createChances(helmet, document.createElement('div'), [50, 70, 70, 70]);
    const input = elements.find(el => el.tagName === 'input');
    input.value = '200';
    input.dispatch('change');
    assert.ok(input.classList.contains('validation-success'));
    controller.onHelmetChanceChange({ target: input });
    assert.match(await createLoadout(state), /ItemPrototypeSID = Light_Neutral_Helmet\r?\n\s+Chance = 2\b/);
});

test('KNOWN F09: unused weapon validator rejects legitimate relative weight 200', () => {
    assert.equal(validateNumber('200', 0, 1000).isValid, true);
    assert.equal(validateWeaponChances([200, 0, 0, 0]).isValid, false);
});
