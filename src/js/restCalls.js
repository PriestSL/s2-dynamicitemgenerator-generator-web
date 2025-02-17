export async function fetchHeaders() {
    try {
        const response = await fetch(`${process.env.RESTUrl}/headers`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const headers = await response.json();
        return headers;
    } catch (error) {
        console.error('Error fetching headers:', error);
    }
}