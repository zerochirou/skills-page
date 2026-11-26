const MAX_DIMENSION = 1440;
const TARGET_MAX_BYTES = 1_500_000;
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export interface CompressedImageResult {
  blob: Blob;
  fileName: string;
  contentType: string;
  originalSize: number;
  compressedSize: number;
  width?: number;
  height?: number;
}

function replaceExtension(name: string, ext: string): string {
  const clean = name.trim() || "pasted-image";
  const dotIdx = clean.lastIndexOf(".");
  const stem = dotIdx > 0 ? clean.slice(0, dotIdx) : clean;
  return `${stem.replace(/[^a-zA-Z0-9_-]/g, "-")}.${ext}`;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

async function decodeImageDimensions(
  file: Blob
): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; cleanup: () => void }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
      cleanup: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Failed to decode image."));
      el.src = objectUrl;
    });
    return {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    throw err;
  }
}

export async function compressImageForEditor(
  file: File
): Promise<CompressedImageResult> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(
      "Unsupported image type. Use PNG, JPEG, WebP, or GIF images."
    );
  }

  // Keep reasonably sized GIFs intact to preserve animation frames.
  if (file.type === "image/gif" && file.size <= 2_000_000) {
    return {
      blob: file,
      fileName: replaceExtension(file.name, "gif"),
      contentType: "image/gif",
      originalSize: file.size,
      compressedSize: file.size,
    };
  }

  const decoded = await decodeImageDimensions(file);
  try {
    const longestEdge = Math.max(decoded.width, decoded.height, 1);
    const scale = Math.min(1, MAX_DIMENSION / longestEdge);
    const targetWidth = Math.max(1, Math.round(decoded.width * scale));
    const targetHeight = Math.max(1, Math.round(decoded.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context unavailable for image compression.");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    decoded.draw(ctx, targetWidth, targetHeight);

    let compressed = await canvasToBlob(canvas, "image/webp", 0.82);
    let outputType = "image/webp";
    let ext = "webp";

    if (!compressed || compressed.type !== "image/webp") {
      compressed = await canvasToBlob(canvas, "image/jpeg", 0.84);
      outputType = "image/jpeg";
      ext = "jpg";
    } else if (compressed.size > TARGET_MAX_BYTES) {
      const tighter = await canvasToBlob(canvas, "image/webp", 0.72);
      if (tighter && tighter.size < compressed.size) {
        compressed = tighter;
      }
    }

    if (!compressed) {
      throw new Error("Failed to compress image.");
    }

    const withinBounds = scale === 1;
    const isAlreadyEfficient =
      withinBounds &&
      (file.type === "image/webp" || file.type === "image/jpeg") &&
      file.size <= compressed.size;

    if (isAlreadyEfficient) {
      return {
        blob: file,
        fileName: replaceExtension(
          file.name,
          file.type === "image/webp" ? "webp" : "jpg"
        ),
        contentType: file.type,
        originalSize: file.size,
        compressedSize: file.size,
        width: targetWidth,
        height: targetHeight,
      };
    }

    return {
      blob: compressed,
      fileName: replaceExtension(file.name, ext),
      contentType: outputType,
      originalSize: file.size,
      compressedSize: compressed.size,
      width: targetWidth,
      height: targetHeight,
    };
  } finally {
    decoded.cleanup();
  }
}

export function dataUrlToImageFile(dataUrl: string, name = "pasted-image"): File | null {
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/i.exec(
    dataUrl.trim()
  );
  if (!match) return null;

  const mimeType = match[1].toLowerCase();
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const ext = mimeType.split("/")[1] || "png";
  return new File([bytes], `${name}.${ext}`, { type: mimeType });
}
