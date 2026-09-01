export type OrigenRubrica =
  | 'MANUAL'
  | 'EXCEL';

export type RubricaNivel = {
  id: number;

  orden: number;

  etiqueta: string;

  puntos: number;

  descripcion: string | null;
};

export type RubricaCriterio = {
  id: number;

  orden: number;

  nombre: string;

  descripcion: string | null;

  peso: number;

  niveles: RubricaNivel[];
};

export type RubricaTarea = {
  id: number;

  tareaId: number;

  nombre: string;

  origen: OrigenRubrica;

  ponderacionMax: number;

  criterios: RubricaCriterio[];
};

export type RubricaNivelForm = {
  orden: number;

  etiqueta: string;

  puntos: number;

  descripcion?: string | null;
};

export type RubricaCriterioForm = {
  orden: number;

  nombre: string;

  descripcion?: string | null;

  peso: number;

  niveles: RubricaNivelForm[];
};

export type CrearRubricaDatos = {
  nombre: string;

  origen?: OrigenRubrica;

  ponderacionMax?: number;

  criterios: RubricaCriterioForm[];
};

export type RubricaItemCalificacion = {
  criterioId: number;

  nivelId?: number;

  puntosAsignados?: number;

  retroalimentacion?: string;
};

export type CalificarRubricaDatos = {
  items: RubricaItemCalificacion[];

  retroalimentacion?: string;
};

export type CriterioCalificacionEntrega = {
  id: number;

  calificacionId: number;

  criterioId: number;

  nivelId: number | null;

  puntosAsignados: number;

  retroalimentacion: string | null;

  criterio: RubricaCriterio;

  nivel: RubricaNivel | null;
};

export type CalificacionRubricaEntrega = {
  id: number;

  entregaId: number;

  completada: boolean;

  items: CriterioCalificacionEntrega[];
};