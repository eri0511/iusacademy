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

  const aplicar =
    async () => {
      if (
        seleccionados.length ===
        0
      ) {
        mostrarToast(
          'advertencia',
          'Selecciona al menos un estudiante',
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
            seleccionados,

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
          `Se amplió el plazo para ${seleccionados.length} estudiante(s).`,
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
            <button
              type="button"
              className="exd-boton exd-boton--ghost"
              onClick={
                onCerrar
              }
            >
              Cerrar
            </button>

            <button
              type="button"
              className="exd-boton exd-boton--primario"
              disabled={
                cargando ||
                procesando ||
                seleccionados.length ===
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
          </div>
        }
      >
        <div className="exd-grid">
          <section className="exd-form">
            <div className="exd-titulo">
              <Users
                size={18}
              />

              <div>
                <strong>
                  Beneficiarios
                </strong>

                <small>
                  {
                    seleccionados.length
                  }{' '}
                  seleccionado(s)
                </small>
              </div>
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
                    No hay estudiantes inscritos en este curso.
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

            <div className="exd-titulo exd-titulo--mt">
              <AlarmClock
                size={18}
              />

              <div>
                <strong>
                  Nuevas fechas
                </strong>

                <small>
                  Deja vacío lo que no cambie
                </small>
              </div>
            </div>

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

            <label className="exd-campo">
              <span>
                Motivo (opcional)
              </span>

              <textarea
                rows={2}
                maxLength={500}
                placeholder="Justificación de la ampliación"
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
          </section>

          <section className="exd-historial">
            <div className="exd-titulo">
              <RotateCcw
                size={18}
              />

              <div>
                <strong>
                  Extensiones aplicadas
                </strong>

                <small>
                  Historial de ampliaciones
                </small>
              </div>
            </div>

            {
              extensiones.length ===
              0 ? (
                <p className="exd-vacio">
                  Todavía no hay extensiones para esta tarea.
                </p>
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
                              ext.fechaLimiteExtendida && (
                                <li>
                                  <Clock3
                                    size={14}
                                  />

                                  Límite:{' '}
                                  {
                                    fecha(
                                      ext.fechaLimiteExtendida,
                                    )
                                  }
                                </li>
                              )
                            }

                            {
                              ext.fechaMaximaRetrasoExtendida && (
                                <li>
                                  <Lock
                                    size={14}
                                  />

                                  Tope retraso:{' '}
                                  {
                                    fecha(
                                      ext.fechaMaximaRetrasoExtendida,
                                    )
                                  }
                                </li>
                              )
                            }

                            {
                              ext.fechaAperturaExtendida && (
                                <li>
                                  <AlarmClock
                                    size={14}
                                  />

                                  Apertura:{' '}
                                  {
                                    fecha(
                                      ext.fechaAperturaExtendida,
                                    )
                                  }
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

  .exd-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    min-height: 0;
    height: 100%;
    max-height: 560px;
  }

  .exd-form,
  .exd-historial {
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
    border: 1px solid var(--app-border-soft);
    border-radius: 16px;
    background: var(--app-surface);
  }

  .exd-historial {
    overflow: hidden;
  }

  .exd-titulo {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .exd-titulo--mt {
    margin-top: 6px;
  }

  .exd-titulo > svg {
    color: var(--app-accent-dark);
  }

  .exd-titulo div {
    display: flex;
    flex-direction: column;
  }

  .exd-titulo strong {
    color: var(--app-text);
    font-size: 14px;
    font-weight: 800;
  }

  .exd-titulo small {
    color: var(--app-text-soft);
    font-size: 11px;
  }

  .exd-buscar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 11px;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    color: var(--app-text-soft);
    background: var(--app-surface-alt);
  }

  .exd-buscar input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: none;
    color: var(--app-text);
    font-size: 13px;
    background: transparent;
  }

  .exd-lista {
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
    border: 1px solid var(--app-border-soft);
    border-radius: 12px;
    padding: 8px;
    max-height: 210px;
    background: var(--app-surface-alt);
  }

  .exd-fila {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border: 1px solid transparent;
    border-radius: 10px;
    color: var(--app-text);
    font-size: 13px;
    cursor: pointer;
    background: transparent;
    transition: all .15s ease;
  }

  .exd-fila:hover {
    background: var(--app-border-soft);
  }

  .exd-fila--activa {
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .exd-fila input {
    accent-color: var(--app-accent);
    width: 16px;
    height: 16px;
  }

  .exd-fila-nombre {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exd-fila-check {
    color: var(--app-accent-dark);
    flex-shrink: 0;
  }

  .exd-campo {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .exd-campo span {
    color: var(--app-text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .exd-campo input,
  .exd-campo textarea {
    width: 100%;
    padding: 9px 11px;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    color: var(--app-text);
    font-size: 13px;
    background: var(--app-surface-alt);
    outline: none;
    resize: vertical;
    font-family: inherit;
  }

  .exd-campo input:focus,
  .exd-campo textarea:focus {
    border-color: var(--app-accent);
  }

  .exd-historial-lista {
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-right: 2px;
  }

  .exd-extension {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--app-border-soft);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .exd-extension--inactiva {
    opacity: .6;
  }

  .exd-extension header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .exd-extension-estado {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 9px;
    border-radius: 999px;
    color: var(--app-text-soft);
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .05em;
    background: var(--app-border-soft);
  }

  .exd-extension-estado.on {
    color: #047857;
    background: #d1fae5;
  }

  .exd-revocar {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 9px;
    border: 1px solid var(--app-border);
    border-radius: 9px;
    color: var(--app-danger);
    font-size: 11px;
    font-weight: 700;
    background: var(--app-surface);
    cursor: pointer;
  }

  .exd-revocar:hover {
    background: var(--app-danger-bg);
  }

  .exd-extension-bene {
    margin: 0;
    color: var(--app-text);
    font-size: 13px;
    font-weight: 700;
  }

  .exd-extension-fechas {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .exd-extension-fechas li {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--app-text-soft);
    font-size: 12px;
  }

  .exd-extension-fechas svg {
    color: var(--app-accent-dark);
    flex-shrink: 0;
  }

  .exd-extension-motivo {
    margin: 0;
    padding: 8px 10px;
    border-left: 3px solid var(--app-accent);
    border-radius: 0 8px 8px 0;
    color: var(--app-text-soft);
    font-size: 12px;
    font-style: italic;
    background: var(--app-accent-soft);
  }

  .exd-extension footer {
    color: var(--app-text-soft);
    font-size: 10px;
  }

  .exd-vacio {
    margin: 0;
    padding: 14px;
    color: var(--app-text-soft);
    font-size: 12px;
    text-align: center;
  }

  .exd-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    width: 100%;
  }

  .exd-boton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 9px 16px;
    border-radius: 11px;
    border: 1px solid transparent;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    transition: all .15s ease;
  }

  .exd-boton--ghost {
    color: var(--app-text-soft);
    background: transparent;
    border-color: var(--app-border);
  }

  .exd-boton--primario {
    color: #fff;
    background: var(--app-accent);
  }

  .exd-boton--primario:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  @media (max-width: 860px) {
    .exd-grid {
      grid-template-columns: 1fr;
      max-height: none;
      overflow-y: auto;
    }

    .exd-historial {
      max-height: 320px;
    }
  }
`;
