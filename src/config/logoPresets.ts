import { LogoSettings } from "@/types/property";

export interface LogoPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: LogoSettings;
}

export const logoPresets: LogoPreset[] = [
  {
    id: 'elegante',
    name: 'Elegante',
    description: 'Sutil y profesional con efecto glass',
    icon: '💎',
    settings: {
      position: 'top-right',
      size: 'medium',
      background: 'frosted',
      shape: 'squircle',
      animation: 'none',
      opacity: 0.95
    }
  },
  {
    id: 'moderno',
    name: 'Moderno',
    description: 'Limpio con animación flotante',
    icon: '✨',
    settings: {
      position: 'top-left',
      size: 'medium',
      background: 'none',
      shape: 'circle',
      animation: 'floating',
      opacity: 1
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Elevado con máxima presencia',
    icon: '👑',
    settings: {
      position: 'bottom-center',
      size: 'large',
      background: 'elevated',
      shape: 'rounded',
      animation: 'none',
      opacity: 1
    }
  },
  {
    id: 'neon',
    name: 'Neón',
    description: 'Brillante con efecto glow y pulso',
    icon: '⚡',
    settings: {
      position: 'top-right',
      size: 'medium',
      background: 'glow',
      shape: 'circle',
      animation: 'pulse',
      opacity: 1
    }
  },
  {
    id: 'holografico',
    name: 'Holográfico',
    description: 'Futurista con gradiente arcoíris',
    icon: '🌈',
    settings: {
      position: 'top-left',
      size: 'medium',
      background: 'holographic',
      shape: 'squircle',
      animation: 'floating',
      opacity: 0.95
    }
  },
  {
    id: 'iridiscente',
    name: 'Iridiscente',
    description: 'Borde animado y elegante',
    icon: '💫',
    settings: {
      position: 'bottom-center',
      size: 'large',
      background: 'iridescent',
      shape: 'rounded',
      animation: 'none',
      opacity: 1
    }
  }
];
