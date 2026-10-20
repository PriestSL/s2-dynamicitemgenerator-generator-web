import type { AppState } from '../js/state.ts';
import type { ConfigPath } from '../model/comparison.ts';
import { isChanged, resetTargets, sameValue, valueAt, viewPaths } from '../model/comparison.ts';
import { CATEGORIES } from '../model/types.ts';
import { weaponClass } from '../model/effective.ts';

type Control = HTMLInputElement | HTMLSelectElement;

export function controlPath(input: Pick<Control, 'dataset' | 'id'>): ConfigPath | undefined {
    const d = input.dataset;
    const globals = ['MinWeaponDurability', 'MaxWeaponDurability', 'PistolSpawnChance'] as const;
    const global = globals.find(k => k === d.compareField);
    if (global) return [global];
    const drops: Record<string, string> = { drop_armor: 'createDroppableArmor', armor_chance: 'nLootChance', min_condition: 'nMinDurability', max_condition: 'nMaxDurability' };
    const drop = drops[input.id];
    if (drop) return ['DropConfigs', drop];
    const item = d.item;
    if (item === undefined) return undefined;
    if (d.type === 'weapon' || d.type === 'pistol') return d.attr ? ['WeaponList', item, d.attr] : undefined;
    if (d.type === 'armor') return d.attr ? ['ArmorSpawnSettings', item, d.attr] : undefined;
    const index = d.level;
    if (index === undefined) return undefined;
    switch (d.type) {
        case 'Primary': return ['WeaponSettings', `GeneralNPC_${d.faction}`, d.classification ?? '', item, index];
        case 'Armor': return ['ArmorSettings', `GeneralNPC_${d.faction}`, item, index];
        case 'Pistols': return ['PistolSettings', `GeneralNPC_${d.faction}`, item, index];
        case 'Helmets': return ['HelmetsSettings', item, index];
        case 'Ammo': return ['AmmoSettings', item, index];
        case 'Grenades': return ['GrenadeSettings', 'Default', item, d.attr ?? '', index];
        default: return undefined;
    }
}
function element<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = ''): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    el.textContent = text;
    el.className = className;
    return el;
}
function button(text: string, action: () => void): HTMLButtonElement {
    const el = element('button', text, 'btn btn-sm btn-outline-secondary comparison-decoration');
    el.type = 'button';
    el.addEventListener('click', action);
    return el;
}
function textValue(value: unknown): string {
    return value === undefined ? 'absent' : typeof value === 'object' ? JSON.stringify(value) : String(value);
}
function baseText(state: AppState, path: ConfigPath): string {
    const value = valueAt(state.baseConfig, path);
    if (value !== undefined || path[0] !== 'WeaponList' || !path[1] || !path[2]) return textValue(value);
    const attr = path[2];
    const inherited = attr === 'minCondition' ? state.baseConfig.MinWeaponDurability : attr === 'maxCondition' ? state.baseConfig.MaxWeaponDurability
        : state.baseConfig.AmmoSettings[weaponClass(path[1])][attr === 'minAmmo' ? 0 : 1];
    return `inherited (${inherited})`;
}

/** Adds stage-4 comparison controls to legacy renders without taking ownership of config. */
export class ComparisonUI {
    private readonly state: AppState;
    private readonly render: () => void;
    private readonly banner: HTMLElement;
    private readonly error: HTMLElement;
    private readonly summary: HTMLElement;
    constructor(state: AppState, render: () => void) {
        this.state = state;
        this.render = render;
        this.banner = element('section', '', 'comparison-banner border rounded p-2 mb-3');
        this.banner.setAttribute('aria-label', 'Base configuration');
        this.summary = element('div');
        this.error = element('div', '', 'text-danger');
        this.error.setAttribute('role', 'alert');
        const all = button('Reset entire configuration to base', () => {
            if (window.confirm('Reset the entire configuration to the selected base?')) this.perform();
        });
        const defaults = button('Load defaults', () => {
            if (!window.confirm('Load defaults as a new base and replace the current configuration?')) return;
            state.resetState();
            this.error.textContent = '';
            render();
        });
        this.banner.append(this.summary, all, defaults, this.error);
        document.getElementById('content')?.before(this.banner);
    }
    private perform(paths?: readonly ConfigPath[]): void {
        try {
            this.state.reset(paths);
            this.error.textContent = '';
            this.render();
            // File settings can be open while resetting its controls.
            for (const input of document.querySelectorAll<Control>('.modal input, .modal select')) {
                const path = controlPath(input);
                if (!path) continue;
                const value = valueAt(this.state.config, path);
                if (input instanceof HTMLInputElement && input.type === 'checkbox') input.checked = value === true;
                else input.value = value === undefined ? '' : String(value);
                input.setCustomValidity('');
                input.removeAttribute('aria-invalid');
                input.classList.remove('validation-error');
            }
            const panel = document.querySelector<HTMLElement>('.armor_drop_settings');
            if (panel) panel.style.display = this.state.config.DropConfigs.createDroppableArmor ? 'block' : 'none';
            this.refresh();
        } catch (e) {
            this.error.textContent = `Reset was not applied: ${e instanceof Error ? e.message : String(e)}. Check the related global settings.`;
        }
    }
    refresh(): void {
        const state = this.state;
        this.summary.textContent = `Base: ${state.document.name} (${state.document.source}) · ${state.changes.length} changes`;
        for (const category of CATEGORIES) {
            document.getElementById(category)?.classList.toggle('comparison-category-changed', isChanged(state.baseConfig, state.config, viewPaths({ ...state.view, category })));
        }
        const content = document.getElementById('content');
        if (!content) return;
        for (const root of [content, ...document.querySelectorAll<HTMLElement>('.modal')]) this.decorate(root);
        const paths = viewPaths(state.view);
        if (paths.length) {
            const reset = button('Reset this section to base', () => this.perform(paths));
            reset.disabled = !isChanged(state.baseConfig, state.config, paths);
            content.prepend(reset);
        }
    }
    private decorate(root: HTMLElement): void {
        const state = this.state;
        root.querySelectorAll('.comparison-decoration, .comparison-removed').forEach(el => el.remove());
        root.querySelectorAll('.comparison-modified, .comparison-added').forEach(el => el.classList.remove('comparison-modified', 'comparison-added'));
        const items = new Map<HTMLElement, ConfigPath>();
        for (const input of root.querySelectorAll<Control>('input, select')) {
            const path = controlPath(input);
            if (!path) continue;
            const changed = !sameValue(valueAt(state.baseConfig, path), valueAt(state.config, path));
            input.classList.toggle('comparison-modified', changed);
            const note = element('small', `Base: ${baseText(state, path)}`, 'd-block comparison-decoration comparison-base');
            input.after(note);
            const paths = resetTargets(state.baseConfig, path);
            const paired = paths.length > 1 || (path[0] === 'AmmoSettings' && path.length === 3);
            const removesItem = !paired && (paths[0]?.length ?? path.length) < path.length;
            const label = removesItem ? 'Reset (remove item)' : paired ? 'Reset pair' : 'Reset';
            const reset = button(label, () => this.perform(paths));
            reset.disabled = !isChanged(state.baseConfig, state.config, paths);
            reset.setAttribute('aria-label', `${label} ${path.join('.')}`);
            note.append(' ', reset);
            const row = input.closest<HTMLElement>('tr') ?? input.closest<HTMLElement>('.attributes_table .card');
            if (row && input.dataset.item !== undefined) {
                const itemPath: ConfigPath = path[0] === 'GrenadeSettings' ? ['GrenadeSettings', 'Default', input.dataset.item]
                    : path[0] === 'WeaponSettings' ? ['WeaponSettings', path[1] ?? '', path[2] ?? '', input.dataset.item]
                    : [path[0], ...(path[0] === 'ArmorSettings' || path[0] === 'PistolSettings' ? [path[1] ?? ''] : []), input.dataset.item];
                items.set(row, itemPath);
            }
        }
        for (const [row, path] of items) {
            const added = valueAt(state.baseConfig, path) === undefined;
            const changed = isChanged(state.baseConfig, state.config, [path]);
            row.classList.toggle('comparison-added', added);
            row.classList.toggle('comparison-modified', changed && !added);
            const target = row.querySelector('td, .card-header');
            if (!target) continue;
            const note = element('div', added ? 'Added — absent from base' : changed ? 'Modified' : '', 'comparison-decoration');
            const reset = button(added ? 'Reset (remove)' : 'Reset item', () => this.perform([path]));
            reset.disabled = !changed;
            note.append(' ', reset);
            target.append(note);
        }
        for (const container of root.querySelectorAll<HTMLElement>('[data-comparison-list]')) {
            const section = container.dataset.comparisonList;
            if (section !== 'WeaponSettings' && section !== 'ArmorSettings' && section !== 'PistolSettings') continue;
            const scope: ConfigPath = section === 'WeaponSettings' ? [section, container.dataset.comparisonFaction ?? '', container.dataset.comparisonRole ?? ''] : [section, container.dataset.comparisonFaction ?? ''];
            const reset = button('Reset list to base', () => this.perform([scope]));
            reset.disabled = !isChanged(state.baseConfig, state.config, [scope]);
            container.prepend(reset);
            const base = valueAt(state.baseConfig, scope);
            if (!base || typeof base !== 'object') continue;
            const tbody = container.querySelector('tbody');
            for (const [id, values] of Object.entries(base)) {
                if (valueAt(state.config, [...scope, id]) !== undefined) continue;
                const row = element('tr', '', 'comparison-removed');
                const name = element('td', `${id || '(empty item)'} — Removed`);
                row.append(name);
                if (Array.isArray(values)) for (const v of values) row.append(element('td', textValue(v)));
                const actions = element('td');
                const restore = button('Restore', () => this.perform([[...scope, id]]));
                restore.setAttribute('aria-label', `Restore ${id}`);
                actions.append(restore);
                row.append(actions);
                tbody?.append(row);
            }
        }
    }
}
