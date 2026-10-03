import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

jest.mock('@nestjs/axios', () => ({
  HttpService: class HttpService {},
}));

import {
  BadGatewayException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import type { HttpService } from '@nestjs/axios';

import {
  of,
  throwError,
} from 'rxjs';

import { AxiosError } from 'axios';

import { AnalisisIaService } from './analisis-ia.service';

import type {
  AnalisisCompletoIaRequestDto,
  ResultadoAnalisisIaDto,
} from './dto/analizar-documento.dto';

describe('AnalisisIaService', () => {
  let service: AnalisisIaService;

  let httpService: {
    post: jest.Mock;
  };

  let configService: {
    get: jest.Mock<
      (clave: string) => string | undefined
    >;
  };

  const request: AnalisisCompletoIaRequestDto = {
    documento: {
      id_externo: 'documento-1',
      tipo_documento: 'GENERICO',
      texto: 'Texto de prueba',
      idioma: 'es',
      titulo: 'Documento de prueba',
      metadatos: {},
    },
    fuentes: [],
  };

  const respuesta: ResultadoAnalisisIaDto = {
    documento_id_externo: 'documento-1',
    total_fragmentos: 1,
    total_fuentes_evaluadas: 0,
    total_evidencias: 0,
    similitud_maxima: 0,
    similitud_promedio: 0,
    evidencias: [],
    metadatos: {
      tipo_documento: 'GENERICO',
      idioma: 'es',
    },
  };

  beforeEach(() => {
    httpService = {
      post: jest.fn(),
    };

    configService = {
      get: jest.fn(
        (
          clave: string,
        ): string | undefined => {
          if (clave === 'IA_SERVICE_URL') {
            return 'http://localhost:8000';
          }

          if (
            clave
            === 'IA_SERVICE_TIMEOUT_MS'
          ) {
            return '30000';
          }

          return undefined;
        },
      ),
    };

    service = new AnalisisIaService(
      httpService as unknown as HttpService,
      configService as unknown as ConfigService,
    );
  });

  it(
    'debe enviar el análisis a ia-service',
    async () => {
      httpService.post.mockReturnValue(
        of({
          data: respuesta,
        }),
      );

      const resultado =
        await service.analizarDocumento(
          request,
        );

      expect(
        httpService.post,
      ).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/analisis/completo',
        request,
        {
          timeout: 30000,
        },
      );

      expect(
        resultado,
      ).toEqual(
        respuesta,
      );
    },
  );

  it(
    'debe lanzar ServiceUnavailableException cuando ia-service no está disponible',
    async () => {
      const error = new AxiosError(
        'Connection refused',
        'ECONNREFUSED',
      );

      httpService.post.mockReturnValue(
        throwError(
          () => error,
        ),
      );

      await expect(
        service.analizarDocumento(
          request,
        ),
      ).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    },
  );

  it(
    'debe lanzar GatewayTimeoutException cuando ia-service excede el tiempo de espera',
    async () => {
      const error = new AxiosError(
        'Timeout',
        'ECONNABORTED',
      );

      httpService.post.mockReturnValue(
        throwError(
          () => error,
        ),
      );

      await expect(
        service.analizarDocumento(
          request,
        ),
      ).rejects.toBeInstanceOf(
        GatewayTimeoutException,
      );
    },
  );

  it(
    'debe lanzar BadGatewayException ante otro error HTTP',
    async () => {
      const error = new AxiosError(
        'Bad Gateway',
        'ERR_BAD_RESPONSE',
      );

      httpService.post.mockReturnValue(
        throwError(
          () => error,
        ),
      );

      await expect(
        service.analizarDocumento(
          request,
        ),
      ).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    },
  );
});