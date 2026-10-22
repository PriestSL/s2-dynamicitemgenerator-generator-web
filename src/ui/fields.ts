import { isChanged, resetTargets, sameValue, valueAt } from '../model/comparison.ts';
import type { ConfigPath } from '../model/comparison.ts';
import type { EditCommand } from '../model/editing.ts';
import { weaponClass } from '../model/effective.ts';
import { applyField } from './editing.ts';
import { button, element, uniqueId } from './dom.ts';
import type { EditorUI } from './editor.ts';

export interface FieldOptions {
    path: ConfigPath;
    label: string;
    command: (value: string | boolean) => EditCommand;
    kind?: 'number' | 'checkbox' | 'select';
    options?: readonly string[];
    max?: number;
    step?: '1' | 'any';
    hideLabel?: boolean;
}
export function displayValue(value: unknown): string {
    return value === undefined ? 'absent' : typeof value === 'object' ? JSON.stringify(value) : String(value);
}
function baseText(ui: EditorUI, path: ConfigPath): string {
    const base = ui.state.baseConfig;
    const value = valueAt(base, path);
    if (value !== undefined || path[0] !== 'WeaponList' || !path[1] || !path[2]) return displayValue(value);
    const attr = path[2];
    const inherited = attr === 'minCondition' ? base.MinWeaponDurability : attr === 'maxCondition' ? base.MaxWeaponDurability
        : base.AmmoSettings[weaponClass(path[1])][attr === 'minAmmo' ? 0 : 1];
    return `inherited (${inherited})`;
}
export function pathsOverlap(a: readonly string[], b: readonly string[]): boolean {
    return a.every((key, i) => b[i] === key) || b.every((key, i) => a[i] === key);
}

export function field(ui: EditorUI, options: FieldOptions): HTMLElement {
    const { path } = options;
    const root = element('div', '', 'editor-field');
    const id = uniqueId('field');
    const label = element('label', options.label, options.hideLabel ? 'visually-hidden' : 'form-label');
    label.htmlFor = id;
    const control = options.kind === 'select' ? element('select', '', 'form-select form-select-sm') : element('input', '', 'form-control form-control-sm');
    control.id = id;
    control.dataset.path = JSON.stringify(path);
    if (control instanceof HTMLSelectElement) {
        for (const value of ['', ...options.options ?? []]) {
            const option = element('option', value || '(none)');
            option.value = value;
            control.append(option);
        }
    } else {
        control.type = options.kind === 'checkbox' ? 'checkbox' : 'number';
        if (control.type === 'checkbox') control.className = 'form-check-input';
        else {
            control.min = '0';
            control.step = options.step ?? 'any';
            if (options.max !== undefined) control.max = String(options.max);
        }
    }
    const note = element('small', '', 'comparison-base');
    note.id = `${id}-base`;
    const error = element('small', '', 'text-danger editor-field-error');
    error.id = `${id}-error`;
    error.setAttribute('aria-live', 'polite');
    control.setAttribute('aria-describedby', `${note.id} ${error.id}`);
    const resetPaths = resetTargets(ui.state.baseConfig, path);
    const paired = resetPaths.length > 1 || path[0] === 'AmmoSettings';
    const removes = !paired && (resetPaths[0]?.length ?? path.length) < path.length;
    const reset = button(removes ? 'Reset (remove)' : paired ? 'Reset pair' : 'Reset', () => ui.reset(resetPaths), 'btn btn-sm btn-link editor-reset');
    reset.setAttribute('aria-label', `${reset.textContent}: ${options.label}`);
    let lastCommitted = valueAt(ui.state.config, path);
    let draft = false;
    const writeValue = () => {
        const value = valueAt(ui.state.config, path);
        if (control instanceof HTMLInputElement && control.type === 'checkbox') control.checked = value === true;
        else control.value = value === undefined ? '' : String(typeof value === 'boolean' ? Number(value) : value);
        control.setCustomValidity('');
        control.removeAttribute('aria-invalid');
        control.classList.remove('validation-error', 'validation-success');
        control.title = '';
        error.textContent = '';
        draft = false;
    };
    writeValue();
    const commit = () => {
        draft = true;
        const value = control instanceof HTMLInputElement && control.type === 'checkbox' ? control.checked : control.value;
        const valid = applyField(control, () => ui.edit(options.command(value)));
        error.textContent = valid ? '' : control.validationMessage;
        draft = !valid;
        ui.refresh();
    };
    control.addEventListener('input', () => { draft = true; });
    control.addEventListener('change', commit);
    root.append(label, control, note, reset, error);
    ui.watch(root, resets => {
        const current = valueAt(ui.state.config, path);
        if (resets?.some(p => pathsOverlap(p, path)) || (!draft && !sameValue(current, lastCommitted))) writeValue();
        lastCommitted = current;
        const modified = !sameValue(valueAt(ui.state.baseConfig, path), current);
        control.classList.toggle('comparison-modified', modified);
        note.textContent = `Base: ${baseText(ui, path)}${modified ? ' · Modified' : ''}`;
        reset.disabled = !isChanged(ui.state.baseConfig, ui.state.config, resetPaths) && !control.hasAttribute('aria-invalid');
    });
    return root;
}
