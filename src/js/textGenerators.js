import * as config from './configs.js';
import {modifiedPistolSpawnChance, modifiedWeaponSettings, modifiedArmorSettings, modifiedWeaponList, modifiedAmmoByWeaponClass, modifiedGrenadeSettings, modsCompatibility, modifiedDropConfigs, modifiedArmorSpawnSettings, modifiedHelmetSpawnSettings, modifiedPistolSettings} from './app.js';

var oArmorLoadoutSettings;
var oWeaponLoadoutSettings;
var oWeaponList;
const oSecondaryLoadoutSettings = config.oSecondaryLoadoutSettings;
var oAmmoByWeaponClass;
const nMinWeaponDurability = config.nMinWeaponDurability;
const nMaxWeaponDurability = config.nMaxWeaponDurability;


let ranks = ['Newbie', 'Experienced', 'Veteran', 'Master'];

const createArmorItemGenerator = (cArmorName)=>{
    //TODO Lootable chances by player rank
    const createLootable = ()=>
    `            [1] : struct.begin
               ItemPrototypeSID = ${modifiedArmorSpawnSettings[cArmorName].dropItem || cArmorName}
               MinDurability = ${modifiedDropConfigs.nMinDurability}
               MaxDurability = ${modifiedDropConfigs.nMaxDurability}
               Chance = ${modifiedDropConfigs.nLootChance}
            struct.end`;

    const createHelmet = ()=>{
        const armorSettins = modifiedArmorSpawnSettings[cArmorName];
        if (!armorSettins.helmetSpawn && !modsCompatibility.SHA) return '';
        const cHelmet = modifiedArmorSpawnSettings[cArmorName].helmet;
        const oHelmet = modifiedHelmetSpawnSettings[cHelmet];

        if (!oHelmet) return '';

        let cRet = '';
        for (let i = 0; i<4; i++){
            let helmetChance = armorSettins.helmetSpawn || oHelmet[i] || 100;
            cRet +=`      [*] : struct.begin\n`;
            cRet +=`         Category = EItemGenerationCategory::Head\n`;
            cRet +=`         PlayerRank = ERank::${ranks[i]}\n`;
            cRet +=`         PossibleItems : struct.begin\n`;
            cRet +=`            [0] : struct.begin\n`;
            cRet +=`               ItemPrototypeSID = ${cHelmet}\n`;
            cRet +=`               Chance = ${helmetChance / 100 }\n`;
            cRet +=`            struct.end\n`;
            cRet +=`         struct.end\n`;
            cRet +=`      struct.end\n`;
        }

        return cRet;
    }



    return `${cArmorName}_Kit : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}
   SID = General${cArmorName}
   ItemGenerator : struct.begin
      [*] : struct.begin
         Category = EItemGenerationCategory::BodyArmor
         PossibleItems : struct.begin
            [0] : struct.begin
               ItemPrototypeSID = ${cArmorName}
               Chance = 1
            struct.end
${modifiedDropConfigs.createDroppableArmor && modifiedArmorSpawnSettings[cArmorName].drop ? createLootable() : ''}
         struct.end
      struct.end
${createHelmet()}
   struct.end
struct.end\n`;
};

const prepareArmorStruct = (oArmor)=>{
    let oPrepared = {};
    for (let faction in oArmor){
        oPrepared[faction] = {};
        for (let i = 0; i < ranks.length; i++){
            oPrepared[faction][ranks[i]] = {};
            for (let armor in oArmor[faction]){
                oPrepared[faction][ranks[i]][armor] = oArmor[faction][armor][i];
            }
        }
    }

    return oPrepared;

};

const createArmorLoadoutGenerators = ()=>{
    let oPrepared = prepareArmorStruct(oArmorLoadoutSettings);

    let cArmorGenerators = '';
    for (let faction in oPrepared){
        cArmorGenerators += `${faction}_Armor_Override : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}
   SID = ${faction}_Armor 
   ItemGenerator : struct.begin\n`;
        for (let rank in oPrepared[faction]){
            cArmorGenerators += `      [*] : struct.begin
         Category = EItemGenerationCategory::SubItemGenerator
         PlayerRank = ERank::${rank}
         PossibleItems : struct.begin\n`;
            let iterator = 0;
            for (let armor in oPrepared[faction][rank]){
                if (oPrepared[faction][rank][armor] === 0){
                    continue;
                }
                cArmorGenerators += `            [${iterator}] : struct.begin
               ItemGeneratorPrototypeSID = General${armor}
               Weight = ${oPrepared[faction][rank][armor]}
            struct.end\n`;
                iterator++;
            }
            cArmorGenerators += `         struct.end
      struct.end\n`;
        }
        cArmorGenerators += `   struct.end
struct.end\n`;
    }
    return cArmorGenerators;
}

const createWeaponStruct = (oWeapon, faction)=>{
    let cRet = '';
    let iterator = 0;
    for (let weapon in oWeapon){
        let weaponClass = weapon.substring(weapon.length - 2);
        if (oWeapon[weapon] === 0){
            continue;
        }
        cRet += `            [${iterator}] : struct.begin\n`;
        cRet += `               ItemPrototypeSID = ${(faction.substring(0, 8) == 'GuardNPC'? 'Guard':'') + weapon}\n`;
        cRet += `               Weight = ${oWeapon[weapon]}\n`;
        cRet += `               MinDurability = ${nMinWeaponDurability}\n`;
        cRet += `               MaxDurability = ${nMaxWeaponDurability}\n`;
        cRet += `               AmmoMinCount = ${oWeaponList[weapon].minAmmo ? oWeaponList[weapon].minAmmo : oAmmoByWeaponClass[weaponClass][0]}\n`;
        cRet += `               AmmoMaxCount = ${oWeaponList[weapon].maxAmmo ? oWeaponList[weapon].maxAmmo : oAmmoByWeaponClass[weaponClass][1]}\n`;
        cRet += `            struct.end\n`;
        iterator++;
    }
    return cRet;
};

const createPrimaryWeapons = (oWeapons, faction, clas)=>{
    if (!oWeapons || !oWeapons[faction] || !oWeapons[faction][clas]) return '';
    oWeapons = oWeapons[faction][clas];
    let cRet = '';

    for (let rank in oWeapons){
        cRet += `      [*] : struct.begin\n`;
        cRet += `         Category = EItemGenerationCategory::WeaponPrimary\n`;
        cRet += `         PlayerRank = ERank::${rank}\n`;
        cRet += `         PossibleItems : struct.begin\n`;
        cRet += createWeaponStruct(oWeapons[rank], faction);
        cRet += `         struct.end\n`;
        cRet += `      struct.end\n`;
    }

    return cRet;
};

const createSecondaryWeapons = (oWeapons, faction, clas)=>{
    if (!oWeapons || !oWeapons[faction] || !oWeapons[faction][clas]) return '';
    oWeapons = oWeapons[faction][clas];
    let cRet = '';

    for (let rank in oWeapons){
        cRet += `      [*] : struct.begin\n`;
        cRet += `         Category = EItemGenerationCategory::WeaponSecondary\n`;
        cRet += `         PlayerRank = ERank::${rank}\n`;
        cRet += `         PossibleItems : struct.begin\n`;
        cRet += createWeaponStruct(oWeapons[rank], faction);
        cRet += `         struct.end\n`;
        cRet += `      struct.end\n`;
    }

    return cRet;
};

const prepareWeaponStruct = (oWeapons)=>{
    let oPrepared = {};
    for (let faction in oWeapons){
        oPrepared[faction] = {};
        for (let clas in oWeapons[faction]){
            oPrepared[faction][clas] = {};
            for (let i = 0; i < ranks.length; i++){
                oPrepared[faction][clas][ranks[i]] = {};
                for (let weapon in oWeapons[faction][clas]){
                    oPrepared[faction][clas][ranks[i]][weapon] = oWeapons[faction][clas][weapon][i];
                }
            }
        }
    }

    return oPrepared;
};

const preparePistolStruct = (oPistols)=>{
    let oPrepared = {};
    for (let faction in oPistols){
        oPrepared[faction] = {};
        for (let i = 0; i < ranks.length; i++){
            oPrepared[faction][ranks[i]] = {};
            for (let pistol in oPistols[faction]){
                oPrepared[faction][ranks[i]][pistol] = oPistols[faction][pistol][i];
            }
        }
    }

    return oPrepared;
};

const createPistolsItemGenerators = ()=>{
    let oPrepared = preparePistolStruct(modifiedPistolSettings);

    let cPistolGenerators = '';

    for (let faction in oPrepared){
        cPistolGenerators += `${faction}_WeaponPistol_Override : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}\n`;
        cPistolGenerators += `   SID = ${faction}_WeaponPistol\n`;
        cPistolGenerators += `   ItemGenerator : struct.begin\n`;
        for (let rank in oPrepared[faction]){
            cPistolGenerators += `      [*] : struct.begin\n`;
            cPistolGenerators += `         Category = EItemGenerationCategory::WeaponSecondary\n`;
            cPistolGenerators += `         PlayerRank = ERank::${rank}\n`;
            cPistolGenerators += `         PossibleItems : struct.begin\n`;
            let iterator = 0;
            for (let pistol in oPrepared[faction][rank]){
                if (oPrepared[faction][rank][pistol] === 0){
                    continue;
                }
                cPistolGenerators += `            [${iterator}] : struct.begin\n`;
                cPistolGenerators += `               ItemPrototypeSID = ${pistol}\n`;
                cPistolGenerators += `               Weight = ${oPrepared[faction][rank][pistol]}\n`;
                cPistolGenerators += `               MinDurability = ${nMinWeaponDurability}\n`;
                cPistolGenerators += `               MaxDurability = ${nMaxWeaponDurability}\n`;
                cPistolGenerators += `               AmmoMinCount = ${oAmmoByWeaponClass['HG'][0]}\n`;
                cPistolGenerators += `               AmmoMaxCount = ${oAmmoByWeaponClass['HG'][1]}\n`;
                cPistolGenerators += `            struct.end\n`;
                iterator++;
            }
            cPistolGenerators += `         struct.end\n`;
            cPistolGenerators += `      struct.end\n`;
        }
        cPistolGenerators += `   struct.end\n`;
        cPistolGenerators += `struct.end\n`;
    }

    return cPistolGenerators;
};

const createArmorAndPistol = (faction)=>{
    let cRet = '';

    cRet += `      [*] : struct.begin\n`;
    cRet += `         Category = EItemGenerationCategory::SubItemGenerator\n`;
    cRet += `         PossibleItems : struct.begin\n`;
    cRet += `            [0] : struct.begin\n`;
    cRet += `               ItemGeneratorPrototypeSID = ${faction}_Armor\n`;
    cRet += `               Chance = 1\n`;
    cRet += `            struct.end\n`;
    cRet += `            [1] : struct.begin\n`;
    cRet += `               ItemGeneratorPrototypeSID = ${faction}_WeaponPistol\n`;
    cRet += `               Chance = ${modifiedPistolSpawnChance/100}\n`;
    cRet += `            struct.end\n`;
    cRet += `         struct.end \n`;          
    cRet += `      struct.end\n`;

    return cRet;
};

const createConsumables = (faction, clas)=>{
    //TODO faction consumables structure
    //TODO Noon using faction consumables, but why? 

    let cRet = '';

    cRet += `      [*] : struct.begin\n`;
    cRet += `         Category = EItemGenerationCategory::SubItemGenerator\n`;
    cRet += `         PossibleItems : struct.begin\n`;
    cRet += `            [0] : struct.begin\n`;
    cRet += `               ItemGeneratorPrototypeSID = GeneralNPC_Consumables_${clas}\n`;
    cRet += `               Weight = 1\n`;
    cRet += `            struct.end\n`;
    cRet += `         struct.end\n`;
    cRet += `      struct.end\n`;

    return cRet;
};

const createDetector = (/*faction*/)=>{
    //TODO More detectors and chances

    let cRet = '';

    cRet += `      [*] : struct.begin\n`;
    cRet += `         Category = EItemGenerationCategory::Detector\n`;
    cRet += `         PossibleItems : struct.begin\n`;
    cRet += `            [0] : struct.begin\n`;
    cRet += `               ItemPrototypeSID = Echo\n`;
    cRet += `               Chance = 0.3\n`;
    cRet += `               MinCount = 1\n`;
    cRet += `               MaxCount = 1\n`;
    cRet += `            struct.end\n`;
    cRet += `         struct.end\n`;
    cRet += `      struct.end\n`;

    return cRet;
};

//const createArtifact = (/*faction*/)=>{
    //TODO variery of grenades, optional artifacts
/*

    let cRet = '';

    cRet += `      [*] : struct.begin\n`;
    cRet += `         Category = EItemGenerationCategory::Artifact\n`;
    cRet += `         PossibleItems : struct.begin\n`;
    cRet += `            [0] : struct.begin\n`;
    cRet += `               ItemPrototypeSID = GrenadeRGD5\n`;
    cRet += `               Chance = 0.2\n`;
    cRet += `               MinCount = 1\n`;
    cRet += `               MaxCount = 1\n`;
    cRet += `            struct.end\n`;
    cRet += `         struct.end\n`;
    cRet += `      struct.end\n`;

    return cRet;

};*/

const createGrenadeStruct = (oGrenades, rank)=>{
    let cRet = '';
    let iterator = 0;

    for (let grenade in oGrenades){
        if (oGrenades[grenade].chances[rank] === 0) continue;
        cRet += `            [${iterator}] : struct.begin\n`;
        cRet += `               ItemPrototypeSID = ${grenade}\n`;
        cRet += `               Chance = ${oGrenades[grenade].chances[rank] / 100}\n`;
        cRet += `               AmmoMinCount = ${oGrenades[grenade].minAmmo[rank] || 0}\n`;
        cRet += `               AmmoMaxCount = ${oGrenades[grenade].maxAmmo[rank] || 0}\n`;
        cRet += `            struct.end\n`;
        iterator++;
    }
    return cRet;
};

const createGrenadesItemGenerators = ()=>{
    let cGrenadeGenerators = '';

    for (let clas in modifiedGrenadeSettings){
            cGrenadeGenerators += `${clas}_Grenades : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}\n`;
            cGrenadeGenerators += `   SID = ${clas}_Grenades \n`;
            cGrenadeGenerators += `   ItemGenerator : struct.begin\n`;
        for (let rank =0; rank<4; rank++){
            cGrenadeGenerators += `      [*] : struct.begin\n`;
            cGrenadeGenerators += `         Category = EItemGenerationCategory::Artifact\n`;
            cGrenadeGenerators += `         PlayerRank = ERank::${ranks[rank]}\n`;
            cGrenadeGenerators += `         PossibleItems : struct.begin\n`;
            cGrenadeGenerators +=              createGrenadeStruct(modifiedGrenadeSettings[clas], rank)
            cGrenadeGenerators += `         struct.end\n`;
            cGrenadeGenerators += `      struct.end\n`;
        }
            cGrenadeGenerators += `   struct.end\n`;
            cGrenadeGenerators += `struct.end\n`;
    }
    return cGrenadeGenerators;
};

const createGrenades = (clas)=>{
    let cRet = '';
    let cItemGenerator = modifiedGrenadeSettings[clas]?`${clas}_Grenades`:'Default_Grenades';

    cRet += `      [*] : struct.begin\n`;
    cRet += `         Category = EItemGenerationCategory::SubItemGenerator\n`;
    cRet += `         PossibleItems : struct.begin\n`;
    cRet += `            [0] : struct.begin\n`;
    cRet += `               ItemGeneratorPrototypeSID = ${cItemGenerator}\n`;
    cRet += `               Weight = 1\n`;
    cRet += `            struct.end\n`;
    cRet += `         struct.end\n`;
    cRet += `      struct.end\n`;

    return cRet;
};

const getModdedItemGenerators = async ()=>{
    let cRet = '';
    let aExistedFiles = [
        "FactionPatches",
        "ProjectItemization"
    ];

    for (let i = 0; i<aExistedFiles.length; i++){
        let response = await fetch(`Mods/${aExistedFiles[i]}.cfg`);

        if (response.ok) { 
            let moddedItemGenerators = await response.text();
            cRet += moddedItemGenerators;
            cRet += '\n';
        } else {
            console.error("Ошибка HTTP: " + response.status);
        }
    }

    return cRet;
};

const createFactionPatches = (faction)=>{
    const oFactionToPatch = {
        CL_Scientists: 'CL_Scientist',
        CL_Militaries: 'CL_ISPF',
        CL_Bandit: 'CL_Bandits',
    };

    let cRet = '';

    faction = faction.replace(faction.substring(0, 8) === 'GuardNPC'?'GuardNPC':'GeneralNPC', 'CL');
    
    cRet += `      [*] : struct.begin\n`;
    cRet += `         Category = EItemGenerationCategory::SubItemGenerator\n`;
    cRet += `         PossibleItems : struct.begin\n`;
    cRet += `            [0] : struct.begin\n`;
    cRet += `               ItemGeneratorPrototypeSID = ${oFactionToPatch[faction] || faction}NPC_Patch\n`;
    cRet += `               Chance = 1\n`;
    cRet += `            struct.end\n`;
    cRet += `         struct.end\n`;
    cRet += `      struct.end\n`;

    return cRet;
}


const createProjectItemization = ()=>{
    let cRet = '';

    cRet += `      [*] : struct.begin\n`;
    cRet += `         Category = EItemGenerationCategory::SubItemGenerator\n`;
    cRet += `         PossibleItems : struct.begin\n`;
    cRet += `            [0] : struct.begin\n`;
    cRet += `               ItemGeneratorPrototypeSID = ProjectItemization_ItemGenerator\n`;
    cRet += `               Chance = 1\n`;
    cRet += `            struct.end\n`;
    cRet += `         struct.end\n`;
    cRet += `      struct.end\n`;

    return cRet;

};


export const createLoadout = async ()=>{
    let cRet = '//Generated with https://s2-loadout-creator.cc/ \n\n';

    oArmorLoadoutSettings = modifiedArmorSettings;
    oWeaponLoadoutSettings = modifiedWeaponSettings;
    oWeaponList = modifiedWeaponList;
    oAmmoByWeaponClass = modifiedAmmoByWeaponClass;

    let oPrepared = prepareWeaponStruct(oWeaponLoadoutSettings); //Everything based on weapon loadout settings
    let oPreparedSecondary = prepareWeaponStruct(oSecondaryLoadoutSettings); //Everything based on weapon loadout settings

    //creating modded structures
    cRet += `//Armor itemgenerators to provide better helmet spawn and features like armor drop\n`;
    for (let armor in modifiedArmorSpawnSettings){
        cRet += createArmorItemGenerator(armor);
    }

    cRet += `//Pistols itemgenerators\n`;
    cRet += createPistolsItemGenerators();

    cRet += `//Grenades itemgenerators\n`;
    cRet += createGrenadesItemGenerators();

    cRet += `//Itemgenerators from another mods\n\n`;
    let response = await getModdedItemGenerators(modsCompatibility);
    if (response) {
        cRet += response;
    }
    cRet += `\n\n`;

    cRet += `//Armor loadout generators, just in top to beautiful structure\n`;
    cRet += createArmorLoadoutGenerators();

    
    cRet += `//Generated itemgenerators\n`;
    for (let faction in oPrepared){
        for (let clas in oPrepared[faction]){
            cRet += `${faction}_${clas}_ItemGenerator_Override : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}\n`;
            cRet += `   SID = ${faction}_${clas}_ItemGenerator\n`;
            cRet += `   RefreshTime = 1d\n`;
            cRet += `   ItemGenerator : struct.begin\n`;
            cRet +=        createPrimaryWeapons(oPrepared, faction, clas);
            cRet +=        createSecondaryWeapons(oPreparedSecondary, faction, clas);
            cRet +=        createArmorAndPistol(faction); //may be splitted in future
            cRet +=        createConsumables(faction, clas); //TODO restructure to faction itemgenerators
            cRet +=        createFactionPatches(faction);
            cRet +=        createProjectItemization();
            cRet +=        createDetector(faction); //is it works? 
            //cRet +=        createArtifact(faction); //Why grenade uses artifact category?
            cRet +=        createGrenades(clas);
            cRet += `   struct.end\n`;
            cRet += `struct.end\n`;
        }
    }

    return cRet;
}