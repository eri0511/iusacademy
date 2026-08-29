import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  obtenerMisCalificaciones,
} from '../../services/calificaciones/calificaciones.service';

import type {
  MisCalificacionesRespuesta,
} from '../../types/calificaciones/calificaciones.types';

type Parametros = {
  cursoId: number;
  hitoId?: number;
  token?: string | null;
};

export function useMisCalificaciones({
  cursoId,
  hitoId,
  token,
}: Parametros) {
  const [datos, setDatos] =
    useState<MisCalificacionesRespuesta | null>(null);
  const [cargando, setCargando] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (
      !token ||
      !hitoId ||
      !Number.isInteger(cursoId)
    ) {
      setDatos(null);
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const respuesta =
        await obtenerMisCalificaciones(
          cursoId,
          hitoId,
          token,
        );

      setDatos(respuesta);
    } catch (problema) {
      setDatos(null);
      setError(
        problema instanceof Error
          ? problema.message
          : 'No fue posible cargar tus calificaciones.',
      );
    } finally {
      setCargando(false);
    }
  }, [
    cursoId,
    hitoId,
    token,
  ]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return {
    datos,
    cargando,
    error,
    recargar: cargar,
  };
}
