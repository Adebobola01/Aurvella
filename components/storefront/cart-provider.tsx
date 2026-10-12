"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
  addItem: (productId: string, availableQuantity: number) => AddItemResult;
  setQuantity: (productId: string, quantity: number) => boolean;
  removeItem: (productId: string) => boolean;
  replaceItems: (items: CartLine[]) => boolean;
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
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [storageIssue, setStorageIssue] = useState<string | null>(null);

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
      if (!hydrated) return false;

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
    [hydrated],
  );

  const addItem = useCallback(
    (productId: string, availableQuantity: number): AddItemResult => {
      if (!hydrated) return "storage-error";
      if (availableQuantity < 1) return "unavailable";

      const existing = items.find((item) => item.productId === productId);
      if (!existing && items.length >= MAX_CART_LINES) return "cart-full";
      const currentQuantity = existing?.quantity ?? 0;
      if (currentQuantity >= availableQuantity) return "limit";

      const nextQuantity = Math.min(
        currentQuantity + 1,
        availableQuantity,
        MAX_CART_QUANTITY,
      );
      const nextItems = existing
        ? items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: nextQuantity }
              : item,
          )
        : [...items, { productId, quantity: nextQuantity }];

      return persistItems(nextItems)
        ? "added"
        : "storage-error";
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
  const value = useMemo(
    () => ({
      items,
      itemCount,
      hydrated,
      storageIssue,
      addItem,
      setQuantity,
      removeItem,
      replaceItems,
    }),
    [
      items,
      itemCount,
      hydrated,
      storageIssue,
      addItem,
      setQuantity,
      removeItem,
      replaceItems,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);

  if (!cart) {
    throw new Error("useCart must be used within a CartProvider.");
  }

  return cart;
}
