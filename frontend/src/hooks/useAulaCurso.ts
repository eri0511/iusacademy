import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useAuth,
} from '../auth/AuthContext';

import {
  obtenerAulaCurso,
} from '../services/aulaCurso.service';

import type {
  AulaCursoRespuesta,
  HitoAula,
} from '../types/aulaCurso.types';

type ResultadoUseAulaCurso = {
  aula: AulaCursoRespuesta | null;
  cargando: boolean;
  error: string | null;
  hitoActual: HitoAula | null;
  proximoHito: HitoAula | null;
  hitoInicial: HitoAula | null;
  recargar: () => Promise<void>;
};

export function useAulaCurso(
  cursoId:
    number | null,
): ResultadoUseAulaCurso {
  const {
    sesion,
  } = useAuth();

  const accessToken =
    sesion?.accessToken ??
    '';

  const [
    aula,
    setAula,
  ] =
    useState<AulaCursoRespuesta | null>(
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

  const cargarAula =
    useCallback(
      async () => {
        if (
          !cursoId
        ) {
          setAula(
            null,
          );

          setError(
            'El identificador del curso no es válido.',
          );

          setCargando(
            false,
          );

          return;
        }

        if (
          !accessToken
        ) {
          setAula(
            null,
          );

          setError(
            'No existe una sesión válida.',
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
            await obtenerAulaCurso(
              cursoId,
              accessToken,
            );

          setAula(
            respuesta,
          );
        } catch (
          problema
        ) {
          setAula(
            null,
          );

          setError(
            problema instanceof Error
              ? problema.message
              : 'No fue posible cargar el aula virtual.',
          );
        } finally {
          setCargando(
            false,
          );
        }
      },
      [
        accessToken,
        cursoId,
      ],
    );

  useEffect(
    () => {
      void cargarAula();
    },
    [
      cargarAula,
    ],
  );

  const hitoActual =
    useMemo(
      () =>
        aula?.planificacion.hitos.find(
          (
            hito,
          ) =>
            hito.id ===
            aula.planificacion.hitoActualId,
        ) ??
        null,
      [
        aula,
      ],
    );

  const proximoHito =
    useMemo(
      () =>
        aula?.planificacion.hitos.find(
          (
            hito,
          ) =>
            hito.id ===
            aula.planificacion.proximoHitoId,
        ) ??
        null,
      [
        aula,
      ],
    );

  const hitoInicial =
    useMemo(
      () =>
        hitoActual ??
        proximoHito ??
        aula?.planificacion.hitos[0] ??
        null,
      [
        aula,
        hitoActual,
        proximoHito,
      ],
    );

  return {
    aula,
    cargando,
    error,
    hitoActual,
    proximoHito,
    hitoInicial,

    recargar:
      cargarAula,
  };
}

export default useAulaCurso;