// Function for secure text injection
function secureTextInject(selector, text) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = text;
    }
}

// Example usage:
// secureTextInject('#example', 'This is secure text');