// Boundary between the file workflow and the configured REST transport.
// Treat its result as external data, including the actual fileName property.
export type PackageTransport = (name: string, cfg: string) => Promise<unknown>;
export interface PackageDownload { blob: Blob; fileName: string }

let transport: PackageTransport | undefined;
export function setPackageTransport(download: PackageTransport): void { transport = download; }

export function readPackageDownload(value: unknown): PackageDownload {
    if (!value || typeof value !== 'object') throw new Error('Invalid package response');
    if ('error' in value) throw new Error(typeof value.error === 'string' ? value.error : 'Invalid package error');
    if (!('blob' in value) || !(value.blob instanceof Blob) || !('fileName' in value) || typeof value.fileName !== 'string') {
        throw new Error('Invalid package response');
    }
    return { blob: value.blob, fileName: value.fileName };
}

export async function downloadPackage(name: string, cfg: string): Promise<unknown> {
    if (!transport) throw new Error('Package transport is not configured');
    return transport(name, cfg);
}
