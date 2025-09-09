// Bootstrap fixes - merged from bootstrap-fixes.js
// Function to show loading spinner
function showLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner && spinner.style.display !== 'flex') {
        spinner.style.display = 'flex';
    }
}

// Function to hide loading spinner
function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner && spinner.style.display !== 'none') {
        spinner.style.display = 'none';
    }
}

// Helper function to ensure loading spinner is hidden after a promise resolves or rejects
export async function withLoadingSpinner(promiseFunction) {
    showLoadingSpinner();
    try {
        return await promiseFunction();
    } finally {
        hideLoadingSpinner();
    }
}