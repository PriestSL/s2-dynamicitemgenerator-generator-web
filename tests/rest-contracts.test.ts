import test from 'node:test';
import assert from 'node:assert/strict';
import * as rest from '../src/integrations/restCalls.ts';
import { createDefaultConfig } from '../src/model/config.ts';
import type { PresetWrite } from '../src/integrations/restCalls.ts';


test('REST preserves all preset endpoints, methods, PIN and complete write payload', async t => {
    const calls: { url: string; method: string; body: unknown }[] = [];
    const headers = { officialPresets: [], publicPresets: [] };
    t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
        assert.deepEqual(options.headers, { Accept: 'application/json', 'Content-Type': 'application/json' });
        calls.push({ url, method: options.method ?? 'GET', body: options.body ? JSON.parse(String(options.body)) : undefined });
        const response = url === '/headers' ? headers : { result: url === '/create' ? 'saved-id' : true };
        return new Response(JSON.stringify(response));
    });
    const data: PresetWrite = { name: 'Name', author: 'Author', description: 'Description',
        version: '1.2', created: '2026-10-30T00:00:00.000Z', pin: '00123456', data: createDefaultConfig() };
    assert.deepEqual(await rest.fetchHeaders(), headers);
    await rest.getPreset('id', 'official');
    await rest.getPreset('id', 'community');
    assert.deepEqual(await rest.checkPin('id', data.pin), { result: true });
    assert.deepEqual(await rest.createPreset(data), { result: 'saved-id' });
    assert.deepEqual(await rest.updatePreset('id', data), { result: true });
    assert.deepEqual(await rest.deletePreset('id', data.pin), { result: true });
    assert.deepEqual(calls, [
        { url: '/headers', method: 'GET', body: undefined },
        { url: '/preset/official/id', method: 'GET', body: undefined },
        { url: '/preset/community/id', method: 'GET', body: undefined },
        { url: '/checkPin/id/00123456', method: 'GET', body: undefined },
        { url: '/create', method: 'POST', body: data },
        { url: '/update/id', method: 'POST', body: data },
        { url: '/delete/id', method: 'POST', body: { pin: data.pin } },
    ]);
});

test('REST reports HTTP, network and invalid JSON errors without leaking unchecked fields', async t => {
    t.mock.method(console, 'error', () => {});
    const fetch = t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 403 }));
    assert.deepEqual(await rest.fetchHeaders(), { error: 'HTTP error! status: 403' });
    fetch.mock.mockImplementation(async () => { throw new Error('offline'); });
    assert.deepEqual(await rest.getPreset('id', 'community'), { error: 'offline' });
    fetch.mock.mockImplementation(async () => new Response('{invalid'));
    const invalid = await rest.fetchHeaders();
    assert.ok(invalid && typeof invalid === 'object' && 'error' in invalid && typeof invalid.error === 'string');
});
