import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type CloudinaryResourceType = "image" | "raw";

export function resourceTypeForMime(mimeType: string): CloudinaryResourceType {
  return mimeType.startsWith("image/") ? "image" : "raw";
}

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: CloudinaryResourceType,
): Promise<{ publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType, type: "authenticated" },
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

export function deleteFromCloudinary(
  publicId: string,
  resourceType: CloudinaryResourceType,
): Promise<unknown> {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    type: "authenticated",
  });
}

// Short-lived signed URL — must be requested fresh behind our own auth() check each time.
export function signedDeliveryUrl(
  publicId: string,
  resourceType: CloudinaryResourceType,
  mode: "inline" | "download",
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + 60;
  return cloudinary.utils.private_download_url(publicId, "", {
    resource_type: resourceType,
    type: "authenticated",
    expires_at: expiresAt,
    attachment: mode === "download",
  });
}
