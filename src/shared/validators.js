// Input validation functions for the Gmail OTP extension

/**
 * Validates if a string is a valid email format.
 * @param {string} email - The email string to validate.
 * @returns {boolean} - Returns true if valid, false otherwise.
 */
function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Validates if a password meets strength requirements.
 * @param {string} password - The password string to validate.
 * @returns {boolean} - Returns true if valid, false otherwise.
 */
function validatePassword(password) {
    // Checks for at least 8 characters, one uppercase letter, one lowercase letter, one number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return re.test(password);
}

/**
 * Validates if a string is a valid phone number format.
 * @param {string} phone - The phone number string to validate.
 * @returns {boolean} - Returns true if valid, false otherwise.
 */
function validatePhoneNumber(phone) {
    const re = /^\\+?\\d{1,4}?[-.\\s]?\\(\\d{1,3}\\)[-.\\s]?\\d{3}[-.\\s]?\\d{4}$/;
    return re.test(phone);
}

// Exporting the validation functions
module.exports = {
    validateEmail,
    validatePassword,
    validatePhoneNumber
};