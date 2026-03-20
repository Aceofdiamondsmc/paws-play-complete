/**
 * Shared image utilities for normalizing uploads and preparing print-safe images.
 */

/**
 * Re-encode any image file to a print-safe JPEG via canvas.
 * Strips metadata, normalizes format, and resizes large images.
 * Works for JPG, PNG, WebP, GIF, BMP — HEIC must be converted first via heic-convert.
 */
export async function normalizeToJpeg(
  file: File,
  maxDimension = 1200,
  quality = 0.85
): Promise<File> {
  // Skip videos
  if (file.type.startsWith('video/')) return file;

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const scale = maxDimension / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(file); // fallback to original
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              resolve(file);
              return;
            }
            const name = file.name.replace(/\.[^.]+$/, '.jpg');
            resolve(new File([blob], name, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          quality
        );
      } catch {
        URL.revokeObjectURL(url);
        resolve(file); // fallback to original on any error
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback to original
    };

    img.src = url;
  });
}

/**
 * Convert a remote image URL to a base64 data URL via canvas.
 * Uses img.decode() when available for better iOS reliability.
 * Returns null if conversion fails.
 */
export function imageUrlToBase64(url: string, maxSize = 800, timeoutMs = 15000): Promise<string | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.warn('[flyer] imageToBase64 timed out:', url);
      resolve(null);
    }, timeoutMs);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const draw = () => {
      try {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const scale = maxSize / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } catch (e) {
        console.warn('[flyer] canvas export failed:', e);
        resolve(null);
      }
    };

    img.onload = () => {
      clearTimeout(timer);
      // Use decode() for better iOS reliability if available
      if (typeof img.decode === 'function') {
        img.decode().then(draw).catch(() => {
          console.warn('[flyer] img.decode() failed, drawing anyway');
          draw();
        });
      } else {
        draw();
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      console.warn('[flyer] image load failed:', url);
      resolve(null);
    };

    img.src = url;
  });
}
