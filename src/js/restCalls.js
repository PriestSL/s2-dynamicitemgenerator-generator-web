export async function fetchHeaders() {
    try {
        const response = await fetch(`${import.meta.env.RESTUrl}/headers`, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const headers = await response.json();
        return headers;
    } catch (error) {
        console.error('Error fetching headers:', error);
    }
}