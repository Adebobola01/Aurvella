export const PRODUCT_CATEGORIES = [
  "Rings",
  "Necklaces",
  "Earrings",
  "Bracelets",
  "Anklets",
  "Brooches",
  "Jewelry sets",
  "Other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export function isProductCategory(value: string): value is ProductCategory {
  return PRODUCT_CATEGORIES.some((category) => category === value);
}

export function normalizeProductCategory(value: string): ProductCategory {
  if (isProductCategory(value)) {
    return value;
  }

  const legacyCategories: Record<string, ProductCategory> = {
    ring: "Rings",
    necklace: "Necklaces",
    earring: "Earrings",
    bracelet: "Bracelets",
    anklet: "Anklets",
    brooch: "Brooches",
    "jewelry set": "Jewelry sets",
  };

  return legacyCategories[value.trim().toLowerCase()] ?? "Other";
}
