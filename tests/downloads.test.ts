import test from 'node:test';
import assert from 'node:assert/strict';
import { downloadPackage as restDownload } from '../src/integrations/restCalls.ts';
import JSZip from 'jszip';
import { AppState } from '../src/js/state.ts';
import { generateConfig } from '../src/js/fileStreamGenerator.ts';
import type { DownloadPorts } from '../src/js/fileStreamGenerator.ts';
import { generateLoadout } from '../src/generator/loadout.ts';
import { packZip, CFG_PATH } from '../src/files/zip.ts';
import { setPackageTransport, downloadPackage } from '../src/files/packageTransport.ts';
import { createDownloadAction } from '../src/ui/downloads.ts';
import type { DownloadStatus } from '../src/ui/downloads.ts';
import { editedConfig } from './fixtures.ts';

test('real ZIP entry awaits packing and contains exactly the generated CFG at the game path', async () => {
    const state = new AppState();
    state.importState(editedConfig());
    let saved: { blob: Blob; name: string } | undefined;
    const ports: DownloadPorts = {
        zip: packZip,
        package: async () => { throw new Error('Unexpected REST'); },
        save: (blob, name) => { saved = { blob, name }; },
    };
    await generateConfig(state, false, ' Review loadout ', ports);
    assert.ok(saved, 'generateConfig must resolve only after save');
    assert.equal(saved.name, '_Reviewloadout_1_P.zip');
    const restored = await JSZip.loadAsync(await saved.blob.arrayBuffer());
    assert.deepEqual(Object.values(restored.files).filter(file => !file.dir).map(file => file.name), [CFG_PATH]);
    const file = restored.file(CFG_PATH);
    assert.ok(file);
    assert.equal(await file.async('string'), generateLoadout(state.config));
    await generateConfig(state, false, '   ', ports);
    assert.equal(saved?.name, '_Stalker2Loadout_1_P.zip');
});

test('ZIP failure propagates, invalid config stops before packing or saving, and empty CFG is rejected', async () => {
    const state = new AppState();
    let calls = 0;
    const ports: DownloadPorts = {
        zip: async () => { calls++; throw new Error('Compression failed'); },
        package: async () => { calls++; throw new Error('Unexpected REST'); },
        save: () => { throw new Error('Unexpected save'); },
    };
    await assert.rejects(generateConfig(state, false, 'Broken', ports), /Compression failed/);
    assert.equal(calls, 1);
    state.modifiedPistolSpawnChance = 101;
    for (const rest of [false, true]) await assert.rejects(generateConfig(state, rest, 'Broken', ports), /Maximum is 100/);
    assert.equal(calls, 1);
    await assert.rejects(packZip('  '), /empty CFG/);
});

test('download action stays pending through packing, suppresses duplicates, shows errors and permits retry', async () => {
    let complete: () => void = () => { throw new Error('Not started'); };
    let calls = 0;
    let fail = false;
    const statuses: DownloadStatus[] = [];
    const run = createDownloadAction(async (rest, name) => {
        assert.equal(rest, false);
        assert.equal(name, 'Test');
        calls++;
        if (fail) throw new Error('Packing failed');
        await new Promise<void>(resolve => { complete = resolve; });
    }, status => statuses.push(status));
    const first = run(false, 'Test');
    assert.deepEqual(statuses, [{ pending: true, message: 'Preparing ZIP…', error: false }]);
    await run(true, 'Duplicate');
    assert.equal(calls, 1);
    complete();
    await first;
    assert.equal(statuses.at(-1)?.message, 'Download started.');
    fail = true;
    await run(false, 'Test');
    assert.deepEqual(statuses.at(-1), { pending: false, message: 'Packing failed', error: true });
    fail = false;
    const retry = run(false, 'Test');
    complete();
    await retry;
    assert.equal(calls, 3);
    assert.equal(statuses.at(-1)?.error, false);
});


test('PAK compatibility preserves POST endpoint, name, structure, CFG and existing fallback filename', async t => {
    setPackageTransport(restDownload);
    const state = new AppState();
    state.importState(editedConfig());
    const cfg = generateLoadout(state.config);
    t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
        assert.equal(url, '/pack');
        assert.equal(options.method, 'POST');
        assert.equal(typeof options.body, 'string');
        assert.deepEqual(JSON.parse(String(options.body)), {
            fileName: 'Myloadout', structure: { Stalker2: { Content: { GameLite: { GameData: {
                ItemGeneratorPrototypes: { 'New_NPC_Loadouts.cfg': cfg },
            } } } } },
        });
        assert.deepEqual(options.headers, { Accept: 'application/octet-stream', 'Content-Type': 'application/json' });
        return new Response('packed bytes', { headers: { 'Content-Disposition': 'attachment; filename="server-name.pak"' } });
    });
    let saved = false;
    const ports: DownloadPorts = {
        package: downloadPackage, zip: async () => { throw new Error('Unexpected ZIP'); },
        save: (blob, name) => { saved = true; assert.equal(name, 'Myloadout.pak'); assert.equal(blob.size, 12); },
    };
    await generateConfig(state, undefined, 'My loadout', ports);
    assert.ok(saved);
});

test('PAK errors and malformed legacy results cannot reach save', async t => {
    setPackageTransport(restDownload);
    t.mock.method(console, 'error', () => {});
    const fetch = t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 500 }));
    const state = new AppState();
    const ports: DownloadPorts = {
        package: downloadPackage, zip: packZip, save: () => { throw new Error('Unexpected save'); },
    };
    await assert.rejects(generateConfig(state, true, 'Test', ports), /HTTP error! status: 500/);
    fetch.mock.mockImplementation(async () => { throw new Error('Network failed'); });
    await assert.rejects(generateConfig(state, true, 'Test', ports), /Network failed/);
    for (const value of [null, {}, { blob: 'bad', fileName: 'x' }, { blob: new Blob(), resultFileName: 'x' }, { error: 42 }]) {
        await assert.rejects(generateConfig(state, true, 'Test', { ...ports, package: async () => value }), /Invalid package/);
    }
});
