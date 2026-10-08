import { generateLoadout } from '../generator/loadout.ts';
import type { AppState } from './state.ts';

// Compatibility entry for existing AppState consumers.
export async function createLoadout(state: AppState): Promise<string> {
    return generateLoadout(state.config);
}
