/**
 * Input validation & sanitization utilities (lean version)
 * Design goals:
 *  - Small, predictable, pure validation helpers
 *  - Uniform result shape (backward compatible: retains isValid/sanitizedValue)
 *  - No hidden DOM side‑effects inside validators
 */

// Precompiled patterns
const CONFIG_NAME_RX = /^[a-zA-Z0-9_\-\s]{1,50}$/;
const PIN_RX = /^[0-9]{4,8}$/;

// Result factory (keeps legacy keys + new concise keys)
function ok(value) {
    return { ok: true, isValid: true, value, sanitizedValue: value, error: null };
}
function fail(error) {
    return { ok: false, isValid: false, value: null, sanitizedValue: null, error };
}

/**
 * Generic number validator
 * @param {*} raw
 * @param {number} min
 * @param {number} max
 * @param {boolean} integer - if true enforce integer form
 */
export function validateNumber(raw, min = -Infinity, max = Infinity, integer = false) {
    if (raw === '' || raw == null) return fail('Value required');
    const num = Number(raw);
    if (Number.isNaN(num)) return fail('Not a number');
    if (integer && !Number.isInteger(num)) return fail('Must be integer');
    if (num < min) return fail(`Min ${min}`);
    if (num > max) return fail(`Max ${max}`);
    return ok(num);
}

export function validatePercentage(raw) {
    return validateNumber(raw, 0, 100);
}

export function validateProbability(raw) {
    return validateNumber(raw, 0, 1);
}

/**
 * String validator
 * @param {*} raw
 * @param {object} opt
 */
export function validateString(raw, opt = {}) {
    const { minLength = 0, maxLength = Infinity, pattern, allowEmpty = false, label = 'Value' } = opt;
    const str = (raw == null ? '' : String(raw)).trim();
    if (!allowEmpty && str.length === 0) return fail(`${label} required`);
    if (str.length < minLength) return fail(`Min length ${minLength}`);
    if (str.length > maxLength) return fail(`Max length ${maxLength}`);
    if (pattern && !pattern.test(str)) return fail('Invalid format');
    return ok(str);
}

export function validateConfigName(raw) {
    return validateString(raw, { pattern: CONFIG_NAME_RX, minLength: 1, maxLength: 50, label: 'Config name' });
}

export function validatePin(raw) {
    // Single pattern covers length + digits
    return PIN_RX.test(String(raw).trim()) ? ok(String(raw).trim()) : fail('PIN must be 4-8 digits');
}

export function validateWeaponChances(raw) {
    if (!Array.isArray(raw)) return fail('Chances must be array');
    if (raw.length !== 4) return fail('Exactly 4 values required');
    const sanitized = new Array(4);
    for (let i = 0; i < 4; i++) {
        const r = validatePercentage(raw[i]);
        if (!r.isValid) return fail(`Index ${i + 1}: ${r.error}`);
        sanitized[i] = r.sanitizedValue;
    }
    return ok(sanitized);
}

export function validateArmorDurability(raw) {
    if (!raw || typeof raw !== 'object') return fail('Object required');
    const minR = validateProbability(raw.min);
    if (!minR.isValid) return fail(`Min: ${minR.error}`);
    const maxR = validateProbability(raw.max);
    if (!maxR.isValid) return fail(`Max: ${maxR.error}`);
    if (minR.sanitizedValue > maxR.sanitizedValue) return fail('Min > Max');
    return ok({ min: minR.sanitizedValue, max: maxR.sanitizedValue });
}

/**
 * Very small HTML sanitizer (defensive; prefer avoiding HTML input entirely)
 * Strips <script> & inline handlers & javascript: URLs.
 */
export function sanitizeHtml(html) {
    if (html == null || html === '') return '';
    if (typeof html !== 'string') html = String(html);
    if (!/[<>&]/.test(html)) return html; // fast path: no tags
    const temp = document.createElement('div');
    temp.innerHTML = html;
    temp.querySelectorAll('script').forEach(n => n.remove());
    temp.querySelectorAll('*').forEach(el => {
        // remove on* handlers
        [...el.attributes].forEach(attr => {
            const name = attr.name.toLowerCase();
            if (name.startsWith('on')) el.removeAttribute(attr.name);
            else if ((name === 'href' || name === 'src' || name === 'action') && /^javascript:/i.test(attr.value)) {
                el.removeAttribute(attr.name);
            }
        });
    });
    return temp.innerHTML;
}

/**
 * Validate a high‑level game config object.
 * Currently only weapon chances – extend as needed.
 */
export function validateGameConfig(config) {
    const errors = [];
    if (!config || typeof config !== 'object') {
        return { isValid: false, ok: false, errors: ['Config must be object'], sanitizedConfig: null };
    }
    // Shallow clone for sanitized output (extend later for deep sanitation)
    const sanitizedConfig = { ...config };
    if (config.WeaponSettings && typeof config.WeaponSettings === 'object') {
        Object.entries(config.WeaponSettings).forEach(([name, w]) => {
            if (w && Array.isArray(w.chances)) {
                const r = validateWeaponChances(w.chances);
                if (!r.isValid) errors.push(`Weapon ${name}: ${r.error}`);
                else {
                    // assign sanitized chances
                    if (!sanitizedConfig.WeaponSettings) sanitizedConfig.WeaponSettings = {};
                    sanitizedConfig.WeaponSettings[name] = { ...w, chances: r.sanitizedValue };
                }
            }
        });
    }
    return { isValid: errors.length === 0, ok: errors.length === 0, errors, sanitizedConfig: errors.length === 0 ? sanitizedConfig : null };
}

/**
 * UI helpers kept separate from pure validators
 */
export function applyValidationUI(input, validation, showSuccess = false) {
    if (!input) return; // defensive
    input.classList.remove('validation-error', 'validation-success');
    input.removeAttribute('title');
    if (validation.isValid) {
        if (showSuccess) input.classList.add('validation-success');
    } else {
        input.classList.add('validation-error');
        if (validation.error) input.title = validation.error;
    }
}

export function addInputValidation(input, validationFunction, onValidChange = null, showSuccess = false) {
    if (!input || typeof validationFunction !== 'function') return;
    const handler = (val) => {
        const v = validationFunction(val);
        applyValidationUI(input, v, showSuccess);
        if (v.isValid && onValidChange) onValidChange(v.sanitizedValue);
    };
    input.addEventListener('input', (e) => handler(e.target.value));
    input.addEventListener('change', (e) => handler(e.target.value));
}
