import { generateLoadout } from '../generator/loadout.ts';
import { packZip } from '../files/zip.ts';
import { saveBlob } from '../files/browser.ts';
import { downloadPackage, readPackageDownload } from '../files/packageTransport.ts';
import type { PackageTransport } from '../files/packageTransport.ts';
import type { AppState } from './state.ts';

export interface DownloadPorts {
    zip: (cfg: string) => Promise<Blob>;
    package: PackageTransport;
    save: (blob: Blob, name: string) => void;
}
const browserPorts: DownloadPorts = { zip: packZip, package: downloadPackage, save: saveBlob };

/** Compatible AppState / packing-mode entry; the caller now supplies the name. */
export async function generateConfig(
    state: AppState, useRESTPacking = true, name = 'Stalker2Loadout', ports: DownloadPorts = browserPorts,
): Promise<void> {
    const cfg = generateLoadout(state.config);
    const fileName = name.replace(/\s/g, '') || 'Stalker2Loadout';
    if (!useRESTPacking) {
        const blob = await ports.zip(cfg);
        ports.save(blob, `_${fileName}_1_P.zip`);
    } else {
        const result = readPackageDownload(await ports.package(fileName, cfg));
        // Preserve F15's existing fallback name until the network workflow is reviewed.
        // restCalls returns fileName; the old consumer read nonexistent resultFileName.
        ports.save(result.blob, `${fileName}.pak`);
    }
}
