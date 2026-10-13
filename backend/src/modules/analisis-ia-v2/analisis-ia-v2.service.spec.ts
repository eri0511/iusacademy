import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@nestjs/axios', () => ({
  HttpService: class HttpService {},
}));

import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import type { HttpService } from '@nestjs/axios';

import { of, throwError } from 'rxjs';

import { AxiosError } from 'axios';

import { AnalisisIaV2Service } from './analisis-ia-v2.service';

import {
  crearCorreccionLlm,
  crearResultadoV11,
  crearRevisionLlm,
  SOLICITUD_V2_PRUEBA,
  TEXTO_DOCUMENTO_PRUEBA,
} from './analisis-ia-v2.fixture';

import type { AnalizarDocumentoV2Dto } from './dto/analizar-documento-v2.dto';

const URL_V2 =
  'http://localhost:8001/api/v1/analisis/documento/con-correcciones';

function errorDeRespuesta(status: number): AxiosError {
  return new AxiosError(
    'Request failed',
    'ERR_BAD_RESPONSE',
    undefined,
    undefined,
    { status } as never,
  );
}

async function capturarError(operacion: Promise<unknown>): Promise<Error> {
  const resultado = await operacion.then(
    () => null,
    (error: unknown) =>
      error instanceof Error ? error : new Error(String(error)),
  );

  if (resultado === null) {
    throw new Error('Se esperaba una excepción que no fue lanzada.');
  }

  return resultado;
}

describe('AnalisisIaV2Service', () => {
  let service: AnalisisIaV2Service;

  let httpService: {
    post: jest.Mock;
  };

  let configService: {
    get: jest.Mock<(clave: string) => string | undefined>;
  };

  let valoresConfiguracion: Record<string, string | undefined>;

  function crearServicio(): AnalisisIaV2Service {
    return new AnalisisIaV2Service(
      httpService as unknown as HttpService,
      configService as unknown as ConfigService,
    );
  }

  beforeEach(() => {
    httpService = {
      post: jest.fn(),
    };

    valoresConfiguracion = {
      IA_V2_BASE_URL: 'http://localhost:8001',
      IA_V2_TIMEOUT_MS: '30000',
    };

    configService = {
      get: jest.fn(
        (clave: string): string | undefined => valoresConfiguracion[clave],
      ),
    };

    service = crearServicio();
  });

  describe('compatibilidad con el contrato público', () => {
    it('debe enviar el análisis a la ruta pública v1.1 del motor V2', async () => {
      const respuesta = crearResultadoV11();

      httpService.post.mockReturnValue(of({ data: respuesta }));

      const resultado = await service.analizarDocumento(SOLICITUD_V2_PRUEBA);

      expect(httpService.post).toHaveBeenCalledWith(
        URL_V2,
        SOLICITUD_V2_PRUEBA,
        {
          timeout: 30000,
        },
      );

      expect(resultado).toBe(respuesta);
    });

    it('no debe utilizar la ruta del motor V1', async () => {
      httpService.post.mockReturnValue(of({ data: crearResultadoV11() }));

      await service.analizarDocumento(SOLICITUD_V2_PRUEBA);

      const url = httpService.post.mock.calls[0][0] as string;

      expect(url).not.toContain('/api/v1/analisis/completo');

      expect(url).not.toContain('IA_SERVICE_URL');
    });

    it('debe requerir IA_V2_BASE_URL incluso si IA_SERVICE_URL existe', () => {
      valoresConfiguracion = {
        IA_SERVICE_URL: 'http://localhost:8000',
      };

      expect(() => crearServicio()).toThrow('IA_V2_BASE_URL');

      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('debe leer exclusivamente las variables V2 de configuración', () => {
      crearServicio();

      const claves = [
        ...new Set(configService.get.mock.calls.map((llamada) => llamada[0])),
      ];

      expect(claves).toEqual(['IA_V2_BASE_URL', 'IA_V2_TIMEOUT_MS']);
    });

    it('debe usar un timeout predeterminado de 30000 ms', async () => {
      delete valoresConfiguracion.IA_V2_TIMEOUT_MS;

      httpService.post.mockReturnValue(of({ data: crearResultadoV11() }));

      const servicioSinTimeout = crearServicio();

      await servicioSinTimeout.analizarDocumento(SOLICITUD_V2_PRUEBA);

      expect(httpService.post).toHaveBeenCalledWith(
        URL_V2,
        SOLICITUD_V2_PRUEBA,
        {
          timeout: 30000,
        },
      );
    });

    it('debe rechazar una IA_V2_TIMEOUT_MS no numérica', () => {
      valoresConfiguracion.IA_V2_TIMEOUT_MS = 'abc';

      expect(() => crearServicio()).toThrow('IA_V2_TIMEOUT_MS');
    });

    it('debe recortar barras finales de la URL base', async () => {
      valoresConfiguracion.IA_V2_BASE_URL = 'http://localhost:8001/';

      httpService.post.mockReturnValue(of({ data: crearResultadoV11() }));

      const servicoConSlash = crearServicio();

      await servicoConSlash.analizarDocumento(SOLICITUD_V2_PRUEBA);

      expect(httpService.post.mock.calls[0][0]).toBe(URL_V2);
    });

    it('debe rechazar combinaciones no soportadas sin llamar al motor', async () => {
      const solicitud: AnalizarDocumentoV2Dto = {
        ...SOLICITUD_V2_PRUEBA,
        tipo_documento: 'DEMANDA',
      };

      await expect(service.analizarDocumento(solicitud)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('debe admitir todas las combinaciones soportadas', async () => {
      httpService.post.mockReturnValue(of({ data: crearResultadoV11() }));

      const combinaciones: ReadonlyArray<
        readonly [
          AnalizarDocumentoV2Dto['tipo_actividad'],
          AnalizarDocumentoV2Dto['tipo_documento'],
        ]
      > = [
        ['REDACCION_JURIDICA', 'DEMANDA'],
        ['REDACCION_JURIDICA', 'CONTRATO'],
        ['REDACCION_JURIDICA', 'MEMORIAL'],
        ['REDACCION_JURIDICA', 'RECURSO'],
        ['REDACCION_JURIDICA', 'INCIDENTE'],
        ['RESPUESTA_ESCRITA', 'RESPUESTA_ACADEMICA'],
        ['CASO_PRACTICO', 'CASO_PRACTICO'],
        ['EXPOSICION', 'EXPOSICION'],
      ];

      for (const [tipo_actividad, tipo_documento] of combinaciones) {
        await expect(
          service.analizarDocumento({
            ...SOLICITUD_V2_PRUEBA,
            tipo_actividad,
            tipo_documento,
          }),
        ).resolves.toBeDefined();
      }

      expect(httpService.post).toHaveBeenCalledTimes(combinaciones.length);
    });
  });

  describe('contrato público v1.1', () => {
    it('debe devolver la respuesta válida sin modificarla', async () => {
      const respuesta = crearResultadoV11();

      httpService.post.mockReturnValue(of({ data: respuesta }));

      const resultado = await service.analizarDocumento(SOLICITUD_V2_PRUEBA);

      expect(resultado).toBe(respuesta);
      expect(resultado.version_contrato).toBe('1.1');
      expect(resultado.revision_llm.estado).toBe('desactivado');
    });

    it('debe conservar los null de campos opcionales', async () => {
      const respuesta = crearResultadoV11({
        resumen: null,
        observaciones: [
          {
            id: 'obs-001',
            tipo: 'ESTRUCTURA',
            nivel: 'INFORMATIVO',
            titulo: 'Observación',
            mensaje: 'Mensaje',
            fragmento_indice: null,
          },
        ],
      });

      httpService.post.mockReturnValue(of({ data: respuesta }));

      const resultado = await service.analizarDocumento(SOLICITUD_V2_PRUEBA);

      expect(resultado.resumen).toBeNull();

      expect(resultado.observaciones[0].fragmento_indice).toBeNull();
    });

    it('debe rechazar una versión de contrato 1.0', async () => {
      const respuesta = {
        ...crearResultadoV11(),
        version_contrato: '1.0',
      };

      httpService.post.mockReturnValue(of({ data: respuesta }));

      await expect(
        service.analizarDocumento(SOLICITUD_V2_PRUEBA),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });

    it('debe rechazar una respuesta sin revision_llm', async () => {
      const datos = crearResultadoV11() as unknown as Record<string, unknown>;

      delete datos.revision_llm;

      httpService.post.mockReturnValue(of({ data: datos }));

      const error = await capturarError(
        service.analizarDocumento(SOLICITUD_V2_PRUEBA),
      );

      expect(error).toBeInstanceOf(BadGatewayException);

      expect(error.message).toContain('falta la sección revision_llm');
    });

    it('debe rechazar una respuesta con secciones faltantes', async () => {
      const datos = crearResultadoV11() as unknown as Record<string, unknown>;

      delete datos.observaciones;

      httpService.post.mockReturnValue(of({ data: datos }));

      await expect(
        service.analizarDocumento(SOLICITUD_V2_PRUEBA),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });

    it('debe rechazar una respuesta con secciones desconocidas', async () => {
      const datos = crearResultadoV11() as unknown as Record<string, unknown>;

      datos.extra = {};

      httpService.post.mockReturnValue(of({ data: datos }));

      await expect(
        service.analizarDocumento(SOLICITUD_V2_PRUEBA),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });

    it('debe rechazar una corrección con offsets invertidos', async () => {
      const respuesta = crearResultadoV11({
        revision_llm: crearRevisionLlm({
          estado: 'completado',
          tipo_proveedor: 'mock',
          correcciones: [
            crearCorreccionLlm({
              inicio: 10,
              fin: 2,
            }),
          ],
        }),
      });

      httpService.post.mockReturnValue(of({ data: respuesta }));

      const error = await capturarError(
        service.analizarDocumento(SOLICITUD_V2_PRUEBA),
      );

      expect(error).toBeInstanceOf(BadGatewayException);

      expect(error.message).toContain('fin no puede ser menor que inicio');
    });

    it('debe rechazar JSON inválido', async () => {
      httpService.post.mockReturnValue(of({ data: '<html>error</html>' }));

      const error = await capturarError(
        service.analizarDocumento(SOLICITUD_V2_PRUEBA),
      );

      expect(error).toBeInstanceOf(BadGatewayException);

      expect(error.message).toContain('la respuesta no es un objeto JSON');
    });

    it('debe rechazar una respuesta sin cuerpo JSON', async () => {
      httpService.post.mockReturnValue(of({ data: null }));

      await expect(
        service.analizarDocumento(SOLICITUD_V2_PRUEBA),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });
  });

  describe('proveedor LLM', () => {
    it('debe aceptar una revisión simulada con proveedor mock', async () => {
      const respuesta = crearResultadoV11({
        revision_llm: crearRevisionLlm({
          estado: 'simulado',
          tipo_proveedor: 'mock',
          correcciones: [crearCorreccionLlm()],
        }),
      });

      httpService.post.mockReturnValue(of({ data: respuesta }));

      const resultado = await service.analizarDocumento(SOLICITUD_V2_PRUEBA);

      expect(resultado.revision_llm.tipo_proveedor).toBe('mock');
    });

    it('debe aceptar una revisión completada con proveedor real', async () => {
      const respuesta = crearResultadoV11({
        revision_llm: crearRevisionLlm({
          estado: 'completado',
          tipo_proveedor: 'real',
          correcciones: [crearCorreccionLlm()],
        }),
      });

      httpService.post.mockReturnValue(of({ data: respuesta }));

      const resultado = await service.analizarDocumento(SOLICITUD_V2_PRUEBA);

      expect(resultado.revision_llm.estado).toBe('completado');
    });

    it('debe devolver la respuesta cuando el proveedor LLM falla con estado error', async () => {
      const respuesta = crearResultadoV11({
        revision_llm: crearRevisionLlm({
          estado: 'error',
          tipo_proveedor: 'real',
          detalle_error: 'tiempo agotado',
        }),
      });

      httpService.post.mockReturnValue(of({ data: respuesta }));

      const resultado = await service.analizarDocumento(SOLICITUD_V2_PRUEBA);

      expect(resultado.revision_llm.estado).toBe('error');

      expect(resultado.revision_llm.detalle_error).toBe('tiempo agotado');
    });

    it('debe aceptar un proveedor de tipo desconocido', async () => {
      const respuesta = crearResultadoV11({
        revision_llm: crearRevisionLlm({
          estado: 'error',
          tipo_proveedor: 'desconocido',
          detalle_error: 'fallo interno',
        }),
      });

      httpService.post.mockReturnValue(of({ data: respuesta }));

      const resultado = await service.analizarDocumento(SOLICITUD_V2_PRUEBA);

      expect(resultado.revision_llm.tipo_proveedor).toBe('desconocido');
    });
  });

  describe('transporte', () => {
    it('debe lanzar GatewayTimeoutException ante timeout', async () => {
      httpService.post.mockReturnValue(
        throwError(() => new AxiosError('Timeout', 'ECONNABORTED')),
      );

      await expect(
        service.analizarDocumento(SOLICITUD_V2_PRUEBA),
      ).rejects.toBeInstanceOf(GatewayTimeoutException);
    });

    it('debe lanzar GatewayTimeoutException ante ETIMEDOUT', async () => {
      httpService.post.mockReturnValue(
        throwError(() => new AxiosError('Timeout', 'ETIMEDOUT')),
      );

      await expect(
        service.analizarDocumento(SOLICITUD_V2_PRUEBA),
      ).rejects.toBeInstanceOf(GatewayTimeoutException);
    });

    it('debe lanzar ServiceUnavailableException ante conexión rechazada', async () => {
      httpService.post.mockReturnValue(
        throwError(() => new AxiosError('Connection refused', 'ECONNREFUSED')),
      );

      await expect(
        service.analizarDocumento(SOLICITUD_V2_PRUEBA),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('debe lanzar ServiceUnavailableException ante host desconocido', async () => {
      httpService.post.mockReturnValue(
        throwError(() => new AxiosError('Not found', 'ENOTFOUND')),
      );

      await expect(
        service.analizarDocumento(SOLICITUD_V2_PRUEBA),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('debe lanzar BadGatewayException ante otro error de axios', async () => {
      httpService.post.mockReturnValue(
        throwError(() => new AxiosError('Bad Gateway', 'ERR_BAD_RESPONSE')),
      );

      await expect(
        service.analizarDocumento(SOLICITUD_V2_PRUEBA),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });

    it('debe lanzar BadGatewayException ante errores no HTTP', async () => {
      httpService.post.mockReturnValue(
        throwError(() => new Error('fallo inesperado')),
      );

      await expect(
        service.analizarDocumento(SOLICITUD_V2_PRUEBA),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });

    it('debe convertir el 422 del motor en una solicitud rechazada', async () => {
      httpService.post.mockReturnValue(throwError(() => errorDeRespuesta(422)));

      await expect(
        service.analizarDocumento(SOLICITUD_V2_PRUEBA),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('debe convertir el 400 del motor en una solicitud rechazada', async () => {
      httpService.post.mockReturnValue(throwError(() => errorDeRespuesta(400)));

      await expect(
        service.analizarDocumento(SOLICITUD_V2_PRUEBA),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('debe convertir el 500 del motor en un error de puerta de enlace', async () => {
      httpService.post.mockReturnValue(throwError(() => errorDeRespuesta(500)));

      await expect(
        service.analizarDocumento(SOLICITUD_V2_PRUEBA),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });

    it('debe convertir cualquier otra respuesta HTTP en un error de puerta de enlace', async () => {
      httpService.post.mockReturnValue(throwError(() => errorDeRespuesta(404)));

      await expect(
        service.analizarDocumento(SOLICITUD_V2_PRUEBA),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });
  });

  describe('seguridad', () => {
    it('no debe exponer el texto del documento en los mensajes de error', async () => {
      const escenarios: ReadonlyArray<
        readonly [string, () => Promise<unknown>]
      > = [
        [
          'timeout',
          () => {
            httpService.post.mockReturnValue(
              throwError(() => new AxiosError('Timeout', 'ECONNABORTED')),
            );

            return service.analizarDocumento(SOLICITUD_V2_PRUEBA);
          },
        ],
        [
          'conexion',
          () => {
            httpService.post.mockReturnValue(
              throwError(
                () => new AxiosError('Connection refused', 'ECONNREFUSED'),
              ),
            );

            return service.analizarDocumento(SOLICITUD_V2_PRUEBA);
          },
        ],
        [
          'rechazo 422',
          () => {
            httpService.post.mockReturnValue(
              throwError(() => errorDeRespuesta(422)),
            );

            return service.analizarDocumento(SOLICITUD_V2_PRUEBA);
          },
        ],
        [
          'contrato inválido',
          () => {
            httpService.post.mockReturnValue(
              of({
                data: {
                  ...crearResultadoV11(),
                  version_contrato: '1.0',
                },
              }),
            );

            return service.analizarDocumento(SOLICITUD_V2_PRUEBA);
          },
        ],
        [
          'combinación no soportada',
          () =>
            service.analizarDocumento({
              ...SOLICITUD_V2_PRUEBA,
              tipo_documento: 'GENERICO',
            }),
        ],
        [
          'configuración ausente',
          () => {
            delete valoresConfiguracion.IA_V2_BASE_URL;

            return Promise.resolve().then(() =>
              crearServicio().analizarDocumento(SOLICITUD_V2_PRUEBA),
            );
          },
        ],
      ];

      for (const [, ejecutar] of escenarios) {
        const error = await capturarError(ejecutar());

        expect(error.message).not.toContain(TEXTO_DOCUMENTO_PRUEBA);
      }
    });
  });
});
