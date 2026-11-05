import test from 'node:test';
import assert from 'node:assert/strict';
import { presetHeaders, presetOperation, unavailablePresetUpdate } from '../src/compatibility/presetContracts.ts';

test('server headers validate each rendered field before DOM use', () => {
    const entry = { _id: 'id', name: '<img>', version: '1.0', author: 'User', views: 2 };
    assert.deepEqual(presetHeaders({ officialPresets: [entry], publicPresets: [] }).officialPresets, [entry]);
    for (const value of [null, [], { officialPresets: {} }, { error: 'offline' },
        ...[{ _id: 1 }, { name: {} }, { author: [] }, { views: Infinity }, { version: 1 }]
            .map(change => ({ publicPresets: [{ ...entry, ...change }] }))]) {
        assert.throws(() => presetHeaders(value));
    }
});

test('operation DTOs reject malformed responses and preserve boolean result semantics', () => {
    for (const result of [true, false]) assert.deepEqual(presetOperation({ result }, 'flag'), { result });
    assert.deepEqual(presetOperation({ result: 'inserted-id' }, 'id'), { result: 'inserted-id' });
    assert.ok(presetOperation({ result: true }, 'id').error);
    assert.ok(presetOperation({ result: 'true' }, 'flag').error);
    assert.deepEqual(presetOperation({ error: 'PIN mismatch' }, 'flag'), { error: 'PIN mismatch' });
    for (const value of [null, [], {}, { result: {} }, { error: 42 }]) assert.ok(presetOperation(value, 'flag').error);
    // The legacy UI treats a response without error as success, even result:false.
    assert.equal(presetOperation({ result: false }, 'flag').error, undefined);
});

test('hidden Update action preserves the missing legacy handler failure', () => {
    assert.throws(unavailablePresetUpdate, { name: 'TypeError', message: 'this.handleUpdatePreset is not a function' });
});
