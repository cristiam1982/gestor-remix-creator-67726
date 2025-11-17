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
    
    // ✅ FORZAR background='none' cuando shape='circle'
    let backgroundClass = '';
    
    if (logoSettings.shape !== 'circle') {
      // Solo aplicar fondos si NO es círculo
      switch (logoSettings.background) {
        case 'none':
          backgroundClass = '';
          break;
        case 'frosted':
          backgroundClass = 'backdrop-blur-[24px] bg-white/50 border border-white/20';
          break;
        case 'glow':
          backgroundClass = 'bg-white/90';
          break;
        case 'elevated':
          backgroundClass = 'bg-gradient-to-br from-white via-white/98 to-gray-50/95';
          break;
      }
    }
    // Si shape === 'circle', backgroundClass permanece vacío

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
