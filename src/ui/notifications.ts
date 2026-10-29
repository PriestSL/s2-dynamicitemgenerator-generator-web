import { bootstrapUI } from './bootstrap.ts';
import { button, element } from './dom.ts';

export type NoticeKind = 'pending' | 'success' | 'error';

/** One replaceable notification per operation; errors stay until explicitly closed. */
export class Notifications {
    private readonly region: HTMLElement;
    private readonly notices = new Map<string, () => void>();
    constructor() {
        this.region = element('div', '', 'toast-container position-fixed bottom-0 end-0 p-3 editor-notifications');
        this.region.setAttribute('aria-label', 'Operation notifications');
        this.region.setAttribute('aria-live', 'polite');
        this.region.setAttribute('aria-relevant', 'additions text');
        document.body.append(this.region);
    }
    show(id: string, message: string, kind: NoticeKind): void {
        this.notices.get(id)?.();
        const node = element('div', '', `toast ${kind === 'error' ? 'border-danger' : ''}`);
        node.setAttribute('role', kind === 'error' ? 'alert' : 'status');
        node.setAttribute('aria-live', kind === 'error' ? 'assertive' : 'polite');
        node.setAttribute('aria-atomic', 'true');
        const body = element('div', '', 'd-flex align-items-start');
        const text = element('div', message, 'toast-body');
        const toast = new (bootstrapUI().Toast)(node, { autohide: kind === 'success', delay: 6000, animation: false });
        const remove = () => {
            const restoreFocus = node.contains(document.activeElement);
            toast.dispose();
            node.remove();
            if (this.notices.get(id) === remove) this.notices.delete(id);
            if (restoreFocus) document.getElementById('content')?.focus();
        };
        const close = button('', () => toast.hide(), 'btn-close me-2 mt-2 flex-shrink-0');
        close.setAttribute('aria-label', 'Close notification');
        body.append(text, close);
        node.append(body);
        node.addEventListener('hidden.bs.toast', remove, { once: true });
        this.notices.set(id, remove);
        this.region.append(node);
        toast.show();
    }
}
