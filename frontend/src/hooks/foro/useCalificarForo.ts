import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useAuth,
} from '../../auth/AuthContext';

export type CalificacionForo = {
  id: number;
  notaBase: number | string;
  notaGrupal?: number | string | null;
  notaIndividual?: number | string | null;
  descuentoRetraso?: number | string | null;
  descuentoComentarios?: number | string | null;
  ajusteIndividual?: number | string | null;
  notaFinal: number | string;
  retroalimentacion?: string | null;
  estado: string;
};

export type AutorPanelForo = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  fotoPerfilUrl?: string | null;
};

export type ComentarioPanelForo = {
  id: number;
  contenido: string;
  publicadoEn: string;
  archivos?: number;
  autor: AutorPanelForo;
  respuesta: {
    id: number;
    grupoId?: number | null;
    grupoNombre?: string | null;
  };
};

export type ParticipacionComentariosPanel = {
  aplicaRequisito: boolean;
  esRepresentante: boolean;
  comentariosValidos: number;
  minimoRequerido: number;
  cumplio: boolean;
  penalizacionConfigurada: boolean;
  descuentoComentarios: number | string;
  comentarios: ComentarioPanelForo[];
};

export type ArchivoPanelForo = {
  id: number;
  nombreOriginal?: string | null;
  urlPublica?: string | null;
  ruta?: string | null;
  mimeType?: string | null;
  extension?: string | null;
  tamanioBytes?: number | null;
  permiteDescarga?: boolean;
};

export type RespuestaPanelForo = {
  id: number;
  titulo?: string;
  contenido?: string;
  publicadoEn?: string;
  entregadaTarde?: boolean;
  descuentoCalculado?: number | string | null;
  autor?: AutorPanelForo | null;
  archivos?: ArchivoPanelForo[];
  _count?: {
    comentarios?: number;
    archivos?: number;
  };
};

export type GrupoPanelForo = {
  id: number;
  nombre: string;
  color?: string | null;
  origen: 'PLATAFORMA' | 'AFINIDAD' | string;
};

export type EstudiantePanelForo = {
  estudiante: {
    id: number;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno?: string | null;
    correo?: string;
    fotoPerfilUrl?: string | null;
  };

  respuesta?: RespuestaPanelForo | null;
  grupo?: GrupoPanelForo | null;
  esRepresentante?: boolean;
  participacionComentarios?: ParticipacionComentariosPanel | null;
  calificacion?: CalificacionForo | null;
  estado?: string;
  entregadaTarde?: boolean;
  tieneRespuesta: boolean;
};

export type PanelCalificacionForo = {
  foro: {
    id: number;
    titulo: string;
    estado: string;
    tipoEvaluacion?: string;
    modalidadNota?:
      | 'INDIVIDUAL'
      | 'GRUPAL'
      | 'GRUPAL_E_INDIVIDUAL'
      | string;
    modalidadParticipacion?: 'INDIVIDUAL' | 'GRUPAL' | string;
    origenGrupo?: string;
    dinamicaGrupal?: string;
    requiereRepresentante?: boolean;
    porcentajeNotaGrupal?: number | null;
    porcentajeNotaIndividual?: number | null;
    permitirRetrasos?: boolean;
    tipoDescuentoRetraso?: string;
    valorDescuentoRetraso?: number | null;
    penalizarIncumplimientoComentarios?: boolean;
    tipoPenalizacionComentarios?:
      | 'NINGUNA'
      | 'PUNTOS_FIJOS'
      | 'PORCENTAJE'
      | string;
    valorPenalizacionComentarios?: number | null;
    minimoComentariosPorEstudiante?: number | null;
    fechaLimite?: string | null;
    fechaMaximaRetraso?: string | null;
    fechaCierre?: string | null;
  };

  actividad: {
    id: number;
    componente: string;
    estado: string;
    puntajeMaximo: number;
  };

  resumen: {
    totalEstudiantes: number;
    pendientes: number;
    calificadas: number;
    tardias: number;
    sinRespuesta: number;
  };

  estudiantes: EstudiantePanelForo[];
};

export type DatosCalificacion = {
  notaBase: number;
  notaIndividual?: number;
  descuentoRetraso?: number;
  ajusteIndividual?: number;
  retroalimentacion?: string;
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

const mensajeError = (
  cuerpo: unknown,
  alternativo: string,
) => {
  if (
    !cuerpo ||
    typeof cuerpo !==
      'object'
  ) {
    return alternativo;
  }

  const dato =
    cuerpo as {
      message?: string | string[];
      mensaje?: string;
      error?: string;
    };

  return Array.isArray(
    dato.message,
  )
    ? dato.message.join(
        '. ',
      )
    : dato.message ||
        dato.mensaje ||
        dato.error ||
        alternativo;
};

export default function useCalificarForo(
  cursoId: number,
  foroId: number,
) {
  const {
    accessToken,
  } =
    useAuth();

  const [
    panel,
    setPanel,
  ] =
    useState<PanelCalificacionForo | null>(
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

  const pedir =
    useCallback(
      async <T,>(
        ruta: string,
        opciones?: RequestInit,
      ): Promise<T> => {
        const respuesta =
          await fetch(
            `${API_URL}${ruta}`,
            {
              ...opciones,
              cache:
                'no-store',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
                ...(opciones?.body
                  ? {
                      'Content-Type':
                        'application/json',
                    }
                  : {}),
                'Cache-Control':
                  'no-cache',
                Pragma:
                  'no-cache',
                ...(opciones?.headers ??
                  {}),
              },
            },
          );

        const cuerpo: unknown =
          await respuesta
            .json()
            .catch(
              () =>
                null,
            );

        if (
          !respuesta.ok
        ) {
          throw new Error(
            mensajeError(
              cuerpo,
              'No fue posible completar la operación.',
            ),
          );
        }

        return cuerpo as T;
      },
      [
        accessToken,
      ],
    );

  const cargar =
    useCallback(
      async () => {
        if (
          !accessToken ||
          cursoId <= 0 ||
          foroId <= 0
        ) {
          setCargando(
            false,
          );
          return;
        }

        setCargando(
          true,
        );
        setError(
          null,
        );

        try {
          const resultado =
            await pedir<PanelCalificacionForo>(
              `/foro/cursos/${cursoId}/${foroId}/calificaciones/panel`,
            );

          setPanel(
            resultado,
          );
        } catch (
          causa
        ) {
          setError(
            causa instanceof Error
              ? causa.message
              : 'No fue posible cargar las calificaciones.',
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
        foroId,
        pedir,
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

  const limpiarError =
    useCallback(
      () =>
        setError(
          null,
        ),
      [],
    );

  const ejecutar =
    useCallback(
      async <T,>(
        ruta: string,
        metodo: 'PUT' | 'PATCH',
        cuerpo: unknown,
      ): Promise<T> => {
        setProcesando(
          true,
        );
        setError(
          null,
        );

        try {
          const resultado =
            await pedir<T>(
              ruta,
              {
                method:
                  metodo,
                body:
                  JSON.stringify(
                    cuerpo,
                  ),
              },
            );

          await cargar();

          return resultado;
        } catch (
          causa
        ) {
          setError(
            causa instanceof Error
              ? causa.message
              : 'No fue posible completar la operación.',
          );
          throw causa;
        } finally {
          setProcesando(
            false,
          );
        }
      },
      [
        cargar,
        pedir,
      ],
    );

  const guardarCalificacion =
    useCallback(
      (
        estudianteId: number,
        datos: DatosCalificacion,
      ) =>
        ejecutar(
          `/foro/cursos/${cursoId}/${foroId}/calificaciones/estudiantes/${estudianteId}`,
          'PUT',
          datos,
        ),
      [
        cursoId,
        foroId,
        ejecutar,
      ],
    );

  const guardarCalificacionGrupo =
    useCallback(
      (
        grupo: GrupoPanelForo,
        datos: DatosCalificacion,
      ) =>
        ejecutar(
          `/foro/cursos/${cursoId}/${foroId}/calificaciones/grupos/${grupo.origen}/${grupo.id}`,
          'PUT',
          datos,
        ),
      [
        cursoId,
        foroId,
        ejecutar,
      ],
    );

  const publicarNotas =
    useCallback(
      () =>
        ejecutar(
          `/foro/cursos/${cursoId}/${foroId}/calificaciones/publicar`,
          'PATCH',
          {
            permitirPendientes:
              false,
          },
        ),
      [
        cursoId,
        foroId,
        ejecutar,
      ],
    );

  const reabrirNotas =
    useCallback(
      () =>
        ejecutar(
          `/foro/cursos/${cursoId}/${foroId}/calificaciones/reabrir`,
          'PATCH',
          {
            motivo:
              'Reapertura solicitada desde el panel de calificación',
          },
        ),
      [
        cursoId,
        foroId,
        ejecutar,
      ],
    );

  return {
    panel,
    cargando,
    procesando,
    error,
    cargar,
    limpiarError,
    guardarCalificacion,
    guardarCalificacionGrupo,
    publicarNotas,
    reabrirNotas,
  };
}
