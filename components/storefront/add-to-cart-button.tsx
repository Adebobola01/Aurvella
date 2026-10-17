"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
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
  const [quantity, setQuantity] = useState(1);
  const selectedQuantity = Math.min(
    quantity,
    Math.max(remainingQuantity, 1),
  );
  const unavailable = remainingQuantity < 1;

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
        <label htmlFor={`quantity-${productId}`}>Quantity</label>
        <input
          id={`quantity-${productId}`}
          type="number"
          min={1}
          max={remainingQuantity}
          step={1}
          value={selectedQuantity}
          disabled={!hydrated || accountSyncing || unavailable}
          aria-label={`Quantity to add, ${remainingQuantity} available`}
          onChange={(event) => {
            const nextQuantity = Number(event.currentTarget.value);
            if (!Number.isSafeInteger(nextQuantity)) return;
            setQuantity(
              Math.max(1, Math.min(nextQuantity, remainingQuantity)),
            );
          }}
        />
        <span>
          {unavailable
            ? "No more stock available"
            : `${remainingQuantity} available`}
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
