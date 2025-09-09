/**
 * Presets Manager Module
 * Handle all preset-related functionality
 */

import { createElement, escapeHtml } from '../utils/dom.js';
import { fetchHeaders, getPreset } from '../restCalls.js';

export class PresetsManager {
    constructor(appState) {
        this.state = appState;
    }
    
    async openPresetsWindow() {
        // Check if we already have Bootstrap modals in the document
        if (!document.getElementById('presetsModal')) {
            await this._createPresetsModal();
        }
        
        // Show the modal
        if (window.bootstrap) {
            const presetsModal = new window.bootstrap.Modal(document.getElementById('presetsModal'));
            presetsModal.show();
        }
        
        // Load presets data
        try {
            await this._loadPresets();
        } catch (error) {
            console.error('Error loading presets:', error);
        }
    }
    
    async _createPresetsModal() {
        // Create the presets modal HTML structure
        const modalHTML = `
            <div class="modal fade" id="presetsModal" tabindex="-1" aria-labelledby="presetsModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="presetsModalLabel">
                                <i class="fas fa-list me-2"></i>Presets Library
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="container-fluid">
                                <div class="row mb-3">
                                    <div class="col-12">
                                        <div class="d-flex justify-content-between align-items-center mb-3">
                                            <div>
                                                <button type="button" class="btn btn-success" id="btn_save_new_preset">
                                                    <i class="fas fa-plus me-1"></i>Save New Preset
                                                </button>
                                                <button type="button" class="btn btn-warning" id="btn_update_preset" style="display: none;">
                                                    <i class="fas fa-edit me-1"></i>Update Preset
                                                </button>
                                            </div>
                                            <div class="text-muted">
                                                <i class="fas fa-info-circle me-1"></i>
                                                Click on a preset to load it
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row" id="presets-container">
                                    <!-- Presets will be loaded here -->
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
                            <h5 class="modal-title" id="savePresetModalLabel">Save Preset</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="savePresetForm">
                                <div class="mb-3">
                                    <label for="presetName" class="form-label">Preset Name</label>
                                    <input type="text" class="form-control" id="presetName" required maxlength="50">
                                </div>
                                <div class="mb-3">
                                    <label for="presetAuthor" class="form-label">Author</label>
                                    <input type="text" class="form-control" id="presetAuthor" maxlength="30">
                                </div>
                                <div class="mb-3">
                                    <label for="presetDescription" class="form-label">Description</label>
                                    <textarea class="form-control" id="presetDescription" rows="3" maxlength="200"></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-success" id="savePresetBtn">Save Preset</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup event handlers for the modals
        this._setupEventHandlers();
    }
    
    _setupEventHandlers() {
        document.getElementById('btn_save_new_preset').addEventListener('click', () => this.handleSaveNewPreset());
        document.getElementById('btn_update_preset').addEventListener('click', () => this.handleUpdatePreset());
        document.getElementById('savePresetBtn').addEventListener('click', () => this.handleSavePresetSubmit());
        
        // Add click handler to presets container for delegation
        document.getElementById('presets-container').addEventListener('click', (e) => this.handlePresetClick(e));
    }
    
    async _loadPresets() {
        const container = document.getElementById('presets-container');
        container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border" role="status"></div></div>';
        
        try {
            // Load presets data using the same approach as original app.js
            const headers = await fetchHeaders();
            
            if (!headers || headers.error) {
                console.warn('Failed to load presets:', headers?.error || 'No response');
                container.innerHTML = '<div class="col-12 text-center text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Failed to load presets</div>';
                return;
            }
            
            const officialPresets = headers.officialPresets || [];
            const communityPresets = headers.publicPresets || [];
            
            container.innerHTML = '';
            
            // Render official presets
            if (officialPresets.length > 0) {
                const officialSection = createElement('div', { className: 'col-12 mb-4' });
                officialSection.innerHTML = '<h6><i class="fas fa-certificate me-2"></i>Official Presets</h6>';
                container.appendChild(officialSection);
                
                officialPresets.forEach(preset => {
                    const presetCard = this.createPresetCard(preset, 'official');
                    container.appendChild(presetCard);
                });
            } else {
                const officialSection = createElement('div', { className: 'col-12 mb-4' });
                officialSection.innerHTML = '<h6><i class="fas fa-certificate me-2"></i>Official Presets</h6>';
                container.appendChild(officialSection);
                
                const emptyMessage = createElement('div', {
                    className: 'col-12 text-center text-muted py-3',
                    textContent: 'No official presets available'
                });
                container.appendChild(emptyMessage);
            }
            
            // Render community presets
            if (communityPresets.length > 0) {
                const communitySection = createElement('div', { className: 'col-12 mb-4 mt-4' });
                communitySection.innerHTML = '<h6><i class="fas fa-users me-2"></i>Community Presets</h6>';
                container.appendChild(communitySection);
                
                communityPresets.forEach(preset => {
                    const presetCard = this.createPresetCard(preset, 'community');
                    container.appendChild(presetCard);
                });
            } else {
                const communitySection = createElement('div', { className: 'col-12 mb-4 mt-4' });
                communitySection.innerHTML = '<h6><i class="fas fa-users me-2"></i>Community Presets</h6>';
                container.appendChild(communitySection);
                
                const emptyMessage = createElement('div', {
                    className: 'col-12 text-center text-muted py-3',
                    textContent: 'No community presets available'
                });
                container.appendChild(emptyMessage);
            }
            
        } catch (error) {
            console.error('Error loading presets:', error);
            container.innerHTML = '<div class="col-12 text-center text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Error loading presets</div>';
        }
    }
    
    async _fetchOfficialPresets() {
        // Mock data for development - replace with actual API call in production
        try {
            const response = await fetch('/api/presets/official');
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const text = await response.text();
                    try {
                        return JSON.parse(text);
                    } catch (parseError) {
                        console.warn('Could not parse official presets JSON:', parseError);
                    }
                } else {
                    console.warn('Official presets API returned non-JSON content:', contentType);
                }
            } else {
                console.warn(`Official presets API returned ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.warn('Could not fetch official presets:', error);
        }
        
        // Return mock data for development when API is not available
        console.info('Using mock official presets for development');
        return [
            {
                id: 'stalker_default',
                name: 'Default STALKER Setup',
                description: 'Standard weapon and armor configuration for STALKER factions',
                author: 'Official',
                version: '1.0',
                faction: 'neutrals',
                settings: {}
            }
        ];
    }
    
    async _fetchCommunityPresets() {
        // Mock data for development - replace with actual API call in production
        try {
            const response = await fetch('/api/presets/community');
            if (response.ok) {
                const text = await response.text();
                try {
                    return JSON.parse(text);
                } catch (parseError) {
                    console.warn('Could not parse community presets response:', parseError);
                    return [];
                }
            } else {
                console.warn(`Community presets API returned ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.warn('Could not fetch community presets:', error);
            // Return mock data for development
            return [
                {
                    id: 'community_balanced',
                    name: 'Balanced Gameplay',
                    description: 'Community-created balanced weapon configuration',
                    author: 'Community',
                    version: '1.2',
                    faction: 'mercenaries',
                    settings: {}
                }
            ];
        }
        return [];
    }
    
    createPresetCard(preset, type) {
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
            textContent: preset.name
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
            const compatibility = createElement('small', {
                className: 'text-muted'
            });
            const compatIcon = createElement('i', {
                className: 'fas fa-gamepad me-1'
            });
            compatibility.appendChild(compatIcon);
            compatibility.appendChild(document.createTextNode(preset.gameVersion || 'Unknown'));
            infoRow.appendChild(compatibility);
        } else {
            const downloads = createElement('small', {
                className: 'text-muted'
            });
            const downloadIcon = createElement('i', {
                className: 'fas fa-download me-1'
            });
            downloads.appendChild(downloadIcon);
            downloads.appendChild(document.createTextNode(`${preset.downloads || 0} downloads`));
            infoRow.appendChild(downloads);
        }
        
        cardBody.appendChild(infoRow);
        
        // Add edit/delete buttons for community presets
        if (type === 'community') {
            const actionButtons = createElement('div', {
                className: 'position-absolute top-0 end-0 m-2'
            });
            
            const editBtn = createElement('button', {
                className: 'btn btn-sm btn-outline-warning me-1 preset-edit-btn',
                attributes: {
                    'data-id': preset._id,
                    'title': 'Edit preset'
                }
            });
            const editIcon = createElement('i', { className: 'fas fa-edit' });
            editBtn.appendChild(editIcon);
            
            const deleteBtn = createElement('button', {
                className: 'btn btn-sm btn-outline-danger preset-delete-btn',
                attributes: {
                    'data-id': preset._id,
                    'title': 'Delete preset'
                }
            });
            const deleteIcon = createElement('i', { className: 'fas fa-trash' });
            deleteBtn.appendChild(deleteIcon);
            
            actionButtons.appendChild(editBtn);
            actionButtons.appendChild(deleteBtn);
            cardBody.appendChild(actionButtons);
        }
        
        card.appendChild(cardBody);
        col.appendChild(card);
        
        return col;
    }
    
    handlePresetClick(e) {
        const card = e.target.closest('.card-preset');
        if (!card) return;
        
        if (e.target.closest('.preset-edit-btn')) {
            this.handleEditPresetClick(e);
            return;
        }
        
        if (e.target.closest('.preset-delete-btn')) {
            this.handleDeletePresetClick(e);
            return;
        }
        
        // Load preset
        const presetId = card.dataset.id;
        const presetType = card.dataset.type;
        const presetName = card.dataset.name;
        
        if (confirm(`Load preset "${presetName}"? This will replace your current settings.`)) {
            this._loadPreset(presetId, presetType);
        }
    }
    
    async _loadPreset(presetId, type) {
        try {
            const data = await getPreset(presetId, type);
            if (!data) { 
                alert('Error loading preset'); 
                return;
            }
            
            let preset = data.data;
            
            // Update the state with the preset data (matching original app.js structure)
            this.state.modifiedWeaponSettings = preset.WeaponSettings;
            this.state.modifiedArmorSettings = preset.ArmorSettings;
            this.state.modifiedGrenadeSettings = preset.GrenadeSettings;
            this.state.modifiedAmmoByWeaponClass = preset.AmmoSettings;
            this.state.modifiedWeaponList = preset.WeaponList;
            this.state.modifiedDropConfigs = preset.DropConfigs;
            this.state.modsCompatibility = preset.Compatibility;
            this.state.modifiedArmorSpawnSettings = preset.ArmorSpawnSettings;
            this.state.modifiedHelmetSpawnSettings = preset.HelmetsSettings;
            
            // Update config name if element exists
            const configNameEl = document.getElementById('config_name');
            if (configNameEl) {
                configNameEl.value = preset.name;
            }

            // Close modal
            const modalEl = document.getElementById('presetsModal');
            if (modalEl && window.bootstrap) {
                const presetsModal = window.bootstrap.Modal.getInstance(modalEl);
                if (presetsModal) {
                    presetsModal.hide();
                }
            }
            
            // Trigger UI refresh - emit event for app to handle
            window.dispatchEvent(new CustomEvent('presetLoaded', { 
                detail: { presetId, type, preset } 
            }));
            
        } catch (error) {
            console.error('Error loading preset:', error);
            alert('Error loading preset. Please try again.');
        }
    }
    
    handleEditPresetClick(e) {
        e.stopPropagation();
        const presetId = e.target.closest('[data-id]').dataset.id;
        // Implementation for editing preset
        console.log('Edit preset:', presetId);
    }
    
    handleDeletePresetClick(e) {
        e.stopPropagation();
        const presetId = e.target.closest('[data-id]').dataset.id;
        if (confirm('Are you sure you want to delete this preset?')) {
            this._deletePreset(presetId);
        }
    }
    
    async _deletePreset(presetId) {
        try {
            const response = await fetch(`/api/presets/community/${presetId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                // Refresh presets list
                await this._loadPresets();
            }
        } catch (error) {
            console.error('Error deleting preset:', error);
            alert('Error deleting preset. Please try again.');
        }
    }
    
    handleSaveNewPreset() {
        if (window.bootstrap) {
            const saveModal = new window.bootstrap.Modal(document.getElementById('savePresetModal'));
            document.getElementById('savePresetModalLabel').textContent = 'Save New Preset';
            document.getElementById('savePresetForm').reset();
            saveModal.show();
        }
    }
    
    handleUpdatePreset() {
        // Implementation for updating existing preset
        console.log('Update preset functionality');
    }
    
    async handleSavePresetSubmit() {
        const presetData = {
            name: document.getElementById('presetName').value.trim(),
            author: document.getElementById('presetAuthor').value.trim(),
            description: document.getElementById('presetDescription').value.trim(),
            settings: this.state.exportState(),
            created: new Date().toISOString()
        };
        
        if (!presetData.name) {
            alert('Please enter a preset name.');
            return;
        }
        
        try {
            const response = await fetch('/api/presets/community', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(presetData)
            });
            
            if (response.ok) {
                // Close save modal
                if (window.bootstrap) {
                    const saveModal = window.bootstrap.Modal.getInstance(document.getElementById('savePresetModal'));
                    if (saveModal) saveModal.hide();
                }
                
                // Refresh presets list
                await this._loadPresets();
                
                alert('Preset saved successfully!');
            } else {
                throw new Error('Failed to save preset');
            }
        } catch (error) {
            console.error('Error saving preset:', error);
            alert('Error saving preset. Please try again.');
        }
    }
}
