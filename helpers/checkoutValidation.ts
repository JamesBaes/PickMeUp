/**
 * Validation functions for checkout form fields
 */

// Restrict name fields to letters, spaces, hyphens, apostrophes, and periods
export const sanitizeNameInput = (value: string): string =>
  value.replace(/[^a-zA-Z\s\-'.,]/g, "");

// Restrict address fields to alphanumeric and common address punctuation
export const sanitizeAddressInput = (value: string): string =>
  value.replace(/[^a-zA-Z0-9\s\-.,#/]/g, "");

// Strip characters commonly used in injection and XSS attacks
export const stripInjectionChars = (value: string): string =>
  value.replace(/[<>"`;\\]/g, "");

export const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) {
    return "Email is required";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email address";
  }
  return undefined;
};

export const validatePhone = (phone: string): string | undefined => {
  if (!phone.trim()) {
    return "Phone number is required";
  }
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length < 10) {
    return "Phone number must be at least 10 digits";
  }
  if (digitsOnly.length > 15) {
    return "Phone number is too long";
  }
  return undefined;
};

export const validateName = (name: string): string | undefined => {
  if (!name.trim()) {
    return "Cardholder name is required";
  }
  if (name.trim().length < 2) {
    return "Name must be at least 2 characters";
  }
  return undefined;
};

export const validateAddress = (address: string): string | undefined => {
  if (!address.trim()) {
    return "Address is required";
  }
  return undefined;
};

export const formatPhoneNumber = (value: string): string => {
  // Format as North American style while user types.
  const digitsOnly = value.replace(/\D/g, "");
  if (digitsOnly.length <= 3) {
    return digitsOnly;
  }
  if (digitsOnly.length <= 6) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
  }
  return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
};

export const validatePromoCode = (code: string): boolean => {
  // Current promo implementation is intentionally simple and explicit.
  return code.toUpperCase() === "SAVE5";
};
