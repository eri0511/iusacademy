import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  FileSearch,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  useAuth,
} from '../../../auth/AuthContext';

import AulaEmptyState from '../../../components/aula/AulaEmptyState';
import AulaLoadingOverlay from '../../../components/aula/AulaLoadingOverlay';

import useRevisionEntregaTareaDocente from '../../../hooks/tareas/useRevisionEntregaTareaDocente';

import {
  analizarEntregaTarea,
  type EvidenciaAnalisisEntrega,
  type ResultadoAnalisisEntrega,
} from '../../../services/tareas/tareas-analisis.service';

function porcentaje(
  valor?: number,
) {
  if (
    typeof valor !== 'number' ||
    Number.isNaN(valor)
  ) {
    return '—';
  }

  return `${(
    valor *
    100
  ).toFixed(1)} %`;
}

function nombreFuente(
  evidencia: EvidenciaAnalisisEntrega,
) {
  return (
    evidencia.fuente_titulo ||
    evidencia.fuente_tipo ||
    'Fuente identificada'
  );
}

function nivelSimilitud(
  valor?: number,
) {
  if (
    typeof valor !== 'number'
  ) {
    return 'Sin dato';
  }

  if (valor >= 0.85) {
    return 'Muy alta';
  }

  if (valor >= 0.7) {
    return 'Alta';
  }

  if (valor >= 0.6) {
    return 'Moderada';
  }

  return 'Baja';
}

export default function AnalisisEntregaIusAcademy() {
  const {
    cursoId:
      cursoIdParam,
    tareaId:
      tareaIdParam,
    entregaId:
      entregaIdParam,
  } =
    useParams();

  const cursoId =
    Number(
      cursoIdParam,
    );

  const tareaId =
    Number(
      tareaIdParam,
    );

  const entregaId =
    Number(
      entregaIdParam,
    );

  const navigate =
    useNavigate();

  const {
    accessToken,
  } =
    useAuth();

  const revision =
    useRevisionEntregaTareaDocente(
      cursoId,
      tareaId,
      entregaId,
    );

  const [
    resultado,
    setResultado,
  ] =
    useState<ResultadoAnalisisEntrega | null>(
      null,
    );

  const [
    cargandoAnalisis,
    setCargandoAnalisis,
  ] =
    useState(
      false,
    );

  const [
    errorAnalisis,
    setErrorAnalisis,
  ] =
    useState<string | null>(
      null,
    );

  const inicioAutomatico =
    useRef(
      false,
    );

  const ejecutarAnalisis =
    useCallback(
      async () => {
        if (!accessToken) {
          setErrorAnalisis(
            'Tu sesión terminó. Inicia sesión nuevamente.',
          );

          return;
        }

        if (
          !Number.isInteger(cursoId) ||
          !Number.isInteger(tareaId) ||
          !Number.isInteger(entregaId) ||
          cursoId <= 0 ||
          tareaId <= 0 ||
          entregaId <= 0
        ) {
          setErrorAnalisis(
            'No fue posible identificar correctamente la entrega.',
          );

          return;
        }

        setCargandoAnalisis(
          true,
        );

        setErrorAnalisis(
          null,
        );

        try {
          const respuesta =
            await analizarEntregaTarea(
              accessToken,
              cursoId,
              tareaId,
              entregaId,
            );

          setResultado(
            respuesta,
          );
        } catch (causa) {
          setResultado(
            null,
          );

          setErrorAnalisis(
            causa instanceof Error
              ? causa.message
              : 'No fue posible analizar la entrega.',
          );
        } finally {
          setCargandoAnalisis(
            false,
          );
        }
      },
      [
        accessToken,
        cursoId,
        entregaId,
        tareaId,
      ],
    );

  useEffect(
    () => {
      if (
        revision.cargando ||
        revision.error ||
        !revision.datos ||
        inicioAutomatico.current
      ) {
        return;
      }

      inicioAutomatico.current =
        true;

      void ejecutarAnalisis();
    },
    [
      ejecutarAnalisis,
      revision.cargando,
      revision.datos,
      revision.error,
    ],
  );

  const evidencias =
    useMemo(
      () =>
        Array.isArray(
          resultado?.evidencias,
        )
          ? resultado.evidencias
          : [],
      [
        resultado?.evidencias,
      ],
    );

  const fuentesAutorizadas =
    useMemo(
      () =>
        evidencias.filter(
          (
            evidencia,
          ) =>
            evidencia.fuente_autorizada ===
            true,
        ).length,
      [
        evidencias,
      ],
    );

  const volverRevision =
    () =>
      navigate(
        `/docente/cursos/${cursoId}/tareas/${tareaId}/entregas/${entregaId}`,
      );

  if (
    revision.cargando
  ) {
    return (
      <AulaLoadingOverlay
        visible
        texto="Cargando la entrega..."
      />
    );
  }

  if (
    revision.error ||
    !revision.datos
  ) {
    return (
      <section className="aeia-error-page">
        <AulaEmptyState
          titulo="No fue posible abrir la entrega"
          descripcion={
            revision.error ||
            'Actualiza la página e inténtalo nuevamente.'
          }
          icono={AlertTriangle}
        />

        <button
          type="button"
          className="aeia-btn aeia-btn--secondary"
          onClick={
            volverRevision
          }
        >
          <ArrowLeft
            size={16}
          />
          Volver
        </button>

        <style>
          {styles}
        </style>
      </section>
    );
  }

  const datos =
    revision.datos;

  return (
    <section className="aeia-page">
      <header className="aeia-header">
        <div className="aeia-header__left">
          <button
            type="button"
            className="aeia-back"
            onClick={
              volverRevision
            }
            aria-label="Volver a la revisión de la entrega"
          >
            <ArrowLeft
              size={17}
            />
          </button>

          <div>
            <span className="aeia-eyebrow">
              Análisis IusAcademy
            </span>

            <h1>
              {datos.sujeto.nombre}
            </h1>

            <p>
              {datos.tarea.titulo}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="aeia-btn aeia-btn--primary"
          disabled={
            cargandoAnalisis
          }
          onClick={() =>
            void ejecutarAnalisis()
          }
        >
          {cargandoAnalisis ? (
            <Loader2
              size={16}
              className="aeia-spin"
            />
          ) : (
            <RefreshCw
              size={16}
            />
          )}

          {cargandoAnalisis
            ? 'Analizando...'
            : resultado
              ? 'Volver a analizar'
              : 'Ejecutar análisis'}
        </button>
      </header>

      <section className="aeia-context">
        <div>
          <span className="aeia-context__label">
            Tipo de tarea
          </span>

          <strong>
            {datos.tarea.tipo}
          </strong>
        </div>

        <div>
          <span className="aeia-context__label">
            Modalidad
          </span>

          <strong>
            {datos.sujeto.tipo ===
            'GRUPO'
              ? 'Entrega grupal'
              : 'Entrega individual'}
          </strong>
        </div>

        <div>
          <span className="aeia-context__label">
            Estado
          </span>

          <strong>
            {datos.entrega.estado}
          </strong>
        </div>
      </section>

      {cargandoAnalisis &&
        !resultado && (
        <section className="aeia-loading-card">
          <div className="aeia-loading-icon">
            <BrainCircuit
              size={28}
            />
          </div>

          <div>
            <h2>
              Analizando la entrega
            </h2>

            <p>
              IusAcademy está preparando el contenido, comparando fragmentos y buscando evidencias en las fuentes disponibles del curso.
            </p>
          </div>

          <Loader2
            size={22}
            className="aeia-spin"
          />
        </section>
      )}

      {errorAnalisis && (
        <section className="aeia-alert">
          <AlertTriangle
            size={20}
          />

          <div>
            <strong>
              No fue posible completar el análisis
            </strong>

            <p>
              {errorAnalisis}
            </p>
          </div>
        </section>
      )}

      {resultado && (
        <>
          <section className="aeia-summary">
            <div className="aeia-summary__title">
              <div className="aeia-summary__icon">
                <BrainCircuit
                  size={24}
                />
              </div>

              <div>
                <span className="aeia-eyebrow">
                  Resultado técnico inicial
                </span>

                <h2>
                  Resumen del análisis semántico
                </h2>
              </div>
            </div>

            <div className="aeia-summary-grid">
              <article className="aeia-stat">
                <FileSearch
                  size={18}
                />

                <span>
                  Fragmentos analizados
                </span>

                <strong>
                  {resultado.total_fragmentos ??
                    '—'}
                </strong>
              </article>

              <article className="aeia-stat">
                <BookOpenCheck
                  size={18}
                />

                <span>
                  Fuentes evaluadas
                </span>

                <strong>
                  {resultado.total_fuentes_evaluadas ??
                    '—'}
                </strong>
              </article>

              <article className="aeia-stat">
                <CheckCircle2
                  size={18}
                />

                <span>
                  Evidencias encontradas
                </span>

                <strong>
                  {resultado.total_evidencias ??
                    evidencias.length}
                </strong>
              </article>

              <article className="aeia-stat">
                <ShieldCheck
                  size={18}
                />

                <span>
                  Coincidencias autorizadas
                </span>

                <strong>
                  {fuentesAutorizadas}
                </strong>
              </article>
            </div>

            <div className="aeia-similarity-grid">
              <div>
                <span>
                  Similitud máxima detectada
                </span>

                <strong>
                  {porcentaje(
                    resultado.similitud_maxima,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Similitud promedio de evidencias
                </span>

                <strong>
                  {porcentaje(
                    resultado.similitud_promedio,
                  )}
                </strong>
              </div>
            </div>

            <p className="aeia-disclaimer">
              Las similitudes son indicadores técnicos de coincidencia entre fragmentos. No representan por sí solas un porcentaje de plagio ni determinan la calificación del estudiante.
            </p>
          </section>

          <section className="aeia-evidence-section">
            <div className="aeia-section-head">
              <div>
                <span className="aeia-eyebrow">
                  Evidencias
                </span>

                <h2>
                  Coincidencias localizadas
                </h2>
              </div>

              <span className="aeia-count">
                {evidencias.length}
              </span>
            </div>

            {evidencias.length ===
            0 ? (
              <div className="aeia-empty">
                <CheckCircle2
                  size={25}
                />

                <div>
                  <strong>
                    No se encontraron evidencias relevantes
                  </strong>

                  <p>
                    El motor no devolvió coincidencias que superen el umbral técnico configurado.
                  </p>
                </div>
              </div>
            ) : (
              <div className="aeia-evidence-list">
                {evidencias.map(
                  (
                    evidencia,
                    indice,
                  ) => (
                    <article
                      className="aeia-evidence"
                      key={
                        `${evidencia.fuente_id_externo ?? 'fuente'}-${evidencia.indice_fragmento ?? indice}-${indice}`
                      }
                    >
                      <header>
                        <div>
                          <span className="aeia-evidence__source-type">
                            {evidencia.fuente_tipo ??
                              'FUENTE'}
                          </span>

                          <h3>
                            {nombreFuente(
                              evidencia,
                            )}
                          </h3>
                        </div>

                        <div className="aeia-evidence__badges">
                          {evidencia.fuente_autorizada ===
                            true && (
                            <span className="aeia-badge aeia-badge--authorized">
                              <ShieldCheck
                                size={13}
                              />
                              Recurso autorizado
                            </span>
                          )}

                          <span className="aeia-badge">
                            {nivelSimilitud(
                              evidencia.similitud_combinada,
                            )}
                            {' · '}
                            {porcentaje(
                              evidencia.similitud_combinada,
                            )}
                          </span>
                        </div>
                      </header>

                      <div className="aeia-compare">
                        <div>
                          <span className="aeia-compare__label">
                            Fragmento de la entrega
                          </span>

                          <p>
                            {evidencia.texto_fragmento ||
                              'El motor no devolvió el texto del fragmento.'}
                          </p>
                        </div>

                        <div>
                          <span className="aeia-compare__label">
                            Fragmento coincidente
                          </span>

                          <p>
                            {evidencia.texto_coincidente ||
                              'El motor no devolvió el fragmento de la fuente.'}
                          </p>
                        </div>
                      </div>

                      <footer>
                        <span>
                          Semántica:{' '}
                          <strong>
                            {porcentaje(
                              evidencia.similitud_semantica,
                            )}
                          </strong>
                        </span>

                        <span>
                          Léxica:{' '}
                          <strong>
                            {porcentaje(
                              evidencia.similitud_lexica,
                            )}
                          </strong>
                        </span>

                        {evidencia.seccion && (
                          <span>
                            Sección:{' '}
                            <strong>
                              {evidencia.seccion}
                            </strong>
                          </span>
                        )}
                      </footer>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>

          <section className="aeia-next">
            <div>
              <span className="aeia-eyebrow">
                Próximas capas
              </span>

              <h2>
                Análisis académico y jurídico
              </h2>

              <p>
                Esta primera vista muestra la evidencia semántica real devuelta por el motor. Después incorporaremos fundamentación jurídica, estructura del documento, citas, formato APA, posible asistencia de IA y el reporte PDF de retroalimentación.
              </p>
            </div>
          </section>

          <details className="aeia-technical">
            <summary>
              Ver respuesta técnica completa
            </summary>

            <pre>
              {JSON.stringify(
                resultado,
                null,
                2,
              )}
            </pre>
          </details>
        </>
      )}

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .aeia-error-page {
    display: grid;
    justify-items: center;
    gap: 12px;
    padding: 20px 0;
  }

  .aeia-page {
    display: grid;
    gap: 14px;
    min-width: 0;
    padding-bottom: 36px;
    color: var(--app-text);
  }

  .aeia-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 18px;
    border: 1px solid var(--app-border);
    border-radius: 18px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .aeia-header__left {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .aeia-back {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    flex: 0 0 40px;
    padding: 0;
    border: 1px solid var(--app-border);
    border-radius: 11px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    cursor: pointer;
  }

  .aeia-eyebrow {
    display: block;
    color: var(--app-accent-dark);
    font-size: var(--app-font-xs);
    font-weight: var(--app-font-bold);
    letter-spacing: .07em;
    text-transform: uppercase;
  }

  .aeia-header h1,
  .aeia-summary h2,
  .aeia-evidence-section h2,
  .aeia-next h2 {
    margin: 2px 0 0;
  }

  .aeia-header h1 {
    font-size: var(--app-font-title);
    font-weight: var(--app-font-black);
  }

  .aeia-header p {
    margin: 3px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .aeia-btn {
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 8px 13px;
    border-radius: 10px;
    font: inherit;
    font-size: var(--app-font-sm);
    font-weight: var(--app-font-bold);
    cursor: pointer;
  }

  .aeia-btn--primary {
    border: 1px solid var(--app-accent);
    color: #fff;
    background: var(--app-accent);
  }

  .aeia-btn--secondary {
    border: 1px solid var(--app-border);
    color: var(--app-text-secondary);
    background: var(--app-surface);
  }

  .aeia-btn:disabled {
    opacity: .6;
    cursor: not-allowed;
  }

  .aeia-context {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-border-soft);
    box-shadow: var(--app-shadow-sm);
  }

  .aeia-context > div {
    display: grid;
    gap: 3px;
    padding: 12px 14px;
    background: var(--app-surface);
  }

  .aeia-context__label {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
    font-weight: var(--app-font-bold);
    text-transform: uppercase;
  }

  .aeia-context strong {
    font-size: var(--app-font-sm);
  }

  .aeia-loading-card,
  .aeia-alert,
  .aeia-summary,
  .aeia-evidence-section,
  .aeia-next,
  .aeia-technical {
    border: 1px solid var(--app-border);
    border-radius: 18px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .aeia-loading-card {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 14px;
    padding: 20px;
  }

  .aeia-loading-icon,
  .aeia-summary__icon {
    display: grid;
    place-items: center;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .aeia-loading-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
  }

  .aeia-loading-card h2,
  .aeia-loading-card p,
  .aeia-alert p {
    margin: 0;
  }

  .aeia-loading-card h2 {
    font-size: var(--app-font-section);
  }

  .aeia-loading-card p,
  .aeia-alert p {
    margin-top: 4px;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
    line-height: 1.55;
  }

  .aeia-alert {
    display: flex;
    gap: 12px;
    padding: 16px;
    color: var(--app-danger);
    background: var(--app-danger-bg);
    border-color: var(--app-danger-border);
  }

  .aeia-summary {
    padding: 18px;
  }

  .aeia-summary__title {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .aeia-summary__icon {
    width: 44px;
    height: 44px;
    border-radius: 13px;
  }

  .aeia-summary h2,
  .aeia-evidence-section h2,
  .aeia-next h2 {
    font-size: var(--app-font-section);
    font-weight: var(--app-font-black);
  }

  .aeia-summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    margin-top: 16px;
  }

  .aeia-stat {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 7px 9px;
    align-items: center;
    padding: 13px;
    border: 1px solid var(--app-border-soft);
    border-radius: 13px;
    background: var(--app-surface-alt);
  }

  .aeia-stat svg {
    color: var(--app-accent-dark);
  }

  .aeia-stat span {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
    font-weight: var(--app-font-bold);
  }

  .aeia-stat strong {
    grid-column: 1 / -1;
    font-size: 1.35rem;
    font-weight: var(--app-font-black);
  }

  .aeia-similarity-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 10px;
  }

  .aeia-similarity-grid > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 14px;
    border: 1px solid var(--app-border-soft);
    border-radius: 12px;
  }

  .aeia-similarity-grid span {
    color: var(--app-text-secondary);
    font-size: var(--app-font-sm);
    font-weight: var(--app-font-semibold);
  }

  .aeia-similarity-grid strong {
    font-size: var(--app-font-md);
  }

  .aeia-disclaimer {
    margin: 12px 0 0;
    padding: 11px 12px;
    border-left: 3px solid var(--app-accent);
    border-radius: 0 9px 9px 0;
    color: var(--app-text-muted);
    background: var(--app-accent-soft);
    font-size: var(--app-font-sm);
    line-height: 1.55;
  }

  .aeia-evidence-section {
    padding: 18px;
  }

  .aeia-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .aeia-count {
    min-width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    padding: 0 9px;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: var(--app-font-sm);
    font-weight: var(--app-font-black);
  }

  .aeia-empty {
    display: flex;
    gap: 11px;
    align-items: flex-start;
    padding: 15px;
    border: 1px solid var(--app-success-border);
    border-radius: 13px;
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .aeia-empty p {
    margin: 4px 0 0;
    font-size: var(--app-font-sm);
  }

  .aeia-evidence-list {
    display: grid;
    gap: 12px;
  }

  .aeia-evidence {
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface);
  }

  .aeia-evidence > header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 13px 14px;
    border-bottom: 1px solid var(--app-border-soft);
    background: var(--app-surface-alt);
  }

  .aeia-evidence__source-type {
    display: block;
    color: var(--app-accent-dark);
    font-size: var(--app-font-xs);
    font-weight: var(--app-font-black);
    letter-spacing: .05em;
  }

  .aeia-evidence h3 {
    margin: 2px 0 0;
    font-size: var(--app-font-md);
  }

  .aeia-evidence__badges {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    flex-wrap: wrap;
  }

  .aeia-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    border: 1px solid var(--app-border);
    border-radius: 999px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font-size: var(--app-font-xs);
    font-weight: var(--app-font-bold);
  }

  .aeia-badge--authorized {
    border-color: var(--app-success-border);
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .aeia-compare {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1px;
    background: var(--app-border-soft);
  }

  .aeia-compare > div {
    padding: 14px;
    background: var(--app-surface);
  }

  .aeia-compare__label {
    display: block;
    margin-bottom: 7px;
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
    font-weight: var(--app-font-bold);
    text-transform: uppercase;
  }

  .aeia-compare p {
    margin: 0;
    color: var(--app-text-secondary);
    font-size: var(--app-font-sm);
    line-height: 1.65;
    white-space: pre-wrap;
  }

  .aeia-evidence > footer {
    display: flex;
    flex-wrap: wrap;
    gap: 7px 16px;
    padding: 9px 14px;
    border-top: 1px solid var(--app-border-soft);
    color: var(--app-text-muted);
    background: var(--app-surface-alt);
    font-size: var(--app-font-xs);
  }

  .aeia-next {
    padding: 18px;
  }

  .aeia-next p {
    max-width: 900px;
    margin: 7px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
    line-height: 1.6;
  }

  .aeia-technical {
    padding: 13px 15px;
  }

  .aeia-technical summary {
    cursor: pointer;
    color: var(--app-text-secondary);
    font-size: var(--app-font-sm);
    font-weight: var(--app-font-bold);
  }

  .aeia-technical pre {
    overflow: auto;
    max-height: 520px;
    margin: 12px 0 0;
    padding: 14px;
    border-radius: 11px;
    color: var(--app-text-secondary);
    background: var(--app-bg);
    font-size: 12px;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .aeia-spin {
    animation: aeia-spin .8s linear infinite;
  }

  @keyframes aeia-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1000px) {
    .aeia-summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .aeia-header,
    .aeia-evidence > header {
      align-items: stretch;
      flex-direction: column;
    }

    .aeia-btn--primary {
      width: 100%;
    }

    .aeia-context,
    .aeia-summary-grid,
    .aeia-similarity-grid,
    .aeia-compare {
      grid-template-columns: 1fr;
    }

    .aeia-loading-card {
      grid-template-columns: auto minmax(0, 1fr);
    }

    .aeia-loading-card > .aeia-spin {
      display: none;
    }

    .aeia-evidence__badges {
      justify-content: flex-start;
    }
  }
`;
