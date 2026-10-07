import test from 'node:test';
import assert from 'node:assert/strict';
import { AppState } from '../src/js/state.ts';
import { downloadJSON } from '../src/files/json.ts';
import { parseConfig } from '../src/model/validation.ts';

test('JSON download starts with the complete edited configuration and releases its resources', async t => {
    const state = new AppState();
    state.edit({ kind: 'weight', list: 'pistol', faction: 'Neutral', item: 'GunPM_HG', index: '0', value: '2500' });
    let blob: Blob | undefined;
    const steps: string[] = [];
    const link = {
        href: '', download: '',
        click() { steps.push('click'); },
        remove() { steps.push('remove'); },
    };
    // Minimal browser port: the real download helper constructs the Blob and link.
    const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    Object.defineProperty(globalThis, 'document', { configurable: true, value: {
        createElement(tag: string) { assert.equal(tag, 'a'); return link; },
        body: { appendChild(element: object) { assert.equal(element, link); steps.push('append'); } },
    } });
    t.after(() => {
        if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
        else Reflect.deleteProperty(globalThis, 'document');
    });
    t.mock.method(URL, 'createObjectURL', (value: Blob) => { blob = value; return 'blob:local-test'; });
    t.mock.method(URL, 'revokeObjectURL', (value: string) => { assert.equal(value, 'blob:local-test'); steps.push('revoke'); });

    downloadJSON(state, 'Review loadout');

    assert.equal(link.download, 'Review loadout.json');
    assert.equal(link.href, 'blob:local-test');
    assert.deepEqual(steps, ['append', 'click', 'remove', 'revoke']);
    assert.ok(blob);
    assert.equal(blob.type, 'application/json');
    const restored = new AppState();
    restored.importState(parseConfig(await blob.text()));
    assert.deepEqual(restored.config, state.config);
    assert.equal(restored.config.PistolSettings.GeneralNPC_Neutral?.GunPM_HG?.[0], 2500);
});

test('JSON download rejects invalid legacy writes before creating any download resource', t => {
    const state = new AppState();
    state.modifiedPistolSpawnChance = 101;
    const createURL = t.mock.method(URL, 'createObjectURL', () => { throw new Error('Unexpected download'); });
    assert.throws(() => downloadJSON(state, 'Invalid'), /Maximum is 100/);
    assert.equal(createURL.mock.callCount(), 0);
});
