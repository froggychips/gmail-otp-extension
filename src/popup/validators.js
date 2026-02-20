// Validators for popup functionality

// Validate if a string is a valid email
export function isValidEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
}

// Validate if a string is a valid OTP
export function isValidOTP(otp) {
    const re = /^[0-9]{6}$/;
    return re.test(String(otp));
}

// Validate if a field is not empty
export function isNotEmpty(value) {
    return value && value.trim() !== '';
}