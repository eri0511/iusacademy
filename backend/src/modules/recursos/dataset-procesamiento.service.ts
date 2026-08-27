import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import {
  EstadoProcesamientoDataset,
} from '../../generated/prisma/client';

import {
  PrismaService,
} from '../../prisma/prisma.service';

import {
  ArchivosService,
} from '../archivos/archivos.service';

@Injectable()
export class DatasetProcesamientoService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger =
    new Logger(
      DatasetProcesamientoService.name,
    );

  private temporizador:
    NodeJS.Timeout |
    null =
    null;

  private ejecutando =
    false;

  constructor(
    private readonly prisma:
      PrismaService,

    private readonly archivosService:
      ArchivosService,
  ) {}

  onModuleInit() {
    this.temporizador =
      setInterval(
        () => {
          void this.procesarPendientes();
        },
        5000,
      );

    void this.procesarPendientes();
  }

  onModuleDestroy() {
    if (
      this.temporizador
    ) {
      clearInterval(
        this.temporizador,
      );
    }
  }

  despertar() {
    void this.procesarPendientes();
  }

  async reintentar(
    versionId:
      number,
  ) {
    const version =
      await this.prisma.recursoContenidoVersion.findUnique({
        where: {
          id:
            versionId,
        },

        select: {
          id:
            true,

          esVigente:
            true,

          estadoDataset:
            true,

          contenido: {
            select: {
              estaActivo:
                true,

              disponibleParaQuiz:
                true,
            },
          },
        },
      });

    if (
      !version
    ) {
      throw new NotFoundException(
        'La versión del recurso no existe',
      );
    }

    if (
      !version.esVigente ||
      !version.contenido.estaActivo ||
      !version.contenido.disponibleParaQuiz
    ) {
      throw new BadRequestException(
        'Esta versión ya no puede procesarse como dataset',
      );
    }

    if (
      version.estadoDataset ===
        EstadoProcesamientoDataset.PROCESANDO
    ) {
      return {
        mensaje:
          'El dataset ya se está procesando',
      };
    }

    await this.prisma.recursoContenidoVersion.update({
      where: {
        id:
          versionId,
      },

      data: {
        estadoDataset:
          EstadoProcesamientoDataset.PENDIENTE,

        progresoDataset:
          0,

        errorDataset:
          null,

        procesadoDatasetEn:
          null,
      },
    });

    this.despertar();

    return {
      mensaje:
        'El dataset fue enviado nuevamente a procesamiento',
    };
  }

  private async tomarSiguientePendiente() {
    return this.prisma.$transaction(
      async (
        tx,
      ) => {
        const version =
          await tx.recursoContenidoVersion.findFirst({
            where: {
              esVigente:
                true,

              estadoDataset:
                EstadoProcesamientoDataset.PENDIENTE,

              contenido: {
                estaActivo:
                  true,

                disponibleParaQuiz:
                  true,
              },
            },

            orderBy: {
              creadoEn:
                'asc',
            },

            include: {
              archivo:
                true,

              contenido: {
                include: {
                  recurso:
                    true,
                },
              },
            },
          });

        if (
          !version
        ) {
          return null;
        }

        const reservado =
          await tx.recursoContenidoVersion.updateMany({
            where: {
              id:
                version.id,

              estadoDataset:
                EstadoProcesamientoDataset.PENDIENTE,
            },

            data: {
              estadoDataset:
                EstadoProcesamientoDataset.PROCESANDO,

              progresoDataset:
                2,

              errorDataset:
                null,

              intentosDataset: {
                increment:
                  1,
              },
            },
          });

        if (
          reservado.count !==
          1
        ) {
          return null;
        }

        return version;
      },
    );
  }

  async procesarPendientes() {
    if (
      this.ejecutando
    ) {
      return;
    }

    this.ejecutando =
      true;

    try {
      while (
        true
      ) {
        const version =
          await this.tomarSiguientePendiente();

        if (
          !version
        ) {
          break;
        }

        await this.procesarVersion(
          version.id,
          version.archivo.id,
          version.archivo.nombreOriginal,
        );
      }
    } finally {
      this.ejecutando =
        false;
    }
  }

  private async actualizarProgreso(
    versionId:
      number,

    progreso:
      number,
  ) {
    const normalizado =
      Math.max(
        2,
        Math.min(
          99,
          Math.round(
            progreso,
          ),
        ),
      );

    await this.prisma.recursoContenidoVersion.updateMany({
      where: {
        id:
          versionId,

        estadoDataset:
          EstadoProcesamientoDataset.PROCESANDO,
      },

      data: {
        progresoDataset:
          normalizado,
      },
    });
  }

  private async procesarVersion(
    versionId:
      number,

    archivoId:
      number,

    nombreArchivo:
      string,
  ) {
    try {
      this.logger.log(
        `Preparando dataset "${nombreArchivo}" en segundo plano.`,
      );

      let ultimoProgreso =
        2;

      const reportarProgreso =
        async (
          progreso:
            number,
        ) => {
          const normalizado =
            Math.max(
              ultimoProgreso,
              Math.min(
                99,
                Math.round(
                  progreso,
                ),
              ),
            );

          if (
            normalizado -
              ultimoProgreso <
              2 &&
            normalizado <
              98
          ) {
            return;
          }

          ultimoProgreso =
            normalizado;

          await this.actualizarProgreso(
            versionId,
            normalizado,
          );
        };

      const texto =
        await this.archivosService.procesarPdfParaDataset(
          archivoId,
          reportarProgreso,
        );

      if (
        !texto?.trim()
      ) {
        throw new Error(
          'No se pudo obtener texto utilizable del PDF.',
        );
      }

      await this.prisma.recursoContenidoVersion.update({
        where: {
          id:
            versionId,
        },

        data: {
          estadoDataset:
            EstadoProcesamientoDataset.LISTO,

          progresoDataset:
            100,

          errorDataset:
            null,

          procesadoDatasetEn:
            new Date(),
        },
      });

      this.logger.log(
        `Dataset listo: "${nombreArchivo}".`,
      );
    } catch (
      error
    ) {
      const mensaje =
        error instanceof Error
          ? error.message
          : String(
              error,
            );

      await this.prisma.recursoContenidoVersion.update({
        where: {
          id:
            versionId,
        },

        data: {
          estadoDataset:
            EstadoProcesamientoDataset.ERROR,

          progresoDataset:
            0,

          errorDataset:
            mensaje,

          procesadoDatasetEn:
            null,
        },
      });

      this.logger.error(
        `Error preparando dataset "${nombreArchivo}": ${mensaje}`,
      );
    }
  }
}
