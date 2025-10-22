/**
 * Convierte una URL remota a dataURL para evitar problemas de CORS
 */
export const urlToDataURL = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error convirtiendo URL a dataURL:', error);
    throw error;
  }
};

/**
 * Pre-carga y decodifica una imagen para renderizado rápido
 */
export const preloadImage = async (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    
    img.onload = async () => {
      try {
        // Usar decode() si está disponible para decodificar antes de usar
        if (img.decode) {
          await img.decode();
        }
        resolve(img);
      } catch (error) {
        // Si decode falla, aún así devolver la imagen cargada
        resolve(img);
      }
    };
    
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Espera a que el navegador complete el siguiente frame de renderizado
 */
export const waitForNextFrame = (): Promise<void> => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
};
