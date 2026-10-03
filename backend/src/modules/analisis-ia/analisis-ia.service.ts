import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  AxiosError,
  isAxiosError,
} from 'axios';
import { firstValueFrom } from 'rxjs';

import {
  AnalisisCompletoIaRequestDto,
  ResultadoAnalisisIaDto,
} from './dto/analizar-documento.dto';

@Injectable()
export class AnalisisIaService {
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
    request: AnalisisCompletoIaRequestDto,
  ): Promise<ResultadoAnalisisIaDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<ResultadoAnalisisIaDto>(
          `${this.baseUrl}/api/v1/analisis/completo`,
          request,
          {
            timeout: this.timeoutMs,
          },
        ),
      );

      return response.data;
    } catch (error: unknown) {
      this.manejarError(error);
    }
  }

  private obtenerBaseUrl(): string {
    const url = this.configService.get<string>(
      'IA_SERVICE_URL',
    );

    if (!url?.trim()) {
      throw new Error(
        'La variable IA_SERVICE_URL no está configurada.',
      );
    }

    return url.replace(/\/+$/, '');
  }

  private obtenerTimeout(): number {
    const valor = this.configService.get<string>(
      'IA_SERVICE_TIMEOUT_MS',
    );

    if (!valor) {
      return 30000;
    }

    const timeout = Number(valor);

    if (
      !Number.isFinite(timeout)
      || timeout <= 0
    ) {
      throw new Error(
        'La variable IA_SERVICE_TIMEOUT_MS debe ser un número mayor a 0.',
      );
    }

    return timeout;
  }

  private manejarError(
    error: unknown,
  ): never {
    if (!isAxiosError(error)) {
      throw new BadGatewayException(
        'Ocurrió un error al comunicarse con el servicio de análisis.',
      );
    }

    const axiosError = error as AxiosError;

    if (
      axiosError.code === 'ECONNABORTED'
      || axiosError.code === 'ETIMEDOUT'
    ) {
      throw new GatewayTimeoutException(
        'El servicio de análisis excedió el tiempo de espera.',
      );
    }

    if (
      axiosError.code === 'ECONNREFUSED'
      || axiosError.code === 'ENOTFOUND'
    ) {
      throw new ServiceUnavailableException(
        'El servicio de análisis no está disponible.',
      );
    }

    throw new BadGatewayException(
      'El servicio de análisis no pudo procesar la solicitud.',
    );
  }
}