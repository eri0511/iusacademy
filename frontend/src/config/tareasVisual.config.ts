import {
  CheckCircle2,
  FilePenLine,
  Files,
  ListChecks,
  Presentation,
  Scale,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

import type {
  TipoTarea,
} from '../types/tareas/tareas.types';

export type VisualTipoTarea = {
  nombre: string;
  nombreCorto: string;
  descripcionDocente: string;
  descripcionEstudiante: string;
  color: string;
  fondo: string;
  icono: LucideIcon;
};

export const visualTipoTarea: Record<
  TipoTarea,
  VisualTipoTarea
> = {
  ENTREGA_ARCHIVOS: {
    nombre: 'Entrega de archivos',
    nombreCorto: 'Entrega de archivos',
    descripcionDocente:
      'Actividad orientada a informes, documentos, imágenes y evidencias adjuntas.',
    descripcionEstudiante:
      'Sube informes, documentos, imágenes u otras evidencias permitidas.',
    color: '#f97316',
    fondo: '#fff7ed',
    icono: Files,
  },

  RESPUESTA_ESCRITA: {
    nombre: 'Respuesta escrita',
    nombreCorto: 'Respuesta escrita',
    descripcionDocente:
      'Desarrollo individual mediante el editor interno de IusAcademy.',
    descripcionEstudiante:
      'Desarrolla tu respuesta directamente dentro de IusAcademy.',
    color: '#2563eb',
    fondo: '#eff6ff',
    icono: FilePenLine,
  },

  DOCUMENTO_COLABORATIVO: {
    nombre: 'Documento colaborativo',
    nombreCorto: 'Documento colaborativo',
    descripcionDocente:
      'Construcción conjunta con autoría, historial y seguimiento de contribuciones.',
    descripcionEstudiante:
      'Tu equipo construirá un documento compartido con seguimiento de aportes.',
    color: '#7c3aed',
    fondo: '#f5f3ff',
    icono: Workflow,
  },

  REDACCION_JURIDICA: {
    nombre: 'Redacción jurídica',
    nombreCorto: 'Redacción jurídica',
    descripcionDocente:
      'Producción guiada de memoriales, demandas, contratos y otros documentos jurídicos.',
    descripcionEstudiante:
      'Redacta el documento jurídico solicitado siguiendo las instrucciones del docente.',
    color: '#dc2626',
    fondo: '#fef2f2',
    icono: Scale,
  },

  EXPOSICION: {
    nombre: 'Exposición',
    nombreCorto: 'Exposición',
    descripcionDocente:
      'Actividad para presentaciones, material de apoyo y evaluación de exposición.',
    descripcionEstudiante:
      'Consulta la consigna y prepara el material requerido para tu presentación.',
    color: '#f18b4b',
    fondo: '#fff0df',
    icono: Presentation,
  },

  CASO_PRACTICO: {
    nombre: 'Caso práctico',
    nombreCorto: 'Caso práctico',
    descripcionDocente:
      'Resolución estructurada de problemas jurídicos y aplicación de conceptos.',
    descripcionEstudiante:
      'Analiza el caso planteado y desarrolla una solución jurídicamente fundamentada.',
    color: '#16a34a',
    fondo: '#f0fdf4',
    icono: ListChecks,
  },

  MIXTA: {
    nombre: 'Actividad mixta',
    nombreCorto: 'Mixta',
    descripcionDocente:
      'Combina varios componentes y evidencias dentro de una sola actividad.',
    descripcionEstudiante:
      'Completa los componentes configurados por el docente dentro de una sola actividad.',
    color: '#0f766e',
    fondo: '#f0fdfa',
    icono: Workflow,
  },

  PRESENCIAL: {
    nombre: 'Actividad presencial',
    nombreCorto: 'Presencial',
    descripcionDocente:
      'Evidencia registrada principalmente por el docente para una actividad realizada en aula.',
    descripcionEstudiante:
      'La evidencia principal será registrada por el docente según la actividad realizada en aula.',
    color: '#64748b',
    fondo: '#f8fafc',
    icono: CheckCircle2,
  },
};

export function obtenerVisualTipoTarea(
  tipo: TipoTarea,
): VisualTipoTarea {
  return visualTipoTarea[tipo];
}
