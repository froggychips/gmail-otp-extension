// Error definitions for the Gmail OTP Extension

class InvalidOTPError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidOTPError';
    }
}

class OTPExpiredError extends Error {
    constructor(message) {
        super(message);
        this.name = 'OTPExpiredError';
    }
}

class UserNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UserNotFoundError';
    }
}

// Export the error classes
module.exports = {
    InvalidOTPError,
    OTPExpiredError,
    UserNotFoundError,
};