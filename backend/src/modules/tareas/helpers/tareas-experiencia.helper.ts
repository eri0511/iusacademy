import { BadRequestException } from '@nestjs/common';

import {
  CapacidadTarea,
  ModalidadTarea,
  ModoEdicionTarea,
  TipoComponenteTarea,
  TipoTarea,
} from '../../../generated/prisma/client';

import type { CrearComponenteTareaDto } from '../dto/crear-componente-tarea.dto';

type ExperienciaTarea = {
  capacidades: CapacidadTarea[];

  modoEdicion: ModoEdicionTarea;

  componentes: CrearComponenteTareaDto[];
};

const capacidadesPorComponente: Record<TipoComponenteTarea, CapacidadTarea[]> =
  {
    ARCHIVOS: [CapacidadTarea.ARCHIVOS],
    TEXTO: [
      CapacidadTarea.EDITOR_TEXTO,
      CapacidadTarea.HISTORIAL_VERSIONES,
      CapacidadTarea.EXPORTACION_PDF,
    ],
    DOCUMENTO_COLABORATIVO: [
      CapacidadTarea.EDITOR_TEXTO,
      CapacidadTarea.EDICION_COLABORATIVA,
      CapacidadTarea.SEGUIMIENTO_AUTORIA,
      CapacidadTarea.HISTORIAL_VERSIONES,
      CapacidadTarea.EXPORTACION_PDF,
    ],
    REDACCION_JURIDICA: [
      CapacidadTarea.EDITOR_TEXTO,
      CapacidadTarea.REDACCION_JURIDICA,
      CapacidadTarea.HISTORIAL_VERSIONES,
      CapacidadTarea.EXPORTACION_PDF,
    ],
    EXPOSICION: [
      CapacidadTarea.ARCHIVOS,
      CapacidadTarea.EXPOSICION,
      CapacidadTarea.EVIDENCIA_DOCENTE,
    ],
    CASO_PRACTICO: [
      CapacidadTarea.EDITOR_TEXTO,
      CapacidadTarea.CASO_ESTRUCTURADO,
      CapacidadTarea.HISTORIAL_VERSIONES,
      CapacidadTarea.EXPORTACION_PDF,
    ],
    PRESENCIAL: [CapacidadTarea.EVIDENCIA_DOCENTE],
  };

function unicas(capacidades: CapacidadTarea[]) {
  return Array.from(new Set(capacidades));
}

function capacidadesBase(tipo: TipoTarea) {
  switch (tipo) {
    case TipoTarea.ENTREGA_ARCHIVOS:
      return [CapacidadTarea.ARCHIVOS];

    case TipoTarea.RESPUESTA_ESCRITA:
      return [
        CapacidadTarea.EDITOR_TEXTO,
        CapacidadTarea.HISTORIAL_VERSIONES,
        CapacidadTarea.EXPORTACION_PDF,
      ];

    case TipoTarea.DOCUMENTO_COLABORATIVO:
      return [
        CapacidadTarea.EDITOR_TEXTO,
        CapacidadTarea.EDICION_COLABORATIVA,
        CapacidadTarea.SEGUIMIENTO_AUTORIA,
        CapacidadTarea.HISTORIAL_VERSIONES,
        CapacidadTarea.EXPORTACION_PDF,
      ];

    case TipoTarea.REDACCION_JURIDICA:
      return [
        CapacidadTarea.EDITOR_TEXTO,
        CapacidadTarea.REDACCION_JURIDICA,
        CapacidadTarea.HISTORIAL_VERSIONES,
        CapacidadTarea.EXPORTACION_PDF,
      ];

    case TipoTarea.EXPOSICION:
      return [
        CapacidadTarea.ARCHIVOS,
        CapacidadTarea.EXPOSICION,
        CapacidadTarea.EVIDENCIA_DOCENTE,
      ];

    case TipoTarea.CASO_PRACTICO:
      return [
        CapacidadTarea.EDITOR_TEXTO,
        CapacidadTarea.CASO_ESTRUCTURADO,
        CapacidadTarea.HISTORIAL_VERSIONES,
        CapacidadTarea.EXPORTACION_PDF,
      ];

    case TipoTarea.PRESENCIAL:
      return [CapacidadTarea.EVIDENCIA_DOCENTE];

    case TipoTarea.MIXTA:
      return [];
  }
}

export function resolverExperienciaTarea(
  tipo: TipoTarea,
  modalidad: ModalidadTarea,
  capacidadesSolicitadas: CapacidadTarea[] | undefined,
  componentesSolicitados: CrearComponenteTareaDto[] | undefined,
): ExperienciaTarea {
  const componentes = componentesSolicitados ?? [];

  if (tipo === TipoTarea.MIXTA && componentes.length < 2) {
    throw new BadRequestException(
      'Una tarea mixta debe contener al menos dos componentes',
    );
  }

  if (tipo !== TipoTarea.MIXTA && componentes.length > 0) {
    throw new BadRequestException(
      'Los componentes múltiples solo se permiten en tareas de tipo MIXTA',
    );
  }

  if (
    tipo === TipoTarea.DOCUMENTO_COLABORATIVO &&
    modalidad !== ModalidadTarea.GRUPAL
  ) {
    throw new BadRequestException(
      'Un documento colaborativo debe utilizar modalidad grupal',
    );
  }

  if (
    tipo === TipoTarea.MIXTA &&
    modalidad !== ModalidadTarea.GRUPAL &&
    componentes.some(
      (componente) =>
        componente.tipo === TipoComponenteTarea.DOCUMENTO_COLABORATIVO,
    )
  ) {
    throw new BadRequestException(
      'Una tarea mixta con documento colaborativo debe ser grupal',
    );
  }

  const capacidadesComponentes =
    tipo === TipoTarea.MIXTA
      ? componentes.flatMap(
          (componente) => capacidadesPorComponente[componente.tipo],
        )
      : [];

  const base = unicas([...capacidadesBase(tipo), ...capacidadesComponentes]);

  const permitidas = new Set<CapacidadTarea>([
    ...base,
    CapacidadTarea.ARCHIVOS,
    ...(modalidad === ModalidadTarea.GRUPAL &&
    base.includes(CapacidadTarea.EDITOR_TEXTO)
      ? [
          CapacidadTarea.EDICION_COLABORATIVA,
          CapacidadTarea.SEGUIMIENTO_AUTORIA,
          CapacidadTarea.HISTORIAL_VERSIONES,
        ]
      : []),
  ]);

  const noPermitidas = (capacidadesSolicitadas ?? []).filter(
    (capacidad) => !permitidas.has(capacidad),
  );

  if (noPermitidas.length) {
    throw new BadRequestException(
      `Capacidades incompatibles con el tipo de tarea: ${noPermitidas.join(', ')}`,
    );
  }

  let capacidades = unicas([...base, ...(capacidadesSolicitadas ?? [])]);

  const usaEditor = capacidades.includes(CapacidadTarea.EDITOR_TEXTO);

  const necesitaColaboracion =
    modalidad === ModalidadTarea.GRUPAL &&
    usaEditor &&
    (tipo === TipoTarea.DOCUMENTO_COLABORATIVO ||
      tipo === TipoTarea.REDACCION_JURIDICA ||
      tipo === TipoTarea.RESPUESTA_ESCRITA ||
      tipo === TipoTarea.CASO_PRACTICO ||
      (tipo === TipoTarea.MIXTA &&
        componentes.some((componente) =>
          [
            TipoComponenteTarea.TEXTO,
            TipoComponenteTarea.DOCUMENTO_COLABORATIVO,
            TipoComponenteTarea.REDACCION_JURIDICA,
            TipoComponenteTarea.CASO_PRACTICO,
          ].includes(componente.tipo),
        )));

  if (necesitaColaboracion) {
    capacidades = unicas([
      ...capacidades,
      CapacidadTarea.EDICION_COLABORATIVA,
      CapacidadTarea.SEGUIMIENTO_AUTORIA,
      CapacidadTarea.HISTORIAL_VERSIONES,
    ]);
  }

  if (
    capacidades.includes(CapacidadTarea.SEGUIMIENTO_AUTORIA) &&
    !capacidades.includes(CapacidadTarea.EDICION_COLABORATIVA)
  ) {
    throw new BadRequestException(
      'El seguimiento de autoría requiere edición colaborativa',
    );
  }

  if (
    capacidades.includes(CapacidadTarea.EDICION_COLABORATIVA) &&
    modalidad !== ModalidadTarea.GRUPAL
  ) {
    throw new BadRequestException(
      'La edición colaborativa solo puede habilitarse en tareas grupales',
    );
  }

  if (
    capacidades.includes(CapacidadTarea.EDICION_COLABORATIVA) &&
    !capacidades.includes(CapacidadTarea.EDITOR_TEXTO)
  ) {
    throw new BadRequestException(
      'La edición colaborativa requiere editor interno',
    );
  }

  const modoEdicion = !usaEditor
    ? ModoEdicionTarea.SIN_EDITOR
    : modalidad === ModalidadTarea.GRUPAL
      ? ModoEdicionTarea.COLABORATIVO
      : ModoEdicionTarea.INDIVIDUAL;

  return {
    capacidades,
    modoEdicion,
    componentes,
  };
}
