// Small shared compatibility surface still consumed by PresetsManager.
export function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, options: {
    className?: string;
    textContent?: string;
    attributes?: Record<string, string>;
    children?: readonly HTMLElement[];
} = {}): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.textContent !== undefined) node.textContent = options.textContent;
    for (const [key, value] of Object.entries(options.attributes ?? {})) node.setAttribute(key, value);
    node.append(...options.children ?? []);
    return node;
}
export function escapeHtml(text: string): string {
    if (typeof text !== 'string') return text; // Preserve the deferred JS caller's contract.
    const replacements: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, char => replacements[char] ?? char);
}

/** Only for application-authored static markup (help/warning content). */
export function staticMarkup(html: string): HTMLElement {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container;
}
