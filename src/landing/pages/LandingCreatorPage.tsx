import { useState } from "react";
import { useLandingState } from "../hooks/useLandingState";
import { LandingPreviewContainer } from "../components/LandingPreviewContainer";
import { LandingTemplateSelector } from "../components/LandingTemplateSelector";
import { LandingTemplateId } from "../templates/landingTemplates";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const LandingCreatorPage = () => {
  const { ally, property, updateAlly, updateProperty } = useLandingState();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LandingTemplateId>("moderna");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {!showPreview ? (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2 text-foreground">
                Creador de Landing Inmobiliaria
              </h1>
              <p className="text-muted-foreground">
                Completa los datos para generar tu landing premium
              </p>
            </div>

            <Tabs defaultValue="ally" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="ally">Datos del Aliado</TabsTrigger>
                <TabsTrigger value="property">Datos del Inmueble</TabsTrigger>
                <TabsTrigger value="template">Plantilla</TabsTrigger>
              </TabsList>

              <TabsContent value="ally">
                <Card className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="ally-name">Nombre del Aliado *</Label>
                    <Input
                      id="ally-name"
                      value={ally.name}
                      onChange={(e) => updateAlly({ name: e.target.value })}
                      placeholder="Ruby Morales Inmobiliaria"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ally-logo">URL del Logo</Label>
                    <Input
                      id="ally-logo"
                      value={ally.logoUrl || ""}
                      onChange={(e) => updateAlly({ logoUrl: e.target.value })}
                      placeholder="https://ejemplo.com/logo.png"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ally-whatsapp">WhatsApp</Label>
                      <Input
                        id="ally-whatsapp"
                        value={ally.whatsapp || ""}
                        onChange={(e) => updateAlly({ whatsapp: e.target.value })}
                        placeholder="+573001234567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ally-email">Email</Label>
                      <Input
                        id="ally-email"
                        type="email"
                        value={ally.email || ""}
                        onChange={(e) => updateAlly({ email: e.target.value })}
                        placeholder="contacto@ejemplo.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ally-city">Ciudad</Label>
                    <Input
                      id="ally-city"
                      value={ally.city || ""}
                      onChange={(e) => updateAlly({ city: e.target.value })}
                      placeholder="Cali"
                    />
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="property">
                <Card className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="property-type">Tipo de Inmueble *</Label>
                      <Input
                        id="property-type"
                        value={property.type}
                        onChange={(e) => updateProperty({ type: e.target.value })}
                        placeholder="Apartamento"
                      />
                    </div>
                    <div>
                      <Label htmlFor="property-operation">Operación *</Label>
                      <select
                        id="property-operation"
                        value={property.operation}
                        onChange={(e) => updateProperty({ operation: e.target.value as any })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      >
                        <option value="Arriendo">Arriendo</option>
                        <option value="Venta">Venta</option>
                        <option value="Ambos">Ambos</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="property-price">Precio *</Label>
                    <Input
                      id="property-price"
                      type="number"
                      value={property.price}
                      onChange={(e) => updateProperty({ price: parseFloat(e.target.value) })}
                      placeholder="1500000"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="property-neighborhood">Barrio</Label>
                      <Input
                        id="property-neighborhood"
                        value={property.neighborhood || ""}
                        onChange={(e) => updateProperty({ neighborhood: e.target.value })}
                        placeholder="El Refugio"
                      />
                    </div>
                    <div>
                      <Label htmlFor="property-city">Ciudad</Label>
                      <Input
                        id="property-city"
                        value={property.city || ""}
                        onChange={(e) => updateProperty({ city: e.target.value })}
                        placeholder="Cali"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="property-description">Descripción</Label>
                    <Textarea
                      id="property-description"
                      value={property.description || ""}
                      onChange={(e) => updateProperty({ description: e.target.value })}
                      placeholder="Describe las características principales del inmueble..."
                      rows={4}
                    />
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="template">
                <Card className="p-6">
                  <LandingTemplateSelector
                    selectedTemplate={selectedTemplate}
                    onChange={setSelectedTemplate}
                  />
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-8 flex justify-center">
              <Button
                onClick={() => setShowPreview(true)}
                size="lg"
                className="px-12"
              >
                Ver Preview de Landing
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">
                Preview de Landing Premium
              </h2>
              <Button
                onClick={() => setShowPreview(false)}
                variant="outline"
              >
                ← Volver a Editar
              </Button>
            </div>
            
            <div className="border-4 border-primary/20 rounded-lg overflow-hidden shadow-2xl">
              <LandingPreviewContainer selectedTemplate={selectedTemplate} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
