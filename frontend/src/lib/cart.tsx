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
  ApiError,
  addCartItem,
  checkoutCart,
  createCart,
  getCart,
  removeCartItem,
  updateCartItem
} from "./api";
import type { Cart, CartCustomization, CheckoutResponse } from "../types/store";

const CART_ID_KEY = "finnyboyfab.cartId";
const CART_CHANNEL = "finnyboyfab.cart";

type CartContextValue = {
  cart: Cart | null;
  cartOpen: boolean;
  loading: boolean;
  loadingCart: boolean;
  error: string | null;
  openCart: () => void;
  closeCart: () => void;
  retryCart: () => Promise<void>;
  clearError: () => void;
  addItem: (productId: string, quantity?: number, customization?: CartCustomization) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  checkout: (termsAcknowledged: boolean) => Promise<CheckoutResponse>;
  startNewCartIfMatches: (paidCartId: string | null) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCart, setLoadingCart] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cartRef = useRef<Cart | null>(null);
  const loadRef = useRef<Promise<Cart | null> | null>(null);
  const busyRef = useRef(false);
  const checkoutRef = useRef<Promise<CheckoutResponse> | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const displayCart = useCallback((nextCart: Cart | null) => {
    cartRef.current = nextCart;
    setCart(nextCart);
  }, []);

  const broadcastChange = useCallback((cartId: string | null) => {
    channelRef.current?.postMessage({ cartId });
  }, []);

  const loadCart = useCallback(async (force = false, createIfMissing = false): Promise<Cart | null> => {
    const savedId = localStorage.getItem(CART_ID_KEY);
    if (!force && cartRef.current?.id === savedId) return cartRef.current;
    if (loadRef.current) {
      const loaded = await loadRef.current;
      if (loaded || !createIfMissing) return loaded;
    }

    const load = (async () => {
      setLoadingCart(true);
      try {
        let cartId = localStorage.getItem(CART_ID_KEY);
        for (;;) {
          if (!cartId) {
            if (!createIfMissing) {
              displayCart(null);
              setError(null);
              return null;
            }
            const freshCart = await createCart();
            const chosenId = localStorage.getItem(CART_ID_KEY);
            if (chosenId) {
              cartId = chosenId;
              continue;
            }
            localStorage.setItem(CART_ID_KEY, freshCart.id);
            displayCart(freshCart);
            broadcastChange(freshCart.id);
            setError(null);
            return freshCart;
          }

          try {
            const savedCart = await getCart(cartId);
            const latestId = localStorage.getItem(CART_ID_KEY);
            if (latestId !== cartId) {
              cartId = latestId;
              continue;
            }
            displayCart(savedCart);
            setError(null);
            return savedCart;
          } catch (cause) {
            if (!(cause instanceof ApiError) || ![404, 410].includes(cause.status)) {
              throw cause;
            }
            if (localStorage.getItem(CART_ID_KEY) !== cartId) {
              cartId = localStorage.getItem(CART_ID_KEY);
              continue;
            }
            localStorage.removeItem(CART_ID_KEY);
            displayCart(null);
            cartId = null;
            if (!createIfMissing) {
              setError(null);
              return null;
            }
          }
        }
      } finally {
        setLoadingCart(false);
      }
    })();

    loadRef.current = load;
    try {
      return await load;
    } finally {
      loadRef.current = null;
    }
  }, [broadcastChange, displayCart]);

  const retryCart = useCallback(async () => {
    try {
      await loadCart(true);
    } catch {
      setError("We couldn't load your cart. Your saved cart is still here. Please try again.");
    }
  }, [loadCart]);

  useEffect(() => {
    void retryCart();
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(CART_CHANNEL);
      channelRef.current = channel;
      channel.onmessage = () => { void retryCart(); };
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key !== CART_ID_KEY) return;
      if (event.newValue !== cartRef.current?.id) displayCart(null);
      void retryCart();
    };
    const onFocus = () => { void retryCart(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      channelRef.current?.close();
      channelRef.current = null;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [displayCart, retryCart]);

  const mutateCart = useCallback(async (
    mutation: (cartId: string) => Promise<Cart>,
    failureMessage: string,
    openOnError = false
  ) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const activeCart = await loadCart(false, true);
      if (!activeCart) throw new Error("Unable to prepare a cart");
      const updatedCart = await mutation(activeCart.id);
      if (localStorage.getItem(CART_ID_KEY) === activeCart.id) {
        displayCart(updatedCart);
        broadcastChange(activeCart.id);
      } else {
        void retryCart();
      }
      if (openOnError) setCartOpen(true);
    } catch {
      setError(failureMessage);
      if (openOnError) setCartOpen(true);
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, [broadcastChange, displayCart, loadCart, retryCart]);

  const addItem = useCallback((productId: string, quantity = 1, customization?: CartCustomization) =>
    mutateCart(id => addCartItem(id, productId, quantity, customization),
      "We couldn't add that board. Please check your cart and try again.", true), [mutateCart]);

  const updateItem = useCallback((lineId: string, quantity: number) =>
    mutateCart(id => updateCartItem(id, lineId, quantity),
      "We couldn't update the quantity. Please try again."), [mutateCart]);

  const removeItem = useCallback((lineId: string) =>
    mutateCart(id => removeCartItem(id, lineId),
      "We couldn't remove that board. Please try again."), [mutateCart]);

  const checkout = useCallback((termsAcknowledged: boolean): Promise<CheckoutResponse> => {
    if (checkoutRef.current) return checkoutRef.current;
    const attempt = (async () => {
      if (busyRef.current) throw new Error("Cart is busy");
      busyRef.current = true;
      setLoading(true);
      try {
        const activeCart = await loadCart();
        if (!activeCart) throw new Error("Cart is empty");
        return await checkoutCart(activeCart.id, termsAcknowledged);
      } finally {
        busyRef.current = false;
        setLoading(false);
      }
    })();
    checkoutRef.current = attempt;
    void attempt.finally(() => { checkoutRef.current = null; }).catch(() => {});
    return attempt;
  }, [loadCart]);

  const startNewCartIfMatches = useCallback(async (paidCartId: string | null) => {
    if (!paidCartId || localStorage.getItem(CART_ID_KEY) !== paidCartId) return;
    localStorage.removeItem(CART_ID_KEY);
    displayCart(null);
    broadcastChange(null);
    setError(null);
  }, [broadcastChange, displayCart]);

  const value = useMemo<CartContextValue>(() => ({
    cart, cartOpen, loading, loadingCart, error,
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
    retryCart,
    clearError: () => setError(null),
    addItem, updateItem, removeItem, checkout, startNewCartIfMatches
  }), [addItem, cart, cartOpen, checkout, error, loading, loadingCart, removeItem, retryCart, startNewCartIfMatches, updateItem]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
