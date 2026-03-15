/**
 * Validation functions for checkout form fields
 */

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
  return code.toUpperCase() === "SAVE5";
};
