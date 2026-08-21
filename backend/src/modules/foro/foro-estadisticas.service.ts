import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EstadoInscripcion,
  EstadoRespuestaForo,
  Rol,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

type AcumuladoEstudiante = {
  respuestas: number;
  comentarios: number;
  ultimaParticipacionEn: Date | null;
};

@Injectable()
export class ForoEstadisticasService {
  constructor(private readonly prisma: PrismaService) {}

  private async obtenerForoDocente(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
  ) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException(
        'Solo el docente puede consultar las estadísticas del foro',
      );
    }

    const foro = await this.prisma.temaForoCurso.findFirst({
      where: {
        id: foroId,
        cursoId,
        estaActivo: true,
        curso: { docenteId: usuario.id },
      },
      select: {
        id: true,
        titulo: true,
        modalidadParticipacion: true,
        origenGrupo: true,
        fechaApertura: true,
        fechaCierre: true,
        creadoEn: true,
      },
    });

    if (!foro) {
      throw new NotFoundException(
        'El foro no existe o no pertenece al docente autenticado',
      );
    }

    return foro;
  }

  private actualizarUltimaFecha(
    actual: Date | null,
    candidata: Date | null,
  ) {
    if (!candidata) return actual;
    if (!actual || candidata > actual) return candidata;
    return actual;
  }

  private claveFecha(fecha: Date) {
    return fecha.toISOString().slice(0, 10);
  }

  async obtenerEstadisticas(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
  ) {
    const foro = await this.obtenerForoDocente(usuario, cursoId, foroId);

    const [inscripciones, lecturas, respuestas, comentarios, equipos] =
      await Promise.all([
        this.prisma.inscripcionCurso.findMany({
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
            estudiante: {
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
          orderBy: [
            { estudiante: { apellidoPaterno: 'asc' } },
            { estudiante: { nombres: 'asc' } },
          ],
        }),
        this.prisma.lecturaTemaForo.findMany({
          where: { temaId: foroId },
          select: {
            usuarioId: true,
            primeraLecturaEn: true,
            ultimaLecturaEn: true,
            cantidadVisitas: true,
          },
        }),
        this.prisma.respuestaForoCurso.findMany({
          where: {
            temaId: foroId,
            estaActiva: true,
            estado: {
              in: [EstadoRespuestaForo.PUBLICADA, EstadoRespuestaForo.TARDIA],
            },
          },
          select: {
            id: true,
            autorId: true,
            publicadoEn: true,
            actualizadoEn: true,
            grupoCursoId: true,
            equipoAfinidadId: true,
            grupoCurso: {
              select: {
                id: true,
                nombre: true,
                integrantes: {
                  where: { estaActivo: true },
                  select: { estudianteId: true },
                },
              },
            },
            equipoAfinidad: {
              select: {
                id: true,
                nombre: true,
                integrantes: {
                  where: { estaActivo: true },
                  select: { estudianteId: true },
                },
              },
            },
          },
        }),
        this.prisma.comentarioRespuestaForo.findMany({
          where: {
            estaActivo: true,
            estaOculto: false,
            respuesta: {
              temaId: foroId,
              estaActiva: true,
            },
          },
          select: {
            autorId: true,
            publicadoEn: true,
            actualizadoEn: true,
          },
        }),
        this.prisma.equipoAfinidadForo.findMany({
          where: { temaId: foroId, estaActivo: true },
          select: {
            id: true,
            nombre: true,
            integrantes: {
              where: { estaActivo: true },
              select: { estudianteId: true },
            },
          },
          orderBy: { nombre: 'asc' },
        }),
      ]);

    const estudiantesIds = new Set(
      inscripciones.map((item) => item.estudianteId),
    );
    const lecturaPorEstudiante = new Map(
      lecturas
        .filter((item) => estudiantesIds.has(item.usuarioId))
        .map((item) => [item.usuarioId, item]),
    );
    const lecturasEstudiantes = lecturas.filter((item) =>
      estudiantesIds.has(item.usuarioId),
    );
    const acumulado = new Map<number, AcumuladoEstudiante>();

    for (const id of estudiantesIds) {
      acumulado.set(id, {
        respuestas: 0,
        comentarios: 0,
        ultimaParticipacionEn: null,
      });
    }

    for (const respuesta of respuestas) {
      const participantes = new Set<number>([respuesta.autorId]);
      respuesta.grupoCurso?.integrantes.forEach((item) =>
        participantes.add(item.estudianteId),
      );
      respuesta.equipoAfinidad?.integrantes.forEach((item) =>
        participantes.add(item.estudianteId),
      );

      for (const estudianteId of participantes) {
        const item = acumulado.get(estudianteId);
        if (!item) continue;
        item.respuestas += 1;
        item.ultimaParticipacionEn = this.actualizarUltimaFecha(
          item.ultimaParticipacionEn,
          respuesta.publicadoEn ?? respuesta.actualizadoEn,
        );
      }
    }

    for (const comentario of comentarios) {
      const item = acumulado.get(comentario.autorId);
      if (!item) continue;
      item.comentarios += 1;
      item.ultimaParticipacionEn = this.actualizarUltimaFecha(
        item.ultimaParticipacionEn,
        comentario.publicadoEn ?? comentario.actualizadoEn,
      );
    }

    const estudiantes = inscripciones.map(({ estudiante }) => {
      const participacion = acumulado.get(estudiante.id)!;
      const lectura = lecturaPorEstudiante.get(estudiante.id);
      const participo =
        participacion.respuestas > 0 || participacion.comentarios > 0;

      return {
        estudiante,
        leido: Boolean(lectura),
        primeraLecturaEn: lectura?.primeraLecturaEn ?? null,
        ultimaLecturaEn: lectura?.ultimaLecturaEn ?? null,
        cantidadVisitas: lectura?.cantidadVisitas ?? 0,
        participo,
        cantidadRespuestas: participacion.respuestas,
        cantidadComentarios: participacion.comentarios,
        totalIntervenciones:
          participacion.respuestas + participacion.comentarios,
        ultimaParticipacionEn: participacion.ultimaParticipacionEn,
      };
    });

    const participantes = estudiantes.filter((item) => item.participo).length;
    const lectores = estudiantes.filter((item) => item.leido).length;
    const totalEstudiantes = estudiantes.length;
    const actividad = new Map<
      string,
      { fecha: string; respuestas: number; comentarios: number; total: number }
    >();

    const sumarActividad = (
      fecha: Date | null,
      tipo: 'respuestas' | 'comentarios',
    ) => {
      if (!fecha) return;
      const clave = this.claveFecha(fecha);
      const item = actividad.get(clave) ?? {
        fecha: clave,
        respuestas: 0,
        comentarios: 0,
        total: 0,
      };
      item[tipo] += 1;
      item.total += 1;
      actividad.set(clave, item);
    };

    respuestas.forEach((item) =>
      sumarActividad(item.publicadoEn ?? item.actualizadoEn, 'respuestas'),
    );
    comentarios.forEach((item) =>
      sumarActividad(item.publicadoEn ?? item.actualizadoEn, 'comentarios'),
    );

    const estadisticasEquipos = equipos.map((equipo) => {
      const integrantesIds = equipo.integrantes.map(
        (item) => item.estudianteId,
      );
      const integrantes = estudiantes.filter((item) =>
        integrantesIds.includes(item.estudiante.id),
      );
      return {
        id: equipo.id,
        nombre: equipo.nombre,
        totalIntegrantes: integrantes.length,
        integrantesParticipantes: integrantes.filter((item) => item.participo)
          .length,
        integrantesLectores: integrantes.filter((item) => item.leido).length,
        cantidadRespuestas: respuestas.filter(
          (item) => item.equipoAfinidadId === equipo.id,
        ).length,
        cantidadComentarios: integrantes.reduce(
          (total, item) => total + item.cantidadComentarios,
          0,
        ),
        porcentajeParticipacion:
          integrantes.length === 0
            ? 0
            : Number(
                ((integrantes.filter((item) => item.participo).length /
                  integrantes.length) *
                  100).toFixed(2),
              ),
      };
    });

    const gruposUsados = new Map<
      number,
      {
        id: number;
        nombre: string;
        integrantesIds: number[];
      }
    >();

    respuestas.forEach((respuesta) => {
      if (!respuesta.grupoCurso) return;
      gruposUsados.set(respuesta.grupoCurso.id, {
        id: respuesta.grupoCurso.id,
        nombre: respuesta.grupoCurso.nombre,
        integrantesIds: respuesta.grupoCurso.integrantes.map(
          (item) => item.estudianteId,
        ),
      });
    });

    const estadisticasGrupos = Array.from(gruposUsados.values())
      .map((grupo) => {
        const integrantes = estudiantes.filter((item) =>
          grupo.integrantesIds.includes(item.estudiante.id),
        );
        const integrantesParticipantes = integrantes.filter(
          (item) => item.participo,
        ).length;

        return {
          id: grupo.id,
          nombre: grupo.nombre,
          totalIntegrantes: integrantes.length,
          integrantesParticipantes,
          integrantesLectores: integrantes.filter((item) => item.leido).length,
          cantidadRespuestas: respuestas.filter(
            (item) => item.grupoCursoId === grupo.id,
          ).length,
          cantidadComentarios: integrantes.reduce(
            (total, item) => total + item.cantidadComentarios,
            0,
          ),
          porcentajeParticipacion:
            integrantes.length === 0
              ? 0
              : Number(
                  ((integrantesParticipantes / integrantes.length) * 100).toFixed(
                    2,
                  ),
                ),
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    return {
      foro,
      resumen: {
        totalEstudiantes,
        estudiantesParticipantes: participantes,
        estudiantesSinParticipar: totalEstudiantes - participantes,
        porcentajeParticipacion:
          totalEstudiantes === 0
            ? 0
            : Number(((participantes / totalEstudiantes) * 100).toFixed(2)),
        estudiantesLectores: lectores,
        estudiantesSinLeer: totalEstudiantes - lectores,
        porcentajeLectura:
          totalEstudiantes === 0
            ? 0
            : Number(((lectores / totalEstudiantes) * 100).toFixed(2)),
        cantidadRespuestas: respuestas.length,
        cantidadComentarios: comentarios.length,
        totalIntervenciones: respuestas.length + comentarios.length,
        cantidadVistas: lecturasEstudiantes.reduce(
          (total, item) => total + item.cantidadVisitas,
          0,
        ),
        cantidadLectores: lectores,
        cantidadEquipos: equipos.length,
      },
      estudiantes,
      estudiantesSinParticipar: estudiantes.filter((item) => !item.participo),
      estudiantesSinLeer: estudiantes.filter((item) => !item.leido),
      actividadPorFecha: Array.from(actividad.values()).sort((a, b) =>
        a.fecha.localeCompare(b.fecha),
      ),
      grupos: estadisticasGrupos,
      equipos: estadisticasEquipos,
    };
  }
}
