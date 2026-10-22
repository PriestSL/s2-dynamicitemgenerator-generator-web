import { field } from './fields.ts';
import { element } from './dom.ts';
import type { EditorUI } from './editor.ts';

export function dropSettings(ui: EditorUI): HTMLElement {
    const root = element('div');
    root.append(field(ui, {
        path: ['DropConfigs', 'createDroppableArmor'], label: 'Enable armor dropping', kind: 'checkbox',
        command: value => ({ kind: 'drop', field: 'createDroppableArmor', value }),
    }));
    const settings = element('div', '', 'row g-3 armor_drop_settings');
    for (const [key, title] of [['nLootChance', 'Armor drop chance (0–1)'], ['nMinDurability', 'Minimum condition (0–1)'], ['nMaxDurability', 'Maximum condition (0–1)']] as const) {
        const col = element('div', '', 'col-12');
        col.append(field(ui, { path: ['DropConfigs', key], label: title, max: 1, command: value => ({ kind: 'drop', field: key, value }) }));
        settings.append(col);
    }
    root.append(settings);
    ui.watch(root, () => { settings.hidden = !ui.state.config.DropConfigs.createDroppableArmor; });
    return root;
}
