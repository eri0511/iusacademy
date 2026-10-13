import 'reflect-metadata';

import { describe, expect, it, jest } from '@jest/globals';

jest.mock('@nestjs/axios', () => {
  class HttpService {}

  return {
    HttpService,
    HttpModule: {
      module: class HttpModule {},
      providers: [{ provide: HttpService, useValue: new HttpService() }],
      exports: [HttpService],
    },
  };
});

import { RequestMethod } from '@nestjs/common';

import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';

import { ConfigModule } from '@nestjs/config';

import { Test } from '@nestjs/testing';

import { AppModule } from '../../app.module';

import { Rol } from '../../generated/prisma/client';

import { ROLES_KEY } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { AnalisisIaController } from '../analisis-ia/analisis-ia.controller';

import { AnalisisIaModule } from '../analisis-ia/analisis-ia.module';

import { AnalisisIaService } from '../analisis-ia/analisis-ia.service';

import { TareasAnalisisController } from '../tareas/tareas-analisis.controller';

import { TareasModule } from '../tareas/tareas.module';

import { AnalisisIaV2Controller } from './analisis-ia-v2.controller';

import { AnalisisIaV2Module } from './analisis-ia-v2.module';

import { AnalisisIaV2Service } from './analisis-ia-v2.service';

type HttpServiceFalso = ConstructorParameters<typeof AnalisisIaService>[0];

type ConfigServiceFalso = ConstructorParameters<typeof AnalisisIaService>[1];

function configServiceDe(
  valores: Record<string, string | undefined>,
): ConfigServiceFalso {
  return {
    get: (clave: string) => valores[clave],
  } as unknown as ConfigServiceFalso;
}

const httpServiceFalso = {} as HttpServiceFalso;

function manejadorDe(prototipo: object, nombre: string): object {
  return (prototipo as Record<string, unknown>)[nombre] as object;
}

describe('compatibilidad del módulo analisis-ia-v2', () => {
  it('debe mantener la ruta V1 y registrar una ruta V2 sin colisión', () => {
    expect(Reflect.getMetadata(PATH_METADATA, AnalisisIaController)).toBe(
      'analisis-ia',
    );

    expect(Reflect.getMetadata(PATH_METADATA, AnalisisIaV2Controller)).toBe(
      'analisis-ia-v2',
    );
  });

  it('debe conservar el endpoint V1 de prueba sin guards', () => {
    const manejador = manejadorDe(
      AnalisisIaController.prototype,
      'probarAnalisis',
    );

    const metodo: unknown = Reflect.getMetadata(METHOD_METADATA, manejador);

    expect(metodo).toBe(RequestMethod.POST);

    const guards: unknown = Reflect.getMetadata(GUARDS_METADATA, manejador);

    expect(guards).toBeUndefined();
  });

  it('debe conservar el acoplamiento entre Tareas y el módulo V1', () => {
    const importsTareas = Reflect.getMetadata(
      'imports',
      TareasModule,
    ) as unknown[];

    expect(importsTareas).toContain(AnalisisIaModule);
  });

  it('debe conservar guards y rol DOCENTE en el endpoint de Tareas', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      TareasAnalisisController,
    ) as unknown[];

    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));

    const roles: unknown = Reflect.getMetadata(
      ROLES_KEY,
      manejadorDe(TareasAnalisisController.prototype, 'analizarEntrega'),
    );

    expect(roles).toEqual([Rol.DOCENTE]);
  });

  it('debe registrar el módulo V2 en AppModule sin duplicar los existentes', () => {
    const importsApp = Reflect.getMetadata('imports', AppModule) as unknown[];

    expect(importsApp).toContain(AnalisisIaModule);

    expect(importsApp).toContain(AnalisisIaV2Module);

    expect(importsApp).toContain(TareasModule);

    expect(
      importsApp.filter((modulo) => modulo === AnalisisIaModule),
    ).toHaveLength(1);

    expect(
      importsApp.filter((modulo) => modulo === AnalisisIaV2Module),
    ).toHaveLength(1);
  });

  it('debe mantener aisladas las variables de entorno de V1 y V2', () => {
    const servicioV1 = new AnalisisIaService(
      httpServiceFalso,
      configServiceDe({
        IA_SERVICE_URL: 'http://localhost:8000',
        IA_SERVICE_TIMEOUT_MS: '30000',
      }),
    );

    expect(servicioV1).toBeDefined();

    expect(
      () =>
        new AnalisisIaV2Service(
          httpServiceFalso,
          configServiceDe({
            IA_SERVICE_URL: 'http://localhost:8000',
          }),
        ),
    ).toThrow('IA_V2_BASE_URL');
  });

  it('debe compilar el módulo V2 con su inyección de dependencias', async () => {
    const urlPrevia = process.env.IA_V2_BASE_URL;

    process.env.IA_V2_BASE_URL = 'http://localhost:8001/api/v1';

    try {
      const modulo = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
          }),
          AnalisisIaV2Module,
        ],
      }).compile();

      expect(modulo.get(AnalisisIaV2Service)).toBeDefined();

      expect(modulo.get(AnalisisIaV2Controller)).toBeDefined();

      await modulo.close();
    } finally {
      if (urlPrevia === undefined) {
        delete process.env.IA_V2_BASE_URL;
      } else {
        process.env.IA_V2_BASE_URL = urlPrevia;
      }
    }
  });
});
