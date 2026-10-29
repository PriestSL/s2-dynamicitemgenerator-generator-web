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
import { bindDisclosure, editorIcon } from './dom.ts';

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
        for (const placeholder of document.querySelectorAll<HTMLElement>('[data-editor-icon]')) {
            placeholder.replaceWith(editorIcon(placeholder.dataset.editorIcon ?? 'help'));
        }
        for (const menu of document.querySelectorAll<HTMLDetailsElement>('.editor-help-menu')) {
            bindDisclosure(menu);
            menu.addEventListener('click', event => {
                if (event.target instanceof Element && event.target.closest('.editor-menu-panel button, .editor-menu-panel a')) menu.open = false;
            });
        }
        this.content.before(comparisonBanner(this.editor, () => this.renderCurrentView()));
        for (const node of document.querySelectorAll<HTMLElement>('.category_item, .faction_item')) {
            node.setAttribute('aria-label', node.title || node.id);
            if (['Secondary', 'Artifacts', 'Consumables'].includes(node.id)) node.title = `${node.id} · Not implemented`;
            node.addEventListener('click', () => {
                if (node.classList.contains('category_item')) this.chancesCtrl.currentCategory = node.id;
                else this.chancesCtrl.currentFaction = node.id;
                this.renderCurrentView();
            });
        }
        for (const bar of document.querySelectorAll<HTMLElement>('#categories_bar, #factions_bar')) {
            bar.addEventListener('keydown', event => {
                const nodes = [...bar.querySelectorAll<HTMLElement>('button')];
                const index = nodes.indexOf(document.activeElement as HTMLElement);
                if (index < 0) return;
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? nodes.length - 1
                    : ['ArrowRight', 'ArrowDown'].includes(event.key) ? (index + 1) % nodes.length
                    : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? (index - 1 + nodes.length) % nodes.length : undefined;
                if (next !== undefined) { event.preventDefault(); nodes[next]?.focus(); }
            });
        }
        window.addEventListener('presetLoaded', () => this.renderCurrentView());
        this.bindToolbar();
        this.renderCurrentView();
        this.modalManager.showDeveloperWarning();
    }
    renderCurrentView(): void {
        this.content.replaceChildren(sectionReset(this.editor), categories[this.state.view.category](this.editor));
        for (const node of document.querySelectorAll('.category_item, .faction_item')) {
            const selected = node.id === this.state.view.category || node.id === this.state.view.faction;
            node.classList.toggle('active', selected);
            node.setAttribute('aria-pressed', String(selected));
        }
        this.editor.refresh();
    }
    private bindToolbar(): void {
        bindDownloads(this.state, generateConfig, this.notifications);
        const name = document.getElementById('config_name');
        if (!(name instanceof HTMLInputElement)) throw new Error('Config name input is missing');
        bindConfigName(name);
        const bind = (id: string, run: () => void) => document.getElementById(id)?.addEventListener('click', run);
        const help = (run: () => void) => {
            document.querySelector<HTMLElement>('.editor-help-menu > summary')?.focus();
            run();
        };
        bind('btn_help', () => help(() => this.modalManager.showHelpModal()));
        bind('btn_info', () => help(() => this.modalManager.showInfoModal()));
        bind('btn_todo', () => help(() => this.modalManager.showToDoModal()));
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
