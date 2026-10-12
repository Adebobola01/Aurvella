import Link from "next/link";
import { StoreHeader } from "@/components/storefront/store-header";
import { CartContents } from "@/components/storefront/cart-contents";
import Footer from "@/components/Footer";

export default function CartPage() {
  return (
    <div className="storefront">
      <StoreHeader />
      <main className="shop-cart-page shop-content">
        <nav className="shop-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Shopping bag</span>
        </nav>
        <CartContents />
      </main>
      <Footer />
    </div>
  );
}
