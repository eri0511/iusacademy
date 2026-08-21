import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Clock3,
  Crown,
  Edit3,
  Eye,
  FileText,
  History,
  Info,
  Lock,
  MessageSquare,
  Paperclip,
  Pin,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import AulaHeader from "../../../components/aula/AulaHeader";
import AulaEmptyState from "../../../components/aula/AulaEmptyState";
import AulaSkeleton from "../../../components/aula/AulaSkeleton";
import AulaModal from "../../../components/aula/AulaModal";
import FormularioForoInteligente from "../../../components/foro/FormularioForoInteligente";
import CalificarForo from "./CalificarForo";
import RespuestaForoCard from "../../../components/curso/RespuestaForoCard";
import Toast, { type TipoToast } from "../../../components/shared/Toast";
import AvatarUsuario from "../../../components/shared/AvatarUsuario";
import useDetalleForo from "../../../hooks/foro/useDetalleForo";
import type {
  ArchivoForo,
  HistorialForo,
} from "../../../types/foro/foro-detalle.types";

type Pestana =
  | "conversacion"
  | "equipos"
  | "participacion"
  | "calificaciones"
  | "historial";

type IntegranteAfinidad = {
  id: number;
  estudianteId: number;
  esRepresentante: boolean;
  estudiante: {
    id: number;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno?: string | null;
    fotoPerfilUrl?: string | null;
  };
};

type EquipoAfinidad = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO" | string;
  creador: {
    id: number;
    nombres: string;
    apellidoPaterno: string;
  };
  integrantes: IntegranteAfinidad[];
  creadoEn?: string;
};


type GrupoPlataforma = {
  id: number;
  nombre: string;
  color?: string | null;
  integrantes: Array<{
    estudianteId: number;
    esRepresentante: boolean;
    estudiante: {
      id: number;
      nombres: string;
      apellidoPaterno: string;
      apellidoMaterno?: string | null;
      fotoPerfilUrl?: string | null;
      correo?: string | null;
    };
  }>;
};

const COLORES_EQUIPO = [
  "#2563eb",
  "#16a34a",
  "#f18b4b",
  "#7c3aed",
  "#db2777",
  "#0891b2",
] as const;

function nombreCortoEquipo(
  nombres: string,
  apellidoPaterno: string,
): string {
  const primerNombre =
    nombres.trim().split(/\s+/)[0] ?? "";

  const primerApellido =
    apellidoPaterno.trim().split(/\s+/)[0] ?? "";

  return `${primerNombre} ${primerApellido}`.trim();
}

type Confirmacion = {
  titulo: string;
  descripcion: string;
  detalle: string;
  textoConfirmar: string;
  tipo?: "normal" | "peligro";
  accion: () => Promise<unknown> | void;
};
const fecha = (v?: string | null) =>
  v
    ? new Intl.DateTimeFormat("es-BO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(v))
    : "Sin definir";
const tiempoRestante = (destino: string | null | undefined, ahora: number) => {
  if (!destino) return "Cierre sin definir";
  const diferencia = new Date(destino).getTime() - ahora;
  if (diferencia <= 0) return "Plazo finalizado";
  const total = Math.floor(diferencia / 1000);
  const dias = Math.floor(total / 86400);
  const horas = Math.floor((total % 86400) / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;
  return dias > 0
    ? `Restan ${dias} d ${horas} h ${minutos} min`
    : horas > 0
      ? `Restan ${horas} h ${minutos} min ${segundos} s`
      : `Restan ${minutos} min ${segundos} s`;
};
const etiqueta = (v?: string) =>
  v
    ?.replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (x) => x.toUpperCase()) ?? "—";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";
export default function DetalleTemaForo() {
  const navigate = useNavigate();
  const { sesion } = useAuth();
  const location = useLocation();
  const { cursoId, temaId } = useParams();
  const idCurso = Number(cursoId),
    idForo = Number(temaId);
  const [tab, setTab] = useState<Pestana>("conversacion");
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [editorAbierto, setEditorAbierto] = useState(false);
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const [toast, setToast] = useState<{
    visible: boolean;
    tipo: TipoToast;
    titulo: string;
    mensaje?: string;
  }>({ visible: false, tipo: "exito", titulo: "" });
  const esVistaDocente = location.pathname.startsWith("/docente/");
  const d = useDetalleForo(idCurso, idForo);
  const resumen = d.estadisticas?.resumen;
  const accessToken = sesion?.accessToken ?? "";
  const [equiposAfinidad, setEquiposAfinidad] = useState<EquipoAfinidad[]>([]);
  const [cargandoEquipos, setCargandoEquipos] = useState(false);
  const [errorEquipos, setErrorEquipos] = useState<string | null>(null);
  const [gruposPlataforma, setGruposPlataforma] = useState<GrupoPlataforma[]>([]);
  useEffect(() => {
    const intervalo = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(intervalo);
  }, []);
  useEffect(() => {
    const foro = d.foro;
    if (!foro || !["PROGRAMADO", "ABIERTO", "VENCIDO"].includes(foro.estado))
      return;
    const cierre =
      foro.permitirRetrasos && foro.fechaMaximaRetraso
        ? foro.fechaMaximaRetraso
        : foro.fechaCierre || foro.fechaLimite;
    if (!cierre) return;
    let intervalo: number | undefined;
    const demora = Math.max(0, new Date(cierre).getTime() - Date.now()) + 1000;
    const inicio = window.setTimeout(() => {
      void d.cargar();
      intervalo = window.setInterval(() => void d.cargar(), 10_000);
    }, demora);
    return () => {
      window.clearTimeout(inicio);
      if (intervalo) window.clearInterval(intervalo);
    };
  }, [
    d.foro?.estado,
    d.foro?.fechaCierre,
    d.foro?.fechaLimite,
    d.foro?.fechaMaximaRetraso,
    d.foro?.permitirRetrasos,
    d.cargar,
  ]);
  useEffect(() => {
    if (!detalleAbierto) return;
    const cerrarConEscape = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setDetalleAbierto(false);
    };
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", cerrarConEscape);
    };
  }, [detalleAbierto]);
  const usaGrupos =
    d.foro?.modalidadParticipacion === "GRUPAL";

  const usaAfinidad =
    usaGrupos &&
    d.foro?.origenGrupo === "AFINIDAD";

  const usaPlataforma =
    usaGrupos &&
    d.foro?.origenGrupo === "PLATAFORMA";

  const cargarEquiposAfinidad = useCallback(async () => {
    if (!usaAfinidad || !accessToken) return;

    try {
      setCargandoEquipos(true);
      setErrorEquipos(null);

      const respuesta = await fetch(
        `${API_URL}/foro/cursos/${idCurso}/${idForo}/equipos`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          datos?.message ||
            "No fue posible obtener los equipos de afinidad.",
        );
      }

      setEquiposAfinidad(Array.isArray(datos) ? datos : []);
    } catch (causa) {
      setErrorEquipos(
        causa instanceof Error
          ? causa.message
          : "No fue posible obtener los equipos.",
      );
    } finally {
      setCargandoEquipos(false);
    }
  }, [usaAfinidad, accessToken, idCurso, idForo]);

  useEffect(() => {
    if (!usaAfinidad || tab !== "equipos") return;
    void cargarEquiposAfinidad();
  }, [usaAfinidad, tab, cargarEquiposAfinidad]);

  const cargarGruposPlataforma = useCallback(async () => {
    const conjuntoId = d.foro?.conjuntoGrupoId;

    if (
      !usaPlataforma ||
      !conjuntoId ||
      !accessToken
    ) {
      return;
    }

    try {
      setCargandoEquipos(true);
      setErrorEquipos(null);

      const respuesta = await fetch(
        `${API_URL}/docente/cursos/${idCurso}/grupos/${conjuntoId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          datos?.message ||
            "No fue posible obtener los grupos de plataforma.",
        );
      }

      setGruposPlataforma(
        Array.isArray(datos?.conjunto?.grupos)
          ? datos.conjunto.grupos
          : [],
      );
    } catch (causa) {
      setErrorEquipos(
        causa instanceof Error
          ? causa.message
          : "No fue posible obtener los grupos de plataforma.",
      );
    } finally {
      setCargandoEquipos(false);
    }
  }, [
    usaPlataforma,
    d.foro?.conjuntoGrupoId,
    accessToken,
    idCurso,
  ]);

  useEffect(() => {
    if (!usaPlataforma || tab !== "equipos") return;
    void cargarGruposPlataforma();
  }, [usaPlataforma, tab, cargarGruposPlataforma]);

  const resumenEquipos = useMemo(
    () => ({
      total: equiposAfinidad.length,
      pendientes: equiposAfinidad.filter(
        (equipo) => equipo.estado === "PENDIENTE",
      ).length,
      aprobados: equiposAfinidad.filter(
        (equipo) => equipo.estado === "APROBADO",
      ).length,
      rechazados: equiposAfinidad.filter(
        (equipo) => equipo.estado === "RECHAZADO",
      ).length,
    }),
    [equiposAfinidad],
  );
  /*
   * IMPORTANTE:
   * Todos los hooks del componente deben ejecutarse antes de cualquier
   * return condicional. De esta forma React recibe siempre el mismo
   * número y orden de hooks tanto durante la carga como después.
   */
  if (d.cargando)
    return (
      <div className="fd-loading-page" aria-label="Cargando foro">
        <div className="fd-loading-header">
          <div className="fd-loading-header__icon" />
          <div className="fd-loading-header__text">
            <span />
            <strong />
            <small />
            <div>
              <i />
              <i />
            </div>
          </div>
          <div className="fd-loading-header__actions">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="fd-loading-countdown">
          <span />
          <div>
            <small />
            <strong />
          </div>
          <i />
        </div>

        <AulaSkeleton cantidad={4} variante="tarjetas" />

        <div className="fd-loading-tabs">
          {Array.from({ length: 4 }).map((_, indice) => (
            <span key={indice} />
          ))}
        </div>

        <div className="fd-loading-content">
          <AulaSkeleton cantidad={2} variante="lista" />
        </div>

        <style>{styles}</style>
      </div>
    );

  if (!d.foro)
    return (
      <div className="fd-error-page">
        <AulaEmptyState
          titulo="No fue posible abrir el foro"
          descripcion={
            d.error ||
            "El foro no está disponible o ya no pertenece a este curso."
          }
          icono={AlertCircle}
          accionTexto="Volver a foros"
          onAccion={() => navigate(-1)}
        />
        <style>{styles}</style>
      </div>
    );

  const f = d.foro;
  const cierreTemporizador =
    f.permitirRetrasos && f.fechaMaximaRetraso
      ? f.fechaMaximaRetraso
      : f.fechaCierre || f.fechaLimite;

  const foroFinalizado =
    [
      "CERRADO",
      "CALIFICANDO",
      "CALIFICADO",
      "NOTAS_PUBLICADAS",
      "ANULADO",
    ].includes(f.estado);

  const textoEstadoFinal =
    f.estado === "NOTAS_PUBLICADAS"
      ? "Notas publicadas"
      : f.estado === "CALIFICANDO"
        ? "En calificación"
        : f.estado === "CALIFICADO"
          ? "Calificado"
          : f.estado === "ANULADO"
            ? "Foro anulado"
            : "Foro cerrado";

  const contador =
    foroFinalizado
      ? textoEstadoFinal
      : tiempoRestante(
          cierreTemporizador,
          ahora,
        );

  const esCalificable = Boolean(
    f.esCalificable &&
      f.actividadCalificable,
  );
  const volverAForos = () =>
    navigate(
      esVistaDocente
        ? `/docente/cursos/${idCurso}/foro`
        : `/estudiante/cursos/${idCurso}/foro`,
    );
  const mostrarToast = (tipo: TipoToast, titulo: string, mensaje?: string) =>
    setToast({ visible: true, tipo, titulo, mensaje });
  const abrirEditor = () => {
    setDetalleAbierto(false);
    setEditorAbierto(true);
  };
  const ejecutarConfirmacion = async () => {
    if (!confirmacion) return;
    const accionActual = confirmacion;
    try {
      await accionActual.accion();
      setConfirmacion(null);
      mostrarToast(
        "exito",
        "Acción completada",
        "Los cambios se guardaron correctamente.",
      );
    } catch (causa) {
      setConfirmacion(null);
      mostrarToast(
        "error",
        "No se pudo completar la acción",
        causa instanceof Error ? causa.message : undefined,
      );
    }
  };
  return (
    <div className="fd-page">
      <AulaHeader
        icono={MessageSquare}
        etiqueta="Foro del curso"
        titulo={f.titulo}
        descripcion={
          f.objetivo ||
          "Espacio de análisis, argumentación jurídica y participación."
        }
        informacion={`Límite: ${fecha(f.fechaLimite)} · Cierre: ${fecha(cierreTemporizador)}`}
        acciones={[
          {
            texto: "Volver al foro",
            icono: ArrowLeft,
            onClick: volverAForos,
          },
          {
            texto: "Detalle",
            icono: Info,
            variante: "primaria",
            onClick: () => setDetalleAbierto(true),
          },
          {
            texto: "Actualizar",
            icono: RefreshCw,
            onClick: () => void d.cargar(),
            deshabilitada: d.procesando,
          },
        ]}
      />
      <section
        className={`fd-countdown ${
          foroFinalizado || contador === "Plazo finalizado"
            ? "is-finished"
            : ""
        }`}
      >
        <Clock3 />
        <div>
          <small>
            {foroFinalizado
              ? "Estado del foro"
              : "Cierre definitivo"}
          </small>
          <strong>
            {foroFinalizado
              ? textoEstadoFinal
              : fecha(cierreTemporizador)}
          </strong>
        </div>
        <span>
          {foroFinalizado
            ? "Participación finalizada"
            : contador}
        </span>
      </section>
      <nav className="fd-tabs">
        {(
          [
            ["conversacion", "Conversación", MessageSquare],
            ...(usaGrupos
              ? [["equipos", "Equipos", UsersRound] as const]
              : []),
            ["participacion", "Participación", BarChart3],
            ...(esCalificable && esVistaDocente
              ? [["calificaciones", "Calificaciones", BookOpenCheck] as const]
              : []),
            ["historial", "Historial", History],
          ] as const
        ).map(([id, t, I]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            <I size={16} />
            {t}
          </button>
        ))}
      </nav>
      {tab === "conversacion" && (
        <div className="fd-grid">
          <main>
            <article className="fd-topic">
              <div className="fd-topic-top">
                <span className={`fd-badge ${f.estado.toLowerCase()}`}>
                  {etiqueta(f.estado)}
                </span>
                {f.estaFijado && (
                  <span className="fd-pinned">
                    <Pin size={13} /> Fijado
                  </span>
                )}
              </div>
              <h3>Tema principal</h3>
              <p>{f.contenido}</p>
              {f.instrucciones && (
                <aside>
                  <strong>Instrucciones</strong>
                  <p>{f.instrucciones}</p>
                </aside>
              )}
              {f.archivos && f.archivos.length > 0 && (
                <div className="fd-files">
                  {f.archivos.map((a: ArchivoForo) => (
                    <a
                      key={a.id}
                      href={a.url ?? a.ruta ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileText size={14} />
                      {a.nombreOriginal ?? a.nombre ?? "Adjunto"}
                    </a>
                  ))}
                </div>
              )}
            </article>
            <div className="fd-section-title">
              <div>
                <h3>Hilo de conversación</h3>
                <p>
                  Las respuestas principales contienen sus propios comentarios.
                </p>
              </div>
              <span>{d.respuestas.length}</span>
            </div>
            {d.respuestas.length === 0 ? (
              <AulaEmptyState
                titulo="Aún no hay respuestas"
                descripcion="Cuando los estudiantes participen, el hilo de conversación aparecerá aquí."
                icono={MessageSquare}
                compacto
              />
            ) : (
              d.respuestas.map((r, i) => (
                <RespuestaForoCard
                  key={r.id}
                  respuesta={r}
                  numero={i + 1}
                  procesando={d.procesando}
                  onModerar={(id, o) =>
                    setConfirmacion({
                      titulo: o ? "Ocultar respuesta" : "Restaurar respuesta",
                      descripcion: o
                        ? "La participación dejará de ser visible para el curso."
                        : "La participación volverá a mostrarse en el hilo.",
                      detalle:
                        "La acción quedará registrada en el historial del foro.",
                      textoConfirmar: o ? "Ocultar respuesta" : "Restaurar",
                      accion: () => d.moderarRespuesta(id, o),
                    })
                  }
                  onBloquear={d.bloquearRespuesta}
                  onModerarComentario={(id, o) =>
                    setConfirmacion({
                      titulo: o ? "Ocultar comentario" : "Restaurar comentario",
                      descripcion: o
                        ? "El comentario dejará de ser visible en la conversación."
                        : "El comentario volverá a mostrarse.",
                      detalle: "Podrás consultar este cambio en el historial.",
                      textoConfirmar: o ? "Ocultar comentario" : "Restaurar",
                      accion: () => d.moderarComentario(id, o),
                    })
                  }
                />
              ))
            )}
          </main>
          {esVistaDocente && (
            <aside className="fd-side">
              <section className="fd-side-card">
                <div className="fd-side-head">
                  <span>
                    <Settings2 size={16} />
                  </span>
                  <div>
                    <h3>Administrar foro</h3>
                    <p>Acciones y configuración</p>
                  </div>
                </div>

                <div className="fd-side-actions">
                  <button onClick={() => void d.cambiarFijado(!f.estaFijado)}>
                    <Pin />
                    <span>
                      <strong>{f.estaFijado ? "Desfijar foro" : "Fijar foro"}</strong>
                      <small>
                        {f.estaFijado
                          ? "Quitar del acceso destacado"
                          : "Mantener visible como destacado"}
                      </small>
                    </span>
                  </button>

                  {["PROGRAMADO", "ABIERTO", "VENCIDO"].includes(f.estado) && (
                    <button
                      onClick={() =>
                        setConfirmacion({
                          titulo: "Cerrar foro",
                          descripcion:
                            "El foro dejará de aceptar nuevas participaciones.",
                          detalle:
                            "Si la evaluación es automática, las notas calculadas se publicarán al finalizar.",
                          textoConfirmar: "Cerrar foro",
                          accion: () => d.cambiarEstado("CERRADO"),
                        })
                      }
                    >
                      <Lock />
                      <span>
                        <strong>Cerrar foro</strong>
                        <small>Bloquear nuevas participaciones</small>
                      </span>
                    </button>
                  )}

                  <button onClick={abrirEditor}>
                    <Settings2 />
                    <span>
                      <strong>Editar configuración</strong>
                      <small>Ajustar opciones del foro</small>
                    </span>
                  </button>

                  <button
                    className="danger"
                    onClick={() =>
                      setConfirmacion({
                        titulo: "Eliminar foro",
                        descripcion:
                          "El foro y sus participaciones dejarán de estar disponibles.",
                        detalle:
                          "La eliminación es lógica y el historial académico se conservará internamente.",
                        textoConfirmar: "Eliminar foro",
                        tipo: "peligro",
                        accion: async () => {
                          await d.eliminarForo();
                          volverAForos();
                        },
                      })
                    }
                  >
                    <Trash2 />
                    <span>
                      <strong>Eliminar foro</strong>
                      <small>Retirar permanentemente del aula</small>
                    </span>
                  </button>
                </div>
              </section>

              <section className="fd-side-card fd-status-card">
                <div className="fd-status-title">
                  <span>
                    <BookOpenCheck size={16} />
                  </span>
                  <div>
                    <h3>Estado actual</h3>
                    <p>Disponibilidad del foro</p>
                  </div>
                </div>

                <div className={`fd-status-banner ${f.estado.toLowerCase()}`}>
                  <div>
                    <small>Estado</small>
                    <strong>{etiqueta(f.estado)}</strong>
                  </div>
                  <span className="fd-status-dot" />
                </div>

                <div className="fd-status-data">
                  <div>
                    <CalendarDays />
                    <span>
                      <small>Fecha límite</small>
                      <strong>{fecha(f.fechaLimite)}</strong>
                    </span>
                  </div>
                  <div>
                    <Clock3 />
                    <span>
                      <small>Cierre definitivo</small>
                      <strong>{fecha(cierreTemporizador)}</strong>
                    </span>
                  </div>
                </div>
              </section>
            </aside>
          )}
        </div>
      )}
      {tab === "equipos" && usaAfinidad && (
        <section className="fd-affinity">
          <header className="fd-affinity__heading">
            <div className="fd-affinity__heading-main">
              <span className="fd-affinity__heading-icon">
                <UsersRound />
              </span>

              <div>
                <span className="fd-affinity__eyebrow">
                  Organización del foro
                </span>

                <h3>
                  Equipos por afinidad
                </h3>

                <p>
                  Consulta la composición, representante y estado de cada equipo.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="fd-affinity__refresh"
              disabled={cargandoEquipos}
              onClick={() => void cargarEquiposAfinidad()}
            >
              <RefreshCw className={cargandoEquipos ? "spin" : ""} />
              Actualizar
            </button>
          </header>

          <div className="fd-affinity__metrics">
            <article>
              <span className="fd-affinity__metric-icon">
                <UsersRound />
              </span>

              <div>
                <strong>
                  {resumenEquipos.total}
                </strong>

                <span>
                  Equipos
                </span>

                <small>
                  Distribución actual
                </small>
              </div>
            </article>

            <article>
              <span className="fd-affinity__metric-icon">
                <Users />
              </span>

              <div>
                <strong>
                  {equiposAfinidad.reduce(
                    (total, equipo) =>
                      total + equipo.integrantes.length,
                    0,
                  )}
                </strong>

                <span>
                  Integrantes
                </span>

                <small>
                  Estudiantes asignados
                </small>
              </div>
            </article>

            <article>
              <span className="fd-affinity__metric-icon">
                <Crown />
              </span>

              <div>
                <strong>
                  {equiposAfinidad.reduce(
                    (total, equipo) =>
                      total +
                      equipo.integrantes.filter(
                        (integrante) => integrante.esRepresentante,
                      ).length,
                    0,
                  )}
                </strong>

                <span>
                  Representantes
                </span>

                <small>
                  Responsables de equipo
                </small>
              </div>
            </article>

            <article>
              <span className="fd-affinity__metric-icon">
                <Lock />
              </span>

              <div>
                <strong>
                  Automático
                </strong>

                <span>
                  Estado
                </span>

                <small>
                  Sin aprobación docente
                </small>
              </div>
            </article>
          </div>

          <div className="fd-affinity__rules">
            <Info />

            <div>
              <strong>
                Reglas del foro
              </strong>

              <p>
                Equipos de entre {f.cantidadMinimaIntegrantes ?? 2} y{" "}
                {f.cantidadMaximaIntegrantes ?? "sin límite"} integrantes.
                Los equipos quedan registrados automáticamente al crearse.
                {f.bloquearEquipoAlResponder
                  ? " Después de participar, la composición del equipo queda bloqueada."
                  : ""}
              </p>
            </div>
          </div>

          {errorEquipos && (
            <div className="fd-alert">
              <AlertCircle />
              <span>{errorEquipos}</span>
              <button
                type="button"
                onClick={() => setErrorEquipos(null)}
              >
                ×
              </button>
            </div>
          )}

          {cargandoEquipos && equiposAfinidad.length === 0 ? (
            <AulaSkeleton
              cantidad={2}
              variante="tarjetas"
            />
          ) : equiposAfinidad.length === 0 ? (
            <AulaEmptyState
              titulo="Todavía no hay equipos"
              descripcion="Los equipos creados por afinidad aparecerán aquí cuando los estudiantes comiencen a organizarse."
              icono={UsersRound}
              compacto
            />
          ) : (
            <>
              <header className="fd-affinity__section-heading">
                <div>
                  <span className="fd-affinity__heading-icon">
                    <UsersRound />
                  </span>

                  <div>
                    <h4>
                      Equipos del foro
                    </h4>

                    <p>
                      Revisa integrantes y representantes desde un solo lugar.
                    </p>
                  </div>
                </div>

                <strong>
                  {equiposAfinidad.length}{" "}
                  {equiposAfinidad.length === 1
                    ? "equipo"
                    : "equipos"}
                </strong>
              </header>

              <div className="fd-affinity__grid">
                {equiposAfinidad.map((equipo, indiceEquipo) => {
                  const representante = equipo.integrantes.find(
                    (integrante) => integrante.esRepresentante,
                  );

                  const color =
                    COLORES_EQUIPO[
                      indiceEquipo % COLORES_EQUIPO.length
                    ];

                  const identificador =
                    `G${indiceEquipo + 1}`;

                  return (
                    <article
                      className="fd-affinity-team"
                      key={equipo.id}
                      style={
                        {
                          "--team-color": color,
                        } as CSSProperties
                      }
                    >
                      <header className="fd-affinity-team__header">
                        <span className="fd-affinity-team__identifier">
                          {identificador}
                        </span>

                        <div>
                          <small>
                            Equipo por afinidad
                          </small>

                          <h4>
                            {equipo.nombre}
                          </h4>

                          <span>
                            {equipo.integrantes.length}{" "}
                            {equipo.integrantes.length === 1
                              ? "integrante"
                              : "integrantes"}
                          </span>
                        </div>

                      </header>

                      <div className="fd-affinity-team__members">
                        {equipo.integrantes.map((integrante) => (
                          <article
                            className="fd-affinity-member"
                            key={integrante.estudianteId}
                          >
                            <AvatarUsuario
                              fotoPerfilUrl={
                                integrante.estudiante.fotoPerfilUrl
                              }
                              nombres={
                                integrante.estudiante.nombres
                              }
                              apellidoPaterno={
                                integrante.estudiante.apellidoPaterno
                              }
                              size={44}
                              className="fd-affinity-member__avatar"
                            />

                            <div className="fd-affinity-member__data">
                              <strong>
                                {nombreCortoEquipo(
                                  integrante.estudiante.nombres,
                                  integrante.estudiante.apellidoPaterno,
                                )}
                              </strong>

                              <small>
                                {integrante.esRepresentante
                                  ? "Representante"
                                  : "Integrante"}
                              </small>
                            </div>

                            {integrante.esRepresentante && (
                              <span className="fd-affinity-member__role">
                                <Crown />
                                Representante
                              </span>
                            )}
                          </article>
                        ))}
                      </div>

                      <footer className="fd-affinity-team__footer">
                        <span>
                          Creado por{" "}
                          <strong>
                            {equipo.creador.nombres}{" "}
                            {equipo.creador.apellidoPaterno}
                          </strong>
                        </span>

                        {representante && (
                          <span>
                            Representante:{" "}
                            <strong>
                              {nombreCortoEquipo(
                                representante.estudiante.nombres,
                                representante.estudiante.apellidoPaterno,
                              )}
                            </strong>
                          </span>
                        )}
                      </footer>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      {tab === "equipos" && usaPlataforma && (
        <section className="fd-affinity">
          <header className="fd-affinity__heading">
            <div className="fd-affinity__heading-main">
              <span className="fd-affinity__heading-icon">
                <UsersRound />
              </span>

              <div>
                <span className="fd-affinity__eyebrow">
                  Organización del foro
                </span>

                <h3>
                  Grupos de plataforma
                </h3>

                <p>
                  Consulta la composición, representante y grupo asignado a cada estudiante.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="fd-affinity__refresh"
              disabled={cargandoEquipos}
              onClick={() => void cargarGruposPlataforma()}
            >
              <RefreshCw className={cargandoEquipos ? "spin" : ""} />
              Actualizar
            </button>
          </header>

          <div className="fd-affinity__metrics">
            <article>
              <span className="fd-affinity__metric-icon">
                <UsersRound />
              </span>

              <div>
                <strong>
                  {gruposPlataforma.length}
                </strong>

                <span>
                  Grupos
                </span>

                <small>
                  Distribución actual
                </small>
              </div>
            </article>

            <article>
              <span className="fd-affinity__metric-icon">
                <Users />
              </span>

              <div>
                <strong>
                  {gruposPlataforma.reduce(
                    (total, grupo) =>
                      total + grupo.integrantes.length,
                    0,
                  )}
                </strong>

                <span>
                  Integrantes
                </span>

                <small>
                  Estudiantes asignados
                </small>
              </div>
            </article>

            <article>
              <span className="fd-affinity__metric-icon">
                <Crown />
              </span>

              <div>
                <strong>
                  {gruposPlataforma.reduce(
                    (total, grupo) =>
                      total +
                      grupo.integrantes.filter(
                        (integrante) => integrante.esRepresentante,
                      ).length,
                    0,
                  )}
                </strong>

                <span>
                  Representantes
                </span>

                <small>
                  Responsables de grupo
                </small>
              </div>
            </article>

            <article>
              <span className="fd-affinity__metric-icon">
                <Lock />
              </span>

              <div>
                <strong>
                  Plataforma
                </strong>

                <span>
                  Origen
                </span>

                <small>
                  Grupos definidos en el curso
                </small>
              </div>
            </article>
          </div>

          <div className="fd-affinity__rules">
            <Info />

            <div>
              <strong>
                Grupos vinculados al foro
              </strong>

              <p>
                Estos grupos provienen de la organización configurada en la plataforma
                para este curso y hito. La composición y el representante se mantienen
                según el conjunto asignado al foro.
                {f.bloquearEquipoAlResponder
                  ? " Después de participar, la composición utilizada por el foro permanece bloqueada."
                  : ""}
              </p>
            </div>
          </div>

          {errorEquipos && (
            <div className="fd-alert">
              <AlertCircle />
              <span>{errorEquipos}</span>
              <button
                type="button"
                onClick={() => setErrorEquipos(null)}
              >
                ×
              </button>
            </div>
          )}

          {cargandoEquipos && gruposPlataforma.length === 0 ? (
            <AulaSkeleton
              cantidad={2}
              variante="tarjetas"
            />
          ) : gruposPlataforma.length === 0 ? (
            <AulaEmptyState
              titulo="No hay grupos disponibles"
              descripcion="El conjunto seleccionado todavía no tiene grupos activos."
              icono={UsersRound}
              compacto
            />
          ) : (
            <>
              <header className="fd-affinity__section-heading">
                <div>
                  <span className="fd-affinity__heading-icon">
                    <UsersRound />
                  </span>

                  <div>
                    <h4>
                      Grupos del foro
                    </h4>

                    <p>
                      Revisa integrantes y representantes desde un solo lugar.
                    </p>
                  </div>
                </div>

                <strong>
                  {gruposPlataforma.length}{" "}
                  {gruposPlataforma.length === 1
                    ? "grupo"
                    : "grupos"}
                </strong>
              </header>

              <div className="fd-affinity__grid">
                {gruposPlataforma.map((grupo, indiceGrupo) => {
                  const representante = grupo.integrantes.find(
                    (integrante) => integrante.esRepresentante,
                  );

                  const color =
                    grupo.color ||
                    COLORES_EQUIPO[
                      indiceGrupo % COLORES_EQUIPO.length
                    ];

                  const identificador =
                    `G${indiceGrupo + 1}`;

                  return (
                    <article
                      className="fd-affinity-team"
                      key={grupo.id}
                      style={
                        {
                          "--team-color": color,
                        } as CSSProperties
                      }
                    >
                      <header className="fd-affinity-team__header">
                        <span className="fd-affinity-team__identifier">
                          {identificador}
                        </span>

                        <div>
                          <small>
                            Grupo de plataforma
                          </small>

                          <h4>
                            {grupo.nombre}
                          </h4>

                          <span>
                            {grupo.integrantes.length}{" "}
                            {grupo.integrantes.length === 1
                              ? "integrante"
                              : "integrantes"}
                          </span>
                        </div>
                      </header>

                      <div className="fd-affinity-team__members">
                        {grupo.integrantes.map((integrante) => (
                          <article
                            className="fd-affinity-member"
                            key={integrante.estudianteId}
                          >
                            <AvatarUsuario
                              fotoPerfilUrl={
                                integrante.estudiante.fotoPerfilUrl
                              }
                              nombres={
                                integrante.estudiante.nombres
                              }
                              apellidoPaterno={
                                integrante.estudiante.apellidoPaterno
                              }
                              size={44}
                              className="fd-affinity-member__avatar"
                            />

                            <div className="fd-affinity-member__data">
                              <strong>
                                {nombreCortoEquipo(
                                  integrante.estudiante.nombres,
                                  integrante.estudiante.apellidoPaterno,
                                )}
                              </strong>

                              <small>
                                {integrante.esRepresentante
                                  ? "Representante"
                                  : "Integrante"}
                              </small>
                            </div>

                            {integrante.esRepresentante && (
                              <span className="fd-affinity-member__role">
                                <Crown />
                                Representante
                              </span>
                            )}
                          </article>
                        ))}
                      </div>

                      <footer className="fd-affinity-team__footer">
                        <span>
                          Origen:{" "}
                          <strong>
                            Plataforma
                          </strong>
                        </span>

                        {representante && (
                          <span>
                            Representante:{" "}
                            <strong>
                              {nombreCortoEquipo(
                                representante.estudiante.nombres,
                                representante.estudiante.apellidoPaterno,
                              )}
                            </strong>
                          </span>
                        )}
                      </footer>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      {tab === "participacion" && (
        <section className="fd-participation-dashboard">
          <header className="fd-participation-dashboard__header">
            <div className="fd-participation-dashboard__identity">
              <span className="fd-participation-dashboard__icon">
                <BarChart3 />
              </span>

              <div>
                <span className="fd-participation-dashboard__eyebrow">
                  Seguimiento del foro
                </span>

                <h3>
                  Participación y lecturas
                </h3>

                <p>
                  Revisa el avance general y detecta rápidamente dónde necesita
                  intervenir el docente.
                </p>
              </div>
            </div>

            <span className="fd-participation-dashboard__badge">
              {resumen?.porcentajeParticipacion ?? 0}% participó
            </span>
          </header>

          <div className="fd-participation-dashboard__primary">
            <article className="fd-participation-kpi is-green">
              <span className="fd-participation-kpi__icon">
                <UsersRound />
              </span>

              <div>
                <span className="fd-participation-kpi__label">
                  Participación
                </span>

                <strong>
                  {resumen?.porcentajeParticipacion ?? 0}%
                </strong>

                <small>
                  {resumen?.estudiantesParticipantes ?? 0} de{" "}
                  {resumen?.totalEstudiantes ?? 0} estudiantes
                </small>

                <span className="fd-participation-progress">
                  <i
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          resumen?.porcentajeParticipacion ?? 0,
                        ),
                      )}%`,
                    }}
                  />
                </span>
              </div>
            </article>

            <article className="fd-participation-kpi is-blue">
              <span className="fd-participation-kpi__icon">
                <Eye />
              </span>

              <div>
                <span className="fd-participation-kpi__label">
                  Lectura
                </span>

                <strong>
                  {d.lecturas?.porcentajeLectura ?? 0}%
                </strong>

                <small>
                  {d.lecturas?.totalLectores ?? 0} de{" "}
                  {d.lecturas?.totalEstudiantes ?? 0} estudiantes
                </small>

                <span className="fd-participation-progress">
                  <i
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          d.lecturas?.porcentajeLectura ?? 0,
                        ),
                      )}%`,
                    }}
                  />
                </span>
              </div>
            </article>

            <article className="fd-participation-kpi is-orange">
              <span className="fd-participation-kpi__icon">
                <Clock3 />
              </span>

              <div>
                <span className="fd-participation-kpi__label">
                  Sin participar
                </span>

                <strong>
                  {resumen?.estudiantesSinParticipar ?? 0}
                </strong>

                <small>
                  estudiantes pendientes
                </small>

                <span className="fd-participation-kpi__hint">
                  Requieren seguimiento
                </span>
              </div>
            </article>

            <article className="fd-participation-kpi is-slate">
              <span className="fd-participation-kpi__icon">
                <Eye />
              </span>

              <div>
                <span className="fd-participation-kpi__label">
                  Sin lectura
                </span>

                <strong>
                  {d.lecturas?.totalSinLeer ?? 0}
                </strong>

                <small>
                  estudiantes aún no revisaron el foro
                </small>

                <span className="fd-participation-kpi__hint">
                  Seguimiento de acceso
                </span>
              </div>
            </article>
          </div>

          <section className="fd-participation-activity">
            <header>
              <div>
                <span className="fd-participation-activity__icon">
                  <MessageSquare />
                </span>

                <div>
                  <span className="fd-participation-dashboard__eyebrow">
                    Interacción
                  </span>

                  <h4>
                    Actividad generada en el foro
                  </h4>
                </div>
              </div>

              <span>
                {resumen?.totalIntervenciones ?? 0} intervenciones
              </span>
            </header>

            <div className="fd-participation-activity__grid">
              <article>
                <span className="fd-participation-mini-icon is-orange">
                  <MessageSquare />
                </span>

                <div>
                  <strong>
                    {resumen?.cantidadRespuestas ?? d.respuestas.length}
                  </strong>

                  <span>
                    Respuestas principales
                  </span>
                </div>
              </article>

              <article>
                <span className="fd-participation-mini-icon is-purple">
                  <BookOpenCheck />
                </span>

                <div>
                  <strong>
                    {resumen?.cantidadComentarios ?? 0}
                  </strong>

                  <span>
                    Comentarios
                  </span>
                </div>
              </article>

              <article>
                <span className="fd-participation-mini-icon is-blue">
                  <Eye />
                </span>

                <div>
                  <strong>
                    {resumen?.cantidadVistas ?? 0}
                  </strong>

                  <span>
                    Visualizaciones
                  </span>
                </div>
              </article>

              <article>
                <span className="fd-participation-mini-icon is-green">
                  <Users />
                </span>

                <div>
                  <strong>
                    {resumen?.estudiantesParticipantes ?? 0}
                  </strong>

                  <span>
                    Participantes
                  </span>
                </div>
              </article>
            </div>
          </section>

          {f.penalizarIncumplimientoComentarios && (
            <section className="fd-participation-rule">
              <span className="fd-participation-rule__icon">
                <MessageSquare />
              </span>
              <div>
                <span className="fd-participation-dashboard__eyebrow">
                  Regla calificable
                </span>
                <h4>Comentarios mínimos por integrante</h4>
                <p>
                  Se exigen {f.minimoComentariosPorEstudiante ?? 0} comentario(s). {
                    f.dinamicaGrupal === "PARTICIPACION_DISTRIBUIDA"
                      ? "Solo cuentan los aportes realizados en la respuesta del propio equipo."
                      : "Solo cuentan los comentarios realizados en respuestas de otros equipos."
                  } El representante queda exento porque publica la respuesta principal.
                </p>
              </div>
              <strong>
                {f.tipoPenalizacionComentarios === "PORCENTAJE"
                  ? `-${f.valorPenalizacionComentarios ?? 0}%`
                  : `-${f.valorPenalizacionComentarios ?? 0} pts`}
              </strong>
            </section>
          )}

          <section className="fd-participation-attention">
            <div className="fd-participation-attention__icon">
              <Info />
            </div>

            <div className="fd-participation-attention__body">
              <span className="fd-participation-dashboard__eyebrow">
                Atención docente
              </span>

              <h4>
                Estado general del seguimiento
              </h4>

              <p>
                {(
                  resumen?.estudiantesSinParticipar ??
                  0
                ) === 0 &&
                (
                  d.lecturas?.totalSinLeer ??
                  0
                ) === 0
                  ? "Todos los estudiantes registran lectura y participación en este foro."
                  : `${resumen?.estudiantesSinParticipar ?? 0} estudiante(s) aún no participaron y ${d.lecturas?.totalSinLeer ?? 0} todavía no registran lectura.`}
              </p>
            </div>

            <div className="fd-participation-attention__chips">
              <span className="is-orange">
                {resumen?.estudiantesSinParticipar ?? 0} sin participar
              </span>

              <span className="is-blue">
                {d.lecturas?.totalSinLeer ?? 0} sin leer
              </span>
            </div>
          </section>
        </section>
      )}
      {tab === "calificaciones" && esCalificable && esVistaDocente && (
        <CalificarForo
          cursoId={idCurso}
          foroId={idForo}
          integrado
        />
      )}
      {tab === "historial" && (
        <section className="fd-panel">
          <h3>Historial de actividad</h3>
          {d.historial.length === 0 ? (
            <p className="muted">Todavía no hay movimientos registrados.</p>
          ) : (
            <div className="fd-history">
              {d.historial.map((x: HistorialForo[number]) => (
                <div key={x.id}>
                  <Clock3 />
                  <span>
                    <strong>{etiqueta(x.accion)}</strong>
                    <small>
                      {x.actor
                        ? `${x.actor.nombres} ${x.actor.apellidoPaterno} · `
                        : ""}
                      {fecha(x.registradoEn)}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      {detalleAbierto && (
        <div
          className="fd-detail-backdrop"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget)
              setDetalleAbierto(false);
          }}
        >
          <section
            className="fd-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fd-detail-title"
          >
            <header className="fd-detail-header">
              <div className="fd-detail-header-icon">
                <Settings2 />
              </div>
              <div>
                <span className="fd-detail-eyebrow">
                  Configuración del foro
                </span>
                <h2 id="fd-detail-title">Detalle completo</h2>
                <p>
                  Consulta las reglas, fechas y criterios aplicados a este
                  espacio.
                </p>
              </div>
              <button
                className="fd-detail-close"
                type="button"
                onClick={() => setDetalleAbierto(false)}
                aria-label="Cerrar detalle"
              >
                <X />
              </button>
            </header>

            <div className="fd-detail-summary">
              <div>
                <span className={`fd-badge ${f.estado.toLowerCase()}`}>
                  {etiqueta(f.estado)}
                </span>
                {f.estaFijado && (
                  <span className="fd-pinned">
                    <Pin size={13} /> Fijado
                  </span>
                )}
              </div>
              <h3>{f.titulo}</h3>
              <p>
                {f.objetivo ||
                  "Este foro no tiene un objetivo adicional registrado."}
              </p>
            </div>

            <div className="fd-detail-body">
              <DetalleSeccion icono={<CalendarDays />} titulo="Programación">
                <DetalleDato
                  etiqueta="Fecha de apertura"
                  valor={fecha(f.fechaApertura)}
                />
                <DetalleDato
                  etiqueta="Fecha límite"
                  valor={fecha(f.fechaLimite)}
                />
                <DetalleDato
                  etiqueta="Cierre definitivo"
                  valor={fecha(cierreTemporizador)}
                />
                <DetalleDato
                  etiqueta="Estado actual"
                  valor={etiqueta(f.estado)}
                />
                <DetalleDato
                  etiqueta="Publicación"
                  valor={
                    f.estaFijado ? "Fijado en el aula" : "Publicación normal"
                  }
                />
              </DetalleSeccion>

              <DetalleSeccion icono={<Users />} titulo="Participación">
                <DetalleDato
                  etiqueta="Modalidad"
                  valor={etiqueta(f.modalidadParticipacion)}
                />
                <DetalleDato
                  etiqueta="Origen de grupos"
                  valor={etiqueta(f.origenGrupo)}
                />
                <DetalleDato
                  etiqueta="Dinámica grupal"
                  valor={etiqueta(f.dinamicaGrupal)}
                />
                {f.origenGrupo === "AFINIDAD" && (
                  <>
                    <DetalleDato
                      etiqueta="Integrantes por equipo"
                      valor={`${f.cantidadMinimaIntegrantes ?? 2} a ${f.cantidadMaximaIntegrantes ?? "sin límite"}`}
                    />
                    <DetalleDato
                      etiqueta="Aprobación docente"
                      valor={f.requiereAprobacionEquipos ? "Requerida" : "Automática"}
                      tipo={f.requiereAprobacionEquipos ? "si" : "no"}
                    />
                    <DetalleDato
                      etiqueta="Representante"
                      valor={f.requiereRepresentante === false ? "No obligatorio" : "Obligatorio"}
                      tipo={f.requiereRepresentante === false ? "no" : "si"}
                    />
                  </>
                )}
                <DetalleDato
                  etiqueta="Visibilidad de respuestas"
                  valor={etiqueta(f.visibilidadRespuestas)}
                />
              </DetalleSeccion>

              <DetalleSeccion
                icono={<ShieldCheck />}
                titulo="Permisos y reglas"
              >
                <DetalleDato
                  etiqueta="Comentarios"
                  valor={f.permitirComentarios ? "Permitidos" : "Desactivados"}
                  tipo={f.permitirComentarios ? "si" : "no"}
                />
                <DetalleDato
                  etiqueta="Editar respuestas"
                  valor={
                    f.permitirEditarRespuestas ? "Permitido" : "No permitido"
                  }
                  tipo={f.permitirEditarRespuestas ? "si" : "no"}
                />
                <DetalleDato
                  etiqueta="Eliminar respuestas"
                  valor={
                    f.permitirEliminarRespuestas ? "Permitido" : "No permitido"
                  }
                  tipo={f.permitirEliminarRespuestas ? "si" : "no"}
                />
                <DetalleDato
                  etiqueta="Entregas con retraso"
                  valor={f.permitirRetrasos ? "Permitidas" : "No permitidas"}
                  tipo={f.permitirRetrasos ? "si" : "no"}
                />
                {f.penalizarIncumplimientoComentarios && (
                  <>
                    <DetalleDato
                      etiqueta="Comentarios mínimos"
                      valor={`${f.minimoComentariosPorEstudiante ?? 0} por integrante`}
                    />
                    <DetalleDato
                      etiqueta="Penalización por comentarios"
                      valor={
                        f.tipoPenalizacionComentarios === "PORCENTAJE"
                          ? `${f.valorPenalizacionComentarios ?? 0}%`
                          : `${f.valorPenalizacionComentarios ?? 0} puntos`
                      }
                    />
                    <DetalleDato
                      etiqueta="Representante"
                      valor="Exento de esta penalización"
                      tipo="si"
                    />
                  </>
                )}
              </DetalleSeccion>

              <DetalleSeccion icono={<Paperclip />} titulo="Archivos adjuntos">
                <DetalleDato
                  etiqueta="Adjuntos en respuestas"
                  valor={
                    f.permitirAdjuntosRespuesta ? "Permitidos" : "Desactivados"
                  }
                  tipo={f.permitirAdjuntosRespuesta ? "si" : "no"}
                />
                <DetalleDato
                  etiqueta="Tamaño máximo"
                  valor={`${f.tamanioMaximoArchivoMb ?? 0} MB`}
                />
                <DetalleDato
                  etiqueta="Archivos del tema"
                  valor={`${f.archivos?.length ?? 0} archivo(s)`}
                />
              </DetalleSeccion>

              <DetalleSeccion icono={<Award />} titulo="Evaluación">
                <DetalleDato
                  etiqueta="Foro calificable"
                  valor={esCalificable ? "Sí" : "No"}
                  tipo={esCalificable ? "si" : "no"}
                />
                {esCalificable && (
                  <>
                    <DetalleDato
                      etiqueta="Tipo de evaluación"
                      valor={etiqueta(f.tipoEvaluacion)}
                    />
                    {f.tipoEvaluacion !== "AUTOMATICA" && (
                      <DetalleDato
                        etiqueta="Modalidad de nota"
                        valor={etiqueta(f.modalidadNota)}
                      />
                    )}
                    <DetalleDato
                      etiqueta="Estado de calificación"
                      valor={etiqueta(f.actividadCalificable?.estado)}
                    />
                  </>
                )}
              </DetalleSeccion>
            </div>

            <footer className="fd-detail-footer">
              <p>
                <Eye size={15} /> Esta vista es informativa; no modifica la
                configuración.
              </p>
              <div>
                <button
                  type="button"
                  className="fd-detail-secondary"
                  onClick={() => setDetalleAbierto(false)}
                >
                  Cerrar
                </button>
                {esVistaDocente && (
                  <button
                    type="button"
                    className="fd-detail-edit"
                    onClick={abrirEditor}
                  >
                    <Edit3 /> Editar configuración
                  </button>
                )}
              </div>
            </footer>
          </section>
        </div>
      )}
      {editorAbierto && esVistaDocente && (
        <FormularioForoInteligente
          foroId={idForo}
          onClose={() => setEditorAbierto(false)}
          onSuccess={async () => {
            setEditorAbierto(false);
            await d.cargar();
            mostrarToast(
              "exito",
              "Foro actualizado",
              "La configuración se guardó correctamente.",
            );
          }}
        />
      )}
      <AulaModal
        abierto={Boolean(confirmacion)}
        ancho="compacto"
        titulo={confirmacion?.titulo ?? "Confirmar acción"}
        etiqueta="Confirmación"
        descripcion={confirmacion?.descripcion}
        icono={confirmacion?.tipo === "peligro" ? Trash2 : ShieldCheck}
        bloqueado={d.procesando}
        onCerrar={() => setConfirmacion(null)}
        footer={
          <>
            <button
              type="button"
              className="fd-modal-cancel"
              disabled={d.procesando}
              onClick={() => setConfirmacion(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={`fd-modal-confirm ${confirmacion?.tipo === "peligro" ? "danger" : ""}`}
              disabled={d.procesando}
              onClick={() => void ejecutarConfirmacion()}
            >
              {d.procesando ? "Procesando…" : confirmacion?.textoConfirmar}
            </button>
          </>
        }
      >
        <div className="fd-confirm-content">
          <span className={confirmacion?.tipo === "peligro" ? "danger" : ""}>
            {confirmacion?.tipo === "peligro" ? <Trash2 /> : <Info />}
          </span>
          <p>{confirmacion?.detalle}</p>
        </div>
      </AulaModal>
      <Toast
        visible={toast.visible}
        tipo={toast.tipo}
        titulo={toast.titulo}
        mensaje={toast.mensaje}
        onCerrar={() => setToast((actual) => ({ ...actual, visible: false }))}
      />
      <style>{styles}</style>
    </div>
  );
}

function DetalleSeccion({
  icono,
  titulo,
  children,
}: {
  icono: ReactNode;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="fd-detail-section">
      <div className="fd-detail-section-title">
        <span>{icono}</span>
        <h4>{titulo}</h4>
      </div>
      <div className="fd-detail-data">{children}</div>
    </section>
  );
}

function DetalleDato({
  etiqueta: nombre,
  valor,
  tipo,
}: {
  etiqueta: string;
  valor: string;
  tipo?: "si" | "no";
}) {
  return (
    <div className="fd-detail-datum">
      <span>{nombre}</span>
      <strong className={tipo ? `is-${tipo}` : ""}>
        {tipo && <i>{tipo === "si" ? "✓" : "×"}</i>}
        {valor}
      </strong>
    </div>
  );
}

const styles = `
.fd-page {
  display: grid;
  gap: 18px;
  padding-bottom: 34px;
  color: var(--app-text);
}

.fd-page .aula-header {
  grid-template-columns: minmax(0, 1fr) 270px;
}

.fd-page .aula-header__acciones {
  width: 270px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.fd-page .aula-header__acciones > :nth-child(2) {
  grid-column: 1 / -1;
  grid-row: 2;
}

.fd-page .aula-header__acciones > :nth-child(3) {
  grid-column: 2;
  grid-row: 1;
}

button {
  font-family: inherit;
}

.spin {
  animation: fdspin 1s linear infinite;
}

@keyframes fdspin {
  to { transform: rotate(360deg); }
}

.fd-center,
.fd-error {
  min-height: 320px;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 10px;
  color: var(--app-text-soft);
}

.fd-error button {
  padding: 9px 14px;
  border: 1px solid var(--app-border);
  border-radius: 11px;
  color: var(--app-text);
  background: var(--app-surface);
  cursor: pointer;
}

.fd-countdown {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 62px;
  padding: 11px 14px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.fd-countdown > svg {
  width: 20px;
  height: 20px;
  padding: 10px;
  box-sizing: content-box;
  border-radius: 12px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.fd-countdown div {
  display: grid;
  gap: 2px;
}

.fd-countdown small {
  color: var(--app-text-muted);
  font-size: 9.5px;
  font-weight: 650;
}

.fd-countdown strong {
  color: var(--app-text);
  font-size: 12px;
  font-weight: 850;
  letter-spacing: -.01em;
}

.fd-countdown > span {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  padding: 6px 11px;
  border-radius: 999px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
  font-size: 9px;
  font-weight: 850;
  white-space: nowrap;
}

.fd-countdown.is-finished > span {
  color: #475569;
  background: #eef2f7;
}

.fd-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.fd-metrics > div {
  position: relative;
  min-height: 64px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
  transition:
    transform .16s ease,
    border-color .16s ease,
    background .16s ease;
}

.fd-metrics > div:hover {
  transform: translateY(-1px);
  border-color: var(--app-accent);
  background: var(--app-accent-softer);
}

.fd-metric-icon {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 12px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.fd-metric-icon svg {
  width: 17px;
  height: 17px;
}

.fd-metrics > div > span:last-child {
  position: relative;
  z-index: 1;
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -.03em;
}

.fd-metrics small {
  display: block;
  margin-top: 4px;
  color: var(--app-text-muted);
  font-size: 9px;
  font-weight: 650;
  letter-spacing: 0;
}

.fd-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
  gap: 10px;
  padding: 11px;
  overflow: visible;
  border: 1px solid var(--app-border);
  border-radius: 20px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.fd-tabs button {
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  color: var(--app-text-secondary);
  background: var(--app-surface-alt);
  font: inherit;
  font-size: 10.5px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  transition:
    transform .16s ease,
    border-color .16s ease,
    color .16s ease,
    background .16s ease,
    box-shadow .16s ease;
}

.fd-tabs button:hover:not(.active) {
  transform: translateY(-1px);
  border-color: var(--app-accent);
  color: var(--app-accent-dark);
  background: var(--app-surface);
}

.fd-tabs button.active {
  border-color: var(--app-accent);
  color: #fff;
  background: linear-gradient(
    135deg,
    var(--app-accent),
    var(--app-accent-hover)
  );
  box-shadow:
    0 10px 22px
    color-mix(in srgb, var(--app-accent) 22%, transparent);
}

.fd-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 290px;
  gap: 20px;
  align-items: start;
}

.fd-grid main {
  display: grid;
  gap: 16px;
}

.fd-topic,
.fd-panel,
.fd-empty,
.fd-side-card {
  border: 1px solid var(--app-border-soft);
  border-radius: 21px;
  background: var(--app-surface);
  box-shadow: 0 10px 30px rgba(15, 23, 42, .05);
}

.fd-topic {
  position: relative;
  padding: 24px 26px 26px;
  border-top: 3px solid var(--app-accent);
}


.fd-topic-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.fd-badge,
.fd-pinned,
.fd-state {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: 1px solid color-mix(in srgb, var(--app-accent) 17%, transparent);
  border-radius: 999px;
  color: var(--app-accent-dark);
  background: color-mix(in srgb, var(--app-accent) 9%, var(--app-surface));
  font-size: 9.5px;
  font-weight: 850;
  letter-spacing: .025em;
}

.fd-badge.cerrado,
.fd-badge.anulado {
  color: var(--app-danger);
  border-color: color-mix(in srgb, var(--app-danger) 20%, transparent);
  background: color-mix(in srgb, var(--app-danger) 8%, var(--app-surface));
}

.fd-badge.vencido {
  color: #b45309;
  border-color: color-mix(in srgb, #f59e0b 24%, transparent);
  background: #fff7ed;
}

.fd-topic h3 {
  position: relative;
  margin: 19px 0 9px;
  font-size: 20px;
  letter-spacing: -.035em;
}

.fd-topic > p {
  position: relative;
  margin: 0;
  max-width: 900px;
  color: var(--app-text-secondary);
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.78;
}

.fd-topic aside {
  position: relative;
  margin-top: 20px;
  padding: 15px 17px;
  border: 1px solid color-mix(in srgb, var(--app-accent) 18%, var(--app-border));
  border-left: 4px solid var(--app-accent);
  border-radius: 13px;
  background: color-mix(in srgb, var(--app-accent) 6%, var(--app-surface));
}

.fd-topic aside strong {
  color: var(--app-accent-dark);
  font-size: 11px;
}

.fd-topic aside p {
  margin: 6px 0 0;
  color: var(--app-text-secondary);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.fd-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 15px;
}

.fd-files a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 11px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  color: var(--app-accent-dark);
  background: var(--app-surface);
  text-decoration: none;
  font-size: 10.5px;
  transition: border-color .18s ease, background .18s ease;
}

.fd-files a:hover {
  border-color: var(--app-accent);
  background: color-mix(in srgb, var(--app-accent) 7%, var(--app-surface));
}

.fd-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 3px 0;
}

.fd-section-title h3,
.fd-section-title p {
  margin: 0;
}

.fd-section-title h3 {
  font-size: 15.5px;
  letter-spacing: -.02em;
}

.fd-section-title p {
  margin-top: 4px;
  color: var(--app-text-muted);
  font-size: 10.5px;
}

.fd-section-title > span {
  min-width: 34px;
  padding: 6px 10px;
  border-radius: 999px;
  color: var(--app-accent-dark);
  background: color-mix(in srgb, var(--app-accent) 8%, var(--app-surface));
  font-size: 10px;
  font-weight: 850;
  text-align: center;
}

.fd-empty {
  min-height: 210px;
  display: grid;
  place-content: center;
  justify-items: center;
  padding: 36px 20px;
  border-style: dashed;
  text-align: center;
  box-shadow: none;
  background:
    radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--app-accent) 6%, transparent), transparent 32%),
    var(--app-surface);
}

.fd-empty > svg {
  width: 46px;
  height: 46px;
  padding: 11px;
  border-radius: 15px;
  color: var(--app-accent-dark);
  background: color-mix(in srgb, var(--app-accent) 9%, var(--app-surface));
}

.fd-empty strong {
  display: block;
  margin-top: 10px;
  color: var(--app-text);
  font-size: 14px;
}

.fd-empty p {
  max-width: 360px;
  margin: 6px 0 0;
  color: var(--app-text-muted);
  font-size: 10.5px;
  line-height: 1.55;
}

.fd-side {
  position: sticky;
  top: 16px;
  display: grid;
  gap: 14px;
}

.fd-side-card {
  overflow: hidden;
}

.fd-side-head,
.fd-status-title {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 15px 16px;
  border-bottom: 1px solid var(--app-border-soft);
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--app-accent) 6%, var(--app-surface)),
      var(--app-surface)
    );
}

.fd-side-head > span,
.fd-status-title > span {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: var(--app-accent-dark);
  background: color-mix(in srgb, var(--app-accent) 9%, var(--app-surface));
}

.fd-side-head h3,
.fd-side-head p,
.fd-status-title h3,
.fd-status-title p {
  margin: 0;
}

.fd-side-head h3,
.fd-status-title h3 {
  font-size: 12px;
}

.fd-side-head p,
.fd-status-title p {
  margin-top: 2px;
  color: var(--app-text-muted);
  font-size: 9.5px;
}

.fd-side-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 12px;
}

.fd-side-actions button.danger {
  grid-column: 1 / -1;
}

.fd-side-actions button {
  width: 100%;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 9px;
  padding: 9px 11px;
  border: 1px solid var(--app-border-strong);
  border-radius: 12px;
  color: var(--app-text-secondary);
  background: var(--app-surface);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color .16s ease,
    background .16s ease,
    transform .16s ease;
}

.fd-side-actions button:hover {
  transform: translateY(-1px);
  border-color: var(--app-accent);
  background: color-mix(in srgb, var(--app-accent-soft) 38%, var(--app-surface));
}

.fd-side-actions button > svg {
  width: 17px;
  height: 17px;
  flex: 0 0 17px;
  color: var(--app-accent-dark);
}

.fd-side-actions button > span {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.fd-side-actions button strong {
  color: var(--app-text-secondary);
  font-size: 10.5px;
  font-weight: 750;
}

.fd-side-actions button small {
  overflow: hidden;
  color: var(--app-text-muted);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fd-side-actions button.danger {
  border-color: color-mix(in srgb, var(--app-danger) 28%, var(--app-border));
  background: var(--app-surface);
}

.fd-side-actions button.danger:hover {
  border-color: var(--app-danger);
  background: color-mix(in srgb, var(--app-danger) 5%, var(--app-surface));
}

.fd-side-actions button.danger > svg,
.fd-side-actions button.danger strong {
  color: var(--app-danger);
}

.fd-status-card {
  padding-bottom: 13px;
}

.fd-status-banner {
  margin: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 13px;
  border: 1px solid color-mix(in srgb, #22a06b 18%, var(--app-border));
  border-radius: 13px;
  background: color-mix(in srgb, #22a06b 6%, var(--app-surface));
}

.fd-status-banner > div {
  display: grid;
  gap: 3px;
}

.fd-status-banner small {
  color: var(--app-text-muted);
  font-size: 9px;
}

.fd-status-banner strong {
  color: #18794e;
  font-size: 11px;
}

.fd-status-banner.cerrado,
.fd-status-banner.anulado {
  border-color: color-mix(in srgb, var(--app-danger) 22%, var(--app-border));
  background: color-mix(in srgb, var(--app-danger) 5%, var(--app-surface));
}

.fd-status-banner.cerrado strong,
.fd-status-banner.anulado strong {
  color: var(--app-danger);
}

.fd-status-dot {
  width: 10px;
  height: 10px;
  flex: 0 0 10px;
  border-radius: 50%;
  background: #22a06b;
  box-shadow: 0 0 0 4px color-mix(in srgb, #22a06b 12%, transparent);
}

.fd-status-banner.cerrado .fd-status-dot,
.fd-status-banner.anulado .fd-status-dot {
  background: var(--app-danger);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--app-danger) 10%, transparent);
}

.fd-status-data {
  display: grid;
  gap: 0;
  padding: 0 13px;
}

.fd-status-data > div {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 10px 2px;
  border-top: 1px dashed var(--app-border);
}

.fd-status-data > div:first-child {
  border-top: 0;
}

.fd-status-data svg {
  width: 15px;
  height: 15px;
  margin-top: 1px;
  flex: 0 0 15px;
  color: var(--app-text-muted);
}

.fd-status-data span {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.fd-status-data small {
  color: var(--app-text-muted);
  font-size: 8.5px;
}

.fd-status-data strong {
  color: var(--app-text-secondary);
  font-size: 9.5px;
  line-height: 1.4;
}

.fd-panel {
  padding: 22px;
}

.fd-panel > h3 {
  margin: 0 0 17px;
  font-size: 17px;
  letter-spacing: -.02em;
}

.fd-panel > h3::after {
  content: "";
  display: block;
  width: 34px;
  height: 3px;
  margin-top: 8px;
  border-radius: 999px;
  background: var(--app-accent);
}

.fd-panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.fd-panel-heading > div {
  display: flex;
  align-items: center;
  gap: 11px;
}

.fd-panel-heading h3,
.fd-panel-heading p {
  margin: 0;
}

.fd-panel-heading p {
  margin-top: 3px;
  color: var(--app-text-muted);
  font-size: 10.5px;
}

.fd-panel-icon {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: var(--app-accent-dark);
  background: color-mix(in srgb, var(--app-accent) 9%, var(--app-surface));
}

.fd-panel-icon svg {
  width: 18px;
}

.fd-big-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.fd-big-metrics div {
  display: grid;
  gap: 4px;
  padding: 17px;
  border: 1px solid color-mix(in srgb, var(--app-accent) 13%, var(--app-border));
  border-radius: 15px;
  background:
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--app-accent) 7%, var(--app-surface)),
      var(--app-surface)
    );
}

.fd-big-metrics strong {
  color: var(--app-accent-dark);
  font-size: 26px;
  letter-spacing: -.045em;
}

.fd-big-metrics span {
  color: var(--app-text-soft);
  font-size: 10px;
}


.fd-dashboard-card {
  position: relative;
  min-height: 132px;
  align-content: start;
  overflow: hidden;
}

.fd-dashboard-card__label {
  color: var(--app-text-muted) !important;
  font-size: 9px !important;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: .06em;
}

.fd-dashboard-card strong {
  margin-top: 4px;
  font-size: 28px !important;
}

.fd-dashboard-card small {
  color: var(--app-text-muted);
  font-size: 9px;
}

.fd-dashboard-card > i {
  height: 6px;
  margin-top: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--app-surface-disabled);
}

.fd-dashboard-card > i > b {
  height: 100%;
  display: block;
  border-radius: inherit;
  background: var(--app-accent);
}

.fd-dashboard-card.is-success > i > b {
  background: var(--app-success);
}

.fd-dashboard-card.is-info > i > b {
  background: var(--app-info);
}

.fd-dashboard-card.is-warning strong {
  color: var(--app-warning);
}

.fd-dashboard-card.is-neutral strong {
  color: var(--app-text-secondary);
}

.fd-participation-note,
.fd-grading-guide {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  margin-top: 14px;
  padding: 13px 14px;
  border: 1px solid var(--app-border);
  border-radius: 13px;
  color: var(--app-text-secondary);
  background: color-mix(in srgb, var(--app-bg) 35%, var(--app-surface));
}

.fd-participation-note > svg,
.fd-grading-guide > svg {
  width: 18px;
  flex: 0 0 auto;
  color: var(--app-accent);
}

.fd-participation-note strong,
.fd-grading-guide strong {
  font-size: 10.5px;
}

.fd-participation-note p,
.fd-grading-guide p {
  margin: 3px 0 0;
  color: var(--app-text-muted);
  font-size: 10px;
  line-height: 1.5;
}

.fd-history {
  max-width: 760px;
  display: grid;
  margin-top: 6px;
}

.fd-history > div {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 4px;
  border-bottom: 1px solid var(--app-border);
}

.fd-history > div > svg {
  width: 28px;
  height: 28px;
  padding: 6px;
  border-radius: 9px;
  color: var(--app-accent-dark);
  background: color-mix(in srgb, var(--app-accent) 9%, var(--app-surface));
}

.fd-history span {
  display: grid;
  gap: 3px;
}

.fd-history strong {
  font-size: 10.5px;
}

.fd-history small,
.muted {
  color: var(--app-text-muted);
  font-size: 9.5px;
}

.fd-answer,
.fd-comments {
  border: 1px solid var(--app-border-soft);
  border-radius: 18px;
  background: var(--app-surface);
}

.fd-answer {
  padding: 18px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, .04);
}

.fd-answer header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fd-avatar {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  color: var(--app-accent-dark);
  background: color-mix(in srgb, var(--app-accent) 9%, var(--app-surface));
  font-weight: 900;
}

.fd-answer header p {
  margin: 3px 0 0;
  color: var(--app-text-muted);
  font-size: 10px;
}

.fd-answer header .fd-state {
  margin-left: auto;
}

.fd-state.late {
  color: #9a5a00;
  background: #fff1c9;
}

.fd-answer-text {
  padding: 16px 0;
  color: var(--app-text-secondary);
  white-space: pre-wrap;
  line-height: 1.62;
}

.fd-answer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--app-border);
}

.fd-answer-actions span {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-right: auto;
  color: var(--app-text-muted);
  font-size: 10px;
}

.fd-answer-actions button,
.fd-row button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  color: var(--app-text-secondary);
  background: var(--app-surface);
  font-size: 10px;
  cursor: pointer;
}

.danger {
  color: var(--app-danger) !important;
}

.fd-comments {
  display: grid;
  gap: 7px;
  margin-top: 12px;
  padding: 11px;
  background: var(--app-bg);
}

.fd-comment {
  padding: 9px;
  border-left: 2px solid var(--app-border-strong);
}

.fd-comment > div {
  display: flex;
  align-items: center;
  gap: 7px;
}

.fd-comment span {
  color: var(--app-text-muted);
  font-size: 9px;
}

.fd-comment button {
  margin-left: auto;
  border: 0;
  color: var(--app-danger);
  background: none;
  font-size: 9px;
}

.fd-comment p {
  margin: 5px 0;
  font-size: 11px;
  line-height: 1.45;
}

.fd-row {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.fd-confirm-content {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 8px 2px;
}

.fd-confirm-content > span {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 14px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.fd-confirm-content > span.danger {
  color: var(--app-danger);
  background: color-mix(in srgb, var(--app-danger) 10%, var(--app-surface));
}

.fd-confirm-content svg {
  width: 20px;
}

.fd-confirm-content p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 12px;
  line-height: 1.55;
}

.fd-modal-cancel,
.fd-modal-confirm {
  min-height: 38px;
  padding: 9px 15px;
  border-radius: 11px;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.fd-modal-cancel {
  border: 1px solid var(--app-border);
  color: var(--app-text-secondary);
  background: var(--app-surface);
}

.fd-modal-confirm {
  border: 1px solid var(--app-accent);
  color: #fff;
  background: var(--app-accent);
}

.fd-modal-confirm.danger {
  border-color: var(--app-danger);
  color: #fff !important;
  background: var(--app-danger);
}

.fd-modal-cancel:disabled,
.fd-modal-confirm:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.fd-detail-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(31, 24, 20, .58);
  backdrop-filter: blur(7px);
  animation: fdFadeIn .18s ease-out;
}

.fd-detail-modal {
  width: min(920px, 100%);
  max-height: min(88vh, 900px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--app-accent) 18%, var(--app-border));
  border-radius: 25px;
  background: var(--app-surface);
  box-shadow: 0 28px 75px rgba(43, 31, 24, .28);
  animation: fdModalIn .22s cubic-bezier(.2,.8,.2,1);
}

@keyframes fdFadeIn {
  from { opacity: 0; }
}

@keyframes fdModalIn {
  from {
    opacity: 0;
    transform: translateY(14px) scale(.98);
  }
}

.fd-detail-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--app-border);
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--app-accent) 9%, var(--app-surface)),
      var(--app-surface) 58%
    );
}

.fd-detail-header-icon {
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 15px;
  color: #fff;
  background: linear-gradient(145deg, var(--app-accent), var(--app-accent-dark));
  box-shadow: 0 8px 20px color-mix(in srgb, var(--app-accent) 30%, transparent);
}

.fd-detail-header-icon svg {
  width: 22px;
}

.fd-detail-eyebrow {
  color: var(--app-accent-dark);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.fd-detail-header h2 {
  margin: 2px 0 3px;
  font-size: 21px;
}

.fd-detail-header p {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 11px;
}

.fd-detail-close {
  width: 36px;
  height: 36px;
  margin-left: auto;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid var(--app-border);
  border-radius: 11px;
  color: var(--app-text-soft);
  background: var(--app-surface);
  cursor: pointer;
}

.fd-detail-close:hover {
  color: var(--app-danger);
  border-color: color-mix(in srgb, var(--app-danger) 35%, var(--app-border));
}

.fd-detail-close svg {
  width: 17px;
}

.fd-detail-summary {
  margin: 18px 24px 0;
  padding: 17px 19px;
  border: 1px solid color-mix(in srgb, var(--app-accent) 21%, var(--app-border));
  border-radius: 17px;
  background:
    linear-gradient(
      120deg,
      color-mix(in srgb, var(--app-accent) 7%, var(--app-surface)),
      var(--app-surface)
    );
}

.fd-detail-summary > div {
  display: flex;
  gap: 7px;
}

.fd-detail-summary h3 {
  margin: 10px 0 4px;
  font-size: 16px;
}

.fd-detail-summary p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 11px;
  line-height: 1.55;
}

.fd-detail-body {
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 15px 24px 22px;
  overflow-y: auto;
}

.fd-detail-section {
  padding: 15px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: color-mix(in srgb, var(--app-surface) 96%, var(--app-bg));
}

.fd-detail-section-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 12px;
}

.fd-detail-section-title > span {
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.fd-detail-section-title svg {
  width: 15px;
}

.fd-detail-section-title h4 {
  margin: 0;
  font-size: 12px;
}

.fd-detail-data {
  display: grid;
}

.fd-detail-datum {
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 7px 0;
  border-top: 1px dashed var(--app-border);
}

.fd-detail-datum:first-child {
  border-top: 0;
}

.fd-detail-datum > span {
  color: var(--app-text-muted);
  font-size: 10px;
}

.fd-detail-datum strong {
  max-width: 58%;
  color: var(--app-text-secondary);
  font-size: 10px;
  text-align: right;
}

.fd-detail-datum strong i {
  width: 17px;
  height: 17px;
  display: inline-grid;
  place-items: center;
  margin-right: 5px;
  border-radius: 50%;
  font-style: normal;
}

.fd-detail-datum strong.is-si i {
  color: #17824c;
  background: #e3f7ec;
}

.fd-detail-datum strong.is-no i {
  color: var(--app-danger);
  background: color-mix(in srgb, var(--app-danger) 10%, var(--app-surface));
}

.fd-detail-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 24px;
  border-top: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-bg) 25%, var(--app-surface));
}

.fd-detail-footer p {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: var(--app-text-muted);
  font-size: 10px;
}

.fd-detail-footer > div {
  display: flex;
  gap: 8px;
}

.fd-detail-footer button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 13px;
  border-radius: 10px;
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}

.fd-detail-footer button svg {
  width: 14px;
}

.fd-detail-secondary {
  border: 1px solid var(--app-border);
  color: var(--app-text-secondary);
  background: var(--app-surface);
}

.fd-detail-edit {
  border: 1px solid var(--app-accent);
  color: #fff;
  background: var(--app-accent);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--app-accent) 25%, transparent);
}

.fd-detail-edit:hover {
  background: var(--app-accent-dark);
}

.fd-alert {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 14px;
  border: 1px solid color-mix(in srgb, var(--app-danger) 35%, var(--app-border));
  border-radius: 13px;
  color: var(--app-danger);
  background: color-mix(in srgb, var(--app-danger) 8%, var(--app-surface));
}

.fd-alert button {
  margin-left: auto;
  border: 0;
  color: inherit;
  background: none;
  font-size: 20px;
}

.fd-grading-metrics {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.fd-grading-metrics > div:nth-child(3) {
  grid-column: 1 / -1;
  color: #fff;
  background: linear-gradient(135deg, var(--app-accent), var(--app-accent-dark));
}

.fd-grading-metrics > div:nth-child(3) strong,
.fd-grading-metrics > div:nth-child(3) span {
  color: #fff;
}

.fd-evaluation-state {
  padding: 6px 10px;
  border-radius: 999px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
  font-size: 9px;
  font-weight: 800;
}



.fd-affinity {
  display: grid;
  gap: 12px;
}

.fd-affinity__heading,
.fd-affinity__section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 15px 17px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.fd-affinity__heading-main,
.fd-affinity__section-heading > div {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.fd-affinity__heading-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  flex: 0 0 44px;
  border-radius: 12px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.fd-affinity__heading-icon svg {
  width: 21px;
  height: 21px;
}

.fd-affinity__eyebrow {
  display: block;
  margin-bottom: 2px;
  color: var(--app-accent-dark);
  font-size: 8.5px;
  font-weight: 900;
  letter-spacing: .07em;
  text-transform: uppercase;
}

.fd-affinity__heading h3,
.fd-affinity__heading p,
.fd-affinity__section-heading h4,
.fd-affinity__section-heading p {
  margin: 0;
}

.fd-affinity__heading h3,
.fd-affinity__section-heading h4 {
  color: var(--app-text);
  font-size: 16px;
  font-weight: 900;
}

.fd-affinity__heading p,
.fd-affinity__section-heading p {
  margin-top: 3px;
  color: var(--app-text-muted);
  font-size: 9.5px;
  line-height: 1.4;
}

.fd-affinity__refresh {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 11px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  color: var(--app-text-secondary);
  background: var(--app-surface);
  font: inherit;
  font-size: 9.5px;
  font-weight: 800;
  cursor: pointer;
}

.fd-affinity__refresh svg {
  width: 15px;
  height: 15px;
}

.fd-affinity__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
}

.fd-affinity__metrics article {
  min-width: 0;
  min-height: 82px;

  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;

  padding: 12px 16px;

  border: 1px solid var(--app-border);
  border-radius: 14px;

  background: var(--app-surface);
}

.fd-affinity__metric-icon {
  position: relative;

  width: 44px;
  height: 44px;

  display: block;

  flex: 0 0 44px;

  margin: 0;
  padding: 0;

  border-radius: 11px;

  color: var(--app-accent-dark);
  background: var(--app-accent-soft);

  line-height: 0;
}

.fd-affinity__metric-icon svg {
  position: absolute;

  top: 50%;
  left: 50%;

  width: 21px;
  height: 21px;

  display: block;

  margin: 0;
  padding: 0;

  transform:
    translate(
      -50%,
      -50%
    );
}

.fd-affinity__metrics article > div {
  min-width: 0;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;

  text-align: left;
}

.fd-affinity__metrics strong,
.fd-affinity__metrics span,
.fd-affinity__metrics small {
  display: block;
}

.fd-affinity__metrics strong {
  color: var(--app-text);

  font-size: 16px;
  line-height: 1.05;
  font-weight: 900;

  white-space: nowrap;
}

.fd-affinity__metrics article > div > span {
  margin-top: 4px;

  color: var(--app-text-secondary);

  font-size: 9.5px;
  line-height: 1.1;
  font-weight: 800;

  white-space: nowrap;
}

.fd-affinity__metrics small {
  margin-top: 3px;

  overflow: hidden;

  color: var(--app-text-muted);

  font-size: 8px;
  line-height: 1.15;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.fd-affinity__rules {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 9px;
  align-items: center;
  padding: 11px 13px;
  border: 1px solid
    color-mix(
      in srgb,
      var(--app-accent) 28%,
      var(--app-border)
    );
  border-left: 4px solid var(--app-accent);
  border-radius: 13px;
  background: var(--app-accent-softer);
}

.fd-affinity__rules > svg {
  width: 17px;
  height: 17px;
  color: var(--app-accent-dark);
}

.fd-affinity__rules strong {
  color: var(--app-text);
  font-size: 9.5px;
}

.fd-affinity__rules p {
  margin: 2px 0 0;
  color: var(--app-text-secondary);
  font-size: 8.7px;
  line-height: 1.45;
}

.fd-affinity__section-heading {
  box-shadow: none;
}

.fd-affinity__section-heading > strong {
  color: var(--app-accent-dark);
  font-size: 9.5px;
  font-weight: 850;
}

.fd-affinity__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 11px;
  align-items: start;
}

.fd-affinity-team {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.fd-affinity-team::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 4px;
  background: var(--team-color);
}

.fd-affinity-team__header {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 12px;
  align-items: center;

  min-height: 76px;

  padding: 14px 15px 12px;
}

.fd-affinity-team__identifier {
  width: 48px;
  height: 48px;

  display: grid;
  place-items: center;

  margin: 0;
  padding: 0;
  border: 1px solid
    color-mix(
      in srgb,
      var(--team-color) 36%,
      var(--app-border)
    );
  border-radius: 14px;
  color: var(--team-color);
  background:
    color-mix(
      in srgb,
      var(--team-color) 10%,
      var(--app-surface)
    );
  font-size: 14px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.03em;
  text-align: center;
}

.fd-affinity-team__header > div {
  min-width: 0;
  display: grid;
  align-content: center;
}

.fd-affinity-team__header small {
  display: block;
  color: var(--app-text-muted);
  font-size: 8.6px;
  line-height: 1.15;
  font-weight: 850;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.fd-affinity-team__header h4 {
  margin: 3px 0 0;

  color: var(--app-text);

  font-size: 15.5px;
  line-height: 1.15;
  font-weight: 900;
}

.fd-affinity-team__header div > span {
  display: block;
  margin-top: 3px;
  color: var(--app-text-muted);
  font-size: 9.4px;
  line-height: 1.2;
}

.fd-affinity-team__state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  min-height: 26px;
  padding: 4px 9px;
  border-radius: 999px;
  color: #047857;
  background: #d1fae5;
  font-size: 8.4px;
  font-weight: 850;
  white-space: nowrap;
}

.fd-affinity-team__members {
  padding: 0 14px;
}

.fd-affinity-member {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 11px;
  align-items: center;

  min-height: 64px;

  padding: 9px 0;

  border-top: 1px solid var(--app-border-soft);
}

.fd-affinity-member:first-child {
  border-top: 0;
}


.fd-affinity-member__avatar .ius-avatar__surface {
  border-color:
    color-mix(
      in srgb,
      var(--team-color) 38%,
      var(--app-border)
    ) !important;

  background:
    linear-gradient(
      135deg,
      color-mix(
        in srgb,
        var(--team-color) 10%,
        var(--app-surface)
      ),
      var(--app-surface)
    ) !important;
}

.fd-affinity-member__avatar .ius-avatar__initials {
  color:
    var(--team-color) !important;
}

.fd-affinity-member__avatar .ius-avatar__surface > span {
  color:
    var(--team-color) !important;
}

.fd-affinity-member__data {
  min-width: 0;
  display: grid;
  align-content: center;
}

.fd-affinity-member__data strong,
.fd-affinity-member__data small {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.fd-affinity-member__data strong {
  color: var(--app-text);
  font-size: 11.8px;
  line-height: 1.2;
  font-weight: 850;
}

.fd-affinity-member__data small {
  margin-top: 2px;
  color: var(--app-text-muted);
  font-size: 9.1px;
  line-height: 1.2;
}

.fd-affinity-member__role {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  align-self: center;
  justify-self: end;

  gap: 5px;

  min-height: 29px;

  padding: 5px 9px;
  border: 1px solid
    color-mix(
      in srgb,
      var(--team-color) 26%,
      var(--app-border)
    );
  border-radius: 999px;
  color: var(--team-color);
  background:
    color-mix(
      in srgb,
      var(--team-color) 7%,
      var(--app-surface)
    );
  font-size: 8.4px;
  line-height: 1;
  font-weight: 850;
  white-space: nowrap;
}

.fd-affinity-member__role svg {
  width: 12px;
  height: 12px;
}


.fd-affinity-team__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 14px;
  min-height: 38px;
  padding: 9px 16px 10px;
  border-top: 1px solid var(--app-border-soft);
  color: var(--app-text-muted);
  background: var(--app-surface-alt);
  font-size: 8.7px;
}

.fd-affinity-team__footer strong {
  color: var(--app-text-secondary);
  font-weight: 750;
}

@media (max-width: 980px) {
  .fd-affinity__metrics {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .fd-affinity__metrics {
    grid-template-columns:
      1fr;
  }

  .fd-affinity__metrics article {
    width: 100%;
  }
}

@media (max-width: 760px) {
  .fd-affinity__grid {
    grid-template-columns: 1fr;
  }

  .fd-affinity__heading,
  .fd-affinity__section-heading {
    align-items: stretch;
    flex-direction: column;
  }
}

.fd-team-refresh {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 7px 11px;
  border: 1px solid var(--app-border-strong);
  border-radius: 11px;
  color: var(--app-text-secondary);
  background: var(--app-surface);
  font: inherit;
  font-size: 9.5px;
  font-weight: 750;
  cursor: pointer;
}

.fd-team-refresh svg {
  width: 15px;
  height: 15px;
}

.fd-team-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
  margin-bottom: 12px;
}

.fd-team-summary article {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 13px;
  border: 1px solid var(--app-border);
  border-radius: 13px;
  background: var(--app-surface-alt);
}

.fd-team-summary span {
  color: var(--app-text-muted);
  font-size: 9px;
}

.fd-team-summary strong {
  color: var(--app-text);
  font-size: 18px;
}

.fd-team-rules {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 13px;
  padding: 11px 13px;
  border: 1px solid color-mix(in srgb, var(--app-accent) 20%, var(--app-border));
  border-left: 4px solid var(--app-accent);
  border-radius: 12px;
  background: var(--app-accent-soft);
}

.fd-team-rules > svg {
  width: 17px;
  flex: 0 0 17px;
  color: var(--app-accent-dark);
}

.fd-team-rules strong {
  font-size: 10px;
}

.fd-team-rules p {
  margin: 3px 0 0;
  color: var(--app-text-soft);
  font-size: 9.5px;
  line-height: 1.5;
}

.fd-teams-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.fd-team-card {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 17px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.fd-team-card > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid var(--app-border-soft);
  background: var(--app-surface-alt);
}

.fd-team-card h4 {
  margin: 7px 0 3px;
  font-size: 13px;
}

.fd-team-card header p {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 9.5px;
}

.fd-team-status {
  display: inline-flex;
  padding: 4px 7px;
  border-radius: 999px;
  color: var(--app-warning);
  background: var(--app-warning-bg);
  font-size: 8px;
  font-weight: 850;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.fd-team-status--aprobado {
  color: var(--app-success);
  background: var(--app-success-bg);
}

.fd-team-status--rechazado {
  color: var(--app-danger);
  background: var(--app-danger-bg);
}

.fd-team-count {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border: 1px solid var(--app-border);
  border-radius: 9px;
  color: var(--app-text-muted);
  background: var(--app-surface);
  font-size: 9px;
}

.fd-team-members {
  display: grid;
  padding: 8px 12px;
}

.fd-team-member {
  min-height: 48px;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  padding: 7px 0;
  border-bottom: 1px solid var(--app-border-soft);
}

.fd-team-member:last-child {
  border-bottom: 0;
}

.fd-team-avatar {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--app-accent) 25%, var(--app-border));
  border-radius: 11px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
  font-size: 9px;
  font-weight: 900;
}

.fd-team-member > span:nth-child(2) {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.fd-team-member strong {
  overflow: hidden;
  color: var(--app-text);
  font-size: 9.5px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.fd-team-member small {
  color: var(--app-text-muted);
  font-size: 8.5px;
}

.fd-team-member-actions {
  display: flex;
  gap: 5px;
}

.fd-team-member-actions button {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid var(--app-border);
  border-radius: 9px;
  color: var(--app-accent-dark);
  background: var(--app-surface);
  cursor: pointer;
}

.fd-team-member-actions button svg {
  width: 14px;
  height: 14px;
}

.fd-team-member-actions button:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.fd-team-meta {
  display: grid;
  gap: 3px;
  padding: 10px 13px;
  border-top: 1px solid var(--app-border-soft);
  color: var(--app-text-muted);
  background: var(--app-surface-alt);
  font-size: 8.5px;
}

.fd-team-card > footer {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
  padding: 10px 12px;
  border-top: 1px solid var(--app-border-soft);
}

.fd-team-card > footer button {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 10px;
  font: inherit;
  font-size: 9px;
  font-weight: 750;
  cursor: pointer;
}

.fd-team-primary {
  border: 1px solid var(--app-accent);
  color: #fff;
  background: var(--app-accent);
}

.fd-team-primary svg {
  width: 14px;
}

.fd-team-secondary {
  border: 1px solid var(--app-border-strong);
  color: var(--app-text-secondary);
  background: var(--app-surface);
}

.fd-team-card > footer button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.fd-team-empty {
  min-height: 175px;
}


.fd-page > .cf-pagina {
  width: 100%;
  min-width: 0;
}

.fd-loading-page,
.fd-error-page {
  display: grid;
  gap: 16px;
  padding-bottom: 34px;
}

.fd-loading-page {
  animation: fdLoadingIn .22s ease-out;
}

.fd-loading-header {
  min-height: 170px;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) 260px;
  align-items: center;
  gap: 18px;
  padding: 24px 26px;
  border: 1px solid var(--app-border);
  border-left: 5px solid var(--app-accent);
  border-radius: 24px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.fd-loading-header__icon {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  background: var(--app-surface-disabled);
  animation: fdPulse 1.25s ease-in-out infinite;
}

.fd-loading-header__text {
  display: grid;
  gap: 9px;
}

.fd-loading-header__text > span,
.fd-loading-header__text > strong,
.fd-loading-header__text > small,
.fd-loading-header__text i,
.fd-loading-header__actions span,
.fd-loading-countdown > span,
.fd-loading-countdown small,
.fd-loading-countdown strong,
.fd-loading-countdown > i,
.fd-loading-tabs span {
  display: block;
  border-radius: 999px;
  background: var(--app-surface-disabled);
  animation: fdPulse 1.25s ease-in-out infinite;
}

.fd-loading-header__text > span {
  width: 105px;
  height: 10px;
}

.fd-loading-header__text > strong {
  width: min(390px, 75%);
  height: 25px;
}

.fd-loading-header__text > small {
  width: min(300px, 60%);
  height: 11px;
}

.fd-loading-header__text > div {
  display: flex;
  gap: 8px;
  margin-top: 3px;
}

.fd-loading-header__text i {
  width: 135px;
  height: 29px;
}

.fd-loading-header__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.fd-loading-header__actions span {
  height: 40px;
}

.fd-loading-header__actions span:nth-child(2) {
  grid-column: 1 / -1;
}

.fd-loading-countdown {
  min-height: 70px;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 150px;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: var(--app-surface);
}

.fd-loading-countdown > span {
  width: 25px;
  height: 25px;
  border-radius: 9px;
}

.fd-loading-countdown > div {
  display: grid;
  gap: 6px;
}

.fd-loading-countdown small {
  width: 95px;
  height: 8px;
}

.fd-loading-countdown strong {
  width: 170px;
  height: 12px;
}

.fd-loading-countdown > i {
  justify-self: end;
  width: 145px;
  height: 31px;
}

.fd-loading-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 11px;
  border: 1px solid var(--app-border);
  border-radius: 20px;
  background: var(--app-surface);
}

.fd-loading-tabs span {
  height: 52px;
  border-radius: 14px;
}

.fd-loading-content {
  padding: 20px;
  border: 1px solid var(--app-border);
  border-radius: 21px;
  background: var(--app-surface);
}

.fd-team-loading {
  padding-top: 4px;
}

@keyframes fdPulse {
  0%,
  100% {
    opacity: .62;
  }

  50% {
    opacity: 1;
  }
}

@keyframes fdLoadingIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}


@media (max-width: 1050px) {
  .fd-grid {
    grid-template-columns: minmax(0, 1fr) 260px;
  }
}

@media (max-width: 900px) {
  .fd-loading-header {
    grid-template-columns: 58px minmax(0, 1fr);
  }

  .fd-loading-header__actions {
    grid-column: 1 / -1;
    grid-template-columns: repeat(3, 1fr);
  }

  .fd-loading-header__actions span:nth-child(2) {
    grid-column: auto;
  }

  .fd-loading-tabs {
    grid-template-columns: repeat(2, 1fr);
  }

  .fd-page .aula-header {
    grid-template-columns: 1fr;
  }

  .fd-page .aula-header__acciones {
    width: 100%;
  }

  .fd-grid {
    grid-template-columns: 1fr;
  }

  .fd-side {
    position: static;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fd-big-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fd-detail-body {
    grid-template-columns: 1fr;
  }

  .fd-teams-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .fd-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fd-side {
    grid-template-columns: 1fr;
  }

  .fd-topic {
    padding: 20px;
  }

  .fd-team-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .fd-page {
    gap: 13px;
  }

  .fd-page .aula-header__acciones {
    grid-template-columns: 1fr;
  }

  .fd-page .aula-header__acciones > :nth-child(1),
  .fd-page .aula-header__acciones > :nth-child(2),
  .fd-page .aula-header__acciones > :nth-child(3) {
    grid-column: 1;
    grid-row: auto;
  }

  .fd-countdown {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .fd-countdown > span {
    width: 100%;
    margin-left: 0;
    text-align: center;
  }

  .fd-metrics > div {
    min-height: 58px;
    padding: 9px 10px;
  }

  .fd-metric-icon {
    width: 34px;
    height: 34px;
    flex-basis: 34px;
  }

  .fd-metrics > div > span:last-child {
    font-size: 16px;
  }

  .fd-tabs button {
    min-height: 39px;
    padding: 8px 11px;
  }

  .fd-panel-heading {
    align-items: flex-start;
  }

  .fd-evaluation-state {
    display: none;
  }

  .fd-grading-metrics {
    grid-template-columns: 1fr;
  }

  .fd-grading-metrics > div:nth-child(3) {
    grid-column: auto;
  }

  .fd-detail-backdrop {
    padding: 0;
    place-items: end center;
  }

  .fd-detail-modal {
    width: 100%;
    max-height: 94vh;
    border-radius: 23px 23px 0 0;
  }

  .fd-detail-header {
    padding: 18px;
  }

  .fd-detail-header-icon {
    width: 42px;
    height: 42px;
  }

  .fd-detail-header p {
    display: none;
  }

  .fd-detail-summary {
    margin: 14px 17px 0;
  }

  .fd-detail-body {
    padding: 12px 17px 18px;
  }

  .fd-detail-footer {
    align-items: stretch;
    flex-direction: column;
    padding: 12px 17px;
  }

  .fd-detail-footer > div {
    width: 100%;
  }

  .fd-detail-footer button {
    flex: 1;
  }

  .fd-detail-footer p {
    display: none;
  }

  .fd-answer-actions {
    flex-wrap: wrap;
  }

  .fd-row {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fd-metrics > div,
  .fd-tabs button,
  .fd-side-actions button {
    transition: none;
  }
}

/* =========================================================
   Equipos del foro — lectura coherente con DetalleGrupo
   ========================================================= */

.fd-team-card {
  position: relative;

  overflow: hidden;

  border: 1px solid var(--app-border);
  border-radius: 16px;

  background: var(--app-surface);

  box-shadow: var(--app-shadow-sm);
}

.fd-team-card::before {
  content: "";

  position: absolute;
  inset: 0 0 auto 0;

  height: 4px;

  background: var(--app-accent);
}

.fd-team-card > header {
  min-height: 72px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 14px 15px 12px;
}

.fd-team-card > header h4 {
  margin: 0;

  color: var(--app-text);

  font-size: 15px;
  line-height: 1.15;
  font-weight: 900;
}

.fd-team-card > header small {
  display: block;

  margin-top: 3px;

  color: var(--app-text-muted);

  font-size: 9px;
}

.fd-team-members {
  padding: 0 15px 12px;
}

.fd-team-member {
  min-height: 64px;

  display: grid;
  grid-template-columns:
    42px
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap: 11px;

  padding: 9px 0;

  border-top: 1px solid var(--app-border-soft);
}

.fd-team-member:first-child {
  border-top: 0;
}

.fd-team-member > span:last-child {
  min-width: 0;

  display: flex;
  flex-direction: column;
  justify-content: center;
}

.fd-team-member strong {
  overflow: hidden;

  color: var(--app-text);

  font-size: 11.5px;
  line-height: 1.2;
  font-weight: 850;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.fd-team-member small {
  margin-top: 2px;

  color: var(--app-text-muted);

  font-size: 9px;
  line-height: 1.2;
}


/* =========================================================
   Participación — dashboard docente
   ========================================================= */

.fd-participation-dashboard {
  display: grid;
  gap: 12px;
}

.fd-participation-dashboard__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  padding: 16px 18px;

  border: 1px solid var(--app-border);
  border-radius: 16px;

  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.fd-participation-dashboard__identity {
  min-width: 0;

  display: flex;
  align-items: center;
  gap: 11px;
}

.fd-participation-dashboard__icon {
  width: 46px;
  height: 46px;

  display: grid;
  place-items: center;

  flex: 0 0 46px;

  border-radius: 12px;

  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.fd-participation-dashboard__icon svg {
  width: 21px;
  height: 21px;
}

.fd-participation-dashboard__eyebrow {
  display: block;

  margin-bottom: 2px;

  color: var(--app-accent-dark);

  font-size: 8.3px;
  font-weight: 900;

  letter-spacing: .07em;
  text-transform: uppercase;
}

.fd-participation-dashboard__header h3,
.fd-participation-dashboard__header p {
  margin: 0;
}

.fd-participation-dashboard__header h3 {
  color: var(--app-text);

  font-size: 17px;
  line-height: 1.15;
  font-weight: 900;
}

.fd-participation-dashboard__header p {
  margin-top: 4px;

  color: var(--app-text-muted);

  font-size: 9.4px;
  line-height: 1.4;
}

.fd-participation-dashboard__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-height: 30px;

  padding: 5px 10px;

  border-radius: 999px;

  color: #047857;
  background: #d1fae5;

  font-size: 8.8px;
  font-weight: 850;

  white-space: nowrap;
}

.fd-participation-dashboard__primary {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  gap: 10px;
}

.fd-participation-kpi {
  position: relative;

  min-width: 0;
  min-height: 148px;

  display: grid;
  grid-template-columns:
    44px minmax(0, 1fr);

  align-items: start;
  gap: 11px;

  padding: 15px;

  overflow: hidden;

  border: 1px solid var(--app-border);
  border-radius: 15px;

  background: var(--app-surface);
}

.fd-participation-kpi::after {
  content: "";

  position: absolute;

  right: -26px;
  bottom: -31px;

  width: 90px;
  height: 90px;

  border-radius: 50%;

  background:
    color-mix(
      in srgb,
      currentColor 6%,
      transparent
    );
}

.fd-participation-kpi__icon {
  width: 44px;
  height: 44px;

  display: grid;
  place-items: center;

  border-radius: 12px;
}

.fd-participation-kpi__icon svg {
  width: 20px;
  height: 20px;
}

.fd-participation-kpi > div {
  min-width: 0;
}

.fd-participation-kpi__label {
  display: block;

  color: var(--app-text-muted);

  font-size: 8.2px;
  font-weight: 900;

  letter-spacing: .06em;
  text-transform: uppercase;
}

.fd-participation-kpi strong {
  display: block;

  margin-top: 6px;

  color: currentColor;

  font-size: 28px;
  line-height: 1;
  font-weight: 950;
}

.fd-participation-kpi small {
  display: block;

  margin-top: 6px;

  color: var(--app-text-muted);

  font-size: 8.7px;
  line-height: 1.3;
}

.fd-participation-kpi__hint {
  display: inline-flex;

  margin-top: 10px;

  padding: 4px 7px;

  border-radius: 999px;

  color: currentColor;
  background:
    color-mix(
      in srgb,
      currentColor 8%,
      transparent
    );

  font-size: 7.7px;
  font-weight: 800;
}

.fd-participation-kpi.is-green {
  color: #047857;
}

.fd-participation-kpi.is-green
.fd-participation-kpi__icon {
  background: #d1fae5;
}

.fd-participation-kpi.is-blue {
  color: #2563eb;
}

.fd-participation-kpi.is-blue
.fd-participation-kpi__icon {
  background: #dbeafe;
}

.fd-participation-kpi.is-orange {
  color: #c2410c;
}

.fd-participation-kpi.is-orange
.fd-participation-kpi__icon {
  background: #ffedd5;
}

.fd-participation-kpi.is-slate {
  color: #475569;
}

.fd-participation-kpi.is-slate
.fd-participation-kpi__icon {
  background: #f1f5f9;
}

.fd-participation-progress {
  height: 6px;

  display: block;

  margin-top: 12px;

  overflow: hidden;

  border-radius: 999px;

  background: var(--app-surface-disabled);
}

.fd-participation-progress i {
  height: 100%;

  display: block;

  border-radius: inherit;

  background: currentColor;
}

.fd-participation-activity {
  overflow: hidden;

  border: 1px solid var(--app-border);
  border-radius: 16px;

  background: var(--app-surface);

  box-shadow: var(--app-shadow-sm);
}

.fd-participation-activity > header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 14px;

  padding: 13px 15px;

  border-bottom: 1px solid var(--app-border-soft);
}

.fd-participation-activity > header > div {
  min-width: 0;

  display: flex;
  align-items: center;

  gap: 9px;
}

.fd-participation-activity__icon {
  width: 38px;
  height: 38px;

  display: grid;
  place-items: center;

  flex: 0 0 38px;

  border-radius: 10px;

  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.fd-participation-activity__icon svg {
  width: 17px;
  height: 17px;
}

.fd-participation-activity h4 {
  margin: 0;

  color: var(--app-text);

  font-size: 13px;
  font-weight: 900;
}

.fd-participation-activity > header > span {
  color: var(--app-text-muted);

  font-size: 8.5px;
  font-weight: 800;

  white-space: nowrap;
}

.fd-participation-activity__grid {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  gap: 0;
}

.fd-participation-activity__grid article {
  min-width: 0;
  min-height: 76px;

  display: flex;
  align-items: center;

  gap: 10px;

  padding: 12px 14px;

  border-right: 1px solid var(--app-border-soft);
}

.fd-participation-activity__grid article:last-child {
  border-right: 0;
}

.fd-participation-mini-icon {
  width: 38px;
  height: 38px;

  display: grid;
  place-items: center;

  flex: 0 0 38px;

  border-radius: 10px;
}

.fd-participation-mini-icon svg {
  width: 17px;
  height: 17px;
}

.fd-participation-mini-icon.is-orange {
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.fd-participation-mini-icon.is-purple {
  color: #7c3aed;
  background: #ede9fe;
}

.fd-participation-mini-icon.is-blue {
  color: #2563eb;
  background: #dbeafe;
}

.fd-participation-mini-icon.is-green {
  color: #047857;
  background: #d1fae5;
}

.fd-participation-activity__grid article > div {
  min-width: 0;

  display: grid;
  align-content: center;
}

.fd-participation-activity__grid strong {
  color: var(--app-text);

  font-size: 16px;
  line-height: 1;
  font-weight: 900;
}

.fd-participation-activity__grid span {
  margin-top: 4px;

  color: var(--app-text-muted);

  font-size: 8.4px;
  line-height: 1.2;
}

.fd-participation-rule {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  padding: 13px 15px;
  border: 1px solid color-mix(in srgb, var(--app-accent) 25%, var(--app-border));
  border-radius: 14px;
  background: color-mix(in srgb, var(--app-accent-soft) 30%, var(--app-surface));
}

.fd-participation-rule__icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: var(--app-accent-dark);
  background: var(--app-surface);
}

.fd-participation-rule__icon svg { width: 17px; height: 17px; }
.fd-participation-rule h4, .fd-participation-rule p { margin: 0; }
.fd-participation-rule h4 { font-size: 11px; font-weight: 900; }
.fd-participation-rule p { margin-top: 3px; color: var(--app-text-secondary); font-size: 8.8px; line-height: 1.45; }
.fd-participation-rule > strong {
  padding: 6px 9px;
  border-radius: 999px;
  color: var(--app-danger);
  background: var(--app-danger-bg);
  font-size: 9px;
  white-space: nowrap;
}

.fd-participation-attention {
  display: grid;
  grid-template-columns:
    40px
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap: 11px;

  padding: 13px 15px;

  border: 1px solid
    color-mix(
      in srgb,
      var(--app-accent) 25%,
      var(--app-border)
    );
  border-left: 4px solid var(--app-accent);
  border-radius: 14px;

  background:
    color-mix(
      in srgb,
      var(--app-accent-soft) 36%,
      var(--app-surface)
    );
}

.fd-participation-attention__icon {
  width: 38px;
  height: 38px;

  display: grid;
  place-items: center;

  border-radius: 10px;

  color: var(--app-accent-dark);
  background: var(--app-surface);
}

.fd-participation-attention__icon svg {
  width: 17px;
  height: 17px;
}

.fd-participation-attention__body h4,
.fd-participation-attention__body p {
  margin: 0;
}

.fd-participation-attention__body h4 {
  color: var(--app-text);

  font-size: 11px;
  font-weight: 900;
}

.fd-participation-attention__body p {
  margin-top: 3px;

  color: var(--app-text-secondary);

  font-size: 8.8px;
  line-height: 1.45;
}

.fd-participation-attention__chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  gap: 6px;

  justify-content: flex-end;
}

.fd-participation-attention__chips span {
  display: inline-flex;
  align-items: center;

  min-height: 26px;

  padding: 4px 8px;

  border-radius: 999px;

  font-size: 8px;
  font-weight: 850;

  white-space: nowrap;
}

.fd-participation-attention__chips .is-orange {
  color: #c2410c;
  background: #ffedd5;
}

.fd-participation-attention__chips .is-blue {
  color: #2563eb;
  background: #dbeafe;
}

@media (max-width: 1050px) {
  .fd-participation-dashboard__primary,
  .fd-participation-activity__grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .fd-participation-activity__grid article:nth-child(2) {
    border-right: 0;
  }

  .fd-participation-activity__grid article:nth-child(-n + 2) {
    border-bottom: 1px solid var(--app-border-soft);
  }
}

@media (max-width: 700px) {
  .fd-participation-dashboard__header,
  .fd-participation-activity > header {
    align-items: flex-start;
    flex-direction: column;
  }

  .fd-participation-dashboard__primary,
  .fd-participation-activity__grid {
    grid-template-columns:
      1fr;
  }

  .fd-participation-activity__grid article {
    border-right: 0;
    border-bottom: 1px solid var(--app-border-soft);
  }

  .fd-participation-activity__grid article:last-child {
    border-bottom: 0;
  }

  .fd-participation-attention {
    grid-template-columns:
      38px
      minmax(0, 1fr);
  }

  .fd-participation-attention__chips {
    grid-column:
      1 / -1;

    justify-content: flex-start;
  }
}

`;