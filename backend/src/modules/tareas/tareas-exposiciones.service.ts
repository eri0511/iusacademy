import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomInt } from 'crypto';

import {
  EstadoEntregaTarea,
  EstadoInscripcion,
  EstadoJornadaExposicion,
  EstadoPreguntaExposicion,
  EstadoTurnoExposicion,
  MetodoOrdenExposicion,
  Rol,
  TipoTarea,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { ActualizarDiapositivaExposicionDto } from './dto/actualizar-diapositiva-exposicion.dto';
import { ActualizarPreguntaExposicionDto } from './dto/actualizar-pregunta-exposicion.dto';
import { ConfigurarJornadaExposicionDto } from './dto/configurar-jornada-exposicion.dto';
import { CrearPreguntaExposicionDto } from './dto/crear-pregunta-exposicion.dto';
import { ReordenarTurnosExposicionDto } from './dto/reordenar-turnos-exposicion.dto';
import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

type EntregaParaOrden = {
  id: number;
  enviadaEn: Date | null;
  estudiante: {
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string | null;
  } | null;
  grupoCurso: { nombre: string } | null;
  equipoAfinidadTarea: { nombre: string } | null;
};

@Injectable()
export class TareasExposicionesService {
  constructor(private readonly prisma: PrismaService) {}

  private validarDocente(usuario: UsuarioAutenticado) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException('Solo el docente puede administrar la exposición');
    }
  }

  private validarEstudiante(usuario: UsuarioAutenticado) {
    if (usuario.rol !== Rol.ESTUDIANTE) {
      throw new ForbiddenException('Solo los estudiantes pueden realizar esta acción');
    }
  }

  private async obtenerTareaDocente(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
  ) {
    this.validarDocente(usuario);

    const tarea = await this.prisma.tareaCurso.findFirst({
      where: {
        id: tareaId,
        cursoId,
        estaActiva: true,
        curso: {
          docenteId: usuario.id,
        },
      },
      select: {
        id: true,
        cursoId: true,
        titulo: true,
        tipo: true,
        estado: true,
        estaCerrada: true,
        esCalificable: true,
      },
    });

    if (!tarea) {
      throw new NotFoundException('La tarea no existe o no pertenece al docente');
    }

    if (tarea.tipo !== TipoTarea.EXPOSICION) {
      throw new BadRequestException('Esta función solo está disponible para tareas de exposición');
    }

    return tarea;
  }

  private async validarEstudianteCurso(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
  ) {
    this.validarEstudiante(usuario);

    const inscripcion = await this.prisma.inscripcionCurso.findFirst({
      where: {
        cursoId,
        estudianteId: usuario.id,
        estado: EstadoInscripcion.ACTIVA,
      },
      select: { id: true },
    });

    if (!inscripcion) {
      throw new ForbiddenException('No estás inscrito de forma activa en este curso');
    }

    const tarea = await this.prisma.tareaCurso.findFirst({
      where: {
        id: tareaId,
        cursoId,
        estaActiva: true,
        tipo: TipoTarea.EXPOSICION,
      },
      select: { id: true, titulo: true },
    });

    if (!tarea) {
      throw new NotFoundException('La exposición no existe');
    }

    return tarea;
  }

  private nombreEntrega(entrega: EntregaParaOrden) {
    if (entrega.grupoCurso?.nombre) return entrega.grupoCurso.nombre;
    if (entrega.equipoAfinidadTarea?.nombre) return entrega.equipoAfinidadTarea.nombre;

    if (entrega.estudiante) {
      return [
        entrega.estudiante.apellidoPaterno,
        entrega.estudiante.apellidoMaterno,
        entrega.estudiante.nombres,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
    }

    return `Entrega ${entrega.id}`;
  }

  private mezclar<T>(items: T[]) {
    const copia = [...items];

    for (let i = copia.length - 1; i > 0; i -= 1) {
      const j = randomInt(i + 1);
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }

    return copia;
  }

  private ordenarEntregas(
    entregas: EntregaParaOrden[],
    metodo: MetodoOrdenExposicion,
    manual?: number[],
  ) {
    if (metodo === MetodoOrdenExposicion.ORDEN_ENTREGA) {
      return [...entregas].sort((a, b) => {
        const fa = a.enviadaEn?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const fb = b.enviadaEn?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return fa - fb || a.id - b.id;
      });
    }

    if (metodo === MetodoOrdenExposicion.ALFABETICO) {
      return [...entregas].sort((a, b) =>
        this.nombreEntrega(a).localeCompare(this.nombreEntrega(b), 'es', {
          sensitivity: 'base',
        }),
      );
    }

    if (metodo === MetodoOrdenExposicion.ALEATORIO) {
      return this.mezclar(entregas);
    }

    const ids = manual ?? [];
    const disponibles = new Set(entregas.map((entrega) => entrega.id));

    if (
      ids.length !== entregas.length ||
      ids.some((id) => !disponibles.has(id))
    ) {
      throw new BadRequestException(
        'El orden manual debe incluir exactamente una vez todas las entregas válidas',
      );
    }

    const porId = new Map(entregas.map((entrega) => [entrega.id, entrega]));
    return ids.map((id) => porId.get(id)!);
  }

  private calcularCronometro(turno: {
    estado: EstadoTurnoExposicion;
    iniciadoEn: Date | null;
    pausadoEn: Date | null;
    finalizadoEn: Date | null;
    segundosPausaAcumulados: number;
    segundosUtilizados: number;
    jornada: { duracionSegundos: number };
  }) {
    const ahora = new Date();
    let usados = turno.segundosUtilizados;

    if (turno.iniciadoEn && !turno.finalizadoEn) {
      const referencia = turno.pausadoEn ?? ahora;
      usados = Math.max(
        0,
        Math.floor((referencia.getTime() - turno.iniciadoEn.getTime()) / 1000) -
          turno.segundosPausaAcumulados,
      );
    }

    const restantes = Math.max(0, turno.jornada.duracionSegundos - usados);
    const extra = Math.max(0, usados - turno.jornada.duracionSegundos);

    return {
      ahoraServidor: ahora.toISOString(),
      segundosAsignados: turno.jornada.duracionSegundos,
      segundosUtilizados: usados,
      segundosRestantes: restantes,
      tiempoExtraSegundos: extra,
      enPausa: turno.estado === EstadoTurnoExposicion.PAUSADO,
      tiempoCumplido: usados >= turno.jornada.duracionSegundos,
    };
  }

  async configurarJornada(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    datos: ConfigurarJornadaExposicionDto,
  ) {
    const tarea = await this.obtenerTareaDocente(usuario, cursoId, tareaId);

    if (!tarea.estaCerrada) {
      throw new BadRequestException(
        'Debes cerrar las entregas antes de organizar la jornada de exposiciones',
      );
    }

    if (datos.avisoSegundos !== undefined && datos.avisoSegundos >= datos.duracionSegundos) {
      throw new BadRequestException('El aviso previo debe ser menor al tiempo total de exposición');
    }

    const activa = await this.prisma.jornadaExposicion.findFirst({
      where: {
        tareaId,
        estado: {
          in: [
            EstadoJornadaExposicion.CONFIGURANDO,
            EstadoJornadaExposicion.LISTA,
            EstadoJornadaExposicion.EN_CURSO,
            EstadoJornadaExposicion.PAUSADA,
          ],
        },
      },
      select: { id: true, estado: true },
    });

    if (activa) {
      throw new BadRequestException(
        'Ya existe una jornada activa para esta tarea. Finalízala o cancélala antes de generar otra',
      );
    }

    const entregas = await this.prisma.entregaTarea.findMany({
      where: {
        tareaId,
        estaActiva: true,
        estado: {
          in: [EstadoEntregaTarea.ENTREGADA, EstadoEntregaTarea.TARDIA],
        },
      },
      select: {
        id: true,
        enviadaEn: true,
        estudiante: {
          select: {
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
          },
        },
        grupoCurso: { select: { nombre: true } },
        equipoAfinidadTarea: { select: { nombre: true } },
      },
    });

    if (entregas.length === 0) {
      throw new BadRequestException('No existen entregas válidas para organizar la exposición');
    }

    const ordenadas = this.ordenarEntregas(
      entregas,
      datos.metodoOrden,
      datos.ordenManualEntregaIds,
    );

    const jornada = await this.prisma.$transaction(async (tx) => {
      const creada = await tx.jornadaExposicion.create({
        data: {
          tareaId,
          creadorId: usuario.id,
          metodoOrden: datos.metodoOrden,
          estado: EstadoJornadaExposicion.LISTA,
          duracionSegundos: datos.duracionSegundos,
          avisoSegundos: datos.avisoSegundos ?? 120,
          permitirTiempoExtra: datos.permitirTiempoExtra ?? true,
          mostrarSiguiente: datos.mostrarSiguiente ?? true,
          generadaEn: new Date(),
        },
      });

      await tx.turnoExposicion.createMany({
        data: ordenadas.map((entrega, indice) => ({
          jornadaId: creada.id,
          entregaId: entrega.id,
          orden: indice + 1,
          estado:
            indice === 0
              ? EstadoTurnoExposicion.EN_ESPERA
              : EstadoTurnoExposicion.PENDIENTE,
        })),
      });

      return creada;
    });

    return this.obtenerSalaDocente(usuario, cursoId, tareaId, jornada.id);
  }

  async reordenar(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    jornadaId: number,
    datos: ReordenarTurnosExposicionDto,
  ) {
    await this.obtenerTareaDocente(usuario, cursoId, tareaId);

    const jornada = await this.prisma.jornadaExposicion.findFirst({
      where: { id: jornadaId, tareaId },
      include: { turnos: { orderBy: { orden: 'asc' } } },
    });

    if (!jornada) throw new NotFoundException('La jornada no existe');
    if (jornada.estado !== EstadoJornadaExposicion.LISTA) {
      throw new BadRequestException('El orden solo puede modificarse antes de iniciar la jornada');
    }

    const actuales = new Set(jornada.turnos.map((turno) => turno.entregaId));
    if (
      datos.entregaIds.length !== jornada.turnos.length ||
      datos.entregaIds.some((id) => !actuales.has(id))
    ) {
      throw new BadRequestException('Debes incluir todos los turnos exactamente una vez');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const turno of jornada.turnos) {
        await tx.turnoExposicion.update({
          where: { id: turno.id },
          data: { orden: turno.orden + 10000 },
        });
      }

      for (let i = 0; i < datos.entregaIds.length; i += 1) {
        const turno = jornada.turnos.find(
          (item) => item.entregaId === datos.entregaIds[i],
        )!;
        await tx.turnoExposicion.update({
          where: { id: turno.id },
          data: {
            orden: i + 1,
            estado:
              i === 0
                ? EstadoTurnoExposicion.EN_ESPERA
                : EstadoTurnoExposicion.PENDIENTE,
          },
        });
      }

      await tx.jornadaExposicion.update({
        where: { id: jornadaId },
        data: { metodoOrden: MetodoOrdenExposicion.MANUAL },
      });
    });

    return this.obtenerSalaDocente(usuario, cursoId, tareaId, jornadaId);
  }

  async iniciarJornada(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    jornadaId: number,
  ) {
    await this.obtenerTareaDocente(usuario, cursoId, tareaId);

    const jornada = await this.prisma.jornadaExposicion.findFirst({
      where: { id: jornadaId, tareaId },
      select: { id: true, estado: true },
    });

    if (!jornada) throw new NotFoundException('La jornada no existe');
    if (jornada.estado !== EstadoJornadaExposicion.LISTA) {
      throw new BadRequestException('La jornada no está lista para iniciar');
    }

    await this.prisma.jornadaExposicion.update({
      where: { id: jornadaId },
      data: { estado: EstadoJornadaExposicion.EN_CURSO, iniciadaEn: new Date() },
    });

    return this.obtenerSalaDocente(usuario, cursoId, tareaId, jornadaId);
  }

  async iniciarTurno(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    jornadaId: number,
    turnoId: number,
  ) {
    await this.obtenerTareaDocente(usuario, cursoId, tareaId);

    const jornada = await this.prisma.jornadaExposicion.findFirst({
      where: { id: jornadaId, tareaId },
      include: { turnos: true },
    });

    if (!jornada) throw new NotFoundException('La jornada no existe');
    if (jornada.estado !== EstadoJornadaExposicion.EN_CURSO) {
      throw new BadRequestException('La jornada debe estar en curso');
    }

    if (
      jornada.turnos.some(
        (turno) =>
          turno.id !== turnoId &&
          (
            turno.estado === EstadoTurnoExposicion.EN_CURSO ||
            turno.estado === EstadoTurnoExposicion.PAUSADO
          ),
      )
    ) {
      throw new BadRequestException('Ya existe una exposición activa');
    }

    const turno = jornada.turnos.find((item) => item.id === turnoId);
    if (!turno) throw new NotFoundException('El turno no pertenece a la jornada');
    if (
      turno.estado !== EstadoTurnoExposicion.PENDIENTE &&
      turno.estado !== EstadoTurnoExposicion.EN_ESPERA
    ) {
      throw new BadRequestException('Este turno ya fue iniciado o finalizado');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.turnoExposicion.update({
        where: { id: turnoId },
        data: {
          estado: EstadoTurnoExposicion.EN_CURSO,
          iniciadoEn: new Date(),
          pausadoEn: null,
          reanudadoEn: null,
          finalizadoEn: null,
          segundosPausaAcumulados: 0,
          segundosUtilizados: 0,
        },
      });

      const siguiente = jornada.turnos
        .filter((item) => item.orden > turno.orden)
        .sort((a, b) => a.orden - b.orden)[0];

      if (siguiente && siguiente.estado === EstadoTurnoExposicion.PENDIENTE) {
        await tx.turnoExposicion.update({
          where: { id: siguiente.id },
          data: { estado: EstadoTurnoExposicion.EN_ESPERA },
        });
      }
    });

    return this.obtenerSalaDocente(usuario, cursoId, tareaId, jornadaId);
  }

  async pausarTurno(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    jornadaId: number,
    turnoId: number,
  ) {
    await this.obtenerTareaDocente(usuario, cursoId, tareaId);

    const turno = await this.prisma.turnoExposicion.findFirst({
      where: { id: turnoId, jornadaId, jornada: { tareaId } },
    });

    if (!turno) throw new NotFoundException('El turno no existe');
    if (turno.estado !== EstadoTurnoExposicion.EN_CURSO) {
      throw new BadRequestException('Solo puede pausarse un turno en curso');
    }

    const ahora = new Date();
    await this.prisma.$transaction([
      this.prisma.turnoExposicion.update({
        where: { id: turnoId },
        data: { estado: EstadoTurnoExposicion.PAUSADO, pausadoEn: ahora },
      }),
      this.prisma.jornadaExposicion.update({
        where: { id: jornadaId },
        data: { estado: EstadoJornadaExposicion.PAUSADA },
      }),
    ]);

    return this.obtenerSalaDocente(usuario, cursoId, tareaId, jornadaId);
  }

  async reanudarTurno(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    jornadaId: number,
    turnoId: number,
  ) {
    await this.obtenerTareaDocente(usuario, cursoId, tareaId);

    const turno = await this.prisma.turnoExposicion.findFirst({
      where: { id: turnoId, jornadaId, jornada: { tareaId } },
    });

    if (!turno) throw new NotFoundException('El turno no existe');
    if (turno.estado !== EstadoTurnoExposicion.PAUSADO || !turno.pausadoEn) {
      throw new BadRequestException('El turno no está pausado');
    }

    const ahora = new Date();
    const pausa = Math.max(
      0,
      Math.floor((ahora.getTime() - turno.pausadoEn.getTime()) / 1000),
    );

    await this.prisma.$transaction([
      this.prisma.turnoExposicion.update({
        where: { id: turnoId },
        data: {
          estado: EstadoTurnoExposicion.EN_CURSO,
          pausadoEn: null,
          reanudadoEn: ahora,
          segundosPausaAcumulados: { increment: pausa },
        },
      }),
      this.prisma.jornadaExposicion.update({
        where: { id: jornadaId },
        data: { estado: EstadoJornadaExposicion.EN_CURSO },
      }),
    ]);

    return this.obtenerSalaDocente(usuario, cursoId, tareaId, jornadaId);
  }

  async finalizarTurno(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    jornadaId: number,
    turnoId: number,
  ) {
    const tarea = await this.obtenerTareaDocente(
      usuario,
      cursoId,
      tareaId,
    );

    const turno = await this.prisma.turnoExposicion.findFirst({
      where: {
        id: turnoId,
        jornadaId,
        jornada: {
          tareaId,
        },
      },
      include: {
        jornada: {
          select: {
            duracionSegundos: true,
          },
        },
        entrega: {
          select: {
            id: true,
            calificacionRubrica: {
              select: {
                completada: true,
              },
            },
          },
        },
      },
    });

    if (!turno) {
      throw new NotFoundException('El turno no existe');
    }

    if (tarea.esCalificable) {
      const rubrica = await this.prisma.rubricaTarea.findUnique({
        where: {
          tareaId,
        },
        select: {
          id: true,
        },
      });

      if (!rubrica) {
        throw new BadRequestException(
          'La exposición es calificable y debe tener una rúbrica configurada antes de finalizar el turno',
        );
      }

      if (!turno.entrega.calificacionRubrica?.completada) {
        throw new BadRequestException(
          'Completa y guarda la rúbrica de evaluación antes de finalizar la exposición',
        );
      }
    }
    if (
      (
        turno.estado !== EstadoTurnoExposicion.EN_CURSO &&
        turno.estado !== EstadoTurnoExposicion.PAUSADO
      ) ||
      !turno.iniciadoEn
    ) {
      throw new BadRequestException('El turno no está activo');
    }

    const ahora = new Date();
    let pausaAcumulada = turno.segundosPausaAcumulados;
    if (turno.pausadoEn) {
      pausaAcumulada += Math.max(
        0,
        Math.floor((ahora.getTime() - turno.pausadoEn.getTime()) / 1000),
      );
    }

    const utilizados = Math.max(
      0,
      Math.floor((ahora.getTime() - turno.iniciadoEn.getTime()) / 1000) -
        pausaAcumulada,
    );

    await this.prisma.$transaction(async (tx) => {
      const actual = await tx.turnoExposicion.update({
        where: { id: turnoId },
        data: {
          estado: EstadoTurnoExposicion.FINALIZADO,
          finalizadoEn: ahora,
          pausadoEn: null,
          segundosPausaAcumulados: pausaAcumulada,
          segundosUtilizados: utilizados,
        },
      });

      const siguiente = await tx.turnoExposicion.findFirst({
        where: {
          jornadaId,
          orden: { gt: actual.orden },
          estado: {
            in: [EstadoTurnoExposicion.PENDIENTE, EstadoTurnoExposicion.EN_ESPERA],
          },
        },
        orderBy: { orden: 'asc' },
      });

      if (siguiente) {
        await tx.turnoExposicion.update({
          where: { id: siguiente.id },
          data: { estado: EstadoTurnoExposicion.EN_ESPERA },
        });
      }
    });

    return this.obtenerSalaDocente(usuario, cursoId, tareaId, jornadaId);
  }

  async finalizarJornada(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    jornadaId: number,
  ) {
    await this.obtenerTareaDocente(usuario, cursoId, tareaId);

    const jornada = await this.prisma.jornadaExposicion.findFirst({
      where: { id: jornadaId, tareaId },
      include: { turnos: true },
    });

    if (!jornada) throw new NotFoundException('La jornada no existe');
    if (
      jornada.turnos.some(
        (turno) =>
          turno.estado === EstadoTurnoExposicion.EN_CURSO ||
          turno.estado === EstadoTurnoExposicion.PAUSADO,
      )
    ) {
      throw new BadRequestException('Finaliza primero la exposición que está activa');
    }

    const pendientes = jornada.turnos.filter(
      (turno) =>
        turno.estado !== EstadoTurnoExposicion.FINALIZADO &&
        turno.estado !== EstadoTurnoExposicion.AUSENTE,
    );

    if (pendientes.length > 0) {
      throw new BadRequestException(
        'Todavía existen exposiciones pendientes. Finaliza todos los turnos antes de cerrar la jornada',
      );
    }

    await this.prisma.jornadaExposicion.update({
      where: {
        id: jornadaId,
      },
      data: {
        estado: EstadoJornadaExposicion.FINALIZADA,
        finalizadaEn: new Date(),
      },
    });

    return this.obtenerSalaDocente(usuario, cursoId, tareaId, jornadaId);
  }

  private async obtenerTurnoExpositorEstudiante(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    jornadaId: number,
    turnoId: number,
  ) {
    await this.validarEstudianteCurso(usuario, cursoId, tareaId);

    const turno = await this.prisma.turnoExposicion.findFirst({
      where: {
        id: turnoId,
        jornadaId,
        jornada: {
          tareaId,
          estado: {
            in: [
              EstadoJornadaExposicion.EN_CURSO,
              EstadoJornadaExposicion.PAUSADA,
            ],
          },
        },
        estado: {
          in: [
            EstadoTurnoExposicion.EN_CURSO,
            EstadoTurnoExposicion.PAUSADO,
          ],
        },
        entrega: {
          OR: [
            { estudianteId: usuario.id },
            {
              grupoCurso: {
                integrantes: {
                  some: {
                    estudianteId: usuario.id,
                    estaActivo: true,
                  },
                },
              },
            },
            {
              equipoAfinidadTarea: {
                integrantes: {
                  some: {
                    estudianteId: usuario.id,
                    estaActivo: true,
                  },
                },
              },
            },
          ],
        },
      },
      select: {
        id: true,
        estado: true,
        presentadorId: true,
        diapositivaActual: true,
      },
    });

    if (!turno) {
      throw new BadRequestException(
        'Solo los integrantes del turno activo pueden controlar la presentación',
      );
    }

    return turno;
  }

  async tomarControlPresentacionEstudiante(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    jornadaId: number,
    turnoId: number,
  ) {
    await this.obtenerTurnoExpositorEstudiante(
      usuario,
      cursoId,
      tareaId,
      jornadaId,
      turnoId,
    );

    return this.prisma.turnoExposicion.update({
      where: { id: turnoId },
      data: { presentadorId: usuario.id },
      select: {
        id: true,
        presentadorId: true,
        diapositivaActual: true,
        actualizadoEn: true,
      },
    });
  }

  async actualizarDiapositivaEstudiante(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    jornadaId: number,
    turnoId: number,
    datos: ActualizarDiapositivaExposicionDto,
  ) {
    const turno = await this.obtenerTurnoExpositorEstudiante(
      usuario,
      cursoId,
      tareaId,
      jornadaId,
      turnoId,
    );

    if (turno.presentadorId !== usuario.id) {
      throw new BadRequestException(
        'Pulsa Presentar para tomar el control de las diapositivas',
      );
    }

    return this.prisma.turnoExposicion.update({
      where: { id: turnoId },
      data: { diapositivaActual: datos.diapositiva },
      select: {
        id: true,
        presentadorId: true,
        diapositivaActual: true,
        actualizadoEn: true,
      },
    });
  }

  async actualizarDiapositiva(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    jornadaId: number,
    turnoId: number,
    datos: ActualizarDiapositivaExposicionDto,
  ) {
    await this.obtenerTareaDocente(usuario, cursoId, tareaId);

    const turno = await this.prisma.turnoExposicion.findFirst({
      where: { id: turnoId, jornadaId, jornada: { tareaId } },
      select: { id: true, estado: true },
    });

    if (!turno) throw new NotFoundException('El turno no existe');
    if (
      turno.estado !== EstadoTurnoExposicion.EN_CURSO &&
      turno.estado !== EstadoTurnoExposicion.PAUSADO
    ) {
      throw new BadRequestException('Solo puede sincronizarse la presentación del turno activo');
    }

    return this.prisma.turnoExposicion.update({
      where: { id: turnoId },
      data: { diapositivaActual: datos.diapositiva },
      select: { id: true, diapositivaActual: true, actualizadoEn: true },
    });
  }

  private includeSala() {
    return {
      tarea: {
        select: {
          id: true,
          titulo: true,
          cursoId: true,
          esCalificable: true,
        },
      },
      turnos: {
        orderBy: { orden: 'asc' as const },
        include: {
          presentador: {
            select: {
              id: true,
              nombres: true,
              apellidoPaterno: true,
              apellidoMaterno: true,
            },
          },
          entrega: {
            select: {
              id: true,
              enviadaEn: true,
              esGrupal: true,
              estudiante: {
                select: {
                  id: true,
                  nombres: true,
                  apellidoPaterno: true,
                  apellidoMaterno: true,
                  fotoPerfilUrl: true,
                },
              },
              grupoCurso: { select: { id: true, nombre: true } },
              equipoAfinidadTarea: { select: { id: true, nombre: true } },
              archivos: {
                where: { estaActivo: true },
                select: {
                  id: true,
                  nombreOriginal: true,
                  mimeType: true,
                  extension: true,
                  urlPublica: true,
                  miniaturaUrl: true,
                },
              },
            },
          },
          analisis: {
            select: {
              id: true,
              estado: true,
              version: true,
              puntuacionEstructura: true,
              puntuacionContenidoJuridico: true,
              puntuacionPresentacion: true,
              puntuacionGlobal: true,
              resumen: true,
              fortalezas: true,
              advertencias: true,
              omisiones: true,
              retroalimentacionSugerida: true,
              evidencias: true,
              hashEntrada: true,
              error: true,
              iniciadoEn: true,
              finalizadoEn: true,
              actualizadoEn: true,
            },
          },
          preguntas: {
            orderBy: [{ destacada: 'desc' as const }, { creadoEn: 'asc' as const }],
            include: {
              autor: {
                select: {
                  id: true,
                  nombres: true,
                  apellidoPaterno: true,
                  apellidoMaterno: true,
                },
              },
              votos: { select: { usuarioId: true } },
            },
          },
        },
      },
    };
  }

  async obtenerSalaDocente(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    jornadaId?: number,
  ) {
    await this.obtenerTareaDocente(usuario, cursoId, tareaId);

    const jornada = await this.prisma.jornadaExposicion.findFirst({
      where: {
        tareaId,
        ...(jornadaId ? { id: jornadaId } : {}),
      },
      orderBy: { creadoEn: 'desc' },
      include: this.includeSala(),
    });

    if (!jornada) return null;

    const turnoActivo = jornada.turnos.find(
      (turno) =>
        turno.estado === EstadoTurnoExposicion.EN_CURSO ||
        turno.estado === EstadoTurnoExposicion.PAUSADO,
    );

    return {
      ...jornada,
      turnoActivoId: turnoActivo?.id ?? null,
      cronometro: turnoActivo
        ? this.calcularCronometro({
            ...turnoActivo,
            jornada: { duracionSegundos: jornada.duracionSegundos },
          })
        : null,
    };
  }

  async obtenerSalaEstudiante(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
  ) {
    await this.validarEstudianteCurso(usuario, cursoId, tareaId);

    const jornada = await this.prisma.jornadaExposicion.findFirst({
      where: {
        tareaId,
        estado: {
          in: [
            EstadoJornadaExposicion.LISTA,
            EstadoJornadaExposicion.EN_CURSO,
            EstadoJornadaExposicion.PAUSADA,
            EstadoJornadaExposicion.FINALIZADA,
          ],
        },
      },
      orderBy: { creadoEn: 'desc' },
      include: this.includeSala(),
    });

    if (!jornada) return null;

    const turnoActivo = jornada.turnos.find(
      (turno) =>
        turno.estado === EstadoTurnoExposicion.EN_CURSO ||
        turno.estado === EstadoTurnoExposicion.PAUSADO,
    );

    const miTurno = await this.prisma.turnoExposicion.findFirst({
      where: {
        jornadaId: jornada.id,
        entrega: {
          OR: [
            { estudianteId: usuario.id },
            {
              grupoCurso: {
                integrantes: {
                  some: { estudianteId: usuario.id, estaActivo: true },
                },
              },
            },
            {
              equipoAfinidadTarea: {
                integrantes: {
                  some: { estudianteId: usuario.id, estaActivo: true },
                },
              },
            },
          ],
        },
      },
      select: { id: true, orden: true, estado: true, presentadorId: true },
    });

    return {
      ...jornada,
      turnoActivoId: turnoActivo?.id ?? null,
      miTurno,
      cronometro: turnoActivo
        ? this.calcularCronometro({
            ...turnoActivo,
            jornada: { duracionSegundos: jornada.duracionSegundos },
          })
        : null,
    };
  }

  async crearPregunta(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    turnoId: number,
    datos: CrearPreguntaExposicionDto,
  ) {
    await this.validarEstudianteCurso(usuario, cursoId, tareaId);

    const turno = await this.prisma.turnoExposicion.findFirst({
      where: {
        id: turnoId,
        jornada: {
          tareaId,
          estado: {
            in: [EstadoJornadaExposicion.EN_CURSO, EstadoJornadaExposicion.PAUSADA],
          },
        },
        estado: {
          in: [EstadoTurnoExposicion.EN_CURSO, EstadoTurnoExposicion.PAUSADO],
        },
      },
      select: {
        id: true,
        diapositivaActual: true,
        iniciadoEn: true,
        pausadoEn: true,
        segundosPausaAcumulados: true,
      },
    });

    if (!turno) {
      throw new BadRequestException('Solo puedes preguntar durante la exposición activa');
    }

    const ahora = new Date();
    const referenciaTiempo = turno.pausadoEn ?? ahora;
    const segundosExposicion = turno.iniciadoEn
      ? Math.max(
          0,
          Math.floor(
            (referenciaTiempo.getTime() - turno.iniciadoEn.getTime()) / 1000,
          ) - turno.segundosPausaAcumulados,
        )
      : 0;

    return this.prisma.preguntaExposicion.create({
      data: {
        turnoId,
        autorId: usuario.id,
        contenido: datos.contenido.trim(),
        diapositiva: turno.diapositivaActual,
        segundosExposicion,
      },
      include: {
        autor: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
          },
        },
        votos: true,
      },
    });
  }

  async votarPregunta(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    preguntaId: number,
  ) {
    await this.validarEstudianteCurso(usuario, cursoId, tareaId);

    const pregunta = await this.prisma.preguntaExposicion.findFirst({
      where: { id: preguntaId, turno: { jornada: { tareaId } } },
      select: { id: true },
    });

    if (!pregunta) throw new NotFoundException('La pregunta no existe');

    await this.prisma.votoPreguntaExposicion.upsert({
      where: {
        preguntaId_usuarioId: { preguntaId, usuarioId: usuario.id },
      },
      create: { preguntaId, usuarioId: usuario.id },
      update: {},
    });

    return { votada: true };
  }

  async quitarVotoPregunta(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    preguntaId: number,
  ) {
    await this.validarEstudianteCurso(usuario, cursoId, tareaId);

    await this.prisma.votoPreguntaExposicion.deleteMany({
      where: { preguntaId, usuarioId: usuario.id },
    });

    return { votada: false };
  }

  async actualizarPregunta(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    preguntaId: number,
    datos: ActualizarPreguntaExposicionDto,
  ) {
    await this.obtenerTareaDocente(usuario, cursoId, tareaId);

    const pregunta = await this.prisma.preguntaExposicion.findFirst({
      where: { id: preguntaId, turno: { jornada: { tareaId } } },
      select: { id: true },
    });

    if (!pregunta) throw new NotFoundException('La pregunta no existe');

    const ahora = new Date();
    return this.prisma.preguntaExposicion.update({
      where: { id: preguntaId },
      data: {
        ...(datos.estado ? { estado: datos.estado } : {}),
        ...(datos.destacada !== undefined ? { destacada: datos.destacada } : {}),
        ...(datos.estado === EstadoPreguntaExposicion.RESPONDIDA
          ? { respondidaEn: ahora, descartadaEn: null }
          : {}),
        ...(datos.estado === EstadoPreguntaExposicion.DESCARTADA
          ? { descartadaEn: ahora, respondidaEn: null }
          : {}),
      },
    });
  }
}
