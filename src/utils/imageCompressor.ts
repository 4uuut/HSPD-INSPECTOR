/**
 * Utility to compress images from device before saving to state / localStorage / sending to Discord.
 * Keeps payload lightweight while preserving high clarity for SAMP / Roleplay evidence.
 */
export async function processAndCompressImage(file: File, maxWidth = 1280, maxHeight = 1280, quality = 0.85): Promise<{ dataUrl: string; sizeKb: number; fileName: string }> {
  return new Promise((resolve, reject) => {
    // If not an image file
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih bukan format gambar yang didukung.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio scaling
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal memproses canvas gambar.'));
          return;
        }

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG for compact storage
        const outputMime = file.type === 'image/png' && file.size < 500 * 1024 ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputMime, quality);
        const approxSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl,
          sizeKb: approxSizeKb,
          fileName: file.name
        });
      };
      img.onerror = () => {
        reject(new Error('Gagal memuat file gambar.'));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file dari perangkat.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a Base64 Data URL to a Blob for multipart/form-data upload
 */
export function dataURLtoBlob(dataurl: string): { blob: Blob; mimeType: string; extension: string } {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const extension = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
  return {
    blob: new Blob([u8arr], { type: mimeType }),
    mimeType,
    extension
  };
}
