export type AlcanceRecursoCurso = 'CURSO' | 'HITO';
export type TipoContenidoRecurso = 'ARCHIVO' | 'ENLACE';
export type EstadoRecursoCurso = 'ACTIVO' | 'ARCHIVADO';
export type EstadoVersionRecurso = 'VIGENTE' | 'REEMPLAZADA';

export type CategoriaRecursoCurso =
  | 'NORMATIVA'
  | 'JURISPRUDENCIA'
  | 'DOCTRINA'
  | 'GUIA_ACADEMICA'
  | 'CASO_PRACTICO'
  | 'MODELO_JURIDICO'
  | 'MATERIAL_AUDIOVISUAL'
  | 'MATERIAL_COMPLEMENTARIO'
  | 'OTRO';

export type HitoRecurso = {
  id: number;
  numero: number;
  codigo: string;
  nombre: string;
};

export type AutorRecurso = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
};

export type ArchivoRecurso = {
  id: number;
  nombreOriginal: string;
  mimeType: string;
  extension: string;
  tamanioBytes: number;
  hashSha256: string | null;
  esAnalizadoIA: boolean;
  textoExtraido: string | null;
  cantidadDescargas: number;
  permiteDescarga: boolean;
  creadoEn: string;
};

export type VersionContenidoRecurso = {
  id: number;
  contenidoId: number;
  archivoId: number;
  numeroVersion: number;
  estado: EstadoVersionRecurso;
  motivoActualizacion: string | null;
  fechaDocumento: string | null;
  esVigente: boolean;
  reemplazadaEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
  archivo: ArchivoRecurso;
};

export type RecursoContenido = {
  id: number;
  recursoId: number;
  tipo: TipoContenidoRecurso;
  titulo: string;
  descripcion: string | null;
  urlExterna: string | null;
  orden: number;
  disponibleParaQuiz: boolean;
  estaActivo: boolean;
  eliminadoEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
  versiones: VersionContenidoRecurso[];
};

export type RecursoCurso = {
  id: number;
  cursoId: number;
  autorId: number;
  hitoId: number | null;
  titulo: string;
  descripcion: string | null;
  categoria: CategoriaRecursoCurso;
  alcance: AlcanceRecursoCurso;
  visibleParaEstudiantes: boolean;
  estado: EstadoRecursoCurso;
  estaActivo: boolean;
  publicadoEn: string | null;
  archivadoEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
  hito: HitoRecurso | null;
  autor: AutorRecurso;
  contenidos: RecursoContenido[];
};

export type CrearRecursoDatos = {
  titulo: string;
  descripcion: string;
  categoria: CategoriaRecursoCurso;
  alcance: AlcanceRecursoCurso;
  hitoId: number | null;
  visibleParaEstudiantes: boolean;
};

export type ActualizarRecursoDatos = CrearRecursoDatos;

export type NuevoArchivoRecurso = {
  archivo: File;
  titulo: string;
  descripcion: string;
  disponibleParaQuiz: boolean;
};

export type NuevoEnlaceRecurso = {
  titulo: string;
  descripcion: string;
  urlExterna: string;
};

export type ReemplazarContenidoDatos = {
  archivo: File;
  motivoActualizacion: string;
  fechaDocumento: string;
};

export const CATEGORIAS_RECURSO: Array<{
  id: CategoriaRecursoCurso;
  etiqueta: string;
  descripcion: string;
  color: string;
  fondo: string;
}> = [
  { id: 'NORMATIVA', etiqueta: 'Normativa', descripcion: 'Códigos, leyes, decretos y reglamentos.', color: '#2563eb', fondo: '#eff6ff' },
  { id: 'JURISPRUDENCIA', etiqueta: 'Jurisprudencia', descripcion: 'Sentencias, autos supremos y precedentes.', color: '#7c3aed', fondo: '#f5f3ff' },
  { id: 'DOCTRINA', etiqueta: 'Doctrina', descripcion: 'Libros, artículos y material doctrinal.', color: '#0891b2', fondo: '#ecfeff' },
  { id: 'GUIA_ACADEMICA', etiqueta: 'Guía académica', descripcion: 'Guías, resúmenes, esquemas y fichas.', color: '#16a34a', fondo: '#f0fdf4' },
  { id: 'CASO_PRACTICO', etiqueta: 'Caso práctico', descripcion: 'Casos, problemas y ejercicios de aplicación.', color: '#ea580c', fondo: '#fff7ed' },
  { id: 'MODELO_JURIDICO', etiqueta: 'Modelo jurídico', descripcion: 'Memoriales, contratos, demandas y escritos modelo.', color: '#be123c', fondo: '#fff1f2' },
  { id: 'MATERIAL_AUDIOVISUAL', etiqueta: 'Audiovisual', descripcion: 'Videos, clases grabadas y presentaciones.', color: '#db2777', fondo: '#fdf2f8' },
  { id: 'MATERIAL_COMPLEMENTARIO', etiqueta: 'Complementario', descripcion: 'Lecturas, enlaces e información adicional.', color: '#ca8a04', fondo: '#fefce8' },
  { id: 'OTRO', etiqueta: 'Otro', descripcion: 'Material que no pertenece a otra categoría.', color: '#64748b', fondo: '#f8fafc' },
];

export function obtenerCategoriaRecurso(categoria: CategoriaRecursoCurso) {
  return CATEGORIAS_RECURSO.find((item) => item.id === categoria) ?? CATEGORIAS_RECURSO[CATEGORIAS_RECURSO.length - 1];
}

export function obtenerVersionVigente(contenido: RecursoContenido) {
  return contenido.versiones.find((version) => version.esVigente) ?? contenido.versiones[0] ?? null;
}
