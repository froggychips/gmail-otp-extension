// Improved OTP Detection Algorithm

// Function to verify if a string is a valid OTP
function isValidOTP(otp) {
    // Check if the OTP is a 6-digit number
    const otpPattern = /^[0-9]{6}$/;
    return otpPattern.test(otp);
}

// Function to extract OTP from given text
function extractOTP(text) {
    const regex = /\b(\d{6})\b/; // Match 6-digit numbers
    const match = text.match(regex);
    return match ? match[0] : null;
}

// Main function to detect OTP in input text
function detectOTP(inputText) {
    const otp = extractOTP(inputText);
    return isValidOTP(otp) ? otp : null;
}

// Example usage
const inputText = 'Your OTP is 123456';
const detectedOTP = detectOTP(inputText);
console.log(detectedOTP ? `Detected OTP: ${detectedOTP}` : 'No valid OTP found.');