import { CATEGORIES } from '../model/types.ts';
import { isChanged, viewPaths } from '../model/comparison.ts';
import type { EditorUI } from './editor.ts';
import { bindDisclosure, button, element } from './dom.ts';
import { resetButton } from './chanceTable.ts';

export function comparisonBanner(ui: EditorUI, loadDefaults: () => void): HTMLElement {
    const banner = element('section', '', 'comparison-banner');
    banner.setAttribute('aria-label', 'Base configuration');
    const summary = element('div', '', 'editor-document-summary');
    const name = element('span');
    const count = element('span', '', 'editor-change-count');
    summary.append(name, count);
    const menu = element('details', '', 'editor-document-menu');
    const trigger = element('summary', 'Document actions');
    const actions = element('div', '', 'editor-menu-panel');
    const all = button('Reset entire configuration to base', () => {
        if (window.confirm('Reset the entire configuration to the selected base?')) ui.reset();
        menu.open = false;
        trigger.focus();
    });
    const defaults = button('Load defaults', () => {
        if (!window.confirm('Load defaults as a new base and replace the current configuration?')) return;
        ui.state.resetState();
        loadDefaults();
        menu.open = false;
        trigger.focus();
    });
    actions.append(all, defaults);
    menu.append(trigger, actions);
    bindDisclosure(menu);
    banner.append(summary, menu);
    ui.watch(banner, () => {
        const state = ui.state;
        name.textContent = `Base: ${state.document.name}`;
        name.title = `Source: ${state.document.source}`;
        count.textContent = state.changes.length ? `${state.changes.length} ${state.changes.length === 1 ? 'change' : 'changes'}` : 'Unchanged';
        all.disabled = state.changes.length === 0;
        for (const category of CATEGORIES) {
            const node = document.getElementById(category);
            const changed = isChanged(state.baseConfig, state.config, viewPaths({ ...state.view, category }));
            node?.classList.toggle('comparison-category-changed', changed);
            node?.setAttribute('aria-label', `${category}${changed ? ' · Modified' : ''}${['Secondary', 'Artifacts', 'Consumables'].includes(category) ? ' · Not implemented' : ''}`);
        }
    });
    return banner;
}
export function sectionReset(ui: EditorUI): HTMLElement {
    const root = element('header', '', 'editor-section-heading');
    const { category, faction } = ui.state.view;
    const global = faction === 'Generic_settings' || ['Helmets', 'Ammo', 'Grenades'].includes(category);
    root.append(element('h1', category), element('span', global ? 'All factions · Global settings' : `${faction} · Faction settings`, 'editor-scope'));
    const paths = viewPaths(ui.state.view);
    // A faction armor/pistol view is exactly one list, which already owns this action.
    const singleList = faction !== 'Generic_settings' && ['Armor', 'Pistols'].includes(category);
    if (paths.length && !singleList) root.append(resetButton(ui, `Reset all ${category} settings for ${global ? 'all factions' : faction} to base`, paths, 'Reset section'));
    return root;
}
