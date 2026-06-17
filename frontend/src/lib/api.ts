import type { Cart, CheckoutResponse, Product } from "../types/store";

const jsonHeaders = {
  "Content-Type": "application/json"
};

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function getProducts() {
  return request<Product[]>("/api/products");
}

export function getProduct(slug: string) {
  return request<Product>(`/api/products/${slug}`);
}

export function createCart() {
  return request<Cart>("/api/cart", { method: "POST" });
}

export function getCart(cartId: string) {
  return request<Cart>(`/api/cart/${cartId}`);
}

export function addCartItem(cartId: string, productId: string, quantity: number) {
  return request<Cart>(`/api/cart/${cartId}/items`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ productId, quantity })
  });
}

export function updateCartItem(cartId: string, productId: string, quantity: number) {
  return request<Cart>(`/api/cart/${cartId}/items/${productId}`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(quantity)
  });
}

export function removeCartItem(cartId: string, productId: string) {
  return request<Cart>(`/api/cart/${cartId}/items/${productId}`, {
    method: "DELETE"
  });
}

export function checkoutCart(cartId: string) {
  return request<CheckoutResponse>(`/api/cart/${cartId}/checkout`, {
    method: "POST"
  });
}
