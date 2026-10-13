import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '../../auth/AuthContext';


import {
  CheckCircle2,
  CircleX,
  Clock3,
  Download,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Mail,
  Pencil,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UsersRound,
  UserX,
  X,
} from 'lucide-react';

type Rol =
  | 'ADMINISTRADOR'
  | 'DOCENTE'
  | 'ESTUDIANTE';

type Usuario = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  correo: string;
  fotoPerfilUrl?: string | null;
  tratamiento?: 'DR' | 'DRA' | null;
  rol: Rol;
  estaActivo: boolean;
  cuentaActivada: boolean;
  tokenActivacionExpira?: string | null;
  accesoEnviadoEn?: string | null;
  creadoEn: string;
};

type FormularioUsuario = {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correo: string;
  rol: Rol;
  tratamiento?: 'DR' | 'DRA' | null;
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

type FiltroEstado =
  | 'ACTIVOS'
  | 'DESACTIVADOS'
  | 'TODOS';

type FormatoReporte =
  | 'PDF'
  | 'EXCEL'
  | 'CSV';

type EstadoReporte =
  | 'TODOS'
  | 'ACTIVOS'
  | 'INACTIVOS';

type ActivacionReporte =
  | 'TODOS'
  | 'ACTIVADOS'
  | 'PENDIENTES';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

const crearHeadersAutorizados = (
  accessToken: string,
  incluirContenido = false,
): HeadersInit => ({
  ...(incluirContenido
    ? {
        'Content-Type':
          'application/json',
      }
    : {}),

  Authorization:
    `Bearer ${accessToken}`,
});

function construirUrlFoto(
  fotoPerfilUrl: string | null | undefined,
): string | null {
  if (!fotoPerfilUrl) {
    return null;
  }

  if (
    fotoPerfilUrl.startsWith('http://') ||
    fotoPerfilUrl.startsWith('https://')
  ) {
    return fotoPerfilUrl;
  }

  return `${API_URL}${fotoPerfilUrl}`;
}

const formularioInicial: FormularioUsuario = {
  nombres: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  correo: '',
  rol: 'ESTUDIANTE',
  tratamiento: null,
};

const roles: {
  valor: Rol;
  etiqueta: string;
}[] = [
  {
    valor: 'ADMINISTRADOR',
    etiqueta: 'Administrador',
  },
  {
    valor: 'DOCENTE',
    etiqueta: 'Docente',
  },
  {
    valor: 'ESTUDIANTE',
    etiqueta: 'Estudiante',
  },
];

export default function Usuarios() {
  const { sesion } = useAuth();

  const accessToken =
    sesion?.accessToken ?? '';

  const [
    usuarios,
    setUsuarios,
  ] = useState<Usuario[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    busqueda,
    setBusqueda,
  ] = useState('');

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState<FiltroEstado>('ACTIVOS');

  const [
    panelAbierto,
    setPanelAbierto,
  ] = useState(false);

  const [
    usuarioEditandoId,
    setUsuarioEditandoId,
  ] = useState<number | null>(null);

  const [
    formulario,
    setFormulario,
  ] = useState<FormularioUsuario>(
    formularioInicial,
  );

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    enviandoActivacionId,
    setEnviandoActivacionId,
  ] = useState<number | null>(null);

  const [
    usuarioEstado,
    setUsuarioEstado,
  ] = useState<Usuario | null>(null);

  const [
    actualizandoEstado,
    setActualizandoEstado,
  ] = useState(false);

  const [
    ahora,
    setAhora,
  ] = useState(Date.now());

  const [
    toast,
    setToast,
  ] = useState<ToastEstado>({
    visible: false,
    tipo: 'exito',
    titulo: '',
    mensaje: '',
  });

  const [
    modalReportesAbierto,
    setModalReportesAbierto,
  ] = useState(false);

  const [
    descargandoReporte,
    setDescargandoReporte,
  ] = useState<FormatoReporte | null>(null);

  const [
    rolReporte,
    setRolReporte,
  ] = useState<Rol | 'TODOS'>('TODOS');

  const [
    estadoReporte,
    setEstadoReporte,
  ] = useState<EstadoReporte>('TODOS');

  const [
    activacionReporte,
    setActivacionReporte,
  ] = useState<ActivacionReporte>('TODOS');

  useEffect(() => {
    const intervalo = window.setInterval(
      () => {
        setAhora(Date.now());
      },
      60_000,
    );

    return () => {
      window.clearInterval(intervalo);
    };
  }, []);

  const mostrarToast = (
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
  };

  const cerrarToast = () => {
    setToast((anterior) => ({
      ...anterior,
      visible: false,
    }));
  };

  const obtenerUsuarios = useCallback(async () => {
    try {
      setCargando(true);

      if (!accessToken) {
        throw new Error(
          'No existe una sesión válida.',
        );
      }

      const respuesta = await fetch(
        `${API_URL}/usuarios`,
        {
          method: 'GET',
          headers:
            crearHeadersAutorizados(
              accessToken,
            ),
        },
      );

      const datos = await respuesta
        .json()
        .catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          datos.message ||
            'No se pudieron obtener los usuarios.',
        );
      }

      setUsuarios(datos);
    } catch (error) {
      console.error(error);

      mostrarToast(
        'error',
        'Error al cargar',
        'No fue posible obtener la lista de usuarios.',
      );
    } finally {
      setCargando(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      setCargando(false);
      return;
    }

    void obtenerUsuarios();
  }, [accessToken, obtenerUsuarios]);

  const manejarCambio = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const seleccionarRol = (
    rol: Rol,
  ) => {
    setFormulario((anterior) => ({
      ...anterior,
      rol,
      tratamiento:
        rol === 'DOCENTE'
          ? anterior.tratamiento
          : null,
    }));
  };

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setUsuarioEditandoId(null);
  };

  const abrirNuevoUsuario = () => {
    limpiarFormulario();
    setPanelAbierto(true);
  };

  const abrirEdicion = (
    usuario: Usuario,
  ) => {
    setFormulario({
      nombres: usuario.nombres,
      apellidoPaterno:
        usuario.apellidoPaterno,
      apellidoMaterno:
        usuario.apellidoMaterno ?? '',
      correo: usuario.correo,
      rol: usuario.rol,
      tratamiento: usuario.tratamiento ?? null,
    });

    setUsuarioEditandoId(
      usuario.id,
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

  const validarFormulario = () => {
    const correo =
      formulario.correo
        .trim()
        .toLowerCase();

    if (
      !formulario.nombres.trim() ||
      !formulario.apellidoPaterno.trim() ||
      !correo
    ) {
      mostrarToast(
        'error',
        'Datos incompletos',
        'Completa los nombres, apellido paterno y correo institucional.',
      );

      return false;
    }

    if (
      !correo.endsWith(
        '@unifranz.edu.bo',
      )
    ) {
      mostrarToast(
        'error',
        'Correo no válido',
        'Solo se permiten correos institucionales @unifranz.edu.bo.',
      );

      return false;
    }

    if (
      formulario.rol === 'DOCENTE' &&
      !formulario.tratamiento
    ) {
      mostrarToast(
        'error',
        'Tratamiento requerido',
        'Selecciona Dr. o Dra. para el docente.',
      );

      return false;
    }

    return true;
  };

  const guardarUsuario = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    try {
      setGuardando(true);

      const editando =
        usuarioEditandoId !== null;

      const url = editando
        ? `${API_URL}/usuarios/${usuarioEditandoId}`
        : `${API_URL}/usuarios`;

      const respuesta = await fetch(
        url,
        {
          method:
            editando
              ? 'PUT'
              : 'POST',

          headers:
            crearHeadersAutorizados(
              accessToken,
              true,
            ),

          body: JSON.stringify({
            nombres:
              formulario.nombres.trim(),

            apellidoPaterno:
              formulario.apellidoPaterno.trim(),

            apellidoMaterno:
              formulario.apellidoMaterno.trim() ||
              undefined,

            correo:
              formulario.correo
                .trim()
                .toLowerCase(),

            rol:
              formulario.rol,

            tratamiento:
              formulario.rol === 'DOCENTE'
                ? formulario.tratamiento
                : null,
          }),
        },
      );

      const datos =
        await respuesta
          .json()
          .catch(() => ({}));

      if (!respuesta.ok) {
        const mensaje =
          Array.isArray(
            datos.message,
          )
            ? datos.message.join(' ')
            : datos.message;

        mostrarToast(
          'error',
          editando
            ? 'No se pudo actualizar'
            : 'No se pudo crear',
          mensaje ||
            'Ocurrió un error al guardar el usuario.',
        );

        return;
      }

      cerrarFormulario();

      await obtenerUsuarios();

      mostrarToast(
        'exito',
        editando
          ? 'Usuario actualizado'
          : 'Usuario creado',
        datos.mensaje ||
          (editando
            ? 'Los datos del usuario fueron actualizados correctamente.'
            : 'La cuenta fue registrada correctamente en IusAcademy.'),
      );
    } catch (error) {
      console.error(error);

      mostrarToast(
        'error',
        'Error de conexión',
        'No fue posible comunicarse con el servidor.',
      );
    } finally {
      setGuardando(false);
    }
  };

  const enviarActivacion = async (
    usuario: Usuario,
  ) => {
    try {
      setEnviandoActivacionId(
        usuario.id,
      );

      const respuesta = await fetch(
        `${API_URL}/usuarios/${usuario.id}/enviar-activacion`,
        {
          method: 'POST',

          headers:
            crearHeadersAutorizados(
              accessToken,
              true,
            ),
        },
      );

      const datos =
        await respuesta
          .json()
          .catch(() => ({}));

      if (!respuesta.ok) {
        mostrarToast(
          'error',
          'No se pudo enviar',
          datos.message ||
            'No fue posible enviar el enlace de activación.',
        );

        return;
      }

      await obtenerUsuarios();

      mostrarToast(
        'exito',
        'Activación enviada',
        `El enlace de activación fue enviado a ${usuario.correo}.`,
      );
    } catch (error) {
      console.error(error);

      mostrarToast(
        'error',
        'Error al enviar activación',
        'No fue posible enviar el enlace de activación.',
      );
    } finally {
      setEnviandoActivacionId(null);
    }
  };

  const cambiarEstadoUsuario =
    async () => {
      if (!usuarioEstado) {
        return;
      }

      try {
        setActualizandoEstado(true);

        const respuesta = await fetch(
          `${API_URL}/usuarios/${usuarioEstado.id}/estado`,
          {
            method: 'PATCH',

            headers:
              crearHeadersAutorizados(
                accessToken,
                true,
              ),

            body: JSON.stringify({
              estaActivo:
                !usuarioEstado.estaActivo,
            }),
          },
        );

        const datos =
          await respuesta
            .json()
            .catch(() => ({}));

        if (!respuesta.ok) {
          mostrarToast(
            'error',
            'No se pudo actualizar',
            datos.message ||
              'No fue posible cambiar el estado del usuario.',
          );

          return;
        }

        const seActivo =
          !usuarioEstado.estaActivo;

        setUsuarioEstado(null);

        await obtenerUsuarios();

        mostrarToast(
          'exito',
          seActivo
            ? 'Usuario reactivado'
            : 'Usuario desactivado',
          datos.requiereEnviarActivacion
            ? 'El usuario fue reactivado. Debes enviarle un nuevo enlace de activación.'
            : datos.mensaje ||
              (seActivo
                ? 'El usuario puede volver a acceder a IusAcademy.'
                : 'El acceso del usuario fue desactivado correctamente.'),
        );
      } catch (error) {
        console.error(error);

        mostrarToast(
          'error',
          'Error de conexión',
          'No fue posible actualizar el estado del usuario.',
        );
      } finally {
        setActualizandoEstado(false);
      }
    };

  const descargarReporteGeneral =
    async (
      formato: FormatoReporte,
    ) => {
      if (
        !accessToken ||
        descargandoReporte
      ) {
        return;
      }

      try {
        setDescargandoReporte(
          formato,
        );

        const parametros =
          new URLSearchParams();

        if (rolReporte !== 'TODOS') {
          parametros.set('rol', rolReporte);
        }

        parametros.set(
          'estado',
          estadoReporte,
        );

        parametros.set(
          'activacion',
          activacionReporte,
        );

        const respuesta =
          await fetch(
            `${API_URL}/usuarios/exportar/${formato}?${parametros.toString()}`,
            {
              method: 'GET',

              headers:
                crearHeadersAutorizados(
                  accessToken,
                ),
            },
          );

        const tipoContenido =
          respuesta.headers.get(
            'content-type',
          );

        if (!respuesta.ok) {
          const datos =
            tipoContenido?.includes(
              'application/json',
            )
              ? await respuesta
                  .json()
                  .catch(() => ({}))
              : {};

          const mensaje =
            Array.isArray(
              datos.message,
            )
              ? datos.message.join(
                  ' ',
                )
              : datos.message;

          throw new Error(
            mensaje ||
              `No fue posible generar el reporte ${formato.toUpperCase()}.`,
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

        const disposicion =
          respuesta.headers.get(
            'content-disposition',
          );

        const nombreCodificado =
          disposicion?.match(
            /filename\*=UTF-8''([^;]+)/i,
          )?.[1];

        const nombreSimple =
          disposicion?.match(
            /filename="?([^";]+)"?/i,
          )?.[1];

        const extensiones: Record<
          FormatoReporte,
          string
        > = {
          PDF: 'pdf',
          EXCEL: 'xlsx',
          CSV: 'csv',
        };

        enlace.download =
          nombreCodificado
            ? decodeURIComponent(
                nombreCodificado,
              )
            : nombreSimple ||
              `reporte-general-usuarios-iusacademy.${extensiones[formato]}`;

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
          `El reporte general de usuarios en ${formato} fue descargado correctamente.`,
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
            : 'No fue posible descargar el reporte general de usuarios.',
        );
      } finally {
        setDescargandoReporte(
          null,
        );
      }
    };

  const usuariosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return usuarios.filter(
        (usuario) => {
          const coincideEstado =
            filtroEstado === 'TODOS'
              ? true
              : filtroEstado === 'ACTIVOS'
                ? usuario.estaActivo
                : !usuario.estaActivo;

          const nombreCompleto =
            `${usuario.nombres} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno ?? ''}`
              .toLowerCase();

          const coincideBusqueda =
            !texto ||
            nombreCompleto.includes(texto) ||
            usuario.correo
              .toLowerCase()
              .includes(texto) ||
            usuario.rol
              .toLowerCase()
              .includes(texto);

          return (
            coincideEstado &&
            coincideBusqueda
          );
        },
      );
    }, [
      usuarios,
      busqueda,
      filtroEstado,
    ]);

  const resumen = useMemo(
    () => ({
      estudiantes:
        usuarios.filter(
          (usuario) =>
            usuario.rol ===
            'ESTUDIANTE',
        ).length,

      docentes:
        usuarios.filter(
          (usuario) =>
            usuario.rol ===
            'DOCENTE',
        ).length,

      administradores:
        usuarios.filter(
          (usuario) =>
            usuario.rol ===
            'ADMINISTRADOR',
        ).length,
    }),
    [usuarios],
  );

  const cantidadActivos =
    useMemo(
      () =>
        usuarios.filter(
          (usuario) =>
            usuario.estaActivo,
        ).length,
      [usuarios],
    );

  const cantidadDesactivados =
    useMemo(
      () =>
        usuarios.filter(
          (usuario) =>
            !usuario.estaActivo,
        ).length,
      [usuarios],
    );

  const calcularTiempoRestante = (
    fecha: string,
  ) => {
    const diferencia =
      new Date(fecha).getTime() -
      ahora;

    if (diferencia <= 0) {
      return null;
    }

    const minutos =
      Math.floor(
        diferencia /
          60_000,
      );

    const dias =
      Math.floor(
        minutos /
          1440,
      );

    const horas =
      Math.floor(
        (
          minutos %
          1440
        ) /
          60,
      );

    const minutosRestantes =
      minutos %
      60;

    if (dias > 0) {
      return `${dias}d ${horas}h`;
    }

    if (horas > 0) {
      return `${horas}h ${minutosRestantes}min`;
    }

    return `${minutosRestantes}min`;
  };

  return (
    <main className="usuarios-page">
      {toast.visible && (
        <Toast
          tipo={toast.tipo}
          titulo={toast.titulo}
          mensaje={toast.mensaje}
          onCerrar={cerrarToast}
        />
      )}

      <header className="usuarios-header">
        <div className="usuarios-header__content">
          <div className="usuarios-header__icon">
            <UsersRound size={25} />
          </div>

          <div>
            <span className="usuarios-eyebrow">
              Administración de cuentas
            </span>

            <h1>
              Usuarios
            </h1>

            <p>
              Gestiona las cuentas institucionales de IusAcademy.
            </p>

            <div className="usuarios-header__meta">
              <span>3 perfiles</span>
              <span>Acceso institucional</span>
              <span>Activación segura</span>
            </div>
          </div>
        </div>

        <div className="usuarios-header__actions">
          <button
            type="button"
            className="btn-agregar"
            onClick={abrirNuevoUsuario}
          >
            <UserPlus size={18} />

            Agregar usuario
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
          icono={
            <UsersRound size={21} />
          }
          cantidad={
            resumen.estudiantes
          }
          titulo="Estudiantes"
          clase="estudiantes"
        />

        <Resumen
          icono={
            <GraduationCap size={21} />
          }
          cantidad={
            resumen.docentes
          }
          titulo="Docentes"
          clase="docentes"
        />

        <Resumen
          icono={
            <ShieldCheck size={21} />
          }
          cantidad={
            resumen.administradores
          }
          titulo="Administradores"
          clase="administradores"
        />
      </section>

      {panelAbierto && (
        <section className="form-card">
          <div className="form-card-header">
            <div>
              <span className="section-eyebrow">
                {usuarioEditandoId
                  ? 'Editar cuenta'
                  : 'Nueva cuenta'}
              </span>

              <h2>
                {usuarioEditandoId
                  ? 'Editar usuario'
                  : 'Nuevo usuario'}
              </h2>

              <p>
                {usuarioEditandoId
                  ? 'Modifica la información institucional del usuario.'
                  : 'Completa los datos institucionales de la nueva cuenta.'}
              </p>
            </div>

            <button
              type="button"
              className="btn-cerrar-form"
              onClick={cerrarFormulario}
            >
              <X size={18} />
            </button>
          </div>

          <form
            className="usuarios-form"
            onSubmit={guardarUsuario}
          >
            <div className="form-grid">
              <Campo
                titulo="Nombres"
                nombre="nombres"
                valor={
                  formulario.nombres
                }
                placeholder="Ej. María Fernanda"
                onChange={
                  manejarCambio
                }
              />

              <Campo
                titulo="Apellido paterno"
                nombre="apellidoPaterno"
                valor={
                  formulario.apellidoPaterno
                }
                placeholder="Ej. Claros"
                onChange={
                  manejarCambio
                }
              />

              <Campo
                titulo="Apellido materno"
                nombre="apellidoMaterno"
                valor={
                  formulario.apellidoMaterno
                }
                placeholder="Ej. Mamani"
                onChange={
                  manejarCambio
                }
              />

              <Campo
                titulo="Correo institucional"
                nombre="correo"
                valor={
                  formulario.correo
                }
                placeholder="nombre.apellido@unifranz.edu.bo"
                tipo="email"
                onChange={
                  manejarCambio
                }
              />
            </div>

            <div className="rol-section">
              <span className="campo-title">
                Rol del usuario
              </span>

              <div className="roles">
                {roles.map(
                  (rol) => (
                    <button
                      key={
                        rol.valor
                      }
                      type="button"
                      className={`rol-chip ${
                        formulario.rol ===
                        rol.valor
                          ? 'active'
                          : ''
                      }`}
                      onClick={() =>
                        seleccionarRol(
                          rol.valor,
                        )
                      }
                    >
                      {rol.etiqueta}
                    </button>
                  ),
                )}
              </div>
            </div>

            {formulario.rol === 'DOCENTE' && (
              <div className="tratamiento-section">
                <span className="campo-title">
                  Tratamiento profesional
                </span>

                <div className="roles">
                  {(['DR', 'DRA'] as const).map((tratamiento) => (
                    <button
                      key={tratamiento}
                      type="button"
                      className={`rol-chip ${
                        formulario.tratamiento ===
                        tratamiento
                          ? 'active'
                          : ''
                      }`}
                      onClick={() =>
                        setFormulario((anterior) => ({
                          ...anterior,
                          tratamiento,
                        }))
                      }>
                        {tratamiento === 'DR' ? 'Dr.' : 'Dra.'}
                      </button>
                  ))}
                </div>
              </div>
            )}

            {!usuarioEditandoId && (
              <div className="password-info">
                <div className="password-info-icon">
                  <Clock3 size={20} />
                </div>

                <div>
                  <strong>
                    Activación segura de cuenta
                  </strong>

                  <p>
                    IusAcademy enviará un enlace de activación válido durante 3 días para que el usuario cree su contraseña definitiva.
                  </p>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={
                  cerrarFormulario
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={
                  guardando
                }
              >
                {guardando
                  ? 'Guardando...'
                  : usuarioEditandoId
                    ? 'Guardar cambios'
                    : 'Crear usuario'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="users-card">
        <div className="users-card-top">
          <div>
            <h2>
              Usuarios registrados
            </h2>

            <p>
              Consulta y administra las cuentas registradas.
            </p>
          </div>

          <span className="users-count">
            {usuarios.length}{' '}
            {usuarios.length === 1
              ? 'usuario'
              : 'usuarios'}
          </span>
        </div>

        <div className="user-filters">
          <button
            type="button"
            className={
              filtroEstado === 'ACTIVOS'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFiltroEstado('ACTIVOS')
            }
          >
            Activos

            <span>
              {cantidadActivos}
            </span>
          </button>

          <button
            type="button"
            className={
              filtroEstado === 'DESACTIVADOS'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFiltroEstado(
                'DESACTIVADOS',
              )
            }
          >
            Desactivados

            <span>
              {cantidadDesactivados}
            </span>
          </button>

          <button
            type="button"
            className={
              filtroEstado === 'TODOS'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFiltroEstado('TODOS')
            }
          >
            Todos

            <span>
              {usuarios.length}
            </span>
          </button>
        </div>

        <div className="search-box">
          <Search size={17} />

          <input
            value={busqueda}
            onChange={(event) =>
              setBusqueda(
                event.target.value,
              )
            }
            placeholder="Buscar por nombre, correo o rol..."
          />
        </div>
      </section>

      <section className="table-section">
        {cargando ? (
          <div className="state-card">
            Cargando usuarios...
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="state-card">
            {filtroEstado === 'ACTIVOS'
              ? 'No hay usuarios activos.'
              : filtroEstado === 'DESACTIVADOS'
                ? 'No hay usuarios desactivados.'
                : 'No se encontraron usuarios.'}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="usuarios-table">
              <colgroup>
                <col className="col-usuario" />
                <col className="col-correo" />
                <col className="col-rol" />
                <col className="col-estado" />
                <col className="col-activacion" />
                <col className="col-enlace" />
                <col className="col-acciones" />
              </colgroup>

              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Activación</th>
                  <th>Enlace</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {usuariosFiltrados.map(
                  (usuario) => {
                    const tiempoRestante =
                      usuario.tokenActivacionExpira
                        ? calcularTiempoRestante(
                            usuario.tokenActivacionExpira,
                          )
                        : null;

                    const enlaceVigente =
                      tiempoRestante !== null;

                    const enviando =
                      enviandoActivacionId ===
                      usuario.id;

                    return (
                      <tr key={usuario.id}>
                        <td>
                          <div className="user-cell">
                            <div
                              className={`table-avatar ${
                                construirUrlFoto(
                                  usuario.fotoPerfilUrl,
                                )
                                  ? 'has-image'
                                  : 'has-initials'
                              }`}
                            >
                              {construirUrlFoto(
                                usuario.fotoPerfilUrl,
                              ) ? (
                                <img
                                  src={
                                    construirUrlFoto(
                                      usuario.fotoPerfilUrl,
                                    ) ?? undefined
                                  }
                                  alt={`Fotografía de ${usuario.nombres} ${usuario.apellidoPaterno}`}
                                  loading="lazy"
                                />
                              ) : (
                                <span
                                  aria-label={`Iniciales de ${usuario.nombres} ${usuario.apellidoPaterno}`}
                                >
                                  {usuario.nombres
                                    .charAt(0)
                                    .toUpperCase()}
                                  {usuario.apellidoPaterno
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div>
                              <strong>
                                {usuario.nombres}{' '}
                                {usuario.apellidoPaterno}
                              </strong>

                              {usuario.apellidoMaterno && (
                                <span>
                                  {usuario.apellidoMaterno}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="email-cell">
                          {usuario.correo}
                        </td>

                        <td>
                          <span
                            className={`role-badge role-${usuario.rol.toLowerCase()}`}
                          >
                            {usuario.rol}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              usuario.estaActivo
                                ? 'active'
                                : 'inactive'
                            }`}
                          >
                            <span className="status-dot" />

                            {usuario.estaActivo
                              ? 'Activo'
                              : 'Inactivo'}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              usuario.cuentaActivada
                                ? 'activated'
                                : 'pending'
                            }`}
                          >
                            <span className="status-dot" />

                            {usuario.cuentaActivada
                              ? 'Activada'
                              : 'Pendiente'}
                          </span>
                        </td>

                        <td>
                          <div className="access-cell">
                            <button
                              type="button"
                              className="btn-access"
                              disabled={
                                usuario.cuentaActivada ||
                                enlaceVigente ||
                                enviando ||
                                !usuario.estaActivo
                              }
                              onClick={() =>
                                enviarActivacion(
                                  usuario,
                                )
                              }
                            >
                              <Mail size={15} />

                              {enviando
                                ? 'Enviando...'
                                : usuario.cuentaActivada
                                  ? 'Cuenta activada'
                                  : enlaceVigente
                                    ? 'Activación enviada'
                                    : usuario.accesoEnviadoEn
                                      ? 'Reenviar activación'
                                      : 'Enviar activación'}
                            </button>

                            {enlaceVigente && (
                              <span className="remaining-time">
                                <Clock3 size={12} />

                                Reenvío disponible en{' '}
                                {tiempoRestante}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="actions-cell">
                            <button
                              type="button"
                              className="action-button edit"
                              title="Editar usuario"
                              onClick={() =>
                                abrirEdicion(
                                  usuario,
                                )
                              }
                            >
                              <Pencil size={15} />

                              <span>
                                Editar
                              </span>
                            </button>

                            <button
                              type="button"
                              className={`action-button ${
                                usuario.estaActivo
                                  ? 'disable'
                                  : 'enable'
                              }`}
                              title={
                                usuario.estaActivo
                                  ? 'Desactivar usuario'
                                  : 'Reactivar usuario'
                              }
                              onClick={() =>
                                setUsuarioEstado(
                                  usuario,
                                )
                              }
                            >
                              {usuario.estaActivo ? (
                                <UserX size={15} />
                              ) : (
                                <UserCheck size={15} />
                              )}

                              <span>
                                {usuario.estaActivo
                                  ? 'Desactivar'
                                  : 'Reactivar'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalReportesAbierto && (
        <div className="modal-backdrop">
          <div className="reports-modal">
            <div className="reports-modal-header">
              <div>
                <span className="modal-eyebrow">
                  Reportes generales
                </span>

                <h3>
                  Exportar usuarios
                </h3>

                <p>
                  Selecciona los filtros y el formato del reporte institucional.
                </p>
              </div>

              <button
                type="button"
                className="reports-modal-close"
                onClick={() =>
                  setModalReportesAbierto(
                    false,
                  )
                }
                disabled={
                  Boolean(
                    descargandoReporte,
                  )
                }
                aria-label="Cerrar reportes"
              >
                <X size={18} />
              </button>
            </div>

            <div className="report-filters">
              <label>
                <span>Rol</span>

                <select
                  value={rolReporte}
                  onChange={(event) =>
                    setRolReporte(
                      event.target.value as Rol | 'TODOS',
                    )
                  }
                  disabled={Boolean(descargandoReporte)}
                >
                  <option value="TODOS">Todos los roles</option>
                  <option value="ADMINISTRADOR">Administradores</option>
                  <option value="DOCENTE">Docentes</option>
                  <option value="ESTUDIANTE">Estudiantes</option>
                </select>
              </label>

              <label>
                <span>Estado</span>

                <select
                  value={estadoReporte}
                  onChange={(event) =>
                    setEstadoReporte(
                      event.target.value as EstadoReporte,
                    )
                  }
                  disabled={Boolean(descargandoReporte)}
                >
                  <option value="TODOS">Todos</option>
                  <option value="ACTIVOS">Activos</option>
                  <option value="INACTIVOS">Inactivos</option>
                </select>
              </label>

              <label>
                <span>Activación</span>

                <select
                  value={activacionReporte}
                  onChange={(event) =>
                    setActivacionReporte(
                      event.target.value as ActivacionReporte,
                    )
                  }
                  disabled={Boolean(descargandoReporte)}
                >
                  <option value="TODOS">Todas</option>
                  <option value="ACTIVADOS">Activadas</option>
                  <option value="PENDIENTES">Pendientes</option>
                </select>
              </label>
            </div>

            <div className="report-options">
              <button
                type="button"
                className="report-option pdf"
                onClick={() =>
                  descargarReporteGeneral(
                    'PDF',
                  )
                }
                disabled={
                  Boolean(
                    descargandoReporte,
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
                    Informe institucional con resumen y fichas administrativas.
                  </span>
                </div>

                <Download size={18} />
              </button>

              <button
                type="button"
                className="report-option excel"
                onClick={() =>
                  descargarReporteGeneral(
                    'EXCEL',
                  )
                }
                disabled={
                  Boolean(
                    descargandoReporte,
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
                    Archivo editable con resumen y listado completo de usuarios.
                  </span>
                </div>

                <Download size={18} />
              </button>

              <button
                type="button"
                className="report-option csv"
                onClick={() =>
                  descargarReporteGeneral(
                    'CSV',
                  )
                }
                disabled={Boolean(descargandoReporte)}
              >
                <div className="report-option-icon">
                  <FileSpreadsheet size={24} />
                </div>

                <div>
                  <strong>
                    Reporte general CSV
                  </strong>

                  <span>
                    Archivo liviano compatible con Excel y otras herramientas.
                  </span>
                </div>

                <Download size={18} />
              </button>
            </div>

            {descargandoReporte && (
              <div className="report-generating">
                <span className="report-spinner" />

                Generando reporte {
                  descargandoReporte.toUpperCase()
                }...
              </div>
            )}

            <div className="reports-modal-note">
              Por seguridad, los reportes no incluyen contraseñas, hashes ni tokens de activación.
            </div>
          </div>
        </div>
      )}

      {usuarioEstado && (
        <div className="modal-backdrop">
          <div className="confirm-modal">
            <div
              className={`confirm-icon ${
                usuarioEstado.estaActivo
                  ? 'warning'
                  : 'success'
              }`}
            >
              {usuarioEstado.estaActivo ? (
                <UserX size={25} />
              ) : (
                <UserCheck size={25} />
              )}
            </div>

            <span className="modal-eyebrow">
              Confirmar acción
            </span>

            <h3>
              {usuarioEstado.estaActivo
                ? '¿Desactivar usuario?'
                : '¿Reactivar usuario?'}
            </h3>

            <p>
              {usuarioEstado.estaActivo
                ? `${usuarioEstado.nombres} ${usuarioEstado.apellidoPaterno} perderá temporalmente el acceso a IusAcademy.`
                : `${usuarioEstado.nombres} ${usuarioEstado.apellidoPaterno} podrá volver a acceder a la plataforma.`}
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-cancel"
                onClick={() =>
                  setUsuarioEstado(null)
                }
                disabled={
                  actualizandoEstado
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className={`modal-confirm ${
                  usuarioEstado.estaActivo
                    ? 'disable'
                    : 'enable'
                }`}
                onClick={
                  cambiarEstadoUsuario
                }
                disabled={
                  actualizandoEstado
                }
              >
                {actualizandoEstado
                  ? 'Procesando...'
                  : usuarioEstado.estaActivo
                    ? 'Desactivar'
                    : 'Reactivar'}
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
  onChange,
}: {
  titulo: string;
  nombre: string;
  valor: string;
  placeholder: string;
  tipo?: string;
  onChange:
    React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <label>
      <span>
        {titulo}
      </span>

      <input
        type={tipo}
        name={nombre}
        value={valor}
        onChange={onChange}
        placeholder={placeholder}
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
  icono: React.ReactNode;
  cantidad: number;
  titulo: string;
  clase: string;
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
    const timer =
      window.setTimeout(
        onCerrar,
        5000,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [onCerrar]);

  return (
    <div
      className={`toast ${tipo}`}
    >
      <div className="toast-icon">
        {tipo === 'exito' ? (
          <CheckCircle2 size={22} />
        ) : (
          <CircleX size={22} />
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
      >
        <X size={16} />
      </button>

      <div className="toast-progress" />
    </div>
  );
}

const styles = `
  .usuarios-page {
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

  .usuarios-header {
    position: relative;

    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 28px;

    margin-bottom: 18px;

    padding:
      23px
      30px;

    overflow: hidden;

    border:
      1px solid
      var(--app-border);

    border-radius: 26px;

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

  .usuarios-header::before {
    content: "";

    position: absolute;

    inset:
      0
      auto
      0
      0;

    width: 5px;

    background:
      var(--app-accent);
  }

  .usuarios-header__content {
    position: relative;
    z-index: 1;

    min-width: 0;

    display: flex;
    align-items: center;

    gap: 17px;
  }

  .usuarios-header__content > div:last-child {
    min-width: 0;
  }

  .usuarios-header__icon {
    width: 58px;
    height: 58px;

    display: grid;
    place-items: center;

    flex-shrink: 0;

    border:
      1px solid
      var(--app-border-strong);

    border-radius: 18px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);

    box-shadow:
      var(--app-shadow-sm);
  }

  .usuarios-eyebrow,
  .section-eyebrow,
  .modal-eyebrow {
    display: block;

    color:
      var(--app-accent-dark);

    font-size: 11px;
    font-weight: 850;

    letter-spacing: .15em;
    text-transform: uppercase;
  }

  .usuarios-header h1 {
    margin:
      5px
      0
      0;

    color:
      var(--app-text);

    font-size: 31px;
    font-weight: 900;

    letter-spacing: -.025em;
  }

  .usuarios-header p {
    margin:
      6px
      0
      0;

    color:
      var(--app-text-soft);

    font-size: 14px;
  }

  .usuarios-header__meta {
    display: flex;
    flex-wrap: wrap;

    gap: 7px;

    margin-top: 12px;
  }

  .usuarios-header__meta span {
    padding:
      5px
      9px;

    border:
      1px solid
      var(--app-warning-border);

    border-radius: 999px;

    color:
      var(--app-warning-strong);

    background:
      var(--app-warning-bg);

    font-size: 10px;
    font-weight: 750;
  }

  .usuarios-header__actions {
    position: relative;
    z-index: 1;

    width: 205px;

    display: grid;
    grid-template-columns: 1fr;

    gap: 9px;

    flex-shrink: 0;
  }

  .btn-agregar,
  .btn-primary {
    border: none;

    color: #fff;

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
    width: 100%;
    min-height: 45px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 8px;

    padding:
      12px
      20px;

    border-radius: 999px;

    font-weight: 800;

    cursor: pointer;
  }

  .btn-reporte-general {
    width: 100%;
    min-height: 42px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 8px;

    padding:
      10px
      18px;

    border:
      1px solid
      var(--app-border-strong);

    border-radius: 999px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-surface-alt);

    font-weight: 800;

    cursor: pointer;
  }

  .btn-reporte-general:hover {
    transform:
      translateY(
        -1px
      );

    background:
      var(--app-accent-soft);
  }

  .summary-grid {
    display: grid;

    grid-template-columns:
      repeat(
        3,
        minmax(
          0,
          1fr
        )
      );

    gap: 14px;

    margin-bottom: 18px;
  }

  .summary-card {
    display: flex;
    align-items: center;

    gap: 14px;

    min-height: 80px;

    padding:
      15px
      18px;

    border:
      1px solid
      var(--app-border);

    border-radius: 21px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow-sm);
  }

  .summary-icon {
    width: 48px;
    height: 48px;

    display: grid;
    place-items: center;

    flex-shrink: 0;

    border-radius: 15px;
  }

  .summary-icon.estudiantes {
    color:
      var(--app-accent);

    background:
      var(--app-accent-soft);
  }

  .summary-icon.docentes {
    color:
      var(--app-warning);

    background:
      var(--app-warning-bg);
  }

  .summary-icon.administradores {
    color:
      var(--app-purple);

    background:
      var(--app-purple-bg);
  }

  .summary-card strong {
    display: block;

    color:
      var(--app-text);

    font-size: 24px;
    font-weight: 900;
  }

  .summary-card span {
    display: block;

    margin-top: 6px;

    color:
      var(--app-text-soft);

    font-size: 12px;
  }

  .form-card,
  .users-card {
    margin-bottom: 18px;

    padding:
      21px
      24px;

    border:
      1px solid
      var(--app-border);

    border-radius: 23px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow);
  }

  .form-card {
    position: relative;

    overflow: hidden;
  }

  .form-card::before {
    content: "";

    position: absolute;

    inset:
      0
      0
      auto;

    height: 4px;

    background:
      linear-gradient(
        90deg,
        var(--app-accent),
        var(--app-warning),
        transparent 80%
      );
  }

  .form-card-header,
  .users-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    gap: 20px;
  }

  .form-card-header h2,
  .users-card-top h2 {
    margin:
      5px
      0
      0;

    color:
      var(--app-text);

    font-size: 19px;
    font-weight: 850;
  }

  .form-card-header p,
  .users-card-top p {
    margin:
      5px
      0
      0;

    color:
      var(--app-text-soft);

    font-size: 13px;
  }

  .btn-cerrar-form {
    width: 38px;
    height: 38px;

    display: grid;
    place-items: center;

    border: none;

    border-radius: 12px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);

    cursor: pointer;
  }

  .form-grid {
    display: grid;

    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );

    gap: 18px;

    margin-top: 22px;
  }

  .usuarios-form label {
    display: flex;
    flex-direction: column;

    gap: 7px;
  }

  .usuarios-form label span,
  .campo-title {
    color:
      var(--app-text-secondary);

    font-size: 13px;
    font-weight: 700;
  }

  .usuarios-form input {
    width: 100%;
    min-height: 46px;

    padding:
      12px
      14px;

    border:
      1px solid
      var(--app-input-border);

    border-radius: 14px;

    outline: none;

    color:
      var(--app-text);

    background:
      var(--app-input-bg);
  }

  .usuarios-form input:focus {
    border-color:
      var(--app-accent);

    box-shadow:
      0 0 0 4px
      var(--app-input-ring);
  }

  .rol-section {
    margin-top: 20px;
  }

  .roles {
    display: flex;
    flex-wrap: wrap;

    gap: 9px;

    margin-top: 10px;
  }

  .rol-chip {
    min-height: 38px;

    padding:
      8px
      16px;

    border:
      1px solid
      var(--app-input-border);

    border-radius: 999px;

    color:
      var(--app-text-soft);

    background:
      var(--app-surface);

    font-weight: 700;

    cursor: pointer;
  }

  .rol-chip.active {
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

  .password-info {
    display: flex;
    align-items: center;

    gap: 14px;

    margin-top: 22px;

    padding:
      16px
      18px;

    border:
      1px solid
      var(--app-warning-border);

    border-left:
      4px solid
      var(--app-accent);

    border-radius: 16px;

    background:
      var(--app-warning-bg);
  }

  .password-info-icon {
    width: 42px;
    height: 42px;

    display: grid;
    place-items: center;

    flex-shrink: 0;

    border-radius: 13px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .password-info strong {
    color:
      var(--app-warning-strong);
  }

  .password-info p {
    margin:
      3px
      0
      0;

    color:
      var(--app-text-soft);

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

    padding:
      10px
      18px;

    border-radius: 999px;

    font-weight: 750;

    cursor: pointer;
  }

  .btn-secondary,
  .modal-cancel {
    border:
      1px solid
      var(--app-border-strong);

    color:
      var(--app-accent-dark);

    background:
      transparent;
  }

  .users-count {
    padding:
      6px
      11px;

    border-radius: 999px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);

    font-size: 12px;
    font-weight: 800;
  }

  .user-filters {
    display: flex;
    flex-wrap: wrap;

    gap: 9px;

    margin-top: 18px;
  }

  .user-filters button {
    display: inline-flex;
    align-items: center;

    gap: 8px;

    padding:
      8px
      14px;

    border:
      1px solid
      var(--app-input-border);

    border-radius: 999px;

    color:
      var(--app-text-soft);

    background:
      var(--app-surface);

    font-size: 12px;
    font-weight: 750;

    cursor: pointer;
  }

  .user-filters button.active {
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

  .user-filters button span {
    min-width: 21px;
    height: 21px;

    display: grid;
    place-items: center;

    padding:
      0
      6px;

    border-radius: 999px;

    background:
      var(--app-accent-softer);

    font-size: 10px;
  }

  .search-box {
    display: flex;
    align-items: center;

    gap: 9px;

    margin-top: 14px;

    padding:
      10px
      14px;

    border:
      1px solid
      var(--app-input-border);

    border-radius: 14px;

    color:
      var(--app-text-muted);

    background:
      var(--app-surface);
  }

  .search-box input {
    width: 100%;

    border: none;

    outline: none;

    color:
      var(--app-text);

    background:
      transparent;
  }

  .table-wrapper {
    width: 100%;

    overflow-x: auto;

    border:
      1px solid
      var(--app-border);

    border-radius: 21px;

    background:
      var(--app-surface);
  }

  .usuarios-table {
    width: 100%;
    min-width: 1080px;

    border-collapse: separate;
    border-spacing: 0;
  }

  .usuarios-table .col-usuario {
    width: 19%;
  }

  .usuarios-table .col-correo {
    width: 22%;
  }

  .usuarios-table .col-rol {
    width: 10%;
  }

  .usuarios-table .col-estado {
    width: 9%;
  }

  .usuarios-table .col-activacion {
    width: 10%;
  }

  .usuarios-table .col-enlace {
    width: 17%;
  }

  .usuarios-table .col-acciones {
    width: 13%;
  }

  .usuarios-table th,
  .usuarios-table td {
    padding:
      12px
      10px;

    text-align: left;
    vertical-align: middle;

    border-bottom:
      1px solid
      var(--app-border-soft);
  }

  .usuarios-table th {
    color:
      var(--app-text-soft);

    background:
      var(--app-accent-soft);

    font-size: 10px;
    font-weight: 850;

    text-transform: uppercase;
  }

  .usuarios-table td {
    color:
      var(--app-text-secondary);

    font-size: 12px;
  }

  .usuarios-table tbody tr {
    transition:
      background .18s ease,
      box-shadow .18s ease;
  }

  .usuarios-table tbody tr:hover {
    background:
      var(--app-accent-softer);

    box-shadow:
      inset 4px 0 0
      var(--app-accent);
  }

  .user-cell {
    display: flex;
    align-items: center;

    gap: 10px;

    min-width: 210px;
  }

  .user-cell > div:last-child {
    min-width: 0;
  }

  .table-avatar {
    width: 46px;
    height: 46px;

    display: grid;
    place-items: center;

    flex-shrink: 0;
    overflow: hidden;

    border:
      1px solid
      var(--app-border-strong);

    border-radius: 30%;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);

    font-size: 15px;
    font-weight: 850;
  }

  .table-avatar img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  .table-avatar.has-image {
    background:
      var(--app-surface-raised);
  }

  .table-avatar.has-initials span {
    line-height: 1;
  }

  .user-cell strong {
    display: block;

    overflow: hidden;

    color:
      var(--app-text);

    font-size: 12px;

    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .user-cell > div:last-child span {
    display: block;

    margin-top: 3px;

    color:
      var(--app-text-muted);

    font-size: 10px;
  }

  .email-cell {
    max-width: 240px;

    color:
      var(--app-text-muted);

    font-size: 10px;

    overflow-wrap: anywhere;
    word-break: break-word;

    line-height: 1.35;
  }

  .role-badge,
  .status-badge {
    display: inline-flex;
    align-items: center;

    gap: 5px;

    padding:
      6px
      9px;

    border-radius: 999px;

    font-size: 10px;
    font-weight: 850;
  }

  .role-administrador {
    color:
      var(--app-warning-strong);

    background:
      var(--app-warning-bg);
  }

  .role-docente {
    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .role-estudiante {
    color:
      var(--app-purple);

    background:
      var(--app-purple-bg);
  }

  .status-badge.active,
  .status-badge.activated {
    color:
      var(--app-success);

    background:
      var(--app-success-bg);
  }

  .status-badge.inactive {
    color:
      var(--app-text-soft);

    background:
      var(--app-surface-disabled);
  }

  .status-badge.pending {
    color:
      var(--app-warning);

    background:
      var(--app-warning-bg);
  }

  .status-dot {
    width: 6px;
    height: 6px;

    border-radius: 50%;

    background:
      currentColor;
  }

  .access-cell {
    display: flex;
    flex-direction: column;
    align-items: stretch;

    gap: 6px;

    min-width: 145px;
  }

  .btn-access {
    width: 100%;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 5px;

    padding:
      7px
      8px;

    border:
      1px solid
      var(--app-border-strong);

    border-radius: 12px;

    color:
      var(--app-accent-dark);

    background:
      transparent;

    font-size: 10px;
    font-weight: 750;

    cursor: pointer;
  }

  .btn-access:disabled {
    opacity: .55;

    cursor: not-allowed;
  }

  .remaining-time {
    display: inline-flex;
    align-items: flex-start;

    gap: 4px;

    color:
      var(--app-text-muted);

    font-size: 9px;

    line-height: 1.35;
  }

  .actions-cell {
    display: flex;
    flex-direction: column;
    align-items: stretch;

    gap: 6px;

    min-width: 112px;
  }

  .action-button {
    width: 100%;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 5px;

    padding:
      7px
      8px;

    border-radius: 11px;

    background:
      transparent;

    font-size: 10px;
    font-weight: 780;

    cursor: pointer;
  }

  .action-button.edit {
    border:
      1px solid
      var(--app-border-strong);

    color:
      var(--app-accent-dark);
  }

  .action-button.disable {
    border:
      1px solid
      var(--app-danger-border);

    color:
      var(--app-danger);
  }

  .action-button.enable {
    border:
      1px solid
      var(--app-success-border);

    color:
      var(--app-success);
  }

  .state-card {
    padding: 25px;

    border:
      1px solid
      var(--app-border);

    border-radius: 19px;

    color:
      var(--app-text-soft);

    background:
      var(--app-surface);
  }

  .modal-backdrop {
    position: fixed;

    inset: 0;

    z-index: 8000;

    display: grid;
    place-items: center;

    padding: 20px;

    background:
      var(--app-overlay);

    backdrop-filter:
      blur(6px);
  }

  .reports-modal,
  .confirm-modal {
    padding: 28px;

    border:
      1px solid
      var(--app-border);

    border-radius: 25px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow-modal);
  }

  .reports-modal {
    width:
      min(
        620px,
        100%
      );

    max-height:
      calc(
        100vh - 40px
      );

    overflow-y: auto;
  }

  .confirm-modal {
    width:
      min(
        430px,
        100%
      );
  }

  .reports-modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    gap: 18px;
  }

  .reports-modal-header h3,
  .confirm-modal h3 {
    margin:
      7px
      0
      0;

    color:
      var(--app-text);

    font-size: 21px;
  }

  .reports-modal-header p,
  .confirm-modal p {
    margin:
      7px
      0
      0;

    color:
      var(--app-text-soft);

    line-height: 1.55;
  }

  .reports-modal-header p {
    max-width: 470px;

    font-size: 12px;
  }

  .confirm-modal p {
    font-size: 14px;
  }

  .reports-modal-close {
    width: 38px;
    height: 38px;

    display: grid;
    place-items: center;

    border: none;

    border-radius: 12px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);

    cursor: pointer;
  }

  .report-filters {
    display: grid;

    grid-template-columns:
      repeat(
        3,
        minmax(
          0,
          1fr
        )
      );

    gap: 11px;

    margin-top: 20px;
  }

  .report-filters label {
    display: grid;

    gap: 7px;
  }

  .report-filters span {
    color:
      var(--app-text-secondary);

    font-size: 11px;
    font-weight: 750;
  }

  .report-filters select {
    width: 100%;
    min-height: 42px;

    padding:
      9px
      11px;

    border:
      1px solid
      var(--app-input-border);

    border-radius: 12px;

    outline: none;

    color:
      var(--app-text);

    background:
      var(--app-input-bg);
  }

  .report-filters select:focus {
    border-color:
      var(--app-accent);

    box-shadow:
      0 0 0 3px
      var(--app-input-ring);
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

    background:
      var(--app-surface-alt);

    cursor: pointer;
  }

  .report-option.pdf {
    border:
      1px solid
      var(--app-warning-border);

    color:
      var(--app-warning);
  }

  .report-option.excel {
    border:
      1px solid
      var(--app-success-border);

    color:
      var(--app-success);
  }

  .report-option.csv {
    border:
      1px solid
      var(--app-info-border);

    color:
      var(--app-info);
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
    background:
      var(--app-warning-bg);
  }

  .report-option.excel
  .report-option-icon {
    background:
      var(--app-success-bg);
  }

  .report-option.csv
  .report-option-icon {
    background:
      var(--app-info-bg);
  }

  .report-option strong,
  .report-option span {
    display: block;
  }

  .report-option strong {
    color:
      var(--app-text);

    font-size: 13px;
  }

  .report-option span {
    margin-top: 4px;

    color:
      var(--app-text-soft);

    font-size: 11px;

    line-height: 1.5;
  }

  .report-generating,
  .reports-modal-note {
    margin-top: 16px;

    padding:
      12px
      14px;

    border-radius: 13px;

    color:
      var(--app-warning-strong);

    background:
      var(--app-bg-soft);

    font-size: 11px;

    line-height: 1.55;
  }

  .report-generating {
    display: flex;
    align-items: center;

    gap: 10px;

    font-size: 12px;
    font-weight: 750;
  }

  .reports-modal-note {
    border-left:
      4px solid
      var(--app-accent);
  }

  .report-spinner {
    width: 17px;
    height: 17px;

    flex-shrink: 0;

    border:
      2px solid
      var(--app-border);

    border-top-color:
      var(--app-accent);

    border-radius: 50%;

    animation:
      reportSpin
      .8s
      linear
      infinite;
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
    color:
      var(--app-danger);

    background:
      var(--app-danger-bg);
  }

  .confirm-icon.success {
    color:
      var(--app-success);

    background:
      var(--app-success-bg);
  }

  .modal-confirm {
    border: none;

    color: #fff;
  }

  .modal-confirm.disable {
    background:
      var(--app-danger);
  }

  .modal-confirm.enable {
    background:
      var(--app-success);
  }

  .toast {
    position: fixed;

    top: 25px;
    right: 28px;

    z-index: 9999;

    width:
      min(
        390px,
        calc(
          100vw - 40px
        )
      );

    display: grid;

    grid-template-columns:
      42px
      1fr
      28px;

    gap: 11px;

    padding:
      15px
      15px
      18px;

    border-radius: 18px;

    overflow: hidden;

    box-shadow:
      var(--app-shadow-lg);
  }

  .toast.exito {
    border:
      1px solid
      var(--app-success-border);

    color:
      var(--app-success);

    background:
      var(--app-success-bg);
  }

  .toast.error {
    border:
      1px solid
      var(--app-danger-border);

    color:
      var(--app-danger-strong);

    background:
      var(--app-danger-bg);
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

    font-size: 14px;
  }

  .toast-content p {
    margin:
      4px
      0
      0;

    color:
      var(--app-text-soft);

    font-size: 12px;
  }

  .toast button {
    border: none;

    color:
      var(--app-text-muted);

    background:
      transparent;

    cursor: pointer;
  }

  .toast-progress {
    position: absolute;

    left: 0;
    bottom: 0;

    width: 100%;
    height: 4px;

    transform-origin:
      left
      center;

    animation:
      toastProgress
      5s
      linear
      forwards;
  }

  .toast.exito
  .toast-progress {
    background:
      #22c55e;
  }

  .toast.error
  .toast-progress {
    background:
      #ef4444;
  }

  html[data-theme='oscuro']
  .usuarios-table th {
    background:
      var(--app-surface-raised);
  }

  html[data-theme='oscuro']
  .usuarios-table td,
  html[data-theme='oscuro']
  .usuarios-table th {
    border-bottom-color:
      var(--app-border-soft);
  }

  html[data-theme='oscuro']
  .usuarios-header,
  html[data-theme='oscuro']
  .summary-card,
  html[data-theme='oscuro']
  .form-card,
  html[data-theme='oscuro']
  .users-card,
  html[data-theme='oscuro']
  .table-wrapper,
  html[data-theme='oscuro']
  .state-card,
  html[data-theme='oscuro']
  .reports-modal,
  html[data-theme='oscuro']
  .confirm-modal {
    background:
      var(--app-surface);

    border-color:
      var(--app-border-soft);

    box-shadow:
      var(--app-shadow);
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

  @keyframes reportSpin {
    to {
      transform:
        rotate(
          360deg
        );
    }
  }

  @media (
    min-width:
      1360px
  ) {
    .usuarios-table {
      min-width: 0;
      table-layout: fixed;
    }
  }

  @media (
    max-width:
      1180px
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
  }

  @media (
    max-width:
      850px
  ) {
    .usuarios-page {
      padding: 18px;
    }

    .usuarios-header {
      align-items: stretch;
      flex-direction: column;
    }

    .usuarios-header__actions,
    .btn-agregar,
    .btn-reporte-general {
      width: 100%;
    }

    .summary-grid,
    .form-grid,
    .report-filters {
      grid-template-columns:
        1fr;
    }

    .users-card-top {
      flex-direction: column;
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