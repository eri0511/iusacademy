import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AlcanceConjuntoGrupo,
  CapacidadTarea,
  ComponenteEvaluacion,
  EstadoActividadCalificable,
  EstadoCurso,
  EstadoEntregaTarea,
  EstadoInscripcion,
  EstadoTarea,
  ModalidadNotaTarea,
  ModalidadTarea,
  ModoEdicionTarea,
  OrigenGrupoTarea,
  Prisma,
  Rol,
  TipoDescuentoRetraso,
  TipoEvaluacionGrupo,
  TipoOrigenActividad,
  TipoTarea,
} from '../../generated/prisma/client';

import {
  PrismaService,
} from '../../prisma/prisma.service';

import {
  ActualizarTareaDto,
} from './dto/actualizar-tarea.dto';

import {
  CrearComponenteTareaDto,
} from './dto/crear-componente-tarea.dto';

import {
  CrearTareaDto,
} from './dto/crear-tarea.dto';

import {
  ListarTareasDto,
} from './dto/listar-tareas.dto';

import {
  resolverExperienciaTarea,
} from './helpers/tareas-experiencia.helper';

import type {
  UsuarioAutenticado,
} from './interfaces/usuario-autenticado.interface';

import {
  TareasEvaluacionService,
} from './tareas-evaluacion.service';

type ConfiguracionTarea = {
  tipo:
    TipoTarea;
  capacidades:
    CapacidadTarea[];
  modoEdicion:
    ModoEdicionTarea;
  configuracionTipo:
    Record<string, unknown> | undefined;
  componentes:
    CrearComponenteTareaDto[];
  esCalificable:
    boolean;
  componente:
    ComponenteEvaluacion | null;
  puntajeMaximo:
    number;
  modalidad:
    ModalidadTarea;
  origenGrupo:
    OrigenGrupoTarea;
  conjuntoGrupoId:
    number | null;
  modalidadNota:
    ModalidadNotaTarea;
  porcentajeNotaGrupal:
    number | null;
  porcentajeNotaIndividual:
    number | null;
  requiereRepresentante:
    boolean;
  fechaApertura:
    Date;
  fechaLimite:
    Date;
  fechaCierre:
    Date;
  visibleAntesDeApertura:
    boolean;
  permitirRetrasos:
    boolean;
  fechaMaximaRetraso:
    Date | null;
  tipoDescuentoRetraso:
    TipoDescuentoRetraso;
  valorDescuentoRetraso:
    number | null;
  exigirContenidoEditor:
    boolean;
  exigirArchivo:
    boolean;
  maximoArchivos:
    number;
  tamanioMaximoArchivoMb:
    number;
  extensionesPermitidas:
    string[];
  permitirEditarEntrega:
    boolean;
};

@Injectable()
export class TareasService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly tareasEvaluacionService:
      TareasEvaluacionService,
  ) {}

  private readonly seleccionTarea = {
    id:
      true,
    cursoId:
      true,
    autorId:
      true,
    hitoId:
      true,
    conjuntoGrupoId:
      true,
    titulo:
      true,
    descripcion:
      true,
    instrucciones:
      true,
    tipo:
      true,
    capacidades:
      true,
    modoEdicion:
      true,
    configuracionTipo:
      true,
    esCalificable:
      true,
    componente:
      true,
    puntajeMaximo:
      true,
    modalidad:
      true,
    origenGrupo:
      true,
    modalidadNota:
      true,
    porcentajeNotaGrupal:
      true,
    porcentajeNotaIndividual:
      true,
    requiereRepresentante:
      true,
    fechaApertura:
      true,
    fechaLimite:
      true,
    fechaCierre:
      true,
    visibleAntesDeApertura:
      true,
    permitirRetrasos:
      true,
    fechaMaximaRetraso:
      true,
    tipoDescuentoRetraso:
      true,
    valorDescuentoRetraso:
      true,
    exigirContenidoEditor:
      true,
    exigirArchivo:
      true,
    maximoArchivos:
      true,
    tamanioMaximoArchivoMb:
      true,
    extensionesPermitidas:
      true,
    permitirEditarEntrega:
      true,
    estado:
      true,
    estaCerrada:
      true,
    estaActiva:
      true,
    publicadoEn:
      true,
    cerradoEn:
      true,
    eliminadoEn:
      true,
    creadoEn:
      true,
    actualizadoEn:
      true,
    hito: {
      select: {
        id:
          true,
        numero:
          true,
        codigo:
          true,
        nombre:
          true,
        fechaInicio:
          true,
        fechaFin:
          true,
      },
    },
    conjuntoGrupo: {
      select: {
        id:
          true,
        nombre:
          true,
        alcance:
          true,
        tipoEvaluacion:
          true,
        requiereRepresentante:
          true,
        estaBloqueado:
          true,
        estaActivo:
          true,
      },
    },
    componentes: {
      select: {
        id:
          true,
        orden:
          true,
        tipo:
          true,
        titulo:
          true,
        descripcion:
          true,
        obligatorio:
          true,
        configuracion:
          true,
      },
      orderBy: {
        orden:
          'asc' as const,
      },
    },
    actividadCalificable: {
      select: {
        id:
          true,
        origen:
          true,
        componente:
          true,
        puntajeMaximo:
          true,
        participaEnPromedio:
          true,
        estado:
          true,
        visibleParaEstudiantes:
          true,
        publicadaEn:
          true,
        cerradaEn:
          true,
      },
    },
    archivos: {
      where: {
        estaActivo:
          true,
      },
      select: {
        id:
          true,
        nombreOriginal:
          true,
        mimeType:
          true,
        extension:
          true,
        tamanioBytes:
          true,
        permiteDescarga:
          true,
        creadoEn:
          true,
      },
      orderBy: {
        creadoEn:
          'asc' as const,
      },
    },

    _count: {
      select: {
        entregas:
          true,
      },
    },
  } as const;

  private validarDocente(
    usuario:
      UsuarioAutenticado,
  ) {
    if (
      usuario.rol !==
      Rol.DOCENTE
    ) {
      throw new ForbiddenException(
        'Solo el docente puede administrar tareas',
      );
    }
  }

  private validarEstudiante(
    usuario:
      UsuarioAutenticado,
  ) {
    if (
      usuario.rol !==
      Rol.ESTUDIANTE
    ) {
      throw new ForbiddenException(
        'Solo el estudiante puede consultar las tareas del aula',
      );
    }
  }

  private async obtenerCursoDocente(
    docenteId:
      number,
    cursoId:
      number,
  ) {
    const curso =
      await this.prisma.curso.findFirst({
        where: {
          id:
            cursoId,
          docenteId,
        },
        select: {
          id:
            true,
          docenteId:
            true,
          planificacionId:
            true,
          estado:
            true,
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'El curso no existe o no pertenece al docente autenticado',
      );
    }

    if (
      curso.estado ===
      EstadoCurso.FINALIZADO
    ) {
      throw new BadRequestException(
        'No puedes administrar tareas de un curso finalizado',
      );
    }

    return curso;
  }

  private async validarInscripcionEstudiante(
    estudianteId:
      number,
    cursoId:
      number,
  ) {
    const inscripcion =
      await this.prisma.inscripcionCurso.findFirst({
        where: {
          cursoId,
          estudianteId,
          estado:
            EstadoInscripcion.ACTIVA,
        },
        select: {
          id:
            true,
        },
      });

    if (!inscripcion) {
      throw new ForbiddenException(
        'No tienes una inscripción activa en este curso',
      );
    }
  }

  private async validarHitoCurso(
    planificacionId:
      number | null,
    hitoId:
      number,
  ) {
    if (!planificacionId) {
      throw new BadRequestException(
        'El curso no tiene una planificación académica asignada',
      );
    }

    const hito =
      await this.prisma.hitoAcademico.findFirst({
        where: {
          id:
            hitoId,
          planificacionId,
        },
        select: {
          id:
            true,
        },
      });

    if (!hito) {
      throw new BadRequestException(
        'El hito seleccionado no pertenece a la planificación del curso',
      );
    }
  }

  private normalizarExtensiones(
    extensiones:
      string[] | undefined,
  ) {
    const permitidas = [
      'pdf',
      'doc',
      'docx',
      'jpg',
      'jpeg',
      'png',
      'webp',
      'ppt',
      'pptx',
    ];

    const origen =
      extensiones?.length
        ? extensiones
        : permitidas;

    const normalizadas =
      Array.from(
        new Set(
          origen.map(
            (
              extension,
            ) =>
              extension
                .trim()
                .toLowerCase()
                .replace(
                  /^\./,
                  '',
                ),
          ),
        ),
      ).filter(
        Boolean,
      );

    const invalidas =
      normalizadas.filter(
        (
          extension,
        ) =>
          !permitidas.includes(
            extension,
          ),
      );

    if (invalidas.length) {
      throw new BadRequestException(
        `Extensiones no permitidas: ${invalidas.join(', ')}`,
      );
    }

    return normalizadas;
  }

  private construirConfiguracion(
    datos:
      CrearTareaDto,
    opciones?: {
      validarContraAhora?:
        boolean;
    },
  ): ConfiguracionTarea {
    const experiencia =
      resolverExperienciaTarea(
        datos.tipo,
        datos.modalidad,
        datos.capacidades,
        datos.componentes,
      );

    const esCalificable =
      datos.esCalificable ??
      true;

    if (
      esCalificable &&
      !datos.componente
    ) {
      throw new BadRequestException(
        'Una tarea calificable debe pertenecer a Continua o Procesual',
      );
    }

    let origenGrupo =
      datos.origenGrupo ??
      OrigenGrupoTarea.NINGUNO;

    let conjuntoGrupoId =
      datos.conjuntoGrupoId ??
      null;

    let modalidadNota =
      datos.modalidadNota ??
      (
        datos.modalidad ===
        ModalidadTarea.GRUPAL
          ? ModalidadNotaTarea.GRUPAL
          : ModalidadNotaTarea.INDIVIDUAL
      );

    let porcentajeNotaGrupal =
      datos.porcentajeNotaGrupal ??
      null;

    let porcentajeNotaIndividual =
      datos.porcentajeNotaIndividual ??
      null;

    let requiereRepresentante =
      datos.requiereRepresentante ??
      false;

    if (
      datos.modalidad ===
      ModalidadTarea.INDIVIDUAL
    ) {
      origenGrupo =
        OrigenGrupoTarea.NINGUNO;
      conjuntoGrupoId =
        null;
      modalidadNota =
        ModalidadNotaTarea.INDIVIDUAL;
      porcentajeNotaGrupal =
        null;
      porcentajeNotaIndividual =
        null;
      requiereRepresentante =
        false;
    } else if (
      origenGrupo ===
      OrigenGrupoTarea.NINGUNO
    ) {
      throw new BadRequestException(
        'Una tarea grupal debe indicar si utilizará grupos de plataforma o grupos por afinidad',
      );
    }

    if (
      origenGrupo ===
        OrigenGrupoTarea.PLATAFORMA &&
      !conjuntoGrupoId
    ) {
      throw new BadRequestException(
        'Debes seleccionar el conjunto de grupos de plataforma',
      );
    }

    if (
      origenGrupo ===
      OrigenGrupoTarea.AFINIDAD
    ) {
      conjuntoGrupoId =
        null;
      requiereRepresentante =
        true;
    }

    if (
      modalidadNota ===
      ModalidadNotaTarea.GRUPAL_E_INDIVIDUAL
    ) {
      if (
        porcentajeNotaGrupal ===
          null ||
        porcentajeNotaIndividual ===
          null
      ) {
        throw new BadRequestException(
          'Debes indicar los porcentajes grupal e individual',
        );
      }

      if (
        Math.abs(
          porcentajeNotaGrupal +
          porcentajeNotaIndividual -
          100,
        ) >
        0.001
      ) {
        throw new BadRequestException(
          'Los porcentajes grupal e individual deben sumar 100',
        );
      }
    } else {
      porcentajeNotaGrupal =
        null;
      porcentajeNotaIndividual =
        null;
    }

    const fechaApertura =
      new Date(
        datos.fechaApertura,
      );

    const fechaLimite =
      new Date(
        datos.fechaLimite,
      );

    const fechaCierre =
      new Date(
        datos.fechaCierre,
      );

    if (
      Number.isNaN(
        fechaApertura.getTime(),
      ) ||
      Number.isNaN(
        fechaLimite.getTime(),
      ) ||
      Number.isNaN(
        fechaCierre.getTime(),
      )
    ) {
      throw new BadRequestException(
        'Las fechas y horas de la tarea no son válidas',
      );
    }

    if (
      opciones?.validarContraAhora
    ) {
      const ahora =
        new Date();

      const tolerancia =
        60 *
        1000;

      if (
        fechaApertura.getTime() <
        ahora.getTime() -
          tolerancia
      ) {
        throw new BadRequestException(
          'La fecha de apertura no puede estar en el pasado',
        );
      }

      if (
        fechaLimite <=
        ahora
      ) {
        throw new BadRequestException(
          'La fecha límite debe estar en el futuro',
        );
      }

      if (
        fechaCierre <=
        ahora
      ) {
        throw new BadRequestException(
          'El cierre definitivo debe estar en el futuro',
        );
      }
    }

    if (
      fechaApertura >=
      fechaLimite
    ) {
      throw new BadRequestException(
        'La fecha límite debe ser posterior a la fecha de apertura',
      );
    }

    if (
      fechaCierre <
      fechaLimite
    ) {
      throw new BadRequestException(
        'El cierre definitivo no puede ser anterior a la fecha límite',
      );
    }

    const permitirRetrasos =
      datos.permitirRetrasos ??
      false;

    let fechaMaximaRetraso =
      datos.fechaMaximaRetraso
        ? new Date(
            datos.fechaMaximaRetraso,
          )
        : null;

    let tipoDescuentoRetraso =
      datos.tipoDescuentoRetraso ??
      TipoDescuentoRetraso.NINGUNO;

    let valorDescuentoRetraso =
      datos.valorDescuentoRetraso ??
      null;

    if (permitirRetrasos) {
      if (!fechaMaximaRetraso) {
        throw new BadRequestException(
          'Debes indicar hasta cuándo se aceptarán entregas con retraso',
        );
      }

      if (
        Number.isNaN(
          fechaMaximaRetraso.getTime(),
        )
      ) {
        throw new BadRequestException(
          'La fecha máxima de retraso no es válida',
        );
      }

      if (
        opciones?.validarContraAhora &&
        fechaMaximaRetraso <=
          new Date()
      ) {
        throw new BadRequestException(
          'La fecha máxima de retraso debe estar en el futuro',
        );
      }

      if (
        fechaMaximaRetraso <=
        fechaLimite
      ) {
        throw new BadRequestException(
          'La fecha máxima de retraso debe ser posterior a la fecha límite',
        );
      }

      if (
        fechaMaximaRetraso >
        fechaCierre
      ) {
        throw new BadRequestException(
          'La fecha máxima de retraso no puede superar el cierre definitivo',
        );
      }

      if (
        tipoDescuentoRetraso !==
          TipoDescuentoRetraso.NINGUNO &&
        (
          valorDescuentoRetraso ===
            null ||
          valorDescuentoRetraso <
            0
        )
      ) {
        throw new BadRequestException(
          'Debes indicar un valor válido para la penalización por retraso',
        );
      }
    } else {
      fechaMaximaRetraso =
        null;
      tipoDescuentoRetraso =
        TipoDescuentoRetraso.NINGUNO;
      valorDescuentoRetraso =
        null;
    }

    const permiteEditor =
      experiencia.capacidades.includes(
        CapacidadTarea.EDITOR_TEXTO,
      );

    const permiteArchivos =
      experiencia.capacidades.includes(
        CapacidadTarea.ARCHIVOS,
      );

    const exigirContenidoEditor =
      datos.exigirContenidoEditor ??
      false;

    const exigirArchivo =
      datos.exigirArchivo ??
      false;

    let configuracionTipo =
      datos.configuracionTipo;

    if (
      datos.modalidad ===
        ModalidadTarea.GRUPAL &&
      origenGrupo ===
        OrigenGrupoTarea.AFINIDAD
    ) {
      configuracionTipo = {
        ...(
          configuracionTipo ??
          {}
        ),

        responsableEntregaGrupo:
          'SOLO_REPRESENTANTE',
      };
    }

    if (
      exigirContenidoEditor &&
      !permiteEditor
    ) {
      throw new BadRequestException(
        'No puedes exigir contenido del editor en un tipo de tarea que no utiliza editor interno',
      );
    }

    if (
      exigirArchivo &&
      !permiteArchivos
    ) {
      throw new BadRequestException(
        'No puedes exigir archivos si la tarea no tiene habilitada la capacidad ARCHIVOS',
      );
    }

    return {
      tipo:
        datos.tipo,
      capacidades:
        experiencia.capacidades,
      modoEdicion:
        experiencia.modoEdicion,
      configuracionTipo,
      componentes:
        experiencia.componentes,
      esCalificable,
      componente:
        esCalificable
          ? datos.componente ??
            null
          : null,
      puntajeMaximo:
        datos.puntajeMaximo ??
        100,
      modalidad:
        datos.modalidad,
      origenGrupo,
      conjuntoGrupoId,
      modalidadNota,
      porcentajeNotaGrupal,
      porcentajeNotaIndividual,
      requiereRepresentante,
      fechaApertura,
      fechaLimite,
      fechaCierre,
      visibleAntesDeApertura:
        datos.visibleAntesDeApertura ??
        true,
      permitirRetrasos,
      fechaMaximaRetraso,
      tipoDescuentoRetraso,
      valorDescuentoRetraso,
      exigirContenidoEditor,
      exigirArchivo,
      maximoArchivos:
        permiteArchivos
          ? datos.maximoArchivos ??
            3
          : 0,
      tamanioMaximoArchivoMb:
        datos.tamanioMaximoArchivoMb ??
        10,
      extensionesPermitidas:
        permiteArchivos
          ? this.normalizarExtensiones(
              datos.extensionesPermitidas,
            )
          : [],
      permitirEditarEntrega:
        datos.permitirEditarEntrega ??
        true,
    };
  }

  private construirConfiguracionActualizada(
    actual:
      Awaited<ReturnType<TareasService['obtenerTareaDocente']>>,
    datos:
      ActualizarTareaDto,
  ) {
    const cambioTipo =
      datos.tipo !==
        undefined &&
      datos.tipo !==
        actual.tipo;

    const componentes =
      datos.componentes ??
      (
        cambioTipo
          ? []
          : actual.componentes.map(
        (
          componente,
        ) => ({
          tipo:
            componente.tipo,
          titulo:
            componente.titulo,
          descripcion:
            componente.descripcion ??
            undefined,
          obligatorio:
            componente.obligatorio,
          configuracion:
            componente.configuracion &&
            typeof componente.configuracion ===
              'object' &&
            !Array.isArray(
              componente.configuracion,
            )
              ? componente.configuracion as Record<string, unknown>
              : undefined,
        })
          )
      );

    const combinado:
      CrearTareaDto = {
        hitoId:
          actual.hitoId,
        titulo:
          datos.titulo ??
          actual.titulo,
        descripcion:
          datos.descripcion ??
          actual.descripcion ??
          undefined,
        instrucciones:
          datos.instrucciones ??
          actual.instrucciones ??
          undefined,
        tipo:
          datos.tipo ??
          actual.tipo,
        capacidades:
          datos.capacidades ??
          (
            cambioTipo
              ? undefined
              : actual.capacidades
          ),
        configuracionTipo:
          datos.configuracionTipo ??
          (
            !cambioTipo &&
            actual.configuracionTipo &&
            typeof actual.configuracionTipo ===
              'object' &&
            !Array.isArray(
              actual.configuracionTipo,
            )
              ? actual.configuracionTipo as Record<string, unknown>
              : undefined
          ),
        componentes,
        esCalificable:
          datos.esCalificable ??
          actual.esCalificable,
        componente:
          datos.componente ??
          actual.componente ??
          undefined,
        puntajeMaximo:
          datos.puntajeMaximo ??
          Number(
            actual.puntajeMaximo,
          ),
        modalidad:
          datos.modalidad ??
          actual.modalidad,
        origenGrupo:
          datos.origenGrupo ??
          actual.origenGrupo,
        conjuntoGrupoId:
          datos.conjuntoGrupoId ??
          actual.conjuntoGrupoId ??
          undefined,
        modalidadNota:
          datos.modalidadNota ??
          actual.modalidadNota,
        porcentajeNotaGrupal:
          datos.porcentajeNotaGrupal ??
          (
            actual.porcentajeNotaGrupal !==
            null
              ? Number(
                  actual.porcentajeNotaGrupal,
                )
              : undefined
          ),
        porcentajeNotaIndividual:
          datos.porcentajeNotaIndividual ??
          (
            actual.porcentajeNotaIndividual !==
            null
              ? Number(
                  actual.porcentajeNotaIndividual,
                )
              : undefined
          ),
        requiereRepresentante:
          datos.requiereRepresentante ??
          actual.requiereRepresentante,
        fechaApertura:
          datos.fechaApertura ??
          actual.fechaApertura.toISOString(),
        fechaLimite:
          datos.fechaLimite ??
          actual.fechaLimite.toISOString(),
        fechaCierre:
          datos.fechaCierre ??
          actual.fechaCierre.toISOString(),
        visibleAntesDeApertura:
          datos.visibleAntesDeApertura ??
          actual.visibleAntesDeApertura,
        permitirRetrasos:
          datos.permitirRetrasos ??
          actual.permitirRetrasos,
        fechaMaximaRetraso:
          datos.fechaMaximaRetraso ??
          actual.fechaMaximaRetraso?.toISOString(),
        tipoDescuentoRetraso:
          datos.tipoDescuentoRetraso ??
          actual.tipoDescuentoRetraso,
        valorDescuentoRetraso:
          datos.valorDescuentoRetraso ??
          (
            actual.valorDescuentoRetraso !==
            null
              ? Number(
                  actual.valorDescuentoRetraso,
                )
              : undefined
          ),
        exigirContenidoEditor:
          datos.exigirContenidoEditor ??
          actual.exigirContenidoEditor,
        exigirArchivo:
          datos.exigirArchivo ??
          actual.exigirArchivo,
        maximoArchivos:
          datos.maximoArchivos ??
          actual.maximoArchivos,
        tamanioMaximoArchivoMb:
          datos.tamanioMaximoArchivoMb ??
          actual.tamanioMaximoArchivoMb,
        extensionesPermitidas:
          datos.extensionesPermitidas ??
          actual.extensionesPermitidas,
        permitirEditarEntrega:
          datos.permitirEditarEntrega ??
          actual.permitirEditarEntrega,
      };

    return this.construirConfiguracion(
      combinado,
    );
  }

  private async validarConjuntoGrupo(
    cursoId:
      number,
    hitoId:
      number,
    configuracion:
      ConfiguracionTarea,
  ) {
    if (
      configuracion.modalidad !==
        ModalidadTarea.GRUPAL ||
      configuracion.origenGrupo !==
        OrigenGrupoTarea.PLATAFORMA ||
      !configuracion.conjuntoGrupoId
    ) {
      return null;
    }

    const conjunto =
      await this.prisma.conjuntoGrupoCurso.findFirst({
        where: {
          id:
            configuracion.conjuntoGrupoId,
          cursoId,
          estaActivo:
            true,
        },
        select: {
          id:
            true,
          hitoId:
            true,
          alcance:
            true,
          tipoEvaluacion:
            true,
          requiereRepresentante:
            true,
        },
      });

    if (!conjunto) {
      throw new BadRequestException(
        'El conjunto de grupos seleccionado no pertenece al curso o está inactivo',
      );
    }

    if (
      conjunto.tipoEvaluacion ===
        TipoEvaluacionGrupo.CONTINUA &&
      (
        conjunto.alcance !==
          AlcanceConjuntoGrupo.HITO ||
        conjunto.hitoId !==
          hitoId
      )
    ) {
      throw new BadRequestException(
        'Una tarea continua debe utilizar el conjunto de grupos del hito seleccionado',
      );
    }

    if (
      conjunto.tipoEvaluacion ===
        TipoEvaluacionGrupo.PROCESUAL &&
      conjunto.alcance !==
        AlcanceConjuntoGrupo.CURSO
    ) {
      throw new BadRequestException(
        'Una tarea procesual debe utilizar el conjunto procesual del curso',
      );
    }

    if (
      configuracion.esCalificable &&
      configuracion.componente
    ) {
      const componenteEsperado =
        conjunto.tipoEvaluacion ===
        TipoEvaluacionGrupo.CONTINUA
          ? ComponenteEvaluacion.CONTINUA
          : ComponenteEvaluacion.PROCESUAL;

      if (
        configuracion.componente !==
        componenteEsperado
      ) {
        throw new BadRequestException(
          'El tipo de evaluación del conjunto no coincide con el componente de la tarea',
        );
      }
    }

    return conjunto;
  }

  private calcularEstadoPublicado(
    fechaApertura:
      Date,
    fechaCierre:
      Date,
    ahora =
      new Date(),
  ) {
    if (
      ahora <
      fechaApertura
    ) {
      return EstadoTarea.PROGRAMADA;
    }

    if (
      ahora >=
      fechaCierre
    ) {
      return EstadoTarea.CERRADA;
    }

    return EstadoTarea.DISPONIBLE;
  }

  private estadoActividadDesdeTarea(
    estado:
      EstadoTarea,
  ) {
    if (
      estado ===
      EstadoTarea.BORRADOR
    ) {
      return EstadoActividadCalificable.BORRADOR;
    }

    if (
      estado ===
      EstadoTarea.CERRADA
    ) {
      return EstadoActividadCalificable.CERRADA;
    }

    if (
      estado ===
      EstadoTarea.ANULADA
    ) {
      return EstadoActividadCalificable.ANULADA;
    }

    return EstadoActividadCalificable.ACTIVA;
  }

  private normalizarComparable(
    valor:
      unknown,
  ): unknown {
    if (
      valor instanceof Date
    ) {
      return valor.toISOString();
    }

    if (
      Array.isArray(
        valor,
      )
    ) {
      return valor.map(
        (
          item,
        ) =>
          this.normalizarComparable(
            item,
          ),
      );
    }

    if (
      valor !==
        null &&
      typeof valor ===
        'object'
    ) {
      return Object.keys(
        valor as Record<string, unknown>,
      )
        .sort()
        .reduce<Record<string, unknown>>(
          (
            acumulado,
            clave,
          ) => {
            acumulado[clave] =
              this.normalizarComparable(
                (
                  valor as Record<string, unknown>
                )[clave],
              );

            return acumulado;
          },
          {},
        );
    }

    return valor;
  }

  private sonIguales(
    a:
      unknown,
    b:
      unknown,
  ) {
    return (
      JSON.stringify(
        this.normalizarComparable(
          a,
        ),
      ) ===
      JSON.stringify(
        this.normalizarComparable(
          b,
        ),
      )
    );
  }

  private calcularEstadoVisual(
    tarea: {
      estado:
        EstadoTarea;
      fechaApertura:
        Date;
      fechaCierre:
        Date;
      estaCerrada:
        boolean;
      estaActiva:
        boolean;
    },
  ) {
    if (
      !tarea.estaActiva ||
      tarea.estado ===
        EstadoTarea.ANULADA
    ) {
      return EstadoTarea.ANULADA;
    }

    if (
      tarea.estado ===
      EstadoTarea.BORRADOR
    ) {
      return EstadoTarea.BORRADOR;
    }

    if (tarea.estaCerrada) {
      return EstadoTarea.CERRADA;
    }

    return this.calcularEstadoPublicado(
      tarea.fechaApertura,
      tarea.fechaCierre,
    );
  }

  private formatearTarea<
    T extends {
      estado:
        EstadoTarea;
      fechaApertura:
        Date;
      fechaCierre:
        Date;
      estaCerrada:
        boolean;
      estaActiva:
        boolean;
      _count?: {
        entregas:
          number;
      };
    },
  >(
    tarea:
      T,
  ) {
    return {
      ...tarea,

      estadoVisual:
        this.calcularEstadoVisual(
          tarea,
        ),

      tieneTrabajoEstudiantil:
        (
          tarea._count?.entregas ??
          0
        ) >
        0,

      totalRegistrosTrabajo:
        tarea._count?.entregas ??
        0,
    };
  }

  private async obtenerTareaDocente(
    docenteId:
      number,
    cursoId:
      number,
    tareaId:
      number,
  ) {
    const tarea =
      await this.prisma.tareaCurso.findFirst({
        where: {
          id:
            tareaId,
          cursoId,
          autorId:
            docenteId,
        },
        select:
          this.seleccionTarea,
      });

    if (!tarea) {
      throw new NotFoundException(
        'La tarea no existe o no pertenece al curso del docente',
      );
    }

    return tarea;
  }

  private dataComponentes(
    componentes:
      CrearComponenteTareaDto[],
  ) {
    return componentes.map(
      (
        componente,
        indice,
      ) => ({
        orden:
          indice +
          1,
        tipo:
          componente.tipo,
        titulo:
          componente.titulo.trim(),
        descripcion:
          componente.descripcion?.trim() ||
          null,
        obligatorio:
          componente.obligatorio ??
          true,
        ...(componente.configuracion
          ? {
              configuracion:
                componente.configuracion as Prisma.InputJsonValue,
            }
          : {}),
      }),
    );
  }

  async crear(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    datos:
      CrearTareaDto,
  ) {
    this.validarDocente(
      usuario,
    );

    const curso =
      await this.obtenerCursoDocente(
        usuario.id,
        cursoId,
      );

    await this.validarHitoCurso(
      curso.planificacionId,
      datos.hitoId,
    );

    const configuracion =
      this.construirConfiguracion(
        datos,
        {
          validarContraAhora:
            true,
        },
      );

    const conjunto =
      await this.validarConjuntoGrupo(
        cursoId,
        datos.hitoId,
        configuracion,
      );

    if (
      conjunto?.requiereRepresentante
    ) {
      configuracion.requiereRepresentante =
        true;
    }

    const publicar =
      datos.publicar ??
      false;

    const ahora =
      new Date();

    const estado =
      publicar
        ? this.calcularEstadoPublicado(
            configuracion.fechaApertura,
            configuracion.fechaCierre,
            ahora,
          )
        : EstadoTarea.BORRADOR;

    const creada =
      await this.prisma.$transaction(
        async (
          tx,
        ) => {
          const tarea =
            await tx.tareaCurso.create({
              data: {
                cursoId,
                autorId:
                  usuario.id,
                hitoId:
                  datos.hitoId,
                conjuntoGrupoId:
                  configuracion.conjuntoGrupoId,
                titulo:
                  datos.titulo.trim(),
                descripcion:
                  datos.descripcion?.trim() ||
                  null,
                instrucciones:
                  datos.instrucciones?.trim() ||
                  null,
                tipo:
                  configuracion.tipo,
                capacidades:
                  configuracion.capacidades,
                modoEdicion:
                  configuracion.modoEdicion,
                ...(configuracion.configuracionTipo
                  ? {
                      configuracionTipo:
                        configuracion.configuracionTipo as Prisma.InputJsonValue,
                    }
                  : {}),
                esCalificable:
                  configuracion.esCalificable,
                componente:
                  configuracion.componente,
                puntajeMaximo:
                  new Prisma.Decimal(
                    configuracion.puntajeMaximo,
                  ),
                modalidad:
                  configuracion.modalidad,
                origenGrupo:
                  configuracion.origenGrupo,
                modalidadNota:
                  configuracion.modalidadNota,
                porcentajeNotaGrupal:
                  configuracion.porcentajeNotaGrupal !==
                  null
                    ? new Prisma.Decimal(
                        configuracion.porcentajeNotaGrupal,
                      )
                    : null,
                porcentajeNotaIndividual:
                  configuracion.porcentajeNotaIndividual !==
                  null
                    ? new Prisma.Decimal(
                        configuracion.porcentajeNotaIndividual,
                      )
                    : null,
                requiereRepresentante:
                  configuracion.requiereRepresentante,
                fechaApertura:
                  configuracion.fechaApertura,
                fechaLimite:
                  configuracion.fechaLimite,
                fechaCierre:
                  configuracion.fechaCierre,
                visibleAntesDeApertura:
                  configuracion.visibleAntesDeApertura,
                permitirRetrasos:
                  configuracion.permitirRetrasos,
                fechaMaximaRetraso:
                  configuracion.fechaMaximaRetraso,
                tipoDescuentoRetraso:
                  configuracion.tipoDescuentoRetraso,
                valorDescuentoRetraso:
                  configuracion.valorDescuentoRetraso !==
                  null
                    ? new Prisma.Decimal(
                        configuracion.valorDescuentoRetraso,
                      )
                    : null,
                exigirContenidoEditor:
                  configuracion.exigirContenidoEditor,
                exigirArchivo:
                  configuracion.exigirArchivo,
                maximoArchivos:
                  configuracion.maximoArchivos,
                tamanioMaximoArchivoMb:
                  configuracion.tamanioMaximoArchivoMb,
                extensionesPermitidas:
                  configuracion.extensionesPermitidas,
                permitirEditarEntrega:
                  configuracion.permitirEditarEntrega,
                estado,
                estaCerrada:
                  estado ===
                  EstadoTarea.CERRADA,
                publicadoEn:
                  publicar
                    ? ahora
                    : null,
                cerradoEn:
                  estado ===
                  EstadoTarea.CERRADA
                    ? ahora
                    : null,
                ...(configuracion.componentes.length
                  ? {
                      componentes: {
                        create:
                          this.dataComponentes(
                            configuracion.componentes,
                          ),
                      },
                    }
                  : {}),
              },
            });

          if (
            configuracion.esCalificable &&
            configuracion.componente
          ) {
            const actividad =
              await tx.actividadCalificable.create({
                data: {
                  cursoId,
                  hitoId:
                    datos.hitoId,
                  creadorId:
                    usuario.id,
                  tareaId:
                    tarea.id,
                  origen:
                    TipoOrigenActividad.TAREA,
                  componente:
                    configuracion.componente,
                  titulo:
                    tarea.titulo,
                  descripcion:
                    tarea.descripcion,
                  puntajeMaximo:
                    new Prisma.Decimal(
                      configuracion.puntajeMaximo,
                    ),
                  participaEnPromedio:
                    true,
                  estado:
                    this.estadoActividadDesdeTarea(
                      estado,
                    ),
                  visibleParaEstudiantes:
                    publicar,
                  publicadaEn:
                    publicar
                      ? ahora
                      : null,
                  cerradaEn:
                    estado ===
                    EstadoTarea.CERRADA
                      ? ahora
                      : null,
                },
              });

            await tx.historialCalificacion.create({
              data: {
                actividadId:
                  actividad.id,
                actorId:
                  usuario.id,
                accion:
                  'ACTIVIDAD_CREADA',
                detalle: {
                  origen:
                    TipoOrigenActividad.TAREA,
                  tareaId:
                    tarea.id,
                  hitoId:
                    datos.hitoId,
                  componente:
                    configuracion.componente,
                  tipoTarea:
                    configuracion.tipo,
                },
              },
            });
          }

          return tx.tareaCurso.findUniqueOrThrow({
            where: {
              id:
                tarea.id,
            },
            select:
              this.seleccionTarea,
          });
        },
      );

    return {
      mensaje:
        publicar
          ? 'Tarea creada y publicada correctamente'
          : 'Borrador de tarea creado correctamente',
      tarea:
        this.formatearTarea(
          creada,
        ),
    };
  }

  async actualizar(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
    datos:
      ActualizarTareaDto,
  ) {
    this.validarDocente(
      usuario,
    );

    await this.obtenerCursoDocente(
      usuario.id,
      cursoId,
    );

    const actual =
      await this.obtenerTareaDocente(
        usuario.id,
        cursoId,
        tareaId,
      );

    if (
      actual.estado ===
        EstadoTarea.ANULADA ||
      !actual.estaActiva
    ) {
      throw new BadRequestException(
        'No puedes editar una tarea anulada',
      );
    }

    const configuracion =
      this.construirConfiguracionActualizada(
        actual,
        datos,
      );

    const ahoraEdicion =
      new Date();

    const toleranciaEdicion =
      60 *
      1000;

    if (
      datos.fechaApertura !==
        undefined &&
      configuracion.fechaApertura.getTime() !==
        actual.fechaApertura.getTime() &&
      configuracion.fechaApertura.getTime() <
        ahoraEdicion.getTime() -
          toleranciaEdicion
    ) {
      throw new BadRequestException(
        'No puedes cambiar la apertura a una fecha u hora pasada',
      );
    }

    if (
      datos.fechaLimite !==
        undefined &&
      configuracion.fechaLimite.getTime() !==
        actual.fechaLimite.getTime() &&
      configuracion.fechaLimite <=
        ahoraEdicion
    ) {
      throw new BadRequestException(
        'La nueva fecha límite debe estar en el futuro',
      );
    }

    if (
      datos.fechaCierre !==
        undefined &&
      configuracion.fechaCierre.getTime() !==
        actual.fechaCierre.getTime() &&
      configuracion.fechaCierre <=
        ahoraEdicion
    ) {
      throw new BadRequestException(
        'El nuevo cierre definitivo debe estar en el futuro',
      );
    }

    if (
      datos.fechaMaximaRetraso !==
        undefined &&
      configuracion.fechaMaximaRetraso &&
      (
        !actual.fechaMaximaRetraso ||
        configuracion.fechaMaximaRetraso.getTime() !==
          actual.fechaMaximaRetraso.getTime()
      ) &&
      configuracion.fechaMaximaRetraso <=
        ahoraEdicion
    ) {
      throw new BadRequestException(
        'La nueva fecha máxima de retraso debe estar en el futuro',
      );
    }

    const trabajoRegistrado =
      await this.prisma.entregaTarea.findFirst({
        where: {
          tareaId,

          estaActiva:
            true,

          OR: [
            {
              estado: {
                in: [
                  EstadoEntregaTarea.ENTREGADA,
                  EstadoEntregaTarea.TARDIA,
                  EstadoEntregaTarea.BLOQUEADA,
                ],
              },
            },
            {
              enviadaEn: {
                not:
                  null,
              },
            },
            {
              contenido: {
                not:
                  null,
              },
            },
            {
              archivos: {
                some: {
                  estaActivo:
                    true,
                },
              },
            },
          ],
        },

        select: {
          id:
            true,
        },
      });

    const tieneTrabajoEstudiantil =
      Boolean(
        trabajoRegistrado,
      );

    if (
      tieneTrabajoEstudiantil
    ) {
      const cambiosNoPermitidos:
        string[] =
        [];

      const registrarCambio = (
        condicion:
          boolean,
        etiqueta:
          string,
      ) => {
        if (
          condicion
        ) {
          cambiosNoPermitidos.push(
            etiqueta,
          );
        }
      };

      const descripcionActual =
        actual.descripcion ??
        null;

      const instruccionesActuales =
        actual.instrucciones ??
        null;

      const descripcionNueva =
        datos.descripcion !==
        undefined
          ? datos.descripcion.trim() ||
            null
          : descripcionActual;

      const instruccionesNuevas =
        datos.instrucciones !==
        undefined
          ? datos.instrucciones.trim() ||
            null
          : instruccionesActuales;

      registrarCambio(
        datos.titulo !==
          undefined &&
        datos.titulo.trim() !==
          actual.titulo,
        'título',
      );

      registrarCambio(
        descripcionNueva !==
          descripcionActual,
        'descripción',
      );

      registrarCambio(
        instruccionesNuevas !==
          instruccionesActuales,
        'instrucciones',
      );

      registrarCambio(
        configuracion.tipo !==
          actual.tipo,
        'tipo de tarea',
      );

      registrarCambio(
        !this.sonIguales(
          [
            ...configuracion.capacidades,
          ].sort(),
          [
            ...actual.capacidades,
          ].sort(),
        ),
        'capacidades',
      );

      registrarCambio(
        configuracion.modoEdicion !==
          actual.modoEdicion,
        'modo de edición',
      );

      registrarCambio(
        !this.sonIguales(
          configuracion.configuracionTipo ??
            null,
          actual.configuracionTipo ??
            null,
        ),
        'configuración específica',
      );

      const componentesActuales =
        actual.componentes.map(
          (
            componente,
          ) => ({
            tipo:
              componente.tipo,

            titulo:
              componente.titulo,

            descripcion:
              componente.descripcion ??
              undefined,

            obligatorio:
              componente.obligatorio,

            configuracion:
              componente.configuracion ??
              undefined,
          }),
        );

      registrarCambio(
        !this.sonIguales(
          configuracion.componentes,
          componentesActuales,
        ),
        'componentes de la actividad',
      );

      registrarCambio(
        configuracion.esCalificable !==
          actual.esCalificable,
        'condición calificable',
      );

      registrarCambio(
        configuracion.componente !==
          actual.componente,
        'componente Continua/Procesual',
      );

      registrarCambio(
        Math.abs(
          configuracion.puntajeMaximo -
          Number(
            actual.puntajeMaximo,
          ),
        ) >
          0.001,
        'puntaje máximo',
      );

      registrarCambio(
        configuracion.modalidad !==
          actual.modalidad,
        'modalidad individual/grupal',
      );

      registrarCambio(
        configuracion.origenGrupo !==
          actual.origenGrupo,
        'origen de grupos',
      );

      registrarCambio(
        configuracion.conjuntoGrupoId !==
          actual.conjuntoGrupoId,
        'conjunto de grupos',
      );

      registrarCambio(
        configuracion.modalidadNota !==
          actual.modalidadNota,
        'modalidad de calificación',
      );

      registrarCambio(
        !this.sonIguales(
          configuracion.porcentajeNotaGrupal,
          actual.porcentajeNotaGrupal !==
          null
            ? Number(
                actual.porcentajeNotaGrupal,
              )
            : null,
        ),
        'porcentaje grupal',
      );

      registrarCambio(
        !this.sonIguales(
          configuracion.porcentajeNotaIndividual,
          actual.porcentajeNotaIndividual !==
          null
            ? Number(
                actual.porcentajeNotaIndividual,
              )
            : null,
        ),
        'porcentaje individual',
      );

      registrarCambio(
        configuracion.requiereRepresentante !==
          actual.requiereRepresentante,
        'representante del grupo',
      );

      registrarCambio(
        configuracion.fechaApertura.getTime() !==
          actual.fechaApertura.getTime(),
        'fecha de apertura',
      );

      registrarCambio(
        configuracion.visibleAntesDeApertura !==
          actual.visibleAntesDeApertura,
        'visibilidad antes de apertura',
      );

      registrarCambio(
        configuracion.exigirContenidoEditor !==
          actual.exigirContenidoEditor,
        'requisito de contenido',
      );

      registrarCambio(
        configuracion.exigirArchivo !==
          actual.exigirArchivo,
        'requisito de archivo',
      );

      registrarCambio(
        configuracion.maximoArchivos !==
          actual.maximoArchivos,
        'cantidad máxima de archivos',
      );

      registrarCambio(
        configuracion.tamanioMaximoArchivoMb !==
          actual.tamanioMaximoArchivoMb,
        'tamaño máximo de archivo',
      );

      registrarCambio(
        !this.sonIguales(
          [
            ...configuracion.extensionesPermitidas,
          ].sort(),
          [
            ...actual.extensionesPermitidas,
          ].sort(),
        ),
        'extensiones permitidas',
      );

      if (
        cambiosNoPermitidos.length >
        0
      ) {
        throw new BadRequestException(
          `La tarea ya tiene trabajo de estudiantes. Solo puedes modificar fechas de entrega, retrasos y la posibilidad de editar la entrega. No puedes cambiar: ${cambiosNoPermitidos.join(', ')}.`,
        );
      }

      /*
       * Con trabajo registrado, las fechas pueden mantenerse
       * o ampliarse, pero nunca reducirse.
       */
      if (
        configuracion.fechaLimite <
        actual.fechaLimite
      ) {
        throw new BadRequestException(
          'La tarea ya tiene entregas. La fecha límite solo puede mantenerse o ampliarse.',
        );
      }

      if (
        configuracion.fechaCierre <
        actual.fechaCierre
      ) {
        throw new BadRequestException(
          'La tarea ya tiene entregas. El cierre definitivo solo puede mantenerse o ampliarse.',
        );
      }

      if (
        actual.permitirRetrasos &&
        !configuracion.permitirRetrasos
      ) {
        throw new BadRequestException(
          'La tarea ya tiene entregas. No puedes desactivar los retrasos que ya formaban parte de la actividad.',
        );
      }

      if (
        actual.fechaMaximaRetraso &&
        (
          !configuracion.fechaMaximaRetraso ||
          configuracion.fechaMaximaRetraso <
            actual.fechaMaximaRetraso
        )
      ) {
        throw new BadRequestException(
          'La tarea ya tiene entregas. La fecha máxima de retraso solo puede mantenerse o ampliarse.',
        );
      }

      const entregaTardia =
        await this.prisma.entregaTarea.findFirst({
          where: {
            tareaId,

            estaActiva:
              true,

            entregadaTarde:
              true,
          },

          select: {
            id:
              true,
          },
        });

      /*
       * Si ya se aplicó una regla de penalización a alguna entrega,
       * esa regla queda congelada para no modificar las condiciones
       * después de que el estudiante entregó.
       */
      if (
        entregaTardia
      ) {
        const tipoActual =
          actual.tipoDescuentoRetraso;

        const valorActual =
          actual.valorDescuentoRetraso !==
          null
            ? Number(
                actual.valorDescuentoRetraso,
              )
            : null;

        if (
          configuracion.tipoDescuentoRetraso !==
            tipoActual ||
          !this.sonIguales(
            configuracion.valorDescuentoRetraso,
            valorActual,
          )
        ) {
          throw new BadRequestException(
            'Ya existen entregas tardías. No puedes cambiar la penalización por retraso porque afectaría las reglas aplicadas a esas entregas.',
          );
        }
      }
    }

    const conjunto =
      await this.validarConjuntoGrupo(
        cursoId,
        actual.hitoId,
        configuracion,
      );

    if (
      conjunto?.requiereRepresentante
    ) {
      configuracion.requiereRepresentante =
        true;
    }

    if (
      actual.actividadCalificable &&
      !configuracion.esCalificable
    ) {
      const cantidadCalificaciones =
        await this.prisma.calificacionEstudiante.count({
          where: {
            actividadId:
              actual.actividadCalificable.id,
          },
        });

      if (
        cantidadCalificaciones >
        0
      ) {
        throw new BadRequestException(
          'No puedes convertir en no calificable una tarea que ya tiene calificaciones registradas',
        );
      }
    }

    const actualizada =
      await this.prisma.$transaction(
        async (
          tx,
        ) => {
          if (
            datos.componentes !==
              undefined ||
            datos.tipo !==
              undefined
          ) {
            await tx.componenteTarea.deleteMany({
              where: {
                tareaId,
              },
            });
          }

          const tarea =
            await tx.tareaCurso.update({
              where: {
                id:
                  tareaId,
              },
              data: {
                ...(datos.titulo !==
                undefined
                  ? {
                      titulo:
                        datos.titulo.trim(),
                    }
                  : {}),
                ...(datos.descripcion !==
                undefined
                  ? {
                      descripcion:
                        datos.descripcion.trim() ||
                        null,
                    }
                  : {}),
                ...(datos.instrucciones !==
                undefined
                  ? {
                      instrucciones:
                        datos.instrucciones.trim() ||
                        null,
                    }
                  : {}),
                tipo:
                  configuracion.tipo,
                capacidades:
                  configuracion.capacidades,
                modoEdicion:
                  configuracion.modoEdicion,
                ...(datos.configuracionTipo !==
                undefined
                  ? {
                      configuracionTipo:
                        datos.configuracionTipo as Prisma.InputJsonValue,
                    }
                  : datos.tipo !==
                      undefined &&
                    datos.tipo !==
                      actual.tipo
                    ? {
                        configuracionTipo:
                          Prisma.DbNull,
                      }
                    : {}),
                esCalificable:
                  configuracion.esCalificable,
                componente:
                  configuracion.componente,
                puntajeMaximo:
                  new Prisma.Decimal(
                    configuracion.puntajeMaximo,
                  ),
                modalidad:
                  configuracion.modalidad,
                origenGrupo:
                  configuracion.origenGrupo,
                conjuntoGrupoId:
                  configuracion.conjuntoGrupoId,
                modalidadNota:
                  configuracion.modalidadNota,
                porcentajeNotaGrupal:
                  configuracion.porcentajeNotaGrupal !==
                  null
                    ? new Prisma.Decimal(
                        configuracion.porcentajeNotaGrupal,
                      )
                    : null,
                porcentajeNotaIndividual:
                  configuracion.porcentajeNotaIndividual !==
                  null
                    ? new Prisma.Decimal(
                        configuracion.porcentajeNotaIndividual,
                      )
                    : null,
                requiereRepresentante:
                  configuracion.requiereRepresentante,
                fechaApertura:
                  configuracion.fechaApertura,
                fechaLimite:
                  configuracion.fechaLimite,
                fechaCierre:
                  configuracion.fechaCierre,
                visibleAntesDeApertura:
                  configuracion.visibleAntesDeApertura,
                permitirRetrasos:
                  configuracion.permitirRetrasos,
                fechaMaximaRetraso:
                  configuracion.fechaMaximaRetraso,
                tipoDescuentoRetraso:
                  configuracion.tipoDescuentoRetraso,
                valorDescuentoRetraso:
                  configuracion.valorDescuentoRetraso !==
                  null
                    ? new Prisma.Decimal(
                        configuracion.valorDescuentoRetraso,
                      )
                    : null,
                exigirContenidoEditor:
                  configuracion.exigirContenidoEditor,
                exigirArchivo:
                  configuracion.exigirArchivo,
                maximoArchivos:
                  configuracion.maximoArchivos,
                tamanioMaximoArchivoMb:
                  configuracion.tamanioMaximoArchivoMb,
                extensionesPermitidas:
                  configuracion.extensionesPermitidas,
                permitirEditarEntrega:
                  configuracion.permitirEditarEntrega,
                ...(configuracion.componentes.length &&
                (
                  datos.componentes !==
                    undefined ||
                  datos.tipo !==
                    undefined
                )
                  ? {
                      componentes: {
                        create:
                          this.dataComponentes(
                            configuracion.componentes,
                          ),
                      },
                    }
                  : {}),
              },
            });

          if (
            configuracion.esCalificable &&
            configuracion.componente
          ) {
            if (actual.actividadCalificable) {
              await tx.actividadCalificable.update({
                where: {
                  id:
                    actual.actividadCalificable.id,
                },
                data: {
                  titulo:
                    tarea.titulo,
                  descripcion:
                    tarea.descripcion,
                  componente:
                    configuracion.componente,
                  puntajeMaximo:
                    new Prisma.Decimal(
                      configuracion.puntajeMaximo,
                    ),
                },
              });
            } else {
              const actividad =
                await tx.actividadCalificable.create({
                  data: {
                    cursoId,
                    hitoId:
                      actual.hitoId,
                    creadorId:
                      usuario.id,
                    tareaId:
                      tarea.id,
                    origen:
                      TipoOrigenActividad.TAREA,
                    componente:
                      configuracion.componente,
                    titulo:
                      tarea.titulo,
                    descripcion:
                      tarea.descripcion,
                    puntajeMaximo:
                      new Prisma.Decimal(
                        configuracion.puntajeMaximo,
                      ),
                    participaEnPromedio:
                      true,
                    estado:
                      this.estadoActividadDesdeTarea(
                        tarea.estado,
                      ),
                    visibleParaEstudiantes:
                      tarea.estado !==
                      EstadoTarea.BORRADOR,
                  },
                });

              await tx.historialCalificacion.create({
                data: {
                  actividadId:
                    actividad.id,
                  actorId:
                    usuario.id,
                  accion:
                    'ACTIVIDAD_CREADA',
                  detalle: {
                    origen:
                      TipoOrigenActividad.TAREA,
                    tareaId:
                      tarea.id,
                    hitoId:
                      actual.hitoId,
                    componente:
                      configuracion.componente,
                    tipoTarea:
                      configuracion.tipo,
                  },
                },
              });
            }
          } else if (
            actual.actividadCalificable
          ) {
            await tx.actividadCalificable.delete({
              where: {
                id:
                  actual.actividadCalificable.id,
              },
            });
          }

          return tx.tareaCurso.findUniqueOrThrow({
            where: {
              id:
                tareaId,
            },
            select:
              this.seleccionTarea,
          });
        },
      );

    return {
      mensaje:
        'Tarea actualizada correctamente',
      tarea:
        this.formatearTarea(
          actualizada,
        ),
    };
  }

  async publicar(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
  ) {
    this.validarDocente(
      usuario,
    );

    await this.obtenerCursoDocente(
      usuario.id,
      cursoId,
    );

    const actual =
      await this.obtenerTareaDocente(
        usuario.id,
        cursoId,
        tareaId,
      );

    if (
      actual.estado !==
      EstadoTarea.BORRADOR
    ) {
      throw new BadRequestException(
        'Solo una tarea en borrador puede publicarse',
      );
    }

    const ahora =
      new Date();

    if (
      actual.fechaLimite <=
      ahora
    ) {
      throw new BadRequestException(
        'No puedes publicar la tarea porque su fecha límite ya venció. Actualiza las fechas antes de publicarla',
      );
    }

    if (
      actual.fechaCierre <=
      ahora
    ) {
      throw new BadRequestException(
        'No puedes publicar la tarea porque su cierre definitivo ya venció. Actualiza las fechas antes de publicarla',
      );
    }

    if (
      actual.permitirRetrasos &&
      actual.fechaMaximaRetraso &&
      actual.fechaMaximaRetraso <=
        ahora
    ) {
      throw new BadRequestException(
        'No puedes publicar la tarea porque el periodo de retraso ya venció. Actualiza las fechas antes de publicarla',
      );
    }

    const estado =
      this.calcularEstadoPublicado(
        actual.fechaApertura,
        actual.fechaCierre,
        ahora,
      );

    const actualizada =
      await this.prisma.$transaction(
        async (
          tx,
        ) => {
          await tx.tareaCurso.update({
            where: {
              id:
                tareaId,
            },
            data: {
              estado,
              estaCerrada:
                estado ===
                EstadoTarea.CERRADA,
              publicadoEn:
                ahora,
              cerradoEn:
                estado ===
                EstadoTarea.CERRADA
                  ? ahora
                  : null,
            },
          });

          if (
            actual.actividadCalificable
          ) {
            await tx.actividadCalificable.update({
              where: {
                id:
                  actual.actividadCalificable.id,
              },
              data: {
                estado:
                  this.estadoActividadDesdeTarea(
                    estado,
                  ),
                visibleParaEstudiantes:
                  true,
                publicadaEn:
                  ahora,
                cerradaEn:
                  estado ===
                  EstadoTarea.CERRADA
                    ? ahora
                    : null,
              },
            });
          }

          return tx.tareaCurso.findUniqueOrThrow({
            where: {
              id:
                tareaId,
            },
            select:
              this.seleccionTarea,
          });
        },
      );

    return {
      mensaje:
        'Tarea publicada correctamente',
      tarea:
        this.formatearTarea(
          actualizada,
        ),
    };
  }

  async cerrar(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
  ) {
    this.validarDocente(
      usuario,
    );

    await this.obtenerCursoDocente(
      usuario.id,
      cursoId,
    );

    const actual =
      await this.obtenerTareaDocente(
        usuario.id,
        cursoId,
        tareaId,
      );

    if (
      actual.estado ===
      EstadoTarea.BORRADOR
    ) {
      throw new BadRequestException(
        'Publica la tarea antes de cerrarla',
      );
    }

    if (
      actual.estado ===
      EstadoTarea.ANULADA
    ) {
      throw new BadRequestException(
        'No puedes cerrar una tarea anulada',
      );
    }

    const ahora =
      new Date();

    const actualizada =
      await this.prisma.$transaction(
        async (
          tx,
        ) => {
          await tx.tareaCurso.update({
            where: {
              id:
                tareaId,
            },
            data: {
              estado:
                EstadoTarea.CERRADA,
              estaCerrada:
                true,
              cerradoEn:
                ahora,
            },
          });

          if (
            actual.actividadCalificable
          ) {
            await tx.actividadCalificable.update({
              where: {
                id:
                  actual.actividadCalificable.id,
              },
              data: {
                estado:
                  EstadoActividadCalificable.CERRADA,
                cerradaEn:
                  ahora,
              },
            });
          }

          return tx.tareaCurso.findUniqueOrThrow({
            where: {
              id:
                tareaId,
            },
            select:
              this.seleccionTarea,
          });
        },
      );

    if (
      actual.esCalificable &&
      actual.actividadCalificable
    ) {
      await this.tareasEvaluacionService.registrarCerosSinEntregaAlCierre(
        usuario,
        cursoId,
        tareaId,
      );
    }

    return {
      mensaje:
        'Tarea cerrada correctamente',
      tarea:
        this.formatearTarea(
          actualizada,
        ),
    };
  }

  async reabrir(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
  ) {
    this.validarDocente(
      usuario,
    );

    await this.obtenerCursoDocente(
      usuario.id,
      cursoId,
    );

    const actual =
      await this.obtenerTareaDocente(
        usuario.id,
        cursoId,
        tareaId,
      );

    if (
      actual.estado !==
      EstadoTarea.CERRADA
    ) {
      throw new BadRequestException(
        'Solo una tarea cerrada puede reabrirse',
      );
    }

    if (
      new Date() >=
      actual.fechaCierre
    ) {
      throw new BadRequestException(
        'Para reabrir esta tarea debes ampliar primero su fecha de cierre definitivo',
      );
    }

    const estado =
      this.calcularEstadoPublicado(
        actual.fechaApertura,
        actual.fechaCierre,
      );

    const actualizada =
      await this.prisma.$transaction(
        async (
          tx,
        ) => {
          await tx.tareaCurso.update({
            where: {
              id:
                tareaId,
            },
            data: {
              estado,
              estaCerrada:
                false,
              cerradoEn:
                null,
            },
          });

          if (
            actual.actividadCalificable
          ) {
            await tx.actividadCalificable.update({
              where: {
                id:
                  actual.actividadCalificable.id,
              },
              data: {
                estado:
                  EstadoActividadCalificable.ACTIVA,
                cerradaEn:
                  null,
              },
            });
          }

          return tx.tareaCurso.findUniqueOrThrow({
            where: {
              id:
                tareaId,
            },
            select:
              this.seleccionTarea,
          });
        },
      );

    return {
      mensaje:
        'Tarea reabierta correctamente',
      tarea:
        this.formatearTarea(
          actualizada,
        ),
    };
  }

  async anular(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
  ) {
    this.validarDocente(
      usuario,
    );

    await this.obtenerCursoDocente(
      usuario.id,
      cursoId,
    );

    const actual =
      await this.obtenerTareaDocente(
        usuario.id,
        cursoId,
        tareaId,
      );

    if (
      actual.estado ===
      EstadoTarea.ANULADA
    ) {
      return {
        mensaje:
          'La tarea ya estaba anulada',
        tarea:
          this.formatearTarea(
            actual,
          ),
      };
    }

    const ahora =
      new Date();

    const actualizada =
      await this.prisma.$transaction(
        async (
          tx,
        ) => {
          /*
           * Una tarea solo puede anularse mientras ningún estudiante
           * haya registrado trabajo.
           *
           * Se protege:
           * - entrega oficial;
           * - entrega tardía;
           * - entrega bloqueada;
           * - borrador que ya tenga contenido;
           * - borrador que ya tenga archivos.
           *
           * La validación se realiza dentro de la misma transacción
           * que cambia el estado para evitar que una entrega aparezca
           * entre la comprobación y la anulación.
           */
          const entregaRegistrada =
            await tx.entregaTarea.findFirst({
              where: {
                tareaId,

                estaActiva:
                  true,

                OR: [
                  {
                    estado: {
                      in: [
                        EstadoEntregaTarea.ENTREGADA,
                        EstadoEntregaTarea.TARDIA,
                        EstadoEntregaTarea.BLOQUEADA,
                      ],
                    },
                  },
                  {
                    enviadaEn: {
                      not:
                        null,
                    },
                  },
                  {
                    contenido: {
                      not:
                        null,
                    },
                  },
                  {
                    archivos: {
                      some: {
                        estaActivo:
                          true,
                      },
                    },
                  },
                ],
              },

              select: {
                id:
                  true,

                estado:
                  true,
              },
            });

          if (
            entregaRegistrada
          ) {
            throw new BadRequestException(
              'La tarea ya tiene una entrega o un borrador con contenido registrado. No puede anularse; ciérrala para conservar el trabajo de los estudiantes.',
            );
          }

          await tx.tareaCurso.update({
            where: {
              id:
                tareaId,
            },
            data: {
              estado:
                EstadoTarea.ANULADA,
              estaActiva:
                false,
              estaCerrada:
                true,
              cerradoEn:
                ahora,
              eliminadoEn:
                ahora,
            },
          });

          if (
            actual.actividadCalificable
          ) {
            await tx.actividadCalificable.update({
              where: {
                id:
                  actual.actividadCalificable.id,
              },
              data: {
                estado:
                  EstadoActividadCalificable.ANULADA,
                visibleParaEstudiantes:
                  false,
                cerradaEn:
                  ahora,
              },
            });
          }

          return tx.tareaCurso.findUniqueOrThrow({
            where: {
              id:
                tareaId,
            },
            select:
              this.seleccionTarea,
          });
        },
      );

    return {
      mensaje:
        'Tarea anulada correctamente',
      tarea:
        this.formatearTarea(
          actualizada,
        ),
    };
  }

  async listarDocente(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    filtros:
      ListarTareasDto,
  ) {
    this.validarDocente(
      usuario,
    );

    const curso =
      await this.obtenerCursoDocente(
        usuario.id,
        cursoId,
      );

    if (filtros.hitoId) {
      await this.validarHitoCurso(
        curso.planificacionId,
        filtros.hitoId,
      );
    }

    const tareas =
      await this.prisma.tareaCurso.findMany({
        where: {
          cursoId,
          autorId:
            usuario.id,
          ...(filtros.hitoId
            ? {
                hitoId:
                  filtros.hitoId,
              }
            : {}),
        },
        select:
          this.seleccionTarea,
        orderBy: [
          {
            fechaApertura:
              'asc',
          },
          {
            creadoEn:
              'desc',
          },
        ],
      });

    return {
      total:
        tareas.length,
      tareas:
        tareas.map(
          (
            tarea,
          ) =>
            this.formatearTarea(
              tarea,
            ),
        ),
    };
  }

  async obtenerDetalleDocente(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
  ) {
    this.validarDocente(
      usuario,
    );

    await this.obtenerCursoDocente(
      usuario.id,
      cursoId,
    );

    const tarea =
      await this.obtenerTareaDocente(
        usuario.id,
        cursoId,
        tareaId,
      );

    return {
      tarea:
        this.formatearTarea(
          tarea,
        ),
    };
  }

  async listarEstudiante(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    filtros:
      ListarTareasDto,
  ) {
    this.validarEstudiante(
      usuario,
    );

    await this.validarInscripcionEstudiante(
      usuario.id,
      cursoId,
    );

    const ahora =
      new Date();

    const tareas =
      await this.prisma.tareaCurso.findMany({
        where: {
          cursoId,
          estaActiva:
            true,
          estado: {
            notIn: [
              EstadoTarea.BORRADOR,
              EstadoTarea.ANULADA,
            ],
          },
          ...(filtros.hitoId
            ? {
                hitoId:
                  filtros.hitoId,
              }
            : {}),
          OR: [
            {
              visibleAntesDeApertura:
                true,
            },
            {
              fechaApertura: {
                lte:
                  ahora,
              },
            },
          ],
        },
        select:
          this.seleccionTarea,
        orderBy: [
          {
            fechaLimite:
              'asc',
          },
          {
            creadoEn:
              'desc',
          },
        ],
      });

    return {
      total:
        tareas.length,
      tareas:
        tareas.map(
          (
            tarea,
          ) =>
            this.formatearTarea(
              tarea,
            ),
        ),
    };
  }

  async obtenerDetalleEstudiante(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
  ) {
    this.validarEstudiante(
      usuario,
    );

    await this.validarInscripcionEstudiante(
      usuario.id,
      cursoId,
    );

    const tarea =
      await this.prisma.tareaCurso.findFirst({
        where: {
          id:
            tareaId,
          cursoId,
          estaActiva:
            true,
          estado: {
            notIn: [
              EstadoTarea.BORRADOR,
              EstadoTarea.ANULADA,
            ],
          },
        },
        select:
          this.seleccionTarea,
      });

    if (!tarea) {
      throw new NotFoundException(
        'La tarea no existe o todavía no está disponible para el estudiante',
      );
    }

    if (
      !tarea.visibleAntesDeApertura &&
      new Date() <
        tarea.fechaApertura
    ) {
      throw new NotFoundException(
        'La tarea todavía no está disponible para el estudiante',
      );
    }

    return {
      tarea:
        this.formatearTarea(
          tarea,
        ),
    };
  }
}
