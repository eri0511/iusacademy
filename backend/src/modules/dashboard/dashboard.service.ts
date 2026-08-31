import { Injectable } from '@nestjs/common';

import { EstadoCurso, EstadoMateria, Rol } from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

type PrioridadAlerta = 'ALTA' | 'MEDIA' | 'BAJA';

type TipoAlerta = 'USUARIOS' | 'MATERIAS' | 'CURSOS' | 'HITOS';

type EstadoPlanificacionDashboard =
  'SIN_PLANIFICACION' | 'PROXIMA' | 'EN_CURSO' | 'FINALIZADA';

type HitoDashboard = {
  id: number;
  numero: number;
  codigo: string;
  nombre: string;
  fechaInicio: Date;
  fechaFin: Date;
};

type ResumenHitosDashboard = {
  tienePlanificacion: boolean;
  gestion: string;
  planificacionId: number | null;
  estaActiva: boolean;
  estado: EstadoPlanificacionDashboard;
  hitoActual: HitoDashboard | null;
  proximoHito: HitoDashboard | null;
  totalHitos: number;
  puntajeTotal: number;
};

type AlertaDashboard = {
  id: string;
  tipo: TipoAlerta;
  prioridad: PrioridadAlerta;
  titulo: string;
  descripcion: string;
  cantidad: number;
  ruta: string;
  accion: string;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private obtenerGestionActual(fecha: Date = new Date()): string {
    return `${fecha.getFullYear()}-${fecha.getMonth() < 6 ? '1' : '2'}`;
  }

  private construirResumenHitos(
    gestion: string,

    planificacion: {
      id: number;
      estaActiva: boolean;
      hitos: HitoDashboard[];
    } | null,
  ): ResumenHitosDashboard {
    if (!planificacion) {
      return {
        tienePlanificacion: false,

        gestion,

        planificacionId: null,

        estaActiva: false,

        estado: 'SIN_PLANIFICACION',

        hitoActual: null,

        proximoHito: null,

        totalHitos: 0,

        puntajeTotal: 0,
      };
    }

    const ahora = new Date();

    const hitosOrdenados = [...planificacion.hitos].sort(
      (a, b) => a.numero - b.numero,
    );

    const hitoActual =
      hitosOrdenados.find(
        (hito) => ahora >= hito.fechaInicio && ahora <= hito.fechaFin,
      ) ?? null;

    const proximoHito =
      hitosOrdenados.find((hito) => ahora < hito.fechaInicio) ?? null;

    let estado: EstadoPlanificacionDashboard;

    if (hitoActual) {
      estado = 'EN_CURSO';
    } else if (proximoHito) {
      estado = 'PROXIMA';
    } else {
      estado = 'FINALIZADA';
    }

    return {
      tienePlanificacion: true,

      gestion,

      planificacionId: planificacion.id,

      estaActiva: planificacion.estaActiva,

      estado,

      hitoActual,

      proximoHito,

      totalHitos: hitosOrdenados.length,

      puntajeTotal: hitosOrdenados.reduce(
        (total, hito) => total + (hito.numero === 1 ? 0 : 25),
        0,
      ),
    };
  }

  private crearAlertas(
    pendientesActivacion: number,

    usuariosDesactivados: number,

    materiasInactivas: number,

    cursosInactivos: number,

    cursosFinalizadosRecientes: number,

    resumenHitos: ResumenHitosDashboard,
  ): AlertaDashboard[] {
    const alertas: AlertaDashboard[] = [];

    if (!resumenHitos.tienePlanificacion) {
      alertas.push({
        id: 'hitos-sin-planificacion',

        tipo: 'HITOS',

        prioridad: 'ALTA',

        titulo: 'Planificación académica pendiente',

        descripcion: `La gestión ${resumenHitos.gestion} todavía no tiene configuradas las fechas de H1 a H5. Registra la planificación para organizar tablón, foros, tareas y calificaciones.`,

        cantidad: 1,

        ruta: '/admin/hitos',

        accion: 'Registrar planificación',
      });
    } else if (!resumenHitos.estaActiva) {
      alertas.push({
        id: 'hitos-planificacion-inactiva',

        tipo: 'HITOS',

        prioridad: 'MEDIA',

        titulo: 'Planificación académica inactiva',

        descripcion: `La planificación de la gestión ${resumenHitos.gestion} se encuentra desactivada. Actívala para permitir el uso académico de sus hitos.`,

        cantidad: 1,

        ruta: '/admin/hitos',

        accion: 'Revisar planificación',
      });
    }

    if (pendientesActivacion > 0) {
      alertas.push({
        id: 'usuarios-pendientes',

        tipo: 'USUARIOS',

        prioridad: pendientesActivacion >= 5 ? 'ALTA' : 'MEDIA',

        titulo: 'Cuentas pendientes de activación',

        descripcion: `${pendientesActivacion} ${
          pendientesActivacion === 1
            ? 'usuario todavía no activó su cuenta'
            : 'usuarios todavía no activaron su cuenta'
        }. Revisa si corresponde reenviar el acceso institucional.`,

        cantidad: pendientesActivacion,

        ruta: '/admin/usuarios',

        accion: 'Revisar usuarios',
      });
    }

    if (usuariosDesactivados > 0) {
      alertas.push({
        id: 'usuarios-desactivados',

        tipo: 'USUARIOS',

        prioridad: 'BAJA',

        titulo: 'Usuarios desactivados',

        descripcion: `${usuariosDesactivados} ${
          usuariosDesactivados === 1
            ? 'cuenta se encuentra desactivada'
            : 'cuentas se encuentran desactivadas'
        }. Verifica si alguna debe reactivarse.`,

        cantidad: usuariosDesactivados,

        ruta: '/admin/usuarios',

        accion: 'Ver cuentas',
      });
    }

    if (materiasInactivas > 0) {
      alertas.push({
        id: 'materias-inactivas',

        tipo: 'MATERIAS',

        prioridad: 'BAJA',

        titulo: 'Materias inactivas',

        descripcion: `${materiasInactivas} ${
          materiasInactivas === 1
            ? 'materia está fuera de disponibilidad'
            : 'materias están fuera de disponibilidad'
        }.`,

        cantidad: materiasInactivas,

        ruta: '/admin/materias',

        accion: 'Revisar materias',
      });
    }

    if (cursosInactivos > 0) {
      alertas.push({
        id: 'cursos-inactivos',

        tipo: 'CURSOS',

        prioridad: 'MEDIA',

        titulo: 'Cursos inactivos',

        descripcion: `${cursosInactivos} ${
          cursosInactivos === 1
            ? 'curso está inactivo'
            : 'cursos están inactivos'
        }. Confirma si deben reactivarse o finalizarse.`,

        cantidad: cursosInactivos,

        ruta: '/admin/cursos',

        accion: 'Revisar cursos',
      });
    }

    if (cursosFinalizadosRecientes > 0) {
      alertas.push({
        id: 'cursos-finalizados-recientes',

        tipo: 'CURSOS',

        prioridad: 'BAJA',

        titulo: 'Cursos finalizados recientemente',

        descripcion: `${cursosFinalizadosRecientes} ${
          cursosFinalizadosRecientes === 1
            ? 'curso fue finalizado en los últimos 30 días'
            : 'cursos fueron finalizados en los últimos 30 días'
        }.`,

        cantidad: cursosFinalizadosRecientes,

        ruta: '/admin/cursos',

        accion: 'Ver historial',
      });
    }

    const orden: Record<PrioridadAlerta, number> = {
      ALTA: 0,

      MEDIA: 1,

      BAJA: 2,
    };

    return alertas.sort((a, b) => orden[a.prioridad] - orden[b.prioridad]);
  }

  async obtenerResumen() {
    const ahora = new Date();

    const gestionActual = this.obtenerGestionActual(ahora);

    const desdeHace30Dias = new Date();

    desdeHace30Dias.setDate(desdeHace30Dias.getDate() - 30);

    const [
      totalUsuarios,
      estudiantes,
      docentes,
      administradores,
      usuariosActivos,
      usuariosDesactivados,
      cuentasActivadas,
      pendientesActivacion,
      totalMaterias,
      materiasActivas,
      materiasInactivas,
      totalCursos,
      cursosActivos,
      cursosInactivos,
      cursosFinalizados,
      cursosFinalizadosRecientes,
      cursosRecientes,
      usuariosRecientes,
      materiasRecientes,
      planificacionActual,
    ] = await Promise.all([
      this.prisma.usuario.count(),

      this.prisma.usuario.count({
        where: {
          rol: Rol.ESTUDIANTE,
        },
      }),

      this.prisma.usuario.count({
        where: {
          rol: Rol.DOCENTE,
        },
      }),

      this.prisma.usuario.count({
        where: {
          rol: Rol.ADMINISTRADOR,
        },
      }),

      this.prisma.usuario.count({
        where: {
          estaActivo: true,
        },
      }),

      this.prisma.usuario.count({
        where: {
          estaActivo: false,
        },
      }),

      this.prisma.usuario.count({
        where: {
          cuentaActivada: true,
        },
      }),

      this.prisma.usuario.count({
        where: {
          cuentaActivada: false,
        },
      }),

      this.prisma.materia.count(),

      this.prisma.materia.count({
        where: {
          estado: EstadoMateria.ACTIVA,
        },
      }),

      this.prisma.materia.count({
        where: {
          estado: EstadoMateria.INACTIVA,
        },
      }),

      this.prisma.curso.count(),

      this.prisma.curso.count({
        where: {
          estado: EstadoCurso.ACTIVO,
        },
      }),

      this.prisma.curso.count({
        where: {
          estado: EstadoCurso.INACTIVO,
        },
      }),

      this.prisma.curso.count({
        where: {
          estado: EstadoCurso.FINALIZADO,
        },
      }),

      this.prisma.curso.count({
        where: {
          estado: EstadoCurso.FINALIZADO,

          finalizadoEn: {
            gte: desdeHace30Dias,
          },
        },
      }),

      this.prisma.curso.findMany({
        take: 5,

        orderBy: {
          creadoEn: 'desc',
        },

        select: {
          id: true,

          gestion: true,

          paralelo: true,

          semestre: true,

          estado: true,

          creadoEn: true,

          materia: {
            select: {
              nombre: true,

              codigo: true,
            },
          },

          docente: {
            select: {
              nombres: true,

              apellidoPaterno: true,

              apellidoMaterno: true,
            },
          },
        },
      }),

      this.prisma.usuario.findMany({
        take: 5,

        orderBy: {
          creadoEn: 'desc',
        },

        select: {
          id: true,

          nombres: true,

          apellidoPaterno: true,

          estaActivo: true,

          creadoEn: true,
        },
      }),

      this.prisma.materia.findMany({
        take: 5,

        orderBy: {
          creadoEn: 'desc',
        },

        select: {
          id: true,

          nombre: true,

          codigo: true,

          estado: true,

          creadoEn: true,
        },
      }),

      this.prisma.planificacionAcademica.findUnique({
        where: {
          gestion: gestionActual,
        },

        select: {
          id: true,

          estaActiva: true,

          hitos: {
            orderBy: {
              numero: 'asc',
            },

            select: {
              id: true,

              numero: true,

              codigo: true,

              nombre: true,

              fechaInicio: true,

              fechaFin: true,
            },
          },
        },
      }),
    ]);

    const resumenHitos = this.construirResumenHitos(
      gestionActual,
      planificacionActual,
    );

    const actividadReciente = [
      ...usuariosRecientes.map((usuario) => ({
        id: `usuario-${usuario.id}`,

        tipo: 'USUARIO' as const,

        titulo: 'Usuario registrado',

        descripcion: `${usuario.nombres} ${usuario.apellidoPaterno}`,

        fecha: usuario.creadoEn,

        estado: usuario.estaActivo ? 'ACTIVO' : 'INACTIVO',
      })),

      ...materiasRecientes.map((materia) => ({
        id: `materia-${materia.id}`,

        tipo: 'MATERIA' as const,

        titulo: 'Materia registrada',

        descripcion: `${materia.nombre} · ${materia.codigo}`,

        fecha: materia.creadoEn,

        estado: materia.estado,
      })),

      ...cursosRecientes.map((curso) => ({
        id: `curso-${curso.id}`,

        tipo: 'CURSO' as const,

        titulo: 'Curso registrado',

        descripcion: `${curso.materia.nombre} · ${curso.gestion} · Paralelo ${curso.paralelo}`,

        fecha: curso.creadoEn,

        estado: curso.estado,
      })),
    ]
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, 8);

    const alertas = this.crearAlertas(
      pendientesActivacion,
      usuariosDesactivados,
      materiasInactivas,
      cursosInactivos,
      cursosFinalizadosRecientes,
      resumenHitos,
    );

    return {
      gestionActual,

      actualizadoEn: ahora,

      usuarios: {
        total: totalUsuarios,

        estudiantes,

        docentes,

        administradores,

        activos: usuariosActivos,

        desactivados: usuariosDesactivados,

        cuentasActivadas,

        pendientesActivacion,
      },

      materias: {
        total: totalMaterias,

        activas: materiasActivas,

        inactivas: materiasInactivas,
      },

      cursos: {
        total: totalCursos,

        activos: cursosActivos,

        inactivos: cursosInactivos,

        finalizados: cursosFinalizados,
      },

      hitos: resumenHitos,

      cursosRecientes: cursosRecientes.map((curso) => ({
        id: curso.id,

        materia: curso.materia.nombre,

        codigo: curso.materia.codigo,

        gestion: curso.gestion,

        paralelo: curso.paralelo,

        semestre: curso.semestre,

        estado: curso.estado,

        docente: [
          curso.docente.nombres,
          curso.docente.apellidoPaterno,
          curso.docente.apellidoMaterno,
        ]
          .filter(Boolean)
          .join(' '),

        creadoEn: curso.creadoEn,
      })),

      actividadReciente,

      alertas,

      resumenAlertas: {
        total: alertas.length,

        altas: alertas.filter((alerta) => alerta.prioridad === 'ALTA').length,

        medias: alertas.filter((alerta) => alerta.prioridad === 'MEDIA').length,

        bajas: alertas.filter((alerta) => alerta.prioridad === 'BAJA').length,
      },
    };
  }
}
