export function element<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = ''): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    node.textContent = text;
    node.className = className;
    return node;
}

export function button(text: string, action: () => void, className = 'btn btn-sm btn-outline-secondary'): HTMLButtonElement {
    const node = element('button', text, className);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
}

let sequence = 0;
export function uniqueId(prefix = 'editor'): string { return `${prefix}-${++sequence}`; }

export function card(title: string, content: HTMLElement): HTMLElement {
    const section = element('section', '', 'card mb-3 editor-card');
    const header = element('div', '', 'card-header');
    const body = element('div', '', 'card-body collapse show');
    body.id = uniqueId('group');
    const toggle = button(title, () => {}, 'btn btn-link text-start text-decoration-none p-0 w-100');
    toggle.setAttribute('data-bs-toggle', 'collapse');
    toggle.setAttribute('data-bs-target', `#${body.id}`);
    toggle.setAttribute('aria-controls', body.id);
    toggle.setAttribute('aria-expanded', 'true');
    header.append(toggle);
    body.append(content);
    section.append(header, body);
    return section;
}
