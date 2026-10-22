import type { EditorUI } from './editor.ts';
import { button, card, element } from './dom.ts';
import { field } from './fields.ts';
import { isChanged } from '../model/comparison.ts';
import type { ConfigPath } from '../model/comparison.ts';

export function attributeFields(ui: EditorUI, list: 'weapon' | 'armor'): HTMLElement {
    const root = element('div', '', 'attributes_table');
    const catalog = list === 'weapon' ? ui.state.config.WeaponList : ui.state.config.ArmorSpawnSettings;
    const section = list === 'weapon' ? 'WeaponList' : 'ArmorSpawnSettings';
    for (const item of Object.keys(catalog)) {
        const fields = element('div', '', 'row g-3');
        const specs = list === 'weapon'
            ? [['minAmmo', 'Minimum ammo'], ['maxAmmo', 'Maximum ammo'], ['minCondition', 'Minimum condition (%)'], ['maxCondition', 'Maximum condition (%)']] as const
            : [['drop', 'Can drop (if enabled)'], ['dropItem', 'Alternative item drop'], ['helmet', 'Helmet'], ['helmetSpawn', 'Helmet drop chance (%)']] as const;
        for (const [attr, label] of specs) {
            const col = element('div', '', 'col-md-6');
            col.append(field(ui, {
                path: [section, item, attr], label: `${item} · ${label}`,
                command: value => ({ kind: 'attribute', list, item, attribute: attr, value }),
                ...(attr === 'drop' ? { kind: 'checkbox' } : attr === 'dropItem' || attr === 'helmet'
                    ? { kind: 'select', options: Object.keys(attr === 'helmet' ? ui.state.config.HelmetsSettings : ui.state.config.ArmorSpawnSettings) }
                    : { kind: 'number', ...(attr.includes('Ammo') ? { step: '1' } : { max: 100 }) }),
            }));
            fields.append(col);
        }
        const path: ConfigPath = [section, item];
        const reset = button('Reset item', () => ui.reset([path]));
        const note = element('small', '', 'ms-2');
        const footer = element('div', '', 'mt-2');
        footer.append(reset, note);
        fields.append(footer);
        const group = card(item, fields);
        group.dataset.item = item;
        ui.watch(group, () => {
            const modified = isChanged(ui.state.baseConfig, ui.state.config, [path]);
            group.classList.toggle('comparison-modified', modified);
            reset.disabled = !modified;
            note.textContent = modified ? 'Modified' : '';
        });
        root.append(group);
    }
    return root;
}
