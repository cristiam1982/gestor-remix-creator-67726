interface PublicationMetric {
  id: string;
  tipo: string;
  contentType: string;
  template: string;
  timestamp: number;
}

const METRICS_KEY = "publication-metrics";
const MAX_METRICS = 100;

export const savePublicationMetric = (
  tipo: string,
  contentType: string,
  template: string
): void => {
  try {
    const metrics = getMetrics();
    
    const newMetric: PublicationMetric = {
      id: `pub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tipo,
      contentType,
      template,
      timestamp: Date.now(),
    };

    metrics.unshift(newMetric);
    
    // Mantener solo las últimas MAX_METRICS publicaciones
    const trimmedMetrics = metrics.slice(0, MAX_METRICS);
    
    localStorage.setItem(METRICS_KEY, JSON.stringify(trimmedMetrics));
  } catch (error) {
    console.error("Error saving metric:", error);
  }
};

export const getMetrics = (): PublicationMetric[] => {
  try {
    const stored = localStorage.getItem(METRICS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading metrics:", error);
    return [];
  }
};

export const getMetricsStats = () => {
  const metrics = getMetrics();
  
  const totalPublications = metrics.length;
  
  const byContentType = metrics.reduce((acc, m) => {
    acc[m.contentType] = (acc[m.contentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const byPropertyType = metrics.reduce((acc, m) => {
    acc[m.tipo] = (acc[m.tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const byTemplate = metrics.reduce((acc, m) => {
    acc[m.template] = (acc[m.template] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const last7Days = metrics.filter(
    (m) => Date.now() - m.timestamp < 7 * 24 * 60 * 60 * 1000
  ).length;
  
  const last30Days = metrics.filter(
    (m) => Date.now() - m.timestamp < 30 * 24 * 60 * 60 * 1000
  ).length;

  return {
    totalPublications,
    byContentType,
    byPropertyType,
    byTemplate,
    last7Days,
    last30Days,
  };
};

export const clearMetrics = (): void => {
  try {
    localStorage.removeItem(METRICS_KEY);
  } catch (error) {
    console.error("Error clearing metrics:", error);
  }
};
