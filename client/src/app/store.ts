import { configureStore } from '@reduxjs/toolkit';
import { catalogApi } from '../api/catalogApi';
import { ordersApi } from '../api/ordersApi';
import cartReducer, { persistCartState } from '../features/cart/cartSlice';
import checkoutFormReducer from '../features/checkout/checkoutFormSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    checkoutForm: checkoutFormReducer,
    [catalogApi.reducerPath]: catalogApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(catalogApi.middleware, ordersApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Persists the cart to localStorage on every real change (see cartSlice.ts's own comment for
// why this is a plain subscribe rather than a persistence library). Reference-equality check
// against the slice itself, not a dirty flag, since Immer/Redux Toolkit only produces a new
// `cart` object when a cart reducer actually changed something -- so this skips a write on
// every unrelated action (catalog/orders API calls, checkout form typing) for free.
let previousCartState = store.getState().cart;
store.subscribe(() => {
  const cartState = store.getState().cart;
  if (cartState !== previousCartState) {
    previousCartState = cartState;
    persistCartState(cartState);
  }
});
