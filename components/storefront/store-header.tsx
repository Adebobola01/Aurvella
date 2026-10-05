"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/products", label: "All jewelry" },
  { href: "/products?sort=newest", label: "New arrivals" },
  { href: "/products?category=Rings", label: "Rings" },
  { href: "/products?category=Necklaces", label: "Necklaces" },
  { href: "/products?category=Earrings", label: "Earrings" },
  { href: "/products?category=Bracelets", label: "Bracelets" },
];

export function StoreHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="shop-header">
      <div className="shop-announcement">
        <span>Jewelry for every day & everything after</span>
        <Link href="/products">Discover the collection <span aria-hidden="true">→</span></Link>
      </div>
      <div className="shop-header-main shop-content">
        <div className="shop-mobile-trigger-wrap">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger className="shop-icon-button" aria-label="Open navigation menu">
              <Menu aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="left" className="shop-mobile-sheet">
              <SheetHeader>
                <SheetTitle>
                  <Link href="/" className="shop-wordmark">aurvella<span>®</span></Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="shop-mobile-links" aria-label="Mobile navigation">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="shop-mobile-link"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <Link
                href="/products"
                className="shop-mobile-search"
                onClick={() => setMenuOpen(false)}
              >
                <Search aria-hidden="true" /> Search the collection
              </Link>
            </SheetContent>
          </Sheet>
        </div>
        <Link href="/" className="shop-wordmark" aria-label="Aurvella home">
          aurvella<span>®</span>
        </Link>
        <div className="shop-header-actions">
          <Link href="/products" className="shop-search-link" aria-label="Search jewelry">
            <Search aria-hidden="true" /><span>Search</span>
          </Link>
          <Link href="/products" className="shop-header-browse">
            Shop jewelry <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
      <nav className="shop-primary-nav" aria-label="Shop by category">
        {navLinks.map((link) => (
          <Link href={link.href} key={link.label}>{link.label}</Link>
        ))}
      </nav>
    </header>
  );
}
