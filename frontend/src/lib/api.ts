import type {
  Cart,
  CartCustomization,
  CheckoutResponse,
  CheckoutStatus,
  Product
} from "../types/store";

const jsonHeaders = {
  "Content-Type": "application/json"
};

const productRequests = new Map<string, Promise<Product>>();

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
  const cachedRequest = productRequests.get(slug);
  if (cachedRequest) {
    return cachedRequest;
  }

  const productRequest = request<Product>(`/api/products/${slug}`).catch((error) => {
    productRequests.delete(slug);
    throw error;
  });
  productRequests.set(slug, productRequest);
  return productRequest;
}

export function createCart() {
  return request<Cart>("/api/cart", { method: "POST" });
}

export function getCart(cartId: string) {
  return request<Cart>(`/api/cart/${cartId}`);
}

export function addCartItem(
  cartId: string,
  productId: string,
  quantity: number,
  customization?: CartCustomization
) {
  return request<Cart>(`/api/cart/${cartId}/items`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ productId, quantity, ...customization })
  });
}

export function updateCartItem(cartId: string, lineId: string, quantity: number) {
  return request<Cart>(`/api/cart/${cartId}/items/${encodeURIComponent(lineId)}`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(quantity)
  });
}

export function removeCartItem(cartId: string, lineId: string) {
  return request<Cart>(`/api/cart/${cartId}/items/${encodeURIComponent(lineId)}`, {
    method: "DELETE"
  });
}

export function checkoutCart(cartId: string, termsAcknowledged: boolean) {
  return request<CheckoutResponse>(`/api/cart/${cartId}/checkout`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ termsAcknowledged })
  });
}

export function getCheckoutSession(sessionId: string) {
  return request<CheckoutStatus>(`/api/checkout/sessions/${encodeURIComponent(sessionId)}`);
}
