/**
 * Input validation and sanitization utilities
 * Provides safe validation for user inputs to prevent security vulnerabilities
 */

/**
 * Validates if a value is a number within specified range
 * @param {any} value - The value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {Object} Validation result with isValid and sanitizedValue
 */
export function validateNumber(value, min = -Infinity, max = Infinity) {
    const result = {
        isValid: false,
        sanitizedValue: null,
        error: null
    };
    
    // Convert to number
    const num = Number(value);
    
    if (isNaN(num)) {
        result.error = 'Value must be a valid number';
        return result;
    }
    
    if (num < min) {
        result.error = `Value must be at least ${min}`;
        return result;
    }
    
    if (num > max) {
        result.error = `Value must be at most ${max}`;
        return result;
    }
    
    result.isValid = true;
    result.sanitizedValue = num;
    return result;
}

/**
 * Validates if a value is a percentage (0-100)
 * @param {any} value - The value to validate
 * @returns {Object} Validation result
 */
export function validatePercentage(value) {
    return validateNumber(value, 0, 100);
}

/**
 * Validates if a value is a probability (0-1)
 * @param {any} value - The value to validate
 * @returns {Object} Validation result
 */
export function validateProbability(value) {
    return validateNumber(value, 0, 1);
}

/**
 * Validates and sanitizes a string input
 * @param {any} value - The value to validate
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum string length
 * @param {number} options.maxLength - Maximum string length
 * @param {RegExp} options.pattern - Pattern to match
 * @param {boolean} options.allowEmpty - Whether empty strings are allowed
 * @returns {Object} Validation result
 */
export function validateString(value, options = {}) {
    const result = {
        isValid: false,
        sanitizedValue: null,
        error: null
    };
    
    // Convert to string and trim
    const str = String(value).trim();
    
    if (!options.allowEmpty && str.length === 0) {
        result.error = 'Value cannot be empty';
        return result;
    }
    
    if (options.minLength && str.length < options.minLength) {
        result.error = `Value must be at least ${options.minLength} characters long`;
        return result;
    }
    
    if (options.maxLength && str.length > options.maxLength) {
        result.error = `Value must be at most ${options.maxLength} characters long`;
        return result;
    }
    
    if (options.pattern && !options.pattern.test(str)) {
        result.error = 'Value format is invalid';
        return result;
    }
    
    result.isValid = true;
    result.sanitizedValue = str;
    return result;
}

/**
 * Validates a configuration name
 * @param {any} value - The value to validate
 * @returns {Object} Validation result
 */
export function validateConfigName(value) {
    return validateString(value, {
        minLength: 1,
        maxLength: 50,
        pattern: /^[a-zA-Z0-9_\-\s]+$/,
        allowEmpty: false
    });
}

/**
 * Validates a PIN code
 * @param {any} value - The value to validate
 * @returns {Object} Validation result
 */
export function validatePin(value) {
    return validateString(value, {
        minLength: 4,
        maxLength: 8,
        pattern: /^[0-9]+$/,
        allowEmpty: false
    });
}

/**
 * Validates weapon chances array (should be 4 numbers between 0-100)
 * @param {any} value - The value to validate
 * @returns {Object} Validation result
 */
export function validateWeaponChances(value) {
    const result = {
        isValid: false,
        sanitizedValue: null,
        error: null
    };
    
    if (!Array.isArray(value)) {
        result.error = 'Weapon chances must be an array';
        return result;
    }
    
    if (value.length !== 4) {
        result.error = 'Weapon chances must contain exactly 4 values';
        return result;
    }
    
    const sanitizedChances = [];
    for (let i = 0; i < value.length; i++) {
        const validation = validatePercentage(value[i]);
        if (!validation.isValid) {
            result.error = `Chance ${i + 1}: ${validation.error}`;
            return result;
        }
        sanitizedChances.push(validation.sanitizedValue);
    }
    
    result.isValid = true;
    result.sanitizedValue = sanitizedChances;
    return result;
}

/**
 * Validates armor durability settings
 * @param {any} value - The value to validate
 * @returns {Object} Validation result
 */
export function validateArmorDurability(value) {
    const result = {
        isValid: false,
        sanitizedValue: null,
        error: null
    };
    
    if (!value || typeof value !== 'object') {
        result.error = 'Armor durability must be an object';
        return result;
    }
    
    const minValidation = validateProbability(value.min);
    if (!minValidation.isValid) {
        result.error = `Minimum durability: ${minValidation.error}`;
        return result;
    }
    
    const maxValidation = validateProbability(value.max);
    if (!maxValidation.isValid) {
        result.error = `Maximum durability: ${maxValidation.error}`;
        return result;
    }
    
    if (minValidation.sanitizedValue > maxValidation.sanitizedValue) {
        result.error = 'Minimum durability cannot be greater than maximum durability';
        return result;
    }
    
    result.isValid = true;
    result.sanitizedValue = {
        min: minValidation.sanitizedValue,
        max: maxValidation.sanitizedValue
    };
    return result;
}

/**
 * Sanitizes HTML content by removing dangerous elements and attributes
 * This is a basic sanitizer - for production use, consider using DOMPurify
 * @param {string} html - The HTML to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html) {
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove script tags and on* attributes
    const scripts = temp.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // Remove dangerous attributes
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(element => {
        // Remove event handler attributes
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('on')) {
                element.removeAttribute(attr.name);
            }
        });
        
        // Remove javascript: URLs
        ['href', 'src', 'action'].forEach(attrName => {
            const attr = element.getAttribute(attrName);
            if (attr && attr.toLowerCase().startsWith('javascript:')) {
                element.removeAttribute(attrName);
            }
        });
    });
    
    return temp.innerHTML;
}

/**
 * Validates a complete configuration object
 * @param {Object} config - The configuration to validate
 * @returns {Object} Validation result with detailed errors
 */
export function validateGameConfig(config) {
    const result = {
        isValid: true,
        errors: [],
        sanitizedConfig: {}
    };
    
    // Validate weapon settings
    if (config.WeaponSettings) {
        Object.entries(config.WeaponSettings).forEach(([weaponName, weaponConfig]) => {
            if (weaponConfig.chances) {
                const validation = validateWeaponChances(weaponConfig.chances);
                if (!validation.isValid) {
                    result.isValid = false;
                    result.errors.push(`Weapon ${weaponName}: ${validation.error}`);
                }
            }
        });
    }
    
    // Add more validation rules as needed
    
    return result;
}
