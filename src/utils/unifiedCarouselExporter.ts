import html2canvas from "html2canvas";
import { saveAs } from "file-saver";

/**
 * Exportador unificado de carrusel que captura el estado actual del canvas-preview
 * El componente padre (CarouselGenerator) se encarga de actualizar el estado entre capturas
 */
export const captureCurrentSlide = async (filename: string): Promise<void> => {
  const element = document.getElementById("canvas-preview");
  
  if (!element) {
    throw new Error("Elemento canvas-preview no encontrado");
  }

  // Esperar a que las fuentes carguen
  await document.fonts.ready;
  
  // Pequeña espera para asegurar que el DOM se actualizó
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.getElementById("canvas-preview");
      if (clonedElement) {
        // Remover backdrop-blur no soportado por html2canvas
        const blurElements = clonedElement.querySelectorAll('[class*="backdrop-blur"]');
        blurElements.forEach((el) => {
          (el as HTMLElement).style.backdropFilter = 'none';
          const currentBg = window.getComputedStyle(el as HTMLElement).backgroundColor;
          if (currentBg.includes('rgba')) {
            (el as HTMLElement).style.backgroundColor = currentBg.replace(/[\d.]+\)$/g, '0.95)');
          }
        });
        (clonedElement as HTMLElement).style.fontFamily = 'Poppins, sans-serif';
      }
    }
  });

  // Descargar como PNG
  canvas.toBlob(
    (blob) => {
      if (blob) {
        saveAs(blob, filename);
      }
    },
    "image/png",
    0.95
  );
};

export const exportCaption = (caption: string): void => {
  const captionBlob = new Blob([caption], { type: "text/plain;charset=utf-8" });
  saveAs(captionBlob, "caption.txt");
};
