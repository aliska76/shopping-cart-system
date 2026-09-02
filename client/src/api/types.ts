/**
 * Shapes mirror the two backend contracts exactly (see ../../../architecture.md
 * "API контракты", and each backend's own DTOs) — kept as plain types here rather
 * than re-derived at runtime, since both APIs are stable and small enough that
 * a codegen step (OpenAPI client, etc.) would be more machinery than this project
 * needs.
 */

// --- server-catalog (GET /api/v1/categories) ---

export interface Product {
  id: number;
  nameEn: string;
  nameHe: string;
  imageUrl: string | null;
  imagePath: string | null;
}

export interface Category {
  id: number;
  nameEn: string;
  nameHe: string;
  products: Product[];
}

// --- server-orders (POST /api/v1/orders) ---

export interface OrderItemInput {
  productId: number;
  productName: string;
  categoryName: string;
  quantity: number;
}

export interface CreateOrderRequest {
  fullName: string;
  email: string;
  address: string;
  items: OrderItemInput[];
}

export interface CreateOrderResponse {
  id: string;
  createdAt: string;
}
