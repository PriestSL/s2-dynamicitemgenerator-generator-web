import { generateConfig } from './fileStreamGenerator.js';
import { showFreezeDiv, hideFreezeDiv } from './utils.js';

/*ugliest code that I wrote*/
import * as configs from './configs.js'; 
import { deepCopy } from './utils.js';

var currentFaction = "Neutral";
var currentCategory = "Primary";

export var modifiedWeaponSettings = deepCopy(configs.oWeaponLoadoutSettings);
export var modifiedArmorSettings = deepCopy(configs.oArmorLoadoutSettings);
export var modifiedArmorSpawnSettings = deepCopy(configs.oArmorSpawnSettings); 
export var modifiedHelmetSpawnSettings = deepCopy(configs.oHelmetsGlobalSpawnSettings);
export var modifiedGrenadeSettings = deepCopy(configs.oGrenadesSettings);
export var modifiedAmmoByWeaponClass = deepCopy(configs.oAmmoByWeaponClass);
export var modifiedWeaponList = deepCopy(configs.oWeaponList);
export var modsCompatibility = {SHA: false}
export var modifiedDropConfigs = deepCopy(configs.oDropConfigs);
export var modifiedPistolSettings = deepCopy(configs.oPistolLoadoutSettings);
export var modifiedPistolSpawnChance = configs.nPistolLootChance;
export var modifiedMinWeaponDurability = configs.nMinWeaponDurability;
export var modifiedMaxWeaponDurability = configs.nMaxWeaponDurability;

const contentEl = document.getElementById('content');

const typeToTable = {
    weapon: modifiedWeaponList,
    armor: modifiedArmorSpawnSettings,
    pistol: null
};

{
    let oTemp = {};
    for (let key in modifiedWeaponList){
        if (key.substring(key.length-2) === 'HG') {
            oTemp[key] = modifiedWeaponList[key];
        }
    }
    typeToTable.pistol = oTemp;   
}

const createChances = (item, summary, chances, classification = '', attr = 'chances') => {
    let chancesElement = document.createElement('div');
    chancesElement.classList.add('chances_row');
    for (let i=0; i<chances.length; i++) {
        let resultElement = document.createElement('div'); //container to show real chance
            resultElement.classList.add('chance');
            
        if (isNaN(parseFloat(chances[i]))) { //for static text
            resultElement.innerHTML = chances[i];
        }else{ //inputs
            let faction = currentFaction;
            let itemType = currentCategory;

            let chanceElement = document.createElement('input');
                chanceElement.type = 'number';
                chanceElement.classList.add('chance');
                chanceElement.value = chances[i];
                chanceElement.dataset.faction = faction;
                chanceElement.dataset.classification = classification;
                chanceElement.dataset.type = itemType;
                chanceElement.dataset.item = item;
                chanceElement.dataset.attr = attr;
                chanceElement.dataset.level = i;

            resultElement.appendChild(chanceElement);

            let chanceLabel = document.createElement('div');
                chanceLabel.id = classification + '-' + item + '-' + attr + '-' + i + '_label';
                chanceLabel.classList.add('chance_label');
            resultElement.appendChild(chanceLabel);

        }
        chancesElement.appendChild(resultElement);
    }

    summary.appendChild(chancesElement);

    return chancesElement;
};

const addRow = (parentElement, item, classification, chances) => {
    let row = document.createElement('div');
    row.classList.add(typeof chances=== 'object' && chances.length?'item_row':'item_column');
    let itemElement = document.createElement('div');
    itemElement.classList.add('chances_item');
    itemElement.innerHTML = item;
    row.appendChild(itemElement);

    let eChances;

    if (typeof chances === 'object'){
        if (chances.length){
            eChances = createChances(item, row, chances, classification);
        }else{
            for (let attr in chances) {
                let innerRow = document.createElement('div');
                innerRow.classList.add('attr_row');
                row.appendChild(innerRow);
                let attrNameElement = document.createElement('div');
                attrNameElement.classList.add('attr_item');
                attrNameElement.innerHTML = attr;
                innerRow.appendChild(attrNameElement);
                eChances = createChances(item, innerRow, chances[attr], classification, attr);
            }
        }
        
    }

    if ((currentCategory === 'Primary' || currentCategory === 'Armor') && currentFaction !== 'Generic_settings' && item !== '') {
        let deleteButton = document.createElement('button');
        deleteButton.innerHTML = 'Delete';
        deleteButton.classList.add('deleteButton');
        deleteButton.addEventListener('click', function() {
            let GeneralSettings = 'GeneralNPC_'+currentFaction;
            if (currentCategory === 'Primary') {
                delete modifiedWeaponSettings[GeneralSettings][classification][item];
                updateAllLabels(modifiedWeaponSettings[GeneralSettings][classification], classification);
            }else if (currentCategory === 'Armor') {
                delete modifiedArmorSettings[GeneralSettings][item];
                updateAllLabels(modifiedArmorSettings[GeneralSettings]);
            }
            row.remove();
        });
        row.appendChild(deleteButton);
    }

    parentElement.appendChild(row);
    return eChances;
};

const addWeaponToClass = (parentEl, classification, weapon) => {
    let GeneralSettings = 'GeneralNPC_'+currentFaction;
    let WeaponSettings = modifiedWeaponSettings[GeneralSettings];
    if (WeaponSettings[classification][weapon]) return;

    let eChances = addRow(parentEl, weapon, classification, [0, 0, 0, 0]);
    eChances.addEventListener('change', onWeaponChanceChange);

    WeaponSettings[classification][weapon] = [0, 0, 0, 0];

    updateAllLabels(WeaponSettings[classification], classification);
};

const addArmor = (parentEl, armor) => {
    let GeneralSettings = 'GeneralNPC_'+currentFaction;
    let ArmorSettings = modifiedArmorSettings[GeneralSettings];
    if (ArmorSettings[armor]) return;

    let eChances = addRow(parentEl, armor, '', [0, 0, 0, 0]);
    eChances.addEventListener('change', onArmorChanceChange);

    ArmorSettings[armor] = [0, 0, 0, 0];
    updateAllLabels(ArmorSettings);
};

const addPistol = (parentEl, item) => {
    let GeneralSettings = 'GeneralNPC_'+currentFaction;
    let PistolSettings = modifiedPistolSettings[GeneralSettings];
    if (PistolSettings[item]) return;

    let eChances = addRow(parentEl, item, '', [0, 0, 0, 0]);
    eChances.addEventListener('change', onPistolChanceChange);

    PistolSettings[item] = [0, 0, 0, 0];
    updateAllLabels(PistolSettings);
};

const showAddSelection = (target, type, classification) => {
    showFreezeDiv();
    let fullscreenDiv = document.createElement('div');
    fullscreenDiv.classList.add('fullscreen_select');
    let divContent = document.createElement('div');
    divContent.classList.add('fullscreen_select_content');

    for (let item in typeToTable[type]) {
        let option = document.createElement('div');
        option.classList.add('fullscreen_select_item');
        option.textContent = item;
        option.value = item;
        divContent.appendChild(option);
    }

    divContent.querySelectorAll('.fullscreen_select_item').forEach((el) => {
        el.addEventListener('click', function(e) {
            let item = e.target.value;
            if (type === 'weapon') {
                addWeaponToClass(target, classification, item);
            }else if (type === 'armor') {
                addArmor(target, item);
            }else if (type === 'pistol') {
                addPistol(target, item);
            }

            fullscreenDiv.remove();
            hideFreezeDiv();
        });
    });

    let closeButton = document.createElement('button');
    closeButton.innerHTML = 'Close';
    closeButton.classList.add('fullscreen_select_close');
    closeButton.addEventListener('click', function() {
        fullscreenDiv.remove();
        hideFreezeDiv();
    });

    fullscreenDiv.appendChild(divContent);
    fullscreenDiv.appendChild(closeButton);
    document.body.appendChild(fullscreenDiv);
};

const drawAttentionDiv = (text = 'This section is for all factions, settings for specific factions are not implemented yet') => {
    let div = document.createElement('div');
    div.classList.add('attention');
    div.innerHTML = text;
    return div;
};

const drawAddDiv = (onClick) => {
    let existsDiv = document.getElementById('addItemButton');
    if (existsDiv) {
        existsDiv.remove();
    }

    let div = document.createElement('div');
    div.classList.add('addDiv');
    div.id = 'addItemButton';
    let button = document.createElement('button');
    button.innerHTML = '+';
    button.addEventListener('click', onClick);
    div.appendChild(button);
    return div;
};

const updateLabels = (oSettings, level, classification = '') => {
    let total = 0;
    for (let item in oSettings) {
        total += +oSettings[item][level];
    }

    for (let item in oSettings) {
        let label = document.getElementById(classification + '-' + item + '-' + 'chances' + '-' + level + '_label');
        label.innerHTML = '~'+(oSettings[item][level]/total*100).toFixed(2)+'%';
    }

};

const updateAllLabels = (oSettings, classification = '') => {
    for (let level = 0; level < 4; level++) {
        updateLabels(oSettings, level, classification);
    }
};

function onWeaponChanceChange(e) {
    //TODO rewrite to use typeToTable
    let dataset = e.target.dataset;
    let value = e.target.value;
    let GeneralSettings = 'GeneralNPC_'+dataset.faction;
    let WeaponSettings = modifiedWeaponSettings[GeneralSettings];
    WeaponSettings[dataset.classification][dataset.item][dataset.level] = value;

    updateLabels(WeaponSettings[dataset.classification], dataset.level, dataset.classification);
};

function onGrenadeChanceChange (e) {
    let dataset = e.target.dataset;
    let value = e.target.value;
    modifiedGrenadeSettings.Default[dataset.item][dataset.attr][dataset.level] = value;
};

function onArmorChanceChange(e) {
    let dataset = e.target.dataset;
    let value = e.target.value;
    let GeneralSettings = 'GeneralNPC_'+dataset.faction;
    let ArmorSettings = modifiedArmorSettings[GeneralSettings];
    ArmorSettings[dataset.item][dataset.level] = value;

    updateLabels(ArmorSettings, dataset.level);
};

function onPistolChanceChange(e) {
    let dataset = e.target.dataset;
    let value = e.target.value;
    let GeneralSettings = 'GeneralNPC_'+dataset.faction;
    let PistolSettings = modifiedPistolSettings[GeneralSettings];
    PistolSettings[dataset.item][dataset.level] = value;

    updateLabels(PistolSettings, dataset.level);
};

function onHelmetChanceChange(e) {
    let dataset = e.target.dataset;
    let value = e.target.value;
    modifiedHelmetSpawnSettings[dataset.item][dataset.level] = value;
};

function onAmmoChanceChange(e){
    let dataset = e.target.dataset;
    let value = e.target.value;
    let AmmoSettings = modifiedAmmoByWeaponClass;
    AmmoSettings[dataset.item][dataset.level] = value;
}

function onAttributeChange(e) {
    let dataset = e.target.dataset;
    let value = e.target.value;
    typeToTable[dataset.type][dataset.item][dataset.attr] = value;
};



//TODO rewrite to use typeToTable
const fillChancesTable = (oSettings, newRowReplace, tableType, classification = '') => {
    let chancesTable = document.createElement('div');
    chancesTable.classList.add('chances_table');
    addRow(chancesTable, '', classification, newRowReplace || ['Newbie', 'Experienced', 'Veteran', 'Master']);

    for (let item in oSettings) {
        addRow(chancesTable, item, classification, oSettings[item]);
    }

    if (tableType) {
        chancesTable.addEventListener('mouseenter', function() {
            chancesTable.appendChild(drawAddDiv((e)=>{
                showAddSelection(e.target.parentElement.parentElement, tableType, classification);
            }));
        });

        chancesTable.addEventListener('mouseleave', function() {
            let elements = document.getElementsByClassName('addDiv');
            for (let i = 0; i < elements.length; i++) {
                chancesTable.removeChild(elements[i]);
            }

        });
    }

    return chancesTable;
}

const fillAttributesTable = (oSettings, parentElement, type) => {
    const typeToAttributeList = {
        weapon: [['minAmmo', 'number'], ['maxAmmo','number'], ['minCondition', 'number'], ['maxCondition', 'number']],
        armor: [['drop', 'checkbox'], ['dropItem', 'select'], ['helmet', 'select'], ['helmetSpawn', 'number'], ['helmetless', 'checkbox']]
    };


    let attributesTable = document.createElement('div');

    attributesTable.classList.add('attributes_table');

    const addAttributes = (item, oAttr, parentElement) => {
        let attributesElement = document.createElement('div');
        attributesElement.classList.add('attributes_grid');
        for (let attr in typeToAttributeList[type]) {
            let thisAttr = typeToAttributeList[type][attr];
            let labelEl = document.createElement('label');
            labelEl.classList.add('attribute');
            labelEl.innerHTML = thisAttr[0];
            let attrElement = null;
            if (thisAttr[1] === 'select') {
                attrElement = document.createElement('select');
                attrElement.dataset.type = type;
                attrElement.dataset.to_item = item;
                attrElement.dataset.to_attr = thisAttr[0];
                let itemList = type==='armor'?thisAttr[0]=='helmet'?modifiedHelmetSpawnSettings:modifiedArmorSpawnSettings:modifiedWeaponList; //bruh
                {
                    let option = document.createElement('option');
                    option.value = '';
                    option.text = '';
                    attrElement.appendChild(option);
                }
                for (let item in itemList) {
                    let option = document.createElement('option');
                    option.value = item;
                    option.text = item;
                    attrElement.appendChild(option);
                }
                attrElement.value = oAttr[thisAttr[0]];
            }else{
                attrElement = document.createElement('input');

                attrElement.type = thisAttr[1];
                attrElement.value = oAttr[thisAttr[0]];
                if (thisAttr[1] === 'checkbox') {
                    attrElement.checked = oAttr[thisAttr[0]];
                }
                attrElement.dataset.type = type;
                attrElement.dataset.to_item = item;
                attrElement.dataset.to_attr = thisAttr[0];
            }

            attrElement.classList.add('attribute_field');
            attributesElement.appendChild(labelEl);
            attributesElement.appendChild(attrElement);
        }
            

        parentElement.appendChild(attributesElement);
    }

    const addRow = (parentElement, item, value) => {
        let row = document.createElement('details');
        row.classList.add('attributes_item_row');
        row.setAttribute('open', 'open');
        let summary = document.createElement('summary');
        summary.classList.add('attributes_item_row');
        summary.innerHTML = item;
        row.appendChild(summary);
        addAttributes(item, value, row);
        parentElement.appendChild(row);        
    };

    for (let item in oSettings) {
        addRow(attributesTable, item, oSettings[item]);
    }

    attributesTable.addEventListener('change', onAttributeChange);
    parentElement.appendChild(attributesTable);
}

const showPrimarySettings = () => {
    let globalAttributes = document.createElement('details');
    globalAttributes.setAttribute('open', 'open');
    globalAttributes.classList.add('item_level1');
    let globalSummary = document.createElement('summary');
    globalSummary.innerHTML = 'Global settings';
    globalSummary.classList.add('item_level1');
    globalAttributes.appendChild(globalSummary);

    {
        let attrLabel = document.createElement('label');
        attrLabel.innerHTML = 'Minimal condition, %';
        globalAttributes.appendChild(attrLabel);
        let attrElement = document.createElement('input');
        attrElement.type = 'number';
        attrElement.value = modifiedMinWeaponDurability;
        
        attrElement.addEventListener('change', function(e) {
            modifiedMinWeaponDurability = e.target.value;
        });

        globalAttributes.appendChild(attrElement);
    }

    {
        let attrLabel = document.createElement('label');
        attrLabel.innerHTML = 'Maximal condition, %';
        globalAttributes.appendChild(attrLabel);
        let attrElement = document.createElement('input');
        attrElement.type = 'number';
        attrElement.value = modifiedMaxWeaponDurability;

        attrElement.addEventListener('change', function(e) {
            modifiedMaxWeaponDurability = e.target.value;
        });

        globalAttributes.appendChild(attrElement);
    }



    contentEl.appendChild(globalAttributes);


    fillAttributesTable(modifiedWeaponList, contentEl, 'weapon');
};

const showArmorSettings = () => {
    fillAttributesTable(modifiedArmorSpawnSettings, contentEl, 'armor');
};

const showPrimary = ()=>{
    if (currentFaction === 'Generic_settings'){
        showPrimarySettings();
        return;
    }
    let GeneralSettings = 'GeneralNPC_'+currentFaction;
    let WeaponSettings = modifiedWeaponSettings[GeneralSettings];
    for (let classification in WeaponSettings) {
        let classElement = document.createElement('details');
        classElement.id = classification;
        classElement.setAttribute('open', 'open');
        let classSummary = document.createElement('summary');
        classSummary.innerHTML = classification;
        classElement.dataset.classification = classification;
        classSummary.classList.add('item_level1');
        classElement.appendChild(classSummary);
        classElement.classList.add('item_level1');
        contentEl.appendChild(classElement);

        let chances = fillChancesTable(WeaponSettings[classification], null, 'weapon', classification);
        chances.addEventListener('change', onWeaponChanceChange);
        classElement.appendChild(chances);
        window.setTimeout(()=>{updateAllLabels(WeaponSettings[classification], classification);}, 100);
    }

}

const showSecondary = ()=>{
    let infoElement = document.createElement('div');
    infoElement.innerHTML = 'Changing secondary weapons are not implemented yet (they are works in game?)';

    contentEl.appendChild(infoElement);
};

const showPistols = ()=>{
    let GeneralSettings = 'GeneralNPC_'+currentFaction;
    if (currentFaction === 'Generic_settings'){
        let pistolSpawnChance = document.createElement('div');
        let pistolSpawnChanceLabel = document.createElement('label');
        pistolSpawnChanceLabel.innerHTML = 'Pistol kit spawn chance, %';
        pistolSpawnChance.appendChild(pistolSpawnChanceLabel);
        let pistolSpawnChanceInput = document.createElement('input');
        pistolSpawnChanceInput.type = 'number';
        pistolSpawnChanceInput.value = modifiedPistolSpawnChance;

        pistolSpawnChanceInput.addEventListener('change', function(e) {
            modifiedPistolSpawnChance = e.target.value;
        });

        pistolSpawnChance.appendChild(pistolSpawnChanceInput);

        contentEl.appendChild(pistolSpawnChance);
    }else{
        let PistolSettings = modifiedPistolSettings[GeneralSettings];
        let chances = fillChancesTable(PistolSettings, null, 'pistol', '');
        chances.addEventListener('change', onPistolChanceChange);

        contentEl.appendChild(chances);

        window.setTimeout(()=>{updateAllLabels(PistolSettings);}, 100);
    }
};

const showHelmetSettings = ()=>{
    let chances = fillChancesTable(modifiedHelmetSpawnSettings);
    chances.addEventListener('change', onHelmetChanceChange);

    contentEl.appendChild(chances);

    contentEl.appendChild(drawAttentionDiv('Values in percent. Global values for all factions. Specific spawn settings in armor section.'));
};

const showArmor = ()=>{
    if (currentFaction === 'Generic_settings'){
        showArmorSettings();
        return;
    }

    let GeneralSettings = 'GeneralNPC_'+currentFaction;
    let ArmorSettings = modifiedArmorSettings[GeneralSettings];
    let chances = fillChancesTable(ArmorSettings, null, 'armor', '');
    chances.addEventListener('change', onArmorChanceChange);

    contentEl.appendChild(chances);

    window.setTimeout(()=>{updateAllLabels(ArmorSettings);}, 100);
};

const showArtifacts = ()=>{
    let infoElement = document.createElement('div');
    infoElement.innerHTML = 'Lootable artifact settings are not implemented yet (and game uses Artifact class to generate grenades)';

    contentEl.appendChild(infoElement);
};

const showConsumables = ()=>{
    let infoElement = document.createElement('div');
    infoElement.innerHTML = 'Consumables loot settings are not implemented yet.';

    contentEl.appendChild(infoElement);
};

const showAmmo = ()=>{
    let AmmoSettings = modifiedAmmoByWeaponClass;
    let chances = fillChancesTable(AmmoSettings, ['MinAmmo', 'MaxAmmo']);
    chances.addEventListener('change', onAmmoChanceChange);
    contentEl.appendChild(chances);

    contentEl.appendChild(drawAttentionDiv());
};

const showGrenades = ()=>{
    let GrenadeSettings = modifiedGrenadeSettings;
    let chances = fillChancesTable(GrenadeSettings.Default);
    chances.addEventListener('change', onGrenadeChanceChange);
    contentEl.appendChild(chances);

    contentEl.appendChild(drawAttentionDiv());
};



const oCategoryToEvent = {
    "Primary": showPrimary,
    "Secondary": showSecondary,
    "Pistols": showPistols,
    "Helmets": showHelmetSettings,
    "Armor": showArmor,
    "Artifacts": showArtifacts,
    "Consumables": showConsumables,
    "Ammo": showAmmo,
    "Grenades": showGrenades
};

const subscribeToEvents = () => {
    let elements = document.getElementsByClassName('faction_item');
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', function(e) {
            contentEl.innerHTML = '';
            currentFaction = e.target.id;
            e.target.classList.add('active');
            let els = document.getElementsByClassName('faction_item');
            for (let j = 0; j < els.length; j++) {
                if (els[j].id !== e.target.id) {
                    els[j].classList.remove('active');
                }
            }

            oCategoryToEvent[currentCategory]();
        });
    }

    elements = document.getElementsByClassName('category_item');
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', function(e) {
            contentEl.innerHTML = '';
            currentCategory = e.target.id;
            e.target.classList.add('active');
            let els = document.getElementsByClassName('category_item');
            for (let j = 0; j < els.length; j++) {
                if (els[j].id !== e.target.id) {
                    els[j].classList.remove('active');
                }
            }

            oCategoryToEvent[currentCategory]();
        });
    }
}

subscribeToEvents()

const drawHelp = () => `
    <div class="help">
        <h2>Help</h2>
        <p>After configuring all settings press download <img src="img/file.png" style="width:20px"></img> icon</p>
        <p>Download <a href="https://www.nexusmods.com/stalker2heartofchornobyl/mods/398" target="_blank">packing tool</a> if you don't have it</p>
        <p>Unzip into folder, named as zip archive, into <b>2-extracted-pak-files</b>(if you using software from link above)</p>
        <p>Run <b>2-repack_pak.bat</b>, select your folder and wait until it finishes</p>
        <p>Copy created .pak file from <b>3-repacked-pak-files</b> to <b>Stalker 2 Game Folder\\Stalker2\\Content\\Paks\\~mods\\</b></p>
    </div>
`;

const drawCloseButton = (wind) => `
    <div class="closeButton">
        <button id="btn_close_msg_${wind}">Close</button>
    </div>
`;

const drawFileSettings = () => `
    <div class="fileSettings">
        <hr>
        <h2>Compatibility settings</h2>
        <hr>
        <label for="copm_SHA">Separated Helmets and Armor</label>
        <input type="checkbox" id="copm_SHA" ${modsCompatibility.SHA ? 'checked' : ''}>
        <hr>
        <label for="drop_armor">Enable armor droping</label>
        <input type="checkbox" id="drop_armor" ${modifiedDropConfigs.createDroppableArmor ? 'checked' : ''}>
        <div class="armor_drop_settings" style="display:${modifiedDropConfigs.createDroppableArmor ? 'grid' : 'none'}">
            <label for="armor_chance">Armor drop chance</label>
            <input type="number" id="armor_chance" value="${modifiedDropConfigs.nLootChance}">
            <label for="min_condition">Minimal armor condition</label>
            <input type="number" id="min_condition" value="${modifiedDropConfigs.nMinDurability}">
            <label for="max_condition">Maximal armor condition</label>
            <input type="number" id="max_condition" value="${modifiedDropConfigs.nMaxDurability}">
        </div>
    </div>
`;

const subscribeFileSettingsEvents = () => {
    let SHAComp = document.getElementById('copm_SHA');
    SHAComp.addEventListener('change', function(e) {
        modsCompatibility.SHA = e.target.checked;
    });

    let dropArmor = document.getElementById('drop_armor');
    dropArmor.addEventListener('change', function(e) {
        modifiedDropConfigs.createDroppableArmor = e.target.checked;
        if (e.target.checked) {
            document.querySelector('.armor_drop_settings').style.display = 'grid';
        }
        else {
            document.querySelector('.armor_drop_settings').style.display = 'none';
        }
    });

    let armorChance = document.getElementById('armor_chance');
    armorChance.addEventListener('change', function(e) {
        modifiedDropConfigs.nLootChance = e.target.value;
    });

    let minCondition = document.getElementById('min_condition');
    minCondition.addEventListener('change', function(e) {
        modifiedDropConfigs.nMinDurability = e.target.value;
    });

    let maxCondition = document.getElementById('max_condition');
    maxCondition.addEventListener('change', function(e) {
        modifiedDropConfigs.nMaxDurability = e.target.value;
    });


};

const createMessageBox = (wind, message) => {
    if (document.getElementById('messageBox_'+wind)) {
        return;
    }

    let messageBox = document.createElement('div');
    messageBox.classList.add('messageBox');
    messageBox.id = 'messageBox_'+wind;
    messageBox.innerHTML = message + drawCloseButton(wind);
    document.body.appendChild(messageBox);
};

const removeMessageBox = (wind) => {
    let messageBox = document.getElementById('messageBox_'+wind);
    document.body.removeChild(messageBox);
};

const exportToJSON = () => {
    let data = {
        WeaponSettings: modifiedWeaponSettings,
        ArmorSettings: modifiedArmorSettings,
        GrenadeSettings: modifiedGrenadeSettings,
        AmmoSettings: modifiedAmmoByWeaponClass,
        WeaponList: modifiedWeaponList,
        DropConfigs: modifiedDropConfigs,
        Compatibility: modsCompatibility,
        ArmorSpawnSettings: modifiedArmorSpawnSettings,
        HelmetsSettings: modifiedHelmetSpawnSettings
    };

    let configName = document.getElementById('config_name').value || 'config';
    let blob = new Blob([JSON.stringify(data)], {type: 'text/plain'});
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = configName+'.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

const importFromJSON = () => {
    const adoptOldHelmetVersion = (oldVersion) => {
        if (!oldVersion) return configs.oHelmetsGlobalSpawnSettings;
        if (oldVersion.Light_Neutral_Helmet.length) return oldVersion;

        let newVersion = {};
        for (let key in oldVersion) {
            newVersion[key] = oldVersion[key].spawn;
        }
        return newVersion;
    };

    let input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        let file = e.target.files[0];
        let reader = new FileReader();
        reader.onload = function(e) {
            let data = JSON.parse(e.target.result);
            modifiedWeaponSettings = data.WeaponSettings;
            modifiedArmorSettings = data.ArmorSettings;
            modifiedGrenadeSettings = data.GrenadeSettings;
            modifiedAmmoByWeaponClass = data.AmmoSettings;
            modifiedWeaponList = data.WeaponList;
            modifiedDropConfigs = data.DropConfigs;
            modsCompatibility = data.Compatibility;
            modifiedArmorSpawnSettings = data.ArmorSpawnSettings;
            modifiedHelmetSpawnSettings = adoptOldHelmetVersion(data.HelmetsSettings);
            contentEl.innerHTML = '';
            oCategoryToEvent[currentCategory]();
        };
        reader.readAsText(file);
    };
    input.click();
};

const TODOList = [
    "Some style fixes",
    "Import config",
    "Local storage of settings",
    "Public presets",
    "Tutorial",
    "Guard configuration",
    "Alphabetical sorting",
    "Search",
    "Site localization",
    "Separate site for more files",
    "Create as splitted files and override",
    "Helmets drops",
    "Full item list from game",
    "Rewrite it all...",
    "Armor Loot chances by player rank",
    "Ammo count by player rank",
    "Consumables settings",
    "Artifacts settings",
    "Secondary weapons settings",
    "packing into .pak file"
];

const drawToDo = () => {
    let finalStr = '<h2>TODO LIST</h2><ul>';
    for (let item of TODOList) {
        finalStr += '<li>'+item+'</li>';
    }
    finalStr += '</ul>';
    return finalStr;
};

const showToDoWindow = () => {
    createMessageBox('todo', drawToDo());
    let closeButton = document.getElementById('btn_close_msg_todo');
    closeButton.addEventListener('click', ()=>removeMessageBox('todo'));
};

const showInfo = () => {
    let text = 'This site is created by <a href="https://next.nexusmods.com/profile/TechPriestSL" target="_blank">PriestSL</a>';
    text += '<br>Website ugly as shit, I know. But I tried to write it on pure JS to made it litest as it can be. '
    text += '<br>Source code is available on <a href="https://github.com/PriestSL/s2-dynamicitemgenerator-generator-web" target="_blank">GitHub</a>';
    text += '<br>For any questions or suggestions you can contact me on NexusMods or Discord (priestsl)';
    text += '<br>You free to use sources or colaborate';
    text += '<br>If you want to rewrite it all (because front end is absolutely crap, and all site created without any design documents), you are welcome. If you need help with it, you can ask me =)';
    text += '<br>All planning features you can see in TODO list';

    createMessageBox('info', text);
    let closeButton = document.getElementById('btn_close_msg_info');
    closeButton.addEventListener('click', ()=>removeMessageBox('info'));
};


let button = document.getElementById('btn_save');
button.addEventListener('click', generateConfig);
    button = document.getElementById('btn_help');
button.addEventListener('click', function() {
    createMessageBox('help', drawHelp());
    let closeButton = document.getElementById('btn_close_msg_help');
    closeButton.addEventListener('click', ()=>removeMessageBox('help'));
});
button = document.getElementById('btn_export');
button.addEventListener('click', exportToJSON);
button = document.getElementById('btn_import');
button.addEventListener('click', importFromJSON);
button = document.getElementById('btn_file_settings');
button.addEventListener('click', function() {
    createMessageBox('settings', drawFileSettings());
    subscribeFileSettingsEvents();
    let closeButton = document.getElementById('btn_close_msg_settings');
    closeButton.addEventListener('click', ()=>removeMessageBox('settings'));
});
button = document.getElementById('btn_todo');
button.addEventListener('click', showToDoWindow);
button = document.getElementById('btn_info');
button.addEventListener('click', showInfo);
