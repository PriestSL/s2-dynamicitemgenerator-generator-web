import { createLoadout } from './textGenerators.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { downloadPackage } from './restCalls.js';

const useRESTPacking = true;

export const generateConfig = async (appState)=>{
    if (!appState) {
        console.error('AppState is required for generateConfig function');
        return;
    }
    
    let cArmorGenerators = "";
    let response = await createLoadout(appState);
    if (response){
        cArmorGenerators = response;
    }

    if (!useRESTPacking){
        let zipName = document.getElementById('config_name').value || 'Stalker2Loadout';
        zipName = zipName.replace(/\s/g, '');
        let zip = new JSZip();
        zip.file("Stalker2/Content/GameLite/GameData/ItemGeneratorPrototypes/New_NPC_Loadouts.cfg", cArmorGenerators);
        zip.generateAsync({type:"blob"})
        .then(function(content) {
            saveAs(content, `zzzz_${zipName}_P.zip`);
        });
    }else {
        let fileName = document.getElementById('config_name').value || 'Stalker2Loadout';
        fileName = fileName.replace(/\s/g, '');
        const { blob, resultFileName, error } = await downloadPackage(fileName, cArmorGenerators);
        if (error) {
            console.error(error);
            return;
        }
        saveAs(blob, resultFileName || `zzzz_${fileName}_P.pak`);
    }
}

