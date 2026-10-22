import type { AppState } from '../state.ts';
import type { Modal } from 'bootstrap';
import { createElement, staticMarkup } from '../utils/dom.ts';
import { showDialog } from '../../ui/dialogs.ts';
import { dropSettings } from '../../ui/dropSettings.ts';
import { EditorUI } from '../../ui/editor.ts';

interface MessageOptions { closeText?: string; title?: string }
interface ConfirmOptions extends MessageOptions {
    cancelText?: string;
    confirmText?: string;
    confirmValidation?: () => boolean;
    onConfirm?: () => void | boolean | Promise<void | boolean>;
}

/** Shared lifecycle, with legacy method names retained for PresetsManager. */
export class ModalManager {
    private readonly active = new Map<string, Modal>();
    createMessageBox(id: string, content: Node | string, options: MessageOptions = {}): Modal {
        return this.open(id, content, options);
    }
    createConfirmationBox(id: string, content: Node | string, options: ConfirmOptions = {}): Modal {
        return this.open(id, content, options, true);
    }
    private open(id: string, content: Node | string, options: ConfirmOptions, confirmation = false): Modal {
        const existing = this.active.get(id);
        if (existing) return existing;
        const modal = showDialog({
            id: `${confirmation ? 'confirmBox' : 'messageBox'}_${id}`,
            title: options.title ?? (confirmation ? 'Confirm action' : 'Information'),
            content: typeof content === 'string' ? createElement('p', { textContent: content }) : content,
            closeText: options.cancelText ?? options.closeText ?? (confirmation ? 'Cancel' : 'Close'),
            ...(confirmation ? { confirm: options.onConfirm ?? (() => {}), confirmText: options.confirmText ?? 'Confirm' } : {}),
            ...(options.confirmValidation ? { validate: options.confirmValidation } : {}),
            onClosed: () => this.active.delete(id),
        });
        this.active.set(id, modal);
        return modal;
    }
    removeMessageBox(id: string): void { this.active.get(id)?.hide(); }
    showHelpModal(): void { this.createMessageBox('help', this._createHelpContent(), { title: 'Installation guide' }); }
    showInfoModal(): void { this.createMessageBox('info', this._createInfoContent(), { title: 'About' }); }
    showToDoModal(): void { this.createMessageBox('todo', this._createToDoContent(), { title: 'Planned features' }); }
    showDeveloperWarning(): void { this.createMessageBox('dev-warning', this._createDeveloperWarningContent(), { title: 'Development version', closeText: 'I Understand' }); }
    showFileSettingsModal(state: AppState, editor: EditorUI): Modal {
        if (editor.state !== state) throw new Error('File settings must use the active editor');
        return this.createMessageBox('settings', dropSettings(editor), { title: 'Armor drop settings' });
    }
    _createHelpContent() {
        const presetsIconUrl = new URL('../../img/list.png', import.meta.url).href;
        const fileIconUrl = new URL('../../img/file.png', import.meta.url).href;
        const zipperIconUrl = new URL('../../img/zipper.png', import.meta.url).href;

        return staticMarkup(`
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
                                            <div class="fw-bold">Choose preset</div>
                                            If you don't want use standart preset, you need to choose a different one. To choose preset click
                                            <img src="${presetsIconUrl}" style="width:20px" class="mx-1" alt="presets icon"> icon and choose what you want
                                        </div>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-start">
                                        <div class="ms-2 me-auto">
                                            <div class="fw-bold">Configure Settings</div>
                                            After choosing preset and configuring all settings (if needed) press the download
                                            <img src="${fileIconUrl}" style="width:20px" class="mx-1" alt="download pak"> icon to download .pak file or
                                            <img src="${zipperIconUrl}" style="width:20px" class="mx-1" alt="download zip"> icon to download unpacked config file
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
                                            <img src="${presetsIconUrl}" style="width:20px" class="mx-1" alt="save"> icon and save preset to be used by others.
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


    _createDeveloperWarningContent() {
        return staticMarkup(`
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
                    <span style="color: red; font-size: 24px">CURRENTY UNDER TESTS OF NEW VERSION, GENERATED FILES CAN BE BROKEN!</span>
                    <strong>This is a development version of the website.</strong>
                    </p>
                    <p class="mb-2">
                    You may experience bugs, incomplete features, or unexpected behavior.
                    This version is intended for testing and development purposes only.
                    </p>
                    <p class="mb-0">
                    <i class="fas fa-info-circle me-1"></i>
                    For the stable version, please visit the
                    <a href="https://s2-loadout-creator.cc/" target="_blank">main release</a>.
                    </p>
                </div>
                </div>
            </div>
            </div>
        `);
    }


    _createToDoContent() {
        const TODOList = [
            "NVG editing",
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
