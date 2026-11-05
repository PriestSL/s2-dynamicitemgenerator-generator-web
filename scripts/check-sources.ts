import { readdirSync, readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import ts from 'typescript';
import { JSDOM } from 'jsdom';

const root = process.cwd();
// Only dependency, Git and generated output/cache directories are exempt.
const exempt = new Set(['node_modules', '.git', 'dist', '.npm-cache']);
const files: string[] = [];
function walk(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (directory === root && exempt.has(entry.name)) continue;
        const path = resolve(directory, entry.name);
        if (entry.isDirectory()) walk(path);
        else files.push(path);
    }
}
walk(root);
const checked = new Set<string>();
for (const config of ['tsconfig.json', 'tsconfig.tests.json', 'tsconfig.tooling.json']) {
    const path = resolve(root, config);
    const loaded = ts.readConfigFile(path, ts.sys.readFile);
    if (loaded.error) throw new Error(ts.flattenDiagnosticMessageText(loaded.error.messageText, '\n'));
    const parsed = ts.parseJsonConfigFileContent(loaded.config, ts.sys, root);
    if (parsed.errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(parsed.errors, {
        getCanonicalFileName: name => name, getCurrentDirectory: () => root, getNewLine: () => '\n',
    }));
    if (!parsed.options.strict || parsed.options.allowJs || parsed.options.checkJs) throw new Error(`Invalid strict TS scope: ${config}`);
    for (const file of parsed.fileNames) checked.add(resolve(file));
}
const errors: string[] = [];
for (const file of files) {
    const name = relative(root, file);
    if (/\.(?:js|mjs|cjs|jsx)$/i.test(file)) errors.push(`Own JavaScript source: ${name}`);
    if (/\.(?:ts|mts|cts|tsx)$/i.test(file) && !checked.has(file)) errors.push(`Outside typecheck: ${name}`);
    if (/\.html?$/i.test(file)) {
        const dom = new JSDOM(readFileSync(file, 'utf8'));
        for (const node of dom.window.document.querySelectorAll('*')) {
            for (const attr of node.attributes) {
                if (/^on/i.test(attr.name) || /^\s*javascript:/i.test(attr.value)) errors.push(`Inline executable attribute: ${name}`);
            }
            if (node.tagName === 'SCRIPT' && node.textContent?.trim()
                && !['application/json', 'application/ld+json', 'importmap'].includes(node.getAttribute('type') ?? '')) {
                errors.push(`Inline script: ${name}`);
            }
        }
        dom.window.close();
    }
}
if (errors.length) throw new Error(errors.join('\n'));
console.log(`Source inventory passed: ${checked.size} TypeScript files; no own JavaScript or inline scripts.`);
