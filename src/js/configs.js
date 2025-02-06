export const oDropConfigs = {
    createDroppableArmor: false,
    nMinDurability:0.2,
    nMaxDurability:0.8,
    nLootChance:0.1
};

export const oWeaponList = {
    GunObrez_SG: {
        maxAmmo: 4
    },
    GunTOZ_SG: {
        maxAmmo: 4
    },
    GunM860_SG: {},
    GunSPSA_SG: {},
    GunRam2_SG: {},
    GunD12_SG: {},
    GunViper_PP: {},
    GunAKU_PP: {},
    GunBucket_PP: {},
    GunIntegral_PP: {},
    GunZubr_PP: {},
    GunAK74_ST: {},
    GunM16_ST: {},
    GunFora_ST: {},
    GunGvintar_ST: {},
    GunG37_ST: {},
    GunGrim_ST: {},
    GunLavina_ST: {},
    GunDnipro_ST: {},
    GunKharod_ST: {},
    GunSVDM_SP: {},
    GunSVU_SP: {},
    GunMark_SP: {},
    GunM701_SP: {},
    GunGauss_SP: {},
    GunM10_HG: {},
    GunPM_HG: {},
    GunUDP_HG: {},
    GunAPB_HG: {},
    GunRhino_HG: {},
    GunPKP_MG: {},
    GunRpg7_GL: {},
};

export const oUniqueList = { //to future
    GunAK74_Korshunov_ST: {},
    GunAK74_Strelok_ST: {},
    Gun_ProjectY_HG: {},
    Gun_Deadeye_HG: {},
    GunPKP_Korshunov_MG: {},
    Gun_Krivenko_HG: {},
    Gun_Star_HG: {},
    Gun_Encourage_HG: {},
    Gun_GStreet_HG: {},
    Gun_Shakh_SMG: {},
    Gun_Spitter_SMG: {},
    Gun_Silence_SMG: {},
    Gun_RatKiller_SMG: {},
    Gun_Spitfire_SMG: {},
    Gun_Combatant_AR: {},
    Gun_Drowned_AR: {},
    Gun_Lummox_AR: {},
    Gun_Decider_AR: {},
    Gun_Merc_AR: {},
    Gun_Sotnyk_AR: {},
    Gun_Sharpshooter_AR: {},
    Gun_Unknown_AR: {},
    Gun_Trophy_AR: {},
    Gun_SOFMOD_AR: {},
    Gun_S15_AR: {},
    Gun_Predator_SG: {},
    Gun_Sledgehammer_SG: {},
    Gun_Texas_SG: {},
    Gun_Tank_MG: {},
    Gun_Lynx_SR: {},
    Gun_Partner_SR: {},
    Gun_Whip_SR: {},
    Gun_Cavalier_SR: {}
}

export let oArmorSpawnSettings = {
    Jemmy_Neutral_Armor: {
        drop: true,
        helmet: 'Light_Neutral_Helmet',
        helmetSpawn: true
    },
    Newbee_Neutral_Armor:{
        drop: true,
        helmet: 'Light_Neutral_Helmet',
        helmetSpawn: true
    },
    NPC_Sel_Neutral_Armor:{
        drop: false,
        helmet: 'Light_Neutral_Helmet',
        helmetSpawn: true
    },
    Nasos_Neutral_Armor:{
        drop: true,
        helmet: 'Light_Neutral_Helmet',
        helmetSpawn: true
    },
    Zorya_Neutral_Armor:{
        drop: true,
        helmet: 'Light_Neutral_Helmet',
        helmetSpawn: true
    },
    SEVA_Neutral_Armor:{
        drop: true,
        helmet: 'Light_Neutral_Helmet'
    },
    NPC_Cloak_Heavy_Neutral_Armor:{
        drop: false,
        helmet: 'Light_Neutral_Helmet'
    },
    Exoskeleton_Neutral_Armor:{
        drop: true,
        helmet: 'Light_Neutral_Helmet'
    },
    SkinJacket_Bandit_Armor:{
        drop: true,
        helmet: 'Light_Bandit_Helmet',
        helmetSpawn: true
    },
    NPC_SkinCloak_Bandit_Armor:{
        drop: false,
        helmet: 'Light_Bandit_Helmet',
        helmetSpawn: true
    },
    Jacket_Bandit_Armor:{
        drop: true,
        helmet: 'Light_Bandit_Helmet',
        helmetSpawn: true
    },
    Middle_Bandit_Armor:{
        drop: true,
        helmet: 'Light_Bandit_Helmet',
        helmetSpawn: true
    },
    Light_Mercenaries_Armor:{
        drop: true,
        helmet: 'Light_Mercenaries_Helmet',
        helmetSpawn: true
    },
    Heavy_Mercenaries_Armor:{
        drop: true,
        helmet: 'Light_Mercenaries_Helmet',
        helmetSpawn: true
    },
    Exoskeleton_Mercenaries_Armor:{
        drop: true,
        helmet: 'Light_Mercenaries_Helmet'
    },
    NPC_HeavyExoskeleton_Mercenaries_Armor:{
        drop: true,
        dropItem: 'Exoskeleton_Mercenaries_Armor',
        helmet: 'Light_Mercenaries_Helmet'
    },
    Anomaly_Scientific_Armor: {
        drop: true,
        helmet: 'Light_Mercenaries_Helmet'
    },
    NPC_Sci_Armor:{
        drop: false
    },
    HeavyAnomaly_Scientific_Armor:{
        drop: true,
        helmet: 'Light_Mercenaries_Helmet'
    },
    Default_Military_Armor:{
        drop: true,
        helmet: 'Light_Military_Helmet',
        helmetSpawn: true
    },
    NPC_Cloak_Heavy_Military_Armor:{
        drop: true,
        dropItem: 'Heavy2_Military_Armor',
        helmet: 'Battle_Military_Helmet'
    },
    NPC_Heavy_Military_Armor:{
        drop: true,
        dropItem: 'Heavy2_Military_Armor',
        helmet: 'Battle_Military_Helmet'
    },
    Heavy2_Military_Armor:{
        drop: true,
        helmet: 'Battle_Military_Helmet'
    },
    Battle_Monolith_Armor:{
        drop: true,
        helmet: 'Battle_Military_Helmet',
        helmetSpawn: true
    },
    HeavyAnomaly_Monolith_Armor:{
        drop: true,
        helmet: 'Battle_Military_Helmet'
    },
    HeavyExoskeleton_Monolith_Armor:{
        drop: true,
        helmet: 'Battle_Military_Helmet'
    },
    Exoskeleton_Monolith_Armor:{
        drop: true,
        helmet: 'Battle_Military_Helmet'
    },
    Rook_Dolg_Armor:{
        drop: true,
        helmet: 'Light_Duty_Helmet',
        helmetSpawn: true
    },
    Battle_Dolg_Armor:{
        drop: true,
        helmet: 'Heavy_Duty_Helmet',
        helmetSpawn: true
    },
    SEVA_Dolg_Armor:{
        drop: true,
        helmet: 'Heavy_Duty_Helmet'
    },
    Heavy_Dolg_Armor:{
        drop: true,
        helmet: 'Heavy_Duty_Helmet'
    },
    Exoskeleton_Dolg_Armor:{
        drop: true,
        helmet: 'Heavy_Duty_Helmet'
    },
    HeavyExoskeleton_Dolg_Armor:{
        drop: true,
        helmet: 'Heavy_Duty_Helmet'
    },
    Rook_Svoboda_Armor:{
        drop: true,
        helmet: 'Heavy_Svoboda_Helmet',
        helmetSpawn: true
    },
    Battle_Svoboda_Armor:{
        drop: true,
        helmet: 'Heavy_Svoboda_Helmet',
        helmetSpawn: true
    },
    SEVA_Svoboda_Armor:{
        drop: true,
        helmet: 'Heavy_Svoboda_Helmet'
    },
    Heavy_Svoboda_Armor:{
        drop: true,
        helmet: 'Heavy_Svoboda_Helmet'
    },
    Exoskeleton_Svoboda_Armor:{
        drop: true,
        helmet: 'Heavy_Svoboda_Helmet'
    },
    HeavyExoskeleton_Svoboda_Armor:{
        drop: true,
        helmet: 'Heavy_Svoboda_Helmet'
    },
    Battle_Varta_Armor:{
        drop: true,
        helmet: 'Heavy_Varta_Helmet',
        helmetSpawn: true
    },
    BattleExoskeleton_Varta_Armor:{
        drop: true,
        helmet: 'Heavy_Varta_Helmet'
    },
    NPC_Battle_Noon_Armor:{
        drop: true,
        dropItem: 'Battle_Monolith_Armor',
        helmet: 'Battle_Military_Helmet',
        helmetSpawn: true
    },
    NPC_HeavyAnomaly_Noon_Armor:{
        drop: true,
        dropItem: 'HeavyAnomaly_Monolith_Armor',
        helmet: 'Battle_Military_Helmet'
    },
    NPC_Exoskeleton_Noon_Armor:{
        drop: true,
        dropItem: 'Exoskeleton_Monolith_Armor',
        helmet: 'Battle_Military_Helmet'
    },
    NPC_HeavyExoskeleton_Noon_Armor:{
        drop: true,
        dropItem: 'HeavyExoskeleton_Monolith_Armor',
        helmet: 'Battle_Military_Helmet'
    },
    Battle_Spark_Armor:{
        drop: true,
        helmet: 'Battle_Military_Helmet',
        helmetSpawn: true
    },
    NPC_Anomaly_Spark_Armor:{
        drop: true,
        dropItem: 'HeavyAnomaly_Spark_Armor',
        helmet: 'Battle_Military_Helmet'
    },
    HeavyAnomaly_Spark_Armor:{
        drop: true,
        helmet: 'Battle_Military_Helmet'
    },
    SEVA_Spark_Armor:{
        drop: true,
        helmet: 'Battle_Military_Helmet'
    },
    HeavyBattle_Spark_Armor:{
        drop: true,
        helmet: 'Battle_Military_Helmet'
    },
    NPC_HeavyExoskeleton_Spark_Armor:{
        drop: true,
        dropItem: 'Exoskeleton_Neutral_Armor',
        helmet: 'Battle_Military_Helmet'
    },
    NPC_Heavy_Corps_Armor:{
        drop: true,
        dropItem: 'Heavy2_Military_Armor',
        helmet: 'Battle_Military_Helmet'
    },
    NPC_Heavy2_Coprs_Armor:{
        drop: true,
        dropItem: 'Heavy2_Military_Armor',
        helmet: 'Battle_Military_Helmet'
    },
    NPC_Heavy3_Corps_Armor:{
        drop: true,
        dropItem: 'Heavy2_Military_Armor',
        helmet: 'Battle_Military_Helmet'
    },
    NPC_Heavy3Exoskeleton_Coprs_Armor:{
        drop: true,
        dropItem: 'Exoskeleton_Neutral_Armor',
        helmet: 'Battle_Military_Helmet'
    },
    NPC_Exoskeleton_Coprs_Armor:{
        drop: true,
        dropItem: 'Exoskeleton_Neutral_Armor',
        helmet: 'Battle_Military_Helmet'
    },
    SEVA_Monolith_Armor:{ //preorder item, but monolith seva bois wear it
        drop: false
    }
};

export let oArmorLoadoutSettings = {
    GeneralNPC_Neutral:{
        Jemmy_Neutral_Armor: [45, 25, 15, 10],
        Newbee_Neutral_Armor: [10, 7, 5, 2],
        NPC_Sel_Neutral_Armor: [15, 11, 7, 5],
        Nasos_Neutral_Armor: [10, 20, 13, 10],
        Zorya_Neutral_Armor: [10, 20, 20, 15],
        SEVA_Neutral_Armor: [5, 8, 22, 20],
        NPC_Cloak_Heavy_Neutral_Armor: [5, 7, 14, 30],
        Exoskeleton_Neutral_Armor: [0, 2, 4, 8]
    },
    GeneralNPC_Bandit:{
        SkinJacket_Bandit_Armor: [40, 20, 15, 11],
        NPC_SkinCloak_Bandit_Armor: [40, 20, 15, 11],
        Jacket_Bandit_Armor: [15, 30, 35, 35],
        Middle_Bandit_Armor: [5, 30, 34, 40],
        Exoskeleton_Mercenaries_Armor: [0, 0, 1, 3]
    },
    GeneralNPC_Mercenaries:{
        Light_Mercenaries_Armor: [85, 70, 43, 30],
        Heavy_Mercenaries_Armor: [15, 28, 54, 60],
        Exoskeleton_Mercenaries_Armor: [0, 1, 2, 5],
        NPC_HeavyExoskeleton_Mercenaries_Armor: [0, 1, 1, 5]
    },
    GeneralNPC_Scientists:{
        Anomaly_Scientific_Armor: [50, 50, 30, 20],
        NPC_Sci_Armor: [50, 0, 0, 0],
        HeavyAnomaly_Scientific_Armor: [0, 50, 70, 80]
    },
    GeneralNPC_Militaries:{
        Default_Military_Armor: [80, 70, 45, 20],
        NPC_Cloak_Heavy_Military_Armor: [10, 15, 25, 25],
        NPC_Heavy_Military_Armor: [7, 12, 15, 30],
        Heavy2_Military_Armor: [3, 3, 15, 25]
    },
    GeneralNPC_Monolith:{
        Battle_Monolith_Armor: [90, 80, 66, 44],
        HeavyAnomaly_Monolith_Armor: [9, 19, 30, 46],
        HeavyExoskeleton_Monolith_Armor: [0, 0, 2, 5],
        Exoskeleton_Monolith_Armor: [1, 1, 2, 5]
    },
    GeneralNPC_Duty:{
        Rook_Dolg_Armor: [65, 34, 15, 12],
        Battle_Dolg_Armor: [15, 35, 34, 25],
        SEVA_Dolg_Armor: [12, 20, 20, 22],
        Heavy_Dolg_Armor: [7, 8, 27, 31],
        Exoskeleton_Dolg_Armor: [1, 2, 2, 5],
        HeavyExoskeleton_Dolg_Armor: [0, 1, 2, 5]
    },
    GeneralNPC_Freedom:{
        Rook_Svoboda_Armor: [65, 34, 17, 16],
        Battle_Svoboda_Armor: [12, 20, 26, 26],
        SEVA_Svoboda_Armor: [15, 35, 35, 30],
        Heavy_Svoboda_Armor: [7, 8, 18, 18],
        Exoskeleton_Svoboda_Armor: [1, 2, 2, 5],
        HeavyExoskeleton_Svoboda_Armor: [0, 1, 2, 5]
    },
    GeneralNPC_Varta:{
        Battle_Varta_Armor: [100, 98, 94, 90],
        BattleExoskeleton_Varta_Armor: [0, 2, 6, 10]
    },
    GeneralNPC_Noon:{
        NPC_Battle_Noon_Armor: [90, 80, 66, 42],
        NPC_HeavyAnomaly_Noon_Armor: [9, 19, 30, 50],
        NPC_Exoskeleton_Noon_Armor: [1, 1, 2, 4],
        NPC_HeavyExoskeleton_Noon_Armor: [0, 0, 2, 4]
    },
    GeneralNPC_Spark:{
        Battle_Spark_Armor: [75, 65, 30, 15],
        NPC_Anomaly_Spark_Armor: [15, 15, 24, 15],
        HeavyAnomaly_Spark_Armor: [5, 8, 15, 20],
        SEVA_Spark_Armor: [5, 8, 15, 20],
        HeavyBattle_Spark_Armor: [0, 3, 12, 20],
        NPC_HeavyExoskeleton_Spark_Armor: [0, 1, 4, 10]
    },
    GeneralNPC_Corpus:{
        NPC_Heavy_Corps_Armor: [3, 7, 19, 20],
        NPC_Heavy2_Coprs_Armor: [3, 6, 19, 20],
        NPC_Heavy3_Corps_Armor: [3, 6, 19, 20],
        NPC_Heavy3Exoskeleton_Coprs_Armor: [0, 0, 2, 5],
        NPC_Exoskeleton_Coprs_Armor: [0, 1, 2, 5]
    }
};

export let oHelmetsGlobalSpawnSettings = {
    Light_Neutral_Helmet: [30, 50, 60, 70],
    Light_Bandit_Helmet: [0, 50, 60, 70],
    Light_Mercenaries_Helmet: [30, 50, 60, 70],
    Light_Military_Helmet: [30, 0, 0, 0],
    Battle_Military_Helmet: [0, 50, 60, 70],
    Light_Duty_Helmet: [30, 0, 0, 0],
    Heavy_Duty_Helmet: [0, 50, 60, 70],
    Heavy_Svoboda_Helmet: [20, 50, 60, 70],
    Heavy_Varta_Helmet: [30, 50, 60, 70],
    Heavy_Military_Helmet: [0, 0, 60, 70]
}

export let oWeaponLoadoutSettings = {
    GeneralNPC_Neutral:{
        CloseCombat:{
            GunObrez_SG: [90, 10, 0, 0],
            GunTOZ_SG: [10, 90, 30, 10],
            GunM860_SG: [0, 0, 60, 30],
            GunSPSA_SG: [0, 0, 10, 60]
        },
        Recon:{
            GunViper_PP: [90, 42, 20, 0],
            GunAKU_PP: [10, 52.5, 25, 20],
            GunBucket_PP: [0, 5.5, 50, 40],
            GunIntegral_PP: [0, 0, 5, 40]
        },
        Sniper:{
            GunAK74_ST: [90, 27.7, 0, 0],
            GunM16_ST: [10, 55.5, 0, 0],
            GunFora_ST: [0, 5.6, 20, 10],
            GunGvintar_ST: [0, 5.6, 30, 20],
            GunSVDM_SP: [0, 5.6, 50, 70]
        },
        Stormtrooper:{
            GunAK74_ST: [50, 29.4, 0, 0],
            GunM16_ST: [50, 58.8,22.7, 0],
            GunFora_ST: [0, 5.9, 22.7, 19.2],
            GunGvintar_ST: [0, 5.9, 45.5, 19.2],
            GunG37_ST: [0, 0, 4.6, 19.2],
            GunGrim_ST: [0, 0, 4.6, 38.5],
            GunLavina_ST: [0, 0, 0, 3.9]
        }
    },
    GeneralNPC_Bandit:{
        CloseCombat:{
            GunObrez_SG: [100, 10, 5, 5],
            GunTOZ_SG: [0, 65, 10, 5],
            GunM860_SG: [0, 7, 65, 55],
            GunM10_HG: [0, 18, 10, 5],
            GunSPSA_SG: [0, 0, 10, 30]
        },
        Recon:{
            GunM10_HG: [0, 14.3, 19, 6],
            GunViper_PP: [83.3, 33.33, 20, 5],
            GunAKU_PP: [16.6, 47.7, 45, 55],
            GunBucket_PP: [0, 4.8, 15, 29],
            GunIntegral_PP: [0, 0, 1, 5]
        },
        Stormtrooper:{
            GunViper_PP: [90, 0, 0, 0],
            GunAKU_PP: [10, 0, 0, 0],
            GunAK74_ST: [0, 70, 42, 35],
            GunM16_ST: [0, 10, 10, 7],
            GunFora_ST: [0, 10, 10, 7],
            GunGvintar_ST: [0, 0, 6, 6],
            GunG37_ST: [0, 10, 32, 35],
            GunGrim_ST: [0, 0, 0, 10]
        },
        Heavy:{
            GunViper_PP: [90, 0, 0, 0],
            GunAKU_PP: [10, 0, 0, 0],
            GunAK74_ST: [0, 70, 40, 29],
            GunM16_ST: [0, 10, 10, 4],
            GunFora_ST: [0, 10, 10, 4],
            GunGvintar_ST: [0, 0, 6, 8],
            GunG37_ST: [0, 10, 31, 29],
            GunGrim_ST: [0, 0, 0, 15],
            GunLavina_ST: [0, 0, 0, 1],
            GunPKP_MG: [0, 0, 3, 10]
        }
    },
    GeneralNPC_Mercenaries:{
        CloseCombat:{
            GunM860_SG: [100, 100, 83.3, 30],
            GunSPSA_SG: [0, 0, 16.7, 60],
            GunRam2_SG: [0, 0, 0, 10],
        },
        Recon:{
            GunViper_PP: [100, 100, 71.4, 28.6],
            GunIntegral_PP: [0, 0, 28.6, 71.4]
        },
        Stormtrooper:{
            GunM16_ST: [90.9, 70, 30, 16.7],
            GunFora_ST: [0, 5, 10, 16.7],
            GunG37_ST: [9.1, 25, 60, 33.3],
            GunKharod_ST: [0, 0, 0, 33.3]
        },
        Sniper:{
            GunSVDM_SP: [90.9, 70, 28.6, 0],
            GunMark_SP: [9.1, 30, 71.4, 66.7],
            GunM701_SP: [0, 0, 0, 33.3]
        }
    },
    GeneralNPC_Scientists:{
        Recon:{
            GunViper_PP: [100, 80, 70, 50],
            GunM860_SG: [0, 20, 10, 10],
            GunSPSA_SG: [0, 0, 10, 10],
            GunIntegral_PP: [0, 0, 10, 30]
        },
        Stormtrooper:{
            GunViper_PP: [90.9, 50, 30, 10],
            GunM16_ST: [9.1, 30, 40, 40],
            GunFora_ST: [0, 10, 15, 25],
            GunG37_ST: [0, 10, 15, 25]
        }
    },
    GeneralNPC_Militaries:{
        CloseCombat:{
            GunAKU_PP: [100, 0, 0, 0],
            GunM860_SG: [0, 100, 90, 46],
            GunD12_SG: [0, 0, 0, 33],
            GunSPSA_SG: [0, 0, 10, 21]
        },
        Recon:{
            GunAKU_PP: [100, 83.3, 42.1, 20],
            GunBucket_PP: [0, 16.7, 52.6, 30],
            GunZubr_PP: [0, 0, 5.3, 50]
        },
        Stormtrooper:{
            GunAK74_ST: [80, 73, 15, 7],
            GunAKU_PP: [20, 10, 5, 3],
            GunGvintar_ST: [0, 17, 40, 15],
            GunGrim_ST: [0, 0, 40, 15],
            GunLavina_ST: [0, 0, 0, 30],
            GunDnipro_ST: [0, 0, 0, 30]
        },
        Sniper:{
            GunAK74_ST: [100, 0, 0, 0],
            GunGvintar_ST: [0, 10, 30, 20],
            GunSVDM_SP: [0, 90, 70, 60],
            GunSVU_SP: [0, 0, 0, 20]
        },
        Heavy:{
            GunAK74_ST: [100, 83.3, 16, 10],
            GunGvintar_ST: [0, 16.7, 40, 25],
            GunGrim_ST: [0, 0, 40, 25],
            GunPKP_MG: [0, 0, 4, 40]
        }
    },
    GeneralNPC_Monolith:{
        CloseCombat:{
            GunM860_SG: [100, 100, 44.4, 11.8],
            GunSPSA_SG: [0, 0, 55.6, 29.4],
            GunRam2_SG: [0, 0, 0, 29.4],
            GunD12_SG: [0, 0, 0, 29.4]
        },
        Recon:{
            GunViper_PP: [47.6, 42, 20, 5],
            GunAKU_PP: [47.6, 42, 30, 10],
            GunBucket_PP: [4.8, 16, 42, 25],
            GunIntegral_PP: [0, 0, 8, 30],
            GunZubr_PP: [0, 0, 0, 25],
            GunGauss_SP: [0, 0, 0, 5]

        },
        Stormtrooper:{
            GunM16_ST: [83.3, 50, 16, 8],
            GunFora_ST: [8.3, 30, 40, 20],
            GunG37_ST: [8.3, 20, 40, 12],
            GunGrim_ST: [0, 0, 4, 19],
            GunLavina_ST: [0, 0, 0, 19],
            GunKharod_ST: [0, 0, 0, 19],
            GunGauss_SP: [0, 0, 0, 3]
        },
        Sniper:{
            GunSVDM_SP: [90.9, 70, 33, 20],
            GunMark_SP: [9.1, 30, 33, 40],
            GunM701_SP: [0, 0, 33, 17],
            GunSVU_SP: [0, 0, 0, 17],
            GunGauss_SP: [0, 0, 0, 6]
        }
    },
    GeneralNPC_Duty:{
        CloseCombat:{
            GunTOZ_SG: [50, 40, 30, 15],
            GunM860_SG: [50, 60, 50, 40],
            GunSPSA_SG: [0, 0, 20, 20],
            GunD12_SG: [0, 0, 0, 25]
        },
        Recon:{
            GunAKU_PP: [90.9, 80, 45, 20],
            GunBucket_PP: [9.1, 20, 50, 55],
            GunZubr_PP: [0, 0, 5, 25]
        },
        Stormtrooper:{
            GunAK74_ST: [81, 70, 40, 30],
            GunAKU_PP: [10, 10, 5, 0],
            GunGvintar_ST: [9, 20, 43, 20],
            GunGrim_ST: [0, 0, 6, 25],
            GunLavina_ST: [0, 0, 6, 25]
        },
        Sniper:{
            GunAK74_ST: [83.3, 40, 0, 0],
            GunGvintar_ST: [8.3, 30, 30, 20],
            GunSVDM_SP: [8.3, 30, 70, 50],
            GunSVU_SP: [0, 0, 0, 30]
        },
        Heavy:{
            GunAK74_ST: [90.9, 85, 20, 10],
            GunGvintar_ST: [9.1, 15, 56, 20],
            GunGrim_ST: [0, 0, 10, 15],
            GunLavina_ST: [0, 0, 10, 15],
            GunPKP_MG: [0, 0, 4, 40]
        }
    },
    GeneralNPC_Freedom:{
        CloseCombat:{
            GunM860_SG: [100, 100, 80, 16.7],
            GunSPSA_SG: [0, 0, 20, 55.6],
            GunRam2_SG: [0, 0, 0, 27.8]
        },
        Recon:{
            GunViper_PP: [100, 100, 83.3, 62.5],
            GunIntegral_PP: [0, 0, 16.7, 37.5]
        },
        Stormtrooper:{
            GunM16_ST: [90.9, 70, 40, 20],
            GunFora_ST: [0, 10, 20, 20],
            GunG37_ST: [9.1, 20, 40, 40],
            GunKharod_ST: [0, 0, 0, 20]
        },
        Sniper:{
            GunMark_SP: [100, 100, 62.5, 62.5],
            GunM701_SP: [0, 0, 37.5, 37.5],
        }
    },
    GeneralNPC_Varta:{
        CloseCombat:{
            GunViper_PP:[50, 42.1, 0, 0],
            GunAKU_PP: [50, 52.6, 0, 0],
            GunM860_SG: [0, 5.3, 50, 40],
            GunSPSA_SG: [0, 0, 50, 40],
            GunRam2_SG: [0, 0, 0, 10],
            GunD12_SG: [0, 0, 0, 10]
        },
        Recon:{
            GunViper_PP: [50, 42.1, 15, 5],
            GunAKU_PP: [50, 52.6, 27, 8],
            GunBucket_PP: [0, 5.3, 52, 12],
            GunIntegral_PP: [0, 0, 6, 50],
            GunZubr_PP: [0, 0, 0, 25]
        },
        Stormtrooper:{
            GunAK74_ST: [90.9, 30, 10, 5],
            GunM16_ST: [9.1, 60, 20, 5],
            GunFora_ST: [0, 10, 60, 40],
            GunG37_ST: [0, 0, 10, 20],
            GunKharod_ST: [0, 0, 0, 15],
            GunDnipro_ST: [0, 0, 0, 15]
        },
        Sniper:{
            GunAK74_ST: [90.9, 0, 0, 0],
            GunM16_ST: [9.1, 70, 0, 0],
            GunFora_ST: [0, 20, 0, 0],
            GunMark_SP: [0, 10, 66.7, 60],
            GunM701_SP: [0, 0, 33.3, 40]
        },
        Heavy:{
            GunAK74_ST: [90.9, 30, 15, 5],
            GunM16_ST: [9.1, 60, 20, 15],
            GunFora_ST: [0, 10, 43, 20],
            GunG37_ST: [0, 0, 16, 20],
            GunPKP_MG: [0, 0, 6, 40]
        }
    },
    GeneralNPC_Noon:{
        CloseCombat:{
            GunObrez_SG: [90.9, 0, 0, 0],
            GunTOZ_SG: [9.1, 76.9, 76.9, 76.9],
            GunM860_SG: [0, 23.1, 23.1, 23.1]
        },
        Recon:{
            GunViper_PP: [50, 42.1, 42.1, 42.1],
            GunAKU_PP: [50, 52.6, 52.6, 52.6],
            GunBucket_PP: [0, 5.3, 5.3, 5.3]
        },
        Stormtrooper:{
            GunAK74_ST: [100, 76.9, 76.9, 76.9],
            GunM16_ST: [0, 23.1, 23.1, 23.1]
        },
        Sniper:{
            GunAK74_ST: [100, 62.5, 62.5, 62.5],
            GunM16_ST: [0, 18.8, 18.8, 18.8],
            GunSVDM_SP: [0, 12.5, 12.5, 12.5],
            GunMark_SP: [0, 6.2, 6.2, 6.2]
        }
    },
    GeneralNPC_Spark:{
        CloseCombat:{
            GunTOZ_SG: [50, 30, 15, 5],
            GunM860_SG: [50, 70, 60, 17],
            GunSPSA_SG: [0, 0, 25, 39],
            GunD12_SG: [0, 0, 0, 39]
        },
        Recon:{
            GunViper_PP: [47.6, 47.6, 5.9, 5],
            GunAKU_PP: [47.6, 47.6, 35.3, 30],
            GunBucket_PP: [4.8, 4.8, 58.8, 50],
            GunIntegral_PP: [0, 0, 0, 7.5],
            GunZubr_PP: [0, 0, 0, 7.5]
        },
        Stormtrooper:{
            GunAK74_ST: [45.5, 45.5, 19, 5],
            GunM16_ST: [45.5, 45.5, 23.8, 5],
            GunFora_ST: [4.6, 4.6, 0, 0],
            GunGvintar_ST: [4.6, 4.6, 47.6, 15],
            GunG37_ST: [0, 0, 4.8, 15],
            GunGrim_ST: [0, 0, 4.8, 36],
            GunLavina_ST: [0, 0, 0, 4],
            GunDnipro_ST: [0, 0, 0, 20]
        },
        Sniper:{
            GunAK74_ST: [43.5, 43.5, 0, 0],
            GunM16_ST: [43.5, 43.5, 0, 0],
            GunFora_ST: [4.4, 4.4, 0, 0],
            GunGvintar_ST: [4.4, 4.4, 5, 0],
            GunSVDM_SP: [4.4, 4.4, 95, 90.9],
            GunSVU_SP: [0, 0, 0, 9.1]
        }
    },
    GeneralNPC_Corpus:{
        CloseCombat:{
            GunSPSA_SG: [90.9, 90.9, 90.9, 26.7],
            GunD12_SG: [9.1, 9.1, 9.1, 66.7],
            GunRam2_SG: [0, 0, 0, 6.7]
        },
        Recon:{
            GunBucket_PP: [90.9, 90.9, 90.9, 33.3],
            GunZubr_PP: [9.1, 9.1, 9.1, 66.7]
        },
        Stormtrooper:{
            GunGvintar_ST: [90.9, 90.9, 90.9, 0],
            GunGrim_ST: [9.1, 9.1, 9.1, 33.3],
            GunLavina_ST: [0, 0, 0, 33.3],
            GunDnipro_ST: [0, 0, 0, 33.3]
        },
        Sniper:{
            GunM701_SP: [100, 100, 100, 30],
            GunSVU_SP: [0, 0, 0, 70]
        },
        Heavy:{
            GunGvintar_ST: [90.9, 90.9, 50, 25],
            GunGrim_ST: [9.1, 9.1, 20, 25],
            GunPKP_MG: [0, 0, 30, 50]
        }
    },
    GuardNPC_Neutral:{
        CloseCombat:{
            GunObrez_SG: [50, 50, 0, 0],
            GunTOZ_SG: [50, 50, 0, 0],
            GunM860_SG: [0, 0, 100, 50],
            GunSPSA_SG: [0, 0, 0, 50]
        },
        Recon:{
            GunViper_PP: [100, 50, 33.3, 33.3],
            GunAKU_PP: [0, 50, 33.3, 33.3],
            GunBucket_PP: [0, 0, 33.3, 33.3]
        },
        Stormtrooper:{
            GunAK74_ST: [50, 50, 0, 0],
            GunM16_ST: [50, 50, 0, 0],
            GunFora_ST: [0, 0, 50, 50],
            GunG37_ST: [0, 0, 50, 50]
        },
        Sniper:{
            GunSVDM_SP: [100, 100, 100, 100]
        }
    },
    GuardNPC_Bandit:{
        CloseCombat:{
            GunObrez_SG: [100, 100, 0, 0],
            GunSPSA_SG: [0, 0, 100, 100]
        },
        Recon:{
            GunViper_PP: [50, 50, 50, 50],
            GunAKU_PP: [50, 50, 50, 50]
        },
        Stormtrooper:{
            GunAK74_ST: [100, 100, 100, 100]
        },
        Heavy:{
            GunPKP_MG: [100, 100, 100, 100]
        }
    },
    GuardNPC_Monolith:{
        CloseCombat:{
            GunM860_SG: [50, 50, 50, 0],
            GunSPSA_SG: [50, 50, 50, 0],
            GunD12_SG: [0, 0, 0, 50],
            GunRam2_SG: [0, 0, 0, 50]
        },
        Recon:{
            GunViper_PP: [100, 100, 0, 0],
            GunIntegral_PP: [0, 0, 100, 100]
        },
        Stormtrooper:{
            GunAK74_ST: [50, 0, 0, 0],
            GunM16_ST: [50, 0, 0, 0],
            GunG37_ST: [0, 50, 33.3, 0],
            GunGrim_ST: [0, 50, 33.3, 0],
            GunGvintar_ST: [0, 0, 33.3, 0],
            GunKharod_ST: [0, 0, 0, 50],
            GunLavina_ST: [0, 0, 0, 50]
        },
        Sniper:{
            GunSVDM_SP: [76.9, 76.9, 76.9, 76.9],
            GunMark_SP: [23.1, 23.1, 23.1, 23.1]
        }
    },
    GuardNPC_Duty:{
        CloseCombat:{
            GunM860_SG: [100, 100, 100, 0],
            GunD12_SG: [0, 0, 0, 100]
        },
        Recon:{
            GunZubr_PP: [100, 100, 100, 100]
        },
        Stormtrooper:{
            GunAK74_ST: [90.9, 90.9, 0, 0],
            GunGrim_ST: [9.1, 9.1, 50, 50],
            GunGvintar_ST: [0, 0, 50, 0],
            GunLavina_ST: [0, 0, 0, 50]
        },
        Sniper:{
            GunSVDM_SP: [100, 100, 100, 100]
        },
        Heavy:{
            GunPKP_MG: [100, 100, 100, 100]
        }
    },
    GuardNPC_Freedom:{
        CloseCombat:{
            GunSPSA_SG: [100, 100, 100, 0],
            GunRam2_SG: [0, 0, 0, 100]
        },
        Recon:{
            GunViper_PP: [100, 100, 100, 100]
        },
        Stormtrooper:{
            GunM16_ST: [100, 100, 0, 0],
            GunG37_ST: [0, 0, 100, 0],
            GunKharod_ST: [0, 0, 0, 100]
        },
        Sniper:{
            GunSVDM_SP: [100, 100, 0, 0],
            GunM701_SP: [0, 0, 100, 100]
        }
    },
    GuardNPC_Varta:{
        CloseCombat:{
            GunM860_SG: [100, 100, 100, 0],
            GunRam2_SG: [0, 0, 0, 100]
        },
        Recon:{
            GunViper_PP: [50, 50, 50, 50],
            GunAKU_PP: [50, 50, 50, 50]
        },
        Stormtrooper:{
            GunAK74_ST: [100, 100, 0, 0],
            GunFora_ST: [0, 0, 100, 0],
            GunKharod_ST: [0, 0, 0, 100]
        },
        Sniper:{
            GunMark_SP: [100, 100, 100, 0],
            GunM701_SP: [0, 0, 0, 100]
        },
        Heavy:{
            GunPKP_MG: [100, 100, 100, 100]
        }
    },
    GuardNPC_Noon:{
        CloseCombat:{
            GunM860_SG: [50, 50, 50, 50],
            GunSPSA_SG: [50, 50, 50, 50]
        },
        Recon:{
            GunViper_PP: [100, 100, 100, 100]
        },
        Stormtrooper:{
            GunAK74_ST: [50, 0, 0, 0],
            GunM16_ST: [50, 0, 0, 0],
            GunG37_ST: [0, 50, 50, 50],
            GunGrim_ST: [0, 50, 50, 50]
        },
        Sniper:{
            GunSVDM_SP: [50, 50, 50, 50],
            GunMark_SP: [50, 50, 50, 50]
        }
    },
    GuardNPC_Corpus:{
        CloseCombat:{
            GunD12_SG: [100, 100, 100, 0],
            GunRam2_SG: [0, 0, 0, 100]
        },
        Recon:{
            GunAKU_PP: [100, 0, 0, 0],
            GunBucket_PP: [0, 100, 0, 0],
            GunZubr_PP: [0, 0, 100, 100]
        },
        Stormtrooper:{
            GunFora_ST: [50, 50, 0, 0],
            GunGrim_ST: [50, 50, 0, 0],
            GunGvintar_ST: [0, 0, 100, 0],
            GunDnipro_ST: [0, 0, 0, 100]
        },
        Sniper:{
            GunSVU_SP: [100, 100, 100, 100]
        },
        Heavy:{
            GunPKP_MG: [100, 100, 100, 100]
        }
    }
};

export const oSecondaryLoadoutSettings = {
    GuardNPC_Monolith: {
        Stormtrooper: {
            GunRpg7_GL: [0, 0, 0, 66.6],
            GunGauss_SP: [0, 0, 0, 33.3]
        }
    },
    GuardNPC_Freedom: {
        Stormtrooper: {
            GunRpg7_GL: [0, 0, 0, 100],
        },
        Sniper: {
            GunViper_PP: [100, 100, 100, 100]
        }
    },
    GuardNPC_Varta: {
        Stormtrooper: {
            GunRpg7_GL: [0, 0, 0, 100],
        },
        Sniper: {
            GunAKU_PP: [100, 100, 100, 0]
        }
    },
    GuardNPC_Corpus: {
        Stormtrooper: {
            GunRpg7_GL: [0, 0, 0, 100],
        }
    }
};

export const oPistolLoadoutSettings = {
    GeneralNPC_Neutral: {
        GunPM_HG: [100, 47.5, 20, 19],
        GunUDP_HG: [0, 47.5, 40, 38.5],
        GunM10_HG: [0, 5, 40, 38.5],
        GunAPB_HG: [0, 0, 0, 4]
    },
    GeneralNPC_Bandit: {
        GunPM_HG: [100, 100, 100, 100]
    },
    GeneralNPC_Mercenaries: {
        GunUDP_HG: [100, 100, 50, 50],
        GunM10_HG: [0, 0, 50, 50]
    },
    GeneralNPC_Scientists: {
        GunUDP_HG: [100, 100, 100, 100]
    },
    GeneralNPC_Militaries: {
        GunPM_HG: [100, 100, 90.9, 50],
        GunAPB_HG: [0, 0, 9.1, 50]
    },
    GeneralNPC_Monolith: {
        GunUDP_HG: [100, 100, 90.9, 50],
        GunAPB_HG: [0, 0, 9.1, 50]
    },
    GeneralNPC_Duty: {
        GunPM_HG: [100, 100, 90.9, 50],
        GunAPB_HG: [0, 0, 9.1, 50]
    },
    GeneralNPC_Freedom: {
        GunUDP_HG: [100, 100, 90.9, 50],
        GunM10_HG: [0, 0, 9.1, 50]
    },
    GeneralNPC_Varta: {
        GunPM_HG: [90.9, 50, 0, 0],
        GunUDP_HG: [9.1, 50, 90.9, 50],
        GunAPB_HG: [0, 0, 9.1, 50]
    },
    GeneralNPC_Noon: {
        GunPM_HG: [90.9, 0, 0, 0],
        GunUDP_HG: [9.1, 100, 100, 100],
    },
    GeneralNPC_Spark: {
        GunUDP_HG: [90.9, 90.9, 47.6, 47.6],
        GunM10_HG: [9.1, 9.1, 47.6, 47.6],
        GunAPB_HG: [0, 0, 4.8, 4.8]
    },
    GeneralNPC_Corpus: {
        GunPM_HG: [90.9, 90.9, 90.9, 50],
        GunAPB_HG: [9.1, 9.1, 9.1, 50],
    }
};

export const oGrenadesSettings = {
    Default: {
        GrenadeF1: {
            chances: [0, 20, 50, 70],
            minAmmo: [0, 0, 0, 0],
            maxAmmo: [1, 1, 1, 2]
        },
        GrenadeRGD5: {
            chances: [100, 80, 50, 30],
            minAmmo: [0, 0, 0, 0],
            maxAmmo: [1, 1, 2, 2]
        }
    }
};

export const nPistolLootChance = 0.3;

export const nMinWeaponDurability = 0.25;
export const nMaxWeaponDurability = 0.5;

export const oAmmoByWeaponClass = {
    SG: [0, 7],
    PP: [10, 30],
    ST: [10, 30],
    SP: [0, 10],
    HG: [5, 10],
    MG: [10, 50],
    GL: [0, 2]
};


export const oSupportedMods = {
    Faction_Patches: 'FactionPatches.cfg'
}
