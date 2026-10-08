/** Browser-only delivery. Serialization and packaging never access the DOM. */
export function saveBlob(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    try {
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
    } finally {
        link.remove();
        URL.revokeObjectURL(url);
    }
}
