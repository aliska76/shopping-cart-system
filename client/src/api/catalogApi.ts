import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Category } from '../types/types';

/**
 * GET /api/v1/categories returns every category with its products nested and
 * unpaginated (see server-catalog's Design notes — deliberate at today's scale
 * of 3 categories / 18 products) so a single query is all screen 1 needs.
 */
export const catalogApi = createApi({
  reducerPath: 'catalogApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_CATALOG_API_URL }),
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], void>({
      query: () => '/api/v1/categories',
    }),
  }),
});

export const { useGetCategoriesQuery } = catalogApi;
