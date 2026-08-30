import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "../../auth/AuthContext";
import type {
  FiltrosForo,
  ForoListado,
  PaginacionForos,
  RespuestaListadoForos,
} from "../../types/foro/foro.types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const paginacionInicial: PaginacionForos = {
  pagina: 1,
  limite: 12,
  totalRegistros: 0,
  totalPaginas: 1,
  tienePaginaAnterior: false,
  tienePaginaSiguiente: false,
};

function obtenerMensajeError(valor: unknown): string {
  if (!valor || typeof valor !== "object")
    return "No fue posible cargar los foros.";
  const error = valor as {
    message?: string | string[];
    mensaje?: string;
    error?: string;
  };
  if (Array.isArray(error.message)) return error.message.join(". ");
  return (
    error.message ||
    error.mensaje ||
    error.error ||
    "No fue posible cargar los foros."
  );
}

export default function useForosCurso(cursoId: number, filtros: FiltrosForo) {
  const { accessToken } = useAuth();
  const [foros, setForos] = useState<ForoListado[]>([]);
  const [paginacion, setPaginacion] =
    useState<PaginacionForos>(paginacionInicial);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const primeraCarga = useRef(true);

  const cargarForos = useCallback(async () => {
    if (!Number.isInteger(cursoId) || cursoId <= 0 || !accessToken) return;

    if (primeraCarga.current) {
      setCargando(true);
    } else {
      setActualizando(true);
    }
    setError(null);

    const parametros = new URLSearchParams({
      pagina: String(filtros.pagina),
      limite: String(filtros.limite),
      orden: filtros.orden,
    });
    if (filtros.busqueda.trim())
      parametros.set("busqueda", filtros.busqueda.trim());
    if (filtros.estado) parametros.set("estado", filtros.estado);
    if (filtros.lectura) parametros.set("lectura", filtros.lectura);
    if (filtros.hitoId) parametros.set("hitoId", String(filtros.hitoId));

    try {
      const respuesta = await fetch(
        `${API_URL}/foro/cursos/${cursoId}?${parametros.toString()}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const cuerpo: unknown = await respuesta.json().catch(() => null);
      if (!respuesta.ok) throw new Error(obtenerMensajeError(cuerpo));

      const datos = cuerpo as RespuestaListadoForos;
      setForos(Array.isArray(datos.datos) ? datos.datos : []);
      setPaginacion(datos.paginacion ?? paginacionInicial);
    } catch (causa) {
      setError(
        causa instanceof Error
          ? causa.message
          : "No fue posible cargar los foros.",
      );
    } finally {
      primeraCarga.current = false;
      setCargando(false);
      setActualizando(false);
    }
  }, [accessToken, cursoId, filtros]);

  useEffect(() => {
    void cargarForos();
  }, [cargarForos]);

  const ejecutarAccion = useCallback(
    async (
      foroId: number,
      ruta: string,
      metodo: "PATCH" | "DELETE",
      cuerpo?: unknown,
    ) => {
      if (!accessToken) throw new Error("Tu sesión ya no está disponible.");

      setProcesandoId(foroId);
      setError(null);

      try {
        const respuesta = await fetch(`${API_URL}${ruta}`, {
          method: metodo,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            ...(cuerpo === undefined
              ? {}
              : { "Content-Type": "application/json" }),
          },
          body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
        });
        const datos: unknown = await respuesta.json().catch(() => null);
        if (!respuesta.ok) throw new Error(obtenerMensajeError(datos));
        await cargarForos();
      } catch (causa) {
        const mensaje =
          causa instanceof Error
            ? causa.message
            : "No fue posible completar la operación.";
        setError(mensaje);
        throw new Error(mensaje);
      } finally {
        setProcesandoId(null);
      }
    },
    [accessToken, cargarForos],
  );

  const cambiarFijado = useCallback(
    (foroId: number, estaFijado: boolean) =>
      ejecutarAccion(
        foroId,
        `/foro/cursos/${cursoId}/${foroId}/fijado`,
        "PATCH",
        { estaFijado },
      ),
    [cursoId, ejecutarAccion],
  );

  const cambiarEstado = useCallback(
    (foroId: number, estado: string) =>
      ejecutarAccion(
        foroId,
        `/foro/cursos/${cursoId}/${foroId}/estado`,
        "PATCH",
        { estado },
      ),
    [cursoId, ejecutarAccion],
  );

  const eliminarForo = useCallback(
    (foroId: number) =>
      ejecutarAccion(foroId, `/foro/cursos/${cursoId}/${foroId}`, "DELETE"),
    [cursoId, ejecutarAccion],
  );

  return {
    foros,
    paginacion,
    cargando,
    actualizando,
    procesandoId,
    error,
    cargarForos,
    limpiarError: () => setError(null),
    cambiarFijado,
    cambiarEstado,
    eliminarForo,
  };
}
