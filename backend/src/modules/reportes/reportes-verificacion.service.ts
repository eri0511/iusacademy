import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { createHash } from 'node:crypto';

import { EstadoReporteEmitido } from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { generarCodigoUnicoReporte } from './helpers/codigos.helper';

import type {
  ArchivoReporteGenerado,
  DefinicionReporte,
} from './interfaces/reporte.interface';

import type {
  DatosRegistroReporte,
  ResultadoVerificacionReporte,
} from './interfaces/reporte-verificable.interface';

import { FilaReporte, FormatoReporte } from './tipos/reportes.types';

import { ReportesService } from './reportes.service';

@Injectable()
export class ReportesVerificacionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportesService: ReportesService,
  ) {}

  async generarVerificable<TFila extends FilaReporte>(
    formato: FormatoReporte,
    definicion: DefinicionReporte<TFila>,
    datos: DatosRegistroReporte,
    nombreArchivo?: string,
  ): Promise<ArchivoReporteGenerado> {
    const codigo = generarCodigoUnicoReporte(formato);

    const urlVerificacion = this.construirUrlVerificacion(codigo);

    await this.prisma.reporteEmitido.create({
      data: {
        codigo,
        tipo: datos.tipo,
        titulo: definicion.metadatos.titulo,
        formato,
        generadoPorId: datos.generadoPorId,

        filtros: datos.filtros
          ? JSON.parse(JSON.stringify(datos.filtros))
          : undefined,

        expiraEn: datos.expiraEn,
      },
    });

    try {
      const archivo = await this.reportesService.generar(
        formato,
        {
          ...definicion,

          metadatos: {
            ...definicion.metadatos,
            codigoUnico: codigo,
          },

          opciones: {
            ...definicion.opciones,
            incluirQr: formato === FormatoReporte.PDF,
            contenidoQr: urlVerificacion,
          },
        },
        nombreArchivo,
      );

      const hashSha256 = createHash('sha256')
        .update(archivo.contenido)
        .digest('hex');

      await this.prisma.reporteEmitido.update({
        where: {
          codigo,
        },

        data: {
          estado: EstadoReporteEmitido.VALIDO,

          nombreArchivo: archivo.nombreArchivo,

          mimeType: archivo.mimeType,

          cantidadRegistros: archivo.cantidadRegistros,

          hashSha256,
          finalizadoEn: new Date(),
        },
      });

      return archivo;
    } catch (error) {
      await this.prisma.reporteEmitido.update({
        where: {
          codigo,
        },

        data: {
          estado: EstadoReporteEmitido.ERROR,

          errorGeneracion: this.mensajeSeguro(error),

          finalizadoEn: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Devuelve el historial completo para el administrador.
   */
  async listar() {
    return this.prisma.reporteEmitido.findMany({
      orderBy: {
        generadoEn: 'desc',
      },

      include: {
        generadoPor: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            correo: true,
          },
        },

        anuladoPor: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            correo: true,
          },
        },
      },
    });
  }

  /**
   * Consulta pública utilizada por la pantalla de verificación.
   */
  async verificar(
    codigoRecibido: string,
  ): Promise<ResultadoVerificacionReporte> {
    const codigo = this.normalizarCodigo(codigoRecibido);

    const reporte = await this.prisma.reporteEmitido.findUnique({
      where: {
        codigo,
      },

      include: {
        generadoPor: {
          select: {
            nombres: true,
            apellidoPaterno: true,
          },
        },
      },
    });

    if (!reporte) {
      throw new NotFoundException('No existe un reporte con ese código.');
    }

    const expirado = Boolean(
      reporte.expiraEn && reporte.expiraEn <= new Date(),
    );

    const valido = reporte.estado === EstadoReporteEmitido.VALIDO && !expirado;

    const nombreGenerador = [
      reporte.generadoPor?.nombres,
      reporte.generadoPor?.apellidoPaterno,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      valido,
      codigo: reporte.codigo,

      estado:
        expirado && reporte.estado === EstadoReporteEmitido.VALIDO
          ? 'EXPIRADO'
          : reporte.estado,

      titulo: reporte.titulo,
      tipo: reporte.tipo,
      formato: reporte.formato,
      nombreArchivo: reporte.nombreArchivo,
      cantidadRegistros: reporte.cantidadRegistros,

      generadoEn: reporte.generadoEn,
      finalizadoEn: reporte.finalizadoEn,
      expiraEn: reporte.expiraEn,
      anuladoEn: reporte.anuladoEn,
      motivoAnulacion: reporte.motivoAnulacion,

      generadoPor: nombreGenerador || 'Administrador de IusAcademy',

      institucion: 'IusAcademy · UNIFRANZ',
    };
  }

  /**
   * Anula un reporte válido.
   */
  async anular(
    codigoRecibido: string,
    motivoRecibido: string,
    administradorId: number,
  ) {
    const codigo = this.normalizarCodigo(codigoRecibido);

    const motivo = motivoRecibido.trim();

    if (motivo.length < 5) {
      throw new BadRequestException(
        'El motivo debe tener al menos 5 caracteres.',
      );
    }

    if (motivo.length > 500) {
      throw new BadRequestException(
        'El motivo no puede superar los 500 caracteres.',
      );
    }

    const reporte = await this.prisma.reporteEmitido.findUnique({
      where: {
        codigo,
      },
    });

    if (!reporte) {
      throw new NotFoundException('No existe un reporte con ese código.');
    }

    if (reporte.estado === EstadoReporteEmitido.ANULADO) {
      throw new BadRequestException('El reporte ya se encuentra anulado.');
    }

    if (reporte.estado !== EstadoReporteEmitido.VALIDO) {
      throw new BadRequestException('Solo se pueden anular reportes válidos.');
    }

    return this.prisma.reporteEmitido.update({
      where: {
        codigo,
      },

      data: {
        estado: EstadoReporteEmitido.ANULADO,

        anuladoEn: new Date(),

        anuladoPorId: administradorId,

        motivoAnulacion: motivo,
      },

      select: {
        codigo: true,
        estado: true,
        anuladoEn: true,
        motivoAnulacion: true,

        anuladoPor: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            correo: true,
          },
        },
      },
    });
  }

  private construirUrlVerificacion(codigo: string): string {
    const base = (
      process.env.REPORTES_URL_VERIFICACION ??
      'http://localhost:5173/verificar-reporte'
    ).replace(/\/$/, '');

    return `${base}/${encodeURIComponent(codigo)}`;
  }

  private normalizarCodigo(codigoRecibido: string): string {
    const codigo = codigoRecibido.trim().toUpperCase();

    if (!codigo) {
      throw new BadRequestException('El código del reporte es obligatorio.');
    }

    return codigo;
  }

  private mensajeSeguro(error: unknown): string {
    return error instanceof Error
      ? error.message.slice(0, 500)
      : 'Error desconocido durante la generación.';
  }
}
