const MAX_CART_LINES = 50;

export async function GET(request: Request) {
  const ids = Array.from(new Set(new URL(request.url).searchParams.getAll("id")));

  if (
    ids.length === 0 ||
    ids.length > MAX_CART_LINES ||
    ids.some((id) => id.length === 0 || id.length > 100)
  ) {
    return Response.json({ error: "Invalid cart product IDs." }, { status: 400 });
  }

  const { db } = await import("@/lib/db");
  const products = await db.product.findMany({
    where: { id: { in: ids }, status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      priceInMinorUnits: true,
      currencyCode: true,
      quantity: true,
      images: {
        orderBy: { displayOrder: "asc" },
        select: { deliveryUrl: true, altText: true },
      },
    },
  });

  return Response.json({ products });
}
