import type { CategoryId } from '../model/types.ts';
import { NPC_CLASSES } from '../model/types.ts';
import type { EditorUI } from './editor.ts';
import { card, element } from './dom.ts';
import { field } from './fields.ts';
import { attributeFields } from './attributeFields.ts';
import { rankTable, weightTable } from './chanceTable.ts';
import { dropSettings } from './dropSettings.ts';

function globalFields(ui: EditorUI, fields: readonly ('MinWeaponDurability' | 'MaxWeaponDurability' | 'PistolSpawnChance')[]): HTMLElement {
    const labels = { MinWeaponDurability: 'Minimum condition (%)', MaxWeaponDurability: 'Maximum condition (%)', PistolSpawnChance: 'Pistol kit spawn chance (%)' };
    const root = element('div', '', 'row g-3');
    for (const key of fields) {
        const col = element('div', '', 'col-md-6');
        col.append(field(ui, { path: [key], label: labels[key], max: 100, command: value => ({ kind: 'global', field: key, value }) }));
        root.append(col);
    }
    return root;
}
function notice(text: string): HTMLElement { return element('p', text, 'editor-empty-state'); }

/** One explicit registry for every category. No renderer/controller dispatch duplication. */
export const categories: Record<CategoryId, (ui: EditorUI) => HTMLElement> = {
    Primary(ui) {
        const root = element('div');
        const faction = ui.state.view.faction;
        if (faction === 'Generic_settings') {
            root.append(card('Global weapon settings', globalFields(ui, ['MinWeaponDurability', 'MaxWeaponDurability'])), attributeFields(ui, 'weapon'));
        } else {
            const settings = ui.state.config.WeaponSettings[`GeneralNPC_${faction}`];
            for (const role of NPC_CLASSES) if (settings?.[role]) root.append(card(role, weightTable(ui, 'weapon', faction, role)));
        }
        return root;
    },
    Secondary: () => notice('Not implemented: editing secondary weapons.'),
    Pistols(ui) {
        if (ui.state.view.faction !== 'Generic_settings' && !ui.state.config.PistolSettings[`GeneralNPC_${ui.state.view.faction}`]) return notice('No pistol settings in this configuration for the selected faction.');
        return ui.state.view.faction === 'Generic_settings'
            ? card('Global pistol settings', globalFields(ui, ['PistolSpawnChance']))
            : weightTable(ui, 'pistol', ui.state.view.faction);
    },
    Armor(ui) {
        if (ui.state.view.faction !== 'Generic_settings' && !ui.state.config.ArmorSettings[`GeneralNPC_${ui.state.view.faction}`]) return notice('No armor settings in this configuration for the selected faction.');
        if (ui.state.view.faction !== 'Generic_settings') return weightTable(ui, 'armor', ui.state.view.faction);
        const root = element('div');
        root.append(card('Armor drop settings', dropSettings(ui)), attributeFields(ui, 'armor'));
        return root;
    },
    Helmets(ui) {
        const root = element('div');
        root.append(rankTable(ui, () => Object.keys(ui.state.config.HelmetsSettings).map(item => ({
            label: item, path: ['HelmetsSettings', item], max: 100,
            command: (value, index) => ({ kind: 'rank', section: 'helmet', item, index, value }),
        }))));
        return root;
    },
    Artifacts: () => notice('Not implemented: editing artifact loot settings.'),
    Consumables: () => notice('Not implemented: editing consumable loot settings.'),
    Ammo(ui) {
        const root = element('div');
        root.append(rankTable(ui, () => Object.keys(ui.state.config.AmmoSettings).map(item => ({
            label: item, path: ['AmmoSettings', item], step: '1',
            command: (value, index) => ({ kind: 'rank', section: 'ammo', item, index, value }),
        })), ['Minimum ammo', 'Maximum ammo']));
        return root;
    },
    Grenades(ui) {
        const root = element('div');
        for (const item of Object.keys(ui.state.config.GrenadeSettings.Default)) {
            root.append(card(item, rankTable(ui, () => (['chances', 'minAmmo', 'maxAmmo'] as const).map(attribute => ({
                label: `${item} · ${attribute}`, path: ['GrenadeSettings', 'Default', item, attribute],
                resetPath: ['GrenadeSettings', 'Default', item],
                ...(attribute === 'chances' ? { max: 100 } : { step: '1' }),
                command: (value, index) => ({ kind: 'rank', section: 'grenade', item, attribute, index, value }),
            })))));
        }
        return root;
    },
};
