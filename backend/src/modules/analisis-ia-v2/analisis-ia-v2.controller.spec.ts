import {
  BadGatewayException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { JwtService } from '@nestjs/jwt';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

jest.mock('@nestjs/axios', () => ({
  HttpService: class HttpService {},
  HttpModule: class HttpModule {},
}));

import { Test } from '@nestjs/testing';

import request from 'supertest';

import type { Server } from 'node:http';

import { AnalisisIaV2Controller } from './analisis-ia-v2.controller';

import { AnalisisIaV2Service } from './analisis-ia-v2.service';

import {
  crearResultadoV11,
  SOLICITUD_V2_PRUEBA,
  TEXTO_DOCUMENTO_PRUEBA,
} from './analisis-ia-v2.fixture';

import { AnalizarDocumentoV2Dto } from './dto/analizar-documento-v2.dto';

import type { ResultadoAnalisisFinalV11Dto } from './dto/analizar-documento-v2.dto';

import { Rol } from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { JwtStrategy } from '../auth/strategies/jwt.strategy';

const CLAVE_SECRETA = 'clave-secreta-de-prueba';

const RUTA = '/analisis-ia-v2/documento';

type ServicioSimulado = {
  analizarDocumento: jest.Mock<
    (request: AnalizarDocumentoV2Dto) => Promise<ResultadoAnalisisFinalV11Dto>
  >;
};

type UsuarioPrueba = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correo: string;
  rol: Rol;
  estaActivo: boolean;
  cuentaActivada: boolean;
};

const USUARIOS_PRUEBA: Record<number, UsuarioPrueba> = {
  1: {
    id: 1,
    nombres: 'Docente',
    apellidoPaterno: 'De',
    apellidoMaterno: 'Prueba',
    correo: 'docente@prueba.test',
    rol: Rol.DOCENTE,
    estaActivo: true,
    cuentaActivada: true,
  },
  2: {
    id: 2,
    nombres: 'Estudiante',
    apellidoPaterno: 'De',
    apellidoMaterno: 'Prueba',
    correo: 'estudiante@prueba.test',
    rol: Rol.ESTUDIANTE,
    estaActivo: true,
    cuentaActivada: true,
  },
  3: {
    id: 3,
    nombres: 'Administrador',
    apellidoPaterno: 'De',
    apellidoMaterno: 'Prueba',
    correo: 'administrador@prueba.test',
    rol: Rol.ADMINISTRADOR,
    estaActivo: true,
    cuentaActivada: true,
  },
};

describe('AnalisisIaV2Controller', () => {
  let app: INestApplication;

  let servidor: Server;

  let servicioSimulado: ServicioSimulado;

  function firmarToken(id: number): string {
    const jwtService = new JwtService({
      secret: CLAVE_SECRETA,
    });

    const usuario = USUARIOS_PRUEBA[id];

    return jwtService.sign({
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
    });
  }

  beforeEach(async () => {
    servicioSimulado = {
      analizarDocumento: jest.fn((): Promise<ResultadoAnalisisFinalV11Dto> =>
        Promise.resolve(crearResultadoV11()),
      ),
    };

    const modulo = await Test.createTestingModule({
      controllers: [AnalisisIaV2Controller],
      providers: [
        {
          provide: AnalisisIaV2Service,
          useValue: servicioSimulado,
        },
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: {
            usuario: {
              findUnique: jest.fn((argumentos: { where: { id: number } }) =>
                Promise.resolve(USUARIOS_PRUEBA[argumentos.where.id] ?? null),
              ),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: () => CLAVE_SECRETA,
          },
        },
      ],
    }).compile();

    app = modulo.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    servidor = app.getHttpServer() as Server;
  });

  afterEach(async () => {
    await app.close();
  });

  it('debe rechazar peticiones sin token', async () => {
    const respuesta = await request(servidor)
      .post(RUTA)
      .send(SOLICITUD_V2_PRUEBA);

    expect(respuesta.status).toBe(401);

    expect(servicioSimulado.analizarDocumento).not.toHaveBeenCalled();
  });

  it('debe rechazar peticiones con un token inválido', async () => {
    const respuesta = await request(servidor)
      .post(RUTA)
      .set('Authorization', 'Bearer token-invalido')
      .send(SOLICITUD_V2_PRUEBA);

    expect(respuesta.status).toBe(401);
  });

  it('debe rechazar peticiones con un token firmado con otra clave', async () => {
    const otroToken = new JwtService({
      secret: 'otra-clave',
    }).sign({
      sub: 1,
      correo: 'docente@prueba.test',
      rol: Rol.DOCENTE,
    });

    const respuesta = await request(servidor)
      .post(RUTA)
      .set('Authorization', `Bearer ${otroToken}`)
      .send(SOLICITUD_V2_PRUEBA);

    expect(respuesta.status).toBe(401);
  });

  it('debe rechazar peticiones de estudiantes', async () => {
    const respuesta = await request(servidor)
      .post(RUTA)
      .set('Authorization', `Bearer ${firmarToken(2)}`)
      .send(SOLICITUD_V2_PRUEBA);

    expect(respuesta.status).toBe(403);

    expect(servicioSimulado.analizarDocumento).not.toHaveBeenCalled();
  });

  it('debe rechazar peticiones de administradores', async () => {
    const respuesta = await request(servidor)
      .post(RUTA)
      .set('Authorization', `Bearer ${firmarToken(3)}`)
      .send(SOLICITUD_V2_PRUEBA);

    expect(respuesta.status).toBe(403);
  });

  it('debe permitir peticiones de docentes y pasar la solicitud al servicio', async () => {
    const respuesta = await request(servidor)
      .post(RUTA)
      .set('Authorization', `Bearer ${firmarToken(1)}`)
      .send(SOLICITUD_V2_PRUEBA);

    expect(respuesta.status).toBe(200);

    expect(respuesta.body).toEqual(crearResultadoV11());

    expect(servicioSimulado.analizarDocumento).toHaveBeenCalledTimes(1);

    const solicitud = servicioSimulado.analizarDocumento.mock.calls[0][0];

    expect(solicitud).toBeInstanceOf(AnalizarDocumentoV2Dto);

    expect(solicitud).toMatchObject({
      documento_id: 'doc-v11-001',
      texto: TEXTO_DOCUMENTO_PRUEBA,
      tipo_actividad: 'EXPOSICION',
      tipo_documento: 'EXPOSICION',
    });
  });

  it('debe conservar los null en la respuesta hacia el cliente', async () => {
    servicioSimulado.analizarDocumento.mockResolvedValue(
      crearResultadoV11({
        resumen: null,
      }),
    );

    const respuesta = await request(servidor)
      .post(RUTA)
      .set('Authorization', `Bearer ${firmarToken(1)}`)
      .send(SOLICITUD_V2_PRUEBA);

    expect(respuesta.status).toBe(200);

    const cuerpo = respuesta.body as {
      resumen?: unknown;
    };

    expect(cuerpo.resumen).toBeNull();
  });

  it('debe rechazar una solicitud vacía', async () => {
    const respuesta = await request(servidor)
      .post(RUTA)
      .set('Authorization', `Bearer ${firmarToken(1)}`)
      .send({});

    expect(respuesta.status).toBe(400);

    expect(servicioSimulado.analizarDocumento).not.toHaveBeenCalled();
  });

  it('debe rechazar un texto compuesto solo por espacios', async () => {
    const respuesta = await request(servidor)
      .post(RUTA)
      .set('Authorization', `Bearer ${firmarToken(1)}`)
      .send({
        ...SOLICITUD_V2_PRUEBA,
        texto: '   ',
      });

    expect(respuesta.status).toBe(400);

    expect(servicioSimulado.analizarDocumento).not.toHaveBeenCalled();
  });

  it('debe rechazar un documento_id compuesto solo por espacios', async () => {
    const respuesta = await request(servidor)
      .post(RUTA)
      .set('Authorization', `Bearer ${firmarToken(1)}`)
      .send({
        ...SOLICITUD_V2_PRUEBA,
        documento_id: '  ',
      });

    expect(respuesta.status).toBe(400);
  });

  it('debe rechazar campos desconocidos en la solicitud', async () => {
    const respuesta = await request(servidor)
      .post(RUTA)
      .set('Authorization', `Bearer ${firmarToken(1)}`)
      .send({
        ...SOLICITUD_V2_PRUEBA,
        campo_inesperado: 'valor',
      });

    expect(respuesta.status).toBe(400);

    expect(servicioSimulado.analizarDocumento).not.toHaveBeenCalled();
  });

  it('debe rechazar un tipo de actividad no permitido', async () => {
    const respuesta = await request(servidor)
      .post(RUTA)
      .set('Authorization', `Bearer ${firmarToken(1)}`)
      .send({
        ...SOLICITUD_V2_PRUEBA,
        tipo_actividad: 'INVENTADA',
      });

    expect(respuesta.status).toBe(400);
  });

  it('debe rechazar un tipo de documento no permitido', async () => {
    const respuesta = await request(servidor)
      .post(RUTA)
      .set('Authorization', `Bearer ${firmarToken(1)}`)
      .send({
        ...SOLICITUD_V2_PRUEBA,
        tipo_documento: 'FACTURA',
      });

    expect(respuesta.status).toBe(400);
  });

  it('debe propagar los errores del servicio', async () => {
    servicioSimulado.analizarDocumento.mockRejectedValue(
      new BadGatewayException(
        'El motor de análisis devolvió una respuesta inválida.',
      ),
    );

    const respuesta = await request(servidor)
      .post(RUTA)
      .set('Authorization', `Bearer ${firmarToken(1)}`)
      .send(SOLICITUD_V2_PRUEBA);

    expect(respuesta.status).toBe(502);

    const cuerpo = respuesta.body as {
      message?: unknown;
    };

    expect(String(cuerpo.message)).not.toContain(TEXTO_DOCUMENTO_PRUEBA);
  });

  it('no debe responder rutas distintas a POST documento', async () => {
    const respuesta = await request(servidor)
      .get(RUTA)
      .set('Authorization', `Bearer ${firmarToken(1)}`);

    expect(respuesta.status).toBe(404);
  });
});
