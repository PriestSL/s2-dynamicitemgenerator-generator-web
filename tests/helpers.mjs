import { AppState } from '../src/js/state.ts';
export { fixtureText, fixture } from './fixtures.ts';

// Historical generator fixtures deliberately include invalid effective ranges (F07).
// This stage-3 helper bypasses the new local import boundary ONLY for characterization.
export function editor(data) {
    const state = new AppState();
    if (data) Object.assign(state.config, structuredClone(data));
    return { state };
}
