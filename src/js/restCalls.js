const RESTUrl = `https://${import.meta.env.VITE_RESTUrl}`;

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