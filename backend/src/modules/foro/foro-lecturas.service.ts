import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EstadoForo,
  EstadoInscripcion,
  EstadoRespuestaForo,
  Rol,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  ListarForosQueryDto,
} from './dto/listar-foros-query.dto';
import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

type ForoListado = {
  id: number;
  publicadoEn: Date | null;
  actualizadoEn: Date;
  [clave: string]: unknown;
};

function esFechaValida(
  fecha: Date | null | undefined,
): fecha is Date {
  return fecha instanceof Date;
}

@Injectable()
export class ForoLecturasService {
  constructor(private readonly prisma: PrismaService) {}

  private async validarAcceso(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId?: number,
  ) {
    if (usuario.rol === Rol.DOCENTE) {
      const curso = await this.prisma.curso.findFirst({
        where: { id: cursoId, docenteId: usuario.id },
        select: { id: true },
      });

      if (!curso) {
        throw new ForbiddenException('El curso no pertenece al docente autenticado');
      }
    } else if (usuario.rol === Rol.ESTUDIANTE) {
      const inscripcion = await this.prisma.inscripcionCurso.findFirst({
        where: {
          cursoId,
          estudianteId: usuario.id,
          estado: EstadoInscripcion.ACTIVA,
          estudiante: { estaActivo: true },
        },
        select: { id: true },
      });

      if (!inscripcion) {
        throw new ForbiddenException('No tienes una inscripción activa en este curso');
      }
    } else {
      throw new ForbiddenException('No tienes permisos para consultar lecturas del foro');
    }

    if (foroId === undefined) return;

    const ahora = new Date();
    const foro = await this.prisma.temaForoCurso.findFirst({
      where: {
        id: foroId,
        cursoId,
        estaActivo: true,
        ...(usuario.rol === Rol.ESTUDIANTE
          ? {
              estado: { notIn: [EstadoForo.BORRADOR, EstadoForo.ANULADO] },
              fechaApertura: { lte: ahora },
            }
          : {}),
      },
      select: { id: true },
    });

    if (!foro) throw new NotFoundException('El foro no existe o todavía no está disponible');
  }

  async registrarLectura(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
  ) {
    await this.validarAcceso(usuario, cursoId, foroId);

    // Las lecturas del docente no forman parte de los indicadores del alumnado.
    if (usuario.rol === Rol.DOCENTE) {
      return {
        mensaje: 'La consulta del docente no contabiliza una lectura',
        lectura: null,
      };
    }

    const ahora = new Date();
    const lectura = await this.prisma.lecturaTemaForo.upsert({
      where: { temaId_usuarioId: { temaId: foroId, usuarioId: usuario.id } },
      create: {
        temaId: foroId,
        usuarioId: usuario.id,
        primeraLecturaEn: ahora,
        ultimaLecturaEn: ahora,
        cantidadVisitas: 1,
      },
      update: {
        ultimaLecturaEn: ahora,
        cantidadVisitas: { increment: 1 },
      },
      select: {
        primeraLecturaEn: true,
        ultimaLecturaEn: true,
        cantidadVisitas: true,
      },
    });

    return { mensaje: 'Lectura registrada correctamente', lectura };
  }

  async enriquecerListado(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foros: ForoListado[],
  ) {
    await this.validarAcceso(usuario, cursoId);
    if (foros.length === 0) return [];

    const ids = foros.map((foro) => foro.id);
    const [
      lecturasUsuario,
      lecturas,
      respuestas,
      comentarios,
      inscripciones,
    ] = await Promise.all([
      this.prisma.lecturaTemaForo.findMany({
        where: { temaId: { in: ids }, usuarioId: usuario.id },
        select: { temaId: true, ultimaLecturaEn: true, cantidadVisitas: true },
      }),
      this.prisma.lecturaTemaForo.findMany({
        where: { temaId: { in: ids } },
        select: { temaId: true, usuarioId: true, cantidadVisitas: true },
      }),
      this.prisma.respuestaForoCurso.findMany({
        where: {
          temaId: { in: ids },
          estaActiva: true,
          estado: { in: [EstadoRespuestaForo.PUBLICADA, EstadoRespuestaForo.TARDIA] },
        },
        select: { id: true, temaId: true, autorId: true, publicadoEn: true, actualizadoEn: true },
      }),
      this.prisma.comentarioRespuestaForo.findMany({
        where: {
          estaActivo: true,
          estaOculto: false,
          respuesta: { temaId: { in: ids }, estaActiva: true },
        },
        select: {
          autorId: true,
          publicadoEn: true,
          actualizadoEn: true,
          respuesta: { select: { temaId: true } },
        },
      }),
      this.prisma.inscripcionCurso.findMany({
        where: {
          cursoId,
          estado: EstadoInscripcion.ACTIVA,
          estudiante: {
            estaActivo: true,
            rol: Rol.ESTUDIANTE,
          },
        },
        select: { estudianteId: true },
      }),
    ]);

    const lecturaPropia = new Map(lecturasUsuario.map((item) => [item.temaId, item]));
    const estudiantesIds = new Set(
      inscripciones.map((item) => item.estudianteId),
    );

    return foros.map((foro) => {
      const respuestasForo = respuestas.filter((item) => item.temaId === foro.id);
      const comentariosForo = comentarios.filter((item) => item.respuesta.temaId === foro.id);
      const lecturasForo = lecturas.filter(
        (item) =>
          item.temaId === foro.id &&
          estudiantesIds.has(item.usuarioId),
      );
      const cantidadLectores = new Set(
        lecturasForo.map((item) => item.usuarioId),
      ).size;
      const participantes = new Set([
        ...respuestasForo.map((item) => item.autorId),
        ...comentariosForo.map((item) => item.autorId),
      ]);
      const fechasActividad = [
        foro.actualizadoEn,
        foro.publicadoEn,
        ...respuestasForo.flatMap((item) => [item.publicadoEn, item.actualizadoEn]),
        ...comentariosForo.flatMap((item) => [item.publicadoEn, item.actualizadoEn]),
      ].filter(esFechaValida);
      const ultimaActividadEn = new Date(Math.max(...fechasActividad.map((fecha) => fecha.getTime())));
      const propia = lecturaPropia.get(foro.id);

      return {
        ...foro,
        indicadores: {
          leido: Boolean(propia),
          tieneNovedades: !propia || ultimaActividadEn > propia.ultimaLecturaEn,
          ultimaLecturaEn: propia?.ultimaLecturaEn ?? null,
          misVisitas: propia?.cantidadVisitas ?? 0,
          // Se conserva el nombre usado por la tarjeta, pero ahora representa
          // estudiantes únicos y no el número de solicitudes al endpoint.
          cantidadVistas: cantidadLectores,
          cantidadLectores,
          cantidadAperturas: lecturasForo.reduce(
            (total, item) => total + item.cantidadVisitas,
            0,
          ),
          cantidadRespuestas: respuestasForo.length,
          cantidadComentarios: comentariosForo.length,
          cantidadParticipantes: participantes.size,
          ultimaActividadEn,
        },
      };
    });
  }

  filtrarOrdenarPaginar(
    foros: Array<ForoListado & {
      titulo?: string;
      creadoEn?: Date;
      estaFijado?: boolean;
      indicadores: {
        leido: boolean;
        tieneNovedades: boolean;
        cantidadRespuestas: number;
        ultimaActividadEn: Date;
      };
    }>,
    filtros: ListarForosQueryDto,
  ) {
    const pagina = filtros.pagina ?? 1;
    const limite = filtros.limite ?? 20;

    const filtrados = foros.filter((foro) => {
      switch (filtros.lectura) {
        case 'LEIDOS':
          return foro.indicadores.leido;
        case 'NO_LEIDOS':
          return !foro.indicadores.leido;
        case 'CON_NOVEDADES':
          return foro.indicadores.tieneNovedades;
        case 'SIN_NOVEDADES':
          return !foro.indicadores.tieneNovedades;
        default:
          return true;
      }
    });

    const orden = filtros.orden ?? 'ULTIMA_ACTIVIDAD_DESC';
    const direccion = orden.endsWith('_ASC') ? 1 : -1;

    filtrados.sort((a, b) => {
      // Los fijados permanecen arriba con cualquier orden seleccionado.
      const diferenciaFijado =
        Number(Boolean(b.estaFijado)) -
        Number(Boolean(a.estaFijado));

      if (diferenciaFijado !== 0) {
        return diferenciaFijado;
      }

      if (orden.startsWith('TITULO_')) {
        return (a.titulo ?? '').localeCompare(
          b.titulo ?? '',
          'es',
          { sensitivity: 'base' },
        ) * direccion;
      }

      if (orden.startsWith('RESPUESTAS_')) {
        return (
          a.indicadores.cantidadRespuestas -
          b.indicadores.cantidadRespuestas
        ) * direccion;
      }

      if (orden.startsWith('CREACION_')) {
        const fechaA = a.creadoEn?.getTime() ?? 0;
        const fechaB = b.creadoEn?.getTime() ?? 0;
        return (fechaA - fechaB) * direccion;
      }

      return (
        a.indicadores.ultimaActividadEn.getTime() -
        b.indicadores.ultimaActividadEn.getTime()
      ) * direccion;
    });

    const totalRegistros = filtrados.length;
    const totalPaginas = Math.max(
      1,
      Math.ceil(totalRegistros / limite),
    );
    const inicio = (pagina - 1) * limite;

    return {
      datos: filtrados.slice(inicio, inicio + limite),
      paginacion: {
        pagina,
        limite,
        totalRegistros,
        totalPaginas,
        tienePaginaAnterior: pagina > 1,
        tienePaginaSiguiente: pagina < totalPaginas,
      },
      filtrosAplicados: {
        busqueda: filtros.busqueda ?? null,
        estado: filtros.estado ?? null,
        autorId: filtros.autorId ?? null,
        grupoId: filtros.grupoId ?? null,
        hitoId: filtros.hitoId ?? null,
        lectura: filtros.lectura ?? null,
        orden,
      },
    };
  }

  async obtenerResumenDocente(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
  ) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException('Solo el docente puede consultar el resumen de lecturas');
    }
    await this.validarAcceso(usuario, cursoId, foroId);

    const estudiantes = await this.prisma.inscripcionCurso.findMany({
      where: { cursoId, estado: EstadoInscripcion.ACTIVA, estudiante: { estaActivo: true } },
      select: {
        estudianteId: true,
        estudiante: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            fotoPerfilUrl: true,
          },
        },
      },
      orderBy: { estudiante: { apellidoPaterno: 'asc' } },
    });

    const lecturas = await this.prisma.lecturaTemaForo.findMany({
      where: { temaId: foroId, usuarioId: { in: estudiantes.map((item) => item.estudianteId) } },
      select: { usuarioId: true, primeraLecturaEn: true, ultimaLecturaEn: true, cantidadVisitas: true },
    });
    const porUsuario = new Map(lecturas.map((item) => [item.usuarioId, item]));
    const detalle = estudiantes.map(({ estudiante }) => ({
      estudiante,
      leido: porUsuario.has(estudiante.id),
      primeraLecturaEn: porUsuario.get(estudiante.id)?.primeraLecturaEn ?? null,
      ultimaLecturaEn: porUsuario.get(estudiante.id)?.ultimaLecturaEn ?? null,
      cantidadVisitas: porUsuario.get(estudiante.id)?.cantidadVisitas ?? 0,
    }));

    return {
      foroId,
      totalEstudiantes: detalle.length,
      totalLectores: detalle.filter((item) => item.leido).length,
      totalSinLeer: detalle.filter((item) => !item.leido).length,
      porcentajeLectura: detalle.length === 0
        ? 0
        : Number(((detalle.filter((item) => item.leido).length / detalle.length) * 100).toFixed(2)),
      estudiantes: detalle,
    };
  }
}
