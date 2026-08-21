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
  actualizarConjuntoGrupo,
  actualizarGrupoCurso,
  asignarEstudiantesGrupo,
  cambiarBloqueoConjuntoGrupo,
  cambiarRepresentanteGrupo,
  crearConjuntoGrupo,
  crearGrupoCurso,
  eliminarConjuntoGrupo,
  eliminarGrupoCurso,
  importarConjuntoGrupo,
  moverEstudianteGrupo,
  obtenerConjuntosGrupos,
  obtenerDetalleConjuntoGrupo,
  obtenerHistorialConjuntoGrupo,
  obtenerValidacionesCreacionGrupos,
  previsualizarDistribucionGrupos,
  retirarEstudianteGrupo,
} from '../services/grupos.service';

import type {
  ActualizarConjuntoGrupoDatos,
  ActualizarGrupoCursoDatos,
  AsignarEstudiantesGrupoDatos,
  CambiarRepresentanteGrupoDatos,
  ConjuntoGrupoResumen,
  CrearConjuntoGrupoDatos,
  CrearGrupoCursoDatos,
  HistorialGrupoCurso,
  ImportarConjuntoGrupoDatos,
  MoverEstudianteGrupoDatos,
  PrevisualizarDistribucionDatos,
  RespuestaDetalleConjunto,
  RespuestaPrevisualizacionGrupos,
  ValidacionesCreacionGrupos,
} from '../types/grupos.types';

type UseGruposCursoOpciones = {
  cursoId: number;
  hitoId?: number;
  cargarAutomaticamente?: boolean;
};

export default function useGruposCurso({
  cursoId,
  hitoId,
  cargarAutomaticamente =
    true,
}: UseGruposCursoOpciones) {
  const {
    accessToken,
  } =
    useAuth();

  const token =
    accessToken ??
    '';

  const [
    conjuntos,
    setConjuntos,
  ] =
    useState<ConjuntoGrupoResumen[]>(
      [],
    );

  const [
    detalle,
    setDetalle,
  ] =
    useState<RespuestaDetalleConjunto | null>(
      null,
    );

  const [
    previsualizacion,
    setPrevisualizacion,
  ] =
    useState<RespuestaPrevisualizacionGrupos | null>(
      null,
    );

  const [
    validaciones,
    setValidaciones,
  ] =
    useState<ValidacionesCreacionGrupos | null>(
      null,
    );

  const [
    historial,
    setHistorial,
  ] =
    useState<HistorialGrupoCurso[]>(
      [],
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(
      false,
    );

  const [
    actualizando,
    setActualizando,
  ] =
    useState(
      false,
    );

  const [
    procesando,
    setProcesando,
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

  const validarSesion =
    useCallback(
      () => {
        if (!token) {
          throw new Error(
            'La sesión no es válida',
          );
        }
      },
      [
        token,
      ],
    );

  const cargarValidaciones =
    useCallback(
      async (
        mostrarCarga =
          false,
      ) => {
        validarSesion();

        try {
          if (
            mostrarCarga
          ) {
            setActualizando(
              true,
            );
          }

          setError(
            null,
          );

          const respuesta =
            await obtenerValidacionesCreacionGrupos(
              cursoId,
              token,
            );

          setValidaciones(
            respuesta,
          );

          return respuesta;
        } catch (
          problema
        ) {
          setError(
            problema instanceof Error
              ? problema.message
              : 'No fue posible validar la creación de grupos',
          );

          throw problema;
        } finally {
          if (
            mostrarCarga
          ) {
            setActualizando(
              false,
            );
          }
        }
      },
      [
        cursoId,
        token,
        validarSesion,
      ],
    );

  const cargarConjuntos =
    useCallback(
      async (
        mostrarCarga =
          true,
      ) => {
        validarSesion();

        try {
          setError(
            null,
          );

          if (
            mostrarCarga &&
            conjuntos.length ===
              0
          ) {
            setCargando(
              true,
            );
          } else {
            setActualizando(
              true,
            );
          }

          const respuesta =
            await obtenerConjuntosGrupos(
              cursoId,
              token,
              hitoId,
            );

          setConjuntos(
            respuesta,
          );
        } catch (
          problema
        ) {
          const mensaje =
            problema instanceof Error
              ? problema.message
              : 'No fue posible cargar los grupos';

          setError(
            mensaje,
          );

          throw problema;
        } finally {
          setCargando(
            false,
          );

          setActualizando(
            false,
          );
        }
      },
      [
        conjuntos.length,
        cursoId,
        hitoId,
        token,
        validarSesion,
      ],
    );

  const cargarDetalle =
    useCallback(
      async (
        conjuntoId:
          number,
      ) => {
        validarSesion();

        try {
          setError(
            null,
          );

          setActualizando(
            true,
          );

          const respuesta =
            await obtenerDetalleConjuntoGrupo(
              cursoId,
              conjuntoId,
              token,
            );

          setDetalle(
            respuesta,
          );

          return respuesta;
        } catch (
          problema
        ) {
          setError(
            problema instanceof Error
              ? problema.message
              : 'No fue posible cargar el conjunto',
          );

          throw problema;
        } finally {
          setActualizando(
            false,
          );
        }
      },
      [
        cursoId,
        token,
        validarSesion,
      ],
    );

  const ejecutarAccion =
    useCallback(
      async <T,>(
        accion:
          () => Promise<T>,
        conjuntoIdParaRecargar?:
          number,
      ): Promise<T> => {
        validarSesion();

        try {
          setProcesando(
            true,
          );

          setError(
            null,
          );

          const respuesta =
            await accion();

          await Promise.all([
            cargarConjuntos(
              false,
            ),
            cargarValidaciones(
              false,
            ),
          ]);

          if (
            conjuntoIdParaRecargar
          ) {
            await cargarDetalle(
              conjuntoIdParaRecargar,
            );
          }

          return respuesta;
        } catch (
          problema
        ) {
          setError(
            problema instanceof Error
              ? problema.message
              : 'No fue posible completar la acción',
          );

          throw problema;
        } finally {
          setProcesando(
            false,
          );
        }
      },
      [
        cargarConjuntos,
        cargarDetalle,
        cargarValidaciones,
        validarSesion,
      ],
    );

  const previsualizar =
    useCallback(
      async (
        datos:
          PrevisualizarDistribucionDatos,
      ) => {
        validarSesion();

        try {
          setProcesando(
            true,
          );

          setError(
            null,
          );

          const respuesta =
            await previsualizarDistribucionGrupos(
              cursoId,
              datos,
              token,
            );

          setPrevisualizacion(
            respuesta,
          );

          return respuesta;
        } catch (
          problema
        ) {
          setError(
            problema instanceof Error
              ? problema.message
              : 'No fue posible calcular la distribución',
          );

          throw problema;
        } finally {
          setProcesando(
            false,
          );
        }
      },
      [
        cursoId,
        token,
        validarSesion,
      ],
    );

  const crearConjunto =
    useCallback(
      (
        datos:
          CrearConjuntoGrupoDatos,
      ) =>
        ejecutarAccion(
          () =>
            crearConjuntoGrupo(
              cursoId,
              datos,
              token,
            ),
        ),
      [
        cursoId,
        ejecutarAccion,
        token,
      ],
    );

  const editarConjunto =
    useCallback(
      (
        conjuntoId:
          number,
        datos:
          ActualizarConjuntoGrupoDatos,
      ) =>
        ejecutarAccion(
          () =>
            actualizarConjuntoGrupo(
              cursoId,
              conjuntoId,
              datos,
              token,
            ),
          conjuntoId,
        ),
      [
        cursoId,
        ejecutarAccion,
        token,
      ],
    );

  const cambiarBloqueo =
    useCallback(
      (
        conjuntoId:
          number,
        estaBloqueado:
          boolean,
      ) =>
        ejecutarAccion(
          () =>
            cambiarBloqueoConjuntoGrupo(
              cursoId,
              conjuntoId,
              estaBloqueado,
              token,
            ),
          conjuntoId,
        ),
      [
        cursoId,
        ejecutarAccion,
        token,
      ],
    );

  const retirarConjunto =
    useCallback(
      (
        conjuntoId:
          number,
      ) =>
        ejecutarAccion(
          () =>
            eliminarConjuntoGrupo(
              cursoId,
              conjuntoId,
              token,
            ),
        ),
      [
        cursoId,
        ejecutarAccion,
        token,
      ],
    );

  const importarConjunto =
    useCallback(
      (
        datos:
          ImportarConjuntoGrupoDatos,
      ) =>
        ejecutarAccion(
          () =>
            importarConjuntoGrupo(
              cursoId,
              datos,
              token,
            ),
        ),
      [
        cursoId,
        ejecutarAccion,
        token,
      ],
    );

  const crearGrupo =
    useCallback(
      (
        conjuntoId:
          number,
        datos:
          CrearGrupoCursoDatos,
      ) =>
        ejecutarAccion(
          () =>
            crearGrupoCurso(
              cursoId,
              conjuntoId,
              datos,
              token,
            ),
          conjuntoId,
        ),
      [
        cursoId,
        ejecutarAccion,
        token,
      ],
    );

  const editarGrupo =
    useCallback(
      (
        conjuntoId:
          number,
        grupoId:
          number,
        datos:
          ActualizarGrupoCursoDatos,
      ) =>
        ejecutarAccion(
          () =>
            actualizarGrupoCurso(
              cursoId,
              conjuntoId,
              grupoId,
              datos,
              token,
            ),
          conjuntoId,
        ),
      [
        cursoId,
        ejecutarAccion,
        token,
      ],
    );

  const retirarGrupo =
    useCallback(
      (
        conjuntoId:
          number,
        grupoId:
          number,
      ) =>
        ejecutarAccion(
          () =>
            eliminarGrupoCurso(
              cursoId,
              conjuntoId,
              grupoId,
              token,
            ),
          conjuntoId,
        ),
      [
        cursoId,
        ejecutarAccion,
        token,
      ],
    );

  const asignarEstudiantes =
    useCallback(
      (
        conjuntoId:
          number,
        grupoId:
          number,
        datos:
          AsignarEstudiantesGrupoDatos,
      ) =>
        ejecutarAccion(
          () =>
            asignarEstudiantesGrupo(
              cursoId,
              conjuntoId,
              grupoId,
              datos,
              token,
            ),
          conjuntoId,
        ),
      [
        cursoId,
        ejecutarAccion,
        token,
      ],
    );

  const moverEstudiante =
    useCallback(
      (
        conjuntoId:
          number,
        grupoOrigenId:
          number,
        datos:
          MoverEstudianteGrupoDatos,
      ) =>
        ejecutarAccion(
          () =>
            moverEstudianteGrupo(
              cursoId,
              conjuntoId,
              grupoOrigenId,
              datos,
              token,
            ),
          conjuntoId,
        ),
      [
        cursoId,
        ejecutarAccion,
        token,
      ],
    );

  const cambiarRepresentante =
    useCallback(
      (
        conjuntoId:
          number,
        grupoId:
          number,
        datos:
          CambiarRepresentanteGrupoDatos,
      ) =>
        ejecutarAccion(
          () =>
            cambiarRepresentanteGrupo(
              cursoId,
              conjuntoId,
              grupoId,
              datos,
              token,
            ),
          conjuntoId,
        ),
      [
        cursoId,
        ejecutarAccion,
        token,
      ],
    );

  const retirarEstudiante =
    useCallback(
      (
        conjuntoId:
          number,
        grupoId:
          number,
        estudianteId:
          number,
      ) =>
        ejecutarAccion(
          () =>
            retirarEstudianteGrupo(
              cursoId,
              conjuntoId,
              grupoId,
              estudianteId,
              token,
            ),
          conjuntoId,
        ),
      [
        cursoId,
        ejecutarAccion,
        token,
      ],
    );

  const cargarHistorial =
    useCallback(
      async (
        conjuntoId:
          number,
      ) => {
        validarSesion();

        try {
          setActualizando(
            true,
          );

          const respuesta =
            await obtenerHistorialConjuntoGrupo(
              cursoId,
              conjuntoId,
              token,
            );

          setHistorial(
            respuesta,
          );

          return respuesta;
        } catch (
          problema
        ) {
          setError(
            problema instanceof Error
              ? problema.message
              : 'No fue posible cargar el historial',
          );

          throw problema;
        } finally {
          setActualizando(
            false,
          );
        }
      },
      [
        cursoId,
        token,
        validarSesion,
      ],
    );

  useEffect(
    () => {
      if (
        !cargarAutomaticamente ||
        !token ||
        cursoId <
          1
      ) {
        return;
      }

      void cargarConjuntos(
        true,
      );
    },
    [
      cargarAutomaticamente,
      cargarConjuntos,
      cursoId,
      token,
    ],
  );

  const conjuntosCurso =
    useMemo(
      () =>
        conjuntos.filter(
          (
            conjunto,
          ) =>
            conjunto.alcance ===
            'CURSO',
        ),
      [
        conjuntos,
      ],
    );

  const conjuntosHito =
    useMemo(
      () =>
        conjuntos.filter(
          (
            conjunto,
          ) =>
            conjunto.alcance ===
            'HITO',
        ),
      [
        conjuntos,
      ],
    );

  return {
    conjuntos,
    conjuntosCurso,
    conjuntosHito,

    detalle,
    previsualizacion,
    validaciones,
    historial,

    cargando,
    actualizando,
    procesando,
    error,

    cargarConjuntos,
    cargarDetalle,
    cargarValidaciones,
    cargarHistorial,
    previsualizar,

    crearConjunto,
    editarConjunto,
    cambiarBloqueo,
    retirarConjunto,
    importarConjunto,

    crearGrupo,
    editarGrupo,
    retirarGrupo,

    asignarEstudiantes,
    moverEstudiante,
    cambiarRepresentante,
    retirarEstudiante,

    limpiarDetalle:
      () =>
        setDetalle(
          null,
        ),

    limpiarPrevisualizacion:
      () =>
        setPrevisualizacion(
          null,
        ),

    limpiarHistorial:
      () =>
        setHistorial(
          [],
        ),

    limpiarError:
      () =>
        setError(
          null,
        ),
  };
}
