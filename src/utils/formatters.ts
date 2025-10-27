/**
 * Formatea un valor numérico como precio colombiano
 * @param value - Puede ser string "2500000" o número 2500000
 * @returns "$ 2.500.000"
 */
export const formatPrecioColombia = (value: string | number): string => {
  if (!value) return "";
  
  const numericValue = typeof value === 'string' 
    ? parseInt(value.replace(/\D/g, '')) 
    : value;
  
  if (isNaN(numericValue)) return "";
  
  return `$ ${numericValue.toLocaleString('es-CO')}`;
};
