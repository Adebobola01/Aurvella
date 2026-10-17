import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ProductTile } from "@/components/storefront/product-tile";
import { FadeIn, Reveal } from "@/components/storefront/reveal";
import { StoreHeader } from "@/components/storefront/store-header";
import {
  getBestSellerProducts,
  getFeaturedProducts,
} from "@/data/storefront-products";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

const categories = [
  {
    name: "Necklaces",
    image: "/images/necklace.jpeg",
    alt: "Gold pendant necklaces on a warm background",
  },
  {
    name: "Rings",
    image: "/images/editorial-ring.jpg",
    alt: "A rose-gold ring with a pink gemstone",
  },
  {
    name: "Earrings",
    image: "/images/earring.jpeg",
    alt: "Statement gemstone earrings against a green leaf",
  },
  {
    name: "Bracelets",
    image: "/images/category-bracelets.jpg",
    alt: "A delicate gold bracelet on a soft pink background",
  },
  {
    name: "wristwatches",
    image: "/images/wristwatch.jpeg",
    alt: "A delicate gold bracelet on a soft pink background",
  },
  {
    name: "Brooches",
    image: "/images/brooch.jpeg",
    alt: "A delicate gold bracelet on a soft pink background",
  },
];

export default async function Home() {
  const [featured, bestSellers] = await Promise.all([
    getFeaturedProducts(),
    getBestSellerProducts(),
  ]);

  return (
    <div className="storefront">
      <StoreHeader />
      <main>
        <section className="shop-hero">
          <Image
            src="/images/hero.jpeg"
            alt="Layered necklaces worn with a white blouse"
            fill
            priority
            sizes="100vw"
            className="shop-hero-image"
          />
          <div className="shop-hero-shade" />
          <FadeIn className="shop-hero-copy">
            <p className="shop-kicker">
              JEWELRY FOR EVERY DAY & EVERYTHING AFTER
            </p>
            <h1>
              Find the piece
              <br />
              that feels like <em>you.</em>
            </h1>
            <p>
              The finishing touch, the first thing you put on, the piece that
              never leaves your side.
            </p>
            <Link href="/products" className="shop-button shop-button-light">
              Shop all jewelry <ArrowRight aria-hidden="true" />
            </Link>
          </FadeIn>
          <span className="shop-hero-caption">THE AURVELLA COLLECTION</span>
        </section>

        <section className="shop-category-section shop-content">
          <div className="shop-section-heading">
            <div>
              <p className="shop-kicker">FIND YOUR FAVORITE</p>
              <h2>Shop by category</h2>
            </div>
            <Link className="shop-text-link" href="/products">
              View all jewelry <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
          <div className="shop-category-scrollable">
            {categories.map((category, index) => (
              <Reveal key={category.name} delay={index * 0.04}>
                <Link
                  className="shop-category-card"
                  href={`/products?category=${encodeURIComponent(category.name)}`}
                >
                  <span className="shop-category-image">
                    <Image
                      src={category.image}
                      alt={category.alt}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1000px) 25vw, 280px"
                    />
                    <span className="shop-category-arrow">
                      <ArrowUpRight aria-hidden="true" />
                    </span>
                  </span>
                  <span className="shop-category-name">{category.name}</span>
                  <span className="shop-category-subtitle">
                    Shop {category.name.toLowerCase()}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="shop-featured-section">
          <div className="shop-content">
            <div className="shop-section-heading">
              <div>
                <p className="shop-kicker">THE LATEST FINDS</p>
                <h2>Just added</h2>
              </div>
              <Link className="shop-text-link" href="/products?sort=newest">
                Shop the collection <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
            {featured.length ? (
              <div className="shop-product-grid">
                {featured.map((product, index) => (
                  <Reveal key={product.id} delay={index * 0.04}>
                    <ProductTile product={product} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="shop-empty-products">
                <span className="shop-empty-mark" aria-hidden="true">
                  A
                </span>
                <div>
                  <h3>New favorites are on the way.</h3>
                  <p>
                    In the meantime, find your next favorite in the collection.
                  </p>
                </div>
                <Link href="/products" className="shop-button shop-button-dark">
                  Browse jewelry <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="shop-best-sellers-section">
          <div className="shop-content">
            <div className="shop-section-heading">
              <div>
                <p className="shop-kicker">THE AURVELLA EDIT</p>
                <h2>Best Sellers</h2>
              </div>
              <Link className="shop-text-link" href="/products">
                Shop all jewelry <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
            {bestSellers.length ? (
              <div className="shop-product-grid">
                {bestSellers.map((product, index) => (
                  <Reveal key={product.id} delay={index * 0.04}>
                    <ProductTile product={product} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="shop-empty-products">
                <span className="shop-empty-mark" aria-hidden="true">
                  A
                </span>
                <div>
                  <h3>Our best-loved pieces are coming soon.</h3>
                  <p>
                    Explore the collection while we put together this edit.
                  </p>
                </div>
                <Link href="/products" className="shop-button shop-button-dark">
                  Browse jewelry <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="shop-story shop-content">
          <div className="shop-story-image">
            <Image
              src="/images/editorial-still-life.jpg"
              alt="Gold hoop earrings catching the afternoon light"
              fill
              sizes="(max-width: 760px) 100vw, 50vw"
            />
          </div>
          <div className="shop-story-copy">
            <p className="shop-kicker">THE AURVELLA EDIT</p>
            <h2>
              A little detail.
              <br />A whole new feeling.
            </h2>
            <p>
              Start with a favorite shape, then make it part of your everyday.
              There&apos;s always a reason to wear the good pieces.
            </p>
            <Link href="/products" className="shop-text-link">
              Find your piece <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
