import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  crearApiBiblioteca,
  ErrorBiblioteca,
} from "../services/biblioteca/biblioteca.service";
import type { ApiBiblioteca } from "../services/biblioteca/biblioteca.service";
import type { Capacidades } from "../types/biblioteca/biblioteca.types";
type Contexto = {
  api: ApiBiblioteca;
  base: string;
  capacidades: Capacidades;
  avisar: (mensaje: string, error?: boolean) => void;
  actualizarPermisos: () => Promise<void>;
};
const Context = createContext<Contexto | null>(null);
export function useBiblioteca() {
  const c = useContext(Context);
  if (!c) throw new Error("Biblioteca fuera de su contexto");
  return c;
}
export function BibliotecaProvider({ children }: { children: ReactNode }) {
  const { accessToken, sesion } = useAuth();
  const api = useMemo(
    () => crearApiBiblioteca(accessToken ?? ""),
    [accessToken],
  );
  const [capacidades, setCapacidades] = useState<Capacidades>({
    puedeGestionar: false,
    puedeDelegar: false,
  });
  const [aviso, setAviso] = useState<{ texto: string; error: boolean } | null>(
    null,
  );
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState("");
  const actualizarPermisos = useCallback(async () => {
    try {
      setCapacidades(await api.get<Capacidades>("/capacidades"));
      setFallo("");
    } catch (e) {
      setCapacidades({ puedeGestionar: false, puedeDelegar: false });
      setFallo(
        e instanceof Error
          ? e.message
          : "No se pudo conectar con la biblioteca",
      );
    } finally {
      setCargando(false);
    }
  }, [api]);
  useEffect(() => {
    void actualizarPermisos();
    const focus = () => {
      void actualizarPermisos();
    };
    window.addEventListener("focus", focus);
    return () => window.removeEventListener("focus", focus);
  }, [actualizarPermisos]);
  useEffect(() => {
    if (aviso && !aviso.error) {
      const timer = window.setTimeout(() => setAviso(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [aviso]);
  const base = `/${sesion?.usuario.rol === "ADMINISTRADOR" ? "admin" : sesion?.usuario.rol === "DOCENTE" ? "docente" : "estudiante"}/biblioteca`;
  const avisar = useCallback(
    (texto: string, error = false) => {
      setAviso({ texto, error });
      if (error) void actualizarPermisos();
    },
    [actualizarPermisos],
  );
  return (
    <Context.Provider
      value={{ api, base, capacidades, avisar, actualizarPermisos }}
    >
      {cargando ? (
        <div className="bib-empty" role="status">
          Conectando con tu biblioteca…
        </div>
      ) : fallo ? (
        <div className="bib-empty" role="alert">
          <h2>No pudimos abrir la biblioteca</h2>
          <p>{fallo}</p>
          <button onClick={() => void actualizarPermisos()}>Reintentar</button>
        </div>
      ) : (
        children
      )}
      {aviso && (
        <div
          className={`bib-toast ${aviso.error ? "error" : ""}`}
          role={aviso.error ? "alert" : "status"}
        >
          <span>{aviso.texto}</span>
          <button aria-label="Cerrar aviso" onClick={() => setAviso(null)}>
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function mensajeError(e: unknown) {
  return e instanceof ErrorBiblioteca || e instanceof Error
    ? e.message
    : "No se pudo completar la operación";
}
