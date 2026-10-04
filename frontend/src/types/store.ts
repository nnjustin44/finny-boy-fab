export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  story: string;
  imageUrl: string;
  imageUrls: string[];
  wood: string;
  woodOptions: string[];
  dimensions: string;
  priceCents: number;
  woodPriceCents: Record<string, number>;
  inventory: number;
  featured: boolean;
  details: string[];
};

export type CartLine = {
  id: string;
  product: Product;
  quantity: number;
  selectedWood: string;
  rubberFeet: boolean;
  bronzeRubberFeet: boolean;
  addOnTotalCents: number;
  lineTotalCents: number;
};

export type CartCustomization = {
  selectedWood?: string;
  rubberFeet: boolean;
  bronzeRubberFeet: boolean;
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
  checkoutUrl: string;
  sessionId: string;
  cartId: string;
};

export type CheckoutStatus = {
  status: string;
  paymentStatus: string;
  sessionId: string;
  cartId: string | null;
};
