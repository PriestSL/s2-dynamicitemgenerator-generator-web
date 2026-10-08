import JSZip from 'jszip';

export const CFG_PATH = 'Stalker2/Content/GameLite/GameData/ItemGeneratorPrototypes/New_NPC_Loadouts.cfg';

export async function packZip(cfg: string): Promise<Blob> {
    if (!cfg.trim()) throw new Error('Cannot package an empty CFG');
    const zip = new JSZip();
    zip.file(CFG_PATH, cfg);
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });
    return new Blob([buffer], { type: 'application/zip' });
}
