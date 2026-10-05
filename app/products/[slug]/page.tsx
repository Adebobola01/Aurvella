import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { StoreHeader } from "@/components/storefront/store-header";
import { getStorefrontProduct } from "@/data/storefront-products";

function formatPrice(priceInMinorUnits: number, currencyCode: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(priceInMinorUnits / 100);
}

export default async function ProductDetailPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);

  if (!product) notFound();

  return (
    <div className="storefront">
      <StoreHeader />
      <main className="shop-product-detail shop-content">
        <nav className="shop-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>/</span>
          <Link href="/products">Jewelry</Link><span>/</span>
          <span>{product.name}</span>
        </nav>
        <div className="shop-product-detail-grid">
          <div className="shop-product-gallery">
            {product.images.length ? (
              product.images.map((image, index) => (
                <div className="shop-detail-image" key={image.id}>
                  <Image
                    src={image.deliveryUrl}
                    alt={image.altText || product.name}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 760px) 100vw, 58vw"
                  />
                  {index === 0 && product.images.length > 1 && (
                    <span className="shop-image-count">
                      {String(index + 1).padStart(2, "0")} / {String(product.images.length).padStart(2, "0")}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="shop-detail-no-image">
                <span>{product.category}</span>
              </div>
            )}
          </div>
          <aside className="shop-product-info-panel">
            <p className="shop-kicker">{product.category}</p>
            <h1>{product.name}</h1>
            <p className="shop-detail-price">
              {formatPrice(product.priceInMinorUnits, product.currencyCode)}
            </p>
            <div className="shop-detail-divider" />
            <p className="shop-detail-description">
              {product.description || "A beautiful addition to your everyday jewelry collection."}
            </p>
            <p className="shop-detail-stock">
              <span className={product.quantity > 0 ? "shop-stock-dot" : "shop-stock-dot is-sold"} />
              {product.quantity > 0
                ? "In stock"
                : "Currently unavailable"}
            </p>
            <div className="shop-detail-notice">
              <p>Looking for something special?</p>
              <Link href="/products">
                Explore more jewelry <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>
        <div className="shop-back-link">
          <Link href="/products">
          <ArrowLeft aria-hidden="true" /> Back to all jewelry
          </Link>
        </div>
      </main>
      <footer className="shop-footer">
        <div className="shop-footer-main shop-content">
          <div><Link href="/" className="shop-wordmark">aurvella<span>®</span></Link></div>
          <nav aria-label="Shop jewelry">
            <Link href="/products">All jewelry</Link>
            <Link href="/products?category=Necklaces">Necklaces</Link>
            <Link href="/products?category=Rings">Rings</Link>
            <Link href="/products?category=Earrings">Earrings</Link>
            <Link href="/products?category=Bracelets">Bracelets</Link>
          </nav>
        </div>
        <div className="shop-footer-bottom shop-content">
          <span>© {new Date().getFullYear()} Aurvella</span>
          <span>Jewelry to make your own.</span>
        </div>
      </footer>
    </div>
  );
}
