import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isProductCategory } from "@/lib/product-catalog";

const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  category: true,
  priceInMinorUnits: true,
  currencyCode: true,
  quantity: true,
  images: {
    orderBy: { displayOrder: "asc" },
    take: 1,
    select: { deliveryUrl: true, altText: true },
  },
} satisfies Prisma.ProductSelect;

export type StorefrontProduct = Prisma.ProductGetPayload<{
  select: typeof productCardSelect;
}>;

export async function getFeaturedProducts() {
  return db.product.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 4,
    select: productCardSelect,
  });
}

export async function getStorefrontProducts({
  search,
  category,
  sort,
  page,
}: {
  search: string;
  category: string;
  sort: string;
  page: number;
}) {
  const conditions: Prisma.ProductWhereInput[] = [{ status: "PUBLISHED" }];

  if (isProductCategory(category)) {
    conditions.push({ category });
  }
  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
      ],
    });
  }

  const where: Prisma.ProductWhereInput = { AND: conditions };
  const pageSize = 12;
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price-low"
      ? { priceInMinorUnits: "asc" }
      : sort === "price-high"
        ? { priceInMinorUnits: "desc" }
        : { createdAt: "desc" };

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: [orderBy, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: productCardSelect,
    }),
  ]);

  return {
    products,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getStorefrontProduct(slug: string) {
  return db.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      category: true,
      priceInMinorUnits: true,
      currencyCode: true,
      quantity: true,
      images: {
        orderBy: { displayOrder: "asc" },
        select: { id: true, deliveryUrl: true, altText: true },
      },
    },
  });
}
