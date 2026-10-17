"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/storefront/cart-provider";

export function AddToCartButton({
  productId,
  availableQuantity,
}: {
  productId: string;
  availableQuantity: number;
}) {
  const { addItem, hydrated, accountSyncing, items } = useCart();
  const [message, setMessage] = useState("");
  const currentQuantity =
    items.find((item) => item.productId === productId)?.quantity ?? 0;
  const remainingQuantity = Math.max(0, availableQuantity - currentQuantity);
  const addableQuantity = Math.min(remainingQuantity, 999 - currentQuantity);
  const [quantity, setQuantity] = useState(1);
  const selectedQuantity = Math.min(quantity, Math.max(addableQuantity, 1));
  const unavailable = addableQuantity < 1;

  function handleAdd() {
    const result = addItem(productId, availableQuantity, selectedQuantity);

    if (result === "added") {
      setMessage("Added to your cart.");
    } else if (result === "cart-full") {
      setMessage("Your cart has reached its item limit.");
    } else if (result === "limit") {
      setMessage("Your selected quantity exceeds the remaining stock.");
    } else if (result === "unavailable") {
      setMessage("This item is currently sold out.");
    } else {
      setMessage("Your cart could not be saved. Check your browser storage.");
    }
  }

  return (
    <div className="shop-add-to-cart-wrap">
      <div className="shop-add-quantity">
        <span className="shop-add-quantity-label">Quantity</span>
        <div className="shop-cart-quantity">
          <button
            type="button"
            aria-label="Decrease quantity to add"
            disabled={
              !hydrated || accountSyncing || unavailable || selectedQuantity <= 1
            }
            onClick={() => setQuantity(Math.max(1, selectedQuantity - 1))}
          >
            <Minus aria-hidden="true" />
          </button>
          <span aria-live="polite">{selectedQuantity}</span>
          <button
            type="button"
            aria-label="Increase quantity to add"
            disabled={
              !hydrated ||
              accountSyncing ||
              unavailable ||
              selectedQuantity >= addableQuantity
            }
            onClick={() =>
              setQuantity(Math.min(addableQuantity, selectedQuantity + 1))
            }
          >
            <Plus aria-hidden="true" />
          </button>
        </div>
        <span>
          {unavailable
            ? "No more stock available"
            : `${addableQuantity} available`}
        </span>
      </div>
      <button
        className="shop-button shop-button-dark shop-add-to-cart"
        type="button"
        onClick={handleAdd}
        disabled={
          !hydrated ||
          accountSyncing ||
          unavailable
        }
      >
        <ShoppingBag aria-hidden="true" />
        {availableQuantity < 1
          ? "Sold out"
          : unavailable
            ? "Stock limit reached"
            : "Add to cart"}
      </button>
      <p aria-live="polite" className="shop-cart-feedback">
        {message ||
          (accountSyncing ? "Updating your saved cart…" : "")}
      </p>
    </div>
  );
}
