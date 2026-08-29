import {
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  CircleDashed,
  Eye,
  EyeOff,
  FileText,
  MessageSquareText,
  X,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import type {
  ActividadLibroDocente,
  EstudianteLibro,
} from '../../types/calificaciones/calificaciones.types';

type Props = {
  actividad: ActividadLibroDocente | null;
  estudiantes: EstudianteLibro[];
  cursoId: number;
  onCerrar: () => void;
};

function nombreCompleto(
  estudiante: EstudianteLibro,
) {
  return [
    estudiante.apellidoPaterno,
    estudiante.apellidoMaterno,
    estudiante.nombres,
  ]
    .filter(Boolean)
    .join(' ');
}

function iconoOrigen(
  origen: ActividadLibroDocente['origen'],
) {
  if (origen === 'FORO') {
    return <MessageSquareText size={18} />;
  }

  if (origen === 'QUIZ') {
    return <BrainCircuit size={18} />;
  }

  return <FileText size={18} />;
}

function etiquetaOrigen(
  origen: ActividadLibroDocente['origen'],
) {
  if (origen === 'FORO') return 'Foro';
  if (origen === 'QUIZ') return 'Quiz';
  return 'Tarea';
}

function formatoDecimal(
  valor: number,
) {
  return Number.isFinite(valor)
    ? valor.toFixed(2)
    : '0.00';
}

export default function DetalleActividadCalificacionModal({
  actividad,
  estudiantes,
  cursoId,
  onCerrar,
}: Props) {
  const navigate = useNavigate();

  if (!actividad) {
    return null;
  }

  const rutaActividad = (() => {
    if (
      actividad.origen === 'FORO' &&
      actividad.foroId
    ) {
      return `/docente/cursos/${cursoId}/foro/${actividad.foroId}`;
    }

    if (
      actividad.origen === 'TAREA' &&
      actividad.tareaId
    ) {
      return `/docente/cursos/${cursoId}/tareas/${actividad.tareaId}`;
    }

    if (
      actividad.origen === 'QUIZ' &&
      actividad.quizId
    ) {
      return `/docente/cursos/${cursoId}/quizzes/${actividad.quizId}`;
    }

    return null;
  })();

  function irActividad() {
    if (!rutaActividad) {
      return;
    }

    onCerrar();
    navigate(rutaActividad);
  }

  return (
    <div
      className="detalle-calificacion-modal__overlay"
      role="presentation"
      onMouseDown={onCerrar}
    >
      <section
        className="detalle-calificacion-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de ${actividad.titulo}`}
        onMouseDown={(evento) =>
          evento.stopPropagation()
        }
      >
        <header className="detalle-calificacion-modal__header">
          <div className="detalle-calificacion-modal__titulo-wrap">
            <span className="detalle-calificacion-modal__icono">
              {iconoOrigen(actividad.origen)}
            </span>

            <div>
              <span className="detalle-calificacion-modal__eyebrow">
                {etiquetaOrigen(actividad.origen)} ·{' '}
                {actividad.componente === 'CONTINUA'
                  ? 'Evaluación continua'
                  : 'Evaluación procesual'}
              </span>
              <h2>{actividad.titulo}</h2>
            </div>
          </div>

          <div className="detalle-calificacion-modal__acciones-header">
            <button
              type="button"
              className="detalle-calificacion-modal__ir"
              onClick={irActividad}
              disabled={!rutaActividad}
              title={
                rutaActividad
                  ? 'Abrir la actividad original'
                  : 'Esta actividad no tiene una referencia de origen disponible'
              }
            >
              Ir a la actividad
              <ArrowUpRight size={17} />
            </button>

            <button
              type="button"
              className="detalle-calificacion-modal__cerrar"
              onClick={onCerrar}
              aria-label="Cerrar detalle"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="detalle-calificacion-modal__contenido">
          <div className="detalle-calificacion-modal__descripcion">
            <div>
              <strong>Detalle de la actividad</strong>
              <span>
                Consulta el estado general y el seguimiento individual antes de volver a la actividad.
              </span>
            </div>
            <p>
              {actividad.descripcion?.trim() ||
                'Esta actividad no tiene una descripción registrada.'}
            </p>
          </div>

          <div className="detalle-calificacion-modal__chips">
            <span className={actividad.estado === 'PUBLICADA' ? 'positivo' : ''}>
              {actividad.estado === 'PUBLICADA'
                ? <CheckCircle2 size={15} />
                : <CircleDashed size={15} />}
              {actividad.estado === 'PUBLICADA'
                ? 'Actividad publicada'
                : actividad.estado}
            </span>

            <span>
              {actividad.visibleParaEstudiantes
                ? <Eye size={15} />
                : <EyeOff size={15} />}
              {actividad.visibleParaEstudiantes
                ? 'Visible para estudiantes'
                : 'Aún no visible'}
            </span>

            <span>
              {actividad.participaEnPromedio
                ? 'Participa en el promedio'
                : 'No participa en el promedio'}
            </span>
          </div>

          <div className="detalle-calificacion-modal__resumen">
            <article className="destacado">
              <span>Promedio de la actividad</span>
              <div>
                <strong>{formatoDecimal(actividad.resumen.promedio)}</strong>
                <small>/100</small>
              </div>
              <p>Se conserva la precisión del promedio.</p>
            </article>

            <article>
              <span>Calificadas</span>
              <div>
                <strong>{actividad.resumen.calificadas}</strong>
                <small>/{actividad.resumen.totalEstudiantes}</small>
              </div>
              <p>Estudiantes con nota registrada.</p>
            </article>

            <article>
              <span>Publicadas</span>
              <div>
                <strong>{actividad.resumen.publicadas}</strong>
              </div>
              <p>Notas visibles para estudiantes.</p>
            </article>

            <article className="pendiente">
              <span>Pendientes</span>
              <div>
                <strong>{actividad.resumen.pendientes}</strong>
              </div>
              <p>Estudiantes aún sin nota registrada.</p>
            </article>
          </div>

          <div className="detalle-calificacion-modal__tabla-cabecera">
            <div>
              <strong>Seguimiento por estudiante</strong>
              <span>
                La nota final de cada actividad se muestra con dos decimales para no perder precisión.
              </span>
            </div>
          </div>

          <div className="detalle-calificacion-modal__tabla-wrap">
            <table className="detalle-calificacion-modal__tabla">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Seguimiento</th>
                  <th>Base</th>
                  <th>Descuento</th>
                  <th>Ajuste</th>
                  <th>Nota actividad</th>
                  <th>Retroalimentación</th>
                </tr>
              </thead>

              <tbody>
                {estudiantes.map((estudiante) => {
                  const calificacion =
                    actividad.calificaciones.find(
                      (item) =>
                        item.estudianteId === estudiante.id,
                    ) ?? null;

                  return (
                    <tr key={estudiante.id}>
                      <td>
                        <div className="detalle-calificacion-modal__estudiante">
                          <span>
                            {estudiante.nombres.charAt(0)}
                            {estudiante.apellidoPaterno.charAt(0)}
                          </span>
                          <div>
                            <strong>{nombreCompleto(estudiante)}</strong>
                            <small>{estudiante.correo}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`detalle-calificacion-modal__estado ${
                            calificacion
                              ? calificacion.estado === 'PUBLICADA'
                                ? 'publicada'
                                : 'calificada'
                              : 'pendiente'
                          }`}
                        >
                          {calificacion
                            ? calificacion.estado === 'PUBLICADA'
                              ? 'Publicado'
                              : 'Calificado'
                            : 'Pendiente'}
                        </span>
                      </td>

                      <td>
                        {calificacion
                          ? formatoDecimal(calificacion.notaBase)
                          : '—'}
                      </td>

                      <td>
                        {calificacion
                          ? formatoDecimal(calificacion.descuentoRetraso)
                          : '—'}
                      </td>

                      <td>
                        {calificacion
                          ? formatoDecimal(calificacion.ajusteIndividual)
                          : '—'}
                      </td>

                      <td>
                        {calificacion ? (
                          <strong className="detalle-calificacion-modal__nota">
                            {formatoDecimal(calificacion.notaFinal)}
                            <small>/100</small>
                          </strong>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="detalle-calificacion-modal__retro">
                        {calificacion?.retroalimentacion?.trim() || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .detalle-calificacion-modal__overlay {
    position: fixed;
    inset: 0;
    z-index: 1500;
    display: grid;
    place-items: center;
    padding: 22px;
    background: rgba(15, 23, 42, .52);
    backdrop-filter: blur(5px);
  }

  .detalle-calificacion-modal {
    width: min(1180px, 96vw);
    max-height: 90vh;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 24px;
    background: var(--app-surface);
    box-shadow: 0 28px 80px rgba(15, 23, 42, .28);
  }

  .detalle-calificacion-modal__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    padding: 20px 22px;
    border-bottom: 1px solid var(--app-border);
    background: linear-gradient(135deg, var(--app-surface), var(--app-bg-soft, #f8fafc));
  }

  .detalle-calificacion-modal__titulo-wrap {
    display: flex;
    min-width: 0;
    gap: 12px;
  }

  .detalle-calificacion-modal__icono {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 14px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .detalle-calificacion-modal__eyebrow {
    display: block;
    margin-bottom: 4px;
    font-size: 11px;
    font-weight: 850;
    letter-spacing: .055em;
    text-transform: uppercase;
    color: var(--app-text-muted);
  }

  .detalle-calificacion-modal__header h2 {
    margin: 0;
    font-size: clamp(18px, 2vw, 22px);
    line-height: 1.25;
    color: var(--app-text);
  }

  .detalle-calificacion-modal__acciones-header {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
  }

  .detalle-calificacion-modal__ir,
  .detalle-calificacion-modal__cerrar {
    border: 1px solid var(--app-border);
    background: var(--app-surface);
    color: var(--app-text);
    cursor: pointer;
    transition: .18s ease;
  }

  .detalle-calificacion-modal__ir {
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 0 13px;
    border-color: transparent;
    border-radius: 11px;
    font-size: 12px;
    font-weight: 800;
    background: var(--app-accent-dark);
    color: #fff;
  }

  .detalle-calificacion-modal__ir:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(.98);
  }

  .detalle-calificacion-modal__ir:disabled {
    opacity: .45;
    cursor: not-allowed;
  }

  .detalle-calificacion-modal__cerrar {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 11px;
  }

  .detalle-calificacion-modal__cerrar:hover {
    background: var(--app-bg-soft, #f8fafc);
  }

  .detalle-calificacion-modal__contenido {
    max-height: calc(90vh - 86px);
    overflow: auto;
    padding: 20px 22px 24px;
  }

  .detalle-calificacion-modal__descripcion {
    padding: 15px 16px;
    border: 1px solid var(--app-border);
    border-radius: 15px;
    background: var(--app-bg-soft, #f8fafc);
  }

  .detalle-calificacion-modal__descripcion > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 7px;
  }

  .detalle-calificacion-modal__descripcion strong {
    font-size: 13px;
    color: var(--app-text);
  }

  .detalle-calificacion-modal__descripcion span {
    font-size: 11px;
    color: var(--app-text-muted);
  }

  .detalle-calificacion-modal__descripcion p {
    margin: 0;
    line-height: 1.55;
    font-size: 13px;
    color: var(--app-text-muted);
  }

  .detalle-calificacion-modal__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .detalle-calificacion-modal__chips span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border: 1px solid var(--app-border);
    border-radius: 999px;
    background: var(--app-surface);
    font-size: 11px;
    font-weight: 750;
    color: var(--app-text-muted);
  }

  .detalle-calificacion-modal__chips span.positivo {
    border-color: rgba(34, 197, 94, .22);
    background: rgba(34, 197, 94, .07);
    color: #15803d;
  }

  .detalle-calificacion-modal__resumen {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    margin-top: 14px;
  }

  .detalle-calificacion-modal__resumen article {
    min-height: 104px;
    padding: 14px;
    border: 1px solid var(--app-border);
    border-radius: 15px;
    background: var(--app-surface);
  }

  .detalle-calificacion-modal__resumen article.destacado {
    background: linear-gradient(135deg, var(--app-accent-soft), var(--app-surface));
  }

  .detalle-calificacion-modal__resumen article.pendiente {
    background: linear-gradient(135deg, #fff7ed, var(--app-surface));
  }

  .detalle-calificacion-modal__resumen article > span {
    display: block;
    font-size: 11px;
    font-weight: 800;
    color: var(--app-text-muted);
  }

  .detalle-calificacion-modal__resumen article > div {
    margin-top: 5px;
  }

  .detalle-calificacion-modal__resumen strong {
    font-size: 25px;
    color: var(--app-text);
  }

  .detalle-calificacion-modal__resumen small {
    margin-left: 3px;
    color: var(--app-text-muted);
  }

  .detalle-calificacion-modal__resumen p {
    margin: 4px 0 0;
    font-size: 10px;
    line-height: 1.35;
    color: var(--app-text-muted);
  }

  .detalle-calificacion-modal__tabla-cabecera {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-top: 18px;
    margin-bottom: 8px;
  }

  .detalle-calificacion-modal__tabla-cabecera strong,
  .detalle-calificacion-modal__tabla-cabecera span {
    display: block;
  }

  .detalle-calificacion-modal__tabla-cabecera strong {
    font-size: 13px;
    color: var(--app-text);
  }

  .detalle-calificacion-modal__tabla-cabecera span {
    margin-top: 2px;
    font-size: 11px;
    color: var(--app-text-muted);
  }

  .detalle-calificacion-modal__tabla-wrap {
    overflow: auto;
    border: 1px solid var(--app-border);
    border-radius: 15px;
  }

  .detalle-calificacion-modal__tabla {
    width: 100%;
    min-width: 940px;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 12px;
  }

  .detalle-calificacion-modal__tabla th {
    position: sticky;
    top: 0;
    z-index: 2;
    padding: 11px 12px;
    border-bottom: 1px solid var(--app-border);
    background: var(--app-bg-soft, #f8fafc);
    text-align: left;
    font-size: 10px;
    font-weight: 850;
    letter-spacing: .035em;
    text-transform: uppercase;
    color: var(--app-text-muted);
  }

  .detalle-calificacion-modal__tabla td {
    padding: 11px 12px;
    border-bottom: 1px solid var(--app-border);
    color: var(--app-text);
    vertical-align: middle;
  }

  .detalle-calificacion-modal__tabla tbody tr:last-child td {
    border-bottom: 0;
  }

  .detalle-calificacion-modal__tabla tbody tr:hover td {
    background: rgba(148, 163, 184, .055);
  }

  .detalle-calificacion-modal__estudiante {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 215px;
  }

  .detalle-calificacion-modal__estudiante > span {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 10px;
    background: var(--app-accent-soft);
    color: var(--app-accent-dark);
    font-size: 10px;
    font-weight: 850;
  }

  .detalle-calificacion-modal__estudiante strong,
  .detalle-calificacion-modal__estudiante small {
    display: block;
  }

  .detalle-calificacion-modal__estudiante strong {
    font-size: 12px;
  }

  .detalle-calificacion-modal__estudiante small {
    margin-top: 2px;
    font-size: 10px;
    color: var(--app-text-muted);
  }

  .detalle-calificacion-modal__estado {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 82px;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
  }

  .detalle-calificacion-modal__estado.publicada {
    background: rgba(34, 197, 94, .1);
    color: #15803d;
  }

  .detalle-calificacion-modal__estado.calificada {
    background: rgba(59, 130, 246, .1);
    color: #1d4ed8;
  }

  .detalle-calificacion-modal__estado.pendiente {
    background: rgba(245, 158, 11, .12);
    color: #b45309;
  }

  .detalle-calificacion-modal__nota {
    white-space: nowrap;
    font-size: 14px;
    color: var(--app-text);
  }

  .detalle-calificacion-modal__nota small {
    margin-left: 2px;
    font-size: 9px;
    font-weight: 600;
    color: var(--app-text-muted);
  }

  .detalle-calificacion-modal__retro {
    min-width: 210px;
    max-width: 280px;
    line-height: 1.45;
    color: var(--app-text-muted) !important;
  }

  @media (max-width: 900px) {
    .detalle-calificacion-modal__resumen {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .detalle-calificacion-modal__header {
      align-items: stretch;
    }
  }

  @media (max-width: 640px) {
    .detalle-calificacion-modal__overlay {
      padding: 10px;
    }

    .detalle-calificacion-modal__header {
      flex-direction: column;
    }

    .detalle-calificacion-modal__acciones-header {
      width: 100%;
    }

    .detalle-calificacion-modal__ir {
      flex: 1;
    }

    .detalle-calificacion-modal__descripcion > div {
      display: block;
    }

    .detalle-calificacion-modal__descripcion span {
      margin-top: 3px;
      display: block;
    }

    .detalle-calificacion-modal__resumen {
      grid-template-columns: 1fr;
    }
  }
`;
 