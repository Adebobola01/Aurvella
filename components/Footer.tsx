import Logo from "@/components/Logo";
import Link from "next/link";
import Image from "next/image";
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
          <Link href="/gifts">Gifts</Link>
          <Link href="/products?category=Necklaces">Necklaces</Link>
          <Link href="/products?category=Rings">Rings</Link>
          <Link href="/products?category=Earrings">Earrings</Link>
          <Link href="/products?category=Bracelets">Bracelets</Link>
        </nav>
        <nav aria-label="Follow Aurvella" className="shop-footer-socials">
          <a
            href="https://www.instagram.com/aurvella_jewels_?utm_source=ig_web_button_share_sheet&obrf=ZDNlZDc0MzIxNw=="
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original"
              alt=""
              width={18}
              height={18}
              unoptimized
            />
            Instagram
          </a>
          <a
            href="https://www.tiktok.com/@aurvella_jewelry?is_from_webapp=1&sender_device=pc"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a6/Tiktok_icon.svg/960px-Tiktok_icon.svg.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail"
              alt=""
              width={18}
              height={18}
              unoptimized
            />
            TikTok
          </a>
          <a
            href="https://wa.me/447831478190"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/WhatsApp_Logo_green.svg/960px-WhatsApp_Logo_green.svg.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail"
              alt=""
              width={18}
              height={18}
              unoptimized
            />
            WhatsApp
          </a>
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
