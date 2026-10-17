"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Form from "next/form";
import Logo from "@/components/Logo";
import { useCart } from "@/components/storefront/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const navLinks = [
  { href: "/products", label: "All jewelry" },
  { href: "/products?sort=newest", label: "New arrivals" },
  { href: "/gifts", label: "Gifts" },
  { href: "/products?category=Rings", label: "Rings" },
  { href: "/products?category=Necklaces", label: "Necklaces" },
  { href: "/products?category=Earrings", label: "Earrings" },
  { href: "/products?category=Bracelets", label: "Bracelets" },
];

export function StoreHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { itemCount, customer } = useCart();
  const accountHref = customer ? "/account" : "/sign-in?callbackURL=%2Faccount";
  const accountLabel = customer ? "My account" : "Sign in";

  return (
    <header className="shop-header">
      <div className="shop-announcement">
        <span>Jewelry for every day & everything after</span>
        <Link href="/products">
          Discover the collection <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="shop-header-main shop-content">
        <div className="shop-mobile-trigger-wrap">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              className="shop-icon-button"
              aria-label="Open navigation menu"
            >
              <Menu aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="left" className="shop-mobile-sheet">
              <SheetHeader>
                <SheetTitle>
                  <Link href="/" className="shop-wordmark">
                    <Logo />
                  </Link>
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
                <Link
                  href={accountHref}
                  className="shop-mobile-link"
                  onClick={() => setMenuOpen(false)}
                >
                  {accountLabel}
                </Link>
              </nav>
              <button
                type="button"
                className="shop-mobile-search"
                onClick={() => {
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
              >
                <Search aria-hidden="true" /> Search the collection
              </button>
            </SheetContent>
          </Sheet>
        </div>
        <Link href="/" className="shop-wordmark" aria-label="Aurvella home">
          <Logo />
        </Link>
        <div className="shop-header-actions">
          <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
            <SheetTrigger className="shop-search-link" aria-label="Search jewelry">
              <Search aria-hidden="true" />
              <span>Search</span>
            </SheetTrigger>
            <SheetContent side="top" className="shop-search-sheet">
              <div className="shop-search-panel">
                <SheetTitle className="shop-search-title">
                  What are you looking for?
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Search Aurvella jewelry by name, description, or category.
                </SheetDescription>
                <Form
                  action="/products"
                  className="shop-search-form"
                  onSubmit={() => setSearchOpen(false)}
                >
                  <label className="shop-search-field">
                    <Search aria-hidden="true" />
                    <Input
                      type="search"
                      name="q"
                      maxLength={100}
                      placeholder="Try rings, necklaces, or a style"
                      aria-label="Search products"
                      autoFocus
                    />
                  </label>
                  <Button
                    type="submit"
                    size="lg"
                    className="shop-filter-submit"
                  >
                    Search
                  </Button>
                </Form>
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/products" className="shop-header-browse">
            Shop jewelry <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/cart"
            className="shop-cart-header-link"
            aria-label={`Shopping bag, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
          >
            <ShoppingBag aria-hidden="true" />
            <span>Cart</span>
            <span className="shop-cart-count" aria-hidden="true">
              {itemCount}
            </span>
          </Link>
          <Link
            href={accountHref}
            className="shop-account-header-link"
            aria-label={accountLabel}
          >
            <UserRound aria-hidden="true" />
            <span>{accountLabel}</span>
          </Link>
        </div>
      </div>
      <nav className="shop-primary-nav" aria-label="Main navigation">
        {navLinks.map((link) => (
          <Link href={link.href} key={link.label}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
