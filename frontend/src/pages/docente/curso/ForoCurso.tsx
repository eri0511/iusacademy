import {
  AlertCircle,
  BarChart3,
  BookOpenText,
  CalendarClock,
  Eye,
  MessageCircle,
  MessageSquareText,
  Paperclip,
  Pin,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AulaEmptyState from "../../../components/aula/AulaEmptyState";
import AulaHeader from "../../../components/aula/AulaHeader";
import AulaDropdown, {
  type OpcionAulaDropdown,
} from "../../../components/aula/AulaDropdown";
import AulaLoadingOverlay from "../../../components/aula/AulaLoadingOverlay";
import AulaModal from "../../../components/aula/AulaModal";
import AulaSkeleton from "../../../components/aula/AulaSkeleton";
import AulaToolbar, {
  type OpcionAulaToolbar,
} from "../../../components/aula/AulaToolbar";
import FormularioForoInteligente from "../../../components/foro/FormularioForoInteligente";
import Toast, { type TipoToast } from "../../../components/shared/Toast";
import { useAulaContext } from "../../../contexts/AulaContext";
import useForosCurso from "../../../hooks/foro/useForosCurso";
import type {
  EstadoForo,
  FiltrosForo,
  ForoListado,
} from "../../../types/foro/foro.types";

type FiltroRapido =
  | "TODOS"
  | "ABIERTOS"
  | "PROGRAMADOS"
  | "CERRADOS"
  | "NOVEDADES";

const estadoPorFiltro: Partial<Record<FiltroRapido, EstadoForo>> = {
  ABIERTOS: "ABIERTO",
  PROGRAMADOS: "PROGRAMADO",
  CERRADOS: "CERRADO",
};

const etiquetasEstado: Record<EstadoForo, string> = {
  BORRADOR: "Borrador",
  PROGRAMADO: "Programado",
  ABIERTO: "Abierto",
  VENCIDO: "Vencido",
  CERRADO: "Cerrado",
  CALIFICANDO: "Calificando",
  CALIFICADO: "Calificado",
  NOTAS_PUBLICADAS: "Notas publicadas",
  ANULADO: "Anulado",
};

function textoPlano(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fechaCompacta(fecha?: string | null): string {
  if (!fecha) {
    return "Sin fecha";
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "Sin fecha";
  }

  const fechaTexto = new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
  }).format(valor);

  const horaTexto = new Intl.DateTimeFormat("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(valor);

  return `${fechaTexto} · ${horaTexto}`;
}

function obtenerFechaReferencia(foro: ForoListado): {
  etiqueta: string;
  fecha: string;
} {
  if (foro.estado === "PROGRAMADO") {
    return {
      etiqueta: "Abre",
      fecha: fechaCompacta(foro.fechaApertura),
    };
  }

  if (
    foro.estado === "CERRADO" ||
    foro.estado === "CALIFICANDO" ||
    foro.estado === "CALIFICADO" ||
    foro.estado === "NOTAS_PUBLICADAS"
  ) {
    return {
      etiqueta: "Cerró",
      fecha: fechaCompacta(foro.fechaCierre),
    };
  }

  if (foro.estado === "VENCIDO") {
    return {
      etiqueta: "Venció",
      fecha: fechaCompacta(foro.fechaLimite),
    };
  }

  return {
    etiqueta: "Vence",
    fecha: fechaCompacta(foro.fechaLimite),
  };
}

function etiquetaComponente(
  componente?: string | null,
): string | null {
  if (!componente) {
    return null;
  }

  if (componente === "CONTINUA") {
    return "Continua";
  }

  if (componente === "PROCESUAL") {
    return "Procesual";
  }

  return componente
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (letra) => letra.toUpperCase());
}

function etiquetaModalidad(
  modalidad: ForoListado["modalidadParticipacion"],
): string {
  return modalidad === "GRUPAL"
    ? "Grupal"
    : "Individual";
}

function ForoCard({
  foro,
  onAbrir,
  onEditar,
  procesando,
  onFijar,
  onCambiarEstado,
  onEliminar,
}: {
  foro: ForoListado;
  onAbrir: () => void;
  onEditar: () => void;
  procesando: boolean;
  onFijar: () => void;
  onCambiarEstado: () => void;
  onEliminar: () => void;
}) {
  const nombreAutor =
    `${foro.autor.nombres} ${foro.autor.apellidoPaterno}`.trim();

  const fechaReferencia =
    obtenerFechaReferencia(foro);

  const componente =
    etiquetaComponente(
      foro.actividadCalificable?.componente,
    );

  const modalidad =
    etiquetaModalidad(
      foro.modalidadParticipacion,
    );

  const opciones: OpcionAulaDropdown[] = [
    { texto: "Abrir foro", onClick: onAbrir },
    ...(foro.indicadores.cantidadRespuestas === 0
      ? [{ texto: "Editar foro", onClick: onEditar }]
      : []),
    {
      texto: foro.estaFijado ? "Desfijar foro" : "Fijar foro",
      onClick: onFijar,
    },
    ...(["ABIERTO", "CERRADO", "VENCIDO"].includes(foro.estado)
      ? [
          {
            texto:
              foro.estado === "CERRADO"
                ? "Reabrir foro"
                : "Cerrar foro",
            separadorAntes: true,
            onClick: onCambiarEstado,
          },
        ]
      : []),
    ...(foro.estado !== "NOTAS_PUBLICADAS" && foro.estado !== "ANULADO"
      ? [
          {
            texto: "Eliminar foro",
            peligro: true,
            separadorAntes: true,
            onClick: onEliminar,
          },
        ]
      : []),
  ];
  return (
    <article className="foro-card">
      <div className="foro-card__menu">
        <AulaDropdown
          opciones={opciones}
          titulo="Opciones del foro"
          ariaLabel={`Abrir opciones de ${foro.titulo}`}
          deshabilitado={procesando}
          triggerClassName="foro-card__menu-trigger"
        />
      </div>
      <button type="button" className="foro-card__cuerpo" onClick={onAbrir}>
        <div className="foro-card__encabezado">
          <div className="foro-card__etiquetas">
            <span
              className={`foro-estado foro-estado--${foro.estado.toLowerCase()}`}
            >
              {etiquetasEstado[foro.estado]}
            </span>

            {foro.esCalificable && (
              <span className="foro-chip foro-chip--nota">
                <BarChart3 size={12} />
                Calificable
              </span>
            )}

            {componente && (
              <span className="foro-chip foro-chip--componente">
                {componente}
              </span>
            )}

            <span className="foro-chip foro-chip--modalidad">
              <Users size={12} />
              {modalidad}
            </span>

            {foro.estaFijado && (
              <span className="foro-chip foro-chip--fijado">
                <Pin size={12} />
                Fijado
              </span>
            )}
          </div>
        </div>
        <h3>{foro.titulo}</h3>
        <p>{textoPlano(foro.contenido) || "Sin descripción."}</p>
        <div className="foro-card__meta">
          <span>Por {nombreAutor}</span>
          {foro.hito && <span>{foro.hito.nombre}</span>}
          {foro.conjuntoGrupo && <span>{foro.conjuntoGrupo.nombre}</span>}
        </div>
        <div className="foro-card__pie">
          <div className="foro-card__indicadores">
            <span>
              <MessageSquareText size={15} />
              <strong>{foro.indicadores.cantidadRespuestas}</strong>
              respuestas
            </span>

            <span>
              <MessageCircle size={15} />
              <strong>{foro.indicadores.cantidadComentarios}</strong>
              comentarios
            </span>

            <span>
              <Users size={15} />
              <strong>{foro.indicadores.cantidadParticipantes}</strong>
              participantes
            </span>

            <span>
              <Eye size={15} />
              <strong>{foro.indicadores.cantidadLectores}</strong>
              {foro.indicadores.cantidadLectores === 1
                ? "estudiante lo vio"
                : "estudiantes lo vieron"}
            </span>

            {(foro._count?.archivos ?? 0) > 0 && (
              <span>
                <Paperclip size={15} />
                <strong>{foro._count?.archivos}</strong>
                archivos
              </span>
            )}
          </div>

          <span className="foro-card__vencimiento">
            <CalendarClock size={14} />

            <span>
              <small>{fechaReferencia.etiqueta}</small>
              <strong>{fechaReferencia.fecha}</strong>
            </span>
          </span>
        </div>
      </button>
    </article>
  );
}

export default function ForoCurso() {
  const navigate = useNavigate();
  const { curso, hitoSeleccionado } = useAulaContext();
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapido>("TODOS");
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [foroEditando, setForoEditando] = useState<ForoListado | null>(null);
  const [confirmacion, setConfirmacion] = useState<{
    foro: ForoListado;
    accion: "ESTADO" | "ELIMINAR";
  } | null>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    tipo: TipoToast;
    titulo: string;
    mensaje?: string;
  }>({ visible: false, tipo: "exito", titulo: "" });

  const filtros = useMemo<FiltrosForo>(
    () => ({
      busqueda: "",
      estado: estadoPorFiltro[filtroRapido] ?? "",
      lectura: filtroRapido === "NOVEDADES" ? "CON_NOVEDADES" : "",
      orden: "ULTIMA_ACTIVIDAD_DESC",
      pagina: 1,
      limite: 100,
      hitoId: hitoSeleccionado?.id,
    }),
    [filtroRapido, hitoSeleccionado?.id],
  );

  const {
    foros,
    cargando,
    actualizando,
    procesandoId,
    error,
    cargarForos,
    limpiarError,
    cambiarFijado,
    cambiarEstado,
    eliminarForo,
  } = useForosCurso(curso.id, filtros);

  const mostrarToast = (tipo: TipoToast, titulo: string, mensaje?: string) =>
    setToast({ visible: true, tipo, titulo, mensaje });

  const alternarFijado = async (foro: ForoListado) => {
    try {
      await cambiarFijado(foro.id, !foro.estaFijado);
      mostrarToast(
        "exito",
        foro.estaFijado ? "Foro desfijado" : "Foro fijado",
        `“${foro.titulo}” se actualizó correctamente.`,
      );
    } catch (causa) {
      mostrarToast(
        "error",
        "No se pudo actualizar",
        causa instanceof Error ? causa.message : undefined,
      );
    }
  };

  const confirmarAccion = async () => {
    if (!confirmacion) return;
    const { foro, accion } = confirmacion;
    try {
      if (accion === "ELIMINAR") {
        await eliminarForo(foro.id);
        mostrarToast(
          "exito",
          "Foro eliminado",
          `“${foro.titulo}” dejó de estar disponible.`,
        );
      } else {
        const nuevoEstado =
          foro.estado === "CERRADO" ? "ABIERTO" : "CERRADO";
        await cambiarEstado(foro.id, nuevoEstado);
        mostrarToast(
          "exito",
          nuevoEstado === "ABIERTO" ? "Foro reabierto" : "Foro cerrado",
          `“${foro.titulo}” se actualizó correctamente.`,
        );
      }
      setConfirmacion(null);
    } catch (causa) {
      mostrarToast(
        "error",
        "No se pudo completar la acción",
        causa instanceof Error ? causa.message : undefined,
      );
    }
  };

  const opciones: OpcionAulaToolbar<FiltroRapido>[] = [
    { id: "TODOS", texto: "Todos", icono: BookOpenText },
    { id: "ABIERTOS", texto: "Abiertos", icono: MessageSquareText },
    { id: "PROGRAMADOS", texto: "Programados", icono: CalendarClock },
    { id: "CERRADOS", texto: "Cerrados", icono: X },
    { id: "NOVEDADES", texto: "Con novedades", icono: AlertCircle },
  ];

  const cambiarFiltro = (valor: FiltroRapido) => {
    setFiltroRapido(valor);
  };

  const mostrarTodos = () => {
    setFiltroRapido("TODOS");
  };

  return (
    <section className="foro-curso">
      <AulaHeader
        icono={MessageSquareText}
        etiqueta="Aprendizaje colaborativo"
        titulo="Foros"
        descripcion="Crea debates jurídicos, acompaña la participación y consulta evidencias de aprendizaje del curso."
        informacion={
          hitoSeleccionado
            ? `Mostrando actividades de ${hitoSeleccionado.nombre}.`
            : "Selecciona un hito para organizar los foros."
        }
        acciones={[
          {
            texto: "Crear foro",
            icono: Plus,
            variante: "primaria",
            onClick: () => setFormularioAbierto(true),
          },
          {
            texto: "Actualizar",
            icono: RefreshCw,
            variante: "secundaria",
            deshabilitada: actualizando,
            onClick: () => void cargarForos(),
          },
        ]}
      />

      <AulaToolbar
        opciones={opciones}
        opcionActiva={filtroRapido}
        ariaLabel="Estados de los foros"
        onCambiar={cambiarFiltro}
      />

      {error && (
        <div className="foro-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={limpiarError}>
            <X size={15} />
          </button>
        </div>
      )}

      <div className="foro-resultados">
        <AulaLoadingOverlay
          visible={actualizando}
          texto="Actualizando foros…"
        />
        {cargando ? (
          <AulaSkeleton cantidad={4} variante="tarjetas" />
        ) : foros.length === 0 ? (
          <AulaEmptyState
            icono={MessageSquareText}
            titulo={
              filtroRapido !== "TODOS"
                ? "No encontramos foros"
                : "Todavía no hay foros"
            }
            descripcion={
              filtroRapido !== "TODOS"
                ? "No hay foros en esta categoría. Puedes consultar todos los foros o elegir otro estado."
                : "Crea el primer espacio de debate y participación de este hito."
            }
            accionTexto={filtroRapido !== "TODOS" ? "Ver todos" : "Crear foro"}
            onAccion={
              filtroRapido !== "TODOS"
                ? mostrarTodos
                : () => setFormularioAbierto(true)
            }
          />
        ) : (
          <div className="foro-grid">
            {foros.map((foro) => (
              <ForoCard
                key={foro.id}
                foro={foro}
                onAbrir={() => navigate(String(foro.id))}
                onEditar={() => setForoEditando(foro)}
                procesando={procesandoId === foro.id}
                onFijar={() => void alternarFijado(foro)}
                onCambiarEstado={() =>
                  setConfirmacion({ foro, accion: "ESTADO" })
                }
                onEliminar={() => setConfirmacion({ foro, accion: "ELIMINAR" })}
              />
            ))}
          </div>
        )}
      </div>


      {formularioAbierto && (
        <FormularioForoInteligente
          onClose={() => setFormularioAbierto(false)}
          onSuccess={async () => {
            setFormularioAbierto(false);
            await cargarForos();
            mostrarToast(
              "exito",
              "Foro creado",
              "El nuevo foro ya está disponible en el listado.",
            );
          }}
        />
      )}

      {foroEditando && (
        <FormularioForoInteligente
          foroId={foroEditando.id}
          onClose={() => setForoEditando(null)}
          onSuccess={async () => {
            const titulo = foroEditando.titulo;
            setForoEditando(null);
            await cargarForos();
            mostrarToast(
              "exito",
              "Foro actualizado",
              `“${titulo}” guardó sus cambios.`,
            );
          }}
        />
      )}

      <AulaModal
        abierto={Boolean(confirmacion)}
        ancho="compacto"
        titulo={
          confirmacion?.accion === "ELIMINAR"
            ? "Eliminar foro"
            : confirmacion?.foro.estado === "CERRADO"
              ? "Reabrir foro"
              : "Cerrar foro"
        }
        etiqueta="Confirmar acción"
        descripcion={
          confirmacion?.accion === "ELIMINAR"
            ? confirmacion.foro.indicadores.cantidadRespuestas > 0
              ? "El foro y sus participaciones dejarán de estar disponibles. El historial se conservará internamente."
              : "El foro dejará de estar disponible para el curso."
            : confirmacion?.foro.estado === "CERRADO"
              ? "Los estudiantes volverán a poder participar según la configuración del foro."
              : "Los estudiantes ya no podrán añadir nuevas participaciones."
        }
        icono={confirmacion?.accion === "ELIMINAR" ? Trash2 : MessageSquareText}
        bloqueado={confirmacion ? procesandoId === confirmacion.foro.id : false}
        onCerrar={() => setConfirmacion(null)}
        footer={
          <>
            <button
              type="button"
              className="foro-modal__cancelar"
              disabled={Boolean(
                confirmacion && procesandoId === confirmacion.foro.id,
              )}
              onClick={() => setConfirmacion(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={`foro-modal__confirmar ${confirmacion?.accion === "ELIMINAR" ? "es-peligro" : ""}`}
              disabled={Boolean(
                confirmacion && procesandoId === confirmacion.foro.id,
              )}
              onClick={() => void confirmarAccion()}
            >
              {confirmacion && procesandoId === confirmacion.foro.id
                ? "Procesando…"
                : "Confirmar"}
            </button>
          </>
        }
      >
        <div className="foro-confirmacion">
          <span className="foro-confirmacion__icono">
            {confirmacion?.accion === "ELIMINAR" ? (
              <Trash2 size={24} />
            ) : confirmacion?.foro.estado === "CERRADO" ? (
              <RefreshCw size={24} />
            ) : (
              <X size={24} />
            )}
          </span>
          <div>
            <strong>{confirmacion?.foro.titulo}</strong>
            <p>
              {confirmacion?.accion === "ELIMINAR" &&
              confirmacion.foro.indicadores.cantidadRespuestas > 0
                ? `También se ocultarán ${confirmacion.foro.indicadores.cantidadRespuestas} respuesta(s) y sus comentarios.`
                : "Revisa la acción antes de continuar."}
            </p>
          </div>
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
    </section>
  );
}

const styles = `
  .foro-curso {
    display: grid;
    gap: 14px;
    min-width: 0;
    color: var(--app-text);
  }
  .foro-error button {
    display: grid;
    place-items: center;
    padding: 4px;
    border: 0;
    color: inherit;
    background: transparent;
    cursor: pointer;
  }
  .foro-error {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 12px 14px;
    border: 1px solid color-mix(in srgb, #dc2626 30%, var(--app-border));
    border-radius: 14px;
    color: #b91c1c;
    background: color-mix(in srgb, #fee2e2 70%, var(--app-surface));
    font-size: 11px;
  }
  .foro-error span {
    flex: 1;
  }
  .foro-resultados {
    position: relative;
    min-height: 180px;
  }
  .foro-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 13px;
  }
  .foro-card {
    position: relative;
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-left: 4px solid var(--app-accent);
    border-radius: 19px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
    transition:
      transform 0.16s ease,
      border-color 0.16s ease,
      box-shadow 0.16s ease;
  }
  .foro-card__menu {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 4;
  }
  .foro-card__menu-trigger {
    width: 34px;
    height: 34px;
    border-color: var(--app-border);
    background: color-mix(in srgb, var(--app-surface) 92%, transparent);
    box-shadow: 0 7px 18px rgba(15, 23, 42, .08);
  }
  .foro-card:hover {
    transform: translateY(-2px);
    border-color: var(--app-border-strong);
    box-shadow: var(--app-shadow-md);
  }
  .foro-card__cuerpo {
    width: 100%;
    display: block;
    padding: 17px;
    border: 0;
    text-align: left;
    color: inherit;
    background: transparent;
    font: inherit;
    cursor: pointer;
  }
  .foro-card__cuerpo:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--app-accent) 28%, transparent);
    outline-offset: -3px;
    border-radius: 17px;
  }
  .foro-card__encabezado {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding-right: 42px;
  }
  .foro-confirmacion {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 16px;
    border: 1px solid var(--app-border-soft);
    border-radius: 16px;
    background: var(--app-surface-alt);
  }
  .foro-confirmacion__icono {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 14px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }
  .foro-confirmacion p {
    margin: 4px 0 0;
    color: var(--app-text-muted);
    font-size: 11px;
  }
  .foro-modal__cancelar,
  .foro-modal__confirmar {
    min-height: 38px;
    padding: 0 16px;
    border-radius: 12px;
    font: inherit;
    font-size: 11px;
    cursor: pointer;
  }
  .foro-modal__cancelar {
    border: 1px solid var(--app-border-strong);
    color: var(--app-text-secondary);
    background: var(--app-surface);
  }
  .foro-modal__confirmar {
    border: 1px solid var(--app-accent);
    color: #fff;
    background: var(--app-accent);
  }
  .foro-modal__confirmar.es-peligro {
    border-color: #dc2626;
    background: #dc2626;
  }
  .foro-modal__cancelar:disabled,
  .foro-modal__confirmar:disabled {
    opacity: .55;
    cursor: wait;
  }
  .foro-card__etiquetas {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .foro-estado,
  .foro-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 8px;
    border-radius: 999px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    font-size: 9px;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .foro-estado--abierto {
    color: #047857;
    background: #d1fae5;
  }
  .foro-estado--programado {
    color: #1d4ed8;
    background: #dbeafe;
  }
  .foro-estado--vencido {
    color: #b45309;
    background: #ffedd5;
  }
  .foro-estado--cerrado,
  .foro-estado--anulado {
    color: #b42318;
    background: #fee4e2;
  }
  .foro-estado--borrador {
    color: #a16207;
    background: #fef3c7;
  }
  .foro-estado--calificando {
    color: #9a3412;
    background: #ffedd5;
  }
  .foro-estado--calificado {
    color: #5b21b6;
    background: #ede9fe;
  }
  .foro-estado--notas_publicadas {
    color: #0369a1;
    background: #e0f2fe;
  }
  .foro-chip--nota {
    color: #6d28d9;
    background: #ede9fe;
  }
  .foro-chip--componente {
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }
  .foro-chip--modalidad {
    color: #475569;
    background: #f1f5f9;
  }
  .foro-chip--fijado {
    color: #b45309;
    background: #fff7ed;
  }
  .foro-card h3 {
    margin: 14px 0 6px;
    font-size: 16px;
    line-height: 1.25;
  }
  .foro-card p {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    color: var(--app-text-soft);
    font-size: 11px;
    line-height: 1.55;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .foro-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 7px 12px;
    margin-top: 12px;
    color: var(--app-text-muted);
    font-size: 9px;
  }
  .foro-card__meta span + span:before {
    content: "•";
    margin-right: 12px;
  }
  .foro-card__pie {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 14px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--app-border-soft);
  }
  .foro-card__indicadores {
    min-width: 0;
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: 8px 13px;
    color: var(--app-text-muted);
    font-size: 9px;
  }
  .foro-card__indicadores span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .foro-card__indicadores strong {
    color: var(--app-text-secondary);
  }
  .foro-card__vencimiento {
    min-width: 116px;
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 7px;
    flex-shrink: 0;
    color: var(--app-accent-dark);
  }
  .foro-card__vencimiento > span {
    display: grid;
    gap: 1px;
    text-align: right;
  }
  .foro-card__vencimiento small {
    color: var(--app-text-muted);
    font-size: 8px;
    font-weight: 750;
    line-height: 1.1;
  }
  .foro-card__vencimiento strong {
    color: var(--app-text-secondary);
    font-size: 9px;
    font-weight: 850;
    line-height: 1.2;
    white-space: nowrap;
  }
  @media (max-width: 850px) {
    .foro-grid {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 600px) {
    .foro-card__encabezado {
      align-items: stretch;
      flex-direction: column;
    }
    .foro-card__pie {
      align-items: flex-start;
      flex-direction: column;
    }
    .foro-card__vencimiento {
      min-width: 0;
      justify-content: flex-start;
    }
    .foro-card__vencimiento > span {
      text-align: left;
    }
  }
`;