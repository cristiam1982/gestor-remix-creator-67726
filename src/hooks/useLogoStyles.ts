import { useMemo } from 'react';
import { LogoSettings } from '@/types/property';

/**
 * Hook centralizado para generar los estilos del logo
 * Elimina duplicación entre ReelSlideshow y ArrendadoReelSlideshow
 */
export const useLogoStyles = (logoSettings: LogoSettings) => {
  return useMemo(() => {
    // Tamaños unificados
    const sizes = { small: 60, medium: 70, large: 80, xlarge: 90 };
    const size = sizes[logoSettings.size as keyof typeof sizes] || sizes.medium;
    
    // Efectos de fondo profesionales (4 efectos disponibles en UI)
    let backgroundClass = 'bg-white/95 shadow-[0_2px_12px_rgba(0,0,0,0.08)]';
    
    switch (logoSettings.background) {
      case 'none':
        backgroundClass = 'bg-transparent drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]';
        break;
      case 'frosted':
        backgroundClass = 'backdrop-blur-[24px] bg-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.8)] border border-white/20';
        break;
      case 'glow':
        backgroundClass = 'bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.4),0_0_40px_rgba(255,255,255,0.2),inset_0_0_20px_rgba(255,255,255,0.1)]';
        break;
      case 'elevated':
        backgroundClass = 'bg-gradient-to-br from-white via-white/98 to-gray-50/95 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]';
        break;
    }

    // Posiciones unificadas
    const positionClasses = {
      'top-left': 'top-6 left-6',
      'top-right': 'top-6 right-6'
    };

    // Formas unificadas
    const shapeClasses = {
      square: 'rounded-none',
      rounded: 'rounded-xl',
      circle: 'rounded-full',
      squircle: 'rounded-[22%]'
    };

    return {
      size: `${size}px`,
      opacity: logoSettings.opacity / 100,
      backgroundClass,
      positionClass: positionClasses[logoSettings.position],
      shapeClass: shapeClasses[logoSettings.shape || 'rounded']
    };
  }, [logoSettings]);
};
