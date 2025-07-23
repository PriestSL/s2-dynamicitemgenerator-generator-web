import { generateConfig } from './fileStreamGenerator.js';

import { fetchHeaders, getPreset, checkPin, createPreset, updatePreset, deletePreset } from './restCalls.js';
import { withLoadingSpinner } from './spinner.js';
import { chancesController } from './chances.js';
/*ugliest code that I wrote*/
import * as configs from './configs.js'; 
import { deepCopy } from './utils.js';
import { createModal, createElement, createCardHeader, createFormInput, createAlert, escapeHtml, setTextContent, clearContent } from './utils/dom.js';
import { validateNumber, validatePercentage, validateConfigName, validatePin, validateString, addInputValidation } from './utils/validation.js';


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
        
        // Create spinner content safely
        const spinner = createElement('div', {
            className: 'spinner-border text-light',
            attributes: { 
                role: 'status',
                style: 'width: 3rem; height: 3rem;'
            }
        });
        
        const spinnerText = createElement('span', {
            className: 'visually-hidden',
            textContent: 'Loading...'
        });
        spinner.appendChild(spinnerText);
        spinnerDiv.appendChild(spinner);
        
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
    
    let cardHeader = createCardHeader({
        title: 'Global Weapon Settings',
        iconClass: 'fas fa-cog'
    });
    cardHeader.className += ' bg-info bg-opacity-10';
    
    let cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    let settingsRow = document.createElement('div');
    settingsRow.className = 'row g-3';
    
    // Minimal condition setting
    let minConditionCol = createFormInput({
        id: 'minWeaponCondition',
        type: 'number',
        label: 'Minimal condition (%)',
        value: modifiedMinWeaponDurability
    });
    minConditionCol.className = 'col-md-6';
    
    // Maximal condition setting  
    let maxConditionCol = createFormInput({
        id: 'maxWeaponCondition',
        type: 'number', 
        label: 'Maximal condition (%)',
        value: modifiedMaxWeaponDurability
    });
    maxConditionCol.className = 'col-md-6';
    
    settingsRow.appendChild(minConditionCol);
    settingsRow.appendChild(maxConditionCol);
    cardBody.appendChild(settingsRow);
    
    // Add input validation
    const minInput = minConditionCol.querySelector('input');
    const maxInput = maxConditionCol.querySelector('input');
    
    if (minInput) {
        addInputValidation(minInput, (value) => validateNumber(value, 0, 100));
    }
    
    if (maxInput) {
        addInputValidation(maxInput, (value) => validateNumber(value, 0, 100));
    }
    
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
        
        const headerContent = createElement('h5', {
            className: 'mb-0'
        });
        
        const button = createElement('button', {
            className: 'btn btn-link text-decoration-none p-0 text-start w-100',
            attributes: {
                type: 'button',
                'data-bs-toggle': 'collapse',
                'data-bs-target': `#collapse-${classification}`,
                'aria-expanded': 'true',
                'aria-controls': `collapse-${classification}`
            }
        });
        
        const gunIcon = createElement('i', {
            className: 'fas fa-gun me-2'
        });
        button.appendChild(gunIcon);
        button.appendChild(document.createTextNode(classification));
        
        const chevronIcon = createElement('i', {
            className: 'fas fa-chevron-down float-end'
        });
        button.appendChild(chevronIcon);
        
        headerContent.appendChild(button);
        cardHeader.appendChild(headerContent);
        
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
    const alertElement = createAlert({
        type: 'warning',
        message: 'Not Implemented: Changing secondary weapons are not implemented yet (they are works in game?)',
        iconClass: 'fas fa-exclamation-triangle'
    });
    contentEl.appendChild(alertElement);
};

const showPistols = ()=>{
    let GeneralSettings = 'GeneralNPC_'+chancesCtrl.curentFaction;
    if (chancesCtrl.curentFaction === 'Generic_settings'){
        let pistolSpawnChance = document.createElement('div');
        let pistolSpawnChanceLabel = document.createElement('label');
        setTextContent(pistolSpawnChanceLabel, 'Pistol kit spawn chance, %');
        pistolSpawnChance.appendChild(pistolSpawnChanceLabel);
        let pistolSpawnChanceInput = document.createElement('input');
        pistolSpawnChanceInput.type = 'number';
        pistolSpawnChanceInput.value = modifiedPistolSpawnChance;
        pistolSpawnChanceInput.className = 'form-control';
        pistolSpawnChanceInput.min = '0';
        pistolSpawnChanceInput.max = '100';

        // Add validation with change handler for data updates
        addInputValidation(pistolSpawnChanceInput, validatePercentage, 
            (sanitizedValue) => {
                modifiedPistolSpawnChance = sanitizedValue;
            }, true);

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
    const alertElement = createAlert({
        type: 'warning',
        message: 'Not Implemented: Lootable artifact settings are not implemented yet (and game uses Artifact class to generate grenades)',
        iconClass: 'fas fa-exclamation-triangle'
    });
    contentEl.appendChild(alertElement);
};

const showConsumables = ()=>{
    const alertElement = createAlert({
        type: 'warning',
        message: 'Not Implemented: Consumables loot settings are not implemented yet.',
        iconClass: 'fas fa-exclamation-triangle'
    });
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
            clearContent(contentEl);
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
            clearContent(contentEl);
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

// Helper function to safely convert HTML strings to DOM elements
// TODO: Replace with proper DOM creation functions
const createElementFromHtml = (htmlString) => {
    const container = createElement('div');
    // Use basic sanitization - remove script tags and on* attributes
    const sanitized = htmlString
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '');
    
    container.innerHTML = sanitized;
    return container;
};

// Helper function to safely create preset cards
const createPresetCard = (preset, type) => {
    const col = createElement('div', {
        className: 'col-md-6 col-lg-4'
    });
    
    const card = createElement('div', {
        className: `card h-100 border-${type === 'official' ? 'primary' : 'warning'} border-opacity-25 card-preset card-preset-${type}`,
        attributes: {
            'data-id': preset._id,
            'data-type': type,
            'data-name': escapeHtml(preset.name)
        }
    });
    
    const cardBody = createElement('div', {
        className: type === 'community' ? 'card-body position-relative' : 'card-body'
    });
    
    // Title
    const title = createElement('h5', {
        className: 'card-title',
        textContent: preset.name // Safe text content
    });
    cardBody.appendChild(title);
    
    // Badge and info row
    const badgeRow = createElement('div', {
        className: 'd-flex justify-content-between'
    });
    
    const badge = createElement('span', {
        className: `badge bg-${type === 'official' ? 'primary' : 'warning'} bg-opacity-75 text-dark`
    });
    const badgeIcon = createElement('i', {
        className: `fas fa-${type === 'official' ? 'certificate' : 'users'} me-1`
    });
    badge.appendChild(badgeIcon);
    badge.appendChild(document.createTextNode(type === 'official' ? 'Official' : 'Community'));
    
    const info = createElement('span', {
        className: 'text-muted small'
    });
    const infoIcon = createElement('i', {
        className: `fas fa-${type === 'official' ? 'code-branch' : 'user'} me-1`
    });
    info.appendChild(infoIcon);
    info.appendChild(document.createTextNode(
        type === 'official' 
            ? `v${preset.version || '1.0'}`
            : preset.author || 'Anonymous'
    ));
    
    badgeRow.appendChild(badge);
    badgeRow.appendChild(info);
    cardBody.appendChild(badgeRow);
    
    // Second info row
    const infoRow = createElement('div', {
        className: 'mt-2 d-flex justify-content-between'
    });
    
    if (type === 'official') {
        const viewsSpan = createElement('span', {
            className: 'text-muted small'
        });
        const viewsIcon = createElement('i', {
            className: 'fas fa-eye me-1'
        });
        viewsSpan.appendChild(viewsIcon);
        viewsSpan.appendChild(document.createTextNode(`${preset.views || 0} views`));
        infoRow.appendChild(viewsSpan);
    } else {
        const versionSpan = createElement('span', {
            className: 'text-muted small'
        });
        const versionIcon = createElement('i', {
            className: 'fas fa-code-branch me-1'
        });
        versionSpan.appendChild(versionIcon);
        versionSpan.appendChild(document.createTextNode(`v${preset.version || '1.0'}`));
        
        const viewsSpan = createElement('span', {
            className: 'text-muted small'
        });
        const viewsIcon = createElement('i', {
            className: 'fas fa-eye me-1'
        });
        viewsSpan.appendChild(viewsIcon);
        viewsSpan.appendChild(document.createTextNode(`${preset.views || 0} views`));
        
        infoRow.appendChild(versionSpan);
        infoRow.appendChild(viewsSpan);
    }
    
    cardBody.appendChild(infoRow);
    
    // Add edit/delete buttons for community presets
    if (type === 'community') {
        const buttonContainer = createElement('div', {
            className: 'position-absolute top-0 end-0 m-2'
        });
        
        const editBtn = createElement('button', {
            className: 'btn btn-sm btn-outline-primary btn-edit',
            attributes: { title: 'Edit' }
        });
        const editIcon = createElement('i', {
            className: 'fas fa-edit'
        });
        editBtn.appendChild(editIcon);
        
        const deleteBtn = createElement('button', {
            className: 'btn btn-sm btn-outline-danger btn-delete ms-1',
            attributes: { title: 'Delete' }
        });
        const deleteIcon = createElement('i', {
            className: 'fas fa-trash'
        });
        deleteBtn.appendChild(deleteIcon);
        
        buttonContainer.appendChild(editBtn);
        buttonContainer.appendChild(deleteBtn);
        cardBody.appendChild(buttonContainer);
    }
    
    card.appendChild(cardBody);
    col.appendChild(card);
    
    return col;
};

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
    // Add validation with change handler for data updates
    addInputValidation(armorChance, validatePercentage, 
        (sanitizedValue) => {
            modifiedDropConfigs.nLootChance = sanitizedValue;
        }, true);

    let minCondition = document.getElementById('min_condition');
    // Add validation with change handler for data updates
    addInputValidation(minCondition, validatePercentage, 
        (sanitizedValue) => {
            modifiedDropConfigs.nMinDurability = sanitizedValue;
        }, true);

    let maxCondition = document.getElementById('max_condition');
    // Add validation with change handler for data updates
    addInputValidation(maxCondition, validatePercentage, 
        (sanitizedValue) => {
            modifiedDropConfigs.nMaxDurability = sanitizedValue;
        }, true);
};

const createMessageBox = (wind, contentElement) => {
    if (document.getElementById('messageBox_'+wind)) {
        return;
    }

    // Create modal with safe content
    const messageBox = createModal({
        id: `messageBox_${wind}`,
        content: contentElement,
        buttons: [
            {
                text: 'Close',
                className: 'btn btn-secondary',
                iconClass: 'fas fa-times',
                onClick: () => removeMessageBox(wind)
            }
        ]
    });
    
    document.body.appendChild(messageBox);
};

const removeMessageBox = (wind) => {
    const messageBox = document.getElementById('messageBox_'+wind);
    if (messageBox && messageBox.parentNode) {
        // Remove all event listeners before removing the element
        const newElement = messageBox.cloneNode(false);
        messageBox.parentNode.replaceChild(newElement, messageBox);
        newElement.remove();
    }
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
            clearContent(contentEl);
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

const createToDoElement = () => {
    const container = createElement('div');
    
    const title = createElement('h2', {
        textContent: 'TODO LIST'
    });
    container.appendChild(title);
    
    const list = createElement('ul');
    
    TODOList.forEach(item => {
        const listItem = createElement('li', {
            textContent: item
        });
        list.appendChild(listItem);
    });
    
    container.appendChild(list);
    return container;
};

const showToDoWindow = () => {
    createMessageBox('todo', createToDoElement());
};

const showInfo = () => {
    const container = createElement('div');
    
    // First paragraph with link
    const p1 = createElement('p');
    p1.appendChild(document.createTextNode('This site is created by '));
    const link1 = createElement('a', {
        textContent: 'PriestSL',
        attributes: {
            href: 'https://next.nexusmods.com/profile/TechPriestSL',
            target: '_blank'
        }
    });
    p1.appendChild(link1);
    container.appendChild(p1);
    
    // Second paragraph
    const p2 = createElement('p', {
        textContent: 'Website ugly as shit, I know. But I tried to write it on pure JS to made it litest as it can be.'
    });
    container.appendChild(p2);
    
    // Third paragraph with GitHub link
    const p3 = createElement('p');
    p3.appendChild(document.createTextNode('Source code is available on '));
    const link2 = createElement('a', {
        textContent: 'GitHub',
        attributes: {
            href: 'https://github.com/PriestSL/s2-dynamicitemgenerator-generator-web',
            target: '_blank'
        }
    });
    p3.appendChild(link2);
    container.appendChild(p3);
    
    // Remaining paragraphs
    const remainingTexts = [
        'For any questions or suggestions you can contact me on NexusMods or Discord (priestsl)',
        'You free to use sources or colaborate',
        'If you want to rewrite it all (because front end is absolutely crap, and all site created without any design documents), you are welcome. If you need help with it, you can ask me =)',
        'All planning features you can see in TODO list'
    ];
    
    remainingTexts.forEach(text => {
        const p = createElement('p', {
            textContent: text
        });
        container.appendChild(p);
    });

    createMessageBox('info', container);
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

                clearContent(contentEl);
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
                
                clearContent(contentEl);
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
                        const emptyMessage = createElement('div', {
                            className: 'col-12 text-center text-muted py-3',
                            textContent: 'No community presets available'
                        });
                        communityList.appendChild(emptyMessage);
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
        
        // Additional validation beyond HTML5 validation
        const nameValidation = validateConfigName(name);
        if (!nameValidation.isValid) {
            document.getElementById('preset-name').classList.add('validation-error');
            document.getElementById('preset-name').title = nameValidation.error;
            alert(`Invalid preset name: ${nameValidation.error}`);
            return;
        }
        
        const authorValidation = validateString(author, { minLength: 1, maxLength: 30, allowEmpty: false });
        if (!authorValidation.isValid) {
            document.getElementById('preset-author').classList.add('validation-error');
            document.getElementById('preset-author').title = authorValidation.error;
            alert(`Invalid author name: ${authorValidation.error}`);
            return;
        }
        
        const pinValidation = validatePin(pin);
        if (!pinValidation.isValid) {
            document.getElementById('preset-pin').classList.add('validation-error');
            document.getElementById('preset-pin').title = pinValidation.error;
            alert(`Invalid PIN: ${pinValidation.error}`);
            return;
        }
        
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
        clearContent(officialList);
        clearContent(communityList);
        
        // Add official presets
        if (officialPresets.length === 0) {
            const emptyMessage = createElement('div', {
                className: 'col-12 text-center text-muted py-3',
                textContent: 'No official presets available'
            });
            officialList.appendChild(emptyMessage);
        } else {
            for (let preset of officialPresets) {
                const col = createPresetCard(preset, 'official');
                
                // Add click event to load the preset
                const presetCard = col.querySelector('.card-preset');
                presetCard.addEventListener('click', onPresetClick);
                
                officialList.appendChild(col);
            }
        }

        // Add community presets
        if (publicPresets.length === 0) {
            const emptyMessage = createElement('div', {
                className: 'col-12 text-center text-muted py-3',
                textContent: 'No community presets available'
            });
            communityList.appendChild(emptyMessage);
        } else {
            for (let preset of publicPresets) {
                const col = createPresetCard(preset, 'community');
                
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
    const helpContent = createElementFromHtml(drawHelp());
    createMessageBox('help', helpContent);
});
button = document.getElementById('btn_export');
button.addEventListener('click', exportToJSON);
button = document.getElementById('btn_import');
button.addEventListener('click', importFromJSON);
button = document.getElementById('btn_file_settings');
button.addEventListener('click', function() {
    const settingsContent = createElementFromHtml(drawFileSettings());
    createMessageBox('settings', settingsContent);
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

// Add validation to the main config name input
const configNameInput = document.getElementById('config_name');
if (configNameInput) {
    addInputValidation(configNameInput, validateConfigName, null, true);
}
