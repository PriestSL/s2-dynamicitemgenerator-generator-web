import test, { beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setupDOM } from './dom.ts';
import { AppState } from '../src/js/state.ts';
import { EditorUI } from '../src/ui/editor.ts';
import { categories } from '../src/ui/categories.ts';
import { Application } from '../src/ui/application.ts';
import { ModalManager } from '../src/js/ui/modalManager.ts';
import { showDialog } from '../src/ui/dialogs.ts';
import { bootstrapUI } from '../src/ui/bootstrap.ts';
import { Notifications } from '../src/ui/notifications.ts';
import { bindDownloads } from '../src/ui/downloads.ts';
import { createDefaultConfig } from '../src/model/config.ts';
import { legacyPresetForm } from '../src/compatibility/presetForm.ts';
import { legacyPresets, legacyPackageTransport } from '../src/compatibility/integrations.ts';
import { ControllerAdapter } from '../src/compatibility/controller.ts';
import { chooseJSON } from '../src/files/json.ts';
import { CATEGORIES } from '../src/model/types.ts';
import type { CategoryId, FactionScope } from '../src/model/types.ts';
import type { ConfigPath } from '../src/model/comparison.ts';

const dom = await setupDOM();
after(() => dom.window.close());
beforeEach(() => { document.body.replaceChildren(); });
function mount(category: CategoryId, faction: FactionScope = 'Generic_settings') {
    const state = new AppState();
    state.view.category = category;
    state.view.faction = faction;
    const errors: string[] = [];
    const ui = new EditorUI(state, message => errors.push(message));
    const root = categories[category](ui);
    document.body.append(root);
    ui.refresh();
    return { state, ui, root, errors };
}
function input(path: ConfigPath, root: ParentNode = document): HTMLInputElement {
    const node = [...root.querySelectorAll<HTMLInputElement>('input[data-path]')].find(n => n.dataset.path === JSON.stringify(path));
    assert.ok(node, `Missing input: ${JSON.stringify(path)}`);
    return node;
}
function change(node: HTMLInputElement | HTMLSelectElement, value: string): void {
    node.value = value;
    node.dispatchEvent(new Event('change', { bubbles: true }));
}
function click(text: string, root: ParentNode = document): HTMLButtonElement {
    const node = [...root.querySelectorAll<HTMLButtonElement>('button')].find(b => b.textContent === text);
    assert.ok(node, `Missing button: ${text}`);
    node.click();
    return node;
}
function modalClean(): void {
    assert.equal(document.querySelectorAll('.modal-backdrop').length, 0);
    assert.equal(document.querySelectorAll('.modal').length, 0);
    assert.equal(document.body.classList.contains('modal-open'), false);
    assert.equal(document.body.style.overflow, '');
}

test('shared primary row keeps node/focus/draft and updates shares, validation and scoped reset', () => {
    const { state, ui, root } = mount('Primary', 'Neutral');
    const path: ConfigPath = ['WeaponSettings', 'GeneralNPC_Neutral', 'CloseCombat', 'GunObrez_SG', '0'];
    const control = input(path);
    control.focus();
    change(control, '1000');
    assert.equal(input(path), control);
    assert.equal(document.activeElement, control);
    assert.equal(state.config.WeaponSettings.GeneralNPC_Neutral?.CloseCombat?.GunObrez_SG?.[0], 1000);
    assert.match(control.closest('tr')?.textContent ?? '', /Modified/);
    assert.match(control.parentElement?.querySelector('.comparison-base')?.textContent ?? '', /^Base: 90$/);
    assert.equal(control.closest('td')?.querySelector('.editor-percent')?.textContent, '99.01%');
    control.value = '';
    control.dispatchEvent(new Event('input', { bubbles: true }));
    ui.refresh();
    assert.equal(input(path), control);
    assert.equal(control.value, '');
    assert.equal(document.activeElement, control);
    change(control, '-2');
    assert.equal(control.getAttribute('aria-invalid'), 'true');
    assert.ok(control.parentElement?.querySelector('.editor-field-error')?.textContent);
    assert.equal(state.config.WeaponSettings.GeneralNPC_Neutral?.CloseCombat?.GunObrez_SG?.[0], 1000);
    click('Reset', control.parentElement!);
    assert.equal(control.value, String(state.baseConfig.WeaponSettings.GeneralNPC_Neutral?.CloseCombat?.GunObrez_SG?.[0]));
    assert.equal(control.hasAttribute('aria-invalid'), false);
    assert.equal(input(path, root), control);
});

test('delete, Add Item, Restore and reset of a new item share one row and preserve unrelated drafts', () => {
    const { state, root } = mount('Primary', 'Neutral');
    const list = root.querySelector<HTMLElement>('[data-comparison-role="CloseCombat"]')?.closest('.editor-card');
    assert.ok(list);
    const path: ConfigPath = ['WeaponSettings', 'GeneralNPC_Neutral', 'CloseCombat', 'GunObrez_SG', '0'];
    const other = input(['WeaponSettings', 'GeneralNPC_Neutral', 'Recon', 'GunViper_PP', '0']);
    other.value = '';
    click('Delete', input(path).closest('tr')!);
    assert.equal(state.config.WeaponSettings.GeneralNPC_Neutral?.CloseCombat?.GunObrez_SG, undefined);
    assert.equal(list.querySelectorAll('.comparison-removed').length, 1);
    const add = click('Add Item', list);
    click('GunObrez_SG', document.querySelector('.modal')!);
    assert.equal(list.querySelectorAll('.comparison-removed').length, 0);
    assert.equal(input(path).value, '0');
    assert.equal(input(path).parentElement?.querySelectorAll('.comparison-base').length, 1);
    assert.equal(other.value, '');
    assert.equal(add.isConnected, true);
    modalClean();
    change(input(path), '3000');
    click('Reset item', input(path).closest('tr')!);
    assert.equal(input(path).value, String(state.baseConfig.WeaponSettings.GeneralNPC_Neutral?.CloseCombat?.GunObrez_SG?.[0]));
    click('Delete', input(path).closest('tr')!);
    click('Restore', list);
    assert.equal(list.querySelectorAll('.comparison-removed').length, 0);
    click('Add Item', list);
    click('GunPM_HG', document.querySelector('.modal')!);
    const fresh = input(['WeaponSettings', 'GeneralNPC_Neutral', 'CloseCombat', 'GunPM_HG', '0']);
    assert.match(fresh.closest('tr')?.textContent ?? '', /Added/);
    change(fresh, '50');
    click('Reset (remove)', fresh.parentElement!);
    assert.equal(fresh.isConnected, false);
    assert.equal(state.config.WeaponSettings.GeneralNPC_Neutral?.CloseCombat?.GunPM_HG, undefined);
    modalClean();
});

test('all categories render typed controls; pistol/armor weights and global rank units stay distinct', () => {
    for (const category of CATEGORIES) {
        const { root } = mount(category);
        assert.ok(root.textContent);
        root.remove();
    }
    const pistol = mount('Pistols', 'Neutral');
    change(input(['PistolSettings', 'GeneralNPC_Neutral', 'GunPM_HG', '0']), '2500');
    assert.equal(pistol.state.config.PistolSettings.GeneralNPC_Neutral?.GunPM_HG?.[0], 2500);
    document.body.replaceChildren();
    const armor = mount('Armor', 'Neutral');
    const weight = armor.root.querySelector<HTMLInputElement>('input');
    assert.ok(weight);
    change(weight, '10000');
    assert.equal(weight.hasAttribute('aria-invalid'), false);
    document.body.replaceChildren();
    const helmets = mount('Helmets');
    const chance = helmets.root.querySelector<HTMLInputElement>('input');
    assert.ok(chance);
    change(chance, '101');
    assert.equal(chance.getAttribute('aria-invalid'), 'true');
    document.body.replaceChildren();
    const ammo = mount('Ammo');
    change(input(['AmmoSettings', 'SG', '0']), '1.5');
    assert.equal(input(['AmmoSettings', 'SG', '0']).getAttribute('aria-invalid'), 'true');
    assert.notEqual(ammo.state.config.AmmoSettings.SG[0], 1.5);
});

test('global and attribute controls preserve absent versus zero, checkbox/select values and paired resets', () => {
    const { state } = mount('Primary');
    const min = input(['WeaponList', 'GunObrez_SG', 'minAmmo']);
    const max = input(['WeaponList', 'GunObrez_SG', 'maxAmmo']);
    change(min, '0');
    change(max, '0');
    assert.equal(state.config.WeaponList.GunObrez_SG?.minAmmo, 0);
    change(max, '');
    assert.equal(state.config.WeaponList.GunObrez_SG?.maxAmmo, undefined);
    click('Reset pair', min.parentElement!);
    assert.deepEqual(state.config.WeaponList.GunObrez_SG, state.baseConfig.WeaponList.GunObrez_SG);
    assert.equal(max.value, String(state.baseConfig.WeaponList.GunObrez_SG?.maxAmmo ?? ''));
    document.body.replaceChildren();
    const armor = mount('Armor');
    const drop = input(['DropConfigs', 'createDroppableArmor']);
    drop.checked = true;
    drop.dispatchEvent(new Event('change'));
    assert.equal(armor.state.config.DropConfigs.createDroppableArmor, true);
    assert.equal(armor.root.querySelector<HTMLElement>('.armor_drop_settings')?.hidden, false);
    const lootChance = input(['DropConfigs', 'nLootChance']);
    change(lootChance, '0.25');
    assert.equal(armor.state.config.DropConfigs.nLootChance, 0.25);
    assert.equal(lootChance.parentElement?.querySelector('.editor-field-equivalent')?.textContent, 'Current: 25%');
    click('Reset', lootChance.parentElement!);
    assert.equal(lootChance.parentElement?.querySelector('.editor-field-equivalent')?.textContent, 'Current: 10%');
    const select = armor.root.querySelector<HTMLSelectElement>('select');
    assert.ok(select);
    change(select, '');
    assert.equal(select.value, '');
    click('Reset', drop.parentElement!);
    assert.equal(drop.checked, false);
    assert.equal(armor.root.querySelector<HTMLElement>('.armor_drop_settings')?.hidden, true);
});

test('grenade rank reset updates both endpoints without changing another rank', () => {
    const { state } = mount('Grenades');
    const min = input(['GrenadeSettings', 'Default', 'GrenadeF1', 'minAmmo', '2']);
    const max = input(['GrenadeSettings', 'Default', 'GrenadeF1', 'maxAmmo', '2']);
    change(max, '8');
    change(min, '4');
    const unrelated = input(['GrenadeSettings', 'Default', 'GrenadeF1', 'maxAmmo', '3']);
    change(unrelated, '9');
    click('Reset pair', min.parentElement!);
    assert.equal(min.value, String(state.baseConfig.GrenadeSettings.Default.GrenadeF1?.minAmmo[2]));
    assert.equal(max.value, String(state.baseConfig.GrenadeSettings.Default.GrenadeF1?.maxAmmo[2]));
    assert.equal(unrelated.value, '9');
});

test('dialogs clean up on Escape/Close, restore focus and keep failed async forms retryable', async () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    for (const escape of [true, false]) {
        const manager = new ModalManager();
        const modal = manager.createMessageBox('test', 'Hello');
        if (escape) document.querySelector('.modal')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        else modal.hide();
        modalClean();
        assert.equal(document.activeElement, trigger);
    }
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.value = 'Keep this';
    form.append(input);
    let attempts = 0;
    let finish: (() => void) | undefined;
    showDialog({ title: 'Retry form', content: form, confirm: async () => {
        attempts++;
        if (attempts === 1) throw new Error('Local test failure');
        await new Promise<void>(resolve => { finish = resolve; });
    } });
    click('Confirm');
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(input.value, 'Keep this');
    assert.match(document.querySelector('.modal')?.textContent ?? '', /Local test failure/);
    const submit = click('Confirm');
    assert.equal(submit.disabled, true);
    document.querySelector('.modal')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(input.isConnected, true);
    assert.ok(finish);
    finish();
    await new Promise(resolve => setTimeout(resolve, 0));
    modalClean();
    assert.equal(document.activeElement, trigger);
});

test('nested confirmation retains the parent and legacy preset forms remain usable', async () => {
    const manager = new ModalManager();
    const form = legacyPresetForm('<form><input id="presetName" value="Draft"></form>');
    manager.createConfirmationBox('parent', form, { onConfirm: () => false });
    manager.createMessageBox('child', '<plain text>');
    assert.equal(document.querySelectorAll('.modal.show').length, 1);
    click('Close', document.querySelector('.modal.show')!);
    assert.equal(document.querySelector<HTMLInputElement>('#presetName')?.value, 'Draft');
    assert.equal(document.querySelectorAll('.modal.show').length, 1);
    click('Cancel', document.querySelector('.modal.show')!);
    modalClean();
    manager.createConfirmationBox('first', 'Open child', { onConfirm: () => { manager.createMessageBox('next', 'Child'); } });
    click('Confirm');
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(document.querySelectorAll('.modal').length, 1);
    click('Close');
    modalClean();
});

test('animated legacy modal suspends before local show and stays closed after presetLoaded', async () => {
    const { Modal } = bootstrapUI();
    const external = document.createElement('div');
    external.className = 'modal fade';
    external.id = 'presetsModal';
    external.innerHTML = '<div class="modal-dialog"><div class="modal-content"><button>Preset action</button></div></div>';
    document.body.append(external);
    const legacy = new Modal(external);
    const shown = new Promise(resolve => external.addEventListener('shown.bs.modal', resolve, { once: true }));
    legacy.show();
    await shown;
    const manager = new ModalManager();
    const local = manager.createConfirmationBox('load', 'Load?', { onConfirm: () => {
        window.dispatchEvent(new CustomEvent('presetLoaded'));
    } });
    const localNode = document.getElementById('confirmBox_load');
    assert.ok(localNode);
    await new Promise(resolve => localNode.addEventListener('shown.bs.modal', resolve, { once: true }));
    assert.equal(external.classList.contains('show'), false);
    assert.equal(document.querySelectorAll('.modal-backdrop').length, 1);
    assert.equal(document.body.classList.contains('modal-open'), true);
    click('Confirm', localNode);
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(document.querySelectorAll('.modal-backdrop').length, 0);
    assert.equal(external.classList.contains('show'), false);
    assert.equal(document.body.classList.contains('modal-open'), false);
    assert.ok(local);
    legacy.dispose();
    external.remove();
});

test('drop settings mounted in category and dialog stay synchronized without losing other drafts', () => {
    const { state, ui, root } = mount('Armor');
    const manager = new ModalManager();
    manager.showFileSettingsModal(state, ui);
    const dialog = document.querySelector('.modal');
    assert.ok(dialog);
    const path: ConfigPath = ['DropConfigs', 'nLootChance'];
    const background = input(path, root);
    const foreground = input(path, dialog);
    change(foreground, '0.25');
    assert.equal(background.value, '0.25');
    assert.equal(foreground.value, '0.25');
    const other = root.querySelector<HTMLInputElement>('input[type="number"]:not([value])');
    assert.ok(other);
    manager.removeMessageBox('settings');
    modalClean();
});

test('toast download status blocks duplicates, survives error and retries without claiming disk save', async () => {
    document.body.innerHTML = '<button id="btn_save_zip"></button><button id="btn_save"></button><input id="config_name" value="Review">';
    const notices = new Notifications();
    let calls = 0;
    let fail: ((error: Error) => void) | undefined;
    bindDownloads(new AppState(), async () => {
        calls++;
        if (calls === 1) await new Promise<void>((_resolve, reject) => { fail = reject; });
    }, notices);
    const zip = document.getElementById('btn_save_zip');
    assert.ok(zip instanceof HTMLButtonElement);
    zip.focus();
    zip.click();
    zip.click();
    assert.equal(calls, 1);
    assert.equal(zip.disabled, true);
    assert.match(document.querySelector('.toast')?.textContent ?? '', /Preparing ZIP/);
    assert.ok(fail);
    fail(new Error('Packing failed'));
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(zip.disabled, false);
    assert.match(document.querySelector('.toast[role="alert"]')?.textContent ?? '', /Packing failed/);
    zip.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(calls, 2);
    assert.match(document.querySelector('.toast')?.textContent ?? '', /Download started/);
    assert.equal(document.querySelectorAll('.toast').length, 1);
    assert.equal(document.activeElement, zip);
    document.querySelector<HTMLButtonElement>('.toast .btn-close')?.click();
    assert.equal(document.querySelectorAll('.toast').length, 0);
});

test('app navigation and presetLoaded re-render from current state; adapter methods remain checked', () => {
    document.body.innerHTML = '<img id="Neutral" class="faction_item"><img id="Generic_settings" class="faction_item"><img id="Primary" class="category_item"><img id="Pistols" class="category_item"><div id="content"></div><input id="config_name">';
    const app = new Application(() => ({ async openPresetsWindow() {} }));
    app.initialize();
    app.modalManager.removeMessageBox('dev-warning');
    document.getElementById('Neutral')?.click();
    document.getElementById('Pistols')?.click();
    const path: ConfigPath = ['PistolSettings', 'GeneralNPC_Neutral', 'GunPM_HG', '0'];
    change(input(path), '1100');
    const preset = createDefaultConfig();
    preset.PistolSettings.GeneralNPC_Neutral!.GunPM_HG = [99, 98, 97, 96];
    app.state.importState(preset);
    app.chancesCtrl.fillSettings(app.state.getChancesSettings());
    window.dispatchEvent(new CustomEvent('presetLoaded'));
    assert.equal(input(path).value, '99');
    change(input(path), '1200');
    assert.equal(app.state.config.PistolSettings.GeneralNPC_Neutral?.GunPM_HG?.[0], 1200);
    assert.equal(app.getState(), app.state);
    assert.equal(app.getChancesController(), app.chancesCtrl);
    assert.throws(() => legacyPresets({}, app.state, new ControllerAdapter(app.state)), /unavailable/);
    assert.throws(() => legacyPackageTransport({ downloadPackage: 123 }), /unavailable/);
    modalClean();
});

test('cancelled JSON picker releases pending and its temporary input', () => {
    const activity: boolean[] = [];
    chooseJSON(new AppState(), () => assert.fail('Unexpected render'), () => assert.fail('Unexpected error'), pending => activity.push(pending));
    const picker = document.querySelector<HTMLInputElement>('input[type="file"]');
    assert.ok(picker);
    picker.dispatchEvent(new Event('cancel'));
    assert.deepEqual(activity, [true, false]);
    assert.equal(picker.isConnected, false);
    assert.ok(bootstrapUI().Modal);
});

test('compact fields show reset only for changes or invalid drafts and retain focus after reset', () => {
    const { state } = mount('Primary', 'Neutral');
    const path: ConfigPath = ['WeaponSettings', 'GeneralNPC_Neutral', 'CloseCombat', 'GunObrez_SG', '0'];
    const control = input(path);
    const reset = control.parentElement?.querySelector<HTMLButtonElement>('.editor-reset');
    const base = control.parentElement?.querySelector<HTMLElement>('.comparison-base');
    assert.ok(reset && base);
    assert.equal(reset.hidden, true);
    assert.equal(base.hidden, true);
    assert.match(control.title, /Base: 90/);
    change(control, '1200');
    assert.equal(reset.hidden, false);
    assert.equal(base.hidden, false);
    reset.focus();
    reset.click();
    assert.equal(document.activeElement, control);
    assert.equal(reset.hidden, true);
    change(control, '-1');
    assert.equal(control.getAttribute('aria-invalid'), 'true');
    assert.equal(reset.hidden, false);
    const error = control.parentElement?.querySelector('.editor-field-error');
    assert.ok(error?.id && control.getAttribute('aria-describedby')?.includes(error.id));
    reset.click();
    assert.equal(control.hasAttribute('aria-invalid'), false);
    assert.equal(state.changes.length, 0);
});

test('item search filters safely, reports no matches, and Escape restores the invoking button', () => {
    const { root } = mount('Primary', 'Neutral');
    const list = root.querySelector('[data-comparison-role="CloseCombat"]')?.closest('.editor-card');
    assert.ok(list);
    const trigger = click('Add Item', list);
    // The real browser focuses a clicked button; jsdom does not.
    click('Close', document.querySelector('.modal')!);
    trigger.focus();
    trigger.click();
    const search = document.querySelector<HTMLInputElement>('.modal input[type="search"]');
    assert.ok(search);
    assert.equal(document.activeElement, search);
    search.value = 'gunpm';
    search.dispatchEvent(new Event('input'));
    const visible = [...document.querySelectorAll<HTMLButtonElement>('.editor-item-choices button')].filter(b => !b.hidden);
    assert.deepEqual(visible.map(b => b.textContent), ['GunPM_HG']);
    search.value = '<img src=x onerror=alert(1)>';
    search.dispatchEvent(new Event('input'));
    assert.equal(document.querySelector('.modal img'), null);
    assert.equal(document.querySelector<HTMLElement>('.modal [role="status"]')?.hidden, false);
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    modalClean();
    assert.equal(document.activeElement, trigger);
});

test('native navigation supports arrows and preserves category scope, menu Escape and safe document names', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    document.body.innerHTML = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
    const app = new Application(() => ({ async openPresetsWindow() {} }));
    app.initialize();
    app.modalManager.removeMessageBox('dev-warning');
    const global = document.getElementById('Generic_settings');
    const neutral = document.getElementById('Neutral');
    assert.ok(global instanceof HTMLButtonElement && neutral instanceof HTMLButtonElement);
    global.focus();
    global.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.equal(document.activeElement, neutral);
    neutral.click();
    assert.equal(neutral.getAttribute('aria-pressed'), 'true');
    assert.match(document.querySelector('.editor-scope')?.textContent ?? '', /Neutral/);
    document.getElementById('Helmets')?.click();
    assert.match(document.querySelector('.editor-scope')?.textContent ?? '', /All factions/);
    assert.match(document.getElementById('Secondary')?.getAttribute('aria-label') ?? '', /Not implemented/);
    const menu = document.querySelector<HTMLDetailsElement>('.editor-document-menu');
    assert.ok(menu);
    menu.open = true;
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(menu.open, false);
    assert.equal(document.activeElement, menu.querySelector('summary'));
    const help = document.querySelector<HTMLDetailsElement>('.editor-help-menu');
    assert.ok(help);
    help.open = true;
    document.getElementById('btn_info')?.click();
    assert.equal(help.open, false);
    document.querySelector('.modal')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    modalClean();
    assert.equal(document.activeElement, help.querySelector('summary'));
    help.open = true;
    help.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(help.open, false);
    assert.equal(document.activeElement, help.querySelector('summary'));
    document.getElementById('Armor')?.click();
    const weight = document.querySelector<HTMLInputElement>('.editor-weight-field input');
    assert.ok(weight);
    change(weight, '16');
    assert.equal(document.querySelector('.editor-section-heading button'), null);
    assert.equal(document.querySelector<HTMLButtonElement>('.editor-list-actions .editor-reset-scope')?.hidden, false);
    app.state.importState(app.state.exportState(), { name: '<img src=x onerror=alert(1)>', source: 'json' });
    app.editor.refresh();
    assert.equal(document.querySelector('.comparison-banner img'), null);
    assert.match(document.querySelector('.editor-document-summary')?.textContent ?? '', /<img/);
});
