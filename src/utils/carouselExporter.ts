import html2canvas from "html2canvas";
import { PropertyData, AliadoConfig } from "@/types/property";
import { formatPrecioColombia } from "./formatters";

interface SlideData {
  photoUrl: string;
  slideNumber: number;
  totalSlides: number;
  isLastSlide: boolean;
}

const createCarouselSlide = async (
  propertyData: PropertyData,
  aliadoConfig: AliadoConfig,
  slideData: SlideData
): Promise<HTMLDivElement> => {
  const container = document.createElement("div");
  container.style.width = "1080px";
  container.style.height = "1080px";
  container.style.position = "relative";
  container.style.backgroundColor = "#ffffff";
  container.style.fontFamily = "Poppins, sans-serif";

  // Imagen de fondo
  const img = document.createElement("img");
  img.src = slideData.photoUrl;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "cover";
  img.style.position = "absolute";
  img.style.top = "0";
  img.style.left = "0";
  container.appendChild(img);

  // Gradiente overlay
  const gradient = document.createElement("div");
  gradient.style.position = "absolute";
  gradient.style.bottom = "0";
  gradient.style.left = "0";
  gradient.style.right = "0";
  gradient.style.height = "40%";
  gradient.style.background = "linear-gradient(to top, rgba(0,0,0,0.8), transparent)";
  container.appendChild(gradient);

  if (slideData.isLastSlide) {
    // Slide final con CTA
    createCTASlide(container, propertyData, aliadoConfig);
  } else {
    // Slides normales con información de la propiedad
    createInfoSlide(container, propertyData, aliadoConfig, slideData);
  }

  document.body.appendChild(container);
  await new Promise(resolve => setTimeout(resolve, 100)); // Esperar render
  
  return container;
};

const createInfoSlide = (
  container: HTMLDivElement,
  propertyData: PropertyData,
  aliadoConfig: AliadoConfig,
  slideData: SlideData
) => {
  // Logo del aliado en la parte superior
  const logoContainer = document.createElement("div");
  logoContainer.style.position = "absolute";
  logoContainer.style.top = "30px";
  logoContainer.style.left = "30px";
  logoContainer.style.backgroundColor = "rgba(255,255,255,0.95)";
  logoContainer.style.borderRadius = "12px";
  logoContainer.style.padding = "12px 20px";
  logoContainer.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";

  const logo = document.createElement("img");
  logo.src = aliadoConfig.logo;
  logo.style.height = "40px";
  logo.style.width = "auto";
  logoContainer.appendChild(logo);
  container.appendChild(logoContainer);

  // Indicador de slide
  const indicator = document.createElement("div");
  indicator.style.position = "absolute";
  indicator.style.top = "30px";
  indicator.style.right = "30px";
  indicator.style.backgroundColor = "rgba(0,0,0,0.7)";
  indicator.style.color = "white";
  indicator.style.padding = "8px 16px";
  indicator.style.borderRadius = "20px";
  indicator.style.fontSize = "14px";
  indicator.style.fontWeight = "600";
  indicator.textContent = `${slideData.slideNumber}/${slideData.totalSlides}`;
  container.appendChild(indicator);

  // Información en la parte inferior
  const infoBox = document.createElement("div");
  infoBox.style.position = "absolute";
  infoBox.style.bottom = "30px";
  infoBox.style.left = "30px";
  infoBox.style.right = "30px";
  infoBox.style.color = "white";

  // Título/tipo de propiedad
  const title = document.createElement("div");
  title.style.fontSize = "32px";
  title.style.fontWeight = "700";
  title.style.marginBottom = "12px";
  title.style.textTransform = "capitalize";
  title.textContent = propertyData.tipo;
  infoBox.appendChild(title);

  // Ubicación
  if (propertyData.ubicacion) {
    const location = document.createElement("div");
    location.style.fontSize = "20px";
    location.style.marginBottom = "16px";
    location.textContent = `📍 ${propertyData.ubicacion}`;
    infoBox.appendChild(location);
  }

  // Precio
  const priceText = propertyData.modalidad === "venta" 
    ? propertyData.valorVenta 
    : propertyData.canon;
    
  if (priceText) {
    const price = document.createElement("div");
    price.style.fontSize = "28px";
    price.style.fontWeight = "700";
    price.style.color = aliadoConfig.colorPrimario;
    price.style.marginBottom = "16px";
    price.textContent = `💰 ${formatPrecioColombia(priceText)}`;
    infoBox.appendChild(price);
  }

  // Características en una línea
  const features = document.createElement("div");
  features.style.display = "flex";
  features.style.gap = "20px";
  features.style.fontSize = "16px";
  features.style.flexWrap = "wrap";

  if (propertyData.habitaciones) {
    const hab = document.createElement("span");
    hab.textContent = `🛏️ ${propertyData.habitaciones}`;
    features.appendChild(hab);
  }

  if (propertyData.banos) {
    const bath = document.createElement("span");
    bath.textContent = `🚿 ${propertyData.banos}`;
    features.appendChild(bath);
  }

  if (propertyData.parqueaderos) {
    const park = document.createElement("span");
    park.textContent = `🚗 ${propertyData.parqueaderos}`;
    features.appendChild(park);
  }

  if (propertyData.area) {
    const area = document.createElement("span");
    area.textContent = `📐 ${propertyData.area}m²`;
    features.appendChild(area);
  }

  infoBox.appendChild(features);
  container.appendChild(infoBox);
};

const createCTASlide = (
  container: HTMLDivElement,
  propertyData: PropertyData,
  aliadoConfig: AliadoConfig
) => {
  // Overlay más oscuro para legibilidad
  const overlay = document.createElement("div");
  overlay.style.position = "absolute";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.6)";
  container.appendChild(overlay);

  // Contenido centrado
  const content = document.createElement("div");
  content.style.position = "absolute";
  content.style.top = "50%";
  content.style.left = "50%";
  content.style.transform = "translate(-50%, -50%)";
  content.style.textAlign = "center";
  content.style.color = "white";
  content.style.width = "80%";

  // Logo del aliado
  const logo = document.createElement("img");
  logo.src = aliadoConfig.logo;
  logo.style.height = "80px";
  logo.style.width = "auto";
  logo.style.marginBottom = "30px";
  logo.style.filter = "drop-shadow(0 4px 12px rgba(0,0,0,0.3))";
  content.appendChild(logo);

  // CTA principal
  const ctaTitle = document.createElement("div");
  ctaTitle.style.fontSize = "48px";
  ctaTitle.style.fontWeight = "700";
  ctaTitle.style.marginBottom = "20px";
  ctaTitle.style.lineHeight = "1.2";
  ctaTitle.textContent = "¿Te interesa?";
  content.appendChild(ctaTitle);

  // Subtítulo
  const subtitle = document.createElement("div");
  subtitle.style.fontSize = "28px";
  subtitle.style.marginBottom = "40px";
  subtitle.style.color = "#f0f0f0";
  subtitle.textContent = "¡Contáctanos ahora!";
  content.appendChild(subtitle);

  // WhatsApp
  const whatsapp = document.createElement("div");
  whatsapp.style.fontSize = "32px";
  whatsapp.style.fontWeight = "600";
  whatsapp.style.marginBottom = "20px";
  whatsapp.style.backgroundColor = aliadoConfig.colorPrimario;
  whatsapp.style.padding = "20px 40px";
  whatsapp.style.borderRadius = "16px";
  whatsapp.style.display = "inline-block";
  whatsapp.textContent = `📱 ${aliadoConfig.whatsapp}`;
  content.appendChild(whatsapp);

  // Nombre del aliado
  const name = document.createElement("div");
  name.style.fontSize = "24px";
  name.style.marginTop = "30px";
  name.style.fontWeight = "600";
  name.textContent = aliadoConfig.nombre;
  content.appendChild(name);

  // Ciudad
  const city = document.createElement("div");
  city.style.fontSize = "18px";
  city.style.marginTop = "10px";
  city.style.color = "#d0d0d0";
  city.textContent = `📍 ${aliadoConfig.ciudad}`;
  content.appendChild(city);

  container.appendChild(content);

  // Logo El Gestor en la esquina inferior
  const elGestorLogo = document.createElement("div");
  elGestorLogo.style.position = "absolute";
  elGestorLogo.style.bottom = "30px";
  elGestorLogo.style.right = "30px";
  elGestorLogo.style.fontSize = "14px";
  elGestorLogo.style.color = "rgba(255,255,255,0.7)";
  elGestorLogo.textContent = "Powered by El Gestor";
  container.appendChild(elGestorLogo);
};

export const exportCarouselSlides = async (
  propertyData: PropertyData,
  aliadoConfig: AliadoConfig,
  caption: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  const totalSlides = propertyData.fotos.length + 1; // fotos + CTA slide
  
  for (let i = 0; i < totalSlides; i++) {
    const isLastSlide = i === totalSlides - 1;
    const photoUrl = isLastSlide ? propertyData.fotos[0] : propertyData.fotos[i];
    
    const slideData: SlideData = {
      photoUrl,
      slideNumber: i + 1,
      totalSlides,
      isLastSlide,
    };

    const container = await createCarouselSlide(propertyData, aliadoConfig, slideData);

    // Generar imagen
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });

    // Convertir a blob y descargar
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `carrusel-${propertyData.tipo}-${String(i + 1).padStart(2, "0")}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, "image/png");

    // Limpiar
    document.body.removeChild(container);
    
    if (onProgress) {
      onProgress(i + 1, totalSlides);
    }

    // Pequeño delay entre descargas
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Guardar caption en archivo de texto
  const captionBlob = new Blob([caption], { type: "text/plain" });
  const captionUrl = URL.createObjectURL(captionBlob);
  const captionLink = document.createElement("a");
  captionLink.href = captionUrl;
  captionLink.download = `carrusel-${propertyData.tipo}-caption.txt`;
  captionLink.click();
  URL.revokeObjectURL(captionUrl);
};
