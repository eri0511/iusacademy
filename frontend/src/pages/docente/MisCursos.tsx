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
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  CircleX,
  Clock3,
  Copy,
  GraduationCap,
  HelpCircle,
  Info,
  KeyRound,
  LoaderCircle,
  Power,
  RefreshCcw,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
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

type FiltroEstado =
  | 'TODOS'
  | EstadoCurso;

type CursoDocente = {
  id: number;
  gestion: string;
  paralelo: string;
  semestre: number;
  cupoMaximo: number | null;
  estado: EstadoCurso;
  codigoInscripcion: string | null;
  codigoInscripcionActivo: boolean;
  codigoGeneradoEn: string | null;
  codigoExpiraEn: string | null;
  codigoVigente: boolean;
  estudiantesInscritos: number;
  cuposDisponibles: number | null;
  materia: {
    id: number;
    nombre: string;
    codigo: string;
    semestre: number;
    descripcion?: string | null;
  };
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

type RespuestaError = {
  message?: string | string[];
  mensaje?: string;
  error?: string;
};

type ModalCodigoEstado = {
  abierto: boolean;
  curso: CursoDocente | null;
  diasVigencia: number;
};

type ModalDesactivarEstado = {
  abierto: boolean;
  curso: CursoDocente | null;
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

const opcionesVigencia = [
  {
    dias: 1,
    titulo: '1 día',
    descripcion: 'Útil para una inscripción rápida.',
  },
  {
    dias: 7,
    titulo: '7 días',
    descripcion: 'Recomendado para la mayoría de cursos.',
  },
  {
    dias: 15,
    titulo: '15 días',
    descripcion: 'Ideal para periodos de inscripción amplios.',
  },
  {
    dias: 30,
    titulo: '30 días',
    descripcion: 'Para cursos con inscripción prolongada.',
  },
] as const;

function obtenerMensajeError(
  datos: RespuestaError,
  predeterminado: string,
): string {
  if (Array.isArray(datos.message)) {
    return datos.message.join('. ');
  }

  return (
    datos.message ||
    datos.mensaje ||
    datos.error ||
    predeterminado
  );
}

function formatearFecha(
  valor: string | null,
): string {
  if (!valor) {
    return 'Sin fecha';
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat(
    'es-BO',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(fecha);
}

function calcularDiasRestantes(
  valor: string | null,
): number | null {
  if (!valor) {
    return null;
  }

  const fechaExpiracion =
    new Date(valor);

  if (Number.isNaN(fechaExpiracion.getTime())) {
    return null;
  }

  const diferencia =
    fechaExpiracion.getTime() -
    Date.now();

  return Math.ceil(
    diferencia /
    (
      1000 *
      60 *
      60 *
      24
    ),
  );
}

function calcularPorcentajeOcupacion(
  inscritos: number,
  cupoMaximo: number | null,
): number {
  if (
    cupoMaximo === null ||
    cupoMaximo <= 0
  ) {
    return 0;
  }

  return Math.min(
    Math.round(
      (
        inscritos /
        cupoMaximo
      ) *
      100,
    ),
    100,
  );
}

function obtenerClaseOcupacion(
  porcentaje: number,
): string {
  if (porcentaje >= 90) {
    return 'danger';
  }

  if (porcentaje >= 70) {
    return 'warning';
  }

  return 'success';
}

export default function MisCursos() {
  const navigate =
    useNavigate();

  const {
    accessToken,
    cerrarSesion,
  } = useAuth();

  const [
    cursos,
    setCursos,
  ] = useState<CursoDocente[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    actualizando,
    setActualizando,
  ] = useState(false);

  const [
    procesandoId,
    setProcesandoId,
  ] = useState<number | null>(null);

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState<FiltroEstado>('ACTIVO');

  const [
    busqueda,
    setBusqueda,
  ] = useState('');

  const [
    codigoCopiado,
    setCodigoCopiado,
  ] = useState<number | null>(null);

  const [
    modalAyudaAbierto,
    setModalAyudaAbierto,
  ] = useState(false);

  const [
    modalCodigo,
    setModalCodigo,
  ] = useState<ModalCodigoEstado>({
    abierto: false,
    curso: null,
    diasVigencia: 7,
  });

  const [
    modalDesactivar,
    setModalDesactivar,
  ] = useState<ModalDesactivarEstado>({
    abierto: false,
    curso: null,
  });

  const [
    toast,
    setToast,
  ] = useState<ToastEstado>({
    visible: false,
    tipo: 'exito',
    titulo: '',
    mensaje: '',
  });

  const mostrarToast =
    useCallback(
      (
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
      },
      [],
    );

  const cerrarToast =
    useCallback(
      () => {
        setToast((anterior) => ({
          ...anterior,
          visible: false,
        }));
      },
      [],
    );

  const verificarSesion =
    useCallback(
      (
        respuesta: Response,
      ) => {
        if (respuesta.status === 401) {
          cerrarSesion();

          navigate(
            '/login',
            {
              replace: true,
            },
          );

          throw new Error(
            'Tu sesión venció. Inicia sesión nuevamente.',
          );
        }
      },
      [
        cerrarSesion,
        navigate,
      ],
    );

  const cargarCursos =
    useCallback(
      async (
        esActualizacion = false,
      ) => {
        if (!accessToken) {
          setCargando(false);
          return;
        }

        try {
          if (esActualizacion) {
            setActualizando(true);
          } else {
            setCargando(true);
          }

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

          verificarSesion(respuesta);

          const datos =
            await respuesta
              .json()
              .catch(() => ({}));

          if (!respuesta.ok) {
            throw new Error(
              obtenerMensajeError(
                datos as RespuestaError,
                'No fue posible cargar tus cursos.',
              ),
            );
          }

          if (!Array.isArray(datos)) {
            throw new Error(
              'El servidor devolvió una respuesta no válida.',
            );
          }

          setCursos(
            datos as CursoDocente[],
          );
        } catch (error) {
          mostrarToast(
            'error',
            'No se pudieron cargar los cursos',
            error instanceof Error
              ? error.message
              : 'Ocurrió un error inesperado.',
          );
        } finally {
          setCargando(false);
          setActualizando(false);
        }
      },
      [
        accessToken,
        mostrarToast,
        verificarSesion,
      ],
    );

  useEffect(
    () => {
      void cargarCursos();
    },
    [cargarCursos],
  );

  const resumen =
    useMemo(
      () => {
        const activos =
          cursos.filter(
            (curso) =>
              curso.estado === 'ACTIVO',
          );

        return {
          total:
            cursos.length,

          activos:
            activos.length,

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
              (curso) =>
                curso.codigoVigente,
            ).length,

          sinCodigo:
            activos.filter(
              (curso) =>
                !curso.codigoInscripcion,
            ).length,
        };
      },
      [cursos],
    );

  const conteosEstado =
    useMemo(
      () => ({
        ACTIVO:
          cursos.filter(
            (curso) =>
              curso.estado === 'ACTIVO',
          ).length,

        INACTIVO:
          cursos.filter(
            (curso) =>
              curso.estado === 'INACTIVO',
          ).length,

        FINALIZADO:
          cursos.filter(
            (curso) =>
              curso.estado === 'FINALIZADO',
          ).length,

        TODOS:
          cursos.length,
      }),
      [cursos],
    );

  const cursosFiltrados =
    useMemo(
      () => {
        const texto =
          busqueda
            .trim()
            .toLowerCase();

        return cursos.filter(
          (curso) => {
            const coincideEstado =
              filtroEstado === 'TODOS' ||
              curso.estado === filtroEstado;

            const contenidoBusqueda =
              [
                curso.materia.nombre,
                curso.materia.codigo,
                curso.gestion,
                curso.paralelo,
                String(curso.semestre),
              ]
                .join(' ')
                .toLowerCase();

            const coincideTexto =
              !texto ||
              contenidoBusqueda.includes(texto);

            return (
              coincideEstado &&
              coincideTexto
            );
          },
        );
      },
      [
        cursos,
        filtroEstado,
        busqueda,
      ],
    );

  const abrirModalCodigo =
    (
      curso: CursoDocente,
    ) => {
      setModalCodigo({
        abierto: true,
        curso,
        diasVigencia: 7,
      });
    };

  const cerrarModalCodigo =
    () => {
      if (procesandoId !== null) {
        return;
      }

      setModalCodigo({
        abierto: false,
        curso: null,
        diasVigencia: 7,
      });
    };

  const abrirModalDesactivar =
    (
      curso: CursoDocente,
    ) => {
      setModalDesactivar({
        abierto: true,
        curso,
      });
    };

  const cerrarModalDesactivar =
    () => {
      if (procesandoId !== null) {
        return;
      }

      setModalDesactivar({
        abierto: false,
        curso: null,
      });
    };

  const generarCodigo =
    async () => {
      const curso =
        modalCodigo.curso;

      if (
        !accessToken ||
        !curso
      ) {
        return;
      }

      try {
        setProcesandoId(
          curso.id,
        );

        const respuesta =
          await fetch(
            `${API_URL}/docente/cursos/${curso.id}/codigo-inscripcion`,
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
                Authorization:
                  `Bearer ${accessToken}`,
              },
              body:
                JSON.stringify({
                  diasVigencia:
                    modalCodigo.diasVigencia,
                }),
            },
          );

        verificarSesion(respuesta);

        const datos =
          await respuesta
            .json()
            .catch(() => ({}));

        if (!respuesta.ok) {
          throw new Error(
            obtenerMensajeError(
              datos as RespuestaError,
              'No fue posible generar el código.',
            ),
          );
        }

        setModalCodigo({
          abierto: false,
          curso: null,
          diasVigencia: 7,
        });

        mostrarToast(
          'exito',
          curso.codigoInscripcion
            ? 'Código renovado'
            : 'Código generado',
          `El código estará disponible durante ${modalCodigo.diasVigencia} ${
            modalCodigo.diasVigencia === 1
              ? 'día'
              : 'días'
          }.`,
        );

        await cargarCursos(true);
      } catch (error) {
        mostrarToast(
          'error',
          'No se pudo generar el código',
          error instanceof Error
            ? error.message
            : 'No fue posible completar la operación.',
        );
      } finally {
        setProcesandoId(null);
      }
    };

  const desactivarCodigo =
    async () => {
      const curso =
        modalDesactivar.curso;

      if (
        !accessToken ||
        !curso
      ) {
        return;
      }

      try {
        setProcesandoId(
          curso.id,
        );

        const respuesta =
          await fetch(
            `${API_URL}/docente/cursos/${curso.id}/codigo-inscripcion/desactivar`,
            {
              method: 'PATCH',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            },
          );

        verificarSesion(respuesta);

        const datos =
          await respuesta
            .json()
            .catch(() => ({}));

        if (!respuesta.ok) {
          throw new Error(
            obtenerMensajeError(
              datos as RespuestaError,
              'No fue posible desactivar el código.',
            ),
          );
        }

        setModalDesactivar({
          abierto: false,
          curso: null,
        });

        mostrarToast(
          'exito',
          'Código desactivado',
          'El código dejó de aceptar nuevas inscripciones. Los estudiantes inscritos conservan su acceso.',
        );

        await cargarCursos(true);
      } catch (error) {
        mostrarToast(
          'error',
          'No se pudo desactivar',
          error instanceof Error
            ? error.message
            : 'No fue posible completar la operación.',
        );
      } finally {
        setProcesandoId(null);
      }
    };

  const copiarCodigo =
    async (
      curso: CursoDocente,
    ) => {
      if (!curso.codigoInscripcion) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          curso.codigoInscripcion,
        );

        setCodigoCopiado(
          curso.id,
        );

        mostrarToast(
          'exito',
          'Código copiado',
          `${curso.codigoInscripcion} fue copiado al portapapeles.`,
        );

        window.setTimeout(
          () => {
            setCodigoCopiado(null);
          },
          1800,
        );
      } catch {
        mostrarToast(
          'error',
          'No se pudo copiar',
          'Selecciona el código y cópialo manualmente.',
        );
      }
    };

  const limpiarFiltros =
    () => {
      setBusqueda('');
      setFiltroEstado('ACTIVO');
    };

  return (
    <main className="mis-cursos-page">
      {toast.visible && (
        <Toast
          tipo={toast.tipo}
          titulo={toast.titulo}
          mensaje={toast.mensaje}
          onCerrar={cerrarToast}
        />
      )}

      <header className="mis-cursos-header">
        <div className="mis-cursos-header__content">
          <div className="mis-cursos-header__icon">
            <GraduationCap
              size={28}
            />
          </div>

          <div>
            <span className="mis-cursos-eyebrow">
              Gestión académica
            </span>

            <h1>
              Mis cursos
            </h1>

            <p>
              Administra tus aulas, estudiantes y códigos de inscripción.
            </p>

            <div className="mis-cursos-header__meta">
              <span>
                <BookOpen size={13} />
                Área civil
              </span>

              <span>
                <ShieldCheck size={13} />
                Acceso protegido
              </span>

              <span>
                <Sparkles size={13} />
                Formación práctica
              </span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-header-secondary"
            onClick={() =>
              setModalAyudaAbierto(true)
            }
          >
            <HelpCircle size={18} />
            Código de inscripción
          </button>

          <button
            type="button"
            className="btn-header-refresh"
            disabled={actualizando}
            onClick={() =>
              void cargarCursos(true)
            }
          >
            <RefreshCw
              size={18}
              className={
                actualizando
                  ? 'spin'
                  : ''
              }
            />
            Actualizar
          </button>
        </div>
      </header>

      <section className="summary-grid">
        <Resumen
          icono={<BookOpen size={22} />}
          cantidad={resumen.total}
          titulo="Cursos asignados"
          descripcion="Todos tus cursos"
          clase="total"
        />

        <Resumen
          icono={<CheckCircle2 size={22} />}
          cantidad={resumen.activos}
          titulo="Cursos activos"
          descripcion="Disponibles actualmente"
          clase="activos"
        />

        <Resumen
          icono={<Users size={22} />}
          cantidad={resumen.estudiantes}
          titulo="Estudiantes"
          descripcion="Inscripciones activas"
          clase="estudiantes"
        />

        <Resumen
          icono={<KeyRound size={22} />}
          cantidad={resumen.codigosVigentes}
          titulo="Códigos vigentes"
          descripcion={
            resumen.sinCodigo > 0
              ? `${resumen.sinCodigo} curso(s) sin código`
              : 'Todos configurados'
          }
          clase="codigos"
        />
      </section>

      <section className="filters-card">
        <div className="filters-card__header">
          <div>
            <span className="section-eyebrow">
              Aulas asignadas
            </span>

            <h2>
              Consulta tus cursos
            </h2>

            <p>
              Busca por materia, código, gestión o paralelo.
            </p>
          </div>

          <div className="results-counter">
            <strong>
              {cursosFiltrados.length}
            </strong>

            <span>
              de {cursos.length} cursos
            </span>
          </div>
        </div>

        <div className="filters-content">
          <div className="state-filters">
            {(
              [
                'ACTIVO',
                'INACTIVO',
                'FINALIZADO',
                'TODOS',
              ] as const
            ).map(
              (estado) => (
                <button
                  type="button"
                  key={estado}
                  className={
                    filtroEstado === estado
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setFiltroEstado(estado)
                  }
                >
                  <span className="filter-name">
                    {estado === 'ACTIVO'
                      ? 'Activos'
                      : estado === 'INACTIVO'
                        ? 'Inactivos'
                        : estado === 'FINALIZADO'
                          ? 'Finalizados'
                          : 'Todos'}
                  </span>

                  <span className="filter-count">
                    {conteosEstado[estado]}
                  </span>
                </button>
              ),
            )}
          </div>

          <div className="search-box">
            <Search size={18} />

            <input
              type="search"
              value={busqueda}
              onChange={(evento) =>
                setBusqueda(
                  evento.target.value,
                )
              }
              placeholder="Buscar materia, código, gestión o paralelo..."
            />

            {(
              busqueda ||
              filtroEstado !== 'ACTIVO'
            ) && (
              <button
                type="button"
                title="Limpiar búsqueda y filtros"
                onClick={limpiarFiltros}
              >
                <RefreshCcw size={16} />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="courses-section">
        {cargando ? (
          <div className="state-card state-card--loading">
            <span className="spinner" />

            <div>
              <strong>
                Cargando tus cursos
              </strong>

              <p>
                Estamos consultando la información académica.
              </p>
            </div>
          </div>
        ) : cursosFiltrados.length === 0 ? (
          <div className="state-card state-card--empty">
            <div className="empty-icon">
              <GraduationCap size={34} />
            </div>

            <strong>
              No se encontraron cursos
            </strong>

            <p>
              Ajusta los filtros o espera a que el administrador te asigne un curso.
            </p>

            <button
              type="button"
              className="btn-secondary"
              onClick={limpiarFiltros}
            >
              <RefreshCcw size={16} />
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="courses-grid">
            {cursosFiltrados.map(
              (curso) => {
                const porcentaje =
                  calcularPorcentajeOcupacion(
                    curso.estudiantesInscritos,
                    curso.cupoMaximo,
                  );

                const claseOcupacion =
                  obtenerClaseOcupacion(
                    porcentaje,
                  );

                const diasRestantes =
                  calcularDiasRestantes(
                    curso.codigoExpiraEn,
                  );

                const procesando =
                  procesandoId === curso.id;

                return (
                  <article
                    className="course-card"
                    key={curso.id}
                  >
                    <div className="course-accent" />

                    <div className="course-card__header">
                      <div className="course-identity">
                        <div className="course-icon">
                          <BookOpen size={23} />
                        </div>

                        <div className="course-title">
                          <span className="course-code">
                            {curso.materia.codigo}
                          </span>

                          <h2>
                            {curso.materia.nombre}
                          </h2>

                          <p>
                            Gestión {curso.gestion}
                            {' · '}
                            Paralelo {curso.paralelo}
                            {' · '}
                            {curso.semestre}.º semestre
                          </p>
                        </div>
                      </div>

                      <span
                        className={`status-badge ${curso.estado.toLowerCase()}`}
                      >
                        <span className="status-dot" />
                        {curso.estado}
                      </span>
                    </div>

                    <div className="course-data-grid">
                      <div className="data-item">
                        <Users size={18} />

                        <div>
                          <strong>
                            {curso.estudiantesInscritos}
                          </strong>

                          <span>
                            Inscritos
                          </span>
                        </div>
                      </div>

                      <div className="data-item">
                        <GraduationCap size={18} />

                        <div>
                          <strong>
                            {curso.cuposDisponibles ?? '∞'}
                          </strong>

                          <span>
                            Cupos disponibles
                          </span>
                        </div>
                      </div>

                      <div className="data-item">
                        <BookOpen size={18} />

                        <div>
                          <strong>
                            {curso.cupoMaximo ?? 'Sin límite'}
                          </strong>

                          <span>
                            Cupo máximo
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="capacity-panel">
                      <div className="capacity-header">
                        <div>
                          <strong>
                            Ocupación del curso
                          </strong>

                          <span>
                            {curso.cupoMaximo === null
                              ? `${curso.estudiantesInscritos} estudiantes inscritos`
                              : `${curso.estudiantesInscritos} de ${curso.cupoMaximo} plazas`}
                          </span>
                        </div>

                        {curso.cupoMaximo !== null && (
                          <strong
                            className={`capacity-percent ${claseOcupacion}`}
                          >
                            {porcentaje}%
                          </strong>
                        )}
                      </div>

                      {curso.cupoMaximo !== null && (
                        <div className="capacity-track">
                          <span
                            className={`capacity-progress ${claseOcupacion}`}
                            style={{
                              width:
                                `${porcentaje}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div
                      className={`code-panel ${
                        curso.codigoVigente
                          ? 'is-active'
                          : 'is-inactive'
                      }`}
                    >
                      <div className="code-panel__header">
                        <div className="code-title">
                          <div className="code-icon">
                            <KeyRound size={18} />
                          </div>

                          <div>
                            <strong>
                              Código de inscripción
                            </strong>

                            <span>
                              Acceso para nuevos estudiantes
                            </span>
                          </div>
                        </div>

                        <span
                          className={
                            curso.codigoVigente
                              ? 'code-state active'
                              : 'code-state inactive'
                          }
                        >
                          {curso.codigoVigente
                            ? 'Vigente'
                            : curso.codigoInscripcion
                              ? 'No vigente'
                              : 'Sin código'}
                        </span>
                      </div>

                      {curso.codigoInscripcion ? (
                        <>
                          <div className="code-display">
                            <strong>
                              {curso.codigoInscripcion}
                            </strong>

                            <button
                              type="button"
                              className={
                                codigoCopiado === curso.id
                                  ? 'copy-button copied'
                                  : 'copy-button'
                              }
                              onClick={() =>
                                void copiarCodigo(curso)
                              }
                              title="Copiar código"
                            >
                              {codigoCopiado === curso.id ? (
                                <Check size={18} />
                              ) : (
                                <Copy size={18} />
                              )}
                            </button>
                          </div>

                          <div className="code-information">
                            <span>
                              <Clock3 size={14} />

                              {curso.codigoVigente &&
                              diasRestantes !== null
                                ? diasRestantes > 0
                                  ? `Vence en ${diasRestantes} ${
                                      diasRestantes === 1
                                        ? 'día'
                                        : 'días'
                                    }`
                                  : 'Vence hoy'
                                : 'No acepta nuevas inscripciones'}
                            </span>

                            <span>
                              Expiración:{' '}
                              {formatearFecha(
                                curso.codigoExpiraEn,
                              )}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="no-code">
                          <Info size={19} />

                          <div>
                            <strong>
                              Curso sin código
                            </strong>

                            <span>
                              Genera uno para permitir que los estudiantes se inscriban.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="course-actions">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() =>
                          navigate(
                            `/docente/cursos/${curso.id}`,
                          )
                        }
                      >
                        Entrar al aula
                        <ArrowRight size={16} />
                      </button>

                      <button
                        type="button"
                        className="btn-students"
                        onClick={() =>
                          navigate(
                            `/docente/cursos/${curso.id}/estudiantes`,
                          )
                        }
                      >
                        <Users size={16} />
                        Ver estudiantes
                      </button>

                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={
                          procesando ||
                          curso.estado !== 'ACTIVO'
                        }
                        onClick={() =>
                          abrirModalCodigo(curso)
                        }
                      >
                        {procesando ? (
                          <LoaderCircle
                            size={16}
                            className="spin"
                          />
                        ) : (
                          <KeyRound size={16} />
                        )}

                        {curso.codigoInscripcion
                          ? 'Renovar código'
                          : 'Generar código'}
                      </button>

                      {curso.codigoInscripcionActivo &&
                        curso.codigoInscripcion && (
                          <button
                            type="button"
                            className="btn-danger"
                            disabled={procesando}
                            onClick={() =>
                              abrirModalDesactivar(curso)
                            }
                          >
                            <Power size={16} />
                            Desactivar
                          </button>
                        )}
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>

      {modalAyudaAbierto && (
        <ModalBase
          onCerrar={() =>
            setModalAyudaAbierto(false)
          }
        >
          <div className="modal-main-icon">
            <KeyRound size={28} />
          </div>

          <span className="modal-eyebrow">
            Inscripción al curso
          </span>

          <h3>
            ¿Cómo funciona el código?
          </h3>

          <p className="modal-intro">
            El código permite que tus estudiantes se unan al curso correcto sin que tengas que registrarlos manualmente.
          </p>

          <div className="steps-list">
            <div>
              <span className="step-number">
                1
              </span>

              <div>
                <strong>
                  Genera un código
                </strong>

                <p>
                  Selecciona su vigencia y confirma la generación.
                </p>
              </div>
            </div>

            <div>
              <span className="step-number">
                2
              </span>

              <div>
                <strong>
                  Compártelo con tu grupo
                </strong>

                <p>
                  Los estudiantes lo ingresarán desde su propia cuenta.
                </p>
              </div>
            </div>

            <div>
              <span className="step-number">
                3
              </span>

              <div>
                <strong>
                  Controla nuevas inscripciones
                </strong>

                <p>
                  Puedes renovarlo o desactivarlo cuando lo necesites.
                </p>
              </div>
            </div>
          </div>

          <div className="modal-notice success">
            <ShieldCheck size={20} />

            <div>
              <strong>
                Las inscripciones existentes están protegidas
              </strong>

              <span>
                Renovar o desactivar un código no elimina a los estudiantes que ya forman parte del curso.
              </span>
            </div>
          </div>

          <button
            type="button"
            className="modal-primary"
            onClick={() =>
              setModalAyudaAbierto(false)
            }
          >
            Entendido
          </button>
        </ModalBase>
      )}

      {modalCodigo.abierto &&
        modalCodigo.curso && (
        <ModalBase
          onCerrar={cerrarModalCodigo}
        >
          <div className="modal-main-icon">
            <KeyRound size={28} />
          </div>

          <span className="modal-eyebrow">
            Código de inscripción
          </span>

          <h3>
            {modalCodigo.curso.codigoInscripcion
              ? 'Renovar código'
              : 'Generar código'}
          </h3>

          <p className="modal-intro">
            Curso:{' '}
            <strong>
              {modalCodigo.curso.materia.nombre}
            </strong>
          </p>

          {modalCodigo.curso.codigoInscripcion && (
            <div className="current-code-box">
              <span>
                Código actual
              </span>

              <strong>
                {modalCodigo.curso.codigoInscripcion}
              </strong>

              <small>
                Al renovar, este código dejará de funcionar inmediatamente.
              </small>
            </div>
          )}

          <div className="duration-section">
            <strong className="duration-title">
              Selecciona la vigencia
            </strong>

            <div className="duration-grid">
              {opcionesVigencia.map(
                (opcion) => (
                  <button
                    type="button"
                    key={opcion.dias}
                    className={
                      modalCodigo.diasVigencia === opcion.dias
                        ? 'duration-option active'
                        : 'duration-option'
                    }
                    onClick={() =>
                      setModalCodigo(
                        (anterior) => ({
                          ...anterior,
                          diasVigencia:
                            opcion.dias,
                        }),
                      )
                    }
                  >
                    <span className="duration-check">
                      {modalCodigo.diasVigencia === opcion.dias && (
                        <Check size={14} />
                      )}
                    </span>

                    <strong>
                      {opcion.titulo}
                    </strong>

                    <small>
                      {opcion.descripcion}
                    </small>
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="modal-notice warning">
            <AlertTriangle size={20} />

            <div>
              <strong>
                Recuerda compartir el nuevo código
              </strong>

              <span>
                Cuando generas uno nuevo, cualquier código anterior deja de aceptar inscripciones.
              </span>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-secondary"
              disabled={procesandoId !== null}
              onClick={cerrarModalCodigo}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="modal-primary"
              disabled={procesandoId !== null}
              onClick={() =>
                void generarCodigo()
              }
            >
              {procesandoId !== null ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="spin"
                  />
                  Procesando...
                </>
              ) : (
                <>
                  <KeyRound size={17} />
                  {modalCodigo.curso.codigoInscripcion
                    ? 'Renovar código'
                    : 'Generar código'}
                </>
              )}
            </button>
          </div>
        </ModalBase>
      )}

      {modalDesactivar.abierto &&
        modalDesactivar.curso && (
        <ModalBase
          onCerrar={cerrarModalDesactivar}
        >
          <div className="modal-main-icon danger">
            <Power size={28} />
          </div>

          <span className="modal-eyebrow danger">
            Control de acceso
          </span>

          <h3>
            Desactivar código
          </h3>

          <p className="modal-intro">
            El código{' '}
            <strong>
              {modalDesactivar.curso.codigoInscripcion}
            </strong>{' '}
            dejará de aceptar nuevas inscripciones.
          </p>

          <div className="modal-notice danger">
            <AlertTriangle size={20} />

            <div>
              <strong>
                Esta acción no retira estudiantes
              </strong>

              <span>
                Los estudiantes que ya están inscritos conservarán su acceso al curso.
              </span>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-secondary"
              disabled={procesandoId !== null}
              onClick={cerrarModalDesactivar}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="modal-danger"
              disabled={procesandoId !== null}
              onClick={() =>
                void desactivarCodigo()
              }
            >
              {procesandoId !== null ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="spin"
                  />
                  Desactivando...
                </>
              ) : (
                <>
                  <Power size={17} />
                  Sí, desactivar
                </>
              )}
            </button>
          </div>
        </ModalBase>
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
  descripcion,
  clase,
}: {
  icono: ReactNode;
  cantidad: number;
  titulo: string;
  descripcion: string;
  clase: string;
}) {
  return (
    <article className="summary-card">
      <div className={`summary-icon ${clase}`}>
        {icono}
      </div>

      <div className="summary-information">
        <strong>
          {cantidad}
        </strong>

        <span>
          {titulo}
        </span>

        <small>
          {descripcion}
        </small>
      </div>
    </article>
  );
}

function ModalBase({
  children,
  onCerrar,
}: {
  children: ReactNode;
  onCerrar: () => void;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={onCerrar}
    >
      <div
        className="app-modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={(evento) =>
          evento.stopPropagation()
        }
      >
        <button
          type="button"
          className="modal-close"
          onClick={onCerrar}
          aria-label="Cerrar ventana"
        >
          <X size={18} />
        </button>

        {children}
      </div>
    </div>
  );
}

function Toast({
  tipo,
  titulo,
  mensaje,
  onCerrar,
}: {
  tipo: TipoToast;
  titulo: string;
  mensaje: string;
  onCerrar: () => void;
}) {
  useEffect(
    () => {
      const temporizador =
        window.setTimeout(
          onCerrar,
          5000,
        );

      return () =>
        window.clearTimeout(
          temporizador,
        );
    },
    [onCerrar],
  );

  return (
    <div className={`toast ${tipo}`}>
      <div className="toast-icon">
        {tipo === 'exito' ? (
          <CheckCircle2 size={23} />
        ) : (
          <CircleX size={23} />
        )}
      </div>

      <div className="toast-content">
        <strong>
          {titulo}
        </strong>

        <p>
          {mensaje}
        </p>
      </div>

      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar notificación"
      >
        <X size={17} />
      </button>

      <div className="toast-progress" />
    </div>
  );
}

const styles = `
  .mis-cursos-page {
    width: 100%;
    min-width: 0;
    padding: 0 34px 50px;
    color: var(--app-text);
  }

  .mis-cursos-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    margin-bottom: 22px;
    padding: 28px 30px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 27px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow);
  }

  .mis-cursos-header::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
    background:
      linear-gradient(
        180deg,
        var(--app-accent),
        var(--app-accent-hover)
      );
  }

  .mis-cursos-header::after {
    content: "";
    position: absolute;
    top: -105px;
    right: -65px;
    width: 300px;
    height: 260px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        var(--app-accent-softer),
        transparent 70%
      );
    pointer-events: none;
  }

  .mis-cursos-header__content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 18px;
    min-width: 0;
  }

  .mis-cursos-header__icon {
    width: 61px;
    height: 61px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border: 1px solid var(--app-border-strong);
    border-radius: 19px;
    color: var(--app-accent-dark);
    background:
      linear-gradient(
        135deg,
        var(--app-accent-soft),
        var(--app-surface-alt)
      );
    box-shadow: var(--app-shadow-sm);
  }

  .mis-cursos-eyebrow,
  .section-eyebrow,
  .modal-eyebrow {
    display: block;
    color: var(--app-accent-dark);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .16em;
    text-transform: uppercase;
  }

  .modal-eyebrow.danger {
    color: var(--app-danger);
  }

  .mis-cursos-header h1 {
    margin: 5px 0 0;
    color: var(--app-text);
    font-size: clamp(27px, 3vw, 34px);
    font-weight: 900;
    letter-spacing: -.035em;
  }

  .mis-cursos-header p {
    margin: 6px 0 0;
    color: var(--app-text-soft);
    font-size: 13px;
    line-height: 1.55;
  }

  .mis-cursos-header__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 13px;
  }

  .mis-cursos-header__meta span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 9px;
    border: 1px solid var(--app-warning-border);
    border-radius: 999px;
    color: var(--app-warning-strong);
    background: var(--app-warning-bg);
    font-size: 9px;
    font-weight: 700;
  }

  .header-actions {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 9px;
    flex-shrink: 0;
  }

  .btn-header-secondary,
  .btn-header-refresh {
    min-height: 43px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 999px;
    font-family: inherit;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    transition:
      transform .18s ease,
      border-color .18s ease,
      background .18s ease;
  }

  .btn-header-secondary {
    border: 1px solid var(--app-border-strong);
    color: var(--app-accent-dark);
    background: var(--app-surface);
  }

  .btn-header-refresh {
    border: none;
    color: white;
    background:
      linear-gradient(
        135deg,
        var(--app-accent),
        var(--app-accent-hover)
      );
  }

  .btn-header-secondary:hover,
  .btn-header-refresh:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .btn-header-refresh:disabled {
    opacity: .65;
    cursor: not-allowed;
  }

  .summary-grid {
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 22px;
  }

  .summary-card {
    position: relative;
    min-width: 0;
    min-height: 103px;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 19px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 22px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
    transition:
      transform .2s ease,
      box-shadow .2s ease,
      border-color .2s ease;
  }

  .summary-card:hover {
    transform: translateY(-3px);
    border-color: var(--app-border-strong);
    box-shadow: var(--app-shadow);
  }

  .summary-icon {
    width: 50px;
    height: 50px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 16px;
  }

  .summary-icon.total {
    color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .summary-icon.activos {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .summary-icon.estudiantes {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .summary-icon.codigos {
    color: var(--app-warning);
    background: var(--app-warning-bg);
  }

  .summary-information {
    min-width: 0;
  }

  .summary-information strong {
    display: block;
    color: var(--app-text);
    font-size: 25px;
    font-weight: 900;
    line-height: 1;
  }

  .summary-information span {
    display: block;
    margin-top: 6px;
    color: var(--app-text-secondary);
    font-size: 11px;
    font-weight: 700;
  }

  .summary-information small {
    display: block;
    margin-top: 4px;
    overflow: hidden;
    color: var(--app-text-muted);
    font-size: 9px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .filters-card {
    margin-bottom: 22px;
    padding: 23px 24px;
    border: 1px solid var(--app-border);
    border-radius: 23px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow);
  }

  .filters-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
  }

  .filters-card h2 {
    margin: 5px 0 0;
    color: var(--app-text);
    font-size: 19px;
    font-weight: 800;
  }

  .filters-card p {
    margin: 5px 0 0;
    color: var(--app-text-soft);
    font-size: 11px;
  }

  .results-counter {
    min-width: 100px;
    padding: 10px 13px;
    border: 1px solid var(--app-border);
    border-radius: 15px;
    background: var(--app-surface-alt);
    text-align: right;
  }

  .results-counter strong {
    display: block;
    color: var(--app-accent-dark);
    font-size: 18px;
    font-weight: 800;
  }

  .results-counter span {
    display: block;
    margin-top: 2px;
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .filters-content {
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      minmax(280px, .75fr);
    gap: 16px;
    align-items: center;
    margin-top: 18px;
  }

  .state-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .state-filters button {
    min-height: 37px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 11px 7px 13px;
    border: 1px solid var(--app-input-border);
    border-radius: 999px;
    color: var(--app-text-soft);
    background: var(--app-surface);
    font-family: inherit;
    cursor: pointer;
  }

  .state-filters button.active {
    border-color: var(--app-accent);
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .filter-name {
    font-size: 10px;
    font-weight: 600;
  }

  .filter-count {
    min-width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--app-accent-softer);
    font-size: 9px;
    font-weight: 700;
  }

  .search-box {
    min-height: 43px;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px 8px 13px;
    border: 1px solid var(--app-input-border);
    border-radius: 14px;
    color: var(--app-text-muted);
    background: var(--app-surface);
  }

  .search-box:focus-within {
    border-color: var(--app-accent);
    box-shadow:
      0 0 0 4px
      var(--app-input-ring);
  }

  .search-box input {
    width: 100%;
    min-width: 0;
    border: none;
    outline: none;
    color: var(--app-text-secondary);
    background: transparent;
    font-family: inherit;
    font-size: 11px;
  }

  .search-box button {
    width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border: none;
    border-radius: 9px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    cursor: pointer;
  }

  .courses-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .course-card {
    position: relative;
    min-width: 0;
    padding: 21px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 24px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow);
    transition:
      transform .2s ease,
      border-color .2s ease,
      box-shadow .2s ease;
  }

  .course-card:hover {
    transform: translateY(-3px);
    border-color: var(--app-border-strong);
    box-shadow: var(--app-shadow-lg);
  }

  .course-accent {
    position: absolute;
    top: 0;
    left: 0;
    width: 5px;
    height: 78px;
    border-radius: 0 0 5px 0;
    background:
      linear-gradient(
        180deg,
        var(--app-accent),
        var(--app-accent-hover)
      );
  }

  .course-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
  }

  .course-identity {
    min-width: 0;
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .course-icon {
    width: 47px;
    height: 47px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border: 1px solid var(--app-border);
    border-radius: 15px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    box-shadow: var(--app-shadow-sm);
  }

  .course-title {
    min-width: 0;
  }

  .course-code {
    color: var(--app-accent-dark);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .11em;
    text-transform: uppercase;
  }

  .course-title h2 {
    margin: 4px 0 0;
    overflow: hidden;
    color: var(--app-text);
    font-size: 17px;
    font-weight: 800;
    line-height: 1.25;
    text-overflow: ellipsis;
  }

  .course-title p {
    margin: 5px 0 0;
    color: var(--app-text-soft);
    font-size: 10px;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 700;
  }

  .status-badge.activo {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .status-badge.inactivo {
    color: var(--app-text-muted);
    background: var(--app-surface-disabled);
  }

  .status-badge.finalizado {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .course-data-grid {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-top: 18px;
  }

  .data-item {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 10px;
    border: 1px solid var(--app-border-soft);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .data-item > svg {
    flex-shrink: 0;
    color: var(--app-accent);
  }

  .data-item strong {
    display: block;
    color: var(--app-text);
    font-size: 14px;
    font-weight: 700;
  }

  .data-item span {
    display: block;
    margin-top: 2px;
    color: var(--app-text-soft);
    font-size: 8px;
  }

  .capacity-panel {
    margin-top: 13px;
    padding: 12px 13px;
    border: 1px solid var(--app-border-soft);
    border-radius: 15px;
    background: var(--app-surface-alt);
  }

  .capacity-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .capacity-header > div strong {
    display: block;
    color: var(--app-text-secondary);
    font-size: 10px;
    font-weight: 600;
  }

  .capacity-header > div span {
    display: block;
    margin-top: 3px;
    color: var(--app-text-muted);
    font-size: 8px;
  }

  .capacity-percent {
    font-size: 11px;
    font-weight: 700;
  }

  .capacity-percent.success {
    color: var(--app-success);
  }

  .capacity-percent.warning {
    color: var(--app-warning);
  }

  .capacity-percent.danger {
    color: var(--app-danger);
  }

  .capacity-track {
    height: 7px;
    margin-top: 10px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--app-border-soft);
  }

  .capacity-progress {
    height: 100%;
    display: block;
    border-radius: inherit;
  }

  .capacity-progress.success {
    background: var(--app-success);
  }

  .capacity-progress.warning {
    background: var(--app-warning);
  }

  .capacity-progress.danger {
    background: var(--app-danger);
  }

  .code-panel {
    margin-top: 14px;
    padding: 14px;
    border: 1px solid var(--app-border);
    border-radius: 17px;
    background: var(--app-bg-soft);
  }

  .code-panel.is-active {
    border-color: var(--app-success-border);
  }

  .code-panel__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .code-title {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .code-icon {
    width: 35px;
    height: 35px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 11px;
    color: var(--app-warning);
    background: var(--app-warning-bg);
  }

  .code-title strong {
    display: block;
    color: var(--app-text-secondary);
    font-size: 10px;
    font-weight: 600;
  }

  .code-title span {
    display: block;
    margin-top: 2px;
    color: var(--app-text-muted);
    font-size: 8px;
  }

  .code-state {
    flex-shrink: 0;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 700;
  }

  .code-state.active {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .code-state.inactive {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .code-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 12px;
    padding: 10px 10px 10px 13px;
    border: 1px dashed var(--app-border-strong);
    border-radius: 13px;
    background: var(--app-surface);
  }

  .code-display > strong {
    min-width: 0;
    overflow: hidden;
    color: var(--app-accent-dark);
    font-size: 21px;
    font-weight: 800;
    letter-spacing: .16em;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .copy-button {
    width: 35px;
    height: 35px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    cursor: pointer;
  }

  .copy-button.copied {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .code-information {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 9px;
    margin-top: 9px;
    color: var(--app-text-soft);
    font-size: 8px;
  }

  .code-information span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .no-code {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    margin-top: 12px;
    padding: 11px;
    border-radius: 13px;
    color: var(--app-text-soft);
    background: var(--app-surface);
  }

  .no-code > svg {
    flex-shrink: 0;
    color: var(--app-warning);
  }

  .no-code strong {
    display: block;
    color: var(--app-text-secondary);
    font-size: 10px;
    font-weight: 600;
  }

  .no-code span {
    display: block;
    margin-top: 3px;
    font-size: 8px;
    line-height: 1.45;
  }

  .course-actions {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 17px;
  }

  .btn-primary,
  .btn-students,
  .btn-secondary,
  .btn-danger,
  .modal-primary,
  .modal-secondary,
  .modal-danger {
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 10px 14px;
    border-radius: 12px;
    font-family: inherit;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    transition:
      transform .17s ease,
      border-color .17s ease,
      background .17s ease,
      opacity .17s ease;
  }

  .btn-primary {
    border: none;
    color: white;
    background:
      linear-gradient(
        135deg,
        var(--app-accent),
        var(--app-accent-hover)
      );
  }

  .btn-students {
    border: 1px solid var(--app-purple-border, var(--app-border-strong));
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .btn-secondary {
    border: 1px solid var(--app-border-strong);
    color: var(--app-accent-dark);
    background: transparent;
  }

  .btn-danger {
    border: 1px solid var(--app-danger-border);
    color: var(--app-danger);
    background: transparent;
  }

  .btn-primary:hover:not(:disabled) {
    filter: brightness(1.03);
  }

  .btn-students:hover:not(:disabled) {
    border-color: var(--app-purple);
  }

  .btn-secondary:hover:not(:disabled) {
    border-color: var(--app-accent);
    background: var(--app-accent-softer);
  }

  .btn-danger:hover:not(:disabled) {
    background: var(--app-danger-bg);
  }

  .course-actions button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .course-actions button:disabled,
  .modal-actions button:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .state-card {
    padding: 26px;
    border: 1px solid var(--app-border);
    border-radius: 21px;
    color: var(--app-text-soft);
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .state-card--loading {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .state-card--loading strong {
    display: block;
    color: var(--app-text);
    font-size: 13px;
  }

  .state-card--loading p {
    margin: 4px 0 0;
    font-size: 10px;
  }

  .state-card--empty {
    min-height: 260px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: center;
  }

  .empty-icon {
    width: 65px;
    height: 65px;
    display: grid;
    place-items: center;
    margin-bottom: 4px;
    border-radius: 20px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .spinner {
    width: 23px;
    height: 23px;
    flex-shrink: 0;
    border: 3px solid var(--app-border);
    border-top-color: var(--app-accent);
    border-radius: 50%;
    animation: spin .8s linear infinite;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 8000;
    display: grid;
    place-items: center;
    padding: 20px;
    background: var(--app-overlay);
    backdrop-filter: blur(7px);
  }

  .app-modal {
    position: relative;
    width: min(550px, 100%);
    max-height: calc(100dvh - 40px);
    overflow-y: auto;
    padding: 30px;
    border: 1px solid var(--app-border);
    border-radius: 27px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-modal);
  }

  .modal-close {
    position: absolute;
    top: 17px;
    right: 17px;
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    cursor: pointer;
  }

  .modal-main-icon {
    width: 59px;
    height: 59px;
    display: grid;
    place-items: center;
    margin-bottom: 18px;
    border-radius: 19px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .modal-main-icon.danger {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .app-modal h3 {
    margin: 7px 0 0;
    color: var(--app-text);
    font-size: 23px;
    font-weight: 800;
  }

  .modal-intro {
    margin: 10px 0 0;
    color: var(--app-text-soft);
    font-size: 12px;
    line-height: 1.65;
  }

  .steps-list {
    display: grid;
    gap: 10px;
    margin-top: 19px;
  }

  .steps-list > div {
    display: grid;
    grid-template-columns: 35px 1fr;
    gap: 11px;
    align-items: flex-start;
    padding: 12px;
    border: 1px solid var(--app-border-soft);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .step-number {
    width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .steps-list strong {
    color: var(--app-text);
    font-size: 11px;
    font-weight: 600;
  }

  .steps-list p {
    margin: 3px 0 0;
    color: var(--app-text-soft);
    font-size: 10px;
    line-height: 1.5;
  }

  .current-code-box {
    margin-top: 17px;
    padding: 14px;
    border: 1px solid var(--app-border);
    border-radius: 15px;
    background: var(--app-surface-alt);
  }

  .current-code-box strong {
    display: block;
    margin-top: 5px;
    color: var(--app-accent-dark);
    font-size: 21px;
    font-weight: 700;
    letter-spacing: .14em;
  }

  .duration-section {
    margin-top: 19px;
  }

  .duration-title {
    display: block;
    margin-bottom: 10px;
    color: var(--app-text);
    font-size: 11px;
    font-weight: 600;
  }

  .duration-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .duration-option {
    position: relative;
    min-height: 86px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 13px 13px 12px 39px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    color: var(--app-text);
    background: var(--app-surface-alt);
    font-family: inherit;
    text-align: left;
    cursor: pointer;
  }

  .duration-option.active {
    border-color: var(--app-accent);
    background: var(--app-accent-softer);
  }

  .duration-check {
    position: absolute;
    top: 13px;
    left: 12px;
    width: 19px;
    height: 19px;
    display: grid;
    place-items: center;
    border: 1px solid var(--app-border-strong);
    border-radius: 7px;
    color: white;
    background: var(--app-surface);
  }

  .duration-option.active .duration-check {
    border-color: var(--app-accent);
    background: var(--app-accent);
  }

  .duration-option strong {
    font-size: 11px;
    font-weight: 600;
  }

  .duration-option small {
    display: block;
    margin-top: 5px;
    color: var(--app-text-soft);
    font-size: 9px;
    line-height: 1.4;
  }

  .modal-notice {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-top: 17px;
    padding: 13px;
    border-radius: 14px;
  }

  .modal-notice.success {
    border: 1px solid var(--app-success-border);
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .modal-notice.warning {
    border: 1px solid var(--app-warning-border);
    color: var(--app-warning);
    background: var(--app-warning-bg);
  }

  .modal-notice.danger {
    border: 1px solid var(--app-danger-border);
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .modal-notice strong {
    display: block;
    font-size: 10px;
    font-weight: 600;
  }

  .modal-notice span {
    display: block;
    margin-top: 4px;
    color: var(--app-text-soft);
    font-size: 9px;
    line-height: 1.5;
  }

  .modal-actions {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 9px;
    margin-top: 20px;
  }

  .app-modal > .modal-primary {
    width: 100%;
    margin-top: 20px;
  }

  .modal-primary {
    border: none;
    color: white;
    background:
      linear-gradient(
        135deg,
        var(--app-accent),
        var(--app-accent-hover)
      );
  }

  .modal-secondary {
    border: 1px solid var(--app-border-strong);
    color: var(--app-text-secondary);
    background: transparent;
  }

  .modal-danger {
    border: none;
    color: white;
    background: var(--app-danger);
  }

  .toast {
    position: fixed;
    top: 25px;
    right: 28px;
    z-index: 9999;
    width: min(390px, calc(100vw - 40px));
    display: grid;
    grid-template-columns: 42px 1fr 27px;
    gap: 11px;
    align-items: flex-start;
    padding: 15px 15px 18px;
    overflow: hidden;
    border-radius: 18px;
    box-shadow: var(--app-shadow-lg);
  }

  .toast.exito {
    border: 1px solid var(--app-success-border);
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .toast.error {
    border: 1px solid var(--app-danger-border);
    color: var(--app-danger-strong);
    background: var(--app-danger-bg);
  }

  .toast-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 13px;
  }

  .toast-content strong {
    display: block;
    font-size: 13px;
    font-weight: 600;
  }

  .toast-content p {
    margin: 4px 0 0;
    color: var(--app-text-soft);
    font-size: 10px;
    line-height: 1.45;
  }

  .toast > button {
    width: 27px;
    height: 27px;
    display: grid;
    place-items: center;
    border: none;
    color: var(--app-text-muted);
    background: transparent;
    cursor: pointer;
  }

  .toast-progress {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 4px;
    transform-origin: left center;
    animation: toastProgress 5s linear forwards;
  }

  .toast.exito .toast-progress {
    background: var(--app-success);
  }

  .toast.error .toast-progress {
    background: var(--app-danger);
  }

  .spin {
    animation: spin .8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes toastProgress {
    from {
      transform: scaleX(1);
    }

    to {
      transform: scaleX(0);
    }
  }

  @media (max-width: 1180px) {
    .summary-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .courses-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 950px) {
    .mis-cursos-header {
      align-items: stretch;
      flex-direction: column;
    }

    .header-actions {
      width: 100%;
    }

    .header-actions button {
      flex: 1;
    }

    .filters-content {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    .mis-cursos-page {
      padding: 0 18px 38px;
    }

    .summary-grid {
      grid-template-columns: 1fr;
    }

    .filters-card__header {
      flex-direction: column;
    }

    .results-counter {
      width: 100%;
      text-align: left;
    }

    .course-data-grid {
      grid-template-columns: 1fr;
    }

    .course-actions {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 540px) {
    .mis-cursos-page {
      padding: 0 12px 34px;
    }

    .mis-cursos-header {
      padding: 23px 18px;
    }

    .mis-cursos-header__content {
      align-items: flex-start;
    }

    .header-actions {
      flex-direction: column;
    }

    .header-actions button {
      width: 100%;
    }

    .filters-card {
      padding: 18px;
    }

    .state-filters {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .state-filters button {
      justify-content: space-between;
    }

    .course-card {
      padding: 18px;
    }

    .course-card__header {
      flex-direction: column;
    }

    .status-badge {
      margin-left: 59px;
    }

    .code-information {
      flex-direction: column;
      align-items: flex-start;
    }

    .duration-grid {
      grid-template-columns: 1fr;
    }

    .modal-actions {
      grid-template-columns: 1fr;
    }

    .app-modal {
      padding: 25px 18px 20px;
    }

    .toast {
      top: 14px;
      right: 14px;
      width: calc(100vw - 28px);
    }
  }
`;