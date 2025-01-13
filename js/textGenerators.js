import * as config from './configs.js';
import {modifiedWeaponSettings, modifiedArmorSettings} from './app.js';

const oArmorSpawnSettings = config.oArmorSpawnSettings;
var oArmorLoadoutSettings = modifiedArmorSettings;
var oWeaponLoadoutSettings = modifiedWeaponSettings;
const oSecondaryLoadoutSettings = config.oSecondaryLoadoutSettings;
const nMinDurability = config.nMinDurability;
const nMaxDurability = config.nMaxDurability;
const nLootChance = config.nLootChance;
const oWeaponList = config.oWeaponList;
const oAmmoByWeaponClass = config.oAmmoByWeaponClass;
const nMinWeaponDurability = config.nMinWeaponDurability;
const nMaxWeaponDurability = config.nMaxWeaponDurability;
const nPistolLootChance = config.nPistolLootChance;
const oSupportedMods = config.oSupportedMods;
const oGrenadesSettings = config.oGrenadesSettings;
const oMainConfigs = config.oMainConfigs;

let ranks = ['Newbie', 'Experienced', 'Veteran', 'Master'];

const createArmorItemGenerator = (cArmorName)=>{
    const createLootable = ()=>
    `            [1] : struct.begin
               ItemPrototypeSID = ${oArmorSpawnSettings[cArmorName].dropItem || cArmorName}
               MinDurability = ${nMinDurability}
               MaxDurability = ${nMaxDurability}
               Chance = ${nLootChance}
            struct.end`;

    const createHelmet = ()=>{
        const helmetSpawnSettings = oArmorSpawnSettings[cArmorName].helmets;
        let cRet = '';
        let lFirst = true;
        for (let helmet in helmetSpawnSettings){
            for (let rank in helmetSpawnSettings[helmet].spawn){
                if (!lFirst){
                    cRet += '\n';
                }
                lFirst = false;
                cRet +=`      [*] : struct.begin
         Category = EItemGenerationCategory::Head
         PlayerRank = ERank::${rank}
         PossibleItems : struct.begin
            [0] : struct.begin
               ItemPrototypeSID = ${helmet}
               Chance = ${helmetSpawnSettings[helmet].spawn[rank]}
            struct.end
         struct.end
      struct.end`;
            }
        }

        return cRet;
    }



    return `General${cArmorName} : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}
   SID = General${cArmorName}
   ItemGenerator : struct.begin
      [*] : struct.begin
         Category = EItemGenerationCategory::BodyArmor
         PossibleItems : struct.begin
            [0] : struct.begin
               ItemPrototypeSID = ${cArmorName}
               Chance = 1
            struct.end
${oMainConfigs.createDroppableArmor && oArmorSpawnSettings[cArmorName].drop ? createLootable() : ''}
         struct.end
      struct.end
${oArmorSpawnSettings[cArmorName].helmets ? createHelmet() : ''}
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
        cArmorGenerators += `${faction}_Armor : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}
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
    cRet += `               Chance = ${nPistolLootChance}\n`;
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

    for (let clas in oGrenadesSettings){
            cGrenadeGenerators += `${clas}_Grenades : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}\n`;
            cGrenadeGenerators += `   SID = ${clas}_Grenades \n`;
            cGrenadeGenerators += `   ItemGenerator : struct.begin\n`;
        for (let rank =0; rank<4; rank++){
            cGrenadeGenerators += `      [*] : struct.begin\n`;
            cGrenadeGenerators += `         Category = EItemGenerationCategory::Artifact\n`;
            cGrenadeGenerators += `         PlayerRank = ERank::${ranks[rank]}\n`;
            cGrenadeGenerators += `         PossibleItems : struct.begin\n`;
            cGrenadeGenerators +=              createGrenadeStruct(oGrenadesSettings[clas], rank)
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
    let cItemGenerator = oGrenadesSettings[clas]?`${clas}_Grenades`:'Default_Grenades';

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

const checkModdedItemGenerators = ()=>{
    let oRet = {};
    for (let mod in oSupportedMods){
        oRet[mod] = true; //not needed for web
    }
    return oRet;
};

const getModdedItemGenerators = async (oExistedFiles)=>{
    let cRet = '';

    for (let mod in oExistedFiles){
        if (oExistedFiles[mod]){
            let response = await fetch(`Mods/${oSupportedMods[mod]}`);

            if (response.ok) { // если HTTP-статус в диапазоне 200-299
            // получаем тело ответа (см. про этот метод ниже)
                let moddedItemGenerators = await response.text();
                cRet += moddedItemGenerators;
                cRet += '\n';
            } else {
                alert("Ошибка HTTP: " + response.status);
            }
        }
    }

    return cRet;
};

const createFactionPatches = (faction)=>{
    let cRet = '';
    faction.replace(faction.substring(0, 5) === 'Guard'?'Guard':'General', 'CL');
    
    cRet += `      [*] : struct.begin\n`;
    cRet += `         Category = EItemGenerationCategory::SubItemGenerator\n`;
    cRet += `         PossibleItems : struct.begin\n`;
    cRet += `            [0] : struct.begin\n`;
    cRet += `               ItemGeneratorPrototypeSID = ${faction}_Patch\n`;
    cRet += `               Chance = 1\n`;
    cRet += `            struct.end\n`;
    cRet += `         struct.end\n`;
    cRet += `      struct.end\n`;

    return cRet;
}


export const createLoadout = async ()=>{
    let cRet = '';

    oArmorLoadoutSettings = modifiedArmorSettings;
    oWeaponLoadoutSettings = modifiedWeaponSettings;

    let oPrepared = prepareWeaponStruct(oWeaponLoadoutSettings); //Everything based on weapon loadout settings
    let oPreparedSecondary = prepareWeaponStruct(oSecondaryLoadoutSettings); //Everything based on weapon loadout settings

    //creating modded structures
    cRet += `//Armor itemgenerators to provide better helmet spawn and features like armor drop\n`;
    for (let armor in oArmorSpawnSettings){
        cRet += createArmorItemGenerator(armor);
    }

    cRet += `//Grenades itemgenerators\n`;
    cRet += createGrenadesItemGenerators();

    let oEnabledMods = checkModdedItemGenerators();
    cRet += `//Itemgenerators from another mods\n\n`;
    let response = await getModdedItemGenerators(oEnabledMods);
    if (response) {
        cRet += response;
    }
    cRet += `\n\n`;

    cRet += `//Armor loadout generators, just in top to beautiful structure\n`;
    cRet += createArmorLoadoutGenerators();

    cRet += '//Vanilla Trader and consumables from template\n';
    //TODO creating compatibility structures with other mods if needee

    //Loading vanilla "header" with traders and other stuff
    let templatePath = `Templates/BasicGamePretext.cfg`;
    response = await fetch(templatePath);

    if (response) { 
        let text = response;
        cRet += text;
    }
    
    cRet += `//Generated itemgenerators\n`;
    for (let faction in oPrepared){
        for (let clas in oPrepared[faction]){
            cRet += `${faction}_${clas}_ItemGenerator : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}\n`;
            cRet += `   SID = ${faction}_${clas}_ItemGenerator\n`;
            cRet += `   RefreshTime = 1d\n`;
            cRet += `   ItemGenerator : struct.begin\n`;
            cRet +=        createPrimaryWeapons(oPrepared, faction, clas);
            cRet +=        createSecondaryWeapons(oPreparedSecondary, faction, clas);
            cRet +=        createArmorAndPistol(faction); //may be splitted in future
            cRet +=        createConsumables(faction, clas);
            cRet += oEnabledMods.FactionPatches?createFactionPatches(faction):'';
            cRet +=        createDetector(faction);
            //cRet +=        createArtifact(faction); //Why grenade uses artifact category?
            cRet +=        createGrenades(clas);
            cRet += `   struct.end\n`;
            cRet += `struct.end\n`;
        }
    }

    cRet += `//Vanilla traders, pistols and zombies\n`;
    //Loading vanilla "footer" with pistols, zombies and other stuff
    templatePath = `Templates/BasicGamePosttext.cfg`;
    response = await fetch(templatePath);

    if (response) {
        let text = response;
        cRet += text;
    }

    return cRet;
}