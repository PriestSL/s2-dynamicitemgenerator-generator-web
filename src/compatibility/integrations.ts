import type { AppState } from '../js/state.ts';
import type { PackageTransport } from '../files/packageTransport.ts';
import type { ControllerAdapter } from './controller.ts';

export interface PresetsUI { openPresetsWindow(): Promise<void> }

/** Runtime-checked boundary, not a declaration claiming the deferred JS is typed. */
export function legacyPresets(module: unknown, state: AppState, controller: ControllerAdapter): PresetsUI {
    if (!module || typeof module !== 'object' || !('PresetsManager' in module) || typeof module.PresetsManager !== 'function') {
        throw new Error('PresetsManager is unavailable');
    }
    const instance: unknown = Reflect.construct(module.PresetsManager, [state, controller]);
    if (!instance || typeof instance !== 'object' || !('openPresetsWindow' in instance) || typeof instance.openPresetsWindow !== 'function') {
        throw new Error('Invalid PresetsManager entry');
    }
    const open = instance.openPresetsWindow;
    return { async openPresetsWindow() { await open.call(instance); } };
}
export function legacyPackageTransport(module: unknown): PackageTransport {
    if (!module || typeof module !== 'object' || !('downloadPackage' in module) || typeof module.downloadPackage !== 'function') {
        throw new Error('Package transport is unavailable');
    }
    const download = module.downloadPackage;
    return async (name, cfg): Promise<unknown> => download(name, cfg);
}
