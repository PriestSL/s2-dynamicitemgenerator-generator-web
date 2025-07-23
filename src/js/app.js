import { generateConfig } from './fileStreamGenerator.js';

import { fetchHeaders, getPreset, checkPin, createPreset, updatePreset, deletePreset } from './restCalls.js';
import { withLoadingSpinner } from './spinner.js';
import { chancesController } from './chances.js';
/*ugliest code that I wrote*/
import * as configs from './configs.js'; 
import { deepCopy } from './utils.js';


// End of bootstrap fixes

// Get Bootstrap from window when the DOM is loaded
let bootstrap;
document.addEventListener('DOMContentLoaded', () => {
    bootstrap = window.bootstrap;
    // Ensure a global loading spinner exists outside of modals
    if (!document.getElementById('loadingSpinner')) {
        const spinnerDiv = document.createElement('div');
        spinnerDiv.id = 'loadingSpinner';
        spinnerDiv.style.position = 'fixed';
        spinnerDiv.style.top = '0';
        spinnerDiv.style.left = '0';
        spinnerDiv.style.width = '100%';
        spinnerDiv.style.height = '100%';
        spinnerDiv.style.display = 'none';
        spinnerDiv.style.justifyContent = 'center';
        spinnerDiv.style.alignItems = 'center';
        spinnerDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        spinnerDiv.style.zIndex = '9999';
        spinnerDiv.innerHTML = '<div class="spinner-border text-light" style="width: 3rem; height: 3rem;" role="status"><span class="visually-hidden">Loading...</span></div>';
        document.body.appendChild(spinnerDiv);
        
        // Explicitly ensure spinner is hidden after creation
        spinnerDiv.style.display = 'none';
        console.log('Spinner created and hidden on page load');
    }
});

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

const chancesCtrl = new chancesController();
// Initialize chances controller with the current settings
chancesCtrl.fillSettings({
    weapon: modifiedWeaponSettings,
    armor: modifiedArmorSettings,
    helmet: modifiedHelmetSpawnSettings,
    grenade: modifiedGrenadeSettings,
    ammo: modifiedAmmoByWeaponClass,
    weaponList: modifiedWeaponList,
    armorList: modifiedArmorSettings,
    helmetList: modifiedHelmetSpawnSettings
});

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

chancesCtrl.typeToTable = typeToTable;

const showPrimarySettings = () => {
    // Create Bootstrap card for global settings
    let globalCard = document.createElement('div');
    globalCard.className = 'card mb-3';
    
    let cardHeader = document.createElement('div');
    cardHeader.className = 'card-header bg-info bg-opacity-10';
    cardHeader.innerHTML = `
        <h5 class="mb-0">
            <i class="fas fa-cog me-2"></i>Global Weapon Settings
        </h5>
    `;
    
    let cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    let settingsRow = document.createElement('div');
    settingsRow.className = 'row g-3';
    
    // Minimal condition setting
    let minConditionCol = document.createElement('div');
    minConditionCol.className = 'col-md-6';
    minConditionCol.innerHTML = `
        <label class="form-label">Minimal condition (%)</label>
        <input type="number" class="form-control" id="minWeaponCondition" value="${modifiedMinWeaponDurability}">
    `;
    
    // Maximal condition setting  
    let maxConditionCol = document.createElement('div');
    maxConditionCol.className = 'col-md-6';
    maxConditionCol.innerHTML = `
        <label class="form-label">Maximal condition (%)</label>
        <input type="number" class="form-control" id="maxWeaponCondition" value="${modifiedMaxWeaponDurability}">
    `;
    
    settingsRow.appendChild(minConditionCol);
    settingsRow.appendChild(maxConditionCol);
    cardBody.appendChild(settingsRow);
    
    globalCard.appendChild(cardHeader);
    globalCard.appendChild(cardBody);
    contentEl.appendChild(globalCard);
    
    // Add event listeners
    document.getElementById('minWeaponCondition').addEventListener('change', function(e) {
        modifiedMinWeaponDurability = e.target.value;
    });
    
    document.getElementById('maxWeaponCondition').addEventListener('change', function(e) {
        modifiedMaxWeaponDurability = e.target.value;
    });

    chancesCtrl.fillAttributesTable(modifiedWeaponList, contentEl, 'weapon');
};

const showArmorSettings = () => {
    chancesCtrl.fillAttributesTable(modifiedArmorSpawnSettings, contentEl, 'armor');
};

const showPrimary = ()=>{
    if (chancesCtrl.curentFaction === 'Generic_settings'){
        showPrimarySettings();
        return;
    }
    let GeneralSettings = 'GeneralNPC_'+chancesCtrl.curentFaction;
    let WeaponSettings = modifiedWeaponSettings[GeneralSettings];
    
    for (let classification in WeaponSettings) {
        // Create Bootstrap card for each weapon classification
        let card = document.createElement('div');
        card.className = 'card mb-3';
        card.id = classification;
        card.dataset.classification = classification;
        
        let cardHeader = document.createElement('div');
        cardHeader.className = 'card-header bg-primary bg-opacity-10';
        cardHeader.innerHTML = `
            <h5 class="mb-0">
                <button class="btn btn-link text-decoration-none p-0 text-start w-100" type="button" 
                        data-bs-toggle="collapse" data-bs-target="#collapse-${classification}" 
                        aria-expanded="true" aria-controls="collapse-${classification}">
                    <i class="fas fa-gun me-2"></i>${classification}
                    <i class="fas fa-chevron-down float-end"></i>
                </button>
            </h5>
        `;
        
        let collapseDiv = document.createElement('div');
        collapseDiv.className = 'collapse show';
        collapseDiv.id = `collapse-${classification}`;
        
        let cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        let chances = chancesCtrl.fillChancesTable(WeaponSettings[classification], null, 'weapon', classification);
        chances.addEventListener('change', chancesCtrl.onWeaponChanceChange);
        cardBody.appendChild(chances);
        
        collapseDiv.appendChild(cardBody);
        card.appendChild(cardHeader);
        card.appendChild(collapseDiv);
        contentEl.appendChild(card);
        
        window.setTimeout(()=>{chancesCtrl.updateAllLabels(WeaponSettings[classification], classification);}, 100);
    }
}

const showSecondary = ()=>{
    let alertElement = document.createElement('div');
    alertElement.className = 'alert alert-warning';
    alertElement.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Not Implemented:</strong> Changing secondary weapons are not implemented yet (they are works in game?)
    `;
    contentEl.appendChild(alertElement);
};

const showPistols = ()=>{
    let GeneralSettings = 'GeneralNPC_'+chancesCtrl.curentFaction;
    if (chancesCtrl.curentFaction === 'Generic_settings'){
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
        let chances = chancesCtrl.fillChancesTable(PistolSettings, null, 'pistol', '');
        chances.addEventListener('change', chancesCtrl.onPistolChanceChange);

        contentEl.appendChild(chances);

        window.setTimeout(()=>{chancesCtrl.updateAllLabels(PistolSettings);}, 100);
    }
};

const showHelmetSettings = ()=>{
    let chances = chancesCtrl.fillChancesTable(modifiedHelmetSpawnSettings);
    chances.addEventListener('change', chancesCtrl.onHelmetChanceChange);

    contentEl.appendChild(chances);

    contentEl.appendChild(chancesCtrl.drawAttentionDiv('Values in percent. Global values for all factions. Specific spawn settings in armor section.'));
};

const showArmor = ()=>{
    if (chancesCtrl.curentFaction === 'Generic_settings'){
        showArmorSettings();
        return;
    }

    let GeneralSettings = 'GeneralNPC_'+chancesCtrl.curentFaction;
    let ArmorSettings = modifiedArmorSettings[GeneralSettings];
    let chances = chancesCtrl.fillChancesTable(ArmorSettings, null, 'armor', '');
    chances.addEventListener('change', chancesCtrl.onArmorChanceChange);

    contentEl.appendChild(chances);

    window.setTimeout(()=>{chancesCtrl.updateAllLabels(ArmorSettings);}, 100);
};

const showArtifacts = ()=>{
    let alertElement = document.createElement('div');
    alertElement.className = 'alert alert-warning';
    alertElement.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Not Implemented:</strong> Lootable artifact settings are not implemented yet (and game uses Artifact class to generate grenades)
    `;
    contentEl.appendChild(alertElement);
};

const showConsumables = ()=>{
    let alertElement = document.createElement('div');
    alertElement.className = 'alert alert-warning';
    alertElement.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Not Implemented:</strong> Consumables loot settings are not implemented yet.
    `;
    contentEl.appendChild(alertElement);
};

const showAmmo = ()=>{
    let AmmoSettings = modifiedAmmoByWeaponClass;
    let chances = chancesCtrl.fillChancesTable(AmmoSettings, ['MinAmmo', 'MaxAmmo']);
    chances.addEventListener('change', chancesCtrl.onAmmoChanceChange);
    contentEl.appendChild(chances);

    contentEl.appendChild(chancesCtrl.drawAttentionDiv());
};

const showGrenades = ()=>{
    let GrenadeSettings = modifiedGrenadeSettings;
    let chances = chancesCtrl.fillChancesTable(GrenadeSettings.Default);
    chances.addEventListener('change', chancesCtrl.onGrenadeChanceChange);
    contentEl.appendChild(chances);

    contentEl.appendChild(chancesCtrl.drawAttentionDiv());
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
            chancesCtrl.curentFaction = e.target.id;
            e.target.classList.add('active');
            let els = document.getElementsByClassName('faction_item');
            for (let j = 0; j < els.length; j++) {
                if (els[j].id !== e.target.id) {
                    els[j].classList.remove('active');
                }
            }

            oCategoryToEvent[chancesCtrl.currentCategory]();
        });
    }

    elements = document.getElementsByClassName('category_item');
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', function(e) {
            contentEl.innerHTML = '';
            chancesCtrl.currentCategory = e.target.id;
            e.target.classList.add('active');
            let els = document.getElementsByClassName('category_item');
            for (let j = 0; j < els.length; j++) {
                if (els[j].id !== e.target.id) {
                    els[j].classList.remove('active');
                }
            }

            oCategoryToEvent[chancesCtrl.currentCategory]();
        });
    }
}

subscribeToEvents()

const drawHelp = () => {
    return `
        <div class="container-fluid">
            <div class="row">
                <div class="col-12">
                    <h4 class="mb-4">
                        <i class="fas fa-question-circle me-2"></i>Installation Guide
                    </h4>
                    
                    <div class="card">
                        <div class="card-body">
                            <ol class="list-group list-group-numbered">
                                <li class="list-group-item d-flex justify-content-between align-items-start">
                                    <div class="ms-2 me-auto">
                                        <div class="fw-bold">Configure Settings</div>
                                        After configuring all settings press the download 
                                        <img src="img/file.png" style="width:20px" class="mx-1" alt="download"> icon
                                    </div>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-start">
                                    <div class="ms-2 me-auto">
                                        <div class="fw-bold">Download Packing Tool</div>
                                        Download the 
                                        <a href="https://www.nexusmods.com/stalker2heartofchornobyl/mods/398" target="_blank" class="btn btn-sm btn-outline-primary ms-1">
                                            <i class="fas fa-external-link-alt me-1"></i>packing tool
                                        </a> if you don't have it
                                    </div>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-start">
                                    <div class="ms-2 me-auto">
                                        <div class="fw-bold">Extract Files</div>
                                        Unzip into folder, named as zip archive, into 
                                        <code class="bg-light p-1">2-extracted-pak-files</code>
                                    </div>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-start">
                                    <div class="ms-2 me-auto">
                                        <div class="fw-bold">Repack Files</div>
                                        Run <code class="bg-light p-1">2-repack_pak.bat</code>, select your folder and wait until it finishes
                                    </div>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-start">
                                    <div class="ms-2 me-auto">
                                        <div class="fw-bold">Install Mod</div>
                                        Copy created .pak file from <code class="bg-light p-1">3-repacked-pak-files</code> to<br>
                                        <code class="bg-light p-1">Stalker 2 Game Folder\\Stalker2\\Content\\Paks\\~mods\\</code>
                                    </div>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const drawCloseButton = (wind) => {
    return `
        <div class="d-flex justify-content-end mt-3">
            <button id="btn_close_msg_${wind}" class="btn btn-secondary">
                <i class="fas fa-times me-1"></i>Close
            </button>
        </div>
    `;
};

const drawFileSettings = () => {
    // Use Bootstrap form styling
    return `
        <div class="container-fluid">
            <div class="row">
                <div class="col-12">
                    <h4 class="mb-4">
                        <i class="fas fa-cog me-2"></i>Compatibility Settings
                    </h4>
                    
                    <form class="needs-validation" novalidate>
                        <div class="card mb-3">
                            <div class="card-header">
                                <h5 class="card-title mb-0">
                                    <i class="fas fa-puzzle-piece me-2"></i>Mod Compatibility
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="copm_SHA" ${modsCompatibility.SHA ? 'checked' : ''}>
                                    <label class="form-check-label" for="copm_SHA">
                                        <strong>Separated Helmets and Armor</strong>
                                        <small class="d-block text-muted">Enable if you're using mods that separate helmet and armor systems</small>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">
                                    <i class="fas fa-shield-alt me-2"></i>Armor Drop Settings
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="drop_armor" ${modifiedDropConfigs.createDroppableArmor ? 'checked' : ''}>
                                    <label class="form-check-label" for="drop_armor">
                                        <strong>Enable armor dropping</strong>
                                        <small class="d-block text-muted">Allow NPCs to drop their armor when killed</small>
                                    </label>
                                </div>
                                
                                <div class="armor_drop_settings" style="display:${modifiedDropConfigs.createDroppableArmor ? 'block' : 'none'}">
                                    <div class="row g-3">
                                        <div class="col-md-4">
                                            <label for="armor_chance" class="form-label">Armor drop chance (%)</label>
                                            <input type="number" class="form-control" id="armor_chance" value="${modifiedDropConfigs.nLootChance}" min="0" max="100">
                                            <div class="form-text">Percentage chance that armor will drop</div>
                                        </div>
                                        <div class="col-md-4">
                                            <label for="min_condition" class="form-label">Minimal condition (%)</label>
                                            <input type="number" class="form-control" id="min_condition" value="${modifiedDropConfigs.nMinDurability}" min="0" max="100">
                                            <div class="form-text">Minimum durability of dropped armor</div>
                                        </div>
                                        <div class="col-md-4">
                                            <label for="max_condition" class="form-label">Maximal condition (%)</label>
                                            <input type="number" class="form-control" id="max_condition" value="${modifiedDropConfigs.nMaxDurability}" min="0" max="100">
                                            <div class="form-text">Maximum durability of dropped armor</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
};

const subscribeFileSettingsEvents = () => {
    let SHAComp = document.getElementById('copm_SHA');
    SHAComp.addEventListener('change', function(e) {
        modsCompatibility.SHA = e.target.checked;
    });

    let dropArmor = document.getElementById('drop_armor');
    dropArmor.addEventListener('change', function(e) {
        modifiedDropConfigs.createDroppableArmor = e.target.checked;
        const settingsDiv = document.querySelector('.armor_drop_settings');
        if (settingsDiv) {
            if (e.target.checked) {
                settingsDiv.style.display = 'block';
            } else {
                settingsDiv.style.display = 'none';
            }
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
    
    // Use Bootstrap modal-like styling
    messageBox.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
    messageBox.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    messageBox.style.zIndex = '1050';
    messageBox.innerHTML = `
        <div class="bg-white rounded shadow p-4" style="max-width: 90vw; max-height: 90vh; overflow-y: auto;">
            ${message}
            ${drawCloseButton(wind)}
        </div>
    `;
    
    messageBox.id = 'messageBox_'+wind;
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
            oCategoryToEvent[chancesCtrl.currentCategory]();
        };
        reader.readAsText(file);
    };
    input.click();
};

const TODOList = [
    "Public presets",
    "Some style fixes",
    "Import config",
    "Local storage of settings",
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

const openPresetsWindow = async () => {
    // Check if we already have Bootstrap modals in the document
    if (!document.getElementById('presetsModal')) {
        // Create and append the Bootstrap modals
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = `
            <!-- Bootstrap Presets Modal -->
            <div class="modal fade" id="presetsModal" tabindex="-1" aria-labelledby="presetsModalLabel" aria-hidden="true">
              <div class="modal-dialog modal-xl modal-dialog-scrollable">
                <div class="modal-content">
                  <div class="modal-header bg-brown">
                    <h5 class="modal-title text-white" id="presetsModalLabel">
                      <i class="fas fa-list me-2"></i>Presets
                    </h5>
                    <div class="d-flex gap-2">
                      <button id="btn_save_new_preset" class="btn btn-light btn-sm">
                        <i class="fas fa-plus me-1"></i> Save as New
                      </button>
                      <button id="btn_update_preset" class="btn btn-light btn-sm" ${!localStorage.getItem('editingPresetId') ? 'disabled' : ''}>
                        <i class="fas fa-save me-1"></i> Update Current
                      </button>
                      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                  </div>
                  <div class="modal-body p-3">
                    <div class="row">
                      <div class="col-12 mb-4">
                        <div class="card">
                          <div class="card-header bg-primary bg-opacity-10">
                            <h5 class="mb-0"><i class="fas fa-star me-2"></i>Official Presets</h5>
                          </div>
                          <div class="card-body">
                            <div id="officialPresetsList" class="row g-3">
                              <!-- Official presets will be loaded here -->
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="col-12">
                        <div class="card">
                          <div class="card-header bg-warning bg-opacity-10">
                            <h5 class="mb-0"><i class="fas fa-users me-2"></i>Community Presets</h5>
                          </div>
                          <div class="card-body">
                            <div id="communityPresetsList" class="row g-3">
                              <!-- Community presets will be loaded here -->
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Save Preset Modal -->
            <div class="modal fade" id="savePresetModal" tabindex="-1" aria-labelledby="savePresetModalLabel" aria-hidden="true">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title" id="savePresetModalLabel">
                      <i class="fas fa-save me-2"></i>Save Preset
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                    <form id="savePresetForm" class="needs-validation" novalidate>
                      <div class="mb-3">
                        <label for="preset-name" class="form-label">Preset Name</label>
                        <input type="text" class="form-control" id="preset-name" value="${document.getElementById('config_name').value || ''}" required>
                        <div class="invalid-feedback">
                          Please enter a preset name.
                        </div>
                      </div>
                      <div class="mb-3">
                        <label for="preset-author" class="form-label">Author Name</label>
                        <input type="text" class="form-control" id="preset-author" required>
                        <div class="invalid-feedback">
                          Please enter your name.
                        </div>
                      </div>
                      <div class="mb-3">
                        <label for="preset-version" class="form-label">Version</label>
                        <input type="text" class="form-control" id="preset-version" value="1.0">
                      </div>
                      <div class="mb-3">
                        <label for="preset-pin" class="form-label">PIN (8 digits)</label>
                        <input type="text" class="form-control" id="preset-pin" 
                               pattern="[0-9]{8}" maxlength="8" required
                               placeholder="For future editing/deleting">
                        <div class="invalid-feedback">
                          Please enter an 8-digit PIN.
                        </div>
                        <div class="form-text">You'll need this PIN to edit or delete your preset later.</div>
                      </div>
                      <div class="mb-3">
                        <label for="preset-description" class="form-label">Description</label>
                        <textarea class="form-control" id="preset-description" rows="3"></textarea>
                      </div>
                    </form>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="savePresetBtn">Save</button>
                  </div>
                </div>
              </div>
            </div>
            
        `;
        document.body.appendChild(modalContainer);
    }
    
    // Define the function to handle preset clicks
    const onPresetClick = function(e) {
        // Ignore clicks on buttons
        if (e.target.closest('.btn-edit') || e.target.closest('.btn-delete')) {
            return;
        }
        
        const presetCard = e.currentTarget;
        const id = presetCard.dataset.id;
        const type = presetCard.dataset.type;
        
        // Use the withLoadingSpinner helper
        withLoadingSpinner(async () => {
            try {
                const data = await getPreset(id, type);
                if (!data) { 
                    alert('Error loading preset'); 
                    return;
                }
                
                let preset = data.data;
                modifiedWeaponSettings = preset.WeaponSettings;
                modifiedArmorSettings = preset.ArmorSettings;
                modifiedGrenadeSettings = preset.GrenadeSettings;
                modifiedAmmoByWeaponClass = preset.AmmoSettings;
                modifiedWeaponList = preset.WeaponList;
                modifiedDropConfigs = preset.DropConfigs;
                modsCompatibility = preset.Compatibility;
                modifiedArmorSpawnSettings = preset.ArmorSpawnSettings;
                modifiedHelmetSpawnSettings = preset.HelmetsSettings;
                document.getElementById('config_name').value = presetCard.dataset.name;

                contentEl.innerHTML = '';
                oCategoryToEvent[chancesCtrl.currentCategory]();

                // Hide the modal
                const modalEl = document.getElementById('presetsModal');
                const presetsModal = bootstrap.Modal.getInstance(modalEl);
                presetsModal.hide();
            } catch (error) {
                console.error("Error loading preset:", error);
                alert("Failed to load preset: " + error.message);
            }
        });
    };
    
    const onEditPresetClick = function(e) {
        e.stopPropagation();
        const presetCard = e.currentTarget.closest('.card');
        const id = presetCard.dataset.id;
        
        // Show pin prompt
        const pin = prompt("Enter the 8-digit PIN to edit this preset:", "");
        if (!pin || pin.length !== 8 || !/^\d+$/.test(pin)) {
            alert("Please enter a valid 8-digit PIN");
            return;
        }
        
        // Use the withLoadingSpinner helper
        withLoadingSpinner(async () => {
            try {
                // First check if PIN is valid
                const response = await checkPin(id, pin);
                if (!response || !response.result) {
                    alert("Invalid PIN. Unable to edit preset.");
                    return;
                }
                
                // PIN is valid, load the preset and prepare for editing
                const data = await getPreset(id, 'community');
                if (!data) { 
                    alert('Error loading preset'); 
                    return;
                }
                
                // Load preset data
                let preset = data.data;
                modifiedWeaponSettings = preset.WeaponSettings;
                modifiedArmorSettings = preset.ArmorSettings;
                modifiedGrenadeSettings = preset.GrenadeSettings;
                modifiedAmmoByWeaponClass = preset.AmmoSettings;
                modifiedWeaponList = preset.WeaponList;
                modifiedDropConfigs = preset.DropConfigs;
                modsCompatibility = preset.Compatibility;
                modifiedArmorSpawnSettings = preset.ArmorSpawnSettings;
                modifiedHelmetSpawnSettings = preset.HelmetsSettings;
                document.getElementById('config_name').value = presetCard.dataset.name;
                
                // Store the preset ID and PIN for later use
                localStorage.setItem('editingPresetId', id);
                localStorage.setItem('editingPresetPin', pin);
                
                // Enable the update button
                document.getElementById('btn_update_preset').disabled = false;
                
                contentEl.innerHTML = '';
                oCategoryToEvent[chancesCtrl.currentCategory]();
                
                // Hide the modal
                const presetsModal = bootstrap.Modal.getInstance(document.getElementById('presetsModal'));
                presetsModal.hide();
                
                // Show notification that we're editing
                alert("You are now editing the preset. Save changes using the 'Update Current' option.");
            } catch (error) {
                console.error("Error editing preset:", error);
                alert("Failed to edit preset: " + error.message);
            }
        });
    };

    const onDeletePresetClick = function(e) {
        e.stopPropagation();
        const presetCard = e.currentTarget.closest('.card');
        const id = presetCard.dataset.id;
        const name = presetCard.dataset.name;
        
        if (!confirm(`Are you sure you want to delete the preset "${name}"?`)) {
            return;
        }
        
        // Show pin prompt
        const pin = prompt("Enter the 8-digit PIN to delete this preset:", "");
        if (!pin || pin.length !== 8 || !/^\d+$/.test(pin)) {
            alert("Please enter a valid 8-digit PIN");
            return;
        }
        
        withLoadingSpinner(async () => {
            try {
                const response = await deletePreset(id, pin);
                
                if (response && response.result) {
                    alert("Preset deleted successfully");
                    
                    // Remove from UI
                    const colElement = presetCard.closest('.col-md-6');
                    if (colElement) {
                        colElement.remove();
                    }
                    
                    // Check if there are no more presets
                    const communityList = document.getElementById('communityPresetsList');
                    if (communityList && communityList.children.length === 0) {
                        communityList.innerHTML = '<div class="col-12 text-center text-muted py-3">No community presets available</div>';
                    }
                } else {
                    alert("Failed to delete preset. Invalid PIN or server error.");
                }
            } catch (error) {
                console.error("Error deleting preset:", error);
                alert("Failed to delete preset: " + error.message);
            }
        });
    };

    const onSaveNewPresetClick = function() {
        // Hide the presets modal
        const presetsModal = bootstrap.Modal.getInstance(document.getElementById('presetsModal'));
        presetsModal.hide();
        
        // Reset the form
        const form = document.getElementById('savePresetForm');
        form.classList.remove('was-validated');
        document.getElementById('preset-name').value = document.getElementById('config_name').value || '';
        document.getElementById('preset-author').value = '';
        document.getElementById('preset-pin').value = '';
        document.getElementById('preset-description').value = '';
        
        // Show the save preset modal
        const savePresetModal = new bootstrap.Modal(document.getElementById('savePresetModal'));
        savePresetModal.show();
    };
    
    const onSavePresetSubmit = function() {
        const form = document.getElementById('savePresetForm');
        
        // Validate the form
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
            form.classList.add('was-validated');
            return;
        }
        
        // Get form values
        const name = document.getElementById('preset-name').value.trim();
        const author = document.getElementById('preset-author').value.trim();
        const version = document.getElementById('preset-version').value.trim();
        const pin = document.getElementById('preset-pin').value.trim();
        const description = document.getElementById('preset-description').value.trim();
        
        const presetData = {
            name,
            author,
            version,
            pin,
            description,
            data: {
                WeaponSettings: modifiedWeaponSettings,
                ArmorSettings: modifiedArmorSettings,
                GrenadeSettings: modifiedGrenadeSettings,
                AmmoSettings: modifiedAmmoByWeaponClass,
                WeaponList: modifiedWeaponList,
                DropConfigs: modifiedDropConfigs,
                Compatibility: modsCompatibility,
                ArmorSpawnSettings: modifiedArmorSpawnSettings,
                HelmetsSettings: modifiedHelmetSpawnSettings
            }
        };
        
        withLoadingSpinner(async () => {
            try {
                const response = await createPreset(presetData);
                
                if (response && response.result) {
                    // Hide the modal
                    const savePresetModal = bootstrap.Modal.getInstance(document.getElementById('savePresetModal'));
                    savePresetModal.hide();
                    
                    // Show success message
                    alert("Preset saved successfully!");
                    
                    // Refresh the presets list by reopening the presets modal
                    openPresetsWindow();
                } else {
                    alert("Failed to save preset: " + (response?.error || "Unknown error"));
                }
            } catch (error) {
                console.error("Error saving preset:", error);
                alert("Failed to save preset: " + error.message);
            }
        });
    };

    const onUpdatePresetClick = function() {
        const editingId = localStorage.getItem('editingPresetId');
        const editingPin = localStorage.getItem('editingPresetPin');
        
        if (!editingId || !editingPin) {
            alert("No preset is currently being edited");
            return;
        }
        
        const name = document.getElementById('config_name').value.trim();
        
        if (!name) {
            alert("Please enter a preset name");
            return;
        }
        
        const presetData = {
            name,
            pin: editingPin,
            data: {
                WeaponSettings: modifiedWeaponSettings,
                ArmorSettings: modifiedArmorSettings,
                GrenadeSettings: modifiedGrenadeSettings,
                AmmoSettings: modifiedAmmoByWeaponClass,
                WeaponList: modifiedWeaponList,
                DropConfigs: modifiedDropConfigs,
                Compatibility: modsCompatibility,
                ArmorSpawnSettings: modifiedArmorSpawnSettings,
                HelmetsSettings: modifiedHelmetSpawnSettings
            }
        };
        
        withLoadingSpinner(async () => {
            try {
                const response = await updatePreset(editingId, presetData);
                
                if (response && response.result) {
                    alert("Preset updated successfully!");
                    
                    // Clear editing state
                    localStorage.removeItem('editingPresetId');
                    localStorage.removeItem('editingPresetPin');
                    
                    // Disable the update button
                    document.getElementById('btn_update_preset').disabled = true;
                    
                    // Close the modal
                    const presetsModal = bootstrap.Modal.getInstance(document.getElementById('presetsModal'));
                    presetsModal.hide();
                } else {
                    alert("Failed to update preset: " + (response?.error || "Unknown error"));
                }
            } catch (error) {
                console.error("Error updating preset:", error);
                alert("Failed to update preset: " + error.message);
            }
        });
    };

    // Setup event handlers for the modals
    document.getElementById('btn_save_new_preset').addEventListener('click', onSaveNewPresetClick);
    document.getElementById('btn_update_preset').addEventListener('click', onUpdatePresetClick);
    document.getElementById('savePresetBtn').addEventListener('click', onSavePresetSubmit);
    
    // Show the modal
    const presetsModal = new bootstrap.Modal(document.getElementById('presetsModal'));
    presetsModal.show();
    
    // Load presets data
    try {
        const headers = await fetchHeaders();
        
        if (!headers) {
            alert("Failed to load presets. Please check your connection and try again.");
            return;
        }
        
        const officialPresets = headers.officialPresets || [];
        const publicPresets = headers.publicPresets || [];

            const officialList = document.getElementById('officialPresetsList');
            const communityList = document.getElementById('communityPresetsList');
        
        // Clear any existing content
        officialList.innerHTML = '';
        communityList.innerHTML = '';
        
        // Add official presets
        if (officialPresets.length === 0) {
            officialList.innerHTML = '<div class="col-12 text-center text-muted py-3">No official presets available</div>';
        } else {
            for (let preset of officialPresets) {
                const col = document.createElement('div');
                col.className = 'col-md-6 col-lg-4';
                
                col.innerHTML = `
                    <div class="card h-100 border-primary border-opacity-25 card-preset card-preset-official" data-id="${preset._id}" data-type="official" data-name="${preset.name}">
                        <div class="card-body">
                            <h5 class="card-title">${preset.name}</h5>
                            <div class="d-flex justify-content-between">
                                <span class="badge bg-primary bg-opacity-75 text-dark">
                                    <i class="fas fa-certificate me-1"></i>Official
                                </span>
                                <span class="text-muted small">
                                    <i class="fas fa-code-branch me-1"></i>v${preset.version || '1.0'}
                                </span>
                            </div>
                            <div class="mt-2 text-end">
                                <span class="text-muted small">
                                    <i class="fas fa-eye me-1"></i>${preset.views || 0} views
                                </span>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add click event to load the preset
                const presetCard = col.querySelector('.card-preset');
                presetCard.addEventListener('click', onPresetClick);
                
                officialList.appendChild(col);
            }
        }

        // Add community presets
        if (publicPresets.length === 0) {
            communityList.innerHTML = '<div class="col-12 text-center text-muted py-3">No community presets available</div>';
        } else {
            for (let preset of publicPresets) {
                const col = document.createElement('div');
                col.className = 'col-md-6 col-lg-4';
                
                col.innerHTML = `
                    <div class="card h-100 border-warning border-opacity-25 card-preset card-preset-community" data-id="${preset._id}" data-type="community" data-name="${preset.name}">
                        <div class="card-body position-relative">
                            <h5 class="card-title">${preset.name}</h5>
                            <div class="d-flex justify-content-between">
                                <span class="badge bg-warning bg-opacity-75 text-dark">
                                    <i class="fas fa-users me-1"></i>Community
                                </span>
                                <span class="text-muted small">
                                    <i class="fas fa-user me-1"></i>${preset.author || 'Anonymous'}
                                </span>
                            </div>
                            <div class="mt-2 d-flex justify-content-between">
                                <span class="text-muted small">
                                    <i class="fas fa-code-branch me-1"></i>v${preset.version || '1.0'}
                                </span>
                                <span class="text-muted small">
                                    <i class="fas fa-eye me-1"></i>${preset.views || 0} views
                                </span>
                            </div>
                            <div class="position-absolute top-0 end-0 m-2">
                                <button class="btn btn-sm btn-outline-primary btn-edit" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger btn-delete ms-1" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add click event to load the preset
                const presetCard = col.querySelector('.card-preset');
                presetCard.addEventListener('click', onPresetClick);
                
                // Add click events for edit and delete buttons
                const editBtn = col.querySelector('.btn-edit');
                editBtn.addEventListener('click', onEditPresetClick);
                
                const deleteBtn = col.querySelector('.btn-delete');
                deleteBtn.addEventListener('click', onDeletePresetClick);
                
                communityList.appendChild(col);
            }
        }
        
    } catch (error) {
        console.error("Error loading presets:", error);
        alert("Failed to load presets: " + error.message);
    }
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

button = document.getElementById('btn_presets');
button.addEventListener('click', () => {
    console.log('Presets button clicked');
    withLoadingSpinner(openPresetsWindow);
});
