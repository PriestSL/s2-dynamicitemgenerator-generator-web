import { createLoadout } from './textGenerators.js';

export const generateConfig = async ()=>{
    let cArmorGenerators = "";
    let response = await createLoadout();
    if (response){
        cArmorGenerators = response;
    }

    let zipName = document.getElementById('config_name').value || 'Stalker2Loadout';
    zipName = zipName.replace(/\s/g, '');
    let zip = new JSZip();
    zip.file("Stalker2/Content/GameLite/GameData/ItemGeneratorPrototypes/New_NPC_Loadouts.cfg", cArmorGenerators);
    zip.generateAsync({type:"blob"})
    .then(function(content) {
        saveAs(content, `zzzz_${zipName}_1_P.zip`);
    });

}

