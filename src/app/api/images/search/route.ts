import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

export type ImageProvider = "pixabay" | "unsplash";

export interface StockImageItem {
  id: string;
  previewUrl: string;
  fullUrl: string;
  alt: string;
  source: ImageProvider;
}

export async function GET(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "minimal abstract").trim();
  const rawProvider = searchParams.get("provider");
  const provider: ImageProvider =
    rawProvider === "unsplash" ? "unsplash" : "pixabay";

  if (provider === "unsplash") {
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!unsplashKey) {
      return NextResponse.json({
        images: [],
        configured: false,
        provider: "unsplash" as const,
      });
    }

    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", query);
    url.searchParams.set("orientation", "landscape");
    url.searchParams.set("per_page", "12");

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${unsplashKey}`,
        "Accept-Version": "v1",
      },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Unsplash request failed" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      results?: Array<{
        id: string;
        alt_description: string | null;
        urls: { small: string; regular: string };
      }>;
    };

    const images: StockImageItem[] = (data.results ?? []).map((item) => ({
      id: `unsplash-${item.id}`,
      previewUrl: item.urls.small,
      fullUrl: item.urls.regular,
      alt: item.alt_description || query,
      source: "unsplash",
    }));

    return NextResponse.json({
      images,
      configured: true,
      provider: "unsplash" as const,
    });
  }

  const pixabayKey = process.env.PIXABAY_API_KEY;
  if (!pixabayKey) {
    return NextResponse.json({
      images: [],
      configured: false,
      provider: "pixabay" as const,
    });
  }

  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", pixabayKey);
  url.searchParams.set("q", query);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("orientation", "horizontal");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("per_page", "12");

  const res = await fetch(url.toString());
  if (!res.ok) {
    return NextResponse.json(
      { error: "Pixabay request failed" },
      { status: 502 }
    );
  }

  const data = (await res.json()) as {
    hits?: Array<{
      id: number;
      webformatURL: string;
      largeImageURL: string;
      tags: string;
    }>;
  };

  const images: StockImageItem[] = (data.hits ?? []).map((hit) => ({
    id: `pixabay-${hit.id}`,
    previewUrl: hit.webformatURL,
    fullUrl: hit.largeImageURL,
    alt: hit.tags || query,
    source: "pixabay",
  }));

  return NextResponse.json({
    images,
    configured: true,
    provider: "pixabay" as const,
  });
}
