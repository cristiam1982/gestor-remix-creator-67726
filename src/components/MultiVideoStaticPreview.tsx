import { useEffect, useRef, useState } from "react";
import { PropertyData, AliadoConfig } from "@/types/property";
import { MultiVideoVisualSettings } from "@/types/multiVideo";
import { Skeleton } from "@/components/ui/skeleton";

interface MultiVideoStaticPreviewProps {
  videoFile: File;
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  visualSettings: MultiVideoVisualSettings;
  subtitle?: string;
}

export const MultiVideoStaticPreview = ({
  videoFile,
  propertyData,
  aliadoConfig,
  visualSettings,
  subtitle = ""
}: MultiVideoStaticPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const aliadoLogoRef = useRef<HTMLImageElement | null>(null);
  const elGestorLogoRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadAndDrawFrame = async () => {
      if (!canvasRef.current) return;
      
      setIsLoading(true);
      
      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Cargar video
        const video = document.createElement('video');
        video.src = URL.createObjectURL(videoFile);
        video.muted = true;
        videoRef.current = video;

        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => {
            video.currentTime = 0.1; // Primer frame significativo
          };
          video.onseeked = () => resolve();
          video.onerror = reject;
        });

        if (!mounted) return;

        // Dibujar video frame
        ctx.drawImage(video, 0, 0, 1080, 1920);

        // Cargar logos
        const [aliadoLogo, elGestorLogo] = await Promise.all([
          loadImage(aliadoConfig.logo),
          loadImage('/src/assets/el-gestor-logo.png')
        ]);

        if (!mounted) return;

        aliadoLogoRef.current = aliadoLogo;
        elGestorLogoRef.current = elGestorLogo;

        // Aplicar overlays
        drawOverlays(
          ctx,
          aliadoLogo,
          elGestorLogo,
          subtitle,
          propertyData,
          aliadoConfig,
          visualSettings
        );

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading preview:', error);
        setIsLoading(false);
      }
    };

    loadAndDrawFrame();

    return () => {
      mounted = false;
      if (videoRef.current) {
        URL.revokeObjectURL(videoRef.current.src);
      }
    };
  }, [videoFile, propertyData, aliadoConfig, visualSettings, subtitle]);

  // Re-dibujar overlays cuando cambian los settings (sin recargar video)
  useEffect(() => {
    if (!canvasRef.current || isLoading || !videoRef.current || !aliadoLogoRef.current || !elGestorLogoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Re-dibujar frame del video
    ctx.drawImage(videoRef.current, 0, 0, 1080, 1920);

    // Re-aplicar overlays con nuevos settings
    drawOverlays(
      ctx,
      aliadoLogoRef.current,
      elGestorLogoRef.current,
      subtitle,
      propertyData,
      aliadoConfig,
      visualSettings
    );
  }, [visualSettings, subtitle, propertyData, aliadoConfig, isLoading]);

  return (
    <div className="relative w-full max-w-[300px] mx-auto">
      {isLoading && (
        <Skeleton className="w-full aspect-[9/16] rounded-xl" />
      )}
      <canvas
        ref={canvasRef}
        width={1080}
        height={1920}
        className={`w-full h-auto rounded-xl shadow-2xl border border-border ${isLoading ? 'hidden' : ''}`}
      />
      <p className="text-xs text-muted-foreground text-center mt-2">
        Vista previa con personalizaciones
      </p>
    </div>
  );
};

// Función auxiliar para cargar imágenes
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Función de dibujo de overlays (simplificada para preview)
function drawOverlays(
  ctx: CanvasRenderingContext2D,
  aliadoLogo: HTMLImageElement,
  elGestorLogo: HTMLImageElement,
  subtitle: string,
  propertyData: PropertyData,
  aliadoConfig: AliadoConfig,
  visualSettings: MultiVideoVisualSettings
) {
  const { logoSettings, textComposition, visualLayers, gradientDirection, gradientIntensity } = visualSettings;

  // Aplicar gradiente de fondo
  if (gradientDirection !== 'none') {
    const intensity = gradientIntensity / 100;
    const gradientAlpha = 0.7 * intensity;
    
    if (gradientDirection === 'top' || gradientDirection === 'both') {
      const gradient = ctx.createLinearGradient(0, 0, 0, 800);
      gradient.addColorStop(0, `rgba(0, 0, 0, ${gradientAlpha})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 800);
    }
    
    if (gradientDirection === 'bottom' || gradientDirection === 'both') {
      const gradient = ctx.createLinearGradient(0, 1920 - 800, 0, 1920);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, `rgba(0, 0, 0, ${gradientAlpha})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 1920 - 800, 1080, 800);
    }
  }

  // Logo del aliado
  if (visualLayers.showAllyLogo) {
    const logoSizes: Record<string, number> = { small: 150, medium: 180, large: 210 };
    const logoHeight = logoSizes[logoSettings.size] || 180;
    const logoWidth = Math.min((aliadoLogo.width / aliadoLogo.height) * logoHeight, 900);
    
    ctx.globalAlpha = logoSettings.opacity / 100;
    
    const xPos = logoSettings.position === 'top-left' ? 30 : 1080 - logoWidth - 30;
    const yPos = 128;
    
    // Fondo del logo
    if (logoSettings.background !== 'none') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const padding = 12;
      
      ctx.beginPath();
      if (logoSettings.shape === 'circle') {
        const radius = Math.max(logoWidth, logoHeight) / 2 + padding;
        ctx.arc(xPos + logoWidth/2, yPos + logoHeight/2, radius, 0, Math.PI * 2);
      } else {
        const borderRadius = logoSettings.shape === 'squircle' ? 24 : 
                             logoSettings.shape === 'rounded' ? 16 : 0;
        ctx.beginPath();
        ctx.roundRect(xPos - padding, yPos - padding, logoWidth + padding*2, logoHeight + padding*2, borderRadius);
      }
      ctx.fill();
    }
    
    ctx.drawImage(aliadoLogo, xPos, yPos, logoWidth, logoHeight);
    ctx.globalAlpha = 1.0;
  }

  // Subtítulo
  if (subtitle && visualLayers.showBadge) {
    const baseSize = 56;
    const scaleFactor = 1 + (textComposition.badgeScale / 100);
    const fontSize = baseSize * scaleFactor;
    
    ctx.font = `bold ${fontSize}px Poppins, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const maxWidth = ctx.measureText(subtitle).width;
    const padding = 40;
    const bgWidth = maxWidth + padding * 2;
    const bgHeight = fontSize + padding;
    const x = (1080 - bgWidth) / 2;
    const y = 1920 * 0.68;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    ctx.roundRect(x, y, bgWidth, bgHeight, 20);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(subtitle, 1080 / 2, y + bgHeight/2);
  }

  // Footer con información de propiedad (CONDICIONAL)
  const showAnyFooterElement = visualLayers.showPrice || visualLayers.showBadge || visualLayers.showIcons;
  
  if (showAnyFooterElement) {
    const footerY = 1920 - 310;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(0, footerY, 1080, 310);
    
    ctx.fillStyle = '#1F2937';
    ctx.textAlign = 'left';
    
    let currentY = footerY + 55;
    
    // Precio
    if (visualLayers.showPrice) {
      ctx.font = 'bold 32px Poppins, sans-serif';
      const modalidadTexto = propertyData.modalidad === 'arriendo' ? 'ARRIENDO' : 'VENTA';
      ctx.fillText(modalidadTexto, 40, currentY);
      currentY += 55;
      
      ctx.font = 'bold 48px Poppins, sans-serif';
      const canonValue = propertyData.canon?.replace(/[^\d]/g, '') || '0';
      const ventaValue = propertyData.valorVenta?.replace(/[^\d]/g, '') || '0';
      const precioTexto = propertyData.modalidad === 'arriendo'
        ? `$${parseInt(canonValue).toLocaleString()}/mes`
        : `$${parseInt(ventaValue).toLocaleString()}`;
      ctx.fillText(precioTexto, 40, currentY);
      currentY += 45;
    }
    
    // Ubicación y tipo (badge)
    if (visualLayers.showBadge) {
      ctx.font = '28px Poppins, sans-serif';
      ctx.fillText(propertyData.ubicacion || 'Ubicación', 40, currentY);
      currentY += 50;
      
      ctx.font = 'bold 32px Poppins, sans-serif';
      const tipoTexto = propertyData.tipo?.toUpperCase() || 'INMUEBLE';
      ctx.fillText(tipoTexto, 40, currentY);
      currentY += 55;
    }
    
    // Atributos (iconos)
    if (visualLayers.showIcons) {
      ctx.font = '26px Poppins, sans-serif';
      let atributos = '';
      if (propertyData.habitaciones) atributos += `🛏 ${propertyData.habitaciones} Hab  `;
      if (propertyData.banos) atributos += `🚿 ${propertyData.banos} Baños  `;
      if (propertyData.parqueaderos) atributos += `🚗 ${propertyData.parqueaderos} Parq  `;
      if (propertyData.area) atributos += `📐 ${propertyData.area}m²`;
      ctx.fillText(atributos, 40, currentY);
    }
  }

  // Logo El Gestor (siempre visible, abajo derecha)
  if (visualLayers.showCTA) {
    const egLogoWidth = 200;
    const egLogoHeight = (elGestorLogo.height / elGestorLogo.width) * egLogoWidth;
    ctx.drawImage(elGestorLogo, 1080 - egLogoWidth - 30, 1920 - egLogoHeight - 30, egLogoWidth, egLogoHeight);
  }
}
