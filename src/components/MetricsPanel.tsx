import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMetricsStats } from "@/utils/metricsManager";
import { BarChart3, TrendingUp, Calendar, Trash2 } from "lucide-react";
import { useState } from "react";

interface MetricsPanelProps {
  onClearMetrics?: () => void;
}

export const MetricsPanel = ({ onClearMetrics }: MetricsPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const stats = getMetricsStats();

  if (stats.totalPublications === 0) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary">Tus Estadísticas</h3>
            <p className="text-xs text-muted-foreground">
              {stats.totalPublications} publicaciones creadas
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Ocultar" : "Ver más"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Total</p>
          <p className="text-2xl font-bold text-primary">{stats.totalPublications}</p>
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Últimos 7 días
          </p>
          <p className="text-2xl font-bold text-secondary">{stats.last7Days}</p>
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Este mes
          </p>
          <p className="text-2xl font-bold text-accent-foreground">{stats.last30Days}</p>
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Más usado</p>
          <p className="text-sm font-bold capitalize">
            {Object.entries(stats.byContentType).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"}
          </p>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3 animate-fade-in">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-semibold mb-2">Por tipo de contenido</p>
            <div className="space-y-1">
              {Object.entries(stats.byContentType).map(([type, count]) => (
                <div key={type} className="flex justify-between text-xs">
                  <span className="capitalize">{type.replace("-", " ")}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-semibold mb-2">Por tipo de inmueble</p>
            <div className="space-y-1">
              {Object.entries(stats.byPropertyType).map(([type, count]) => (
                <div key={type} className="flex justify-between text-xs">
                  <span className="capitalize">{type}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {onClearMetrics && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onClearMetrics}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar estadísticas
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
