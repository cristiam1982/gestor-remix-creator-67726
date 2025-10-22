import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Copy, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RemixBannerProps {
  aliadoNombre: string;
  remixLink?: string;
  onGenerateLink: () => void;
}

export const RemixBanner = ({ aliadoNombre, remixLink, onGenerateLink }: RemixBannerProps) => {
  const { toast } = useToast();

  const handleCopyLink = () => {
    if (remixLink) {
      navigator.clipboard.writeText(remixLink);
      toast({
        title: "✨ Link copiado",
        description: "Comparte este link para que otros aliados usen tu configuración",
      });
    }
  };

  return (
    <div className="space-y-3">
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-900">
          Esta versión pertenece a <strong>{aliadoNombre}</strong>
        </AlertDescription>
      </Alert>

      <div className="flex gap-2">
        {!remixLink ? (
          <Button
            onClick={onGenerateLink}
            variant="outline"
            size="sm"
            className="w-full"
          >
            🔗 Generar Link de Remix
          </Button>
        ) : (
          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar Link de Remix
          </Button>
        )}
      </div>

      {remixLink && (
        <p className="text-xs text-muted-foreground">
          Comparte este link para que otros aliados dupliquen tu configuración y creen su propia versión
        </p>
      )}
    </div>
  );
};
