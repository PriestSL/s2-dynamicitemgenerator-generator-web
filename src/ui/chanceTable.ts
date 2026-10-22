import type { ConfigPath } from '../model/comparison.ts';
import { isChanged, valueAt } from '../model/comparison.ts';
import type { EditCommand, ListKind } from '../model/editing.ts';
import { itemWeights, relativePercent } from '../model/editing.ts';
import { RANKS } from '../model/types.ts';
import type { FactionScope } from '../model/types.ts';
import { MAX_ITEM_WEIGHT } from '../model/values.ts';
import type { EditorUI } from './editor.ts';
import { button, element } from './dom.ts';
import { displayValue, field } from './fields.ts';
import { showDialog } from './dialogs.ts';

export function resetButton(ui: EditorUI, title: string, paths: readonly ConfigPath[]): HTMLButtonElement {
    const reset = button(title, () => ui.reset(paths));
    ui.watch(reset, () => { reset.disabled = !isChanged(ui.state.baseConfig, ui.state.config, paths); });
    return reset;
}
export interface RankRow {
    label: string;
    path: ConfigPath;
    resetPath?: ConfigPath;
    command: (value: string | boolean, index: string) => EditCommand;
    max?: number;
    step?: '1' | 'any';
    percent?: (index: number) => number;
    remove?: () => void;
    removed?: boolean;
}

/** The same row constructor is used for initial render, add, and restore. */
export function rankRow(ui: EditorUI, row: RankRow, headings: readonly string[]): HTMLTableRowElement {
    const tr = element('tr', '', row.removed ? 'comparison-removed' : '');
    tr.dataset.rowPath = JSON.stringify(row.path);
    const name = element('td');
    name.append(element('strong', row.label));
    const state = element('small', '', 'd-block');
    name.append(state);
    tr.append(name);
    if (row.removed) {
        state.textContent = 'Removed';
        const values = valueAt(ui.state.baseConfig, row.path);
        headings.forEach((_heading, i) => tr.append(element('td', Array.isArray(values) ? displayValue(values[i]) : '')));
        const actions = element('td');
        actions.append(button('Restore', () => ui.reset([row.path])));
        tr.append(actions);
        return tr;
    }
    headings.forEach((heading, index) => {
        const td = element('td');
        td.append(field(ui, {
            path: [...row.path, String(index)], label: `${row.label}, ${heading}`,
            hideLabel: true, command: value => row.command(value, String(index)),
            ...(row.max !== undefined ? { max: row.max } : {}), ...(row.step ? { step: row.step } : {}),
        }));
        if (row.percent) {
            const percent = row.percent;
            const label = element('small', '', 'editor-percent');
            ui.watch(label, () => { label.textContent = `Share: ${percent(index).toFixed(2)}%`; });
            td.append(label);
        }
        tr.append(td);
    });
    const actions = element('td', '', 'editor-row-actions');
    actions.append(resetButton(ui, 'Reset item', [row.resetPath ?? row.path]));
    if (row.remove) actions.append(button('Delete', row.remove, 'btn btn-sm btn-outline-danger'));
    tr.append(actions);
    ui.watch(tr, () => {
        const added = valueAt(ui.state.baseConfig, row.path) === undefined;
        const modified = isChanged(ui.state.baseConfig, ui.state.config, [row.path]);
        tr.classList.toggle('comparison-added', added);
        tr.classList.toggle('comparison-modified', modified && !added);
        state.textContent = added ? 'Added · absent from base' : modified ? 'Modified' : '';
    });
    return tr;
}

export function rankTable(ui: EditorUI, rows: () => RankRow[], headings: readonly string[] = RANKS): HTMLElement {
    const root = element('div', '', 'table-responsive editor-table-scroll');
    root.tabIndex = 0;
    root.setAttribute('aria-label', 'Item settings table; scroll horizontally to see all ranks');
    const table = element('table', '', 'table table-striped table-hover table-sm editor-rank-table');
    const head = element('thead', '', 'table-dark');
    const header = element('tr');
    for (const text of ['Item', ...headings, 'Actions']) {
        const th = element('th', text);
        th.scope = 'col';
        header.append(th);
    }
    head.append(header);
    const body = element('tbody');
    table.append(head, body);
    root.append(table);
    const mounted = new Map<string, HTMLTableRowElement>();
    ui.watch(root, () => {
        const specs = rows();
        const keys = new Set(specs.map(row => `${JSON.stringify(row.path)}:${!!row.removed}`));
        for (const [key, node] of mounted) if (!keys.has(key)) { node.remove(); mounted.delete(key); }
        for (const spec of specs) {
            const key = `${JSON.stringify(spec.path)}:${!!spec.removed}`;
            if (!mounted.has(key)) {
                const node = rankRow(ui, spec, headings);
                mounted.set(key, node);
                // New active items precede the removed baseline rows.
                body.insertBefore(node, spec.removed ? null : body.querySelector('.comparison-removed'));
            }
        }
    });
    return root;
}

export function weightTable(ui: EditorUI, list: ListKind, faction: FactionScope, role = ''): HTMLElement {
    const section = list === 'weapon' ? 'WeaponSettings' : list === 'armor' ? 'ArmorSettings' : 'PistolSettings';
    const path: ConfigPath = list === 'weapon' ? [section, `GeneralNPC_${faction}`, role] : [section, `GeneralNPC_${faction}`];
    const items = () => itemWeights(ui.state.config, list, faction, role);
    const root = element('div', '', 'editor-weight-list');
    root.dataset.comparisonList = section;
    root.dataset.comparisonFaction = `GeneralNPC_${faction}`;
    root.dataset.comparisonRole = role;
    root.append(resetButton(ui, 'Reset list to base', [path]));
    root.append(rankTable(ui, () => {
        const current = items();
        const base = valueAt(ui.state.baseConfig, path);
        const removed = base && typeof base === 'object' ? Object.keys(base).filter(item => !Object.hasOwn(current, item)) : [];
        return [...Object.keys(current), ...removed].map(item => ({
            label: item || '(empty item)', path: [...path, item],
            max: MAX_ITEM_WEIGHT, removed: removed.includes(item),
            command: (value, index) => ({ kind: 'weight', list, faction, role, item, index, value }),
            percent: index => relativePercent(items(), item, index),
            ...(item ? { remove: () => ui.edit({ kind: 'list', list, faction, role, item, operation: 'remove' }) } : {}),
        }));
    }));
    const add = button('Add Item', () => {
        const choices = element('div', '', 'd-grid gap-2 editor-item-choices');
        const current = items();
        for (const item of Object.keys(ui.state.typeToTable[list])) {
            const option = button(item, () => {
                ui.edit({ kind: 'list', list, faction, role, item, operation: 'add' });
                modal.hide();
            }, 'btn btn-outline-secondary text-start');
            option.disabled = Object.hasOwn(current, item);
            choices.append(option);
        }
        const modal = showDialog({ title: 'Add Item', content: choices });
    }, 'btn btn-sm btn-success mt-2');
    root.append(add);
    return root;
}
