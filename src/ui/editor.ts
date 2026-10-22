import type { AppState } from '../js/state.ts';
import type { ConfigPath } from '../model/comparison.ts';
import type { EditCommand } from '../model/editing.ts';

export type Refresh = (reset?: readonly ConfigPath[]) => void;

/** Coordinates mounted controls, never owns or caches configuration data. */
export class EditorUI {
    readonly state: AppState;
    private readonly listeners = new Map<HTMLElement, Refresh>();
    private readonly report: (message: string) => void;
    constructor(state: AppState, report: (message: string) => void) {
        this.state = state;
        this.report = report;
    }
    watch(node: HTMLElement, refresh: Refresh): void {
        this.listeners.set(node, refresh);
        refresh();
    }
    refresh(reset?: readonly ConfigPath[]): void {
        for (const [node, refresh] of this.listeners) {
            if (node.isConnected) refresh(reset);
            else this.listeners.delete(node);
        }
    }
    edit(command: EditCommand): void {
        this.state.edit(command);
        this.refresh();
    }
    reset(paths?: readonly ConfigPath[]): void {
        try {
            this.state.reset(paths);
            this.refresh(paths ?? Object.keys(this.state.config).map(key => [key] as ConfigPath));
        } catch (error) {
            this.report(`Reset was not applied: ${error instanceof Error ? error.message : String(error)}. Check the related global settings.`);
        }
    }
}
