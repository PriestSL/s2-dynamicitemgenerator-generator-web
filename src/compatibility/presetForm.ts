/**
 * Preserves the deferred PresetsManager HTML-form input contract.
 * This is the existing legacy filter, not a general-purpose HTML sanitizer.
 * Its dynamic interpolation and full UI migration remain stage 7 / F19.
 */
export function legacyPresetForm(html: string): HTMLElement {
    const node = document.createElement('div');
    node.innerHTML = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '');
    return node;
}
