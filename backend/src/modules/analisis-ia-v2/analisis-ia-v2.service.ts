import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { HttpService } from '@nestjs/axios';

import { AxiosError, isAxiosError } from 'axios';

import { firstValueFrom } from 'rxjs';

import {
  AnalizarDocumentoV2Dto,
  COMBINACIONES_SOPORTADAS_V2,
  ResultadoAnalisisFinalV11Dto,
} from './dto/analizar-documento-v2.dto';

import { validarContratoV11 } from './analisis-ia-v2.validacion';

@Injectable()
export class AnalisisIaV2Service {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.obtenerBaseUrl();

    this.timeoutMs = this.obtenerTimeout();
  }

  async analizarDocumento(
    request: AnalizarDocumentoV2Dto,
  ): Promise<ResultadoAnalisisFinalV11Dto> {
    this.validarCombinacion(request);

    try {
      const response = await firstValueFrom(
        this.httpService.post<unknown>(
          `${this.baseUrl}/api/v1/analisis/documento/con-correcciones`,
          request,
          {
            timeout: this.timeoutMs,
          },
        ),
      );

      const problemas = validarContratoV11(response.data);

      if (problemas.length > 0) {
        throw new BadGatewayException(
          `El motor de análisis devolvió una respuesta que no cumple el contrato público v1.1: ${problemas.join('; ')}`,
        );
      }

      return response.data as ResultadoAnalisisFinalV11Dto;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.manejarError(error);
    }
  }

  private validarCombinacion(request: AnalizarDocumentoV2Dto): void {
    const soportada = COMBINACIONES_SOPORTADAS_V2.some(
      ([actividad, documento]) =>
        actividad === request.tipo_actividad &&
        documento === request.tipo_documento,
    );

    if (!soportada) {
      throw new BadRequestException(
        'La combinación de tipo de actividad y tipo de documento no está soportada por el motor de análisis.',
      );
    }
  }

  private obtenerBaseUrl(): string {
    const url = this.configService.get<string>('IA_V2_BASE_URL');

    if (!url?.trim()) {
      throw new Error('La variable IA_V2_BASE_URL no está configurada.');
    }

    return url.replace(/\/+$/, '');
  }

  private obtenerTimeout(): number {
    const valor = this.configService.get<string>('IA_V2_TIMEOUT_MS');

    if (!valor) {
      return 30000;
    }

    const timeout = Number(valor);

    if (!Number.isFinite(timeout) || timeout <= 0) {
      throw new Error(
        'La variable IA_V2_TIMEOUT_MS debe ser un número mayor a 0.',
      );
    }

    return timeout;
  }

  private manejarError(error: unknown): never {
    if (!isAxiosError(error)) {
      throw new BadGatewayException(
        'Ocurrió un error al comunicarse con el motor de análisis.',
      );
    }

    const axiosError = error as AxiosError;

    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      throw new GatewayTimeoutException(
        'El motor de análisis excedió el tiempo de espera.',
      );
    }

    if (axiosError.response) {
      this.manejarRespuestaInvalida(axiosError.response.status);
    }

    if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
      throw new ServiceUnavailableException(
        'El motor de análisis no está disponible.',
      );
    }

    throw new BadGatewayException(
      'El motor de análisis no pudo procesar la solicitud.',
    );
  }

  private manejarRespuestaInvalida(status: number): never {
    if (status === 400 || status === 422) {
      throw new BadRequestException(
        'El motor de análisis rechazó la solicitud.',
      );
    }

    throw new BadGatewayException(
      'El motor de análisis encontró un error interno al procesar la solicitud.',
    );
  }
}
