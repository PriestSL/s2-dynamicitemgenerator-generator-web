export function bindConfigName(input: HTMLInputElement): void {
    const validate = () => {
        const valid = /^[a-zA-Z0-9_\-\s]{1,50}$/.test(input.value.trim());
        input.classList.toggle('validation-error', !valid);
        input.classList.toggle('validation-success', valid);
        input.title = valid ? '' : 'Use 1–50 letters, numbers, spaces, hyphens or underscores.';
        input.setAttribute('aria-invalid', String(!valid));
    };
    input.addEventListener('input', validate);
    input.addEventListener('change', validate);
}
