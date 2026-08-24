export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  story: string;
  imageUrl: string;
  imageUrls?: string[];
  wood: string;
  woodOptions?: string[];
  dimensions: string;
  priceCents: number;
  woodPriceCents?: Record<string, number>;
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
  initialsEngraving: boolean;
  initials: string;
  addOnTotalCents: number;
  lineTotalCents: number;
};

export type CartCustomization = {
  selectedWood?: string;
  rubberFeet: boolean;
  initialsEngraving: boolean;
  initials: string;
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
  sessionId: string;
  checkoutUrl: string;
};

export type CheckoutStatus = {
  sessionId: string;
  status: string;
  paymentStatus: string;
};
