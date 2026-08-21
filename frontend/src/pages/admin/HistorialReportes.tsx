import type {
  ReactNode,
} from 'react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronRight,
  CircleX,
  Clock3,
  FileClock,
  FileSpreadsheet,
  FileText,
  Filter,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';

import { useAuth } from '../../auth/AuthContext';
import AulaEmptyState from '../../components/aula/AulaEmptyState';
import AulaSkeleton from '../../components/aula/AulaSkeleton';
import Toast, {
  type TipoToast,
} from '../../components/shared/Toast';

type EstadoReporte =
  | 'GENERANDO'
  | 'VALIDO'
  | 'ANULADO'
  | 'ERROR';

type FormatoReporte =
  | 'PDF'
  | 'EXCEL'
  | 'CSV';

type PersonaReporte = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  correo: string;
};

type ReporteEmitido = {
  id: number;
  codigo: string;
  tipo: string;
  titulo: string;
  formato: FormatoReporte;
  estado: EstadoReporte;
  nombreArchivo?: string | null;
  mimeType?: string | null;
  cantidadRegistros?: number | null;
  filtros?: unknown;
  hashSha256?: string | null;
  errorGeneracion?: string | null;
  generadoEn: string;
  finalizadoEn?: string | null;
  expiraEn?: string | null;
  anuladoEn?: string | null;
  motivoAnulacion?: string | null;
  generadoPor: PersonaReporte;
  anuladoPor?: PersonaReporte | null;
};

type FiltroEstado =
  | 'TODOS'
  | EstadoReporte;

type ToastState = {
  visible: boolean;
  tipo: TipoToast;
  titulo: string;
  mensaje: string;
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

const estadoInicialToast: ToastState = {
  visible: false,
  tipo: 'informacion',
  titulo: '',
  mensaje: '',
};

function nombrePersona(
  persona?: PersonaReporte | null,
) {
  if (!persona) {
    return 'No registrado';
  }

  return [
    persona.nombres,
    persona.apellidoPaterno,
  ]
    .filter(Boolean)
    .join(' ')
    .trim() || persona.correo;
}

function formatearFecha(
  fecha?: string | null,
) {
  if (!fecha) {
    return '—';
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'es-BO',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(valor);
}

function mensajeRespuesta(
  datos: unknown,
  alternativa: string,
) {
  if (
    typeof datos === 'object' &&
    datos !== null &&
    'message' in datos
  ) {
    const mensaje =
      (datos as { message?: unknown }).message;

    if (Array.isArray(mensaje)) {
      return mensaje.join(' ');
    }

    if (typeof mensaje === 'string') {
      return mensaje;
    }
  }

  return alternativa;
}

export default function HistorialReportes() {
  const { sesion } = useAuth();
  const accessToken =
    sesion?.accessToken ?? '';

  const [reportes, setReportes] =
    useState<ReporteEmitido[]>([]);
  const [cargando, setCargando] =
    useState(true);
  const [actualizando, setActualizando] =
    useState(false);
  const [busqueda, setBusqueda] =
    useState('');
  const [filtroEstado, setFiltroEstado] =
    useState<FiltroEstado>('TODOS');
  const [filtroFormato, setFiltroFormato] =
    useState('TODOS');
  const [filtroTipo, setFiltroTipo] =
    useState('TODOS');
  const [reporteDetalle, setReporteDetalle] =
    useState<ReporteEmitido | null>(null);
  const [reporteAnular, setReporteAnular] =
    useState<ReporteEmitido | null>(null);
  const [motivo, setMotivo] =
    useState('');
  const [anulando, setAnulando] =
    useState(false);
  const [toast, setToast] =
    useState<ToastState>(estadoInicialToast);

  const mostrarToast = useCallback((
    tipo: TipoToast,
    titulo: string,
    mensaje: string,
  ) => {
    setToast({
      visible: true,
      tipo,
      titulo,
      mensaje,
    });
  }, []);

  const cerrarToast = useCallback(() => {
    setToast((actual) => ({
      ...actual,
      visible: false,
    }));
  }, []);

  const cargarReportes = useCallback(async (
    silencioso = false,
  ) => {
    if (!accessToken) {
      setCargando(false);
      return;
    }

    silencioso
      ? setActualizando(true)
      : setCargando(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/reportes/historial`,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        },
      );

      const datos = await respuesta
        .json()
        .catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          mensajeRespuesta(
            datos,
            'No fue posible cargar el historial.',
          ),
        );
      }

      setReportes(
        Array.isArray(datos) ? datos : [],
      );

      if (silencioso) {
        mostrarToast(
          'exito',
          'Historial actualizado',
          'Los reportes fueron sincronizados correctamente.',
        );
      }
    } catch (error) {
      mostrarToast(
        'error',
        'No se pudo cargar',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al consultar los reportes.',
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, [accessToken, mostrarToast]);

  useEffect(() => {
    void cargarReportes();
  }, [cargarReportes]);

  useEffect(() => {
    if (!reporteDetalle && !reporteAnular) {
      return;
    }

    const cerrarConEscape = (
      evento: KeyboardEvent,
    ) => {
      if (evento.key === 'Escape') {
        setReporteDetalle(null);
        setReporteAnular(null);
        setMotivo('');
      }
    };

    document.addEventListener(
      'keydown',
      cerrarConEscape,
    );

    return () => document.removeEventListener(
      'keydown',
      cerrarConEscape,
    );
  }, [reporteDetalle, reporteAnular]);

  const tiposDisponibles = useMemo(() =>
    Array.from(
      new Set(
        reportes
          .map((reporte) => reporte.tipo)
          .filter(Boolean),
      ),
    ).sort(),
  [reportes]);

  const resumen = useMemo(() => ({
    total: reportes.length,
    validos: reportes.filter(
      (reporte) => reporte.estado === 'VALIDO',
    ).length,
    anulados: reportes.filter(
      (reporte) => reporte.estado === 'ANULADO',
    ).length,
    incidencias: reportes.filter(
      (reporte) =>
        reporte.estado === 'ERROR' ||
        reporte.estado === 'GENERANDO',
    ).length,
  }), [reportes]);

  const reportesFiltrados = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLocaleLowerCase('es');

    return reportes.filter((reporte) => {
      const coincideEstado =
        filtroEstado === 'TODOS' ||
        reporte.estado === filtroEstado;
      const coincideFormato =
        filtroFormato === 'TODOS' ||
        reporte.formato === filtroFormato;
      const coincideTipo =
        filtroTipo === 'TODOS' ||
        reporte.tipo === filtroTipo;
      const contenido = [
        reporte.codigo,
        reporte.titulo,
        reporte.tipo,
        reporte.nombreArchivo,
        nombrePersona(reporte.generadoPor),
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('es');

      return coincideEstado &&
        coincideFormato &&
        coincideTipo &&
        (!texto || contenido.includes(texto));
    });
  }, [
    busqueda,
    filtroEstado,
    filtroFormato,
    filtroTipo,
    reportes,
  ]);

  const abrirAnulacion = (
    reporte: ReporteEmitido,
  ) => {
    setReporteDetalle(null);
    setReporteAnular(reporte);
    setMotivo('');
  };

  const confirmarAnulacion = async () => {
    if (!reporteAnular || anulando) {
      return;
    }

    const motivoLimpio = motivo.trim();

    if (motivoLimpio.length < 5) {
      mostrarToast(
        'advertencia',
        'Motivo incompleto',
        'Escribe un motivo de al menos 5 caracteres.',
      );
      return;
    }

    try {
      setAnulando(true);

      const respuesta = await fetch(
        `${API_URL}/reportes/${encodeURIComponent(
          reporteAnular.codigo,
        )}/anular`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization:
              `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            motivo: motivoLimpio,
          }),
        },
      );

      const datos = await respuesta
        .json()
        .catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          mensajeRespuesta(
            datos,
            'No fue posible anular el reporte.',
          ),
        );
      }

      setReporteAnular(null);
      setMotivo('');
      mostrarToast(
        'exito',
        'Reporte anulado',
        `${reporteAnular.codigo} dejó de ser válido.`,
      );
      await cargarReportes();
    } catch (error) {
      mostrarToast(
        'error',
        'No se pudo anular',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error durante la anulación.',
      );
    } finally {
      setAnulando(false);
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('TODOS');
    setFiltroFormato('TODOS');
    setFiltroTipo('TODOS');
  };

  return (
    <main className="reportes-page">
      <Toast
        {...toast}
        onCerrar={cerrarToast}
      />

      <header className="reportes-header">
        <div className="reportes-header__content">
          <div className="reportes-header__icon">
            <FileClock size={26} />
          </div>

          <div>
            <span className="reportes-eyebrow">
              Control documental
            </span>
            <h1>Historial de reportes</h1>
            <p>
              Consulta, filtra y controla los reportes emitidos por IusAcademy.
            </p>
            <div className="reportes-header__meta">
              <span>Trazabilidad</span>
              <span>Código verificable</span>
              <span>Anulación segura</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-actualizar"
          onClick={() => void cargarReportes(true)}
          disabled={actualizando}
        >
          <RefreshCw
            size={17}
            className={actualizando ? 'is-spin' : ''}
          />
          {actualizando ? 'Actualizando...' : 'Actualizar historial'}
        </button>
      </header>

      <section className="reportes-summary">
        <ResumenCard
          icono={<FileText size={21} />}
          valor={resumen.total}
          titulo="Reportes emitidos"
          clase="total"
        />
        <ResumenCard
          icono={<CheckCircle2 size={21} />}
          valor={resumen.validos}
          titulo="Válidos"
          clase="valido"
        />
        <ResumenCard
          icono={<Ban size={21} />}
          valor={resumen.anulados}
          titulo="Anulados"
          clase="anulado"
        />
        <ResumenCard
          icono={<AlertCircle size={21} />}
          valor={resumen.incidencias}
          titulo="En proceso o error"
          clase="incidencia"
        />
      </section>

      <section className="reportes-panel">
        <div className="reportes-panel__heading">
          <div>
            <span className="section-eyebrow">Registro institucional</span>
            <h2>Reportes generados</h2>
            <p>Consulta y administra los reportes emitidos.</p>
          </div>
          <span className="result-count">
            {reportesFiltrados.length}{' '}
            {reportesFiltrados.length === 1 ? 'reporte' : 'reportes'}
          </span>
        </div>

        <div className="reportes-filters" aria-label="Filtrar por estado">
          {([
            ['TODOS', 'Todos', resumen.total],
            ['VALIDO', 'Válidos', resumen.validos],
            ['ANULADO', 'Anulados', resumen.anulados],
            ['GENERANDO', 'Generando', reportes.filter((reporte) => reporte.estado === 'GENERANDO').length],
            ['ERROR', 'Con error', reportes.filter((reporte) => reporte.estado === 'ERROR').length],
          ] as const).map(([valor, etiqueta, cantidad]) => (
            <button
              key={valor}
              type="button"
              className={filtroEstado === valor ? 'active' : ''}
              onClick={() => setFiltroEstado(valor)}
            >
              {etiqueta}
              <span>{cantidad}</span>
            </button>
          ))}
        </div>

        <div className="reportes-selects">
          <label className="filter-control">
            <Filter size={16} />
            <select
              value={filtroFormato}
              onChange={(evento) => setFiltroFormato(evento.target.value)}
              aria-label="Filtrar por formato"
            >
              <option value="TODOS">Todos los formatos</option>
              <option value="PDF">PDF</option>
              <option value="EXCEL">Excel</option>
              <option value="CSV">CSV</option>
            </select>
          </label>

          <select
            className="simple-select"
            value={filtroTipo}
            onChange={(evento) => setFiltroTipo(evento.target.value)}
            aria-label="Filtrar por tipo"
          >
            <option value="TODOS">Todos los tipos</option>
            {tiposDisponibles.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>

        <div className="reportes-toolbar">
          <label className="search-control">
            <Search size={18} />
            <input
              value={busqueda}
              onChange={(evento) =>
                setBusqueda(evento.target.value)
              }
              placeholder="Buscar por código, título o responsable..."
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                aria-label="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </label>
        </div>
      </section>

      <section className="reportes-table-section">
        {cargando ? (
          <div className="reportes-state-card">
            <AulaSkeleton cantidad={4} variante="lista" />
          </div>
        ) : reportesFiltrados.length === 0 ? (
          <div className="reportes-state-card">
            <AulaEmptyState
              icono={FileClock}
              titulo={
                reportes.length === 0
                  ? 'Todavía no hay reportes emitidos'
                  : 'No encontramos coincidencias'
              }
              descripcion={
                reportes.length === 0
                  ? 'Los reportes generados aparecerán aquí automáticamente.'
                  : 'Prueba otra búsqueda o limpia los filtros seleccionados.'
              }
              accionTexto={
                reportes.length === 0
                  ? 'Actualizar historial'
                  : 'Limpiar filtros'
              }
              onAccion={
                reportes.length === 0
                  ? () => void cargarReportes(true)
                  : limpiarFiltros
              }
            />
          </div>
        ) : (
          <div className="reportes-table-wrap">
            <table className="reportes-table">
              <thead>
                <tr>
                  <th>Reporte</th>
                  <th>Formato</th>
                  <th>Estado</th>
                  <th>Generado por</th>
                  <th>Fecha</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {reportesFiltrados.map((reporte) => (
                  <tr key={reporte.id ?? reporte.codigo}>
                    <td data-label="Reporte">
                      <div className="reporte-identidad">
                        <FormatoIcon formato={reporte.formato} />
                        <div>
                          <strong>{reporte.titulo}</strong>
                          <span>{reporte.codigo}</span>
                          <small>{reporte.tipo}</small>
                        </div>
                      </div>
                    </td>
                    <td data-label="Formato">
                      <span className={`formato-badge formato-${reporte.formato.toLowerCase()}`}>
                        {reporte.formato}
                      </span>
                    </td>
                    <td data-label="Estado">
                      <EstadoBadge estado={reporte.estado} />
                    </td>
                    <td data-label="Generado por">
                      <div className="persona-cell">
                        <strong>{nombrePersona(reporte.generadoPor)}</strong>
                        <span>{reporte.generadoPor?.correo ?? '—'}</span>
                      </div>
                    </td>
                    <td data-label="Fecha">
                      <div className="fecha-cell">
                        <Clock3 size={14} />
                        <span>{formatearFecha(reporte.generadoEn)}</span>
                      </div>
                    </td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="btn-detalle"
                        onClick={() => setReporteDetalle(reporte)}
                      >
                        Ver detalle
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {reporteDetalle && (
        <ModalBase
          titulo="Detalle del reporte"
          eyebrow="Trazabilidad documental"
          onCerrar={() => setReporteDetalle(null)}
        >
          <div className="detalle-cabecera">
            <FormatoIcon formato={reporteDetalle.formato} grande />
            <div>
              <EstadoBadge estado={reporteDetalle.estado} />
              <h3>{reporteDetalle.titulo}</h3>
              <code>{reporteDetalle.codigo}</code>
            </div>
          </div>

          <div className="detalle-grid">
            <DetalleItem titulo="Tipo" valor={reporteDetalle.tipo} />
            <DetalleItem titulo="Formato" valor={reporteDetalle.formato} />
            <DetalleItem
              titulo="Registros"
              valor={String(reporteDetalle.cantidadRegistros ?? 0)}
            />
            <DetalleItem
              titulo="Generado"
              valor={formatearFecha(reporteDetalle.generadoEn)}
            />
            <DetalleItem
              titulo="Responsable"
              valor={nombrePersona(reporteDetalle.generadoPor)}
            />
            <DetalleItem
              titulo="Finalizado"
              valor={formatearFecha(reporteDetalle.finalizadoEn)}
            />
          </div>

          {reporteDetalle.estado === 'ANULADO' && (
            <div className="anulacion-info">
              <Ban size={19} />
              <div>
                <strong>Reporte anulado</strong>
                <p>{reporteDetalle.motivoAnulacion || 'Sin motivo registrado.'}</p>
                <span>
                  {formatearFecha(reporteDetalle.anuladoEn)} ·{' '}
                  {nombrePersona(reporteDetalle.anuladoPor)}
                </span>
              </div>
            </div>
          )}

          {reporteDetalle.estado === 'ERROR' && reporteDetalle.errorGeneracion && (
            <div className="error-info">
              <CircleX size={19} />
              <div>
                <strong>Error de generación</strong>
                <p>{reporteDetalle.errorGeneracion}</p>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setReporteDetalle(null)}
            >
              Cerrar
            </button>
            {reporteDetalle.estado === 'VALIDO' && (
              <button
                type="button"
                className="btn-danger"
                onClick={() => abrirAnulacion(reporteDetalle)}
              >
                <Ban size={16} />
                Anular reporte
              </button>
            )}
          </div>
        </ModalBase>
      )}

      {reporteAnular && (
        <ModalBase
          titulo="Anular reporte"
          eyebrow="Acción administrativa"
          onCerrar={() => {
            if (!anulando) {
              setReporteAnular(null);
              setMotivo('');
            }
          }}
          compacto
        >
          <div className="warning-box">
            <ShieldCheck size={21} />
            <p>
              El código <strong>{reporteAnular.codigo}</strong> dejará de figurar
              como válido en la consulta pública. Esta acción quedará registrada.
            </p>
          </div>

          <label className="motivo-field">
            <span>Motivo de anulación *</span>
            <textarea
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Ej.: El reporte contiene información desactualizada."
              autoFocus
            />
            <small>{motivo.length}/500 caracteres</small>
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setReporteAnular(null);
                setMotivo('');
              }}
              disabled={anulando}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={() => void confirmarAnulacion()}
              disabled={anulando || motivo.trim().length < 5}
            >
              {anulando ? (
                <LoaderCircle size={16} className="is-spin" />
              ) : (
                <Ban size={16} />
              )}
              {anulando ? 'Anulando...' : 'Confirmar anulación'}
            </button>
          </div>
        </ModalBase>
      )}

      <style>{styles}</style>
    </main>
  );
}

function ResumenCard({
  icono,
  valor,
  titulo,
  clase,
}: {
  icono: ReactNode;
  valor: number;
  titulo: string;
  clase: string;
}) {
  return (
    <article className={`summary-card summary-card--${clase}`}>
      <div className="summary-card__icon">{icono}</div>
      <div>
        <strong>{valor}</strong>
        <span>{titulo}</span>
      </div>
    </article>
  );
}

function FormatoIcon({
  formato,
  grande = false,
}: {
  formato: FormatoReporte;
  grande?: boolean;
}) {
  const Icono =
    formato === 'EXCEL'
      ? FileSpreadsheet
      : FileText;

  return (
    <span className={`formato-icon formato-icon--${formato.toLowerCase()} ${grande ? 'is-large' : ''}`}>
      <Icono size={grande ? 25 : 19} />
    </span>
  );
}

function EstadoBadge({ estado }: { estado: EstadoReporte }) {
  const configuracion = {
    VALIDO: {
      texto: 'Válido',
      icono: CheckCircle2,
    },
    ANULADO: {
      texto: 'Anulado',
      icono: Ban,
    },
    ERROR: {
      texto: 'Error',
      icono: CircleX,
    },
    GENERANDO: {
      texto: 'Generando',
      icono: Clock3,
    },
  }[estado];
  const Icono = configuracion.icono;

  return (
    <span className={`estado-badge estado-${estado.toLowerCase()}`}>
      <Icono size={14} />
      {configuracion.texto}
    </span>
  );
}

function DetalleItem({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="detalle-item">
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function ModalBase({
  titulo,
  eyebrow,
  onCerrar,
  children,
  compacto = false,
}: {
  titulo: string;
  eyebrow: string;
  onCerrar: () => void;
  children: ReactNode;
  compacto?: boolean;
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) {
          onCerrar();
        }
      }}
    >
      <section
        className={`reportes-modal ${compacto ? 'is-compact' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >
        <header className="modal-header">
          <div>
            <span className="section-eyebrow">{eyebrow}</span>
            <h2>{titulo}</h2>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <X size={19} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}

const styles = `
  .reportes-page { width: 100%; min-width: 0; padding: 0 34px 28px; color: var(--app-text); }
  .reportes-header { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 18px; padding: 23px 30px; overflow: hidden; border: 1px solid var(--app-border); border-radius: 26px; background: var(--app-surface); box-shadow: var(--app-shadow), inset 0 1px 0 color-mix(in srgb,var(--app-surface-raised) 72%,transparent); }
  .reportes-header::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 5px; background: var(--app-accent); }
  .reportes-header__content { display: flex; align-items: center; gap: 17px; min-width: 0; }
  .reportes-header__icon { width: 58px; height: 58px; display: grid; place-items: center; flex: 0 0 auto; border: 1px solid var(--app-border-strong); border-radius: 18px; color: var(--app-accent-dark); background: var(--app-accent-soft); box-shadow: var(--app-shadow-sm); }
  .reportes-eyebrow,.section-eyebrow { display: block; color: var(--app-accent-dark); font-size: 11px; font-weight: 850; letter-spacing: .15em; text-transform: uppercase; }
  .reportes-header h1 { margin: 5px 0 0; font-size: 31px; font-weight: 900; letter-spacing: -.025em; }
  .reportes-header p { margin: 6px 0 0; color: var(--app-text-soft); font-size: 14px; }
  .reportes-header__meta { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; }
  .reportes-header__meta span { padding: 5px 9px; border: 1px solid var(--app-warning-border); border-radius: 999px; color: var(--app-warning-strong); background: var(--app-warning-bg); font-size: 10px; font-weight: 750; }
  .btn-actualizar { min-height: 45px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px; flex: 0 0 auto; border: none; border-radius: 999px; color: #fff; background: linear-gradient(135deg,var(--app-accent),var(--app-accent-hover)); box-shadow: 0 14px 32px color-mix(in srgb,var(--app-accent) 28%,transparent); font-weight: 800; cursor: pointer; transition: transform .18s ease,box-shadow .18s ease; }
  .btn-actualizar:hover:not(:disabled) { transform: translateY(-1px); }
  .btn-actualizar:disabled { opacity: .65; cursor: wait; }
  .reportes-summary { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 13px; margin-bottom: 16px; }
  .summary-card { display: flex; align-items: center; gap: 13px; min-width: 0; padding: 16px 18px; border: 1px solid var(--app-border); border-radius: 20px; background: var(--app-surface); box-shadow: var(--app-shadow-sm); }
  .summary-card__icon { width: 43px; height: 43px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 14px; }
  .summary-card strong,.summary-card span { display: block; }
  .summary-card strong { font-size: 24px; line-height: 1; font-weight: 900; }
  .summary-card span { margin-top: 5px; color: var(--app-text-soft); font-size: 12px; font-weight: 700; }
  .summary-card--total .summary-card__icon { color: var(--app-accent-dark); background: var(--app-accent-soft); }
  .summary-card--valido .summary-card__icon { color: var(--app-success); background: var(--app-success-bg); }
  .summary-card--anulado .summary-card__icon { color: var(--app-danger); background: var(--app-danger-bg); }
  .summary-card--incidencia .summary-card__icon { color: var(--app-warning-strong); background: var(--app-warning-bg); }
  .reportes-panel { margin-bottom: 24px; padding: 21px 24px; border: 1px solid var(--app-border); border-radius: 23px; background: var(--app-surface); box-shadow: var(--app-shadow); }
  .reportes-panel__heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
  .reportes-panel__heading h2 { margin: 5px 0 0; color: var(--app-text); font-size: 19px; font-weight: 850; }
  .reportes-panel__heading p { margin: 5px 0 0; color: var(--app-text-soft); font-size: 13px; }
  .result-count { padding: 6px 10px; border-radius: 999px; color: var(--app-accent-dark); background: var(--app-accent-soft); font-size: 12px; font-weight: 800; }
  .reportes-filters { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 18px; }
  .reportes-filters button { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border: 1px solid var(--app-input-border); border-radius: 999px; color: var(--app-text-soft); background: var(--app-surface); font-size: 12px; font-weight: 750; cursor: pointer; transition: border-color .18s ease,background .18s ease,color .18s ease; }
  .reportes-filters button.active { border-color: var(--app-accent); color: var(--app-accent-dark); background: linear-gradient(135deg,var(--app-accent-soft),var(--app-accent-softer)); }
  .reportes-filters button span { min-width: 21px; height: 21px; display: grid; place-items: center; padding: 0 6px; border-radius: 999px; background: var(--app-accent-softer); font-size: 10px; }
  .reportes-selects { display: grid; grid-template-columns: repeat(2,minmax(0,220px)); gap: 10px; margin-top: 14px; }
  .reportes-toolbar { margin-top: 14px; }
  .search-control,.filter-control { min-height: 43px; display: flex; align-items: center; gap: 9px; padding: 0 14px; border: 1px solid var(--app-input-border); border-radius: 14px; color: var(--app-text-muted); background: var(--app-surface); }
  .search-control:focus-within,.filter-control:focus-within,.simple-select:focus { border-color: var(--app-accent); box-shadow: 0 0 0 3px var(--app-accent-soft); }
  .search-control input { min-width: 0; flex: 1; border: 0; outline: 0; color: var(--app-text); background: transparent; }
  .search-control button { display: grid; place-items: center; padding: 3px; border: 0; color: var(--app-text-soft); background: transparent; cursor: pointer; }
  .filter-control select,.simple-select { width: 100%; border: 0; outline: 0; color: var(--app-text); background: transparent; cursor: pointer; }
  .simple-select { min-height: 43px; padding: 0 14px; border: 1px solid var(--app-input-border); border-radius: 14px; background: var(--app-surface); }
  .reportes-table-section { width: 100%; margin-bottom: 18px; }
  .reportes-state-card { padding: 18px; border: 1px solid var(--app-border); border-radius: 21px; background: var(--app-surface); box-shadow: var(--app-shadow-sm); }
  .reportes-table-wrap { width: 100%; overflow-x: auto; border: 1px solid var(--app-border); border-radius: 21px; background: var(--app-surface); box-shadow: var(--app-shadow-sm); }
  .reportes-table { width: 100%; min-width: 940px; border-collapse: separate; border-spacing: 0; }
  .reportes-table th,.reportes-table td { padding: 12px 10px; text-align: left; vertical-align: middle; border-bottom: 1px solid var(--app-border-soft); }
  .reportes-table th { color: var(--app-text-soft); background: var(--app-accent-soft); font-size: 10px; font-weight: 850; text-transform: uppercase; }
  .reportes-table td { color: var(--app-text-secondary); font-size: 12px; }
  .reportes-table tbody tr { transition: background .18s ease,box-shadow .18s ease; }
  .reportes-table tbody tr:hover { background: var(--app-accent-softer); box-shadow: inset 4px 0 0 var(--app-accent); }
  .reportes-table tbody tr:last-child td { border-bottom: 0; }
  .reporte-identidad { display: flex; align-items: center; gap: 11px; min-width: 210px; max-width: 330px; }
  .reporte-identidad>div { min-width: 0; }
  .reporte-identidad strong,.reporte-identidad span,.reporte-identidad small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .reporte-identidad strong { font-size: 13px; }
  .reporte-identidad span { margin-top: 3px; color: var(--app-accent-dark); font-family: ui-monospace,SFMono-Regular,Consolas,monospace; font-size: 11px; font-weight: 800; }
  .reporte-identidad small { margin-top: 3px; color: var(--app-text-soft); font-size: 10px; }
  .formato-icon { position: relative; width: 42px; height: 42px; display: inline-block; flex: 0 0 42px; padding: 0; border-radius: 13px; color: var(--app-accent-dark); background: var(--app-accent-soft); line-height: 0; }
  .formato-icon svg { position: absolute; top: 50%; left: 50%; display: block; width: 19px; height: 19px; margin: 0; stroke: currentColor; transform: translate(-50%, -50%); }
  .formato-icon.is-large { width: 52px; height: 52px; border-radius: 16px; }
  .formato-icon.is-large svg { width: 25px; height: 25px; }
  .formato-icon--pdf,.formato-icon--excel,.formato-icon--csv { color: var(--app-accent-dark); background: var(--app-accent-soft); }
  .formato-badge,.estado-badge { display: inline-flex; align-items: center; gap: 5px; padding: 6px 9px; border: 1px solid; border-radius: 999px; font-size: 10px; font-weight: 800; white-space: nowrap; }
  .formato-pdf { color: var(--app-danger); border-color: var(--app-danger-border); background: var(--app-danger-bg); }
  .formato-excel { color: var(--app-success); border-color: var(--app-success-border); background: var(--app-success-bg); }
  .formato-csv { color: var(--app-accent-dark); border-color: var(--app-border-strong); background: var(--app-accent-soft); }
  .estado-valido { color: var(--app-success); border-color: var(--app-success-border); background: var(--app-success-bg); }
  .estado-anulado,.estado-error { color: var(--app-danger); border-color: var(--app-danger-border); background: var(--app-danger-bg); }
  .estado-generando { color: var(--app-warning-strong); border-color: var(--app-warning-border); background: var(--app-warning-bg); }
  .persona-cell strong,.persona-cell span { display: block; }
  .persona-cell strong { font-size: 12px; }
  .persona-cell span { margin-top: 3px; color: var(--app-text-soft); font-size: 10px; }
  .fecha-cell { display: flex; align-items: center; gap: 6px; min-width: 135px; color: var(--app-text-soft); font-size: 11px; }
  .actions-cell { text-align: right; }
  .btn-detalle { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 7px 8px; border: 1px solid var(--app-border-strong); border-radius: 11px; color: var(--app-accent-dark); background: transparent; font-size: 10px; font-weight: 780; cursor: pointer; transition: background .18s ease,transform .18s ease; }
  .btn-detalle:hover { transform: translateY(-1px); background: var(--app-accent-soft); }
  .modal-backdrop { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 22px; background: color-mix(in srgb,#0f172a 54%,transparent); backdrop-filter: blur(6px); }
  .reportes-modal { width: min(680px,100%); max-height: calc(100dvh - 44px); overflow: auto; border: 1px solid var(--app-border); border-radius: 24px; background: var(--app-surface); box-shadow: var(--app-shadow-lg); animation: modalEntrada .22s ease; }
  .reportes-modal.is-compact { width: min(560px,100%); }
  .modal-header { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 19px 21px; border-bottom: 1px solid var(--app-border-soft); background: var(--app-surface); }
  .modal-header h2 { margin: 4px 0 0; font-size: 20px; }
  .modal-header button { width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid var(--app-border); border-radius: 11px; color: var(--app-text-soft); background: var(--app-surface-alt); cursor: pointer; }
  .modal-body { padding: 21px; }
  .detalle-cabecera { display: flex; align-items: center; gap: 14px; padding-bottom: 17px; border-bottom: 1px solid var(--app-border-soft); }
  .detalle-cabecera h3 { margin: 7px 0 4px; font-size: 17px; }
  .detalle-cabecera code { color: var(--app-accent-dark); font-size: 11px; font-weight: 800; }
  .detalle-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; margin-top: 16px; }
  .detalle-item { min-width: 0; padding: 12px 13px; border: 1px solid var(--app-border-soft); border-radius: 14px; background: var(--app-surface-alt); }
  .detalle-item span,.detalle-item strong { display: block; }
  .detalle-item span { color: var(--app-text-soft); font-size: 10px; font-weight: 700; text-transform: uppercase; }
  .detalle-item strong { margin-top: 5px; overflow-wrap: anywhere; font-size: 12px; }
  .anulacion-info,.error-info,.warning-box { display: flex; align-items: flex-start; gap: 11px; margin-top: 15px; padding: 13px 14px; border: 1px solid var(--app-danger-border); border-radius: 15px; color: var(--app-danger); background: var(--app-danger-bg); }
  .anulacion-info svg,.error-info svg,.warning-box svg { flex: 0 0 auto; }
  .anulacion-info strong,.error-info strong { font-size: 12px; }
  .anulacion-info p,.error-info p,.warning-box p { margin: 4px 0 0; color: var(--app-text); font-size: 12px; line-height: 1.55; }
  .anulacion-info span { display: block; margin-top: 5px; color: var(--app-text-soft); font-size: 10px; }
  .warning-box { margin-top: 0; border-color: var(--app-warning-border); color: var(--app-warning-strong); background: var(--app-warning-bg); }
  .motivo-field { display: grid; gap: 7px; margin-top: 16px; }
  .motivo-field>span { font-size: 12px; font-weight: 800; }
  .motivo-field textarea { width: 100%; resize: vertical; padding: 12px; border: 1px solid var(--app-border); border-radius: 14px; outline: 0; color: var(--app-text); background: var(--app-surface-alt); }
  .motivo-field textarea:focus { border-color: var(--app-accent); box-shadow: 0 0 0 3px var(--app-accent-soft); }
  .motivo-field small { color: var(--app-text-soft); font-size: 10px; text-align: right; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 19px; padding-top: 15px; border-top: 1px solid var(--app-border-soft); }
  .btn-secondary,.btn-danger { min-height: 40px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 9px 15px; border-radius: 999px; cursor: pointer; }
  .btn-secondary { border: 1px solid var(--app-border); color: var(--app-text); background: var(--app-surface); }
  .btn-danger { border: 1px solid var(--app-danger-border); color: #fff; background: var(--app-danger); }
  .btn-danger:disabled { opacity: .5; cursor: not-allowed; }
  .is-spin { animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes modalEntrada { from { opacity: 0; transform: translateY(8px) scale(.985); } }
  @media (max-width: 1100px) { .reportes-summary { grid-template-columns: repeat(2,minmax(0,1fr)); } .reportes-toolbar { grid-template-columns: repeat(2,minmax(0,1fr)); } .search-control { grid-column: 1/-1; } }
  @media (max-width: 760px) { .reportes-page { padding: 0 16px 22px; } .reportes-header { align-items: flex-start; flex-direction: column; padding: 20px; } .reportes-header h1 { font-size: 25px; } .btn-actualizar { width: 100%; } .reportes-summary { grid-template-columns: 1fr 1fr; } .reportes-panel { padding: 14px; } .reportes-toolbar { grid-template-columns: 1fr; } .search-control { grid-column: auto; } .detalle-grid { grid-template-columns: 1fr; } }
  @media (max-width: 480px) { .reportes-header__icon { display: none; } .reportes-summary { grid-template-columns: 1fr; } .modal-actions { flex-direction: column-reverse; } .btn-secondary,.btn-danger { width: 100%; } }
  @media (prefers-reduced-motion: reduce) { .is-spin,.reportes-modal { animation: none; } }
`;
