import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  obtenerInicioHitoDocente,
} from '../../services/aula/inicioHitoDocente.service';

import type {
  InicioHitoDocenteRespuesta,
} from '../../types/aula/inicioHitoDocente.types';

type Parametros = {
  cursoId: number;
  hitoId?: number;
  token?: string | null;
};

export function useInicioHitoDocente({
  cursoId,
  hitoId,
  token,
}: Parametros) {
  const [
    datos,
    setDatos,
  ] =
    useState<InicioHitoDocenteRespuesta | null>(
      null,
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(
      true,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const cargar =
    useCallback(
      async () => {
        if (
          !token ||
          !hitoId ||
          !Number.isInteger(
            cursoId,
          )
        ) {
          setDatos(
            null,
          );
          setCargando(
            false,
          );
          return;
        }

        try {
          setCargando(
            true,
          );
          setError(
            null,
          );

          const respuesta =
            await obtenerInicioHitoDocente(
              cursoId,
              hitoId,
              token,
            );

          setDatos(
            respuesta,
          );
        } catch (
          problema
        ) {
          setDatos(
            null,
          );
          setError(
            problema instanceof Error
              ? problema.message
              : 'No fue posible cargar el resumen del hito.',
          );
        } finally {
          setCargando(
            false,
          );
        }
      },
      [
        cursoId,
        hitoId,
        token,
      ],
    );

  useEffect(
    () => {
      void cargar();
    },
    [
      cargar,
    ],
  );

  return {
    datos,
    cargando,
    error,
    recargar:
      cargar,
  };
}
