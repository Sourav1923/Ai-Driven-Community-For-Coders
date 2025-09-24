// Validation utility functions
export const required = value => (value ? '' : 'This field is required');

export const email = value => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? '' : 'Invalid email format';
};

export const minLength = min => value => {
    return value.length >= min ? '' : 'Must be at least ' + min + ' characters';
};