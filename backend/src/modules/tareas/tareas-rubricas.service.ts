import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import ExcelJS from 'exceljs';

import { Prisma, Rol } from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { CalificarRutricaDto } from './dto/calificar-rubrica.dto';

import {
  CrearRubricaDto,
  RubricaCriterioDto,
  RubricaNivelDto,
} from './dto/crear-rubrica.dto';

import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

@Injectable()
export class TareasRubricasService {
  constructor(private readonly prisma: PrismaService) {}

  private async obtenerTareaAutorizada(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
  ) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException(
        'Solo el docente puede administrar rǭbricas',
      );
    }

    const tarea = await this.prisma.tareaCurso.findFirst({
      where: {
        id: tareaId,
        cursoId,
        estaActiva: true,
      },
      select: {
        id: true,
        autorId: true,
      },
    });

    if (!tarea) {
      throw new NotFoundException('La tarea no existe');
    }

    if (tarea.autorId !== usuario.id) {
      throw new ForbiddenException(
        'No puedes modificar una tarea que no te pertenece',
      );
    }

    return tarea;
  }

  obtenerRubrica(tareaId: number) {
    return this.prisma.rubricaTarea.findUnique({
      where: {
        tareaId,
      },
      include: {
        criterios: {
          include: {
            niveles: {
              orderBy: {
                orden: 'asc',
              },
            },
          },
          orderBy: {
            orden: 'asc',
          },
        },
      },
    });
  }

  async crearRubrica(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    datos: CrearRubricaDto,
  ) {
    await this.obtenerTareaAutorizada(usuario, cursoId, tareaId);

    if (datos.criterios.some((criterio) => !criterio.niveles?.length)) {
      throw new BadRequestException(
        'Cada criterio debe tener al menos un nivel',
      );
    }

    const sumaPesos = datos.criterios.reduce(
      (total, criterio) => total + Number(criterio.peso ?? 0),
      0,
    );

    const ponderacionMax = Number(datos.ponderacionMax ?? 100);

    if (Math.abs(sumaPesos - ponderacionMax) > 0.5) {
      throw new BadRequestException(
        `La suma de los pesos (${sumaPesos}) debe coincidir con la ponderaci��n m��xima (${ponderacionMax})`,
      );
    }

    await this.prisma.rubricaTarea.deleteMany({
      where: {
        tareaId,
      },
    });

    return this.prisma.rubricaTarea.create({
      data: {
        tareaId,
        nombre: datos.nombre,
        origen: datos.origen ?? 'MANUAL',
        ponderacionMax: new Prisma.Decimal(ponderacionMax),
        criterios: {
          create: datos.criterios.map((criterio) => ({
            orden: criterio.orden,
            nombre: criterio.nombre,
            descripcion: criterio.descripcion ?? null,
            peso: new Prisma.Decimal(Number(criterio.peso ?? 0)),
            niveles: {
              create: criterio.niveles.map((nivel) => ({
                orden: nivel.orden,
                etiqueta: nivel.etiqueta,
                descripcion: nivel.descripcion ?? null,
                puntos: new Prisma.Decimal(Number(nivel.puntos ?? 0)),
              })),
            },
          })),
        },
      },
      include: {
        criterios: {
          include: {
            niveles: true,
          },
        },
      },
    });
  }

  async eliminarRubrica(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
  ) {
    await this.obtenerTareaAutorizada(usuario, cursoId, tareaId);

    const resultado = await this.prisma.rubricaTarea.deleteMany({
      where: {
        tareaId,
      },
    });

    if (resultado.count === 0) {
      throw new NotFoundException('La tarea no tiene rǭbrica');
    }

    return {
      eliminada: true,
    };
  }

  /**
   * Formato esperado de la hoja de Excel (primera hoja):
   *
   *   A          | B        | C            | D       | E
   *   Criterio   | Peso     | Insuficiente | Logrado | Excelente
   *   Redacci��n | 40       | Incongruente | Adecuada | Impecable
   *   ...
   *
   * La columna A debe encabezar "criterio"/"aspecto"/"indicador";
   * la columna de peso es opcional (encabeza "peso"/"%"). El resto de
   * columnas con encabezado son niveles. Si no hay columna de peso,
   * cada criterio se reparte por igual.
   */
  async importarRubricaDesdeExcel(
    archivo: Express.Multer.File,
  ): Promise<CrearRubricaDto> {
    if (!archivo) {
      throw new BadRequestException('Sube el archivo Excel de la rǭbrica');
    }

    const workbook = new ExcelJS.Workbook();

    try {
      await workbook.xlsx.load(archivo.buffer);
    } catch {
      throw new BadRequestException('El archivo no es un Excel v��lido');
    }

    const hoja = workbook.worksheets[0];

    if (!hoja) {
      throw new BadRequestException('El archivo Excel est�� vac��o');
    }

    let filaEncabezado = 1;

    while (filaEncabezado <= hoja.actualRowCount) {
      const fila = hoja.getRow(filaEncabezado);

      const tieneDatos = fila.actualCellCount > 0 && fila.cellCount > 0;

      if (tieneDatos) {
        break;
      }

      filaEncabezado += 1;
    }

    const encabezado = hoja.getRow(filaEncabezado);

    const celdas = encabezado.cellCount;

    if (celdas === 0) {
      throw new BadRequestException('La hoja no tiene encabezados');
    }

    const etiquetas: string[] = [];

    for (let col = 1; col <= celdas; col += 1) {
      etiquetas.push(encabezado.getCell(col).text?.trim() ?? '');
    }

    const indiceCriterio = etiquetas.findIndex((etiqueta) =>
      /criterio|aspecto|indicador|rubrica/i.test(etiqueta),
    );

    const indicePeso = etiquetas.findIndex(
      (etiqueta) =>
        /peso|porcentaje|%/i.test(etiqueta) &&
        indiceCriterio !== etiquetas.indexOf(etiqueta),
    );

    const indiceDescripcion = etiquetas.findIndex((etiqueta) =>
      /descripcion|detalle/i.test(etiqueta),
    );

    const indiceNiveles: number[] = [];

    etiquetas.forEach((etiqueta, indice) => {
      if (
        indice === indiceCriterio ||
        indice === indicePeso ||
        indice === indiceDescripcion ||
        !etiqueta
      ) {
        return;
      }

      indiceNiveles.push(indice);
    });

    if (indiceCriterio === -1 || indiceNiveles.length === 0) {
      throw new BadRequestException(
        'Formato no reconocido. Asegǭrate de que la primera fila tenga una columna "Criterio" y al menos una columna de niveles',
      );
    }

    const criterios: RubricaCriterioDto[] = [];

    const filaInicio = filaEncabezado + 1;

    for (let fila = filaInicio; fila <= hoja.actualRowCount; fila += 1) {
      const filaExcel = hoja.getRow(fila);

      const nombre = filaExcel.getCell(indiceCriterio + 1).text?.trim() ?? '';

      if (!nombre) {
        continue;
      }

      const peso =
        indicePeso === -1
          ? 0
          : (this.extraerNumero(filaExcel.getCell(indicePeso + 1)) ?? 0);

      const descripcion =
        indiceDescripcion === -1
          ? undefined
          : (filaExcel.getCell(indiceDescripcion + 1).text?.trim() ??
            undefined);

      const niveles: RubricaNivelDto[] = indiceNiveles.map(
        (indiceNivel, posicion) => ({
          orden: posicion,
          etiqueta: etiquetas[indiceNivel],
          descripcion: filaExcel.getCell(indiceNivel + 1).text?.trim() ?? null,
        }),
      );

      criterios.push({
        orden: criterios.length,
        nombre,
        descripcion,
        peso,
        niveles,
      });
    }

    if (criterios.length === 0) {
      throw new BadRequestException(
        'No se encontraron criterios en el archivo',
      );
    }

    const nCriterios = criterios.length;

    criterios.forEach((criterio) => {
      if (!criterio.peso) {
        criterio.peso = Math.round((100 / nCriterios) * 100) / 100;
      }

      const nNiveles = criterio.niveles.length;

      criterio.niveles.forEach((nivel, posicion) => {
        nivel.puntos =
          Math.round(
            ((Number(criterio.peso) * (posicion + 1)) / nNiveles) * 100,
          ) / 100;
      });
    });

    const ponderacionMax =
      Math.round(
        criterios.reduce(
          (total, criterio) => total + Number(criterio.peso),
          0,
        ) * 100,
      ) / 100;

    return {
      nombre: hoja.name || 'Rǭbrica importada',
      origen: 'EXCEL',
      ponderacionMax,
      criterios,
    };
  }

  private extraerNumero(celda: ExcelJS.Cell): number | undefined {
    if (typeof celda.value === 'number') {
      return celda.value;
    }

    const texto = celda.text?.trim() ?? '';

    const coincidencia = texto.match(/(\d+(?:[.,]\d+)?)/);

    if (!coincidencia) {
      return undefined;
    }

    return Number(coincidencia[1].replace(',', '.'));
  }

  obtenerEvaluacionEntrega(entregaId: number) {
    return this.prisma.calificacionRubrica.findUnique({
      where: {
        entregaId,
      },
      include: {
        items: {
          include: {
            criterio: true,
            nivel: true,
          },
        },
      },
    });
  }

  /**
   * Persiste la evaluaci��n por r��brica y devuelve la nota base sobre
   * escala de 100. La nota resultante (total / ponderacionMax * 100) se
   * propaga luego por la l��gica de calificaci��n existente.
   */
  async calificarEntregaConRubrica(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    entregaId: number,
    datos: CalificarRutricaDto,
  ): Promise<number> {
    await this.obtenerTareaAutorizada(usuario, cursoId, tareaId);

    const rubrica = await this.prisma.rubricaTarea.findUnique({
      where: {
        tareaId,
      },
      include: {
        criterios: {
          include: {
            niveles: true,
          },
        },
      },
    });

    if (!rubrica) {
      throw new NotFoundException('La tarea no tiene rǭbrica');
    }

    const entrega = await this.prisma.entregaTarea.findFirst({
      where: {
        id: entregaId,
        tareaId,
        estaActiva: true,
      },
      select: {
        id: true,
      },
    });

    if (!entrega) {
      throw new NotFoundException('La entrega no existe');
    }

    const criterios = new Map(
      rubrica.criterios.map((criterio) => [criterio.id, criterio]),
    );

    let notaBase = 0;

    for (const item of datos.items) {
      const criterio = criterios.get(item.criterioId);

      if (!criterio) {
        throw new BadRequestException(
          `El criterio ${item.criterioId} no pertenece a esta rǭbrica`,
        );
      }

      if (item.nivelId) {
        const nivel = criterio.niveles.find(
          (candidato) => candidato.id === item.nivelId,
        );

        if (!nivel) {
          throw new BadRequestException(
            `El nivel ${item.nivelId} no pertenece al criterio ${criterio.id}`,
          );
        }
      }

      const puntos =
        item.puntosAsignados ??
        (item.nivelId
          ? Number(
              criterio.niveles.find(
                (candidato) => candidato.id === item.nivelId,
              )?.puntos ?? 0,
            )
          : 0);

      if (puntos > Number(criterio.peso) + 0.01) {
        throw new BadRequestException(
          `Los puntos del criterio "${criterio.nombre}" no pueden superar su peso (${Number(criterio.peso)})`,
        );
      }

      notaBase += puntos;
    }

    const ponderacionMax = Number(rubrica.ponderacionMax);

    const notaBaseEscala100 =
      Math.round((notaBase / ponderacionMax) * 100 * 100) / 100;

    await this.prisma.$transaction(async (transaction) => {
      const calificacion = await transaction.calificacionRubrica.upsert({
        where: {
          entregaId,
        },
        update: {
          completada: true,
        },
        create: {
          entregaId,
          completada: true,
        },
      });

      await transaction.criterioCalificacionEntrega.deleteMany({
        where: {
          calificacionId: calificacion.id,
        },
      });

      await transaction.criterioCalificacionEntrega.createMany({
        data: datos.items.map((item) => {
          const criterio = criterios.get(item.criterioId)!;

          return {
            calificacionId: calificacion.id,
            criterioId: criterio.id,
            nivelId: item.nivelId ?? null,
            puntosAsignados: new Prisma.Decimal(
              item.puntosAsignados ??
                (item.nivelId
                  ? Number(
                      criterio.niveles.find(
                        (candidato) => candidato.id === item.nivelId,
                      )?.puntos ?? 0,
                    )
                  : 0),
            ),
            retroalimentacion: item.retroalimentacion ?? null,
          };
        }),
      });
    });

    return notaBaseEscala100;
  }
}
