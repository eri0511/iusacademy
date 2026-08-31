export type ResumenDistribucionGrupo = {
  numeroGrupo: number;
  cantidadIntegrantes: number;
};

export type ResultadoDistribucion = {
  totalEstudiantes: number;
  cantidadGrupos: number;
  integrantesPorGrupoSolicitados: number | null;
  tamanos: number[];
  grupos: ResumenDistribucionGrupo[];
  diferenciaMaxima: number;
  esEquilibrada: boolean;
};

export function calcularTamanosPorCantidadGrupos(
  totalEstudiantes: number,
  cantidadGrupos: number,
): number[] {
  if (!Number.isInteger(totalEstudiantes) || totalEstudiantes < 1) {
    throw new Error(
      'La cantidad total de estudiantes debe ser un entero positivo',
    );
  }

  if (!Number.isInteger(cantidadGrupos) || cantidadGrupos < 1) {
    throw new Error('La cantidad de grupos debe ser un entero positivo');
  }

  if (cantidadGrupos > totalEstudiantes) {
    throw new Error('No puede haber más grupos que estudiantes');
  }

  const base = Math.floor(totalEstudiantes / cantidadGrupos);

  const sobrantes = totalEstudiantes % cantidadGrupos;

  return Array.from(
    {
      length: cantidadGrupos,
    },
    (_, indice) => base + (indice < sobrantes ? 1 : 0),
  );
}

export function calcularTamanosPorIntegrantes(
  totalEstudiantes: number,
  integrantesPorGrupo: number,
): number[] {
  if (!Number.isInteger(integrantesPorGrupo) || integrantesPorGrupo < 2) {
    throw new Error('Cada grupo debe tener al menos dos integrantes');
  }

  const cantidadGrupos = Math.ceil(totalEstudiantes / integrantesPorGrupo);

  return calcularTamanosPorCantidadGrupos(totalEstudiantes, cantidadGrupos);
}

export function construirResultadoDistribucion(
  totalEstudiantes: number,
  tamanos: number[],
  integrantesPorGrupoSolicitados: number | null = null,
): ResultadoDistribucion {
  const maximo = Math.max(...tamanos);

  const minimo = Math.min(...tamanos);

  return {
    totalEstudiantes,
    cantidadGrupos: tamanos.length,
    integrantesPorGrupoSolicitados,
    tamanos,
    grupos: tamanos.map((cantidadIntegrantes, indice) => ({
      numeroGrupo: indice + 1,
      cantidadIntegrantes,
    })),
    diferenciaMaxima: maximo - minimo,
    esEquilibrada: maximo - minimo <= 1,
  };
}

export function mezclarElementos<T>(elementos: T[]): T[] {
  const resultado = [...elementos];

  for (let indice = resultado.length - 1; indice > 0; indice -= 1) {
    const destino = Math.floor(Math.random() * (indice + 1));

    [resultado[indice], resultado[destino]] = [
      resultado[destino],
      resultado[indice],
    ];
  }

  return resultado;
}

export function repartirElementos<T>(elementos: T[], tamanos: number[]): T[][] {
  const totalEsperado = tamanos.reduce(
    (acumulado, cantidad) => acumulado + cantidad,
    0,
  );

  if (totalEsperado !== elementos.length) {
    throw new Error(
      'La distribución no coincide con la cantidad de estudiantes',
    );
  }

  const grupos: T[][] = [];

  let posicion = 0;

  for (const cantidad of tamanos) {
    grupos.push(elementos.slice(posicion, posicion + cantidad));

    posicion += cantidad;
  }

  return grupos;
}

export function generarSugerenciasDistribucion(
  totalEstudiantes: number,
): ResultadoDistribucion[] {
  if (totalEstudiantes < 4) {
    return [];
  }

  const maximoGrupos = Math.min(totalEstudiantes, 8);

  const resultados: ResultadoDistribucion[] = [];

  for (
    let cantidadGrupos = 2;
    cantidadGrupos <= maximoGrupos;
    cantidadGrupos += 1
  ) {
    const tamanos = calcularTamanosPorCantidadGrupos(
      totalEstudiantes,
      cantidadGrupos,
    );

    if (Math.min(...tamanos) < 2) {
      continue;
    }

    resultados.push(construirResultadoDistribucion(totalEstudiantes, tamanos));
  }

  return resultados;
}
