import { AppState } from '../js/state.ts';
import { ModalManager } from '../js/ui/modalManager.ts';
import { ControllerAdapter } from '../compatibility/controller.ts';
import type { PresetsUI } from '../compatibility/integrations.ts';
import { generateConfig } from '../js/fileStreamGenerator.ts';
import { chooseJSON, downloadJSON } from '../files/json.ts';
import { categories } from './categories.ts';
import { comparisonBanner, sectionReset } from './comparison.ts';
import { EditorUI } from './editor.ts';
import { Notifications } from './notifications.ts';
import { bindDownloads } from './downloads.ts';
import { bindConfigName } from './configName.ts';

/** Composition, navigation and toolbar. Field handlers belong to their components. */
export class Application {
    readonly state = new AppState();
    readonly chancesCtrl = new ControllerAdapter(this.state);
    readonly modalManager = new ModalManager();
    readonly notifications = new Notifications();
    readonly editor = new EditorUI(this.state, message => this.notifications.show('reset', message, 'error'));
    readonly presetsManager: PresetsUI;
    private readonly content: HTMLElement;
    constructor(presets: (state: AppState, controller: ControllerAdapter) => PresetsUI) {
        this.presetsManager = presets(this.state, this.chancesCtrl);
        const content = document.getElementById('content');
        if (!content) throw new Error('Editor content container is missing');
        this.content = content;
    }
    initialize(): void {
        this.content.before(comparisonBanner(this.editor, () => this.renderCurrentView()));
        for (const node of document.querySelectorAll<HTMLElement>('.category_item, .faction_item')) {
            node.addEventListener('click', () => {
                if (node.classList.contains('category_item')) this.chancesCtrl.currentCategory = node.id;
                else this.chancesCtrl.currentFaction = node.id;
                this.renderCurrentView();
            });
        }
        window.addEventListener('presetLoaded', () => this.renderCurrentView());
        this.bindToolbar();
        this.renderCurrentView();
        this.modalManager.showDeveloperWarning();
    }
    renderCurrentView(): void {
        this.content.replaceChildren(sectionReset(this.editor), categories[this.state.view.category](this.editor));
        for (const node of document.querySelectorAll('.category_item')) node.classList.toggle('active', node.id === this.state.view.category);
        for (const node of document.querySelectorAll('.faction_item')) node.classList.toggle('active', node.id === this.state.view.faction);
        this.editor.refresh();
    }
    private bindToolbar(): void {
        bindDownloads(this.state, generateConfig, this.notifications);
        const name = document.getElementById('config_name');
        if (!(name instanceof HTMLInputElement)) throw new Error('Config name input is missing');
        bindConfigName(name);
        const bind = (id: string, run: () => void) => document.getElementById(id)?.addEventListener('click', run);
        bind('btn_help', () => this.modalManager.showHelpModal());
        bind('btn_info', () => this.modalManager.showInfoModal());
        bind('btn_todo', () => this.modalManager.showToDoModal());
        bind('btn_file_settings', () => this.modalManager.showFileSettingsModal(this.state, this.editor));
        bind('btn_presets', () => {
            void this.presetsManager.openPresetsWindow().catch(error => this.notifications.show('presets', error instanceof Error ? error.message : String(error), 'error'));
        });
        bind('btn_export', () => {
            this.notifications.show('json-export', 'Preparing JSON…', 'pending');
            try {
                downloadJSON(this.state, name.value || 'config');
                this.notifications.show('json-export', 'JSON download started.', 'success');
            } catch (error) {
                this.notifications.show('json-export', error instanceof Error ? error.message : String(error), 'error');
            }
        });
        const importButton = document.getElementById('btn_import');
        if (importButton instanceof HTMLButtonElement) {
            importButton.addEventListener('click', () => {
                if (importButton.disabled) return;
                chooseJSON(this.state, () => this.renderCurrentView(), (id, text) => {
                    this.notifications.show('json-import', text, id.endsWith('Error') ? 'error' : 'success');
                }, pending => { importButton.disabled = pending; importButton.setAttribute('aria-busy', String(pending)); });
            });
        }
    }
    getState(): AppState { return this.state; }
    getChancesController(): ControllerAdapter { return this.chancesCtrl; }
}
