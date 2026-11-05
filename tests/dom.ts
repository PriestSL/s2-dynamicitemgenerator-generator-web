import { JSDOM } from 'jsdom';
import { installBootstrap } from '../src/ui/bootstrap.ts';

/** Real DOM and real Bootstrap, with no network or server writes. */
export async function setupDOM(): Promise<JSDOM> {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
    for (const key of ['window', 'document', 'Element', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement', 'HTMLButtonElement', 'Node', 'Event', 'CustomEvent', 'KeyboardEvent', 'MouseEvent', 'ShadowRoot', 'FileReader'] as const) {
        Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
    }
    Object.defineProperty(globalThis, 'getComputedStyle', { configurable: true, value: dom.window.getComputedStyle.bind(dom.window) });
    // Node resolves Bootstrap's CommonJS entry; Vite uses its ESM entry.
    installBootstrap((await import('bootstrap')).default);
    return dom;
}
