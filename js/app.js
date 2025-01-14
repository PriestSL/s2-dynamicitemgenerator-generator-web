import { generateConfig } from './fileStreamGenerator.js';
import * as configs from './configs.js'; 
import { deepCopy } from './utils.js';

var currentFaction = "Neutral";
var currentCategory = "Primary";

export var modifiedWeaponSettings = deepCopy(configs.oWeaponLoadoutSettings);
export var modifiedArmorSettings = deepCopy(configs.oArmorLoadoutSettings);
export var modifiedGrenadeSettings = deepCopy(configs.oGrenadesSettings);
export var ammoByWeaponClass = deepCopy(configs.oAmmoByWeaponClass);
export var oWeaponList = deepCopy(configs.oWeaponList);


const updateLabels = (oSettings, level, classification = '') => {
    let total = 0;
    for (let item in oSettings) {
        total += +oSettings[item][level];
    }

    for (let item in oSettings) {
        let label = document.getElementById(item + '-' + level + '-' + classification + '_label');
        label.innerHTML = '~'+(oSettings[item][level]/total*100).toFixed(2)+'%';
    }

};

const updateAllLabels = (oSettings, classification = '') => {
    for (let level = 0; level < 4; level++) {
        updateLabels(oSettings, level, classification);
    }
}

function onWeaponChanceChange(e) {
    let options = e.target.id.split('-');

    let item = options[0];
    let level = options[1];
    let classification = options[2];
    let value = e.target.value;
    let GeneralSettings = 'GeneralNPC_'+currentFaction;
    let WeaponSettings = modifiedWeaponSettings[GeneralSettings];
    WeaponSettings[classification][item][level] = value;

    updateLabels(WeaponSettings[classification], level, classification);
};

function onArmorChanceChange(e) {
    let options = e.target.id.split('-');

    let item = options[0];
    let level = options[1];
    let value = e.target.value;
    let GeneralSettings = 'GeneralNPC_'+currentFaction;
    let ArmorSettings = modifiedArmorSettings[GeneralSettings];
    ArmorSettings[item][level] = value;

    updateLabels(ArmorSettings, level);
}

function onGrenadeChanceChange(e) {
    let options = e.target.id.split('-');

    let item = options[0];
    let level = options[1];
    let value = e.target.value;
    let GrenadeSettings = modifiedGrenadeSettings;
    GrenadeSettings[item][level] = value;
}

function onAmmoChanceChange(e){
    let options = e.target.id.split('-');

    let item = options[0];
    let level = options[1];
    let value = e.target.value;
    let AmmoSettings = Object.assign(oWeaponList, ammoByWeaponClass);
    AmmoSettings[item][level] = value;
}

const fillChancesTable = (oSettings, parentElement) => {
    let chancesTable = document.createElement('div');

    const createChances = (item, summary, chances) => {
        let chancesElement = document.createElement('div');
        chancesElement.classList.add('chances_row');
        for (let i=0; i<chances.length; i++) {
            let resultElement = document.createElement('div');
                resultElement.classList.add('chance');
            if (isNaN(parseFloat(chances[i]))) {
                resultElement.innerHTML = chances[i];
            }else{
                let chanceElement = document.createElement('input');
                    chanceElement.type = 'number';
                    chanceElement.classList.add('chance');
                    chanceElement.value = chances[i];
                let classification = parentElement.getAttribute('classification') || '';
                    chanceElement.id = item + '-' + i + '-' + classification;
                resultElement.appendChild(chanceElement);

                let chanceLabel = document.createElement('div');
                    chanceLabel.id = item + '-' + i + '-' + classification + '_label';
                    chanceLabel.classList.add('chance_label');
                resultElement.appendChild(chanceLabel);

            }
            chancesElement.appendChild(resultElement);
        }

        summary.appendChild(chancesElement);
    }

    const addRow = (parentElement, item, chances) => {
        let row = document.createElement('details');
        row.classList.add('item_row');
        let summary = document.createElement('summary');
        summary.classList.add('item_row');
        let itemElement = document.createElement('div');
        itemElement.classList.add('chances_item');
        itemElement.innerHTML = item;
        summary.appendChild(itemElement);

        createChances(item, summary, chances, parentElement);
        row.appendChild(summary);
        parentElement.appendChild(row);
    };

    chancesTable.classList.add('chances_table');
    addRow(chancesTable, '', ['Newbie', 'Experienced', 'Veteran', 'Master']);

    for (let item in oSettings) {
        addRow(chancesTable, item, oSettings[item]);
    }

    parentElement.appendChild(chancesTable);
}

const showPrimary = ()=>{
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

        fillChancesTable(WeaponSettings[classification], classElement);

        window.setTimeout(()=>{updateAllLabels(WeaponSettings[classification], classification);}, 100);
    }

    let elements = document.getElementsByClassName('chance');
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('change', onWeaponChanceChange);
    }

}

const showSecondary = ()=>{
    console.log("Secondary");
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
    console.log("Artifacts");
};

const showConsumables = ()=>{
    console.log("Consumables");
};

const showAmmo = ()=>{
    let AmmoSettings = Object.assign(oWeaponList, ammoByWeaponClass);
    fillChancesTable(AmmoSettings, document.getElementById('content'));

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


let button = document.getElementById('btn_save');
button.addEventListener('click', generateConfig);
