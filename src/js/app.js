import { setPackageTransport } from '../files/packageTransport.ts';
import { downloadPackage } from './restCalls.js';
/**
 * Main Application Controller (Refactored)
 * Application initialization and coordination
 */

import { AppState } from './state.ts';
import { CategoryRenderers } from './renderers/categoryRenderers.js';
import { ModalManager } from './ui/modalManager.js';
import { PresetsManager } from './presets/presetsManager.js';
import { EventManager } from './events/eventManager.js';
import { UIHelpers } from './ui/uiHelpers.js';
import { chancesController } from './chances.js';
import { generateConfig } from './fileStreamGenerator.ts';
import '../css/custom.scss';

setPackageTransport(downloadPackage);

class Application {
    constructor() {
        this.state = new AppState();
        this.modalManager = new ModalManager();
        
        // Initialize chances controller with state
        this.chancesCtrl = new chancesController(this.state);
        this.presetsManager = new PresetsManager(this.state, this.chancesCtrl);
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
        window.addEventListener('presetLoaded', () => this.eventManager.renderCurrentView());
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
                    this.eventManager.renderCurrentView();
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
