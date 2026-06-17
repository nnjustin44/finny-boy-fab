import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
import type { Cart, CheckoutResponse } from "../types/store";

const CART_ID_KEY = "finnyboyfab.cartId";

type CartContextValue = {
  cart: Cart | null;
  cartOpen: boolean;
  loading: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  checkout: () => Promise<CheckoutResponse>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
    void ensureCart();
  }, [ensureCart]);

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      setLoading(true);
      try {
        const activeCart = await ensureCart();
        setCart(await addCartItem(activeCart.id, productId, quantity));
        setCartOpen(true);
      } finally {
        setLoading(false);
      }
    },
    [ensureCart]
  );

  const updateItem = useCallback(
    async (productId: string, quantity: number) => {
      setLoading(true);
      try {
        const activeCart = await ensureCart();
        setCart(await updateCartItem(activeCart.id, productId, quantity));
      } finally {
        setLoading(false);
      }
    },
    [ensureCart]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      setLoading(true);
      try {
        const activeCart = await ensureCart();
        setCart(await removeCartItem(activeCart.id, productId));
      } finally {
        setLoading(false);
      }
    },
    [ensureCart]
  );

  const checkout = useCallback(async () => {
    const activeCart = await ensureCart();
    const response = await checkoutCart(activeCart.id);
    await resetCart();
    return response;
  }, [ensureCart, resetCart]);

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
      checkout
    }),
    [addItem, cart, cartOpen, checkout, loading, removeItem, updateItem]
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
