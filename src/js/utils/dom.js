/**
 * DOM Utilities for safe DOM manipulation
 * Replaces unsafe innerHTML usage with secure DOM methods
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} text - The text to escape
 * @returns {string} The escaped text
 */
export function escapeHtml(text) {
    if (typeof text !== 'string') {
        return text;
    }
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Safely sets text content of an element
 * @param {HTMLElement} element - The target element
 * @param {string} text - The text to set
 */
export function setTextContent(element, text) {
    element.textContent = text;
}

/**
 * Safely clears all content from an element
 * @param {HTMLElement} element - The element to clear
 */
export function clearElement(element) {
    // Remove all event listeners by cloning the node
    const newElement = element.cloneNode(false);
    element.parentNode.replaceChild(newElement, element);
    return newElement;
}

/**
 * Safely clears content from an element by removing all children
 * @param {HTMLElement} element - The element to clear
 */
export function clearContent(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Creates a DOM element with safe content
 * @param {string} tagName - The tag name for the element
 * @param {Object} options - Configuration options
 * @param {string} options.className - CSS classes to add
 * @param {string} options.textContent - Safe text content
 * @param {Object} options.attributes - HTML attributes to set
 * @param {Array} options.children - Child elements to append
 * @returns {HTMLElement} The created element
 */
export function createElement(tagName, options = {}) {
    const element = document.createElement(tagName);
    
    if (options.className) {
        element.className = options.className;
    }
    
    if (options.textContent) {
        element.textContent = options.textContent;
    }
    
    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }
    
    if (options.children) {
        options.children.forEach(child => {
            if (child instanceof HTMLElement) {
                element.appendChild(child);
            }
        });
    }
    
    return element;
}

/**
 * Creates a button element with safe content
 * @param {Object} options - Button configuration
 * @param {string} options.text - Button text
 * @param {string} options.className - CSS classes
 * @param {string} options.id - Button ID
 * @param {Function} options.onClick - Click handler
 * @param {string} options.iconClass - FontAwesome icon class
 * @param {Object} options.attributes - Additional HTML attributes
 * @returns {HTMLElement} The button element
 */
export function createButton(options = {}) {
    const attributes = options.attributes || {};
    if (options.id) {
        attributes.id = options.id;
    }
    
    const button = createElement('button', {
        className: options.className || 'btn btn-secondary',
        attributes: attributes
    });
    
    if (options.iconClass) {
        const icon = createElement('i', {
            className: options.iconClass + ' me-1'
        });
        button.appendChild(icon);
    }
    
    if (options.text) {
        const textNode = document.createTextNode(options.text);
        button.appendChild(textNode);
    }
    
    if (options.onClick) {
        button.addEventListener('click', options.onClick);
    }
    
    return button;
}

/**
 * Creates a card header with safe content
 * @param {Object} options - Header configuration
 * @param {string} options.title - Header title
 * @param {string} options.iconClass - FontAwesome icon class
 * @returns {HTMLElement} The card header element
 */
export function createCardHeader(options = {}) {
    const cardHeader = createElement('div', {
        className: 'card-header'
    });
    
    const heading = createElement('h5', {
        className: 'mb-0'
    });
    
    if (options.iconClass) {
        const icon = createElement('i', {
            className: options.iconClass + ' me-2'
        });
        heading.appendChild(icon);
    }
    
    if (options.title) {
        const titleText = document.createTextNode(options.title);
        heading.appendChild(titleText);
    }
    
    cardHeader.appendChild(heading);
    return cardHeader;
}

/**
 * Creates a form input with label
 * @param {Object} options - Input configuration
 * @param {string} options.id - Input ID
 * @param {string} options.type - Input type
 * @param {string} options.label - Label text
 * @param {string} options.value - Initial value
 * @param {string} options.placeholder - Placeholder text
 * @param {number} options.min - Minimum value (for number inputs)
 * @param {number} options.max - Maximum value (for number inputs)
 * @param {number} options.step - Step value (for number inputs)
 * @returns {HTMLElement} The form group element
 */
export function createFormInput(options = {}) {
    const formGroup = createElement('div', {
        className: 'mb-3'
    });
    
    if (options.label) {
        const label = createElement('label', {
            className: 'form-label',
            textContent: options.label,
            attributes: { for: options.id }
        });
        formGroup.appendChild(label);
    }
    
    const input = createElement('input', {
        className: 'form-control',
        attributes: {
            type: options.type || 'text',
            id: options.id,
            ...(options.placeholder && { placeholder: options.placeholder }),
            ...(options.value !== undefined && { value: options.value }),
            ...(options.min !== undefined && { min: options.min }),
            ...(options.max !== undefined && { max: options.max }),
            ...(options.step !== undefined && { step: options.step })
        }
    });
    
    formGroup.appendChild(input);
    return formGroup;
}

/**
 * Creates an alert element with safe content
 * @param {Object} options - Alert configuration
 * @param {string} options.type - Alert type (success, warning, danger, info)
 * @param {string} options.message - Alert message
 * @param {string} options.iconClass - FontAwesome icon class
 * @returns {HTMLElement} The alert element
 */
export function createAlert(options = {}) {
    const alert = createElement('div', {
        className: `alert alert-${options.type || 'info'} d-flex align-items-center`
    });
    
    if (options.iconClass) {
        const icon = createElement('i', {
            className: options.iconClass + ' me-2'
        });
        alert.appendChild(icon);
    }
    
    if (options.message) {
        const messageSpan = createElement('span', {
            textContent: options.message
        });
        alert.appendChild(messageSpan);
    }
    
    return alert;
}

/**
 * Creates a modal dialog with safe content
 * @param {Object} options - Modal configuration
 * @param {string} options.id - Modal ID
 * @param {string} options.title - Modal title
 * @param {HTMLElement} options.content - Modal content element
 * @param {Array} options.buttons - Array of button configurations
 * @returns {HTMLElement} The modal element
 */
export function createModal(options = {}) {
    const overlay = createElement('div', {
        className: 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center',
        attributes: {
            id: options.id,
            style: 'background-color: rgba(0, 0, 0, 0.5); z-index: 1050;'
        }
    });
    
    const modalContent = createElement('div', {
        className: 'bg-white rounded shadow p-4',
        attributes: {
            style: 'max-width: 90vw; max-height: 90vh; overflow-y: auto;'
        }
    });
    
    if (options.title) {
        const header = createElement('div', {
            className: 'mb-3'
        });
        
        const title = createElement('h4', {
            textContent: options.title
        });
        
        header.appendChild(title);
        modalContent.appendChild(header);
    }
    
    if (options.content) {
        modalContent.appendChild(options.content);
    }
    
    if (options.buttons && options.buttons.length > 0) {
        const buttonContainer = createElement('div', {
            className: 'd-flex justify-content-end mt-3'
        });
        
        options.buttons.forEach(buttonConfig => {
            const button = createButton(buttonConfig);
            buttonContainer.appendChild(button);
        });
        
        modalContent.appendChild(buttonContainer);
    }
    
    overlay.appendChild(modalContent);
    return overlay;
}
