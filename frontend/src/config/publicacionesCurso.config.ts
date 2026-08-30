import type {
  LucideIcon,
} from 'lucide-react';

import {
  AlarmClock,
  BookOpen,
  CalendarClock,
  Camera,
  FileText,
  FolderOpen,
  GraduationCap,
  Megaphone,
  PartyPopper,
  Presentation,
  Scale,
  UploadCloud,
} from 'lucide-react';

import type {
  PrioridadPublicacion,
  TipoPublicacionCurso,
} from '../types/aula/comunicacion-curso.types';

export type CampoDinamicoPublicacion =
  | 'REFERENCIA'
  | 'LUGAR'
  | 'ENLACE'
  | 'FECHA_INICIO'
  | 'FECHA_FIN'
  | 'CALENDARIO'
  | 'RECORDATORIOS';

export type ConfiguracionTipoPublicacion = {
  tipo:
    TipoPublicacionCurso;

  etiqueta:
    string;

  tituloFormulario:
    string;

  descripcion:
    string;

  icono:
    LucideIcon;

  tono:
    | 'azul'
    | 'verde'
    | 'rojo'
    | 'morado'
    | 'naranja'
    | 'celeste'
    | 'gris'
    | 'indigo'
    | 'amarillo'
    | 'rosa';

  prioridadSugerida:
    PrioridadPublicacion;

  campos:
    CampoDinamicoPublicacion[];

  fechaObligatoria:
    boolean;

  referenciaEtiqueta?:
    string;

  lugarEtiqueta?:
    string;

  enlaceEtiqueta?:
    string;

  fechaInicioEtiqueta?:
    string;

  fechaFinEtiqueta?:
    string;

  ejemploTitulo:
    string;
};

export const CONFIGURACION_TIPOS_PUBLICACION:
  Record<
    TipoPublicacionCurso,
    ConfiguracionTipoPublicacion
  > = {
  AVISO_GENERAL: {
    tipo:
      'AVISO_GENERAL',

    etiqueta:
      'Aviso general',

    tituloFormulario:
      'Nuevo aviso general',

    descripcion:
      'Comparte información importante con todo el curso.',

    icono:
      Megaphone,

    tono:
      'azul',

    prioridadSugerida:
      'INFORMATIVA',

    campos:
      [],

    fechaObligatoria:
      false,

    ejemploTitulo:
      'Información importante para el curso',
  },

  LECTURA_OBLIGATORIA: {
    tipo:
      'LECTURA_OBLIGATORIA',

    etiqueta:
      'Lectura obligatoria',

    tituloFormulario:
      'Nueva lectura obligatoria',

    descripcion:
      'Indica una lectura, capítulo o material que debe revisarse.',

    icono:
      BookOpen,

    tono:
      'verde',

    prioridadSugerida:
      'MEDIA',

    campos: [
      'REFERENCIA',
      'FECHA_INICIO',
      'RECORDATORIOS',
    ],

    fechaObligatoria:
      false,

    referenciaEtiqueta:
      'Libro, capítulo o referencia',

    fechaInicioEtiqueta:
      'Fecha límite de lectura',

    ejemploTitulo:
      'Lectura del Código Civil',
  },

  EXAMEN: {
    tipo:
      'EXAMEN',

    etiqueta:
      'Examen',

    tituloFormulario:
      'Programar examen',

    descripcion:
      'Informa fecha, horario y lugar de una evaluación.',

    icono:
      GraduationCap,

    tono:
      'rojo',

    prioridadSugerida:
      'ALTA',

    campos: [
      'FECHA_INICIO',
      'FECHA_FIN',
      'LUGAR',
      'CALENDARIO',
      'RECORDATORIOS',
    ],

    fechaObligatoria:
      true,

    fechaInicioEtiqueta:
      'Inicio del examen',

    fechaFinEtiqueta:
      'Fin del examen',

    lugarEtiqueta:
      'Aula o ubicación',

    ejemploTitulo:
      'Examen parcial del Hito',
  },

  PRESENTACION_PROYECTO: {
    tipo:
      'PRESENTACION_PROYECTO',

    etiqueta:
      'Presentación de proyecto',

    tituloFormulario:
      'Programar presentación',

    descripcion:
      'Organiza una exposición o defensa de proyecto.',

    icono:
      Presentation,

    tono:
      'morado',

    prioridadSugerida:
      'ALTA',

    campos: [
      'FECHA_INICIO',
      'FECHA_FIN',
      'LUGAR',
      'ENLACE',
      'CALENDARIO',
      'RECORDATORIOS',
    ],

    fechaObligatoria:
      true,

    fechaInicioEtiqueta:
      'Inicio de la presentación',

    fechaFinEtiqueta:
      'Fin estimado',

    lugarEtiqueta:
      'Aula o ambiente',

    enlaceEtiqueta:
      'Enlace virtual opcional',

    ejemploTitulo:
      'Presentación final del proyecto',
  },

  ENTREGA_PROYECTO: {
    tipo:
      'ENTREGA_PROYECTO',

    etiqueta:
      'Entrega de proyecto',

    tituloFormulario:
      'Programar entrega',

    descripcion:
      'Comunica la fecha límite de entrega de un proyecto.',

    icono:
      UploadCloud,

    tono:
      'naranja',

    prioridadSugerida:
      'ALTA',

    campos: [
      'FECHA_INICIO',
      'REFERENCIA',
      'CALENDARIO',
      'RECORDATORIOS',
    ],

    fechaObligatoria:
      true,

    fechaInicioEtiqueta:
      'Fecha y hora límite',

    referenciaEtiqueta:
      'Formato o requisitos de entrega',

    ejemploTitulo:
      'Entrega del proyecto integrador',
  },

  MATERIAL_COMPLEMENTARIO: {
    tipo:
      'MATERIAL_COMPLEMENTARIO',

    etiqueta:
      'Material complementario',

    tituloFormulario:
      'Compartir material',

    descripcion:
      'Publica documentos, guías o recursos de apoyo.',

    icono:
      FolderOpen,

    tono:
      'celeste',

    prioridadSugerida:
      'INFORMATIVA',

    campos: [
      'REFERENCIA',
      'ENLACE',
    ],

    fechaObligatoria:
      false,

    referenciaEtiqueta:
      'Descripción o referencia del material',

    enlaceEtiqueta:
      'Enlace al recurso',

    ejemploTitulo:
      'Guía complementaria de estudio',
  },

  JURISPRUDENCIA: {
    tipo:
      'JURISPRUDENCIA',

    etiqueta:
      'Jurisprudencia',

    tituloFormulario:
      'Compartir jurisprudencia',

    descripcion:
      'Destaca una sentencia, auto o criterio jurisprudencial.',

    icono:
      Scale,

    tono:
      'gris',

    prioridadSugerida:
      'MEDIA',

    campos: [
      'REFERENCIA',
      'ENLACE',
      'FECHA_INICIO',
    ],

    fechaObligatoria:
      false,

    referenciaEtiqueta:
      'Número de sentencia o referencia',

    enlaceEtiqueta:
      'Enlace al documento',

    fechaInicioEtiqueta:
      'Fecha recomendada de revisión',

    ejemploTitulo:
      'Sentencia Constitucional relevante',
  },

  CLASE_VIRTUAL: {
    tipo:
      'CLASE_VIRTUAL',

    etiqueta:
      'Clase virtual',

    tituloFormulario:
      'Programar clase virtual',

    descripcion:
      'Comparte el horario y enlace de una sesión virtual.',

    icono:
      Camera,

    tono:
      'indigo',

    prioridadSugerida:
      'ALTA',

    campos: [
      'FECHA_INICIO',
      'FECHA_FIN',
      'ENLACE',
      'CALENDARIO',
      'RECORDATORIOS',
    ],

    fechaObligatoria:
      true,

    fechaInicioEtiqueta:
      'Inicio de la clase',

    fechaFinEtiqueta:
      'Fin estimado',

    enlaceEtiqueta:
      'Enlace de la videollamada',

    ejemploTitulo:
      'Clase virtual de reforzamiento',
  },

  CAMBIO_HORARIO: {
    tipo:
      'CAMBIO_HORARIO',

    etiqueta:
      'Cambio de horario',

    tituloFormulario:
      'Comunicar cambio de horario',

    descripcion:
      'Informa una modificación de fecha, hora o aula.',

    icono:
      CalendarClock,

    tono:
      'amarillo',

    prioridadSugerida:
      'URGENTE',

    campos: [
      'FECHA_INICIO',
      'LUGAR',
      'CALENDARIO',
      'RECORDATORIOS',
    ],

    fechaObligatoria:
      true,

    fechaInicioEtiqueta:
      'Nuevo horario',

    lugarEtiqueta:
      'Nueva aula o ubicación',

    ejemploTitulo:
      'Cambio de horario de la clase',
  },

  RECORDATORIO: {
    tipo:
      'RECORDATORIO',

    etiqueta:
      'Recordatorio',

    tituloFormulario:
      'Crear recordatorio',

    descripcion:
      'Recuerda una actividad o fecha importante.',

    icono:
      AlarmClock,

    tono:
      'naranja',

    prioridadSugerida:
      'MEDIA',

    campos: [
      'FECHA_INICIO',
      'CALENDARIO',
      'RECORDATORIOS',
    ],

    fechaObligatoria:
      true,

    fechaInicioEtiqueta:
      'Fecha y hora del recordatorio',

    ejemploTitulo:
      'Recordatorio importante',
  },

  FELICITACION: {
    tipo:
      'FELICITACION',

    etiqueta:
      'Felicitación',

    tituloFormulario:
      'Publicar felicitación',

    descripcion:
      'Reconoce el esfuerzo o logro de los estudiantes.',

    icono:
      PartyPopper,

    tono:
      'rosa',

    prioridadSugerida:
      'INFORMATIVA',

    campos:
      [],

    fechaObligatoria:
      false,

    ejemploTitulo:
      'Felicitaciones por el trabajo realizado',
  },

  OTRO: {
    tipo:
      'OTRO',

    etiqueta:
      'Otro',

    tituloFormulario:
      'Nueva publicación',

    descripcion:
      'Crea una publicación personalizada.',

    icono:
      FileText,

    tono:
      'azul',

    prioridadSugerida:
      'INFORMATIVA',

    campos: [
      'REFERENCIA',
      'LUGAR',
      'ENLACE',
      'FECHA_INICIO',
      'FECHA_FIN',
      'CALENDARIO',
      'RECORDATORIOS',
    ],

    fechaObligatoria:
      false,

    referenciaEtiqueta:
      'Referencia opcional',

    lugarEtiqueta:
      'Lugar opcional',

    enlaceEtiqueta:
      'Enlace opcional',

    fechaInicioEtiqueta:
      'Fecha de inicio',

    fechaFinEtiqueta:
      'Fecha de finalización',

    ejemploTitulo:
      'Nueva información para el curso',
  },
};

export const TIPOS_PUBLICACION_ORDENADOS:
  TipoPublicacionCurso[] = [
  'AVISO_GENERAL',
  'LECTURA_OBLIGATORIA',
  'EXAMEN',
  'MATERIAL_COMPLEMENTARIO',
  'JURISPRUDENCIA',
  'CLASE_VIRTUAL',
  'CAMBIO_HORARIO',
  'RECORDATORIO',
  'FELICITACION',
  'OTRO',
];

export function obtenerConfiguracionTipoPublicacion(
  tipo:
    TipoPublicacionCurso,
): ConfiguracionTipoPublicacion {
  return CONFIGURACION_TIPOS_PUBLICACION[
    tipo
  ];
}

export function tipoPublicacionUsaCampo(
  tipo:
    TipoPublicacionCurso,
  campo:
    CampoDinamicoPublicacion,
): boolean {
  return CONFIGURACION_TIPOS_PUBLICACION[
    tipo
  ].campos.includes(
    campo,
  );
}