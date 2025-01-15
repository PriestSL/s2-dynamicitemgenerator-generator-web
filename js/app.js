import { generateConfig } from './fileStreamGenerator.js';
import * as configs from './configs.js'; 
import { deepCopy } from './utils.js';

var currentFaction = "Neutral";
var currentCategory = "Primary";

export var modifiedWeaponSettings = deepCopy(configs.oWeaponLoadoutSettings);
export var modifiedArmorSettings = deepCopy(configs.oArmorLoadoutSettings);
export var modifiedGrenadeSettings = deepCopy(configs.oGrenadesSettings);
export var modifiedAmmoByWeaponClass = deepCopy(configs.oAmmoByWeaponClass);
export var modifiedWeaponList = deepCopy(configs.oWeaponList);
export var modsCompatibility = {Faction_Patches: true}
export var modifiedDropConfigs = deepCopy(configs.oDropConfigs);

const typeToTable = {
    weapon: modifiedWeaponList
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
}

function onWeaponChanceChange(e) {
    //TODO rewrite to use typeToTable
    let faction = e.target.getAttribute('to_faction');
    let classification = e.target.getAttribute('to_classification');
    let item = e.target.getAttribute('to_item');
    let level = e.target.getAttribute('to_level');
    let value = e.target.value;
    let GeneralSettings = 'GeneralNPC_'+faction;
    let WeaponSettings = modifiedWeaponSettings[GeneralSettings];
    WeaponSettings[classification][item][level] = value;

    updateLabels(WeaponSettings[classification], level, classification);
};

function onGrenadeChanceChange (e) {
    let item = e.target.getAttribute('to_item');
    let attr = e.target.getAttribute('to_attr');
    let level = e.target.getAttribute('to_level');
    let value = e.target.value;
    modifiedGrenadeSettings.Default[item][attr][level] = value;
};

function onArmorChanceChange(e) {
    let faction = e.target.getAttribute('to_faction');
    let item = e.target.getAttribute('to_item');
    let level = e.target.getAttribute('to_level');
    let value = e.target.value;
    let GeneralSettings = 'GeneralNPC_'+faction;
    let ArmorSettings = modifiedArmorSettings[GeneralSettings];
    ArmorSettings[item][level] = value;

    updateLabels(ArmorSettings, level);
};

function onAmmoChanceChange(e){
    let item = e.target.getAttribute('to_item');
    let level = e.target.getAttribute('to_level');
    let value = e.target.value;
    let AmmoSettings = modifiedAmmoByWeaponClass;
    AmmoSettings[item][level] = value;
}

function onAttributeChange(e) {
    let item = e.target.getAttribute('to_item');
    let attr = e.target.getAttribute('to_attr');
    let type = e.target.getAttribute('item_type');
    let value = e.target.value;
    typeToTable[type][item][attr] = value;
};

//TODO rewrite to use typeToTable
const fillChancesTable = (oSettings, parentElement, newRowReplace, classification = '') => {
    let chancesTable = document.createElement('div');

    const createChances = (item, summary, chances, attr = 'chances') => {
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
                    chanceElement.setAttribute('to_faction', faction);
                    chanceElement.setAttribute('to_classification', classification);
                    chanceElement.setAttribute('to_item_type', itemType);
                    chanceElement.setAttribute('to_item', item);
                    chanceElement.setAttribute('to_attr', attr);
                    chanceElement.setAttribute('to_level', i);

                    //chanceElement.id = faction + ' - ' + itemType + '-' +itemName + '-' + attrName + '-' + i;
                resultElement.appendChild(chanceElement);

                let chanceLabel = document.createElement('div');
                    chanceLabel.id = classification + '-' + item + '-' + attr + '-' + i + '_label';
                    chanceLabel.classList.add('chance_label');
                resultElement.appendChild(chanceLabel);

            }
            chancesElement.appendChild(resultElement);
        }

        summary.appendChild(chancesElement);
    }

    const addRow = (parentElement, item, chances) => {
        let row = document.createElement('div');
        row.classList.add(typeof chances=== 'object' && chances.length?'item_row':'item_column');
        let itemElement = document.createElement('div');
        itemElement.classList.add('chances_item');
        itemElement.innerHTML = item;
        row.appendChild(itemElement);

        if (typeof chances === 'object'){
            if (chances.length){
                createChances(item, row, chances);
            }else{
                for (let attr in chances) {
                    let innerRow = document.createElement('div');
                    innerRow.classList.add('attr_row');
                    row.appendChild(innerRow);
                    let attrNameElement = document.createElement('div');
                    attrNameElement.classList.add('attr_item');
                    attrNameElement.innerHTML = attr;
                    innerRow.appendChild(attrNameElement);
                    createChances(item, innerRow, chances[attr], attr);
                }
            }
            
        }
        parentElement.appendChild(row);
    };

    chancesTable.classList.add('chances_table');
    addRow(chancesTable, '', newRowReplace || ['Newbie', 'Experienced', 'Veteran', 'Master']);

    for (let item in oSettings) {
        addRow(chancesTable, item, oSettings[item]);
    }

    parentElement.appendChild(chancesTable);
}

const fillAttributesTable = (oSettings, parentElement, type) => {
    const typeToAttributeList = {
        weapon: [['minAmmo', 'number'], ['maxAmmo','number']]
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
            let attrElement = document.createElement('input');
            attrElement.type = thisAttr[1];
            attrElement.value = oAttr[thisAttr[0]];
            attrElement.setAttribute('item_type', type);
            attrElement.setAttribute('to_item', item);
            attrElement.setAttribute('to_attr', thisAttr[0]);
            attrElement.addEventListener('change', onAttributeChange);

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

    parentElement.appendChild(attributesTable);
}

const showPrimarySettings = () => {
    fillAttributesTable(modifiedWeaponList, document.getElementById('content'), 'weapon');

    let elements = document.getElementsByClassName('chance');
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('change', onAmmoChanceChange);
    }
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
        classElement.setAttribute('classification', classification);
        classSummary.classList.add('item_level1');
        classElement.appendChild(classSummary);
        classElement.classList.add('item_level1');
        document.getElementById('content').appendChild(classElement);

        fillChancesTable(WeaponSettings[classification], classElement, null, classification);

        window.setTimeout(()=>{updateAllLabels(WeaponSettings[classification], classification);}, 100);
    }

    let elements = document.getElementsByClassName('chance');
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('change', onWeaponChanceChange);
    }

}

const showSecondary = ()=>{
    let infoElement = document.createElement('div');
    infoElement.innerHTML = 'Secondary weapons are not implemented yet';

    document.getElementById('content').appendChild(infoElement);
};

const showArmor = ()=>{
    let GeneralSettings = 'GeneralNPC_'+currentFaction;
    let ArmorSettings = modifiedArmorSettings[GeneralSettings];
    fillChancesTable(ArmorSettings, document.getElementById('content'));

    let elements = document.getElementsByClassName('chance');
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('change', onArmorChanceChange);
    }

    window.setTimeout(()=>{updateAllLabels(ArmorSettings);}, 100);
};

const showArtifacts = ()=>{
    let infoElement = document.createElement('div');
    infoElement.innerHTML = 'Artifacts are not implemented yet (and game uses Artifact class to generate grenades)';

    document.getElementById('content').appendChild(infoElement);
};

const showConsumables = ()=>{
    let infoElement = document.createElement('div');
    infoElement.innerHTML = 'Consumables are not implemented yet. Use preheader, that have consumables settings';

    document.getElementById('content').appendChild(infoElement);
};

const showAmmo = ()=>{
    let AmmoSettings = modifiedAmmoByWeaponClass;
    fillChancesTable(AmmoSettings, document.getElementById('content'), ['MinAmmo', 'MaxAmmo']);

    let elements = document.getElementsByClassName('chance');
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('change', onAmmoChanceChange);
    }
};

const showGrenades = ()=>{
    let GrenadeSettings = modifiedGrenadeSettings;
    fillChancesTable(GrenadeSettings.Default, document.getElementById('content'));

    let elements = document.getElementsByClassName('chance');
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('change', onGrenadeChanceChange);
    }
};



const oCategoryToEvent = {
    "Primary": showPrimary,
    "Secondary": showSecondary,
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
            document.getElementById('content').innerHTML = '';
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
            document.getElementById('content').innerHTML = '';
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
        <label for="copm_FP">Faction Patches</label>
        <input type="checkbox" id="copm_FP" ${modsCompatibility.Faction_Patches ? 'checked' : ''}>
        <hr>
        <h2>Armor drop settings<h2>
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
    let FPComp = document.getElementById('copm_FP');
    FPComp.addEventListener('change', function(e) {
        modsCompatibility.Faction_Patches = e.target.checked;
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
        modifiedDropConfigs.ArmorDrop.Chance = e.target.value;
    });

    let minCondition = document.getElementById('min_condition');
    minCondition.addEventListener('change', function(e) {
        modifiedDropConfigs.ArmorDrop.MinCondition = e.target.value;
    });

    let maxCondition = document.getElementById('max_condition');
    maxCondition.addEventListener('change', function(e) {
        modifiedDropConfigs.ArmorDrop.MaxCondition = e.target.value;
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
        Compatibility: modsCompatibility
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
            document.getElementById('content').innerHTML = '';
            oCategoryToEvent[currentCategory]();
        };
        reader.readAsText(file);
    };
    input.click();
};

const TODOList = [
    "Adding and removing items",
    "Local storage of settings",
    "preheader and footer configuration",
    "saving few of preheader and footer configurations",
    "Loot chances by player rank",
    "Ammo count by player rank",
    "Helmet and suit settings",
    "Consumables settings",
    "Artifacts settings",
    "Splitted files as in refactor mod",
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
