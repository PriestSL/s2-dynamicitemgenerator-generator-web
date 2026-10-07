import type { AppState } from '../js/state.ts';
import type { EditCommand, ListKind } from '../model/editing.ts';
import { MAX_ITEM_WEIGHT } from '../model/values.ts';

export function configureRankInput(input: HTMLInputElement, category: string, attribute = ''): void {
    input.min = '0';
    input.step = 'any';
    if (category === 'Primary' || category === 'Pistols' || category === 'Armor') {
        input.max = String(MAX_ITEM_WEIGHT);
        input.setAttribute('aria-label', `${input.dataset.item}, rank ${Number(input.dataset.level) + 1}, weight`);
    } else if (category === 'Helmets' || (category === 'Grenades' && attribute === 'chances')) {
        input.max = '100';
    } else if (category === 'Ammo' || category === 'Grenades') {
        input.step = '1';
    }
}

export function applyField(input: HTMLInputElement | HTMLSelectElement, action: () => void): boolean {
    try {
        action();
        input.classList.remove('validation-error');
        input.classList.add('validation-success');
        input.removeAttribute('aria-invalid');
        input.title = '';
        input.setCustomValidity('');
        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        input.classList.remove('validation-success');
        input.classList.add('validation-error');
        input.setAttribute('aria-invalid', 'true');
        input.title = message;
        input.setCustomValidity(message);
        return false;
    }
}
export function editEvent(state: AppState, event: Event, kind: ListKind | 'helmet' | 'grenade' | 'ammo' | 'attribute'): boolean {
    const input = event.target;
    if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement)) return false;
    const d = input.dataset;
    const value = input instanceof HTMLInputElement && input.type === 'checkbox' ? input.checked : input.value;
    let command: EditCommand;
    if (kind === 'attribute') command = { kind: 'attribute', list: d.type ?? '', item: d.item ?? '', attribute: d.attr ?? '', value };
    else if (kind === 'weapon' || kind === 'armor' || kind === 'pistol') command = {
        kind: 'weight', list: kind, faction: d.faction ?? '', role: d.classification ?? '', item: d.item ?? '', index: d.level ?? '', value,
    };
    else command = { kind: 'rank', section: kind, item: d.item ?? '', attribute: d.attr ?? '', index: d.level ?? '', value };
    return applyField(input, () => state.edit(command));
}
export function bindGlobal(input: HTMLInputElement, state: AppState, field: 'MinWeaponDurability' | 'MaxWeaponDurability' | 'PistolSpawnChance'): void {
    input.addEventListener('change', () => applyField(input, () => state.edit({ kind: 'global', field, value: input.value })));
}
export function bindDropSettings(state: AppState): void {
    const fields = { drop_armor: 'createDroppableArmor', armor_chance: 'nLootChance', min_condition: 'nMinDurability', max_condition: 'nMaxDurability' };
    for (const [id, field] of Object.entries(fields)) {
        const input = document.getElementById(id);
        if (!(input instanceof HTMLInputElement)) continue;
        if (input.type === 'number') { input.min = '0'; input.max = '1'; input.step = 'any'; }
        input.addEventListener('change', () => {
            const ok = applyField(input, () => state.edit({ kind: 'drop', field, value: input.type === 'checkbox' ? input.checked : input.value }));
            const panel = document.querySelector<HTMLElement>('.armor_drop_settings');
            if (ok && panel) panel.style.display = state.config.DropConfigs.createDroppableArmor ? 'block' : 'none';
        });
    }
}
