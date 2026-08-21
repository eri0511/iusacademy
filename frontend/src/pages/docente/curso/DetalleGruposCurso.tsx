import {
  CalendarDays,
  ChevronRight,
  Crown,
  Download,
  Lock,
  Pencil,
  Save,
  Scale,
  Sparkles,
  Unlock,
  UserRoundCog,
  UsersRound,
  X,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  CSSProperties,
  ReactNode,
} from 'react';

import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import jsPDF from 'jspdf';

import {
  useAulaContext,
} from '../../../contexts/AulaContext';

import useGruposCurso from '../../../hooks/useGruposCurso';

import type {
  GrupoCursoDetalle,
} from '../../../types/grupos.types';

function nombreCompleto(
  persona: {
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string | null;
  },
): string {
  return [
    persona.nombres,
    persona.apellidoPaterno,
    persona.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(' ');
}

function obtenerIniciales(
  nombres: string,
  apellido: string,
): string {
  return `${nombres.charAt(0)}${apellido.charAt(0)}`
    .toUpperCase();
}

function formatearFecha(
  valor: string,
): string {
  return new Intl.DateTimeFormat(
    'es-BO',
    {
      dateStyle: 'medium',
    },
  ).format(
    new Date(valor),
  );
}

function limpiarNombreArchivo(
  valor: string,
): string {
  return valor
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .replace(
      /[^a-zA-Z0-9-_]+/g,
      '-',
    )
    .replace(
      /-+/g,
      '-',
    )
    .replace(
      /^-|-$/g,
      '',
    )
    .toLowerCase();
}

export default function DetalleGruposCurso() {
  const navigate =
    useNavigate();

  const [
    searchParams,
    setSearchParams,
  ] =
    useSearchParams();

  const {
    conjuntoId,
  } =
    useParams();

  const {
    curso,
    hitoSeleccionado,
  } =
    useAulaContext();

  const id =
    Number(
      conjuntoId,
    );

  const {
    detalle,
    cargando,
    actualizando,
    procesando,
    error,
    cargarDetalle,
    editarConjunto,
    editarGrupo,
    moverEstudiante,
    cambiarRepresentante,
    cambiarBloqueo,
  } =
    useGruposCurso({
      cursoId:
        curso.id,

      hitoId:
        hitoSeleccionado?.id,

      cargarAutomaticamente:
        false,
    });

  const [
    editandoConjunto,
    setEditandoConjunto,
  ] =
    useState(
      false,
    );

  const [
    nombre,
    setNombre,
  ] =
    useState(
      '',
    );

  const [
    descripcion,
    setDescripcion,
  ] =
    useState(
      '',
    );

  const [
    requiereRepresentante,
    setRequiereRepresentante,
  ] =
    useState(
      false,
    );

  const [
    exportandoPdf,
    setExportandoPdf,
  ] =
    useState(
      false,
    );

  useEffect(
    () => {
      if (
        !Number.isInteger(
          id,
        ) ||
        id < 1
      ) {
        navigate(
          '..',
          {
            replace:
              true,
          },
        );

        return;
      }

      void cargarDetalle(
        id,
      );
    },
    [
      cargarDetalle,
      id,
      navigate,
    ],
  );

  useEffect(
    () => {
      if (!detalle) {
        return;
      }

      setNombre(
        detalle.conjunto.nombre,
      );

      setDescripcion(
        detalle.conjunto.descripcion ??
          '',
      );

      setRequiereRepresentante(
        detalle.conjunto.requiereRepresentante,
      );

      if (
        searchParams.get(
          'editar',
        ) ===
        '1'
      ) {
        setEditandoConjunto(
          true,
        );
      }
    },
    [
      detalle,
      searchParams,
    ],
  );

  const totalRepresentantes =
    useMemo(
      () =>
        detalle?.conjunto.grupos.reduce(
          (
            total,
            grupo,
          ) =>
            total +
            grupo.integrantes.filter(
              (
                integrante,
              ) =>
                integrante.esRepresentante,
            ).length,
          0,
        ) ??
        0,
      [
        detalle,
      ],
    );

  if (
    cargando ||
    !detalle
  ) {
    return (
      <section className="detalle-grupos-estado">
        <span>
          <UsersRound
            size={25}
          />
        </span>

        <div>
          <strong>
            {error
              ? 'No pudimos abrir el conjunto'
              : 'Preparando los grupos'}
          </strong>

          <p>
            {error ??
            'Estamos cargando la distribución y sus integrantes.'}
          </p>
        </div>

        <style>
          {styles}
        </style>
      </section>
    );
  }

  const conjunto =
    detalle.conjunto;

  const esProcesual =
    conjunto.tipoEvaluacion ===
    'PROCESUAL';

  const guardarConjunto =
    async () => {
      await editarConjunto(
        conjunto.id,
        {
          nombre:
            nombre.trim(),

          descripcion:
            descripcion.trim() ||
            null,

          requiereRepresentante,
        },
      );

      setEditandoConjunto(
        false,
      );

      setSearchParams(
        {},
        {
          replace:
            true,
        },
      );
    };

  const exportarPdf =
    async () => {
      try {
        setExportandoPdf(
          true,
        );

        const pdf =
          new jsPDF({
            orientation:
              'portrait',
            unit:
              'mm',
            format:
              'a4',
          });

        const anchoPagina =
          pdf.internal.pageSize.getWidth();

        const altoPagina =
          pdf.internal.pageSize.getHeight();

        const margen =
          16;

        let y =
          18;

        const verificarPagina =
          (
            espacio:
              number,
          ) => {
            if (
              y +
                espacio >
              altoPagina -
                18
            ) {
              pdf.addPage();

              y =
                18;
            }
          };

        pdf.setFillColor(
          248,
          139,
          75,
        );

        pdf.roundedRect(
          margen,
          y,
          anchoPagina -
            margen *
              2,
          25,
          4,
          4,
          'F',
        );

        pdf.setTextColor(
          255,
          255,
          255,
        );

        pdf.setFont(
          'helvetica',
          'bold',
        );

        pdf.setFontSize(
          17,
        );

        pdf.text(
          'IusAcademy',
          margen +
            7,
          y +
            10,
        );

        pdf.setFontSize(
          10,
        );

        pdf.setFont(
          'helvetica',
          'normal',
        );

        pdf.text(
          'Reporte de conformacion de grupos',
          margen +
            7,
          y +
            18,
        );

        y +=
          35;

        pdf.setTextColor(
          15,
          23,
          42,
        );

        pdf.setFont(
          'helvetica',
          'bold',
        );

        pdf.setFontSize(
          18,
        );

        pdf.text(
          pdf.splitTextToSize(
            conjunto.nombre,
            anchoPagina -
              margen *
                2,
          ),
          margen,
          y,
        );

        y +=
          14;

        pdf.setFont(
          'helvetica',
          'normal',
        );

        pdf.setFontSize(
          9,
        );

        pdf.setTextColor(
          71,
          85,
          105,
        );

        const datos = [
          `Materia: ${curso.materia.nombre}`,
          `Gestion: ${curso.gestion} | Paralelo: ${curso.paralelo}`,
          `Evaluacion: ${esProcesual ? 'Procesual' : 'Continua'}`,
          `Estado: ${conjunto.estaBloqueado ? 'Bloqueado' : 'Editable'}`,
          `Total: ${conjunto.totalGrupos} grupos y ${conjunto.totalIntegrantes} integrantes`,
        ];

        datos.forEach(
          (
            linea,
          ) => {
            pdf.text(
              linea,
              margen,
              y,
            );

            y +=
              5.5;
          },
        );

        y +=
          6;

        conjunto.grupos.forEach(
          (
            grupo,
            indiceGrupo,
          ) => {
            verificarPagina(
              20 +
                grupo.integrantes.length *
                  9,
            );

            pdf.setFillColor(
              248,
              250,
              252,
            );

            pdf.roundedRect(
              margen,
              y,
              anchoPagina -
                margen *
                  2,
              11,
              3,
              3,
              'F',
            );

            pdf.setTextColor(
              15,
              23,
              42,
            );

            pdf.setFont(
              'helvetica',
              'bold',
            );

            pdf.setFontSize(
              11,
            );

            pdf.text(
              `${indiceGrupo + 1}. ${grupo.nombre}`,
              margen +
                4,
              y +
                7,
            );

            y +=
              16;

            grupo.integrantes.forEach(
              (
                integrante,
                indiceIntegrante,
              ) => {
                verificarPagina(
                  10,
                );

                pdf.setFontSize(
                  9,
                );

                pdf.setTextColor(
                  30,
                  41,
                  59,
                );

                pdf.text(
                  `${indiceIntegrante + 1}. ${nombreCompleto(
                    integrante.estudiante,
                  )}`,
                  margen +
                    5,
                  y,
                );

                if (
                  integrante.esRepresentante
                ) {
                  pdf.setTextColor(
                    180,
                    83,
                    9,
                  );

                  pdf.text(
                    'Representante',
                    anchoPagina -
                      margen -
                      5,
                    y,
                    {
                      align:
                        'right',
                    },
                  );
                }

                y +=
                  6;
              },
            );

            y +=
              3;
          },
        );

        const paginas =
          pdf.getNumberOfPages();

        for (
          let pagina =
            1;
          pagina <=
          paginas;
          pagina +=
            1
        ) {
          pdf.setPage(
            pagina,
          );

          pdf.setFontSize(
            8,
          );

          pdf.setTextColor(
            148,
            163,
            184,
          );

          pdf.text(
            `Generado por IusAcademy - Pagina ${pagina} de ${paginas}`,
            anchoPagina /
              2,
            altoPagina -
              8,
            {
              align:
                'center',
            },
          );
        }

        pdf.save(
          `${limpiarNombreArchivo(
            conjunto.nombre,
          ) || 'grupos'}-iusacademy.pdf`,
        );
      } finally {
        setExportandoPdf(
          false,
        );
      }
    };

  return (
    <section
      className={`detalle-grupos ${
        esProcesual
          ? 'procesual'
          : 'continua'
      }`}
    >
      <nav
        className="detalle-grupos__miga"
        aria-label="Ubicación"
      >
        <button
          type="button"
          onClick={() =>
            navigate(
              `/docente/cursos/${curso.id}/grupos`,
            )
          }
        >
          Grupos del curso
        </button>

        <ChevronRight
          size={14}
        />

        <span>
          {conjunto.nombre}
        </span>
      </nav>

      <header className="detalle-grupos__hero">
        <div className="detalle-grupos__identidad">
          <span className="detalle-grupos__icono-principal">
            {esProcesual ? (
              <Scale
                size={27}
              />
            ) : (
              <Sparkles
                size={27}
              />
            )}
          </span>

          <div>
            <div className="detalle-grupos__etiquetas">
              <span
                className={`detalle-etiqueta ${
                  esProcesual
                    ? 'procesual'
                    : 'continua'
                }`}
              >
                {esProcesual
                  ? 'Evaluación procesual'
                  : 'Evaluación continua'}
              </span>

              <span className="detalle-etiqueta alcance">
                {conjunto.alcance ===
                'CURSO'
                  ? 'Todo el semestre'
                  : conjunto.hito
                    ? `${conjunto.hito.codigo} · ${conjunto.hito.nombre}`
                    : 'Hito académico'}
              </span>
            </div>

            {editandoConjunto ? (
              <div className="detalle-grupos__edicion">
                <input
                  value={
                    nombre
                  }
                  maxLength={
                    120
                  }
                  onChange={(
                    evento,
                  ) =>
                    setNombre(
                      evento.target.value,
                    )
                  }
                />

                <textarea
                  value={
                    descripcion
                  }
                  maxLength={
                    500
                  }
                  placeholder="Descripción opcional"
                  onChange={(
                    evento,
                  ) =>
                    setDescripcion(
                      evento.target.value,
                    )
                  }
                />

                <label className="detalle-grupos__representante-check">
                  <input
                    type="checkbox"
                    checked={
                      requiereRepresentante
                    }
                    onChange={(
                      evento,
                    ) =>
                      setRequiereRepresentante(
                        evento.target.checked,
                      )
                    }
                  />

                  <span>
                    <strong>
                      Utilizar representantes
                    </strong>

                    <small>
                      Permite asignar un representante dentro de cada grupo.
                    </small>
                  </span>
                </label>
              </div>
            ) : (
              <>
                <h1>
                  {conjunto.nombre}
                </h1>

                <p>
                  {conjunto.descripcion ||
                  'Conjunto académico organizado para actividades colaborativas del curso.'}
                </p>
              </>
            )}

            <small className="detalle-grupos__actualizacion">
              <CalendarDays
                size={14}
              />

              Actualizado
              {' '}
              {formatearFecha(
                conjunto.actualizadoEn,
              )}
            </small>
          </div>
        </div>

        <div className="detalle-grupos__acciones">
          {editandoConjunto ? (
            <>
              <button
                type="button"
                className="detalle-boton secundario"
                onClick={() => {
                  setNombre(
                    conjunto.nombre,
                  );

                  setDescripcion(
                    conjunto.descripcion ??
                      '',
                  );

                  setRequiereRepresentante(
                    conjunto.requiereRepresentante,
                  );

                  setEditandoConjunto(
                    false,
                  );

                  setSearchParams(
                    {},
                    {
                      replace:
                        true,
                    },
                  );
                }}
              >
                <X
                  size={17}
                />

                Cancelar
              </button>

              <button
                type="button"
                className="detalle-boton primario"
                disabled={
                  procesando ||
                  nombre.trim().length <
                    3
                }
                onClick={() =>
                  void guardarConjunto()
                }
              >
                <Save
                  size={17}
                />

                Guardar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="detalle-boton secundario"
                onClick={() =>
                  setEditandoConjunto(
                    true,
                  )
                }
              >
                <Pencil
                  size={17}
                />

                Editar
              </button>

              <button
                type="button"
                className="detalle-boton secundario"
                disabled={
                  procesando
                }
                onClick={() =>
                  void cambiarBloqueo(
                    conjunto.id,
                    !conjunto.estaBloqueado,
                  )
                }
              >
                {conjunto.estaBloqueado ? (
                  <Unlock
                    size={17}
                  />
                ) : (
                  <Lock
                    size={17}
                  />
                )}

                {conjunto.estaBloqueado
                  ? 'Desbloquear'
                  : 'Bloquear'}
              </button>

              <button
                type="button"
                className="detalle-boton primario"
                disabled={
                  exportandoPdf
                }
                onClick={() =>
                  void exportarPdf()
                }
              >
                <Download
                  size={17}
                />

                {exportandoPdf
                  ? 'Generando…'
                  : 'Descargar PDF'}
              </button>
            </>
          )}
        </div>
      </header>

      <section className="detalle-grupos__resumen">
        <ResumenCard
          icono={
            <UsersRound
              size={21}
            />
          }
          valor={
            String(
              conjunto.totalGrupos,
            )
          }
          etiqueta="Grupos"
        />

        <ResumenCard
          icono={
            <UserRoundCog
              size={21}
            />
          }
          valor={
            String(
              conjunto.totalIntegrantes,
            )
          }
          etiqueta="Integrantes"
        />

        <ResumenCard
          icono={
            <Crown
              size={21}
            />
          }
          valor={
            conjunto.requiereRepresentante
              ? String(
                  totalRepresentantes,
                )
              : 'No aplica'
          }
          etiqueta="Representantes"
        />

        <ResumenCard
          icono={
            conjunto.estaBloqueado ? (
              <Lock
                size={21}
              />
            ) : (
              <Unlock
                size={21}
              />
            )
          }
          valor={
            conjunto.estaBloqueado
              ? 'Bloqueado'
              : 'Editable'
          }
          etiqueta="Estado"
          estado={
            conjunto.estaBloqueado
              ? 'bloqueado'
              : 'editable'
          }
        />
      </section>

      <section className="detalle-grupos__seccion">
        <header className="detalle-grupos__seccion-header">
          <div>
            <span>
              <UsersRound
                size={20}
              />
            </span>

            <div>
              <h2>
                Equipos del conjunto
              </h2>

              <p>
                Revisa integrantes y modifica su distribución cuando sea necesario.
              </p>
            </div>
          </div>

          <strong>
            {conjunto.totalGrupos}
            {' '}
            {conjunto.totalGrupos ===
            1
              ? 'equipo'
              : 'equipos'}
          </strong>
        </header>

        <div className="detalle-grupos__grid">
          {conjunto.grupos.map(
            (
              grupo,
            ) => (
              <GrupoPanel
                key={
                  grupo.id
                }
                grupo={
                  grupo
                }
                grupos={
                  conjunto.grupos
                }
                bloqueado={
                  conjunto.estaBloqueado
                }
                procesando={
                  procesando ||
                  actualizando
                }
                permiteRepresentantes={
                  conjunto.requiereRepresentante
                }
                onEditar={(
                  nombreGrupo,
                ) =>
                  editarGrupo(
                    conjunto.id,
                    grupo.id,
                    {
                      nombre:
                        nombreGrupo,
                    },
                  )
                }
                onMover={(
                  estudianteId,
                  grupoDestinoId,
                ) =>
                  moverEstudiante(
                    conjunto.id,
                    grupo.id,
                    {
                      estudianteId,
                      grupoDestinoId,
                    },
                  )
                }
                onRepresentante={(
                  estudianteId,
                  esRepresentante,
                ) =>
                  cambiarRepresentante(
                    conjunto.id,
                    grupo.id,
                    {
                      estudianteId,
                      esRepresentante,
                    },
                  )
                }
              />
            ),
          )}
        </div>
      </section>

      {detalle.estudiantesSinGrupo.length >
        0 && (
        <section className="detalle-grupos__sin-grupo">
          <span>
            <UserRoundCog
              size={21}
            />
          </span>

          <div>
            <h3>
              Estudiantes sin grupo
            </h3>

            <p>
              {detalle.estudiantesSinGrupo
                .map(
                  nombreCompleto,
                )
                .join(
                  ', ',
                )}
            </p>
          </div>
        </section>
      )}

      <style>
        {styles}
      </style>
    </section>
  );
}

function ResumenCard({
  icono,
  valor,
  etiqueta,
  estado,
}: {
  icono:
    ReactNode;

  valor:
    string;

  etiqueta:
    string;

  estado?:
    'editable'
    | 'bloqueado';
}) {
  return (
    <article
      className={`detalle-resumen-card ${
        estado ??
        ''
      }`}
    >
      <span>
        {icono}
      </span>

      <div>
        <strong>
          {valor}
        </strong>

        <small>
          {etiqueta}
        </small>
      </div>
    </article>
  );
}

type GrupoPanelProps = {
  grupo:
    GrupoCursoDetalle;

  grupos:
    GrupoCursoDetalle[];

  bloqueado:
    boolean;

  procesando:
    boolean;

  permiteRepresentantes:
    boolean;

  onEditar: (
    nombre:
      string,
  ) => Promise<unknown>;

  onMover: (
    estudianteId:
      number,
    grupoDestinoId:
      number,
  ) => Promise<unknown>;

  onRepresentante: (
    estudianteId:
      number,
    esRepresentante:
      boolean,
  ) => Promise<unknown>;
};

function GrupoPanel({
  grupo,
  grupos,
  bloqueado,
  procesando,
  permiteRepresentantes,
  onEditar,
  onMover,
  onRepresentante,
}: GrupoPanelProps) {
  const [
    editando,
    setEditando,
  ] =
    useState(
      false,
    );

  const [
    nombre,
    setNombre,
  ] =
    useState(
      grupo.nombre,
    );

  return (
    <article
      className="equipo-card"
      style={{
        '--equipo-color':
          grupo.color ??
          '#64748b',
      } as CSSProperties}
    >
      <header className="equipo-card__header">
        <span className="equipo-card__identificador">
          {grupo.nombre
            .replace(
              /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9]/g,
              '',
            )
            .slice(
              0,
              2,
            )
            .toUpperCase()}
        </span>

        <div>
          {editando ? (
            <input
              value={
                nombre
              }
              maxLength={
                80
              }
              autoFocus
              onChange={(
                evento,
              ) =>
                setNombre(
                  evento.target.value,
                )
              }
            />
          ) : (
            <h3>
              {grupo.nombre}
            </h3>
          )}

          <small>
            {grupo.integrantes.length}
            {' '}
            {grupo.integrantes.length ===
            1
              ? 'integrante'
              : 'integrantes'}
          </small>
        </div>

        {!bloqueado && (
          <button
            type="button"
            className="equipo-card__editar"
            disabled={
              procesando
            }
            onClick={async () => {
              if (
                editando
              ) {
                const nombreLimpio =
                  nombre.trim();

                if (
                  nombreLimpio.length >
                  1
                ) {
                  await onEditar(
                    nombreLimpio,
                  );
                }
              }

              setEditando(
                !editando,
              );
            }}
          >
            {editando ? (
              <>
                <Save
                  size={14}
                />

                Guardar
              </>
            ) : (
              <>
                <Pencil
                  size={14}
                />

                Editar
              </>
            )}
          </button>
        )}
      </header>

      <div className="equipo-card__integrantes">
        {grupo.integrantes.length ===
        0 ? (
          <div className="equipo-card__vacio">
            <UsersRound
              size={23}
            />

            <strong>
              Equipo sin integrantes
            </strong>
          </div>
        ) : (
          grupo.integrantes.map(
            (
              integrante,
            ) => (
              <article
                key={
                  integrante.id
                }
                className="integrante-card"
              >
                <span className="integrante-card__avatar">
                  {obtenerIniciales(
                    integrante.estudiante.nombres,
                    integrante.estudiante.apellidoPaterno,
                  )}
                </span>

                <div className="integrante-card__datos">
                  <strong>
                    {nombreCompleto(
                      integrante.estudiante,
                    )}
                  </strong>

                  <small>
                    {integrante.estudiante.correo}
                  </small>
                </div>

                {integrante.esRepresentante && (
                  <span className="integrante-card__representante">
                    <Crown
                      size={13}
                    />

                    Representante
                  </span>
                )}

                {!bloqueado && (
                  <div className="integrante-card__acciones">
                    {permiteRepresentantes && (
                      <button
                        type="button"
                        disabled={
                          procesando
                        }
                        onClick={() =>
                          void onRepresentante(
                            integrante.estudianteId,
                            !integrante.esRepresentante,
                          )
                        }
                      >
                        <Crown
                          size={14}
                        />

                        {integrante.esRepresentante
                          ? 'Quitar representante'
                          : 'Asignar representante'}
                      </button>
                    )}

                    <select
                      value=""
                      disabled={
                        procesando
                      }
                      onChange={(
                        evento,
                      ) => {
                        const destino =
                          Number(
                            evento.target.value,
                          );

                        if (
                          destino
                        ) {
                          void onMover(
                            integrante.estudianteId,
                            destino,
                          );
                        }
                      }}
                    >
                      <option value="">
                        Mover a…
                      </option>

                      {grupos
                        .filter(
                          (
                            otro,
                          ) =>
                            otro.id !==
                            grupo.id,
                        )
                        .map(
                          (
                            otro,
                          ) => (
                            <option
                              key={
                                otro.id
                              }
                              value={
                                otro.id
                              }
                            >
                              {otro.nombre}
                            </option>
                          ),
                        )}
                    </select>
                  </div>
                )}
              </article>
            ),
          )
        )}
      </div>
    </article>
  );
}

const styles = `
  .detalle-grupos {
    --detalle-acento: #f18b4b;
    display: grid;
    gap: 14px;
    min-width: 0;
    color: var(--app-text, #0f172a);
    font-size: 13px;
  }

  .detalle-grupos.procesual {
    --detalle-acento: #f18b4b;
  }

  .detalle-grupos-estado {
    min-height: 170px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 13px;
    padding: 22px;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 20px;
    background: var(--app-card, #fffdf9);
  }

  .detalle-grupos-estado > span {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    color: var(--app-accent-dark, #c46a2c);
    background: var(--app-accent-soft, #fff0e5);
  }

  .detalle-grupos-estado p {
    margin: 3px 0 0;
    color: var(--app-text-soft, #64748b);
    font-size: 11px;
  }

  .detalle-grupos__miga {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0 3px;
    color: var(--app-text-muted, #94a3b8);
    font-size: 10px;
  }

  .detalle-grupos__miga button {
    padding: 0;
    border: 0;
    color: var(--app-accent-dark, #c46a2c);
    background: transparent;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .detalle-grupos__hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 18px;
    align-items: start;
    padding: 20px 22px;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 20px;
    background: var(--app-card, #fffdf9);
    box-shadow: var(--app-shadow-sm, 0 8px 22px rgba(80, 43, 18, .06));
  }

  .detalle-grupos__identidad {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr);
    gap: 13px;
  }

  .detalle-grupos__icono-principal {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    border-radius: 15px;
    color: var(--detalle-acento);
    background: color-mix(in srgb, var(--detalle-acento) 11%, var(--app-card, #fffdf9));
  }

  .detalle-grupos__etiquetas {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .detalle-etiqueta {
    display: inline-flex;
    align-items: center;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 850;
  }

  .detalle-etiqueta.procesual {
    color: #c2410c;
    background: #fff0e7;
  }

  .detalle-etiqueta.continua {
    color: #c9652a;
    background: #fff0e5;
  }

  .detalle-etiqueta.alcance {
    color: var(--app-text-soft, #64748b);
    background: var(--app-surface-alt, #fffaf4);
  }

  .detalle-grupos h1 {
    margin: 8px 0 0;
    font-size: clamp(24px, 2.4vw, 32px);
    font-weight: 950;
    letter-spacing: -.035em;
  }

  .detalle-grupos__identidad p {
    max-width: 680px;
    margin: 7px 0 0;
    color: var(--app-text-soft, #64748b);
    font-size: 11px;
    line-height: 1.5;
  }

  .detalle-grupos__actualizacion {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 9px;
    color: var(--app-text-muted, #94a3b8);
    font-size: 10px;
  }

  .detalle-grupos__acciones {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    justify-content: flex-end;
  }

  .detalle-boton {
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border-radius: 10px;
    font: inherit;
    font-size: 10px;
    font-weight: 800;
    cursor: pointer;
  }

  .detalle-boton.secundario {
    border: 1px solid var(--app-border, #eadfd4);
    color: var(--app-text-secondary, #334155);
    background: var(--app-card, #fffdf9);
  }

  .detalle-boton.primario {
    border: 0;
    color: #fff;
    background: var(--detalle-acento);
  }

  .detalle-boton:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .detalle-grupos__edicion {
    display: grid;
    gap: 8px;
    margin-top: 9px;
  }

  .detalle-grupos__edicion input,
  .detalle-grupos__edicion textarea,
  .equipo-card__header input,
  .integrante-card select {
    width: 100%;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 10px;
    color: var(--app-text, #0f172a);
    background: var(--app-input-bg, #fff);
    font: inherit;
  }

  .detalle-grupos__edicion input,
  .equipo-card__header input {
    min-height: 35px;
    padding: 7px 9px;
  }

  .detalle-grupos__edicion textarea {
    min-height: 62px;
    padding: 8px 9px;
    resize: vertical;
  }

  .detalle-grupos__representante-check {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 9px 10px;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 11px;
    background: var(--app-surface-alt, #fffaf4);
  }

  .detalle-grupos__representante-check input {
    width: 16px;
    min-height: 16px;
    margin-top: 1px;
  }

  .detalle-grupos__representante-check strong,
  .detalle-grupos__representante-check small {
    display: block;
  }

  .detalle-grupos__representante-check small {
    margin-top: 2px;
    color: var(--app-text-soft, #64748b);
    font-size: 9px;
  }

  .detalle-grupos__resumen {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .detalle-resumen-card {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 15px 16px;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 14px;
    background: var(--app-card, #fffdf9);
  }

  .detalle-resumen-card > span {
    width: 44px;
    height: 44px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--detalle-acento);
    background: color-mix(in srgb, var(--detalle-acento) 9%, var(--app-card, #fffdf9));
  }

  .detalle-resumen-card strong,
  .detalle-resumen-card small {
    display: block;
  }

  .detalle-resumen-card strong {
    font-size: 17px;
    line-height: 1.05;
    font-weight: 900;
    letter-spacing: -0.01em;
  }

  .detalle-resumen-card small {
    margin-top: 4px;
    color: var(--app-text-soft, #64748b);
    font-size: 10px;
    line-height: 1.15;
    font-weight: 500;
  }

  .detalle-grupos__bloqueo {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 14px;
    background: var(--app-card, #fffdf9);
  }

  .detalle-grupos__bloqueo > span:first-child {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--app-accent-dark, #c46a2c);
    background: var(--app-accent-soft, #fff0e5);
  }

  .detalle-grupos__bloqueo p {
    margin: 2px 0 0;
    color: var(--app-text-soft, #64748b);
    font-size: 9px;
  }

  .detalle-grupos__estado {
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 850;
  }

  .detalle-grupos__estado.editable {
    color: #166534;
    background: #f0fdf4;
  }

  .detalle-grupos__estado.bloqueado {
    color: #b45309;
    background: #fffbeb;
  }

  .detalle-grupos__seccion {
    display: grid;
    gap: 10px;
  }

  .detalle-grupos__seccion-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 15px 18px;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 16px;
    background: var(--app-card, #fffdf9);
    box-shadow: var(--app-shadow-sm, 0 6px 18px rgba(80, 43, 18, .045));
  }

  .detalle-grupos__seccion-header > div {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .detalle-grupos__seccion-header > div > span {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--detalle-acento);
    background: color-mix(in srgb, var(--detalle-acento) 9%, transparent);
  }

  .detalle-grupos__seccion-header h2,
  .detalle-grupos__seccion-header p {
    margin: 0;
  }

  .detalle-grupos__seccion-header h2 {
    font-size: 16px;
    font-weight: 900;
  }

  .detalle-grupos__seccion-header p {
    color: var(--app-text-soft, #64748b);
    font-size: 10px;
    line-height: 1.35;
  }

  .detalle-grupos__seccion-header > strong {
    color: var(--app-text-secondary, #334155);
    font-size: 11px;
    font-weight: 800;
  }

  .detalle-grupos__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    align-items: start;
  }

  .equipo-card {
    position: relative;
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 16px;
    background: var(--app-card, #fffdf9);
  }

  .equipo-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 5px;
    border-radius: 16px 16px 0 0;
    background: var(--equipo-color);
  }

  .equipo-card__header {
    display: grid;
    grid-template-columns: 46px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 18px 16px 13px;
  }

  .equipo-card__identificador {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    color: var(--equipo-color);
    background: color-mix(in srgb, var(--equipo-color) 10%, var(--app-card, #fffdf9));
    font-size: 12px;
    line-height: 1;
    font-weight: 900;
  }

  .equipo-card__header h3 {
    margin: 0;
    font-size: 16px;
    line-height: 1.15;
    font-weight: 900;
  }

  .equipo-card__header small {
    display: block;
    margin-top: 3px;
    color: var(--app-text-soft, #64748b);
    font-size: 10px;
    line-height: 1.2;
  }

  .equipo-card__editar {
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 8px;
    color: var(--app-text-secondary, #334155);
    background: var(--app-surface-alt, #fffaf4);
    font: inherit;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .equipo-card__integrantes {
    padding: 0 15px 15px;
  }

  .integrante-card {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) auto;
    gap: 11px;
    align-items: center;
    padding: 14px 2px;
    border-top: 1px solid var(--app-border-soft, #f1e7dd);
  }

  .integrante-card:first-child {
    border-top: 0;
  }

  .integrante-card__avatar {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: var(--equipo-color);
    background: color-mix(in srgb, var(--equipo-color) 11%, var(--app-card, #fffdf9));
    font-size: 12px;
    line-height: 1;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  .integrante-card__datos {
    min-width: 0;
  }

  .integrante-card__datos strong,
  .integrante-card__datos small {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .integrante-card__datos strong {
    font-size: 13px;
    line-height: 1.2;
    font-weight: 850;
  }

  .integrante-card__datos small {
    margin-top: 1px;
    color: var(--app-text-soft, #64748b);
    font-size: 10px;
  }

  .integrante-card__representante {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    border-radius: 999px;
    color: var(--equipo-color);
    background: color-mix(in srgb, var(--equipo-color) 10%, var(--app-card, #fffdf9));
    font-size: 10px;
    line-height: 1;
    font-weight: 850;
  }

  .integrante-card__acciones {
    grid-column: 2 / -1;
    display: grid;
    grid-template-columns: minmax(150px, auto) minmax(0, 1fr);
    gap: 8px;
    margin-top: 2px;
  }

  .integrante-card__acciones button,
  .integrante-card__acciones select {
    min-height: 40px;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 9px;
    color: var(--app-text-secondary, #334155);
    background: var(--app-card, #fffdf9);
    font: inherit;
    font-size: 10px;
    line-height: 1.2;
  }

  .integrante-card__acciones button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 7px 10px;
    font-weight: 800;
    cursor: pointer;
  }

  .integrante-card__acciones button:first-child {
    color: var(--equipo-color);
    border-color: color-mix(in srgb, var(--equipo-color) 28%, var(--app-border, #eadfd4));
    background: color-mix(in srgb, var(--equipo-color) 5%, var(--app-card, #fffdf9));
  }

  .integrante-card__acciones select {
    width: 100%;
    padding: 7px 11px;
    cursor: pointer;
  }

  .equipo-card__vacio {
    min-height: 90px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 4px;
    color: var(--app-text-muted, #94a3b8);
    text-align: center;
  }

  .equipo-card__vacio strong {
    font-size: 10px;
  }

  .detalle-grupos__sin-grupo {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 9px;
    align-items: center;
    padding: 10px 12px;
    border: 1px dashed var(--app-warning-border, #fde68a);
    border-radius: 13px;
    background: var(--app-warning-bg, #fffbeb);
  }

  .detalle-grupos__sin-grupo > span {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: #b45309;
    background: #fef3c7;
  }

  .detalle-grupos__sin-grupo h3,
  .detalle-grupos__sin-grupo p {
    margin: 0;
  }

  .detalle-grupos__sin-grupo h3 {
    color: #b45309;
    font-size: 10px;
  }

  .detalle-grupos__sin-grupo p {
    margin-top: 2px;
    color: var(--app-text-soft, #64748b);
    font-size: 9px;
    line-height: 1.45;
  }

  @media (max-width: 1050px) {
    .detalle-grupos__hero {
      grid-template-columns: 1fr;
    }

    .detalle-grupos__acciones {
      justify-content: flex-start;
    }

    .detalle-grupos__resumen {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 800px) {
    .detalle-grupos__grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 620px) {
    .detalle-grupos__identidad {
      grid-template-columns: 1fr;
    }

    .detalle-grupos__acciones {
      display: grid;
      grid-template-columns: 1fr;
    }

    .detalle-boton {
      justify-content: center;
    }

    .detalle-grupos__resumen {
      grid-template-columns: 1fr;
    }

    .detalle-grupos__bloqueo {
      grid-template-columns: 38px minmax(0, 1fr);
    }

    .detalle-grupos__estado {
      grid-column: 1 / -1;
      width: fit-content;
    }

    .integrante-card__acciones {
      grid-column: 1 / -1;
      grid-template-columns: 1fr;
    }
  }
`;