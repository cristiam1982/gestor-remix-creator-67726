import { useEffect, useRef } from "react";

const AUTOSAVE_KEY = "property-form-autosave";
const AUTOSAVE_INTERVAL = 3000; // 3 segundos

export const useAutoSave = <T,>(data: T, enabled: boolean = true) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Crear nuevo timeout para autoguardado
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error("Error auto-saving data:", error);
      }
    }, AUTOSAVE_INTERVAL);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled]);

  const loadAutoSavedData = (): T | null => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Error loading auto-saved data:", error);
      return null;
    }
  };

  const clearAutoSavedData = () => {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch (error) {
      console.error("Error clearing auto-saved data:", error);
    }
  };

  return {
    loadAutoSavedData,
    clearAutoSavedData,
  };
};
