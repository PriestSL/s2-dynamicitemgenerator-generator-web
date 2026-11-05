import * as config from './configs.js';
import { objCompare } from './utils.js';

/*
import FactionPatchesCompatibility from '../Mods/FactionPatches.cfg?raw';
import ProjectItemizationCompatibility from '../Mods/ProjectItemization.cfg?raw';*/

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
//let modsCompatibility;

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
            oTemp[aChances[i]].push(aERanks[i]);
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
        }else if(modsCompatibility.SHA && armorSettins.helmetless){
            fillHelmet('ERank::Newbie, ERank::Experienced, ERank::Veteran, ERank::Master', 100);
        }else if(!armorSettins.helmetless){
            let oCompressed = compressChancesToRanks(oHelmet);
            for (let ranks in oCompressed){
                if (oCompressed[ranks] == 0) continue;
                fillHelmet(ranks, oCompressed[ranks]);
            }
        }

        return cRet;
    }



    return `BNPL_${cArmorName}_Kit : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}
   SID = BNPL_${cArmorName}_Kit
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
        cArmorGenerators += `BNPL_${faction}_Armor : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}\n`;
        cArmorGenerators += `   SID = BNPL_${faction}_Armor\n`;
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
                cArmorGenerators += `               ItemGeneratorPrototypeSID = BNPL_${armor}_Kit\n`;
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
        let weaponClass = weapon.substring(weapon.lastIndexOf('_') + 1);
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

const createPrimaryGenerators = (preparedData)=>{
    let cRet = '';
    for (let faction in preparedData){
        for (let clas in preparedData[faction]){
            cRet += `BNPL_${faction}_${clas}_Primary_ItemGenerator : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}\n`;
            cRet += `   SID = BNPL_${faction}_${clas}_Primary_ItemGenerator\n`;
            cRet += '   ItemGenerator : struct.begin\n';
            for (let rank in preparedData[faction][clas]){
                cRet += `      [*] : struct.begin\n`;
                cRet += `         Category = EItemGenerationCategory::WeaponPrimary\n`;
                cRet += `         PlayerRank = ${rank}\n`;
                cRet += `         PossibleItems : struct.begin\n`;
                cRet += createWeaponStruct(preparedData[faction][clas][rank], faction);
                cRet += `         struct.end\n`;
                cRet += `      struct.end\n`;
            }
            cRet += `   struct.end\n`;
            cRet += `struct.end\n`;
        }
    }
    return cRet;
};

const createPrimaryWeapons = (faction, clas)=>{
    let cRet =  '      BNPL_PrimaryWeapons : struct.begin\n';
        cRet += '         Category = EItemGenerationCategory::SubItemGenerator\n';
        cRet += '         PossibleItems : struct.begin\n';
        cRet += '            [0] : struct.begin\n';
        cRet += `                ItemGeneratorPrototypeSID = BNPL_${faction}_${clas}_Primary_ItemGenerator\n`;
        cRet += '                Weight = 1\n';
        cRet += '            struct.end\n';
        cRet += '         struct.end\n';
        cRet += '      struct.end\n';

    return cRet;
};

const createSecondaryGenerators = (preparedData)=>{
    let cRet = '';
    for (let faction in preparedData){
        for (let clas in preparedData[faction]){
            cRet += `BNPL_${faction}_${clas}_Secondary_ItemGenerator : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}\n`;
            cRet += `   SID = BNPL_${faction}_${clas}_Secondary_ItemGenerator\n`;
            cRet += '   ItemGenerator : struct.begin\n';
            for (let rank in preparedData[faction][clas]){
                cRet += `      [*] : struct.begin\n`;
                cRet += `         Category = EItemGenerationCategory::WeaponSecondary\n`;
                cRet += `         PlayerRank = ${rank}\n`;
                cRet += `         PossibleItems : struct.begin\n`;
                cRet += createWeaponStruct(preparedData[faction][clas][rank], faction);
                cRet += `         struct.end\n`;
                cRet += `      struct.end\n`;
            }
            cRet += `   struct.end\n`;
            cRet += `struct.end\n`;
        }
    }
    return cRet;
};

const createSecondaryWeapons = (oSecondary, faction, clas)=>{
    if (!oSecondary || !oSecondary[faction] || !oSecondary[faction][clas] ) return '';
    let cRet =  '      BNPL_SecondaryWeapons : struct.begin\n';
        cRet += '         Category = EItemGenerationCategory::SubItemGenerator\n';
        cRet += '         PossibleItems : struct.begin\n';
        cRet += '            [0] : struct.begin\n';
        cRet += `                ItemGeneratorPrototypeSID = BNPL_${faction}_${clas}_Secondary_ItemGenerator\n`;
        cRet += '                Weight = 1\n';
        cRet += '            struct.end\n';
        cRet += '         struct.end\n';
        cRet += '      struct.end\n';

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
        cPistolGenerators += `BNPL_${faction}_WeaponPistol : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}\n`;
        cPistolGenerators += `   SID = BNPL_${faction}_WeaponPistol\n`;
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
    let processedFaction = faction.substring(0, 8) == 'GuardNPC'?'GeneralNPC'+faction.substring(8):faction;
    let cRet = '';

    cRet += `      BNPL_ArmorAndPistol : struct.begin\n`;
    cRet += `         Category = EItemGenerationCategory::SubItemGenerator\n`;
    cRet += `         PossibleItems : struct.begin\n`;
    cRet += `            Armor : struct.begin\n`;
    cRet += `               ItemGeneratorPrototypeSID = BNPL_${processedFaction}_Armor\n`;
    cRet += `               Chance = 1\n`;
    cRet += `            struct.end\n`;
    cRet += `            Pistol : struct.begin\n`;
    cRet += `               ItemGeneratorPrototypeSID = BNPL_${processedFaction}_WeaponPistol\n`;
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

    cRet += `      BNPL_Consumables_Wrapper : struct.begin\n`;
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

    cRet += `      BNPL_Detector : struct.begin\n`;
    cRet += `         Category = EItemGenerationCategory::Detector\n`;
    cRet += `         PossibleItems : struct.begin\n`;
    cRet += `            [0] : struct.begin\n`;
    cRet += `               ItemPrototypeSID = Echo\n`;
    cRet += `               Chance = 0.1\n`;
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
            cGrenadeGenerators += `BNPL_${clas}_Grenades : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}\n`;
            cGrenadeGenerators += `   SID = BNPL_${clas}_Grenades \n`;
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
    let cItemGenerator = modifiedGrenadeSettings[clas]?`${clas}_Grenades`:'BNPL_Default_Grenades';

    cRet += `      BNPL_Grenades : struct.begin\n`;
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

const createNVG = (faction)=>{
    let processedFaction = faction.substring(0, 8) == 'GuardNPC'?'GeneralNPC'+faction.substring(8):faction;
    let cRet = '';
    cRet += '      BNPL_NVG : struct.begin\n';
    cRet += `         Category = EItemGenerationCategory::SubItemGenerator\n`;
    cRet += `         PossibleItems : struct.begin\n`;
    cRet += `            [0] : struct.begin\n`;
    cRet += `               ItemGeneratorPrototypeSID = ${processedFaction}_NVG\n`;
    cRet += `               Chance = 1\n`;
    cRet += `            struct.end\n`;
    cRet += `         struct.end\n`;
    cRet += `      struct.end\n`;
    return cRet;
};

/*const getModdedItemGenerators = async ()=>{
    let cRet = '';

    cRet += FactionPatchesCompatibility;
    cRet += '\n';
    cRet += ProjectItemizationCompatibility;
    cRet += '\n';

    return cRet;
};*/

function createBlankOverride(factionClass){ //перетираємо оригінальні структури в тій же кількості, щоб bpatch не лишав старі структури
    const factionClassStrucCount = {
        GeneralNPC_Neutral_CloseCombat: 19,
        GeneralNPC_Neutral_Recon: 18,
        GeneralNPC_Neutral_Sniper: 19,
        GeneralNPC_Neutral_Stormtrooper: 14,
        GeneralNPC_Bandit_CloseCombat: 10,
        GeneralNPC_Bandit_Recon: 13, 
        GeneralNPC_Bandit_Stormtrooper: 11,
        GeneralNPC_Bandit_Heavy: 11,
        GeneralNPC_Mercenaries_CloseCombat: 11,
        GeneralNPC_Mercenaries_Recon: 11,
        GeneralNPC_Mercenaries_Stormtrooper: 8,
        GeneralNPC_Mercenaries_Sniper: 10,
        GeneralNPC_Scientists_Recon: 4,
        GeneralNPC_Scientists_Stormtrooper: 5,
        GeneralNPC_Militaries_CloseCombat: 8,
        GeneralNPC_Militaries_Recon: 10,
        GeneralNPC_Militaries_Stormtrooper: 11,
        GeneralNPC_Militaries_Sniper: 9,
        GeneralNPC_Militaries_Heavy: 12,
        GeneralNPC_Monolith_CloseCombat: 10,
        GeneralNPC_Monolith_Recon: 8,
        GeneralNPC_Monolith_Stormtrooper: 8,
        GeneralNPC_Monolith_Sniper: 10,
        GeneralNPC_Duty_CloseCombat: 10,
        GeneralNPC_Duty_Recon: 8, 
        GeneralNPC_Duty_Stormtrooper: 10,
        GeneralNPC_Duty_Sniper: 10,
        GeneralNPC_Duty_Heavy: 10,
        GeneralNPC_Freedom_CloseCombat: 10,
        GeneralNPC_Freedom_Recon: 11,
        GeneralNPC_Freedom_Stormtrooper: 10,
        GeneralNPC_Freedom_Sniper: 10,
        GeneralNPC_Varta_CloseCombat: 10,
        GeneralNPC_Varta_Recon: 10,
        GeneralNPC_Varta_Stormtrooper: 11,
        GeneralNPC_Varta_Sniper: 9,
        GeneralNPC_Varta_Heavy: 9,
        GeneralNPC_Noon_CloseCombat: 6,
        GeneralNPC_Noon_Recon: 6,
        GeneralNPC_Noon_Stormtrooper: 6,
        GeneralNPC_Noon_Sniper: 6,
        GeneralNPC_Spark_CloseCombat: 8,
        GeneralNPC_Spark_Recon: 7,
        GeneralNPC_Spark_Stormtrooper: 8,
        GeneralNPC_Spark_Sniper: 10,
        GeneralNPC_Corpus_CloseCombat: 7,
        GeneralNPC_Corpus_Recon: 7,
        GeneralNPC_Corpus_Stormtrooper: 7,
        GeneralNPC_Corpus_Sniper: 7,
        GeneralNPC_Corpus_Heavy: 6,
        GuardNPC_Neutral_CloseCombat: 11,
        GuardNPC_Neutral_Recon: 13,
        GuardNPC_Neutral_Sniper: 10, 
        GuardNPC_Neutral_Stormtrooper: 12,
        GuardNPC_Bandit_CloseCombat: 6,
        GuardNPC_Bandit_Recon: 7,
        GuardNPC_Bandit_Stormtrooper: 7,
        GuardNPC_Bandit_Heavy: 5,
        GuardNPC_Monolith_CloseCombat: 6,
        GuardNPC_Monolith_Recon: 8,
        GuardNPC_Monolith_Stormtrooper: 12,
        GuardNPC_Monolith_Sniper: 7,
        GuardNPC_Duty_CloseCombat: 6,
        GuardNPC_Duty_Recon: 6,
        GuardNPC_Duty_Stormtrooper: 9,
        GuardNPC_Duty_Sniper: 8,
        GuardNPC_Duty_Heavy: 5,
        GuardNPC_Freedom_CloseCombat: 6,
        GuardNPC_Freedom_Recon: 8,
        GuardNPC_Freedom_Stormtrooper: 12,
        GuardNPC_Freedom_Sniper: 10,
        GuardNPC_Varta_CloseCombat: 6,
        GuardNPC_Varta_Recon: 8,
        GuardNPC_Varta_Stormtrooper: 11,
        GuardNPC_Varta_Sniper: 9,
        GuardNPC_Varta_Heavy: 5,
        GuardNPC_Noon_CloseCombat: 5,
        GuardNPC_Noon_Recon: 7,
        GuardNPC_Noon_Stormtrooper: 8,
        GuardNPC_Noon_Sniper: 6,
        GuardNPC_Corpus_CloseCombat: 6,
        GuardNPC_Corpus_Recon: 8,
        GuardNPC_Corpus_Stormtrooper: 11,
        GuardNPC_Corpus_Sniper: 8,
        GuardNPC_Corpus_Heavy: 6,
    }

    if ( !factionClassStrucCount[factionClass]) {
        console.warn(`No structure count found for faction class: ${factionClass}`);
        return '';
    }

    let retVal = '';
    for (let i=0; i<factionClassStrucCount[factionClass]; i++){
        retVal += '      [*] : struct.begin\n';
        retVal += '      struct.end\n';
    }

    return retVal;
}

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
    //modsCompatibility = appState.modsCompatibility;
    let cRet = '//Generated with https://dev.s2-loadout-creator.cc/ \n\n';

    oArmorLoadoutSettings = modifiedArmorSettings;
    oWeaponLoadoutSettings = modifiedWeaponSettings;
    oWeaponList = modifiedWeaponList;
    oAmmoByWeaponClass = modifiedAmmoByWeaponClass;

    let oPrepared = prepareWeaponStruct(oWeaponLoadoutSettings); //Everything based on weapon loadout settings
    let oPreparedSecondary = prepareWeaponStruct(oSecondaryLoadoutSettings); //Everything based on weapon loadout settings

    //creating modded structures
    cRet += `//Armor kits itemgenerators to provide better helmet spawn and features like armor drop\n`;
    for (let armor in modifiedArmorSpawnSettings){
        cRet += createArmorItemGenerator(armor);
    }

    cRet += `//Primary weapons itemgenerators\n`;
    cRet += createPrimaryGenerators(oPrepared);

    
    cRet += `//Secondary weapons itemgenerators\n`;
    cRet += createSecondaryGenerators(oPreparedSecondary);

    cRet += `//Pistols itemgenerators\n`;
    cRet += createPistolsItemGenerators();

    cRet += `//Grenades itemgenerators\n`;
    cRet += createGrenadesItemGenerators();

    /*cRet += `//Itemgenerators from another mods\n\n`;
    let response = await getModdedItemGenerators(modsCompatibility);
    if (response) {
        cRet += response;
    }*/
    cRet += `\n\n`;

    cRet += `//Armor loadout generators, just in top to beautiful structure\n`;
    cRet += createArmorLoadoutGenerators();

    
    cRet += `//Generated itemgenerators\n`;
    for (let faction in oPrepared){
        for (let clas in oPrepared[faction]){
            cRet += `${faction}_${clas}_ItemGenerator : struct.begin {bpatch}\n`;
            cRet += `   ItemGenerator : struct.begin {bpatch}\n`;
            cRet +=        createBlankOverride(`${faction}_${clas}`); //nullifying vanilla game data to prevent dublicates
            cRet +=        createPrimaryWeapons(faction, clas);
            cRet +=        createSecondaryWeapons(oPreparedSecondary, faction, clas);
            cRet +=        createArmorAndPistol(faction); //may be splitted in future
            cRet +=        createConsumables(faction, clas);
            cRet +=        createDetector(faction); //is it works? 
            //cRet +=        createArtifact(faction); //Why grenade uses artifact category?
            cRet +=        createGrenades(clas);
            cRet +=        createNVG(faction);
            cRet += `   struct.end\n`;
            cRet += `struct.end\n`;
        }
    }

    return cRet;
}
