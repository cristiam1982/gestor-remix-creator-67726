import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GradientSelector } from "./GradientSelector";
import { GradientIntensitySlider } from "./GradientIntensitySlider";
import { SummaryBackgroundSelector } from "./SummaryBackgroundSelector";
import { ReelLogoControls } from "./ReelLogoControls";
import { ReelTextCompositionControls } from "./ReelTextCompositionControls";
import { ReelLayersPanel } from "./ReelLayersPanel";
import { FirstPhotoControls } from "./FirstPhotoControls";
import { LogoSettings, TextCompositionSettings, VisualLayers, FirstPhotoConfig } from "@/types/property";

interface ReelControlsPanelProps {
  // Gradient
  gradientDirection: 'none' | 'top' | 'bottom' | 'both';
  onGradientDirectionChange: (dir: 'none' | 'top' | 'bottom' | 'both') => void;
  gradientIntensity: number;
  onGradientIntensityChange: (intensity: number) => void;
  
  // Summary background
  summaryBackground: 'solid' | 'blur' | 'mosaic';
  onSummaryBackgroundChange: (bg: 'solid' | 'blur' | 'mosaic') => void;
  summarySolidColor?: string;
  onSummarySolidColorChange?: (color: string) => void;
  customPhone?: string;
  onCustomPhoneChange?: (phone: string) => void;
  customHashtag?: string;
  onCustomHashtagChange?: (hashtag: string) => void;

  // Logo settings (Fase 6)
  logoSettings: LogoSettings;
  onLogoSettingsChange: (settings: LogoSettings) => void;

  // Text composition (Fase 6)
  textComposition: TextCompositionSettings;
  onTextCompositionChange: (settings: TextCompositionSettings) => void;

  // Visual layers (Fase 6)
  visualLayers: VisualLayers;
  onVisualLayersChange: (layers: VisualLayers) => void;

  // First photo config
  firstPhotoConfig: FirstPhotoConfig;
  onFirstPhotoConfigChange: (config: FirstPhotoConfig) => void;
}

export const ReelControlsPanel = ({
  gradientDirection,
  onGradientDirectionChange,
  gradientIntensity,
  onGradientIntensityChange,
  summaryBackground,
  onSummaryBackgroundChange,
  summarySolidColor,
  onSummarySolidColorChange,
  customPhone,
  onCustomPhoneChange,
  customHashtag,
  onCustomHashtagChange,
  logoSettings,
  onLogoSettingsChange,
  textComposition,
  onTextCompositionChange,
  visualLayers,
  onVisualLayersChange,
  firstPhotoConfig,
  onFirstPhotoConfigChange
}: ReelControlsPanelProps) => {
  return (
    <Accordion type="multiple" defaultValue={["first-photo", "logo", "visual-elements"]} className="w-full">
      
      {/* Primera Foto (Portada) */}
      <AccordionItem value="first-photo">
        <AccordionTrigger className="text-sm font-semibold">
          🎬 Primera Foto (Portada)
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <FirstPhotoControls
            settings={firstPhotoConfig}
            onChange={onFirstPhotoConfigChange}
            showDuration={true}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Personaliza cómo se muestra la primera foto del reel
          </p>
        </AccordionContent>
      </AccordionItem>
      
      {/* Sección 1: Logo del Aliado */}
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
            Personaliza la posición, tamaño y estilo de tu logo en el reel.
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* Sección 2: Elementos Visuales (FUSIÓN de Texto + Capas) */}
      <AccordionItem value="visual-elements">
        <AccordionTrigger className="text-sm font-semibold">
          📊 Elementos Visuales
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
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
            />
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Controla el tamaño de los textos y la visibilidad de cada elemento del reel.
          </p>
        </AccordionContent>
      </AccordionItem>

      
      {/* Sección 4: Efectos de Sombreado */}
      <AccordionItem value="gradients">
        <AccordionTrigger className="text-sm font-semibold">
          🌗 Efectos de Sombreado en Fotos
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <GradientSelector
            direction={gradientDirection}
            onChange={onGradientDirectionChange}
          />
          
          {gradientDirection !== 'none' && (
            <GradientIntensitySlider
              intensity={gradientIntensity}
              onChange={onGradientIntensityChange}
            />
          )}
          
          <p className="text-xs text-muted-foreground mt-2">
            Ajusta la dirección e intensidad del sombreado para mejorar la legibilidad del texto sobre las fotos.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      {/* Sección 5: Fondo del Slide Final */}
      <AccordionItem value="summary">
        <AccordionTrigger className="text-sm font-semibold">
          🎬 Fondo del Slide Final
        </AccordionTrigger>
        <AccordionContent className="pt-2">
          <SummaryBackgroundSelector
            selected={summaryBackground}
            onChange={onSummaryBackgroundChange}
            solidColor={summarySolidColor}
            onColorChange={onSummarySolidColorChange}
            customPhone={customPhone}
            onPhoneChange={onCustomPhoneChange}
            customHashtag={customHashtag}
            onHashtagChange={onCustomHashtagChange}
          />
          
          <p className="text-xs text-muted-foreground mt-2">
            Elige el estilo de fondo para el último slide con tu información de contacto.
          </p>
        </AccordionContent>
      </AccordionItem>
      
    </Accordion>
  );
};
