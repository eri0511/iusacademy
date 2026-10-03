import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ClipboardCopy,
  FileSearch,
  RefreshCw,
  Scale,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type { AnalisisExposicion } from '../../../types/tareas/exposiciones.types';

type Props = {
  analisis: AnalisisExposicion | null;
  cargando: boolean;
  generando: boolean;
  nombreExpositor: string;
  onGenerar: () => void;
  onCopiarRetroalimentacion: () => void;
};

function numero(valor: number | string | null) {
  if (valor === null) return null;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : null;
}

function mostrarPuntaje(valor: number | string | null) {
  const convertido = numero(valor);
  return convertido === null ? '—' : `${convertido.toFixed(0)}%`;
}

function anchoPuntaje(valor: number | string | null) {
  const convertido = numero(valor);
  if (convertido === null) return 0;
  return Math.max(0, Math.min(100, convertido));
}

function fechaAnalisis(valor: string | null) {
  if (!valor) return null;

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;

  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(fecha);
}

export default function AnalisisExposicionIusAcademy({
  analisis,
  cargando,
  generando,
  nombreExpositor,
  onGenerar,
  onCopiarRetroalimentacion,
}: Props) {
  const evidencias = analisis?.evidencias;
  const fecha = fechaAnalisis(analisis?.finalizadoEn ?? null);

  return (
    <>
      <style>{estilos}</style>

      <section className="aei-panel">
        <header className="aei-head">
          <div className="aei-title-wrap">
            <span className="aei-icon">
              <BrainCircuit size={21} />
            </span>

            <div>
              <div className="aei-kicker-row">
                <span className="aei-kicker">Análisis IusAcademy</span>
                <span className="aei-orientativo">Apoyo orientativo</span>
              </div>

              <h3>Análisis inteligente de la exposición</h3>
              <p>
                Revisa la estructura, el contenido jurídico y la presentación de{' '}
                <strong>{nombreExpositor}</strong> sin modificar la nota del docente.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="aei-action aei-action--primary"
            disabled={cargando || generando}
            onClick={onGenerar}
          >
            <RefreshCw className={generando ? 'aei-spin' : ''} size={17} />
            {generando
              ? 'Analizando...'
              : analisis?.estado === 'COMPLETADO'
                ? 'Regenerar análisis'
                : 'Generar análisis'}
          </button>
        </header>

        {cargando ? (
          <div className="aei-loading">
            <span className="aei-loader" />
            <div>
              <strong>Cargando análisis</strong>
              <p>Consultando el resultado guardado para esta exposición.</p>
            </div>
          </div>
        ) : !analisis ? (
          <div className="aei-empty">
            <span>
              <Sparkles size={28} />
            </span>
            <div>
              <strong>Esta exposición todavía no fue analizada.</strong>
              <p>
                Genera el análisis después de finalizar el turno para obtener observaciones
                académicas basadas en las evidencias disponibles.
              </p>
            </div>
          </div>
        ) : analisis.estado === 'ERROR' ? (
          <div className="aei-error">
            <XCircle size={21} />
            <div>
              <strong>No fue posible completar el análisis.</strong>
              <p>{analisis.error ?? 'Puedes intentar generarlo nuevamente.'}</p>
            </div>
          </div>
        ) : analisis.estado === 'PROCESANDO' ? (
          <div className="aei-loading">
            <span className="aei-loader" />
            <div>
              <strong>IusAcademy está procesando la exposición.</strong>
              <p>Este proceso puede tardar unos segundos según el material entregado.</p>
            </div>
          </div>
        ) : (
          <div className="aei-content">
            <div className="aei-summary-grid">
              <article className="aei-global-card">
                <span className="aei-global-label">Resultado orientativo</span>
                <strong>{mostrarPuntaje(analisis.puntuacionGlobal)}</strong>
                <p>{analisis.resumen ?? 'Análisis completado.'}</p>
                <small>
                  Versión {analisis.version}
                  {fecha ? ` · ${fecha}` : ''}
                </small>
              </article>

              <div className="aei-metrics">
                <article className="aei-metric-card">
                  <div className="aei-metric-head">
                    <span>
                      <FileSearch size={17} />
                      Estructura
                    </span>
                    <strong>{mostrarPuntaje(analisis.puntuacionEstructura)}</strong>
                  </div>
                  <div className="aei-progress">
                    <span style={{ width: `${anchoPuntaje(analisis.puntuacionEstructura)}%` }} />
                  </div>
                </article>

                <article className="aei-metric-card">
                  <div className="aei-metric-head">
                    <span>
                      <Scale size={17} />
                      Contenido jurídico
                    </span>
                    <strong>{mostrarPuntaje(analisis.puntuacionContenidoJuridico)}</strong>
                  </div>
                  <div className="aei-progress">
                    <span style={{ width: `${anchoPuntaje(analisis.puntuacionContenidoJuridico)}%` }} />
                  </div>
                </article>

                <article className="aei-metric-card">
                  <div className="aei-metric-head">
                    <span>
                      <Sparkles size={17} />
                      Presentación
                    </span>
                    <strong>{mostrarPuntaje(analisis.puntuacionPresentacion)}</strong>
                  </div>
                  <div className="aei-progress">
                    <span style={{ width: `${anchoPuntaje(analisis.puntuacionPresentacion)}%` }} />
                  </div>
                </article>
              </div>
            </div>

            <div className="aei-observations-grid">
              <article className="aei-observation aei-observation--success">
                <div className="aei-observation-title">
                  <CheckCircle2 size={18} />
                  <strong>Fortalezas</strong>
                  <span>{analisis.fortalezas.length}</span>
                </div>

                {analisis.fortalezas.length > 0 ? (
                  <ul>
                    {analisis.fortalezas.map((item, indice) => (
                      <li key={`${item}-${indice}`}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No se registraron fortalezas específicas.</p>
                )}
              </article>

              <article className="aei-observation aei-observation--warning">
                <div className="aei-observation-title">
                  <AlertTriangle size={18} />
                  <strong>Observaciones</strong>
                  <span>{analisis.advertencias.length}</span>
                </div>

                {analisis.advertencias.length > 0 ? (
                  <ul>
                    {analisis.advertencias.map((item, indice) => (
                      <li key={`${item}-${indice}`}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No se registraron advertencias.</p>
                )}
              </article>

              <article className="aei-observation aei-observation--danger">
                <div className="aei-observation-title">
                  <XCircle size={18} />
                  <strong>Omisiones</strong>
                  <span>{analisis.omisiones.length}</span>
                </div>

                {analisis.omisiones.length > 0 ? (
                  <ul>
                    {analisis.omisiones.map((item, indice) => (
                      <li key={`${item}-${indice}`}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No se detectaron omisiones relevantes.</p>
                )}
              </article>
            </div>

            {analisis.retroalimentacionSugerida && (
              <article className="aei-feedback">
                <div className="aei-feedback-head">
                  <div>
                    <span className="aei-kicker">Sugerencia para el docente</span>
                    <h4>Retroalimentación propuesta</h4>
                  </div>

                  <button
                    type="button"
                    className="aei-action aei-action--secondary"
                    onClick={onCopiarRetroalimentacion}
                  >
                    <ClipboardCopy size={16} />
                    Copiar retroalimentación
                  </button>
                </div>

                <p>{analisis.retroalimentacionSugerida}</p>
                <small>
                  Puedes editarla antes de incorporarla a la retroalimentación oficial.
                </small>
              </article>
            )}

            {evidencias && (
              <div className="aei-evidence">
                <span className="aei-kicker">Evidencias consideradas</span>
                <div className="aei-evidence-list">
                  {typeof evidencias.palabrasTotales === 'number' && (
                    <span>{evidencias.palabrasTotales} palabras</span>
                  )}
                  {typeof evidencias.preguntasRegistradas === 'number' && (
                    <span>{evidencias.preguntasRegistradas} preguntas</span>
                  )}
                  {typeof evidencias.diapositivasEstimadas === 'number' && (
                    <span>{evidencias.diapositivasEstimadas} diapositivas</span>
                  )}
                  {typeof evidencias.referenciasNormativasDetectadas === 'number' && (
                    <span>
                      {evidencias.referenciasNormativasDetectadas} referencias jurídicas
                    </span>
                  )}
                  {Array.isArray(evidencias.archivos) && (
                    <span>{evidencias.archivos.length} archivos analizados</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}

const estilos = `
.aei-panel {
  margin-top: 22px;
  overflow: hidden;
  border: 1px solid rgba(241, 139, 75, 0.28);
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.06);
}

.aei-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 22px;
  border-bottom: 1px solid rgba(241, 139, 75, 0.18);
  background: linear-gradient(135deg, #fffaf4 0%, #ffffff 74%);
}

.aei-title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
}

.aei-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  border: 1px solid rgba(241, 139, 75, 0.24);
  border-radius: 14px;
  background: #fff0df;
  color: #c46a2c;
}

.aei-kicker-row {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 5px;
  flex-wrap: wrap;
}

.aei-kicker {
  color: #c46a2c;
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.aei-orientativo {
  padding: 4px 8px;
  border: 1px solid rgba(241, 139, 75, 0.2);
  border-radius: 999px;
  background: rgba(241, 139, 75, 0.08);
  color: #9a521f;
  font-size: 0.72rem;
  font-weight: 700;
}

.aei-head h3,
.aei-feedback h4 {
  margin: 0;
  color: #0f172a;
}

.aei-head h3 {
  font-size: 1.08rem;
}

.aei-head p {
  max-width: 760px;
  margin: 6px 0 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.55;
}

.aei-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
}

.aei-action:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.aei-action:not(:disabled):hover {
  transform: translateY(-1px);
}

.aei-action--primary {
  border: 1px solid #f18b4b;
  background: #f18b4b;
  color: #fff;
}

.aei-action--primary:not(:disabled):hover {
  border-color: #e87936;
  background: #e87936;
}

.aei-action--secondary {
  border: 1px solid rgba(241, 139, 75, 0.32);
  background: #fff;
  color: #c46a2c;
}

.aei-action--secondary:hover {
  background: #fff8ef;
}

.aei-loading,
.aei-empty,
.aei-error {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 22px;
  padding: 20px;
  border-radius: 16px;
}

.aei-loading,
.aei-empty {
  border: 1px dashed rgba(241, 139, 75, 0.32);
  background: #fffaf4;
}

.aei-error {
  border: 1px solid #fecaca;
  background: #fff7f7;
  color: #991b1b;
}

.aei-empty > span {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  border-radius: 15px;
  background: #fff0df;
  color: #c46a2c;
}

.aei-loading strong,
.aei-empty strong,
.aei-error strong {
  color: #0f172a;
}

.aei-loading p,
.aei-empty p,
.aei-error p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.5;
}

.aei-loader {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  border: 3px solid rgba(241, 139, 75, 0.18);
  border-top-color: #f18b4b;
  border-radius: 50%;
  animation: aei-girar 0.8s linear infinite;
}

.aei-content {
  padding: 22px;
}

.aei-summary-grid {
  display: grid;
  grid-template-columns: minmax(250px, 0.8fr) minmax(0, 1.2fr);
  gap: 16px;
}

.aei-global-card,
.aei-metric-card,
.aei-observation,
.aei-feedback,
.aei-evidence {
  border: 1px solid #e7eaf0;
  border-radius: 16px;
  background: #fff;
}

.aei-global-card {
  padding: 20px;
  background: linear-gradient(145deg, #fff7ed 0%, #ffffff 78%);
}

.aei-global-label {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.aei-global-card > strong {
  display: block;
  margin-top: 7px;
  color: #c46a2c;
  font-size: 2.35rem;
  line-height: 1;
}

.aei-global-card p {
  margin: 12px 0 0;
  color: #475569;
  font-size: 0.88rem;
  line-height: 1.55;
}

.aei-global-card small {
  display: block;
  margin-top: 14px;
  color: #94a3b8;
}

.aei-metrics {
  display: grid;
  gap: 10px;
}

.aei-metric-card {
  padding: 15px 16px;
}

.aei-metric-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.aei-metric-head span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #334155;
  font-size: 0.88rem;
  font-weight: 750;
}

.aei-metric-head svg {
  color: #c46a2c;
}

.aei-metric-head strong {
  color: #0f172a;
}

.aei-progress {
  height: 8px;
  margin-top: 11px;
  overflow: hidden;
  border-radius: 999px;
  background: #f1f5f9;
}

.aei-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #f18b4b, #e87936);
}

.aei-observations-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.aei-observation {
  padding: 17px;
}

.aei-observation--success {
  border-color: #bbf7d0;
  background: #fbfffc;
}

.aei-observation--warning {
  border-color: #fde68a;
  background: #fffdf7;
}

.aei-observation--danger {
  border-color: #fecaca;
  background: #fffafa;
}

.aei-observation-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.aei-observation-title strong {
  color: #0f172a;
}

.aei-observation-title span {
  display: grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  margin-left: auto;
  padding: 0 7px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #475569;
  font-size: 0.75rem;
  font-weight: 800;
}

.aei-observation--success svg {
  color: #15803d;
}

.aei-observation--warning svg {
  color: #b45309;
}

.aei-observation--danger svg {
  color: #b91c1c;
}

.aei-observation ul {
  display: grid;
  gap: 8px;
  margin: 13px 0 0;
  padding-left: 18px;
  color: #475569;
  font-size: 0.85rem;
  line-height: 1.48;
}

.aei-observation p {
  margin: 13px 0 0;
  color: #94a3b8;
  font-size: 0.84rem;
}

.aei-feedback {
  margin-top: 16px;
  padding: 18px;
  border-color: rgba(241, 139, 75, 0.28);
  background: #fffaf4;
}

.aei-feedback-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.aei-feedback h4 {
  margin-top: 3px;
  font-size: 1rem;
}

.aei-feedback > p {
  margin: 14px 0 0;
  padding: 15px;
  border: 1px solid rgba(241, 139, 75, 0.2);
  border-radius: 13px;
  background: #fff;
  color: #334155;
  font-size: 0.9rem;
  line-height: 1.62;
  white-space: pre-line;
}

.aei-feedback > small {
  display: block;
  margin-top: 9px;
  color: #64748b;
}

.aei-evidence {
  margin-top: 16px;
  padding: 16px 18px;
  background: #fbfcfe;
}

.aei-evidence-list {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.aei-evidence-list span {
  padding: 6px 9px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
}

.aei-spin {
  animation: aei-girar 0.8s linear infinite;
}

@keyframes aei-girar {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1050px) {
  .aei-summary-grid,
  .aei-observations-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .aei-head,
  .aei-feedback-head {
    align-items: stretch;
    flex-direction: column;
  }

  .aei-action {
    width: 100%;
  }

  .aei-content,
  .aei-head {
    padding: 17px;
  }

  .aei-title-wrap {
    gap: 10px;
  }
}
`;
