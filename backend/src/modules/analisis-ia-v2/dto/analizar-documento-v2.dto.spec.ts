import { describe, expect, it } from '@jest/globals';

import { plainToInstance } from 'class-transformer';

import { validate } from 'class-validator';

import {
  AnalizarDocumentoV2Dto,
  COMBINACIONES_SOPORTADAS_V2,
} from './analizar-documento-v2.dto';

import { SOLICITUD_V2_PRUEBA } from '../analisis-ia-v2.fixture';

async function validarSolicitud(cuerpo: unknown): Promise<string[]> {
  const dto = plainToInstance(AnalizarDocumentoV2Dto, cuerpo);

  const errores = await validate(dto);

  return errores.map(
    (error) =>
      `${error.property}:${error.constraints ? Object.keys(error.constraints).join(',') : 'sin-restriccion'}`,
  );
}

describe('AnalizarDocumentoV2Dto', () => {
  it('debe aceptar una solicitud válida', async () => {
    expect(await validarSolicitud(SOLICITUD_V2_PRUEBA)).toEqual([]);
  });

  it('debe rechazar una solicitud vacía', async () => {
    const propiedades = (await validarSolicitud({})).map(
      (error) => error.split(':')[0],
    );

    expect(propiedades).toEqual(
      expect.arrayContaining([
        'documento_id',
        'texto',
        'tipo_actividad',
        'tipo_documento',
      ]),
    );
  });

  it('debe rechazar un documento_id vacío', async () => {
    const propiedades = (
      await validarSolicitud({
        ...SOLICITUD_V2_PRUEBA,
        documento_id: '',
      })
    ).map((error) => error.split(':')[0]);

    expect(propiedades).toContain('documento_id');
  });

  it('debe rechazar un documento_id compuesto solo por espacios', async () => {
    const propiedades = (
      await validarSolicitud({
        ...SOLICITUD_V2_PRUEBA,
        documento_id: '   ',
      })
    ).map((error) => error.split(':')[0]);

    expect(propiedades).toContain('documento_id');
  });

  it('debe rechazar un texto compuesto solo por espacios', async () => {
    const propiedades = (
      await validarSolicitud({
        ...SOLICITUD_V2_PRUEBA,
        texto: '   ',
      })
    ).map((error) => error.split(':')[0]);

    expect(propiedades).toContain('texto');
  });

  it('debe rechazar un tipo de actividad desconocido', async () => {
    const propiedades = (
      await validarSolicitud({
        ...SOLICITUD_V2_PRUEBA,
        tipo_actividad: 'INVENTADA',
      })
    ).map((error) => error.split(':')[0]);

    expect(propiedades).toContain('tipo_actividad');
  });

  it('debe rechazar un tipo de documento desconocido', async () => {
    const propiedades = (
      await validarSolicitud({
        ...SOLICITUD_V2_PRUEBA,
        tipo_documento: 'FACTURA',
      })
    ).map((error) => error.split(':')[0]);

    expect(propiedades).toContain('tipo_documento');
  });

  it('debe rechazar tipos no numéricos en documento_id', async () => {
    const propiedades = (
      await validarSolicitud({
        ...SOLICITUD_V2_PRUEBA,
        documento_id: 12345,
      })
    ).map((error) => error.split(':')[0]);

    expect(propiedades).toContain('documento_id');
  });

  it('debe declarar exactamente ocho combinaciones soportadas', () => {
    expect(COMBINACIONES_SOPORTADAS_V2).toHaveLength(8);
  });

  it('debe rechazar combinaciones fuera de la lista soportada', () => {
    const combinaciones = new Set(
      COMBINACIONES_SOPORTADAS_V2.map(
        ([actividad, documento]) => `${actividad}|${documento}`,
      ),
    );

    expect(combinaciones.has('EXPOSICION|DEMANDA')).toBe(false);

    expect(combinaciones.has('MIXTA|GENERICO')).toBe(false);

    expect(combinaciones.has('EXPOSICION|EXPOSICION')).toBe(true);
  });
});
