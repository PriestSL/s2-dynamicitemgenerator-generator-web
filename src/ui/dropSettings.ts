import { field } from './fields.ts';
import { element, uniqueId } from './dom.ts';
import type { EditorUI } from './editor.ts';

export function dropSettings(ui: EditorUI): HTMLElement {
    const root = element('div', '', 'editor-drop-settings');
    root.append(field(ui, {
        path: ['DropConfigs', 'createDroppableArmor'], label: 'Enable armor dropping', kind: 'checkbox',
        command: value => ({ kind: 'drop', field: 'createDroppableArmor', value }),
    }));
    const settings = element('div', '', 'row g-3 armor_drop_settings');
    for (const [key, title] of [['nLootChance', 'Armor drop chance (0–1)'], ['nMinDurability', 'Minimum condition (0–1)'], ['nMaxDurability', 'Maximum condition (0–1)']] as const) {
        const col = element('div', '', key === 'nLootChance' ? 'col-12' : 'col-sm-6');
        const input = field(ui, { path: ['DropConfigs', key], label: title, max: 1, command: value => ({ kind: 'drop', field: key, value }) });
        const equivalent = element('small', '', 'editor-field-equivalent');
        equivalent.id = uniqueId('equivalent');
        const control = input.querySelector('input');
        control?.setAttribute('aria-describedby', `${control.getAttribute('aria-describedby')} ${equivalent.id}`);
        ui.watch(equivalent, () => {
            equivalent.textContent = `Current: ${Number((ui.state.config.DropConfigs[key] * 100).toFixed(2))}%`;
        });
        input.append(equivalent);
        col.append(input);
        settings.append(col);
    }
    root.append(settings);
    root.append(element('p', 'Changes apply immediately. Values use 0–1: 0.1 = 10%.', 'editor-drop-hint'));
    ui.watch(root, () => { settings.hidden = !ui.state.config.DropConfigs.createDroppableArmor; });
    return root;
}
