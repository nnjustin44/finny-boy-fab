import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import {
  addCartItem,
  checkoutCart,
  createCart,
  getCart,
  removeCartItem,
  updateCartItem
} from "./api";
import type { Cart, CartCustomization, CheckoutResponse } from "../types/store";

const CART_ID_KEY = "finnyboyfab.cartId";

type CartContextValue = {
  cart: Cart | null;
  cartOpen: boolean;
  loading: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (productId: string, quantity?: number, customization?: CartCustomization) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  checkout: (termsAcknowledged: boolean) => Promise<CheckoutResponse>;
  startNewCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const initializationStarted = useRef(false);

  const resetCart = useCallback(async () => {
    const nextCart = await createCart();
    localStorage.setItem(CART_ID_KEY, nextCart.id);
    setCart(nextCart);
    return nextCart;
  }, []);

  const ensureCart = useCallback(async () => {
    if (cart) {
      return cart;
    }
    const existingId = localStorage.getItem(CART_ID_KEY);
    if (!existingId) {
      return resetCart();
    }
    try {
      const existingCart = await getCart(existingId);
      setCart(existingCart);
      return existingCart;
    } catch {
      return resetCart();
    }
  }, [cart, resetCart]);

  useEffect(() => {
    if (initializationStarted.current) {
      return;
    }
    initializationStarted.current = true;
    void ensureCart();
  }, [ensureCart]);

  const addItem = useCallback(
    async (productId: string, quantity = 1, customization?: CartCustomization) => {
      setLoading(true);
      try {
        const activeCart = await ensureCart();
        setCart(await addCartItem(activeCart.id, productId, quantity, customization));
        setCartOpen(true);
      } finally {
        setLoading(false);
      }
    },
    [ensureCart]
  );

  const updateItem = useCallback(
    async (lineId: string, quantity: number) => {
      setLoading(true);
      try {
        const activeCart = await ensureCart();
        setCart(await updateCartItem(activeCart.id, lineId, quantity));
      } finally {
        setLoading(false);
      }
    },
    [ensureCart]
  );

  const removeItem = useCallback(
    async (lineId: string) => {
      setLoading(true);
      try {
        const activeCart = await ensureCart();
        setCart(await removeCartItem(activeCart.id, lineId));
      } finally {
        setLoading(false);
      }
    },
    [ensureCart]
  );

  const checkout = useCallback(async (termsAcknowledged: boolean) => {
    setLoading(true);
    try {
      const activeCart = await ensureCart();
      return await checkoutCart(activeCart.id, termsAcknowledged);
    } finally {
      setLoading(false);
    }
  }, [ensureCart]);

  const startNewCart = useCallback(async () => {
    await resetCart();
  }, [resetCart]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      cartOpen,
      loading,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      addItem,
      updateItem,
      removeItem,
      checkout,
      startNewCart
    }),
    [addItem, cart, cartOpen, checkout, loading, removeItem, startNewCart, updateItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return value;
}
