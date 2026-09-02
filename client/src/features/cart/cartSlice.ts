import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ProductUnit } from '../../types/types';

export interface CartItem {
  productId: number;
  productName: string;
  categoryName: string;
  // Snapshotted from the product at the moment it's added, not re-read from the catalog on
  // every render -- the order summary (checkout.title = "Order summary") needs a price/unit
  // per line and a grand total even if the catalog price were to change later in the session.
  unitPrice: number;
  unit: ProductUnit;
  quantity: number;
}

export interface CartState {
  items: Record<number, CartItem>;
}

// Same mechanism as the language preference (see ../../i18n/i18n.ts): a single localStorage
// key, read once at store-creation time and written back on every change, no persistence
// library. Refreshing mid-shop would otherwise lose the cart, since Redux state alone doesn't
// survive a reload.
const CART_STORAGE_KEY = 'shopping-cart-system.cart';

const PRODUCT_UNITS: ProductUnit[] = ['Kilogram', 'Piece', 'Liter'];

function isValidCartItem(value: unknown, productId: string): value is CartItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    item.productId === Number(productId) &&
    typeof item.productName === 'string' &&
    typeof item.categoryName === 'string' &&
    typeof item.unitPrice === 'number' &&
    PRODUCT_UNITS.includes(item.unit as ProductUnit) &&
    typeof item.quantity === 'number' &&
    item.quantity > 0
  );
}

/**
 * Reads the persisted cart back on startup. Deliberately defensive rather than trusting
 * whatever's in localStorage outright -- it's user-editable browser storage, and the shape
 * could also be stale from an earlier version of this app. Any single malformed line is
 * dropped rather than discarding the whole cart, and any parse/shape failure at all falls
 * back to an empty cart instead of throwing during store setup.
 */
function loadInitialCartState(): CartState {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { items: {} };

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return { items: {} };
    const candidateItems = (parsed as { items?: unknown }).items;
    if (typeof candidateItems !== 'object' || candidateItems === null) return { items: {} };

    const items: Record<number, CartItem> = {};
    for (const [productId, value] of Object.entries(candidateItems as Record<string, unknown>)) {
      if (isValidCartItem(value, productId)) {
        items[Number(productId)] = value;
      }
    }
    return { items };
  } catch {
    return { items: {} };
  }
}

export function persistCartState(state: CartState): void {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
}

const initialState: CartState = loadInitialCartState();

interface ProductRef {
  productId: number;
  productName: string;
  categoryName: string;
  unitPrice: number;
  unit: ProductUnit;
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    /** Upsert-increment: +1 if already in the cart, inserted at quantity 1 otherwise. */
    incrementItem(state, action: PayloadAction<ProductRef>) {
      const { productId, productName, categoryName, unitPrice, unit } = action.payload;
      const existing = state.items[productId];
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items[productId] = { productId, productName, categoryName, unitPrice, unit, quantity: 1 };
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
      const { productId, productName, categoryName, unitPrice, unit, quantity } = action.payload;
      if (quantity <= 0) {
        delete state.items[productId];
        return;
      }
      state.items[productId] = { productId, productName, categoryName, unitPrice, unit, quantity };
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

// Grand total for the order summary screen -- sum of (unit price × quantity) across every
// line. Deliberately not sent to server-orders (which doesn't store prices at all, see
// architecture.md) -- this is a client-side display total only.
export const selectCartTotalPrice = (state: CartState): number =>
  Object.values(state.items).reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

export const selectCartIsEmpty = (state: CartState): boolean =>
  Object.keys(state.items).length === 0;
