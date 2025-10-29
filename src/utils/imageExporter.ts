import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import { addOpacityToHex } from "./colorUtils";

export interface ExportOptions {
  format: "png" | "jpg";
  quality: number; // 0.1 to 1.0
  addWatermark?: boolean;
  watermarkText?: string;
  watermarkColor?: string;
}

export const exportToImage = async (
  elementId: string,
  filename: string = "publicacion-el-gestor.png",
  options: ExportOptions = { format: "png", quality: 0.95 }
): Promise<void> => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error("Elemento no encontrado");
  }

  try {
    // Wait for fonts to load
    await document.fonts.ready;
    
    // Small delay to ensure all styles are applied
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          // Remove backdrop-blur (not supported by html2canvas)
          const blurElements = clonedElement.querySelectorAll('[class*="backdrop-blur"]');
          blurElements.forEach((el) => {
            (el as HTMLElement).style.backdropFilter = 'none';
            // Increase background opacity to compensate
            const currentBg = window.getComputedStyle(el as HTMLElement).backgroundColor;
            if (currentBg.includes('rgba')) {
              (el as HTMLElement).style.backgroundColor = currentBg.replace(/[\d.]+\)$/g, '0.95)');
            }
          });
          
          // Ensure font is loaded in clone
          (clonedElement as HTMLElement).style.fontFamily = 'Poppins, sans-serif';
        }
      }
    });

    // Add watermark if requested
    if (options.addWatermark && options.watermarkText) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.font = "16px Poppins, sans-serif";
        ctx.fillStyle = options.watermarkColor || "rgba(0, 0, 0, 0.3)";
        ctx.textAlign = "right";
        ctx.fillText(options.watermarkText, canvas.width - 20, canvas.height - 20);
      }
    }

    // Compress and convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          saveAs(blob, filename);
        }
      },
      options.format === "jpg" ? "image/jpeg" : "image/png",
      options.quality
    );
  } catch (error) {
    console.error("Error al exportar imagen:", error);
    throw error;
  }
};

export const exportVideo = async (
  videoUrl: string,
  filename: string = "reel-el-gestor.mp4"
): Promise<void> => {
  try {
    const response = await fetch(videoUrl);
    const blob = await response.blob();
    saveAs(blob, filename);
  } catch (error) {
    console.error("Error al exportar video:", error);
    throw error;
  }
};

export const getOptimalDimensions = (contentType: "post" | "historia" | "reel-fotos" | "reel-video") => {
  switch (contentType) {
    case "post":
      return { width: 1080, height: 1080 };
    case "historia":
    case "reel-fotos":
    case "reel-video":
      return { width: 1080, height: 1920 };
    default:
      return { width: 1080, height: 1080 };
  }
};
