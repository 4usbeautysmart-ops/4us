// Using a data URL to embed the SVG, making it self-contained and avoiding network requests.
const LOGO_SVG_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48ZmlsdGVyIGlkPSJzaGFkb3ciIHg9Ii0yMCUiIHk9Ii0yMCUiIHdpZHRoPSIxNDAlIiBoZWlnaHQ9IjE0MCUiPjxmZUdhdXNzaWFuQmx1ciBpbj0iU291cmNlQWxwaGEiIHN0ZERldmlhdGlvbj0iMiIvPjxmZU9mZnNldCBkeD0iMSIgZHk9IjEiIHJlc3VsdD0ib2Zmc2V0Ymx1ciIvPjxmZUZsb29kIGZsb29kLWNvbG9yPSJyZ2JhKDAsMCwwLDAuNykiLz48ZmVDb21wb3NpdGUgaW4yPSJvZmZzZXRibHVyIiBvcGVyYXRvcj0iaW4iLz48ZmVNZXJnZT48ZmVNZXJnZU5vZGUvPjxmZU1lcmdlTm9kZSBpbj0iU291cmNlR3JhcGhpYyIvPjwvZmVNZXJnZT48L2ZpbHRlcj48L2RlZnM+PGcgdHJhbnNmb3JtPSJzY2FsZSgwLjgpIHRyYW5zbGF0ZSgxMiwgMTIpIiBmaWx0ZXI9InVybCgjc2hhZG93KSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMTUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMTAiIGZpbGw9Im5vbmUiLz48Y2lyY2xlIGN4PSI3MCIgY3k9IjMwIiByPSIxNSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxMCIgZmlsbD0ibm9uZSIvPjxsaW5lIHgxPSI0MiIgeTE9IjQyIiB4Mj0iODUiIHkyPSI4NSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PGxpbmUgeDE9IjU4IiB5MT0iNDIiIHgyPSIxNSIgeTI9Ijg1IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEwIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L2c+PC9zdmc+';

/**
 * Adds a watermark logo to the bottom right of an image.
 * @param base64ImageDataUrl The source image as a base64 data URL.
 * @returns A promise that resolves with the watermarked image as a base64 data URL.
 */
export const addWatermark = (base64ImageDataUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const sourceImage = new Image();
    const watermarkImage = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return reject(new Error('Could not get canvas context'));
    }

    let sourceLoaded = false;
    let watermarkLoaded = false;

    const drawImages = () => {
      if (!sourceLoaded || !watermarkLoaded) return;

      canvas.width = sourceImage.naturalWidth;
      canvas.height = sourceImage.naturalHeight;

      // Draw the main image
      ctx.drawImage(sourceImage, 0, 0);

      // --- Watermark Logic ---
      const padding = canvas.width * 0.03; // 3% padding from edges
      const watermarkScale = 0.15; // Watermark width will be 15% of the image width
      
      const watermarkWidth = canvas.width * watermarkScale;
      const watermarkHeight = (watermarkImage.naturalHeight / watermarkImage.naturalWidth) * watermarkWidth;
      
      const x = canvas.width - watermarkWidth - padding;
      const y = canvas.height - watermarkHeight - padding;
      
      // Set opacity
      ctx.globalAlpha = 0.7;

      // Draw the watermark
      ctx.drawImage(watermarkImage, x, y, watermarkWidth, watermarkHeight);
      
      // Reset opacity
      ctx.globalAlpha = 1.0;

      resolve(canvas.toDataURL('image/png'));
    };

    sourceImage.onload = () => {
      sourceLoaded = true;
      drawImages();
    };

    watermarkImage.onload = () => {
      watermarkLoaded = true;
      drawImages();
    };
    
    sourceImage.onerror = (e) => reject(new Error(`Failed to load source image: ${e}`));
    watermarkImage.onerror = (e) => reject(new Error(`Failed to load watermark image: ${e}`));
    
    sourceImage.crossOrigin = "anonymous"; // Handle potential CORS issues with images
    watermarkImage.crossOrigin = "anonymous";

    sourceImage.src = base64ImageDataUrl;
    watermarkImage.src = LOGO_SVG_DATA_URL;
  });
};
