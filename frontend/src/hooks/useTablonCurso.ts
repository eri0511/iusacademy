import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../auth/AuthContext';

import {
  actualizarComentario,
  actualizarPublicacion,
  cambiarComentariosPublicacion,
  cambiarFijadoPublicacion,
  cambiarVisibilidadPublicacion,
  crearComentario,
  crearPublicacion,
  eliminarComentario,
  eliminarPublicacion,
  esErrorSesionVencida,
  obtenerComentarios,
  obtenerLecturasPublicacion,
  obtenerMensajeErrorServicio,
  obtenerTablonAula,
  registrarLecturaPublicacion,
} from '../services/comunicacion-curso.service';

import type {
  ActualizarComentarioDatos,
  ActualizarPublicacionDatos,
  ComentarioPublicacion,
  CrearComentarioDatos,
  CrearPublicacionDatos,
  CursoComunicacion,
  HitoComunicacion,
  InscripcionComunicacion,
  LecturaPublicacion,
  PermisosTablon,
  PublicacionCurso,
  ResumenLecturasPublicacion,
} from '../types/comunicacion-curso.types';

type RolTablon =
  | 'DOCENTE'
  | 'ESTUDIANTE';

type DatosComentarios = {
  publicacionId: number;
  publicacionTitulo: string;
  comentariosHabilitados: boolean;
  comentarios: ComentarioPublicacion[];
  total: number;
};

type DatosLecturas = {
  publicacionId: number;
  publicacionTitulo: string;
  publicadoEn: string;
  resumen: ResumenLecturasPublicacion;
  lecturas: LecturaPublicacion[];
};

type UseTablonCursoOpciones = {
  cursoId: number;
  hitoId: number;
  rol: RolTablon;
  cargarAutomaticamente?: boolean;
};

export type GrupoTemporalPublicacion =
  | 'FIJADA'
  | 'URGENTE'
  | 'PROXIMA'
  | 'GENERAL'
  | 'FINALIZADA';

export type PublicacionTablonOrganizada =
  PublicacionCurso & {
    grupoTemporal:
      GrupoTemporalPublicacion;

    diasRestantes:
      number | null;

    estaVencida:
      boolean;

    ocurreHoy:
      boolean;
  };

type CacheTablon = {
  curso: CursoComunicacion;
  hito: HitoComunicacion;
  permisos: PermisosTablon;
  inscripcion: InscripcionComunicacion | null;
  publicaciones: PublicacionCurso[];
};

const cacheTablon =
  new Map<string, CacheTablon>();

function obtenerClaveCache(
  cursoId:
    number,
  hitoId:
    number,
  rol:
    RolTablon,
): string {
  return `${rol}-${cursoId}-${hitoId}`;
}

export default function useTablonCurso({
  cursoId,
  hitoId,
  rol,
  cargarAutomaticamente =
    true,
}: UseTablonCursoOpciones) {
  const navigate =
    useNavigate();

  const {
    accessToken,
    cerrarSesion,
  } = useAuth();

  const claveCache =
    obtenerClaveCache(
      cursoId,
      hitoId,
      rol,
    );

  const [
    curso,
    setCurso,
  ] =
    useState<CursoComunicacion | null>(
      null,
    );

  const [
    inscripcion,
    setInscripcion,
  ] =
    useState<InscripcionComunicacion | null>(
      null,
    );

  const [
    hito,
    setHito,
  ] =
    useState<HitoComunicacion | null>(
      null,
    );

  const [
    permisos,
    setPermisos,
  ] =
    useState<PermisosTablon>({
      puedeCrear:
        false,

      puedeEditar:
        false,

      puedeEliminar:
        false,

      puedeComentar:
        true,
    });

  const [
    publicaciones,
    setPublicaciones,
  ] =
    useState<PublicacionCurso[]>(
      [],
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(
      true,
    );

  const [
    actualizando,
    setActualizando,
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

  const [
    publicacionProcesandoId,
    setPublicacionProcesandoId,
  ] =
    useState<number | null>(
      null,
    );

  const [
    comentarioProcesandoId,
    setComentarioProcesandoId,
  ] =
    useState<number | null>(
      null,
    );

  const [
    comentarios,
    setComentarios,
  ] =
    useState<DatosComentarios | null>(
      null,
    );

  const [
    cargandoComentarios,
    setCargandoComentarios,
  ] =
    useState(
      false,
    );

  const [
    lecturas,
    setLecturas,
  ] =
    useState<DatosLecturas | null>(
      null,
    );

  const [
    cargandoLecturas,
    setCargandoLecturas,
  ] =
    useState(
      false,
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

  const obtenerPesoPrioridad =
    useCallback(
      (
        prioridad:
          PublicacionCurso['prioridad'],
      ): number => {
        switch (
          prioridad
        ) {
          case 'URGENTE':
            return 4;

          case 'ALTA':
            return 3;

          case 'MEDIA':
            return 2;

          default:
            return 1;
        }
      },
      [],
    );

  const obtenerDatosTemporales =
    useCallback(
      (
        publicacion:
          PublicacionCurso,
      ): {
        fechaInicio:
          number | null;

        fechaFin:
          number | null;

        diasRestantes:
          number | null;

        estaVencida:
          boolean;

        ocurreHoy:
          boolean;
      } => {
        const ahora =
          new Date();

        const inicioDelDia =
          new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            ahora.getDate(),
          ).getTime();

        const finDelDia =
          new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            ahora.getDate() +
              1,
          ).getTime() -
          1;

        const fechaInicio =
          publicacion.fechaEventoInicio
            ? new Date(
                publicacion.fechaEventoInicio,
              ).getTime()
            : null;

        const fechaFin =
          publicacion.fechaEventoFin
            ? new Date(
                publicacion.fechaEventoFin,
              ).getTime()
            : fechaInicio;

        const fechaReferencia =
          fechaInicio;

        const diasRestantes =
          fechaReferencia ===
          null
            ? null
            : Math.ceil(
                (
                  fechaReferencia -
                  inicioDelDia
                ) /
                  86_400_000,
              );

        const estaVencida =
          fechaFin !==
            null &&
          fechaFin <
            ahora.getTime();

        const ocurreHoy =
          fechaInicio !==
            null &&
          fechaInicio <=
            finDelDia &&
          (
            fechaFin ??
            fechaInicio
          ) >=
            inicioDelDia;

        return {
          fechaInicio,
          fechaFin,
          diasRestantes,
          estaVencida,
          ocurreHoy,
        };
      },
      [],
    );

  const obtenerGrupoTemporal =
    useCallback(
      (
        publicacion:
          PublicacionCurso,
      ): GrupoTemporalPublicacion => {
        if (
          publicacion.estaFijada
        ) {
          return 'FIJADA';
        }

        const datosTemporales =
          obtenerDatosTemporales(
            publicacion,
          );

        if (
          datosTemporales.estaVencida
        ) {
          return 'FINALIZADA';
        }

        if (
          publicacion.prioridad ===
            'URGENTE' ||
          datosTemporales.ocurreHoy ||
          (
            datosTemporales.diasRestantes !==
              null &&
            datosTemporales.diasRestantes <=
              1
          )
        ) {
          return 'URGENTE';
        }

        if (
          datosTemporales.fechaInicio !==
          null
        ) {
          return 'PROXIMA';
        }

        return 'GENERAL';
      },
      [
        obtenerDatosTemporales,
      ],
    );

  const ordenarPublicaciones =
    useCallback(
      (
        lista:
          PublicacionCurso[],
      ): PublicacionCurso[] => {
        const pesoGrupo:
          Record<
            GrupoTemporalPublicacion,
            number
          > = {
          FIJADA:
            5,

          URGENTE:
            4,

          PROXIMA:
            3,

          GENERAL:
            2,

          FINALIZADA:
            1,
        };

        return [
          ...lista,
        ].sort(
          (
            a,
            b,
          ) => {
            const grupoA =
              obtenerGrupoTemporal(
                a,
              );

            const grupoB =
              obtenerGrupoTemporal(
                b,
              );

            if (
              pesoGrupo[
                grupoA
              ] !==
              pesoGrupo[
                grupoB
              ]
            ) {
              return (
                pesoGrupo[
                  grupoB
                ] -
                pesoGrupo[
                  grupoA
                ]
              );
            }

            const datosA =
              obtenerDatosTemporales(
                a,
              );

            const datosB =
              obtenerDatosTemporales(
                b,
              );

            if (
              grupoA ===
                'PROXIMA' ||
              grupoA ===
                'URGENTE' ||
              grupoA ===
                'FIJADA'
            ) {
              if (
                datosA.fechaInicio !==
                  null &&
                datosB.fechaInicio !==
                  null &&
                datosA.fechaInicio !==
                  datosB.fechaInicio
              ) {
                return (
                  datosA.fechaInicio -
                  datosB.fechaInicio
                );
              }

              if (
                datosA.fechaInicio ===
                  null &&
                datosB.fechaInicio !==
                  null
              ) {
                return 1;
              }

              if (
                datosA.fechaInicio !==
                  null &&
                datosB.fechaInicio ===
                  null
              ) {
                return -1;
              }
            }

            const prioridadA =
              obtenerPesoPrioridad(
                a.prioridad,
              );

            const prioridadB =
              obtenerPesoPrioridad(
                b.prioridad,
              );

            if (
              prioridadA !==
              prioridadB
            ) {
              return (
                prioridadB -
                prioridadA
              );
            }

            if (
              grupoA ===
                'FINALIZADA' &&
              datosA.fechaFin !==
                null &&
              datosB.fechaFin !==
                null &&
              datosA.fechaFin !==
                datosB.fechaFin
            ) {
              return (
                datosB.fechaFin -
                datosA.fechaFin
              );
            }

            return (
              new Date(
                b.publicadoEn,
              ).getTime() -
              new Date(
                a.publicadoEn,
              ).getTime()
            );
          },
        );
      },
      [
        obtenerDatosTemporales,
        obtenerGrupoTemporal,
        obtenerPesoPrioridad,
      ],
    );

  const cargarTablon =
    useCallback(
      async (
        mostrarCargaCompleta =
          true,
      ) => {
        if (
          !accessToken ||
          !Number.isInteger(
            cursoId,
          ) ||
          cursoId <=
            0 ||
          !Number.isInteger(
            hitoId,
          ) ||
          hitoId <=
            0
        ) {
          setCargando(
            false,
          );

          return;
        }

        const datosEnCache =
          cacheTablon.get(
            claveCache,
          );

        if (
          datosEnCache
        ) {
          setCurso(
            datosEnCache.curso,
          );

          setHito(
            datosEnCache.hito,
          );

          setPermisos(
            datosEnCache.permisos,
          );

          setInscripcion(
            datosEnCache.inscripcion,
          );

          setPublicaciones(
            ordenarPublicaciones(
              datosEnCache.publicaciones,
            ),
          );
        }

        try {
          setError(
            null,
          );

          if (
            mostrarCargaCompleta &&
            !datosEnCache &&
            publicaciones.length ===
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
            await obtenerTablonAula(
              cursoId,
              hitoId,
              accessToken,
            );

          const publicacionesOrdenadas =
            ordenarPublicaciones(
              respuesta.publicaciones,
            );

          cacheTablon.set(
            claveCache,
            {
              curso:
                respuesta.curso,

              hito:
                respuesta.hito,

              permisos:
                respuesta.permisos,

              inscripcion:
                respuesta.inscripcion,

              publicaciones:
                publicacionesOrdenadas,
            },
          );

          setCurso(
            respuesta.curso,
          );

          setHito(
            respuesta.hito,
          );

          setInscripcion(
            respuesta.inscripcion,
          );

          setPermisos(
            respuesta.permisos,
          );

          setPublicaciones(
            publicacionesOrdenadas,
          );
        } catch (
          errorCapturado
        ) {
          setError(
            manejarError(
              errorCapturado,
              'No fue posible cargar el tablón del curso.',
            ),
          );
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
        accessToken,
        claveCache,
        cursoId,
        hitoId,
        manejarError,
        ordenarPublicaciones,
        publicaciones.length,
      ],
    );

  useEffect(
    () => {
      setComentarios(
        null,
      );

      setLecturas(
        null,
      );

      if (
        cargarAutomaticamente
      ) {
        const tieneCache =
          cacheTablon.has(
            claveCache,
          );

        void cargarTablon(
          !tieneCache &&
          publicaciones.length ===
            0,
        );
      }
    },
    [
      cargarAutomaticamente,
      cargarTablon,
      claveCache,
      publicaciones.length,
    ],
  );

  const publicar =
    useCallback(
      async (
        datos:
          CrearPublicacionDatos,
      ) => {
        if (
          !accessToken ||
          rol !==
            'DOCENTE'
        ) {
          throw new Error(
            'No tienes permisos para crear publicaciones.',
          );
        }

        try {
          setError(
            null,
          );

          setPublicacionProcesandoId(
            0,
          );

          const respuesta =
            await crearPublicacion(
              cursoId,
              hitoId,
              datos,
              accessToken,
            );

          setPublicaciones(
            (
              listaActual,
            ) =>
              ordenarPublicaciones([
                respuesta.publicacion,
                ...listaActual,
              ]),
          );

          return respuesta;
        } catch (
          errorCapturado
        ) {
          const mensaje =
            manejarError(
              errorCapturado,
              'No fue posible crear la publicación.',
            );

          setError(
            mensaje,
          );

          throw new Error(
            mensaje,
          );
        } finally {
          setPublicacionProcesandoId(
            null,
          );
        }
      },
      [
        accessToken,
        cursoId,
        hitoId,
        manejarError,
        ordenarPublicaciones,
        rol,
      ],
    );

  const editarPublicacion =
    useCallback(
      async (
        publicacionId:
          number,

        datos:
          ActualizarPublicacionDatos,
      ) => {
        if (
          !accessToken ||
          rol !==
            'DOCENTE'
        ) {
          throw new Error(
            'No tienes permisos para editar publicaciones.',
          );
        }

        try {
          setError(
            null,
          );

          setPublicacionProcesandoId(
            publicacionId,
          );

          const respuesta =
            await actualizarPublicacion(
              cursoId,
              hitoId,
              publicacionId,
              datos,
              accessToken,
            );

          setPublicaciones(
            (
              listaActual,
            ) =>
              ordenarPublicaciones(
                listaActual.map(
                  (
                    publicacion,
                  ) =>
                    publicacion.id ===
                    publicacionId
                      ? respuesta.publicacion
                      : publicacion,
                ),
              ),
          );

          return respuesta;
        } catch (
          errorCapturado
        ) {
          const mensaje =
            manejarError(
              errorCapturado,
              'No fue posible actualizar la publicación.',
            );

          setError(
            mensaje,
          );

          throw new Error(
            mensaje,
          );
        } finally {
          setPublicacionProcesandoId(
            null,
          );
        }
      },
      [
        accessToken,
        cursoId,
        hitoId,
        manejarError,
        ordenarPublicaciones,
        rol,
      ],
    );

  const cambiarFijado =
    useCallback(
      async (
        publicacion:
          PublicacionCurso,
      ) => {
        if (
          !accessToken ||
          rol !==
            'DOCENTE'
        ) {
          throw new Error(
            'No tienes permisos para modificar esta publicación.',
          );
        }

        try {
          setError(
            null,
          );

          setPublicacionProcesandoId(
            publicacion.id,
          );

          const respuesta =
            await cambiarFijadoPublicacion(
              cursoId,
              hitoId,
              publicacion.id,
              !publicacion.estaFijada,
              accessToken,
            );

          setPublicaciones(
            (
              listaActual,
            ) =>
              ordenarPublicaciones(
                listaActual.map(
                  (
                    elemento,
                  ) =>
                    elemento.id ===
                    publicacion.id
                      ? respuesta.publicacion
                      : elemento,
                ),
              ),
          );

          return respuesta;
        } catch (
          errorCapturado
        ) {
          const mensaje =
            manejarError(
              errorCapturado,
              'No fue posible cambiar el estado de fijado.',
            );

          setError(
            mensaje,
          );

          throw new Error(
            mensaje,
          );
        } finally {
          setPublicacionProcesandoId(
            null,
          );
        }
      },
      [
        accessToken,
        cursoId,
        hitoId,
        manejarError,
        ordenarPublicaciones,
        rol,
      ],
    );

  const cambiarComentarios =
    useCallback(
      async (
        publicacion:
          PublicacionCurso,
      ) => {
        if (
          !accessToken ||
          rol !==
            'DOCENTE'
        ) {
          throw new Error(
            'No tienes permisos para configurar los comentarios.',
          );
        }

        try {
          setError(
            null,
          );

          setPublicacionProcesandoId(
            publicacion.id,
          );

          const respuesta =
            await cambiarComentariosPublicacion(
              cursoId,
              hitoId,
              publicacion.id,
              !publicacion.comentariosHabilitados,
              accessToken,
            );

          setPublicaciones(
            (
              listaActual,
            ) =>
              listaActual.map(
                (
                  elemento,
                ) =>
                  elemento.id ===
                  publicacion.id
                    ? respuesta.publicacion
                    : elemento,
              ),
          );

          setComentarios(
            (
              estadoActual,
            ) => {
              if (
                !estadoActual ||
                estadoActual.publicacionId !==
                  publicacion.id
              ) {
                return estadoActual;
              }

              return {
                ...estadoActual,

                comentariosHabilitados:
                  respuesta.publicacion
                    .comentariosHabilitados,
              };
            },
          );

          return respuesta;
        } catch (
          errorCapturado
        ) {
          const mensaje =
            manejarError(
              errorCapturado,
              'No fue posible cambiar la configuración de comentarios.',
            );

          setError(
            mensaje,
          );

          throw new Error(
            mensaje,
          );
        } finally {
          setPublicacionProcesandoId(
            null,
          );
        }
      },
      [
        accessToken,
        cursoId,
        hitoId,
        manejarError,
        rol,
      ],
    );

  const cambiarVisibilidad =
    useCallback(
      async (
        publicacion:
          PublicacionCurso,
      ) => {
        if (
          !accessToken ||
          rol !==
            'DOCENTE'
        ) {
          throw new Error(
            'No tienes permisos para cambiar la visibilidad.',
          );
        }

        try {
          setError(
            null,
          );

          setPublicacionProcesandoId(
            publicacion.id,
          );

          const respuesta =
            await cambiarVisibilidadPublicacion(
              cursoId,
              hitoId,
              publicacion.id,
              !publicacion.visibleParaEstudiantes,
              accessToken,
            );

          setPublicaciones(
            (
              listaActual,
            ) =>
              listaActual.map(
                (
                  elemento,
                ) =>
                  elemento.id ===
                  publicacion.id
                    ? respuesta.publicacion
                    : elemento,
              ),
          );

          return respuesta;
        } catch (
          errorCapturado
        ) {
          const mensaje =
            manejarError(
              errorCapturado,
              'No fue posible cambiar la visibilidad.',
            );

          setError(
            mensaje,
          );

          throw new Error(
            mensaje,
          );
        } finally {
          setPublicacionProcesandoId(
            null,
          );
        }
      },
      [
        accessToken,
        cursoId,
        hitoId,
        manejarError,
        rol,
      ],
    );

  const retirarPublicacion =
    useCallback(
      async (
        publicacionId:
          number,
      ) => {
        if (
          !accessToken ||
          rol !==
            'DOCENTE'
        ) {
          throw new Error(
            'No tienes permisos para retirar publicaciones.',
          );
        }

        try {
          setError(
            null,
          );

          setPublicacionProcesandoId(
            publicacionId,
          );

          const respuesta =
            await eliminarPublicacion(
              cursoId,
              hitoId,
              publicacionId,
              accessToken,
            );

          setPublicaciones(
            (
              listaActual,
            ) =>
              listaActual.filter(
                (
                  publicacion,
                ) =>
                  publicacion.id !==
                  publicacionId,
              ),
          );

          setComentarios(
            (
              estadoActual,
            ) =>
              estadoActual
                ?.publicacionId ===
              publicacionId
                ? null
                : estadoActual,
          );

          setLecturas(
            (
              estadoActual,
            ) =>
              estadoActual
                ?.publicacionId ===
              publicacionId
                ? null
                : estadoActual,
          );

          return respuesta;
        } catch (
          errorCapturado
        ) {
          const mensaje =
            manejarError(
              errorCapturado,
              'No fue posible retirar la publicación.',
            );

          setError(
            mensaje,
          );

          throw new Error(
            mensaje,
          );
        } finally {
          setPublicacionProcesandoId(
            null,
          );
        }
      },
      [
        accessToken,
        cursoId,
        hitoId,
        manejarError,
        rol,
      ],
    );

  const cargarComentarios =
    useCallback(
      async (
        publicacionId:
          number,
      ) => {
        if (!accessToken) {
          return null;
        }

        try {
          setError(
            null,
          );

          setCargandoComentarios(
            true,
          );

          const respuesta =
            await obtenerComentarios(
              cursoId,
              publicacionId,
              accessToken,
            );

          const resultado: DatosComentarios = {
            publicacionId:
              respuesta.publicacion.id,

            publicacionTitulo:
              respuesta.publicacion.titulo,

            comentariosHabilitados:
              respuesta.publicacion
                .comentariosHabilitados,

            comentarios:
              respuesta.comentarios,

            total:
              respuesta.total,
          };

          setComentarios(
            resultado,
          );

          return resultado;
        } catch (
          errorCapturado
        ) {
          const mensaje =
            manejarError(
              errorCapturado,
              'No fue posible cargar los comentarios.',
            );

          setError(
            mensaje,
          );

          throw new Error(
            mensaje,
          );
        } finally {
          setCargandoComentarios(
            false,
          );
        }
      },
      [
        accessToken,
        cursoId,
        hitoId,
        manejarError,
      ],
    );

  const comentar =
    useCallback(
      async (
        publicacionId:
          number,

        datos:
          CrearComentarioDatos,
      ) => {
        if (!accessToken) {
          throw new Error(
            'Debes iniciar sesión para comentar.',
          );
        }

        try {
          setError(
            null,
          );

          setComentarioProcesandoId(
            0,
          );

          const respuesta =
            await crearComentario(
              cursoId,
              publicacionId,
              datos,
              accessToken,
            );

          setComentarios(
            (
              estadoActual,
            ) => {
              if (
                !estadoActual ||
                estadoActual.publicacionId !==
                  publicacionId
              ) {
                return estadoActual;
              }

              const nuevaLista = [
                ...estadoActual.comentarios,
                respuesta.comentario,
              ];

              return {
                ...estadoActual,

                comentarios:
                  nuevaLista,

                total:
                  nuevaLista.length,
              };
            },
          );

          return respuesta;
        } catch (
          errorCapturado
        ) {
          const mensaje =
            manejarError(
              errorCapturado,
              'No fue posible publicar el comentario.',
            );

          setError(
            mensaje,
          );

          throw new Error(
            mensaje,
          );
        } finally {
          setComentarioProcesandoId(
            null,
          );
        }
      },
      [
        accessToken,
        cursoId,
        hitoId,
        manejarError,
      ],
    );

  const editarComentario =
    useCallback(
      async (
        publicacionId:
          number,

        comentarioId:
          number,

        datos:
          ActualizarComentarioDatos,
      ) => {
        if (!accessToken) {
          throw new Error(
            'Debes iniciar sesión para editar comentarios.',
          );
        }

        try {
          setError(
            null,
          );

          setComentarioProcesandoId(
            comentarioId,
          );

          const respuesta =
            await actualizarComentario(
              cursoId,
              publicacionId,
              comentarioId,
              datos,
              accessToken,
            );

          setComentarios(
            (
              estadoActual,
            ) => {
              if (
                !estadoActual ||
                estadoActual.publicacionId !==
                  publicacionId
              ) {
                return estadoActual;
              }

              return {
                ...estadoActual,

                comentarios:
                  estadoActual.comentarios.map(
                    (
                      comentario,
                    ) =>
                      comentario.id ===
                      comentarioId
                        ? respuesta.comentario
                        : comentario,
                  ),
              };
            },
          );

          return respuesta;
        } catch (
          errorCapturado
        ) {
          const mensaje =
            manejarError(
              errorCapturado,
              'No fue posible actualizar el comentario.',
            );

          setError(
            mensaje,
          );

          throw new Error(
            mensaje,
          );
        } finally {
          setComentarioProcesandoId(
            null,
          );
        }
      },
      [
        accessToken,
        cursoId,
        hitoId,
        manejarError,
      ],
    );

  const retirarComentario =
    useCallback(
      async (
        publicacionId:
          number,

        comentarioId:
          number,
      ) => {
        if (!accessToken) {
          throw new Error(
            'Debes iniciar sesión para retirar comentarios.',
          );
        }

        try {
          setError(
            null,
          );

          setComentarioProcesandoId(
            comentarioId,
          );

          const respuesta =
            await eliminarComentario(
              cursoId,
              publicacionId,
              comentarioId,
              accessToken,
            );

          setComentarios(
            (
              estadoActual,
            ) => {
              if (
                !estadoActual ||
                estadoActual.publicacionId !==
                  publicacionId
              ) {
                return estadoActual;
              }

              const nuevaLista =
                estadoActual.comentarios.filter(
                  (
                    comentario,
                  ) =>
                    comentario.id !==
                    comentarioId,
                );

              return {
                ...estadoActual,

                comentarios:
                  nuevaLista,

                total:
                  nuevaLista.length,
              };
            },
          );

          return respuesta;
        } catch (
          errorCapturado
        ) {
          const mensaje =
            manejarError(
              errorCapturado,
              'No fue posible retirar el comentario.',
            );

          setError(
            mensaje,
          );

          throw new Error(
            mensaje,
          );
        } finally {
          setComentarioProcesandoId(
            null,
          );
        }
      },
      [
        accessToken,
        cursoId,
        hitoId,
        manejarError,
      ],
    );

  const registrarLectura =
    useCallback(
      async (
        publicacionId:
          number,
      ) => {
        if (
          !accessToken ||
          rol !==
            'ESTUDIANTE'
        ) {
          return null;
        }

        try {
          return await registrarLecturaPublicacion(
            cursoId,
            publicacionId,
            accessToken,
          );
        } catch (
          errorCapturado
        ) {
          const mensaje =
            manejarError(
              errorCapturado,
              'No fue posible registrar la lectura.',
            );

          setError(
            mensaje,
          );

          return null;
        }
      },
      [
        accessToken,
        cursoId,
        hitoId,
        manejarError,
        rol,
      ],
    );

  const cargarLecturas =
    useCallback(
      async (
        publicacionId:
          number,
      ) => {
        if (
          !accessToken ||
          rol !==
            'DOCENTE'
        ) {
          return null;
        }

        try {
          setError(
            null,
          );

          setCargandoLecturas(
            true,
          );

          const respuesta =
            await obtenerLecturasPublicacion(
              cursoId,
              publicacionId,
              accessToken,
            );

          const resultado: DatosLecturas = {
            publicacionId:
              respuesta.publicacion.id,

            publicacionTitulo:
              respuesta.publicacion.titulo,

            publicadoEn:
              respuesta.publicacion.publicadoEn,

            resumen:
              respuesta.resumen,

            lecturas:
              respuesta.lecturas,
          };

          setLecturas(
            resultado,
          );

          return resultado;
        } catch (
          errorCapturado
        ) {
          const mensaje =
            manejarError(
              errorCapturado,
              'No fue posible cargar las lecturas.',
            );

          setError(
            mensaje,
          );

          throw new Error(
            mensaje,
          );
        } finally {
          setCargandoLecturas(
            false,
          );
        }
      },
      [
        accessToken,
        cursoId,
        hitoId,
        manejarError,
        rol,
      ],
    );

  const cerrarComentarios =
    useCallback(
      () => {
        setComentarios(
          null,
        );
      },
      [],
    );

  const cerrarLecturas =
    useCallback(
      () => {
        setLecturas(
          null,
        );
      },
      [],
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

  useEffect(
    () => {
      if (
        !curso ||
        !hito
      ) {
        return;
      }

      cacheTablon.set(
        claveCache,
        {
          curso,
          hito,
          permisos,
          inscripcion,
          publicaciones,
        },
      );
    },
    [
      claveCache,
      curso,
      hito,
      inscripcion,
      permisos,
      publicaciones,
    ],
  );

  const publicacionesOrganizadas =
    useMemo<
      PublicacionTablonOrganizada[]
    >(
      () =>
        publicaciones.map(
          (
            publicacion,
          ) => {
            const datosTemporales =
              obtenerDatosTemporales(
                publicacion,
              );

            return {
              ...publicacion,

              grupoTemporal:
                obtenerGrupoTemporal(
                  publicacion,
                ),

              diasRestantes:
                datosTemporales.diasRestantes,

              estaVencida:
                datosTemporales.estaVencida,

              ocurreHoy:
                datosTemporales.ocurreHoy,
            };
          },
        ),
      [
        obtenerDatosTemporales,
        obtenerGrupoTemporal,
        publicaciones,
      ],
    );

  const publicacionesFijadas =
    useMemo(
      () =>
        publicacionesOrganizadas.filter(
          (
            publicacion,
          ) =>
            publicacion.grupoTemporal ===
            'FIJADA',
        ),
      [
        publicacionesOrganizadas,
      ],
    );

  const publicacionesUrgentes =
    useMemo(
      () =>
        publicacionesOrganizadas.filter(
          (
            publicacion,
          ) =>
            publicacion.grupoTemporal ===
            'URGENTE',
        ),
      [
        publicacionesOrganizadas,
      ],
    );

  const publicacionesProximas =
    useMemo(
      () =>
        publicacionesOrganizadas.filter(
          (
            publicacion,
          ) =>
            publicacion.grupoTemporal ===
            'PROXIMA',
        ),
      [
        publicacionesOrganizadas,
      ],
    );

  const publicacionesGenerales =
    useMemo(
      () =>
        publicacionesOrganizadas.filter(
          (
            publicacion,
          ) =>
            publicacion.grupoTemporal ===
            'GENERAL',
        ),
      [
        publicacionesOrganizadas,
      ],
    );

  const publicacionesFinalizadas =
    useMemo(
      () =>
        publicacionesOrganizadas.filter(
          (
            publicacion,
          ) =>
            publicacion.grupoTemporal ===
            'FINALIZADA',
        ),
      [
        publicacionesOrganizadas,
      ],
    );

  return {
    curso,
    hito,
    permisos,
    inscripcion,
    publicaciones,
    publicacionesOrganizadas,
    publicacionesFijadas,
    publicacionesUrgentes,
    publicacionesProximas,
    publicacionesGenerales,
    publicacionesFinalizadas,

    cargando,
    actualizando,
    tieneContenido:
      publicaciones.length >
      0 ||
      cacheTablon.has(
        claveCache,
      ),
    error,

    publicacionProcesandoId,
    comentarioProcesandoId,

    comentarios,
    cargandoComentarios,

    lecturas,
    cargandoLecturas,

    cargarTablon,
    publicar,
    editarPublicacion,
    cambiarFijado,
    cambiarComentarios,
    cambiarVisibilidad,
    retirarPublicacion,

    cargarComentarios,
    comentar,
    editarComentario,
    retirarComentario,
    cerrarComentarios,

    registrarLectura,

    cargarLecturas,
    cerrarLecturas,

    limpiarError,
  };
}