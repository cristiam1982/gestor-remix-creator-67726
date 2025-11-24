import { useState, useEffect } from "react";
import { AllyData, PropertyData, LandingState } from "../types/landing";

const STORAGE_KEY = "landing-state";

const defaultAllyData: AllyData = {
  name: "Ruby Morales Inmobiliaria",
  whatsapp: "+573126041877",
  phone: "+573126041877",
  email: "contacto@rubymorales.com",
  city: "Cali",
  colors: {
    primary: "#FF8C42",
    secondary: "#2B3FD6",
    background: "#F5F6FA",
    accent: "#00A5BD",
  },
};

const defaultPropertyData: PropertyData = {
  type: "Apartamento",
  operation: "Arriendo",
  price: 1500000,
  neighborhood: "El Refugio",
  city: "Cali",
  builtArea: 65,
  privateArea: 60,
  bedrooms: 3,
  bathrooms: 2,
  parking: 1,
  stratum: 3,
  floor: 5,
  age: "5 años",
  adminFee: 150000,
  description: "Hermoso apartamento en excelente ubicación, con acabados de primera y vista panorámica.",
  benefits: [],
  photos: [],
};

export const useLandingState = () => {
  const [state, setState] = useState<LandingState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading landing state:", error);
    }
    return {
      ally: defaultAllyData,
      property: defaultPropertyData,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Error saving landing state:", error);
    }
  }, [state]);

  const updateAlly = (updates: Partial<AllyData>) => {
    setState((prev) => ({
      ...prev,
      ally: { ...prev.ally, ...updates },
    }));
  };

  const updateProperty = (updates: Partial<PropertyData>) => {
    setState((prev) => ({
      ...prev,
      property: { ...prev.property, ...updates },
    }));
  };

  return {
    ally: state.ally,
    property: state.property,
    updateAlly,
    updateProperty,
  };
};
