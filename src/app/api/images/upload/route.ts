import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import {
  buildOptimizedImageKitUrl,
  MAX_IMAGES_PER_DOCUMENT,
} from "@/features/editor/lib/image-limit";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_REMOTE_FETCH_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/avif",
]);

interface ImageKitRuntimeEnv {
  IMAGEKIT_PRIVATE_KEY?: string;
  IMAGEKIT_URL_ENDPOINT?: string;
  NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?: string;
}

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host.startsWith("fe80:") ||
    host.startsWith("fc") ||
    host.startsWith("fd")
  ) {
    return true;
  }

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!ipv4) return false;
  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

async function fetchPublicImageBlob(rawUrl: string): Promise<{
  blob: Blob;
  fileName: string;
}> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("Invalid image URL.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only http and https image URLs are supported.");
  }

  if (isBlockedHost(parsed.hostname)) {
    throw new Error("Private or local image URLs cannot be imported.");
  }

  const res = await fetch(parsed.toString(), {
    headers: {
      Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`Unable to fetch copied image (HTTP ${res.status}).`);
  }

  const finalParsed = new URL(res.url || parsed.toString());
  if (isBlockedHost(finalParsed.hostname)) {
    throw new Error("Redirected image host is not allowed.");
  }

  const contentType = (res.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (!contentType.startsWith("image/")) {
    throw new Error("Copied URL did not return a valid image.");
  }

  const contentLength = Number(res.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REMOTE_FETCH_BYTES) {
    throw new Error("Copied image exceeds the 10 MB import limit.");
  }

  const buffer = await res.arrayBuffer();
  if (buffer.byteLength <= 0 || buffer.byteLength > MAX_REMOTE_FETCH_BYTES) {
    throw new Error("Copied image must be smaller than 10 MB.");
  }

  const ext = contentType.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "png";
  const pathStem =
    parsed.pathname.split("/").pop()?.replace(/\.[^.]+$/, "") || "copied-image";
  const safeStem = pathStem.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 48) || "copied-image";

  return {
    blob: new Blob([buffer], { type: contentType }),
    fileName: `${safeStem}.${ext === "jpeg" ? "jpg" : ext}`,
  };
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

  const privateKey = (
    cfEnv.IMAGEKIT_PRIVATE_KEY ||
    process.env.IMAGEKIT_PRIVATE_KEY ||
    ""
  ).trim();
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

  const fileEntry = formData.get("file");
  const imageUrlEntry = formData.get("imageUrl");

  let uploadBlob: Blob;
  let safeFileName: string;

  if (fileEntry instanceof Blob) {
    if (!ALLOWED_TYPES.has(fileEntry.type)) {
      return NextResponse.json(
        { error: "Unsupported image format. Use WebP, PNG, JPEG, GIF, or AVIF." },
        { status: 400 }
      );
    }

    if (fileEntry.size <= 0 || fileEntry.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Image must be smaller than 5 MB after compression." },
        { status: 400 }
      );
    }

    const rawName =
      fileEntry instanceof File && fileEntry.name
        ? fileEntry.name
        : `image-${Date.now()}.webp`;
    safeFileName = rawName.replace(/[^a-zA-Z0-9._-]/g, "-");
    uploadBlob = fileEntry;
  } else if (typeof imageUrlEntry === "string" && imageUrlEntry.trim()) {
    try {
      const fetched = await fetchPublicImageBlob(imageUrlEntry);
      uploadBlob = fetched.blob;
      safeFileName = fetched.fileName;
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Failed to fetch copied image URL.",
        },
        { status: 400 }
      );
    }
  } else {
    return NextResponse.json(
      { error: "Image file or image URL is required." },
      { status: 400 }
    );
  }

  const safeFolderUser = session.user.id.replace(/[^a-zA-Z0-9_-]/g, "");

  const uploadPayload = new FormData();
  uploadPayload.append("file", uploadBlob, safeFileName);
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
    let parsedMessage = "ImageKit upload failed.";
    try {
      const parsedErr = JSON.parse(errText) as { message?: string };
      if (parsedErr?.message) {
        parsedMessage = `ImageKit upload failed: ${parsedErr.message}`;
      }
    } catch {
      if (errText.trim()) {
        parsedMessage = `ImageKit upload failed: ${errText.slice(0, 200)}`;
      }
    }

    return NextResponse.json(
      {
        error: parsedMessage,
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
      size: ikData.size ?? uploadBlob.size,
      thumbnailUrl: ikData.thumbnailUrl ?? optimizedUrl,
    },
    { status: 201 }
  );
}
