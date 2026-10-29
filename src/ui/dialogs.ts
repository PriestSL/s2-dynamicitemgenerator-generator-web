import type { Modal } from 'bootstrap';
import { bootstrapUI } from './bootstrap.ts';
import { button, element, uniqueId } from './dom.ts';

export interface DialogOptions {
    id?: string;
    title: string;
    content: Node;
    closeText?: string;
    confirmText?: string;
    validate?: () => boolean;
    confirm?: () => void | boolean | Promise<void | boolean>;
    onClosed?: () => void;
    initialFocus?: HTMLElement;
}
interface Entry {
    node: HTMLElement;
    modal: Modal;
    previous: Entry | undefined;
    external: HTMLElement | undefined;
    focus: HTMLElement | undefined;
    suspended: boolean;
    closed: boolean;
    pending: boolean;
}
let active: Entry | undefined;

/** Local dialogs suspend their parent and restore it only after hidden/dispose. */
export function showDialog(options: DialogOptions): Modal {
    const { Modal } = bootstrapUI();
    const previous = active;
    const external = previous ? undefined : document.querySelector<HTMLElement>('.modal.show') ?? undefined;
    const focus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    if (previous) { previous.suspended = true; previous.modal.hide(); }

    const node = element('div', '', 'modal');
    node.id = options.id ?? uniqueId('dialog');
    node.tabIndex = -1;
    const titleId = uniqueId('dialog-title');
    node.setAttribute('aria-labelledby', titleId);
    const dialog = element('div', '', 'modal-dialog modal-dialog-scrollable');
    const content = element('div', '', 'modal-content');
    const header = element('div', '', 'modal-header');
    const title = element('h2', options.title, 'modal-title fs-5');
    title.id = titleId;
    const close = button('', () => modal.hide(), 'btn-close');
    close.setAttribute('aria-label', 'Close');
    header.append(title, close);
    const body = element('div', '', 'modal-body');
    body.append(options.content);
    const error = element('div', '', 'text-danger');
    error.setAttribute('role', 'alert');
    const footer = element('div', '', 'modal-footer');
    const cancel = button(options.closeText ?? 'Close', () => modal.hide());
    footer.append(cancel);
    content.append(header, body, error, footer);
    dialog.append(content);
    node.append(dialog);
    document.body.append(node);
    const modal = new Modal(node, { backdrop: true, keyboard: true, focus: true });
    node.addEventListener('shown.bs.modal', () => options.initialFocus?.focus());
    const entry: Entry = { node, modal, previous, external, focus, suspended: false, closed: false, pending: false };
    active = entry;
    const loaded = () => { entry.external = undefined; };
    window.addEventListener('presetLoaded', loaded);

    const finish = () => {
        if (entry.suspended || entry.closed) return;
        entry.closed = true;
        window.removeEventListener('presetLoaded', loaded);
        modal.dispose();
        node.remove();
        if (active === entry) {
            let parent = entry.previous;
            let restoreExternal = entry.external;
            let restoreFocus = entry.focus;
            while (parent?.closed) {
                restoreExternal ??= parent.external;
                if (!restoreFocus?.isConnected) restoreFocus = parent.focus;
                parent = parent.previous;
            }
            active = parent;
            if (parent) {
                parent.suspended = false;
                parent.modal.show();
            } else if (restoreExternal?.isConnected) {
                const externalFocus = restoreFocus;
                restoreExternal.addEventListener('shown.bs.modal', () => {
                    if (externalFocus?.isConnected) externalFocus.focus();
                }, { once: true });
                Modal.getInstance(restoreExternal)?.show();
            }
            if (restoreFocus?.isConnected && !restoreFocus.closest('[aria-hidden="true"]')) restoreFocus.focus();
        }
        options.onClosed?.();
    };
    node.addEventListener('hide.bs.modal', event => {
        if (entry.pending && !entry.suspended) event.preventDefault();
    });
    node.addEventListener('hidden.bs.modal', finish);
    if (options.confirm) {
        const confirm = options.confirm;
        const submit = button(options.confirmText ?? 'Confirm', () => { void run(); }, 'btn btn-primary');
        const run = async () => {
            if (entry.pending) return;
            error.textContent = '';
            try {
                if (options.validate && !options.validate()) return;
                entry.pending = true;
                submit.disabled = cancel.disabled = close.disabled = true;
                node.setAttribute('aria-busy', 'true');
                const result = await confirm();
                entry.pending = false;
                if (result !== false) {
                    // A legacy callback can open a child before this parent completes.
                    if (entry.suspended) { entry.suspended = false; finish(); }
                    else modal.hide();
                }
            } catch (e) {
                error.textContent = e instanceof Error ? e.message : String(e);
            } finally {
                entry.pending = false;
                submit.disabled = cancel.disabled = close.disabled = false;
                node.removeAttribute('aria-busy');
            }
        };
        footer.append(submit);
        body.querySelector('form')?.addEventListener('submit', event => { event.preventDefault(); void run(); });
    }
    if (external) {
        // Legacy preset dialogs animate: let their own hidden cleanup complete first.
        external.addEventListener('hidden.bs.modal', () => { if (!entry.closed) modal.show(); }, { once: true });
        Modal.getInstance(external)?.hide();
    } else modal.show();
    return modal;
}
