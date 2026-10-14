"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/storefront/cart-provider";

export function SignOutButton() {
  const router = useRouter();
  const { signOut } = useCart();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    setError("");

    try {
      await signOut();
      router.replace("/");
      router.refresh();
    } catch {
      setError("We could not sign you out. Please try again.");
      setPending(false);
    }
  }

  return (
    <div>
      <button
        className="shop-account-signout"
        type="button"
        onClick={handleSignOut}
        disabled={pending}
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <p className="shop-auth-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
