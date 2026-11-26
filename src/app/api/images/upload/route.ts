import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import {
  buildOptimizedImageKitUrl,
  MAX_IMAGES_PER_DOCUMENT,
} from "@/features/editor/lib/image-limit";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/gif",
]);

interface ImageKitRuntimeEnv {
  IMAGEKIT_PRIVATE_KEY?: string;
  IMAGEKIT_URL_ENDPOINT?: string;
  NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?: string;
}

export async function POST(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let cfEnv: ImageKitRuntimeEnv = {};
  try {
    const ctx = await getCloudflareContext({ async: true });
    cfEnv = ctx.env as ImageKitRuntimeEnv;
  } catch {
    cfEnv = {};
  }

  const privateKey =
    cfEnv.IMAGEKIT_PRIVATE_KEY ?? process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    return NextResponse.json(
      {
        error:
          "ImageKit is not configured. Add IMAGEKIT_PRIVATE_KEY to your environment.",
      },
      { status: 503 }
    );
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form payload." }, { status: 400 });
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof Blob)) {
    return NextResponse.json({ error: "Image file is required." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(fileEntry.type)) {
    return NextResponse.json(
      { error: "Unsupported image format. Use WebP, PNG, JPEG, or GIF." },
      { status: 400 }
    );
  }

  if (fileEntry.size <= 0 || fileEntry.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "Image must be smaller than 5 MB after compression." },
      { status: 400 }
    );
  }

  const rawCount = formData.get("currentImageCount");
  if (rawCount !== null) {
    const currentCount = Number(rawCount);
    if (Number.isFinite(currentCount) && currentCount >= MAX_IMAGES_PER_DOCUMENT) {
      return NextResponse.json(
        {
          error: `Maximum of ${MAX_IMAGES_PER_DOCUMENT} images per overview, sub-skill, or unit reached.`,
        },
        { status: 400 }
      );
    }
  }

  const rawName =
    fileEntry instanceof File && fileEntry.name
      ? fileEntry.name
      : `image-${Date.now()}.webp`;
  const safeFileName = rawName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const safeFolderUser = session.user.id.replace(/[^a-zA-Z0-9_-]/g, "");

  const uploadPayload = new FormData();
  uploadPayload.append("file", fileEntry, safeFileName);
  uploadPayload.append("fileName", safeFileName);
  uploadPayload.append("useUniqueFileName", "true");
  uploadPayload.append("folder", `/skills-page/${safeFolderUser}`);
  uploadPayload.append("tags", "skills-page,editor");

  const authHeader = `Basic ${btoa(`${privateKey}:`)}`;
  const ikResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: {
      Authorization: authHeader,
    },
    body: uploadPayload,
  });

  if (!ikResponse.ok) {
    const errText = await ikResponse.text().catch(() => "");
    return NextResponse.json(
      {
        error: "ImageKit upload failed.",
        details: errText.slice(0, 300),
      },
      { status: 502 }
    );
  }

  const ikData = (await ikResponse.json()) as {
    url: string;
    fileId: string;
    width?: number;
    height?: number;
    size?: number;
    thumbnailUrl?: string;
  };

  const optimizedUrl = buildOptimizedImageKitUrl(ikData.url);

  return NextResponse.json(
    {
      url: optimizedUrl,
      rawUrl: ikData.url,
      fileId: ikData.fileId,
      width: ikData.width ?? null,
      height: ikData.height ?? null,
      size: ikData.size ?? fileEntry.size,
      thumbnailUrl: ikData.thumbnailUrl ?? optimizedUrl,
    },
    { status: 201 }
  );
}
