import Logo from "@/components/Logo";
import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <footer className="shop-footer">
      <div className="shop-footer-main shop-content">
        <div>
          <Link href="/" className="shop-wordmark">
            <Logo />
          </Link>
          <p>Jewelry to make your own.</p>
        </div>
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
        <span>Made to be worn, loved, and worn again.</span>
      </div>
    </footer>
  );
};

export default Footer;
