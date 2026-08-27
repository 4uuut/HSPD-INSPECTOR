import html2canvas from 'html2canvas';

export interface ExportImageOptions {
  fileName?: string;
  format?: 'png' | 'jpeg';
  quality?: number;
  backgroundColor?: string;
  scale?: number;
}

/**
 * Exports an HTML element by ID or HTMLElement reference directly to a PNG or JPG file download.
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
      backgroundColor = '#0D1117',
      scale = 2 // 2x scale for ultra crisp high-res image
    } = options;

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const extension = format === 'jpeg' ? 'jpg' : 'png';

    // Render to canvas
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor,
      logging: false,
      ignoreElements: (el) => {
        // Ignore buttons or close controls marked with data-no-export
        return el.getAttribute('data-no-export') === 'true';
      },
      onclone: (clonedDoc, clonedElement) => {
        // Ensure clone has solid styling and full height visibility
        clonedElement.style.maxHeight = 'none';
        clonedElement.style.overflow = 'visible';
        clonedElement.style.transform = 'none';
        clonedElement.style.borderRadius = '0px';
      }
    });

    const dataUrl = canvas.toDataURL(mimeType, quality);

    // Trigger instant browser download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${fileName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      dataUrl
    };
  } catch (err: any) {
    console.error('Failed to export document as image:', err);
    return {
      success: false,
      error: err.message || 'Gagal mengubah dokumen menjadi gambar.'
    };
  }
}
