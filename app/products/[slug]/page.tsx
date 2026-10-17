import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { StoreHeader } from "@/components/storefront/store-header";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { ProductImageGallery } from "@/components/storefront/product-image-gallery";
import { getStorefrontProduct } from "@/data/storefront-products";
import Footer from "@/components/Footer";

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
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/products">Jewelry</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>
        <div className="shop-product-detail-grid">
          <ProductImageGallery
            images={product.images}
            productName={product.name}
            category={product.category}
          />
          <aside className="shop-product-info-panel">
            <p className="shop-kicker">{product.category}</p>
            <h1>{product.name}</h1>
            <p className="shop-detail-price">
              {formatPrice(product.priceInMinorUnits, product.currencyCode)}
            </p>
            <div className="shop-detail-divider" />
            <p className="shop-detail-description">
              {product.description ||
                "A beautiful addition to your everyday jewelry collection."}
            </p>
            <p className="shop-detail-stock">
              <span
                className={
                  product.quantity > 0
                    ? "shop-stock-dot"
                    : "shop-stock-dot is-sold"
                }
              />
              {product.quantity > 0 ? "In stock" : "Currently unavailable"}
            </p>
            <AddToCartButton
              productId={product.id}
              availableQuantity={product.quantity}
            />
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
      <Footer />
    </div>
  );
}
