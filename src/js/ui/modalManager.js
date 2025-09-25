/**
 * Modal Manager Module
 * Handle all modal-related functionality
 */

import { createModal, createElement } from '../utils/dom.js';
import { UIHelpers } from './uiHelpers.js';

export class ModalManager {
    constructor() {
        this.activeModals = new Map();
    }
    
    createMessageBox(id, contentElement, options = {}) {
        const modalId = `messageBox_${id}`;
        
        // Remove existing modal if it exists
        if (document.getElementById(modalId)) {
            this.removeMessageBox(id);
        }

        let content;
        if (typeof contentElement === 'string') {
            content = UIHelpers.createElementFromHtml(`<p>${contentElement}</p>`);
        } else {
            content = contentElement;
        }

        // Create modal with safe content
        const messageBox = createModal({
            id: modalId,
            content: content,
            buttons: [
                {
                    text: options.closeText || 'Close',
                    className: 'btn btn-secondary',
                    onClick: () => this.removeMessageBox(id)
                }
            ]
        });
        
        this.activeModals.set(id, messageBox);
        
        return messageBox;
    }

    createConfirmationBox(id, contentElement, options = {}) {
        const modalId = `confirmBox_${id}`;
        // Remove existing modal if it exists
        if (document.getElementById(modalId)) {
            this.removeMessageBox(id, 'confirmBox_');
        }

        let content;
        if (typeof contentElement === 'string') {
            content = UIHelpers.createElementFromHtml(`<p>${contentElement}</p>`);
        } else {
            content = contentElement;
        }

        const messageBox = createModal({
            id: modalId,
            content: content,
            buttons: [
                {
                    text: options.cancelText || 'Cancel',
                    className: 'btn btn-secondary',
                    iconClass: 'fas fa-times',
                    onClick: () => this.removeMessageBox(id, 'confirmBox_')
                },
                {
                    text: options.confirmText || 'Confirm',
                    className: 'btn btn-primary',
                    iconClass: 'fas fa-check',
                    onClick: () => {
                        if (options.confirmValidation && !options.confirmValidation()) {
                            return;
                        }
                        if (options.onConfirm) options.onConfirm();
                        this.removeMessageBox(id, 'confirmBox_');
                    }
                }
            ]
        });
        this.activeModals.set(id, messageBox);
        return messageBox;
    }
    
    removeMessageBox(id, prefix = 'messageBox_') {
        const modalId = `${prefix}${id}`;
        const messageBox = document.getElementById(modalId);
        if (messageBox && messageBox.parentNode) {
            // Close modal if it's open
            if (window.bootstrap) {
                const modalInstance = window.bootstrap.Modal.getInstance(messageBox);
                if (modalInstance) {
                    modalInstance.dispose();
                }
            }
            messageBox.parentNode.removeChild(messageBox);
            this.activeModals.delete(id);
        }
    }
    
    showHelpModal() {
        const helpContent = this._createHelpContent();
        this.createMessageBox('help', helpContent);
    }
    
    showInfoModal() {
        const infoContent = this._createInfoContent();
        this.createMessageBox('info', infoContent);
    }
    
    showFileSettingsModal(appState, onSettingsChange) {
        const settingsContent = this._createFileSettingsContent(appState);
        const modal = this.createMessageBox('settings', settingsContent);
        
        // Subscribe to settings events
        this._subscribeFileSettingsEvents(appState, onSettingsChange);
        
        return modal;
    }
    
    showToDoModal() {
        const todoContent = this._createToDoContent();
        this.createMessageBox('todo', todoContent);
    }
    
    _createHelpContent_legacy() {
        return UIHelpers.createElementFromHtml(`
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
                                            <img src="./src/img/file.png" style="width:20px" class="mx-1" alt="download"> icon
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
        `);
    }

    _createHelpContent() {
        return UIHelpers.createElementFromHtml(`
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
                                            <img src="./src/img/file.png" style="width:20px" class="mx-1" alt="download"> icon
                                        </div>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-start">
                                        <div class="ms-2 me-auto">
                                            <div class="fw-bold">Install Mod</div>
                                            Copy downloaded .pak file to<br>
                                            <code class="bg-light p-1">Stalker 2 Game Folder\\Stalker2\\Content\\Paks\\~mods\\</code>
                                        </div>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-start">
                                        <div class="ms-2 me-auto">
                                            <div class="fw-bold">Enjoy</div>
                                            Yes. That's all. You can now run the game with your custom configurations.
                                        </div>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-start">
                                        <div class="ms-2 me-auto">
                                            <div class="fw-bold">Save preset for others (optional)</div>
                                            If you want to share your configuration with others, you can save it as a preset using the
                                            <img src="./src/img/list.png" style="width:20px" class="mx-1" alt="save"> icon and save preset to be used by others.
                                        </div>
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }
    
    _createInfoContent() {
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
            const p = createElement('p', { textContent: text });
            container.appendChild(p);
        });

        return container;
    }
    
    _createFileSettingsContent(appState) {
        return UIHelpers.createElementFromHtml(`
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
                                        <input class="form-check-input" type="checkbox" id="copm_SHA" ${appState.modsCompatibility.SHA ? 'checked' : ''}>
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
                                        <input class="form-check-input" type="checkbox" id="drop_armor" ${appState.modifiedDropConfigs.createDroppableArmor ? 'checked' : ''}>
                                        <label class="form-check-label" for="drop_armor">
                                            <strong>Enable armor dropping</strong>
                                            <small class="d-block text-muted">Allow NPCs to drop their armor when killed</small>
                                        </label>
                                    </div>
                                    
                                    <div class="armor_drop_settings" style="display:${appState.modifiedDropConfigs.createDroppableArmor ? 'block' : 'none'}">
                                        <div class="row g-3">
                                            <div class="col-md-4">
                                                <label for="armor_chance" class="form-label">Armor drop chance (%)</label>
                                                <input type="number" class="form-control" id="armor_chance" value="${appState.modifiedDropConfigs.nLootChance}" min="0" max="100">
                                                <div class="form-text">Percentage chance that armor will drop</div>
                                            </div>
                                            <div class="col-md-4">
                                                <label for="min_condition" class="form-label">Minimal condition (%)</label>
                                                <input type="number" class="form-control" id="min_condition" value="${appState.modifiedDropConfigs.nMinDurability}" min="0" max="100">
                                                <div class="form-text">Minimum durability of dropped armor</div>
                                            </div>
                                            <div class="col-md-4">
                                                <label for="max_condition" class="form-label">Maximal condition (%)</label>
                                                <input type="number" class="form-control" id="max_condition" value="${appState.modifiedDropConfigs.nMaxDurability}" min="0" max="100">
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
        `);
    }

    _createDeveloperWarningContent() {
        return UIHelpers.createElementFromHtml(`
            <div class="container-fluid">
            <div class="row">
                <div class="col-12">
                <h4 class="mb-4 text-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>Developer Warning
                </h4>
                
                <div class="alert alert-warning" role="alert">
                    <div class="d-flex align-items-center mb-3">
                    <i class="fas fa-code text-warning me-2" style="font-size: 1.5em;"></i>
                    <h5 class="mb-0">Development Version</h5>
                    </div>
                    <p class="mb-2">
                    <strong>This is a development version of the website.</strong>
                    </p>
                    <p class="mb-2">
                    You may experience bugs, incomplete features, or unexpected behavior. 
                    This version is intended for testing and development purposes only.
                    </p>
                    <p class="mb-0">
                    <i class="fas fa-info-circle me-1"></i>
                    For the stable version, please visit the 
                    <a href="https://https://s2-loadout-creator.cc/" target="_blank">main release</a>.
                    </p>
                </div>
                </div>
            </div>
            </div>
        `);
    }
    
    showDeveloperWarning() {
        const warningContent = this._createDeveloperWarningContent();
        this.createMessageBox('dev-warning', warningContent, {
            closeText: 'I Understand'
        });
    }
    
    _subscribeFileSettingsEvents(appState, onSettingsChange) {
        const SHAComp = document.getElementById('copm_SHA');
        if (SHAComp) {
            SHAComp.addEventListener('change', (e) => {
                appState.modsCompatibility.SHA = e.target.checked;
                if (onSettingsChange) onSettingsChange('compatibility', appState.modsCompatibility);
            });
        }

        const dropArmor = document.getElementById('drop_armor');
        if (dropArmor) {
            dropArmor.addEventListener('change', (e) => {
                appState.modifiedDropConfigs.createDroppableArmor = e.target.checked;
                const settings = document.querySelector('.armor_drop_settings');
                if (settings) {
                    settings.style.display = e.target.checked ? 'block' : 'none';
                }
                if (onSettingsChange) onSettingsChange('dropConfigs', appState.modifiedDropConfigs);
            });
        }

        // Add validation and change handlers for numeric inputs
        const armorChance = document.getElementById('armor_chance');
        const minCondition = document.getElementById('min_condition');
        const maxCondition = document.getElementById('max_condition');
        
        if (armorChance) {
            armorChance.addEventListener('change', (e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 0 && value <= 100) {
                    appState.modifiedDropConfigs.nLootChance = value;
                    if (onSettingsChange) onSettingsChange('dropConfigs', appState.modifiedDropConfigs);
                }
            });
        }
        
        if (minCondition) {
            minCondition.addEventListener('change', (e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 0 && value <= 100) {
                    appState.modifiedDropConfigs.nMinDurability = value;
                    if (onSettingsChange) onSettingsChange('dropConfigs', appState.modifiedDropConfigs);
                }
            });
        }
        
        if (maxCondition) {
            maxCondition.addEventListener('change', (e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 0 && value <= 100) {
                    appState.modifiedDropConfigs.nMaxDurability = value;
                    if (onSettingsChange) onSettingsChange('dropConfigs', appState.modifiedDropConfigs);
                }
            });
        }
    }
    
    _createToDoContent() {
        const TODOList = [
            "Presets editing",
            "Presets sharing",
            "More style fixes",
            "Rewrite and clean some AI slop",
            "Create as splitted files and override for better compatibility",
            "OXA compatibility",
            "Lootable Zone compatibility",
            "Import .cfg or .pak file",
            "Local storage of settings",
            "Tutorial",
            "Guard configuration",
            "Alphabetical sorting",
            "Search",
            "Site localization",
            "Helmets drops",
            "Full item list from game (do we need unique items?)",
            "Armor Loot chances by player rank",
            "Ammo count by player rank",
            "Consumables settings",
            "Artifacts settings",
            "Secondary weapons settings",
        ];
        
        const container = createElement('div');
        
        const title = createElement('h2', {
            textContent: 'TODO LIST'
        });
        container.appendChild(title);
        
        const list = createElement('ul');
        
        TODOList.forEach(item => {
            const li = createElement('li', { textContent: item });
            list.appendChild(li);
        });
        
        container.appendChild(list);
        return container;
    }
}
