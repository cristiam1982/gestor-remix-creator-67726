import { LogoSettings, TextCompositionSettings, VisualLayers, FirstPhotoConfig } from "@/types/property";
import { ReelLogoControls } from "@/components/ReelLogoControls";
import { ReelTextCompositionControls } from "@/components/ReelTextCompositionControls";
import { ReelLayersPanel } from "@/components/ReelLayersPanel";
import { GradientSelector } from "@/components/GradientSelector";
import { GradientIntensitySlider } from "@/components/GradientIntensitySlider";
import { FirstPhotoControls } from "@/components/FirstPhotoControls";
import { GalleryBackgroundSelector } from "@/components/GalleryBackgroundSelector";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

type GradientDirection = 'top' | 'bottom' | 'both' | 'none';

interface PostControlsPanelProps {
  logoSettings: LogoSettings;
  onLogoSettingsChange: (settings: LogoSettings) => void;
  textComposition: TextCompositionSettings;
  onTextCompositionChange: (settings: TextCompositionSettings) => void;
  visualLayers: VisualLayers;
  onVisualLayersChange: (layers: VisualLayers) => void;
  gradientDirection: GradientDirection;
  onGradientDirectionChange: (direction: GradientDirection) => void;
  gradientIntensity: number;
  onGradientIntensityChange: (intensity: number) => void;
  firstPhotoConfig: FirstPhotoConfig;
  onFirstPhotoConfigChange: (config: FirstPhotoConfig) => void;
  isGalleryMode?: boolean;
  galleryBackgroundColor?: string;
  onGalleryBackgroundColorChange?: (color: string) => void;
  primaryColor?: string;
  secondaryColor?: string;
}

export const PostControlsPanel = ({
  logoSettings,
  onLogoSettingsChange,
  textComposition,
  onTextCompositionChange,
  visualLayers,
  onVisualLayersChange,
  gradientDirection,
  onGradientDirectionChange,
  gradientIntensity,
  onGradientIntensityChange,
  firstPhotoConfig,
  onFirstPhotoConfigChange,
  isGalleryMode = false,
  galleryBackgroundColor,
  onGalleryBackgroundColorChange,
  primaryColor,
  secondaryColor,
}: PostControlsPanelProps) => {
  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">⚙️ Personalización</h2>
        <p className="text-sm text-muted-foreground">
          Ajusta la apariencia de tu publicación
        </p>
      </div>

      <Accordion type="multiple" className="w-full" defaultValue={["first-photo", "logo", "visual-elements"]}>
        {/* Primera Foto (Portada) */}
        <AccordionItem value="first-photo">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            🎬 Primera Foto (Portada)
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <FirstPhotoControls
              settings={firstPhotoConfig}
              onChange={onFirstPhotoConfigChange}
              showDuration={false}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Personaliza cómo se muestra la primera foto del post
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Logo del Aliado */}
        <AccordionItem value="logo">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            🎨 Logo del Aliado
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <ReelLogoControls
              settings={logoSettings}
              onChange={onLogoSettingsChange}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Elementos Visuales (FUSIÓN de Texto + Capas) */}
        <AccordionItem value="visual-elements">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            📊 Elementos Visuales
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            {/* Composición de Texto */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Tamaños de Texto
              </h4>
              <ReelTextCompositionControls
                settings={textComposition}
                onChange={onTextCompositionChange}
              />
            </div>
            
            {/* Separador */}
            <div className="border-t my-4" />
            
            {/* Capas Visuales */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Visibilidad de Capas
              </h4>
              <ReelLayersPanel
                layers={visualLayers}
                onChange={onVisualLayersChange}
                hiddenLayers={['showCTA', 'showBadge']}
              />
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              Controla el tamaño de los textos y la visibilidad de cada elemento del post.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Color de Fondo (solo para Gallery) */}
        {isGalleryMode && (
          <AccordionItem value="gallery-background">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline">
              🎨 Color de Fondo
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <GalleryBackgroundSelector
                currentColor={galleryBackgroundColor || secondaryColor || '#000000'}
                primaryColor={primaryColor || '#000000'}
                secondaryColor={secondaryColor || '#000000'}
                onChange={onGalleryBackgroundColorChange || (() => {})}
              />
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Efectos de Sombreado (ocultar en Gallery) */}
        {!isGalleryMode && (
          <AccordionItem value="gradient">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline">
              🌈 Efectos de Sombreado
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-6">
              <GradientSelector
                direction={gradientDirection}
                onChange={onGradientDirectionChange}
              />
              <GradientIntensitySlider
                intensity={gradientIntensity}
                onChange={onGradientIntensityChange}
                disabled={gradientDirection === 'none'}
              />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </Card>
  );
};
