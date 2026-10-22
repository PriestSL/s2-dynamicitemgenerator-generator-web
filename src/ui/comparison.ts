import { CATEGORIES } from '../model/types.ts';
import { isChanged, viewPaths } from '../model/comparison.ts';
import type { EditorUI } from './editor.ts';
import { button, element } from './dom.ts';
import { resetButton } from './chanceTable.ts';

export function comparisonBanner(ui: EditorUI, loadDefaults: () => void): HTMLElement {
    const banner = element('section', '', 'comparison-banner border rounded p-2 mb-3');
    banner.setAttribute('aria-label', 'Base configuration');
    const summary = element('div');
    const all = button('Reset entire configuration to base', () => {
        if (window.confirm('Reset the entire configuration to the selected base?')) ui.reset();
    });
    const defaults = button('Load defaults', () => {
        if (!window.confirm('Load defaults as a new base and replace the current configuration?')) return;
        ui.state.resetState();
        loadDefaults();
    });
    banner.append(summary, all, defaults);
    ui.watch(banner, () => {
        const state = ui.state;
        summary.textContent = `Base: ${state.document.name} (${state.document.source}) · ${state.changes.length} changes`;
        for (const category of CATEGORIES) {
            document.getElementById(category)?.classList.toggle('comparison-category-changed', isChanged(state.baseConfig, state.config, viewPaths({ ...state.view, category })));
        }
    });
    return banner;
}
export function sectionReset(ui: EditorUI): HTMLElement {
    const root = element('div', '', 'mb-2');
    const paths = viewPaths(ui.state.view);
    if (paths.length) root.append(resetButton(ui, 'Reset this section to base', paths));
    return root;
}
