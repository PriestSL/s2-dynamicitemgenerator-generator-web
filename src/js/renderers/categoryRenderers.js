/**
 * Category Renderers Module
 * All category-specific UI rendering functions
 */

import { createElement, createCardHeader, createFormInput, createAlert } from '../utils/dom.js';
import { addInputValidation, validateNumber, validatePercentage } from '../utils/validation.js';

export class CategoryRenderers {
    constructor(appState, chancesController) {
        this.state = appState;
        this.chancesCtrl = chancesController;
        this.contentEl = document.getElementById('content');
    }
    
    renderPrimary() {
        if (this.chancesCtrl.currentFaction === 'Generic_settings') {
            this.renderPrimarySettings();
            return;
        }
        
        let GeneralSettings = 'GeneralNPC_' + this.chancesCtrl.currentFaction;
        let WeaponSettings = this.state.modifiedWeaponSettings[GeneralSettings];
        
        if (!WeaponSettings) {
            console.warn('No weapon settings found for:', GeneralSettings);
            return;
        }
        
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

            let chances = this.chancesCtrl.fillChancesTable(WeaponSettings[classification], null, 'weapon', classification);
            chances.addEventListener('change', this.chancesCtrl.onWeaponChanceChange);
            cardBody.appendChild(chances);
            
            collapseDiv.appendChild(cardBody);
            card.appendChild(cardHeader);
            card.appendChild(collapseDiv);
            this.contentEl.appendChild(card);
            
            // Update labels after DOM is rendered
            window.setTimeout(() => {
                this.chancesCtrl.updateAllLabels(WeaponSettings[classification], classification);
            }, 100);
        }
    }
    
    renderPrimarySettings() {
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
            value: this.state.modifiedMinWeaponDurability
        });
        minConditionCol.className = 'col-md-6';
        
        // Maximal condition setting  
        let maxConditionCol = createFormInput({
            id: 'maxWeaponCondition',
            type: 'number', 
            label: 'Maximal condition (%)',
            value: this.state.modifiedMaxWeaponDurability
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
        this.contentEl.appendChild(globalCard);
        
        // Add event listeners
        const minConditionInput = document.getElementById('minWeaponCondition');
        const maxConditionInput = document.getElementById('maxWeaponCondition');
        
        if (minConditionInput) {
            minConditionInput.addEventListener('change', (e) => {
                this.state.updateWeaponDurability(e.target.value, this.state.modifiedMaxWeaponDurability);
            });
        }
        
        if (maxConditionInput) {
            maxConditionInput.addEventListener('change', (e) => {
                this.state.updateWeaponDurability(this.state.modifiedMinWeaponDurability, e.target.value);
            });
        }

        this.chancesCtrl.fillAttributesTable(this.state.modifiedWeaponList, this.contentEl, 'weapon');
    }
    
    renderArmorSettings() {
        this.chancesCtrl.fillAttributesTable(this.state.modifiedArmorSpawnSettings, this.contentEl, 'armor');
    }
    
    renderSecondary() {
        const alertElement = createAlert({
            type: 'warning',
            message: 'Not Implemented: Changing secondary weapons are not implemented yet (they are works in game?)',
            iconClass: 'fas fa-exclamation-triangle'
        });
        this.contentEl.appendChild(alertElement);
    }
    
    renderPistols() {
        let GeneralSettings = 'GeneralNPC_' + this.chancesCtrl.currentFaction;
        
        if (this.chancesCtrl.currentFaction === 'Generic_settings') {
            // Handle generic settings for pistols
            let pistolSpawnChance = document.createElement('div');
            pistolSpawnChance.className = 'mb-3';
            
            let pistolSpawnChanceLabel = document.createElement('label');
            pistolSpawnChanceLabel.className = 'form-label';
            pistolSpawnChanceLabel.textContent = 'Pistol kit spawn chance, %';
            pistolSpawnChance.appendChild(pistolSpawnChanceLabel);
            
            let pistolSpawnChanceInput = document.createElement('input');
            pistolSpawnChanceInput.type = 'number';
            pistolSpawnChanceInput.value = this.state.modifiedPistolSpawnChance;
            pistolSpawnChanceInput.className = 'form-control';
            pistolSpawnChanceInput.min = '0';
            pistolSpawnChanceInput.max = '100';

            // Add validation with change handler for data updates
            if (typeof addInputValidation === 'function' && typeof validatePercentage === 'function') {
                addInputValidation(pistolSpawnChanceInput, validatePercentage, 
                    (sanitizedValue) => {
                        this.state.modifiedPistolSpawnChance = sanitizedValue;
                    }, true);
            }

            pistolSpawnChance.appendChild(pistolSpawnChanceInput);
            this.contentEl.appendChild(pistolSpawnChance);
            
        } else {
            // Handle faction-specific pistol settings
            let PistolSettings = this.state.modifiedPistolSettings[GeneralSettings];
            
            if (PistolSettings) {
                let chances = this.chancesCtrl.fillChancesTable(PistolSettings, null, 'pistol', '');
                chances.addEventListener('change', this.chancesCtrl.onPistolChanceChange);
                this.contentEl.appendChild(chances);

                window.setTimeout(() => {
                    this.chancesCtrl.updateAllLabels(PistolSettings);
                }, 100);
            } else {
                console.warn('No pistol settings found for:', GeneralSettings);
            }
        }
    }
    
    renderHelmetSettings() {
        let chances = this.chancesCtrl.fillChancesTable(this.state.modifiedHelmetSpawnSettings);
        chances.addEventListener('change', this.chancesCtrl.onHelmetChanceChange);

        this.contentEl.appendChild(chances);

        this.contentEl.appendChild(this.chancesCtrl.drawAttentionDiv('Values in percent. Global values for all factions. Specific spawn settings in armor section.'));
    }
    
    renderArmor() {
        if (this.chancesCtrl.currentFaction === 'Generic_settings') {
            this.renderArmorSettings();
            return;
        }

        let GeneralSettings = 'GeneralNPC_' + this.chancesCtrl.currentFaction;
        let ArmorSettings = this.state.modifiedArmorSettings[GeneralSettings];
        
        if (!ArmorSettings) {
            console.warn('No armor settings found for:', GeneralSettings);
            return;
        }
        
        let chances = this.chancesCtrl.fillChancesTable(ArmorSettings, null, 'armor', '');
        chances.addEventListener('change', this.chancesCtrl.onArmorChanceChange);

        this.contentEl.appendChild(chances);

        window.setTimeout(() => {
            this.chancesCtrl.updateAllLabels(ArmorSettings);
        }, 100);
    }
    
    renderArtifacts() {
        const alertElement = createAlert({
            type: 'warning',
            message: 'Not Implemented: Lootable artifact settings are not implemented yet (and game uses Artifact class to generate grenades)',
            iconClass: 'fas fa-exclamation-triangle'
        });
        this.contentEl.appendChild(alertElement);
    }
    
    renderConsumables() {
        const alertElement = createAlert({
            type: 'warning',
            message: 'Not Implemented: Consumables loot settings are not implemented yet.',
            iconClass: 'fas fa-exclamation-triangle'
        });
        this.contentEl.appendChild(alertElement);
    }
    
    renderAmmo() {
        let AmmoSettings = this.state.modifiedAmmoByWeaponClass;
        let chances = this.chancesCtrl.fillChancesTable(AmmoSettings, ['MinAmmo', 'MaxAmmo']);
        chances.addEventListener('change', this.chancesCtrl.onAmmoChanceChange);
        this.contentEl.appendChild(chances);

        this.contentEl.appendChild(this.chancesCtrl.drawAttentionDiv());
    }
    
    renderGrenades() {
        let GrenadeSettings = this.state.modifiedGrenadeSettings;
        let chances = this.chancesCtrl.fillChancesTable(GrenadeSettings.Default);
        chances.addEventListener('change', this.chancesCtrl.onGrenadeChanceChange);
        this.contentEl.appendChild(chances);

        this.contentEl.appendChild(this.chancesCtrl.drawAttentionDiv());
    }
}
