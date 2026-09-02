export interface CheckoutFormValues {
  fullName: string;
  email: string;
  address: string;
}

export interface CheckoutFormErrors {
  fullName?: string;
  email?: string;
  address?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pure validation, kept separate from CheckoutPage so it can be unit-tested
 * directly instead of only through a full component render — same principle
 * as cursor.util.ts on the server-orders side (a plain function with real
 * logic in it, tested in isolation rather than mocked through).
 */
export function validateCheckoutForm(
  values: CheckoutFormValues,
  messages: { fullNameRequired: string; emailRequired: string; emailInvalid: string; addressRequired: string },
): CheckoutFormErrors {
  const errors: CheckoutFormErrors = {};
  if (!values.fullName.trim()) errors.fullName = messages.fullNameRequired;
  if (!values.email.trim()) {
    errors.email = messages.emailRequired;
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = messages.emailInvalid;
  }
  if (!values.address.trim()) errors.address = messages.addressRequired;
  return errors;
}
