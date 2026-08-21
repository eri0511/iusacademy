export type EstadoEntregaTarea =
  | 'BORRADOR'
  | 'ENTREGADA'
  | 'TARDIA'
  | 'BLOQUEADA'
  | 'ANULADA';

export type ArchivoEntregaTarea = {
  id:
    number;

  cursoId?:
    number | null;

  subidoPorId?:
    number;

  entregaTareaId?:
    number | null;

  nombreOriginal:
    string;

  nombreAlmacenado?:
    string;

  mimeType:
    string;

  extension:
    string;

  tamanioBytes:
    number;

  permiteDescarga:
    boolean;

  estaActivo?:
    boolean;

  creadoEn:
    string;
};

export type EntregaTarea = {
  id:
    number;

  tareaId:
    number;

  autorEntregaId:
    number;

  estudianteId:
    number | null;

  grupoCursoId:
    number | null;

  equipoAfinidadTareaId:
    number | null;

  contenido:
    string | null;

  estado:
    EstadoEntregaTarea;

  esGrupal:
    boolean;

  entregadaTarde:
    boolean;

  minutosRetraso:
    number;

  descuentoCalculado:
    number | string;

  enviadaEn:
    string | null;

  editadaEn:
    string | null;

  bloqueadaEn:
    string | null;

  anuladaEn:
    string | null;

  estaActiva:
    boolean;

  creadoEn:
    string;

  actualizadoEn:
    string;

  archivos:
    ArchivoEntregaTarea[];

  autorEntrega?: {
    id:
      number;

    nombres:
      string;

    apellidoPaterno:
      string;
  };
};

export type PermisosEntregaTarea = {
  puedeModificar:
    boolean;

  esGrupal:
    boolean;
};

export type IntegranteContextoGrupoEntregaTarea = {
  estudianteId:
    number;

  esRepresentante:
    boolean;

  estudiante: {
    id:
      number;

    nombres:
      string;

    apellidoPaterno:
      string;

    apellidoMaterno:
      string | null;

    fotoPerfilUrl:
      string | null;
  };
};

export type ContextoGrupoEntregaTarea = {
  tipo:
    'PLATAFORMA'
    | 'AFINIDAD';

  id:
    number;

  nombre:
    string;

  responsable:
    'SOLO_REPRESENTANTE'
    | 'CUALQUIER_INTEGRANTE';

  esRepresentanteActual:
    boolean;

  representante: {
    id:
      number;

    nombres:
      string;

    apellidoPaterno:
      string;

    apellidoMaterno:
      string | null;

    fotoPerfilUrl:
      string | null;
  } | null;

  integrantes:
    IntegranteContextoGrupoEntregaTarea[];
};

export type RespuestaMiEntregaTarea = {
  entrega:
    EntregaTarea | null;

  permisos:
    PermisosEntregaTarea;

  contextoGrupo:
    ContextoGrupoEntregaTarea | null;
};

export type RespuestaGuardarEntregaTarea = {
  mensaje:
    string;

  entrega:
    EntregaTarea;
};

export type IntegranteEquipoAfinidadTarea = {
  id?:
    number;

  estudianteId:
    number;

  esRepresentante:
    boolean;

  estaActivo?:
    boolean;

  estudiante: {
    id:
      number;

    nombres:
      string;

    apellidoPaterno:
      string;

    apellidoMaterno?:
      string | null;

    correo?:
      string;

    fotoPerfilUrl?:
      string | null;
  };
};

export type EquipoAfinidadTarea = {
  id:
    number;

  tareaId?:
    number;

  cursoId?:
    number;

  creadorId?:
    number;

  nombre:
    string;

  estado:
    'ACTIVO'
    | 'BLOQUEADO'
    | 'INACTIVO';

  estaActivo?:
    boolean;

  integrantes:
    IntegranteEquipoAfinidadTarea[];
};

export type RespuestaMiEquipoAfinidadTarea = {
  equipo:
    EquipoAfinidadTarea | null;

  minimoIntegrantes:
    number;

  maximoIntegrantes:
    number;
};
