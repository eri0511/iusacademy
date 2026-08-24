import {
  BookOpenCheck,
  FilePlus2,
  GraduationCap,
  Link2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';

import type {
  AlcanceRecursoCurso,
  CategoriaRecursoCurso,
  NuevoArchivoRecurso,
  NuevoEnlaceRecurso,
  UsoRecursoCurso,
} from '../../types/recursos/recursos.types';

import SelectorCategoriaRecurso from './SelectorCategoriaRecurso';

export type PasoFormularioRecurso =
  | 1
  | 2;

export type FormularioRecursoValor = {
  titulo:
    string;

  descripcion:
    string;

  categoria:
    CategoriaRecursoCurso;

  alcance:
    AlcanceRecursoCurso;

  uso:
    UsoRecursoCurso;

  hitoId:
    number |
    null;

  visibleParaEstudiantes:
    boolean;

  archivos:
    NuevoArchivoRecurso[];

  enlaces:
    NuevoEnlaceRecurso[];
};

type Props = {
  valor:
    FormularioRecursoValor;

  paso:
    PasoFormularioRecurso;

  hitos:
    Array<{
      id:
        number;

      codigo:
        string;

      nombre:
        string;
    }>;

  editando?:
    boolean;

  deshabilitado?:
    boolean;

  onChange:
    (
      valor:
        FormularioRecursoValor,
    ) => void;

  onAbrirCatalogoCategoria:
    () => void;
};

function esPdf(
  archivo:
    File,
) {
  return (
    archivo.type ===
      'application/pdf' ||
    archivo.name
      .toLocaleLowerCase(
        'es',
      )
      .endsWith(
        '.pdf',
      )
  );
}

function formatearTamanio(
  bytes:
    number,
) {
  if (
    bytes <=
    0
  ) {
    return '0 KB';
  }

  const megabytes =
    bytes /
    1024 /
    1024;

  if (
    megabytes >=
    1
  ) {
    return `${megabytes.toFixed(
      2,
    )} MB`;
  }

  return `${(
    bytes /
    1024
  ).toFixed(
    0,
  )} KB`;
}

export default function FormularioRecurso({
  valor,
  paso,
  hitos,
  editando = false,
  deshabilitado = false,
  onChange,
  onAbrirCatalogoCategoria,
}: Props) {
  const actualizar =
    <
      K extends keyof FormularioRecursoValor,
    >(
      campo:
        K,

      nuevoValor:
        FormularioRecursoValor[K],
    ) => {
      onChange({
        ...valor,

        [campo]:
          nuevoValor,
      });
    };

  const cambiarAlcance =
    (
      alcance:
        AlcanceRecursoCurso,
    ) => {
      onChange({
        ...valor,

        alcance,

        hitoId:
          alcance ===
          'CURSO'
            ? null
            : valor.hitoId,
      });
    };

  const cambiarUso =
    (
      uso:
        UsoRecursoCurso,
    ) => {
      const permiteQuizzes =
        uso ===
          'AULA_Y_QUIZZES' ||
        uso ===
          'SOLO_QUIZZES';

      onChange({
        ...valor,

        uso,

        visibleParaEstudiantes:
          uso ===
          'SOLO_QUIZZES'
            ? false
            : valor.uso ===
                'SOLO_QUIZZES'
              ? true
              : valor.visibleParaEstudiantes,

        archivos:
          valor.archivos.map(
            (
              item,
            ) => ({
              ...item,

              disponibleParaQuiz:
                permiteQuizzes &&
                esPdf(
                  item.archivo,
                ),
            }),
          ),
      });
    };

  const agregarArchivos =
    (
      archivos:
        File[],
    ) => {
      if (
        archivos.length ===
        0
      ) {
        return;
      }

      const permiteQuizzes =
        valor.uso ===
          'AULA_Y_QUIZZES' ||
        valor.uso ===
          'SOLO_QUIZZES';

      const nuevos:
        NuevoArchivoRecurso[] =
        archivos.map(
          (
            archivo,
          ) => ({
            archivo,

            titulo:
              archivo.name.replace(
                /\.[^/.]+$/,
                '',
              ),

            descripcion:
              '',

            disponibleParaQuiz:
              permiteQuizzes &&
              esPdf(
                archivo,
              ),
          }),
        );

      actualizar(
        'archivos',
        [
          ...valor.archivos,
          ...nuevos,
        ],
      );
    };

  const actualizarArchivo =
    (
      indice:
        number,

      cambios:
        Partial<NuevoArchivoRecurso>,
    ) => {
      actualizar(
        'archivos',
        valor.archivos.map(
          (
            archivo,
            posicion,
          ) =>
            posicion ===
            indice
              ? {
                  ...archivo,

                  ...cambios,
                }
              : archivo,
        ),
      );
    };

  const eliminarArchivo =
    (
      indice:
        number,
    ) => {
      actualizar(
        'archivos',
        valor.archivos.filter(
          (
            _,
            posicion,
          ) =>
            posicion !==
            indice,
        ),
      );
    };

  const agregarEnlace =
    () => {
      actualizar(
        'enlaces',
        [
          ...valor.enlaces,

          {
            titulo:
              '',

            descripcion:
              '',

            urlExterna:
              '',
          },
        ],
      );
    };

  const actualizarEnlace =
    (
      indice:
        number,

      cambios:
        Partial<NuevoEnlaceRecurso>,
    ) => {
      actualizar(
        'enlaces',
        valor.enlaces.map(
          (
            enlace,
            posicion,
          ) =>
            posicion ===
            indice
              ? {
                  ...enlace,

                  ...cambios,
                }
              : enlace,
        ),
      );
    };

  const eliminarEnlace =
    (
      indice:
        number,
    ) => {
      actualizar(
        'enlaces',
        valor.enlaces.filter(
          (
            _,
            posicion,
          ) =>
            posicion !==
            indice,
        ),
      );
    };

  if (
    paso ===
    2 &&
    !editando
  ) {
    return (
      <div className="form-recurso">
        <section className="materiales-grid">

          <div className="materiales-columna">
            <div className="materiales-columna__cabecera">
              <div className="materiales-columna__titulo">
                <span className="materiales-columna__icono">
                  <FilePlus2
                    size={
                      20
                    }
                  />
                </span>

                <div>
                  <strong>
                    Archivos
                  </strong>

                  <span>
                    PDF, Word, PowerPoint o imágenes.
                  </span>
                </div>
              </div>

              <label className="boton-agregar">
                <Plus
                  size={
                    15
                  }
                />

                Agregar

                <input
                  type="file"
                  multiple
                  disabled={
                    deshabilitado
                  }
                  onChange={(
                    evento,
                  ) => {
                    agregarArchivos(
                      Array.from(
                        evento.target.files ??
                          [],
                      ),
                    );

                    evento.currentTarget.value =
                      '';
                  }}
                />
              </label>
            </div>

            {valor.archivos.length ===
            0 ? (
              <div className="materiales-vacio">
                <FilePlus2
                  size={
                    30
                  }
                />

                <strong>
                  Sin archivos todavía
                </strong>

                <span>
                  Puedes seleccionar uno o varios archivos relacionados con este recurso.
                </span>
              </div>
            ) : (
              <div
                className={`materiales-lista ${
                  valor.archivos.length >=
                  3
                    ? 'materiales-lista--scroll'
                    : ''
                }`}
              >
                {valor.archivos.map(
                  (
                    item,
                    indice,
                  ) => (
                    <article
                      key={`${item.archivo.name}-${item.archivo.lastModified}-${indice}`}
                      className="material-card"
                    >
                      <div className="material-card__cabecera">
                        <span className="material-card__icono">
                          <FilePlus2
                            size={
                              18
                            }
                          />
                        </span>

                        <div className="material-card__archivo">
                          <strong>
                            {
                              item.archivo.name
                            }
                          </strong>

                          <span>
                            {formatearTamanio(
                              item.archivo.size,
                            )}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="material-card__eliminar"
                          disabled={
                            deshabilitado
                          }
                          aria-label="Quitar archivo"
                          onClick={() =>
                            eliminarArchivo(
                              indice,
                            )
                          }
                        >
                          <Trash2
                            size={
                              15
                            }
                          />
                        </button>
                      </div>

                      <label className="campo">
                        <span>
                          Título visible
                        </span>

                        <input
                          value={
                            item.titulo
                          }
                          disabled={
                            deshabilitado
                          }
                          placeholder="Título del archivo"
                          onChange={(
                            evento,
                          ) =>
                            actualizarArchivo(
                              indice,
                              {
                                titulo:
                                  evento.target.value,
                              },
                            )
                          }
                        />
                      </label>
                    </article>
                  ),
                )}
              </div>
            )}
          </div>

          {/*
           * ======================================================
           * ENLACES
           * ======================================================
           */}

          <div className="materiales-columna">
            <div className="materiales-columna__cabecera">
              <div className="materiales-columna__titulo">
                <span className="materiales-columna__icono">
                  <Link2
                    size={
                      20
                    }
                  />
                </span>

                <div>
                  <strong>
                    Enlaces
                  </strong>

                  <span>
                    Videos, páginas, Drive o material externo.
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="boton-agregar"
                disabled={
                  deshabilitado
                }
                onClick={
                  agregarEnlace
                }
              >
                <Plus
                  size={
                    15
                  }
                />

                Agregar
              </button>
            </div>

            {valor.enlaces.length ===
            0 ? (
              <div className="materiales-vacio">
                <Link2
                  size={
                    30
                  }
                />

                <strong>
                  Sin enlaces todavía
                </strong>

                <span>
                  Puedes agregar enlaces externos relacionados con este recurso.
                </span>
              </div>
            ) : (
              <div
                className={`materiales-lista ${
                  valor.enlaces.length >=
                  3
                    ? 'materiales-lista--scroll'
                    : ''
                }`}
              >
                {valor.enlaces.map(
                  (
                    item,
                    indice,
                  ) => (
                    <article
                      key={`enlace-${indice}`}
                      className="material-card"
                    >
                      <div className="material-card__cabecera">
                        <span className="material-card__icono">
                          <Link2
                            size={
                              18
                            }
                          />
                        </span>

                        <div className="material-card__archivo">
                          <strong>
                            {item.titulo.trim() ||
                              `Enlace ${indice + 1}`}
                          </strong>

                          <span>
                            Recurso externo
                          </span>
                        </div>

                        <button
                          type="button"
                          className="material-card__eliminar"
                          disabled={
                            deshabilitado
                          }
                          aria-label="Quitar enlace"
                          onClick={() =>
                            eliminarEnlace(
                              indice,
                            )
                          }
                        >
                          <Trash2
                            size={
                              15
                            }
                          />
                        </button>
                      </div>

                      <label className="campo">
                        <span>
                          Título
                        </span>

                        <input
                          value={
                            item.titulo
                          }
                          disabled={
                            deshabilitado
                          }
                          placeholder="Ej. Gaceta Oficial"
                          onChange={(
                            evento,
                          ) =>
                            actualizarEnlace(
                              indice,
                              {
                                titulo:
                                  evento.target.value,
                              },
                            )
                          }
                        />
                      </label>

                      <label className="campo">
                        <span>
                          URL
                        </span>

                        <input
                          value={
                            item.urlExterna
                          }
                          disabled={
                            deshabilitado
                          }
                          placeholder="https://..."
                          onChange={(
                            evento,
                          ) =>
                            actualizarEnlace(
                              indice,
                              {
                                urlExterna:
                                  evento.target.value,
                              },
                            )
                          }
                        />
                      </label>
                    </article>
                  ),
                )}
              </div>
            )}
          </div>
        </section>

        <style>
          {styles}
        </style>
      </div>
    );
  }

  /*
   * ============================================================
   * PASO 1
   * CONFIGURACIÓN + USO
   * ============================================================
   */

  return (
    <div className="form-recurso">
      <section className="configuracion-panel">
        <div className="seccion-titulo">
          <strong>
            Configuración del recurso
          </strong>

          <span>
            Completa la información, ubicación y finalidad del recurso.
          </span>
        </div>

        <div className="configuracion-fila configuracion-fila--informacion">
          <label className="campo">
            <span>
              Título del recurso
            </span>

            <input
              value={
                valor.titulo
              }
              maxLength={
                180
              }
              disabled={
                deshabilitado
              }
              placeholder="Ej. Código Civil"
              onChange={(
                evento,
              ) =>
                actualizar(
                  'titulo',
                  evento.target.value,
                )
              }
            />
          </label>

          <label className="campo">
            <span>
              Descripción
            </span>

            <input
              value={
                valor.descripcion
              }
              maxLength={
                1500
              }
              disabled={
                deshabilitado
              }
              placeholder="Ej. Normativa vigente utilizada durante el semestre."
              onChange={(
                evento,
              ) =>
                actualizar(
                  'descripcion',
                  evento.target.value,
                )
              }
            />
          </label>
        </div>

        <div className="configuracion-fila configuracion-fila--ubicacion">
          <div className="categoria-horizontal">
            <SelectorCategoriaRecurso
              valor={
                valor.categoria
              }
              deshabilitado={
                deshabilitado
              }
              onCambiar={(
                categoria,
              ) =>
                actualizar(
                  'categoria',
                  categoria,
                )
              }
              onAbrirCatalogo={
                onAbrirCatalogoCategoria
              }
            />
          </div>

          <label className="campo">
            <span>
              Alcance
            </span>

            <select
              value={
                valor.alcance
              }
              disabled={
                deshabilitado
              }
              onChange={(
                evento,
              ) =>
                cambiarAlcance(
                  evento.target.value as AlcanceRecursoCurso,
                )
              }
            >
              <option value="CURSO">
                Todo el semestre
              </option>

              <option value="HITO">
                Solo un hito
              </option>
            </select>
          </label>

          <label className="campo">
            <span>
              Hito
            </span>

            <select
              value={
                valor.hitoId ??
                ''
              }
              disabled={
                deshabilitado ||
                valor.alcance ===
                  'CURSO'
              }
              onChange={(
                evento,
              ) =>
                actualizar(
                  'hitoId',
                  Number(
                    evento.target.value,
                  ) ||
                    null,
                )
              }
            >
              <option value="">
                {valor.alcance ===
                'CURSO'
                  ? 'No aplica'
                  : 'Seleccionar hito'}
              </option>

              {hitos.map(
                (
                  hito,
                ) => (
                  <option
                    key={
                      hito.id
                    }
                    value={
                      hito.id
                    }
                  >
                    {
                      hito.codigo
                    }{' '}
                    ·{' '}
                    {
                      hito.nombre
                    }
                  </option>
                ),
              )}
            </select>
          </label>
        </div>

        <div className="uso-seccion">
          <div className="seccion-titulo seccion-titulo--pequeno">
            <strong>
              Uso del recurso
            </strong>

            <span>
              Define dónde se utilizará este recurso.
            </span>
          </div>

          <div className="uso-selector">
            <button
              type="button"
              disabled={
                deshabilitado
              }
              className={`uso-selector__opcion ${
                valor.uso ===
                'AULA'
                  ? 'activo'
                  : ''
              }`}
              onClick={() =>
                cambiarUso(
                  'AULA',
                )
              }
            >
              <span className="uso-selector__icono">
                <GraduationCap
                  size={
                    18
                  }
                />
              </span>

              <div>
                <strong>
                  Solo aula
                </strong>

                <span>
                  Material académico para estudiantes.
                </span>
              </div>
            </button>

            <button
              type="button"
              disabled={
                deshabilitado
              }
              className={`uso-selector__opcion ${
                valor.uso ===
                'AULA_Y_QUIZZES'
                  ? 'activo'
                  : ''
              }`}
              onClick={() =>
                cambiarUso(
                  'AULA_Y_QUIZZES',
                )
              }
            >
              <span className="uso-selector__icono">
                <BookOpenCheck
                  size={
                    18
                  }
                />
              </span>

              <div>
                <strong>
                  Aula + Quizzes
                </strong>

                <span>
                  Disponible para estudiantes y reutilizable en Quizzes.
                </span>
              </div>
            </button>

            <button
              type="button"
              disabled={
                deshabilitado
              }
              className={`uso-selector__opcion ${
                valor.uso ===
                'SOLO_QUIZZES'
                  ? 'activo'
                  : ''
              }`}
              onClick={() =>
                cambiarUso(
                  'SOLO_QUIZZES',
                )
              }
            >
              <span className="uso-selector__icono">
                <Sparkles
                  size={
                    18
                  }
                />
              </span>

              <div>
                <strong>
                  Solo Quizzes
                </strong>

                <span>
                  Fuente privada del docente.
                </span>
              </div>
            </button>
          </div>

          {valor.uso !==
          'SOLO_QUIZZES' ? (
            <label className="visibilidad">
              <input
                type="checkbox"
                checked={
                  valor.visibleParaEstudiantes
                }
                disabled={
                  deshabilitado
                }
                onChange={(
                  evento,
                ) =>
                  actualizar(
                    'visibleParaEstudiantes',
                    evento.target.checked,
                  )
                }
              />

              <div>
                <strong>
                  Visible para estudiantes
                </strong>

                <span>
                  Puedes ocultarlo temporalmente sin eliminarlo ni cambiar su uso.
                </span>
              </div>
            </label>
          ) : (
            <div className="privado-aviso">
              <Sparkles
                size={
                  15
                }
              />

              Este recurso será privado del docente y no aparecerá en la vista de estudiantes.
            </div>
          )}
        </div>
      </section>

      {editando && (
        <div className="nota-versiones">
          <span>
            i
          </span>

          <div>
            <strong>
              Materiales y versiones
            </strong>

            <p>
              Los materiales se administran desde el contenido del recurso. Reemplazar un archivo conserva las versiones anteriores.
            </p>
          </div>
        </div>
      )}

      <style>
        {styles}
      </style>
    </div>
  );
}

const styles = `
  .form-recurso {
    width: 100%;
    min-width: 0;

    display: grid;
    gap: 14px;
  }

  .seccion-titulo {
    display: grid;
    gap: 4px;
  }

  .seccion-titulo strong {
    color:
      var(--app-text);

    font-size: 14px;
    font-weight: 900;
  }

  .seccion-titulo span {
    color:
      var(--app-text-muted);

    font-size: 11px;
    line-height: 1.4;
  }

  .seccion-titulo--pequeno strong {
    font-size: 13px;
  }

  .seccion-titulo--pequeno span {
    font-size: 10.5px;
  }


  .configuracion-panel {
    min-width: 0;

    display: grid;
    gap: 16px;

    padding: 17px;

    border:
      1px solid
      var(--app-border);
    border-radius: 18px;

    background:
      var(--app-surface-alt);
  }

  .configuracion-fila {
    min-width: 0;

    display: grid;
    gap: 12px;
  }

  .configuracion-fila--informacion {
    grid-template-columns:
      minmax(
        0,
        1fr
      )
      minmax(
        0,
        1fr
      );
  }

  .configuracion-fila--ubicacion {
    grid-template-columns:
      minmax(
        0,
        1.5fr
      )
      minmax(
        190px,
        .75fr
      )
      minmax(
        210px,
        .85fr
      );

    align-items: end;
  }

  .campo {
    min-width: 0;

    display: grid;
    gap: 7px;
  }

  .campo > span {
    color:
      var(--app-text-secondary);

    font-size: 11px;
    font-weight: 850;
  }

  .campo input,
  .campo select {
    width: 100%;
    min-width: 0;
    min-height: 46px;

    box-sizing: border-box;

    padding:
      10px
      12px;

    border:
      1px solid
      var(--app-border-strong);
    border-radius: 11px;

    outline: none;

    color:
      var(--app-text);

    background:
      var(--app-surface);

    font: inherit;
    font-size: 12px;

    transition:
      border-color .16s ease,
      box-shadow .16s ease;
  }

  .campo input:focus,
  .campo select:focus {
    border-color:
      var(--app-accent);

    box-shadow:
      0 0 0 3px
      color-mix(
        in srgb,
        var(--app-accent) 10%,
        transparent
      );
  }

  .campo input:disabled,
  .campo select:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .categoria-horizontal {
    min-width: 0;
  }

  .categoria-horizontal
  .selector-recurso-compacto__etiqueta {
    font-size: 11px;
  }

  .categoria-horizontal
  .selector-recurso-compacto__boton {
    min-height: 62px;

    grid-template-columns:
      40px
      minmax(
        0,
        1fr
      )
      auto;

    gap: 10px;

    padding:
      9px
      11px;
  }

  .categoria-horizontal
  .selector-recurso-compacto__icono {
    width: 40px;
    height: 40px;
  }

  .categoria-horizontal
  .selector-recurso-compacto__texto strong {
    font-size: 12px;
  }

  .categoria-horizontal
  .selector-recurso-compacto__texto small {
    font-size: 10px;
  }

  .categoria-horizontal
  .selector-recurso-compacto__accion {
    font-size: 10.5px;
  }

  .uso-seccion {
    display: grid;
    gap: 11px;

    padding-top: 2px;
  }

  .uso-selector {
    display: grid;
    grid-template-columns:
      repeat(
        3,
        minmax(
          0,
          1fr
        )
      );
    gap: 10px;
  }

  .uso-selector__opcion {
    min-width: 0;
    min-height: 72px;

    display: grid;
    grid-template-columns:
      40px
      minmax(
        0,
        1fr
      );

    align-items: center;
    gap: 10px;

    padding:
      10px
      12px;

    border:
      1px solid
      var(--app-border);
    border-radius: 12px;

    color:
      var(--app-text);

    background:
      var(--app-surface);

    text-align: left;
    font: inherit;

    cursor: pointer;

    transition:
      border-color .16s ease,
      background .16s ease,
      box-shadow .16s ease;
  }

  .uso-selector__opcion:hover:not(:disabled) {
    border-color:
      color-mix(
        in srgb,
        var(--app-accent) 45%,
        var(--app-border)
      );
  }

  .uso-selector__opcion.activo {
    border-color:
      var(--app-accent);

    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 58%,
        var(--app-surface)
      );

    box-shadow:
      inset
      0
      0
      0
      1px
      color-mix(
        in srgb,
        var(--app-accent) 45%,
        transparent
      );
  }

  .uso-selector__opcion:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .uso-selector__icono {
    width: 40px;
    height: 40px;

    display: grid;
    place-items: center;

    border:
      1px solid
      color-mix(
        in srgb,
        var(--app-accent) 22%,
        var(--app-border)
      );
    border-radius: 10px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .uso-selector__opcion > div {
    min-width: 0;

    display: grid;
    gap: 3px;
  }

  .uso-selector__opcion strong {
    color:
      var(--app-text);

    font-size: 11px;
    font-weight: 900;
  }

  .uso-selector__opcion > div > span {
    color:
      var(--app-text-muted);

    font-size: 9.5px;
    line-height: 1.35;
  }

  .visibilidad {
    display: flex;
    align-items: center;
    gap: 9px;

    padding:
      9px
      11px;

    border:
      1px solid
      var(--app-border-soft);
    border-radius: 10px;

    background:
      var(--app-surface);

    cursor: pointer;
  }

  .visibilidad input {
    margin: 0;

    accent-color:
      var(--app-accent);
  }

  .visibilidad > div {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap:
      4px
      7px;
  }

  .visibilidad strong {
    color:
      var(--app-text);

    font-size: 10.5px;
    font-weight: 850;
  }

  .visibilidad span {
    color:
      var(--app-text-muted);

    font-size: 9.5px;
  }

  .privado-aviso {
    display: flex;
    align-items: center;
    gap: 8px;

    padding:
      9px
      11px;

    border:
      1px solid
      color-mix(
        in srgb,
        var(--app-accent) 25%,
        var(--app-border)
      );
    border-radius: 10px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);

    font-size: 10px;
  }


  .materiales-grid {
    min-width: 0;

    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );

    gap: 14px;

    align-items: stretch;
  }

  .materiales-columna {
    min-width: 0;
    min-height: 0;

    display: grid;
    grid-template-rows:
      auto
      minmax(
        0,
        1fr
      );

    gap: 12px;

    padding: 14px;

    border:
      1px solid
      var(--app-border);
    border-radius: 16px;

    background:
      var(--app-surface-alt);
  }

  .materiales-columna__cabecera {
    min-width: 0;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .materiales-columna__titulo {
    min-width: 0;

    display: flex;
    align-items: center;
    gap: 10px;
  }

  .materiales-columna__icono {
    width: 42px;
    height: 42px;

    flex-shrink: 0;

    display: grid;
    place-items: center;

    border-radius: 11px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .materiales-columna__titulo > div {
    min-width: 0;

    display: grid;
    gap: 3px;
  }

  .materiales-columna__titulo strong {
    color:
      var(--app-text);

    font-size: 12px;
    font-weight: 900;
  }

  .materiales-columna__titulo span {
    color:
      var(--app-text-muted);

    font-size: 9.5px;
  }

  .boton-agregar {
    min-height: 38px;

    flex-shrink: 0;

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    padding:
      7px
      11px;

    border:
      1px solid
      var(--app-border-strong);
    border-radius: 10px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-surface);

    font: inherit;
    font-size: 10px;
    font-weight: 850;

    cursor: pointer;

    transition:
      border-color .16s ease,
      background .16s ease;
  }

  .boton-agregar:hover:not(:disabled) {
    border-color:
      var(--app-accent);

    background:
      var(--app-accent-soft);
  }

  .boton-agregar input {
    display: none;
  }

  /*
   * VACÍO
   */

  .materiales-vacio {
    min-height: 245px;

    display: grid;
    place-items: center;
    align-content: center;
    gap: 6px;

    padding: 18px;

    border:
      1px dashed
      var(--app-border-strong);
    border-radius: 12px;

    color:
      var(--app-text-muted);

    text-align: center;

    background:
      var(--app-surface);
  }

  .materiales-vacio strong {
    color:
      var(--app-text-secondary);

    font-size: 11px;
  }

  .materiales-vacio span {
    max-width: 300px;

    font-size: 9.5px;
    line-height: 1.45;
  }

  .materiales-lista {
    min-height: 0;

    display: grid;
    align-content: start;
    gap: 10px;

    overflow: visible;
  }

  .materiales-lista--scroll {
    /*
     * Alto suficiente para mostrar aproximadamente
     * dos cards completas.
     *
     * El tercero queda abajo y se accede mediante scroll.
     */
    height: 358px;
    max-height: 358px;

    overflow-y: auto;
    overflow-x: hidden;

    padding-right: 5px;

    box-sizing: border-box;

    scrollbar-width: thin;

    scrollbar-color:
      color-mix(
        in srgb,
        var(--app-accent) 38%,
        var(--app-border)
      )
      transparent;

    overscroll-behavior:
      contain;
  }

  .materiales-lista--scroll::-webkit-scrollbar {
    width: 7px;
  }

  .materiales-lista--scroll::-webkit-scrollbar-track {
    background:
      transparent;
  }

  .materiales-lista--scroll::-webkit-scrollbar-thumb {
    border:
      2px solid
      transparent;

    border-radius:
      999px;

    background:
      color-mix(
        in srgb,
        var(--app-accent) 38%,
        var(--app-border)
      );

    background-clip:
      padding-box;
  }

  .materiales-lista--scroll::-webkit-scrollbar-thumb:hover {
    background:
      color-mix(
        in srgb,
        var(--app-accent) 55%,
        var(--app-border)
      );

    background-clip:
      padding-box;
  }

  .material-card {
    min-width: 0;

    display: grid;
    gap: 10px;

    padding: 11px;

    border:
      1px solid
      var(--app-border-soft);
    border-radius: 12px;

    background:
      var(--app-surface);
  }

  .material-card__cabecera {
    min-width: 0;

    display: grid;
    grid-template-columns:
      36px
      minmax(
        0,
        1fr
      )
      32px;

    align-items: center;
    gap: 9px;
  }

  .material-card__icono {
    width: 36px;
    height: 36px;

    display: grid;
    place-items: center;

    border-radius: 9px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .material-card__archivo {
    min-width: 0;

    display: grid;
    gap: 2px;
  }

  .material-card__archivo strong {
    overflow: hidden;

    color:
      var(--app-text);

    font-size: 10.5px;
    font-weight: 850;

    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .material-card__archivo span {
    color:
      var(--app-text-muted);

    font-size: 9px;
  }

  .material-card__eliminar {
    width: 32px;
    height: 32px;

    display: grid;
    place-items: center;

    border:
      1px solid
      var(--app-border);
    border-radius: 9px;

    color:
      var(--app-danger);

    background:
      transparent;

    cursor: pointer;
  }

  .nota-versiones {
    display: grid;
    grid-template-columns:
      32px
      minmax(
        0,
        1fr
      );

    align-items: center;
    gap: 9px;

    padding:
      10px
      12px;

    border:
      1px dashed
      var(--app-border-strong);
    border-radius: 11px;

    background:
      var(--app-surface-alt);
  }

  .nota-versiones > span {
    width: 32px;
    height: 32px;

    display: grid;
    place-items: center;

    border-radius: 9px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);

    font-size: 11px;
    font-weight: 900;
  }

  .nota-versiones > div {
    display: grid;
    gap: 2px;
  }

  .nota-versiones strong {
    color:
      var(--app-text-secondary);

    font-size: 10.5px;
    font-weight: 850;
  }

  .nota-versiones p {
    margin: 0;

    color:
      var(--app-text-muted);

    font-size: 9.5px;
    line-height: 1.4;
  }

  @media (
    max-width:
      950px
  ) {
    .configuracion-fila--ubicacion {
      grid-template-columns:
        1fr
        1fr;
    }

    .categoria-horizontal {
      grid-column:
        1 / -1;
    }
  }

  @media (
    max-width:
      820px
  ) {
    .configuracion-fila--informacion,
    .configuracion-fila--ubicacion,
    .materiales-grid {
      grid-template-columns:
        1fr;
    }

    .categoria-horizontal {
      grid-column:
        auto;
    }

    .uso-selector {
      grid-template-columns:
        1fr;
    }

    .materiales-lista--scroll {
      height: 350px;
      max-height: 350px;
    }
  }

  @media (
    max-width:
      560px
  ) {
    .configuracion-panel,
    .materiales-columna {
      padding: 12px;
    }

    .materiales-columna__cabecera {
      align-items: flex-start;
    }
  }
`;