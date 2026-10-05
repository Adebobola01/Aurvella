import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import {
  createCloudflareUpload,
  isAllowedProductImage,
} from "@/lib/cloudflare-images";

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  if (typeof input !== "object" || input === null) {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const { contentType, byteSize, altText } = input as Record<string, unknown>;

  if (
    typeof contentType !== "string" ||
    typeof byteSize !== "number" ||
    !isAllowedProductImage({ contentType, byteSize }) ||
    typeof altText !== "string" ||
    altText.length > 200
  ) {
    return NextResponse.json(
      { error: "Choose a supported image up to 10 MB and valid alt text." },
      { status: 400 },
    );
  }

  try {
    const upload = await createCloudflareUpload({ altText: altText.trim() });

    return NextResponse.json(
      {
        uploadURL: upload.uploadURL,
        ticket: upload.ticket,
        deliveryURL: upload.deliveryURL,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Unable to create a Cloudflare product image upload.", error);
    return NextResponse.json(
      { error: "Image upload is unavailable. Check the Cloudflare setup." },
      { status: 503 },
    );
  }
}
