import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  descargarLibroCalificaciones,
  obtenerLibroCalificacionesDocente,
} from '../../services/calificaciones/calificaciones.service';

import type {
  FormatoReporteCalificaciones,
} from '../../services/calificaciones/calificaciones.service';

import type {
  LibroCalificacionesDocente,
} from '../../types/calificaciones/calificaciones.types';

type Parametros = {
  cursoId: number;
  hitoId?: number;
  token?: string | null;
};

export function useCalificacionesCurso({
  cursoId,
  hitoId,
  token,
}: Parametros) {
  const [datos, setDatos] =
    useState<LibroCalificacionesDocente | null>(null);
  const [cargando, setCargando] =
    useState(true);
  const [formatoExportando, setFormatoExportando] =
    useState<FormatoReporteCalificaciones | null>(null);
  const [error, setError] =
    useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!token || !hitoId || !Number.isInteger(cursoId)) {
      setDatos(null);
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const respuesta =
        await obtenerLibroCalificacionesDocente(
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
          : 'No fue posible cargar el libro de calificaciones.',
      );
    } finally {
      setCargando(false);
    }
  }, [cursoId, hitoId, token]);

  const exportar = useCallback(async (
    formato: FormatoReporteCalificaciones,
  ) => {
    if (!token || !hitoId || !Number.isInteger(cursoId)) {
      return;
    }

    try {
      setFormatoExportando(formato);
      setError(null);

      await descargarLibroCalificaciones(
        cursoId,
        hitoId,
        formato,
        token,
      );
    } catch (problema) {
      setError(
        problema instanceof Error
          ? problema.message
          : `No fue posible generar el reporte ${formato}.`,
      );
    } finally {
      setFormatoExportando(null);
    }
  }, [cursoId, hitoId, token]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return {
    datos,
    cargando,
    formatoExportando,
    error,
    recargar: cargar,
    exportar,
  };
}
