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
  const { addItem, hydrated } = useCart();
  const [message, setMessage] = useState("");
  const unavailable = availableQuantity < 1;

  function handleAdd() {
    const result = addItem(productId, availableQuantity);

    if (result === "added") {
      setMessage("Added to your cart.");
    } else if (result === "cart-full") {
      setMessage("Your cart has reached its item limit.");
    } else if (result === "limit") {
      setMessage("Your cart already has all available stock.");
    } else if (result === "unavailable") {
      setMessage("This item is currently sold out.");
    } else {
      setMessage("Your cart could not be saved. Check your browser storage.");
    }
  }

  return (
    <div className="shop-add-to-cart-wrap">
      <button
        className="shop-button shop-button-dark shop-add-to-cart"
        type="button"
        onClick={handleAdd}
        disabled={!hydrated || unavailable}
      >
        <ShoppingBag aria-hidden="true" />
        {unavailable ? "Sold out" : "Add to cart"}
      </button>
      <p aria-live="polite" className="shop-cart-feedback">
        {message}
      </p>
    </div>
  );
}
