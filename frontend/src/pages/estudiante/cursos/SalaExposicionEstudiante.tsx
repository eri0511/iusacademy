import {
  ArrowLeft,
  Clock3,
  MessageCircleQuestion,
  MonitorPlay,
  Presentation,
  Send,
  ThumbsUp,
  UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import AulaEmptyState from '../../../components/aula/AulaEmptyState';
import AulaSkeleton from '../../../components/aula/AulaSkeleton';
import Toast, { type TipoToast } from '../../../components/shared/Toast';
import VisorPresentacionExposicion from '../../../components/tareas/VisorPresentacionExposicion';
import useSalaExposicionEstudiante from '../../../hooks/tareas/useSalaExposicionEstudiante';
import type {
  PreguntaExposicion,
  TurnoExposicion,
} from '../../../types/tareas/exposiciones.types';

function nombreTurno(turno: TurnoExposicion) {
  const entrega = turno.entrega;

  if (entrega.grupoCurso) return entrega.grupoCurso.nombre;
  if (entrega.equipoAfinidadTarea) return entrega.equipoAfinidadTarea.nombre;

  if (entrega.estudiante) {
    return [
      entrega.estudiante.nombres,
      entrega.estudiante.apellidoPaterno,
      entrega.estudiante.apellidoMaterno,
    ]
      .filter(Boolean)
      .join(' ');
  }

  return `Entrega #${entrega.id}`;
}

function formatoTiempo(segundos: number) {
  const valor = Math.max(0, Math.floor(segundos));
  const minutos = Math.floor(valor / 60);
  const resto = valor % 60;

  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

function nombrePersona(pregunta: PreguntaExposicion) {
  return [pregunta.autor.nombres, pregunta.autor.apellidoPaterno]
    .filter(Boolean)
    .join(' ');
}

export default function SalaExposicionEstudiante() {
  const navigate = useNavigate();
  const params = useParams();
  const { sesion } = useAuth();

  const cursoId = Number(params.cursoId);
  const tareaId = Number(params.tareaId);

  const salaHook = useSalaExposicionEstudiante(cursoId, tareaId);

  const [pregunta, setPregunta] = useState('');
  const [toast, setToast] = useState<{
    visible: boolean;
    tipo: TipoToast;
    titulo: string;
    mensaje?: string;
  }>({
    visible: false,
    tipo: 'informacion',
    titulo: '',
  });

  const sala = salaHook.sala;

  const turnoActivo = useMemo(
    () =>
      sala?.turnos.find((turno) => turno.id === sala.turnoActivoId) ?? null,
    [sala],
  );

  const archivoPresentacion = useMemo(() => {
    if (!turnoActivo) return null;

    return (
      turnoActivo.entrega.archivos.find(
        (archivo) => archivo.extension.toLowerCase() === 'pdf',
      ) ??
      turnoActivo.entrega.archivos[0] ??
      null
    );
  }, [turnoActivo]);

  const preguntas = useMemo(() => {
    if (!turnoActivo) return [];

    return [...turnoActivo.preguntas]
      .filter((item) => item.estado !== 'DESCARTADA')
      .sort(
        (a, b) =>
          b.votos.length - a.votos.length ||
          new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime(),
      );
  }, [turnoActivo]);

  const perteneceAlTurnoActivo = Boolean(
    turnoActivo && sala?.miTurno?.id === turnoActivo.id,
  );

  const esPresentador = Boolean(
    turnoActivo &&
      sesion?.usuario.id &&
      turnoActivo.presentadorId === sesion.usuario.id,
  );

  const tomarControl = async () => {
    if (!sala || !turnoActivo || !perteneceAlTurnoActivo) return;

    try {
      await salaHook.presentar(sala.id, turnoActivo.id);
      setToast({
        visible: true,
        tipo: 'exito',
        titulo: 'Modo presentación activado',
        mensaje:
          'Ahora controlas las diapositivas que ve toda la sala de exposición.',
      });
    } catch (causa) {
      setToast({
        visible: true,
        tipo: 'error',
        titulo: 'No se pudo iniciar la presentación',
        mensaje:
          causa instanceof Error ? causa.message : 'Inténtalo nuevamente.',
      });
    }
  };

  const cambiarDiapositiva = async (diapositiva: number) => {
    if (!sala || !turnoActivo || !esPresentador) return;

    try {
      await salaHook.cambiarDiapositiva(
        sala.id,
        turnoActivo.id,
        Math.max(1, diapositiva),
      );
    } catch (causa) {
      setToast({
        visible: true,
        tipo: 'error',
        titulo: 'No se pudo cambiar la diapositiva',
        mensaje:
          causa instanceof Error ? causa.message : 'Inténtalo nuevamente.',
      });
    }
  };

  const enviarPregunta = async () => {
    if (!turnoActivo || pregunta.trim().length < 3) return;

    try {
      await salaHook.preguntar(turnoActivo.id, pregunta.trim());
      setPregunta('');
      setToast({
        visible: true,
        tipo: 'exito',
        titulo: 'Pregunta enviada',
        mensaje: `Quedó vinculada a la diapositiva ${turnoActivo.diapositivaActual}.`,
      });
    } catch (causa) {
      setToast({
        visible: true,
        tipo: 'error',
        titulo: 'No se pudo enviar la pregunta',
        mensaje:
          causa instanceof Error ? causa.message : 'Inténtalo nuevamente.',
      });
    }
  };

  if (salaHook.cargando) return <AulaSkeleton />;

  if (!sala) {
    return (
      <AulaEmptyState
        titulo="La sala todavía no está disponible"
        descripcion={
          salaHook.error ??
          'El docente aún no organizó la jornada de exposiciones.'
        }
        icono={Presentation}
      />
    );
  }

  return (
    <div className="see-page">
      <header className="see-header">
        <button
          type="button"
          className="see-back"
          onClick={() =>
            navigate(`/estudiante/cursos/${cursoId}/tareas/${tareaId}`)
          }
          aria-label="Volver a la tarea"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="see-header__icon">
          <Presentation size={22} />
        </div>

        <div className="see-heading">
          <span>Sala de exposición</span>
          <h1>{sala.tarea.titulo}</h1>
          <p>
            Sigue la presentación sincronizada y participa con preguntas
            vinculadas a cada diapositiva.
          </p>
        </div>

        <span className="see-status">{sala.estado.replaceAll('_', ' ')}</span>
      </header>

      {turnoActivo ? (
        <>
          <section className="see-livebar">
            <div>
              <UsersRound size={17} />
              <span>Exponiendo</span>
              <strong>{nombreTurno(turnoActivo)}</strong>
            </div>

            <div>
              <Clock3 size={17} />
              <span>
                {sala.cronometro?.enPausa ? 'Pausado' : 'Tiempo restante'}
              </span>
              <strong>
                {sala.cronometro?.tiempoCumplido
                  ? `+${formatoTiempo(
                      sala.cronometro.tiempoExtraSegundos,
                    )}`
                  : formatoTiempo(
                      sala.cronometro?.segundosRestantes ?? 0,
                    )}
              </strong>
            </div>

            {sala.miTurno && (
              <div className="see-myturn">
                <span>Tu turno</span>
                <strong>#{sala.miTurno.orden}</strong>
                <small>{sala.miTurno.estado.replaceAll('_', ' ')}</small>
              </div>
            )}
          </section>

          {perteneceAlTurnoActivo && (
            <section className="see-presenter-card">
              <div className="see-presenter-card__icon">
                <MonitorPlay size={22} />
              </div>

              <div className="see-presenter-card__content">
                <span>Control de presentación</span>
                <strong>
                  {esPresentador
                    ? 'Estás presentando para toda la sala'
                    : turnoActivo.presentador
                      ? `${turnoActivo.presentador.nombres} controla actualmente la presentación`
                      : 'Tu grupo puede iniciar la presentación'}
                </strong>
                <small>
                  Al cambiar de diapositiva, el docente y todos tus compañeros
                  verán automáticamente la misma diapositiva.
                </small>
              </div>

              {!esPresentador && (
                <button
                  type="button"
                  className="see-present-button"
                  disabled={salaHook.procesando}
                  onClick={() => void tomarControl()}
                >
                  <MonitorPlay size={17} />
                  {turnoActivo.presentador ? 'Tomar control' : 'Presentar'}
                </button>
              )}

              {esPresentador && (
                <span className="see-live-chip">
                  <i /> En vivo
                </span>
              )}
            </section>
          )}

          <div className="see-grid">
            <main className="see-presentation">
              <div className="see-section-head">
                <div>
                  <Presentation size={18} />
                  <h2>Presentación en vivo</h2>
                </div>
                <span>Diapositiva {turnoActivo.diapositivaActual}</span>
              </div>

              <div className="see-presentation-body">
                <VisorPresentacionExposicion
                  archivo={archivoPresentacion}
                  diapositiva={turnoActivo.diapositivaActual}
                  puedeControlar={esPresentador}
                  onCambiarDiapositiva={(diapositiva) =>
                    cambiarDiapositiva(diapositiva)
                  }
                />
              </div>
            </main>

            <aside className="see-questions">
              <div className="see-section-head">
                <div>
                  <MessageCircleQuestion size={18} />
                  <h2>Preguntas del aula</h2>
                </div>
                <span>{preguntas.length}</span>
              </div>

              <div className="see-question-form">
                <label htmlFor="pregunta-exposicion">
                  Preguntar sobre la diapositiva{' '}
                  {turnoActivo.diapositivaActual}
                </label>

                <textarea
                  id="pregunta-exposicion"
                  value={pregunta}
                  maxLength={1000}
                  placeholder="Escribe una pregunta clara para el grupo expositor..."
                  onChange={(evento) => setPregunta(evento.target.value)}
                />

                <button
                  type="button"
                  disabled={
                    salaHook.procesando || pregunta.trim().length < 3
                  }
                  onClick={() => void enviarPregunta()}
                >
                  <Send size={16} /> Enviar pregunta
                </button>
              </div>

              <div className="see-question-list">
                {preguntas.length === 0 ? (
                  <p className="see-muted">
                    Todavía no hay preguntas. Puedes ser la primera persona en
                    participar.
                  </p>
                ) : (
                  preguntas.map((item) => {
                    const votada = item.votos.some(
                      (voto) => voto.usuarioId === sesion?.usuario.id,
                    );

                    return (
                      <article key={item.id}>
                        <div className="see-question-meta">
                          <strong>{nombrePersona(item)}</strong>
                          <span>
                            Diapositiva {item.diapositiva ?? '—'}
                          </span>
                        </div>

                        <p>{item.contenido}</p>

                        <div className="see-question-foot">
                          <small>
                            {item.segundosExposicion === null
                              ? 'Durante la exposición'
                              : formatoTiempo(item.segundosExposicion)}
                          </small>

                          <button
                            type="button"
                            className={votada ? 'active' : ''}
                            disabled={salaHook.procesando}
                            onClick={() =>
                              void (votada
                                ? salaHook.quitarVoto(item.id)
                                : salaHook.votar(item.id))
                            }
                          >
                            <ThumbsUp size={14} /> {item.votos.length}
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </aside>
          </div>
        </>
      ) : (
        <section className="see-waiting">
          <Presentation size={34} />
          <h2>
            {sala.estado === 'FINALIZADA'
              ? 'Jornada finalizada'
              : 'Esperando el siguiente turno'}
          </h2>
          <p>
            La presentación aparecerá automáticamente cuando el docente inicie
            una exposición.
          </p>
          {sala.miTurno && <span>Tu turno es el #{sala.miTurno.orden}</span>}
        </section>
      )}

      <Toast
        visible={toast.visible}
        tipo={toast.tipo}
        titulo={toast.titulo}
        mensaje={toast.mensaje}
        onCerrar={() =>
          setToast((actual) => ({ ...actual, visible: false }))
        }
      />

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.see-page{
  width:100%;
  display:grid;
  gap:18px;
  color:var(--app-text);
}

.see-page button,
.see-page textarea{
  font-family:inherit;
}

.see-header{
  display:flex;
  align-items:center;
  gap:14px;
  padding:20px 22px;
  border:1px solid var(--app-border);
  border-radius:22px;
  background:var(--app-surface);
  box-shadow:var(--app-shadow-sm,0 8px 22px rgba(15,23,42,.05));
}

.see-back{
  width:42px;
  height:42px;
  display:grid;
  place-items:center;
  flex:0 0 auto;
  border:1px solid var(--app-border);
  border-radius:14px;
  background:#fff;
  color:var(--app-text-secondary);
  cursor:pointer;
}

.see-back:hover{
  border-color:var(--app-accent);
  color:var(--app-accent-dark);
  background:var(--app-accent-soft);
}

.see-header__icon{
  width:46px;
  height:46px;
  display:grid;
  place-items:center;
  flex:0 0 auto;
  border:1px solid rgba(241,139,75,.28);
  border-radius:15px;
  color:var(--app-accent-dark);
  background:var(--app-accent-soft);
}

.see-heading{
  min-width:0;
  flex:1;
}

.see-heading>span{
  font-size:10px;
  font-weight:900;
  letter-spacing:.12em;
  text-transform:uppercase;
  color:var(--app-accent-dark);
}

.see-heading h1{
  margin:2px 0 4px;
  font-size:23px;
  line-height:1.15;
}

.see-heading p{
  margin:0;
  color:var(--app-text-secondary);
  font-size:13px;
}

.see-status{
  padding:8px 12px;
  border:1px solid rgba(241,139,75,.32);
  border-radius:999px;
  background:var(--app-accent-soft);
  color:var(--app-accent-dark);
  font-size:10px;
  font-weight:900;
  text-transform:uppercase;
}

.see-livebar{
  display:flex;
  align-items:stretch;
  gap:10px;
  flex-wrap:wrap;
  padding:10px;
  border:1px solid var(--app-border);
  border-radius:20px;
  background:var(--app-surface);
}

.see-livebar>div{
  min-height:58px;
  display:grid;
  grid-template-columns:auto auto 1fr;
  grid-template-rows:auto auto;
  column-gap:8px;
  align-items:center;
  flex:1 1 230px;
  padding:10px 13px;
  border:1px solid var(--app-border-soft);
  border-radius:14px;
  background:var(--app-surface-alt);
}

.see-livebar svg{
  grid-row:1/3;
  color:var(--app-accent-dark);
}

.see-livebar span,
.see-livebar small{
  color:var(--app-text-secondary);
  font-size:10px;
}

.see-livebar strong{
  font-size:13px;
}

.see-myturn{
  border-color:rgba(241,139,75,.28)!important;
  background:var(--app-accent-soft)!important;
}

.see-presenter-card{
  display:flex;
  align-items:center;
  gap:14px;
  padding:16px 18px;
  border:1px solid rgba(241,139,75,.34);
  border-radius:20px;
  background:linear-gradient(135deg,var(--app-accent-soft),#fff);
  box-shadow:var(--app-shadow-sm,0 8px 22px rgba(15,23,42,.04));
}

.see-presenter-card__icon{
  width:46px;
  height:46px;
  display:grid;
  place-items:center;
  flex:0 0 auto;
  border-radius:14px;
  background:#fff;
  color:var(--app-accent-dark);
  box-shadow:0 5px 18px rgba(241,139,75,.12);
}

.see-presenter-card__content{
  min-width:0;
  display:grid;
  gap:3px;
  flex:1;
}

.see-presenter-card__content>span{
  color:var(--app-accent-dark);
  font-size:10px;
  font-weight:900;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.see-presenter-card__content strong{
  font-size:14px;
}

.see-presenter-card__content small{
  color:var(--app-text-secondary);
  font-size:11px;
  line-height:1.45;
}

.see-present-button{
  min-height:42px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  padding:10px 15px;
  border:1px solid var(--app-accent);
  border-radius:13px;
  background:var(--app-accent);
  color:#fff;
  font-weight:900;
  cursor:pointer;
}

.see-present-button:hover:not(:disabled){
  border-color:var(--app-accent-hover);
  background:var(--app-accent-hover);
}

.see-present-button:disabled{
  opacity:.55;
  cursor:not-allowed;
}

.see-live-chip{
  display:inline-flex;
  align-items:center;
  gap:7px;
  padding:8px 11px;
  border:1px solid #bbf7d0;
  border-radius:999px;
  background:#f0fdf4;
  color:#166534;
  font-size:10px;
  font-weight:900;
  text-transform:uppercase;
}

.see-live-chip i{
  width:8px;
  height:8px;
  border-radius:50%;
  background:#22c55e;
  box-shadow:0 0 0 5px rgba(34,197,94,.12);
}

.see-grid{
  display:grid;
  grid-template-columns:minmax(0,1fr) 360px;
  gap:18px;
  align-items:start;
}

.see-presentation,
.see-questions,
.see-waiting{
  overflow:hidden;
  border:1px solid var(--app-border);
  border-radius:22px;
  background:var(--app-surface);
  box-shadow:var(--app-shadow-sm,0 8px 22px rgba(15,23,42,.04));
}

.see-section-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  padding:15px 17px;
  border-bottom:1px solid var(--app-border-soft);
  background:linear-gradient(180deg,#fff,var(--app-surface-alt));
}

.see-section-head>div{
  display:flex;
  align-items:center;
  gap:8px;
}

.see-section-head svg{
  color:var(--app-accent-dark);
}

.see-section-head h2{
  margin:0;
  font-size:14px;
}

.see-section-head>span{
  padding:5px 8px;
  border-radius:999px;
  background:var(--app-accent-soft);
  color:var(--app-accent-dark);
  font-size:10px;
  font-weight:900;
}

.see-presentation-body{
  padding:14px;
}

.see-question-form{
  display:grid;
  gap:9px;
  padding:14px;
  border-bottom:1px solid var(--app-border-soft);
  background:var(--app-surface-alt);
}

.see-question-form label{
  font-size:11px;
  font-weight:900;
}

.see-question-form textarea{
  min-height:92px;
  resize:vertical;
  padding:11px 12px;
  border:1px solid var(--app-border);
  border-radius:12px;
  outline:0;
  background:#fff;
  color:var(--app-text);
}

.see-question-form textarea:focus{
  border-color:var(--app-accent);
  box-shadow:0 0 0 3px var(--app-accent-softer,rgba(241,139,75,.1));
}

.see-question-form button{
  min-height:40px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  border:1px solid var(--app-accent);
  border-radius:11px;
  background:var(--app-accent);
  color:#fff;
  font-weight:900;
  cursor:pointer;
}

.see-question-form button:disabled{
  opacity:.5;
  cursor:not-allowed;
}

.see-question-list{
  max-height:680px;
  overflow:auto;
  padding:10px;
}

.see-question-list article{
  display:grid;
  gap:8px;
  padding:12px;
  margin-bottom:8px;
  border:1px solid var(--app-border-soft);
  border-radius:14px;
  background:#fff;
}

.see-question-list article:last-child{
  margin-bottom:0;
}

.see-question-meta,
.see-question-foot{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
}

.see-question-meta strong{
  font-size:11px;
}

.see-question-meta span{
  padding:4px 7px;
  border-radius:999px;
  background:var(--app-accent-soft);
  color:var(--app-accent-dark);
  font-size:9px;
  font-weight:900;
}

.see-question-list p{
  margin:0;
  font-size:12px;
  line-height:1.5;
}

.see-question-foot small{
  color:var(--app-text-secondary);
  font-size:9px;
}

.see-question-foot button{
  display:inline-flex;
  align-items:center;
  gap:5px;
  padding:6px 8px;
  border:1px solid var(--app-border);
  border-radius:9px;
  background:#fff;
  color:var(--app-text-secondary);
  cursor:pointer;
}

.see-question-foot button.active{
  border-color:rgba(241,139,75,.35);
  background:var(--app-accent-soft);
  color:var(--app-accent-dark);
}

.see-muted{
  margin:0;
  padding:30px 18px;
  color:var(--app-text-secondary);
  text-align:center;
  font-size:12px;
}

.see-waiting{
  display:grid;
  place-items:center;
  gap:8px;
  padding:58px 24px;
  text-align:center;
}

.see-waiting svg{
  color:var(--app-accent-dark);
}

.see-waiting h2{
  margin:4px 0 0;
}

.see-waiting p{
  margin:0;
  color:var(--app-text-secondary);
}

.see-waiting span{
  margin-top:8px;
  padding:7px 10px;
  border-radius:999px;
  background:var(--app-accent-soft);
  color:var(--app-accent-dark);
  font-size:10px;
  font-weight:900;
}

@media(max-width:1050px){
  .see-grid{
    grid-template-columns:1fr;
  }
}

@media(max-width:700px){
  .see-header{
    align-items:flex-start;
    padding:16px;
  }

  .see-status{
    display:none;
  }

  .see-presenter-card{
    align-items:flex-start;
    flex-wrap:wrap;
  }

  .see-present-button,
  .see-live-chip{
    margin-left:60px;
  }
}
`;
