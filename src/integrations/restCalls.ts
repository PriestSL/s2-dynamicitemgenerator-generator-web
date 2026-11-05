import { presetOperation } from '../compatibility/presetContracts.ts';
import type { LoadoutConfig } from '../model/types.ts';

export interface PresetWrite {
    name: string;
    author: string;
    description: string;
    data: LoadoutConfig;
    created: string;
    version: string;
    pin: string;
}

// Node contract tests use relative endpoints. Vite provides the configured origin.
const RESTUrl = import.meta.env ? `${import.meta.env.VITE_RESTUrl}` : '';

// Helper function for fetch calls to reduce code duplication
async function fetchData(url: string, options: RequestInit = {}): Promise<unknown> {
    try {
        const defaultOptions = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        };

        const response = await fetch(url, { ...defaultOptions, ...options });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching from ${url}:`, error);
        return { error: error instanceof Error ? error.message : String(error) };
    }
}

/**
 * Fetch data from REST that returns a ReadableStream (binary file)
 * @param {string} url
 * @param {object} options fetch options
 * @param {(progress:number)=>void} onProgress (optional) прогрес 0..1
 * @returns {Promise<{blob:Blob,fileName:string}|{error:string}>}
 */
async function fetchDownloadableData(url: string, options: RequestInit = {}, onProgress?: (progress: number) => void): Promise<{ blob: Blob; fileName: string } | { error: string }> {
    try {
        const defaultOptions = {
            headers: {
                'Accept': 'application/octet-stream',
                'Content-Type': 'application/json'
            },
        };

        const response = await fetch(url, { ...defaultOptions, ...options });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Отримати ім'я файлу з Content-Disposition (якщо сервер його виставив)
        let fileName = 'new_loadout.pak';
        const disposition = response.headers.get('Content-Disposition');
        if (disposition) {
            const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)/i);
            if (match?.[1]) {
                try {
                    fileName = decodeURIComponent(match[1].replace(/"/g, ''));
                } catch {
                    fileName = match[1];
                }
            }
        }

        const contentLength = Number(response.headers.get('Content-Length')) || 0;

        if (!response.body || !response.body.getReader) {
            const blob = await response.blob();
            return { blob, fileName };
        }

        const reader = response.body.getReader();
        const chunks: BlobPart[] = [];
        let received = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(new Uint8Array(value));
            received += value.length;
            if (onProgress && contentLength) {
                onProgress(received / contentLength);
            }
        }

        const blob = new Blob(chunks, { type: response.headers.get('Content-Type') || 'application/octet-stream' });
        if (onProgress && contentLength) onProgress(1);
        return { blob, fileName };

    } catch (error) {
        console.error(`Error fetching from ${url}:`, error);
        return { error: error instanceof Error ? error.message : String(error) };
    }
}

export async function fetchHeaders() {
    return fetchData(`${RESTUrl}/headers`);
}

export async function getPreset(id: string, type: string) {
    return fetchData(`${RESTUrl}/preset/${type}/${id}`);
}

export async function checkPin(id: string, pin: string) {
    return presetOperation(await fetchData(`${RESTUrl}/checkPin/${id}/${pin}`), 'flag');
}

export async function createPreset(presetData: PresetWrite) {
    return presetOperation(await fetchData(`${RESTUrl}/create`, {
        method: 'POST',
        body: JSON.stringify(presetData)
    }), 'id');
}

export async function updatePreset(id: string, presetData: PresetWrite) {
    return presetOperation(await fetchData(`${RESTUrl}/update/${id}`, {
        method: 'POST',
        body: JSON.stringify(presetData)
    }), 'flag');
}

export async function deletePreset(id: string, pin: string) {
    return presetOperation(await fetchData(`${RESTUrl}/delete/${id}`, {
        method: 'POST',
        body: JSON.stringify({ pin })
    }), 'flag');
}

/**
 * Створення .pak файлу на сервері. Повертає stream для завантаження
 * @param {string} name назва файлу
 * @param {string} data структура файлів та їх вміст
 */
export async function downloadPackage(name: string, data: string){
    const folderStruc = {
        Stalker2: {
            Content: {
                GameLite: {
                    GameData: {
                        ItemGeneratorPrototypes: {
                            'New_NPC_Loadouts.cfg': data
                        }
                    }
                }
            }
        }
    };

    return fetchDownloadableData(`${RESTUrl}/pack`, {
        method: 'POST',
        body: JSON.stringify({fileName: name, structure: folderStruc})
    });
}
