import { LogoSettings, TextCompositionSettings, VisualLayers, FirstPhotoConfig } from "@/types/property";
import { ReelLogoControls } from "@/components/ReelLogoControls";
import { ReelTextCompositionControls } from "@/components/ReelTextCompositionControls";
import { ReelLayersPanel } from "@/components/ReelLayersPanel";
import { FirstPhotoControls } from "@/components/FirstPhotoControls";
import { GradientSelector } from "@/components/GradientSelector";
import { GradientIntensitySlider } from "@/components/GradientIntensitySlider";
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
}: PostControlsPanelProps) => {
  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">⚙️ Personalización</h2>
        <p className="text-sm text-muted-foreground">
          Ajusta la apariencia de tu publicación
        </p>
      </div>

      <Accordion type="multiple" className="w-full" defaultValue={["logo", "text"]}>
        {/* Logo del Aliado */}
        <AccordionItem value="logo">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            🎨 Logo del Aliado
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <ReelLogoControls
              settings={logoSettings}
              onChange={onLogoSettingsChange}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Composición de Texto */}
        <AccordionItem value="text">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            📝 Composición de Texto
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <ReelTextCompositionControls
              settings={textComposition}
              onChange={onTextCompositionChange}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Capas Visuales */}
        <AccordionItem value="layers">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            🎭 Capas Visuales
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <ReelLayersPanel
              layers={visualLayers}
              onChange={onVisualLayersChange}
              hiddenLayers={['showCTA', 'showBadge']}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Primera Foto (Portada) */}
        <AccordionItem value="first-photo">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            🌟 Primera Foto (Portada)
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <FirstPhotoControls
              settings={firstPhotoConfig}
              onChange={onFirstPhotoConfigChange}
              showDuration={false}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Efectos de Sombreado */}
        <AccordionItem value="gradient">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            🌈 Efectos de Sombreado
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-6">
            <GradientSelector
              selected={gradientDirection}
              onChange={onGradientDirectionChange}
            />
            <GradientIntensitySlider
              intensity={gradientIntensity}
              onChange={onGradientIntensityChange}
              disabled={gradientDirection === 'none'}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};
