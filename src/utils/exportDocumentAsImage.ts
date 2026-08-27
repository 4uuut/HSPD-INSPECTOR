import { toPng, toJpeg, toBlob } from 'html-to-image';

export interface ExportImageOptions {
  fileName?: string;
  format?: 'png' | 'jpeg';
  quality?: number;
  backgroundColor?: string | null;
  scale?: number;
}

/**
 * Trigger browser file download from Blob or Data URL
 */
function downloadFile(url: string, fileName: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
  }, 300);
}

/**
 * Exports an HTML element directly to a high-resolution PNG or JPG file download.
 * Uses html-to-image which natively supports modern CSS formats (oklab, oklch, lab, modern Tailwind).
 */
export async function exportElementAsImage(
  target: string | HTMLElement,
  options: ExportImageOptions = {}
): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
  try {
    let element: HTMLElement | null = null;
    if (typeof target === 'string') {
      element = document.getElementById(target);
    } else {
      element = target;
    }

    if (!element) {
      throw new Error(`Elemen dokumen target tidak ditemukan.`);
    }

    const {
      fileName = `DOKUMEN_HSPD_${new Date().toISOString().slice(0, 10)}`,
      format = 'png',
      quality = 0.95,
      backgroundColor = format === 'jpeg' ? '#FAF8F3' : undefined,
      scale = 2.5
    } = options;

    const extension = format === 'jpeg' ? 'jpg' : 'png';

    // Sanitize filename for operating systems
    const cleanFileName = fileName
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, '_')
      .replace(/-+/g, '-')
      .slice(0, 80);

    const fullFileName = `${cleanFileName}.${extension}`;

    const filter = (node: HTMLElement) => {
      // Ignore elements explicitly marked with data-no-export
      if (node && typeof node.getAttribute === 'function') {
        if (node.getAttribute('data-no-export') === 'true') {
          return false;
        }
      }
      return true;
    };

    const imageOptions = {
      quality,
      pixelRatio: scale,
      cacheBust: true,
      skipFonts: false,
      backgroundColor: backgroundColor || undefined,
      filter: filter as any
    };

    // Attempt blob export first for efficient memory usage
    try {
      const blob = await toBlob(element, {
        ...imageOptions,
        type: format === 'jpeg' ? 'image/jpeg' : 'image/png'
      });

      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        downloadFile(blobUrl, fullFileName);
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 1500);

        return {
          success: true
        };
      }
    } catch (blobErr) {
      console.warn('Blob export attempt fell back to dataUrl export:', blobErr);
    }

    // Fallback to direct DataURL generation
    let dataUrl: string;
    if (format === 'jpeg') {
      dataUrl = await toJpeg(element, imageOptions);
    } else {
      dataUrl = await toPng(element, imageOptions);
    }

    downloadFile(dataUrl, fullFileName);

    return {
      success: true,
      dataUrl
    };
  } catch (err: any) {
    console.error('Failed to export document as image:', err);
    return {
      success: false,
      error: err.message || 'Gagal memproses dokumen menjadi gambar.'
    };
  }
}


