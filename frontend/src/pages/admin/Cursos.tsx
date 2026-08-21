import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  ChangeEvent,
  FormEvent,
  ReactNode,
} from 'react';

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleX,
  CircleHelp,
  Clock3,
  Download,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Layers3,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

import { useAuth } from '../../auth/AuthContext';

type EstadoCurso = 'ACTIVO' | 'INACTIVO' | 'FINALIZADO';
type FiltroEstado = 'TODOS' | 'ACTIVOS' | 'INACTIVOS' | 'FINALIZADOS';
type TipoToast = 'exito' | 'error';

type Materia = {
  id: number;
  nombre: string;
  codigo: string;
  semestre: number;
  estado: 'ACTIVA' | 'INACTIVA';
};

type Docente = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  correo: string;
  rol: 'ADMINISTRADOR' | 'DOCENTE' | 'ESTUDIANTE';
  estaActivo: boolean;
  cuentaActivada: boolean;
  fotoPerfilUrl?: string | null;
};

type Curso = {
  id: number;
  materiaId: number;
  docenteId: number;
  gestion: string;
  paralelo: string;
  semestre: number;
  cupoMaximo?: number | null;
  estado: EstadoCurso;
  finalizadoEn?: string | null;
  creadoEn: string;
  actualizadoEn: string;
  materia: Materia;
  docente: Docente;
};

type FormularioCurso = {
  materiaId: string;
  docenteId: string;
  gestion: string;
  paralelo: string;
  semestre: string;
  cupoMaximo: string;
};

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

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

const semestres =
  Array.from(
    { length: 9 },
    (_, indice) => indice + 1,
  );

const paralelos = ['A', 'B', 'C', 'D', 'E'];

function obtenerGestionActual(): string {
  const fechaActual =
    new Date();

  const anio =
    fechaActual.getFullYear();

  const mes =
    fechaActual.getMonth() + 1;

  const periodo =
    mes <= 6
      ? '1'
      : '2';

  return `${anio}-${periodo}`;
}

function obtenerDescripcionGestion(
  gestion: string,
): string {
  return gestion.endsWith(
    '-1',
  )
    ? 'Enero a junio'
    : 'Julio a diciembre';
}

function crearFormularioInicial():
  FormularioCurso {
  return {
    materiaId: '',
    docenteId: '',
    gestion:
      obtenerGestionActual(),
    paralelo: 'A',
    semestre: '',
    cupoMaximo: '',
  };
}

const formularioInicial =
  crearFormularioInicial();

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

function headersAutorizados(
  token: string,
  json = false,
): HeadersInit {
  return {
    ...(json
      ? {
          'Content-Type':
            'application/json',
        }
      : {}),

    Authorization:
      `Bearer ${token}`,
  };
}

function construirUrlFoto(
  fotoPerfilUrl:
    string | null | undefined,
): string | null {
  if (!fotoPerfilUrl) {
    return null;
  }

  if (
    fotoPerfilUrl.startsWith(
      'http://',
    ) ||
    fotoPerfilUrl.startsWith(
      'https://',
    )
  ) {
    return fotoPerfilUrl;
  }

  return `${API_URL}${fotoPerfilUrl}`;
}

function nombreDocente(
  docente: Docente,
): string {
  return [
    docente.nombres,
    docente.apellidoPaterno,
    docente.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(' ');
}

function formatearFecha(
  valor?: string | null,
): string {
  if (!valor) {
    return 'No registrada';
  }

  const fecha =
    new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime(),
    )
  ) {
    return 'Fecha no válida';
  }

  return new Intl.DateTimeFormat(
    'es-BO',
    {
      dateStyle: 'long',
      timeStyle: 'short',
    },
  ).format(fecha);
}

export default function Cursos() {
  const {
    accessToken,
    cerrarSesion,
  } = useAuth();

  const [cursos, setCursos] =
    useState<Curso[]>([]);

  const [materias, setMaterias] =
    useState<Materia[]>([]);

  const [docentes, setDocentes] =
    useState<Docente[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [panelAbierto, setPanelAbierto] =
    useState(false);

  const [cursoEditandoId, setCursoEditandoId] =
    useState<number | null>(null);

  const [cursoEstado, setCursoEstado] =
    useState<Curso | null>(null);

  const [estadoDestino, setEstadoDestino] =
    useState<EstadoCurso | null>(null);

  const [formulario, setFormulario] =
    useState<FormularioCurso>(
      formularioInicial,
    );

  const [guardando, setGuardando] =
    useState(false);

  const [actualizandoEstado, setActualizandoEstado] =
    useState(false);

  const [busqueda, setBusqueda] =
    useState('');

  const [filtroEstado, setFiltroEstado] =
    useState<FiltroEstado>('ACTIVOS');

  const [filtroGestion, setFiltroGestion] =
    useState('TODAS');

  const [filtroSemestre, setFiltroSemestre] =
    useState('TODOS');

  const [toast, setToast] =
    useState<ToastEstado>({
      visible: false,
      tipo: 'exito',
      titulo: '',
      mensaje: '',
    });

  const [
    modalEstadosAbierto,
    setModalEstadosAbierto,
  ] = useState(false);

  const [
    cursoHistorial,
    setCursoHistorial,
  ] = useState<Curso | null>(
    null,
  );

  const [
    descargandoReporte,
    setDescargandoReporte,
  ] = useState(false);

  const [
    modalReportesAbierto,
    setModalReportesAbierto,
  ] = useState(false);

  const [
    descargandoReporteGeneral,
    setDescargandoReporteGeneral,
  ] = useState<
    'pdf' |
    'excel' |
    null
  >(null);

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
    useCallback(() => {
      setToast(
        (anterior) => ({
          ...anterior,
          visible: false,
        }),
      );
    }, []);

  const verificarSesion =
    useCallback(
      (respuesta: Response) => {
        if (respuesta.status === 401) {
          cerrarSesion();

          throw new Error(
            'Tu sesión venció. Inicia sesión nuevamente.',
          );
        }
      },
      [cerrarSesion],
    );

  const obtenerDatos =
    useCallback(
      async () => {
        if (!accessToken) {
          setCargando(false);
          return;
        }

        try {
          setCargando(true);

          const [
            respuestaCursos,
            respuestaMaterias,
            respuestaUsuarios,
          ] = await Promise.all([
            fetch(`${API_URL}/cursos`, {
              headers:
                headersAutorizados(
                  accessToken,
                ),
            }),

            fetch(`${API_URL}/materias`, {
              headers:
                headersAutorizados(
                  accessToken,
                ),
            }),

            fetch(`${API_URL}/usuarios`, {
              headers:
                headersAutorizados(
                  accessToken,
                ),
            }),
          ]);

          [
            respuestaCursos,
            respuestaMaterias,
            respuestaUsuarios,
          ].forEach(verificarSesion);

          const [
            datosCursos,
            datosMaterias,
            datosUsuarios,
          ] = await Promise.all([
            respuestaCursos.json().catch(() => ({})),
            respuestaMaterias.json().catch(() => ({})),
            respuestaUsuarios.json().catch(() => ({})),
          ]);

          if (!respuestaCursos.ok) {
            throw new Error(
              obtenerMensajeError(
                datosCursos as RespuestaError,
                'No fue posible obtener los cursos.',
              ),
            );
          }

          if (!respuestaMaterias.ok) {
            throw new Error(
              obtenerMensajeError(
                datosMaterias as RespuestaError,
                'No fue posible obtener las materias.',
              ),
            );
          }

          if (!respuestaUsuarios.ok) {
            throw new Error(
              obtenerMensajeError(
                datosUsuarios as RespuestaError,
                'No fue posible obtener los docentes.',
              ),
            );
          }

          if (
            !Array.isArray(datosCursos) ||
            !Array.isArray(datosMaterias) ||
            !Array.isArray(datosUsuarios)
          ) {
            throw new Error(
              'El servidor devolvió una respuesta no válida.',
            );
          }

          setCursos(
            datosCursos as Curso[],
          );

          setMaterias(
            (datosMaterias as Materia[])
              .filter(
                (materia) =>
                  materia.estado === 'ACTIVA',
              ),
          );

          setDocentes(
            (datosUsuarios as Docente[])
              .filter(
                (usuario) =>
                  usuario.rol === 'DOCENTE' &&
                  usuario.estaActivo,
              ),
          );
        } catch (error) {
          console.error(error);

          mostrarToast(
            'error',
            'Error al cargar',
            error instanceof Error
              ? error.message
              : 'No fue posible cargar la información.',
          );
        } finally {
          setCargando(false);
        }
      },
      [
        accessToken,
        mostrarToast,
        verificarSesion,
      ],
    );

  useEffect(() => {
    void obtenerDatos();
  }, [obtenerDatos]);

  const limpiarFormulario = () => {
    setFormulario(
      crearFormularioInicial(),
    );

    setCursoEditandoId(null);
  };

  const abrirNuevoCurso = () => {
    limpiarFormulario();
    setPanelAbierto(true);
  };

  const abrirEdicion = (
    curso: Curso,
  ) => {
    if (
      curso.estado ===
      'FINALIZADO'
    ) {
      mostrarToast(
        'error',
        'Curso finalizado',
        'Los cursos finalizados se conservan únicamente como historial y no pueden editarse.',
      );

      return;
    }

    setFormulario({
      materiaId:
        String(curso.materiaId),

      docenteId:
        String(curso.docenteId),

      gestion:
        curso.gestion,

      paralelo:
        curso.paralelo,

      semestre:
        String(curso.semestre),

      cupoMaximo:
        curso.cupoMaximo
          ? String(curso.cupoMaximo)
          : '',
    });

    setCursoEditandoId(
      curso.id,
    );

    setPanelAbierto(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const cerrarFormulario = () => {
    limpiarFormulario();
    setPanelAbierto(false);
  };

  const manejarCambio = (
    event:
      ChangeEvent<
        HTMLInputElement |
        HTMLSelectElement
      >,
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormulario(
      (anterior) => {
        if (name === 'materiaId') {
          const materia =
            materias.find(
              (item) =>
                item.id === Number(value),
            );

          return {
            ...anterior,
            materiaId: value,
            semestre:
              materia
                ? String(materia.semestre)
                : '',
          };
        }

        return {
          ...anterior,
          [name]: value,
        };
      },
    );
  };

  const validarFormulario = () => {
    if (
      !formulario.materiaId ||
      !formulario.docenteId ||
      !formulario.gestion ||
      !formulario.paralelo ||
      !formulario.semestre
    ) {
      mostrarToast(
        'error',
        'Datos incompletos',
        'Completa todos los campos obligatorios.',
      );

      return false;
    }

    if (formulario.cupoMaximo) {
      const cupo =
        Number(formulario.cupoMaximo);

      if (
        !Number.isInteger(cupo) ||
        cupo < 1 ||
        cupo > 200
      ) {
        mostrarToast(
          'error',
          'Cupo no válido',
          'El cupo debe estar entre 1 y 200.',
        );

        return false;
      }
    }

    return true;
  };

  const guardarCurso =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (
        guardando ||
        !accessToken ||
        !validarFormulario()
      ) {
        return;
      }

      const editando =
        cursoEditandoId !== null;

      try {
        setGuardando(true);

        const respuesta =
          await fetch(
            editando
              ? `${API_URL}/cursos/${cursoEditandoId}`
              : `${API_URL}/cursos`,
            {
              method:
                editando
                  ? 'PUT'
                  : 'POST',

              headers:
                headersAutorizados(
                  accessToken,
                  true,
                ),

              body:
                JSON.stringify({
                  materiaId:
                    Number(
                      formulario.materiaId,
                    ),

                  docenteId:
                    Number(
                      formulario.docenteId,
                    ),

                  gestion:
                    formulario.gestion,

                  paralelo:
                    formulario.paralelo,

                  semestre:
                    Number(
                      formulario.semestre,
                    ),

                  cupoMaximo:
                    formulario.cupoMaximo
                      ? Number(
                          formulario.cupoMaximo,
                        )
                      : undefined,
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
              editando
                ? 'No fue posible actualizar el curso.'
                : 'No fue posible crear el curso.',
            ),
          );
        }

        cerrarFormulario();
        await obtenerDatos();

        mostrarToast(
          'exito',
          editando
            ? 'Curso actualizado'
            : 'Curso creado',
          (datos as { mensaje?: string }).mensaje ||
            (
              editando
                ? 'El curso fue actualizado correctamente.'
                : 'El curso fue registrado correctamente.'
            ),
        );
      } catch (error) {
        console.error(error);

        mostrarToast(
          'error',
          editando
            ? 'No se pudo actualizar'
            : 'No se pudo crear',
          error instanceof Error
            ? error.message
            : 'No fue posible guardar el curso.',
        );
      } finally {
        setGuardando(false);
      }
    };

  const abrirCambioEstado = (
    curso: Curso,
    estado: EstadoCurso,
  ) => {
    setCursoEstado(curso);
    setEstadoDestino(estado);
  };

  const cerrarCambioEstado = () => {
    setCursoEstado(null);
    setEstadoDestino(null);
  };

  const cambiarEstadoCurso =
    async () => {
      if (
        !cursoEstado ||
        !estadoDestino ||
        !accessToken ||
        actualizandoEstado
      ) {
        return;
      }

      try {
        setActualizandoEstado(true);

        const respuesta =
          await fetch(
            `${API_URL}/cursos/${cursoEstado.id}/estado`,
            {
              method: 'PATCH',

              headers:
                headersAutorizados(
                  accessToken,
                  true,
                ),

              body:
                JSON.stringify({
                  estado:
                    estadoDestino,
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
              'No fue posible cambiar el estado del curso.',
            ),
          );
        }

        setCursos(
          (anteriores) =>
            anteriores.map(
              (curso) =>
                curso.id === cursoEstado.id
                  ? {
                      ...curso,
                      estado: estadoDestino,
                    }
                  : curso,
            ),
        );

        cerrarCambioEstado();

        mostrarToast(
          'exito',
          estadoDestino === 'ACTIVO'
            ? 'Curso reactivado'
            : estadoDestino === 'INACTIVO'
              ? 'Curso desactivado'
              : 'Curso finalizado',
          (datos as { mensaje?: string }).mensaje ||
            'El estado fue actualizado correctamente.',
        );
      } catch (error) {
        console.error(error);

        mostrarToast(
          'error',
          'No se pudo actualizar',
          error instanceof Error
            ? error.message
            : 'No fue posible cambiar el estado.',
        );
      } finally {
        setActualizandoEstado(false);
      }
    };

  const descargarReporteGeneral =
    async (
      formato:
        'pdf' |
        'excel',
    ) => {
      if (
        !accessToken ||
        descargandoReporteGeneral
      ) {
        return;
      }

      try {
        setDescargandoReporteGeneral(
          formato,
        );

        const respuesta =
          await fetch(
            `${API_URL}/cursos/exportar/${formato}`,
            {
              method: 'GET',

              headers:
                headersAutorizados(
                  accessToken,
                ),
            },
          );

        verificarSesion(
          respuesta,
        );

        if (!respuesta.ok) {
          const datos =
            await respuesta
              .json()
              .catch(() => ({}));

          throw new Error(
            obtenerMensajeError(
              datos as RespuestaError,
              `No fue posible generar el reporte general en ${formato.toUpperCase()}.`,
            ),
          );
        }

        const archivo =
          await respuesta.blob();

        const url =
          URL.createObjectURL(
            archivo,
          );

        const enlace =
          document.createElement(
            'a',
          );

        enlace.href =
          url;

        enlace.download =
          formato === 'pdf'
            ? 'reporte-general-cursos-iusacademy.pdf'
            : 'reporte-general-cursos-iusacademy.xlsx';

        document.body.appendChild(
          enlace,
        );

        enlace.click();
        enlace.remove();

        URL.revokeObjectURL(
          url,
        );

        setModalReportesAbierto(
          false,
        );

        mostrarToast(
          'exito',
          'Reporte descargado',
          `El reporte general en ${formato.toUpperCase()} fue descargado correctamente.`,
        );
      } catch (error) {
        console.error(
          error,
        );

        mostrarToast(
          'error',
          'No se pudo descargar',
          error instanceof Error
            ? error.message
            : 'No fue posible descargar el reporte general.',
        );
      } finally {
        setDescargandoReporteGeneral(
          null,
        );
      }
    };

  const descargarFichaHistorial =
    async () => {
      if (
        !cursoHistorial ||
        !accessToken ||
        descargandoReporte
      ) {
        return;
      }

      try {
        setDescargandoReporte(
          true,
        );

        const respuesta =
          await fetch(
            `${API_URL}/cursos/${cursoHistorial.id}/exportar/pdf`,
            {
              method: 'GET',

              headers:
                headersAutorizados(
                  accessToken,
                ),
            },
          );

        verificarSesion(
          respuesta,
        );

        if (!respuesta.ok) {
          const datos =
            await respuesta
              .json()
              .catch(() => ({}));

          throw new Error(
            obtenerMensajeError(
              datos as RespuestaError,
              'No fue posible generar la ficha histórica.',
            ),
          );
        }

        const archivo =
          await respuesta.blob();

        const url =
          URL.createObjectURL(
            archivo,
          );

        const enlace =
          document.createElement(
            'a',
          );

        enlace.href =
          url;

        enlace.download =
          `ficha-curso-${cursoHistorial.materia.codigo}-${cursoHistorial.gestion}-${cursoHistorial.paralelo}.pdf`;

        document.body.appendChild(
          enlace,
        );

        enlace.click();
        enlace.remove();

        URL.revokeObjectURL(
          url,
        );

        mostrarToast(
          'exito',
          'Reporte descargado',
          'La ficha histórica del curso fue descargada correctamente.',
        );
      } catch (error) {
        console.error(
          error,
        );

        mostrarToast(
          'error',
          'No se pudo descargar',
          error instanceof Error
            ? error.message
            : 'No fue posible descargar la ficha histórica.',
        );
      } finally {
        setDescargandoReporte(
          false,
        );
      }
    };

  const resumen =
    useMemo(
      () => ({
        total:
          cursos.length,

        activos:
          cursos.filter(
            (curso) =>
              curso.estado === 'ACTIVO',
          ).length,

        inactivos:
          cursos.filter(
            (curso) =>
              curso.estado === 'INACTIVO',
          ).length,

        finalizados:
          cursos.filter(
            (curso) =>
              curso.estado === 'FINALIZADO',
          ).length,
      }),
      [cursos],
    );

  const gestiones =
    useMemo(
      () =>
        Array.from(
          new Set(
            cursos.map(
              (curso) =>
                curso.gestion,
            ),
          ),
        ).sort(
          (a, b) =>
            b.localeCompare(a),
        ),
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
              (
                filtroEstado === 'ACTIVOS' &&
                curso.estado === 'ACTIVO'
              ) ||
              (
                filtroEstado === 'INACTIVOS' &&
                curso.estado === 'INACTIVO'
              ) ||
              (
                filtroEstado === 'FINALIZADOS' &&
                curso.estado === 'FINALIZADO'
              );

            const coincideGestion =
              filtroGestion === 'TODAS' ||
              curso.gestion === filtroGestion;

            const coincideSemestre =
              filtroSemestre === 'TODOS' ||
              curso.semestre ===
                Number(filtroSemestre);

            const coincideBusqueda =
              !texto ||
              curso.materia.nombre
                .toLowerCase()
                .includes(texto) ||
              curso.materia.codigo
                .toLowerCase()
                .includes(texto) ||
              nombreDocente(curso.docente)
                .toLowerCase()
                .includes(texto) ||
              curso.gestion
                .toLowerCase()
                .includes(texto) ||
              curso.paralelo
                .toLowerCase()
                .includes(texto);

            return (
              coincideEstado &&
              coincideGestion &&
              coincideSemestre &&
              coincideBusqueda
            );
          },
        );
      },
      [
        cursos,
        busqueda,
        filtroEstado,
        filtroGestion,
        filtroSemestre,
      ],
    );

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('ACTIVOS');
    setFiltroGestion('TODAS');
    setFiltroSemestre('TODOS');
  };

  return (
    <main className="cursos-page">
      {toast.visible && (
        <Toast
          tipo={toast.tipo}
          titulo={toast.titulo}
          mensaje={toast.mensaje}
          onCerrar={cerrarToast}
        />
      )}

      <header className="cursos-header">
        <div className="cursos-header__content">
          <div className="cursos-header__icon">
            <GraduationCap size={26} />
          </div>

          <div>
            <span className="cursos-eyebrow">
              Administración académica
            </span>

            <h1>
              Cursos
            </h1>

            <p>
              Organiza materias, docentes, gestiones y paralelos de IusAcademy.
            </p>

            <div className="cursos-header__meta">
              <span>9 semestres</span>
              <span>Gestión académica</span>
              <span>Asignación docente</span>
            </div>
          </div>
        </div>

        <div className="cursos-header__actions">
          <button
            type="button"
            className="btn-agregar"
            onClick={abrirNuevoCurso}
          >
            <Plus size={18} />

            Agregar curso
          </button>

          <button
            type="button"
            className="btn-reporte-general"
            onClick={() =>
              setModalReportesAbierto(
                true,
              )
            }
          >
            <FileText size={17} />

            Reporte general
          </button>
        </div>
      </header>

      <section className="summary-grid">
        <Resumen
          icono={<Layers3 size={21} />}
          cantidad={resumen.total}
          titulo="Total de cursos"
          clase="total"
        />

        <Resumen
          icono={<ToggleRight size={21} />}
          cantidad={resumen.activos}
          titulo="Cursos activos"
          clase="activos"
        />

        <Resumen
          icono={<ToggleLeft size={21} />}
          cantidad={resumen.inactivos}
          titulo="Cursos inactivos"
          clase="inactivos"
        />

        <Resumen
          icono={<CheckCircle2 size={21} />}
          cantidad={resumen.finalizados}
          titulo="Cursos finalizados"
          clase="finalizados"
        />
      </section>

      {panelAbierto && (
        <div className="form-modal-backdrop">
          <section className="form-card form-card--modal">
          <div className="form-card-header">
            <div>
              <span className="section-eyebrow">
                {cursoEditandoId
                  ? 'Editar curso'
                  : 'Nuevo curso'}
              </span>

              <h2>
                {cursoEditandoId
                  ? 'Actualizar curso'
                  : 'Registrar curso'}
              </h2>

              <p>
                Selecciona la materia, docente y gestión académica.
              </p>
            </div>

            <button
              type="button"
              className="btn-cerrar-form"
              onClick={cerrarFormulario}
              aria-label="Cerrar formulario"
            >
              <X size={18} />
            </button>
          </div>

          <form
            className="cursos-form"
            onSubmit={guardarCurso}
          >
            <div className="form-grid">
              <label>
                <span>Materia</span>

                <select
                  name="materiaId"
                  value={formulario.materiaId}
                  onChange={manejarCambio}
                  disabled={guardando}
                >
                  <option value="">
                    Selecciona una materia
                  </option>

                  {materias.map(
                    (materia) => (
                      <option
                        key={materia.id}
                        value={materia.id}
                      >
                        {materia.codigo} — {materia.nombre}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>Docente</span>

                <select
                  name="docenteId"
                  value={formulario.docenteId}
                  onChange={manejarCambio}
                  disabled={guardando}
                >
                  <option value="">
                    Selecciona un docente
                  </option>

                  {docentes.map(
                    (docente) => (
                      <option
                        key={docente.id}
                        value={docente.id}
                      >
                        {nombreDocente(docente)}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <div className="gestion-automatica-field">
                <span className="gestion-automatica-label">
                  Gestión académica
                </span>

                <div className="gestion-automatica-card">
                  <div className="gestion-automatica-icon">
                    <CalendarDays size={21} />
                  </div>

                  <div>
                    <strong>
                      {formulario.gestion}
                    </strong>

                    <span>
                      {obtenerDescripcionGestion(
                        formulario.gestion,
                      )}
                    </span>
                  </div>

                  <span className="gestion-automatica-badge">
                    Automática
                  </span>
                </div>

                <small className="field-help">
                  La gestión se asigna según la fecha actual y no puede modificarse manualmente.
                </small>
              </div>

              <label>
                <span>Paralelo</span>

                <select
                  name="paralelo"
                  value={formulario.paralelo}
                  onChange={manejarCambio}
                  disabled={guardando}
                >
                  {paralelos.map(
                    (paralelo) => (
                      <option
                        key={paralelo}
                        value={paralelo}
                      >
                        Paralelo {paralelo}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>Semestre</span>

                <select
                  name="semestre"
                  value={formulario.semestre}
                  onChange={manejarCambio}
                  disabled={
                    guardando ||
                    Boolean(formulario.materiaId)
                  }
                >
                  <option value="">
                    Selecciona un semestre
                  </option>

                  {semestres.map(
                    (semestre) => (
                      <option
                        key={semestre}
                        value={semestre}
                      >
                        {semestre}.º semestre
                      </option>
                    ),
                  )}
                </select>

                {formulario.materiaId && (
                  <small className="field-help">
                    El semestre se toma de la materia seleccionada.
                  </small>
                )}
              </label>

              <Campo
                titulo="Cupo máximo"
                nombre="cupoMaximo"
                valor={formulario.cupoMaximo}
                placeholder="Ej. 30"
                tipo="number"
                min="1"
                max="200"
                onChange={manejarCambio}
                disabled={guardando}
              />
            </div>

            {materias.length === 0 && (
              <div className="form-warning">
                <BookOpen size={18} />
                No existen materias activas disponibles.
              </div>
            )}

            {docentes.length === 0 && (
              <div className="form-warning">
                <UserRound size={18} />
                No existen docentes activos disponibles.
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={cerrarFormulario}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={
                  guardando ||
                  materias.length === 0 ||
                  docentes.length === 0
                }
              >
                {guardando
                  ? 'Guardando...'
                  : cursoEditandoId
                    ? 'Guardar cambios'
                    : 'Crear curso'}
              </button>
            </div>
          </form>
          </section>
        </div>
      )}

      <section className="cursos-card">
        <div className="cursos-card-top">
          <div>
            <h2>
              Cursos registrados
            </h2>

            <p>
              Consulta y administra la oferta académica.
            </p>
          </div>

          <div className="cursos-card-actions">
            <button
              type="button"
              className="btn-estados-info"
              onClick={() =>
                setModalEstadosAbierto(true)
              }
            >
              <CircleHelp size={16} />

              ¿Qué significa cada estado?
            </button>

            <div className="cursos-count-wrap">
              <span className="cursos-count">
                {cursosFiltrados.length} de {cursos.length}
              </span>

              <small>
                resultados visibles
              </small>
            </div>
          </div>
        </div>

        <div className="filters-row">
          <div className="state-filters">
            {[
              ['ACTIVOS', 'Activos', resumen.activos],
              ['INACTIVOS', 'Inactivos', resumen.inactivos],
              ['FINALIZADOS', 'Finalizados', resumen.finalizados],
              ['TODOS', 'Todos', resumen.total],
            ].map(
              ([valor, etiqueta, cantidad]) => (
                <button
                  key={String(valor)}
                  type="button"
                  className={
                    filtroEstado === valor
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setFiltroEstado(
                      valor as FiltroEstado,
                    )
                  }
                >
                  {etiqueta}
                  <span>{cantidad}</span>
                </button>
              ),
            )}
          </div>

          <div className="select-filters">
            <div className="select-filter">
              <CalendarDays size={16} />

              <select
                value={filtroGestion}
                onChange={(event) =>
                  setFiltroGestion(
                    event.target.value,
                  )
                }
              >
                <option value="TODAS">
                  Todas las gestiones
                </option>

                {gestiones.map(
                  (gestion) => (
                    <option
                      key={gestion}
                      value={gestion}
                    >
                      {gestion}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="select-filter">
              <SlidersHorizontal size={16} />

              <select
                value={filtroSemestre}
                onChange={(event) =>
                  setFiltroSemestre(
                    event.target.value,
                  )
                }
              >
                <option value="TODOS">
                  Todos los semestres
                </option>

                {semestres.map(
                  (semestre) => (
                    <option
                      key={semestre}
                      value={semestre}
                    >
                      {semestre}.º semestre
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="search-box">
          <Search size={17} />

          <input
            value={busqueda}
            onChange={(event) =>
              setBusqueda(event.target.value)
            }
            placeholder="Buscar por materia, código, docente, gestión o paralelo..."
          />

          {(busqueda ||
            filtroGestion !== 'TODAS' ||
            filtroSemestre !== 'TODOS' ||
            filtroEstado !== 'ACTIVOS') && (
            <button
              type="button"
              onClick={limpiarFiltros}
              title="Limpiar filtros"
            >
              <RefreshCcw size={15} />
            </button>
          )}
        </div>
      </section>

      <section className="table-section">
        {cargando ? (
          <div className="state-card state-card--loading">
            <span className="spinner" />
            Cargando cursos...
          </div>
        ) : cursosFiltrados.length === 0 ? (
          <div className="state-card state-card--empty">
            <GraduationCap size={30} />

            <strong>
              No se encontraron cursos
            </strong>

            <p>
              Ajusta los filtros o registra un nuevo curso.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="cursos-table">
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Docente</th>
                  <th>Gestión</th>
                  <th>Paralelo</th>
                  <th>Semestre</th>
                  <th>Cupo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {cursosFiltrados.map(
                  (curso) => (
                    <tr key={curso.id}>
                      <td>
                        <div className="curso-cell">
                          <div className="curso-icon">
                            <GraduationCap size={18} />
                          </div>

                          <div>
                            <strong>
                              {curso.materia.nombre}
                            </strong>

                            <span>
                              {curso.materia.codigo}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="docente-cell">
                          <div
                            className={`docente-avatar ${
                              construirUrlFoto(
                                curso.docente
                                  .fotoPerfilUrl,
                              )
                                ? 'has-image'
                                : 'has-initials'
                            }`}
                          >
                            {construirUrlFoto(
                              curso.docente
                                .fotoPerfilUrl,
                            ) ? (
                              <img
                                src={
                                  construirUrlFoto(
                                    curso.docente
                                      .fotoPerfilUrl,
                                  ) ??
                                  undefined
                                }
                                alt={`Fotografía de ${nombreDocente(
                                  curso.docente,
                                )}`}
                                loading="lazy"
                              />
                            ) : (
                              <span
                                aria-label={`Iniciales de ${nombreDocente(
                                  curso.docente,
                                )}`}
                              >
                                {curso.docente.nombres
                                  .charAt(0)
                                  .toUpperCase()}

                                {curso.docente.apellidoPaterno
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div>
                            <strong>
                              {nombreDocente(curso.docente)}
                            </strong>

                            <span>
                              {curso.docente.correo}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="gestion-badge">
                          {curso.gestion}
                        </span>
                      </td>

                      <td>
                        <span className="paralelo-badge">
                          {curso.paralelo}
                        </span>
                      </td>

                      <td>
                        <span className="semestre-badge">
                          {curso.semestre}.º
                        </span>
                      </td>

                      <td>
                        <span className="cupo-badge">
                          <UsersRound size={13} />
                          {curso.cupoMaximo ?? 'Sin límite'}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            curso.estado === 'ACTIVO'
                              ? 'active'
                              : curso.estado === 'INACTIVO'
                                ? 'inactive'
                                : 'finished'
                          }`}
                        >
                          <span className="status-dot" />

                          {curso.estado === 'ACTIVO'
                            ? 'Activo'
                            : curso.estado === 'INACTIVO'
                              ? 'Inactivo'
                              : 'Finalizado'}
                        </span>
                      </td>

                      <td>
                        {curso.estado ===
                        'FINALIZADO' ? (
                          <button
                            type="button"
                            className="action-button history"
                            onClick={() =>
                              setCursoHistorial(
                                curso,
                              )
                            }
                          >
                            <FileText size={15} />

                            Ver historial
                          </button>
                        ) : (
                          <div className="actions-cell">
                            <button
                              type="button"
                              className="action-button edit"
                              onClick={() =>
                                abrirEdicion(curso)
                              }
                            >
                              <Pencil size={15} />
                              Editar
                            </button>

                            {curso.estado ===
                            'ACTIVO' ? (
                              <>
                                <button
                                  type="button"
                                  className="action-button disable"
                                  onClick={() =>
                                    abrirCambioEstado(
                                      curso,
                                      'INACTIVO',
                                    )
                                  }
                                >
                                  <ToggleLeft size={15} />
                                  Desactivar
                                </button>

                                <button
                                  type="button"
                                  className="action-button finish"
                                  onClick={() =>
                                    abrirCambioEstado(
                                      curso,
                                      'FINALIZADO',
                                    )
                                  }
                                >
                                  <Clock3 size={15} />
                                  Finalizar
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="action-button enable"
                                onClick={() =>
                                  abrirCambioEstado(
                                    curso,
                                    'ACTIVO',
                                  )
                                }
                              >
                                <ToggleRight size={15} />
                                Reactivar
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {cursoEstado && estadoDestino && (
        <div className="modal-backdrop">
          <div className="confirm-modal">
            <div
              className={`confirm-icon ${
                estadoDestino === 'ACTIVO'
                  ? 'success'
                  : estadoDestino === 'INACTIVO'
                    ? 'warning'
                    : 'finish'
              }`}
            >
              {estadoDestino === 'ACTIVO' ? (
                <ToggleRight size={25} />
              ) : estadoDestino === 'INACTIVO' ? (
                <ToggleLeft size={25} />
              ) : (
                <Clock3 size={25} />
              )}
            </div>

            <span className="modal-eyebrow">
              Confirmar acción
            </span>

            <h3>
              {estadoDestino === 'ACTIVO'
                ? '¿Reactivar curso?'
                : estadoDestino === 'INACTIVO'
                  ? '¿Desactivar curso?'
                  : '¿Finalizar curso?'}
            </h3>

            <p>
              {cursoEstado.materia.nombre}, paralelo{' '}
              {cursoEstado.paralelo}, cambiará al estado{' '}
              {estadoDestino.toLowerCase()}.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-cancel"
                onClick={cerrarCambioEstado}
                disabled={actualizandoEstado}
              >
                Cancelar
              </button>

              <button
                type="button"
                className={`modal-confirm ${
                  estadoDestino === 'ACTIVO'
                    ? 'enable'
                    : estadoDestino === 'INACTIVO'
                      ? 'disable'
                      : 'finish'
                }`}
                onClick={cambiarEstadoCurso}
                disabled={actualizandoEstado}
              >
                {actualizandoEstado
                  ? 'Procesando...'
                  : estadoDestino === 'ACTIVO'
                    ? 'Reactivar'
                    : estadoDestino === 'INACTIVO'
                      ? 'Desactivar'
                      : 'Finalizar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalReportesAbierto && (
        <div className="modal-backdrop">
          <div className="reports-modal">
            <div className="states-modal-header">
              <div>
                <span className="modal-eyebrow">
                  Reportes generales
                </span>

                <h3>
                  Exportar todos los cursos
                </h3>

                <p>
                  Incluye cursos activos, inactivos y finalizados desde el primer registro hasta la actualidad.
                </p>
              </div>

              <button
                type="button"
                className="states-modal-close"
                onClick={() =>
                  setModalReportesAbierto(
                    false,
                  )
                }
                disabled={
                  Boolean(
                    descargandoReporteGeneral,
                  )
                }
                aria-label="Cerrar reportes"
              >
                <X size={18} />
              </button>
            </div>

            <div className="report-options">
              <button
                type="button"
                className="report-option pdf"
                onClick={() =>
                  descargarReporteGeneral(
                    'pdf',
                  )
                }
                disabled={
                  Boolean(
                    descargandoReporteGeneral,
                  )
                }
              >
                <div className="report-option-icon">
                  <FileText size={24} />
                </div>

                <div>
                  <strong>
                    Reporte general PDF
                  </strong>

                  <span>
                    Documento institucional con resumen y listado completo.
                  </span>
                </div>

                <Download size={18} />
              </button>

              <button
                type="button"
                className="report-option excel"
                onClick={() =>
                  descargarReporteGeneral(
                    'excel',
                  )
                }
                disabled={
                  Boolean(
                    descargandoReporteGeneral,
                  )
                }
              >
                <div className="report-option-icon">
                  <FileSpreadsheet size={24} />
                </div>

                <div>
                  <strong>
                    Reporte general Excel
                  </strong>

                  <span>
                    Archivo editable con resumen y detalle de todos los cursos.
                  </span>
                </div>

                <Download size={18} />
              </button>
            </div>

            {descargandoReporteGeneral && (
              <div className="report-generating">
                <span className="spinner" />

                Generando reporte {
                  descargandoReporteGeneral.toUpperCase()
                }...
              </div>
            )}

            <div className="reports-modal-note">
              La ficha PDF individual seguirá disponible dentro del historial de cada curso finalizado.
            </div>
          </div>
        </div>
      )}

      {cursoHistorial && (
        <div className="modal-backdrop">
          <div className="history-modal">
            <div className="history-modal-header">
              <div className="history-modal-heading">
                <div className="history-modal-icon">
                  <FileText size={24} />
                </div>

                <div>
                  <span className="modal-eyebrow">
                    Historial académico
                  </span>

                  <h3>
                    Ficha del curso finalizado
                  </h3>

                  <p>
                    Información consolidada y de solo lectura.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="states-modal-close"
                onClick={() =>
                  setCursoHistorial(
                    null,
                  )
                }
                aria-label="Cerrar historial"
              >
                <X size={18} />
              </button>
            </div>

            <div className="history-status">
              <span className="status-badge finished">
                <span className="status-dot" />

                Finalizado
              </span>

              <span>
                {cursoHistorial.gestion}
                {' · '}
                Paralelo {cursoHistorial.paralelo}
              </span>
            </div>

            <div className="history-section">
              <h4>
                Información académica
              </h4>

              <div className="history-grid">
                <DatoHistorial
                  etiqueta="Materia"
                  valor={cursoHistorial.materia.nombre}
                />

                <DatoHistorial
                  etiqueta="Código"
                  valor={cursoHistorial.materia.codigo}
                />

                <DatoHistorial
                  etiqueta="Semestre"
                  valor={`${cursoHistorial.semestre}.º semestre`}
                />

                <DatoHistorial
                  etiqueta="Cupo máximo"
                  valor={
                    cursoHistorial.cupoMaximo
                      ? `${cursoHistorial.cupoMaximo} estudiantes`
                      : 'Sin límite definido'
                  }
                />
              </div>
            </div>

            <div className="history-section">
              <h4>
                Docente asignado
              </h4>

              <div className="history-grid">
                <DatoHistorial
                  etiqueta="Nombre completo"
                  valor={
                    nombreDocente(
                      cursoHistorial.docente,
                    )
                  }
                />

                <DatoHistorial
                  etiqueta="Correo institucional"
                  valor={cursoHistorial.docente.correo}
                />
              </div>
            </div>

            <div className="history-section">
              <h4>
                Fechas del registro
              </h4>

              <div className="history-grid">
                <DatoHistorial
                  etiqueta="Fecha de creación"
                  valor={
                    formatearFecha(
                      cursoHistorial.creadoEn,
                    )
                  }
                />

                <DatoHistorial
                  etiqueta="Fecha de finalización"
                  valor={
                    formatearFecha(
                      cursoHistorial.finalizadoEn,
                    )
                  }
                />

                <DatoHistorial
                  etiqueta="Última actualización"
                  valor={
                    formatearFecha(
                      cursoHistorial.actualizadoEn,
                    )
                  }
                />
              </div>
            </div>

            <div className="history-note">
              Este curso se conserva como historial. No puede editarse, reactivarse ni reutilizarse para una nueva gestión.
            </div>

            <div className="history-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setCursoHistorial(
                    null,
                  )
                }
                disabled={descargandoReporte}
              >
                Cerrar
              </button>

              <button
                type="button"
                className="btn-primary history-download"
                onClick={descargarFichaHistorial}
                disabled={descargandoReporte}
              >
                <Download size={17} />

                {descargandoReporte
                  ? 'Generando PDF...'
                  : 'Descargar ficha PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEstadosAbierto && (
        <div className="modal-backdrop">
          <div className="states-modal">
            <div className="states-modal-header">
              <div>
                <span className="modal-eyebrow">
                  Estados del curso
                </span>

                <h3>
                  ¿Qué significa cada estado?
                </h3>
              </div>

              <button
                type="button"
                className="states-modal-close"
                onClick={() =>
                  setModalEstadosAbierto(false)
                }
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="state-explanation-list">
              <article className="state-explanation active">
                <div className="state-explanation-icon">
                  <ToggleRight size={21} />
                </div>

                <div>
                  <strong>
                    Activo
                  </strong>

                  <p>
                    El curso está habilitado y se encuentra disponible durante la gestión académica.
                  </p>
                </div>
              </article>

              <article className="state-explanation inactive">
                <div className="state-explanation-icon">
                  <ToggleLeft size={21} />
                </div>

                <div>
                  <strong>
                    Inactivo
                  </strong>

                  <p>
                    El curso está pausado temporalmente. Puede reactivarse sin perder su información.
                  </p>
                </div>
              </article>

              <article className="state-explanation finished">
                <div className="state-explanation-icon">
                  <Clock3 size={21} />
                </div>

                <div>
                  <strong>
                    Finalizado
                  </strong>

                  <p>
                    La gestión académica concluyó. El curso queda bloqueado y se conserva únicamente como historial.
                  </p>
                </div>
              </article>
            </div>

            <div className="states-modal-note">
              Un curso finalizado no puede editarse, reactivarse ni reutilizarse. Para una nueva gestión debes crear otro curso.
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() =>
                  setModalEstadosAbierto(false)
                }
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{styles}</style>
    </main>
  );
}

function Campo({
  titulo,
  nombre,
  valor,
  placeholder,
  tipo = 'text',
  min,
  max,
  onChange,
  disabled,
}: {
  titulo: string;
  nombre: string;
  valor: string;
  placeholder: string;
  tipo?: string;
  min?: string;
  max?: string;
  onChange: (
    event:
      ChangeEvent<HTMLInputElement>,
  ) => void;
  disabled?: boolean;
}) {
  return (
    <label>
      <span>{titulo}</span>

      <input
        type={tipo}
        name={nombre}
        value={valor}
        placeholder={placeholder}
        min={min}
        max={max}
        onChange={onChange}
        disabled={disabled}
      />
    </label>
  );
}

function Resumen({
  icono,
  cantidad,
  titulo,
  clase,
}: {
  icono: ReactNode;
  cantidad: number;
  titulo: string;
  clase: string;
}) {
  return (
    <article className="summary-card">
      <div className={`summary-icon ${clase}`}>
        {icono}
      </div>

      <div>
        <strong>{cantidad}</strong>
        <span>{titulo}</span>
      </div>
    </article>
  );
}

function DatoHistorial({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="history-data">
      <span>
        {etiqueta}
      </span>

      <strong>
        {valor}
      </strong>
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
  useEffect(() => {
    const temporizador =
      window.setTimeout(
        onCerrar,
        5000,
      );

    return () =>
      window.clearTimeout(
        temporizador,
      );
  }, [onCerrar]);

  return (
    <div className={`toast ${tipo}`}>
      <div className="toast-icon">
        {tipo === 'exito' ? (
          <CheckCircle2 size={22} />
        ) : (
          <CircleX size={22} />
        )}
      </div>

      <div className="toast-content">
        <strong>{titulo}</strong>
        <p>{mensaje}</p>
      </div>

      <button
        type="button"
        onClick={onCerrar}
      >
        <X size={16} />
      </button>

      <div className="toast-progress" />
    </div>
  );
}

const styles = `
  .cursos-page {
    width: 100%;
    min-width: 0;

    padding:
      0
      34px
      26px;

    color:
      var(--app-text);

    background:
      transparent;
  }

  .cursos-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    margin-bottom: 18px;
    padding: 23px 30px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 26px;
    background: var(--app-surface);
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

  .cursos-header::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
    background: #f18b4b;
  }

  .cursos-header__content {
    position: relative;
    z-index: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 17px;
  }

  .cursos-header__content > div:last-child {
    min-width: 0;
  }

  .cursos-header__icon {
    width: 58px;
    height: 58px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border: 1px solid var(--app-border-strong);
    border-radius: 18px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    box-shadow: var(--app-shadow-sm);
  }

  .cursos-eyebrow,
  .section-eyebrow,
  .modal-eyebrow {
    display: block;
    color: var(--app-accent-dark);
    font-size: 11px;
    font-weight: 850;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .cursos-header h1 {
    margin: 5px 0 0;
    color: var(--app-text);
    font-size: 31px;
    font-weight: 900;
    letter-spacing: -0.025em;
  }

  .cursos-header p {
    margin: 6px 0 0;
    color: var(--app-text-soft);
    font-size: 14px;
  }

  .cursos-header__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 12px;
  }

  .cursos-header__meta span {
    padding: 5px 9px;
    border: 1px solid rgba(200, 154, 85, 0.28);
    border-radius: 999px;
    color: var(--app-warning-strong);
    background: var(--app-warning-bg);
    font-size: 10px;
    font-weight: 750;
  }

  .cursos-header__actions {
    position: relative;
    z-index: 1;
    width: 205px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 9px;
    flex-shrink: 0;
  }

  .btn-reporte-general {
    width: 100%;
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 18px;
    border:
      1px solid
      rgba(200, 154, 85, 0.42);
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-surface-alt);
    font-weight: 800;
    cursor: pointer;
    transition:
      transform 0.18s ease,
      border-color 0.18s ease,
      background 0.18s ease,
      box-shadow 0.18s ease;
  }

  .btn-reporte-general:hover {
    transform: translateY(-1px);
    border-color:
      rgba(241, 139, 75, 0.58);
    background: var(--app-accent-soft);
    box-shadow:
      0 10px 24px
      rgba(196, 106, 44, 0.1);
  }

  .btn-agregar,
  .btn-primary {
    border: none;
    color: white;
    background:
      linear-gradient(
        135deg,
        var(--app-accent),
        var(--app-accent-hover)
      );

    box-shadow:
      0 14px 32px
      color-mix(
        in srgb,
        var(--app-accent)
        28%,
        transparent
      );
  }

  .btn-agregar {
    position: relative;
    z-index: 1;
    width: 100%;
    min-height: 45px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 999px;
    font-weight: 800;
    cursor: pointer;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 18px;
  }

  .summary-card {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 80px;
    padding: 15px 18px;
    border: 1px solid var(--app-border);
    border-radius: 21px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .summary-icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 15px;
  }

  .summary-icon.total {
    color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .summary-icon.activos {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .summary-icon.inactivos {
    color: var(--app-text-soft);
    background: var(--app-surface-disabled);
  }

  .summary-icon.finalizados {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .summary-card strong {
    display: block;
    color: var(--app-text);
    font-size: 24px;
    font-weight: 900;
  }

  .summary-card span {
    display: block;
    margin-top: 6px;
    color: var(--app-text-soft);
    font-size: 12px;
  }

  .form-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 7600;
    display: grid;
    place-items: center;
    padding: 24px;
    overflow-y: auto;
    background:
      rgba(15, 23, 42, 0.34);
    backdrop-filter:
      blur(6px);
  }

  .form-card--modal {
    width:
      min(
        980px,
        100%
      );
    max-height:
      calc(100vh - 48px);
    margin: auto;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .form-card,
  .cursos-card {
    margin-bottom: 18px;
    padding: 21px 24px;
    border: 1px solid var(--app-border);
    border-radius: 23px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow);
  }

  .form-card {
    position: relative;
    overflow: hidden;
  }

  .form-card::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 4px;
    background: linear-gradient(90deg, #f18b4b, #f7c177, transparent 80%);
  }

  .form-card-header,
  .cursos-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
  }

  .form-card-header h2,
  .cursos-card-top h2 {
    margin: 5px 0 0;
    color: var(--app-text);
    font-size: 19px;
    font-weight: 850;
  }

  .form-card-header p,
  .cursos-card-top p {
    margin: 5px 0 0;
    color: var(--app-text-soft);
    font-size: 13px;
  }

  .btn-cerrar-form {
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

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    margin-top: 22px;
  }

  .cursos-form label {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .cursos-form label span {
    color: var(--app-text-secondary);
    font-size: 13px;
    font-weight: 700;
  }

  .cursos-form input,
  .cursos-form select {
    width: 100%;
    min-height: 46px;
    padding: 12px 14px;
    border: 1px solid var(--app-input-border);
    border-radius: 14px;
    outline: none;
    color:
      var(--app-text);

    background:
      var(--app-input-bg);
    font: inherit;
  }

  .cursos-form input:focus,
  .cursos-form select:focus {
    border-color: var(--app-accent);
    box-shadow: 0 0 0 4px rgba(241, 139, 75, 0.12);
  }

  .gestion-automatica-field {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .gestion-automatica-label {
    color: var(--app-text-secondary);
    font-size: 13px;
    font-weight: 700;
  }

  .gestion-automatica-card {
    min-height: 68px;
    display: grid;
    grid-template-columns:
      44px
      1fr
      auto;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border:
      1px solid
      rgba(241, 139, 75, 0.38);
    border-radius: 15px;
    background: var(--app-accent-softer);
    box-shadow:
      0 0 0 4px
      rgba(241, 139, 75, 0.07);
  }

  .gestion-automatica-icon {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .gestion-automatica-card strong,
  .gestion-automatica-card span {
    display: block;
  }

  .gestion-automatica-card strong {
    color: var(--app-accent-dark);
    font-size: 15px;
    font-weight: 900;
  }

  .gestion-automatica-card div > span {
    margin-top: 3px;
    color: var(--app-text-soft);
    font-size: 11px;
  }

  .gestion-automatica-badge {
    padding: 5px 9px;
    border-radius: 999px;
    color: var(--app-success);
    background: var(--app-success-bg);
    font-size: 9px;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .field-help {
    color: var(--app-text-muted);
    font-size: 10px;
  }

  .form-warning {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
    padding: 13px 14px;
    border: 1px solid var(--app-warning-border);
    border-radius: 14px;
    color: var(--app-warning-strong);
    background: var(--app-warning-bg);
    font-size: 12px;
  }

  .form-actions,
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 22px;
  }

  .btn-primary,
  .btn-secondary,
  .modal-cancel,
  .modal-confirm {
    min-height: 42px;
    padding: 10px 18px;
    border-radius: 999px;
    font-weight: 750;
    cursor: pointer;
  }

  .btn-secondary,
  .modal-cancel {
    border: 1px solid var(--app-border-strong);
    color: var(--app-accent-dark);
    background: transparent;
  }


  .cursos-card-actions {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .btn-estados-info {
    min-height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 8px 13px;
    border:
      1px solid
      rgba(200, 154, 85, 0.38);
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-surface-alt);
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    transition:
      transform 0.18s ease,
      background 0.18s ease,
      border-color 0.18s ease;
  }

  .btn-estados-info:hover {
    transform: translateY(-1px);
    border-color:
      rgba(241, 139, 75, 0.55);
    background: var(--app-accent-soft);
  }

  .action-button.history {
    border: 1px solid var(--app-purple-border);
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .action-button.history:hover {
    background: var(--app-purple-bg);
  }

  .reports-modal {
    width:
      min(
        620px,
        100%
      );
    padding: 28px;
    border:
      1px solid
      rgba(241, 139, 75, 0.22);
    border-radius: 25px;
    background: var(--app-surface);
    box-shadow:
      0 28px 70px
      rgba(15, 23, 42, 0.22);
  }

  .reports-modal .states-modal-header p {
    max-width: 460px;
    margin: 7px 0 0;
    color: var(--app-text-soft);
    font-size: 12px;
    line-height: 1.55;
  }

  .report-options {
    display: grid;
    gap: 12px;
    margin-top: 22px;
  }

  .report-option {
    width: 100%;
    display: grid;
    grid-template-columns:
      48px
      1fr
      24px;
    align-items: center;
    gap: 13px;
    padding: 16px;
    border-radius: 17px;
    text-align: left;
    background: var(--app-surface-alt);
    cursor: pointer;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease;
  }

  .report-option.pdf {
    border: 1px solid var(--app-warning-border);
    color: #c2410c;
  }

  .report-option.excel {
    border: 1px solid var(--app-success-border);
    color: var(--app-success);
  }

  .report-option:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow:
      0 12px 28px
      rgba(15, 23, 42, 0.08);
  }

  .report-option:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }

  .report-option-icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 14px;
  }

  .report-option.pdf
  .report-option-icon {
    background: var(--app-warning-bg);
  }

  .report-option.excel
  .report-option-icon {
    background: var(--app-success-bg);
  }

  .report-option strong,
  .report-option span {
    display: block;
  }

  .report-option strong {
    color: var(--app-text);
    font-size: 13px;
  }

  .report-option span {
    margin-top: 4px;
    color: var(--app-text-soft);
    font-size: 11px;
    line-height: 1.5;
  }

  .report-generating {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
    padding: 12px 14px;
    border-radius: 14px;
    color: var(--app-warning-strong);
    background: var(--app-bg-soft);
    font-size: 12px;
    font-weight: 750;
  }

  .reports-modal-note {
    margin-top: 16px;
    padding: 12px 14px;
    border-left:
      4px solid
      #f18b4b;
    border-radius: 13px;
    color: var(--app-warning-strong);
    background: var(--app-bg-soft);
    font-size: 11px;
    line-height: 1.55;
  }

  .history-modal {
    width:
      min(
        760px,
        100%
      );
    max-height:
      calc(100vh - 40px);
    overflow-y: auto;
    padding: 28px;
    border:
      1px solid
      rgba(241, 139, 75, 0.22);
    border-radius: 25px;
    background: var(--app-surface);
    box-shadow:
      0 28px 70px
      rgba(15, 23, 42, 0.22);
  }

  .history-modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .history-modal-heading {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .history-modal-icon {
    width: 50px;
    height: 50px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 16px;
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .history-modal-header h3 {
    margin: 6px 0 0;
    color: var(--app-text);
    font-size: 21px;
  }

  .history-modal-header p {
    margin: 5px 0 0;
    color: var(--app-text-soft);
    font-size: 12px;
  }

  .history-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 20px;
    padding: 12px 14px;
    border:
      1px solid
      #ddd6fe;
    border-radius: 15px;
    color: var(--app-purple-strong);
    background: var(--app-purple-bg);
    font-size: 12px;
    font-weight: 750;
  }

  .history-section {
    margin-top: 18px;
    padding: 18px;
    border:
      1px solid
      rgba(241, 139, 75, 0.15);
    border-radius: 18px;
    background: var(--app-surface-alt);
  }

  .history-section h4 {
    margin: 0 0 14px;
    color: var(--app-text);
    font-size: 13px;
    font-weight: 850;
  }

  .history-grid {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
    gap: 12px;
  }

  .history-data {
    min-width: 0;
    padding: 12px 13px;
    border:
      1px solid
      rgba(200, 154, 85, 0.22);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .history-data span {
    display: block;
    color: var(--app-text-muted);
    font-size: 10px;
    font-weight: 750;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .history-data strong {
    display: block;
    margin-top: 6px;
    overflow-wrap: anywhere;
    color: var(--app-text-secondary);
    font-size: 12px;
    line-height: 1.45;
  }

  .history-note {
    margin-top: 18px;
    padding: 13px 14px;
    border-left:
      4px solid
      #7c3aed;
    border-radius: 13px;
    color: var(--app-purple-strong);
    background: var(--app-purple-bg);
    font-size: 12px;
    line-height: 1.55;
  }

  .history-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 22px;
  }

  .history-download {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .states-modal {
    width:
      min(
        560px,
        100%
      );
    padding: 28px;
    border:
      1px solid
      rgba(241, 139, 75, 0.22);
    border-radius: 25px;
    background: var(--app-surface);
    box-shadow:
      0 28px 70px
      rgba(15, 23, 42, 0.22);
  }

  .states-modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .states-modal-header h3 {
    margin: 7px 0 0;
    color: var(--app-text);
    font-size: 21px;
  }

  .states-modal-close {
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

  .state-explanation-list {
    display: grid;
    gap: 12px;
    margin-top: 22px;
  }

  .state-explanation {
    display: flex;
    align-items: flex-start;
    gap: 13px;
    padding: 15px;
    border-radius: 17px;
  }

  .state-explanation.active {
    border: 1px solid var(--app-success-border);
    background: var(--app-success-bg);
  }

  .state-explanation.inactive {
    border: 1px solid var(--app-border-soft);
    background: var(--app-surface-alt);
  }

  .state-explanation.finished {
    border: 1px solid var(--app-purple-border);
    background: var(--app-purple-bg);
  }

  .state-explanation-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 13px;
  }

  .state-explanation.active
  .state-explanation-icon {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .state-explanation.inactive
  .state-explanation-icon {
    color: var(--app-text-soft);
    background: var(--app-surface-disabled);
  }

  .state-explanation.finished
  .state-explanation-icon {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .state-explanation strong {
    color: var(--app-text);
    font-size: 14px;
  }

  .state-explanation p {
    margin: 4px 0 0;
    color: var(--app-text-soft);
    font-size: 12px;
    line-height: 1.55;
  }

  .states-modal-note {
    margin-top: 16px;
    padding: 13px 14px;
    border-left:
      4px solid
      #f18b4b;
    border-radius: 13px;
    color: var(--app-warning-strong);
    background: var(--app-bg-soft);
    font-size: 12px;
    line-height: 1.55;
  }

  .cursos-count-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .cursos-count {
    padding: 6px 11px;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 12px;
    font-weight: 800;
  }

  .cursos-count-wrap small {
    color: var(--app-text-muted);
    font-size: 10px;
  }

  .filters-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    margin-top: 18px;
  }

  .state-filters,
  .select-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
  }

  .state-filters button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border: 1px solid var(--app-input-border);
    border-radius: 999px;
    color: var(--app-text-soft);
    background: var(--app-surface);
    font-size: 12px;
    font-weight: 750;
    cursor: pointer;
  }

  .state-filters button.active {
    border-color: var(--app-accent);
    color: var(--app-accent-dark);
    background:
      linear-gradient(
        135deg,
        var(--app-accent-soft),
        var(--app-accent-softer)
      );
  }

  .state-filters button span {
    min-width: 21px;
    height: 21px;
    display: grid;
    place-items: center;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--app-accent-softer);
    font-size: 10px;
  }

  .select-filter {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    border: 1px solid var(--app-input-border);
    border-radius: 14px;
    color: var(--app-text-muted);
    background: var(--app-surface);
  }

  .select-filter select {
    border: none;
    outline: none;
    color: var(--app-text-secondary);
    background: transparent;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-top: 14px;
    padding: 10px 14px;
    border: 1px solid var(--app-input-border);
    border-radius: 14px;
    color: var(--app-text-muted);
    background: var(--app-surface);
  }

  .search-box input {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
  }

  .search-box button {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .table-wrapper {
    width: 100%;
    overflow-x: auto;
    border: 1px solid var(--app-border);
    border-radius: 21px;
    background: var(--app-surface);
  }

  .cursos-table {
    width: 100%;
    min-width: 1280px;
    border-collapse: separate;
    border-spacing: 0;
  }

  .cursos-table th,
  .cursos-table td {
    padding: 14px 12px;
    text-align: left;
    border-bottom: 1px solid rgba(241, 139, 75, 0.12);
  }

  .cursos-table th {
    color: var(--app-text-soft);
    background: var(--app-accent-soft);
    font-size: 10px;
    font-weight: 850;
    text-transform: uppercase;
  }

  .cursos-table td {
    color: var(--app-text-secondary);
    font-size: 12px;
  }

  .curso-cell,
  .docente-cell {
    display: flex;
    align-items: center;

    gap: 11px;

    min-width: 210px;
  }

  .docente-cell {
    min-width: 235px;
  }

  .curso-icon {
    width: 42px;
    height: 42px;

    display: grid;
    place-items: center;

    flex-shrink: 0;

    border-radius: 13px;

    color:
      var(--app-accent-dark);

    background:
      linear-gradient(
        135deg,
        var(--app-accent-soft),
        var(--app-surface-alt)
      );
  }

  .docente-avatar {
    position: relative;

    width: 46px;
    height: 46px;

    display: grid;
    place-items: center;

    flex-shrink: 0;

    overflow: hidden;

    border:
      1px solid
      var(--app-border-strong);

    border-radius: 14px;

    color:
      var(--app-accent-dark);

    background:
      linear-gradient(
        135deg,
        var(--app-accent-soft),
        var(--app-surface-alt)
      );

    font-size: 14px;
    font-weight: 900;

    line-height: 1;

    box-shadow:
      var(--app-shadow-sm);
  }

  .docente-avatar.has-image {
    background:
      var(--app-surface-alt);
  }

  .docente-avatar img {
    width: 100%;
    height: 100%;

    display: block;

    object-fit: cover;
    object-position: center;
  }

  .docente-avatar > span {
    width: 100%;
    height: 100%;

    display: grid;
    place-items: center;

    text-align: center;
  }

  .curso-cell strong,
  .docente-cell strong {
    display: block;
    color: var(--app-text);
    font-size: 12px;
  }

  .curso-cell > div:last-child span,
  .docente-cell > div:last-child span {
    display: block;

    margin-top: 3px;

    color:
      var(--app-text-muted);

    font-size: 10px;
  }

  .gestion-badge,
  .paralelo-badge,
  .semestre-badge,
  .cupo-badge,
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 850;
  }

  .gestion-badge {
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .paralelo-badge {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .semestre-badge {
    color: var(--app-warning-strong);
    background: var(--app-warning-bg);
  }

  .cupo-badge {
    color: var(--app-info);
    background: var(--app-info-bg);
  }

  .status-badge.active {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .status-badge.inactive {
    color: var(--app-text-soft);
    background: var(--app-surface-disabled);
  }

  .status-badge.finished {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .actions-cell {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-width: 245px;
  }

  .action-button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 9px;
    border-radius: 11px;
    background: transparent;
    font-size: 10px;
    font-weight: 780;
    cursor: pointer;
  }

  .action-button.edit {
    border: 1px solid var(--app-border-strong);
    color: var(--app-accent-dark);
  }

  .action-button.disable {
    border: 1px solid var(--app-danger-border);
    color: var(--app-danger);
  }

  .action-button.enable {
    border: 1px solid var(--app-success-border);
    color: var(--app-success);
  }

  .action-button.finish {
    border: 1px solid var(--app-purple-border);
    color: var(--app-purple);
  }

  .state-card {
    padding: 25px;
    border: 1px solid var(--app-border);
    border-radius: 19px;
    color: var(--app-text-soft);
    background: var(--app-surface);
  }

  .state-card--loading {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .state-card--empty {
    display: grid;
    place-items: center;
    min-height: 220px;
    text-align: center;
    gap: 8px;
  }

  .spinner {
    width: 21px;
    height: 21px;
    border: 3px solid rgba(241, 139, 75, 0.2);
    border-top-color: var(--app-accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 8000;
    display: grid;
    place-items: center;
    padding: 20px;
    background: var(--app-overlay);
    backdrop-filter: blur(6px);
  }

  .confirm-modal {
    width: min(430px, 100%);
    padding: 28px;
    border: 1px solid var(--app-border);
    border-radius: 25px;
    background: var(--app-surface);
  }

  .confirm-icon {
    width: 54px;
    height: 54px;
    display: grid;
    place-items: center;
    margin-bottom: 18px;
    border-radius: 17px;
  }

  .confirm-icon.warning {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .confirm-icon.success {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .confirm-icon.finish {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .modal-confirm {
    border: none;
    color: white;
  }

  .modal-confirm.disable {
    background: #dc2626;
  }

  .modal-confirm.enable {
    background: #16a34a;
  }

  .modal-confirm.finish {
    background: #7c3aed;
  }

  .toast {
    position: fixed;
    top: 25px;
    right: 28px;
    z-index: 9999;
    width: min(390px, calc(100vw - 40px));
    display: grid;
    grid-template-columns: 42px 1fr 28px;
    gap: 11px;
    padding: 15px 15px 18px;
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

  .toast-content p {
    margin: 4px 0 0;
    color: var(--app-text-soft);
    font-size: 12px;
  }

  .toast button {
    border: none;
    background: transparent;
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
    background: #22c55e;
  }

  .toast.error .toast-progress {
    background: #ef4444;
  }

  html[data-theme='oscuro']
  .cursos-header,
  html[data-theme='oscuro']
  .summary-card,
  html[data-theme='oscuro']
  .form-card,
  html[data-theme='oscuro']
  .cursos-card,
  html[data-theme='oscuro']
  .table-wrapper,
  html[data-theme='oscuro']
  .state-card,
  html[data-theme='oscuro']
  .confirm-modal,
  html[data-theme='oscuro']
  .reports-modal,
  html[data-theme='oscuro']
  .history-modal,
  html[data-theme='oscuro']
  .states-modal {
    background:
      var(--app-surface);

    border-color:
      var(--app-border-soft);

    box-shadow:
      var(--app-shadow);
  }

  html[data-theme='oscuro']
  .cursos-table th {
    background:
      var(--app-surface-raised);
  }

  html[data-theme='oscuro']
  .cursos-table td,
  html[data-theme='oscuro']
  .cursos-table th {
    border-bottom-color:
      var(--app-border-soft);
  }

  html[data-theme='oscuro']
  .state-filters button,
  html[data-theme='oscuro']
  .select-filter,
  html[data-theme='oscuro']
  .search-box,
  html[data-theme='oscuro']
  .history-section,
  html[data-theme='oscuro']
  .history-data,
  html[data-theme='oscuro']
  .report-option,
  html[data-theme='oscuro']
  .gestion-automatica-card {
    background:
      var(--app-surface-alt);
  }

  html[data-theme='oscuro']
  .form-modal-backdrop,
  html[data-theme='oscuro']
  .modal-backdrop {
    background:
      var(--app-overlay);
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
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .filters-row {
      align-items: stretch;
      flex-direction: column;
    }
  }

  @media (max-width: 850px) {
    .cursos-page {
      padding: 18px;
    }

    .form-modal-backdrop {
      padding: 12px;
    }

    .form-card--modal {
      max-height:
        calc(100vh - 24px);
    }

    .cursos-header {
      flex-direction: column;
      align-items: stretch;
    }

    .cursos-header__actions,
    .btn-agregar,
    .btn-reporte-general {
      width: 100%;
    }

    .summary-grid,
    .form-grid {
      grid-template-columns: 1fr;
    }

    .cursos-card-top {
      flex-direction: column;
    }

    .cursos-card-actions {
      width: 100%;
      align-items: flex-start;
      flex-direction: column;
    }

    .btn-estados-info {
      width: 100%;
    }

    .history-grid {
      grid-template-columns: 1fr;
    }

    .history-status,
    .history-actions {
      align-items: stretch;
      flex-direction: column;
    }

    .history-actions button {
      width: 100%;
    }

    .gestion-automatica-card {
      grid-template-columns:
        44px
        1fr;
    }

    .gestion-automatica-badge {
      grid-column:
        1 / -1;
      width: fit-content;
      margin-left: 56px;
    }

    .report-option {
      grid-template-columns:
        44px
        1fr;
    }

    .report-option > svg {
      display: none;
    }
  }
`;