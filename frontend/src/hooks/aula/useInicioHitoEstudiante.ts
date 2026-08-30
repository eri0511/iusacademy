import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  obtenerInicioHitoEstudiante,
} from '../../services/aula/inicioHitoEstudiante.service';

import type {
  InicioHitoEstudianteRespuesta,
} from '../../types/aula/inicioHitoEstudiante.types';

type Opciones = {
  cursoId: number;
  hitoId?: number;
  token?: string | null;
};

export function useInicioHitoEstudiante({
  cursoId,
  hitoId,
  token,
}: Opciones) {
  const [
    datos,
    setDatos,
  ] = useState<InicioHitoEstudianteRespuesta | null>(null);

  const [
    cargando,
    setCargando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const cargar =
    useCallback(
      async () => {
        if (
          !token ||
          !hitoId ||
          !Number.isInteger(cursoId) ||
          cursoId < 1
        ) {
          setDatos(null);
          return;
        }

        try {
          setCargando(true);
          setError(null);

          const respuesta =
            await obtenerInicioHitoEstudiante(
              cursoId,
              hitoId,
              token,
            );

          setDatos(respuesta);
        } catch (problema) {
          setError(
            problema instanceof Error
              ? problema.message
              : 'No fue posible cargar el inicio del hito',
          );
        } finally {
          setCargando(false);
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
    [cargar],
  );

  return {
    datos,
    cargando,
    error,
    recargar: cargar,
  };
}
