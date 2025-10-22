import { PropertyType, ContentType } from "@/types/property";
import { getViralIdeas, getContentTypeStrategy, getViralHashtags } from "@/utils/viralIdeas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Target, Hash, TrendingUp } from "lucide-react";

interface ViralIdeasPanelProps {
  propertyType: PropertyType;
  contentType: ContentType;
  ciudad: string;
}

export const ViralIdeasPanel = ({
  propertyType,
  contentType,
  ciudad,
}: ViralIdeasPanelProps) => {
  const ideas = getViralIdeas(propertyType, contentType);
  const strategy = getContentTypeStrategy(contentType);
  const hashtags = getViralHashtags(ciudad, propertyType);

  return (
    <Card className="w-full bg-gradient-to-br from-background to-muted/20 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <CardTitle>Ideas Virales</CardTitle>
        </div>
        <CardDescription>
          Estrategias probadas para maximizar el alcance de tu publicación
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ideas" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ideas">
              <Lightbulb className="w-4 h-4 mr-2" />
              Ideas
            </TabsTrigger>
            <TabsTrigger value="estrategia">
              <Target className="w-4 h-4 mr-2" />
              Estrategia
            </TabsTrigger>
            <TabsTrigger value="hashtags">
              <Hash className="w-4 h-4 mr-2" />
              Hashtags
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ideas" className="space-y-4">
            {ideas.map((idea, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-card hover:shadow-lg transition-shadow"
              >
                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                    {index + 1}
                  </span>
                  {idea.title}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {idea.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {idea.hashtags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs space-y-1 pt-2 border-t">
                  <p>
                    <span className="font-medium">Estilo:</span> {idea.captionStyle}
                  </p>
                  <p>
                    <span className="font-medium">CTA:</span> "{idea.callToAction}"
                  </p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="estrategia" className="space-y-4">
            <div className="p-6 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10">
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Estrategia para {contentType === "post" ? "Post" : contentType === "historia" ? "Historia" : contentType === "reel-fotos" ? "Reel con Fotos" : "Reel con Video"}
              </h4>
              <p className="text-sm leading-relaxed">{strategy}</p>
            </div>

            <div className="space-y-3">
              <h5 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Tips de viralidad
              </h5>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    <strong>Hook en 3 segundos:</strong> Captura atención inmediata con dato
                    sorprendente o pregunta
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    <strong>Claridad visual:</strong> Fotos nítidas, bien iluminadas, sin
                    desorden
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    <strong>CTA directo:</strong> "Agenda HOY", "Últimas unidades",
                    "Disponible YA"
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    <strong>Storytelling:</strong> Cuenta una historia, no solo muestres datos
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    <strong>Consistencia:</strong> Publica en horarios clave (7-9am, 12-2pm,
                    7-9pm)
                  </span>
                </li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="hashtags" className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <h5 className="font-semibold mb-3 flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" />
                Hashtags recomendados
              </h5>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => navigator.clipboard.writeText(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                💡 Click en cualquier hashtag para copiarlo
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <h6 className="font-semibold text-sm mb-2">Estrategia de hashtags</h6>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Usa 5-7 hashtags máximo para mantener profesionalismo</li>
                <li>• Combina hashtags locales + generales + marca</li>
                <li>• Evita hashtags prohibidos o spam</li>
                <li>• Actualiza hashtags según tendencias mensuales</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
