import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

test('source inventory rejects JS, uncovered TS and executable HTML outside src', () => {
    const prefix = join(tmpdir(), 's2-source-inventory-');
    const root = mkdtempSync(prefix);
    if (!resolve(root).startsWith(resolve(prefix))) throw new Error('Unsafe temporary cleanup path');
    try {
        for (const name of ['tsconfig.json', 'tsconfig.tests.json', 'tsconfig.tooling.json']) {
            writeFileSync(join(root, name), JSON.stringify({ compilerOptions: { strict: true }, files: ['covered.ts'] }));
        }
        writeFileSync(join(root, 'covered.ts'), 'export {};');
        const script = fileURLToPath(new URL('../scripts/check-sources.ts', import.meta.url));
        const run = () => spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
        assert.equal(run().status, 0);
        for (const [name, source, diagnostic] of [
            ['old.mjs', 'export {};', 'Own JavaScript source'],
            ['forgotten.ts', 'export {};', 'Outside typecheck'],
            ['page.html', '<script>alert(1)</script>', 'Inline script'],
            ['page.html', '<button onclick="alert(1)">Run</button>', 'Inline executable attribute'],
        ]) {
            assert.ok(name && source && diagnostic);
            const path = join(root, name);
            writeFileSync(path, source);
            const result = run();
            assert.notEqual(result.status, 0);
            assert.ok(result.stderr.includes(diagnostic), result.stderr);
            rmSync(path);
        }
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
