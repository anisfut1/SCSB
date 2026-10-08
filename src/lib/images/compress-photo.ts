/**
 * Compression d'une photo DANS LE NAVIGATEUR avant envoi (retour du club,
 * 2026-10-08 : "compresser au max pour pas que ce soit lourd") : recadrage
 * carré centré, 512 × 512 px, WebP (JPEG si le navigateur ne sait pas
 * encoder le WebP, ex. anciens Safari). Une photo de téléphone de 3-5 Mo
 * tombe autour de 30-60 Ko. Orientation EXIF respectée.
 */
export const PHOTO_SIZE_PX = 512;

export interface CompressedPhoto {
  contentType: "image/webp" | "image/jpeg";
  base64: string;
  bytes: number;
}

export async function compressPhoto(file: File): Promise<CompressedPhoto> {
  if (!file.type.startsWith("image/")) throw new Error("Ce fichier n'est pas une image.");
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => {
    throw new Error("Image illisible par le navigateur (essaie en JPEG ou PNG).");
  });

  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const target = Math.min(PHOTO_SIZE_PX, side);

  const canvas = document.createElement("canvas");
  canvas.width = target;
  canvas.height = target;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Compression impossible sur ce navigateur.");
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, sx, sy, side, side, 0, 0, target, target);
  bitmap.close();

  let blob = await toBlob(canvas, "image/webp", 0.78);
  if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", 0.8);
  if (!blob) throw new Error("Compression impossible sur ce navigateur.");

  const buffer = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buffer.length; i += 0x8000) binary += String.fromCharCode(...buffer.subarray(i, i + 0x8000));
  return { contentType: blob.type === "image/webp" ? "image/webp" : "image/jpeg", base64: btoa(binary), bytes: buffer.length };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
