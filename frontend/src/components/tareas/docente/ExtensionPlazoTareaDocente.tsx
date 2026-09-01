import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlarmClock,
  CalendarClock,
  Check,
  Clock3,
  Lock,
  RotateCcw,
  Search,
  Trash2,
  Users,
} from 'lucide-react';

import {
  useAuth,
} from '../../../auth/AuthContext';

import AulaModal from '../../aula/AulaModal';

import Toast,
{
  type TipoToast,
} from '../../shared/Toast';

import type {
  CrearExtensionPlazoFrontend,
  ExtensionPlazoFrontend,
} from '../../../hooks/tareas/useSeguimientoTareaDocente';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

type Props = {
  abierto:
    boolean;

  cursoId:
    number;

  extensiones:
    ExtensionPlazoFrontend[];

  procesando:
    boolean;

  onCerrar:
    () => void;

  onExtender:
    (
      datos:
        CrearExtensionPlazoFrontend,
    ) => Promise<unknown>;

  onRevocar:
    (
      extensionId:
        number,
    ) => Promise<unknown>;
};

type EstudianteCurso = {
  inscripcionId:
    number;

  estadoInscripcion:
    string;

  estudiante: {
    id:
      number;

    nombres:
      string;

    apellidoPaterno:
      string;

    apellidoMaterno?:
      string | null;

    correo:
      string;
  };
};

function nombreCompleto(
  persona: {
    nombres:
      string;

    apellidoPaterno:
      string;

    apellidoMaterno?:
      string | null;
  },
) {
  return [
    persona.nombres,
    persona.apellidoPaterno,
    persona.apellidoMaterno ??
      '',
  ]
    .filter(
      Boolean,
    )
    .join(
      ' ',
    )
    .trim();
}

function fecha(
  valor:
    string | Date | null | undefined,
) {
  if (
    !valor
  ) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'es-BO',
    {
      day:
        '2-digit',

      month:
        '2-digit',

      year:
        'numeric',

      hour:
        '2-digit',

      minute:
        '2-digit',

      hour12:
        false,
    },
  ).format(
    new Date(
      valor,
    ),
  );
}

function aIso(
  valor:
    string,
) {
  return valor
    ? new Date(
        valor,
      ).toISOString()
    : null;
}

function mensajeError(
  valor:
    unknown,
  fallback:
    string,
) {
  if (
    valor &&
    typeof valor ===
      'object'
  ) {
    const datos =
      valor as {
        message?:
          string | string[];

        mensaje?:
          string;

        error?:
          string;
      };

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
      datos.message ||
      datos.mensaje ||
      datos.error ||
      fallback
    );
  }

  return fallback;
}

export default function ExtensionPlazoTareaDocente({
  abierto,
  cursoId,
  extensiones,
  procesando,
  onCerrar,
  onExtender,
  onRevocar,
}: Props) {
  const {
    sesion,
  } =
    useAuth();

  const accessToken =
    sesion?.accessToken ??
    '';

  const [
    estudiantes,
    setEstudiantes,
  ] =
    useState<EstudianteCurso[]>(
      [],
    );

  const [
    cargandoEstudiantes,
    setCargandoEstudiantes,
  ] =
    useState(
      false,
    );

  const [
    busqueda,
    setBusqueda,
  ] =
    useState(
      '',
    );

  const [
    seleccionados,
    setSeleccionados,
  ] =
    useState<number[]>(
      [],
    );

  const [
    pestana,
    setPestana,
  ] =
    useState<
      'NUEVA' |
      'HISTORIAL'
    >(
      'NUEVA',
    );

  const [
    modoBeneficiarios,
    setModoBeneficiarios,
  ] =
    useState<
      'TODOS' |
      'PERSONALIZADO'
    >(
      'TODOS',
    );

  const [
    apertura,
    setApertura,
  ] =
    useState(
      '',
    );

  const [
    limite,
    setLimite,
  ] =
    useState(
      '',
    );

  const [
    maxRetraso,
    setMaxRetraso,
  ] =
    useState(
      '',
    );

  const [
    motivo,
    setMotivo,
  ] =
    useState(
      '',
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(
      false,
    );

  const [
    toast,
    setToast,
  ] =
    useState<{
      visible:
        boolean;

      tipo:
        TipoToast;

      titulo:
        string;

      mensaje?:
        string;
    }>({
      visible:
        false,

      tipo:
        'informacion',

      titulo:
        '',
    });

  const mostrarToast =
    (
      tipo:
        TipoToast,

      titulo:
        string,

      mensaje?:
        string,
    ) => {
      setToast({
        visible:
          true,

        tipo,

        titulo,

        mensaje,
      });
    };

  const cargarEstudiantes =
    async (
      forzar =
        false,
    ) => {
      if (
        (
          estudiantes.length >
          0 ||
          cargandoEstudiantes
        ) &&
        !forzar
      ) {
        return;
      }

      if (
        !accessToken
      ) {
        return;
      }

      setCargandoEstudiantes(
        true,
      );

      try {
        const respuesta =
          await fetch(
            `${API_URL}/docente/cursos/${cursoId}/estudiantes`,
            {
              cache:
                'no-store',

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            },
          );

        const cuerpo =
          await respuesta
            .json()
            .catch(
              () =>
                null,
            );

        if (
          !respuesta.ok
        ) {
          throw new Error(
            mensajeError(
              cuerpo,
              'No fue posible cargar los estudiantes.',
            ),
          );
        }

        const datos =
          cuerpo as {
            estudiantes?:
              EstudianteCurso[];
          };

        setEstudiantes(
          Array.isArray(
            datos.estudiantes,
          )
            ? datos.estudiantes
                .filter(
                  (
                    item,
                  ) =>
                    item.estadoInscripcion ===
                    'ACTIVA',
                )
            : [],
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudieron cargar los estudiantes',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      } finally {
        setCargandoEstudiantes(
          false,
        );
      }
    };

  useEffect(
    () => {
      if (
        abierto
      ) {
        void cargarEstudiantes();
      }
    },
    [
      abierto,
      cargarEstudiantes,
    ],
  );

  const alternar =
    (
      id:
        number,
    ) => {
      setSeleccionados(
        (
          previo,
        ) =>
          previo.includes(
            id,
          )
            ? previo.filter(
                (
                  v,
                ) =>
                  v !==
                  id,
              )
            : [
                ...previo,
                id,
              ],
      );
    };

  const estudiantesFiltrados =
    useMemo(
      () => {
        const texto =
          busqueda
            .trim()
            .toLowerCase();

        const filtrados =
          texto
            ? estudiantes.filter(
                (
                  item,
                ) => {
                  const nombre =
                    nombreCompleto(
                      item.estudiante,
                    )
                      .toLowerCase();

                  const correo =
                    item.estudiante.correo
                      ?.toLowerCase() ??
                    '';

                  return (
                    nombre.includes(
                      texto,
                    ) ||
                    correo.includes(
                      texto,
                    )
                  );
                },
              )
            : estudiantes;

        return [
          ...filtrados,
        ].sort(
          (
            a,
            b,
          ) =>
            nombreCompleto(
              a.estudiante,
            ).localeCompare(
              nombreCompleto(
                b.estudiante,
              ),
            ),
        );
      },
      [
        busqueda,
        estudiantes,
      ],
    );

  const idsBeneficiarios =
    modoBeneficiarios ===
    'TODOS'
      ? estudiantes.map(
          (
            item,
          ) =>
            item.estudiante.id,
        )
      : seleccionados;

  const totalBeneficiarios =
    idsBeneficiarios.length;

  const aplicar =
    async () => {
      if (
        totalBeneficiarios ===
        0
      ) {
        mostrarToast(
          'advertencia',
          modoBeneficiarios ===
            'TODOS'
            ? 'No hay estudiantes activos en el curso'
            : 'Selecciona al menos un estudiante',
        );

        return;
      }

      const aperturaISO =
        aIso(
          apertura,
        );

      const limiteISO =
        aIso(
          limite,
        );

      const maxISO =
        aIso(
          maxRetraso,
        );

      if (
        !aperturaISO &&
        !limiteISO &&
        !maxISO
      ) {
        mostrarToast(
          'advertencia',
          'Define al menos una fecha ampliada',
        );

        return;
      }

      const datos:
        CrearExtensionPlazoFrontend =
        {
          estudianteIds:
            idsBeneficiarios,

          ...(
            aperturaISO
              ? {
                  fechaAperturaExtendida:
                    aperturaISO,
                }
              : {}
          ),

          ...(
            limiteISO
              ? {
                  fechaLimiteExtendida:
                    limiteISO,
                }
              : {}
          ),

          ...(
            maxISO
              ? {
                  fechaMaximaRetrasoExtendida:
                    maxISO,
                }
              : {}
          ),

          ...(
            motivo.trim()
              ? {
                  motivo:
                    motivo.trim(),
                }
              : {}
          ),
        };

      setCargando(
        true,
      );

      try {
        await onExtender(
          datos,
        );

        mostrarToast(
          'exito',
          'Plazo ampliado',
          `Se amplió el plazo para ${totalBeneficiarios} estudiante(s).`,
        );

        setSeleccionados(
          [],
        );

        setApertura(
          '',
        );

        setLimite(
          '',
        );

        setMaxRetraso(
          '',
        );

        setMotivo(
          '',
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo ampliar el plazo',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      } finally {
        setCargando(
          false,
        );
      }
    };

  const revocar =
    async (
      extensionId:
        number,
    ) => {
      if (
        !window.confirm(
          '¿Revocar esta extensión de plazo? Los beneficiarios volverán a usar las fechas originales de la tarea.',
        )
      ) {
        return;
      }

      try {
        await onRevocar(
          extensionId,
        );

        mostrarToast(
          'exito',
          'Extensión revocada',
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo revocar',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      }
    };

  const nombreEstudiantes =
    (
      beneficiarios:
        ExtensionPlazoFrontend['beneficiarios'],
    ) => {
      const nombres =
        beneficiarios.map(
          (
            item,
          ) =>
            nombreCompleto(
              item.estudiante,
            ),
        );

      if (
        nombres.length <=
        3
      ) {
        return nombres.join(
          ', ',
        );
      }

      return `${nombres.slice(0, 3).join(', ')} y ${nombres.length - 3} más`;
    };

  return (
    <>
      <AulaModal
        abierto={
          abierto
        }
        titulo="Extensión de plazo"
        etiqueta="Entrega de tarea"
        descripcion="Amplía el plazo de entrega para estudiantes o grupos específicos de esta tarea."
        icono={
          CalendarClock
        }
        ancho="amplio"
        bloqueado={
          procesando
        }
        onCerrar={
          onCerrar
        }
        footer={
          <div className="exd-footer">
            {pestana ===
            'NUEVA' ? (
              <>
                <span className="exd-footer-accion">
                  <button
                    type="button"
                    className="exd-accion-secundaria"
                    onClick={
                      onCerrar
                    }
                  >
                    Cancelar
                  </button>
                </span>

                <span className="exd-footer-accion">
                  <button
                    type="button"
                    className="exd-accion-primaria"
                    disabled={
                      cargando ||
                      procesando ||
                      totalBeneficiarios ===
                        0
                    }
                    onClick={
                      aplicar
                    }
                  >
                    <Check
                      size={17}
                    />

                    Aplicar extensión
                  </button>
                </span>
              </>
            ) : (
              <span className="exd-footer-accion">
                <button
                  type="button"
                  className="exd-accion-secundaria"
                  onClick={
                    onCerrar
                  }
                >
                  Cerrar
                </button>
              </span>
            )}
          </div>
        }
      >
        <div className="exd-contenido">
          <div
            className="exd-tabs"
            role="tablist"
            aria-label="Gestión de extensiones de plazo"
          >
            <button
              type="button"
              role="tab"
              aria-selected={
                pestana ===
                'NUEVA'
              }
              className={
                pestana ===
                'NUEVA'
                  ? 'activo'
                  : ''
              }
              onClick={() =>
                setPestana(
                  'NUEVA',
                )
              }
            >
              <CalendarClock
                size={17}
              />
              Nueva extensión
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={
                pestana ===
                'HISTORIAL'
              }
              className={
                pestana ===
                'HISTORIAL'
                  ? 'activo'
                  : ''
              }
              onClick={() =>
                setPestana(
                  'HISTORIAL',
                )
              }
            >
              <RotateCcw
                size={17}
              />
              Historial

              {extensiones.length >
                0 && (
                <span className="exd-tabs__contador">
                  {
                    extensiones.length
                  }
                </span>
              )}
            </button>
          </div>

          {pestana ===
          'NUEVA' ? (
            <section className="exd-panel">
              <div className="exd-seccion">
                <div className="exd-titulo">
                  <Users
                    size={18}
                  />

                  <div>
                    <strong>
                      Beneficiarios
                    </strong>

                    <small>
                      Define a quién se aplicará la extensión
                    </small>
                  </div>
                </div>

                <div className="exd-modos">
                  <button
                    type="button"
                    className={
                      modoBeneficiarios ===
                      'TODOS'
                        ? 'activo'
                        : ''
                    }
                    onClick={() => {
                      setModoBeneficiarios(
                        'TODOS',
                      );
                      setSeleccionados(
                        [],
                      );
                    }}
                  >
                    <span className="exd-modos__radio" />

                    <span>
                      <strong>
                        Todos
                      </strong>

                      <small>
                        Aplicar a todos los estudiantes activos del curso
                      </small>
                    </span>
                  </button>

                  <button
                    type="button"
                    className={
                      modoBeneficiarios ===
                      'PERSONALIZADO'
                        ? 'activo'
                        : ''
                    }
                    onClick={() =>
                      setModoBeneficiarios(
                        'PERSONALIZADO',
                      )
                    }
                  >
                    <span className="exd-modos__radio" />

                    <span>
                      <strong>
                        Personalizado
                      </strong>

                      <small>
                        Seleccionar estudiantes específicos
                      </small>
                    </span>
                  </button>
                </div>

                {modoBeneficiarios ===
                  'TODOS' ? (
                  <div className="exd-resumen-todos">
                    <Check
                      size={16}
                    />

                    <span>
                      La extensión se aplicará a{' '}
                      <strong>
                        {
                          estudiantes.length
                        }{' '}
                        estudiante(s)
                      </strong>{' '}
                      con inscripción activa.
                    </span>
                  </div>
                ) : (
                  <div className="exd-personalizado">
                    <div className="exd-personalizado__cabecera">
                      <span>
                        Selecciona beneficiarios
                      </span>

                      <strong>
                        {
                          seleccionados.length
                        }{' '}
                        seleccionado(s)
                      </strong>
                    </div>

                    <label className="exd-buscar">
                      <Search
                        size={16}
                      />

                      <input
                        type="search"
                        placeholder="Buscar estudiante por nombre o correo"
                        value={
                          busqueda
                        }
                        onChange={(
                          evento,
                        ) =>
                          setBusqueda(
                            evento.target.value,
                          )
                        }
                      />
                    </label>

                    <div className="exd-lista">
                      {
                        cargandoEstudiantes ? (
                          <p className="exd-vacio">
                            Cargando estudiantes…
                          </p>
                        ) : estudiantesFiltrados.length ===
                        0 ? (
                          <p className="exd-vacio">
                            No hay estudiantes que coincidan con la búsqueda.
                          </p>
                        ) : (
                          estudiantesFiltrados.map(
                            (
                              item,
                            ) => {
                              const activo =
                                seleccionados.includes(
                                  item.estudiante.id,
                                );

                              return (
                                <label
                                  key={
                                    item.estudiante.id
                                  }
                                  className={
                                    `exd-fila${activo ? ' exd-fila--activa' : ''}`
                                  }
                                >
                                  <input
                                    type="checkbox"
                                    checked={
                                      activo
                                    }
                                    onChange={() =>
                                      alternar(
                                        item.estudiante.id,
                                      )
                                    }
                                  />

                                  <span className="exd-fila-nombre">
                                    {
                                      nombreCompleto(
                                        item.estudiante,
                                      )
                                    }
                                  </span>

                                  {
                                    activo && (
                                      <Check
                                        size={16}
                                        className="exd-fila-check"
                                      />
                                    )
                                  }
                                </label>
                              );
                            },
                          )
                        )
                      }
                    </div>
                  </div>
                )}
              </div>

              <div className="exd-seccion">
                <div className="exd-titulo">
                  <AlarmClock
                    size={18}
                  />

                  <div>
                    <strong>
                      Nuevas fechas
                    </strong>

                    <small>
                      Deja vacío lo que no quieras modificar
                    </small>
                  </div>
                </div>

                <div className="exd-fechas-grid">
                  <label className="exd-campo">
                    <span>
                      Apertura ampliada
                    </span>

                    <input
                      type="datetime-local"
                      value={
                        apertura
                      }
                      onChange={(
                        evento,
                      ) =>
                        setApertura(
                          evento.target.value,
                        )
                      }
                    />
                  </label>

                  <label className="exd-campo">
                    <span>
                      Fecha límite ampliada
                    </span>

                    <input
                      type="datetime-local"
                      value={
                        limite
                      }
                      onChange={(
                        evento,
                      ) =>
                        setLimite(
                          evento.target.value,
                        )
                      }
                    />
                  </label>

                  <label className="exd-campo">
                    <span>
                      Máximo retraso ampliado
                    </span>

                    <input
                      type="datetime-local"
                      value={
                        maxRetraso
                      }
                      onChange={(
                        evento,
                      ) =>
                        setMaxRetraso(
                          evento.target.value,
                        )
                      }
                    />
                  </label>
                </div>

                <label className="exd-campo exd-campo--motivo">
                  <span>
                    Motivo (opcional)
                  </span>

                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder="Añade una breve justificación de la ampliación"
                    value={
                      motivo
                    }
                    onChange={(
                      evento,
                    ) =>
                      setMotivo(
                        evento.target.value,
                      )
                    }
                  />
                </label>
              </div>
            </section>
          ) : (
            <section className="exd-panel exd-panel--historial">
              <div className="exd-titulo">
                <RotateCcw
                  size={18}
                />

                <div>
                  <strong>
                    Extensiones aplicadas
                  </strong>

                  <small>
                    Historial de ampliaciones registradas para esta tarea
                  </small>
                </div>
              </div>

              {
                extensiones.length ===
                0 ? (
                  <div className="exd-historial-vacio">
                    <RotateCcw
                      size={24}
                    />

                    <strong>
                      Aún no hay extensiones
                    </strong>

                    <p>
                      Cuando apliques una ampliación de plazo aparecerá aquí.
                    </p>
                  </div>
                ) : (
                  <div className="exd-historial-lista">
                    {
                      extensiones.map(
                        (
                          ext,
                        ) => (
                          <article
                            key={
                              ext.id
                            }
                            className={
                              `exd-extension${ext.activo ? '' : ' exd-extension--inactiva'}`
                            }
                          >
                            <header>
                              <span
                                className={`exd-extension-estado${ext.activo ? ' on' : ''}`}
                              >
                                {
                                  ext.activo
                                    ? 'Activa'
                                    : 'Revocada'
                                }
                              </span>

                              {
                                ext.activo && (
                                  <button
                                    type="button"
                                    className="exd-revocar"
                                    title="Revocar extensión"
                                    onClick={() =>
                                      revocar(
                                        ext.id,
                                      )
                                    }
                                  >
                                    <Trash2
                                      size={15}
                                    />

                                    Revocar
                                  </button>
                                )
                              }
                            </header>

                            <p className="exd-extension-bene">
                              {
                                nombreEstudiantes(
                                  ext.beneficiarios,
                                )
                              }
                            </p>

                            <ul className="exd-extension-fechas">
                              {
                                ext.fechaAperturaExtendida && (
                                  <li>
                                    <AlarmClock
                                      size={14}
                                    />

                                    <span>
                                      <strong>
                                        Apertura
                                      </strong>
                                      {
                                        fecha(
                                          ext.fechaAperturaExtendida,
                                        )
                                      }
                                    </span>
                                  </li>
                                )
                              }

                              {
                                ext.fechaLimiteExtendida && (
                                  <li>
                                    <Clock3
                                      size={14}
                                    />

                                    <span>
                                      <strong>
                                        Fecha límite
                                      </strong>
                                      {
                                        fecha(
                                          ext.fechaLimiteExtendida,
                                        )
                                      }
                                    </span>
                                  </li>
                                )
                              }

                              {
                                ext.fechaMaximaRetrasoExtendida && (
                                  <li>
                                    <Lock
                                      size={14}
                                    />

                                    <span>
                                      <strong>
                                        Máximo retraso
                                      </strong>
                                      {
                                        fecha(
                                          ext.fechaMaximaRetrasoExtendida,
                                        )
                                      }
                                    </span>
                                  </li>
                                )
                              }
                            </ul>

                            {
                              ext.motivo && (
                                <p className="exd-extension-motivo">
                                  {
                                    ext.motivo
                                  }
                                </p>
                              )
                            }

                            <footer>
                              Por{' '}
                              {
                                nombreCompleto(
                                  ext.autorizadoPor,
                                )
                              }{' '}
                              ·{' '}
                              {
                                fecha(
                                  ext.creadoEn,
                                )
                              }
                            </footer>
                          </article>
                        ),
                      )
                    }
                  </div>
                )
              }
            </section>
          )}
        </div>
      </AulaModal>

      <Toast
        visible={
          toast.visible
        }
        tipo={
          toast.tipo
        }
        titulo={
          toast.titulo
        }
        mensaje={
          toast.mensaje
        }
        onCerrar={() =>
          setToast({
            visible:
              false,

            tipo:
              'informacion',

            titulo:
              '',
          })
        }
      />

      <style>
        {
          styles
        }
      </style>
    </>
  );
}

const styles = `
  .exd-open {
    display: none;
  }

  .exd-contenido {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-height: 0;
    max-height: min(68vh, 680px);
  }

  .exd-tabs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
    padding: 4px 6px 0;
    border-bottom: 1px solid var(--app-border-soft);
    background: transparent;
  }

  .exd-tabs button {
    position: relative;
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 12px 10px;
    border: 0;
    border-radius: 10px 10px 0 0;
    background: transparent;
    color: var(--app-text-secondary);
    font: inherit;
    font-size: var(--app-font-sm);
    font-weight: 800;
    cursor: pointer;
    outline: none;
    transition:
      color 150ms ease,
      background 150ms ease;
  }

  .exd-tabs button::after {
    content: '';
    position: absolute;
    left: 14px;
    right: 14px;
    bottom: -1px;
    height: 3px;
    border-radius: 999px 999px 0 0;
    background: transparent;
    transition: background 150ms ease;
  }

  .exd-tabs button:hover:not(.activo) {
    color: var(--app-accent-dark);
    background: var(--app-accent-softer);
  }

  .exd-tabs button.activo {
    color: var(--app-accent-dark);
    background: var(--app-accent-softer);
  }

  .exd-tabs button.activo::after {
    background: var(--app-accent);
  }

  .exd-tabs button:focus-visible {
    box-shadow:
      inset 0 0 0 2px
      color-mix(
        in srgb,
        var(--app-accent) 18%,
        transparent
      );
  }

  .exd-tabs__contador {
    min-width: 20px;
    height: 20px;
    display: inline-grid;
    place-items: center;
    padding: 0 6px;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 0.66rem;
    font-weight: 900;
  }

  .exd-panel {
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-right: 4px;
    scrollbar-width: thin;
    scrollbar-color: var(--app-accent-soft) transparent;
  }

  .exd-panel::-webkit-scrollbar,
  .exd-lista::-webkit-scrollbar,
  .exd-historial-lista::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .exd-panel::-webkit-scrollbar-thumb,
  .exd-lista::-webkit-scrollbar-thumb,
  .exd-historial-lista::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: var(--app-accent-soft);
  }

  .exd-panel::-webkit-scrollbar-track,
  .exd-lista::-webkit-scrollbar-track,
  .exd-historial-lista::-webkit-scrollbar-track {
    background: transparent;
  }

  .exd-seccion,
  .exd-panel--historial {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    border: 1px solid var(--app-border-soft);
    border-radius: 15px;
    background: var(--app-surface-raised);
  }

  .exd-titulo {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .exd-titulo > svg {
    width: 34px;
    height: 34px;
    padding: 8px;
    border: 1px solid var(--app-accent-soft);
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-accent-softer);
    flex-shrink: 0;
  }

  .exd-titulo div {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .exd-titulo strong {
    color: var(--app-text);
    font-size: 0.9rem;
    font-weight: 850;
  }

  .exd-titulo small {
    color: var(--app-text-soft);
    font-size: 0.74rem;
  }

  .exd-modos {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .exd-modos button {
    min-height: 70px;
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 11px 13px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface);
    color: var(--app-text-secondary);
    font: inherit;
    text-align: left;
    cursor: pointer;
    outline: none;
    transition:
      border-color 150ms ease,
      background 150ms ease,
      box-shadow 150ms ease;
  }

  .exd-modos button:hover {
    border-color: var(--app-accent-soft);
    background: var(--app-surface-alt);
  }

  .exd-modos button.activo {
    border-color: var(--app-accent);
    background: var(--app-accent-softer);
    box-shadow:
      0 0 0 1px
      color-mix(
        in srgb,
        var(--app-accent) 8%,
        transparent
      );
  }

  .exd-modos button:focus-visible {
    box-shadow:
      0 0 0 3px
      color-mix(
        in srgb,
        var(--app-accent) 12%,
        transparent
      );
  }

  .exd-modos__radio {
    width: 18px;
    height: 18px;
    flex: 0 0 18px;
    border: 2px solid var(--app-border-strong);
    border-radius: 50%;
    background: var(--app-surface);
    box-shadow: inset 0 0 0 4px var(--app-surface);
  }

  .exd-modos button.activo .exd-modos__radio {
    border-color: var(--app-accent);
    background: var(--app-accent);
  }

  .exd-modos button > span:last-child {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  .exd-modos strong {
    color: var(--app-text);
    font-size: 0.82rem;
  }

  .exd-modos small {
    color: var(--app-text-muted);
    font-size: 0.72rem;
    line-height: 1.4;
  }

  .exd-resumen-todos {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 10px 12px;
    border: 1px solid var(--app-accent-soft);
    border-radius: 11px;
    color: var(--app-text-secondary);
    background: var(--app-accent-softer);
    font-size: 0.78rem;
  }

  .exd-resumen-todos svg {
    color: var(--app-accent-dark);
    flex-shrink: 0;
  }

  .exd-resumen-todos strong {
    color: var(--app-text);
  }

  .exd-personalizado {
    display: grid;
    gap: 10px;
  }

  .exd-personalizado__cabecera {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .exd-personalizado__cabecera > span {
    color: var(--app-text-secondary);
    font-size: 0.76rem;
    font-weight: 800;
  }

  .exd-personalizado__cabecera > strong {
    padding: 4px 9px;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-softer);
    font-size: 0.7rem;
  }

  .exd-buscar {
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 12px;
    border: 1px solid var(--app-input-border);
    border-radius: 12px;
    color: var(--app-text-soft);
    background: var(--app-input-bg);
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease;
  }

  .exd-buscar:focus-within {
    border-color: var(--app-accent);
    box-shadow: 0 0 0 3px var(--app-accent-softer);
  }

  .exd-buscar input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: none;
    color: var(--app-text);
    font: inherit;
    font-size: 0.82rem;
    background: transparent;
  }

  .exd-lista {
    max-height: 190px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    padding: 8px;
    border: 1px solid var(--app-border-soft);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .exd-fila {
    min-width: 0;
    min-height: 46px;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    border: 1px solid var(--app-border-soft);
    border-radius: 10px;
    color: var(--app-text);
    font-size: 0.8rem;
    cursor: pointer;
    background: var(--app-surface-raised);
    transition:
      border-color 150ms ease,
      background 150ms ease;
  }

  .exd-fila:hover {
    border-color: var(--app-accent-soft);
    background: var(--app-surface);
  }

  .exd-fila--activa {
    border-color: var(--app-accent);
    background: var(--app-accent-softer);
  }

  .exd-fila input {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    accent-color: var(--app-accent);
  }

  .exd-fila-nombre {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 650;
  }

  .exd-fila-check {
    color: var(--app-accent-dark);
  }

  .exd-fechas-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .exd-campo {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .exd-campo span {
    color: var(--app-text-secondary);
    font-size: 0.73rem;
    font-weight: 800;
  }

  .exd-campo input,
  .exd-campo textarea {
    width: 100%;
    min-height: 42px;
    padding: 9px 11px;
    border: 1px solid var(--app-input-border);
    border-radius: 11px;
    color: var(--app-text);
    font: inherit;
    font-size: 0.82rem;
    background: var(--app-input-bg);
    outline: none;
    resize: vertical;
  }

  .exd-campo textarea {
    min-height: 82px;
    max-height: 140px;
    line-height: 1.45;
  }

  .exd-campo input:focus,
  .exd-campo textarea:focus {
    border-color: var(--app-accent);
    box-shadow: 0 0 0 3px var(--app-accent-softer);
  }

  .exd-historial-vacio {
    min-height: 220px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 8px;
    padding: 24px;
    border: 1px dashed var(--app-border);
    border-radius: 12px;
    color: var(--app-text-muted);
    text-align: center;
    background: var(--app-surface-alt);
  }

  .exd-historial-vacio svg {
    color: var(--app-accent-dark);
  }

  .exd-historial-vacio strong {
    color: var(--app-text);
    font-size: 0.86rem;
  }

  .exd-historial-vacio p {
    margin: 0;
    max-width: 420px;
    font-size: 0.76rem;
    line-height: 1.5;
  }

  .exd-historial-lista {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .exd-extension {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 13px;
    border: 1px solid var(--app-border-soft);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .exd-extension--inactiva {
    opacity: 0.6;
  }

  .exd-extension header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .exd-extension-estado {
    padding: 4px 9px;
    border-radius: 999px;
    color: var(--app-text-soft);
    background: var(--app-border-soft);
    font-size: 0.65rem;
    font-weight: 850;
    text-transform: uppercase;
  }

  .exd-extension-estado.on {
    color: #047857;
    background: #d1fae5;
  }

  .exd-revocar {
    min-height: 30px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 9px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--app-danger) 25%,
        var(--app-border)
      );
    border-radius: 9px;
    color: var(--app-danger);
    background: var(--app-surface);
    font: inherit;
    font-size: 0.7rem;
    font-weight: 800;
    cursor: pointer;
  }

  .exd-revocar:hover {
    border-color: var(--app-danger);
    background: var(--app-danger-soft);
  }

  .exd-extension-bene {
    margin: 0;
    color: var(--app-text);
    font-size: 0.8rem;
    font-weight: 800;
    line-height: 1.45;
  }

  .exd-extension-fechas {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 7px;
  }

  .exd-extension-fechas li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    color: var(--app-text-secondary);
    font-size: 0.74rem;
  }

  .exd-extension-fechas li span {
    display: grid;
    gap: 1px;
  }

  .exd-extension-fechas li strong {
    color: var(--app-text);
    font-size: 0.68rem;
  }

  .exd-extension-fechas svg {
    margin-top: 2px;
    color: var(--app-accent-dark);
    flex-shrink: 0;
  }

  .exd-extension-motivo {
    margin: 0;
    padding: 8px 10px;
    border-radius: 8px;
    color: var(--app-text-secondary);
    background: var(--app-accent-softer);
    font-size: 0.73rem;
    line-height: 1.45;
  }

  .exd-extension footer {
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px solid var(--app-border-soft);
    color: var(--app-text-muted);
    font-size: 0.67rem;
  }

  .exd-vacio {
    grid-column: 1 / -1;
    margin: 0;
    padding: 18px 12px;
    color: var(--app-text-muted);
    font-size: 0.76rem;
    text-align: center;
  }

  .exd-footer {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 2px 0;
  }

  .exd-footer-accion {
    display: inline-flex;
    width: auto;
    background: transparent !important;
    border: 0 !important;
    padding: 0 !important;
  }

  .exd-footer .exd-footer-accion > .exd-accion-secundaria,
  .exd-footer .exd-footer-accion > .exd-accion-primaria {
    width: auto !important;
    min-width: 0 !important;
    min-height: 38px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 7px !important;
    padding: 7px 14px !important;
    border-radius: 10px !important;
    font: inherit !important;
    font-size: 0.78rem !important;
    font-weight: 800 !important;
    cursor: pointer !important;
    outline: none !important;
    box-shadow: none !important;
    transform: none !important;
  }

  .exd-footer .exd-footer-accion > .exd-accion-secundaria {
    border: 1px solid var(--app-border) !important;
    color: var(--app-text-secondary) !important;
    background: #ffffff !important;
  }

  .exd-footer .exd-footer-accion > .exd-accion-secundaria:hover {
    border-color: var(--app-accent-soft) !important;
    color: var(--app-accent-dark) !important;
    background: var(--app-accent-softer) !important;
  }

  .exd-footer .exd-footer-accion > .exd-accion-primaria {
    border: 1px solid var(--app-accent) !important;
    color: #ffffff !important;
    background: var(--app-accent) !important;
  }

  .exd-footer .exd-footer-accion > .exd-accion-primaria svg {
    color: #ffffff !important;
    stroke: currentColor !important;
  }

  .exd-footer .exd-footer-accion > .exd-accion-primaria:hover:not(:disabled) {
    border-color: var(--app-accent-dark) !important;
    color: #ffffff !important;
    background: var(--app-accent-dark) !important;
  }

  .exd-footer .exd-footer-accion > button:focus-visible {
    box-shadow:
      0 0 0 3px
      color-mix(
        in srgb,
        var(--app-accent) 10%,
        transparent
      ) !important;
  }

  .exd-footer .exd-footer-accion > button:disabled {
    opacity: 0.5 !important;
    cursor: not-allowed !important;
  }

  @media (max-width: 900px) {
    .exd-fechas-grid,
    .exd-modos,
    .exd-lista,
    .exd-historial-lista {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .exd-tabs {
      grid-template-columns: 1fr;
    }

    .exd-contenido {
      max-height: 68vh;
    }

    .exd-seccion,
    .exd-panel--historial {
      padding: 13px;
    }

    .exd-footer {
      flex-direction: column-reverse;
      align-items: stretch;
    }

    .exd-footer-accion {
      width: 100%;
    }

    .exd-footer .exd-footer-accion > .exd-accion-secundaria,
    .exd-footer .exd-footer-accion > .exd-accion-primaria {
      width: 100% !important;
    }
  }
`;
