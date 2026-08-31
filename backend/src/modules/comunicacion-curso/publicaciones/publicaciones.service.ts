import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EstadoCurso,
  EstadoInscripcion,
  PrioridadPublicacion,
  Rol,
  TipoNotificacion,
  TipoPublicacionCurso,
} from '../../../generated/prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

import { NotificacionesService } from '../../notificaciones/notificaciones.service';

import { ActualizarPublicacionDto } from '../dto/actualizar-publicacion.dto';

import { CrearPublicacionDto } from '../dto/crear-publicacion.dto';

type UsuarioAutenticado = {
  id: number;
  correo: string;
  rol: Rol;
};

@Injectable()
export class PublicacionesService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly notificacionesService: NotificacionesService,
  ) {}

  private readonly seleccionPublicacion = {
    id: true,
    cursoId: true,
    hitoId: true,
    autorId: true,
    tipo: true,
    prioridad: true,
    titulo: true,
    contenido: true,
    referencia: true,
    lugar: true,
    enlace: true,
    fechaEventoInicio: true,
    fechaEventoFin: true,
    estaFijada: true,
    estaActiva: true,
    comentariosHabilitados: true,
    visibleParaEstudiantes: true,
    notificarAlPublicar: true,
    recordarUnDiaAntes: true,
    recordarUnaHoraAntes: true,
    agregarAlCalendario: true,
    publicadoEn: true,
    editadoEn: true,
    eliminadoEn: true,
    creadoEn: true,
    actualizadoEn: true,

    autor: {
      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        correo: true,
        fotoPerfilUrl: true,
        rol: true,
      },
    },
  } as const;

  private convertirFechaOpcional(
    valor: string | null | undefined,
  ): Date | null | undefined {
    if (valor === undefined) {
      return undefined;
    }

    if (valor === null || valor.trim() === '') {
      return null;
    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      throw new BadRequestException('Una de las fechas enviadas no es válida');
    }

    return fecha;
  }

  private normalizarTextoOpcional(
    valor: string | null | undefined,
  ): string | null | undefined {
    if (valor === undefined) {
      return undefined;
    }

    if (valor === null) {
      return null;
    }

    const texto = valor.trim();

    return texto.length > 0 ? texto : null;
  }

  private validarEnlace(enlace: string | null | undefined) {
    if (enlace === undefined || enlace === null || enlace.trim() === '') {
      return;
    }

    try {
      const url = new URL(enlace);

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error();
      }
    } catch {
      throw new BadRequestException(
        'El enlace debe comenzar con http:// o https://',
      );
    }
  }

  private validarConfiguracionTemporal(datos: {
    tipo: TipoPublicacionCurso;

    fechaEventoInicio: Date | null;

    fechaEventoFin: Date | null;

    recordarUnDiaAntes: boolean;

    recordarUnaHoraAntes: boolean;

    agregarAlCalendario: boolean;
  }) {
    const {
      tipo,
      fechaEventoInicio,
      fechaEventoFin,
      recordarUnDiaAntes,
      recordarUnaHoraAntes,
      agregarAlCalendario,
    } = datos;

    if (
      fechaEventoInicio &&
      fechaEventoFin &&
      fechaEventoFin.getTime() < fechaEventoInicio.getTime()
    ) {
      throw new BadRequestException(
        'La fecha de finalización no puede ser anterior a la fecha de inicio',
      );
    }

    if (
      (recordarUnDiaAntes || recordarUnaHoraAntes || agregarAlCalendario) &&
      !fechaEventoInicio
    ) {
      throw new BadRequestException(
        'Debes registrar una fecha de inicio para usar recordatorios o calendario',
      );
    }

    const tiposQueRequierenFecha: TipoPublicacionCurso[] = [
      TipoPublicacionCurso.EXAMEN,
      TipoPublicacionCurso.PRESENTACION_PROYECTO,
      TipoPublicacionCurso.ENTREGA_PROYECTO,
      TipoPublicacionCurso.CLASE_VIRTUAL,
      TipoPublicacionCurso.CAMBIO_HORARIO,
      TipoPublicacionCurso.RECORDATORIO,
    ];

    if (tiposQueRequierenFecha.includes(tipo) && !fechaEventoInicio) {
      throw new BadRequestException(
        'El tipo de publicación seleccionado requiere una fecha',
      );
    }
  }

  private obtenerPesoPrioridad(prioridad: PrioridadPublicacion): number {
    switch (prioridad) {
      case PrioridadPublicacion.URGENTE:
        return 4;

      case PrioridadPublicacion.ALTA:
        return 3;

      case PrioridadPublicacion.MEDIA:
        return 2;

      default:
        return 1;
    }
  }

  private ordenarPublicaciones<
    T extends {
      estaFijada: boolean;
      prioridad: PrioridadPublicacion;
      fechaEventoInicio: Date | null;
      fechaEventoFin: Date | null;
      publicadoEn: Date;
    },
  >(publicaciones: T[]): T[] {
    const ahora = Date.now();

    return [...publicaciones].sort((a, b) => {
      if (a.estaFijada !== b.estaFijada) {
        return a.estaFijada ? -1 : 1;
      }

      const fechaA = a.fechaEventoInicio?.getTime() ?? null;

      const fechaB = b.fechaEventoInicio?.getTime() ?? null;

      const vigenteA =
        fechaA !== null && (a.fechaEventoFin?.getTime() ?? fechaA) >= ahora;

      const vigenteB =
        fechaB !== null && (b.fechaEventoFin?.getTime() ?? fechaB) >= ahora;

      if (vigenteA !== vigenteB) {
        return vigenteA ? -1 : 1;
      }

      if (
        vigenteA &&
        vigenteB &&
        fechaA !== null &&
        fechaB !== null &&
        fechaA !== fechaB
      ) {
        return fechaA - fechaB;
      }

      const prioridadA = this.obtenerPesoPrioridad(a.prioridad);

      const prioridadB = this.obtenerPesoPrioridad(b.prioridad);

      if (prioridadA !== prioridadB) {
        return prioridadB - prioridadA;
      }

      if (fechaA === null && fechaB !== null) {
        return -1;
      }

      if (fechaA !== null && fechaB === null) {
        return 1;
      }

      if (fechaA !== null && fechaB !== null && fechaA !== fechaB) {
        return fechaB - fechaA;
      }

      return b.publicadoEn.getTime() - a.publicadoEn.getTime();
    });
  }

  private validarRolAula(usuario: UsuarioAutenticado) {
    if (usuario.rol !== Rol.DOCENTE && usuario.rol !== Rol.ESTUDIANTE) {
      throw new ForbiddenException('Tu rol no tiene acceso al tablón del aula');
    }
  }

  private validarDocente(usuario: UsuarioAutenticado) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException(
        'Solo el docente del curso puede realizar esta acción',
      );
    }
  }

  private validarCursoEditable(estado: EstadoCurso) {
    if (estado === EstadoCurso.FINALIZADO) {
      throw new BadRequestException(
        'El curso fue finalizado y el tablón se conserva únicamente como historial',
      );
    }

    if (estado !== EstadoCurso.ACTIVO) {
      throw new BadRequestException(
        'El curso debe estar activo para modificar el tablón',
      );
    }
  }

  private async obtenerAccesoCurso(
    usuario: UsuarioAutenticado,

    cursoId: number,
  ) {
    this.validarRolAula(usuario);

    const curso = await this.prisma.curso.findUnique({
      where: {
        id: cursoId,
      },

      select: {
        id: true,
        docenteId: true,
        planificacionId: true,
        gestion: true,
        paralelo: true,
        semestre: true,
        estado: true,
        finalizadoEn: true,

        materia: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            semestre: true,
            descripcion: true,
          },
        },

        docente: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            correo: true,
            fotoPerfilUrl: true,
          },
        },
      },
    });

    if (!curso) {
      throw new NotFoundException('El curso solicitado no existe');
    }

    if (usuario.rol === Rol.DOCENTE) {
      if (curso.docenteId !== usuario.id) {
        throw new ForbiddenException(
          'No tienes permiso para administrar el tablón de otro docente',
        );
      }

      return {
        curso,
        inscripcion: null,
      };
    }

    const inscripcion = await this.prisma.inscripcionCurso.findFirst({
      where: {
        cursoId,
        estudianteId: usuario.id,
        estado: EstadoInscripcion.ACTIVA,
      },

      select: {
        id: true,
        estado: true,
        inscritoEn: true,
      },
    });

    if (!inscripcion) {
      throw new ForbiddenException(
        'No estás inscrito activamente en este curso',
      );
    }

    return {
      curso,
      inscripcion,
    };
  }

  private async obtenerHitoDelCurso(
    curso: {
      id: number;
      planificacionId: number | null;
      gestion: string;
    },

    hitoId: number,
  ) {
    if (curso.planificacionId === null) {
      throw new BadRequestException(
        'El curso todavía no tiene una planificación académica asociada',
      );
    }

    const hito = await this.prisma.hitoAcademico.findFirst({
      where: {
        id: hitoId,

        planificacionId: curso.planificacionId,
      },

      select: {
        id: true,
        numero: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        fechaInicio: true,
        fechaFin: true,
        puntajeTotal: true,
        puntajeContinua: true,
        puntajeProcesual: true,
      },
    });

    if (!hito) {
      throw new NotFoundException(
        'El hito no pertenece a la planificación académica del curso',
      );
    }

    return hito;
  }

  private async obtenerPublicacionActiva(
    cursoId: number,

    hitoId: number,

    publicacionId: number,
  ) {
    const publicacion = await this.prisma.publicacionCurso.findFirst({
      where: {
        id: publicacionId,

        cursoId,

        hitoId,

        estaActiva: true,
      },

      select: this.seleccionPublicacion,
    });

    if (!publicacion) {
      throw new NotFoundException(
        'La publicación no existe, fue retirada o pertenece a otro hito',
      );
    }

    return publicacion;
  }

  async obtenerTablon(
    usuario: UsuarioAutenticado,

    cursoId: number,

    hitoId: number,
  ) {
    const acceso = await this.obtenerAccesoCurso(usuario, cursoId);

    const hito = await this.obtenerHitoDelCurso(acceso.curso, hitoId);

    const publicaciones = await this.prisma.publicacionCurso.findMany({
      where: {
        cursoId,
        hitoId,
        estaActiva: true,

        ...(usuario.rol === Rol.ESTUDIANTE
          ? {
              visibleParaEstudiantes: true,
            }
          : {}),
      },

      select: this.seleccionPublicacion,
    });

    const publicacionesOrdenadas = this.ordenarPublicaciones(publicaciones);

    return {
      curso: acceso.curso,

      hito,

      inscripcion: acceso.inscripcion,

      permisos: {
        puedeCrear: usuario.rol === Rol.DOCENTE,

        puedeEditar: usuario.rol === Rol.DOCENTE,

        puedeEliminar: usuario.rol === Rol.DOCENTE,

        puedeComentar: true,
      },

      total: publicacionesOrdenadas.length,

      publicaciones: publicacionesOrdenadas,
    };
  }

  async crearPublicacion(
    usuario: UsuarioAutenticado,

    cursoId: number,

    hitoId: number,

    datos: CrearPublicacionDto,
  ) {
    this.validarDocente(usuario);

    const acceso = await this.obtenerAccesoCurso(usuario, cursoId);

    this.validarCursoEditable(acceso.curso.estado);

    await this.obtenerHitoDelCurso(acceso.curso, hitoId);

    this.validarEnlace(datos.enlace);

    const fechaEventoInicio =
      this.convertirFechaOpcional(datos.fechaEventoInicio) ?? null;

    const fechaEventoFin =
      this.convertirFechaOpcional(datos.fechaEventoFin) ?? null;

    const recordarUnDiaAntes = datos.recordarUnDiaAntes ?? false;

    const recordarUnaHoraAntes = datos.recordarUnaHoraAntes ?? false;

    const agregarAlCalendario = datos.agregarAlCalendario ?? false;

    this.validarConfiguracionTemporal({
      tipo: datos.tipo,
      fechaEventoInicio,
      fechaEventoFin,
      recordarUnDiaAntes,
      recordarUnaHoraAntes,
      agregarAlCalendario,
    });

    const publicacion = await this.prisma.publicacionCurso.create({
      data: {
        cursoId,
        hitoId,
        autorId: usuario.id,

        tipo: datos.tipo,

        prioridad: datos.prioridad,

        titulo: datos.titulo.trim(),

        contenido: datos.contenido.trim(),

        referencia: this.normalizarTextoOpcional(datos.referencia) ?? null,

        lugar: this.normalizarTextoOpcional(datos.lugar) ?? null,

        enlace: this.normalizarTextoOpcional(datos.enlace) ?? null,

        fechaEventoInicio,
        fechaEventoFin,

        estaFijada: datos.estaFijada ?? false,

        estaActiva: true,

        comentariosHabilitados: datos.comentariosHabilitados ?? false,

        visibleParaEstudiantes: datos.visibleParaEstudiantes ?? true,

        notificarAlPublicar: datos.notificarAlPublicar ?? true,

        recordarUnDiaAntes,

        recordarUnaHoraAntes,

        agregarAlCalendario,

        publicadoEn: new Date(),

        editadoEn: null,

        eliminadoEn: null,
      },

      select: this.seleccionPublicacion,
    });

    if (
      publicacion.notificarAlPublicar !== false &&
      publicacion.visibleParaEstudiantes !== false
    ) {
      const inscripciones = await this.prisma.inscripcionCurso.findMany({
        where: {
          cursoId,

          estado: EstadoInscripcion.ACTIVA,

          estudiante: {
            estaActivo: true,
            rol: Rol.ESTUDIANTE,
          },
        },

        select: {
          estudianteId: true,
        },
      });

      await this.notificacionesService.crearMuchas(
        inscripciones.map((inscripcion) => ({
          destinatarioId: inscripcion.estudianteId,

          tipo: TipoNotificacion.NUEVO_TABLON,

          titulo: publicacion.titulo,

          cuerpo: 'Nueva publicación en el tablón de tu curso.',

          enlace: `/estudiante/cursos/${cursoId}`,
        })),
      );
    }

    return {
      mensaje: 'Publicación creada correctamente',

      publicacion,
    };
  }

  async actualizarPublicacion(
    usuario: UsuarioAutenticado,

    cursoId: number,

    hitoId: number,

    publicacionId: number,

    datos: ActualizarPublicacionDto,
  ) {
    this.validarDocente(usuario);

    const acceso = await this.obtenerAccesoCurso(usuario, cursoId);

    this.validarCursoEditable(acceso.curso.estado);

    await this.obtenerHitoDelCurso(acceso.curso, hitoId);

    const actual = await this.obtenerPublicacionActiva(
      cursoId,
      hitoId,
      publicacionId,
    );

    if (Object.keys(datos).length === 0) {
      throw new BadRequestException(
        'Debes enviar al menos un dato para actualizar la publicación',
      );
    }

    this.validarEnlace(datos.enlace);

    const fechaEventoInicioConvertida = this.convertirFechaOpcional(
      datos.fechaEventoInicio,
    );

    const fechaEventoFinConvertida = this.convertirFechaOpcional(
      datos.fechaEventoFin,
    );

    const tipoFinal = datos.tipo ?? actual.tipo;

    const fechaEventoInicioFinal =
      fechaEventoInicioConvertida === undefined
        ? actual.fechaEventoInicio
        : fechaEventoInicioConvertida;

    const fechaEventoFinFinal =
      fechaEventoFinConvertida === undefined
        ? actual.fechaEventoFin
        : fechaEventoFinConvertida;

    const recordarUnDiaAntesFinal =
      datos.recordarUnDiaAntes ?? actual.recordarUnDiaAntes;

    const recordarUnaHoraAntesFinal =
      datos.recordarUnaHoraAntes ?? actual.recordarUnaHoraAntes;

    const agregarAlCalendarioFinal =
      datos.agregarAlCalendario ?? actual.agregarAlCalendario;

    this.validarConfiguracionTemporal({
      tipo: tipoFinal,
      fechaEventoInicio: fechaEventoInicioFinal,
      fechaEventoFin: fechaEventoFinFinal,
      recordarUnDiaAntes: recordarUnDiaAntesFinal,
      recordarUnaHoraAntes: recordarUnaHoraAntesFinal,
      agregarAlCalendario: agregarAlCalendarioFinal,
    });

    const publicacion = await this.prisma.publicacionCurso.update({
      where: {
        id: publicacionId,
      },

      data: {
        ...(datos.tipo !== undefined
          ? {
              tipo: datos.tipo,
            }
          : {}),

        ...(datos.prioridad !== undefined
          ? {
              prioridad: datos.prioridad,
            }
          : {}),

        ...(datos.titulo !== undefined
          ? {
              titulo: datos.titulo.trim(),
            }
          : {}),

        ...(datos.contenido !== undefined
          ? {
              contenido: datos.contenido.trim(),
            }
          : {}),

        ...(datos.referencia !== undefined
          ? {
              referencia: this.normalizarTextoOpcional(datos.referencia),
            }
          : {}),

        ...(datos.lugar !== undefined
          ? {
              lugar: this.normalizarTextoOpcional(datos.lugar),
            }
          : {}),

        ...(datos.enlace !== undefined
          ? {
              enlace: this.normalizarTextoOpcional(datos.enlace),
            }
          : {}),

        ...(fechaEventoInicioConvertida !== undefined
          ? {
              fechaEventoInicio: fechaEventoInicioConvertida,
            }
          : {}),

        ...(fechaEventoFinConvertida !== undefined
          ? {
              fechaEventoFin: fechaEventoFinConvertida,
            }
          : {}),

        ...(datos.comentariosHabilitados !== undefined
          ? {
              comentariosHabilitados: datos.comentariosHabilitados,
            }
          : {}),

        ...(datos.notificarAlPublicar !== undefined
          ? {
              notificarAlPublicar: datos.notificarAlPublicar,
            }
          : {}),

        ...(datos.recordarUnDiaAntes !== undefined
          ? {
              recordarUnDiaAntes: datos.recordarUnDiaAntes,
            }
          : {}),

        ...(datos.recordarUnaHoraAntes !== undefined
          ? {
              recordarUnaHoraAntes: datos.recordarUnaHoraAntes,
            }
          : {}),

        ...(datos.agregarAlCalendario !== undefined
          ? {
              agregarAlCalendario: datos.agregarAlCalendario,
            }
          : {}),

        editadoEn: new Date(),
      },

      select: this.seleccionPublicacion,
    });

    return {
      mensaje: 'Publicación actualizada correctamente',

      publicacion,
    };
  }

  async cambiarFijado(
    usuario: UsuarioAutenticado,

    cursoId: number,

    hitoId: number,

    publicacionId: number,

    estaFijada: boolean,
  ) {
    this.validarDocente(usuario);

    const acceso = await this.obtenerAccesoCurso(usuario, cursoId);

    this.validarCursoEditable(acceso.curso.estado);

    await this.obtenerHitoDelCurso(acceso.curso, hitoId);

    const actual = await this.obtenerPublicacionActiva(
      cursoId,
      hitoId,
      publicacionId,
    );

    if (actual.estaFijada === estaFijada) {
      return {
        mensaje: estaFijada
          ? 'La publicación ya se encuentra fijada'
          : 'La publicación ya se encuentra sin fijar',

        publicacion: actual,
      };
    }

    const publicacion = await this.prisma.publicacionCurso.update({
      where: {
        id: publicacionId,
      },

      data: {
        estaFijada,
      },

      select: this.seleccionPublicacion,
    });

    return {
      mensaje: estaFijada
        ? 'Publicación fijada correctamente'
        : 'Publicación desfijada correctamente',

      publicacion,
    };
  }

  async cambiarComentarios(
    usuario: UsuarioAutenticado,

    cursoId: number,

    hitoId: number,

    publicacionId: number,

    comentariosHabilitados: boolean,
  ) {
    this.validarDocente(usuario);

    const acceso = await this.obtenerAccesoCurso(usuario, cursoId);

    this.validarCursoEditable(acceso.curso.estado);

    await this.obtenerHitoDelCurso(acceso.curso, hitoId);

    const actual = await this.obtenerPublicacionActiva(
      cursoId,
      hitoId,
      publicacionId,
    );

    if (actual.comentariosHabilitados === comentariosHabilitados) {
      return {
        mensaje: comentariosHabilitados
          ? 'Los comentarios ya se encuentran habilitados'
          : 'Los comentarios ya se encuentran deshabilitados',

        publicacion: actual,
      };
    }

    const publicacion = await this.prisma.publicacionCurso.update({
      where: {
        id: publicacionId,
      },

      data: {
        comentariosHabilitados,
      },

      select: this.seleccionPublicacion,
    });

    return {
      mensaje: comentariosHabilitados
        ? 'Comentarios habilitados correctamente'
        : 'Comentarios deshabilitados correctamente',

      publicacion,
    };
  }

  async cambiarVisibilidad(
    usuario: UsuarioAutenticado,

    cursoId: number,

    hitoId: number,

    publicacionId: number,

    visibleParaEstudiantes: boolean,
  ) {
    this.validarDocente(usuario);

    const acceso = await this.obtenerAccesoCurso(usuario, cursoId);

    this.validarCursoEditable(acceso.curso.estado);

    await this.obtenerHitoDelCurso(acceso.curso, hitoId);

    const actual = await this.obtenerPublicacionActiva(
      cursoId,
      hitoId,
      publicacionId,
    );

    if (actual.visibleParaEstudiantes === visibleParaEstudiantes) {
      return {
        mensaje: visibleParaEstudiantes
          ? 'La publicación ya es visible para estudiantes'
          : 'La publicación ya está oculta para estudiantes',

        publicacion: actual,
      };
    }

    const publicacion = await this.prisma.publicacionCurso.update({
      where: {
        id: publicacionId,
      },

      data: {
        visibleParaEstudiantes,
      },

      select: this.seleccionPublicacion,
    });

    return {
      mensaje: visibleParaEstudiantes
        ? 'Publicación visible para estudiantes'
        : 'Publicación oculta para estudiantes',

      publicacion,
    };
  }

  async eliminarPublicacion(
    usuario: UsuarioAutenticado,

    cursoId: number,

    hitoId: number,

    publicacionId: number,
  ) {
    this.validarDocente(usuario);

    const acceso = await this.obtenerAccesoCurso(usuario, cursoId);

    this.validarCursoEditable(acceso.curso.estado);

    await this.obtenerHitoDelCurso(acceso.curso, hitoId);

    await this.obtenerPublicacionActiva(cursoId, hitoId, publicacionId);

    const publicacion = await this.prisma.publicacionCurso.update({
      where: {
        id: publicacionId,
      },

      data: {
        estaActiva: false,
        estaFijada: false,
        eliminadoEn: new Date(),
      },

      select: this.seleccionPublicacion,
    });

    return {
      mensaje: 'Publicación retirada correctamente',

      publicacion,
    };
  }
}
