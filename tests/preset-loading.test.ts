import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AppState } from '../src/js/state.ts';
import { createDefaultConfig } from '../src/model/config.ts';
import { normalizeImport } from '../src/model/importing.ts';

// Execute the actual JS adapter without declaring its deferred implementation typed.
// Only its transport origin changes; every fetch is replaced by a local response.
async function presetLoader(): Promise<(this: unknown, id: string, type: string, name: string, version: string) => Promise<void>> {
    const url = new URL('../src/js/presets/presetsManager.js', import.meta.url);
    const rest = (await readFile(new URL('../src/js/restCalls.js', import.meta.url), 'utf8'))
        .replace('import.meta.env.VITE_RESTUrl', JSON.stringify('https://local.test'));
    const encoded = (text: string) => `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
    const source = (await readFile(url, 'utf8')).replace(/from '([^']+)'/g, (_match: string, path: string) =>
        `from '${path.endsWith('/restCalls.js') ? encoded(rest) : new URL(path, url).href}'`);
    const module: unknown = await import(encoded(source));
    assert.ok(module && typeof module === 'object' && 'PresetsManager' in module && typeof module.PresetsManager === 'function');
    const prototype: unknown = module.PresetsManager.prototype;
    assert.ok(prototype && typeof prototype === 'object' && '_loadPreset' in prototype && typeof prototype._loadPreset === 'function');
    const load = prototype._loadPreset;
    return async function (id, type, name, version) { await load.call(this, id, type, name, version); };
}

test('PresetsManager loads all 13 fields and metadata via real REST adapter; malformed and failed responses are atomic', async t => {
    const load = await presetLoader();
    const state = new AppState();
    const messages: string[] = [];
    const events: CustomEvent<{ preset: unknown }>[] = [];
    const name = { value: 'Previous name' };
    let bindings = 0;
    let response: unknown = { data: createDefaultConfig() };
    let status = 200;
    t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
        assert.equal(url, 'https://local.test/preset/user/review-id');
        assert.equal(options.method ?? 'GET', 'GET');
        return new Response(JSON.stringify(response), { status });
    });
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    Object.defineProperty(globalThis, 'document', { configurable: true, value: { getElementById: (id: string) => id === 'config_name' ? name : null } });
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { dispatchEvent: (event: CustomEvent<{ preset: unknown }>) => events.push(event) } });
    t.after(() => {
        for (const [key, descriptor] of [['document', originalDocument], ['window', originalWindow]] as const) {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor);
            else Reflect.deleteProperty(globalThis, key);
        }
    });
    t.mock.method(console, 'error', () => {});
    const receiver = {
        state,
        chancesCtrl: { fillSettings: (settings: ReturnType<AppState['getChancesSettings']>) => { bindings++; assert.equal(settings.pistol, state.config.PistolSettings); } },
        modalManager: { createMessageBox: (_id: string, message: string) => messages.push(message) },
    };
    for (const file of ['BNPL_Rei_2_0.json', 'My new loadout.json', 'Vonamorio_BNPL.json']) {
        const input: unknown = JSON.parse(await readFile(new URL(`./fixtures/legacy/${file}`, import.meta.url), 'utf8'));
        response = { data: input };
        await load.call(receiver, 'review-id', 'user', file, '2');
        assert.deepEqual(state.config, normalizeImport(input).config);
        assert.deepEqual(state.baseConfig, state.config);
        assert.equal(state.document.source, 'server');
        assert.equal(state.document.serverId, 'review-id');
        assert.equal(state.document.version, '2');
        assert.equal(name.value, file);
        assert.equal(events.at(-1)?.type, 'presetLoaded');
        assert.deepEqual(events.at(-1)?.detail.preset, state.config);
    }
    assert.equal(bindings, 3);
    const before = { config: state.config, base: state.baseConfig, document: state.document, name: name.value };
    for (const invalid of [{ data: { ...createDefaultConfig(), PistolSpawnChance: 101 } }, { error: 'Missing preset' }, null]) {
        response = invalid;
        await load.call(receiver, 'review-id', 'user', 'Invalid', '3');
        assert.equal(state.config, before.config);
        assert.equal(state.baseConfig, before.base);
        assert.equal(state.document, before.document);
        assert.equal(name.value, before.name);
        assert.equal(events.length, 3);
    }
    assert.ok(messages.some(message => message.includes('PistolSpawnChance')));
    status = 500;
    await load.call(receiver, 'review-id', 'user', 'Failure', '3');
    assert.equal(state.config, before.config);
    assert.equal(bindings, 3);
});
