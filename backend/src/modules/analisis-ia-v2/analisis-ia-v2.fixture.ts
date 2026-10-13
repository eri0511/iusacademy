import type {
  AnalizarDocumentoV2Dto,
  CorreccionLlmV2Dto,
  FundamentacionV2Dto,
  RevisionLlmV2Dto,
  ResultadoAnalisisFinalV11Dto,
} from './dto/analizar-documento-v2.dto';

export const TEXTO_DOCUMENTO_PRUEBA =
  'El demandante solicita la protección de sus derechos conforme a la norma vigente.';

export const SOLICITUD_V2_PRUEBA: AnalizarDocumentoV2Dto = {
  documento_id: 'doc-v11-001',
  texto: TEXTO_DOCUMENTO_PRUEBA,
  tipo_actividad: 'EXPOSICION',
  tipo_documento: 'EXPOSICION',
};

export function crearRevisionLlm(
  cambios?: Partial<RevisionLlmV2Dto>,
): RevisionLlmV2Dto {
  return {
    estado: 'desactivado',
    tipo_proveedor: 'disabled',
    detalle_error: null,
    correcciones: [],
    correcciones_rechazadas: [],
    ...cambios,
  };
}

export function crearCorreccionLlm(
  cambios?: Partial<CorreccionLlmV2Dto>,
): CorreccionLlmV2Dto {
  return {
    id_observacion: 'obs-v11-001',
    id_fragmento: '0',
    inicio: 0,
    fin: 6,
    inicio_utf16: 0,
    fin_utf16: 6,
    texto_original: 'El dem',
    texto_propuesto: 'El demandante',
    justificacion: 'Precisión terminológica.',
    evidencias: ['REDACCION_CLARIDAD'],
    referencias: [],
    estado_validacion: 'pendiente',
    ...cambios,
  };
}

export function crearFundamentacionNoEvaluada(
  cambios?: Partial<FundamentacionV2Dto>,
): FundamentacionV2Dto {
  return {
    estado: 'NO_EVALUADA',
    cantidad_evidencias: 0,
    puntuacion_recuperacion: null,
    puntuacion_respaldo: null,
    evaluada: false,
    ...cambios,
  };
}

export function crearResultadoV11(
  cambios?: Partial<ResultadoAnalisisFinalV11Dto>,
): ResultadoAnalisisFinalV11Dto {
  return {
    version_contrato: '1.1',
    documento: {
      id: 'doc-001',
      tipo_documento: 'DEMANDA',
    },
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
    resumen: 'Resumen del análisis',
    metricas: {
      cumplimiento_estructural: 0.8,
      cobertura_requisitos: 0.7,
      fundamentacion_juridica: 0.6,
      coherencia: 0.85,
      cobertura_fuentes: 0.5,
      redaccion: null,
      legibilidad: null,
    },
    estructura: {
      evaluado: true,
      total_esperados: 5,
      presentes: 4,
      ausentes: 1,
      cumplimiento: 0.8,
    },
    requisitos: [
      {
        codigo: 'REQ-001',
        descripcion: 'Requisito de prueba',
        estado: 'PRESENTE',
        fragmentos_relacionados: ['0'],
        confianza: 0.9,
        explicacion: 'Explicación',
      },
    ],
    fundamentacion: {
      estado: 'RESPALDADA',
      cantidad_evidencias: 3,
      puntuacion_recuperacion: 0.75,
      puntuacion_respaldo: 0.8,
      evaluada: true,
    },
    coherencia: {
      valor: 0.85,
    },
    cobertura_fuentes: {
      evaluado: true,
      fragmentos_evaluables: 10,
      fragmentos_con_trazabilidad: 5,
      cumplimiento: 0.5,
      alcance_fuentes_disponibles: ['NORMATIVA'],
    },
    fuentes: [
      {
        id: 'fuente-001',
        tipo: 'NORMATIVA',
        titulo: 'Código Civil',
        articulos: ['123'],
        fragmentos_relacionados: ['0'],
      },
    ],
    posible_ia: {
      estado: 'ANALIZADO',
      fragmentos_analizados: 10,
      oraciones_analizadas: 50,
      limitaciones: ['limitacion1'],
    },
    diagnosticos_redaccion: {
      estado: 'ANALIZADO',
      fragmentos_analizados: 10,
    },
    observaciones: [
      {
        id: 'obs-001',
        tipo: 'ESTRUCTURA',
        nivel: 'INFORMATIVO',
        titulo: 'Observación',
        mensaje: 'Mensaje de observación',
        fragmento_indice: '0',
      },
    ],
    metadatos: {
      clave: 'valor',
    },
    revision_llm: crearRevisionLlm(),
    ...cambios,
  };
}
