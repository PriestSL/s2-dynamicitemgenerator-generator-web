/**
 * Main Application Controller (Refactored)
 * Application initialization and coordination
 */

import { AppState } from './state.js';
import { CategoryRenderers } from './renderers/categoryRenderers.js';
import { ModalManager } from './ui/modalManager.js';
import { PresetsManager } from './presets/presetsManager.js';
import { EventManager } from './events/eventManager.js';
import { UIHelpers } from './ui/uiHelpers.js';
import { chancesController } from './chances.js';
import { generateConfig } from './fileStreamGenerator.js';
import '../css/custom.scss';

class Application {
    constructor() {
        this.state = new AppState();
        this.modalManager = new ModalManager();
        this.presetsManager = new PresetsManager(this.state);
        
        // Initialize chances controller with state
        this.chancesCtrl = new chancesController();
        this.chancesCtrl.fillSettings(this.state.getChancesSettings());
        this.chancesCtrl.typeToTable = this.state.typeToTable;
        this.chancesCtrl.currentFaction = 'Generic_settings'; // Set default faction
        
        this.categoryRenderers = new CategoryRenderers(this.state, this.chancesCtrl);
        
        this.eventManager = new EventManager(
            this.categoryRenderers,
            this.modalManager,
            this.presetsManager,
            this.state,
            { generateConfig } // File generator functions
        );
        
        // Set up global Bootstrap reference for modules
        this.setupGlobalReferences();

        this.modalManager.showDeveloperWarning();
    }
    
    async setupGlobalReferences() {
        // Wait for Bootstrap to be available
        window.bootstrap = await UIHelpers.setupBootstrap();
    }
    
    async initialize() {
        try {
            // Wait for DOM to be fully loaded first
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // Setup UI components
            UIHelpers.initializeSpinner();
            
            // Wait a bit more to ensure all elements are rendered
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Initialize event listeners
            this.eventManager.initializeEventListeners();
            
            // Add preset loaded event listener
            this.setupPresetEventListener();
            
            // Set initial UI state
            this.setInitialUIState();
            
            // Subscribe to existing category/faction events (if they exist)
            this.subscribeToExistingEvents();
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
        }
    }
    
    subscribeToExistingEvents() {
        // This maintains backward compatibility with existing HTML structure
        // The event manager will handle these properly
    }
    
    setupPresetEventListener() {
        // Listen for preset loaded events from PresetsManager
        window.addEventListener('presetLoaded', () => {
            // Clear current content
            const contentEl = document.getElementById('content');
            if (contentEl) {
                contentEl.innerHTML = '';
            }
            
            // Re-render current category to show updated data
            const currentCategory = this.chancesCtrl.currentCategory;
            
            // Call the appropriate renderer based on current category
            if (this.categoryRenderers && currentCategory) {
                const renderMethodName = `render${currentCategory}`;
                if (typeof this.categoryRenderers[renderMethodName] === 'function') {
                    setTimeout(() => {
                        this.categoryRenderers[renderMethodName]();
                    }, 100);
                } else {
                    console.warn('No renderer found for category:', currentCategory);
                }
            }
        });
    }
    
    setInitialUIState() {
        // Set default active faction (Generic_settings)
        const genericFaction = document.getElementById('Generic_settings');
        if (genericFaction) {
            genericFaction.classList.add('active');
        }
        
        // Set default active category (Primary)
        const primaryCategory = document.getElementById('Primary');
        if (primaryCategory) {
            primaryCategory.classList.add('active');
            // Trigger initial render
            setTimeout(() => {
                if (this.categoryRenderers && this.categoryRenderers.renderPrimary) {
                    this.categoryRenderers.renderPrimary();
                }
            }, 200);
        }
    }
    
    // Public methods for external access (if needed)
    getState() {
        return this.state;
    }
    
    getChancesController() {
        return this.chancesCtrl;
    }
}

// Initialize application when DOM is loaded
let app;

const initializeApp = async () => {
    app = new Application();
    await app.initialize();
    
    // Make app globally available for debugging/external access
    if (typeof window !== 'undefined') {
        window.S2App = app;
    }
};

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export for testing or external use
export { Application, app };
