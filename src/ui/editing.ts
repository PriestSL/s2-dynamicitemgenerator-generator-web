export function applyField(input: HTMLInputElement | HTMLSelectElement, action: () => void): boolean {
    try {
        action();
        input.classList.remove('validation-error');
        input.classList.add('validation-success');
        input.removeAttribute('aria-invalid');
        input.title = '';
        input.setCustomValidity('');
        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        input.classList.remove('validation-success');
        input.classList.add('validation-error');
        input.setAttribute('aria-invalid', 'true');
        input.title = message;
        input.setCustomValidity(message);
        return false;
    }
}
