export const categorias = {
  MEMORIAL: "Memoriales",
  CONTRATO: "Contratos",
  DEMANDA: "Demandas",
  JURISPRUDENCIA: "Jurisprudencia",
  CODIGO: "Códigos",
  LEY: "Leyes",
  SENTENCIA: "Sentencias",
  DOCTRINA: "Doctrina",
  GUIA: "Guías",
  CASO_PRACTICO: "Casos prácticos",
  OTRO: "Otros",
} as const;
export type Categoria = keyof typeof categorias;
export type Estado = "BORRADOR" | "PUBLICADO" | "ARCHIVADO";
export const vigencias = {
  NO_APLICA: "No aplica",
  POR_VERIFICAR: "Por verificar",
  VIGENTE: "Vigente",
  MODIFICADA: "Modificada",
  DEROGADA: "Derogada",
} as const;
export type Vigencia = keyof typeof vigencias;
export type Version = {
  id: number;
  numeroVersion: number;
  nombreOriginal: string;
  extension: string;
  mimeType: string;
  tamanioBytes: number;
  creadoEn: string;
  motivoActualizacion?: string;
};
export type Contenido = {
  id: number;
  titulo: string;
  tipo: "ARCHIVO" | "ENLACE";
  urlExterna?: string;
  versiones: Version[];
};
export type Recurso = {
  id: number;
  titulo: string;
  descripcion: string;
  finalidad?: string;
  categoria: Categoria;
  tema: string;
  etiquetas: string[];
  autorInstitucion?: string;
  fuente?: string;
  fechaDocumento?: string;
  numeroNorma?: string;
  tribunal?: string;
  numeroResolucion?: string;
  vigencia: Vigencia;
  vigenciaVerificadaEn?: string;
  observacionVigencia?: string;
  destacado: boolean;
  estado: Estado;
  actualizadoEn: string;
  contenidos: Contenido[];
  esFavorito?: boolean;
  relacionados?: Pick<Recurso, "id" | "titulo" | "categoria" | "tema">[];
  creadoPor?: PublicadorBiblioteca;
};
export type Ficha = Omit<
  Recurso,
  | "id"
  | "estado"
  | "actualizadoEn"
  | "contenidos"
  | "esFavorito"
  | "relacionados"
  | "vigenciaVerificadaEn"
>;
export type Capacidades = { puedeGestionar: boolean; puedeDelegar: boolean };
export type Catalogo = {
  recursos: Recurso[];
  total: number;
  pagina: number;
  paginas: number;
};
export type Coleccion = {
  id: number;
  nombre: string;
  descripcion?: string;
  recursos: { recurso: Recurso }[];
};
export type Persona = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  correo: string;
};
export type Permiso = {
  id: number;
  docenteId: number;
  estaActivo: boolean;
  otorgadoEn: string;
  docente: Persona;
};
export type Reporte = {
  id: number;
  motivo: string;
  estado: "PENDIENTE" | "EN_REVISION" | "RESUELTO" | "DESCARTADO";
  respuesta?: string;
  recurso: { id: number; titulo: string };
  usuario: Persona;
  creadoEn: string;
};
export type Historial = {
  id: number;
  accion: string;
  creadoEn: string;
  actor: Persona;
  datos?: unknown;
};

export type PublicadorBiblioteca = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  rol: string;
  tratamiento?: 'DR' | 'DRA' | null;
};

export type ResumenBiblioteca = {
  totalRecursos: number;
  descargasPersonales: number;
  favoritosPersonales: number;
  categorias: {
    categoria: Categoria;
    total: number;
    visualizaciones: number;
  }[];
};
