import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Always stored as "raw" — regardless of file type (pdf, doc, docx, jpg, png, ...).
// Cloudinary's "image" resource type (needed for its own PDF/image transformation
// pipeline) is blocked by this account's security restrictions on authenticated
// delivery, and "raw" delivery doesn't let Cloudinary set a reliable Content-Type
// or avoid forcing Content-Disposition: attachment. We work around both by fetching
// the raw bytes server-side and serving them ourselves with the correct headers,
// sourced from our own DB (fileName/mimeType) rather than Cloudinary's guesses.
const RESOURCE_TYPE = "raw";

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
): Promise<{ publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: RESOURCE_TYPE, type: "authenticated" },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

export function deleteFromCloudinary(publicId: string): Promise<unknown> {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: RESOURCE_TYPE,
    type: "authenticated",
  });
}

// Non-expiring signed delivery URL — only ever fetched server-side, from behind our
// own auth() check on each request, and never exposed to the client directly.
function signedUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    resource_type: RESOURCE_TYPE,
    type: "authenticated",
    sign_url: true,
    secure: true,
  });
}

export async function fetchFromCloudinary(publicId: string): Promise<Buffer> {
  const res = await fetch(signedUrl(publicId));
  if (!res.ok) {
    throw new Error(`Cloudinary fetch failed for ${publicId}: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
