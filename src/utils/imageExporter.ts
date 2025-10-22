import html2canvas from "html2canvas";
import { saveAs } from "file-saver";

export const exportToImage = async (
  elementId: string,
  filename: string = "publicacion-el-gestor.png",
  format: "png" | "jpg" = "png"
): Promise<void> => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error("Elemento no encontrado");
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          saveAs(blob, filename);
        }
      },
      format === "jpg" ? "image/jpeg" : "image/png",
      0.95 // Quality for JPEG
    );
  } catch (error) {
    console.error("Error al exportar imagen:", error);
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
