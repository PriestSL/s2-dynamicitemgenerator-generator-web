import { createLoadout } from './textGenerators.js';

export const generateConfig = async ()=>{
    let cArmorGenerators = "";
    let response = await createLoadout();
    if (response){
        cArmorGenerators = response;
    }

    let zip = new JSZip();
    zip.file("Stalker2/Content/GameLite/GameData/ItemGeneratorPrototypes/DynamicItemGenerator.cfg", cArmorGenerators);
    zip.generateAsync({type:"blob"})
    .then(function(content) {
        saveAs(content, "Stalker2Loadout.zip");
    });

}

