import { describe, it, expect, beforeEach } from 'vitest';
import cartReducer, {
  incrementItem,
  decrementItem,
  setItemQuantity,
  removeItem,
  clearCart,
  selectCartItems,
  selectCartItemQuantity,
  selectCartTotalQuantity,
  selectCartTotalPrice,
  selectCartIsEmpty,
  persistCartState,
  type CartState,
} from './cartSlice';

const emptyState: CartState = { items: {} };

const apple = {
  productId: 15,
  productName: 'Apples',
  categoryName: 'Fruits & Vegetables',
  unitPrice: 6.9,
  unit: 'Kilogram' as const,
};

describe('cartSlice reducer', () => {
  it('incrementItem adds a new line at quantity 1', () => {
    const state = cartReducer(emptyState, incrementItem(apple));
    expect(state.items[15]).toEqual({ ...apple, quantity: 1 });
  });

  it('incrementItem snapshots unitPrice/unit onto the line', () => {
    const state = cartReducer(emptyState, incrementItem(apple));
    expect(state.items[15].unitPrice).toBe(6.9);
    expect(state.items[15].unit).toBe('Kilogram');
  });

  it('incrementItem on an existing line adds 1 rather than duplicating it', () => {
    let state = cartReducer(emptyState, incrementItem(apple));
    state = cartReducer(state, incrementItem(apple));
    state = cartReducer(state, incrementItem(apple));
    expect(state.items[15].quantity).toBe(3);
    expect(Object.keys(state.items)).toHaveLength(1);
  });

  it('decrementItem removes the line once it would reach 0, not just its quantity', () => {
    let state = cartReducer(emptyState, incrementItem(apple));
    state = cartReducer(state, decrementItem({ productId: 15 }));
    expect(state.items[15]).toBeUndefined();
  });

  it('decrementItem on a product not in the cart is a no-op', () => {
    const state = cartReducer(emptyState, decrementItem({ productId: 999 }));
    expect(state).toEqual(emptyState);
  });

  it('setItemQuantity upserts an explicit quantity', () => {
    const state = cartReducer(emptyState, setItemQuantity({ ...apple, quantity: 5 }));
    expect(state.items[15].quantity).toBe(5);
  });

  it('setItemQuantity with 0 or less removes the line instead of storing a non-positive quantity', () => {
    let state = cartReducer(emptyState, incrementItem(apple));
    state = cartReducer(state, setItemQuantity({ ...apple, quantity: 0 }));
    expect(state.items[15]).toBeUndefined();
  });

  it('removeItem deletes the line regardless of quantity', () => {
    let state = cartReducer(emptyState, setItemQuantity({ ...apple, quantity: 9 }));
    state = cartReducer(state, removeItem({ productId: 15 }));
    expect(state.items[15]).toBeUndefined();
  });

  it('clearCart empties every line at once', () => {
    let state = cartReducer(emptyState, incrementItem(apple));
    state = cartReducer(state, incrementItem({ productId: 11, productName: 'Tomatoes', categoryName: 'Fruits & Vegetables', unitPrice: 4.5, unit: 'Kilogram' }));
    state = cartReducer(state, clearCart());
    expect(state.items).toEqual({});
  });
});

describe('cartSlice selectors', () => {
  it('selectCartItems returns the cart lines as an array', () => {
    const state = cartReducer(emptyState, incrementItem(apple));
    expect(selectCartItems(state)).toEqual([{ ...apple, quantity: 1 }]);
  });

  it('selectCartItemQuantity returns 0 for a product not in the cart', () => {
    expect(selectCartItemQuantity(emptyState, 15)).toBe(0);
  });

  it('selectCartTotalQuantity sums quantities across every distinct product', () => {
    let state = cartReducer(emptyState, setItemQuantity({ ...apple, quantity: 3 }));
    state = cartReducer(
      state,
      setItemQuantity({ productId: 11, productName: 'Tomatoes', categoryName: 'Fruits & Vegetables', unitPrice: 4.5, unit: 'Kilogram', quantity: 2 }),
    );
    expect(selectCartTotalQuantity(state)).toBe(5);
  });

  it('selectCartIsEmpty reflects whether any line exists', () => {
    expect(selectCartIsEmpty(emptyState)).toBe(true);
    const state = cartReducer(emptyState, incrementItem(apple));
    expect(selectCartIsEmpty(state)).toBe(false);
  });

  it('selectCartTotalPrice sums unitPrice × quantity across every line', () => {
    let state = cartReducer(emptyState, setItemQuantity({ ...apple, quantity: 3 })); // 6.9 * 3 = 20.7
    state = cartReducer(
      state,
      setItemQuantity({
        productId: 11,
        productName: 'Tomatoes',
        categoryName: 'Fruits & Vegetables',
        unitPrice: 4.5,
        unit: 'Kilogram',
        quantity: 2,
      }), // 4.5 * 2 = 9
    );
    expect(selectCartTotalPrice(state)).toBeCloseTo(29.7);
  });

  it('selectCartTotalPrice is 0 for an empty cart', () => {
    expect(selectCartTotalPrice(emptyState)).toBe(0);
  });
});

describe('cart persistence (localStorage)', () => {
  const CART_STORAGE_KEY = 'shopping-cart-system.cart';

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persistCartState writes the cart under the shared storage key', () => {
    const state: CartState = { items: { 15: { ...apple, quantity: 2 } } };
    persistCartState(state);
    expect(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY)!)).toEqual(state);
  });

  it('loads a previously persisted cart back as the initial state on module init', async () => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: { 15: { ...apple, quantity: 2 } } }));

    vi.resetModules();
    const fresh = await import('./cartSlice');
    const state = fresh.default(undefined, { type: '@@INIT' });

    expect(state.items[15]).toEqual({ ...apple, quantity: 2 });
  });

  it('falls back to an empty cart when nothing is stored', async () => {
    vi.resetModules();
    const fresh = await import('./cartSlice');
    const state = fresh.default(undefined, { type: '@@INIT' });

    expect(state.items).toEqual({});
  });

  it('falls back to an empty cart when the stored value is malformed JSON', async () => {
    window.localStorage.setItem(CART_STORAGE_KEY, '{not valid json');

    vi.resetModules();
    const fresh = await import('./cartSlice');
    const state = fresh.default(undefined, { type: '@@INIT' });

    expect(state.items).toEqual({});
  });

  it('drops only the malformed line, keeping the rest of a persisted cart intact', async () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        items: {
          15: { ...apple, quantity: 2 },
          11: { productId: 11, productName: 'Tomatoes', categoryName: 'Fruits & Vegetables', unit: 'Kilogram' }, // missing unitPrice/quantity
        },
      }),
    );

    vi.resetModules();
    const fresh = await import('./cartSlice');
    const state = fresh.default(undefined, { type: '@@INIT' });

    expect(state.items[15]).toEqual({ ...apple, quantity: 2 });
    expect(state.items[11]).toBeUndefined();
  });
});
