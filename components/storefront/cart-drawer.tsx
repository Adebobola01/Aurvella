"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart, type CartLine } from "@/components/storefront/cart-provider";

type CartProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  priceInMinorUnits: number;
  currencyCode: string;
  quantity: number;
  images: { deliveryUrl: string; altText: string }[];
};

function isCartProduct(value: unknown): value is CartProduct {
  if (typeof value !== "object" || value === null) return false;
  if (
    !("id" in value) ||
    typeof value.id !== "string" ||
    !("slug" in value) ||
    typeof value.slug !== "string" ||
    !("name" in value) ||
    typeof value.name !== "string" ||
    !("category" in value) ||
    typeof value.category !== "string" ||
    !("description" in value) ||
    typeof value.description !== "string" ||
    !("priceInMinorUnits" in value) ||
    typeof value.priceInMinorUnits !== "number" ||
    !("currencyCode" in value) ||
    typeof value.currencyCode !== "string" ||
    !("quantity" in value) ||
    typeof value.quantity !== "number" ||
    !("images" in value) ||
    !Array.isArray(value.images)
  ) {
    return false;
  }

  return value.images.every(
    (image) =>
      typeof image === "object" &&
      image !== null &&
      "deliveryUrl" in image &&
      typeof image.deliveryUrl === "string" &&
      "altText" in image &&
      typeof image.altText === "string",
  );
}

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

export function CartDrawer() {
  const {
    items,
    itemCount,
    hydrated,
    storageIssue,
    accountSyncing,
    cartDrawerOpen,
    setCartDrawerOpen,
    setQuantity,
    removeItem,
    replaceItems,
  } = useCart();
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stockNotice, setStockNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const [detailIndex, setDetailIndex] = useState(0);
  const detailCarouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cartDrawerOpen || !hydrated || items.length === 0) return;

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
          throw new Error("Your bag could not be refreshed. Please try again.");
        }

        const data: unknown = await response.json();
        if (
          typeof data !== "object" ||
          data === null ||
          !("products" in data) ||
          !Array.isArray(data.products) ||
          !data.products.every(isCartProduct)
        ) {
          throw new Error("Your bag returned an invalid product list.");
        }

        const refreshedProducts = data.products;
        const productsById = new Map(
          refreshedProducts.map((product) => [product.id, product]),
        );
        let updatedForStock = false;
        const nextItems = items.flatMap((item) => {
          const product = productsById.get(item.productId);
          if (!product || product.quantity < 1) {
            updatedForStock = true;
            return [];
          }
          if (item.quantity > product.quantity) {
            updatedForStock = true;
            return [{ ...item, quantity: product.quantity }];
          }
          return [item];
        });

        if (linesChanged(items, nextItems) && !replaceItems(nextItems)) {
          throw new Error("Your bag could not be saved in this browser.");
        }

        setProducts(refreshedProducts);
        setStockNotice(
          updatedForStock
            ? "Your bag was updated to reflect current stock."
            : "",
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Your bag could not be refreshed. Please try again.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadProducts();
    return () => controller.abort();
  }, [cartDrawerOpen, hydrated, items, replaceItems, retry]);

  const productsById = new Map(products.map((product) => [product.id, product]));
  const visibleItems = items.flatMap((item) => {
    const product = productsById.get(item.productId);
    return product ? [{ ...item, product }] : [];
  });
  const activeDetailIndex = Math.min(
    detailIndex,
    Math.max(visibleItems.length - 1, 0),
  );
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

  function scrollToDetail(index: number) {
    const carousel = detailCarouselRef.current;
    if (!carousel) return;

    carousel.scrollTo({
      left: index * carousel.clientWidth,
      behavior: "smooth",
    });
    setDetailIndex(index);
  }

  return (
    <Sheet open={cartDrawerOpen} onOpenChange={setCartDrawerOpen}>
      <SheetContent side="right" className="shop-cart-drawer">
        <SheetHeader className="shop-cart-drawer-header">
          <SheetTitle className="shop-cart-drawer-title">
            Your bag ({itemCount})
          </SheetTitle>
          <SheetDescription>
            Your selected pieces, ready when you are.
          </SheetDescription>
        </SheetHeader>
        {storageIssue && (
          <p className="shop-cart-alert shop-cart-drawer-alert" role="alert">
            {storageIssue}
          </p>
        )}
        {stockNotice && (
          <p className="shop-cart-notice shop-cart-drawer-alert" role="status">
            {stockNotice}
          </p>
        )}
        <div className="shop-cart-drawer-items">
          {items.length === 0 ? (
            <div className="shop-cart-drawer-message">
              <p>Your bag is empty.</p>
              <Link
                href="/products"
                className="shop-text-link"
                onClick={() => setCartDrawerOpen(false)}
              >
                Explore the collection <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          ) : !hydrated || (loading && products.length === 0) ? (
            <p className="shop-cart-drawer-message" role="status">
              Loading your bag…
            </p>
          ) : loadError && products.length === 0 ? (
            <div className="shop-cart-drawer-message" role="alert">
              <p>{loadError}</p>
              <button
                type="button"
                className="shop-cart-retry"
                onClick={() => setRetry((value) => value + 1)}
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {visibleItems.length > 0 && (
                <section
                  className="shop-cart-full-view"
                  aria-label="Full view of bag products"
                >
                  <div className="shop-cart-full-view-heading">
                    <span>View your pieces</span>
                    <div className="shop-cart-full-view-controls">
                      <span aria-live="polite">
                        {activeDetailIndex + 1} / {visibleItems.length}
                      </span>
                      <button
                        type="button"
                        aria-label="Previous product"
                        disabled={activeDetailIndex === 0}
                        onClick={() => scrollToDetail(activeDetailIndex - 1)}
                      >
                        <ArrowLeft aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next product"
                        disabled={activeDetailIndex >= visibleItems.length - 1}
                        onClick={() => scrollToDetail(activeDetailIndex + 1)}
                      >
                        <ArrowRight aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div
                    className="shop-cart-full-view-carousel"
                    ref={detailCarouselRef}
                    onScroll={(event) => {
                      const carousel = event.currentTarget;
                      if (carousel.clientWidth === 0) return;
                      setDetailIndex(
                        Math.min(
                          Math.round(carousel.scrollLeft / carousel.clientWidth),
                          visibleItems.length - 1,
                        ),
                      );
                    }}
                  >
                    {visibleItems.map(({ product, quantity }) => (
                      <article
                        className="shop-cart-full-view-slide"
                        key={product.id}
                      >
                        <Link
                          href={`/products/${product.slug}`}
                          className="shop-cart-full-view-image"
                          aria-label={`Open full product page for ${product.name}`}
                          onClick={() => setCartDrawerOpen(false)}
                        >
                          {product.images[0] ? (
                            <Image
                              src={product.images[0].deliveryUrl}
                              alt={
                                product.images[0].altText || product.name
                              }
                              fill
                              sizes="(max-width: 520px) 90vw, 460px"
                            />
                          ) : (
                            <span>{product.category}</span>
                          )}
                        </Link>
                        <div className="shop-cart-full-view-copy">
                          <p className="shop-kicker">{product.category}</p>
                          <Link
                            href={`/products/${product.slug}`}
                            className="shop-cart-full-view-name"
                            onClick={() => setCartDrawerOpen(false)}
                          >
                            {product.name}
                          </Link>
                          <span className="shop-cart-product-price">
                            {formatPrice(
                              product.priceInMinorUnits,
                              product.currencyCode,
                            )}
                          </span>
                          {product.description && (
                            <p className="shop-cart-full-view-description">
                              {product.description}
                            </p>
                          )}
                          <span className="shop-cart-full-view-quantity">
                            In your bag: {quantity}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
              <div className="shop-cart-drawer-list-heading">Your bag</div>
              {visibleItems.map(({ product, quantity }) => {
                const image = product.images[0];

                return (
                  <article className="shop-cart-drawer-item" key={product.id}>
                    <Link
                      href={`/products/${product.slug}`}
                      className="shop-cart-drawer-image"
                      aria-label={`View ${product.name}`}
                      onClick={() => setCartDrawerOpen(false)}
                    >
                      {image ? (
                        <Image
                          src={image.deliveryUrl}
                          alt={image.altText || product.name}
                          fill
                          sizes="82px"
                        />
                      ) : (
                        <span>{product.category}</span>
                      )}
                    </Link>
                    <div className="shop-cart-drawer-product">
                      <Link
                        href={`/products/${product.slug}`}
                        className="shop-cart-product-name"
                        onClick={() => setCartDrawerOpen(false)}
                      >
                        {product.name}
                      </Link>
                      <span className="shop-cart-product-price">
                        {formatPrice(
                          product.priceInMinorUnits,
                          product.currencyCode,
                        )}
                      </span>
                      <div
                        className="shop-cart-quantity"
                        aria-label={`Quantity for ${product.name}, ${product.quantity} in stock`}
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
                    </div>
                    <button
                      type="button"
                      className="shop-cart-drawer-remove"
                      aria-label={`Remove ${product.name} from bag`}
                      disabled={accountSyncing}
                      onClick={() => removeItem(product.id)}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </article>
                );
              })}
            </>
          )}
          {loadError && products.length > 0 && (
            <p className="shop-cart-alert" role="alert">
              {loadError}
            </p>
          )}
        </div>
        <div className="shop-cart-drawer-footer">
          {Array.from(totalsByCurrency, ([currencyCode, total]) => (
            <p className="shop-cart-drawer-subtotal" key={currencyCode}>
              <span>Subtotal</span>
              <strong>{formatPrice(total, currencyCode)}</strong>
            </p>
          ))}
          <p className="shop-cart-drawer-checkout-note">
            Checkout is coming soon. Your bag is saved in this browser.
          </p>
          <Button
            className="shop-cart-drawer-checkout"
            size="lg"
            disabled
            title="Checkout is not available yet"
          >
            Checkout
          </Button>
          <Link
            className="shop-cart-drawer-view-bag"
            href="/cart"
            onClick={() => setCartDrawerOpen(false)}
          >
            View full bag
          </Link>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="shop-cart-drawer-resume"
            onClick={() => setCartDrawerOpen(false)}
          >
            Resume shopping
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
