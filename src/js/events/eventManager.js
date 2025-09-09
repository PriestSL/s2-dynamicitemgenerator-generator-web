/**
 * Event Manager Module
 * Centralized event handling and binding
 */

import { UIHelpers, withLoadingSpinner } from '../ui/uiHelpers.js';
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
        console.log('EventManager: Initializing all event listeners...');
        this.bindCategoryEvents();
        this.bindFactionEvents(); 
        this.bindButtonEvents();
        this.bindConfigNameValidation();
        console.log('EventManager: All event listeners initialized');
    }
    
    bindCategoryEvents() {
        let elements = document.getElementsByClassName('category_item');
        console.log('Found category elements:', elements.length);
        
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            console.log('Binding category event to:', element.id);
            
            element.addEventListener('click', (e) => {
                console.log('Category clicked:', e.target.id);
                
                // Clear content first
                const contentEl = document.getElementById('content');
                UIHelpers.clearContent(contentEl);
                
                // Get the category from the element's ID or title
                const category = e.target.id || e.target.getAttribute('title') || e.target.textContent.trim();
                
                console.log('Rendering category:', category);
                
                if (this.oCategoryToEvent[category]) {
                    this.oCategoryToEvent[category]();
                } else {
                    console.warn('No handler found for category:', category);
                }
                
                // Update active state
                document.querySelectorAll('.category_item').forEach(item => {
                    item.classList.remove('active');
                });
                e.target.classList.add('active');
            });
        }
    }
    
    bindFactionEvents() {
        let elements = document.getElementsByClassName('faction_item');
        console.log('Found faction elements:', elements.length);
        
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            console.log('Binding faction event to:', element.id);
            
            element.addEventListener('click', (e) => {
                console.log('Faction clicked:', e.target.id);
                
                // Update the current faction in chances controller
                const faction = e.target.id || e.target.getAttribute('data-faction') || e.target.textContent.trim();
                this.categoryRenderers.chancesCtrl.curentFaction = faction;
                
                console.log('Set current faction to:', faction);
                
                // Clear content and re-render current category
                const contentEl = document.getElementById('content');
                UIHelpers.clearContent(contentEl);
                
                // Find active category and re-render it
                const activeCategory = document.querySelector('.category_item.active');
                if (activeCategory) {
                    const category = activeCategory.id || activeCategory.getAttribute('title') || activeCategory.textContent.trim();
                    console.log('Re-rendering active category:', category);
                    if (this.oCategoryToEvent[category]) {
                        this.oCategoryToEvent[category]();
                    }
                }
                
                // Update active state
                document.querySelectorAll('.faction_item').forEach(item => {
                    item.classList.remove('active');
                });
                e.target.classList.add('active');
            });
        }
    }
    
    bindButtonEvents() {
        console.log('Binding button events...');
        
        // Save/Generate button
        const btnSave = document.getElementById('btn_save');
        if (btnSave) {
            console.log('Binding save button');
            btnSave.addEventListener('click', () => {
                console.log('Save button clicked');
                if (this.fileGenerator && this.appState) {
                    this.fileGenerator.generateConfig(this.appState);
                } else {
                    console.error('Missing fileGenerator or appState');
                }
            });
        } else {
            console.warn('Save button not found');
        }
        
        // Help button
        const btnHelp = document.getElementById('btn_help');
        if (btnHelp) {
            console.log('Binding help button');
            btnHelp.addEventListener('click', () => {
                console.log('Help button clicked');
                this.modalManager.showHelpModal();
            });
        } else {
            console.warn('Help button not found');
        }
        
        // Export button
        const btnExport = document.getElementById('btn_export');
        if (btnExport) {
            console.log('Binding export button');
            btnExport.addEventListener('click', () => {
                console.log('Export button clicked');
                this.exportToJSON();
            });
        } else {
            console.warn('Export button not found');
        }
        
        // Import button
        const btnImport = document.getElementById('btn_import');
        if (btnImport) {
            console.log('Binding import button');
            btnImport.addEventListener('click', () => {
                console.log('Import button clicked');
                this.importFromJSON();
            });
        } else {
            console.warn('Import button not found');
        }
        
        // File settings button
        const btnFileSettings = document.getElementById('btn_file_settings');
        if (btnFileSettings) {
            console.log('Binding file settings button');
            btnFileSettings.addEventListener('click', () => {
                console.log('File settings button clicked');
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
            console.log('Binding todo button');
            btnTodo.addEventListener('click', () => {
                console.log('Todo button clicked');
                this.modalManager.showToDoModal();
            });
        } else {
            console.warn('Todo button not found');
        }
        
        // Info button
        const btnInfo = document.getElementById('btn_info');
        if (btnInfo) {
            console.log('Binding info button');
            btnInfo.addEventListener('click', () => {
                console.log('Info button clicked');
                this.modalManager.showInfoModal();
            });
        } else {
            console.warn('Info button not found');
        }
        
        // Presets button
        const btnPresets = document.getElementById('btn_presets');
        if (btnPresets) {
            console.log('Binding presets button');
            btnPresets.addEventListener('click', () => {
                console.log('Presets button clicked');
                withLoadingSpinner(() => this.presetsManager.openPresetsWindow())();
            });
        } else {
            console.warn('Presets button not found');
        }
        
        console.log('Button event binding complete');
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
        const data = this.appState.exportState();
        
        const configNameInput = document.getElementById('config_name');
        const configName = (configNameInput ? configNameInput.value : '') || 'config';
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = configName + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    importFromJSON() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // Handle old helmet version if needed
                    if (data.HelmetsSettings && !data.HelmetsSettings.Generic_settings) {
                        data.HelmetsSettings = this._adoptOldHelmetVersion(data.HelmetsSettings);
                    }
                    
                    this.appState.importState(data);
                    
                    // Refresh the current view
                    const activeCategory = document.querySelector('.category_item.active');
                    if (activeCategory) {
                        const category = activeCategory.getAttribute('data-category') || activeCategory.textContent.trim();
                        if (this.oCategoryToEvent[category]) {
                            const contentEl = document.getElementById('content');
                            UIHelpers.clearContent(contentEl);
                            this.oCategoryToEvent[category]();
                        }
                    }
                    
                    alert('Configuration imported successfully!');
                } catch (error) {
                    console.error('Error importing configuration:', error);
                    alert('Error importing configuration. Please check the file format.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    
    _adoptOldHelmetVersion(oldVersion) {
        // Handle conversion from old helmet format to new format
        // This is a placeholder - implement based on your specific needs
        return {
            Generic_settings: oldVersion
        };
    }
}
