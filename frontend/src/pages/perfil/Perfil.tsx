import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  ChangeEvent,
  FormEvent,
  ReactNode,
} from 'react';

import {
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Camera,
  Check,
  CheckCircle2,
  CircleAlert,
  CircleX,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Mail,
  Pencil,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

import {
  useAuth,
} from '../../auth/AuthContext';

type Rol =
  | 'ADMINISTRADOR'
  | 'DOCENTE'
  | 'ESTUDIANTE';

type Perfil = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  fotoPerfilUrl: string | null;
  rol: Rol;
  estaActivo: boolean;
  cuentaActivada: boolean;
  accesoEnviadoEn: string | null;
  passwordCambiadaEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
};

type FormularioPerfil = {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
};

type FormularioPassword = {
  passwordActual: string;
  nuevaPassword: string;
  confirmarPassword: string;
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
  message?:
    | string
    | string[];

  mensaje?: string;
  error?: string;
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

const formularioPerfilInicial:
  FormularioPerfil = {
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
  };

const formularioPasswordInicial:
  FormularioPassword = {
    passwordActual: '',
    nuevaPassword: '',
    confirmarPassword: '',
  };

function crearHeadersAutorizados(
  accessToken: string,
  incluirJson = false,
): HeadersInit {
  return {
    Authorization:
      `Bearer ${accessToken}`,

    ...(incluirJson
      ? {
          'Content-Type':
            'application/json',
        }
      : {}),
  };
}

async function leerRespuestaJson(
  respuesta: Response,
): Promise<unknown> {
  const tipoContenido =
    respuesta.headers.get(
      'content-type',
    );

  if (
    !tipoContenido?.includes(
      'application/json',
    )
  ) {
    return {};
  }

  return respuesta
    .json()
    .catch(
      () => ({}),
    );
}

function obtenerMensajeError(
  datos: unknown,
  mensajePredeterminado:
    string,
): string {
  const respuesta =
    datos as
      RespuestaError;

  if (
    Array.isArray(
      respuesta?.message,
    )
  ) {
    return respuesta.message.join(
      '. ',
    );
  }

  return (
    respuesta?.message ||
    respuesta?.mensaje ||
    respuesta?.error ||
    mensajePredeterminado
  );
}

function formatearFecha(
  valor:
    | string
    | null,
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
    return 'No registrada';
  }

  return new Intl.DateTimeFormat(
    'es-BO',
    {
      dateStyle:
        'medium',

      timeStyle:
        'short',
    },
  ).format(fecha);
}

function obtenerEtiquetaRol(
  rol: Rol,
): string {
  if (
    rol ===
    'ADMINISTRADOR'
  ) {
    return 'Administrador';
  }

  if (
    rol ===
    'DOCENTE'
  ) {
    return 'Docente';
  }

  return 'Estudiante';
}

function obtenerIniciales(
  perfil: Perfil,
): string {
  return [
    perfil.nombres,
    perfil.apellidoPaterno,
  ]
    .map(
      (
        texto,
      ) =>
        texto
          .trim()
          .charAt(0)
          .toUpperCase(),
    )
    .join('');
}

function obtenerNombreCompleto(
  perfil: Perfil,
): string {
  return [
    perfil.nombres,
    perfil.apellidoPaterno,
    perfil.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(' ');
}

function construirUrlFoto(
  fotoPerfilUrl:
    string | null,
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

function notificarPerfilActualizado() {
  window.dispatchEvent(
    new Event(
      'iusacademy:perfil-actualizado',
    ),
  );
}

function Perfil() {
  const {
    accessToken,
  } = useAuth();

  const inputFotoRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [
    perfil,
    setPerfil,
  ] = useState<Perfil | null>(
    null,
  );

  const [
    formularioPerfil,
    setFormularioPerfil,
  ] = useState<FormularioPerfil>(
    formularioPerfilInicial,
  );

  const [
    formularioPassword,
    setFormularioPassword,
  ] = useState<FormularioPassword>(
    formularioPasswordInicial,
  );

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    editando,
    setEditando,
  ] = useState(false);

  const [
    guardandoPerfil,
    setGuardandoPerfil,
  ] = useState(false);

  const [
    guardandoPassword,
    setGuardandoPassword,
  ] = useState(false);

  const [
    subiendoFoto,
    setSubiendoFoto,
  ] = useState(false);

  const [
    eliminandoFoto,
    setEliminandoFoto,
  ] = useState(false);

  const [
    modalPasswordAbierto,
    setModalPasswordAbierto,
  ] = useState(false);

  const [
    modalEliminarFotoAbierto,
    setModalEliminarFotoAbierto,
  ] = useState(false);

  const [
    mostrarPasswordActual,
    setMostrarPasswordActual,
  ] = useState(false);

  const [
    mostrarNuevaPassword,
    setMostrarNuevaPassword,
  ] = useState(false);

  const [
    mostrarConfirmacion,
    setMostrarConfirmacion,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

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
        setToast(
          (
            anterior,
          ) => ({
            ...anterior,
            visible: false,
          }),
        );
      },
      [],
    );

  const cargarPerfil =
    useCallback(
      async () => {
        if (!accessToken) {
          setError(
            'No existe una sesión válida.',
          );

          setCargando(
            false,
          );

          return;
        }

        try {
          setCargando(
            true,
          );

          setError(
            null,
          );

          const respuesta =
            await fetch(
              `${API_URL}/perfil`,
              {
                method:
                  'GET',

                headers:
                  crearHeadersAutorizados(
                    accessToken,
                  ),
              },
            );

          const datos =
            await leerRespuestaJson(
              respuesta,
            );

          if (!respuesta.ok) {
            throw new Error(
              obtenerMensajeError(
                datos,
                'No fue posible cargar el perfil.',
              ),
            );
          }

          const perfilObtenido =
            datos as Perfil;

          setPerfil(
            perfilObtenido,
          );

          setFormularioPerfil({
            nombres:
              perfilObtenido.nombres,

            apellidoPaterno:
              perfilObtenido.apellidoPaterno,

            apellidoMaterno:
              perfilObtenido.apellidoMaterno ??
              '',
          });
        } catch (
          errorActual
        ) {
          console.error(
            errorActual,
          );

          setError(
            errorActual instanceof Error
              ? errorActual.message
              : 'No fue posible cargar el perfil.',
          );
        } finally {
          setCargando(
            false,
          );
        }
      },
      [
        accessToken,
      ],
    );

  useEffect(
    () => {
      void cargarPerfil();
    },
    [
      cargarPerfil,
    ],
  );

  const fotoPerfil =
    useMemo(
      () =>
        construirUrlFoto(
          perfil?.fotoPerfilUrl ??
          null,
        ),
      [
        perfil?.fotoPerfilUrl,
      ],
    );

  const fortalezaPassword =
    useMemo(
      () => {
        const valor =
          formularioPassword
            .nuevaPassword;

        const reglas = [
          valor.length >=
            8,

          /[A-Z]/.test(
            valor,
          ),

          /[a-z]/.test(
            valor,
          ),

          /\d/.test(
            valor,
          ),

          /[^A-Za-z0-9]/.test(
            valor,
          ),
        ];

        return reglas.filter(
          Boolean,
        ).length;
      },
      [
        formularioPassword
          .nuevaPassword,
      ],
    );

  const passwordCoincide =
    formularioPassword
      .nuevaPassword
      .length >
      0 &&
    formularioPassword
      .nuevaPassword ===
      formularioPassword
        .confirmarPassword;

  const actualizarCampoPerfil =
    (
      campo:
        keyof FormularioPerfil,
    ) =>
    (
      evento:
        ChangeEvent<HTMLInputElement>,
    ) => {
      setFormularioPerfil(
        (
          anterior,
        ) => ({
          ...anterior,
          [campo]:
            evento.target.value,
        }),
      );
    };

  const actualizarCampoPassword =
    (
      campo:
        keyof FormularioPassword,
    ) =>
    (
      evento:
        ChangeEvent<HTMLInputElement>,
    ) => {
      setFormularioPassword(
        (
          anterior,
        ) => ({
          ...anterior,
          [campo]:
            evento.target.value,
        }),
      );
    };

  const cancelarEdicion = () => {
    if (!perfil) {
      return;
    }

    setFormularioPerfil({
      nombres:
        perfil.nombres,

      apellidoPaterno:
        perfil.apellidoPaterno,

      apellidoMaterno:
        perfil.apellidoMaterno ??
        '',
    });

    setEditando(
      false,
    );
  };

  const guardarPerfil =
    async (
      evento:
        FormEvent<HTMLFormElement>,
    ) => {
      evento.preventDefault();

      if (
        !accessToken ||
        !perfil
      ) {
        return;
      }

      const nombres =
        formularioPerfil
          .nombres
          .trim();

      const apellidoPaterno =
        formularioPerfil
          .apellidoPaterno
          .trim();

      const apellidoMaterno =
        formularioPerfil
          .apellidoMaterno
          .trim();

      if (
        nombres.length <
        2
      ) {
        mostrarToast(
          'error',
          'Datos incompletos',
          'Los nombres deben tener al menos 2 caracteres.',
        );

        return;
      }

      if (
        apellidoPaterno.length <
        2
      ) {
        mostrarToast(
          'error',
          'Datos incompletos',
          'El apellido paterno debe tener al menos 2 caracteres.',
        );

        return;
      }

      try {
        setGuardandoPerfil(
          true,
        );

        const respuesta =
          await fetch(
            `${API_URL}/perfil`,
            {
              method:
                'PUT',

              headers:
                crearHeadersAutorizados(
                  accessToken,
                  true,
                ),

              body:
                JSON.stringify({
                  nombres,
                  apellidoPaterno,
                  apellidoMaterno,
                }),
            },
          );

        const datos =
          await leerRespuestaJson(
            respuesta,
          );

        if (!respuesta.ok) {
          throw new Error(
            obtenerMensajeError(
              datos,
              'No fue posible actualizar el perfil.',
            ),
          );
        }

        const resultado =
          datos as {
            mensaje?: string;
            perfil?: Perfil;
          };

        if (
          resultado.perfil
        ) {
          setPerfil(
            resultado.perfil,
          );
        }

        notificarPerfilActualizado();

        setEditando(
          false,
        );

        mostrarToast(
          'exito',
          'Perfil actualizado',
          resultado.mensaje ||
            'Tus datos personales se actualizaron correctamente.',
        );
      } catch (
        errorActual
      ) {
        console.error(
          errorActual,
        );

        mostrarToast(
          'error',
          'No se pudo actualizar',
          errorActual instanceof Error
            ? errorActual.message
            : 'No fue posible actualizar el perfil.',
        );
      } finally {
        setGuardandoPerfil(
          false,
        );
      }
    };

  const cambiarPassword =
    async (
      evento:
        FormEvent<HTMLFormElement>,
    ) => {
      evento.preventDefault();

      if (!accessToken) {
        return;
      }

      if (
        fortalezaPassword <
        5
      ) {
        mostrarToast(
          'error',
          'Contraseña insegura',
          'La nueva contraseña debe cumplir todos los requisitos.',
        );

        return;
      }

      if (
        !passwordCoincide
      ) {
        mostrarToast(
          'error',
          'Las contraseñas no coinciden',
          'Verifica la confirmación de la nueva contraseña.',
        );

        return;
      }

      try {
        setGuardandoPassword(
          true,
        );

        const respuesta =
          await fetch(
            `${API_URL}/perfil/password`,
            {
              method:
                'PUT',

              headers:
                crearHeadersAutorizados(
                  accessToken,
                  true,
                ),

              body:
                JSON.stringify(
                  formularioPassword,
                ),
            },
          );

        const datos =
          await leerRespuestaJson(
            respuesta,
          );

        if (!respuesta.ok) {
          throw new Error(
            obtenerMensajeError(
              datos,
              'No fue posible cambiar la contraseña.',
            ),
          );
        }

        const resultado =
          datos as {
            mensaje?: string;
          };

        setFormularioPassword(
          formularioPasswordInicial,
        );

        setModalPasswordAbierto(
          false,
        );

        setPerfil(
          (
            anterior,
          ) =>
            anterior
              ? {
                  ...anterior,
                  passwordCambiadaEn:
                    new Date().toISOString(),
                }
              : anterior,
        );

        mostrarToast(
          'exito',
          'Contraseña actualizada',
          resultado.mensaje ||
            'La contraseña fue actualizada correctamente.',
        );
      } catch (
        errorActual
      ) {
        console.error(
          errorActual,
        );

        mostrarToast(
          'error',
          'No se pudo cambiar',
          errorActual instanceof Error
            ? errorActual.message
            : 'No fue posible cambiar la contraseña.',
        );
      } finally {
        setGuardandoPassword(
          false,
        );
      }
    };

  const seleccionarFoto = () => {
    inputFotoRef.current?.click();
  };

  const subirFoto =
    async (
      evento:
        ChangeEvent<HTMLInputElement>,
    ) => {
      const archivo =
        evento.target.files?.[0];

      evento.target.value =
        '';

      if (
        !archivo ||
        !accessToken
      ) {
        return;
      }

      const tiposPermitidos = [
        'image/jpeg',
        'image/png',
        'image/webp',
      ];

      if (
        !tiposPermitidos.includes(
          archivo.type,
        )
      ) {
        mostrarToast(
          'error',
          'Formato no permitido',
          'Selecciona una imagen JPG, PNG o WEBP.',
        );

        return;
      }

      if (
        archivo.size >
        3 *
        1024 *
        1024
      ) {
        mostrarToast(
          'error',
          'Imagen demasiado grande',
          'La fotografía no puede superar los 3 MB.',
        );

        return;
      }

      const formulario =
        new FormData();

      formulario.append(
        'foto',
        archivo,
      );

      try {
        setSubiendoFoto(
          true,
        );

        const respuesta =
          await fetch(
            `${API_URL}/perfil/foto`,
            {
              method:
                'POST',

              headers:
                crearHeadersAutorizados(
                  accessToken,
                ),

              body:
                formulario,
            },
          );

        const datos =
          await leerRespuestaJson(
            respuesta,
          );

        if (!respuesta.ok) {
          throw new Error(
            obtenerMensajeError(
              datos,
              'No fue posible subir la fotografía.',
            ),
          );
        }

        const resultado =
          datos as {
            mensaje?: string;
            perfil?: Perfil;
          };

        if (
          resultado.perfil
        ) {
          setPerfil(
            resultado.perfil,
          );
        }

        notificarPerfilActualizado();

        mostrarToast(
          'exito',
          'Fotografía actualizada',
          resultado.mensaje ||
            'La fotografía se guardó correctamente.',
        );
      } catch (
        errorActual
      ) {
        console.error(
          errorActual,
        );

        mostrarToast(
          'error',
          'No se pudo subir',
          errorActual instanceof Error
            ? errorActual.message
            : 'No fue posible subir la fotografía.',
        );
      } finally {
        setSubiendoFoto(
          false,
        );
      }
    };

  const eliminarFoto =
    async () => {
      if (!accessToken) {
        return;
      }

      try {
        setEliminandoFoto(
          true,
        );

        const respuesta =
          await fetch(
            `${API_URL}/perfil/foto`,
            {
              method:
                'DELETE',

              headers:
                crearHeadersAutorizados(
                  accessToken,
                ),
            },
          );

        const datos =
          await leerRespuestaJson(
            respuesta,
          );

        if (!respuesta.ok) {
          throw new Error(
            obtenerMensajeError(
              datos,
              'No fue posible eliminar la fotografía.',
            ),
          );
        }

        const resultado =
          datos as {
            mensaje?: string;
            perfil?: Perfil;
          };

        if (
          resultado.perfil
        ) {
          setPerfil(
            resultado.perfil,
          );
        } else {
          setPerfil(
            (
              anterior,
            ) =>
              anterior
                ? {
                    ...anterior,
                    fotoPerfilUrl:
                      null,
                  }
                : anterior,
          );
        }

        notificarPerfilActualizado();

        setModalEliminarFotoAbierto(
          false,
        );

        mostrarToast(
          'exito',
          'Fotografía eliminada',
          resultado.mensaje ||
            'La fotografía se eliminó correctamente.',
        );
      } catch (
        errorActual
      ) {
        console.error(
          errorActual,
        );

        mostrarToast(
          'error',
          'No se pudo eliminar',
          errorActual instanceof Error
            ? errorActual.message
            : 'No fue posible eliminar la fotografía.',
        );
      } finally {
        setEliminandoFoto(
          false,
        );
      }
    };

  if (
    cargando
  ) {
    return (
      <main className="perfil-page">
        <PerfilSkeleton />

        <style>
          {styles}
        </style>
      </main>
    );
  }

  if (
    error ||
    !perfil
  ) {
    return (
      <main className="perfil-page">
        <section className="perfil-error">
          <CircleAlert size={34} />

          <h2>
            No pudimos cargar tu perfil
          </h2>

          <p>
            {error ||
              'La información del perfil no está disponible.'}
          </p>

          <button
            type="button"
            onClick={() =>
              void cargarPerfil()
            }
          >
            <RefreshCw size={17} />

            Reintentar
          </button>
        </section>

        <style>
          {styles}
        </style>
      </main>
    );
  }

  return (
    <main className="perfil-page">
      {toast.visible && (
        <Toast
          tipo={toast.tipo}
          titulo={toast.titulo}
          mensaje={toast.mensaje}
          onCerrar={cerrarToast}
        />
      )}

      <section className="perfil-hero">
        <div className="perfil-hero__content">
          <div className="perfil-hero__icon">
            <UserRound size={27} />
          </div>

          <div>
            <span className="perfil-eyebrow">
              Cuenta institucional
            </span>

            <h1>
              Mi perfil
            </h1>

            <p>
              Administra tus datos personales, fotografía y seguridad de acceso.
            </p>
          </div>
        </div>

        <div className="perfil-hero__badges">
          <span className="hero-badge role">
            <ShieldCheck size={14} />

            {obtenerEtiquetaRol(
              perfil.rol,
            )}
          </span>

          <span
            className={`hero-badge ${
              perfil.estaActivo
                ? 'active'
                : 'inactive'
            }`}
          >
            {perfil.estaActivo
              ? (
                  <CheckCircle2 size={14} />
                )
              : (
                  <CircleX size={14} />
                )}

            {perfil.estaActivo
              ? 'Cuenta activa'
              : 'Cuenta desactivada'}
          </span>
        </div>
      </section>

      <section className="perfil-main-grid">
        <aside className="profile-summary-card">
          <div className="avatar-wrap">
            <div className="avatar-profile">
              {fotoPerfil ? (
                <img
                  src={fotoPerfil}
                  alt={`Fotografía de ${obtenerNombreCompleto(perfil)}`}
                />
              ) : (
                <span>
                  {obtenerIniciales(
                    perfil,
                  )}
                </span>
              )}

              {subiendoFoto && (
                <div className="avatar-loading">
                  <RefreshCw
                    size={24}
                    className="spinning"
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              className="avatar-camera"
              onClick={seleccionarFoto}
              disabled={
                subiendoFoto
              }
              aria-label="Cambiar fotografía"
            >
              <Camera size={18} />
            </button>
          </div>

          <input
            ref={inputFotoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={
              subirFoto
            }
          />

          <h2>
            {obtenerNombreCompleto(
              perfil,
            )}
          </h2>

          <span className="summary-role">
            {obtenerEtiquetaRol(
              perfil.rol,
            )}
          </span>

          <div className="summary-email">
            <Mail size={15} />

            <span>
              {perfil.correo}
            </span>
          </div>

          <div className="photo-actions">
            <button
              type="button"
              className="btn-photo primary"
              onClick={seleccionarFoto}
              disabled={
                subiendoFoto
              }
            >
              <Camera size={16} />

              {subiendoFoto
                ? 'Subiendo...'
                : fotoPerfil
                  ? 'Cambiar foto'
                  : 'Agregar foto'}
            </button>

            {fotoPerfil && (
              <button
                type="button"
                className="btn-photo danger"
                onClick={() =>
                  setModalEliminarFotoAbierto(
                    true,
                  )
                }
                disabled={
                  eliminandoFoto
                }
              >
                <Trash2 size={16} />

                Eliminar
              </button>
            )}
          </div>

          <p className="photo-help">
            Formatos permitidos: JPG, PNG y WEBP. Tamaño máximo: 3 MB.
          </p>

          <div className="summary-divider" />

          <div className="summary-status-list">
            <ResumenEstado
              icono={
                <BadgeCheck size={17} />
              }
              titulo="Activación"
              valor={
                perfil.cuentaActivada
                  ? 'Cuenta activada'
                  : 'Activación pendiente'
              }
              clase={
                perfil.cuentaActivada
                  ? 'success'
                  : 'warning'
              }
            />

            <ResumenEstado
              icono={
                <Clock3 size={17} />
              }
              titulo="Miembro desde"
              valor={
                formatearFecha(
                  perfil.creadoEn,
                )
              }
              clase="neutral"
            />
          </div>
        </aside>

        <div className="profile-content">
          <section className="profile-card">
            <div className="profile-card__header">
              <div>
                <span className="perfil-eyebrow">
                  Información personal
                </span>

                <h2>
                  Datos de la cuenta
                </h2>

                <p>
                  Mantén actualizados tus nombres y apellidos.
                </p>
              </div>

              {!editando ? (
                <button
                  type="button"
                  className="btn-card-action"
                  onClick={() =>
                    setEditando(
                      true,
                    )
                  }
                >
                  <Pencil size={16} />

                  Editar datos
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-card-action cancel"
                  onClick={
                    cancelarEdicion
                  }
                >
                  <X size={16} />

                  Cancelar
                </button>
              )}
            </div>

            <form
              className="profile-form"
              onSubmit={
                guardarPerfil
              }
            >
              <CampoPerfil
                label="Nombres"
                value={
                  formularioPerfil
                    .nombres
                }
                onChange={
                  actualizarCampoPerfil(
                    'nombres',
                  )
                }
                disabled={
                  !editando ||
                  guardandoPerfil
                }
              />

              <CampoPerfil
                label="Apellido paterno"
                value={
                  formularioPerfil
                    .apellidoPaterno
                }
                onChange={
                  actualizarCampoPerfil(
                    'apellidoPaterno',
                  )
                }
                disabled={
                  !editando ||
                  guardandoPerfil
                }
              />

              <CampoPerfil
                label="Apellido materno"
                value={
                  formularioPerfil
                    .apellidoMaterno
                }
                onChange={
                  actualizarCampoPerfil(
                    'apellidoMaterno',
                  )
                }
                disabled={
                  !editando ||
                  guardandoPerfil
                }
                optional
              />

              <CampoSoloLectura
                label="Correo institucional"
                valor={
                  perfil.correo
                }
                icono={
                  <Mail size={17} />
                }
              />

              {editando && (
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={
                      cancelarEdicion
                    }
                    disabled={
                      guardandoPerfil
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={
                      guardandoPerfil
                    }
                  >
                    {guardandoPerfil ? (
                      <RefreshCw
                        size={17}
                        className="spinning"
                      />
                    ) : (
                      <Save size={17} />
                    )}

                    {guardandoPerfil
                      ? 'Guardando...'
                      : 'Guardar cambios'}
                  </button>
                </div>
              )}
            </form>
          </section>

          <section className="profile-card security-card">
            <div className="profile-card__header">
              <div>
                <span className="perfil-eyebrow">
                  Seguridad
                </span>

                <h2>
                  Contraseña y acceso
                </h2>

                <p>
                  Protege tu cuenta con una contraseña segura.
                </p>
              </div>

              <div className="card-icon security">
                <LockKeyhole size={21} />
              </div>
            </div>

            <div className="security-content">
              <div className="security-info">
                <div className="security-info__icon">
                  <KeyRound size={21} />
                </div>

                <div>
                  <strong>
                    Contraseña de acceso
                  </strong>

                  <span>
                    Último cambio:{' '}
                    {formatearFecha(
                      perfil.passwordCambiadaEn,
                    )}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn-password"
                onClick={() =>
                  setModalPasswordAbierto(
                    true,
                  )
                }
              >
                Cambiar contraseña
              </button>
            </div>
          </section>

          <section className="profile-card">
            <div className="profile-card__header">
              <div>
                <span className="perfil-eyebrow">
                  Información institucional
                </span>

                <h2>
                  Estado del perfil
                </h2>

                <p>
                  Datos administrados por IusAcademy.
                </p>
              </div>

              <div className="card-icon system">
                <ShieldCheck size={21} />
              </div>
            </div>

            <div className="system-grid">
              <DatoSistema
                titulo="Rol"
                valor={
                  obtenerEtiquetaRol(
                    perfil.rol,
                  )
                }
              />

              <DatoSistema
                titulo="Estado de cuenta"
                valor={
                  perfil.estaActivo
                    ? 'Activa'
                    : 'Desactivada'
                }
                clase={
                  perfil.estaActivo
                    ? 'success'
                    : 'danger'
                }
              />

              <DatoSistema
                titulo="Activación"
                valor={
                  perfil.cuentaActivada
                    ? 'Completada'
                    : 'Pendiente'
                }
                clase={
                  perfil.cuentaActivada
                    ? 'success'
                    : 'warning'
                }
              />

              <DatoSistema
                titulo="Última actualización"
                valor={
                  formatearFecha(
                    perfil.actualizadoEn,
                  )
                }
              />

              <DatoSistema
                titulo="Acceso enviado"
                valor={
                  formatearFecha(
                    perfil.accesoEnviadoEn,
                  )
                }
              />

              <DatoSistema
                titulo="Identificador"
                valor={
                  `USR-${String(
                    perfil.id,
                  ).padStart(
                    4,
                    '0',
                  )}`
                }
              />
            </div>
          </section>

          <SeccionPorRol
            rol={
              perfil.rol
            }
          />
        </div>
      </section>

      {modalPasswordAbierto && (
        <div className="modal-backdrop">
          <div className="password-modal">
            <div className="modal-header">
              <div>
                <span className="perfil-eyebrow">
                  Seguridad de la cuenta
                </span>

                <h3>
                  Cambiar contraseña
                </h3>

                <p>
                  Crea una contraseña diferente y difícil de adivinar.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setModalPasswordAbierto(
                    false,
                  );

                  setFormularioPassword(
                    formularioPasswordInicial,
                  );
                }}
                disabled={
                  guardandoPassword
                }
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <form
              className="password-form"
              onSubmit={
                cambiarPassword
              }
            >
              <CampoPassword
                label="Contraseña actual"
                value={
                  formularioPassword
                    .passwordActual
                }
                onChange={
                  actualizarCampoPassword(
                    'passwordActual',
                  )
                }
                visible={
                  mostrarPasswordActual
                }
                onToggle={() =>
                  setMostrarPasswordActual(
                    (
                      anterior,
                    ) =>
                      !anterior,
                  )
                }
                disabled={
                  guardandoPassword
                }
              />

              <CampoPassword
                label="Nueva contraseña"
                value={
                  formularioPassword
                    .nuevaPassword
                }
                onChange={
                  actualizarCampoPassword(
                    'nuevaPassword',
                  )
                }
                visible={
                  mostrarNuevaPassword
                }
                onToggle={() =>
                  setMostrarNuevaPassword(
                    (
                      anterior,
                    ) =>
                      !anterior,
                  )
                }
                disabled={
                  guardandoPassword
                }
              />

              <div className="password-strength">
                <div className="strength-bars">
                  {[1, 2, 3, 4, 5].map(
                    (
                      nivel,
                    ) => (
                      <span
                        key={nivel}
                        className={
                          fortalezaPassword >=
                          nivel
                            ? 'active'
                            : ''
                        }
                      />
                    ),
                  )}
                </div>

                <small>
                  {fortalezaPassword <= 1
                    ? 'Muy débil'
                    : fortalezaPassword === 2
                      ? 'Débil'
                      : fortalezaPassword === 3
                        ? 'Aceptable'
                        : fortalezaPassword === 4
                          ? 'Fuerte'
                          : 'Muy fuerte'}
                </small>
              </div>

              <div className="password-rules">
                <ReglaPassword
                  cumplida={
                    formularioPassword
                      .nuevaPassword
                      .length >=
                    8
                  }
                  texto="Al menos 8 caracteres"
                />

                <ReglaPassword
                  cumplida={
                    /[A-Z]/.test(
                      formularioPassword
                        .nuevaPassword,
                    )
                  }
                  texto="Una letra mayúscula"
                />

                <ReglaPassword
                  cumplida={
                    /[a-z]/.test(
                      formularioPassword
                        .nuevaPassword,
                    )
                  }
                  texto="Una letra minúscula"
                />

                <ReglaPassword
                  cumplida={
                    /\d/.test(
                      formularioPassword
                        .nuevaPassword,
                    )
                  }
                  texto="Un número"
                />

                <ReglaPassword
                  cumplida={
                    /[^A-Za-z0-9]/.test(
                      formularioPassword
                        .nuevaPassword,
                    )
                  }
                  texto="Un carácter especial"
                />
              </div>

              <CampoPassword
                label="Confirmar nueva contraseña"
                value={
                  formularioPassword
                    .confirmarPassword
                }
                onChange={
                  actualizarCampoPassword(
                    'confirmarPassword',
                  )
                }
                visible={
                  mostrarConfirmacion
                }
                onToggle={() =>
                  setMostrarConfirmacion(
                    (
                      anterior,
                    ) =>
                      !anterior,
                  )
                }
                disabled={
                  guardandoPassword
                }
                estado={
                  formularioPassword
                    .confirmarPassword
                    .length ===
                  0
                    ? undefined
                    : passwordCoincide
                      ? 'success'
                      : 'error'
                }
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setModalPasswordAbierto(
                      false,
                    );

                    setFormularioPassword(
                      formularioPasswordInicial,
                    );
                  }}
                  disabled={
                    guardandoPassword
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={
                    guardandoPassword
                  }
                >
                  {guardandoPassword ? (
                    <RefreshCw
                      size={17}
                      className="spinning"
                    />
                  ) : (
                    <KeyRound size={17} />
                  )}

                  {guardandoPassword
                    ? 'Actualizando...'
                    : 'Actualizar contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalEliminarFotoAbierto && (
        <div className="modal-backdrop">
          <div className="confirm-modal">
            <div className="confirm-icon">
              <Trash2 size={24} />
            </div>

            <h3>
              ¿Eliminar fotografía?
            </h3>

            <p>
              El perfil volverá a mostrar tus iniciales. Podrás agregar otra fotografía cuando quieras.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setModalEliminarFotoAbierto(
                    false,
                  )
                }
                disabled={
                  eliminandoFoto
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn-danger"
                onClick={() =>
                  void eliminarFoto()
                }
                disabled={
                  eliminandoFoto
                }
              >
                {eliminandoFoto ? (
                  <RefreshCw
                    size={17}
                    className="spinning"
                  />
                ) : (
                  <Trash2 size={17} />
                )}

                {eliminandoFoto
                  ? 'Eliminando...'
                  : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {styles}
      </style>
    </main>
  );
}

function CampoPerfil({
  label,
  value,
  onChange,
  disabled,
  optional = false,
}: {
  label: string;
  value: string;
  onChange:
    (
      evento:
        ChangeEvent<HTMLInputElement>,
    ) => void;
  disabled: boolean;
  optional?: boolean;
}) {
  return (
    <label className="profile-field">
      <span>
        {label}

        {optional && (
          <small>
            Opcional
          </small>
        )}
      </span>

      <input
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        maxLength={80}
      />
    </label>
  );
}

function CampoSoloLectura({
  label,
  valor,
  icono,
}: {
  label: string;
  valor: string;
  icono: ReactNode;
}) {
  return (
    <div className="profile-field readonly">
      <span>
        {label}
      </span>

      <div>
        {icono}

        <strong>
          {valor}
        </strong>
      </div>
    </div>
  );
}

function ResumenEstado({
  icono,
  titulo,
  valor,
  clase,
}: {
  icono: ReactNode;
  titulo: string;
  valor: string;
  clase: string;
}) {
  return (
    <div className={`summary-status ${clase}`}>
      <div>
        {icono}
      </div>

      <span>
        {titulo}

        <strong>
          {valor}
        </strong>
      </span>
    </div>
  );
}

function DatoSistema({
  titulo,
  valor,
  clase = 'neutral',
}: {
  titulo: string;
  valor: string;
  clase?: string;
}) {
  return (
    <div className={`system-item ${clase}`}>
      <span>
        {titulo}
      </span>

      <strong>
        {valor}
      </strong>
    </div>
  );
}

function CampoPassword({
  label,
  value,
  onChange,
  visible,
  onToggle,
  disabled,
  estado,
}: {
  label: string;
  value: string;
  onChange:
    (
      evento:
        ChangeEvent<HTMLInputElement>,
    ) => void;
  visible: boolean;
  onToggle: () => void;
  disabled: boolean;
  estado?:
    | 'success'
    | 'error';
}) {
  return (
    <label className={`password-field ${estado ?? ''}`}>
      <span>
        {label}
      </span>

      <div>
        <input
          type={
            visible
              ? 'text'
              : 'password'
          }
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete="new-password"
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={
            visible
              ? 'Ocultar contraseña'
              : 'Mostrar contraseña'
          }
        >
          {visible ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      </div>
    </label>
  );
}

function ReglaPassword({
  cumplida,
  texto,
}: {
  cumplida: boolean;
  texto: string;
}) {
  return (
    <div
      className={`password-rule ${
        cumplida
          ? 'done'
          : ''
      }`}
    >
      <span>
        {cumplida ? (
          <Check size={13} />
        ) : null}
      </span>

      {texto}
    </div>
  );
}

function SeccionPorRol({
  rol,
}: {
  rol: Rol;
}) {
  const contenido:
    Record<
      Rol,
      {
        etiqueta: string;
        titulo: string;
        descripcion: string;
        tarjetas: Array<{
          titulo: string;
          descripcion: string;
          icono: ReactNode;
          clase: string;
        }>;
      }
    > = {
      ADMINISTRADOR: {
        etiqueta:
          'Administración',
        titulo:
          'Responsabilidades del perfil',
        descripcion:
          'Tu cuenta administra los principales recursos académicos del sistema.',
        tarjetas: [
          {
            titulo:
              'Usuarios',
            descripcion:
              'Gestión de cuentas institucionales',
            icono:
              <UsersRound size={19} />,
            clase:
              'orange',
          },
          {
            titulo:
              'Materias',
            descripcion:
              'Administración de asignaturas',
            icono:
              <BookOpen size={19} />,
            clase:
              'blue',
          },
          {
            titulo:
              'Cursos',
            descripcion:
              'Organización de la gestión académica',
            icono:
              <GraduationCap size={19} />,
            clase:
              'green',
          },
          {
            titulo:
              'Reportes',
            descripcion:
              'Exportación de información institucional',
            icono:
              <FileText size={19} />,
            clase:
              'purple',
          },
        ],
      },

      DOCENTE: {
        etiqueta:
          'Docencia',
        titulo:
          'Espacio académico',
        descripcion:
          'Aquí aparecerán tus cursos, estudiantes y actividades cuando habilitemos el aula.',
        tarjetas: [
          {
            titulo:
              'Mis cursos',
            descripcion:
              'Cursos asignados por administración',
            icono:
              <GraduationCap size={19} />,
            clase:
              'orange',
          },
          {
            titulo:
              'Estudiantes',
            descripcion:
              'Participantes inscritos en tus aulas',
            icono:
              <UsersRound size={19} />,
            clase:
              'green',
          },
          {
            titulo:
              'Actividades',
            descripcion:
              'Materiales y ejercicios académicos',
            icono:
              <BookOpen size={19} />,
            clase:
              'blue',
          },
          {
            titulo:
              'Evaluación',
            descripcion:
              'Seguimiento y retroalimentación',
            icono:
              <FileText size={19} />,
            clase:
              'purple',
          },
        ],
      },

      ESTUDIANTE: {
        etiqueta:
          'Formación',
        titulo:
          'Progreso académico',
        descripcion:
          'Aquí aparecerán tus cursos inscritos, actividades y avances académicos.',
        tarjetas: [
          {
            titulo:
              'Mis aulas',
            descripcion:
              'Cursos a los que te inscribiste',
            icono:
              <GraduationCap size={19} />,
            clase:
              'orange',
          },
          {
            titulo:
              'Actividades',
            descripcion:
              'Ejercicios y trabajos asignados',
            icono:
              <BookOpen size={19} />,
            clase:
              'blue',
          },
          {
            titulo:
              'Progreso',
            descripcion:
              'Seguimiento de tu aprendizaje',
            icono:
              <BriefcaseBusiness size={19} />,
            clase:
              'green',
          },
          {
            titulo:
              'Documentos',
            descripcion:
              'Recursos jurídicos disponibles',
            icono:
              <FileText size={19} />,
            clase:
              'purple',
          },
        ],
      },
    };

  const seleccion =
    contenido[rol];

  return (
    <section className="profile-card">
      <div className="profile-card__header">
        <div>
          <span className="perfil-eyebrow">
            {seleccion.etiqueta}
          </span>

          <h2>
            {seleccion.titulo}
          </h2>

          <p>
            {seleccion.descripcion}
          </p>
        </div>

        <div className="card-icon role">
          <Sparkles size={21} />
        </div>
      </div>

      <div className="role-cards-grid">
        {seleccion.tarjetas.map(
          (
            tarjeta,
          ) => (
            <div
              key={
                tarjeta.titulo
              }
              className="role-feature"
            >
              <div
                className={`role-feature__icon ${tarjeta.clase}`}
              >
                {tarjeta.icono}
              </div>

              <div>
                <strong>
                  {tarjeta.titulo}
                </strong>

                <span>
                  {tarjeta.descripcion}
                </span>
              </div>
            </div>
          ),
        )}
      </div>
    </section>
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
    [
      onCerrar,
    ],
  );

  return (
    <div className={`toast ${tipo}`}>
      <div className="toast-icon">
        {tipo ===
        'exito' ? (
          <CheckCircle2 size={22} />
        ) : (
          <CircleX size={22} />
        )}
      </div>

      <div>
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
        aria-label="Cerrar mensaje"
      >
        <X size={16} />
      </button>

      <div className="toast-progress" />
    </div>
  );
}

function PerfilSkeleton() {
  return (
    <>
      <div className="skeleton hero" />

      <div className="skeleton-grid">
        <div className="skeleton summary" />

        <div className="skeleton-content">
          <div className="skeleton card" />
          <div className="skeleton card small" />
          <div className="skeleton card" />
        </div>
      </div>
    </>
  );
}

const styles = `
  .perfil-page {
    width: 100%;
    min-width: 0;
    padding:
      0
      34px
      34px;
    color: var(--app-text);
  }

  .perfil-hero {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 28px 30px;
    overflow: hidden;
    border:
      1px solid
      rgba(241,139,75,.2);
    border-radius: 28px;
    background: #fffdf9;
    box-shadow:
      0 20px 46px
      rgba(148,81,22,.08);
  }

  .perfil-hero::before {
    content: "";
    position: absolute;
    inset:
      0
      auto
      0
      0;
    width: 5px;
    background: #f18b4b;
  }

  .perfil-hero::after {
    content: "";
    position: absolute;
    width: 270px;
    height: 270px;
    top: -170px;
    right: -80px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        rgba(241,139,75,.15),
        transparent 68%
      );
  }

  .perfil-hero__content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 18px;
    min-width: 0;
  }

  .perfil-hero__icon {
    width: 62px;
    height: 62px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border:
      1px solid
      rgba(241,139,75,.27);
    border-radius: 20px;
    color: #c46a2c;
    background: #fff0df;
    box-shadow:
      0 13px 28px
      rgba(196,106,44,.13);
  }

  .perfil-eyebrow {
    display: block;
    color: #c46a2c;
    font-size: 10px;
    font-weight: 850;
    letter-spacing: .15em;
    text-transform: uppercase;
  }

  .perfil-hero h1 {
    margin:
      6px
      0
      0;
    color: #0f172a;
    font-size:
      clamp(
        29px,
        3vw,
        39px
      );
    font-weight: 900;
    letter-spacing: -.035em;
  }

  .perfil-hero p {
    margin:
      7px
      0
      0;
    color: #6b7280;
    font-size: 13px;
  }

  .perfil-hero__badges {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
  }

  .hero-badge {
    min-height: 35px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding:
      8px
      12px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 850;
  }

  .hero-badge.role {
    color: #7c3aed;
    background: #f5f3ff;
  }

  .hero-badge.active {
    color: #15803d;
    background: #ecfdf3;
  }

  .hero-badge.inactive {
    color: #dc2626;
    background: #fef2f2;
  }

  .perfil-main-grid {
    display: grid;
    grid-template-columns:
      minmax(
        250px,
        310px
      )
      minmax(
        0,
        1fr
      );
    align-items: start;
    gap: 20px;
    margin-top: 22px;
  }

  .profile-summary-card,
  .profile-card {
    min-width: 0;
    border:
      1px solid
      rgba(241,139,75,.17);
    border-radius: 24px;
    background: #fffdf9;
    box-shadow:
      0 15px 38px
      rgba(148,81,22,.07);
  }

  .profile-summary-card {
    position: sticky;
    top: 22px;
    padding: 27px 22px;
    text-align: center;
  }

  .avatar-wrap {
    position: relative;
    width:
      fit-content;
    margin:
      0
      auto;
  }

  .avatar-profile {
    position: relative;
    width: 126px;
    height: 126px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border:
      5px solid
      #fff;
    border-radius: 38px;
    color: #c46a2c;
    background:
      linear-gradient(
        145deg,
        #fff0df,
        #ffd9b8
      );
    box-shadow:
      0 18px 38px
      rgba(196,106,44,.2);
  }

  .avatar-profile img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-profile > span {
    font-size: 38px;
    font-weight: 900;
    letter-spacing: -.04em;
  }

  .avatar-loading {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: #fff;
    background:
      rgba(15,23,42,.55);
    backdrop-filter:
      blur(3px);
  }

  .avatar-camera {
    position: absolute;
    right: -7px;
    bottom: -5px;
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border:
      4px solid
      #fffdf9;
    border-radius: 14px;
    color: #fff;
    background: #f18b4b;
    cursor: pointer;
    box-shadow:
      0 9px 22px
      rgba(196,106,44,.26);
  }

  .avatar-camera:disabled {
    opacity: .65;
    cursor: not-allowed;
  }

  .profile-summary-card h2 {
    margin:
      22px
      0
      0;
    color: #0f172a;
    font-size: 21px;
    line-height: 1.25;
  }

  .summary-role {
    display: inline-flex;
    margin-top: 7px;
    padding:
      5px
      9px;
    border-radius: 999px;
    color: #c46a2c;
    background: #fff0df;
    font-size: 9px;
    font-weight: 850;
    text-transform: uppercase;
  }

  .summary-email {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    margin-top: 14px;
    color: #64748b;
    font-size: 10px;
  }

  .summary-email span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .photo-actions {
    display: grid;
    grid-template-columns:
      1fr;
    gap: 8px;
    margin-top: 20px;
  }

  .btn-photo {
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 13px;
    font-family: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .btn-photo.primary {
    border: none;
    color: #fff;
    background: #f18b4b;
  }

  .btn-photo.danger {
    border:
      1px solid
      #fecaca;
    color: #dc2626;
    background: #fff;
  }

  .btn-photo:disabled {
    opacity: .6;
    cursor: not-allowed;
  }

  .photo-help {
    margin:
      11px
      0
      0;
    color: #94a3b8;
    font-size: 9px;
    line-height: 1.5;
  }

  .summary-divider {
    height: 1px;
    margin:
      22px
      0;
    background:
      rgba(241,139,75,.13);
  }

  .summary-status-list {
    display: grid;
    gap: 10px;
    text-align: left;
  }

  .summary-status {
    display: grid;
    grid-template-columns:
      38px
      1fr;
    align-items: center;
    gap: 10px;
    padding: 11px;
    border-radius: 14px;
  }

  .summary-status > div {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 12px;
  }

  .summary-status span,
  .summary-status strong {
    display: block;
  }

  .summary-status span {
    color: #64748b;
    font-size: 9px;
  }

  .summary-status strong {
    margin-top: 3px;
    color: #0f172a;
    font-size: 10px;
  }

  .summary-status.success {
    background: #f0fdf4;
  }

  .summary-status.success > div {
    color: #15803d;
    background: #dcfce7;
  }

  .summary-status.warning {
    background: #fff7df;
  }

  .summary-status.warning > div {
    color: #b45309;
    background: #fef3c7;
  }

  .summary-status.neutral {
    background: #f8fafc;
  }

  .summary-status.neutral > div {
    color: #64748b;
    background: #f1f5f9;
  }

  .profile-content {
    min-width: 0;
    display: grid;
    gap: 18px;
  }

  .profile-card {
    padding: 23px;
  }

  .profile-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .profile-card__header h2 {
    margin:
      5px
      0
      0;
    color: #0f172a;
    font-size: 19px;
    font-weight: 900;
  }

  .profile-card__header p {
    margin:
      5px
      0
      0;
    color: #6b7280;
    font-size: 10px;
  }

  .btn-card-action {
    min-height: 39px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    flex-shrink: 0;
    padding:
      9px
      14px;
    border: none;
    border-radius: 999px;
    color: #c46a2c;
    background: #fff0df;
    font-family: inherit;
    font-size: 10px;
    font-weight: 850;
    cursor: pointer;
  }

  .btn-card-action.cancel {
    color: #64748b;
    background: #f1f5f9;
  }

  .profile-form {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 15px;
    margin-top: 22px;
  }

  .profile-field {
    min-width: 0;
    display: grid;
    gap: 7px;
  }

  .profile-field > span {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    color: #475569;
    font-size: 10px;
    font-weight: 800;
  }

  .profile-field > span small {
    color: #94a3b8;
    font-size: 8px;
    font-weight: 700;
  }

  .profile-field input {
    width: 100%;
    min-height: 46px;
    padding:
      0
      14px;
    border:
      1px solid
      #edd8c3;
    border-radius: 14px;
    outline: none;
    color: #0f172a;
    background: #fffefa;
    font-family: inherit;
    transition:
      border-color .18s ease,
      box-shadow .18s ease,
      background .18s ease;
  }

  .profile-field input:focus {
    border-color:
      rgba(241,139,75,.72);
    box-shadow:
      0 0 0 4px
      rgba(241,139,75,.11);
  }

  .profile-field input:disabled {
    color: #64748b;
    background: #f8fafc;
    cursor: not-allowed;
  }

  .profile-field.readonly > div {
    min-height: 46px;
    display: flex;
    align-items: center;
    gap: 9px;
    padding:
      0
      14px;
    overflow: hidden;
    border:
      1px solid
      #e2e8f0;
    border-radius: 14px;
    color: #94a3b8;
    background: #f8fafc;
  }

  .profile-field.readonly strong {
    overflow: hidden;
    color: #64748b;
    font-size: 11px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .form-actions {
    grid-column:
      1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 3px;
  }

  .btn-primary,
  .btn-secondary,
  .btn-danger {
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding:
      10px
      17px;
    border-radius: 13px;
    font-family: inherit;
    font-weight: 850;
    cursor: pointer;
  }

  .btn-primary {
    border: none;
    color: #fff;
    background: #f18b4b;
    box-shadow:
      0 10px 24px
      rgba(196,106,44,.2);
  }

  .btn-secondary {
    border:
      1px solid
      #e2e8f0;
    color: #475569;
    background: #fff;
  }

  .btn-danger {
    border: none;
    color: #fff;
    background: #dc2626;
  }

  .btn-primary:disabled,
  .btn-secondary:disabled,
  .btn-danger:disabled {
    opacity: .6;
    cursor: not-allowed;
  }

  .card-icon {
    width: 43px;
    height: 43px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 14px;
  }

  .card-icon.security {
    color: #15803d;
    background: #ecfdf3;
  }

  .card-icon.system {
    color: #2563eb;
    background: #eff6ff;
  }

  .card-icon.role {
    color: #7c3aed;
    background: #f5f3ff;
  }

  .security-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-top: 22px;
    padding: 16px;
    border:
      1px solid
      #e7f5ec;
    border-radius: 18px;
    background: #f8fffa;
  }

  .security-info {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .security-info__icon {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 14px;
    color: #15803d;
    background: #dcfce7;
  }

  .security-info strong,
  .security-info span {
    display: block;
  }

  .security-info strong {
    color: #0f172a;
    font-size: 12px;
  }

  .security-info span {
    margin-top: 4px;
    color: #64748b;
    font-size: 9px;
  }

  .btn-password {
    flex-shrink: 0;
    min-height: 39px;
    padding:
      9px
      14px;
    border:
      1px solid
      #bbf7d0;
    border-radius: 999px;
    color: #15803d;
    background: #fff;
    font-family: inherit;
    font-size: 10px;
    font-weight: 850;
    cursor: pointer;
  }

  .system-grid {
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
    margin-top: 22px;
  }

  .system-item {
    min-width: 0;
    padding: 14px;
    border:
      1px solid
      #edf1f5;
    border-radius: 16px;
    background: #fbfcfe;
  }

  .system-item span,
  .system-item strong {
    display: block;
  }

  .system-item span {
    color: #94a3b8;
    font-size: 9px;
    font-weight: 750;
  }

  .system-item strong {
    margin-top: 7px;
    overflow: hidden;
    color: #334155;
    font-size: 11px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .system-item.success strong {
    color: #15803d;
  }

  .system-item.warning strong {
    color: #b45309;
  }

  .system-item.danger strong {
    color: #dc2626;
  }

  .role-cards-grid {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 11px;
    margin-top: 22px;
  }

  .role-feature {
    display: grid;
    grid-template-columns:
      43px
      1fr;
    align-items: center;
    gap: 11px;
    padding: 13px;
    border:
      1px solid
      rgba(148,163,184,.16);
    border-radius: 16px;
    background: #fffefa;
  }

  .role-feature__icon {
    width: 43px;
    height: 43px;
    display: grid;
    place-items: center;
    border-radius: 13px;
  }

  .role-feature__icon.orange {
    color: #c46a2c;
    background: #fff0df;
  }

  .role-feature__icon.blue {
    color: #2563eb;
    background: #eff6ff;
  }

  .role-feature__icon.green {
    color: #15803d;
    background: #ecfdf3;
  }

  .role-feature__icon.purple {
    color: #7c3aed;
    background: #f5f3ff;
  }

  .role-feature strong,
  .role-feature span {
    display: block;
  }

  .role-feature strong {
    color: #0f172a;
    font-size: 11px;
  }

  .role-feature span {
    margin-top: 4px;
    color: #64748b;
    font-size: 9px;
    line-height: 1.45;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: grid;
    place-items: center;
    padding: 20px;
    background:
      rgba(15,23,42,.48);
    backdrop-filter:
      blur(5px);
  }

  .password-modal {
    width:
      min(
        590px,
        100%
      );
    max-height:
      calc(
        100vh -
        40px
      );
    overflow-y: auto;
    padding: 27px;
    border:
      1px solid
      rgba(241,139,75,.22);
    border-radius: 25px;
    background: #fffdf9;
    box-shadow:
      0 30px 80px
      rgba(15,23,42,.25);
    animation:
      modalIn .22s ease;
  }

  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .modal-header h3 {
    margin:
      6px
      0
      0;
    color: #0f172a;
    font-size: 21px;
  }

  .modal-header p {
    margin:
      6px
      0
      0;
    color: #64748b;
    font-size: 10px;
  }

  .modal-close {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border: none;
    border-radius: 12px;
    color: #c46a2c;
    background: #fff0df;
    cursor: pointer;
  }

  .password-form {
    display: grid;
    gap: 15px;
    margin-top: 22px;
  }

  .password-field {
    display: grid;
    gap: 7px;
  }

  .password-field > span {
    color: #475569;
    font-size: 10px;
    font-weight: 800;
  }

  .password-field > div {
    display: grid;
    grid-template-columns:
      1fr
      44px;
    border:
      1px solid
      #edd8c3;
    border-radius: 14px;
    background: #fffefa;
    transition:
      border-color .18s ease,
      box-shadow .18s ease;
  }

  .password-field > div:focus-within {
    border-color:
      rgba(241,139,75,.72);
    box-shadow:
      0 0 0 4px
      rgba(241,139,75,.11);
  }

  .password-field.success > div {
    border-color: #86efac;
  }

  .password-field.error > div {
    border-color: #fca5a5;
  }

  .password-field input {
    width: 100%;
    min-height: 46px;
    padding:
      0
      14px;
    border: none;
    outline: none;
    color: #0f172a;
    background: transparent;
    font-family: inherit;
  }

  .password-field button {
    border: none;
    color: #94a3b8;
    background: transparent;
    cursor: pointer;
  }

  .password-strength {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .strength-bars {
    flex: 1;
    display: grid;
    grid-template-columns:
      repeat(
        5,
        1fr
      );
    gap: 5px;
  }

  .strength-bars span {
    height: 5px;
    border-radius: 999px;
    background: #e2e8f0;
  }

  .strength-bars span.active {
    background: #f18b4b;
  }

  .password-strength small {
    min-width: 66px;
    color: #64748b;
    font-size: 9px;
    text-align: right;
  }

  .password-rules {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 8px;
    padding: 13px;
    border-radius: 15px;
    background: #f8fafc;
  }

  .password-rule {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #94a3b8;
    font-size: 9px;
  }

  .password-rule > span {
    width: 18px;
    height: 18px;
    display: grid;
    place-items: center;
    border:
      1px solid
      #cbd5e1;
    border-radius: 50%;
  }

  .password-rule.done {
    color: #15803d;
  }

  .password-rule.done > span {
    border-color: #86efac;
    color: #15803d;
    background: #dcfce7;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 5px;
  }

  .confirm-modal {
    width:
      min(
        430px,
        100%
      );
    padding: 28px;
    border:
      1px solid
      #fecaca;
    border-radius: 24px;
    text-align: center;
    background: #fffdf9;
    box-shadow:
      0 30px 80px
      rgba(15,23,42,.25);
    animation:
      modalIn .22s ease;
  }

  .confirm-icon {
    width: 58px;
    height: 58px;
    display: grid;
    place-items: center;
    margin:
      0
      auto;
    border-radius: 18px;
    color: #dc2626;
    background: #fef2f2;
  }

  .confirm-modal h3 {
    margin:
      17px
      0
      0;
    color: #0f172a;
    font-size: 19px;
  }

  .confirm-modal p {
    margin:
      8px
      0
      0;
    color: #64748b;
    font-size: 10px;
    line-height: 1.6;
  }

  .confirm-modal .modal-actions {
    justify-content: center;
    margin-top: 21px;
  }

  .perfil-error {
    min-height:
      calc(
        100vh -
        150px
      );
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 10px;
    text-align: center;
    color: #dc2626;
  }

  .perfil-error h2 {
    margin: 5px 0 0;
    color: #0f172a;
  }

  .perfil-error p {
    max-width: 480px;
    margin: 0;
    color: #64748b;
    font-size: 11px;
  }

  .perfil-error button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding:
      10px
      16px;
    border: none;
    border-radius: 999px;
    color: #fff;
    background: #f18b4b;
    font-weight: 800;
    cursor: pointer;
  }

  .toast {
    position: fixed;
    top: 25px;
    right: 28px;
    z-index: 11000;
    width:
      min(
        390px,
        calc(
          100vw -
          40px
        )
      );
    display: grid;
    grid-template-columns:
      42px
      1fr
      28px;
    gap: 11px;
    align-items: flex-start;
    padding:
      15px
      15px
      18px;
    overflow: hidden;
    border-radius: 18px;
    box-shadow:
      0 20px 48px
      rgba(15,23,42,.16);
    animation:
      toastIn .3s ease;
  }

  .toast.exito {
    border:
      1px solid
      #bbf7d0;
    color: #15803d;
    background: #f0fdf4;
  }

  .toast.error {
    border:
      1px solid
      #fecaca;
    color: #b91c1c;
    background: #fef2f2;
  }

  .toast-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 13px;
  }

  .toast.exito
  .toast-icon {
    background: #dcfce7;
  }

  .toast.error
  .toast-icon {
    background: #fee2e2;
  }

  .toast strong {
    display: block;
    font-size: 13px;
  }

  .toast p {
    margin:
      4px
      0
      0;
    color: #64748b;
    font-size: 10px;
  }

  .toast button {
    border: none;
    color: #94a3b8;
    background: transparent;
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
    background: #22c55e;
  }

  .toast.error
  .toast-progress {
    background: #ef4444;
  }

  .skeleton {
    position: relative;
    overflow: hidden;
    border-radius: 24px;
    background: #f3eee7;
  }

  .skeleton::after {
    content: "";
    position: absolute;
    inset: 0;
    transform:
      translateX(
        -100%
      );
    background:
      linear-gradient(
        90deg,
        transparent,
        rgba(255,255,255,.72),
        transparent
      );
    animation:
      shimmer
      1.35s
      infinite;
  }

  .skeleton.hero {
    height: 152px;
  }

  .skeleton-grid {
    display: grid;
    grid-template-columns:
      310px
      1fr;
    gap: 20px;
    margin-top: 22px;
  }

  .skeleton.summary {
    height: 520px;
  }

  .skeleton-content {
    display: grid;
    gap: 18px;
  }

  .skeleton.card {
    height: 250px;
  }

  .skeleton.card.small {
    height: 150px;
  }

  .spinning {
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

  @keyframes modalIn {
    from {
      opacity: 0;
      transform:
        translateY(
          12px
        )
        scale(
          .98
        );
    }

    to {
      opacity: 1;
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
      opacity: 0;
      transform:
        translateX(
          28px
        );
    }

    to {
      opacity: 1;
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

  @keyframes shimmer {
    100% {
      transform:
        translateX(
          100%
        );
    }
  }

  @media (
    max-width:
      1100px
  ) {
    .perfil-main-grid {
      grid-template-columns:
        260px
        minmax(
          0,
          1fr
        );
    }

    .system-grid {
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
    .perfil-page {
      padding:
        18px;
    }

    .perfil-hero {
      align-items: flex-start;
      flex-direction: column;
      padding: 24px;
    }

    .perfil-hero__badges {
      justify-content: flex-start;
    }

    .perfil-main-grid,
    .skeleton-grid {
      grid-template-columns:
        1fr;
    }

    .profile-summary-card {
      position: static;
    }

    .profile-summary-card {
      display: grid;
      grid-template-columns:
        auto
        1fr;
      align-items: center;
      gap:
        0
        22px;
      text-align: left;
    }

    .avatar-wrap {
      grid-row:
        1 / 6;
      margin: 0;
    }

    .profile-summary-card h2 {
      margin: 0;
    }

    .summary-email {
      justify-content: flex-start;
    }

    .photo-actions,
    .photo-help,
    .summary-divider,
    .summary-status-list {
      grid-column:
        1 / -1;
    }

    .photo-actions {
      grid-template-columns:
        repeat(
          2,
          minmax(
            0,
            1fr
          )
        );
    }

    .skeleton.summary {
      height: 290px;
    }
  }

  @media (
    max-width:
      620px
  ) {
    .perfil-hero__content {
      align-items: flex-start;
    }

    .perfil-hero__icon {
      width: 52px;
      height: 52px;
      border-radius: 17px;
    }

    .profile-summary-card {
      display: block;
      text-align: center;
    }

    .avatar-wrap {
      margin:
        0
        auto;
    }

    .profile-summary-card h2 {
      margin-top: 20px;
    }

    .summary-email {
      justify-content: center;
    }

    .photo-actions {
      grid-template-columns:
        1fr;
    }

    .profile-card__header,
    .security-content,
    .modal-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .btn-card-action,
    .btn-password {
      width: 100%;
    }

    .profile-form,
    .system-grid,
    .role-cards-grid,
    .password-rules {
      grid-template-columns:
        1fr;
    }

    .form-actions,
    .modal-actions {
      flex-direction: column-reverse;
    }

    .btn-primary,
    .btn-secondary,
    .btn-danger {
      width: 100%;
    }

    .toast {
      top: 14px;
      right: 14px;
      width:
        calc(
          100vw -
          28px
        );
    }
  }

  /* Compatibilidad con los temas globales de IusAcademy. */
  .perfil-page { color: var(--app-text); }
  .perfil-hero,
  .profile-summary-card,
  .profile-card,
  .password-modal,
  .confirm-modal {
    border-color: var(--app-border);
    background: var(--app-surface, var(--app-card));
    box-shadow: 0 15px 38px rgba(0, 0, 0, .16);
  }
  .perfil-hero {
    background: linear-gradient(135deg, var(--app-surface, var(--app-card)), color-mix(in srgb, var(--app-accent-soft) 14%, var(--app-surface, var(--app-card))));
  }
  .perfil-hero h1,
  .profile-summary-card h2,
  .profile-card__header h2,
  .security-info strong,
  .role-feature strong,
  .modal-header h3,
  .confirm-modal h3,
  .perfil-error h2,
  .summary-status strong,
  .toast strong { color: var(--app-text); }
  .perfil-hero p,
  .profile-card__header p,
  .summary-email,
  .photo-help,
  .security-info span,
  .role-feature span,
  .modal-header p,
  .confirm-modal p,
  .perfil-error p,
  .toast p { color: var(--app-text-soft); }
  .perfil-eyebrow,
  .summary-role,
  .btn-card-action,
  .modal-close { color: var(--app-accent-dark); }
  .perfil-hero__icon,
  .summary-role,
  .btn-card-action,
  .modal-close {
    border-color: color-mix(in srgb, var(--app-accent) 28%, var(--app-border));
    background: var(--app-accent-soft);
  }
  .profile-field > span,
  .password-field > span { color: var(--app-text-secondary); }
  .profile-field > span small { color: var(--app-text-muted); }
  .profile-field input,
  .password-field > div {
    border-color: var(--app-border);
    background: var(--app-card);
  }
  .profile-field input,
  .password-field input { color: var(--app-text); }
  .profile-field input:focus,
  .password-field > div:focus-within {
    border-color: var(--app-accent);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--app-accent) 12%, transparent);
  }
  .profile-field input:disabled,
  .profile-field.readonly > div {
    border-color: var(--app-border);
    color: var(--app-text-muted);
    background: color-mix(in srgb, var(--app-card) 82%, var(--app-bg));
  }
  .profile-field.readonly strong { color: var(--app-text-soft); }
  .summary-divider { background: var(--app-border); }
  .summary-status.neutral,
  .system-item,
  .role-feature,
  .password-rules {
    border-color: var(--app-border);
    background: color-mix(in srgb, var(--app-card) 92%, var(--app-bg));
  }
  .summary-status.neutral > div {
    color: var(--app-text-soft);
    background: color-mix(in srgb, var(--app-card) 82%, var(--app-bg));
  }
  .summary-status span,
  .system-item span,
  .password-strength small,
  .password-rule { color: var(--app-text-muted); }
  .system-item strong { color: var(--app-text-secondary); }
  .security-content {
    border-color: var(--app-border);
    background: color-mix(in srgb, color-mix(in srgb, var(--app-success, #22c55e) 14%, var(--app-card)) 50%, var(--app-surface, var(--app-card)));
  }
  .btn-photo.danger,
  .btn-secondary,
  .btn-password {
    border-color: var(--app-border);
    background: var(--app-surface, var(--app-card));
  }
  .btn-secondary { color: var(--app-text-secondary); }
  .btn-card-action.cancel {
    color: var(--app-text-soft);
    background: color-mix(in srgb, var(--app-card) 92%, var(--app-bg));
  }
  .avatar-profile {
    border-color: var(--app-surface, var(--app-card));
    background: linear-gradient(145deg, var(--app-accent-soft), color-mix(in srgb, var(--app-accent) 32%, var(--app-surface, var(--app-card))));
  }
  .avatar-camera { border-color: var(--app-surface, var(--app-card)); }
  .role-feature__icon.orange,
  .perfil-hero__icon,
  .summary-role,
  .btn-card-action,
  .modal-close {
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }
  .role-feature__icon.blue,
  .card-icon.system {
    color: #60a5fa;
    background: color-mix(in srgb, #2563eb 18%, var(--app-surface, var(--app-card)));
  }
  .role-feature__icon.green,
  .card-icon.security,
  .security-info__icon {
    color: var(--app-success, #22c55e);
    background: color-mix(in srgb, color-mix(in srgb, var(--app-success, #22c55e) 14%, var(--app-card)) 72%, var(--app-surface, var(--app-card)));
  }
  .role-feature__icon.purple,
  .card-icon.role,
  .hero-badge.role {
    color: #a78bfa;
    background: color-mix(in srgb, #7c3aed 18%, var(--app-surface, var(--app-card)));
  }
  .hero-badge.active,
  .summary-status.success,
  .toast.exito {
    color: var(--app-success, #22c55e);
    background: color-mix(in srgb, var(--app-success, #22c55e) 14%, var(--app-card));
  }
  .hero-badge.inactive,
  .toast.error,
  .confirm-icon {
    color: var(--app-danger, #ef4444);
    background: color-mix(in srgb, var(--app-danger, #ef4444) 14%, var(--app-card));
  }
  .summary-status.warning {
    color: #d97706;
    background: color-mix(in srgb, #f59e0b 14%, var(--app-surface, var(--app-card)));
  }
  .summary-status.success > div {
    color: var(--app-success, #22c55e);
    background: color-mix(in srgb, color-mix(in srgb, var(--app-success, #22c55e) 14%, var(--app-card)) 78%, var(--app-surface, var(--app-card)));
  }
  .summary-status.warning > div {
    color: #d97706;
    background: color-mix(in srgb, #f59e0b 18%, var(--app-surface, var(--app-card)));
  }
  .system-item.success strong { color: var(--app-success, #22c55e); }
  .system-item.warning strong { color: #f59e0b; }
  .system-item.danger strong { color: var(--app-danger, #ef4444); }
  .password-field.success > div { border-color: color-mix(in srgb, var(--app-success, #22c55e) 65%, var(--app-border)); }
  .password-field.error > div { border-color: color-mix(in srgb, var(--app-danger, #ef4444) 65%, var(--app-border)); }
  .strength-bars span { background: color-mix(in srgb, var(--app-card) 82%, var(--app-bg)); }
  .password-rule > span { border-color: var(--app-border); }
  .password-rule.done { color: var(--app-success, #22c55e); }
  .password-rule.done > span {
    border-color: color-mix(in srgb, var(--app-success, #22c55e) 45%, var(--app-border));
    color: var(--app-success, #22c55e);
    background: color-mix(in srgb, var(--app-success, #22c55e) 14%, var(--app-card));
  }
  .toast {
    border-color: var(--app-border);
    box-shadow: 0 20px 48px rgba(0,0,0,.22);
  }
  .toast.exito { border-color: color-mix(in srgb, var(--app-success, #22c55e) 35%, var(--app-border)); }
  .toast.error { border-color: color-mix(in srgb, var(--app-danger, #ef4444) 35%, var(--app-border)); }
  .toast.exito .toast-icon { background: color-mix(in srgb, color-mix(in srgb, var(--app-success, #22c55e) 14%, var(--app-card)) 80%, var(--app-surface, var(--app-card))); }
  .toast.error .toast-icon { background: color-mix(in srgb, color-mix(in srgb, var(--app-danger, #ef4444) 14%, var(--app-card)) 80%, var(--app-surface, var(--app-card))); }
  .toast button,
  .password-field button { color: var(--app-text-muted); }
  .perfil-error { color: var(--app-danger, #ef4444); }
  .skeleton { background: color-mix(in srgb, var(--app-card) 82%, var(--app-bg)); }
  .skeleton::after {
    background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--app-surface, var(--app-card)) 72%, transparent), transparent);
  }

`;

export default Perfil;