import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EstadoRecursoCurso,
  EstadoVersionRecurso,
  Rol,
  TipoContenidoRecurso,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { AnalisisIaService } from '../analisis-ia/analisis-ia.service';

import type {
  AnalisisCompletoIaRequestDto,
  FuenteAnalisisIaDto,
  ResultadoAnalisisIaDto,
  TipoDocumentoAnalisisIa,
} from '../analisis-ia/dto/analizar-documento.dto';

import { ArchivosService } from '../archivos/archivos.service';

import type {
  UsuarioAutenticado,
} from './interfaces/usuario-autenticado.interface';

import { AdaptadorContenidoEntregaService } from './analisis/adaptador-contenido-entrega.service';

type ComponenteTareaAnalizable = {
  id: number;
  tipo: string;
  titulo: string;
};

type ArchivoAnalizablePreparado = {
  id: number;
  nombreOriginal: string;
  mimeType: string;
  textoExtraido: string | null;
};

type EntregaPreparadaAnalisis = {
  entregaId: number;
  tareaId: number;
  cursoId: number;
  tipoTarea: string;
  tipoDocumentoIa: TipoDocumentoAnalisisIa;
  textoEditor: string | null;
  textoAnalizable: string | null;
  archivos: ArchivoAnalizablePreparado[];
  componentes: ComponenteTareaAnalizable[];
  fuentesRecursosCurso: FuenteAnalisisIaDto[];
  totalFuentesRecursosCurso: number;
};

@Injectable()
export class TareasAnalisisService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly analisisIaService: AnalisisIaService,

    private readonly archivosService: ArchivosService,

    private readonly adaptadorContenidoEntrega:
      AdaptadorContenidoEntregaService,
  ) {}

  async analizarEntregaDocente(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    entregaId: number,
  ): Promise<ResultadoAnalisisIaDto> {
    await this.validarAccesoDocenteEntrega(
      usuario,
      cursoId,
      tareaId,
      entregaId,
    );

    return this.analizarEntrega(
      entregaId,
    );
  }

  async prepararContenidoEntrega(
    entregaId: number,
  ): Promise<EntregaPreparadaAnalisis> {
    const entrega =
      await this.prisma.entregaTarea.findFirst({
        where: {
          id:
            entregaId,

          estaActiva:
            true,
        },

        include: {
          tarea:
            true,

          archivos: {
            where: {
              eliminadoEn:
                null,
            },
          },
        },
      });

    if (!entrega) {
      throw new NotFoundException(
        'La entrega indicada no existe o ya no se encuentra activa.',
      );
    }

    const componentes =
      this.obtenerComponentesTarea(
        entrega.tarea.configuracionTipo,
      );

    const textoEditor =
      this.adaptadorContenidoEntrega.compilarEntrega({
        tipo:
          entrega.tarea.tipo,

        contenido:
          entrega.contenido,

        componentes,
      });

    const archivosPreparados:
      ArchivoAnalizablePreparado[] = [];

    const partesTexto:
      string[] = [];

    if (textoEditor?.trim()) {
      partesTexto.push(
        [
          'CONTENIDO DEL EDITOR',
          textoEditor.trim(),
        ].join('\n'),
      );
    }

    for (
      const archivo of entrega.archivos
    ) {
      let textoExtraido:
        string | null = null;

      if (
        archivo.mimeType ===
        'application/pdf'
      ) {
        textoExtraido =
          await this.archivosService.asegurarTextoExtraidoPdf(
            archivo.id,
          );

        if (textoExtraido?.trim()) {
          partesTexto.push(
            [
              `ARCHIVO: ${archivo.nombreOriginal}`,
              textoExtraido.trim(),
            ].join('\n'),
          );
        }
      }

      archivosPreparados.push({
        id:
          archivo.id,

        nombreOriginal:
          archivo.nombreOriginal,

        mimeType:
          archivo.mimeType,

        textoExtraido,
      });
    }

    const textoAnalizable =
      partesTexto.length > 0
        ? partesTexto.join('\n\n')
        : null;

    const tipoDocumentoIa =
      this.determinarTipoDocumentoIa(
        entrega.tarea.tipo,
        entrega.contenido,
      );

    const fuentesRecursosCurso =
      await this.obtenerFuentesRecursosCurso(
        entrega.tarea.cursoId,
      );

    return {
      entregaId:
        entrega.id,

      tareaId:
        entrega.tareaId,

      cursoId:
        entrega.tarea.cursoId,

      tipoTarea:
        entrega.tarea.tipo,

      tipoDocumentoIa,

      textoEditor,

      textoAnalizable,

      archivos:
        archivosPreparados,

      componentes,

      fuentesRecursosCurso,

      totalFuentesRecursosCurso:
        fuentesRecursosCurso.length,
    };
  }

  async construirSolicitudAnalisis(
    entregaId: number,
  ): Promise<AnalisisCompletoIaRequestDto> {
    const preparada =
      await this.prepararContenidoEntrega(
        entregaId,
      );

    if (
      !preparada.textoAnalizable ||
      !preparada.textoAnalizable.trim()
    ) {
      throw new BadRequestException(
        'La entrega no contiene texto disponible para realizar el análisis.',
      );
    }

    return {
      documento: {
        id_externo:
          `entrega:${preparada.entregaId}`,

        tipo_documento:
          preparada.tipoDocumentoIa,

        texto:
          preparada.textoAnalizable.trim(),

        idioma:
          'es',

        titulo:
          `Entrega ${preparada.entregaId} - Tarea ${preparada.tareaId}`,

        metadatos: {
          entregaId:
            preparada.entregaId,

          tareaId:
            preparada.tareaId,

          cursoId:
            preparada.cursoId,

          tipoTarea:
            preparada.tipoTarea,

          tipoDocumentoIa:
            preparada.tipoDocumentoIa,

          totalArchivos:
            preparada.archivos.length,

          totalFuentesRecursosCurso:
            preparada.totalFuentesRecursosCurso,
        },
      },

      fuentes:
        preparada.fuentesRecursosCurso,
    };
  }

  async analizarEntrega(
    entregaId: number,
  ): Promise<ResultadoAnalisisIaDto> {
    const solicitud =
      await this.construirSolicitudAnalisis(
        entregaId,
      );

    return this.analisisIaService.analizarDocumento(
      solicitud,
    );
  }

  private async validarAccesoDocenteEntrega(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    entregaId: number,
  ): Promise<void> {
    if (
      usuario.rol !==
      Rol.DOCENTE
    ) {
      throw new ForbiddenException(
        'Solo el docente puede solicitar el análisis de una entrega.',
      );
    }

    const curso =
      await this.prisma.curso.findUnique({
        where: {
          id:
            cursoId,
        },

        select: {
          id:
            true,

          docenteId:
            true,
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'El curso no existe.',
      );
    }

    if (
      curso.docenteId !==
      usuario.id
    ) {
      throw new ForbiddenException(
        'No tienes acceso a este curso.',
      );
    }

    const tarea =
      await this.prisma.tareaCurso.findFirst({
        where: {
          id:
            tareaId,

          cursoId,

          estaActiva:
            true,
        },

        select: {
          id:
            true,
        },
      });

    if (!tarea) {
      throw new NotFoundException(
        'La tarea no existe o no pertenece al curso.',
      );
    }

    const entrega =
      await this.prisma.entregaTarea.findFirst({
        where: {
          id:
            entregaId,

          tareaId:
            tarea.id,

          estaActiva:
            true,
        },

        select: {
          id:
            true,
        },
      });

    if (!entrega) {
      throw new NotFoundException(
        'La entrega no existe, no pertenece a la tarea o ya no se encuentra activa.',
      );
    }
  }

  private async obtenerFuentesRecursosCurso(
    cursoId: number,
  ): Promise<FuenteAnalisisIaDto[]> {
    const recursos =
      await this.prisma.recursoCurso.findMany({
        where: {
          cursoId,

          estaActivo:
            true,

          estado:
            EstadoRecursoCurso.ACTIVO,
        },

        select: {
          id:
            true,

          titulo:
            true,

          descripcion:
            true,

          categoria:
            true,

          alcance:
            true,

          hitoId:
            true,

          contenidos: {
            where: {
              estaActivo:
                true,
            },

            select: {
              id:
                true,

              tipo:
                true,

              titulo:
                true,

              descripcion:
                true,

              urlExterna:
                true,

              versiones: {
                where: {
                  esVigente:
                    true,

                  estado:
                    EstadoVersionRecurso.VIGENTE,
                },

                orderBy: {
                  numeroVersion:
                    'desc',
                },

                take:
                  1,

                select: {
                  id:
                    true,

                  numeroVersion:
                    true,

                  archivo: {
                    select: {
                      id:
                        true,

                      nombreOriginal:
                        true,

                      mimeType:
                        true,

                      extension:
                        true,

                      textoExtraido:
                        true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    const fuentes:
      FuenteAnalisisIaDto[] = [];

    for (
      const recurso of recursos
    ) {
      for (
        const contenido of recurso.contenidos
      ) {
        if (
          contenido.tipo !==
          TipoContenidoRecurso.ARCHIVO
        ) {
          continue;
        }

        const version =
          contenido.versiones[0];

        if (!version) {
          continue;
        }

        const archivo =
          version.archivo;

        if (!archivo) {
          continue;
        }

        let texto =
          archivo.textoExtraido?.trim() ||
          null;

        if (
          !texto &&
          archivo.mimeType ===
            'application/pdf'
        ) {
          texto =
            await this.archivosService.asegurarTextoExtraidoPdf(
              archivo.id,
            );
        }

        if (!texto?.trim()) {
          continue;
        }

        fuentes.push({
          id_externo: [
            'recurso',
            recurso.id,
            'contenido',
            contenido.id,
            'version',
            version.id,
          ].join(':'),

          tipo_fuente:
            'RECURSO_CURSO',

          titulo:
            contenido.titulo?.trim() ||
            archivo.nombreOriginal ||
            recurso.titulo,

          texto:
            texto.trim(),

          autorizada:
            true,

          url:
            null,

          metadatos: {
            recursoId:
              recurso.id,

            recursoTitulo:
              recurso.titulo,

            recursoDescripcion:
              recurso.descripcion ??
              null,

            categoria:
              recurso.categoria,

            alcance:
              recurso.alcance,

            hitoId:
              recurso.hitoId,

            contenidoId:
              contenido.id,

            contenidoTitulo:
              contenido.titulo,

            contenidoDescripcion:
              contenido.descripcion ??
              null,

            versionId:
              version.id,

            numeroVersion:
              version.numeroVersion,

            archivoId:
              archivo.id,

            archivoNombre:
              archivo.nombreOriginal,

            archivoMimeType:
              archivo.mimeType,

            archivoExtension:
              archivo.extension,
          },
        });
      }
    }

    return fuentes;
  }

  private determinarTipoDocumentoIa(
    tipoTarea: string,
    contenido: string | null,
  ): TipoDocumentoAnalisisIa {
    if (
      tipoTarea ===
      'EXPOSICION'
    ) {
      return 'EXPOSICION';
    }

    if (
      tipoTarea ===
        'REDACCION_JURIDICA' ||
      tipoTarea ===
        'DOCUMENTO_COLABORATIVO'
    ) {
      const tipoPieza =
        this.obtenerTipoPiezaJuridica(
          contenido,
        );

      return this.mapearTipoPiezaIa(
        tipoPieza,
      );
    }

    return 'GENERICO';
  }

  private obtenerTipoPiezaJuridica(
    contenido: string | null,
  ): string | null {
    if (!contenido?.trim()) {
      return null;
    }

    try {
      const valor =
        JSON.parse(
          contenido,
        ) as unknown;

      if (
        !valor ||
        typeof valor !==
          'object' ||
        Array.isArray(valor)
      ) {
        return null;
      }

      const registro =
        valor as Record<
          string,
          unknown
        >;

      const tipoPieza =
        registro[
          'tipoPieza'
        ];

      if (
        typeof tipoPieza !==
          'string' ||
        !tipoPieza.trim()
      ) {
        return null;
      }

      return tipoPieza
        .trim()
        .toUpperCase();
    } catch {
      return null;
    }
  }

  private mapearTipoPiezaIa(
    tipoPieza: string | null,
  ): TipoDocumentoAnalisisIa {
    switch (tipoPieza) {
      case 'DEMANDA':
        return 'DEMANDA';

      case 'MEMORIAL':
        return 'MEMORIAL';

      case 'CONTRATO':
        return 'CONTRATO';

      case 'RECURSO':
        return 'RECURSO';

      case 'INCIDENTE':
        return 'INCIDENTE';

      default:
        return 'GENERICO';
    }
  }

  private obtenerComponentesTarea(
    configuracionTipo: unknown,
  ): ComponenteTareaAnalizable[] {
    if (
      !configuracionTipo ||
      typeof configuracionTipo !==
        'object' ||
      Array.isArray(
        configuracionTipo,
      )
    ) {
      return [];
    }

    const configuracion =
      configuracionTipo as Record<
        string,
        unknown
      >;

    const componentes =
      configuracion[
        'componentes'
      ];

    if (
      !Array.isArray(
        componentes,
      )
    ) {
      return [];
    }

    const resultado:
      ComponenteTareaAnalizable[] = [];

    for (
      const item of componentes
    ) {
      if (
        !item ||
        typeof item !==
          'object' ||
        Array.isArray(item)
      ) {
        continue;
      }

      const componente =
        item as Record<
          string,
          unknown
        >;

      const id =
        componente[
          'id'
        ];

      const tipo =
        componente[
          'tipo'
        ];

      const titulo =
        componente[
          'titulo'
        ];

      if (
        typeof id !==
          'number' ||
        typeof tipo !==
          'string' ||
        typeof titulo !==
          'string'
      ) {
        continue;
      }

      resultado.push({
        id,
        tipo,
        titulo,
      });
    }

    return resultado;
  }
}