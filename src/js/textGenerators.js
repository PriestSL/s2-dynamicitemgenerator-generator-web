import * as config from './configs.js';
import { objCompare } from './utils.js';

import FactionPatchesCompatibility from '../Mods/FactionPatches.cfg?raw';
import ProjectItemizationCompatibility from '../Mods/ProjectItemization.cfg?raw';

// Module-level variables that will be set when createLoadout is called
let modifiedArmorSettings;
let modifiedWeaponSettings;
let modifiedWeaponList;
let modifiedArmorSpawnSettings;
let modifiedHelmetSpawnSettings;
let modifiedDropConfigs;
let modifiedPistolSettings;
let modifiedPistolSpawnChance;
let modifiedMinWeaponDurability;
let modifiedMaxWeaponDurability;
let modifiedGrenadeSettings;
let modifiedAmmoByWeaponClass;
let modsCompatibility;

var oArmorLoadoutSettings;
var oWeaponLoadoutSettings;
var oWeaponList;
const oSecondaryLoadoutSettings = config.oSecondaryLoadoutSettings;
var oAmmoByWeaponClass;

const aERanks = ['ERank::Newbie', 'ERank::Experienced', 'ERank::Veteran', 'ERank::Master'];
const aRanks = ['Newbie', 'Experienced', 'Veteran', 'Master']; //TODO temp


const createArmorItemGenerator = (cArmorName)=>{
    const compressChancesToRanks = (aChances)=>{
        let oTemp = {};
        for (let i = 0; i < 4; i++){
            if (!oTemp[aChances[i]]){
                oTemp[aChances[i]] = [];
            }
            oTemp[aChances[i]].push('ERank::'+aERanks[i]);
        }
    
        let oRet = {};
        for (let ranks in oTemp){
            oRet[oTemp[ranks]] = ranks;
        }
        return oRet;
    };
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
        const cHelmet = modifiedArmorSpawnSettings[cArmorName].helmet;
        const oHelmet = modifiedHelmetSpawnSettings[cHelmet];
        if (!oHelmet) return '';

        let cRet = '';
        const fillHelmet = (rank, chance)=>{
            cRet +=`      [*] : struct.begin\n`;
            cRet +=`         Category = EItemGenerationCategory::Head\n`;
            cRet +=`         PlayerRank = ${rank}\n`;
            cRet +=`         PossibleItems : struct.begin\n`;
            cRet +=`            [0] : struct.begin\n`;
            cRet +=`               ItemPrototypeSID = ${cHelmet}\n`;
            cRet +=`               Chance = ${chance / 100 }\n`;
            cRet +=`            struct.end\n`;
            cRet +=`         struct.end\n`;
            cRet +=`      struct.end\n`;
        };

        if (armorSettins.helmetSpawn>0){
            fillHelmet('ERank::Newbie, ERank::Experienced, ERank::Veteran, ERank::Master', armorSettins.helmetSpawn);
        }else{
            let oCompressed = compressChancesToRanks(oHelmet);
            for (let ranks in oCompressed){
                if (oCompressed[ranks] == 0) continue;
                fillHelmet(ranks, oCompressed[ranks]);
            }
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
        for (let i = 0; i < aERanks.length; i++){
            oPrepared[faction][aERanks[i]] = {};
            for (let armor in oArmor[faction]){
                oPrepared[faction][aERanks[i]][armor] = oArmor[faction][armor][i];
            }
        }
    }

    let oCompressed = {};
    for (let faction in oPrepared){
        oCompressed[faction] = {};
        let prevRanks = [];
        for (let i = 0; i < aERanks.length; i++){
            let rank = aERanks[i];
            if (!oPrepared[faction][rank]) continue;
            if (prevRanks.length == 0){
                prevRanks.push(rank);
                oCompressed[faction][rank] = oPrepared[faction][rank];
                continue;
            }

            let bFound = false;
            for (let i = 0; i < prevRanks.length; i++){
                if (objCompare(oPrepared[faction][rank], oCompressed[faction][prevRanks[i]])){
                    oCompressed[faction][prevRanks[i]  + ', ' + rank] = oPrepared[faction][rank];
                    delete oCompressed[faction][prevRanks[i]];
                    bFound = true;
                    prevRanks.push(prevRanks[i] + ', ' + rank);
                    prevRanks.splice(i, 1);
                    break;
                }
            }

            if (!bFound){
                prevRanks.push(rank);
                oCompressed[faction][rank] = oPrepared[faction][rank];
            }

        }
    }

    return oCompressed;

};

const createArmorLoadoutGenerators = ()=>{
    let oPrepared = prepareArmorStruct(oArmorLoadoutSettings);

    let cArmorGenerators = '';
    for (let faction in oPrepared){
        cArmorGenerators += `${faction}_Armor_Override : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}\n`;
        cArmorGenerators += `   SID = ${faction}_Armor\n`;
        cArmorGenerators += `   ItemGenerator : struct.begin\n`;
        for (let rank in oPrepared[faction]){
            cArmorGenerators += `      [*] : struct.begin\n`;
            cArmorGenerators += `         Category = EItemGenerationCategory::SubItemGenerator\n`;
            cArmorGenerators += `         PlayerRank = ${rank}\n`;
            cArmorGenerators += `         PossibleItems : struct.begin\n`;
            let iterator = 0;
            for (let armor in oPrepared[faction][rank]){
                if (oPrepared[faction][rank][armor] === 0){
                    continue;
                }
                cArmorGenerators += `            [${iterator}] : struct.begin\n`;
                cArmorGenerators += `               ItemGeneratorPrototypeSID = General${armor}\n`;
                cArmorGenerators += `               Weight = ${oPrepared[faction][rank][armor]}\n`;
                cArmorGenerators += `            struct.end\n`;
                iterator++;
            }
            cArmorGenerators += `         struct.end\n`;
            cArmorGenerators += `      struct.end\n`;
        }
        cArmorGenerators += `   struct.end\n`;
        cArmorGenerators += `struct.end\n`;
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
        cRet += `               MinDurability = ${( [weapon].minCondition || modifiedMinWeaponDurability)/100}\n`;
        cRet += `               MaxDurability = ${(oWeaponList[weapon].maxCondition || modifiedMaxWeaponDurability)/100}\n`;
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
        cRet += `         PlayerRank = ${rank}\n`;
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
        cRet += `         PlayerRank = ${rank}\n`;
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
            for (let i = 0; i < aERanks.length; i++){
                oPrepared[faction][clas][aERanks[i]] = {};
                for (let weapon in oWeapons[faction][clas]){
                    oPrepared[faction][clas][aERanks[i]][weapon] = oWeapons[faction][clas][weapon][i];
                }
            }
        }
    }

    let oCompressed = {};
    for (let faction in oPrepared){
        oCompressed[faction] = {};
        for (let clas in oPrepared[faction]){
            oCompressed[faction][clas] = {};
            let prevRanks = [];
            for (let i = 0; i < aERanks.length; i++){
                let rank = aERanks[i];
                if (!oPrepared[faction][clas][rank]) continue;
                if (prevRanks.length == 0){
                    prevRanks.push(rank);
                    oCompressed[faction][clas][rank] = oPrepared[faction][clas][rank];
                    continue;
                }

                let bFound = false;
                for (let i = 0; i < prevRanks.length; i++){
                    if (objCompare(oPrepared[faction][clas][rank], oCompressed[faction][clas][prevRanks[i]])){
                        oCompressed[faction][clas][prevRanks[i] + ', ' + rank] = oPrepared[faction][clas][rank];
                        delete oCompressed[faction][clas][prevRanks[i]];
                        prevRanks.push(prevRanks[i] + ', ' + rank);
                        prevRanks.splice(i, 1);
                        bFound = true;
                        break;
                    }
                }

                if (!bFound){
                    prevRanks.push(rank);
                    oCompressed[faction][clas][rank] = oPrepared[faction][clas][rank];
                }

            }
        }
    }

    return oCompressed;
};

const preparePistolStruct = (oPistols)=>{
    let oPrepared = {};
    for (let faction in oPistols){
        oPrepared[faction] = {};
        for (let i = 0; i < aERanks.length; i++){
            oPrepared[faction][aERanks[i]] = {};
            for (let pistol in oPistols[faction]){
                oPrepared[faction][aERanks[i]][pistol] = oPistols[faction][pistol][i];
            }
        }
    }

    let oCompressed = {};
    for (let faction in oPrepared){
        oCompressed[faction] = {};
        let prevRanks = [];
        for (let i = 0; i < aERanks.length; i++){
            let rank = aERanks[i];
            if (!oPrepared[faction][rank]) continue;
            if (prevRanks.length == 0){
                prevRanks.push(rank);
                oCompressed[faction][rank] = oPrepared[faction][rank];
                continue;
            }

            let bFound = false;
            for (let i = 0; i < prevRanks.length; i++){
                if (objCompare(oPrepared[faction][rank], oCompressed[faction][prevRanks[i]])){
                    oCompressed[faction][prevRanks[i] + ', ' + rank] = oPrepared[faction][rank];
                    delete oCompressed[faction][prevRanks[i]];
                    prevRanks.push(prevRanks[i] + ', ' + rank);
                    prevRanks.splice(i, 1);
                    bFound = true;
                    break;
                }
            }

            if (!bFound){
                prevRanks.push(rank);
                oCompressed[faction][rank] = oPrepared[faction][rank];
            }

        }
    }

    return oCompressed;
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
            cPistolGenerators += `         PlayerRank = ${rank}\n`;
            cPistolGenerators += `         PossibleItems : struct.begin\n`;
            let iterator = 0;
            for (let pistol in oPrepared[faction][rank]){
                if (oPrepared[faction][rank][pistol] === 0){
                    continue;
                }
                cPistolGenerators += `            [${iterator}] : struct.begin\n`;
                cPistolGenerators += `               ItemPrototypeSID = ${pistol}\n`;
                cPistolGenerators += `               Weight = ${oPrepared[faction][rank][pistol]}\n`;
                cPistolGenerators += `               MinDurability = ${(oWeaponList[pistol].minCondition || modifiedMinWeaponDurability)/100}\n`;
                cPistolGenerators += `               MaxDurability = ${(oWeaponList[pistol].maxCondition || modifiedMaxWeaponDurability)/100}\n`;
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
            cGrenadeGenerators += `         PlayerRank = ERank::${aRanks[rank]}\n`;
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

    cRet += FactionPatchesCompatibility;
    cRet += '\n';
    cRet += ProjectItemizationCompatibility;
    cRet += '\n';

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


export const createLoadout = async (appState)=>{
    if (!appState) {
        console.error('AppState is required for createLoadout function');
        return '';
    }
    
    // Set module-level variables from appState
    modifiedArmorSettings = appState.modifiedArmorSettings;
    modifiedWeaponSettings = appState.modifiedWeaponSettings;
    modifiedWeaponList = appState.modifiedWeaponList;
    modifiedArmorSpawnSettings = appState.modifiedArmorSpawnSettings;
    modifiedHelmetSpawnSettings = appState.modifiedHelmetSpawnSettings;
    modifiedDropConfigs = appState.modifiedDropConfigs;
    modifiedPistolSettings = appState.modifiedPistolSettings;
    modifiedPistolSpawnChance = appState.modifiedPistolSpawnChance;
    modifiedMinWeaponDurability = appState.modifiedMinWeaponDurability;
    modifiedMaxWeaponDurability = appState.modifiedMaxWeaponDurability;
    modifiedGrenadeSettings = appState.modifiedGrenadeSettings;
    modifiedAmmoByWeaponClass = appState.modifiedAmmoByWeaponClass;
    modsCompatibility = appState.modsCompatibility;
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