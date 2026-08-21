import { useCallback, useState } from "react";
import { useAuth } from "../../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type TipoPenalizacionComentarios =
  | "NINGUNA"
  | "PUNTOS_FIJOS"
  | "PORCENTAJE";

export type CrearForoDatos = {
  hitoId: number;
  titulo: string;
  contenido: string;
  instrucciones?: string;
  objetivo?: string;
  esCalificable: boolean;
  componente?: "CONTINUA" | "PROCESUAL";
  modalidadParticipacion: "INDIVIDUAL" | "GRUPAL";
  origenGrupo: "NINGUNO" | "PLATAFORMA" | "AFINIDAD";
  dinamicaGrupal:
    | "NINGUNA"
    | "REPRESENTANTE_UNICO"
    | "PARTICIPACION_DISTRIBUIDA"
    | "COLABORACION_ABIERTA";
  conjuntoGrupoId?: number;
  cantidadMinimaIntegrantes?: number;
  cantidadMaximaIntegrantes?: number;
  requiereAprobacionEquipos?: boolean;
  requiereRepresentante?: boolean;
  bloquearEquipoAlResponder?: boolean;
  permitirComentarios: boolean;
  permitirEditarRespuestas: boolean;
  permitirEliminarRespuestas: boolean;
  permitirEditarComentarios: boolean;
  permitirEliminarComentarios: boolean;
  minimoComentariosPorEstudiante?: number;
  maximoComentariosPorEstudiante?: number;
  penalizarIncumplimientoComentarios?: boolean;
  tipoPenalizacionComentarios?: TipoPenalizacionComentarios;
  valorPenalizacionComentarios?: number;
  palabrasMinimasRespuesta?: number;
  palabrasMaximasRespuesta?: number;
  palabrasMinimasComentario?: number;
  palabrasMaximasComentario?: number;
  tipoEvaluacion?: "AUTOMATICA" | "MANUAL";
  modalidadNota?: "INDIVIDUAL" | "GRUPAL" | "GRUPAL_E_INDIVIDUAL";
  porcentajeNotaGrupal?: number;
  porcentajeNotaIndividual?: number;
  calificacionAutomaticaAlCumplir?: boolean;
  fechaApertura: string;
  fechaLimite: string;
  fechaCierre: string;
  visibleAntesDeApertura: boolean;
  permitirRetrasos: boolean;
  fechaMaximaRetraso?: string;
  tipoDescuentoRetraso?:
    | "NINGUNO"
    | "PUNTOS_FIJOS"
    | "PORCENTAJE"
    | "POR_HORA"
    | "POR_DIA"
    | "NOTA_MAXIMA";
  valorDescuentoRetraso?: number;
  visibilidadRespuestas:
    | "DESDE_EL_INICIO"
    | "DESPUES_DE_RESPONDER"
    | "AL_CERRAR";
  permitirAdjuntosTema: boolean;
  permitirAdjuntosRespuesta: boolean;
  permitirAdjuntosComentario: boolean;
  exigirAdjuntoRespuesta: boolean;
  permitirDescargaAdjuntos: boolean;
  maximoArchivosTema: number;
  maximoArchivosRespuesta: number;
  maximoArchivosComentario: number;
  tamanioMaximoArchivoMb: number;
  extensionesPermitidas: string[];
  participaEnPromedio: boolean;
};

function mensajeError(valor: unknown) {
  if (!valor || typeof valor !== "object") {
    return "No fue posible crear el foro.";
  }

  const datos = valor as {
    message?: string | string[];
    mensaje?: string;
    error?: string;
  };

  if (Array.isArray(datos.message)) {
    return datos.message.join(". ");
  }

  return (
    datos.message ||
    datos.mensaje ||
    datos.error ||
    "No fue posible crear el foro."
  );
}

export default function useCrearForo(cursoId: number) {
  const { accessToken } = useAuth();

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crear = useCallback(
    async (datos: CrearForoDatos) => {
      if (!accessToken) {
        throw new Error("Tu sesión terminó. Inicia sesión nuevamente.");
      }

      setGuardando(true);
      setError(null);

      try {
        const respuesta = await fetch(`${API_URL}/foro/cursos/${cursoId}`, {
          method: "POST",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          body: JSON.stringify(datos),
        });

        const cuerpo: unknown = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
          throw new Error(mensajeError(cuerpo));
        }

        return cuerpo as { id: number };
      } catch (causa) {
        const texto =
          causa instanceof Error
            ? causa.message
            : "No fue posible crear el foro.";

        setError(texto);

        throw causa instanceof Error ? causa : new Error(texto);
      } finally {
        setGuardando(false);
      }
    },
    [accessToken, cursoId],
  );

  const obtener = useCallback(
    async (foroId: number) => {
      if (!accessToken) {
        throw new Error("Tu sesión terminó. Inicia sesión nuevamente.");
      }

      setGuardando(true);
      setError(null);

      try {
        const respuesta = await fetch(
          `${API_URL}/foro/cursos/${cursoId}/${foroId}?_=${Date.now()}`,
          {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          },
        );

        const cuerpo: unknown = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
          throw new Error(mensajeError(cuerpo));
        }

        return cuerpo;
      } finally {
        setGuardando(false);
      }
    },
    [accessToken, cursoId],
  );

  const actualizar = useCallback(
    async (
      foroId: number,
      datos: Omit<CrearForoDatos, "hitoId">,
    ) => {
      if (!accessToken) {
        throw new Error("Tu sesión terminó. Inicia sesión nuevamente.");
      }

      setGuardando(true);
      setError(null);

      try {
        const respuesta = await fetch(
          `${API_URL}/foro/cursos/${cursoId}/${foroId}`,
          {
            method: "PUT",
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
            body: JSON.stringify(datos),
          },
        );

        const cuerpo: unknown = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
          throw new Error(mensajeError(cuerpo));
        }

        return cuerpo;
      } catch (causa) {
        const texto =
          causa instanceof Error
            ? causa.message
            : "No fue posible actualizar el foro.";

        setError(texto);

        throw causa instanceof Error ? causa : new Error(texto);
      } finally {
        setGuardando(false);
      }
    },
    [accessToken, cursoId],
  );

  return {
    crear,
    obtener,
    actualizar,
    guardando,
    error,
    limpiarError: () => setError(null),
  };
}