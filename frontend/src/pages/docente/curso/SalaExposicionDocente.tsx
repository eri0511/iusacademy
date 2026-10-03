import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Clock3,
  Check,
  History,
  ListOrdered,
  MessageCircleQuestion,
  Pause,
  Play,
  Presentation,
  RefreshCw,
  Save,
  ClipboardCheck,
  Shuffle,
  Square,
  Star,
  UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import AulaEmptyState from '../../../components/aula/AulaEmptyState';
import AulaModal from '../../../components/aula/AulaModal';
import AulaSkeleton from '../../../components/aula/AulaSkeleton';
import Toast, { type TipoToast } from '../../../components/shared/Toast';
import VisorPresentacionExposicion from '../../../components/tareas/VisorPresentacionExposicion';
import MatrizRubricaEvaluacion from '../../../components/tareas/docente/MatrizRubricaEvaluacion';
import AnalisisExposicionIusAcademy from '../../../components/tareas/docente/AnalisisExposicionIusAcademy';
import useSalaExposicionDocente from '../../../hooks/tareas/useSalaExposicionDocente';
import { calificarEntregaConRubrica } from '../../../services/tareas/tareas-rubricas.service';
import type { RubricaItemCalificacion } from '../../../types/tareas/rubricas.types';
import type {
  AnalisisExposicion,
  ConfigurarJornadaExposicionDatos,
  MetodoOrdenExposicion,
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
    ].filter(Boolean).join(' ');
  }
  return `Entrega #${entrega.id}`;
}

function formatoTiempo(segundos: number) {
  const valor = Math.max(0, Math.floor(segundos));
  const minutos = Math.floor(valor / 60);
  const resto = valor % 60;
  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

function nombrePregunta(autor: { nombres: string; apellidoPaterno: string }) {
  return [autor.nombres, autor.apellidoPaterno].filter(Boolean).join(' ');
}

function etiquetaEstado(estado: string) {
  return estado.replaceAll('_', ' ').toLowerCase().replace(/^./, (l) => l.toUpperCase());
}

type SalaExposicionDocenteProps = {
  cursoId?: number;
  tareaId?: number;
  integrado?: boolean;
  tareaEstado?: string;
};

type ResumenTurnoFinalizado = {
  turnoId: number;
  nombre: string;
  orden: number;
  segundosUtilizados: number;
  preguntas: number;
  nota: number | null;
  siguienteTurnoId: number | null;
  siguienteNombre: string | null;
};

export default function SalaExposicionDocente({
  cursoId: cursoIdProp,
  tareaId: tareaIdProp,
  integrado = false,
  tareaEstado,
}: SalaExposicionDocenteProps = {}) {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const params = useParams();
  const cursoId = cursoIdProp ?? Number(params.cursoId);
  const tareaId = tareaIdProp ?? Number(params.tareaId);
  const salaHook = useSalaExposicionDocente(cursoId, tareaId);

  const [modalConfig, setModalConfig] = useState(false);
  const [metodoOrden, setMetodoOrden] = useState<MetodoOrdenExposicion>('ORDEN_ENTREGA');
  const [duracionMinutos, setDuracionMinutos] = useState(10);
  const [avisoMinutos, setAvisoMinutos] = useState(2);
  const [permitirTiempoExtra, setPermitirTiempoExtra] = useState(true);
  const [mostrarSiguiente, setMostrarSiguiente] = useState(true);
  const [reloj, setReloj] = useState(Date.now());
  const [toast, setToast] = useState<{
    visible: boolean;
    tipo: TipoToast;
    titulo: string;
    mensaje?: string;
  }>({ visible: false, tipo: 'informacion', titulo: '' });

  const [itemsRubrica, setItemsRubrica] = useState<RubricaItemCalificacion[]>([]);
  const [notaRubrica, setNotaRubrica] = useState<number | null>(null);
  const [guardandoRubrica, setGuardandoRubrica] = useState(false);
  const [resumenTurno, setResumenTurno] = useState<ResumenTurnoFinalizado | null>(null);
  const [cerrandoTurno, setCerrandoTurno] = useState(false);
  const [turnoHistorialId, setTurnoHistorialId] = useState<number | null>(null);
  const [analisisExposicion, setAnalisisExposicion] = useState<AnalisisExposicion | null>(null);
  const [cargandoAnalisis, setCargandoAnalisis] = useState(false);
  const [generandoAnalisis, setGenerandoAnalisis] = useState(false);

  useEffect(() => {
    if (!integrado) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [integrado]);

  useEffect(() => {
    const intervalo = window.setInterval(() => setReloj(Date.now()), 250);
    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (
      !integrado &&
      !salaHook.cargando &&
      !salaHook.sala &&
      (!tareaEstado || tareaEstado === 'CERRADA')
    ) {
      setModalConfig(true);
    }
  }, [integrado, salaHook.cargando, salaHook.sala, tareaEstado]);

  const sala = salaHook.sala;
  const turnoActivo = useMemo(
    () => sala?.turnos.find((turno) => turno.id === sala.turnoActivoId) ?? null,
    [sala],
  );

  const siguiente = useMemo(() => {
    if (!sala) return null;
    const activos = sala.turnos.filter((turno) => ['PENDIENTE', 'EN_ESPERA'].includes(turno.estado));
    if (!turnoActivo) return activos.sort((a, b) => a.orden - b.orden)[0] ?? null;
    return activos.filter((turno) => turno.orden > turnoActivo.orden).sort((a, b) => a.orden - b.orden)[0] ?? null;
  }, [sala, turnoActivo]);

  const turnoReferencia = useMemo(() => {
    if (turnoActivo) {
      return turnoActivo;
    }

    if (!sala) {
      return null;
    }

    if (turnoHistorialId !== null) {
      const seleccionado = sala.turnos.find(
        (turno) =>
          turno.id === turnoHistorialId &&
          turno.estado === 'FINALIZADO',
      );

      if (seleccionado) {
        return seleccionado;
      }
    }

    return (
      [...sala.turnos]
        .filter((turno) => turno.estado === 'FINALIZADO')
        .sort((a, b) => b.orden - a.orden)[0] ?? null
    );
  }, [sala, turnoActivo, turnoHistorialId]);

  useEffect(() => {
    let activo = true;

    if (!turnoReferencia || turnoReferencia.estado !== 'FINALIZADO' || !sala) {
      setAnalisisExposicion(null);
      setCargandoAnalisis(false);
      return () => {
        activo = false;
      };
    }

    setCargandoAnalisis(true);
    setAnalisisExposicion(null);

    void salaHook
      .obtenerAnalisis(sala.id, turnoReferencia.id)
      .then((resultado) => {
        if (activo) {
          setAnalisisExposicion(resultado);
        }
      })
      .catch(() => {
        if (activo) {
          setAnalisisExposicion(null);
        }
      })
      .finally(() => {
        if (activo) {
          setCargandoAnalisis(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [sala?.id, turnoReferencia?.id, turnoReferencia?.estado]);

  const notaTurno = (turno: TurnoExposicion): number | null => {
    const evaluacion = turno.entrega.calificacionRubrica;

    if (!evaluacion?.completada || evaluacion.items.length === 0) {
      return null;
    }

    const total = evaluacion.items.reduce(
      (acumulado, item) => acumulado + Number(item.puntosAsignados),
      0,
    );

    return Math.round(total * 100) / 100;
  };

  useEffect(() => {
    setItemsRubrica([]);
    setNotaRubrica(null);
  }, [turnoReferencia?.entregaId]);

  const archivoPresentacion = useMemo(() => {
    if (!turnoReferencia) return null;
    return turnoReferencia.entrega.archivos.find((archivo) => archivo.extension.toLowerCase() === 'pdf')
      ?? turnoReferencia.entrega.archivos[0]
      ?? null;
  }, [turnoReferencia]);

  const preguntasTurno = useMemo(() => {
    if (!turnoReferencia) return [];
    return [...turnoReferencia.preguntas].sort((a, b) => {
      if (a.destacada !== b.destacada) return a.destacada ? -1 : 1;
      if (a.estado === 'SELECCIONADA' && b.estado !== 'SELECCIONADA') return -1;
      if (b.estado === 'SELECCIONADA' && a.estado !== 'SELECCIONADA') return 1;
      return b.votos.length - a.votos.length || new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime();
    });
  }, [turnoReferencia]);

  const tiempo = useMemo(() => {
    if (!sala?.cronometro) return null;
    const base = sala.cronometro;
    if (base.enPausa) return base;
    const servidor = new Date(base.ahoraServidor).getTime();
    const transcurrido = Math.max(0, Math.floor((reloj - servidor) / 1000));
    const usados = base.segundosUtilizados + transcurrido;
    const restantes = Math.max(0, base.segundosAsignados - usados);
    const extra = Math.max(0, usados - base.segundosAsignados);
    return {
      ...base,
      segundosUtilizados: usados,
      segundosRestantes: restantes,
      tiempoExtraSegundos: extra,
      tiempoCumplido: usados >= base.segundosAsignados,
    };
  }, [reloj, sala?.cronometro]);

  const ejecutar = async (accion: () => Promise<unknown>, titulo: string) => {
    try {
      await accion();
      setToast({ visible: true, tipo: 'exito', titulo });
    } catch (causa) {
      setToast({
        visible: true,
        tipo: 'error',
        titulo: 'No se pudo completar la acción',
        mensaje: causa instanceof Error ? causa.message : 'Inténtalo nuevamente.',
      });
    }
  };

  const generarAnalisisTurno = async () => {
    if (!sala || !turnoReferencia || turnoReferencia.estado !== 'FINALIZADO') {
      return;
    }

    try {
      setGenerandoAnalisis(true);
      const resultado = await salaHook.generarAnalisis(
        sala.id,
        turnoReferencia.id,
      );
      setAnalisisExposicion(resultado);
      setToast({
        visible: true,
        tipo: 'exito',
        titulo: 'Análisis IusAcademy generado',
        mensaje: 'Las observaciones están listas para revisión docente.',
      });
    } catch (causa) {
      setToast({
        visible: true,
        tipo: 'error',
        titulo: 'No se pudo generar el análisis',
        mensaje:
          causa instanceof Error
            ? causa.message
            : 'Inténtalo nuevamente.',
      });
    } finally {
      setGenerandoAnalisis(false);
    }
  };

  const copiarRetroalimentacionAnalisis = async () => {
    const texto = analisisExposicion?.retroalimentacionSugerida?.trim();

    if (!texto) {
      return;
    }

    try {
      await navigator.clipboard.writeText(texto);
      setToast({
        visible: true,
        tipo: 'exito',
        titulo: 'Retroalimentación copiada',
        mensaje: 'Puedes editarla y usarla en la retroalimentación oficial de la evaluación.',
      });
    } catch {
      setToast({
        visible: true,
        tipo: 'error',
        titulo: 'No se pudo copiar',
        mensaje: 'Selecciona el texto manualmente e inténtalo nuevamente.',
      });
    }
  };

  const crearJornada = async () => {
    const datos: ConfigurarJornadaExposicionDatos = {
      metodoOrden,
      duracionSegundos: Math.max(60, Math.round(duracionMinutos * 60)),
      avisoSegundos: Math.max(0, Math.round(avisoMinutos * 60)),
      permitirTiempoExtra,
      mostrarSiguiente,
    };
    await ejecutar(async () => {
      await salaHook.configurar(datos);
      setModalConfig(false);
    }, 'Jornada de exposiciones organizada');
  };

  const moverTurno = async (indice: number, direccion: -1 | 1) => {
    if (!sala || sala.estado !== 'LISTA') return;
    const destino = indice + direccion;
    if (destino < 0 || destino >= sala.turnos.length) return;
    const turnos = [...sala.turnos];
    [turnos[indice], turnos[destino]] = [turnos[destino], turnos[indice]];
    await ejecutar(
      () => salaHook.reordenar(sala.id, turnos.map((turno) => turno.entregaId)),
      'Orden actualizado',
    );
  };

  const guardarRubrica = async () => {
    if (!turnoReferencia || notaRubrica === null || itemsRubrica.length === 0) {
      setToast({
        visible: true,
        tipo: 'advertencia',
        titulo: 'Completa la rúbrica',
        mensaje: 'Selecciona un nivel para todos los criterios antes de guardar la evaluación.',
      });
      return false;
    }

    try {
      setGuardandoRubrica(true);

      await calificarEntregaConRubrica(
        cursoId,
        tareaId,
        turnoReferencia.entregaId,
        {
          items: itemsRubrica,
        },
        accessToken ?? '',
      );

      setToast({
        visible: true,
        tipo: 'exito',
        titulo: 'Evaluación guardada',
        mensaje: `La rúbrica de ${nombreTurno(turnoReferencia)} se guardó con ${notaRubrica.toFixed(2)}/100.`,
      });

      return true;
    } catch (causa) {
      setToast({
        visible: true,
        tipo: 'error',
        titulo: 'No se pudo guardar la evaluación',
        mensaje: causa instanceof Error ? causa.message : 'Inténtalo nuevamente.',
      });

      return false;
    } finally {
      setGuardandoRubrica(false);
    }
  };

  const finalizarExposicionActual = async () => {
    if (!sala || !turnoActivo || cerrandoTurno) {
      return;
    }

    if (sala.tarea.esCalificable) {
      if (notaRubrica === null || itemsRubrica.length === 0) {
        setToast({
          visible: true,
          tipo: 'advertencia',
          titulo: 'Completa la rúbrica antes de finalizar',
          mensaje: 'Debes evaluar todos los criterios de la exposición antes de cerrar este turno.',
        });
        return;
      }
    }

    try {
      setCerrandoTurno(true);

      if (sala.tarea.esCalificable) {
        await calificarEntregaConRubrica(
          cursoId,
          tareaId,
          turnoActivo.entregaId,
          {
            items: itemsRubrica,
          },
          accessToken ?? '',
        );
      }

      const resultado = await salaHook.finalizarTurno(
        sala.id,
        turnoActivo.id,
      );

      const turnoFinalizado = resultado.turnos.find(
        (turno) => turno.id === turnoActivo.id,
      );

      const proximoTurno = resultado.turnos
        .filter((turno) =>
          turno.estado === 'PENDIENTE' ||
          turno.estado === 'EN_ESPERA',
        )
        .sort((a, b) => a.orden - b.orden)[0] ?? null;

      setResumenTurno({
        turnoId: turnoActivo.id,
        nombre: nombreTurno(turnoActivo),
        orden: turnoActivo.orden,
        segundosUtilizados:
          turnoFinalizado?.segundosUtilizados ??
          tiempo?.segundosUtilizados ??
          0,
        preguntas: turnoActivo.preguntas.length,
        nota: sala.tarea.esCalificable ? notaRubrica : null,
        siguienteTurnoId: proximoTurno?.id ?? null,
        siguienteNombre: proximoTurno ? nombreTurno(proximoTurno) : null,
      });

      setToast({
        visible: true,
        tipo: 'exito',
        titulo: 'Exposición finalizada',
        mensaje: proximoTurno
          ? `El turno terminó correctamente. ${nombreTurno(proximoTurno)} está listo para continuar.`
          : 'El último turno terminó correctamente. Ya puedes finalizar la jornada.',
      });
    } catch (causa) {
      setToast({
        visible: true,
        tipo: 'error',
        titulo: 'No se pudo finalizar la exposición',
        mensaje: causa instanceof Error ? causa.message : 'Inténtalo nuevamente.',
      });
    } finally {
      setCerrandoTurno(false);
    }
  };

  const continuarDesdeResumen = async () => {
    if (!sala || !resumenTurno || salaHook.procesando) {
      return;
    }

    try {
      if (resumenTurno.siguienteTurnoId) {
        await salaHook.iniciarTurno(
          sala.id,
          resumenTurno.siguienteTurnoId,
        );

        setResumenTurno(null);
        setToast({
          visible: true,
          tipo: 'exito',
          titulo: 'Siguiente exposición iniciada',
          mensaje: resumenTurno.siguienteNombre
            ? `${resumenTurno.siguienteNombre} ya puede comenzar su presentación.`
            : undefined,
        });
        return;
      }

      await salaHook.finalizarJornada(sala.id);
      setResumenTurno(null);
      setToast({
        visible: true,
        tipo: 'exito',
        titulo: 'Jornada finalizada',
        mensaje: 'Todas las exposiciones programadas fueron completadas.',
      });
    } catch (causa) {
      setToast({
        visible: true,
        tipo: 'error',
        titulo: 'No se pudo continuar',
        mensaje: causa instanceof Error ? causa.message : 'Inténtalo nuevamente.',
      });
    }
  };


  if (salaHook.cargando) {
    return <AulaSkeleton />;
  }

  return (
    <div className="sed-page">
      {!integrado ? (
        <header className="sed-header">
          <button
            type="button"
            className="sed-back"
            onClick={() => navigate(`/docente/cursos/${cursoId}/tareas/${tareaId}`)}
            aria-label="Volver al detalle de la tarea"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="sed-header__icon">
            <Presentation size={22} />
          </div>

          <div className="sed-heading">
            <span className="sed-kicker">Sala de exposición</span>
            <h1>{sala?.tarea.titulo ?? 'Organizar exposiciones'}</h1>
            <p>Gestiona la jornada, los turnos, la presentación y las preguntas desde una sola vista.</p>
          </div>

          {sala && (
            <span className={`sed-status sed-status--${sala.estado.toLowerCase()}`}>
              {etiquetaEstado(sala.estado)}
            </span>
          )}
        </header>
      ) : (
        <header className="sed-subview-title-card">
          <div className="sed-title-identity">
            <span className="sed-title-icon">
              <Presentation size={20} />
            </span>

            <div>
              <span className="sed-kicker">Jornada académica</span>
              <h3>Sala de exposición</h3>
              <p>Controla turnos, tiempo, presentación en vivo y preguntas sin salir del detalle de la tarea.</p>
            </div>
          </div>

          <div className="sed-subview-actions">
            {sala && (
              <span className={`sed-status sed-status--${sala.estado.toLowerCase()}`}>
                {etiquetaEstado(sala.estado)}
              </span>
            )}

            <button
              type="button"
              disabled={salaHook.procesando}
              onClick={() => void salaHook.cargar()}
            >
              <RefreshCw size={14} />
              Actualizar
            </button>
          </div>
        </header>
      )}

      {salaHook.error && !sala && (
        <AulaEmptyState
          titulo="No se pudo abrir la sala"
          descripcion={salaHook.error}
          icono={Presentation}
        />
      )}

      {!sala ? (
        <section className="sed-empty">
          <div className="sed-empty__icon">
            <Presentation size={32} />
          </div>

          <h2>
            {tareaEstado && tareaEstado !== 'CERRADA'
              ? 'La jornada todavía no puede organizarse'
              : 'Aún no existe una jornada'}
          </h2>

          <p>
            {tareaEstado && tareaEstado !== 'CERRADA'
              ? 'Cierra las entregas de la tarea y luego organiza el orden y el tiempo de las exposiciones desde esta misma pestaña.'
              : 'Organiza los turnos de las entregas cerradas y define el tiempo de exposición.'}
          </p>

          {(!tareaEstado || tareaEstado === 'CERRADA') && (
            <button
              type="button"
              className="sed-primary"
              onClick={() => setModalConfig(true)}
            >
              <ListOrdered size={18} />
              Organizar exposiciones
            </button>
          )}
        </section>
      ) : (
        <>
          <section className="sed-summary">
            <div><UsersRound size={18} /><span><strong>{sala.turnos.length}</strong> turnos</span></div>
            <div><Clock3 size={18} /><span><strong>{Math.round(sala.duracionSegundos / 60)}</strong> min por exposición</span></div>
            <div><CheckCircle2 size={18} /><span><strong>{sala.turnos.filter((t) => t.estado === 'FINALIZADO').length}</strong> finalizados</span></div>
            <div><Shuffle size={18} /><span>{etiquetaEstado(sala.metodoOrden)}</span></div>
          </section>

          <div className="sed-session-grid">
            <section className="sed-live sed-live--session">
              <div className="sed-live__head">
                <div>
                  <span className="sed-kicker">
                    {turnoActivo
                      ? 'Exponiendo ahora'
                      : sala.estado === 'FINALIZADA'
                        ? 'Jornada completada'
                        : 'Jornada'}
                  </span>
                  <h2>
                    {turnoActivo
                      ? nombreTurno(turnoActivo)
                      : sala.estado === 'LISTA'
                        ? 'Lista para iniciar'
                        : sala.estado === 'FINALIZADA'
                          ? 'Exposiciones finalizadas'
                          : 'Sin exposición activa'}
                  </h2>
                </div>

                {turnoActivo && (
                  <span className="sed-order">
                    Turno {turnoActivo.orden} de {sala.turnos.length}
                  </span>
                )}
              </div>

              {sala.estado === 'FINALIZADA' && !turnoActivo ? (
                <div className="sed-finished-state">
                  <span className="sed-finished-state__icon">
                    <CheckCircle2 size={28} />
                  </span>
                  <div>
                    <strong>Jornada finalizada</strong>
                    <p>
                      {sala.turnos.filter((turno) => turno.estado === 'FINALIZADO').length} de {sala.turnos.length} exposiciones completadas. Puedes revisar la última presentación, las preguntas y la evaluación registrada.
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`sed-timer sed-timer--compact ${tiempo?.tiempoCumplido ? 'sed-timer--extra' : ''}`}>
                  <div className="sed-timer__copy">
                    <span>
                      {tiempo
                        ? tiempo.tiempoCumplido
                          ? 'Tiempo adicional'
                          : tiempo.enPausa
                            ? 'Cronómetro pausado'
                            : 'Tiempo restante'
                        : 'Tiempo asignado'}
                    </span>
                    <small>
                      {tiempo
                        ? `${formatoTiempo(tiempo.segundosUtilizados)} utilizados de ${formatoTiempo(tiempo.segundosAsignados)}`
                        : 'El cronómetro comenzará al iniciar un turno.'}
                    </small>
                  </div>

                  <strong>
                    {tiempo
                      ? tiempo.tiempoCumplido
                        ? `+${formatoTiempo(tiempo.tiempoExtraSegundos)}`
                        : formatoTiempo(tiempo.segundosRestantes)
                      : formatoTiempo(sala.duracionSegundos)}
                  </strong>

                  {tiempo && (
                    <div className="sed-progress">
                      <i
                        style={{
                          width: `${Math.min(
                            100,
                            (tiempo.segundosUtilizados /
                              Math.max(1, tiempo.segundosAsignados)) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="sed-controls">
                {sala.estado === 'LISTA' && (
                  <button
                    className="sed-primary"
                    type="button"
                    disabled={salaHook.procesando}
                    onClick={() =>
                      void ejecutar(
                        () => salaHook.iniciarJornada(sala.id),
                        'Jornada iniciada',
                      )
                    }
                  >
                    <Play size={18} />
                    Iniciar jornada
                  </button>
                )}

                {['EN_CURSO', 'PAUSADA'].includes(sala.estado) &&
                  !turnoActivo &&
                  siguiente && (
                    <button
                      className="sed-primary"
                      type="button"
                      disabled={salaHook.procesando}
                      onClick={() =>
                        void ejecutar(
                          () => salaHook.iniciarTurno(sala.id, siguiente.id),
                          `Turno ${siguiente.orden} iniciado`,
                        )
                      }
                    >
                      <Play size={18} />
                      Iniciar {nombreTurno(siguiente)}
                    </button>
                  )}

                {turnoActivo?.estado === 'EN_CURSO' && (
                  <button
                    className="sed-secondary"
                    type="button"
                    disabled={salaHook.procesando}
                    onClick={() =>
                      void ejecutar(
                        () => salaHook.pausarTurno(sala.id, turnoActivo.id),
                        'Cronómetro pausado',
                      )
                    }
                  >
                    <Pause size={18} />
                    Pausar
                  </button>
                )}

                {turnoActivo?.estado === 'PAUSADO' && (
                  <button
                    className="sed-primary"
                    type="button"
                    disabled={salaHook.procesando}
                    onClick={() =>
                      void ejecutar(
                        () => salaHook.reanudarTurno(sala.id, turnoActivo.id),
                        'Exposición reanudada',
                      )
                    }
                  >
                    <Play size={18} />
                    Reanudar
                  </button>
                )}

                {turnoActivo && (
                  <button
                    className="sed-finish"
                    type="button"
                    disabled={
                      salaHook.procesando ||
                      cerrandoTurno ||
                      guardandoRubrica
                    }
                    onClick={() => void finalizarExposicionActual()}
                  >
                    <Square size={17} />
                    {cerrandoTurno
                      ? 'Finalizando...'
                      : 'Finalizar exposición'}
                  </button>
                )}

                {['EN_CURSO', 'PAUSADA'].includes(sala.estado) &&
                  !turnoActivo &&
                  !siguiente && (
                    <button
                      className="sed-primary"
                      type="button"
                      disabled={salaHook.procesando}
                      onClick={() =>
                        void ejecutar(
                          () => salaHook.finalizarJornada(sala.id),
                          'Jornada finalizada',
                        )
                      }
                    >
                      <CheckCircle2 size={18} />
                      Finalizar jornada
                    </button>
                  )}
              </div>
            </section>

            <aside className="sed-panel sed-order-list sed-order-list--session">
              <div className="sed-panel__head">
                <div>
                  <ListOrdered size={18} />
                  <h3>Orden de exposición</h3>
                </div>
                <span>{sala.turnos.length}</span>
              </div>

              <div className="sed-turnos">
                {sala.turnos.map((turno, indice) => (
                  <article
                    key={turno.id}
                    className={`sed-turno sed-turno--${turno.estado.toLowerCase()}`}
                  >
                    <b>{turno.orden}</b>
                    <div>
                      <strong>{nombreTurno(turno)}</strong>
                      <small>{etiquetaEstado(turno.estado)}</small>
                    </div>

                    {sala.estado === 'LISTA' ? (
                      <span className="sed-reorder">
                        <button
                          type="button"
                          disabled={indice === 0 || salaHook.procesando}
                          aria-label="Subir turno"
                          onClick={() => void moverTurno(indice, -1)}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={
                            indice === sala.turnos.length - 1 ||
                            salaHook.procesando
                          }
                          aria-label="Bajar turno"
                          onClick={() => void moverTurno(indice, 1)}
                        >
                          <ArrowDown size={14} />
                        </button>
                      </span>
                    ) : turno.estado === 'FINALIZADO' ? (
                      <button
                        type="button"
                        className={`sed-history-button ${
                          turnoReferencia?.id === turno.id && !turnoActivo
                            ? 'sed-history-button--active'
                            : ''
                        }`}
                        title="Revisar esta exposición"
                        onClick={() => setTurnoHistorialId(turno.id)}
                      >
                        <History size={15} />
                        Revisar
                      </button>
                    ) : null}
                  </article>
                ))}
              </div>

              {sala.mostrarSiguiente && siguiente && (
                <div className="sed-next sed-next--embedded">
                  <span>Siguiente</span>
                  <strong>{nombreTurno(siguiente)}</strong>
                  <small>Turno {siguiente.orden}</small>
                </div>
              )}
            </aside>
          </div>

          {sala.estado === 'FINALIZADA' && (
            <section className="sed-final-summary">
              <div className="sed-final-summary__head">
                <div>
                  <span className="sed-kicker">Cierre de jornada</span>
                  <h3>Resumen de exposiciones</h3>
                  <p>
                    Revisa el resultado de cada turno. Las notas permanecen en el flujo normal de Calificaciones hasta que decidas publicarlas.
                  </p>
                </div>

                <div className="sed-final-summary__metric">
                  <strong>
                    {sala.turnos.filter((turno) => turno.estado === 'FINALIZADO').length}
                    /{sala.turnos.length}
                  </strong>
                  <span>completadas</span>
                </div>
              </div>

              <div className="sed-final-table-wrap">
                <table className="sed-final-table">
                  <thead>
                    <tr>
                      <th>Orden</th>
                      <th>Expositor / equipo</th>
                      <th>Tiempo utilizado</th>
                      <th>Preguntas</th>
                      {sala.tarea.esCalificable && <th>Nota</th>}
                      <th>Estado</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {sala.turnos.map((turno) => {
                      const nota = notaTurno(turno);

                      return (
                        <tr
                          key={turno.id}
                          className={
                            turnoReferencia?.id === turno.id
                              ? 'sed-final-table__selected'
                              : undefined
                          }
                        >
                          <td>#{turno.orden}</td>
                          <td>
                            <strong>{nombreTurno(turno)}</strong>
                          </td>
                          <td>{formatoTiempo(turno.segundosUtilizados)}</td>
                          <td>{turno.preguntas.length}</td>
                          {sala.tarea.esCalificable && (
                            <td>
                              {nota === null ? (
                                <span className="sed-note-pending">Pendiente</span>
                              ) : (
                                <strong className="sed-note-value">
                                  {nota.toFixed(2)}/100
                                </strong>
                              )}
                            </td>
                          )}
                          <td>
                            <span className={`sed-turn-state sed-turn-state--${turno.estado.toLowerCase()}`}>
                              {etiquetaEstado(turno.estado)}
                            </span>
                          </td>
                          <td>
                            {turno.estado === 'FINALIZADO' && (
                              <button
                                type="button"
                                className="sed-review-link"
                                onClick={() => setTurnoHistorialId(turno.id)}
                              >
                                <History size={14} />
                                Revisar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="sed-workspace-grid">
            <section className="sed-panel sed-presentation-panel">
              <div className="sed-panel__head">
                <div>
                  <Presentation size={18} />
                  <h3>
                    {turnoActivo ? 'Presentación en vivo' : 'Presentación'}
                  </h3>
                </div>
                {turnoReferencia && (
                  <span>Diapositiva {turnoReferencia.diapositivaActual}</span>
                )}
              </div>

              <div className="sed-presentation-body">
                {turnoReferencia ? (
                  <VisorPresentacionExposicion
                    archivo={archivoPresentacion}
                    diapositiva={turnoReferencia.diapositivaActual}
                    puedeControlar={Boolean(turnoActivo)}
                    onCambiarDiapositiva={
                      turnoActivo
                        ? (diapositiva) =>
                            ejecutar(
                              async () => {
                                await salaHook.cambiarDiapositiva(
                                  sala.id,
                                  turnoActivo.id,
                                  diapositiva,
                                );
                              },
                              `Diapositiva ${diapositiva}`,
                            )
                        : undefined
                    }
                  />
                ) : (
                  <p className="sed-muted">
                    Cuando inicie un turno, aquí aparecerá la presentación sincronizada con el aula.
                  </p>
                )}
              </div>
            </section>

            <aside className="sed-panel sed-questions-panel">
              <div className="sed-panel__head">
                <div>
                  <MessageCircleQuestion size={18} />
                  <h3>Preguntas del aula</h3>
                </div>
                <span>{preguntasTurno.length}</span>
              </div>

              <div className="sed-question-list sed-question-list--embedded">
                {!turnoReferencia ? (
                  <p className="sed-muted">
                    Las preguntas aparecerán cuando comience una exposición.
                  </p>
                ) : preguntasTurno.length === 0 ? (
                  <p className="sed-muted">
                    Aún no hay preguntas para este turno.
                  </p>
                ) : (
                  preguntasTurno.map((pregunta) => (
                    <article
                      key={pregunta.id}
                      className={`sed-question sed-question--${pregunta.estado.toLowerCase()} ${pregunta.destacada ? 'sed-question--featured' : ''}`}
                    >
                      <div className="sed-question__meta">
                        <strong>{nombrePregunta(pregunta.autor)}</strong>
                        <span>
                          Diap. {pregunta.diapositiva ?? '—'} ·{' '}
                          {pregunta.segundosExposicion === null
                            ? '—'
                            : formatoTiempo(pregunta.segundosExposicion)}
                        </span>
                      </div>
                      <p>{pregunta.contenido}</p>
                      <div className="sed-question__foot">
                        <small>
                          {pregunta.votos.length} voto
                          {pregunta.votos.length === 1 ? '' : 's'}
                        </small>
                        <div>
                          <button
                            type="button"
                            title={
                              pregunta.destacada
                                ? 'Quitar destacado'
                                : 'Destacar pregunta'
                            }
                            className={pregunta.destacada ? 'active' : ''}
                            onClick={() =>
                              void ejecutar(
                                async () => {
                                  await salaHook.actualizarPregunta(
                                    pregunta.id,
                                    {
                                      destacada: !pregunta.destacada,
                                    },
                                  );
                                },
                                pregunta.destacada
                                  ? 'Pregunta sin destacar'
                                  : 'Pregunta destacada',
                              )
                            }
                          >
                            <Star size={14} />
                          </button>

                          {pregunta.estado !== 'RESPONDIDA' && (
                            <button
                              type="button"
                              title="Marcar como respondida"
                              onClick={() =>
                                void ejecutar(
                                  async () => {
                                    await salaHook.actualizarPregunta(
                                      pregunta.id,
                                      {
                                        estado: 'RESPONDIDA',
                                      },
                                    );
                                  },
                                  'Pregunta marcada como respondida',
                                )
                              }
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </aside>
          </div>

          <section className="sed-panel sed-rubric-section">
            <div className="sed-rubric-head-full">
              <div className="sed-rubric-title-full">
                <span className="sed-rubric-icon-full">
                  <ClipboardCheck size={19} />
                </span>
                <div>
                  <span className="sed-kicker">Evaluación en vivo</span>
                  <h3>Rúbrica de evaluación</h3>
                  <p>
                    {turnoReferencia
                      ? `Evaluando a ${nombreTurno(turnoReferencia)}`
                      : 'Inicia un turno para habilitar la evaluación.'}
                  </p>
                </div>
              </div>

              <div className="sed-rubric-score sed-rubric-score--large">
                <span>Nota actual</span>
                <strong>
                  {notaRubrica === null
                    ? '—'
                    : `${notaRubrica.toFixed(2)}/100`}
                </strong>
              </div>
            </div>

            {turnoReferencia ? (
              <div className="sed-rubric-body sed-rubric-body--full">
                <MatrizRubricaEvaluacion
                  key={turnoReferencia.entregaId}
                  cursoId={cursoId}
                  tareaId={tareaId}
                  entregaId={turnoReferencia.entregaId}
                  accessToken={accessToken ?? ''}
                  onDatos={(items, nota) => {
                    setItemsRubrica(items);
                    setNotaRubrica(nota);
                  }}
                />

                <div className="sed-rubric-actions">
                  <div>
                    <strong>
                      {notaRubrica === null
                        ? 'Evaluación incompleta'
                        : 'Rúbrica completa'}
                    </strong>
                    <small>
                      {notaRubrica === null
                        ? 'Completa todos los criterios para habilitar el guardado.'
                        : 'Guarda la evaluación sin salir de la sala.'}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="sed-primary"
                    disabled={
                      guardandoRubrica ||
                      notaRubrica === null ||
                      itemsRubrica.length === 0
                    }
                    onClick={() => void guardarRubrica()}
                  >
                    <Save size={17} />
                    {guardandoRubrica
                      ? 'Guardando...'
                      : 'Guardar evaluación'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="sed-muted">
                Inicia un turno para evaluar la exposición con la rúbrica configurada en la tarea.
              </p>
            )}
          </section>

          {turnoReferencia?.estado === 'FINALIZADO' && (
            <AnalisisExposicionIusAcademy
              analisis={analisisExposicion}
              cargando={cargandoAnalisis}
              generando={generandoAnalisis}
              nombreExpositor={nombreTurno(turnoReferencia)}
              onGenerar={() => void generarAnalisisTurno()}
              onCopiarRetroalimentacion={() =>
                void copiarRetroalimentacionAnalisis()
              }
            />
          )}
        </>
      )}

      <AulaModal
        abierto={Boolean(resumenTurno)}
        titulo="Exposición completada"
        etiqueta="Resumen del turno"
        descripcion="Revisa el resultado del turno y continúa con el siguiente equipo cuando estés listo."
        icono={CheckCircle2}
        ancho="mediano"
        bloqueado={salaHook.procesando}
        onCerrar={() => setResumenTurno(null)}
        footer={
          <div className="sed-modal-footer">
            <button
              type="button"
              className="sed-secondary"
              disabled={salaHook.procesando}
              onClick={() => setResumenTurno(null)}
            >
              Revisar sala
            </button>

            <button
              type="button"
              className="sed-primary"
              disabled={salaHook.procesando}
              onClick={() => void continuarDesdeResumen()}
            >
              <Play size={17} />
              {resumenTurno?.siguienteTurnoId
                ? 'Iniciar siguiente exposición'
                : 'Finalizar jornada'}
            </button>
          </div>
        }
      >
        {resumenTurno && (
          <div className="sed-turn-summary">
            <div className="sed-turn-summary__hero">
              <span className="sed-turn-summary__icon">
                <CheckCircle2 size={24} />
              </span>

              <div>
                <span>Turno {resumenTurno.orden} completado</span>
                <strong>{resumenTurno.nombre}</strong>
                <small>
                  La exposición quedó cerrada y registrada correctamente.
                </small>
              </div>
            </div>

            <div className="sed-turn-summary__stats">
              <article>
                <Clock3 size={18} />
                <span>
                  <small>Tiempo utilizado</small>
                  <strong>
                    {formatoTiempo(resumenTurno.segundosUtilizados)}
                  </strong>
                </span>
              </article>

              <article>
                <MessageCircleQuestion size={18} />
                <span>
                  <small>Preguntas</small>
                  <strong>{resumenTurno.preguntas}</strong>
                </span>
              </article>

              <article>
                <ClipboardCheck size={18} />
                <span>
                  <small>Evaluación</small>
                  <strong>
                    {resumenTurno.nota === null
                      ? 'No aplica'
                      : `${resumenTurno.nota.toFixed(2)}/100`}
                  </strong>
                </span>
              </article>
            </div>

            <div className="sed-turn-summary__next">
              <span>
                {resumenTurno.siguienteTurnoId
                  ? 'Siguiente exposición'
                  : 'Jornada lista para cerrar'}
              </span>

              <strong>
                {resumenTurno.siguienteNombre ??
                  'Todos los turnos fueron completados'}
              </strong>

              <small>
                {resumenTurno.siguienteTurnoId
                  ? 'El siguiente equipo permanece en espera hasta que el docente inicie su turno.'
                  : 'Finaliza la jornada para cerrar oficialmente la sesión de exposiciones.'}
              </small>
            </div>
          </div>
        )}
      </AulaModal>

      <AulaModal
        abierto={modalConfig}
        titulo="Organizar exposiciones"
        etiqueta="Jornada académica"
        descripcion="Define el orden y el tiempo para generar los turnos de las entregas cerradas."
        icono={Presentation}
        ancho="mediano"
        bloqueado={salaHook.procesando}
        onCerrar={() => {
          if (sala || integrado) {
            setModalConfig(false);
          }
        }}
        footer={
          <div className="sed-modal-footer">
            {sala && (
              <button
                type="button"
                className="sed-secondary"
                disabled={salaHook.procesando}
                onClick={() => setModalConfig(false)}
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              className="sed-primary"
              disabled={
                salaHook.procesando ||
                avisoMinutos >= duracionMinutos
              }
              onClick={() => void crearJornada()}
            >
              <ListOrdered size={17} />
              {salaHook.procesando
                ? 'Generando...'
                : 'Generar orden'}
            </button>
          </div>
        }
      >
        <div className="sed-form">
          <div className="sed-field sed-field--full">
            <label>Método de orden</label>
            <div className="sed-methods">
              {([
                ['ORDEN_ENTREGA', 'Orden de entrega', 'Primero expone quien entregó antes.'],
                ['ALEATORIO', 'Sorteo aleatorio', 'IusAcademy genera un orden al azar y lo conserva.'],
                ['ALFABETICO', 'Orden alfabético', 'Orden por estudiante, grupo o equipo.'],
              ] as const).map(([valor, titulo, descripcion]) => (
                <button
                  key={valor}
                  type="button"
                  className={
                    metodoOrden === valor
                      ? 'active'
                      : ''
                  }
                  onClick={() => setMetodoOrden(valor)}
                >
                  <span className="sed-radio">
                    {metodoOrden === valor && <i />}
                  </span>

                  <div>
                    <strong>{titulo}</strong>
                    <small>{descripcion}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="sed-field">
            <label>Tiempo por exposición</label>

            <div className="sed-input-unit">
              <input
                type="number"
                min={1}
                max={180}
                value={duracionMinutos}
                onChange={(evento) =>
                  setDuracionMinutos(
                    Number(evento.target.value),
                  )
                }
              />
              <span>min</span>
            </div>
          </div>
          <div className="sed-field">
            <label>Aviso previo</label>

            <div className="sed-input-unit">
              <input
                type="number"
                min={0}
                max={60}
                value={avisoMinutos}
                onChange={(evento) =>
                  setAvisoMinutos(
                    Number(evento.target.value),
                  )
                }
              />
              <span>min</span>
            </div>

            {avisoMinutos >= duracionMinutos && (
              <small className="sed-error">
                Debe ser menor al tiempo total.
              </small>
            )}
          </div>
          <label className="sed-check">
            <input
              type="checkbox"
              checked={permitirTiempoExtra}
              onChange={(evento) =>
                setPermitirTiempoExtra(
                  evento.target.checked,
                )
              }
            />

            <span>
              <strong>Permitir tiempo adicional</strong>
              <small>
                El cronómetro continuará contando después de 00:00.
              </small>
            </span>
          </label>
          <label className="sed-check">
            <input
              type="checkbox"
              checked={mostrarSiguiente}
              onChange={(evento) =>
                setMostrarSiguiente(
                  evento.target.checked,
                )
              }
            />

            <span>
              <strong>Mostrar siguiente expositor</strong>
              <small>
                Facilita la preparación del próximo turno.
              </small>
            </span>
          </label>
        </div>
      </AulaModal>

      <Toast
        visible={toast.visible}
        tipo={toast.tipo}
        titulo={toast.titulo}
        mensaje={toast.mensaje}
        onCerrar={() =>
          setToast((actual) => ({
            ...actual,
            visible: false,
          }))
        }
      />
      <style>{styles}</style>
    </div>
  );
}

const styles = `
.sed-page {
  width: 100%;
  display: grid;
  gap: 18px;
  color: var(--app-text);
}

.sed-subview-title-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid var(--app-border);
  border-radius: 20px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm,0 8px 22px rgba(15,23,42,.04));
}

.sed-title-identity {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.sed-title-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid rgba(241,139,75,.28);
  border-radius: 14px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.sed-title-identity h3 {
  margin: 2px 0 4px;
  font-size: 18px;
  line-height: 1.2;
}

.sed-title-identity p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.sed-subview-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.sed-subview-actions button {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 8px 12px;
  border: 1px solid var(--app-border);
  border-radius: 11px;
  background: #fff;
  color: var(--app-text-secondary);
  font-weight: 800;
  cursor: pointer;
}

.sed-subview-actions button:hover:not(:disabled) {
  border-color: var(--app-accent);
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.sed-subview-actions button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.sed-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 24px;
  border: 1px solid var(--app-border);
  border-radius: 22px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm,0 8px 22px rgba(15,23,42,.05));
}

.sed-back {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: var(--app-surface);
  color: var(--app-text-secondary);
  cursor: pointer;
  transition: .18s ease;
}

.sed-back:hover {
  border-color: var(--app-accent);
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.sed-header__icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid rgba(241,139,75,.28);
  border-radius: 15px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.sed-heading {
  min-width: 0;
  flex: 1;
}

.sed-heading h1 {
  margin: 2px 0 4px;
  font-size: 23px;
  line-height: 1.15;
}

.sed-heading p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.sed-kicker {
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .13em;
  text-transform: uppercase;
  color: var(--app-accent-dark);
}

.sed-status {
  padding: 8px 12px;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .05em;
  text-transform: uppercase;
  background: var(--app-surface-alt);
}

.sed-status--en_curso,.sed-status--lista {
  color: var(--app-accent-dark);
  border-color: rgba(241,139,75,.42);
  background: var(--app-accent-soft);
}

.sed-status--finalizada {
  color: #166534;
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.sed-status--pausada {
  color: #92400e;
  border-color: #fed7aa;
  background: #fff7ed;
}

.sed-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px;
  border: 1px solid var(--app-border);
  border-radius: 20px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm,0 8px 22px rgba(15,23,42,.04));
}

.sed-summary>div {
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: 1px solid var(--app-border-soft);
  border-radius: 14px;
  color: var(--app-text-secondary);
  background: var(--app-surface-alt);
  font-size: 12px;
}

.sed-summary>div strong {
  color: var(--app-text);
}

.sed-summary svg {
  color: var(--app-accent-dark);
}

.sed-refresh {
  margin-left: auto;
  min-height: 42px;
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 9px 13px;
  border: 1px solid var(--app-border);
  border-radius: 11px;
  background: #fff;
  color: var(--app-text-secondary);
  font-weight: 800;
  cursor: pointer;
  transition: .18s ease;
}

.sed-refresh:hover {
  border-color: var(--app-accent);
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.sed-grid {
  display: grid;
  grid-template-columns: minmax(0,1fr) 330px;
  gap: 18px;
}

.sed-main,.sed-side {
  display: grid;
  gap: 18px;
  align-content: start;
}

.sed-live,.sed-panel,.sed-next,.sed-empty {
  border: 1px solid var(--app-border);
  border-radius: 22px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm,0 8px 22px rgba(15,23,42,.04));
  overflow: hidden;
}

.sed-live {
  padding: 24px;
}

.sed-live__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.sed-live__head h2 {
  margin: 4px 0 0;
  font-size: 21px;
  line-height: 1.2;
}

.sed-order {
  padding: 7px 10px;
  border-radius: 999px;
  background: var(--app-accent-soft);
  color: var(--app-accent-dark);
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

.sed-timer {
  position: relative;
  margin: 22px 0 18px;
  padding: 30px 26px 24px;
  text-align: center;
  border: 1px solid rgba(241,139,75,.2);
  border-radius: 20px;
  background: linear-gradient(180deg,var(--app-accent-softer,rgba(241,139,75,.08)),var(--app-bg-soft));
}

.sed-timer>span {
  display: block;
  color: var(--app-text-secondary);
  font-size: 12px;
  font-weight: 800;
}

.sed-timer>strong {
  display: block;
  margin: 7px 0;
  font-size: 54px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -.035em;
}

.sed-timer>small {
  color: var(--app-text-secondary);
  font-size: 11px;
}

.sed-timer--extra {
  border-color: #fed7aa;
  background: #fff7ed;
}

.sed-timer--extra strong {
  color: #b45309;
}

.sed-progress {
  height: 8px;
  margin-top: 18px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148,163,184,.22);
}

.sed-progress i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--app-accent);
  transition: width .25s linear;
}

.sed-controls,.sed-modal-footer {
  display: flex;
  gap: 9px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.sed-primary,.sed-secondary,.sed-finish {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px 15px;
  border: 1px solid;
  border-radius: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: .18s ease;
}

.sed-primary {
  border-color: var(--app-accent);
  background: var(--app-accent);
  color: #fff;
}

.sed-primary:hover {
  border-color: var(--app-accent-hover);
  background: var(--app-accent-hover);
}

.sed-secondary {
  border-color: var(--app-border);
  background: #fff;
  color: var(--app-text);
}

.sed-secondary:hover {
  border-color: var(--app-accent);
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.sed-finish {
  border-color: #fecaca;
  background: #fff;
  color: #b91c1c;
}

.sed-finish:hover {
  background: #fef2f2;
  border-color: #fca5a5;
}

.sed-primary:disabled,.sed-secondary:disabled,.sed-finish:disabled,.sed-refresh:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.sed-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 17px;
  border-bottom: 1px solid var(--app-border-soft);
  background: linear-gradient(180deg,#fff,var(--app-surface-alt));
}

.sed-panel__head>div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sed-panel__head svg {
  color: var(--app-accent-dark);
}

.sed-panel__head h3 {
  margin: 0;
  font-size: 14px;
}

.sed-panel__head>span {
  padding: 5px 8px;
  border-radius: 999px;
  background: var(--app-surface);
  font-size: 10px;
  color: var(--app-text-secondary);
  font-weight: 800;
}

.sed-files {
  padding: 14px;
  display: grid;
  gap: 9px;
}

.sed-files article {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px;
  border: 1px solid var(--app-border-soft);
  border-radius: 15px;
  background: #fff;
}

.sed-files article>span {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 10px;
  background: var(--app-accent-soft);
  color: var(--app-accent-dark);
}

.sed-files article>div {
  min-width: 0;
  flex: 1;
}

.sed-files strong,.sed-files small {
  display: block;
}

.sed-files strong {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
}

.sed-files small {
  margin-top: 2px;
  color: var(--app-text-secondary);
  font-size: 10px;
}

.sed-files a {
  padding: 7px 9px;
  border-radius: 9px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
  font-size: 11px;
  font-weight: 900;
  text-decoration: none;
}

.sed-files a:hover {
  background: #ffe4c7;
}

.sed-files em {
  font-size: 11px;
  color: var(--app-text-secondary);
}

.sed-muted {
  margin: 0;
  padding: 30px 24px;
  color: var(--app-text-secondary);
  text-align: center;
  font-size: 13px;
}

.sed-order-list {
  overflow: hidden;
}

.sed-turnos {
  max-height: 520px;
  overflow: auto;
  padding: 8px;
}

.sed-turno {
  display: grid;
  grid-template-columns: 34px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 11px;
  margin-bottom: 6px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: var(--app-surface);
  transition: .18s ease;
}

.sed-turno:last-child {
  margin-bottom: 0;
}

.sed-turno>b {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: var(--app-surface-alt);
  font-size: 11px;
}

.sed-turno strong,.sed-turno small {
  display: block;
}

.sed-turno strong {
  font-size: 12px;
}

.sed-turno small {
  margin-top: 2px;
  color: var(--app-text-secondary);
  font-size: 10px;
}

.sed-turno--en_curso,.sed-turno--pausado {
  border-color: rgba(241,139,75,.3);
  background: var(--app-accent-soft);
}

.sed-turno--en_curso>b,.sed-turno--pausado>b {
  background: #fff;
  color: var(--app-accent-dark);
}

.sed-turno--finalizado {
  opacity: .72;
  background: #f8fafc;
}

.sed-turno--finalizado>svg {
  color: #16a34a;
}

.sed-reorder {
  display: flex;
  gap: 4px;
}

.sed-reorder button {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: #fff;
  color: var(--app-text-secondary);
  cursor: pointer;
}

.sed-reorder button:hover:not(:disabled) {
  border-color: var(--app-accent);
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.sed-reorder button:disabled {
  opacity: .35;
  cursor: not-allowed;
}

.sed-next {
  padding: 15px 17px;
  border-color: rgba(241,139,75,.28);
  background: linear-gradient(135deg,var(--app-accent-soft),#fff);
}

.sed-next span,.sed-next strong,.sed-next small {
  display: block;
}

.sed-next span {
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 900;
  letter-spacing: .08em;
  color: var(--app-accent-dark);
}

.sed-next strong {
  margin-top: 5px;
  font-size: 14px;
}

.sed-next small {
  margin-top: 2px;
  color: var(--app-text-secondary);
  font-size: 11px;
}

.sed-empty {
  padding: 54px 24px;
  text-align: center;
}

.sed-empty__icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 14px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: var(--app-accent-soft);
  color: var(--app-accent-dark);
}

.sed-empty h2 {
  margin: 0 0 6px;
}

.sed-empty p {
  margin: 0 auto 20px;
  max-width: 520px;
  color: var(--app-text-secondary);
}

.sed-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.sed-field {
  display: grid;
  gap: 7px;
}

.sed-field--full {
  grid-column: 1/-1;
}

.sed-field label {
  font-size: 12px;
  font-weight: 900;
}

.sed-methods {
  display: grid;
  gap: 9px;
}

.sed-methods button {
  display: flex;
  align-items: flex-start;
  text-align: left;
  gap: 11px;
  padding: 13px;
  border: 1px solid var(--app-border);
  border-radius: 15px;
  background: #fff;
  cursor: pointer;
  transition: .18s ease;
}

.sed-methods button:hover {
  border-color: rgba(241,139,75,.45);
  background: var(--app-accent-softer,rgba(241,139,75,.06));
}

.sed-methods button.active {
  border-color: var(--app-accent);
  background: var(--app-accent-soft);
  box-shadow: 0 0 0 1px rgba(241,139,75,.08);
}

.sed-methods strong,.sed-methods small {
  display: block;
}

.sed-methods strong {
  font-size: 12px;
}

.sed-methods small {
  margin-top: 3px;
  color: var(--app-text-secondary);
  font-size: 11px;
  line-height: 1.4;
}

.sed-radio {
  width: 19px;
  height: 19px;
  border: 2px solid var(--app-border-strong);
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.sed-methods .active .sed-radio {
  border-color: var(--app-accent);
}

.sed-radio i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--app-accent);
}

.sed-input-unit {
  display: grid;
  grid-template-columns: 1fr auto;
  border: 1px solid var(--app-border);
  border-radius: 11px;
  overflow: hidden;
  background: #fff;
}

.sed-input-unit:focus-within {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-softer,rgba(241,139,75,.1));
}

.sed-input-unit input {
  min-width: 0;
  padding: 11px 12px;
  border: 0;
  outline: 0;
  background: transparent;
}

.sed-input-unit span {
  display: grid;
  place-items: center;
  padding: 0 11px;
  border-left: 1px solid var(--app-border-soft);
  color: var(--app-text-secondary);
  font-size: 11px;
  font-weight: 800;
  background: var(--app-surface-alt);
}

.sed-error {
  color: #b91c1c;
  font-size: 10px;
}

.sed-check {
  grid-column: 1/-1;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 13px;
  border: 1px solid var(--app-border-soft);
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
}

.sed-check:hover {
  border-color: rgba(241,139,75,.35);
  background: var(--app-accent-softer,rgba(241,139,75,.05));
}

.sed-check input {
  margin-top: 3px;
  accent-color: var(--app-accent);
}

.sed-check strong,.sed-check small {
  display: block;
}

.sed-check strong {
  font-size: 12px;
}

.sed-check small {
  margin-top: 3px;
  color: var(--app-text-secondary);
  font-size: 11px;
  line-height: 1.4;
}

.sed-presentation-body {
  padding: 12px;
}

.sed-question-list {
  max-height: 520px;
  overflow: auto;
  padding: 9px;
  display: grid;
  gap: 8px;
}

.sed-question {
  padding: 10px;
  border: 1px solid var(--app-border-soft);
  border-radius: 13px;
  background: #fff;
}

.sed-question--featured {
  border-color: rgba(241,139,75,.42);
  background: var(--app-accent-softer,rgba(241,139,75,.05));
}

.sed-question--respondida {
  opacity: .74;
}

.sed-question__meta,.sed-question__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sed-question__meta strong {
  font-size: 11px;
}

.sed-question__meta span,.sed-question__foot small {
  font-size: 9px;
  color: var(--app-text-secondary);
}

.sed-question p {
  margin: 7px 0 9px;
  font-size: 11px;
  line-height: 1.5;
}

.sed-question__foot>div {
  display: flex;
  gap: 4px;
}

.sed-question__foot button {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: #fff;
  color: var(--app-text-secondary);
  cursor: pointer;
}

.sed-question__foot button:hover,.sed-question__foot button.active {
  border-color: var(--app-accent);
  background: var(--app-accent-soft);
  color: var(--app-accent-dark);
}

.sed-rubric-panel {
  overflow: visible;
}

.sed-rubric-head {
  align-items: center;
}

.sed-rubric-head>div:first-child {
  align-items: flex-start;
}

.sed-rubric-head h3 {
  margin: 0;
}

.sed-rubric-head small {
  display: block;
  margin-top: 3px;
  color: var(--app-text-secondary);
  font-size: 10px;
  line-height: 1.35;
}

.sed-rubric-score {
  display: grid!important;
  justify-items: end!important;
  gap: 1px!important;
  min-width: 112px;
  padding: 7px 10px;
  border: 1px solid rgba(241,139,75,.24);
  border-radius: 12px;
  background: var(--app-accent-soft);
}

.sed-rubric-score span {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--app-accent-dark);
}

.sed-rubric-score strong {
  font-size: 15px;
  color: var(--app-text);
}

.sed-rubric-body {
  padding: 14px;
}

.sed-rubric-context {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding: 11px 12px;
  border: 1px solid var(--app-border-soft);
  border-radius: 13px;
  background: var(--app-surface-alt);
}

.sed-rubric-context>div span,.sed-rubric-context>div strong {
  display: block;
}

.sed-rubric-context>div span {
  font-size: 9px;
  font-weight: 900;
  letter-spacing: .07em;
  text-transform: uppercase;
  color: var(--app-accent-dark);
}

.sed-rubric-context>div strong {
  margin-top: 3px;
  font-size: 12px;
}

.sed-rubric-context>small {
  color: var(--app-text-secondary);
  font-size: 10px;
  white-space: nowrap;
}

.sed-rubric-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--app-border-soft);
}

.sed-rubric-actions>div strong,.sed-rubric-actions>div small {
  display: block;
}

.sed-rubric-actions>div strong {
  font-size: 12px;
}

.sed-rubric-actions>div small {
  margin-top: 3px;
  color: var(--app-text-secondary);
  font-size: 10px;
  line-height: 1.4;
}

.sed-session-grid {
  display: grid;
  grid-template-columns: minmax(0,1fr) 330px;
  gap: 18px;
  align-items: stretch;
}

.sed-live--session {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.sed-order-list--session {
  min-height: 100%;
}

.sed-timer--compact {
  display: grid;
  grid-template-columns: minmax(0,1fr) auto;
  align-items: center;
  gap: 18px;
  margin: 18px 0 14px;
  padding: 18px 20px;
  text-align: left;
}

.sed-timer--compact>strong {
  margin: 0;
  font-size: 44px;
}

.sed-timer--compact .sed-progress {
  grid-column: 1/-1;
  margin-top: 0;
}

.sed-timer__copy span,.sed-timer__copy small {
  display: block;
}

.sed-timer__copy span {
  font-size: 11px;
  font-weight: 900;
  color: var(--app-text);
}

.sed-timer__copy small {
  margin-top: 4px;
  color: var(--app-text-secondary);
  font-size: 10px;
}

.sed-finished-state {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 18px 0 14px;
  padding: 18px;
  border: 1px solid #bbf7d0;
  border-radius: 16px;
  background: #f0fdf4;
}

.sed-finished-state__icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 14px;
  background: #dcfce7;
  color: #15803d;
}

.sed-finished-state strong {
  display: block;
  font-size: 14px;
  color: #166534;
}

.sed-finished-state p {
  margin: 4px 0 0;
  color: #3f6212;
  font-size: 11px;
  line-height: 1.5;
}

.sed-next--embedded {
  margin: 8px;
  border-radius: 13px;
  box-shadow: none;
}

.sed-workspace-grid {
  display: grid;
  grid-template-columns: minmax(0,1fr) 340px;
  gap: 18px;
  align-items: start;
}

.sed-presentation-panel {
  min-width: 0;
}

.sed-questions-panel {
  min-width: 0;
  overflow: hidden;
}

.sed-question-list--embedded {
  max-height: 760px;
  min-height: 260px;
}

.sed-rubric-section {
  overflow: visible;
}

.sed-rubric-head-full {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--app-border-soft);
  background: linear-gradient(180deg,#fff,var(--app-surface-alt));
}

.sed-rubric-title-full {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.sed-rubric-icon-full {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid rgba(241,139,75,.28);
  border-radius: 13px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.sed-rubric-title-full h3 {
  margin: 2px 0 3px;
  font-size: 16px;
}

.sed-rubric-title-full p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 11px;
}

.sed-rubric-score--large {
  min-width: 150px;
  padding: 9px 12px;
}

.sed-rubric-score--large strong {
  font-size: 18px;
}

.sed-rubric-body--full {
  padding: 18px;
}

@media(max-width:1180px) {
  .sed-workspace-grid {
    grid-template-columns: minmax(0,1fr) 320px;
  }

}

@media(max-width:1080px) {
  .sed-session-grid {
    grid-template-columns: minmax(0,1fr) 300px;
  }

  .sed-workspace-grid {
    grid-template-columns: 1fr;
  }

}

@media(max-width:980px) {
  .sed-session-grid {
    grid-template-columns: 1fr;
  }

  .sed-order-list--session {
    grid-row: auto;
  }

}

.sed-turn-summary {
  display: grid;
  gap: 16px;
}

.sed-turn-summary__hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 16px;
  background: #f0fdf4;
}

.sed-turn-summary__icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 14px;
  color: #15803d;
  background: #dcfce7;
}

.sed-turn-summary__hero div {
  min-width: 0;
}

.sed-turn-summary__hero span, .sed-turn-summary__hero strong, .sed-turn-summary__hero small {
  display: block;
}

.sed-turn-summary__hero span {
  color: #15803d;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sed-turn-summary__hero strong {
  margin-top: 3px;
  color: var(--app-text);
  font-size: 17px;
}

.sed-turn-summary__hero small {
  margin-top: 3px;
  color: var(--app-text-secondary);
  font-size: 11px;
  line-height: 1.45;
}

.sed-turn-summary__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.sed-turn-summary__stats article {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 13px;
  border: 1px solid var(--app-border-soft);
  border-radius: 14px;
  background: var(--app-surface-alt);
}

.sed-turn-summary__stats article > svg {
  flex: 0 0 auto;
  color: var(--app-accent-dark);
}

.sed-turn-summary__stats span, .sed-turn-summary__stats small, .sed-turn-summary__stats strong {
  display: block;
}

.sed-turn-summary__stats small {
  color: var(--app-text-secondary);
  font-size: 10px;
}

.sed-turn-summary__stats strong {
  margin-top: 2px;
  color: var(--app-text);
  font-size: 13px;
}

.sed-turn-summary__next {
  padding: 15px 16px;
  border: 1px solid rgba(241, 139, 75, 0.28);
  border-radius: 16px;
  background: var(--app-accent-soft);
}

.sed-turn-summary__next span, .sed-turn-summary__next strong, .sed-turn-summary__next small {
  display: block;
}

.sed-turn-summary__next span {
  color: var(--app-accent-dark);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sed-turn-summary__next strong {
  margin-top: 4px;
  color: var(--app-text);
  font-size: 14px;
}

.sed-turn-summary__next small {
  margin-top: 4px;
  color: var(--app-text-secondary);
  font-size: 11px;
  line-height: 1.45;
}

@media(max-width:640px) {
  .sed-subview-title-card {
    align-items: flex-start;
    flex-direction: column;
    padding: 16px;
  }

  .sed-subview-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .sed-header {
    align-items: flex-start;
    padding: 16px;
  }

  .sed-status {
    display: none;
  }

  .sed-summary {
    align-items: stretch;
  }

  .sed-summary>div {
    flex: 1 1 calc(50% - 8px);
  }

  .sed-form {
    grid-template-columns: 1fr;
  }

  .sed-field--full,.sed-check {
    grid-column: 1;
  }

  .sed-timer {
    padding: 20px 16px;
  }

  .sed-timer>strong {
    font-size: 40px;
  }

  .sed-timer--compact {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .sed-timer--compact .sed-progress {
    grid-column: 1;
  }

  .sed-workspace-grid {
    grid-template-columns: 1fr;
  }

  .sed-controls {
    justify-content: stretch;
  }

  .sed-controls button {
    flex: 1 1 auto;
  }

}

.sed-history-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--app-border, #e2e8f0);
  border-radius: 9px;
  background: #ffffff;
  color: #475569;
  padding: 7px 9px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.sed-history-button:hover,
.sed-history-button--active {
  border-color: #f18b4b;
  background: #fff0df;
  color: #c46a2c;
}

.sed-final-summary {
  margin-top: 18px;
  border: 1px solid #fed7aa;
  border-radius: 18px;
  background: #ffffff;
  overflow: hidden;
}

.sed-final-summary__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  border-bottom: 1px solid #ffedd5;
  background: linear-gradient(135deg, #fffaf4 0%, #ffffff 70%);
}

.sed-final-summary__head h3 {
  margin: 4px 0 6px;
  color: #0f172a;
  font-size: 19px;
}

.sed-final-summary__head p {
  margin: 0;
  max-width: 760px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.55;
}

.sed-final-summary__metric {
  min-width: 112px;
  border: 1px solid #fed7aa;
  border-radius: 14px;
  background: #fff7ed;
  padding: 12px 16px;
  text-align: center;
}

.sed-final-summary__metric strong {
  display: block;
  color: #c46a2c;
  font-size: 22px;
}

.sed-final-summary__metric span {
  color: #78716c;
  font-size: 11px;
  font-weight: 700;
}

.sed-final-table-wrap {
  overflow-x: auto;
}

.sed-final-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 780px;
}

.sed-final-table th,
.sed-final-table td {
  padding: 13px 16px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  vertical-align: middle;
}

.sed-final-table th {
  background: #fffdf9;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.sed-final-table td {
  color: #475569;
  font-size: 13px;
}

.sed-final-table tbody tr:last-child td {
  border-bottom: 0;
}

.sed-final-table__selected td {
  background: #fff8ef;
}

.sed-note-value {
  color: #166534;
}

.sed-note-pending {
  color: #92400e;
  font-size: 12px;
  font-weight: 700;
}

.sed-turn-state {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 9px;
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 800;
}

.sed-turn-state--finalizado {
  background: #ecfdf5;
  color: #166534;
}

.sed-turn-state--ausente {
  background: #fef2f2;
  color: #b91c1c;
}

.sed-review-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: #c46a2c;
  padding: 6px 0;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.sed-review-link:hover {
  color: #e87936;
}

@media (max-width: 720px) {
  .sed-final-summary__head {
    flex-direction: column;
  }

  .sed-final-summary__metric {
    width: 100%;
  }
}

`;
