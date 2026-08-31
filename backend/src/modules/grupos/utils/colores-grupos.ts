export const PALETA_GRUPOS = [
  '#2563EB',
  '#16A34A',
  '#D97706',
  '#7C3AED',
  '#DC2626',
  '#0891B2',
  '#DB2777',
  '#4F46E5',
  '#65A30D',
  '#EA580C',
  '#0F766E',
  '#9333EA',
] as const;

export function obtenerColorGrupo(indice: number): string {
  const posicion = Math.abs(indice) % PALETA_GRUPOS.length;

  return PALETA_GRUPOS[posicion];
}
