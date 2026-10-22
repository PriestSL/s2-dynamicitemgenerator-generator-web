import type { AppState } from '../js/state.ts';
import { categoryId, factionScope, itemWeights } from '../model/editing.ts';
import type { ListKind } from '../model/editing.ts';

/** Legacy integration entry, with no DOM, bindings, or second state owner. */
export class ControllerAdapter {
    readonly state: AppState;
    constructor(state: AppState) { this.state = state; }
    get currentFaction() { return this.state.view.faction; }
    set currentFaction(value: string) { this.state.view.faction = factionScope(value); }
    get currentCategory() { return this.state.view.category; }
    set currentCategory(value: string) { this.state.view.category = categoryId(value); }
    get typeToTable() { return this.state.typeToTable; }
    getChancesSettings() { return this.state.getChancesSettings(); }
    // Existing PresetsManager calls this after import. Reads always use current state.
    fillSettings(settings: ReturnType<AppState['getChancesSettings']>): void { void settings; }
    changeList(list: ListKind, role: string, item: string, operation: 'add' | 'remove') {
        this.state.edit({ kind: 'list', list, faction: this.currentFaction, role, item, operation });
        return itemWeights(this.state.config, list, this.currentFaction, role);
    }
}
