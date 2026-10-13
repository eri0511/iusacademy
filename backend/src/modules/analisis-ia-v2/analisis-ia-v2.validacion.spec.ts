import { describe, expect, it } from '@jest/globals';

import { validarContratoV11 } from './analisis-ia-v2.validacion';

import {
  crearCorreccionLlm,
  crearFundamentacionNoEvaluada,
  crearResultadoV11,
  crearRevisionLlm,
} from './analisis-ia-v2.fixture';

import type { ResultadoAnalisisFinalV11Dto } from './dto/analizar-documento-v2.dto';

function clonar(): ResultadoAnalisisFinalV11Dto {
  return crearResultadoV11();
}

function comoRegistro(
  datos: ResultadoAnalisisFinalV11Dto,
): Record<string, unknown> {
  return datos as unknown as Record<string, unknown>;
}

describe('validarContratoV11', () => {
  it('debe aceptar una respuesta válida con las 16 secciones', () => {
    expect(validarContratoV11(crearResultadoV11())).toEqual([]);
  });

  it('debe aceptar campos opcionales en null y conservarlos', () => {
    const datos = crearResultadoV11({
      resumen: null,
      fragmentos: [
        {
          identificador: '0',
          indice: 0,
          texto: 'Texto del fragmento',
          componente: 'GENERICO',
          inicio: 0,
          fin: 20,
        },
      ],
      observaciones: [
        {
          id: 'obs-001',
          tipo: 'ESTRUCTURA',
          nivel: 'INFORMATIVO',
          titulo: 'Observación',
          mensaje: 'Mensaje de observación',
          fragmento_indice: null,
        },
      ],
    });

    expect(validarContratoV11(datos)).toEqual([]);
  });

  it('debe aceptar legibilidad con estructura completa', () => {
    const datos = clonar();

    datos.metricas.legibilidad = {
      claridad: {
        cantidad_caracteres: 100,
        cantidad_palabras: 20,
        cantidad_oraciones: 2,
        promedio_caracteres_por_palabra: 5,
        promedio_caracteres_por_oracion: 50,
      },
      silabas: {
        cantidad_silabas: 40,
        cantidad_palabras: 20,
        cantidad_palabras_sin_silabas: 0,
        promedio_silabas_por_palabra: 2,
      },
      frases: {
        cantidad_frases: 2,
      },
      ifsz: {
        valor: 50,
        aplicable: true,
        motivo_no_aplicable: null,
      },
      interpretacion_ifsz: {
        nivel: 'normal',
        descripcion: 'texto intermedio',
        aplicable: true,
        motivo_no_aplicable: null,
      },
    };

    expect(validarContratoV11(datos)).toEqual([]);
  });

  it('debe rechazar una respuesta que no sea un objeto', () => {
    expect(validarContratoV11('<html>error</html>')).toEqual([
      'la respuesta no es un objeto JSON',
    ]);

    expect(validarContratoV11(null)).toEqual([
      'la respuesta no es un objeto JSON',
    ]);

    expect(validarContratoV11([])).toEqual([
      'la respuesta no es un objeto JSON',
    ]);
  });

  it('debe rechazar la ausencia de una sección', () => {
    const datos = comoRegistro(clonar());

    delete datos.observaciones;

    expect(validarContratoV11(datos)).toEqual([
      'falta la sección observaciones',
    ]);
  });

  it('debe rechazar la ausencia de revision_llm', () => {
    const datos = comoRegistro(clonar());

    delete datos.revision_llm;

    expect(validarContratoV11(datos)).toEqual([
      'falta la sección revision_llm',
    ]);
  });

  it('debe rechazar secciones desconocidas', () => {
    const datos = comoRegistro(clonar());

    datos.campo_extra = 'valor';

    expect(validarContratoV11(datos)).toEqual([
      'la respuesta contiene secciones desconocidas',
    ]);
  });

  it('debe rechazar versiones distintas de 1.1', () => {
    const datos = clonar();

    datos.version_contrato = '1.0' as unknown as '1.1';

    expect(validarContratoV11(datos)).toContain(
      'version_contrato debe ser 1.1',
    );
  });

  it('debe rechazar un estado de revisión no permitido', () => {
    const datos = crearResultadoV11({
      revision_llm: {
        ...crearRevisionLlm(),
        estado: 'inactivo',
      } as never,
    });

    expect(validarContratoV11(datos)).toContain(
      'revision_llm.estado no es un valor permitido',
    );
  });

  it('debe rechazar un tipo de proveedor no permitido', () => {
    const datos = crearResultadoV11({
      revision_llm: {
        ...crearRevisionLlm(),
        tipo_proveedor: 'openai',
      } as never,
    });

    expect(validarContratoV11(datos)).toContain(
      'revision_llm.tipo_proveedor no es un valor permitido',
    );
  });

  it('debe exigir detalle_error cuando el estado es error', () => {
    const datos = crearResultadoV11({
      revision_llm: crearRevisionLlm({
        estado: 'error',
      }),
    });

    expect(validarContratoV11(datos)).toContain(
      'revision_llm.detalle_error debe ser un texto no vacío cuando estado es error',
    );
  });

  it('debe rechazar detalle_error cuando el estado no es error', () => {
    const datos = crearResultadoV11({
      revision_llm: crearRevisionLlm({
        estado: 'completado',
        tipo_proveedor: 'real',
        detalle_error: 'boom',
      }),
    });

    expect(validarContratoV11(datos)).toContain(
      'revision_llm.detalle_error debe ser null cuando el estado no es error',
    );
  });

  it('debe aceptar una revisión en estado error con su detalle', () => {
    const datos = crearResultadoV11({
      revision_llm: crearRevisionLlm({
        estado: 'error',
        tipo_proveedor: 'real',
        detalle_error: 'tiempo agotado',
      }),
    });

    expect(validarContratoV11(datos)).toEqual([]);
  });

  it('debe rechazar una corrección con fin menor que inicio', () => {
    const datos = crearResultadoV11({
      revision_llm: crearRevisionLlm({
        estado: 'completado',
        tipo_proveedor: 'mock',
        correcciones: [
          crearCorreccionLlm({
            inicio: 5,
            fin: 3,
          }),
        ],
      }),
    });

    expect(validarContratoV11(datos).join('; ')).toContain(
      'fin no puede ser menor que inicio',
    );
  });

  it('debe rechazar una corrección con offsets utf16 invertidos', () => {
    const datos = crearResultadoV11({
      revision_llm: crearRevisionLlm({
        estado: 'completado',
        tipo_proveedor: 'mock',
        correcciones: [
          crearCorreccionLlm({
            inicio_utf16: 8,
            fin_utf16: 4,
          }),
        ],
      }),
    });

    expect(validarContratoV11(datos).join('; ')).toContain(
      'fin_utf16 no puede ser menor que inicio_utf16',
    );
  });

  it('debe rechazar offsets negativos', () => {
    const datos = crearResultadoV11({
      revision_llm: crearRevisionLlm({
        estado: 'completado',
        tipo_proveedor: 'mock',
        correcciones: [
          crearCorreccionLlm({
            inicio: -1,
          }),
        ],
      }),
    });

    expect(validarContratoV11(datos).join('; ')).toContain(
      'revision_llm.correcciones[0].inicio debe ser un entero no negativo',
    );
  });

  it('debe rechazar un estado de validación no permitido', () => {
    const datos = crearResultadoV11({
      revision_llm: crearRevisionLlm({
        estado: 'completado',
        tipo_proveedor: 'real',
        correcciones: [
          crearCorreccionLlm({
            estado_validacion: 'aprobada',
          } as never),
        ],
      }),
    });

    expect(validarContratoV11(datos).join('; ')).toContain(
      'revision_llm.correcciones[0].estado_validacion no es un valor permitido',
    );
  });

  it('debe rechazar un estado de verificación no permitido', () => {
    const datos = crearResultadoV11({
      revision_llm: crearRevisionLlm({
        estado: 'completado',
        tipo_proveedor: 'real',
        correcciones: [
          crearCorreccionLlm({
            referencias: [
              {
                fuente_id: 'codigo-civil',
                articulo: null,
                texto_evidencia: null,
                estado_verificacion: 'verificada',
              } as never,
            ],
          }),
        ],
      }),
    });

    expect(validarContratoV11(datos).join('; ')).toContain(
      'revision_llm.correcciones[0].referencias[0].estado_verificacion no es un valor permitido',
    );
  });

  it('debe rechazar una corrección rechazada sin motivo', () => {
    const datos = crearResultadoV11({
      revision_llm: crearRevisionLlm({
        correcciones_rechazadas: [
          {
            id_observacion: 'obs-v11-009',
            id_fragmento: '9',
          } as never,
        ],
      }),
    });

    expect(validarContratoV11(datos).join('; ')).toContain(
      'revision_llm.correcciones_rechazadas[0]: falta el campo motivo',
    );
  });

  it('debe rechazar campos desconocidos dentro de revision_llm', () => {
    const datos = crearResultadoV11({
      revision_llm: {
        ...crearRevisionLlm(),
        proveedor_extra: 'valor',
      } as never,
    });

    expect(validarContratoV11(datos)).toContain(
      'revision_llm: contiene campos desconocidos',
    );
  });

  it('debe rechazar un tipo de documento no permitido', () => {
    const datos = clonar();

    datos.documento.tipo_documento = 'FACTURA' as never;

    expect(validarContratoV11(datos)).toContain(
      'documento.tipo_documento no es un valor permitido',
    );
  });

  it('debe rechazar un componente no permitido en fragmentos', () => {
    const datos = clonar();

    datos.fragmentos[0].componente = 'INVENTADO' as never;

    expect(validarContratoV11(datos)).toContain(
      'fragmentos[0].componente no es un valor permitido',
    );
  });

  it('debe rechazar un nivel de observación no permitido', () => {
    const datos = clonar();

    datos.observaciones[0].nivel = 'CRITICO' as never;

    expect(validarContratoV11(datos)).toContain(
      'observaciones[0].nivel no es un valor permitido',
    );
  });

  it('debe rechazar metadatos con valores anidados', () => {
    const datos = clonar();

    datos.metadatos.anidado = { clave: 'valor' } as never;

    expect(validarContratoV11(datos).join('; ')).toContain(
      'metadatos: el valor de anidado debe ser un texto, número, booleano o null',
    );
  });

  it('debe rechazar métricas estructurales inconsistentes', () => {
    const datos = clonar();

    datos.estructura.cumplimiento = null;

    expect(validarContratoV11(datos).join('; ')).toContain(
      'estructura.cumplimiento debe ser una puntuación entre 0 y 1',
    );
  });

  it('debe rechazar estructura no evaluada con contadores', () => {
    const datos = clonar();

    datos.estructura = {
      evaluado: false,
      total_esperados: 5,
      presentes: 4,
      ausentes: 1,
      cumplimiento: 0.8,
    };

    const problemas = validarContratoV11(datos);

    expect(problemas).toContain(
      'estructura.cumplimiento debe ser null cuando evaluado es false',
    );

    expect(problemas).toContain(
      'estructura.total_esperados debe ser 0 cuando evaluado es false',
    );
  });

  it('debe rechazar métricas que no coinciden con coherencia', () => {
    const datos = clonar();

    datos.metricas.coherencia = 0.2;

    expect(validarContratoV11(datos)).toContain(
      'metricas.coherencia debe coincidir con coherencia.valor',
    );
  });

  it('debe rechazar identificadores de fragmento duplicados', () => {
    const datos = clonar();

    datos.fragmentos = [datos.fragmentos[0], { ...datos.fragmentos[0] }];

    expect(validarContratoV11(datos)).toContain(
      'fragmentos: no se permiten identificadores duplicados',
    );
  });

  it('debe rechazar referencias a fragmentos inexistentes', () => {
    const datos = clonar();

    datos.requisitos[0].fragmentos_relacionados = ['999'];

    expect(validarContratoV11(datos)).toContain(
      'requisitos[0].fragmentos_relacionados referencia un fragmento inexistente',
    );
  });

  it('debe rechazar resumen con tipo inválido', () => {
    const datos = comoRegistro(clonar());

    datos.resumen = 42;

    expect(validarContratoV11(datos)).toContain(
      'resumen debe ser un texto o null',
    );
  });

  it('debe rechazar redaccion con valor numérico', () => {
    const datos = clonar();

    datos.metricas.redaccion = 0.5 as never;

    expect(validarContratoV11(datos)).toContain(
      'metricas.redaccion debe ser null',
    );
  });

  it('debe rechazar correcciones que no sean una lista', () => {
    const datos = crearResultadoV11({
      revision_llm: {
        ...crearRevisionLlm(),
        correcciones: {},
      } as never,
    });

    expect(validarContratoV11(datos)).toContain(
      'revision_llm.correcciones debe ser una lista',
    );
  });
});

describe('validarContratoV11 — fundamentación', () => {
  it('debe aceptar fundamentación evaluada con puntuaciones numéricas', () => {
    expect(validarContratoV11(crearResultadoV11())).toEqual([]);
  });

  it('debe aceptar fundamentación no evaluada con NO_EVALUADA y puntuaciones null', () => {
    const datos = crearResultadoV11({
      fundamentacion: crearFundamentacionNoEvaluada(),
      metricas: {
        ...crearResultadoV11().metricas,
        fundamentacion_juridica: null,
      },
    });

    expect(validarContratoV11(datos)).toEqual([]);
  });

  it('debe aceptar estado NO_EVALUADA solo como valor del enum', () => {
    const datos = crearResultadoV11({
      fundamentacion: crearFundamentacionNoEvaluada({
        estado: 'NO_EVALUADA' as never,
      }),
      metricas: {
        ...crearResultadoV11().metricas,
        fundamentacion_juridica: null,
      },
    });

    expect(validarContratoV11(datos)).toEqual([]);
  });

  it('debe rechazar estado NO_EVALUADA cuando evaluada es true', () => {
    const datos = crearResultadoV11({
      fundamentacion: crearFundamentacionNoEvaluada({
        estado: 'NO_EVALUADA',
        cantidad_evidencias: 3,
        puntuacion_recuperacion: 0.75,
        puntuacion_respaldo: 0.8,
        evaluada: true,
      }),
    });

    expect(validarContratoV11(datos)).toContain(
      'fundamentacion.estado no puede ser NO_EVALUADA cuando evaluada es true',
    );
  });

  it('debe rechazar estado distinto de NO_EVALUADA cuando evaluada es false', () => {
    const datos = crearResultadoV11({
      fundamentacion: crearFundamentacionNoEvaluada({
        estado: 'SIN_EVIDENCIA',
      }),
      metricas: {
        ...crearResultadoV11().metricas,
        fundamentacion_juridica: null,
      },
    });

    expect(validarContratoV11(datos)).toContain(
      'fundamentacion.estado debe ser NO_EVALUADA cuando evaluada es false',
    );
  });

  it('debe rechazar puntuación numérica cuando evaluada es false', () => {
    const datos = crearResultadoV11({
      fundamentacion: crearFundamentacionNoEvaluada({
        puntuacion_recuperacion: 0.5,
      }),
      metricas: {
        ...crearResultadoV11().metricas,
        fundamentacion_juridica: null,
      },
    });

    expect(validarContratoV11(datos)).toContain(
      'fundamentacion.puntuacion_recuperacion debe ser null cuando evaluada es false',
    );
  });

  it('debe rechazar puntuación de respaldo numérica cuando evaluada es false', () => {
    const datos = crearResultadoV11({
      fundamentacion: crearFundamentacionNoEvaluada({
        puntuacion_respaldo: 0.5,
      }),
      metricas: {
        ...crearResultadoV11().metricas,
        fundamentacion_juridica: null,
      },
    });

    expect(validarContratoV11(datos)).toContain(
      'fundamentacion.puntuacion_respaldo debe ser null cuando evaluada es false',
    );
  });

  it('debe rechazar evidencias cuando evaluada es false', () => {
    const datos = crearResultadoV11({
      fundamentacion: crearFundamentacionNoEvaluada({
        cantidad_evidencias: 2,
      }),
      metricas: {
        ...crearResultadoV11().metricas,
        fundamentacion_juridica: null,
      },
    });

    expect(validarContratoV11(datos)).toContain(
      'fundamentacion.cantidad_evidencias debe ser 0 cuando evaluada es false',
    );
  });

  it('debe rechazar puntuaciones null cuando evaluada es true', () => {
    const datos = crearResultadoV11({
      fundamentacion: {
        estado: 'RESPALDADA',
        cantidad_evidencias: 3,
        puntuacion_recuperacion: null,
        puntuacion_respaldo: null,
        evaluada: true,
      },
    });

    expect(validarContratoV11(datos)).toContain(
      'fundamentacion.puntuacion_recuperacion debe ser una puntuación entre 0 y 1',
    );

    expect(validarContratoV11(datos)).toContain(
      'fundamentacion.puntuacion_respaldo debe ser una puntuación entre 0 y 1',
    );
  });

  it('debe rechazar una puntuación fuera de rango cuando evaluada es true', () => {
    const datos = crearResultadoV11({
      fundamentacion: {
        estado: 'RESPALDADA',
        cantidad_evidencias: 3,
        puntuacion_recuperacion: 1.5,
        puntuacion_respaldo: 0.8,
        evaluada: true,
      },
    });

    expect(validarContratoV11(datos)).toContain(
      'fundamentacion.puntuacion_recuperacion debe ser una puntuación entre 0 y 1',
    );
  });

  it('debe rechazar un estado de fundamentación no permitido', () => {
    const datos = crearResultadoV11({
      fundamentacion: {
        estado: 'INEXISTENTE' as never,
        cantidad_evidencias: 3,
        puntuacion_recuperacion: 0.75,
        puntuacion_respaldo: 0.8,
        evaluada: true,
      },
    });

    expect(validarContratoV11(datos)).toContain(
      'fundamentacion.estado no es un valor permitido',
    );
  });

  it('debe conservar los cinco campos de fundamentación', () => {
    const datos = comoRegistro(crearResultadoV11());

    expect(Object.keys(datos.fundamentacion as object)).toEqual([
      'estado',
      'cantidad_evidencias',
      'puntuacion_recuperacion',
      'puntuacion_respaldo',
      'evaluada',
    ]);
  });
});
