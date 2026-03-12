import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(file: File, folder: string) {
  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder }, (error, uploadResult) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(uploadResult as { secure_url: string });
    }).end(buffer);
  });

  return result.secure_url;
}

export async function fileToDataUri(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const mimeType = file.type || 'image/png';
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

export async function uploadBase64ToCloudinary(dataUri: string, folder: string) {
  const normalized = normalizeBase64Image(dataUri);

  try {
    const result = await cloudinary.uploader.upload(normalized, {
      folder,
    });

    return result.secure_url;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cloudinary upload failed';
    throw new Error(`QR upload failed: ${message}`);
  }
}

function normalizeBase64Image(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error('QR code base64 is empty.');
  }

  if (trimmed.startsWith('data:image/')) {
    return trimmed.replace(/\s+/g, '');
  }

  const compact = trimmed.replace(/\s+/g, '');
  const base64Pattern = /^[A-Za-z0-9+/=]+$/;

  if (!base64Pattern.test(compact)) {
    throw new Error('QR code base64 must be a valid image data URI or raw base64 string.');
  }

  return `data:image/png;base64,${compact}`;
}
