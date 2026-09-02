import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CheckoutFormValues } from '../../pages/checkoutValidation';

const initialState: CheckoutFormValues = {
  fullName: '',
  email: '',
  address: '',
};

/**
 * Just the three field values -- kept in Redux (not component state) specifically so they
 * survive "Back to catalog" and a return trip to /checkout, instead of CheckoutPage
 * remounting with a blank form. Found the hard way: typing an order, going back to add one
 * more item, and coming back to a wiped-out form is a real, reported annoyance, not a
 * hypothetical one. Validation errors are deliberately NOT stored here -- they're meant to
 * reset on a fresh visit to the form rather than show stale messages for fields the user
 * hasn't touched yet this time.
 */
const checkoutFormSlice = createSlice({
  name: 'checkoutForm',
  initialState,
  reducers: {
    setCheckoutField(state, action: PayloadAction<{ field: keyof CheckoutFormValues; value: string }>) {
      state[action.payload.field] = action.payload.value;
    },
    clearCheckoutForm() {
      return initialState;
    },
  },
});

export const { setCheckoutField, clearCheckoutForm } = checkoutFormSlice.actions;
export default checkoutFormSlice.reducer;
