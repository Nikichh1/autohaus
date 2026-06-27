import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * Storage abstraction. Today it writes optimized WebP to /public/uploads so the
 * app is fully functional with zero infrastructure. In production, swap the body
 * of saveImage()/deleteImage() for an S3/R2 client — the call sites don't change.
 */

const PUBLIC_DIR = path.join(process.cwd(), "public");
const REL_DIR = path.join("uploads", "vehicles");

export type StoredImage = {
  url: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
};

export async function saveImage(file: File, subdir = "vehicles"): Promise<StoredImage> {
  const relDir = `uploads/${subdir}`;
  const absDir = path.join(PUBLIC_DIR, "uploads", subdir);
  const input = Buffer.from(await file.arrayBuffer());
  await mkdir(absDir, { recursive: true });
  const id = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(input, { failOn: "none" }).metadata();
    const out = await sharp(input, { failOn: "none" })
      .rotate() // honor EXIF orientation
      .resize({ width: 2560, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const name = `${id}.webp`;
    await writeFile(path.join(absDir, name), out);

    const srcW = meta.width ?? null;
    const srcH = meta.height ?? null;
    const width = srcW ? Math.min(srcW, 2560) : null;
    const height = srcW && srcH && width ? Math.round((srcH * width) / srcW) : srcH;

    return { url: `/${relDir}/${name}`, width, height, sizeBytes: out.length };
  } catch {
    // sharp unavailable / non-image → store the original bytes untouched.
    const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const name = `${id}.${ext}`;
    await writeFile(path.join(absDir, name), input);
    return { url: `/${relDir}/${name}`, width: null, height: null, sizeBytes: input.length };
  }
}

export async function deleteImage(url: string): Promise<void> {
  // Only delete files we own under /uploads/vehicles.
  if (!url.startsWith(`/${REL_DIR.replace(/\\/g, "/")}/`)) return;
  const abs = path.join(PUBLIC_DIR, url);
  try {
    await unlink(abs);
  } catch {
    // already gone — ignore
  }
}

// ── Audio (engine sound) ─────────────────────────────────────────────────────
const AUDIO_REL_DIR = path.join("uploads", "audio");
const AUDIO_ABS_DIR = path.join(PUBLIC_DIR, AUDIO_REL_DIR);

const AUDIO_EXT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/aac": "m4a",
};

export type StoredAudio = { url: string; sizeBytes: number; format: string };

export function audioFormatFor(mime: string, name: string): string | null {
  if (AUDIO_EXT[mime]) return AUDIO_EXT[mime];
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "mp3" || ext === "wav" || ext === "m4a") return ext;
  return null;
}

export async function saveAudio(file: File, format: string): Promise<StoredAudio> {
  const buf = Buffer.from(await file.arrayBuffer());
  await mkdir(AUDIO_ABS_DIR, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${format}`;
  await writeFile(path.join(AUDIO_ABS_DIR, name), buf);
  return {
    url: `/${AUDIO_REL_DIR.replace(/\\/g, "/")}/${name}`,
    sizeBytes: buf.length,
    format,
  };
}

/** Delete any file we own under /uploads (images or audio). */
export async function deleteUpload(url: string): Promise<void> {
  if (!url.startsWith("/uploads/")) return;
  try {
    await unlink(path.join(PUBLIC_DIR, url));
  } catch {
    // already gone — ignore
  }
}
