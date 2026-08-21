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
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleX,
  Clock3,
  GraduationCap,
  HelpCircle,
  KeyRound,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../../../auth/AuthContext';

type EstadoCurso =
  | 'ACTIVO'
  | 'INACTIVO'
  | 'FINALIZADO';

type FiltroEstado =
  | 'TODOS'
  | EstadoCurso;

type DocenteCurso = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  fotoPerfilUrl: string | null;
};

type MateriaCurso = {
  id: number;
  nombre: string;
  codigo: string;
  semestre: number;
  descripcion: string | null;
};

type CursoEstudiante = {
  inscripcionId: number;

  estadoInscripcion:
    | 'ACTIVA'
    | 'RETIRADA';

  inscritoEn: string;
  retiradoEn: string | null;

  id: number;
  gestion: string;
  paralelo: string;
  semestre: number;
  cupoMaximo: number | null;
  estado: EstadoCurso;
  finalizadoEn: string | null;
  creadoEn: string;
  actualizadoEn: string;

  materia:
    MateriaCurso;

  docente:
    DocenteCurso;

  estudiantesInscritos:
    number;

  cuposDisponibles:
    number | null;
};

type RespuestaMisCursos = {
  total: number;
  cursos: CursoEstudiante[];
};

type RespuestaInscripcion = {
  mensaje: string;

  inscripcion: {
    id: number;
    estado: string;
    inscritoEn: string;
  };

  curso: {
    id: number;
    gestion: string;
    paralelo: string;
    semestre: number;
    cupoMaximo: number | null;
    estado: EstadoCurso;
    materia: MateriaCurso;
    docente: DocenteCurso;
  };
};

type RespuestaError = {
  message?:
    | string
    | string[];

  mensaje?:
    string;

  error?:
    string;
};

type TipoToast =
  | 'exito'
  | 'error';

type ToastEstado = {
  visible: boolean;
  tipo: TipoToast;
  titulo: string;
  mensaje: string;
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

const CODIGO_PERMITIDO =
  /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]*$/;

function obtenerMensajeError(
  datos:
    RespuestaError,
  predeterminado:
    string,
): string {
  if (
    Array.isArray(
      datos.message,
    )
  ) {
    return datos.message.join(
      '. ',
    );
  }

  return (
    datos.message ??
    datos.mensaje ??
    datos.error ??
    predeterminado
  );
}

function obtenerPrimerNombre(
  nombres:
    string,
): string {
  return (
    nombres
      .trim()
      .split(/\s+/)
      .filter(Boolean)[0] ??
    nombres
  );
}

function construirNombreDocente(
  docente:
    DocenteCurso,
): string {
  const primerNombre =
    obtenerPrimerNombre(
      docente.nombres,
    );

  return `${primerNombre} ${docente.apellidoPaterno}`
    .trim();
}

function formatearFecha(
  fecha:
    string,
): string {
  return new Intl.DateTimeFormat(
    'es-BO',
    {
      dateStyle:
        'medium',
    },
  ).format(
    new Date(
      fecha,
    ),
  );
}

export default function MisCursosEstudiante() {
  const navigate =
    useNavigate();

  const {
    accessToken,
    cerrarSesion,
  } = useAuth();

  const [
    cursos,
    setCursos,
  ] =
    useState<CursoEstudiante[]>(
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
    inscribiendo,
    setInscribiendo,
  ] =
    useState(
      false,
    );

  const [
    codigo,
    setCodigo,
  ] =
    useState(
      '',
    );

  const [
    busqueda,
    setBusqueda,
  ] =
    useState(
      '',
    );

  const [
    filtroEstado,
    setFiltroEstado,
  ] =
    useState<FiltroEstado>(
      'ACTIVO',
    );

  const [
    modalCodigoAbierto,
    setModalCodigoAbierto,
  ] =
    useState(
      false,
    );

  const [
    toast,
    setToast,
  ] =
    useState<ToastEstado>({
      visible:
        false,

      tipo:
        'exito',

      titulo:
        '',

      mensaje:
        '',
    });

  const mostrarToast =
    useCallback(
      (
        tipo:
          TipoToast,

        titulo:
          string,

        mensaje:
          string,
      ) => {
        setToast({
          visible:
            true,

          tipo,

          titulo,

          mensaje,
        });
      },
      [],
    );

  const cerrarToast =
    useCallback(
      () => {
        setToast(
          (
            anterior,
          ) => ({
            ...anterior,

            visible:
              false,
          }),
        );
      },
      [],
    );

  const manejarSesionVencida =
    useCallback(
      (
        respuesta:
          Response,
      ) => {
        if (
          respuesta.status !==
          401
        ) {
          return;
        }

        cerrarSesion();

        navigate(
          '/login',
          {
            replace:
              true,
          },
        );

        throw new Error(
          'Tu sesión venció. Inicia sesión nuevamente.',
        );
      },
      [
        cerrarSesion,
        navigate,
      ],
    );

  const cargarCursos =
    useCallback(
      async (
        mostrarError =
          true,
      ) => {
        if (!accessToken) {
          setCargando(
            false,
          );

          return;
        }

        try {
          setCargando(
            true,
          );

          const respuesta =
            await fetch(
              `${API_URL}/estudiante/cursos`,
              {
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                },
              },
            );

          manejarSesionVencida(
            respuesta,
          );

          const datos =
            await respuesta
              .json()
              .catch(
                () => ({}),
              );

          if (!respuesta.ok) {
            throw new Error(
              obtenerMensajeError(
                datos as
                  RespuestaError,

                'No fue posible cargar tus cursos.',
              ),
            );
          }

          const resultado =
            datos as
              RespuestaMisCursos;

          setCursos(
            Array.isArray(
              resultado.cursos,
            )
              ? resultado.cursos
              : [],
          );
        } catch (
          error
        ) {
          if (mostrarError) {
            mostrarToast(
              'error',

              'No se pudieron cargar los cursos',

              error instanceof Error
                ? error.message
                : 'Ocurrió un error inesperado.',
            );
          }
        } finally {
          setCargando(
            false,
          );
        }
      },
      [
        accessToken,
        manejarSesionVencida,
        mostrarToast,
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

  const manejarCodigo =
    (
      valor:
        string,
    ) => {
      const normalizado =
        valor
          .trim()
          .toUpperCase()
          .slice(
            0,
            6,
          );

      if (
        CODIGO_PERMITIDO.test(
          normalizado,
        )
      ) {
        setCodigo(
          normalizado,
        );
      }
    };

  const inscribirseCurso =
    async () => {
      if (!accessToken) {
        return;
      }

      if (
        codigo.length !==
        6
      ) {
        mostrarToast(
          'error',

          'Código incompleto',

          'El código de inscripción debe tener exactamente 6 caracteres.',
        );

        return;
      }

      try {
        setInscribiendo(
          true,
        );

        const respuesta =
          await fetch(
            `${API_URL}/estudiante/cursos/inscribirse`,
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${accessToken}`,
              },

              body:
                JSON.stringify({
                  codigo,
                }),
            },
          );

        manejarSesionVencida(
          respuesta,
        );

        const datos =
          await respuesta
            .json()
            .catch(
              () => ({}),
            );

        if (!respuesta.ok) {
          throw new Error(
            obtenerMensajeError(
              datos as
                RespuestaError,

              'No fue posible inscribirte al curso.',
            ),
          );
        }

        const resultado =
          datos as
            RespuestaInscripcion;

        setCodigo(
          '',
        );

        setFiltroEstado(
          'ACTIVO',
        );

        mostrarToast(
          'exito',

          'Inscripción completada',

          resultado.mensaje ||
            'Te inscribiste al curso correctamente.',
        );

        await cargarCursos(
          false,
        );
      } catch (
        error
      ) {
        mostrarToast(
          'error',

          'No se pudo completar la inscripción',

          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado.',
        );
      } finally {
        setInscribiendo(
          false,
        );
      }
    };

  const resumen =
    useMemo(
      () => {
        const docentes =
          new Set(
            cursos.map(
              (
                curso,
              ) =>
                curso.docente.id,
            ),
          );

        return {
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

          docentes:
            docentes.size,

          finalizados:
            cursos.filter(
              (
                curso,
              ) =>
                curso.estado ===
                'FINALIZADO',
            ).length,
        };
      },
      [
        cursos,
      ],
    );

  const cursosFiltrados =
    useMemo(
      () => {
        const texto =
          busqueda
            .trim()
            .toLowerCase();

        return cursos.filter(
          (
            curso,
          ) => {
            const coincideEstado =
              filtroEstado ===
                'TODOS' ||
              curso.estado ===
                filtroEstado;

            const nombreDocente =
              construirNombreDocente(
                curso.docente,
              )
                .toLowerCase();

            const coincideBusqueda =
              !texto ||
              curso.materia.nombre
                .toLowerCase()
                .includes(
                  texto,
                ) ||
              curso.materia.codigo
                .toLowerCase()
                .includes(
                  texto,
                ) ||
              curso.gestion
                .toLowerCase()
                .includes(
                  texto,
                ) ||
              curso.paralelo
                .toLowerCase()
                .includes(
                  texto,
                ) ||
              nombreDocente.includes(
                texto,
              );

            return (
              coincideEstado &&
              coincideBusqueda
            );
          },
        );
      },
      [
        cursos,
        busqueda,
        filtroEstado,
      ],
    );

  const limpiarFiltros =
    () => {
      setBusqueda(
        '',
      );

      setFiltroEstado(
        'ACTIVO',
      );
    };

  return (
    <main className="estudiante-cursos-page">
      {toast.visible && (
        <Toast
          tipo={
            toast.tipo
          }
          titulo={
            toast.titulo
          }
          mensaje={
            toast.mensaje
          }
          onCerrar={
            cerrarToast
          }
        />
      )}

      <header className="estudiante-cursos-header">
        <div className="estudiante-cursos-header__content">
          <div className="estudiante-cursos-header__icon">
            <GraduationCap
              size={27}
            />
          </div>

          <div>
            <span className="estudiante-eyebrow">
              Espacio académico
            </span>

            <h1>
              Mis cursos
            </h1>

            <p>
              Inscríbete mediante un código y continúa tu formación jurídica.
            </p>

            <div className="estudiante-header-meta">
              <span>
                Área civil
              </span>

              <span>
                Aprendizaje práctico
              </span>

              <span>
                Aula virtual
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-actualizar"
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

      <section className="summary-grid">
        <Resumen
          icono={
            <BookOpen
              size={21}
            />
          }
          cantidad={
            resumen.total
          }
          titulo="Cursos inscritos"
          clase="total"
        />

        <Resumen
          icono={
            <CheckCircle2
              size={21}
            />
          }
          cantidad={
            resumen.activos
          }
          titulo="Cursos activos"
          clase="activos"
        />

        <Resumen
          icono={
            <UserRound
              size={21}
            />
          }
          cantidad={
            resumen.docentes
          }
          titulo="Docentes"
          clase="docentes"
        />

        <Resumen
          icono={
            <Clock3
              size={21}
            />
          }
          cantidad={
            resumen.finalizados
          }
          titulo="Cursos finalizados"
          clase="finalizados"
        />
      </section>

      <section className="enrollment-card">
        <div className="enrollment-card__intro">
          <div className="enrollment-card__icon">
            <KeyRound
              size={24}
            />
          </div>

          <div>
            <span className="section-eyebrow">
              Inscripción
            </span>

            <h2>
              Inscribirme a un curso
            </h2>

            <p>
              Ingresa el código de seis caracteres proporcionado por tu docente.
            </p>
          </div>
        </div>

        <div className="enrollment-card__form">
          <label
            htmlFor="codigoCurso"
          >
            Código de inscripción
          </label>

          <div className="code-input-wrapper">
            <KeyRound
              size={18}
            />

            <input
              id="codigoCurso"
              type="text"
              value={
                codigo
              }
              maxLength={6}
              autoComplete="off"
              spellCheck={false}
              placeholder="ABC123"
              disabled={
                inscribiendo
              }
              onChange={(
                evento,
              ) =>
                manejarCodigo(
                  evento.target.value,
                )
              }
              onKeyDown={(
                evento,
              ) => {
                if (
                  evento.key ===
                  'Enter'
                ) {
                  evento.preventDefault();

                  void inscribirseCurso();
                }
              }}
            />

            <span className="code-counter">
              {codigo.length}/6
            </span>
          </div>

          <button
            type="button"
            className="btn-inscribirse"
            disabled={
              inscribiendo ||
              codigo.length !==
                6
            }
            onClick={() =>
              void inscribirseCurso()
            }
          >
            {inscribiendo ? (
              <>
                <span className="button-spinner" />

                Inscribiendo...
              </>
            ) : (
              <>
                Inscribirme

                <ArrowRight
                  size={18}
                />
              </>
            )}
          </button>

          <button
            type="button"
            className="btn-code-help"
            onClick={() =>
              setModalCodigoAbierto(
                true,
              )
            }
          >
            <HelpCircle
              size={17}
            />

            ¿Cómo funciona el código?
          </button>
        </div>
      </section>

      <section className="courses-control-card">
        <div className="courses-control-card__top">
          <div>
            <span className="section-eyebrow">
              Mis aulas
            </span>

            <h2>
              Cursos inscritos
            </h2>

            <p>
              Accede a las materias en las que tienes una inscripción activa.
            </p>
          </div>

          <div className="results-summary">
            <strong>
              {cursosFiltrados.length}
            </strong>

            <span>
              resultados
            </span>
          </div>
        </div>

        <div className="filters-row">
          <div className="state-filters">
            <button
              type="button"
              className={
                filtroEstado ===
                'ACTIVO'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFiltroEstado(
                  'ACTIVO',
                )
              }
            >
              Activos

              <span>
                {resumen.activos}
              </span>
            </button>

            <button
              type="button"
              className={
                filtroEstado ===
                'FINALIZADO'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFiltroEstado(
                  'FINALIZADO',
                )
              }
            >
              Finalizados

              <span>
                {resumen.finalizados}
              </span>
            </button>

            <button
              type="button"
              className={
                filtroEstado ===
                'TODOS'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFiltroEstado(
                  'TODOS',
                )
              }
            >
              Todos

              <span>
                {resumen.total}
              </span>
            </button>
          </div>

          <div className="search-box">
            <Search
              size={17}
            />

            <input
              type="search"
              value={
                busqueda
              }
              placeholder="Buscar por materia, docente, código o gestión..."
              onChange={(
                evento,
              ) =>
                setBusqueda(
                  evento.target.value,
                )
              }
            />

            {(
              busqueda ||
              filtroEstado !==
                'ACTIVO'
            ) && (
              <button
                type="button"
                title="Limpiar filtros"
                onClick={
                  limpiarFiltros
                }
              >
                <X
                  size={15}
                />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="courses-content">
        {cargando ? (
          <CursosSkeleton />
        ) : cursosFiltrados.length ===
          0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <GraduationCap
                size={37}
              />
            </div>

            <strong>
              {cursos.length ===
              0
                ? 'Todavía no tienes cursos inscritos'
                : 'No encontramos cursos con esos filtros'}
            </strong>

            <p>
              {cursos.length ===
              0
                ? 'Solicita el código de inscripción a tu docente e ingrésalo en el formulario superior.'
                : 'Prueba con otra búsqueda o restablece los filtros.'}
            </p>

            {cursos.length >
              0 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={
                  limpiarFiltros
                }
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="courses-grid">
            {cursosFiltrados.map(
              (
                curso,
              ) => (
                <article
                  className="course-card"
                  key={
                    curso.inscripcionId
                  }
                >
                  <div className="course-card__accent" />

                  <div className="course-card__top">
                    <div className="course-icon">
                      <BookOpen
                        size={22}
                      />
                    </div>

                    <span
                      className={`status-badge ${curso.estado.toLowerCase()}`}
                    >
                      <span className="status-dot" />

                      {curso.estado}
                    </span>
                  </div>

                  <span className="course-code">
                    {curso.materia.codigo}
                  </span>

                  <h3>
                    {curso.materia.nombre}
                  </h3>

                  <p className="course-description">
                    {curso.materia.descripcion ||
                      'Curso académico del área jurídica civil.'}
                  </p>

                  <div className="course-data">
                    <div>
                      <UserRound
                        size={16}
                      />

                      <span>
                        Docente
                      </span>

                      <strong>
                        {construirNombreDocente(
                          curso.docente,
                        )}
                      </strong>
                    </div>

                    <div>
                      <GraduationCap
                        size={16}
                      />

                      <span>
                        Gestión
                      </span>

                      <strong>
                        {curso.gestion}
                        {' · '}
                        Paralelo
                        {' '}
                        {curso.paralelo}
                      </strong>
                    </div>

                    <div>
                      <Users
                        size={16}
                      />

                      <span>
                        Estudiantes
                      </span>

                      <strong>
                        {curso.estudiantesInscritos}
                        {curso.cupoMaximo !==
                        null
                          ? ` de ${curso.cupoMaximo}`
                          : ''}
                      </strong>
                    </div>

                    <div>
                      <Clock3
                        size={16}
                      />

                      <span>
                        Inscripción
                      </span>

                      <strong>
                        {formatearFecha(
                          curso.inscritoEn,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="course-card__footer">
                    <span className="semester-badge">
                      {curso.semestre}.º semestre
                    </span>

                    <div className="course-card__actions">
                      <button
                        type="button"
                        className="btn-course-forum"
                        disabled={
                          curso.estado ===
                          'INACTIVO'
                        }
                        onClick={() =>
                          navigate(
                            `/estudiante/cursos/${curso.id}/foro`,
                          )
                        }
                      >
                        <MessageSquare
                          size={16}
                        />

                        Foro
                      </button>

                      <button
                        type="button"
                        className="btn-enter-course"
                        disabled={
                          curso.estado ===
                          'INACTIVO'
                        }
                        onClick={() =>
                          navigate(
                            `/estudiante/cursos/${curso.id}`,
                          )
                        }
                      >
                        Entrar al aula

                        <ArrowRight
                          size={17}
                        />
                      </button>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>

      {modalCodigoAbierto && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() =>
            setModalCodigoAbierto(
              false,
            )
          }
        >
          <div
            className="code-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="codigo-estudiante-titulo"
            onMouseDown={(
              evento,
            ) =>
              evento.stopPropagation()
            }
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Cerrar explicación"
              onClick={() =>
                setModalCodigoAbierto(
                  false,
                )
              }
            >
              <X
                size={18}
              />
            </button>

            <div className="code-modal__icon">
              <KeyRound
                size={27}
              />
            </div>

            <span className="modal-eyebrow">
              Inscripción segura
            </span>

            <h3 id="codigo-estudiante-titulo">
              ¿Cómo funciona el código?
            </h3>

            <p className="modal-intro">
              El código conecta tu cuenta con el curso correcto y evita inscripciones no autorizadas.
            </p>

            <div className="code-steps">
              <div>
                <span>
                  1
                </span>

                <div>
                  <strong>
                    Solicita el código
                  </strong>

                  <p>
                    Tu docente genera un código único de seis caracteres para el curso.
                  </p>
                </div>
              </div>

              <div>
                <span>
                  2
                </span>

                <div>
                  <strong>
                    Ingresa el código
                  </strong>

                  <p>
                    Escríbelo en el formulario respetando sus letras y números.
                  </p>
                </div>
              </div>

              <div>
                <span>
                  3
                </span>

                <div>
                  <strong>
                    Accede al aula
                  </strong>

                  <p>
                    Después de inscribirte, el curso aparecerá automáticamente en esta página.
                  </p>
                </div>
              </div>
            </div>

            <div className="code-warning">
              <ShieldCheck
                size={20}
              />

              <div>
                <strong>
                  Ten en cuenta
                </strong>

                <span>
                  El código puede expirar o ser desactivado. Una vez inscrito correctamente, no necesitas volver a ingresarlo.
                </span>
              </div>
            </div>

            <button
              type="button"
              className="modal-primary"
              onClick={() =>
                setModalCodigoAbierto(
                  false,
                )
              }
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <style>
        {styles}
      </style>
    </main>
  );
}

function Resumen({
  icono,
  cantidad,
  titulo,
  clase,
}: {
  icono:
    ReactNode;

  cantidad:
    number;

  titulo:
    string;

  clase:
    string;
}) {
  return (
    <article className="summary-card">
      <div
        className={`summary-icon ${clase}`}
      >
        {icono}
      </div>

      <div>
        <strong>
          {cantidad}
        </strong>

        <span>
          {titulo}
        </span>
      </div>
    </article>
  );
}

function CursosSkeleton() {
  return (
    <div className="courses-grid">
      {Array.from({
        length:
          4,
      }).map(
        (
          _,
          indice,
        ) => (
          <article
            className="course-card skeleton-card"
            key={
              indice
            }
          >
            <div className="skeleton skeleton-icon" />

            <div className="skeleton skeleton-line skeleton-line--small" />

            <div className="skeleton skeleton-line skeleton-line--title" />

            <div className="skeleton skeleton-line" />

            <div className="skeleton skeleton-line" />

            <div className="skeleton-grid">
              <div className="skeleton skeleton-box" />

              <div className="skeleton skeleton-box" />

              <div className="skeleton skeleton-box" />

              <div className="skeleton skeleton-box" />
            </div>

            <div className="skeleton skeleton-button" />
          </article>
        ),
      )}
    </div>
  );
}

function Toast({
  tipo,
  titulo,
  mensaje,
  onCerrar,
}: {
  tipo:
    TipoToast;

  titulo:
    string;

  mensaje:
    string;

  onCerrar:
    () => void;
}) {
  useEffect(
    () => {
      const temporizador =
        window.setTimeout(
          onCerrar,
          5000,
        );

      return () => {
        window.clearTimeout(
          temporizador,
        );
      };
    },
    [
      onCerrar,
    ],
  );

  return (
    <div
      className={`student-toast ${tipo}`}
      role="status"
    >
      <div className="student-toast__icon">
        {tipo ===
        'exito' ? (
          <CheckCircle2
            size={22}
          />
        ) : (
          <CircleX
            size={22}
          />
        )}
      </div>

      <div className="student-toast__content">
        <strong>
          {titulo}
        </strong>

        <p>
          {mensaje}
        </p>
      </div>

      <button
        type="button"
        aria-label="Cerrar notificación"
        onClick={
          onCerrar
        }
      >
        <X
          size={16}
        />
      </button>

      <div className="student-toast__progress" />
    </div>
  );
}

const styles = `
  .estudiante-cursos-page {
    width:
      100%;

    min-width:
      0;

    padding:
      0
      34px
      50px;

    color:
      var(--app-text);
  }

  .estudiante-cursos-header {
    position:
      relative;

    display:
      flex;

    align-items:
      center;

    justify-content:
      space-between;

    gap:
      28px;

    margin-bottom:
      22px;

    padding:
      27px
      30px;

    overflow:
      hidden;

    border:
      1px solid
      var(--app-border);

    border-radius:
      26px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow),
      inset 0 1px 0
      color-mix(
        in srgb,
        var(--app-surface-raised)
        72%,
        transparent
      );
  }

  .estudiante-cursos-header::before {
    content:
      "";

    position:
      absolute;

    inset:
      0
      auto
      0
      0;

    width:
      5px;

    background:
      var(--app-accent);
  }

  .estudiante-cursos-header::after {
    content:
      "";

    position:
      absolute;

    top:
      -100px;

    right:
      -55px;

    width:
      270px;

    height:
      230px;

    border-radius:
      50%;

    background:
      radial-gradient(
        circle,
        var(--app-accent-softer),
        transparent 70%
      );

    pointer-events:
      none;
  }

  .estudiante-cursos-header__content {
    position:
      relative;

    z-index:
      1;

    display:
      flex;

    align-items:
      center;

    gap:
      17px;
  }

  .estudiante-cursos-header__icon {
    width:
      58px;

    height:
      58px;

    display:
      grid;

    place-items:
      center;

    flex-shrink:
      0;

    border:
      1px solid
      var(--app-border-strong);

    border-radius:
      18px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);

    box-shadow:
      var(--app-shadow-sm);
  }

  .estudiante-eyebrow,
  .section-eyebrow,
  .modal-eyebrow {
    display:
      block;

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

  .estudiante-cursos-header h1 {
    margin:
      5px
      0
      0;

    color:
      var(--app-text);

    font-size:
      31px;

    font-weight:
      900;

    letter-spacing:
      -.025em;
  }

  .estudiante-cursos-header p {
    margin:
      6px
      0
      0;

    color:
      var(--app-text-soft);

    font-size:
      14px;
  }

  .estudiante-header-meta {
    display:
      flex;

    flex-wrap:
      wrap;

    gap:
      7px;

    margin-top:
      12px;
  }

  .estudiante-header-meta span {
    padding:
      5px
      9px;

    border:
      1px solid
      var(--app-warning-border);

    border-radius:
      999px;

    color:
      var(--app-warning-strong);

    background:
      var(--app-warning-bg);

    font-size:
      10px;

    font-weight:
      750;
  }

  .btn-actualizar {
    position:
      relative;

    z-index:
      1;

    min-height:
      45px;

    display:
      inline-flex;

    align-items:
      center;

    justify-content:
      center;

    gap:
      8px;

    padding:
      12px
      20px;

    border:
      none;

    border-radius:
      999px;

    color:
      #ffffff;

    background:
      linear-gradient(
        135deg,
        var(--app-accent),
        var(--app-accent-hover)
      );

    box-shadow:
      0
      14px
      32px
      color-mix(
        in srgb,
        var(--app-accent)
        28%,
        transparent
      );

    font-weight:
      800;

    cursor:
      pointer;
  }

  .btn-actualizar:disabled {
    opacity:
      .58;

    cursor:
      not-allowed;
  }

  .summary-grid {
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
      16px;

    margin-bottom:
      22px;
  }

  .summary-card {
    position:
      relative;

    min-height:
      88px;

    display:
      flex;

    align-items:
      center;

    gap:
      14px;

    padding:
      18px
      20px;

    overflow:
      hidden;

    border:
      1px solid
      var(--app-border);

    border-radius:
      21px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow-sm);

    transition:
      transform .2s ease,
      box-shadow .2s ease,
      border-color .2s ease;
  }

  .summary-card::after {
    content:
      "";

    position:
      absolute;

    top:
      0;

    right:
      0;

    width:
      76px;

    height:
      76px;

    border-radius:
      0
      0
      0
      100%;

    background:
      var(--app-accent-softer);

    opacity:
      .5;
  }

  .summary-card:hover {
    transform:
      translateY(-3px);

    border-color:
      var(--app-border-strong);

    box-shadow:
      var(--app-shadow-lg);
  }

  .summary-icon {
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

  .summary-icon.total {
    color:
      var(--app-accent);

    background:
      var(--app-accent-soft);
  }

  .summary-icon.activos {
    color:
      var(--app-success);

    background:
      var(--app-success-bg);
  }

  .summary-icon.docentes {
    color:
      var(--app-purple);

    background:
      var(--app-purple-bg);
  }

  .summary-icon.finalizados {
    color:
      var(--app-warning);

    background:
      var(--app-warning-bg);
  }

  .summary-card strong {
    display:
      block;

    color:
      var(--app-text);

    font-size:
      24px;

    font-weight:
      900;

    line-height:
      1;
  }

  .summary-card span {
    display:
      block;

    margin-top:
      6px;

    color:
      var(--app-text-soft);

    font-size:
      12px;

    font-weight:
      650;
  }

  .enrollment-card {
    display:
      grid;

    grid-template-columns:
      minmax(
        260px,
        .85fr
      )
      minmax(
        420px,
        1.4fr
      );

    gap:
      30px;

    align-items:
      center;

    margin-bottom:
      22px;

    padding:
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

  .enrollment-card__intro {
    display:
      flex;

    align-items:
      center;

    gap:
      14px;
  }

  .enrollment-card__icon {
    width:
      52px;

    height:
      52px;

    display:
      grid;

    place-items:
      center;

    flex-shrink:
      0;

    border-radius:
      16px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .enrollment-card h2,
  .courses-control-card h2 {
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

  .enrollment-card p,
  .courses-control-card p {
    margin:
      5px
      0
      0;

    color:
      var(--app-text-soft);

    font-size:
      12px;

    line-height:
      1.5;
  }

  .enrollment-card__form {
    display:
      grid;

    grid-template-columns:
      minmax(
        180px,
        1fr
      )
      auto
      auto;

    align-items:
      end;

    gap:
      10px;
  }

  .enrollment-card__form > label {
    grid-column:
      1
      /
      -1;

    color:
      var(--app-text-soft);

    font-size:
      10px;

    font-weight:
      800;

    text-transform:
      uppercase;
  }

  .code-input-wrapper {
    min-height:
      44px;

    display:
      flex;

    align-items:
      center;

    gap:
      10px;

    padding:
      0
      13px;

    border:
      1px solid
      var(--app-input-border);

    border-radius:
      14px;

    color:
      var(--app-text-muted);

    background:
      var(--app-input-bg);

    transition:
      border-color .18s ease,
      box-shadow .18s ease;
  }

  .code-input-wrapper:focus-within {
    border-color:
      var(--app-accent);

    box-shadow:
      0
      0
      0
      4px
      var(--app-input-ring);
  }

  .code-input-wrapper input {
    width:
      100%;

    min-width:
      0;

    border:
      none;

    outline:
      none;

    color:
      var(--app-accent-dark);

    background:
      transparent;

    font-size:
      17px;

    font-weight:
      900;

    letter-spacing:
      .14em;

    text-transform:
      uppercase;
  }

  .code-input-wrapper input::placeholder {
    color:
      var(--app-text-muted);

    opacity:
      .55;
  }

  .code-counter {
    flex-shrink:
      0;

    color:
      var(--app-text-muted);

    font-size:
      9px;

    font-weight:
      700;
  }

  .btn-inscribirse,
  .btn-code-help,
  .btn-secondary,
  .btn-course-forum,
  .btn-enter-course,
  .modal-primary {
    min-height:
      44px;

    display:
      inline-flex;

    align-items:
      center;

    justify-content:
      center;

    gap:
      7px;

    padding:
      10px
      16px;

    border-radius:
      13px;

    font-family:
      inherit;

    font-size:
      11px;

    font-weight:
      800;

    cursor:
      pointer;
  }

  .btn-inscribirse,
  .btn-enter-course,
  .modal-primary {
    border:
      none;

    color:
      #ffffff;

    background:
      linear-gradient(
        135deg,
        var(--app-accent),
        var(--app-accent-hover)
      );
  }

  .btn-inscribirse:disabled,
  .btn-enter-course:disabled {
    opacity:
      .5;

    cursor:
      not-allowed;
  }

  .btn-code-help,
  .btn-secondary {
    border:
      1px solid
      var(--app-border-strong);

    color:
      var(--app-accent-dark);

    background:
      transparent;
  }

  .button-spinner {
    width:
      16px;

    height:
      16px;

    border:
      2px solid
      rgba(
        255,
        255,
        255,
        .45
      );

    border-top-color:
      #ffffff;

    border-radius:
      50%;

    animation:
      spin
      .75s
      linear
      infinite;
  }

  .courses-control-card {
    margin-bottom:
      22px;

    padding:
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

  .courses-control-card__top {
    display:
      flex;

    align-items:
      flex-start;

    justify-content:
      space-between;

    gap:
      20px;
  }

  .results-summary {
    min-width:
      78px;

    padding:
      8px
      12px;

    border-radius:
      14px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);

    text-align:
      center;
  }

  .results-summary strong {
    display:
      block;

    font-size:
      18px;

    line-height:
      1;
  }

  .results-summary span {
    display:
      block;

    margin-top:
      4px;

    font-size:
      9px;
  }

  .filters-row {
    display:
      grid;

    grid-template-columns:
      auto
      minmax(
        260px,
        1fr
      );

    gap:
      15px;

    align-items:
      center;

    margin-top:
      18px;
  }

  .state-filters {
    display:
      flex;

    flex-wrap:
      wrap;

    gap:
      8px;
  }

  .state-filters button {
    display:
      inline-flex;

    align-items:
      center;

    gap:
      7px;

    padding:
      8px
      13px;

    border:
      1px solid
      var(--app-input-border);

    border-radius:
      999px;

    color:
      var(--app-text-soft);

    background:
      var(--app-surface);

    font-size:
      11px;

    font-weight:
      750;

    cursor:
      pointer;
  }

  .state-filters button.active {
    border-color:
      var(--app-accent);

    color:
      var(--app-accent-dark);

    background:
      linear-gradient(
        135deg,
        var(--app-accent-soft),
        var(--app-accent-softer)
      );
  }

  .state-filters button span {
    min-width:
      21px;

    height:
      21px;

    display:
      grid;

    place-items:
      center;

    padding:
      0
      6px;

    border-radius:
      999px;

    background:
      var(--app-accent-softer);

    font-size:
      9px;
  }

  .search-box {
    min-height:
      43px;

    display:
      flex;

    align-items:
      center;

    gap:
      9px;

    padding:
      0
      13px;

    border:
      1px solid
      var(--app-input-border);

    border-radius:
      14px;

    color:
      var(--app-text-muted);

    background:
      var(--app-input-bg);
  }

  .search-box:focus-within {
    border-color:
      var(--app-accent);

    box-shadow:
      0
      0
      0
      4px
      var(--app-input-ring);
  }

  .search-box input {
    width:
      100%;

    min-width:
      0;

    border:
      none;

    outline:
      none;

    color:
      var(--app-text-secondary);

    background:
      transparent;
  }

  .search-box button {
    width:
      31px;

    height:
      31px;

    display:
      grid;

    place-items:
      center;

    flex-shrink:
      0;

    border:
      none;

    border-radius:
      9px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);

    cursor:
      pointer;
  }

  .courses-grid {
    display:
      grid;

    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );

    gap:
      16px;
  }

  .course-card {
    position:
      relative;

    padding:
      20px;

    overflow:
      hidden;

    border:
      1px solid
      var(--app-border);

    border-radius:
      22px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow);

    transition:
      transform .2s ease,
      border-color .2s ease,
      box-shadow .2s ease;
  }

  .course-card:hover {
    transform:
      translateY(-3px);

    border-color:
      var(--app-border-strong);

    box-shadow:
      var(--app-shadow-lg);
  }

  .course-card__accent {
    position:
      absolute;

    inset:
      0
      auto
      0
      0;

    width:
      4px;

    background:
      var(--app-accent);
  }

  .course-card__top {
    display:
      flex;

    align-items:
      center;

    justify-content:
      space-between;

    gap:
      12px;
  }

  .course-icon {
    width:
      46px;

    height:
      46px;

    display:
      grid;

    place-items:
      center;

    border-radius:
      14px;

    color:
      var(--app-accent-dark);

    background:
      linear-gradient(
        135deg,
        var(--app-accent-soft),
        var(--app-surface-alt)
      );

    box-shadow:
      var(--app-shadow-sm);
  }

  .status-badge {
    display:
      inline-flex;

    align-items:
      center;

    gap:
      5px;

    padding:
      6px
      9px;

    border-radius:
      999px;

    font-size:
      9px;

    font-weight:
      850;
  }

  .status-badge.activo {
    color:
      var(--app-success);

    background:
      var(--app-success-bg);
  }

  .status-badge.inactivo {
    color:
      var(--app-text-muted);

    background:
      var(--app-surface-disabled);
  }

  .status-badge.finalizado {
    color:
      var(--app-purple);

    background:
      var(--app-purple-bg);
  }

  .status-dot {
    width:
      6px;

    height:
      6px;

    border-radius:
      50%;

    background:
      currentColor;
  }

  .course-code {
    display:
      block;

    margin-top:
      16px;

    color:
      var(--app-accent-dark);

    font-size:
      10px;

    font-weight:
      850;

    letter-spacing:
      .11em;

    text-transform:
      uppercase;
  }

  .course-card h3 {
    margin:
      5px
      0
      0;

    color:
      var(--app-text);

    font-size:
      18px;

    font-weight:
      850;
  }

  .course-description {
    min-height:
      36px;

    margin:
      7px
      0
      0;

    overflow:
      hidden;

    color:
      var(--app-text-soft);

    font-size:
      11px;

    line-height:
      1.55;

    display:
      -webkit-box;

    -webkit-box-orient:
      vertical;

    -webkit-line-clamp:
      2;
  }

  .course-data {
    display:
      grid;

    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );

    gap:
      9px;

    margin-top:
      17px;
  }

  .course-data > div {
    display:
      grid;

    grid-template-columns:
      27px
      minmax(
        0,
        1fr
      );

    align-items:
      center;

    column-gap:
      7px;

    padding:
      10px;

    border:
      1px solid
      var(--app-border-soft);

    border-radius:
      13px;

    background:
      var(--app-surface-alt);
  }

  .course-data svg {
    grid-row:
      1
      /
      3;

    color:
      var(--app-accent);
  }

  .course-data span {
    color:
      var(--app-text-muted);

    font-size:
      8px;

    font-weight:
      700;

    text-transform:
      uppercase;
  }

  .course-data strong {
    min-width:
      0;

    overflow:
      hidden;

    color:
      var(--app-text-secondary);

    font-size:
      10px;

    white-space:
      nowrap;

    text-overflow:
      ellipsis;
  }

  .course-card__footer {
    display:
      flex;

    align-items:
      center;

    justify-content:
      space-between;

    gap:
      12px;

    margin-top:
      17px;

    padding-top:
      15px;

    border-top:
      1px solid
      var(--app-border-soft);
  }

  .semester-badge {
    padding:
      6px
      9px;

    border-radius:
      999px;

    color:
      var(--app-text-soft);

    background:
      var(--app-surface-alt);

    font-size:
      9px;

    font-weight:
      750;
  }

  .course-card__actions {
    display:
      flex;

    align-items:
      center;

    gap:
      8px;
  }

  .btn-course-forum {
    min-height:
      38px;

    padding:
      9px
      13px;

    border:
      1px solid
      var(--app-border-strong);

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .btn-course-forum:hover:not(:disabled) {
    border-color:
      var(--app-accent);

    background:
      var(--app-accent-softer);
  }

  .btn-course-forum:disabled {
    opacity:
      .5;

    cursor:
      not-allowed;
  }

  .btn-enter-course {
    min-height:
      38px;

    padding:
      9px
      13px;
  }

  .empty-state {
    min-height:
      280px;

    display:
      flex;

    flex-direction:
      column;

    align-items:
      center;

    justify-content:
      center;

    gap:
      9px;

    padding:
      34px;

    border:
      1px solid
      var(--app-border);

    border-radius:
      22px;

    color:
      var(--app-text-soft);

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow-sm);

    text-align:
      center;
  }

  .empty-state__icon {
    width:
      70px;

    height:
      70px;

    display:
      grid;

    place-items:
      center;

    margin-bottom:
      5px;

    border-radius:
      22px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .empty-state strong {
    color:
      var(--app-text);

    font-size:
      17px;
  }

  .empty-state p {
    max-width:
      450px;

    margin:
      0;

    font-size:
      12px;

    line-height:
      1.6;
  }

  .skeleton-card {
    min-height:
      390px;

    pointer-events:
      none;
  }

  .skeleton {
    border-radius:
      10px;

    background:
      linear-gradient(
        90deg,
        var(--app-surface-alt)
        25%,
        var(--app-surface-raised)
        50%,
        var(--app-surface-alt)
        75%
      );

    background-size:
      200%
      100%;

    animation:
      skeletonMove
      1.4s
      infinite;
  }

  .skeleton-icon {
    width:
      46px;

    height:
      46px;
  }

  .skeleton-line {
    width:
      100%;

    height:
      11px;

    margin-top:
      11px;
  }

  .skeleton-line--small {
    width:
      80px;

    margin-top:
      18px;
  }

  .skeleton-line--title {
    width:
      68%;

    height:
      20px;
  }

  .skeleton-grid {
    display:
      grid;

    grid-template-columns:
      1fr
      1fr;

    gap:
      9px;

    margin-top:
      18px;
  }

  .skeleton-box {
    height:
      54px;
  }

  .skeleton-button {
    width:
      130px;

    height:
      38px;

    margin:
      20px
      0
      0
      auto;
  }

  .modal-backdrop {
    position:
      fixed;

    inset:
      0;

    z-index:
      8000;

    display:
      grid;

    place-items:
      center;

    padding:
      20px;

    background:
      var(--app-overlay);

    backdrop-filter:
      blur(6px);
  }

  .code-modal {
    position:
      relative;

    width:
      min(
        540px,
        100%
      );

    max-height:
      calc(
        100dvh - 40px
      );

    overflow-y:
      auto;

    padding:
      30px;

    border:
      1px solid
      var(--app-border);

    border-radius:
      26px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow-modal);

    animation:
      revealCard
      .22s
      ease
      both;
  }

  .modal-close {
    position:
      absolute;

    top:
      18px;

    right:
      18px;

    width:
      38px;

    height:
      38px;

    display:
      grid;

    place-items:
      center;

    border:
      none;

    border-radius:
      12px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);

    cursor:
      pointer;
  }

  .code-modal__icon {
    width:
      58px;

    height:
      58px;

    display:
      grid;

    place-items:
      center;

    margin-bottom:
      18px;

    border-radius:
      18px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .code-modal h3 {
    margin:
      7px
      0
      0;

    color:
      var(--app-text);

    font-size:
      23px;
  }

  .modal-intro {
    margin:
      10px
      0
      0;

    color:
      var(--app-text-soft);

    font-size:
      13px;

    line-height:
      1.65;
  }

  .code-steps {
    display:
      grid;

    gap:
      12px;

    margin-top:
      20px;
  }

  .code-steps > div {
    display:
      grid;

    grid-template-columns:
      36px
      1fr;

    gap:
      12px;

    align-items:
      flex-start;

    padding:
      13px;

    border:
      1px solid
      var(--app-border-soft);

    border-radius:
      15px;

    background:
      var(--app-surface-alt);
  }

  .code-steps > div > span {
    width:
      32px;

    height:
      32px;

    display:
      grid;

    place-items:
      center;

    border-radius:
      11px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);

    font-size:
      12px;

    font-weight:
      900;
  }

  .code-steps strong {
    color:
      var(--app-text);

    font-size:
      12px;
  }

  .code-steps p {
    margin:
      4px
      0
      0;

    color:
      var(--app-text-soft);

    font-size:
      11px;

    line-height:
      1.5;
  }

  .code-warning {
    display:
      flex;

    align-items:
      flex-start;

    gap:
      10px;

    margin-top:
      18px;

    padding:
      14px;

    border:
      1px solid
      var(--app-success-border);

    border-radius:
      15px;

    color:
      var(--app-success);

    background:
      var(--app-success-bg);
  }

  .code-warning strong {
    display:
      block;

    font-size:
      12px;
  }

  .code-warning span {
    display:
      block;

    margin-top:
      4px;

    color:
      var(--app-text-soft);

    font-size:
      10px;

    line-height:
      1.5;
  }

  .modal-primary {
    width:
      100%;

    margin-top:
      20px;
  }

  .student-toast {
    position:
      fixed;

    top:
      25px;

    right:
      28px;

    z-index:
      9999;

    width:
      min(
        390px,
        calc(
          100vw - 40px
        )
      );

    display:
      grid;

    grid-template-columns:
      42px
      1fr
      28px;

    gap:
      11px;

    align-items:
      flex-start;

    padding:
      15px
      15px
      18px;

    overflow:
      hidden;

    border-radius:
      18px;

    box-shadow:
      var(--app-shadow-lg);

    animation:
      toastIn
      .3s
      ease;
  }

  .student-toast.exito {
    border:
      1px solid
      var(--app-success-border);

    color:
      var(--app-success);

    background:
      var(--app-success-bg);
  }

  .student-toast.error {
    border:
      1px solid
      var(--app-danger-border);

    color:
      var(--app-danger-strong);

    background:
      var(--app-danger-bg);
  }

  .student-toast__icon {
    width:
      42px;

    height:
      42px;

    display:
      grid;

    place-items:
      center;

    border-radius:
      13px;
  }

  .student-toast__content strong {
    display:
      block;

    font-size:
      14px;
  }

  .student-toast__content p {
    margin:
      4px
      0
      0;

    color:
      var(--app-text-soft);

    font-size:
      12px;

    line-height:
      1.45;
  }

  .student-toast > button {
    border:
      none;

    color:
      var(--app-text-muted);

    background:
      transparent;

    cursor:
      pointer;
  }

  .student-toast__progress {
    position:
      absolute;

    left:
      0;

    bottom:
      0;

    width:
      100%;

    height:
      4px;

    transform-origin:
      left
      center;

    animation:
      toastProgress
      5s
      linear
      forwards;
  }

  .student-toast.exito
  .student-toast__progress {
    background:
      var(--app-success);
  }

  .student-toast.error
  .student-toast__progress {
    background:
      var(--app-danger);
  }

  .spin {
    animation:
      spin
      .8s
      linear
      infinite;
  }

  @keyframes spin {
    to {
      transform:
        rotate(
          360deg
        );
    }
  }

  @keyframes skeletonMove {
    from {
      background-position:
        200%
        0;
    }

    to {
      background-position:
        -200%
        0;
    }
  }

  @keyframes revealCard {
    from {
      opacity:
        0;

      transform:
        translateY(
          10px
        )
        scale(
          .99
        );
    }

    to {
      opacity:
        1;

      transform:
        translateY(
          0
        )
        scale(
          1
        );
    }
  }

  @keyframes toastIn {
    from {
      opacity:
        0;

      transform:
        translateX(
          30px
        );
    }

    to {
      opacity:
        1;

      transform:
        translateX(
          0
        );
    }
  }

  @keyframes toastProgress {
    from {
      transform:
        scaleX(
          1
        );
    }

    to {
      transform:
        scaleX(
          0
        );
    }
  }

  @media (
    max-width:
      1150px
  ) {
    .summary-grid {
      grid-template-columns:
        repeat(
          2,
          minmax(
            0,
            1fr
          )
        );
    }

    .enrollment-card {
      grid-template-columns:
        1fr;
    }
  }

  @media (
    max-width:
      950px
  ) {
    .courses-grid {
      grid-template-columns:
        1fr;
    }

    .filters-row {
      grid-template-columns:
        1fr;
    }
  }

  @media (
    max-width:
      850px
  ) {
    .estudiante-cursos-page {
      padding:
        18px;
    }

    .estudiante-cursos-header {
      align-items:
        stretch;

      flex-direction:
        column;
    }

    .btn-actualizar {
      width:
        100%;
    }

    .enrollment-card__form {
      grid-template-columns:
        1fr
        1fr;
    }

    .code-input-wrapper {
      grid-column:
        1
        /
        -1;
    }
  }

  @media (
    max-width:
      600px
  ) {
    .estudiante-cursos-page {
      padding:
        12px
        12px
        36px;
    }

    .estudiante-cursos-header {
      padding:
        22px
        18px;
    }

    .estudiante-cursos-header__content {
      align-items:
        flex-start;
    }

    .summary-grid {
      grid-template-columns:
        1fr;
    }

    .enrollment-card,
    .courses-control-card {
      padding:
        18px;
    }

    .enrollment-card__intro {
      align-items:
        flex-start;
    }

    .enrollment-card__form {
      grid-template-columns:
        1fr;
    }

    .code-input-wrapper {
      grid-column:
        auto;
    }

    .btn-inscribirse,
    .btn-code-help {
      width:
        100%;
    }

    .courses-control-card__top {
      flex-direction:
        column;
    }

    .filters-row {
      align-items:
        stretch;
    }

    .state-filters {
      display:
        grid;

      grid-template-columns:
        1fr;
    }

    .state-filters button {
      justify-content:
        space-between;
    }

    .course-data {
      grid-template-columns:
        1fr;
    }

    .course-card__footer {
      align-items:
        stretch;

      flex-direction:
        column;
    }

    .course-card__actions {
      width:
        100%;

      display:
        grid;

      grid-template-columns:
        1fr;
    }

    .btn-course-forum,
    .btn-enter-course {
      width:
        100%;
    }

    .code-modal {
      padding:
        24px
        18px
        20px;
    }

    .student-toast {
      top:
        14px;

      right:
        14px;

      width:
        calc(
          100vw - 28px
        );
    }
  }
`;