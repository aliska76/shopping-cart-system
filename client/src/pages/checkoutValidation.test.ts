import { describe, it, expect } from 'vitest';
import { validateCheckoutForm } from './checkoutValidation';

const messages = {
  fullNameRequired: 'Full name is required.',
  emailRequired: 'Email is required.',
  emailInvalid: 'Enter a valid email address.',
  addressRequired: 'Address is required.',
};

describe('validateCheckoutForm', () => {
  it('returns no errors for a fully valid form', () => {
    const errors = validateCheckoutForm(
      { fullName: 'Alisa Rakhlina', email: 'alisa@example.com', address: '1 Herzl St' },
      messages,
    );
    expect(errors).toEqual({});
  });

  it('flags a missing full name', () => {
    const errors = validateCheckoutForm({ fullName: '  ', email: 'a@b.com', address: 'x' }, messages);
    expect(errors.fullName).toBe(messages.fullNameRequired);
  });

  it('flags a missing email as required, not invalid', () => {
    const errors = validateCheckoutForm({ fullName: 'A', email: '', address: 'x' }, messages);
    expect(errors.email).toBe(messages.emailRequired);
  });

  it('flags a malformed email as invalid, not missing', () => {
    const errors = validateCheckoutForm({ fullName: 'A', email: 'not-an-email', address: 'x' }, messages);
    expect(errors.email).toBe(messages.emailInvalid);
  });

  it('flags a missing address', () => {
    const errors = validateCheckoutForm({ fullName: 'A', email: 'a@b.com', address: '   ' }, messages);
    expect(errors.address).toBe(messages.addressRequired);
  });

  it('accepts a plausible real-world email', () => {
    const errors = validateCheckoutForm(
      { fullName: 'A', email: 'first.last+tag@sub.example.co.il', address: 'x' },
      messages,
    );
    expect(errors.email).toBeUndefined();
  });
});
