"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

type ProductImage = {
  id: string;
  deliveryUrl: string;
  altText: string;
};

export function ProductImageGallery({
  images,
  productName,
  category,
}: {
  images: ProductImage[];
  productName: string;
  category: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const requestedIndex = useRef(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      const carousel = carouselRef.current;
      if (!carousel) return;
      carousel.scrollLeft = requestedIndex.current * carousel.clientWidth;
    });

    return () => cancelAnimationFrame(frame);
  }, [open]);

  function openAt(index: number) {
    requestedIndex.current = index;
    setActiveIndex(index);
    setOpen(true);
  }

  function scrollToImage(index: number) {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const nextIndex = Math.max(0, Math.min(index, images.length - 1));
    requestedIndex.current = nextIndex;
    setActiveIndex(nextIndex);
    carousel.scrollTo({
      left: nextIndex * carousel.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <>
      <div className="shop-product-gallery">
        {images.length ? (
          images.map((image, index) => (
            <button
              className="shop-detail-image"
              key={image.id}
              type="button"
              aria-label={`View image ${index + 1} of ${images.length} for ${productName} full screen`}
              onClick={() => openAt(index)}
            >
              <Image
                src={image.deliveryUrl}
                alt={image.altText || productName}
                fill
                preload={index === 0}
                sizes="(max-width: 760px) 100vw, 58vw"
              />
              {index === 0 && images.length > 1 && (
                <span className="shop-image-count">
                  {String(index + 1).padStart(2, "0")} /{" "}
                  {String(images.length).padStart(2, "0")}
                </span>
              )}
            </button>
          ))
        ) : (
          <div className="shop-detail-no-image">
            <span>{category}</span>
          </div>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="top"
          className="shop-image-lightbox"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">
            {productName} images
          </SheetTitle>
          <SheetDescription className="sr-only">
            Full-screen product images. Swipe or use the previous and next
            buttons to browse.
          </SheetDescription>
          <div className="shop-image-lightbox-toolbar">
            <button
              type="button"
              aria-label="Previous product image"
              disabled={activeIndex <= 0}
              onClick={() => scrollToImage(activeIndex - 1)}
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <span aria-live="polite">
              {activeIndex + 1} / {images.length}
            </span>
            <div className="shop-image-lightbox-toolbar-actions">
              <button
                type="button"
                aria-label="Next product image"
                disabled={activeIndex >= images.length - 1}
                onClick={() => scrollToImage(activeIndex + 1)}
              >
                <ArrowRight aria-hidden="true" />
              </button>
              <SheetClose
                className="shop-image-lightbox-close"
                aria-label="Close full-screen images"
              >
                <X aria-hidden="true" />
              </SheetClose>
            </div>
          </div>
          <div
            className="shop-image-lightbox-track"
            ref={carouselRef}
            onScroll={(event) => {
              const carousel = event.currentTarget;
              if (!carousel.clientWidth) return;
              const index = Math.min(
                Math.round(carousel.scrollLeft / carousel.clientWidth),
                images.length - 1,
              );
              requestedIndex.current = index;
              setActiveIndex(index);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                scrollToImage(activeIndex - 1);
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                scrollToImage(activeIndex + 1);
              }
            }}
            tabIndex={0}
            aria-label="Product image carousel"
          >
            {images.map((image, index) => (
              <div className="shop-image-lightbox-slide" key={image.id}>
                <Image
                  src={image.deliveryUrl}
                  alt={
                    image.altText ||
                    `${productName}, image ${index + 1} of ${images.length}`
                  }
                  fill
                  sizes="100vw"
                />
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
