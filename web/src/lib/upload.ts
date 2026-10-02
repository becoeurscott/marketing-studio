import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" };
export class UploadError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

/** Read incrementally: untrusted content-length is never the only size check. */
export async function readUpload(request: Request): Promise<Buffer> {
  const advertised = Number(request.headers.get("content-length"));
  if (advertised > MAX_UPLOAD_BYTES) throw new UploadError("Photo trop lourde (4 Mo maximum).", 413);
  if (!request.body) throw new UploadError("Photo manquante.", 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_UPLOAD_BYTES) throw new UploadError("Photo trop lourde (4 Mo maximum).", 413);
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally { reader.releaseLock(); }
  if (!size) throw new UploadError("Photo vide.", 400);
  return Buffer.concat(chunks);
}

/** Decode and re-encode rather than trusting the MIME header; omit embedded metadata. */
export async function normalizePhoto(request: Request): Promise<Buffer> {
  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!TYPES[type]) throw new UploadError("Format non pris en charge : utilisez JPG, PNG ou WebP.", 415);
  const bytes = await readUpload(request);
  try {
    const image = sharp(bytes, { limitInputPixels: 16_000_000, failOn: "warning" });
    const info = await image.metadata();
    if (info.format !== TYPES[type] || (info.pages ?? 1) > 1 || !info.width || !info.height) {
      throw new UploadError("Photo invalide ou animée. Utilisez une image fixe.", 422);
    }
    const output = await image.rotate().jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    if (output.byteLength > MAX_UPLOAD_BYTES) throw new UploadError("Photo trop lourde après conversion (4 Mo maximum).", 413);
    return output;
  } catch (error) {
    if (error instanceof UploadError) throw error;
    throw new UploadError("Impossible de lire cette photo. Utilisez un JPG, PNG ou WebP valide de 16 mégapixels maximum.", 422);
  }
}
