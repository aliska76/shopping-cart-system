import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  productId: number;
  productName: string;
  categoryName: string;
  quantity: number;
}

export interface CartState {
  items: Record<number, CartItem>;
}

const initialState: CartState = {
  items: {},
};

interface ProductRef {
  productId: number;
  productName: string;
  categoryName: string;
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    /** Upsert-increment: +1 if already in the cart, inserted at quantity 1 otherwise. */
    incrementItem(state, action: PayloadAction<ProductRef>) {
      const { productId, productName, categoryName } = action.payload;
      const existing = state.items[productId];
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items[productId] = { productId, productName, categoryName, quantity: 1 };
      }
    },
    /** -1; removes the line entirely once it would reach 0. No-op if not in the cart. */
    decrementItem(state, action: PayloadAction<{ productId: number }>) {
      const existing = state.items[action.payload.productId];
      if (!existing) return;
      if (existing.quantity <= 1) {
        delete state.items[action.payload.productId];
      } else {
        existing.quantity -= 1;
      }
    },
    /** Explicit quantity (e.g. typed into a field). <= 0 removes the line. */
    setItemQuantity(state, action: PayloadAction<ProductRef & { quantity: number }>) {
      const { productId, productName, categoryName, quantity } = action.payload;
      if (quantity <= 0) {
        delete state.items[productId];
        return;
      }
      state.items[productId] = { productId, productName, categoryName, quantity };
    },
    removeItem(state, action: PayloadAction<{ productId: number }>) {
      delete state.items[action.payload.productId];
    },
    clearCart(state) {
      state.items = {};
    },
  },
});

export const { incrementItem, decrementItem, setItemQuantity, removeItem, clearCart } =
  cartSlice.actions;

export default cartSlice.reducer;

// --- Selectors (operate on the slice's own state; call as selectX(state.cart)) ---

export const selectCartItems = (state: CartState): CartItem[] => Object.values(state.items);

export const selectCartItemQuantity = (state: CartState, productId: number): number =>
  state.items[productId]?.quantity ?? 0;

export const selectCartTotalQuantity = (state: CartState): number =>
  Object.values(state.items).reduce((sum, item) => sum + item.quantity, 0);

export const selectCartIsEmpty = (state: CartState): boolean =>
  Object.keys(state.items).length === 0;
