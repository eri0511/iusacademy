import {
  CheckCircle2,
  Clock3,
  Gauge,
  MoreHorizontal,
  PlayCircle,
  Radio,
  Sparkles,
  Trash2,
  Trophy,
} from 'lucide-react';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import type {
  CSSProperties,
} from 'react';

import type {
  QuizCurso,
} from '../../types/quizzes/quizzes.types';

type Props = {
  quiz: QuizCurso;
  onAbrir: () => void;
  onEliminar?: () => void;
};

const estados = {
  BORRADOR: ['Borrador', '#64748b', '#f1f5f9'],
  ESPERANDO: ['Sala abierta', '#b45309', '#fff7ed'],
  CUENTA_REGRESIVA: ['Comenzando', '#7c3aed', '#f5f3ff'],
  EN_CURSO: ['En curso', '#15803d', '#ecfdf3'],
  PAUSADO: ['Pausado', '#0369a1', '#eff6ff'],
  FINALIZADO: ['Finalizado', '#475569', '#f8fafc'],
  CANCELADO: ['Cancelado', '#b91c1c', '#fef2f2'],
} as const;

export default function QuizCard({
  quiz,
  onAbrir,
  onEliminar,
}: Props) {
  const [
    menuAbierto,
    setMenuAbierto,
  ] =
    useState(
      false,
    );

  const menuRef =
    useRef<HTMLDivElement>(
      null,
    );

  useEffect(
    () => {
      if (
        !menuAbierto
      ) {
        return;
      }

      const manejarClickExterior =
        (
          evento:
            MouseEvent,
        ) => {
          if (
            menuRef.current &&
            !menuRef.current.contains(
              evento.target as Node,
            )
          ) {
            setMenuAbierto(
              false,
            );
          }
        };

      document.addEventListener(
        'mousedown',
        manejarClickExterior,
      );

      return () =>
        document.removeEventListener(
          'mousedown',
          manejarClickExterior,
        );
    },
    [
      menuAbierto,
    ],
  );

  const [
    etiquetaEstado,
    colorEstado,
    fondoEstado,
  ] = estados[quiz.estado];

  return (
    <article
      className="quiz-card"
      style={{
        '--quiz-estado': colorEstado,
        '--quiz-estado-fondo': fondoEstado,
      } as CSSProperties}
    >
      <div className="quiz-card__top">
        <div className="quiz-card__badges">
          {quiz.estado ===
            'FINALIZADO' && (
            <span
              className={
                quiz.resultadosPublicados
                  ? 'badge-notas badge-notas--publicadas'
                  : 'badge-notas badge-notas--no-publicadas'
              }
            >
              {quiz.resultadosPublicados ? (
                <CheckCircle2
                  size={
                    12
                  }
                />
              ) : (
                <Clock3
                  size={
                    12
                  }
                />
              )}

              {quiz.resultadosPublicados
                ? 'NOTAS PUBLICADAS'
                : 'NOTAS NO PUBLICADAS'}
            </span>
          )}
          <span className="estado">
            {etiquetaEstado}
          </span>

          <span className="hito">
            {quiz.hito.codigo}
          </span>

          <span className={quiz.esCalificable ? 'nota' : 'practica'}>
            {quiz.esCalificable
              ? quiz.componente === 'CONTINUA'
                ? 'Continua'
                : 'Procesual'
              : 'Práctica'}
          </span>
        </div>

        <div className="quiz-card__top-derecha">
          <span className="dificultad">
            <Gauge size={13} />
            {quiz.dificultad === 'MIXTA'
              ? 'Mixta'
              : quiz.dificultad.charAt(0) +
                quiz.dificultad
                  .slice(1)
                  .toLocaleLowerCase('es')}
          </span>

          {quiz.estado ===
            'BORRADOR' && (
            <div
              ref={
                menuRef
              }
              className="quiz-card__menu"
            >
              <button
                type="button"
                className="quiz-card__menu-trigger"
                aria-label="Opciones del Quiz"
                onClick={() =>
                  setMenuAbierto(
                    (
                      actual,
                    ) =>
                      !actual,
                  )
                }
              >
                <MoreHorizontal
                  size={
                    17
                  }
                />
              </button>

              {menuAbierto && (
                <div className="quiz-card__menu-panel">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAbierto(
                        false,
                      );

                      onAbrir();
                    }}
                  >
                    <PlayCircle
                      size={
                        14
                      }
                    />

                    Continuar edición
                  </button>

                  {onEliminar && (
                    <button
                      type="button"
                      className="eliminar"
                      onClick={() => {
                        setMenuAbierto(
                          false,
                        );

                        onEliminar();
                      }}
                    >
                      <Trash2
                        size={
                          14
                        }
                      />

                      Eliminar borrador
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="quiz-card__contenido">
        <span className="quiz-card__icono">
          <Sparkles size={22} />
        </span>

        <div>
          <h3>{quiz.titulo}</h3>
          <p>
            {quiz.descripcion ||
              'Evaluación breve basada en recursos jurídicos del curso.'}
          </p>
        </div>
      </div>

      <div className="quiz-card__meta">
        <span>
          <Radio size={14} />
          {quiz.modalidad === 'EN_VIVO'
            ? 'En vivo'
            : 'Programado'}
        </span>

        <span>
          <Clock3 size={14} />
          {quiz.modoTiempo === 'FIJO'
            ? `${quiz.tiempoPreguntaSegundos} s por pregunta`
            : 'Tiempo inteligente'}
        </span>

        {quiz.usarRanking && (
          <span>
            <Trophy size={14} />
            Ranking activo
          </span>
        )}
      </div>

      <div className="quiz-card__footer">
        <span>
          {quiz._count?.preguntas ??
            quiz.preguntas?.length ??
            quiz.cantidadPreguntas}{' '}
          preguntas
        </span>

        <button
          type="button"
          onClick={onAbrir}
        >
          <PlayCircle size={15} />
          {quiz.estado === 'BORRADOR'
            ? 'Continuar'
            : quiz.estado === 'FINALIZADO'
              ? 'Ver detalle'
              : 'Abrir sala'}
        </button>
      </div>

      <style>{styles}</style>
    </article>
  );
}

const styles = `
  .quiz-card {
    min-width: 0;
    display: grid;
    gap: 14px;
    padding: 16px;
    border: 1px solid var(--app-border);
    border-radius: 18px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
    transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease;
  }

  .quiz-card:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--quiz-estado) 22%, var(--app-border));
    box-shadow: 0 16px 34px rgba(15, 23, 42, .07);
  }

  .quiz-card__top,
  .quiz-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .quiz-card__badges,
  .quiz-card__meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .quiz-card__badges span,
  .dificultad {
    min-height: 24px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 8.5px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .badge-notas {
    min-height: 24px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px;
    border: 1px solid transparent;
    border-radius: 999px;
    font-size: 8.5px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .badge-notas--publicadas {
    color: var(--app-success);
    border-color:
      color-mix(
        in srgb,
        var(--app-success) 28%,
        var(--app-border)
      );
    background: var(--app-success-bg);
  }

  .badge-notas--no-publicadas {
    color: var(--app-danger);
    border-color:
      color-mix(
        in srgb,
        var(--app-danger) 28%,
        var(--app-border)
      );
    background: var(--app-danger-bg);
  }

  .estado {
    color: var(--quiz-estado);
    background: var(--quiz-estado-fondo);
  }

  .hito {
    color: #9a3412;
    background: #fff7ed;
  }

  .nota {
    color: #1d4ed8;
    background: #eff6ff;
  }

  .practica {
    color: #7c3aed;
    background: #f5f3ff;
  }

  .dificultad {
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
  }

  .quiz-card__top-derecha {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .quiz-card__menu {
    position: relative;
  }

  .quiz-card__menu-trigger {
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 1px solid var(--app-border);
    border-radius: 9px;
    color: var(--app-text-muted);
    background: var(--app-surface);
    cursor: pointer;
  }

  .quiz-card__menu-panel {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 40;
    width: 180px;
    display: grid;
    gap: 3px;
    padding: 5px;
    border: 1px solid var(--app-border);
    border-radius: 11px;
    background: var(--app-surface);
    box-shadow: 0 14px 34px rgba(15, 23, 42, .14);
  }

  .quiz-card__menu-panel button {
    width: 100%;
    min-height: 34px;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 8px;
    border: 0;
    border-radius: 8px;
    color: var(--app-text-secondary);
    background: transparent;
    font: inherit;
    font-size: 9px;
    font-weight: 800;
    text-align: left;
    cursor: pointer;
  }

  .quiz-card__menu-panel button:hover {
    background: var(--app-surface-alt);
  }

  .quiz-card__menu-panel button.eliminar {
    color: var(--app-danger);
  }

  .quiz-card__menu-panel button.eliminar:hover {
    background: var(--app-danger-bg);
  }

  .quiz-card__contenido {
    min-width: 0;
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    align-items: start;
    gap: 11px;
  }

  .quiz-card__icono {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .quiz-card h3 {
    margin: 0;
    color: var(--app-text);
    font-size: 14px;
    font-weight: 900;
  }

  .quiz-card p {
    margin: 5px 0 0;
    color: var(--app-text-muted);
    font-size: 10px;
    line-height: 1.45;
  }

  .quiz-card__meta {
    padding: 9px 0;
    border-top: 1px solid var(--app-border-soft);
    border-bottom: 1px solid var(--app-border-soft);
  }

  .quiz-card__meta span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--app-text-secondary);
    font-size: 9px;
  }

  .quiz-card__footer > span {
    color: var(--app-text-muted);
    font-size: 9px;
    font-weight: 750;
  }

  .quiz-card__footer button {
    min-height: 34px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-surface-alt);
    font: inherit;
    font-size: 9px;
    font-weight: 850;
    cursor: pointer;
  }
`;
