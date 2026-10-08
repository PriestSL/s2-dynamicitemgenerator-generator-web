import type { AppState } from '../js/state.ts';
import type { generateConfig } from '../js/fileStreamGenerator.ts';

export interface DownloadStatus { pending: boolean; message: string; error: boolean }

export function createDownloadAction(
    generate: (useREST: boolean, name: string) => Promise<void>,
    update: (status: DownloadStatus) => void,
): (useREST: boolean, name: string) => Promise<void> {
    let pending = false;
    return async (useREST, name) => {
        if (pending) return;
        pending = true;
        update({ pending, message: useREST ? 'Preparing PAK…' : 'Preparing ZIP…', error: false });
        try {
            await generate(useREST, name);
            update({ pending: false, message: 'Download started.', error: false });
        } catch (error) {
            update({ pending: false, message: error instanceof Error ? error.message : String(error), error: true });
        } finally {
            pending = false;
        }
    };
}

export function bindDownloads(state: AppState, generate: typeof generateConfig): void {
    const zip = document.getElementById('btn_save_zip');
    const pak = document.getElementById('btn_save');
    const name = document.getElementById('config_name');
    if (!(zip instanceof HTMLButtonElement) || !(pak instanceof HTMLButtonElement) || !(name instanceof HTMLInputElement)) return;
    const status = document.createElement('div');
    status.id = 'download_status';
    status.className = 'small px-3';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    document.getElementById('toolbar')?.parentElement?.after(status);
    const run = createDownloadAction((useREST, fileName) => generate(state, useREST, fileName), value => {
        zip.disabled = pak.disabled = value.pending;
        zip.setAttribute('aria-busy', String(value.pending));
        pak.setAttribute('aria-busy', String(value.pending));
        status.textContent = value.message;
        status.classList.toggle('text-danger', value.error);
    });
    zip.addEventListener('click', () => { void run(false, name.value); });
    pak.addEventListener('click', () => { void run(true, name.value); });
}
