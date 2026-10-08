import { oSecondaryLoadoutSettings } from '../model/defaults.ts';
import { validateConfig } from '../model/validation.ts';
import { effectiveWeapon, percentage } from '../model/effective.ts';
import { RANKS } from '../model/types.ts';
import type { DeepReadonly, LoadoutConfig, ItemWeights, RankValues, RankIndex, WeaponSettings, ArmorSpawnSettings, GrenadeSettings } from '../model/types.ts';

type Weights = Record<string, number>;
type PreparedItems = Record<string, Record<string, Weights>>;
type PreparedWeapons = Record<string, PreparedItems>;
const RANK_INDICES = [0, 1, 2, 3] as const;

function compressChancesToRanks(chances: RankValues): Record<string, number> {
    const groups: Record<string, string[]> = {};
    for (const i of RANK_INDICES) (groups[chances[i]] ??= []).push(`ERank::${RANKS[i]}`);
    return Object.fromEntries(Object.entries(groups).map(([chance, ranks]) => [ranks.join(','), Number(chance)]));
}
function prepareItems(items: Record<string, ItemWeights>): PreparedItems {
    return Object.fromEntries(Object.entries(items).map(([scope, list]) => {
        const compressed: Record<string, Weights> = {};
        for (const i of RANK_INDICES) {
            const rank = `ERank::${RANKS[i]}`;
            const weights = Object.fromEntries(Object.entries(list).map(([sid, values]) => [sid, values[i]]));
            const match = Object.entries(compressed).find(([, prior]) => JSON.stringify(prior) === JSON.stringify(weights));
            if (match) {
                compressed[`${match[0]}, ${rank}`] = weights;
                delete compressed[match[0]];
            } else compressed[rank] = weights;
        }
        return [scope, compressed];
    }));
}
function prepareWeaponStruct(settings: WeaponSettings): PreparedWeapons {
    return Object.fromEntries(Object.entries(settings).map(([faction, classes]) => [faction, prepareItems(classes)]));
}

/** Pure CFG generation; validates even callers arriving through legacy integrations. */
export function generateLoadout(input: DeepReadonly<LoadoutConfig>): string {
    const config = validateConfig(input);
    if (!Object.values(config.WeaponSettings).some(classes => Object.keys(classes).length > 0)) {
        throw new Error('WeaponSettings: No NPC loadouts to generate');
    }
    // Guard loadouts intentionally reuse GeneralNPC armor/pistol kits. Validate
    // those generated references before emitting a file, including partial JSON.
    for (const faction of Object.keys(config.WeaponSettings)) {
        const shared = faction.replace(/^GuardNPC_/, 'GeneralNPC_');
        if (!Object.hasOwn(config.ArmorSettings, shared) || !Object.hasOwn(config.PistolSettings, shared)) {
            throw new Error(`${faction}: Missing armor or pistol settings for ${shared}`);
        }
    }
    const createArmorItemGenerator = (cArmorName: string, armorSettings: ArmorSpawnSettings)=>{
        //TODO Lootable chances by player rank
        const createLootable = ()=>
        `            [1] : struct.begin
               ItemPrototypeSID = ${armorSettings.dropItem || cArmorName}
               MinDurability = ${config.DropConfigs.nMinDurability}
               MaxDurability = ${config.DropConfigs.nMaxDurability}
               Chance = ${config.DropConfigs.nLootChance}
            struct.end`;

        const createHelmet = ()=>{
            const cHelmet = armorSettings.helmet;
            if (!cHelmet) return '';
            const oHelmet = config.HelmetsSettings[cHelmet];
            if (!oHelmet) return '';

            let cRet = '';
            const fillHelmet = (rank: string, chance: number)=>{
                cRet +=`      [*] : struct.begin\n`;
                cRet +=`         Category = EItemGenerationCategory::Head\n`;
                cRet +=`         PlayerRank = ${rank}\n`;
                cRet +=`         PossibleItems : struct.begin\n`;
                cRet +=`            [0] : struct.begin\n`;
                cRet +=`               ItemPrototypeSID = ${cHelmet}\n`;
                cRet +=`               Chance = ${percentage(chance)}\n`;
                cRet +=`            struct.end\n`;
                cRet +=`         struct.end\n`;
                cRet +=`      struct.end\n`;
            };

            if (Number(armorSettings.helmetSpawn)>0){
                fillHelmet('ERank::Newbie, ERank::Experienced, ERank::Veteran, ERank::Master', Number(armorSettings.helmetSpawn));
            }else{
                const oCompressed = compressChancesToRanks(oHelmet);
                for (const [ranks, ranksValue] of Object.entries(oCompressed)){
                    if (ranksValue == 0) continue;
                    fillHelmet(ranks, ranksValue);
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
${config.DropConfigs.createDroppableArmor && armorSettings.drop ? createLootable() : ''}
         struct.end
      struct.end
${createHelmet()}
   struct.end
struct.end\n`;
    };

    const createArmorLoadoutGenerators = ()=>{
        const oPrepared = prepareItems(config.ArmorSettings);

        let cArmorGenerators = '';
        for (const [faction, factionValue] of Object.entries(oPrepared)){
            cArmorGenerators += `BNPL_${faction}_Armor : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}\n`;
            cArmorGenerators += `   SID = BNPL_${faction}_Armor\n`;
            cArmorGenerators += `   ItemGenerator : struct.begin\n`;
            for (const [rank, rankValue] of Object.entries(factionValue)){
                cArmorGenerators += `      [*] : struct.begin\n`;
                cArmorGenerators += `         Category = EItemGenerationCategory::SubItemGenerator\n`;
                cArmorGenerators += `         PlayerRank = ${rank}\n`;
                cArmorGenerators += `         PossibleItems : struct.begin\n`;
                let iterator = 0;
                for (const [armor, armorValue] of Object.entries(rankValue)){
                    if (armorValue === 0){
                        continue;
                    }
                    cArmorGenerators += `            [${iterator}] : struct.begin\n`;
                    cArmorGenerators += `               ItemGeneratorPrototypeSID = BNPL_${armor}_Kit\n`;
                    cArmorGenerators += `               Weight = ${armorValue}\n`;
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

    const createWeaponStruct = (oWeapon: Weights, faction: string)=>{
        let cRet = '';
        let iterator = 0;
        for (const [weapon, weaponValue] of Object.entries(oWeapon)){
            if (weaponValue === 0){
                continue;
            }
            const effective = effectiveWeapon(config, weapon);
            cRet += `            [${iterator}] : struct.begin\n`;
            cRet += `               ItemPrototypeSID = ${(faction.substring(0, 8) == 'GuardNPC'? 'Guard':'') + weapon}\n`;
            cRet += `               Weight = ${weaponValue}\n`;
            cRet += `               MinDurability = ${percentage(effective.minCondition)}\n`;
            cRet += `               MaxDurability = ${percentage(effective.maxCondition)}\n`;
            cRet += `               AmmoMinCount = ${effective.minAmmo}\n`;
            cRet += `               AmmoMaxCount = ${effective.maxAmmo}\n`;
            cRet += `            struct.end\n`;
            iterator++;
        }
        return cRet;
    };

    const createWeaponGenerators = (preparedData: PreparedWeapons, slot: 'Primary' | 'Secondary')=>{
        let cRet = '';
        for (const [faction, factionValue] of Object.entries(preparedData)){
            for (const [clas, clasValue] of Object.entries(factionValue)){
                cRet += `BNPL_${faction}_${clas}_${slot}_ItemGenerator : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}\n`;
                cRet += `   SID = BNPL_${faction}_${clas}_${slot}_ItemGenerator\n`;
                cRet += '   ItemGenerator : struct.begin\n';
                for (const [rank, rankValue] of Object.entries(clasValue)){
                    cRet += `      [*] : struct.begin\n`;
                    cRet += `         Category = EItemGenerationCategory::Weapon${slot}\n`;
                    cRet += `         PlayerRank = ${rank}\n`;
                    cRet += `         PossibleItems : struct.begin\n`;
                    cRet += createWeaponStruct(rankValue, faction);
                    cRet += `         struct.end\n`;
                    cRet += `      struct.end\n`;
                }
                cRet += `   struct.end\n`;
                cRet += `struct.end\n`;
            }
        }
        return cRet;
    };

    const createPrimaryWeapons = (faction: string, clas: string)=>{
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

    const createSecondaryWeapons = (oSecondary: PreparedWeapons, faction: string, clas: string)=>{
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

    const createPistolsItemGenerators = ()=>{
        const oPrepared = prepareItems(config.PistolSettings);

        let cPistolGenerators = '';

        for (const [faction, factionValue] of Object.entries(oPrepared)){
            cPistolGenerators += `BNPL_${faction}_WeaponPistol : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}\n`;
            cPistolGenerators += `   SID = BNPL_${faction}_WeaponPistol\n`;
            cPistolGenerators += `   ItemGenerator : struct.begin\n`;
            for (const [rank, rankValue] of Object.entries(factionValue)){
                cPistolGenerators += `      [*] : struct.begin\n`;
                cPistolGenerators += `         Category = EItemGenerationCategory::WeaponSecondary\n`;
                cPistolGenerators += `         PlayerRank = ${rank}\n`;
                cPistolGenerators += `         PossibleItems : struct.begin\n`;
                let iterator = 0;
                for (const [pistol, pistolValue] of Object.entries(rankValue)){
                    if (pistolValue === 0){
                        continue;
                    }
                    const effective = effectiveWeapon(config, pistol);
                    cPistolGenerators += `            [${iterator}] : struct.begin\n`;
                    cPistolGenerators += `               ItemPrototypeSID = ${pistol}\n`;
                    cPistolGenerators += `               Weight = ${pistolValue}\n`;
                    cPistolGenerators += `               MinDurability = ${percentage(effective.minCondition)}\n`;
                    cPistolGenerators += `               MaxDurability = ${percentage(effective.maxCondition)}\n`;
                    cPistolGenerators += `               AmmoMinCount = ${effective.minAmmo}\n`;
                    cPistolGenerators += `               AmmoMaxCount = ${effective.maxAmmo}\n`;
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

    const createArmorAndPistol = (faction: string)=>{
        const processedFaction = faction.substring(0, 8) == 'GuardNPC'?'GeneralNPC'+faction.substring(8):faction;
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
        cRet += `               Chance = ${percentage(config.PistolSpawnChance)}\n`;
        cRet += `            struct.end\n`;
        cRet += `         struct.end \n`;
        cRet += `      struct.end\n`;

        return cRet;
    };

    const createConsumables = (clas: string)=>{
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

    const createDetector = ()=>{
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


    const createGrenadeStruct = (oGrenades: Record<string, GrenadeSettings>, rank: RankIndex)=>{
        let cRet = '';
        let iterator = 0;

        for (const [grenade, grenadeValue] of Object.entries(oGrenades)){
            if (grenadeValue.chances[rank] === 0) continue;
            cRet += `            [${iterator}] : struct.begin\n`;
            cRet += `               ItemPrototypeSID = ${grenade}\n`;
            cRet += `               Chance = ${percentage(grenadeValue.chances[rank])}\n`;
            cRet += `               AmmoMinCount = ${grenadeValue.minAmmo[rank]}\n`;
            cRet += `               AmmoMaxCount = ${grenadeValue.maxAmmo[rank]}\n`;
            cRet += `            struct.end\n`;
            iterator++;
        }
        return cRet;
    };

    const createGrenadesItemGenerators = ()=>{
        let cGrenadeGenerators = '';


        for (const [clas, clasValue] of Object.entries(config.GrenadeSettings)){
                cGrenadeGenerators += `BNPL_${clas}_Grenades : struct.begin {refurl=../ItemGeneratorPrototypes.cfg;refkey=[0]}\n`;
                cGrenadeGenerators += `   SID = BNPL_${clas}_Grenades \n`;
                cGrenadeGenerators += `   ItemGenerator : struct.begin\n`;
            for (const rank of RANK_INDICES){
                cGrenadeGenerators += `      [*] : struct.begin\n`;
                cGrenadeGenerators += `         Category = EItemGenerationCategory::Artifact\n`;
                cGrenadeGenerators += `         PlayerRank = ERank::${RANKS[rank]}\n`;
                cGrenadeGenerators += `         PossibleItems : struct.begin\n`;
                cGrenadeGenerators +=              createGrenadeStruct(clasValue, rank)
                cGrenadeGenerators += `         struct.end\n`;
                cGrenadeGenerators += `      struct.end\n`;
            }
                cGrenadeGenerators += `   struct.end\n`;
                cGrenadeGenerators += `struct.end\n`;
        }
        return cGrenadeGenerators;
    };

    const createGrenades = ()=>{
        let cRet = '';
        const cItemGenerator = 'BNPL_Default_Grenades';

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

    const createNVG = (faction: string)=>{
        const processedFaction = faction.substring(0, 8) == 'GuardNPC'?'GeneralNPC'+faction.substring(8):faction;
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



    function createBlankOverride(factionClass: string){ //перетираємо оригінальні структури в тій же кількості, щоб bpatch не лишав старі структури
        const factionClassStrucCount: Record<string, number> = {
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

        const count = factionClassStrucCount[factionClass];
        if (!count) {
            throw new Error(`No structure count found for faction class: ${factionClass}`);
        }

        let retVal = '';
        for (let i=0; i<count; i++){
            retVal += '      [*] : struct.begin\n';
            retVal += '      struct.end\n';
        }

        return retVal;
    }

    let cRet = '//Generated with https://dev.s2-loadout-creator.cc/ \n\n';


    const oPrepared = prepareWeaponStruct(config.WeaponSettings); //Everything based on weapon loadout settings
    const oPreparedSecondary = prepareWeaponStruct(oSecondaryLoadoutSettings); //Everything based on weapon loadout settings

    //creating modded structures
    cRet += `//Armor kits itemgenerators to provide better helmet spawn and features like armor drop\n`;
    for (const [armor, armorValue] of Object.entries(config.ArmorSpawnSettings)){
        cRet += createArmorItemGenerator(armor, armorValue);
    }

    cRet += `//Primary weapons itemgenerators\n`;
    cRet += createWeaponGenerators(oPrepared, 'Primary');


    cRet += `//Secondary weapons itemgenerators\n`;
    cRet += createWeaponGenerators(oPreparedSecondary, 'Secondary');

    cRet += `//Pistols itemgenerators\n`;
    cRet += createPistolsItemGenerators();

    cRet += `//Grenades itemgenerators\n`;
    cRet += createGrenadesItemGenerators();


    cRet += `\n\n`;

    cRet += `//Armor loadout generators, just in top to beautiful structure\n`;
    cRet += createArmorLoadoutGenerators();


    cRet += `//Generated itemgenerators\n`;
    for (const [faction, factionValue] of Object.entries(oPrepared)){
        for (const clas of Object.keys(factionValue)){
            cRet += `${faction}_${clas}_ItemGenerator : struct.begin {bpatch}\n`;
            cRet += `   ItemGenerator : struct.begin {bpatch}\n`;
            cRet +=        createBlankOverride(`${faction}_${clas}`); //nullifying vanilla game data to prevent dublicates
            cRet +=        createPrimaryWeapons(faction, clas);
            cRet +=        createSecondaryWeapons(oPreparedSecondary, faction, clas);
            cRet +=        createArmorAndPistol(faction); //may be splitted in future
            cRet +=        createConsumables(clas);
            cRet +=        createDetector(); //is it works?
            cRet +=        createGrenades();
            cRet +=        createNVG(faction);
            cRet += `   struct.end\n`;
            cRet += `struct.end\n`;
        }
    }

    return cRet;
}
