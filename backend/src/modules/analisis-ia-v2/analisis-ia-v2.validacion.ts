import {
  EstadoComponenteV2,
  EstadoFundamentacionV2,
  EstadoRevisionLlmV2,
  EstadoValidacionCorreccionV2,
  EstadoVerificacionReferenciaV2,
  NivelObservacionV2,
  TipoComponenteJuridicoV2,
  TipoDocumentoV2,
  TipoEvidenciaV2,
  TipoFuenteV2,
  TipoProveedorLlmV2,
} from './dto/analizar-documento-v2.dto';

type Registro = Record<string, unknown>;

const SECCIONES_V11 = [
  'version_contrato',
  'documento',
  'fragmentos',
  'resumen',
  'metricas',
  'estructura',
  'requisitos',
  'fundamentacion',
  'coherencia',
  'cobertura_fuentes',
  'fuentes',
  'posible_ia',
  'diagnosticos_redaccion',
  'observaciones',
  'metadatos',
  'revision_llm',
] as const;

const CLAVES_DOCUMENTO = ['id', 'tipo_documento'];

const CLAVES_FRAGMENTO = [
  'identificador',
  'indice',
  'texto',
  'componente',
  'inicio',
  'fin',
];

const CLAVES_CLARIDAD = [
  'cantidad_caracteres',
  'cantidad_palabras',
  'cantidad_oraciones',
  'promedio_caracteres_por_palabra',
  'promedio_caracteres_por_oracion',
];

const CLAVES_SILABAS = [
  'cantidad_silabas',
  'cantidad_palabras',
  'cantidad_palabras_sin_silabas',
  'promedio_silabas_por_palabra',
];

const CLAVES_FRASES = ['cantidad_frases'];

const CLAVES_IFSZ = ['valor', 'aplicable', 'motivo_no_aplicable'];

const CLAVES_INTERPRETACION_IFSZ = [
  'nivel',
  'descripcion',
  'aplicable',
  'motivo_no_aplicable',
];

const CLAVES_LEGIBILIDAD = [
  'claridad',
  'silabas',
  'frases',
  'ifsz',
  'interpretacion_ifsz',
];

const CLAVES_METRICAS = [
  'cumplimiento_estructural',
  'cobertura_requisitos',
  'fundamentacion_juridica',
  'coherencia',
  'cobertura_fuentes',
  'redaccion',
  'legibilidad',
];

const CLAVES_ESTRUCTURA = [
  'evaluado',
  'total_esperados',
  'presentes',
  'ausentes',
  'cumplimiento',
];

const CLAVES_REQUISITO = [
  'codigo',
  'descripcion',
  'estado',
  'fragmentos_relacionados',
  'confianza',
  'explicacion',
];

const CLAVES_FUNDAMENTACION = [
  'estado',
  'cantidad_evidencias',
  'puntuacion_recuperacion',
  'puntuacion_respaldo',
  'evaluada',
];

const CLAVES_COHERENCIA = ['valor'];

const CLAVES_COBERTURA = [
  'evaluado',
  'fragmentos_evaluables',
  'fragmentos_con_trazabilidad',
  'cumplimiento',
  'alcance_fuentes_disponibles',
];

const CLAVES_FUENTE = [
  'id',
  'tipo',
  'titulo',
  'articulos',
  'fragmentos_relacionados',
];

const CLAVES_POSIBLE_IA = [
  'estado',
  'fragmentos_analizados',
  'oraciones_analizadas',
  'limitaciones',
];

const CLAVES_DIAGNOSTICOS = ['estado', 'fragmentos_analizados'];

const CLAVES_OBSERVACION = [
  'id',
  'tipo',
  'nivel',
  'titulo',
  'mensaje',
  'fragmento_indice',
];

const CLAVES_REVISION = [
  'estado',
  'tipo_proveedor',
  'detalle_error',
  'correcciones',
  'correcciones_rechazadas',
];

const CLAVES_CORRECCION = [
  'id_observacion',
  'id_fragmento',
  'inicio',
  'fin',
  'inicio_utf16',
  'fin_utf16',
  'texto_original',
  'texto_propuesto',
  'justificacion',
  'evidencias',
  'referencias',
  'estado_validacion',
];

const CLAVES_RECHAZADA = ['id_observacion', 'id_fragmento', 'motivo'];

const CLAVES_REFERENCIA = [
  'fuente_id',
  'articulo',
  'texto_evidencia',
  'estado_verificacion',
];

const TIPOS_DOCUMENTO = new Set<string>(Object.values(TipoDocumentoV2));

const TIPOS_COMPONENTE = new Set<string>(
  Object.values(TipoComponenteJuridicoV2),
);

const TIPOS_FUENTE = new Set<string>(Object.values(TipoFuenteV2));

const TIPOS_EVIDENCIA = new Set<string>(Object.values(TipoEvidenciaV2));

const NIVELES_OBSERVACION = new Set<string>(Object.values(NivelObservacionV2));

const ESTADOS_COMPONENTE = new Set<string>(Object.values(EstadoComponenteV2));

const ESTADOS_FUNDAMENTACION = new Set<string>(
  Object.values(EstadoFundamentacionV2),
);

const ESTADOS_REVISION = new Set<string>(Object.values(EstadoRevisionLlmV2));

const TIPOS_PROVEEDOR = new Set<string>(Object.values(TipoProveedorLlmV2));

const ESTADOS_VALIDACION = new Set<string>(
  Object.values(EstadoValidacionCorreccionV2),
);

const ESTADOS_VERIFICACION = new Set<string>(
  Object.values(EstadoVerificacionReferenciaV2),
);

function esObjeto(valor: unknown): valor is Registro {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esTexto(valor: unknown): valor is string {
  return typeof valor === 'string';
}

function esTextoNoVacio(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.length > 0;
}

function esTextoONulo(valor: unknown): boolean {
  return valor === null || typeof valor === 'string';
}

function esEnteroNoNegativo(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isInteger(valor) && valor >= 0;
}

function esPuntuacion(valor: unknown): valor is number {
  return typeof valor === 'number' && valor >= 0 && valor <= 1;
}

function esNoNegativo(valor: unknown): valor is number {
  return typeof valor === 'number' && valor >= 0;
}

function esBooleano(valor: unknown): valor is boolean {
  return typeof valor === 'boolean';
}

function esNulo(valor: unknown): valor is null {
  return valor === null;
}

function esListaDeTextos(valor: unknown): valor is string[] {
  return (
    Array.isArray(valor) &&
    valor.every((elemento) => typeof elemento === 'string')
  );
}

function esListaDeObjetos(valor: unknown): valor is Registro[] {
  return Array.isArray(valor) && valor.every((elemento) => esObjeto(elemento));
}

function perteneceA(conjunto: ReadonlySet<string>, valor: unknown): boolean {
  return typeof valor === 'string' && conjunto.has(valor);
}

function verificarClaves(
  objeto: Registro,
  claves: readonly string[],
  contexto: string,
  problemas: string[],
): void {
  for (const clave of claves) {
    if (!(clave in objeto)) {
      problemas.push(`${contexto}: falta el campo ${clave}`);
    }
  }

  const excedentes = Object.keys(objeto).filter(
    (clave) => !claves.includes(clave),
  ).length;

  if (excedentes > 0) {
    problemas.push(`${contexto}: contiene campos desconocidos`);
  }
}

function verificarEnteroNoNegativo(
  valor: unknown,
  campo: string,
  problemas: string[],
): void {
  if (!esEnteroNoNegativo(valor)) {
    problemas.push(`${campo} debe ser un entero no negativo`);
  }
}

function verificarPuntuacion(
  valor: unknown,
  campo: string,
  problemas: string[],
): void {
  if (!esPuntuacion(valor)) {
    problemas.push(`${campo} debe ser una puntuación entre 0 y 1`);
  }
}

function verificarTextoNoVacio(
  valor: unknown,
  campo: string,
  problemas: string[],
): void {
  if (!esTextoNoVacio(valor)) {
    problemas.push(`${campo} debe ser un texto no vacío`);
  }
}

function verificarTextoONulo(
  valor: unknown,
  campo: string,
  problemas: string[],
): void {
  if (!esTextoONulo(valor)) {
    problemas.push(`${campo} debe ser un texto o null`);
  }
}

function verificarListaDeTextos(
  valor: unknown,
  campo: string,
  problemas: string[],
): void {
  if (!esListaDeTextos(valor)) {
    problemas.push(`${campo} debe ser una lista de textos`);
  }
}

function verificarEnum(
  valor: unknown,
  conjunto: ReadonlySet<string>,
  campo: string,
  problemas: string[],
): void {
  if (!perteneceA(conjunto, valor)) {
    problemas.push(`${campo} no es un valor permitido`);
  }
}

function validarDocumento(valor: unknown, problemas: string[]): void {
  if (!esObjeto(valor)) {
    problemas.push('documento: debe ser un objeto');
    return;
  }

  verificarClaves(valor, CLAVES_DOCUMENTO, 'documento', problemas);

  verificarTextoNoVacio(valor.id, 'documento.id', problemas);

  verificarEnum(
    valor.tipo_documento,
    TIPOS_DOCUMENTO,
    'documento.tipo_documento',
    problemas,
  );
}

function validarFragmentos(valor: unknown, problemas: string[]): void {
  if (!Array.isArray(valor)) {
    problemas.push('fragmentos: debe ser una lista');
    return;
  }

  valor.forEach((fragmento, indice) => {
    const contexto = `fragmentos[${indice}]`;

    if (!esObjeto(fragmento)) {
      problemas.push(`${contexto}: debe ser un objeto`);
      return;
    }

    verificarClaves(fragmento, CLAVES_FRAGMENTO, contexto, problemas);

    verificarTextoNoVacio(
      fragmento.identificador,
      `${contexto}.identificador`,
      problemas,
    );

    verificarEnteroNoNegativo(
      fragmento.indice,
      `${contexto}.indice`,
      problemas,
    );

    verificarTextoNoVacio(fragmento.texto, `${contexto}.texto`, problemas);

    verificarEnum(
      fragmento.componente,
      TIPOS_COMPONENTE,
      `${contexto}.componente`,
      problemas,
    );

    verificarEnteroNoNegativo(
      fragmento.inicio,
      `${contexto}.inicio`,
      problemas,
    );

    verificarEnteroNoNegativo(fragmento.fin, `${contexto}.fin`, problemas);
  });
}

function validarLegibilidad(valor: unknown, problemas: string[]): void {
  if (valor === null) {
    return;
  }

  if (!esObjeto(valor)) {
    problemas.push('metricas.legibilidad: debe ser un objeto o null');
    return;
  }

  verificarClaves(valor, CLAVES_LEGIBILIDAD, 'metricas.legibilidad', problemas);

  validarLegibilidadClaridad(valor.claridad, problemas);
  validarLegibilidadSilabas(valor.silabas, problemas);
  validarLegibilidadFrases(valor.frases, problemas);
  validarLegibilidadIfsz(valor.ifsz, problemas);

  validarLegibilidadInterpretacion(valor.interpretacion_ifsz, problemas);
}

function validarLegibilidadClaridad(valor: unknown, problemas: string[]): void {
  if (!esObjeto(valor)) {
    problemas.push('metricas.legibilidad.claridad: debe ser un objeto');
    return;
  }

  verificarClaves(
    valor,
    CLAVES_CLARIDAD,
    'metricas.legibilidad.claridad',
    problemas,
  );

  for (const clave of CLAVES_CLARIDAD) {
    if (!esNoNegativo(valor[clave])) {
      problemas.push(
        `metricas.legibilidad.claridad.${clave} debe ser un número no negativo`,
      );
    }
  }
}

function validarLegibilidadSilabas(valor: unknown, problemas: string[]): void {
  if (!esObjeto(valor)) {
    problemas.push('metricas.legibilidad.silabas: debe ser un objeto');
    return;
  }

  verificarClaves(
    valor,
    CLAVES_SILABAS,
    'metricas.legibilidad.silabas',
    problemas,
  );

  for (const clave of CLAVES_SILABAS) {
    if (!esNoNegativo(valor[clave])) {
      problemas.push(
        `metricas.legibilidad.silabas.${clave} debe ser un número no negativo`,
      );
    }
  }
}

function validarLegibilidadFrases(valor: unknown, problemas: string[]): void {
  if (!esObjeto(valor)) {
    problemas.push('metricas.legibilidad.frases: debe ser un objeto');
    return;
  }

  verificarClaves(
    valor,
    CLAVES_FRASES,
    'metricas.legibilidad.frases',
    problemas,
  );

  verificarEnteroNoNegativo(
    valor.cantidad_frases,
    'metricas.legibilidad.frases.cantidad_frases',
    problemas,
  );
}

function validarLegibilidadIfsz(valor: unknown, problemas: string[]): void {
  if (!esObjeto(valor)) {
    problemas.push('metricas.legibilidad.ifsz: debe ser un objeto');
    return;
  }

  verificarClaves(valor, CLAVES_IFSZ, 'metricas.legibilidad.ifsz', problemas);

  if (typeof valor.valor !== 'number') {
    problemas.push('metricas.legibilidad.ifsz.valor debe ser un número');
  }

  if (!esBooleano(valor.aplicable)) {
    problemas.push('metricas.legibilidad.ifsz.aplicable debe ser un booleano');
  }

  verificarTextoONulo(
    valor.motivo_no_aplicable,
    'metricas.legibilidad.ifsz.motivo_no_aplicable',
    problemas,
  );
}

function validarLegibilidadInterpretacion(
  valor: unknown,
  problemas: string[],
): void {
  if (!esObjeto(valor)) {
    problemas.push(
      'metricas.legibilidad.interpretacion_ifsz: debe ser un objeto',
    );
    return;
  }

  verificarClaves(
    valor,
    CLAVES_INTERPRETACION_IFSZ,
    'metricas.legibilidad.interpretacion_ifsz',
    problemas,
  );

  verificarTextoONulo(
    valor.nivel,
    'metricas.legibilidad.interpretacion_ifsz.nivel',
    problemas,
  );

  verificarTextoONulo(
    valor.descripcion,
    'metricas.legibilidad.interpretacion_ifsz.descripcion',
    problemas,
  );

  if (!esBooleano(valor.aplicable)) {
    problemas.push(
      'metricas.legibilidad.interpretacion_ifsz.aplicable debe ser un booleano',
    );
  }

  verificarTextoONulo(
    valor.motivo_no_aplicable,
    'metricas.legibilidad.interpretacion_ifsz.motivo_no_aplicable',
    problemas,
  );
}

function validarMetricas(valor: unknown, problemas: string[]): void {
  if (!esObjeto(valor)) {
    problemas.push('metricas: debe ser un objeto');
    return;
  }

  verificarClaves(valor, CLAVES_METRICAS, 'metricas', problemas);

  const puntuaciones = [
    'cumplimiento_estructural',
    'cobertura_requisitos',
    'fundamentacion_juridica',
    'coherencia',
    'cobertura_fuentes',
  ];

  for (const clave of puntuaciones) {
    const puntaje = valor[clave];

    if (esNulo(puntaje)) {
      continue;
    }

    verificarPuntuacion(puntaje, `metricas.${clave}`, problemas);
  }

  if (!esNulo(valor.redaccion)) {
    problemas.push('metricas.redaccion debe ser null');
  }

  validarLegibilidad(valor.legibilidad, problemas);
}

function validarEstructura(valor: unknown, problemas: string[]): void {
  if (!esObjeto(valor)) {
    problemas.push('estructura: debe ser un objeto');
    return;
  }

  verificarClaves(valor, CLAVES_ESTRUCTURA, 'estructura', problemas);

  if (!esBooleano(valor.evaluado)) {
    problemas.push('estructura.evaluado debe ser un booleano');
    return;
  }

  verificarEnteroNoNegativo(
    valor.total_esperados,
    'estructura.total_esperados',
    problemas,
  );

  verificarEnteroNoNegativo(valor.presentes, 'estructura.presentes', problemas);

  verificarEnteroNoNegativo(valor.ausentes, 'estructura.ausentes', problemas);

  if (valor.evaluado) {
    verificarPuntuacion(
      valor.cumplimiento,
      'estructura.cumplimiento',
      problemas,
    );

    if (
      typeof valor.total_esperados === 'number' &&
      valor.total_esperados <= 0
    ) {
      problemas.push(
        'estructura.total_esperados debe ser mayor que 0 cuando evaluado es true',
      );
    }

    if (
      typeof valor.total_esperados === 'number' &&
      typeof valor.presentes === 'number' &&
      (valor.presentes < 0 || valor.presentes > valor.total_esperados)
    ) {
      problemas.push('estructura.presentes fuera de rango');
    }

    if (
      typeof valor.total_esperados === 'number' &&
      typeof valor.presentes === 'number' &&
      typeof valor.ausentes === 'number' &&
      valor.ausentes !== valor.total_esperados - valor.presentes
    ) {
      problemas.push(
        'estructura.ausentes debe coincidir con total_esperados menos presentes',
      );
    }

    return;
  }

  if (!esNulo(valor.cumplimiento)) {
    problemas.push(
      'estructura.cumplimiento debe ser null cuando evaluado es false',
    );
  }

  if (valor.total_esperados !== 0) {
    problemas.push(
      'estructura.total_esperados debe ser 0 cuando evaluado es false',
    );
  }

  if (valor.presentes !== 0) {
    problemas.push('estructura.presentes debe ser 0 cuando evaluado es false');
  }

  if (valor.ausentes !== 0) {
    problemas.push('estructura.ausentes debe ser 0 cuando evaluado es false');
  }
}

function validarRequisitos(valor: unknown, problemas: string[]): void {
  if (!Array.isArray(valor)) {
    problemas.push('requisitos: debe ser una lista');
    return;
  }

  valor.forEach((requisito, indice) => {
    const contexto = `requisitos[${indice}]`;

    if (!esObjeto(requisito)) {
      problemas.push(`${contexto}: debe ser un objeto`);
      return;
    }

    verificarClaves(requisito, CLAVES_REQUISITO, contexto, problemas);

    verificarTextoNoVacio(requisito.codigo, `${contexto}.codigo`, problemas);

    verificarTextoNoVacio(
      requisito.descripcion,
      `${contexto}.descripcion`,
      problemas,
    );

    verificarEnum(
      requisito.estado,
      ESTADOS_COMPONENTE,
      `${contexto}.estado`,
      problemas,
    );

    verificarListaDeTextos(
      requisito.fragmentos_relacionados,
      `${contexto}.fragmentos_relacionados`,
      problemas,
    );

    verificarPuntuacion(
      requisito.confianza,
      `${contexto}.confianza`,
      problemas,
    );

    verificarTextoONulo(
      requisito.explicacion,
      `${contexto}.explicacion`,
      problemas,
    );
  });
}

function validarFundamentacion(valor: unknown, problemas: string[]): void {
  if (!esObjeto(valor)) {
    problemas.push('fundamentacion: debe ser un objeto');
    return;
  }

  verificarClaves(valor, CLAVES_FUNDAMENTACION, 'fundamentacion', problemas);

  verificarEnum(
    valor.estado,
    ESTADOS_FUNDAMENTACION,
    'fundamentacion.estado',
    problemas,
  );

  verificarEnteroNoNegativo(
    valor.cantidad_evidencias,
    'fundamentacion.cantidad_evidencias',
    problemas,
  );

  if (!esBooleano(valor.evaluada)) {
    problemas.push('fundamentacion.evaluada debe ser un booleano');
    return;
  }

  if (!valor.evaluada) {
    if (valor.estado !== 'NO_EVALUADA') {
      problemas.push(
        'fundamentacion.estado debe ser NO_EVALUADA cuando evaluada es false',
      );
    }

    if (!esNulo(valor.puntuacion_recuperacion)) {
      problemas.push(
        'fundamentacion.puntuacion_recuperacion debe ser null cuando evaluada es false',
      );
    }

    if (!esNulo(valor.puntuacion_respaldo)) {
      problemas.push(
        'fundamentacion.puntuacion_respaldo debe ser null cuando evaluada es false',
      );
    }

    if (valor.cantidad_evidencias !== 0) {
      problemas.push(
        'fundamentacion.cantidad_evidencias debe ser 0 cuando evaluada es false',
      );
    }

    return;
  }

  if (valor.estado === 'NO_EVALUADA') {
    problemas.push(
      'fundamentacion.estado no puede ser NO_EVALUADA cuando evaluada es true',
    );
  }

  verificarPuntuacion(
    valor.puntuacion_recuperacion,
    'fundamentacion.puntuacion_recuperacion',
    problemas,
  );

  verificarPuntuacion(
    valor.puntuacion_respaldo,
    'fundamentacion.puntuacion_respaldo',
    problemas,
  );
}

function validarCoherencia(valor: unknown, problemas: string[]): void {
  if (!esObjeto(valor)) {
    problemas.push('coherencia: debe ser un objeto');
    return;
  }

  verificarClaves(valor, CLAVES_COHERENCIA, 'coherencia', problemas);

  verificarPuntuacion(valor.valor, 'coherencia.valor', problemas);
}

function validarCoberturaFuentes(valor: unknown, problemas: string[]): void {
  if (!esObjeto(valor)) {
    problemas.push('cobertura_fuentes: debe ser un objeto');
    return;
  }

  verificarClaves(valor, CLAVES_COBERTURA, 'cobertura_fuentes', problemas);

  if (!esBooleano(valor.evaluado)) {
    problemas.push('cobertura_fuentes.evaluado debe ser un booleano');
    return;
  }

  verificarEnteroNoNegativo(
    valor.fragmentos_evaluables,
    'cobertura_fuentes.fragmentos_evaluables',
    problemas,
  );

  verificarEnteroNoNegativo(
    valor.fragmentos_con_trazabilidad,
    'cobertura_fuentes.fragmentos_con_trazabilidad',
    problemas,
  );

  verificarListaDeTextos(
    valor.alcance_fuentes_disponibles,
    'cobertura_fuentes.alcance_fuentes_disponibles',
    problemas,
  );

  if (valor.evaluado) {
    verificarPuntuacion(
      valor.cumplimiento,
      'cobertura_fuentes.cumplimiento',
      problemas,
    );

    if (
      typeof valor.fragmentos_evaluables === 'number' &&
      valor.fragmentos_evaluables <= 0
    ) {
      problemas.push(
        'cobertura_fuentes.fragmentos_evaluables debe ser mayor que 0 cuando evaluado es true',
      );
    }

    if (
      typeof valor.fragmentos_evaluables === 'number' &&
      typeof valor.fragmentos_con_trazabilidad === 'number' &&
      (valor.fragmentos_con_trazabilidad < 0 ||
        valor.fragmentos_con_trazabilidad > valor.fragmentos_evaluables)
    ) {
      problemas.push(
        'cobertura_fuentes.fragmentos_con_trazabilidad fuera de rango',
      );
    }

    if (
      Array.isArray(valor.alcance_fuentes_disponibles) &&
      valor.alcance_fuentes_disponibles.length === 0
    ) {
      problemas.push(
        'cobertura_fuentes.alcance_fuentes_disponibles no puede estar vacío cuando evaluado es true',
      );
    }

    return;
  }

  if (!esNulo(valor.cumplimiento)) {
    problemas.push(
      'cobertura_fuentes.cumplimiento debe ser null cuando evaluado es false',
    );
  }

  if (valor.fragmentos_evaluables !== 0) {
    problemas.push(
      'cobertura_fuentes.fragmentos_evaluables debe ser 0 cuando evaluado es false',
    );
  }

  if (valor.fragmentos_con_trazabilidad !== 0) {
    problemas.push(
      'cobertura_fuentes.fragmentos_con_trazabilidad debe ser 0 cuando evaluado es false',
    );
  }
}

function validarFuentes(valor: unknown, problemas: string[]): void {
  if (!Array.isArray(valor)) {
    problemas.push('fuentes: debe ser una lista');
    return;
  }

  valor.forEach((fuente, indice) => {
    const contexto = `fuentes[${indice}]`;

    if (!esObjeto(fuente)) {
      problemas.push(`${contexto}: debe ser un objeto`);
      return;
    }

    verificarClaves(fuente, CLAVES_FUENTE, contexto, problemas);

    verificarTextoNoVacio(fuente.id, `${contexto}.id`, problemas);

    verificarEnum(fuente.tipo, TIPOS_FUENTE, `${contexto}.tipo`, problemas);

    verificarTextoNoVacio(fuente.titulo, `${contexto}.titulo`, problemas);

    verificarListaDeTextos(
      fuente.articulos,
      `${contexto}.articulos`,
      problemas,
    );

    verificarListaDeTextos(
      fuente.fragmentos_relacionados,
      `${contexto}.fragmentos_relacionados`,
      problemas,
    );
  });
}

function validarPosibleIa(valor: unknown, problemas: string[]): void {
  if (!esObjeto(valor)) {
    problemas.push('posible_ia: debe ser un objeto');
    return;
  }

  verificarClaves(valor, CLAVES_POSIBLE_IA, 'posible_ia', problemas);

  verificarTextoNoVacio(valor.estado, 'posible_ia.estado', problemas);

  verificarEnteroNoNegativo(
    valor.fragmentos_analizados,
    'posible_ia.fragmentos_analizados',
    problemas,
  );

  verificarEnteroNoNegativo(
    valor.oraciones_analizadas,
    'posible_ia.oraciones_analizadas',
    problemas,
  );

  verificarListaDeTextos(
    valor.limitaciones,
    'posible_ia.limitaciones',
    problemas,
  );
}

function validarDiagnosticosRedaccion(
  valor: unknown,
  problemas: string[],
): void {
  if (!esObjeto(valor)) {
    problemas.push('diagnosticos_redaccion: debe ser un objeto');
    return;
  }

  verificarClaves(
    valor,
    CLAVES_DIAGNOSTICOS,
    'diagnosticos_redaccion',
    problemas,
  );

  verificarTextoNoVacio(
    valor.estado,
    'diagnosticos_redaccion.estado',
    problemas,
  );

  verificarEnteroNoNegativo(
    valor.fragmentos_analizados,
    'diagnosticos_redaccion.fragmentos_analizados',
    problemas,
  );
}

function validarObservaciones(valor: unknown, problemas: string[]): void {
  if (!Array.isArray(valor)) {
    problemas.push('observaciones: debe ser una lista');
    return;
  }

  valor.forEach((observacion, indice) => {
    const contexto = `observaciones[${indice}]`;

    if (!esObjeto(observacion)) {
      problemas.push(`${contexto}: debe ser un objeto`);
      return;
    }

    verificarClaves(observacion, CLAVES_OBSERVACION, contexto, problemas);

    verificarTextoNoVacio(observacion.id, `${contexto}.id`, problemas);

    verificarEnum(
      observacion.tipo,
      TIPOS_EVIDENCIA,
      `${contexto}.tipo`,
      problemas,
    );

    verificarEnum(
      observacion.nivel,
      NIVELES_OBSERVACION,
      `${contexto}.nivel`,
      problemas,
    );

    verificarTextoNoVacio(observacion.titulo, `${contexto}.titulo`, problemas);

    verificarTextoNoVacio(
      observacion.mensaje,
      `${contexto}.mensaje`,
      problemas,
    );

    verificarTextoONulo(
      observacion.fragmento_indice,
      `${contexto}.fragmento_indice`,
      problemas,
    );
  });
}

function esMetadatoValido(valor: unknown): boolean {
  return (
    valor === null ||
    typeof valor === 'string' ||
    typeof valor === 'number' ||
    typeof valor === 'boolean'
  );
}

function validarMetadatos(valor: unknown, problemas: string[]): void {
  if (!esObjeto(valor)) {
    problemas.push('metadatos: debe ser un objeto');
    return;
  }

  for (const clave of Object.keys(valor)) {
    if (!esMetadatoValido(valor[clave])) {
      problemas.push(
        `metadatos: el valor de ${clave} debe ser un texto, número, booleano o null`,
      );
    }
  }
}

function validarReferencias(
  valor: unknown,
  contexto: string,
  problemas: string[],
): void {
  if (!Array.isArray(valor)) {
    problemas.push(`${contexto}.referencias debe ser una lista`);
    return;
  }

  valor.forEach((referencia, indice) => {
    const ubicacion = `${contexto}.referencias[${indice}]`;

    if (!esObjeto(referencia)) {
      problemas.push(`${ubicacion}: debe ser un objeto`);
      return;
    }

    verificarClaves(referencia, CLAVES_REFERENCIA, ubicacion, problemas);

    verificarTextoNoVacio(
      referencia.fuente_id,
      `${ubicacion}.fuente_id`,
      problemas,
    );

    verificarTextoONulo(
      referencia.articulo,
      `${ubicacion}.articulo`,
      problemas,
    );

    verificarTextoONulo(
      referencia.texto_evidencia,
      `${ubicacion}.texto_evidencia`,
      problemas,
    );

    verificarEnum(
      referencia.estado_verificacion,
      ESTADOS_VERIFICACION,
      `${ubicacion}.estado_verificacion`,
      problemas,
    );
  });
}

function validarCorrecciones(valor: unknown, problemas: string[]): void {
  if (!Array.isArray(valor)) {
    problemas.push('revision_llm.correcciones debe ser una lista');
    return;
  }

  valor.forEach((correccion, indice) => {
    const contexto = `revision_llm.correcciones[${indice}]`;

    if (!esObjeto(correccion)) {
      problemas.push(`${contexto}: debe ser un objeto`);
      return;
    }

    verificarClaves(correccion, CLAVES_CORRECCION, contexto, problemas);

    verificarTextoNoVacio(
      correccion.id_observacion,
      `${contexto}.id_observacion`,
      problemas,
    );

    verificarTextoNoVacio(
      correccion.id_fragmento,
      `${contexto}.id_fragmento`,
      problemas,
    );

    verificarEnteroNoNegativo(
      correccion.inicio,
      `${contexto}.inicio`,
      problemas,
    );

    verificarEnteroNoNegativo(correccion.fin, `${contexto}.fin`, problemas);

    verificarEnteroNoNegativo(
      correccion.inicio_utf16,
      `${contexto}.inicio_utf16`,
      problemas,
    );

    verificarEnteroNoNegativo(
      correccion.fin_utf16,
      `${contexto}.fin_utf16`,
      problemas,
    );

    if (
      typeof correccion.inicio === 'number' &&
      typeof correccion.fin === 'number' &&
      correccion.fin < correccion.inicio
    ) {
      problemas.push(`${contexto}.fin no puede ser menor que inicio`);
    }

    if (
      typeof correccion.inicio_utf16 === 'number' &&
      typeof correccion.fin_utf16 === 'number' &&
      correccion.fin_utf16 < correccion.inicio_utf16
    ) {
      problemas.push(
        `${contexto}.fin_utf16 no puede ser menor que inicio_utf16`,
      );
    }

    if (!esTexto(correccion.texto_original)) {
      problemas.push(`${contexto}.texto_original debe ser un texto`);
    }

    verificarTextoONulo(
      correccion.texto_propuesto,
      `${contexto}.texto_propuesto`,
      problemas,
    );

    if (!esTexto(correccion.justificacion)) {
      problemas.push(`${contexto}.justificacion debe ser un texto`);
    }

    verificarListaDeTextos(
      correccion.evidencias,
      `${contexto}.evidencias`,
      problemas,
    );

    verificarEnum(
      correccion.estado_validacion,
      ESTADOS_VALIDACION,
      `${contexto}.estado_validacion`,
      problemas,
    );

    validarReferencias(correccion.referencias, contexto, problemas);
  });
}

function validarCorreccionesRechazadas(
  valor: unknown,
  problemas: string[],
): void {
  if (!Array.isArray(valor)) {
    problemas.push('revision_llm.correcciones_rechazadas debe ser una lista');
    return;
  }

  valor.forEach((rechazada, indice) => {
    const contexto = `revision_llm.correcciones_rechazadas[${indice}]`;

    if (!esObjeto(rechazada)) {
      problemas.push(`${contexto}: debe ser un objeto`);
      return;
    }

    verificarClaves(rechazada, CLAVES_RECHAZADA, contexto, problemas);

    verificarTextoNoVacio(
      rechazada.id_observacion,
      `${contexto}.id_observacion`,
      problemas,
    );

    verificarTextoNoVacio(
      rechazada.id_fragmento,
      `${contexto}.id_fragmento`,
      problemas,
    );

    verificarTextoNoVacio(rechazada.motivo, `${contexto}.motivo`, problemas);
  });
}

function validarRevisionLlm(valor: unknown, problemas: string[]): void {
  if (!esObjeto(valor)) {
    problemas.push('revision_llm: debe ser un objeto');
    return;
  }

  verificarClaves(valor, CLAVES_REVISION, 'revision_llm', problemas);

  verificarEnum(
    valor.estado,
    ESTADOS_REVISION,
    'revision_llm.estado',
    problemas,
  );

  verificarEnum(
    valor.tipo_proveedor,
    TIPOS_PROVEEDOR,
    'revision_llm.tipo_proveedor',
    problemas,
  );

  if (valor.estado === 'error') {
    if (!esTextoNoVacio(valor.detalle_error)) {
      problemas.push(
        'revision_llm.detalle_error debe ser un texto no vacío cuando estado es error',
      );
    }
  } else if (!esNulo(valor.detalle_error)) {
    problemas.push(
      'revision_llm.detalle_error debe ser null cuando el estado no es error',
    );
  }

  validarCorrecciones(valor.correcciones, problemas);

  validarCorreccionesRechazadas(valor.correcciones_rechazadas, problemas);
}

function validarResumen(valor: unknown, problemas: string[]): void {
  if (valor === undefined) {
    problemas.push('resumen: falta el campo');
    return;
  }

  if (!esTextoONulo(valor)) {
    problemas.push('resumen debe ser un texto o null');
  }
}

function validarConsistencia(datos: Registro, problemas: string[]): void {
  const metricas = datos.metricas;

  if (esObjeto(metricas) && esObjeto(datos.coherencia)) {
    const coherenciaMetricas = metricas.coherencia;
    const valorCoherencia = datos.coherencia.valor;

    if (
      !esNulo(coherenciaMetricas) &&
      esPuntuacion(valorCoherencia) &&
      coherenciaMetricas !== valorCoherencia
    ) {
      problemas.push('metricas.coherencia debe coincidir con coherencia.valor');
    }
  }

  if (
    esObjeto(metricas) &&
    esObjeto(datos.estructura) &&
    esObjeto(datos.cobertura_fuentes)
  ) {
    const coberturaMetricas = metricas.cobertura_fuentes;
    const cobertura = datos.cobertura_fuentes;

    if (
      !esNulo(coberturaMetricas) &&
      cobertura.evaluado === true &&
      esPuntuacion(cobertura.cumplimiento) &&
      coberturaMetricas !== cobertura.cumplimiento
    ) {
      problemas.push(
        'metricas.cobertura_fuentes debe coincidir con cobertura_fuentes.cumplimiento',
      );
    }

    const estructuralMetricas = metricas.cumplimiento_estructural;
    const estructura = datos.estructura;

    if (
      !esNulo(estructuralMetricas) &&
      estructura.evaluado === true &&
      esPuntuacion(estructura.cumplimiento) &&
      estructuralMetricas !== estructura.cumplimiento
    ) {
      problemas.push(
        'metricas.cumplimiento_estructural debe coincidir con estructura.cumplimiento',
      );
    }
  }
}

function validarIntegridadFragmentos(
  datos: Registro,
  problemas: string[],
): void {
  if (!esListaDeObjetos(datos.fragmentos)) {
    return;
  }

  const identificadores = datos.fragmentos
    .map((fragmento) => fragmento.identificador)
    .filter(
      (identificador): identificador is string =>
        typeof identificador === 'string',
    );

  const unicos = new Set(identificadores);

  if (unicos.size !== identificadores.length) {
    problemas.push('fragmentos: no se permiten identificadores duplicados');
  }

  const verificarReferencia = (valor: unknown, contexto: string): void => {
    if (!esListaDeTextos(valor)) {
      return;
    }

    for (const referencia of valor) {
      if (!unicos.has(referencia)) {
        problemas.push(`${contexto} referencia un fragmento inexistente`);
      }
    }
  };

  if (esListaDeObjetos(datos.requisitos)) {
    datos.requisitos.forEach((requisito, indice) => {
      verificarReferencia(
        requisito.fragmentos_relacionados,
        `requisitos[${indice}].fragmentos_relacionados`,
      );
    });
  }

  if (esListaDeObjetos(datos.fuentes)) {
    datos.fuentes.forEach((fuente, indice) => {
      verificarReferencia(
        fuente.fragmentos_relacionados,
        `fuentes[${indice}].fragmentos_relacionados`,
      );
    });
  }

  if (esListaDeObjetos(datos.observaciones)) {
    datos.observaciones.forEach((observacion, indice) => {
      const fragmentoIndice = observacion.fragmento_indice;

      if (typeof fragmentoIndice === 'string' && !unicos.has(fragmentoIndice)) {
        problemas.push(
          `observaciones[${indice}].fragmento_indice referencia un fragmento inexistente`,
        );
      }
    });
  }
}

export function validarContratoV11(datos: unknown): string[] {
  const problemas: string[] = [];

  if (!esObjeto(datos)) {
    return ['la respuesta no es un objeto JSON'];
  }

  const faltantes = SECCIONES_V11.filter((seccion) => !(seccion in datos));

  for (const seccion of faltantes) {
    problemas.push(`falta la sección ${seccion}`);
  }

  const desconocidas = Object.keys(datos).filter(
    (clave) => !(SECCIONES_V11 as readonly string[]).includes(clave),
  );

  if (desconocidas.length > 0) {
    problemas.push('la respuesta contiene secciones desconocidas');
  }

  if (faltantes.length > 0) {
    return problemas;
  }

  if (datos.version_contrato !== '1.1') {
    problemas.push('version_contrato debe ser 1.1');
  }

  validarDocumento(datos.documento, problemas);
  validarFragmentos(datos.fragmentos, problemas);
  validarResumen(datos.resumen, problemas);
  validarMetricas(datos.metricas, problemas);
  validarEstructura(datos.estructura, problemas);
  validarRequisitos(datos.requisitos, problemas);

  validarFundamentacion(datos.fundamentacion, problemas);

  validarCoherencia(datos.coherencia, problemas);

  validarCoberturaFuentes(datos.cobertura_fuentes, problemas);

  validarFuentes(datos.fuentes, problemas);
  validarPosibleIa(datos.posible_ia, problemas);

  validarDiagnosticosRedaccion(datos.diagnosticos_redaccion, problemas);

  validarObservaciones(datos.observaciones, problemas);
  validarMetadatos(datos.metadatos, problemas);

  validarRevisionLlm(datos.revision_llm, problemas);

  validarConsistencia(datos, problemas);
  validarIntegridadFragmentos(datos, problemas);

  return problemas;
}
