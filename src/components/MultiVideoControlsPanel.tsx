import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GradientSelector } from "./GradientSelector";
import { GradientIntensitySlider } from "./GradientIntensitySlider";
import { ReelLogoControls } from "./ReelLogoControls";
import { ReelTextCompositionControls } from "./ReelTextCompositionControls";
import { ReelLayersPanel } from "./ReelLayersPanel";
import { MultiVideoFooterControls, FooterCustomization } from "./MultiVideoFooterControls";
import { LogoSettings, TextCompositionSettings, VisualLayers } from "@/types/property";

interface MultiVideoControlsPanelProps {
  // Gradient
  gradientDirection: 'none' | 'top' | 'bottom' | 'both';
  onGradientDirectionChange: (dir: 'none' | 'top' | 'bottom' | 'both') => void;
  gradientIntensity: number;
  onGradientIntensityChange: (intensity: number) => void;
  
  // Logo settings
  logoSettings: LogoSettings;
  onLogoSettingsChange: (settings: LogoSettings) => void;

  // Text composition
  textComposition: TextCompositionSettings;
  onTextCompositionChange: (settings: TextCompositionSettings) => void;

  // Visual layers
  visualLayers: VisualLayers;
  onVisualLayersChange: (layers: VisualLayers) => void;

  // Footer customization
  footerCustomization: FooterCustomization;
  onFooterCustomizationChange: (customization: FooterCustomization) => void;
}

export const MultiVideoControlsPanel = ({
  gradientDirection,
  onGradientDirectionChange,
  gradientIntensity,
  onGradientIntensityChange,
  logoSettings,
  onLogoSettingsChange,
  textComposition,
  onTextCompositionChange,
  visualLayers,
  onVisualLayersChange,
  footerCustomization,
  onFooterCustomizationChange
}: MultiVideoControlsPanelProps) => {
  return (
    <Accordion type="multiple" defaultValue={["logo", "visual-elements"]} className="w-full">
      
      {/* Logo del Aliado */}
      <AccordionItem value="logo">
        <AccordionTrigger className="text-sm font-semibold">
          🎨 Logo del Aliado
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <ReelLogoControls
            settings={logoSettings}
            onChange={onLogoSettingsChange}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Personaliza la posición, tamaño y estilo de tu logo.
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* Elementos Visuales */}
      <AccordionItem value="visual-elements">
        <AccordionTrigger className="text-sm font-semibold">
          📊 Elementos Visuales
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <ReelTextCompositionControls
            settings={textComposition}
            onChange={onTextCompositionChange}
          />
          
          <div className="border-t pt-4">
            <h4 className="text-xs font-semibold mb-3">Visibilidad de Capas</h4>
            <ReelLayersPanel
              layers={visualLayers}
              onChange={onVisualLayersChange}
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Efectos de Sombreado */}
      <AccordionItem value="gradient">
        <AccordionTrigger className="text-sm font-semibold">
          🌅 Efectos de Sombreado
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <GradientSelector
            direction={gradientDirection}
            onChange={onGradientDirectionChange}
          />
          <GradientIntensitySlider
            intensity={gradientIntensity}
            onChange={onGradientIntensityChange}
          />
        </AccordionContent>
      </AccordionItem>

      {/* Personalización de Textos */}
      <AccordionItem value="footer">
        <AccordionTrigger className="text-sm font-semibold">
          📝 Personalización de Textos
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <MultiVideoFooterControls
            customization={footerCustomization}
            onChange={onFooterCustomizationChange}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
