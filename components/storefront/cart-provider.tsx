"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { authClient } from "@/lib/auth-client";

const CART_STORAGE_KEY = "aurvella-cart-v1";
const MAX_CART_QUANTITY = 999;
const MAX_CART_LINES = 50;

export type CartLine = {
  productId: string;
  quantity: number;
};

type AddItemResult =
  | "added"
  | "cart-full"
  | "limit"
  | "unavailable"
  | "storage-error";

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  hydrated: boolean;
  storageIssue: string | null;
  accountSyncIssue: string | null;
  accountSyncing: boolean;
  cartDrawerOpen: boolean;
  customer: { id: string; name: string; email: string } | null;
  addItem: (
    productId: string,
    availableQuantity: number,
    quantity?: number,
  ) => AddItemResult;
  setCartDrawerOpen: (open: boolean) => void;
  setQuantity: (productId: string, quantity: number) => boolean;
  removeItem: (productId: string) => boolean;
  replaceItems: (items: CartLine[]) => boolean;
  retryAccountSync: () => void;
  signOut: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function parseCart(value: string): CartLine[] {
  const parsed: unknown = JSON.parse(value);

  if (!Array.isArray(parsed) || parsed.length > MAX_CART_LINES) {
    throw new Error("Saved cart must be a list.");
  }

  const lines = new Map<string, number>();

  for (const item of parsed) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("productId" in item) ||
      typeof item.productId !== "string" ||
      item.productId.length === 0 ||
      item.productId.length > 100 ||
      !("quantity" in item) ||
      typeof item.quantity !== "number" ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_CART_QUANTITY
    ) {
      throw new Error("Saved cart contains an invalid item.");
    }

    lines.set(
      item.productId,
      Math.min(
        MAX_CART_QUANTITY,
        (lines.get(item.productId) ?? 0) + item.quantity,
      ),
    );
  }

  return Array.from(lines, ([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [storageIssue, setStorageIssue] = useState<string | null>(null);
  const [accountSyncIssue, setAccountSyncIssue] = useState<string | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [accountReadyUserId, setAccountReadyUserId] = useState<string | null>(
    null,
  );
  const syncStartedForUser = useRef<string | null>(null);
  const activeUserId = useRef<string | null>(null);
  const pauseAccountSync = useRef(false);
  const accountWriteQueue = useRef<Promise<void>>(Promise.resolve());
  const userId = session?.user.id ?? null;

  useEffect(() => {
    activeUserId.current = userId;
  }, [userId]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;

      let savedCart: string | null;
      try {
        savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      } catch {
        setStorageIssue("Your cart could not be loaded from this browser.");
        setHydrated(true);
        return;
      }

      if (savedCart) {
        try {
          setItems(parseCart(savedCart));
        } catch {
          try {
            window.localStorage.removeItem(CART_STORAGE_KEY);
            setStorageIssue(
              "Your saved cart was invalid and has been cleared. You can start a new cart.",
            );
          } catch {
            setStorageIssue(
              "Your saved cart could not be read or cleared. Check your browser storage settings.",
            );
          }
        }
      }

      setHydrated(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const persistItems = useCallback(
    (nextItems: CartLine[]) => {
      if (!hydrated || (userId && accountReadyUserId !== userId)) return false;

      try {
        window.localStorage.setItem(
          CART_STORAGE_KEY,
          JSON.stringify(nextItems),
        );
      } catch {
        setStorageIssue("Your cart could not be saved in this browser.");
        return false;
      }

      setStorageIssue(null);
      setItems(nextItems);
      return true;
    },
    [accountReadyUserId, hydrated, userId],
  );

  useEffect(() => {
    if (!hydrated || sessionPending) return;

    if (!userId) {
      if (activeUserId.current === null) {
        syncStartedForUser.current = null;
        pauseAccountSync.current = false;
      }
      return;
    }

    if (
      pauseAccountSync.current ||
      syncStartedForUser.current === userId
    ) {
      return;
    }

    syncStartedForUser.current = userId;
    setAccountSyncIssue(null);

    void (async () => {
      try {
        const response = await fetch("/api/storefront/cart/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        if (!response.ok) {
          throw new Error("Your saved cart could not be synchronized.");
        }

        const data: unknown = await response.json();
        if (
          typeof data !== "object" ||
          data === null ||
          !("items" in data) ||
          !Array.isArray(data.items)
        ) {
          throw new Error("The saved cart response was invalid.");
        }
        const mergedItems = parseCart(JSON.stringify(data.items));

        if (activeUserId.current !== userId) return;
        let localCartSaved = true;
        try {
          window.localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(mergedItems),
          );
        } catch {
          localCartSaved = false;
        }

        setItems(mergedItems);
        setStorageIssue(
          localCartSaved
            ? null
            : "Your account cart was merged and saved to your account, but could not be saved in this browser.",
        );
        setAccountReadyUserId(userId);
      } catch (error) {
        if (activeUserId.current !== userId) return;
        syncStartedForUser.current = null;
        setAccountSyncIssue(
          error instanceof Error
            ? error.message
            : "Your saved cart could not be synchronized.",
        );
      }
    })();
  }, [hydrated, items, sessionPending, userId]);

  useEffect(() => {
    if (
      !hydrated ||
      sessionPending ||
      !userId ||
      accountReadyUserId !== userId ||
      pauseAccountSync.current
    ) {
      return;
    }

    const snapshot = items;
    accountWriteQueue.current = accountWriteQueue.current
      .catch(() => undefined)
      .then(async () => {
        if (activeUserId.current !== userId || pauseAccountSync.current) return;

        const response = await fetch("/api/storefront/cart/account", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: snapshot }),
        });
        if (!response.ok) {
          throw new Error("Your account cart could not be updated.");
        }
        if (activeUserId.current === userId) setAccountSyncIssue(null);
      })
      .catch((error: unknown) => {
        if (activeUserId.current === userId) {
          setAccountSyncIssue(
            error instanceof Error
              ? error.message
              : "Your account cart could not be updated.",
          );
        }
      });
  }, [accountReadyUserId, hydrated, items, sessionPending, userId]);

  const retryAccountSync = useCallback(() => {
    if (!userId) return;
    syncStartedForUser.current = null;
    setAccountReadyUserId(null);
    setAccountSyncIssue(null);
  }, [userId]);

  const signOut = useCallback(async () => {
    if (userId && accountReadyUserId !== userId) {
      throw new Error("Wait for your saved cart to finish synchronizing.");
    }

    await accountWriteQueue.current;
    pauseAccountSync.current = true;

    try {
      const result = await authClient.signOut();
      if (result.error) {
        throw new Error(result.error.message || "Sign-out failed.");
      }

      let localCartCleared = true;
      try {
        window.localStorage.removeItem(CART_STORAGE_KEY);
      } catch {
        localCartCleared = false;
      }

      setItems([]);
      setStorageIssue(
        localCartCleared
          ? null
          : "Your account is signed out, but the browser could not clear its saved cart.",
      );
      setAccountSyncIssue(null);
      setAccountReadyUserId(null);
      syncStartedForUser.current = null;
    } catch (error) {
      pauseAccountSync.current = false;
      throw error;
    }
  }, [accountReadyUserId, userId]);

  const addItem = useCallback(
    (
      productId: string,
      availableQuantity: number,
      quantity = 1,
    ): AddItemResult => {
      if (!hydrated) return "storage-error";
      if (availableQuantity < 1) return "unavailable";
      if (
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > MAX_CART_QUANTITY
      ) {
        return "limit";
      }

      const existing = items.find((item) => item.productId === productId);
      if (!existing && items.length >= MAX_CART_LINES) return "cart-full";
      const currentQuantity = existing?.quantity ?? 0;
      if (currentQuantity + quantity > availableQuantity) return "limit";

      const nextQuantity = currentQuantity + quantity;
      const nextItems = existing
        ? items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: nextQuantity }
              : item,
          )
        : [...items, { productId, quantity: nextQuantity }];

      if (!persistItems(nextItems)) return "storage-error";
      setCartDrawerOpen(true);
      return "added";
    },
    [hydrated, items, persistItems],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > MAX_CART_QUANTITY
      ) {
        return false;
      }

      return persistItems(
        items.map((item) =>
          item.productId === productId ? { ...item, quantity } : item,
        ),
      );
    },
    [items, persistItems],
  );

  const removeItem = useCallback(
    (productId: string) =>
      persistItems(items.filter((item) => item.productId !== productId)),
    [items, persistItems],
  );

  const replaceItems = useCallback(
    (nextItems: CartLine[]) => persistItems(nextItems),
    [persistItems],
  );

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const accountSyncing = Boolean(
    userId && !accountSyncIssue && accountReadyUserId !== userId,
  );
  const customer = useMemo(
    () =>
      session
        ? {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
          }
        : null,
    [session],
  );
  const value = useMemo(
    () => ({
      items,
      itemCount,
      hydrated,
      storageIssue,
      accountSyncIssue,
      accountSyncing,
      cartDrawerOpen,
      customer,
      addItem,
      setCartDrawerOpen,
      setQuantity,
      removeItem,
      replaceItems,
      retryAccountSync,
      signOut,
    }),
    [
      items,
      itemCount,
      hydrated,
      storageIssue,
      accountSyncIssue,
      accountSyncing,
      cartDrawerOpen,
      customer,
      addItem,
      setCartDrawerOpen,
      setQuantity,
      removeItem,
      replaceItems,
      retryAccountSync,
      signOut,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const cart = useContext(CartContext);

  if (!cart) {
    throw new Error("useCart must be used within a CartProvider.");
  }

  return cart;
}
