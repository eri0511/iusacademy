import {
  Plus,
  Trash2,
  UsersRound,
  ChevronUp,
  ChevronDown,
  Save,
  FileDown,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';

import {
  useEffect,
  useState,
  useRef,
} from 'react';

import type {
  ClipboardEvent,
  KeyboardEvent,
} from 'react';

import {
  agregarBloque,
  actualizarBloque,
  eliminarBloque,
  moverBloque,
  guardarVersion,
  totalPalabrasDocumento,
  contarPalabras,
  colorAutor,
  parsearDocumentoColaborativo,
  serializarDocumento,
  nuevoEstadoDocumento,
  registrarPegado,
  htmlAPlano,
} from '../../utils/tareas/documentoColaborativo';

import {
  exportarDocumentoColaborativoPdf,
} from '../../utils/tareas/exportarDocumentoPdf';

import type {
  BloqueDocumento,
  ConfiguracionDocumentoColaborativo,
  DocumentoColaborativoEstado,
} from '../../utils/tareas/documentoColaborativo';

type Props = {
  valor:
    string;
  config:
    ConfiguracionDocumentoColaborativo;
  usuario:
    | {
        id: number;
        nombre: string;
      }
    | null;
  onChange:
    (
      nuevo:
        string,
    ) => void;
  onActividadLatido?:
    (
      segundos: number,
      pegados: number,
    ) => void;
};

function EditorDocumentoColaborativo({
  valor,
  config,
  usuario,
  onChange,
  onActividadLatido,
}: Props) {
  const estado =
    parsearDocumentoColaborativo(
      valor,
    ) ??
    nuevoEstadoDocumento(
      'Documento colaborativo',
      usuario,
    );

  const [
    nombreVersion,
    setNombreVersion,
  ] =
    useState(
      '',
    );

  const refsParrafos =
    useRef<
      Record<
        string,
        HTMLDivElement | null
      >
    >(
      {},
    );

  const [
    focoId,
    setFocoId,
  ] =
    useState<
      string | null
    >(
      null,
    );

  const pegadosPendientes =
    useRef(
      0,
    );

  useEffect(
    () => {
      if (
        !onActividadLatido
      ) {
        return undefined;
      }

      const inicio =
        Date.now();

      let marca =
        0;

      const id =
        window.setInterval(
          () => {
            const ahora =
              Date.now();

            const transcurrido =
              Math.floor(
                (ahora -
                  inicio) /
                  1000,
              );

            const activo =
              document.visibilityState ===
                'visible' &&
              document.hasFocus();

            const segundos =
              activo
                ? Math.max(
                    0,
                    transcurrido -
                      marca,
                  )
                : 0;

            marca =
              transcurrido;

            const pegados =
              pegadosPendientes.current;

            pegadosPendientes.current =
              0;

            if (
              segundos >
                0 ||
              pegados >
                0
            ) {
              onActividadLatido(
                segundos,
                pegados,
              );
            }
          },
          15000,
        );

      return () => {
        window.clearInterval(
          id,
        );
      };
    },
    [
      onActividadLatido,
    ],
  );

  const esAutorActual =
    (
      parrafo:
        BloqueDocumento,
    ): boolean =>
      usuario
        ? parrafo.autorId ===
          usuario.id
        : false;

  const aplicarFormato =
    (
      comando:
        string,
      valor?:
        string,
    ) => {
      const activo =
        focoId
          ? refsParrafos.current[
              focoId
            ]
          : null;

      if (
        !activo
      ) {
        return;
      }

      activo.focus();

      const previamente =
        document.activeElement;

      if (
        previamente !==
        activo
      ) {
        activo.focus();
      }

      document.execCommand(
        comando,
        false,
        valor,
      );

      activo.focus();
    };

  const separarParrafoEnCaret =
    (
      editable:
        HTMLDivElement,
    ): {
      antes: string;
      despues: string;
    } | null => {
      const seleccion =
        window.getSelection();

      if (
        !seleccion ||
        seleccion.rangeCount ===
          0
      ) {
        return null;
      }

      const rango =
        seleccion.getRangeAt(
          0,
        );

      const divAntes =
        document.createElement(
          'div',
        );

      const antes =
        rango.cloneRange();

      antes.selectNodeContents(
        editable,
      );

      antes.setEnd(
        rango.startContainer,
        rango.startOffset,
      );

      divAntes.appendChild(
        antes.cloneContents(),
      );

      const divDespues =
        document.createElement(
          'div',
        );

      const despues =
        rango.cloneRange();

      despues.selectNodeContents(
        editable,
      );

      despues.setStart(
        rango.endContainer,
        rango.endOffset,
      );

      divDespues.appendChild(
        despues.cloneContents(),
      );

      return {
        antes:
          divAntes.innerHTML,
        despues:
          divDespues.innerHTML,
      };
    };

  const insertarTextoDespues =
    (
      indice:
        number,
      htmlInicial:
        string,
    ) => {
      const base =
        agregarBloque(
          estado,
          usuario,
          indice +
            1,
        );

      let proximo =
        base;

      const nuevo =
        base.bloques[
          indice + 1
        ];

      if (
        htmlInicial &&
        nuevo
      ) {
        proximo = {
          ...base,
          bloques:
            base.bloques.map(
              (
                b,
              ) =>
                b.id ===
                nuevo.id
                  ? {
                      ...b,
                      html:
                        htmlInicial,
                      contenido:
                        htmlAPlano(
                          htmlInicial,
                        ),
                    }
                  : b,
            ),
        };
      }

      actualizarEstado(
        proximo,
      );

      const idNuevo =
        nuevo?.id;

      if (
        idNuevo
      ) {
        requestAnimationFrame(
          () => {
            refsParrafos.current[
              idNuevo
            ]?.focus();
          },
        );
      }
    };

  const manejarEnter =
    (
      e:
        KeyboardEvent<HTMLDivElement>,
      indice:
        number,
      bloque:
        BloqueDocumento,
    ) => {
      if (
        e.key !==
        'Enter'
      ) {
        return;
      }

      if (
        !esAutorActual(
          bloque,
        )
      ) {
        return;
      }

      const activo =
        refsParrafos.current[
          bloque.id
        ];

      if (
        !activo
      ) {
        return;
      }

      e.preventDefault();

      const separado =
        separarParrafoEnCaret(
          activo,
        );

      if (
        !separado
      ) {
        insertarTextoDespues(
          indice,
          '',
        );
        return;
      }

      let proximo =
        actualizarBloque(
          estado,
          bloque.id,
          separado.antes,
        );

      proximo =
        agregarBloque(
          proximo,
          usuario,
          indice +
            1,
        );

      const nuevo =
        proximo.bloques[
          indice + 1
        ];

      if (
        nuevo
      ) {
        proximo = {
          ...proximo,
          bloques:
            proximo.bloques.map(
              (
                b,
              ) =>
                b.id ===
                nuevo.id
                  ? {
                      ...b,
                      html:
                        separado.despues,
                      contenido:
                        htmlAPlano(
                          separado.despues,
                        ),
                    }
                  : b,
            ),
        };
      }

      actualizarEstado(
        proximo,
      );

      if (
        nuevo
      ) {
        const idNuevo =
          nuevo.id;

        requestAnimationFrame(
          () => {
            refsParrafos.current[
              idNuevo
            ]?.focus();
          },
        );
      }
    };

  const manejarPegado =
    (
      e:
        ClipboardEvent<HTMLDivElement>,
    ) => {
      const texto =
        e.clipboardData.getData(
          'text/plain',
        );

      const caracteres =
        (texto ?? '')
          .length;

      if (
        caracteres >
          0 &&
        usuario
      ) {
        const proximo =
          registrarPegado(
            estado,
            usuario.id,
            usuario.nombre,
            caracteres,
          );

        actualizarEstado(
          proximo,
        );

        pegadosPendientes.current +=
          1;
      }
    };

  const actualizarEstado =
    (
      nuevo:
        DocumentoColaborativoEstado,
    ) =>
      onChange(
        serializarDocumento(
          nuevo,
        ),
      );

  const total =
    totalPalabrasDocumento(
      estado,
    );

  const autores =
    [
      ...new Set(
        estado.bloques.map(
          (
            b,
          ) =>
            b.autorId,
        ),
      ),
    ];

  const sinContenido =
    estado.bloques.every(
      (
        b,
      ) =>
        !b.contenido.trim(),
    );

  const excedidoBloques =
    estado.bloques.length >
    config.maxBloques;

  const excedidoPalabras =
    config.totalMaxPalabras >
      0 &&
    total >
      config.totalMaxPalabras;

  return (
    <div className="edc">
      <div className="edc__header">
        <div className="edc__header-info">
          <UsersRound
            size={16}
          />
          <div>
            <strong>
              {
                estado.titulo
              }
            </strong>

            <small>
              {estado.bloques.length}{' '}
              bloque(s) ·{' '}
              {autores.length}{' '}
              autor(es)
            </small>
          </div>
        </div>

        <div className="edc__header-acciones">
          <button
            type="button"
            className="edc__btn edc__btn--guardar"
            onClick={() => {
              const nuevo =
                guardarVersion(
                  estado,
                  usuario,
                  nombreVersion.trim() ||
                    undefined,
                );

              actualizarEstado(
                nuevo,
              );

              setNombreVersion(
                '',
              );
            }}
          >
            <Save
              size={13}
            />
            Guardar versión
          </button>

          <button
            type="button"
            className="edc__btn edc__btn--pdf"
            onClick={() =>
              exportarDocumentoColaborativoPdf(
                serializarDocumento(
                  estado,
                ),
                false,
                `Documento-${new Date().toISOString().slice(0, 10)}.pdf`,
              )
            }
          >
            <FileDown
              size={13}
            />
            PDF
          </button>
        </div>
      </div>

      {nombreVersion !==
        '' ||
        estado.versiones.length >
          0 ? (
        <div className="edc__versiones">
          <input
            value={
              nombreVersion
            }
            placeholder="Nombre de la versión (opcional)"
            maxLength={
              100
            }
            onChange={(
              e,
            ) =>
              setNombreVersion(
                e.target
                  .value,
              )
            }
          />

          {estado.versiones.length >
            0 && (
            <small>
              {
                estado.versiones
                  .length
              }{' '}
              versión(es) guardada(s)
            </small>
          )}
        </div>
      ) : null}

      <div className="edc__hoja">
        {estado.bloques.map(
          (
            bloque,
            indice,
          ) => {
            const palabras =
              contarPalabras(
                bloque.contenido,
              );

            const color =
              colorAutor(
                bloque.autorId,
                autores,
              );

            const esActual =
              esAutorActual(
                bloque,
              );

            const esUltimo =
              indice ===
              estado.bloques.length -
                1;

            return (
              <article
                key={
                  bloque.id
                }
                className={
                  esActual
                    ? 'edc__parrafo edc__parrafo--actual'
                    : 'edc__parrafo'
                }
              >
                <span
                  className="edc__parrafo-cinta"
                  style={{
                    backgroundColor:
                      color,
                  }}
                />

                <div className="edc__parrafo-cuerpo">
                  <div className="edc__parrafo-cabecera">
                    <span
                      className="edc__parrafo-autor"
                      style={{
                        color,
                      }}
                    >
                      <span
                        className="edc__parrafo-autor-punto"
                        style={{
                          backgroundColor:
                            color,
                        }}
                      />
                      {
                        bloque.autorNombre
                      }
                    </span>

                    <span className="edc__parrafo-fecha">
                      {
                        new Date(
                          bloque.creadoEn,
                        ).toLocaleDateString(
                          'es-BO',
                        )
                      }
                    </span>

                    <div className="edc__parrafo-acciones">
                      <button
                        type="button"
                        title="Mover arriba"
                        disabled={
                          indice ===
                          0
                        }
                        onClick={() =>
                          actualizarEstado(
                            moverBloque(
                              estado,
                              bloque.id,
                              'arriba',
                            ),
                          )
                        }
                      >
                        <ChevronUp
                          size={
                            13
                          }
                        />
                      </button>

                      <button
                        type="button"
                        title="Mover abajo"
                        disabled={
                          esUltimo
                        }
                        onClick={() =>
                          actualizarEstado(
                            moverBloque(
                              estado,
                              bloque.id,
                              'abajo',
                            ),
                          )
                        }
                      >
                        <ChevronDown
                          size={
                            13
                          }
                        />
                      </button>

                      <button
                        type="button"
                        className="edc__btn-peligro"
                        title="Eliminar párrafo"
                        disabled={
                          estado.bloques.length <=
                          1
                        }
                        onClick={() =>
                          actualizarEstado(
                            eliminarBloque(
                              estado,
                              bloque.id,
                            ),
                          )
                        }
                      >
                        <Trash2
                          size={
                            13
                          }
                        />
                      </button>
                    </div>
                  </div>

                  {focoId ===
                    bloque.id &&
                    esActual && (
                    <div className="edc__parrafo-toolbar">
                      <button
                        type="button"
                        title="Negrita"
                        onMouseDown={(
                          e,
                        ) =>
                          e.preventDefault()
                        }
                        onClick={() =>
                          aplicarFormato(
                            'bold',
                          )
                        }
                      >
                        <Bold
                          size={13}
                        />
                      </button>

                      <button
                        type="button"
                        title="Cursiva"
                        onMouseDown={(
                          e,
                        ) =>
                          e.preventDefault()
                        }
                        onClick={() =>
                          aplicarFormato(
                            'italic',
                          )
                        }
                      >
                        <Italic
                          size={13}
                        />
                      </button>

                      <button
                        type="button"
                        title="Subrayado"
                        onMouseDown={(
                          e,
                        ) =>
                          e.preventDefault()
                        }
                        onClick={() =>
                          aplicarFormato(
                            'underline',
                          )
                        }
                      >
                        <Underline
                          size={13}
                        />
                      </button>

                      <button
                        type="button"
                        title="Tachado"
                        onMouseDown={(
                          e,
                        ) =>
                          e.preventDefault()
                        }
                        onClick={() =>
                          aplicarFormato(
                            'strikeThrough',
                          )
                        }
                      >
                        <Strikethrough
                          size={13}
                        />
                      </button>

                      <span className="edc__parrafo-toolbar-sep" />

                      <button
                        type="button"
                        title="Lista con viñetas"
                        onMouseDown={(
                          e,
                        ) =>
                          e.preventDefault()
                        }
                        onClick={() =>
                          aplicarFormato(
                            'insertUnorderedList',
                          )
                        }
                      >
                        <List
                          size={13}
                        />
                      </button>

                      <button
                        type="button"
                        title="Lista numerada"
                        onMouseDown={(
                          e,
                        ) =>
                          e.preventDefault()
                        }
                        onClick={() =>
                          aplicarFormato(
                            'insertOrderedList',
                          )
                        }
                      >
                        <ListOrdered
                          size={13}
                        />
                      </button>

                      <span className="edc__parrafo-toolbar-sep" />

                      <button
                        type="button"
                        title="Alinear a la izquierda"
                        onMouseDown={(
                          e,
                        ) =>
                          e.preventDefault()
                        }
                        onClick={() =>
                          aplicarFormato(
                            'justifyLeft',
                          )
                        }
                      >
                        <AlignLeft
                          size={13}
                        />
                      </button>

                      <button
                        type="button"
                        title="Centrar"
                        onMouseDown={(
                          e,
                        ) =>
                          e.preventDefault()
                        }
                        onClick={() =>
                          aplicarFormato(
                            'justifyCenter',
                          )
                        }
                      >
                        <AlignCenter
                          size={13}
                        />
                      </button>

                      <button
                        type="button"
                        title="Alinear a la derecha"
                        onMouseDown={(
                          e,
                        ) =>
                          e.preventDefault()
                        }
                        onClick={() =>
                          aplicarFormato(
                            'justifyRight',
                          )
                        }
                      >
                        <AlignRight
                          size={13}
                        />
                      </button>
                    </div>
                  )}

                  <div
                    className="edc__parrafo-editor"
                    ref={(
                      elemento,
                    ) => {
                      refsParrafos.current[
                        bloque.id
                      ] =
                        elemento;
                    }}
                    contentEditable={
                      esActual
                    }
                    suppressContentEditableWarning
                    data-placeholder={
                      esActual
                        ? 'Escribe aquí tu aporte al documento colaborativo...'
                        : 'Párrafo redactado por un integrante del grupo'
                    }
                    dangerouslySetInnerHTML={{
                      __html:
                        bloque.html,
                    }}
                    onFocus={() =>
                      setFocoId(
                        bloque.id,
                      )
                    }
                    onBlur={() =>
                      setFocoId(
                        null,
                      )
                    }
                    onInput={() => {
                      const elemento =
                        refsParrafos.current[
                          bloque.id
                        ];

                      if (
                        elemento
                      ) {
                        actualizarEstado(
                          actualizarBloque(
                            estado,
                            bloque.id,
                            elemento.innerHTML,
                          ),
                        );
                      }
                    }}
                    onPaste={(e) =>
                      manejarPegado(
                        e,
                      )
                    }
                    onKeyDown={(e) =>
                      manejarEnter(
                        e,
                        indice,
                        bloque,
                      )
                    }
                  />

                  <div className="edc__parrafo-pie">
                    <small>
                      {
                        palabras
                      }{' '}
                      palabra(s)
                    </small>

                    {esActual && (
                      <span className="edc__parrafo-tuaporte">
                        Tu aporte
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          },
        )}

        <button
          type="button"
          className="edc__btn edc__btn--nuevo"
          onClick={() =>
            insertarTextoDespues(
              estado.bloques.length -
                1,
              '',
            )
          }
        >
          <Plus
            size={14}
          />
          Añadir párrafo
        </button>
      </div>

      <div className="edc__resumen">
        <span>
          Total: <strong>{total}</strong> palabras
        </span>

        <span>
          Bloques: <strong>{estado.bloques.length}</strong>
          {excedidoBloques && (
            <span className="edc__excedido">
              {' '}(máx. {config.maxBloques})
            </span>
          )}
        </span>

        <span>
          Autores: <strong>{autores.length}</strong>
          {config.exigirAutores &&
            autores.length <
              config.minAutores && (
            <span className="edc__excedido">
              {' '}(mín. {config.minAutores})
            </span>
          )}
        </span>

        {config.totalMaxPalabras >
          0 && (
          <span>
            {total} / {
              config.totalMaxPalabras
            } palabras
            {excedidoPalabras && (
              <span className="edc__excedido">
                {' '}(excedido)
              </span>
            )}
          </span>
        )}

        {sinContenido && (
          <span className="edc__excedido">
            Agrega contenido a al menos un bloque
          </span>
        )}
      </div>

      <style>{`
        .edc {
          display: grid;
          gap: 10px;
        }

        .edc__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .edc__header-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .edc__header-info strong {
          display: block;
          font-size: 11px;
        }

        .edc__header-info small {
          display: block;
          font-size: 9px;
          color: var(--app-text-secondary);
        }

        .edc__header-acciones {
          display: flex;
          gap: 6px;
        }

        .edc__btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border: 0;
          border-radius: 8px;
          font: inherit;
          font-size: 10px;
          font-weight: 750;
          cursor: pointer;
        }

        .edc__btn--guardar {
          color: var(--app-accent-dark);
          background: var(--app-accent-soft);
        }

        .edc__btn--pdf {
          color: var(--app-danger-dark, #b91c1c);
          background: var(--app-danger-bg, #fef2f2);
        }

        .edc__btn--nuevo {
          color: var(--app-accent-dark);
          background: var(--app-accent-soft);
          justify-self: start;
        }

        .edc__versiones {
          display: grid;
          gap: 4px;
        }

        .edc__versiones input {
          padding: 5px 8px;
          border: 1px solid var(--app-border);
          border-radius: 8px;
          font: inherit;
          font-size: 10px;
        }

        .edc__versiones small {
          font-size: 9px;
          color: var(--app-text-secondary);
        }

        .edc__hoja {
          display: flex;
          flex-direction: column;
          border: 1px solid var(--app-border);
          border-radius: 12px;
          overflow: hidden;
          background: var(--app-surface);
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
        }

        .edc__parrafo {
          position: relative;
          display: flex;
          border-bottom: 1px solid var(--app-border-soft);
        }

        .edc__parrafo:last-of-type {
          border-bottom: none;
        }

        .edc__parrafo--actual {
          background: color-mix(in srgb, var(--app-accent-soft, #dbeafe) 30%, transparent);
        }

        .edc__parrafo-cinta {
          flex-shrink: 0;
          width: 4px;
        }

        .edc__parrafo-cuerpo {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          padding: 6px 10px 4px;
        }

        .edc__parrafo-cabecera {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }

        .edc__parrafo-autor {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 800;
        }

        .edc__parrafo-autor-punto {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .edc__parrafo-fecha {
          font-size: 8.5px;
          color: var(--app-text-secondary);
          margin-right: auto;
        }

        .edc__parrafo-acciones {
          display: flex;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .edc__parrafo--actual .edc__parrafo-acciones,
        .edc__parrafo:hover .edc__parrafo-acciones {
          opacity: 1;
        }

        .edc__parrafo-acciones button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border: 0;
          border-radius: 5px;
          color: var(--app-text-secondary);
          background: transparent;
          cursor: pointer;
        }

        .edc__parrafo-acciones button:hover {
          background: var(--app-hover);
        }

        .edc__parrafo-acciones button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .edc__parrafo-toolbar {
          display: flex;
          align-items: center;
          gap: 2px;
          flex-wrap: wrap;
          padding: 4px 6px;
          margin: 2px 0 4px;
          border: 1px solid var(--app-border);
          border-radius: 8px;
          background: var(--app-surface-alt);
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
        }

        .edc__parrafo-toolbar button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 27px;
          height: 24px;
          border: 0;
          border-radius: 6px;
          color: var(--app-text-secondary);
          background: transparent;
          cursor: pointer;
        }

        .edc__parrafo-toolbar button:hover {
          background: var(--app-hover);
          color: var(--app-text);
        }

        .edc__parrafo-toolbar-sep {
          width: 1px;
          height: 16px;
          margin: 0 4px;
          background: var(--app-border);
        }

        .edc__parrafo-editor {
          width: 100%;
          border: 0;
          padding: 4px 0;
          font: inherit;
          font-size: 12px;
          line-height: 1.65;
          min-height: 34px;
          background: transparent;
          color: var(--app-text);
          outline: none;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .edc__parrafo--actual .edc__parrafo-editor {
          min-height: 48px;
        }

        .edc__parrafo-editor:empty::before {
          content: attr(data-placeholder);
          color: var(--app-text-secondary);
          opacity: 0.65;
          pointer-events: none;
        }

        .edc__parrafo--actual .edc__parrafo-editor:empty::before {
          color: var(--app-accent-dark, #1d4ed8);
          opacity: 0.6;
        }

        .edc__parrafo-editor:focus {
          outline: none;
        }

        .edc__parrafo-pie {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1px;
        }

        .edc__parrafo-pie small {
          font-size: 8px;
          color: var(--app-text-secondary);
        }

        .edc__parrafo-tuaporte {
          font-size: 8px;
          font-weight: 800;
          color: var(--app-accent-dark, #1d4ed8);
        }

        .edc__hoja .edc__btn--nuevo {
          justify-self: stretch;
          width: 100%;
          border-radius: 0;
          border-top: 1px solid var(--app-border-soft);
          justify-content: center;
        }

        .edc__resumen {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          font-size: 10px;
          color: var(--app-text-secondary);
        }

        .edc__resumen strong {
          color: var(--app-text);
        }

        .edc__excedido {
          color: var(--app-danger);
          font-weight: 700;
        }

        .edc__btn-peligro {
          color: var(--app-danger) !important;
        }
      `}</style>
    </div>
  );
}

export default EditorDocumentoColaborativo;
