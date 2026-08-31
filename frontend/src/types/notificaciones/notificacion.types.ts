export type TipoNotificacion =
  | 'NUEVA_TAREA'
  | 'TAREA_POR_VENCER'
  | 'TAREA_VENCIDA'
  | 'NUEVO_TABLON'
  | 'NOTA_PUBLICADA'
  | 'EXTENSION_PLAZO'
  | 'FORO_POR_VENCER'
  | 'FORO_NUEVO_TEMA';

export type Notificacion = {
  id: number;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string | null;
  enlace: string | null;
  esLeida: boolean;
  leidaEn: string | null;
  creadoEn: string;
};

export type RespuestaListarNotificaciones = {
  notificaciones: Notificacion[];
  total: number;
  noLeidas: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
};

export type RespuestaContarNoLeidas = {
  noLeidas: number;
};

export type RespuestaMarcarTodasLeidas = {
  actualizadas: number;
};

export type RespuestaEliminarNotificacion = {
  eliminada: boolean;
};
