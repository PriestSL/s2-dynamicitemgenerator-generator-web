/**
 * UI Helpers Module
 * Common UI utility functions and initialization
 */

import { createElement } from '../utils/dom.js';

export class UIHelpers {
    static createElementFromHtml(htmlString) {
        const container = createElement('div');
        // Use basic sanitization - remove script tags and on* attributes
        const sanitized = htmlString
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/\son\w+="[^"]*"/gi, '')
            .replace(/\son\w+='[^']*'/gi, '');
        
        container.innerHTML = sanitized;
        return container;
    }
    
    static setupBootstrap() {
        // Get Bootstrap from window when the DOM is loaded
        return new Promise((resolve) => {
            if (window.bootstrap) {
                resolve(window.bootstrap);
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    resolve(window.bootstrap);
                });
            }
        });
    }
    
    static initializeSpinner() {
        // Ensure a global loading spinner exists outside of modals
        if (!document.getElementById('loadingSpinner')) {
            const spinnerDiv = document.createElement('div');
            spinnerDiv.id = 'loadingSpinner';
            spinnerDiv.style.position = 'fixed';
            spinnerDiv.style.top = '0';
            spinnerDiv.style.left = '0';
            spinnerDiv.style.width = '100%';
            spinnerDiv.style.height = '100%';
            spinnerDiv.style.display = 'none';
            spinnerDiv.style.justifyContent = 'center';
            spinnerDiv.style.alignItems = 'center';
            spinnerDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            spinnerDiv.style.zIndex = '9999';
            
            // Create spinner content safely
            const spinner = createElement('div', {
                className: 'spinner-border text-light',
                attributes: { 
                    role: 'status',
                    style: 'width: 3rem; height: 3rem;'
                }
            });
            
            const spinnerText = createElement('span', {
                className: 'visually-hidden',
                textContent: 'Loading...'
            });
            spinner.appendChild(spinnerText);
            spinnerDiv.appendChild(spinner);
            
            document.body.appendChild(spinnerDiv);
            
            // Explicitly ensure spinner is hidden after creation
            spinnerDiv.style.display = 'none';
        }
    }
    
    static clearContent(element) {
        if (element) {
            element.innerHTML = '';
        }
    }
    
    static showSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'flex';
        }
    }
    
    static hideSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }
    
    static withLoadingSpinner(asyncFunction) {
        return async (...args) => {
            UIHelpers.showSpinner();
            try {
                return await asyncFunction(...args);
            } finally {
                UIHelpers.hideSpinner();
            }
        };
    }
}

// Also export the function directly for backward compatibility
export const withLoadingSpinner = UIHelpers.withLoadingSpinner;
