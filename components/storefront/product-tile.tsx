import Image from "next/image";
import Link from "next/link";
import type { StorefrontProduct } from "@/data/storefront-products";

function formatPrice(priceInMinorUnits: number, currencyCode: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(priceInMinorUnits / 100);
}

export function ProductTile({
  product,
  priority = false,
}: {
  product: StorefrontProduct;
  priority?: boolean;
}) {
  const image = product.images[0];

  return (
    <article className="shop-product-tile">
      <Link
        className="shop-product-image"
        href={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
      >
        {image ? (
          <Image
            src={image.deliveryUrl}
            alt={image.altText || product.name}
            fill
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw"
          />
        ) : (
          <span className="shop-product-placeholder">{product.category}</span>
        )}
        {product.quantity === 0 && <span className="shop-product-badge">Sold out</span>}
        <span className="shop-product-quick-view">View details</span>
      </Link>
      <div className="shop-product-info">
        <div>
          <Link href={`/products/${product.slug}`} className="shop-product-name">
            {product.name}
          </Link>
          <p className="shop-product-category">{product.category}</p>
        </div>
        <span className="shop-product-price">
          {formatPrice(product.priceInMinorUnits, product.currencyCode)}
        </span>
      </div>
    </article>
  );
}
