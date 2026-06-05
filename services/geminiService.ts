
import { GoogleGenAI } from "@google/genai";

// Ensure API_KEY is available in the environment.
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_API_KEY" });

const IMAGE_MODEL = 'imagen-3.0-generate-002';

export const generatePixelArt = async (userPrompt: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("Gemini API Key is not configured. Please set the API_KEY environment variable.");
  }

  const engineeredPrompt = `Generate a high-quality, detailed pixel art image. The style should be reminiscent of classic 16-bit retro video game graphics, with clear pixel definition and a vibrant, limited color palette suitable for pixel art. Subject: ${userPrompt}.`;

  try {
    const response = await ai.models.generateImages({
      model: IMAGE_MODEL,
      prompt: engineeredPrompt,
      config: { 
        numberOfImages: 1,
        outputMimeType: 'image/png'
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0 || !response.generatedImages[0].image?.imageBytes) {
      console.error("No image data received from API response:", response);
      throw new Error("No image data received from API. The model might not have generated an image for this prompt.");
    }

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;

  } catch (error) {
    console.error("Error generating image with Gemini API:", error);
    if (error instanceof Error) {
      if (error.message.includes("API key not valid") || error.message.includes("permission")) {
        throw new Error("API Key is invalid or lacks permissions. Please check your Gemini API key configuration.");
      }
      throw new Error(`Failed to generate pixel art: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating pixel art.");
  }
};

export const resampleImageToGrid = (
  base64Image: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error("Failed to get canvas context for resampling."));
        return;
      }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      try {
        const resampledImageBase64 = canvas.toDataURL('image/png');
        resolve(resampledImageBase64);
      } catch (e) {
        console.error("Error converting canvas to Data URL:", e);
        reject(new Error("Failed to convert resampled image to data URL."));
      }
    };
    img.onerror = (err) => {
      console.error("Error loading image for resampling:", err);
      reject(new Error("Failed to load image for resampling."));
    };
    img.src = base64Image;
  });
};
