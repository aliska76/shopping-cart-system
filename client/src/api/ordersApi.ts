import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { CreateOrderRequest, CreateOrderResponse } from './types';

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_ORDERS_API_URL }),
  endpoints: (builder) => ({
    createOrder: builder.mutation<CreateOrderResponse, CreateOrderRequest>({
      query: (body) => ({
        url: '/api/v1/orders',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useCreateOrderMutation } = ordersApi;
