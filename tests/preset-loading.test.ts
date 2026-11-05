import { setupDOM } from './dom.ts';
import { PresetsManager } from '../src/integrations/presetsManager.ts';
import { ControllerAdapter } from '../src/compatibility/controller.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AppState } from '../src/js/state.ts';
import { createDefaultConfig } from '../src/model/config.ts';
import { normalizeImport } from '../src/model/importing.ts';


test('PresetsManager loads all 13 fields and metadata via real REST adapter; malformed and failed responses are atomic', async t => {
    const dom = await setupDOM();
    t.after(() => dom.window.close());
    const state = new AppState();
    const messages: string[] = [];
    const events: CustomEvent<{ preset: unknown }>[] = [];
    const name = document.createElement('input');
    name.value = 'Previous name';
    name.id = 'config_name';
    document.body.append(name);
    const controller = new ControllerAdapter(state);
    const manager = new PresetsManager(state, controller);
    const bindings = t.mock.method(controller, 'fillSettings');
    window.addEventListener('presetLoaded', event => {
        if (event instanceof CustomEvent) events.push(event);
    });
    let response: unknown = { data: createDefaultConfig() };
    let status = 200;
    t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
        assert.equal(url, '/preset/user/review-id');
        assert.equal(options.method ?? 'GET', 'GET');
        return new Response(JSON.stringify(response), { status });
    });
    t.mock.method(console, 'error', () => {});
    t.mock.method(manager.modalManager, 'createMessageBox', (_id: string, message: string) => messages.push(message));
    for (const file of ['BNPL_Rei_2_0.json', 'My new loadout.json', 'Vonamorio_BNPL.json']) {
        const input: unknown = JSON.parse(await readFile(new URL(`./fixtures/legacy/${file}`, import.meta.url), 'utf8'));
        response = { data: input };
        await manager._loadPreset('review-id', 'user', file, '2');
        assert.deepEqual(state.config, normalizeImport(input).config);
        assert.deepEqual(state.baseConfig, state.config);
        assert.equal(state.document.source, 'server');
        assert.equal(state.document.serverId, 'review-id');
        assert.equal(state.document.version, '2');
        assert.equal(name.value, file);
        assert.equal(events.at(-1)?.type, 'presetLoaded');
        assert.deepEqual(events.at(-1)?.detail.preset, state.config);
    }
    assert.equal(bindings.mock.callCount(), 3);
    const before = { config: state.config, base: state.baseConfig, document: state.document, name: name.value };
    for (const invalid of [{ data: { ...createDefaultConfig(), PistolSpawnChance: 101 } }, { error: 'Missing preset' }, null]) {
        response = invalid;
        await manager._loadPreset('review-id', 'user', 'Invalid', '3');
        assert.equal(state.config, before.config);
        assert.equal(state.baseConfig, before.base);
        assert.equal(state.document, before.document);
        assert.equal(name.value, before.name);
        assert.equal(events.length, 3);
    }
    assert.ok(messages.some(message => message.includes('PistolSpawnChance')));
    status = 500;
    await manager._loadPreset('review-id', 'user', 'Failure', '3');
    assert.equal(state.config, before.config);
    assert.equal(bindings.mock.callCount(), 3);
});
