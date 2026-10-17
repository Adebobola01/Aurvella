import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { StoreHeader } from "@/components/storefront/store-header";
import Footer from "@/components/Footer";

const giftCategories = [
  {
    name: "Necklaces",
    description: "A keepsake to wear close.",
    image: "/images/necklace.jpeg",
    alt: "Gold pendant necklace",
  },
  {
    name: "Earrings",
    description: "A thoughtful finishing touch.",
    image: "/images/earring.jpeg",
    alt: "Gemstone earrings",
  },
  {
    name: "Bracelets",
    description: "An everyday reminder.",
    image: "/images/category-bracelets.jpg",
    alt: "Delicate gold bracelet",
  },
  {
    name: "Rings",
    description: "A little detail with meaning.",
    image: "/images/editorial-ring.jpg",
    alt: "Rose-gold ring with a pink gemstone",
  },
];

export default function GiftsPage() {
  return (
    <div className="storefront shop-gifts-page">
      <StoreHeader />
      <main className="shop-content shop-gifts-main">
        <nav className="shop-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Gifts</span>
        </nav>
        <section className="shop-gifts-intro">
          <p className="shop-kicker">THE AURVELLA GIFT GUIDE</p>
          <h1>Give them a piece to keep.</h1>
          <p>
            Find a thoughtful little something for the people and moments that
            matter.
          </p>
          <Link href="/products" className="shop-button shop-button-dark">
            Shop all jewelry <ArrowRight aria-hidden="true" />
          </Link>
        </section>
        <section className="shop-gift-categories" aria-labelledby="gift-picks">
          <div className="shop-section-heading">
            <div>
              <p className="shop-kicker">A THOUGHTFUL PLACE TO START</p>
              <h2 id="gift-picks">Find their kind of lovely</h2>
            </div>
          </div>
          <div className="shop-category-grid">
            {giftCategories.map((category) => (
              <Link
                className="shop-category-card"
                href={`/products?category=${encodeURIComponent(category.name)}`}
                key={category.name}
              >
                <span className="shop-category-image">
                  <Image
                    src={category.image}
                    alt={category.alt}
                    fill
                    sizes="(max-width: 1000px) 50vw, 25vw"
                  />
                  <span className="shop-category-arrow">
                    <ArrowUpRight aria-hidden="true" />
                  </span>
                </span>
                <span className="shop-category-name">{category.name}</span>
                <span className="shop-category-subtitle">
                  {category.description}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
