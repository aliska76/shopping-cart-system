import { configureStore } from '@reduxjs/toolkit';
import { catalogApi } from '../api/catalogApi';
import { ordersApi } from '../api/ordersApi';
import cartReducer from '../features/cart/cartSlice';
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
