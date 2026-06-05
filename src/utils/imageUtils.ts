// src/utils/imageUtils.ts
import { ColorPalette } from '../palettes';

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export const hexToRgb = (hex: string): RGBColor | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const colorDistance = (rgb1: RGBColor, rgb2: RGBColor): number => {
  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

export const findNearestColor = (pixelRgb: RGBColor, paletteRgbs: RGBColor[]): RGBColor => {
  let nearestColor = paletteRgbs[0];
  let minDistance = colorDistance(pixelRgb, nearestColor);

  for (let i = 1; i < paletteRgbs.length; i++) {
    const distance = colorDistance(pixelRgb, paletteRgbs[i]);
    if (distance < minDistance) {
      minDistance = distance;
      nearestColor = paletteRgbs[i];
    }
  }
  return nearestColor;
};

export const applyColorPalette = (
  base64Image: string,
  palette: ColorPalette
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!palette.colors || palette.colors.length === 0) {
      resolve(base64Image); // No filter to apply
      return;
    }

    const paletteRgbs = palette.colors.map(hexToRgb).filter(c => c !== null) as RGBColor[];
    if (paletteRgbs.length === 0) {
        console.warn("Palette contains no valid RGB colors. Returning original image.");
        resolve(base64Image);
        return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error("Failed to get canvas context for color palette application."));
        return;
      }
      
      // Disable smoothing for pixel art if scaling, though here we're modifying pixels directly
      ctx.imageSmoothingEnabled = false;

      ctx.drawImage(img, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const pixelRgb: RGBColor = { r: data[i], g: data[i + 1], b: data[i + 2] };
          // Preserve original alpha: data[i + 3]
          
          const nearestPaletteColor = findNearestColor(pixelRgb, paletteRgbs);
          
          data[i] = nearestPaletteColor.r;
          data[i + 1] = nearestPaletteColor.g;
          data[i + 2] = nearestPaletteColor.b;
          // Alpha data[i + 3] remains unchanged
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));

      } catch (e) {
        console.error("Error applying color palette:", e);
        reject(new Error("Failed to apply color palette to the image."));
      }
    };
    img.onerror = (err) => {
      console.error("Error loading image for palette application:", err);
      reject(new Error("Failed to load image for palette application."));
    };
    img.src = base64Image;
  });
};
