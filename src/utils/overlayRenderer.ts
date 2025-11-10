import { PropertyData, AliadoConfig } from "@/types/property";
import { ArrendadoData } from "@/types/arrendado";
import { formatPrecioColombia } from "./formatters";
import elGestorLogo from "@/assets/el-gestor-logo.png";
import logoRubyMorales from "@/assets/logo-ruby-morales.png";

/**
 * Carga una imagen desde una URL
 */
async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Renderiza los overlays del video a una imagen PNG transparente
 * Esta imagen será compuesta sobre el video por FFmpeg
 */
export async function renderOverlayImage(
  propertyData: PropertyData | ArrendadoData,
  aliadoConfig: AliadoConfig,
  variant: "disponible" | "arrendado" | "vendido",
  logoImage?: HTMLImageElement | null,
  elGestorLogoImage?: HTMLImageElement | null
): Promise<Blob> {
  // Crear canvas offscreen
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d', { alpha: true });
  
  if (!ctx) throw new Error('No se pudo obtener contexto 2D del canvas');

  // Fondo transparente
  ctx.clearRect(0, 0, 1080, 1920);

  // Cargar logos si no fueron proporcionados
  const [loadedLogoImage, loadedElGestorImage] = await Promise.all([
    logoImage || loadImageFromUrl(aliadoConfig.logo || logoRubyMorales).catch(err => {
      console.warn('[overlayRenderer] Failed to load aliado logo:', err);
      return null;
    }),
    elGestorLogoImage || loadImageFromUrl(elGestorLogo).catch(err => {
      console.warn('[overlayRenderer] Failed to load El Gestor logo:', err);
      return null;
    })
  ]);

  // ===== HEADER: Logo del Aliado =====
  if (loadedLogoImage) {
    const logoSize = 90;
    const logoX = 24;
    const logoY = 128; // top-32
    
    // Fondo blanco semi-transparente
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(logoX, logoY, logoSize, logoSize, 12);
    ctx.fill();
    ctx.restore();
    
    // Borde blanco
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(logoX, logoY, logoSize, logoSize, 12);
    ctx.stroke();
    
    // Logo centrado
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(logoX + 4, logoY + 4, logoSize - 8, logoSize - 8, 10);
    ctx.clip();
    ctx.drawImage(loadedLogoImage, logoX + 4, logoY + 4, logoSize - 8, logoSize - 8);
    ctx.restore();
  }

  // ===== FOOTER: Logo El Gestor (right-4 bottom-12, h=40) =====
  if (loadedElGestorImage) {
    const gestorHeight = 40;
    const gestorWidth = (loadedElGestorImage.width / loadedElGestorImage.height) * gestorHeight;
    const gestorX = 1080 - gestorWidth - 16; // right-4
    const gestorY = 1920 - gestorHeight - 48; // bottom-12
    
    ctx.save();
    // Drop-shadow equivalente al DOM
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.drawImage(loadedElGestorImage, gestorX, gestorY, gestorWidth, gestorHeight);
    ctx.restore();
    
    console.log('[overlayRenderer] El Gestor logo rendered:', {
      size: `${gestorWidth.toFixed(0)}x${gestorHeight}`,
      pos: `(${gestorX.toFixed(0)}, ${gestorY})`
    });
  }

  // ===== CONTENIDO SEGÚN VARIANTE =====
  if (variant === "arrendado" || variant === "vendido") {
    // Estilo Arrendado/Vendido
    const arrendadoData = propertyData as ArrendadoData;
    const isArrendado = variant === "arrendado";
    
    // Badge superior - fondo sólido con texto blanco para máximo contraste
    const badgeText = isArrendado ? "¡ARRENDADO!" : "¡VENDIDO!";
    const badgeColor = isArrendado ? aliadoConfig.colorPrimario : "#2ecc71";
    
    ctx.save();
    ctx.fillStyle = badgeColor;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(40, 250, 1000, 120, 20);
    ctx.fill();
    ctx.restore();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 68px "Poppins", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.fillText(badgeText, 540, 335);
    ctx.shadowBlur = 0;
    
    // Precio - más cerca del badge
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px "Poppins", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.fillText(formatPrecioColombia(arrendadoData.precio), 540, 470);
    
    // Días en mercado - como badge secundario
    const dias = arrendadoData.diasEnMercado;
    const diasTexto = dias <= 7 
      ? `🚀 ¡RÉCORD! En solo ${dias} día${dias === 1 ? '' : 's'}`
      : dias <= 15
      ? `⚡ En solo ${dias} días`
      : `🎉 En ${dias} días`;
    ctx.font = '36px "Poppins", sans-serif';
    ctx.fillText(diasTexto, 540, 590);
    
    // Tipo de inmueble
    const tipoTexto = arrendadoData.tipo.charAt(0).toUpperCase() + arrendadoData.tipo.slice(1);
    ctx.font = 'bold 44px "Poppins", sans-serif';
    ctx.fillText(tipoTexto, 540, 1100);
    
    // Ubicación
    ctx.font = 'bold 48px "Poppins", sans-serif';
    ctx.fillText(`📍 ${arrendadoData.ubicacion}`, 540, 1200);
    
    ctx.shadowBlur = 0;
    
  } else {
    // Estilo Disponible
    const data = propertyData as PropertyData;
    const precio = data.modalidad === "venta" ? data.valorVenta : data.canon;
    const modalidadText = data.modalidad === "venta" ? "Venta" : "Arriendo";
    
    // Panel de información inferior
    const panelY = 1920 - 460;
    const panelHeight = 340;
    
    // Fondo del panel con gradiente
    const gradient = ctx.createLinearGradient(0, panelY, 0, panelY + panelHeight);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(30, panelY, 1020, panelHeight, 24);
    ctx.fill();
    
    // Precio principal
    if (precio) {
      ctx.fillStyle = aliadoConfig.colorPrimario;
      ctx.font = 'bold 72px "Poppins", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 15;
      ctx.fillText(formatPrecioColombia(precio), 540, panelY + 90);
      ctx.shadowBlur = 0;
      
      // Modalidad
      ctx.fillStyle = '#ffffff';
      ctx.font = '32px "Poppins", sans-serif';
      ctx.fillText(modalidadText, 540, panelY + 130);
    }
    
    // Características en fila
    const features: string[] = [];
    
    if (data.habitaciones) features.push(`🛏️ ${data.habitaciones}`);
    if (data.banos) features.push(`🚿 ${data.banos}`);
    if (data.parqueaderos) features.push(`🚗 ${data.parqueaderos}`);
    if (data.area) features.push(`📏 ${data.area}m²`);
    
    if (features.length > 0) {
      ctx.fillStyle = aliadoConfig.colorSecundario;
      ctx.font = 'bold 38px "Poppins", sans-serif';
      ctx.textAlign = 'center';
      
      const featuresText = features.join('  •  ');
      ctx.fillText(featuresText, 540, panelY + 200);
    }
    
    // Ubicación
    if (data.ubicacion) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Poppins", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`📍 ${data.ubicacion}`, 540, panelY + 270);
    }
    
    // CTA WhatsApp
    const ctaY = 1920 - 460 + 340 + 30;
    ctx.fillStyle = '#25D366';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(240, ctaY, 600, 70, 35);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Poppins", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💬 Agenda tu visita', 540, ctaY + 48);
  }

  // Convertir canvas a Blob PNG
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('No se pudo generar la imagen de overlays'));
      }
    }, 'image/png');
  });
}
