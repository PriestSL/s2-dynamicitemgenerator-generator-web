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

const iconPaths: Readonly<Record<string, string>> = {
    reset: 'M3 10V4m0 6h6M3 10a9 9 0 1 1 1 8',
    delete: 'M6 6l12 12M6 18L18 6',
    settings: 'M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4',
    list: 'M9 5h11M9 12h11M9 19h11M4 5h.01M4 12h.01M4 19h.01',
    zip: 'M4 4h16v16H4zM10 4v3h4v3h-4v3h4v4h-4v-4',
    package: 'M3 7l9-5 9 5v10l-9 5-9-5zM3 7l9 5 9-5M12 12v10M7 4.8l10 5.5',
    export: 'M12 15V3m-4 4 4-4 4 4M4 14v7h16v-7',
    import: 'M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4',
    help: 'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    info: 'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    roadmap: 'M9 5h11M9 12h11M9 19h11M2 5l2 2 3-4M2 12l2 2 3-4M3 19h2',
    code: 'M8 5l-6 7 6 7M16 5l6 7-6 7M14 3l-4 18',
};

export function editorIcon(name: string): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('editor-symbol');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', iconPaths[name] ?? iconPaths.reset!);
    svg.append(path);
    return svg;
}

/** The decorative icon is hidden from assistive technology. */
export function iconButton(text: string, action: () => void, icon = 'reset'): HTMLButtonElement {
    const node = button('', action, `btn editor-icon editor-icon-${icon}`);
    node.append(editorIcon(icon), element('span', text, 'visually-hidden'));
    node.title = text;
    node.setAttribute('aria-label', text);
    return node;
}

export function bindDisclosure(menu: HTMLDetailsElement): void {
    const trigger = menu.querySelector('summary');
    menu.addEventListener('keydown', event => {
        if (event.key === 'Escape' && menu.open) {
            event.preventDefault();
            menu.open = false;
            trigger?.focus();
        }
    });
    menu.addEventListener('focusout', event => {
        if (event.relatedTarget instanceof Node && !menu.contains(event.relatedTarget)) menu.open = false;
    });
}

let sequence = 0;
export function uniqueId(prefix = 'editor'): string { return `${prefix}-${++sequence}`; }

export function card(title: string, content: HTMLElement): HTMLElement {
    const section = element('section', '', 'card mb-3 editor-card');
    const header = element('div', '', 'card-header');
    const body = element('div', '', 'card-body collapse show');
    body.id = uniqueId('group');
    const toggle = button(title, () => {}, 'btn editor-group-toggle');
    toggle.setAttribute('data-bs-toggle', 'collapse');
    toggle.setAttribute('data-bs-target', `#${body.id}`);
    toggle.setAttribute('aria-controls', body.id);
    toggle.setAttribute('aria-expanded', 'true');
    header.append(toggle);
    const actions = content.querySelector('.editor-list-actions');
    if (actions) header.append(actions);
    body.append(content);
    section.append(header, body);
    return section;
}
