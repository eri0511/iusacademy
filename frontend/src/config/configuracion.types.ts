export type TemaAplicacion =
  | 'CLARO'
  | 'OSCURO'
  | 'SISTEMA';

export type PreferenciasConfiguracion = {
  tema:
    TemaAplicacion;

  reducirAnimaciones:
    boolean;

  sidebarContraido:
    boolean;
};

export const PREFERENCIAS_PREDETERMINADAS:
  PreferenciasConfiguracion = {
    tema:
      'CLARO',

    reducirAnimaciones:
      false,

    sidebarContraido:
      false,
  };