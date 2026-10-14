"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { useCart, type CartLine } from "@/components/storefront/cart-provider";

type CartProduct = {
  id: string;
  slug: string;
  name: string;
  priceInMinorUnits: number;
  currencyCode: string;
  quantity: number;
  images: { deliveryUrl: string; altText: string }[];
};

function formatPrice(priceInMinorUnits: number, currencyCode: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(priceInMinorUnits / 100);
}

function linesChanged(current: CartLine[], next: CartLine[]) {
  return (
    current.length !== next.length ||
    current.some(
      (line, index) =>
        line.productId !== next[index]?.productId ||
        line.quantity !== next[index]?.quantity,
    )
  );
}

export function CartContents() {
  const {
    items,
    hydrated,
    storageIssue,
    accountSyncIssue,
    accountSyncing,
    customer,
    setQuantity,
    removeItem,
    replaceItems,
    retryAccountSync,
  } = useCart();
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stockNotice, setStockNotice] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!hydrated) return;

    if (items.length === 0) return;

    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      setLoadError(null);

      try {
        const params = new URLSearchParams();
        for (const item of items) params.append("id", item.productId);

        const response = await fetch(`/api/storefront/cart?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("The cart products could not be refreshed.");
        }

        const data = (await response.json()) as { products: CartProduct[] };
        if (!Array.isArray(data.products)) {
          throw new Error("The cart response was invalid.");
        }

        const productsById = new Map(
          data.products.map((product) => [product.id, product]),
        );
        let removedUnavailable = false;
        let reducedQuantities = false;
        const nextItems = items.flatMap((item) => {
          const product = productsById.get(item.productId);
          if (!product || product.quantity < 1) {
            removedUnavailable = true;
            return [];
          }
          if (item.quantity > product.quantity) {
            reducedQuantities = true;
            return [{ ...item, quantity: product.quantity }];
          }
          return [item];
        });

        if (linesChanged(items, nextItems) && !replaceItems(nextItems)) {
          throw new Error("The updated cart could not be saved in this browser.");
        }

        setProducts(data.products);
        if (removedUnavailable || reducedQuantities) {
          setStockNotice(
            "Your cart was updated to reflect the latest availability.",
          );
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "The cart products could not be refreshed.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadProducts();
    return () => controller.abort();
  }, [hydrated, items, replaceItems, retry]);

  const productsById = new Map(products.map((product) => [product.id, product]));
  const visibleItems = items.flatMap((item) => {
    const product = productsById.get(item.productId);
    return product ? [{ ...item, product }] : [];
  });
  const totalsByCurrency = visibleItems.reduce<Map<string, number>>(
    (totals, item) => {
      totals.set(
        item.product.currencyCode,
        (totals.get(item.product.currencyCode) ?? 0) +
          item.product.priceInMinorUnits * item.quantity,
      );
      return totals;
    },
    new Map(),
  );

  return (
    <section className="shop-cart">
      <div className="shop-cart-heading">
        <div>
          <p className="shop-kicker">YOUR SELECTION</p>
          <h1>Shopping bag</h1>
        </div>
        <Link href="/products" className="shop-text-link">
          Continue shopping <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      {storageIssue && (
        <p className="shop-cart-alert" role="alert">
          {storageIssue}
        </p>
      )}
      {accountSyncIssue && (
        <p className="shop-cart-alert" role="alert">
          {accountSyncIssue}{" "}
          <button
            type="button"
            className="shop-cart-retry"
            onClick={retryAccountSync}
          >
            Retry
          </button>
        </p>
      )}
      {accountSyncing && (
        <p className="shop-cart-notice" role="status">
          Syncing your cart with your account…
        </p>
      )}
      {stockNotice && (
        <p className="shop-cart-notice" role="status">
          {stockNotice}
        </p>
      )}

      {!hydrated || (items.length > 0 && loading) ? (
        <p className="shop-cart-message" role="status">
          Updating your cart…
        </p>
      ) : loadError && items.length > 0 ? (
        <div className="shop-cart-message" role="alert">
          <p>{loadError}</p>
          <button
            type="button"
            className="shop-text-link"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : items.length === 0 || visibleItems.length === 0 ? (
        <div className="shop-cart-empty">
          <h2>Your bag is waiting for something lovely.</h2>
          <p>Explore the collection and add a piece you love.</p>
          <Link href="/products" className="shop-button shop-button-dark">
            Shop jewelry <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="shop-cart-layout">
          <div className="shop-cart-items">
            {visibleItems.map(({ product, quantity }) => {
              const image = product.images[0];

              return (
                <article className="shop-cart-item" key={product.id}>
                  <Link
                    className="shop-cart-product-image"
                    href={`/products/${product.slug}`}
                    aria-label={`View ${product.name}`}
                  >
                    {image ? (
                      <Image
                        src={image.deliveryUrl}
                        alt={image.altText || product.name}
                        fill
                        sizes="(max-width: 680px) 30vw, 150px"
                      />
                    ) : (
                      <span>{product.name}</span>
                    )}
                  </Link>
                  <div className="shop-cart-product">
                    <Link
                      href={`/products/${product.slug}`}
                      className="shop-cart-product-name"
                    >
                      {product.name}
                    </Link>
                    <span className="shop-cart-product-price">
                      {formatPrice(
                        product.priceInMinorUnits,
                        product.currencyCode,
                      )}
                    </span>
                    <div className="shop-cart-item-actions">
                      <div
                        className="shop-cart-quantity"
                        aria-label={`Quantity for ${product.name}`}
                      >
                        <button
                          type="button"
                          aria-label={`Decrease ${product.name} quantity`}
                          disabled={quantity <= 1 || accountSyncing}
                          onClick={() =>
                            setQuantity(product.id, quantity - 1)
                          }
                        >
                          <Minus aria-hidden="true" />
                        </button>
                        <span aria-live="polite">{quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase ${product.name} quantity`}
                          disabled={
                            quantity >= product.quantity || accountSyncing
                          }
                          onClick={() =>
                            setQuantity(product.id, quantity + 1)
                          }
                        >
                          <Plus aria-hidden="true" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="shop-cart-remove"
                        disabled={accountSyncing}
                        onClick={() => removeItem(product.id)}
                      >
                        <Trash2 aria-hidden="true" /> Remove
                      </button>
                    </div>
                  </div>
                  <span className="shop-cart-line-total">
                    {formatPrice(
                      product.priceInMinorUnits * quantity,
                      product.currencyCode,
                    )}
                  </span>
                </article>
              );
            })}
          </div>

          <aside className="shop-cart-summary">
            <h2>Order summary</h2>
            {Array.from(totalsByCurrency, ([currencyCode, total]) => (
              <p className="shop-cart-subtotal" key={currencyCode}>
                <span>Subtotal</span>
                <strong>{formatPrice(total, currencyCode)}</strong>
              </p>
            ))}
            <p className="shop-cart-checkout-note">
              Shipping and taxes are calculated when checkout becomes available.
            </p>
            <p className="shop-cart-checkout-note">
              Checkout is not available yet. Your cart is saved in this browser.
            </p>
            {!customer && (
              <Link
                className="shop-cart-account-link"
                href="/sign-in?callbackURL=%2Fcart"
              >
                Sign in to save your cart to your account
              </Link>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
