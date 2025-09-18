const RESTUrl = `${import.meta.env.VITE_RESTUrl}`;

// Helper function for fetch calls to reduce code duplication
async function fetchData(url, options = {}) {
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
        return { error: error.message };
    }
}

/**
 * Fetch data from REST that returns a ReadableStream (binary file)
 * @param {string} url
 * @param {object} options fetch options
 * @param {(progress:number)=>void} onProgress (optional) прогрес 0..1
 * @returns {Promise<{blob:Blob,fileName:string}|{error:string}>}
 */
async function fetchDownloadableData(url, options = {}, onProgress) {
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
            if (match) {
                try {
                    fileName = decodeURIComponent(match[1].replace(/"/g, ''));
                } catch {
                    fileName = match[1];
                }
            }
        }

        // Якщо не потрібен прогрес — можна просто:
        // const blob = await response.blob(); return { blob, fileName };

        const contentLength = Number(response.headers.get('Content-Length')) || 0;

        if (!response.body || !response.body.getReader) {
            const blob = await response.blob();
            return { blob, fileName };
        }

        const reader = response.body.getReader();
        const chunks = [];
        let received = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
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
        return { error: error.message };
    }
}

export async function fetchHeaders() {
    return fetchData(`${RESTUrl}/headers`);
}

export async function getPreset(id, type) {
    return fetchData(`${RESTUrl}/preset/${type}/${id}`);
}

export async function checkPin(id, pin) {
    return fetchData(`${RESTUrl}/checkPin/${id}/${pin}`);
}

export async function createPreset(presetData) {
    return fetchData(`${RESTUrl}/create`, {
        method: 'POST',
        body: JSON.stringify(presetData)
    });
}

export async function updatePreset(id, presetData) {
    return fetchData(`${RESTUrl}/update/${id}`, {
        method: 'POST',
        body: JSON.stringify(presetData)
    });
}

export async function deletePreset(id, pin) {
    return fetchData(`${RESTUrl}/delete/${id}`, {
        method: 'POST',
        body: JSON.stringify({ pin })
    });
}

/**
 * Створення .pak файлу на сервері. Повертає stream для завантаження
 * @param {string} name назва файлу 
 * @param {string} data структура файлів та їх вміст
 */
export async function downloadPackage(name, data){
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