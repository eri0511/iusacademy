import {
  LIMITES_REPORTE,
} from '../constants/reportes.constants';
import {
  ColumnaReporte,
} from '../interfaces/columna-reporte.interface';
import {
  DefinicionReporte,
} from '../interfaces/reporte.interface';
import {
  FilaReporte,
} from '../tipos/reportes.types';

export class DefinicionReporteInvalidaError extends Error {
  constructor(public readonly errores: string[]) {
    super(`La definición del reporte es inválida: ${errores.join('; ')}`);
    this.name = 'DefinicionReporteInvalidaError';
  }
}

function validarColumnas<TFila extends FilaReporte>(
  columnas: Array<ColumnaReporte<TFila>>,
  indiceSeccion: number,
): string[] {
  const errores: string[] = [];
  const claves = new Set<string>();

  if (columnas.length === 0) {
    errores.push(`La sección ${indiceSeccion + 1} no tiene columnas`);
    return errores;
  }

  columnas.forEach((columna, indiceColumna) => {
    const referencia = `sección ${indiceSeccion + 1}, columna ${indiceColumna + 1}`;

    if (!columna.clave.trim()) {
      errores.push(`La ${referencia} no tiene clave`);
    } else if (claves.has(columna.clave)) {
      errores.push(`La clave "${columna.clave}" está repetida en la sección ${indiceSeccion + 1}`);
    } else {
      claves.add(columna.clave);
    }

    if (!columna.etiqueta.trim()) {
      errores.push(`La ${referencia} no tiene etiqueta`);
    }

    if (columna.etiqueta.length > LIMITES_REPORTE.etiquetaColumna) {
      errores.push(`La etiqueta de la ${referencia} supera el límite permitido`);
    }

    if (columna.ancho !== undefined && (!Number.isFinite(columna.ancho) || columna.ancho <= 0)) {
      errores.push(`El ancho de la ${referencia} debe ser mayor que cero`);
    }
  });

  return errores;
}

export function obtenerErroresDefinicionReporte<TFila extends FilaReporte>(
  definicion: DefinicionReporte<TFila>,
): string[] {
  const errores: string[] = [];

  if (!definicion || typeof definicion !== 'object') {
    return ['No se recibió una definición de reporte'];
  }

  if (!definicion.metadatos?.titulo?.trim()) {
    errores.push('El título del reporte es obligatorio');
  } else if (definicion.metadatos.titulo.length > LIMITES_REPORTE.titulo) {
    errores.push('El título del reporte supera el límite permitido');
  }

  if ((definicion.metadatos?.subtitulo?.length ?? 0) > LIMITES_REPORTE.subtitulo) {
    errores.push('El subtítulo del reporte supera el límite permitido');
  }

  if ((definicion.metadatos?.descripcion?.length ?? 0) > LIMITES_REPORTE.descripcion) {
    errores.push('La descripción del reporte supera el límite permitido');
  }

  if (!Array.isArray(definicion.secciones) || definicion.secciones.length === 0) {
    errores.push('El reporte debe contener al menos una sección');
    return errores;
  }

  const ids = new Set<string>();

  definicion.secciones.forEach((seccion, indiceSeccion) => {
    if (!seccion.id?.trim()) {
      errores.push(`La sección ${indiceSeccion + 1} no tiene identificador`);
    } else if (ids.has(seccion.id)) {
      errores.push(`El identificador de sección "${seccion.id}" está repetido`);
    } else {
      ids.add(seccion.id);
    }

    if (!Array.isArray(seccion.filas)) {
      errores.push(`Las filas de la sección ${indiceSeccion + 1} no son válidas`);
    }

    errores.push(...validarColumnas(seccion.columnas ?? [], indiceSeccion));
  });

  return errores;
}

export function validarDefinicionReporte<TFila extends FilaReporte>(
  definicion: DefinicionReporte<TFila>,
): void {
  const errores = obtenerErroresDefinicionReporte(definicion);

  if (errores.length > 0) {
    throw new DefinicionReporteInvalidaError(errores);
  }
}

export function contarRegistrosReporte<TFila extends FilaReporte>(
  definicion: DefinicionReporte<TFila>,
): number {
  return definicion.secciones.reduce(
    (total, seccion) => total + seccion.filas.length,
    0,
  );
}
