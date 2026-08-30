import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  Eye,
  Link2,
  MapPin,
  MessageCircle,
  Pin,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';

import AulaModal from '../aula/AulaModal';
import Toast from '../shared/Toast';

import {
  obtenerConfiguracionTipoPublicacion,
  tipoPublicacionUsaCampo,
} from '../../config/publicacionesCurso.config';

import type {
  CrearPublicacionDatos,
  PrioridadPublicacion,
  PublicacionCurso,
  TipoPublicacionCurso,
} from '../../types/aula/comunicacion-curso.types';

import SelectorTipoPublicacion from './SelectorTipoPublicacion';

export type FormularioPublicacionInteligenteValor = {
  tipo: TipoPublicacionCurso;
  prioridad: PrioridadPublicacion;

  titulo: string;
  contenido: string;

  referencia: string;
  lugar: string;
  enlace: string;

  fechaEventoInicio: string;
  fechaEventoFin: string;

  estaFijada: boolean;
  comentariosHabilitados: boolean;
  visibleParaEstudiantes: boolean;

  notificarAlPublicar: boolean;
  recordarUnDiaAntes: boolean;
  recordarUnaHoraAntes: boolean;
  agregarAlCalendario: boolean;
};

type FormularioPublicacionInteligenteProps = {
  abierto: boolean;
  hitoCodigo: string;
  hitoNombre: string;

  publicacionEditando?: PublicacionCurso | null;

  guardando: boolean;

  onCerrar: () => void;

  onGuardar: (
    datos:
      CrearPublicacionDatos,
  ) => Promise<void>;
};

function convertirFechaParaInput(
  fecha:
    string | null | undefined,
): string {
  if (!fecha) {
    return '';
  }

  const valor =
    new Date(
      fecha,
    );

  const diferenciaZona =
    valor.getTimezoneOffset() *
    60_000;

  return new Date(
    valor.getTime() -
      diferenciaZona,
  )
    .toISOString()
    .slice(
      0,
      16,
    );
}

function crearValorInicial(
  publicacion?:
    PublicacionCurso | null,
): FormularioPublicacionInteligenteValor {
  if (publicacion) {
    return {
      tipo:
        publicacion.tipo,

      prioridad:
        publicacion.prioridad,

      titulo:
        publicacion.titulo,

      contenido:
        publicacion.contenido,

      referencia:
        publicacion.referencia ??
        '',

      lugar:
        publicacion.lugar ??
        '',

      enlace:
        publicacion.enlace ??
        '',

      fechaEventoInicio:
        convertirFechaParaInput(
          publicacion.fechaEventoInicio,
        ),

      fechaEventoFin:
        convertirFechaParaInput(
          publicacion.fechaEventoFin,
        ),

      estaFijada:
        publicacion.estaFijada,

      comentariosHabilitados:
        publicacion.comentariosHabilitados,

      visibleParaEstudiantes:
        publicacion.visibleParaEstudiantes,

      notificarAlPublicar:
        publicacion.notificarAlPublicar,

      recordarUnDiaAntes:
        publicacion.recordarUnDiaAntes,

      recordarUnaHoraAntes:
        publicacion.recordarUnaHoraAntes,

      agregarAlCalendario:
        publicacion.agregarAlCalendario,
    };
  }

  return {
    tipo:
      'AVISO_GENERAL',

    prioridad:
      'INFORMATIVA',

    titulo:
      '',

    contenido:
      '',

    referencia:
      '',

    lugar:
      '',

    enlace:
      '',

    fechaEventoInicio:
      '',

    fechaEventoFin:
      '',

    estaFijada:
      false,

    comentariosHabilitados:
      false,

    visibleParaEstudiantes:
      true,

    notificarAlPublicar:
      true,

    recordarUnDiaAntes:
      false,

    recordarUnaHoraAntes:
      false,

    agregarAlCalendario:
      false,
  };
}

function convertirFechaParaApi(
  valor:
    string,
): string | undefined {
  if (!valor) {
    return undefined;
  }

  return new Date(
    valor,
  ).toISOString();
}

export default function FormularioPublicacionInteligente({
  abierto,
  hitoCodigo,
  hitoNombre,
  publicacionEditando =
    null,
  guardando,
  onCerrar,
  onGuardar,
}: FormularioPublicacionInteligenteProps) {
  const [
    formulario,
    setFormulario,
  ] =
    useState<FormularioPublicacionInteligenteValor>(
      () =>
        crearValorInicial(
          publicacionEditando,
        ),
    );

  const [
    selectorAbierto,
    setSelectorAbierto,
  ] =
    useState(
      false,
    );

  const [
    destinoRecurso,
    setDestinoRecurso,
  ] =
    useState<
      'EXTERNO' |
      'BIBLIOTECA'
    >(
      publicacionEditando?.enlace?.startsWith(
        '/',
      )
        ? 'BIBLIOTECA'
        : 'EXTERNO',
    );

  const [toast, setToast] = useState({
    visible: false,
    titulo: '',
    mensaje: '',
  });

  const cerrarToast = () =>
    setToast((actual) => ({
      ...actual,
      visible: false,
    }));

  const mostrarAdvertencia = (mensaje: string) =>
    setToast({
      visible: true,
      titulo: 'Completa el formulario',
      mensaje,
    });

  const configuracion =
    useMemo(
      () =>
        obtenerConfiguracionTipoPublicacion(
          formulario.tipo,
        ),
      [
        formulario.tipo,
      ],
    );

  const IconoTipo =
    configuracion.icono;

  const cambiarTipo =
    (
      tipo:
        TipoPublicacionCurso,
    ) => {
      const nuevaConfiguracion =
        obtenerConfiguracionTipoPublicacion(
          tipo,
        );

      setFormulario(
        (
          actual,
        ) => ({
          ...actual,

          tipo,

          prioridad:
            nuevaConfiguracion.prioridadSugerida,

          referencia:
            '',

          lugar:
            '',

          enlace:
            '',

          fechaEventoInicio:
            '',

          fechaEventoFin:
            '',

          recordarUnDiaAntes:
            false,

          recordarUnaHoraAntes:
            false,

          agregarAlCalendario:
            false,
        }),
      );
    };

  const guardar =
    async () => {
      if (formulario.titulo.trim().length < 3) {
        mostrarAdvertencia('Escribe un título de al menos 3 caracteres.');
        return;
      }

      if (formulario.contenido.trim().length < 3) {
        mostrarAdvertencia('Escribe el contenido de la publicación.');
        return;
      }

      if (configuracion.fechaObligatoria && !formulario.fechaEventoInicio) {
        mostrarAdvertencia('Selecciona la fecha de la publicación.');
        return;
      }

      const datos:
        CrearPublicacionDatos = {
        tipo:
          formulario.tipo,

        prioridad:
          formulario.prioridad,

        titulo:
          formulario.titulo.trim(),

        contenido:
          formulario.contenido.trim(),

        referencia:
          formulario.referencia.trim() ||
          undefined,

        lugar:
          formulario.lugar.trim() ||
          undefined,

        enlace:
          formulario.enlace.trim() ||
          undefined,

        fechaEventoInicio:
          convertirFechaParaApi(
            formulario.fechaEventoInicio,
          ),

        fechaEventoFin:
          convertirFechaParaApi(
            formulario.fechaEventoFin,
          ),

        estaFijada:
          formulario.estaFijada,

        comentariosHabilitados:
          formulario.comentariosHabilitados,

        visibleParaEstudiantes:
          formulario.visibleParaEstudiantes,

        notificarAlPublicar:
          true,

        recordarUnDiaAntes:
          Boolean(
            formulario.fechaEventoInicio,
          ),

        recordarUnaHoraAntes:
          Boolean(
            formulario.fechaEventoInicio,
          ),

        agregarAlCalendario:
          tipoPublicacionUsaCampo(
            formulario.tipo,
            'CALENDARIO',
          ) &&
          Boolean(
            formulario.fechaEventoInicio,
          ),
      };

      await onGuardar(
        datos,
      );
    };

  if (!abierto) {
    return null;
  }

  return (
    <>
      <AulaModal
        abierto={
          abierto
        }
        ancho="amplio"
        icono={
          IconoTipo
        }
        etiqueta={
          publicacionEditando
            ? 'Editar publicación'
            : 'Nueva publicación'
        }
        titulo={
          configuracion.tituloFormulario
        }
        descripcion={
          configuracion.descripcion
        }
        bloqueado={
          guardando
        }
        onCerrar={
          onCerrar
        }
        footer={
          <>

            <button
              type="button"
              className="button secondary"
              disabled={
                guardando
              }
              onClick={() =>
                setFormulario(
                  crearValorInicial(
                    publicacionEditando,
                  ),
                )
              }
            >
              <RotateCcw
                size={15}
              />

              Restablecer
            </button>

            <div className="publicacion-editor__acciones">
              <button
                type="button"
                className="button secondary"
                onClick={
                  onCerrar
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="button primary"
                disabled={
                  guardando
                }
                onClick={() =>
                  void guardar()
                }
              >
                {publicacionEditando ? (
                  <Save
                    size={16}
                  />
                ) : (
                  <Sparkles
                    size={16}
                  />
                )}

                {publicacionEditando
                  ? 'Guardar cambios'
                  : 'Publicar aviso'}
              </button>
            </div>

          </>
        }
      >
        <div className="publicacion-editor__layout">

            <main className="publicacion-editor__contenido">
              <button
                type="button"
                className="tipo-seleccionado"
                onClick={() =>
                  setSelectorAbierto(
                    true,
                  )
                }
              >
                <span
                  className={`tipo-seleccionado__icono tono-${configuracion.tono}`}
                >
                  <IconoTipo
                    size={19}
                  />
                </span>

                <span>
                  <small>
                    Tipo de publicación
                  </small>

                  <strong>
                    {configuracion.etiqueta}
                  </strong>
                </span>

                <ChevronRight
                  size={18}
                />
              </button>

              <label className="campo">
                <span>
                  Título
                </span>

                <div className="campo__control">
                  <input
                    value={
                      formulario.titulo
                    }
                    maxLength={
                      150
                    }
                    placeholder={
                      configuracion.ejemploTitulo
                    }
                    autoFocus
                    onChange={(
                      evento,
                    ) =>
                      setFormulario(
                        (
                          actual,
                        ) => ({
                          ...actual,
                          titulo:
                            evento.target.value,
                        }),
                      )
                    }
                  />

                  <small>
                    {formulario.titulo.length}
                    /150
                  </small>
                </div>
              </label>

              <label className="campo">
                <span>
                  Contenido
                </span>

                <textarea
                  value={
                    formulario.contenido
                  }
                  rows={
                    7
                  }
                  placeholder="Escribe la información completa..."
                  onChange={(
                    evento,
                  ) =>
                    setFormulario(
                      (
                        actual,
                      ) => ({
                        ...actual,
                        contenido:
                          evento.target.value,
                      }),
                    )
                  }
                />
              </label>

              <div className="campos-dinamicos">
                {tipoPublicacionUsaCampo(
                  formulario.tipo,
                  'REFERENCIA',
                ) && (
                  <label className="campo">
                    <span>
                      {configuracion.referenciaEtiqueta ??
                      'Referencia'}
                    </span>

                    <input
                      value={
                        formulario.referencia
                      }
                      placeholder="Información complementaria"
                      onChange={(
                        evento,
                      ) =>
                        setFormulario(
                          (
                            actual,
                          ) => ({
                            ...actual,
                            referencia:
                              evento.target.value,
                          }),
                        )
                      }
                    />
                  </label>
                )}

                {tipoPublicacionUsaCampo(
                  formulario.tipo,
                  'LUGAR',
                ) && (
                  <label className="campo campo-con-icono">
                    <span>
                      {configuracion.lugarEtiqueta ??
                      'Lugar'}
                    </span>

                    <div>
                      <MapPin
                        size={16}
                      />

                      <input
                        value={
                          formulario.lugar
                        }
                        placeholder="Aula, ambiente o ubicación"
                        onChange={(
                          evento,
                        ) =>
                          setFormulario(
                            (
                              actual,
                            ) => ({
                              ...actual,
                              lugar:
                                evento.target.value,
                            }),
                          )
                        }
                      />
                    </div>
                  </label>
                )}

                {tipoPublicacionUsaCampo(
                  formulario.tipo,
                  'ENLACE',
                ) && (
                  <div className="recurso-destino">
                    {(formulario.tipo ===
                      'MATERIAL_COMPLEMENTARIO' ||
                      formulario.tipo ===
                        'JURISPRUDENCIA') && (
                      <div className="recurso-destino__opciones">
                        <button
                          type="button"
                          className={
                            destinoRecurso ===
                            'EXTERNO'
                              ? 'activo'
                              : ''
                          }
                          onClick={() => {
                            setDestinoRecurso(
                              'EXTERNO',
                            );

                            setFormulario(
                              (
                                actual,
                              ) => ({
                                ...actual,
                                enlace:
                                  actual.enlace.startsWith(
                                    '/',
                                  )
                                    ? ''
                                    : actual.enlace,
                              }),
                            );
                          }}
                        >
                          Página externa
                        </button>

                        <button
                          type="button"
                          className={
                            destinoRecurso ===
                            'BIBLIOTECA'
                              ? 'activo'
                              : ''
                          }
                          onClick={() => {
                            setDestinoRecurso(
                              'BIBLIOTECA',
                            );

                            setFormulario(
                              (
                                actual,
                              ) => ({
                                ...actual,
                                enlace:
                                  actual.enlace.startsWith(
                                    'http',
                                  )
                                    ? ''
                                    : actual.enlace,
                              }),
                            );
                          }}
                        >
                          Biblioteca del curso
                        </button>
                      </div>
                    )}

                    <label className="campo campo-con-icono">
                      <span>
                        {destinoRecurso ===
                        'BIBLIOTECA'
                          ? 'Ruta del recurso en la biblioteca'
                          : configuracion.enlaceEtiqueta ??
                            'Enlace'}
                      </span>

                      <div>
                        <Link2
                          size={16}
                        />

                        <input
                          value={
                            formulario.enlace
                          }
                          placeholder={
                            destinoRecurso ===
                            'BIBLIOTECA'
                              ? '/aula/cursos/3/biblioteca/recurso/12'
                              : 'https://...'
                          }
                          onChange={(
                            evento,
                          ) =>
                            setFormulario(
                              (
                                actual,
                              ) => ({
                                ...actual,
                                enlace:
                                  evento.target.value,
                              }),
                            )
                          }
                        />
                      </div>

                      {destinoRecurso ===
                        'BIBLIOTECA' && (
                        <small className="campo-ayuda">
                          Luego este campo será reemplazado por un selector visual de recursos de la biblioteca.
                        </small>
                      )}
                    </label>
                  </div>
                )}

                {tipoPublicacionUsaCampo(
                  formulario.tipo,
                  'FECHA_INICIO',
                ) && (
                  <div className="fecha-compuesta">
                    <span>
                      {configuracion.fechaInicioEtiqueta ??
                      'Fecha de inicio'}
                      {configuracion.fechaObligatoria
                        ? ' *'
                        : ''}
                    </span>

                    <div className="fecha-compuesta__controles">
                      <label>
                        <CalendarDays
                          size={16}
                        />

                        <input
                          type="date"
                          value={
                            formulario.fechaEventoInicio.slice(
                              0,
                              10,
                            )
                          }
                          onChange={(
                            evento,
                          ) => {
                            const hora =
                              formulario.fechaEventoInicio.slice(
                                11,
                                16,
                              ) ||
                              '08:00';

                            setFormulario(
                              (
                                actual,
                              ) => ({
                                ...actual,
                                fechaEventoInicio:
                                  evento.target.value
                                    ? `${evento.target.value}T${hora}`
                                    : '',
                              }),
                            );
                          }}
                        />
                      </label>

                      <label>
                        <Clock3
                          size={16}
                        />

                        <input
                          type="time"
                          value={
                            formulario.fechaEventoInicio.slice(
                              11,
                              16,
                            )
                          }
                          disabled={
                            !formulario.fechaEventoInicio
                          }
                          onChange={(
                            evento,
                          ) => {
                            const fecha =
                              formulario.fechaEventoInicio.slice(
                                0,
                                10,
                              );

                            setFormulario(
                              (
                                actual,
                              ) => ({
                                ...actual,
                                fechaEventoInicio:
                                  fecha
                                    ? `${fecha}T${evento.target.value}`
                                    : '',
                              }),
                            );
                          }}
                        />
                      </label>
                    </div>

                    <div className="fecha-rapida">
                      <button
                        type="button"
                        onClick={() => {
                          const fecha =
                            new Date();

                          fecha.setDate(
                            fecha.getDate() +
                              1,
                          );

                          const iso =
                            fecha
                              .toISOString()
                              .slice(
                                0,
                                10,
                              );

                          setFormulario(
                            (
                              actual,
                            ) => ({
                              ...actual,
                              fechaEventoInicio:
                                `${iso}T08:00`,
                            }),
                          );
                        }}
                      >
                        Mañana
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const fecha =
                            new Date();

                          fecha.setDate(
                            fecha.getDate() +
                              7,
                          );

                          const iso =
                            fecha
                              .toISOString()
                              .slice(
                                0,
                                10,
                              );

                          setFormulario(
                            (
                              actual,
                            ) => ({
                              ...actual,
                              fechaEventoInicio:
                                `${iso}T08:00`,
                            }),
                          );
                        }}
                      >
                        En una semana
                      </button>
                    </div>
                  </div>
                )}

                {tipoPublicacionUsaCampo(
                  formulario.tipo,
                  'FECHA_FIN',
                ) && (
                  <div className="fecha-compuesta">
                    <span>
                      {configuracion.fechaFinEtiqueta ??
                      'Fecha de finalización'}
                    </span>

                    <div className="fecha-compuesta__controles">
                      <label>
                        <CalendarDays
                          size={16}
                        />

                        <input
                          type="date"
                          value={
                            formulario.fechaEventoFin.slice(
                              0,
                              10,
                            )
                          }
                          min={
                            formulario.fechaEventoInicio.slice(
                              0,
                              10,
                            ) ||
                            undefined
                          }
                          onChange={(
                            evento,
                          ) => {
                            const hora =
                              formulario.fechaEventoFin.slice(
                                11,
                                16,
                              ) ||
                              '09:00';

                            setFormulario(
                              (
                                actual,
                              ) => ({
                                ...actual,
                                fechaEventoFin:
                                  evento.target.value
                                    ? `${evento.target.value}T${hora}`
                                    : '',
                              }),
                            );
                          }}
                        />
                      </label>

                      <label>
                        <Clock3
                          size={16}
                        />

                        <input
                          type="time"
                          value={
                            formulario.fechaEventoFin.slice(
                              11,
                              16,
                            )
                          }
                          disabled={
                            !formulario.fechaEventoFin
                          }
                          onChange={(
                            evento,
                          ) => {
                            const fecha =
                              formulario.fechaEventoFin.slice(
                                0,
                                10,
                              );

                            setFormulario(
                              (
                                actual,
                              ) => ({
                                ...actual,
                                fechaEventoFin:
                                  fecha
                                    ? `${fecha}T${evento.target.value}`
                                    : '',
                              }),
                            );
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </main>

            <aside className="publicacion-editor__config">
              <div className="config-header">
                <span>
                  Configuración
                </span>

                <small>
                  Personaliza cómo se mostrará el aviso.
                </small>
              </div>

              <label className="prioridad-selector">
                <span>
                  Prioridad
                </span>

                <select
                  value={
                    formulario.prioridad
                  }
                  onChange={(
                    evento,
                  ) =>
                    setFormulario(
                      (
                        actual,
                      ) => ({
                        ...actual,
                        prioridad:
                          evento.target.value as PrioridadPublicacion,
                      }),
                    )
                  }
                >
                  <option value="INFORMATIVA">
                    Prioridad normal
                  </option>

                  <option value="MEDIA">
                    Media
                  </option>

                  <option value="ALTA">
                    Alta
                  </option>

                  <option value="URGENTE">
                    Urgente
                  </option>
                </select>
              </label>

              <ConfigSwitch
                icono={
                  Pin
                }
                titulo="Fijar publicación"
                descripcion="Aparecerá en la sección destacada"
                activo={
                  formulario.estaFijada
                }
                onCambiar={() =>
                  setFormulario(
                    (
                      actual,
                    ) => ({
                      ...actual,
                      estaFijada:
                        !actual.estaFijada,
                    }),
                  )
                }
              />

              <ConfigSwitch
                icono={
                  MessageCircle
                }
                titulo="Comentarios"
                descripcion="Permitir participaciones"
                activo={
                  formulario.comentariosHabilitados
                }
                onCambiar={() =>
                  setFormulario(
                    (
                      actual,
                    ) => ({
                      ...actual,
                      comentariosHabilitados:
                        !actual.comentariosHabilitados,
                    }),
                  )
                }
              />

              <ConfigSwitch
                icono={
                  Eye
                }
                titulo="Visible para estudiantes"
                descripcion="Puede ocultarse y publicarse después"
                activo={
                  formulario.visibleParaEstudiantes
                }
                onCambiar={() =>
                  setFormulario(
                    (
                      actual,
                    ) => ({
                      ...actual,
                      visibleParaEstudiantes:
                        !actual.visibleParaEstudiantes,
                    }),
                  )
                }
              />





              {formulario.fechaEventoInicio && (
                <div className="notificacion-automatica">
                  <Bell
                    size={16}
                  />

                  <div>
                    <strong>
                      Recordatorios automáticos
                    </strong>

                    <small>
                      Se notificará al publicar, un día antes y una hora antes.
                    </small>
                  </div>
                </div>
              )}

              <div className="publicacion-resumen">
                <span>
                  Se publicará en
                </span>

                <strong>
                  {hitoCodigo}
                  {' · '}
                  {hitoNombre}
                </strong>
              </div>
            </aside>

        </div>
      </AulaModal>

      <SelectorTipoPublicacion
        abierto={
          selectorAbierto
        }
        valor={
          formulario.tipo
        }
        onSeleccionar={
          cambiarTipo
        }
        onCerrar={() =>
          setSelectorAbierto(
            false,
          )
        }
      />

      <Toast
        visible={toast.visible}
        tipo="advertencia"
        titulo={toast.titulo}
        mensaje={toast.mensaje}
        onCerrar={cerrarToast}
      />

      <style>
        {styles}
      </style>
    </>
  );
}

type ConfigSwitchProps = {
  icono:
    typeof Pin;

  titulo:
    string;

  descripcion:
    string;

  activo:
    boolean;

  onCambiar:
    () => void;
};

function ConfigSwitch({
  icono:
    Icono,
  titulo,
  descripcion,
  activo,
  onCambiar,
}: ConfigSwitchProps) {
  return (
    <button
      type="button"
      className={`config-switch ${
        activo
          ? 'activo'
          : ''
      }`}
      onClick={
        onCambiar
      }
    >
      <span className="config-switch__icono">
        <Icono
          size={17}
        />
      </span>

      <span>
        <strong>
          {titulo}
        </strong>

        <small>
          {descripcion}
        </small>
      </span>

      <span
        className={`switch ${
          activo
            ? 'encendido'
            : ''
        }`}
      >
        <i />
      </span>
    </button>
  );
}

const styles = `
  .publicacion-editor-backdrop {
    position: fixed;
    inset: 0;
    z-index: 60000;
    display: grid;
    place-items: center;
    padding: 20px;
    overflow: hidden;
    background:
      rgba(
        15,
        23,
        42,
        .58
      );
    backdrop-filter:
      blur(
        9px
      );
    -webkit-backdrop-filter:
      blur(
        9px
      );
  }

  .publicacion-editor {
    width:
      min(
        1120px,
        calc(
          100vw -
          40px
        )
      );
    max-height:
      calc(
        100vh -
        28px
      );
    display: grid;
    grid-template-rows:
      auto
      auto
      auto;
    overflow: hidden;
    border:
      1px solid
      var(
        --app-border
      );
    border-radius: 26px;
    color:
      var(
        --app-text
      );
    background:
      var(
        --app-surface
      );
    box-shadow:
      0
      34px
      110px
      rgba(
        15,
        23,
        42,
        .34
      );
    animation:
      publicacionEditorEntrada
      .24s
      ease-out;
  }

  .publicacion-editor__header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding:
      18px
      22px;
    border-bottom:
      1px solid
      var(
        --app-border-soft
      );
    background:
      linear-gradient(
        135deg,
        var(
          --app-surface
        ),
        color-mix(
          in srgb,
          var(
            --app-accent-soft
          ) 32%,
          var(
            --app-surface
          )
        )
      );
  }

  .publicacion-editor__header::before {
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
        var(
          --app-accent
        ),
        var(
          --app-warning
        ),
        var(
          --app-accent
        )
      );
  }

  .publicacion-editor__identidad {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .publicacion-editor__icono,
  .tipo-seleccionado__icono {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 15px;
  }

  .publicacion-editor__icono {
    width: 48px;
    height: 48px;
    border:
      1px solid
      color-mix(
        in srgb,
        currentColor
        18%,
        transparent
      );
    box-shadow:
      var(
        --app-shadow-sm
      );
  }

  .publicacion-editor__header h3 {
    margin:
      5px
      0
      0;
    color:
      var(
        --app-text
      );
    font-size:
      clamp(
        22px,
        1.8vw,
        27px
      );
    font-weight: 900;
    line-height: 1.12;
    letter-spacing: -.025em;
  }

  .publicacion-editor__header p {
    margin:
      5px
      0
      0;
    color:
      var(
        --app-text-soft
      );
    font-size: 12px;
    line-height: 1.4;
  }

  .eyebrow {
    color:
      var(
        --app-accent-dark
      );
    font-size: 11px;
    font-weight: 850;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  .icon-button {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    padding: 0;
    border:
      1px solid
      var(
        --app-border
      );
    border-radius: 14px;
    color:
      var(
        --app-text-soft
      );
    background:
      var(
        --app-surface
      );
    cursor: pointer;
    transition:
      transform
      .16s
      ease,
      color
      .16s
      ease,
      background
      .16s
      ease;
  }

  .icon-button:hover {
    transform:
      rotate(
        4deg
      );
    color:
      var(
        --app-danger
      );
    background:
      var(
        --app-danger-bg
      );
  }

  .publicacion-editor__layout {
    display: grid;
    grid-template-columns:
      minmax(
        0,
        1fr
      )
      320px;
    align-items: start;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
  }

  .publicacion-editor__contenido {
    min-width: 0;
    display: grid;
    align-content: start;
    gap: 14px;
    padding: 18px 20px;
    overflow: visible;
    border-right:
      1px solid
      var(
        --app-border-soft
      );
    scrollbar-width: thin;
  }

  .tipo-seleccionado {
    width: 100%;
    display: grid;
    grid-template-columns:
      42px
      minmax(
        0,
        1fr
      )
      auto;
    gap: 12px;
    align-items: center;
    padding:
      10px
      12px;
    border:
      1px solid
      var(
        --app-border-strong
      );
    border-radius: 16px;
    color:
      var(
        --app-text-secondary
      );
    background:
      linear-gradient(
        135deg,
        var(
          --app-surface-alt
        ),
        var(
          --app-surface
        )
      );
    box-shadow:
      var(
        --app-shadow-sm
      );
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      transform
      .16s
      ease,
      border-color
      .16s
      ease,
      box-shadow
      .16s
      ease;
  }

  .tipo-seleccionado:hover {
    transform:
      translateY(
        -1px
      );
    border-color:
      var(
        --app-accent
      );
    box-shadow:
      var(
        --app-shadow
      );
  }

  .tipo-seleccionado__icono {
    width: 42px;
    height: 42px;
  }

  .tipo-seleccionado small,
  .tipo-seleccionado strong {
    display: block;
  }

  .tipo-seleccionado small {
    color:
      var(
        --app-text-muted
      );
    font-size: 10px;
  }

  .tipo-seleccionado strong {
    margin-top: 3px;
    color:
      var(
        --app-text
      );
    font-size: 11px;
    font-weight: 850;
  }

  .campo {
    display: grid;
    gap: 7px;
  }

  .campo > span,
  .fecha-compuesta > span {
    color:
      var(
        --app-text-secondary
      );
    font-size: 12px;
    font-weight: 800;
  }

  .campo__control {
    position: relative;
  }

  .campo input,
  .campo textarea,
  .prioridad-selector select {
    width: 100%;
    box-sizing: border-box;
    border:
      1px solid
      var(
        --app-input-border
      );
    border-radius: 15px;
    outline: none;
    color:
      var(
        --app-text
      );
    background:
      var(
        --app-input-bg
      );
    font-family: inherit;
    font-size: 13px;
    transition:
      border-color
      .16s
      ease,
      box-shadow
      .16s
      ease,
      transform
      .16s
      ease;
  }

  .campo input,
  .prioridad-selector select {
    min-height: 46px;
    padding:
      0
      15px;
  }

  .campo textarea {
    min-height: 138px;
    padding:
      14px
      15px;
    line-height: 1.6;
    resize: vertical;
  }

  .campo input:focus,
  .campo textarea:focus,
  .prioridad-selector select:focus,
  .fecha-compuesta__controles label:focus-within,
  .campo-con-icono > div:focus-within {
    transform:
      translateY(
        -1px
      );
    border-color:
      var(
        --app-accent
      );
    box-shadow:
      0
      0
      0
      4px
      var(
        --app-input-ring
      );
  }

  .campo__control input {
    padding-right: 67px;
  }

  .campo__control small {
    position: absolute;
    top: 50%;
    right: 14px;
    color:
      var(
        --app-text-muted
      );
    font-size: 10px;
    transform:
      translateY(
        -50%
      );
  }

  .campo-con-icono > div {
    min-height: 46px;
    display: grid;
    grid-template-columns:
      20px
      minmax(
        0,
        1fr
      );
    align-items: center;
    gap: 7px;
    padding-left: 13px;
    border:
      1px solid
      var(
        --app-input-border
      );
    border-radius: 15px;
    color:
      var(
        --app-text-muted
      );
    background:
      var(
        --app-input-bg
      );
    transition:
      border-color
      .16s
      ease,
      box-shadow
      .16s
      ease;
  }

  .campo-con-icono input {
    min-height: 48px;
    border: none;
    background: transparent;
  }

  .recurso-destino {
    display: grid;
    gap: 9px;
  }

  .recurso-destino__opciones {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 7px;
  }

  .recurso-destino__opciones button,
  .fecha-rapida button {
    min-height: 40px;
    padding:
      9px
      12px;
    border:
      1px solid
      var(
        --app-border
      );
    border-radius: 12px;
    color:
      var(
        --app-text-soft
      );
    background:
      var(
        --app-surface
      );
    font-family: inherit;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .recurso-destino__opciones button.activo {
    border-color:
      var(
        --app-accent
      );
    color:
      var(
        --app-accent-dark
      );
    background:
      var(
        --app-accent-soft
      );
  }

  .campo-ayuda {
    color:
      var(
        --app-text-muted
      );
    font-size: 10px;
    line-height: 1.5;
  }

  .fecha-compuesta {
    display: grid;
    gap: 9px;
  }

  .fecha-compuesta__controles {
    display: grid;
    grid-template-columns:
      minmax(
        0,
        1.35fr
      )
      minmax(
        145px,
        .65fr
      );
    gap: 9px;
  }

  .fecha-compuesta__controles label {
    min-height: 46px;
    display: grid;
    grid-template-columns:
      20px
      minmax(
        0,
        1fr
      );
    align-items: center;
    gap: 7px;
    padding:
      0
      12px;
    border:
      1px solid
      var(
        --app-input-border
      );
    border-radius: 15px;
    color:
      var(
        --app-text-muted
      );
    background:
      var(
        --app-input-bg
      );
    transition:
      border-color
      .16s
      ease,
      box-shadow
      .16s
      ease;
  }

  .fecha-compuesta__controles input {
    width: 100%;
    border: none;
    outline: none;
    color:
      var(
        --app-text
      );
    background: transparent;
    font-family: inherit;
    font-size: 13px;
  }

  .fecha-rapida {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .fecha-rapida button {
    min-height: 35px;
  }

  .campos-dinamicos {
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
  }

  .campos-dinamicos .campo:first-child:last-child,
  .campos-dinamicos .recurso-destino:only-child,
  .campos-dinamicos .fecha-compuesta:only-child {
    grid-column:
      1
      /
      -1;
  }

  .publicacion-editor__config {
    display: grid;
    align-content: start;
    gap: 9px;
    padding:
      18px
      16px;
    overflow: visible;
    background:
      color-mix(
        in srgb,
        var(
          --app-surface-alt
        ) 82%,
        var(
          --app-surface
        )
      );
    scrollbar-width: thin;
  }

  .config-header {
    padding:
      0
      2px
      4px;
  }

  .config-header span,
  .config-header small {
    display: block;
  }

  .config-header span {
    color:
      var(
        --app-text
      );
    font-size: 15px;
    font-weight: 900;
  }

  .config-header small {
    margin-top: 4px;
    color:
      var(
        --app-text-muted
      );
    font-size: 11px;
    line-height: 1.45;
  }

  .prioridad-selector {
    display: grid;
    gap: 7px;
    padding: 11px;
    border:
      1px solid
      var(
        --app-border-soft
      );
    border-radius: 15px;
    background:
      var(
        --app-surface
      );
    box-shadow:
      var(
        --app-shadow-sm
      );
  }

  .prioridad-selector span {
    color:
      var(
        --app-text-secondary
      );
    font-size: 11px;
    font-weight: 850;
  }

  .prioridad-selector select {
    min-height: 42px;
    font-size: 13px;
  }

  .config-switch {
    width: 100%;
    min-height: 60px;
    display: grid;
    grid-template-columns:
      36px
      minmax(
        0,
        1fr
      )
      auto;
    gap: 9px;
    align-items: center;
    padding: 12px;
    border:
      1px solid
      var(
        --app-border-soft
      );
    border-radius: 15px;
    color:
      var(
        --app-text-secondary
      );
    background:
      var(
        --app-surface
      );
    box-shadow:
      var(
        --app-shadow-sm
      );
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      transform
      .15s
      ease,
      border-color
      .15s
      ease,
      background
      .15s
      ease;
  }

  .config-switch:hover {
    transform:
      translateY(
        -1px
      );
    border-color:
      var(
        --app-border-strong
      );
  }

  .config-switch.activo {
    border-color:
      color-mix(
        in srgb,
        var(
          --app-accent
        ) 48%,
        var(
          --app-border
        )
      );
    background:
      color-mix(
        in srgb,
        var(
          --app-accent-soft
        ) 32%,
        var(
          --app-surface
        )
      );
  }

  .config-switch__icono {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color:
      var(
        --app-accent-dark
      );
    background:
      var(
        --app-accent-soft
      );
  }

  .config-switch strong,
  .config-switch small {
    display: block;
  }

  .config-switch strong {
    color:
      var(
        --app-text-secondary
      );
    font-size: 11px;
    font-weight: 850;
  }

  .config-switch small {
    margin-top: 3px;
    color:
      var(
        --app-text-muted
      );
    font-size: 9px;
    line-height: 1.3;
  }

  .switch {
    width: 36px;
    height: 21px;
    display: flex;
    align-items: center;
    padding: 2px;
    border-radius: 999px;
    background:
      var(
        --app-surface-disabled
      );
    transition:
      background
      .15s
      ease;
  }

  .switch i {
    width: 17px;
    height: 17px;
    display: block;
    border-radius: 50%;
    background:
      var(
        --app-surface
      );
    box-shadow:
      0
      2px
      6px
      rgba(
        15,
        23,
        42,
        .18
      );
    transition:
      transform
      .15s
      ease;
  }

  .switch.encendido {
    background:
      var(
        --app-accent
      );
  }

  .switch.encendido i {
    transform:
      translateX(
        15px
      );
  }

  .notificacion-automatica {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    padding: 11px;
    border:
      1px solid
      color-mix(
        in srgb,
        var(
          --app-success
        ) 28%,
        var(
          --app-border
        )
      );
    border-radius: 15px;
    color:
      var(
        --app-success
      );
    background:
      var(
        --app-success-bg
      );
  }

  .notificacion-automatica strong,
  .notificacion-automatica small {
    display: block;
  }

  .notificacion-automatica strong {
    font-size: 11px;
    font-weight: 850;
  }

  .notificacion-automatica small {
    margin-top: 4px;
    color:
      var(
        --app-text-soft
      );
    font-size: 10px;
    line-height: 1.45;
  }

  .publicacion-resumen {
    padding: 11px;
    border:
      1px dashed
      var(
        --app-border-strong
      );
    border-radius: 14px;
    background:
      var(
        --app-surface
      );
  }

  .publicacion-resumen span,
  .publicacion-resumen strong {
    display: block;
  }

  .publicacion-resumen span {
    color:
      var(
        --app-text-muted
      );
    font-size: 10px;
  }

  .publicacion-resumen strong {
    margin-top: 5px;
    color:
      var(
        --app-text
      );
    font-size: 12px;
  }


  .publicacion-editor__config > * {
    min-width: 0;
  }

  .publicacion-resumen,
  .notificacion-automatica {
    padding: 10px 11px;
  }

  .publicacion-resumen span,
  .notificacion-automatica small {
    font-size: 9px;
  }

  .publicacion-resumen strong {
    font-size: 11px;
  }

  .publicacion-editor__footer {
    position: sticky;
    bottom: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding:
      13px
      20px
      15px;
    border-top:
      1px solid
      var(
        --app-border-soft
      );
    background:
      var(
        --app-surface
      );
  }

  .publicacion-editor__acciones {
    display: flex;
    gap: 9px;
  }

  .publicacion-editor__acciones {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 14px;
  }

  .button {
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding:
      10px
      15px;
    border: none;
    border-radius: 13px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition:
      transform
      .16s
      ease,
      box-shadow
      .16s
      ease,
      opacity
      .16s
      ease;
  }

  .button.primary {
    color: #fff;
    background:
      linear-gradient(
        135deg,
        var(
          --app-accent
        ),
        var(
          --app-accent-hover
        )
      );
    box-shadow:
      0
      12px
      26px
      color-mix(
        in srgb,
        var(
          --app-accent
        ) 26%,
        transparent
      );
  }

  .button.secondary {
    border:
      1px solid
      var(
        --app-border-strong
      );
    color:
      var(
        --app-text-secondary
      );
    background:
      var(
        --app-surface
      );
  }

  .button:hover:not(:disabled) {
    transform:
      translateY(
        -1px
      );
  }

  .button:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  .tono-azul {
    color: #2563eb;
    background: #dbeafe;
  }

  .tono-verde {
    color: #15803d;
    background: #dcfce7;
  }

  .tono-rojo {
    color: #dc2626;
    background: #fee2e2;
  }

  .tono-morado {
    color: #7c3aed;
    background: #ede9fe;
  }

  .tono-naranja {
    color: #ea580c;
    background: #ffedd5;
  }

  .tono-celeste {
    color: #0284c7;
    background: #e0f2fe;
  }

  .tono-amarillo {
    color: #a16207;
    background: #fef9c3;
  }

  .tono-rosado {
    color: #db2777;
    background: #fce7f3;
  }

  .tono-gris {
    color: #475569;
    background: #e2e8f0;
  }

  .tono-indigo {
    color: #4f46e5;
    background: #e0e7ff;
  }

  @keyframes publicacionEditorEntrada {
    from {
      opacity: 0;
      transform:
        translateY(
          12px
        )
        scale(
          .985
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

  @media (
    max-width:
      900px
  ) {
    .publicacion-editor {
      max-height:
        calc(
          100vh -
          24px
        );
    }

    .publicacion-editor__layout {
      grid-template-columns:
        1fr;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .publicacion-editor__contenido,
    .publicacion-editor__config {
      overflow: visible;
    }

    .publicacion-editor__contenido {
      border-right: none;
      border-bottom:
        1px solid
        var(
          --app-border-soft
        );
    }

    .publicacion-editor__config {
      grid-template-columns:
        repeat(
          2,
          minmax(
            0,
            1fr
          )
        );
    }

    .config-header,
    .publicacion-resumen,
    .notificacion-automatica {
      grid-column:
        1
        /
        -1;
    }
  }

  @media (
    max-width:
      620px
  ) {
    .publicacion-editor-backdrop {
      padding: 0;
    }

    .publicacion-editor {
      width: 100vw;
      max-height: 100vh;
      border: none;
      border-radius: 0;
    }

    .publicacion-editor__header {
      padding:
        20px
        17px;
    }

    .publicacion-editor__header h3 {
      font-size: 23px;
    }

    .publicacion-editor__contenido {
      padding: 18px;
    }

    .publicacion-editor__config {
      grid-template-columns: 1fr;
      padding: 18px;
    }

    .config-header,
    .publicacion-resumen,
    .notificacion-automatica {
      grid-column: auto;
    }

    .campos-dinamicos,
    .fecha-compuesta__controles,
    .recurso-destino__opciones {
      grid-template-columns: 1fr;
    }

    .publicacion-editor__footer {
      align-items: stretch;
      flex-direction: column-reverse;
      padding: 14px 17px;
    }

    .publicacion-editor__acciones {
      display: grid;
      grid-template-columns:
        1fr
        1fr;
    }

    .publicacion-editor__acciones .button {
      width: 100%;
    }
  }

  @media (
    prefers-reduced-motion:
      reduce
  ) {
    .publicacion-editor,
    .publicacion-editor * {
      animation: none !important;
      transition: none !important;
    }
  }


  /* Ajustes del AulaModal reutilizable */
  .publicacion-editor__layout {
    height: 100%;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 270px;
    align-items: start;
    overflow: hidden;
  }

  .publicacion-editor__contenido {
    gap: 10px;
    padding: 2px 14px 2px 0;
    overflow: hidden;
  }

  .publicacion-editor__config {
    gap: 7px;
    padding: 2px 0 2px 14px;
    overflow: hidden;
  }

  .tipo-seleccionado {
    padding: 8px 10px;
    grid-template-columns: 36px minmax(0, 1fr) auto;
    border-radius: 13px;
  }

  .tipo-seleccionado__icono {
    width: 36px;
    height: 36px;
  }

  .campo input,
  .prioridad-selector select {
    min-height: 40px;
  }

  .campo textarea {
    min-height: 94px;
    max-height: 112px;
    padding: 11px 13px;
    resize: none;
  }

  .campo input,
  .campo textarea,
  .prioridad-selector select {
    border-radius: 12px;
    font-size: 12px;
  }

  .config-header span {
    font-size: 14px;
  }

  .config-header small {
    font-size: 9px;
  }

  .prioridad-selector {
    gap: 5px;
    padding: 9px;
    border-radius: 12px;
  }

  .config-switch {
    min-height: 50px;
    grid-template-columns: 32px minmax(0, 1fr) auto;
    gap: 7px;
    padding: 9px;
    border-radius: 12px;
  }

  .config-switch__icono {
    width: 32px;
    height: 32px;
    border-radius: 10px;
  }

  .config-switch strong {
    font-size: 10px;
  }

  .config-switch small {
    font-size: 8px;
  }

  .notificacion-automatica,
  .publicacion-resumen {
    padding: 8px 9px;
    border-radius: 12px;
  }

  .button {
    min-width: 108px;
    max-width: 180px;
    min-height: 39px;
    padding: 8px 13px;
    font-size: 11px;
  }

  @media (max-width: 820px) {
    .publicacion-editor__layout {
      grid-template-columns: 1fr;
      overflow-y: auto;
    }

    .publicacion-editor__contenido {
      padding-right: 0;
      border-right: none;
    }

    .publicacion-editor__config {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      padding: 12px 0 0;
      border-top: 1px solid var(--app-border-soft);
    }

    .config-header,
    .publicacion-resumen,
    .notificacion-automatica {
      grid-column: 1 / -1;
    }
  }
`;