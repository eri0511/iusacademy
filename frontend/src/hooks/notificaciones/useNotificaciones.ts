import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../../auth/AuthContext';

import {
  esErrorSesionVencida,
  obtenerMensajeErrorServicio,
} from '../../services/aula/comunicacion-curso.service';

import {
  contarNoLeidas,
  eliminarNotificacion,
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
} from '../../services/notificaciones/notificaciones.service';

import type {
  Notificacion,
} from '../../types/notificaciones/notificacion.types';

export default function useNotificaciones() {
  const navigate =
    useNavigate();

  const {
    accessToken,
    cerrarSesion,
  } = useAuth();

  const mountedRef =
    useRef(true);

  const [
    notificaciones,
    setNotificaciones,
  ] =
    useState<Notificacion[]>(
      [],
    );

  const [
    noLeidas,
    setNoLeidas,
  ] =
    useState(
      0,
    );

  const [
    total,
    setTotal,
  ] =
    useState(
      0,
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(
    () => {
      mountedRef.current =
        true;

      return () => {
        mountedRef.current =
          false;
      };
    },
    [],
  );

  const manejarError =
    useCallback(
      (
        errorCapturado:
          unknown,

        mensajePredeterminado:
          string,
      ): string => {
        if (
          esErrorSesionVencida(
            errorCapturado,
          )
        ) {
          cerrarSesion();

          navigate(
            '/login',
            {
              replace:
                true,
            },
          );

          return 'Tu sesión venció. Inicia sesión nuevamente.';
        }

        return obtenerMensajeErrorServicio(
          errorCapturado,
          mensajePredeterminado,
        );
      },
      [
        cerrarSesion,
        navigate,
      ],
    );

  const cargar =
    useCallback(
      async () => {
        if (!accessToken) {
          setCargando(
            false,
          );

          return;
        }

        try {
          setError(
            null,
          );

          setCargando(
            true,
          );

          const [
            lista,
            conteo,
          ] =
            await Promise.all(
              [
                listarNotificaciones(
                  accessToken,
                ),

                contarNoLeidas(
                  accessToken,
                ),
              ],
            );

          if (
            !mountedRef.current
          ) {
            return;
          }

          setNotificaciones(
            lista.notificaciones,
          );

          setTotal(
            lista.total,
          );

          setNoLeidas(
            conteo.noLeidas,
          );
        } catch (
          errorCapturado
        ) {
          if (
            !mountedRef.current
          ) {
            return;
          }

          setError(
            manejarError(
              errorCapturado,
              'No fue posible cargar las notificaciones.',
            ),
          );
        } finally {
          if (
            mountedRef.current
          ) {
            setCargando(
              false,
            );
          }
        }
      },
      [
        accessToken,
        manejarError,
      ],
    );

  const refrescarConteo =
    useCallback(
      async () => {
        if (!accessToken) {
          return;
        }

        try {
          const conteo =
            await contarNoLeidas(
              accessToken,
            );

          if (
            mountedRef.current
          ) {
            setNoLeidas(
              conteo.noLeidas,
            );
          }
        } catch (
          errorCapturado
        ) {
          manejarError(
            errorCapturado,
            'No fue posible actualizar las notificaciones.',
          );
        }
      },
      [
        accessToken,
        manejarError,
      ],
    );

  const marcarLeida =
    useCallback(
      async (
        id:
          number,
      ) => {
        if (!accessToken) {
          return;
        }

        try {
          await marcarNotificacionLeida(
            id,
            accessToken,
          );

          if (
            !mountedRef.current
          ) {
            return;
          }

          setNotificaciones(
            (listaActual) =>
              listaActual.map(
                (
                  notificacion,
                ) =>
                  notificacion.id ===
                  id
                    ? {
                        ...notificacion,

                        esLeida:
                          true,

                        leidaEn:
                          new Date().toISOString(),
                      }
                    : notificacion,
              ),
          );

          setNoLeidas(
            (cantidad) =>
              Math.max(
                0,
                cantidad -
                  1,
              ),
          );
        } catch (
          errorCapturado
        ) {
          manejarError(
            errorCapturado,
            'No fue posible marcar la notificación como leída.',
          );
        }
      },
      [
        accessToken,
        manejarError,
      ],
    );

  const marcarTodasLeidas =
    useCallback(
      async () => {
        if (!accessToken) {
          return;
        }

        try {
          await marcarTodasNotificacionesLeidas(
            accessToken,
          );

          if (
            !mountedRef.current
          ) {
            return;
          }

          setNotificaciones(
            (listaActual) =>
              listaActual.map(
                (
                  notificacion,
                ) => ({
                  ...notificacion,

                  esLeida:
                    true,

                  leidaEn:
                    new Date().toISOString(),
                }),
              ),
          );

          setNoLeidas(
            0,
          );
        } catch (
          errorCapturado
        ) {
          manejarError(
            errorCapturado,
            'No fue posible marcar todas las notificaciones como leídas.',
          );
        }
      },
      [
        accessToken,
        manejarError,
      ],
    );

  const retirar =
    useCallback(
      async (
        id:
          number,
      ) => {
        if (!accessToken) {
          return;
        }

        try {
          await eliminarNotificacion(
            id,
            accessToken,
          );

          if (
            !mountedRef.current
          ) {
            return;
          }

          setNotificaciones(
            (listaActual) =>
              listaActual.filter(
                (
                  notificacion,
                ) =>
                  notificacion.id !==
                  id,
              ),
          );

          setTotal(
            (cantidad) =>
              Math.max(
                0,
                cantidad -
                  1,
              ),
          );
        } catch (
          errorCapturado
        ) {
          manejarError(
            errorCapturado,
            'No fue posible eliminar la notificación.',
          );
        }
      },
      [
        accessToken,
        manejarError,
      ],
    );

  const limpiarError =
    useCallback(
      () => {
        setError(
          null,
        );
      },
      [],
    );

  return {
    notificaciones,
    total,
    noLeidas,
    cargando,
    error,
    cargar,
    refrescarConteo,
    marcarLeida,
    marcarTodasLeidas,
    retirar,
    limpiarError,
  };
}
