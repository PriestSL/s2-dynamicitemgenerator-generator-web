import { readFile } from 'node:fs/promises';
import { AppState } from '../src/js/state.js';
import { chancesController } from '../src/js/chances.js';

export const fixtureText = async name => (await readFile(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
export const fixture = async name => JSON.parse(await fixtureText(`${name}.json`));
export function editor(data) {
    const state = new AppState();
    if (data) state.importState(structuredClone(data));
    const controller = new chancesController();
    controller.fillSettings(state.getChancesSettings());
    controller.typeToTable = state.typeToTable;
    return { state, controller };
}

// Only the DOM surface exercised by these handlers/renderers; no layout or browser emulation.
export function installDOM(t) {
    const elements = [];
    const labels = new Map();
    function createElement(tagName) {
        const listeners = new Map();
        const classes = new Set();
        const element = {
            tagName, dataset: {}, children: [], value: '', textContent: '',
            classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)), contains: n => classes.has(n) },
            appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
            setAttribute(name, value) { this[name] = value; },
            removeAttribute(name) { delete this[name]; },
            getAttribute(name) { return this[name] ?? null; },
            addEventListener(name, fn) { listeners.set(name, [...(listeners.get(name) || []), fn]); },
            dispatch(name, target = this) { for (const fn of listeners.get(name) || []) fn({ target }); },
            click() {},
        };
        elements.push(element);
        return element;
    }
    const document = {
        createElement,
        createTextNode: textContent => ({ textContent }),
        getElementById(id) {
            if (!labels.has(id)) labels.set(id, { textContent: '' });
            return labels.get(id);
        },
        querySelector: () => null,
    };
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
    Object.defineProperty(globalThis, 'document', { configurable: true, value: document });
    t.after(() => {
        if (previous) Object.defineProperty(globalThis, 'document', previous);
        else delete globalThis.document;
    });
    return { document, elements, labels };
}
