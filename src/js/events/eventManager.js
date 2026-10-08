import { bindDownloads } from '../../ui/downloads.ts';
/**
 * Event Manager Module
 * Centralized event handling and binding
 */

import { chooseJSON, downloadJSON } from '../../files/json.ts';
import { UIHelpers } from '../ui/uiHelpers.js';
import { addInputValidation, validateConfigName } from '../utils/validation.js';

export class EventManager {
    constructor(categoryRenderers, modalManager, presetsManager, appState, fileGenerator) {
        this.categoryRenderers = categoryRenderers;
        this.modalManager = modalManager;
        this.presetsManager = presetsManager;
        this.appState = appState;
        this.fileGenerator = fileGenerator;
        
        this.oCategoryToEvent = {
            "Primary": () => this.categoryRenderers.renderPrimary(),
            "Secondary": () => this.categoryRenderers.renderSecondary(),
            "Pistols": () => this.categoryRenderers.renderPistols(),
            "Helmets": () => this.categoryRenderers.renderHelmetSettings(),
            "Armor": () => this.categoryRenderers.renderArmor(),
            "Artifacts": () => this.categoryRenderers.renderArtifacts(),
            "Consumables": () => this.categoryRenderers.renderConsumables(),
            "Ammo": () => this.categoryRenderers.renderAmmo(),
            "Grenades": () => this.categoryRenderers.renderGrenades()
        };
    }
    
    initializeEventListeners() {
        this.bindCategoryEvents();
        this.bindFactionEvents(); 
        this.bindButtonEvents();
        this.bindConfigNameValidation();
    }
    
    renderCurrentView() {
        UIHelpers.clearContent(document.getElementById('content'));
        document.querySelectorAll('.category_item').forEach(item => item.classList.toggle('active', item.id === this.appState.view.category));
        document.querySelectorAll('.faction_item').forEach(item => item.classList.toggle('active', item.id === this.appState.view.faction));
        this.oCategoryToEvent[this.appState.view.category]();
    }
    bindCategoryEvents() {
        for (const element of document.getElementsByClassName('category_item')) {
            element.addEventListener('click', () => {
                this.categoryRenderers.chancesCtrl.currentCategory = element.id;
                this.renderCurrentView();
            });
        }
    }
    bindFactionEvents() {
        for (const element of document.getElementsByClassName('faction_item')) {
            element.addEventListener('click', () => {
                this.categoryRenderers.chancesCtrl.currentFaction = element.id;
                this.renderCurrentView();
            });
        }
    }

    bindButtonEvents() {
        bindDownloads(this.appState, this.fileGenerator.generateConfig);

        // Help button
        const btnHelp = document.getElementById('btn_help');
        if (btnHelp) {
            btnHelp.addEventListener('click', () => {
                this.modalManager.showHelpModal();
            });
        } else {
            console.warn('Help button not found');
        }
        
        // Export button
        const btnExport = document.getElementById('btn_export');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                this.exportToJSON();
            });
        } else {
            console.warn('Export button not found');
        }
        
        // Import button
        const btnImport = document.getElementById('btn_import');
        if (btnImport) {
            btnImport.addEventListener('click', () => {
                this.importFromJSON();
            });
        } else {
            console.warn('Import button not found');
        }
        
        // File settings button
        const btnFileSettings = document.getElementById('btn_file_settings');
        if (btnFileSettings) {
            btnFileSettings.addEventListener('click', () => {
                this.modalManager.showFileSettingsModal(this.appState, (type, data) => {
                    this.handleSettingsChange(type, data);
                });
            });
        } else {
            console.warn('File settings button not found');
        }
        
        // TODO button
        const btnTodo = document.getElementById('btn_todo');
        if (btnTodo) {
            btnTodo.addEventListener('click', () => {
                this.modalManager.showToDoModal();
            });
        } else {
            console.warn('Todo button not found');
        }
        
        // Info button
        const btnInfo = document.getElementById('btn_info');
        if (btnInfo) {
            btnInfo.addEventListener('click', () => {
                this.modalManager.showInfoModal();
            });
        } else {
            console.warn('Info button not found');
        }
        
        // Presets button
        const btnPresets = document.getElementById('btn_presets');
        if (btnPresets) {
            btnPresets.addEventListener('click', () => {
                this.presetsManager.openPresetsWindow();
            });
        } else {
            console.warn('Presets button not found');
        }
    }
    
    bindConfigNameValidation() {
        const configNameInput = document.getElementById('config_name');
        if (configNameInput) {
            addInputValidation(configNameInput, validateConfigName, null, true);
        }
    }
    
    handleSettingsChange(type, data) {
        switch (type) {
            case 'compatibility':
                this.appState.updateModsCompatibility(data);
                break;
            case 'dropConfigs':
                this.appState.updateDropConfigs(data);
                break;
            default:
                console.warn('Unknown settings type:', type);
        }
    }
    
    exportToJSON() {
        try {
            downloadJSON(this.appState, document.getElementById('config_name')?.value || 'config');
        } catch (error) {
            this.modalManager.createMessageBox('configExportError', error.message);
        }
    }
    importFromJSON() {
        chooseJSON(this.appState, () => this.renderCurrentView(), (id, message) => this.modalManager.createMessageBox(id, message));
    }
}
