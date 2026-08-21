import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock3,
  GraduationCap,
  RefreshCw,
  Users,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../../auth/AuthContext';

type EstadoCurso =
  | 'ACTIVO'
  | 'INACTIVO'
  | 'FINALIZADO';

type CursoDocente = {
  id: number;
  gestion: string;
  paralelo: string;
  semestre: number;
  cupoMaximo: number | null;
  estado: EstadoCurso;

  codigoInscripcion:
    string | null;

  codigoInscripcionActivo:
    boolean;

  codigoExpiraEn:
    string | null;

  codigoVigente:
    boolean;

  estudiantesInscritos:
    number;

  cuposDisponibles:
    number | null;

  materia: {
    id: number;
    nombre: string;
    codigo: string;
  };
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

export default function DocenteInicio() {
  const navigate =
    useNavigate();

  const {
    accessToken,
    cerrarSesion,
    sesion,
  } = useAuth();

  const [
    cursos,
    setCursos,
  ] =
    useState<CursoDocente[]>(
      [],
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(
      true,
    );

  const [
    error,
    setError,
  ] =
    useState(
      '',
    );

  const cargarCursos =
    useCallback(
      async () => {
        if (!accessToken) {
          return;
        }

        try {
          setCargando(
            true,
          );

          setError(
            '',
          );

          const respuesta =
            await fetch(
              `${API_URL}/docente/cursos`,
              {
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                },
              },
            );

          if (
            respuesta.status ===
            401
          ) {
            cerrarSesion();

            throw new Error(
              'Tu sesión venció. Inicia sesión nuevamente.',
            );
          }

          if (!respuesta.ok) {
            throw new Error(
              'No fue posible cargar tus cursos.',
            );
          }

          const datos =
            await respuesta.json() as
              CursoDocente[];

          setCursos(
            datos,
          );
        } catch (
          problema
        ) {
          setError(
            problema instanceof Error
              ? problema.message
              : 'Ocurrió un error inesperado.',
          );
        } finally {
          setCargando(
            false,
          );
        }
      },
      [
        accessToken,
        cerrarSesion,
      ],
    );

  useEffect(
    () => {
      void cargarCursos();
    },
    [
      cargarCursos,
    ],
  );

  const resumen =
    useMemo(
      () => ({
        total:
          cursos.length,

        activos:
          cursos.filter(
            (
              curso,
            ) =>
              curso.estado ===
              'ACTIVO',
          ).length,

        estudiantes:
          cursos.reduce(
            (
              total,
              curso,
            ) =>
              total +
              curso.estudiantesInscritos,
            0,
          ),

        codigosVigentes:
          cursos.filter(
            (
              curso,
            ) =>
              curso.codigoVigente,
          ).length,
      }),
      [
        cursos,
      ],
    );

  const cursosActivos =
    cursos
      .filter(
        (
          curso,
        ) =>
          curso.estado ===
          'ACTIVO',
      )
      .slice(
        0,
        3,
      );

  return (
    <section className="docente-inicio">
      <header className="docente-hero">
        <div>
          <span className="docente-eyebrow">
            PANEL DOCENTE
          </span>

          <h1>
            Bienvenido,
            {' '}
            {sesion
              ?.usuario
              .nombres ??
            'docente'}
          </h1>

          <p>
            Administra tus cursos, códigos de inscripción y estudiantes desde un solo lugar.
          </p>
        </div>

        <button
          type="button"
          className="btn-refresh"
          onClick={() =>
            void cargarCursos()
          }
          disabled={
            cargando
          }
        >
          <RefreshCw
            size={18}
            className={
              cargando
                ? 'spin'
                : ''
            }
          />

          Actualizar
        </button>
      </header>

      {error && (
        <div className="error-card">
          {error}
        </div>
      )}

      <div className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon accent">
            <BookOpen
              size={22}
            />
          </div>

          <div>
            <strong>
              {cargando
                ? '—'
                : resumen.total}
            </strong>

            <span>
              Cursos asignados
            </span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon success">
            <CheckCircle2
              size={22}
            />
          </div>

          <div>
            <strong>
              {cargando
                ? '—'
                : resumen.activos}
            </strong>

            <span>
              Cursos activos
            </span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon purple">
            <Users
              size={22}
            />
          </div>

          <div>
            <strong>
              {cargando
                ? '—'
                : resumen.estudiantes}
            </strong>

            <span>
              Estudiantes inscritos
            </span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon warning">
            <Clock3
              size={22}
            />
          </div>

          <div>
            <strong>
              {cargando
                ? '—'
                : resumen.codigosVigentes}
            </strong>

            <span>
              Códigos vigentes
            </span>
          </div>
        </article>
      </div>

      <div className="inicio-grid">
        <article className="dashboard-card">
          <div className="card-header">
            <div>
              <span className="docente-eyebrow">
                ACTIVIDAD ACADÉMICA
              </span>

              <h2>
                Tus cursos activos
              </h2>
            </div>

            <button
              type="button"
              className="link-button"
              onClick={() =>
                navigate(
                  '/docente/cursos',
                )
              }
            >
              Ver todos
            </button>
          </div>

          {cargando ? (
            <div className="empty-state">
              Cargando cursos...
            </div>
          ) : cursosActivos.length ===
            0 ? (
            <div className="empty-state">
              Todavía no tienes cursos activos asignados.
            </div>
          ) : (
            <div className="course-list">
              {cursosActivos.map(
                (
                  curso,
                ) => (
                  <button
                    type="button"
                    className="course-item"
                    key={
                      curso.id
                    }
                    onClick={() =>
                      navigate(
                        `/docente/cursos/${curso.id}`,
                      )
                    }
                  >
                    <div className="course-icon">
                      <GraduationCap
                        size={20}
                      />
                    </div>

                    <div className="course-info">
                      <strong>
                        {curso
                          .materia
                          .nombre}
                      </strong>

                      <span>
                        {curso.gestion}
                        {' · '}
                        Paralelo
                        {' '}
                        {curso.paralelo}
                      </span>
                    </div>

                    <div className="course-count">
                      <Users
                        size={15}
                      />

                      {
                        curso
                          .estudiantesInscritos
                      }
                    </div>
                  </button>
                ),
              )}
            </div>
          )}
        </article>

        <article className="dashboard-card quick-card">
          <div className="card-header">
            <div>
              <span className="docente-eyebrow">
                ACCESOS RÁPIDOS
              </span>

              <h2>
                Gestiona tu espacio
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="quick-item"
            onClick={() =>
              navigate(
                '/docente/cursos',
              )
            }
          >
            <GraduationCap
              size={20}
            />

            <div>
              <strong>
                Mis cursos
              </strong>

              <span>
                Códigos, estudiantes y aulas
              </span>
            </div>
          </button>

          <button
            type="button"
            className="quick-item"
            onClick={() =>
              navigate(
                '/docente/calendario',
              )
            }
          >
            <CalendarClock
              size={20}
            />

            <div>
              <strong>
                Calendario
              </strong>

              <span>
                Próximamente
              </span>
            </div>
          </button>
        </article>
      </div>

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .docente-inicio {
    width:
      100%;

    min-width:
      0;

    padding:
      0
      34px
      28px;

    color:
      var(--app-text);
  }

  .docente-hero {
    display:
      flex;

    align-items:
      center;

    justify-content:
      space-between;

    gap:
      24px;

    margin-bottom:
      18px;

    padding:
      26px
      30px;

    border:
      1px solid
      var(--app-border);

    border-radius:
      26px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow);
  }

  .docente-eyebrow {
    color:
      var(--app-accent-dark);

    font-size:
      11px;

    font-weight:
      850;

    letter-spacing:
      .15em;

    text-transform:
      uppercase;
  }

  .docente-hero h1 {
    margin:
      6px
      0
      0;

    color:
      var(--app-text);

    font-size:
      30px;

    font-weight:
      900;
  }

  .docente-hero p {
    margin:
      7px
      0
      0;

    color:
      var(--app-text-soft);

    font-size:
      14px;
  }

  .btn-refresh,
  .link-button {
    display:
      inline-flex;

    align-items:
      center;

    justify-content:
      center;

    gap:
      8px;

    border-radius:
      999px;

    cursor:
      pointer;
  }

  .btn-refresh {
    min-height:
      42px;

    padding:
      10px
      17px;

    border:
      1px solid
      var(--app-border-strong);

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);

    font-weight:
      800;
  }

  .btn-refresh:disabled {
    opacity:
      .6;

    cursor:
      not-allowed;
  }

  .stats-grid {
    display:
      grid;

    grid-template-columns:
      repeat(
        4,
        minmax(
          0,
          1fr
        )
      );

    gap:
      14px;

    margin-bottom:
      18px;
  }

  .stat-card {
    display:
      flex;

    align-items:
      center;

    gap:
      14px;

    min-height:
      88px;

    padding:
      17px
      18px;

    border:
      1px solid
      var(--app-border);

    border-radius:
      21px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow-sm);
  }

  .stat-icon {
    width:
      48px;

    height:
      48px;

    display:
      grid;

    place-items:
      center;

    flex-shrink:
      0;

    border-radius:
      15px;
  }

  .stat-icon.accent {
    color:
      var(--app-accent);

    background:
      var(--app-accent-soft);
  }

  .stat-icon.success {
    color:
      var(--app-success);

    background:
      var(--app-success-bg);
  }

  .stat-icon.purple {
    color:
      var(--app-purple);

    background:
      var(--app-purple-bg);
  }

  .stat-icon.warning {
    color:
      var(--app-warning);

    background:
      var(--app-warning-bg);
  }

  .stat-card strong {
    display:
      block;

    color:
      var(--app-text);

    font-size:
      24px;

    font-weight:
      900;
  }

  .stat-card span {
    display:
      block;

    margin-top:
      5px;

    color:
      var(--app-text-soft);

    font-size:
      12px;
  }

  .inicio-grid {
    display:
      grid;

    grid-template-columns:
      minmax(
        0,
        1.65fr
      )
      minmax(
        280px,
        .8fr
      );

    gap:
      18px;
  }

  .dashboard-card {
    padding:
      22px
      24px;

    border:
      1px solid
      var(--app-border);

    border-radius:
      23px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow);
  }

  .card-header {
    display:
      flex;

    align-items:
      flex-start;

    justify-content:
      space-between;

    gap:
      16px;

    margin-bottom:
      18px;
  }

  .card-header h2 {
    margin:
      5px
      0
      0;

    color:
      var(--app-text);

    font-size:
      19px;

    font-weight:
      850;
  }

  .link-button {
    min-height:
      36px;

    padding:
      8px
      13px;

    border:
      1px solid
      var(--app-border);

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);

    font-size:
      12px;

    font-weight:
      800;
  }

  .course-list {
    display:
      grid;

    gap:
      10px;
  }

  .course-item,
  .quick-item {
    width:
      100%;

    display:
      flex;

    align-items:
      center;

    gap:
      12px;

    padding:
      13px
      14px;

    border:
      1px solid
      var(--app-border-soft);

    border-radius:
      16px;

    color:
      var(--app-text);

    background:
      var(--app-surface-alt);

    font-family:
      inherit;

    text-align:
      left;

    cursor:
      pointer;

    transition:
      border-color .18s ease,
      transform .18s ease;
  }

  .course-item:hover,
  .quick-item:hover {
    border-color:
      var(--app-border-strong);

    transform:
      translateY(-1px);
  }

  .course-icon {
    width:
      42px;

    height:
      42px;

    display:
      grid;

    place-items:
      center;

    flex-shrink:
      0;

    border-radius:
      13px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .course-info {
    min-width:
      0;

    flex:
      1;
  }

  .course-info strong,
  .quick-item strong {
    display:
      block;

    color:
      var(--app-text);

    font-size:
      13px;
  }

  .course-info span,
  .quick-item span {
    display:
      block;

    margin-top:
      4px;

    color:
      var(--app-text-soft);

    font-size:
      11px;
  }

  .course-count {
    display:
      inline-flex;

    align-items:
      center;

    gap:
      5px;

    color:
      var(--app-text-soft);

    font-size:
      12px;

    font-weight:
      800;
  }

  .quick-card {
    display:
      flex;

    flex-direction:
      column;

    gap:
      10px;
  }

  .quick-card
  .card-header {
    margin-bottom:
      4px;
  }

  .quick-item > svg {
    color:
      var(--app-accent);
  }

  .empty-state,
  .error-card {
    padding:
      20px;

    border-radius:
      16px;

    color:
      var(--app-text-soft);

    background:
      var(--app-surface-alt);
  }

  .error-card {
    margin-bottom:
      18px;

    border:
      1px solid
      var(--app-danger-border);

    color:
      var(--app-danger-strong);

    background:
      var(--app-danger-bg);
  }

  .spin {
    animation:
      docenteInicioSpin
      .8s
      linear
      infinite;
  }

  @keyframes docenteInicioSpin {
    to {
      transform:
        rotate(360deg);
    }
  }

  @media (
    max-width:
      1100px
  ) {
    .stats-grid {
      grid-template-columns:
        repeat(
          2,
          minmax(
            0,
            1fr
          )
        );
    }

    .inicio-grid {
      grid-template-columns:
        1fr;
    }
  }

  @media (
    max-width:
      760px
  ) {
    .docente-inicio {
      padding:
        0
        18px
        24px;
    }

    .docente-hero {
      align-items:
        stretch;

      flex-direction:
        column;
    }

    .btn-refresh {
      width:
        100%;
    }

    .stats-grid {
      grid-template-columns:
        1fr;
    }
  }
`;