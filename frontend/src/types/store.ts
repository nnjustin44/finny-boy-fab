export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  story: string;
  imageUrl: string;
  wood: string;
  dimensions: string;
  priceCents: number;
  inventory: number;
  featured: boolean;
  details: string[];
};

export type CartLine = {
  product: Product;
  quantity: number;
  lineTotalCents: number;
};

export type Cart = {
  id: string;
  items: CartLine[];
  itemCount: number;
  subtotalCents: number;
  estimatedShippingCents: number;
  totalCents: number;
};

export type CheckoutResponse = {
  orderNumber: string;
  cart: Cart;
};
