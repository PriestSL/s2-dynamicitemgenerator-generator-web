import type { AppState } from '../js/state.ts';
import { parseConfig, serializeConfig } from '../model/validation.ts';
import { saveBlob } from './browser.ts';

export function importJSONText(state: AppState, text: string, render: () => void): void {
    const config = parseConfig(text);
    state.importState(config);
    render();
}
export function chooseJSON(state: AppState, render: () => void, message: (id: string, text: string) => void): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.hidden = true;
    input.oncancel = () => input.remove();
    input.onchange = () => {
        const file = input.files?.[0];
        input.remove();
        if (!file) return;
        const reader = new FileReader();
        reader.onerror = () => message('configImportError', 'Unable to read the file.');
        reader.onload = () => {
            try {
                if (typeof reader.result !== 'string') throw new Error('Expected a text file');
                importJSONText(state, reader.result, render);
                message('configImportSuccess', 'Configuration imported successfully!');
            } catch (error) {
                message('configImportError', error instanceof Error ? error.message : String(error));
            }
        };
        reader.readAsText(file);
    };
    document.body.appendChild(input);
    try {
        input.click();
    } catch (error) {
        input.remove();
        message('configImportError', error instanceof Error ? error.message : String(error));
    }
}
export function downloadJSON(state: AppState, name: string): void {
    const blob = new Blob([serializeConfig(state.config)], { type: 'application/json' });
    saveBlob(blob, `${name || 'config'}.json`);
}
