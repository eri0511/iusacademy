import type {
  AccionHistorialGrupo,
  AlcanceConjuntoGrupo,
  CriterioDistribucionGrupo,
  MetodoCreacionGrupo,
} from '../../../generated/prisma/client';

export type EstudianteGrupoRespuesta = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  fotoPerfilUrl: string | null;
};

export type IntegranteGrupoRespuesta = {
  id: number;
  estudianteId: number;
  esRepresentante: boolean;
  agregadoEn: Date;
  estudiante: EstudianteGrupoRespuesta;
};

export type GrupoCursoRespuesta = {
  id: number;
  nombre: string;
  descripcion: string | null;
  color: string | null;
  orden: number;
  totalIntegrantes: number;
  integrantes: IntegranteGrupoRespuesta[];
};

export type ConjuntoGrupoRespuesta = {
  id: number;
  cursoId: number;
  hitoId: number | null;
  nombre: string;
  descripcion: string | null;
  alcance: AlcanceConjuntoGrupo;
  metodoCreacion: MetodoCreacionGrupo;
  criterioDistribucion: CriterioDistribucionGrupo | null;
  cantidadGruposObjetivo: number | null;
  integrantesPorGrupoObjetivo: number | null;
  requiereRepresentante: boolean;
  estaBloqueado: boolean;
  estaActivo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
  totalGrupos: number;
  totalIntegrantes: number;
  grupos: GrupoCursoRespuesta[];
};

export type HistorialGrupoRespuesta = {
  id: number;
  accion: AccionHistorialGrupo;
  detalle: unknown;
  registradoEn: Date;
  actor: {
    id: number;
    nombres: string;
    apellidoPaterno: string;
  };
  estudiante: {
    id: number;
    nombres: string;
    apellidoPaterno: string;
  } | null;
  grupo: {
    id: number;
    nombre: string;
  } | null;
};