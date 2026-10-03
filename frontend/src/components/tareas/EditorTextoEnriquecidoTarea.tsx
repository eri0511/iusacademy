import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  X,
  Quote,
  Redo2,
  RemoveFormatting,
  Underline,
  Undo2,
} from 'lucide-react';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

type Props = {
  valor: string;
  onChange: (
    html:
      string,
  ) => void;
  placeholder?: string;
  deshabilitado?: boolean;
  altoMinimo?: number;
};

type Comando =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'justifyLeft'
  | 'justifyCenter'
  | 'justifyRight'
  | 'undo'
  | 'redo'
  | 'removeFormat';

function normalizarHtml(
  html:
    string,
) {
  const limpio =
    html
      .replace(
        /\u200B/g,
        '',
      )
      .trim();

  const vacios =
    new Set([
      '',
      '<br>',
      '<div><br></div>',
      '<p><br></p>',
    ]);

  return vacios.has(
    limpio.toLowerCase(),
  )
    ? ''
    : limpio;
}

function escaparHtml(
  valor:
    string,
) {
  return valor
    .replaceAll(
      '&',
      '&amp;',
    )
    .replaceAll(
      '<',
      '&lt;',
    )
    .replaceAll(
      '>',
      '&gt;',
    )
    .replaceAll(
      '"',
      '&quot;',
    )
    .replaceAll(
      "'",
      '&#039;',
    );
}

function normalizarUrl(
  valor:
    string,
) {
  const url =
    valor.trim();

  if (
    !url
  ) {
    return '';
  }

  if (
    /^(https?:\/\/|mailto:)/i.test(
      url,
    )
  ) {
    return url;
  }

  return `https://${url}`;
}

export default function EditorTextoEnriquecidoTarea(
  {
    valor,
    onChange,
    placeholder =
      'Escribe aquí...',
    deshabilitado =
      false,
    altoMinimo =
      220,
  }: Props,
) {
  const editorRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const seleccionRef =
    useRef<Range | null>(
      null,
    );

  const [
    modalEnlace,
    setModalEnlace,
  ] =
    useState(
      false,
    );

  const [
    textoEnlace,
    setTextoEnlace,
  ] =
    useState(
      '',
    );

  const [
    urlEnlace,
    setUrlEnlace,
  ] =
    useState(
      'https://',
    );

  const [
    errorEnlace,
    setErrorEnlace,
  ] =
    useState(
      '',
    );

  useEffect(
    () => {
      const editor =
        editorRef.current;

      if (
        !editor
      ) {
        return;
      }

      const actual =
        normalizarHtml(
          editor.innerHTML,
        );

      const siguiente =
        normalizarHtml(
          valor,
        );

      if (
        actual ===
        siguiente
      ) {
        return;
      }

      editor.innerHTML =
        siguiente;
    },
    [
      valor,
    ],
  );

  const enfocar =
    () => {
      editorRef.current?.focus();
    };

  const ejecutar =
    (
      comando:
        Comando,
      valorComando?:
        string,
    ) => {
      if (
        deshabilitado
      ) {
        return;
      }

      enfocar();

      document.execCommand(
        comando,
        false,
        valorComando,
      );

      const html =
        editorRef.current
          ?.innerHTML ??
        '';

      onChange(
        normalizarHtml(
          html,
        ),
      );
    };

  const formatoBloque =
    (
      bloque:
        'P' |
        'H2' |
        'BLOCKQUOTE',
    ) => {
      if (
        deshabilitado
      ) {
        return;
      }

      enfocar();

      document.execCommand(
        'formatBlock',
        false,
        bloque,
      );

      const html =
        editorRef.current
          ?.innerHTML ??
        '';

      onChange(
        normalizarHtml(
          html,
        ),
      );
    };

  const abrirModalEnlace =
    () => {
      if (
        deshabilitado
      ) {
        return;
      }

      enfocar();

      const seleccion =
        window.getSelection();

      if (
        seleccion &&
        seleccion.rangeCount >
          0
      ) {
        const rango =
          seleccion.getRangeAt(
            0,
          );

        const editor =
          editorRef.current;

        if (
          editor &&
          editor.contains(
            rango.commonAncestorContainer,
          )
        ) {
          seleccionRef.current =
            rango.cloneRange();

          setTextoEnlace(
            seleccion
              .toString()
              .trim(),
          );
        }
      }

      setUrlEnlace(
        'https://',
      );

      setErrorEnlace(
        '',
      );

      setModalEnlace(
        true,
      );
    };

  const cerrarModalEnlace =
    () => {
      setModalEnlace(
        false,
      );

      setTextoEnlace(
        '',
      );

      setUrlEnlace(
        'https://',
      );

      setErrorEnlace(
        '',
      );
    };

  const confirmarEnlace =
    () => {
      if (
        deshabilitado
      ) {
        return;
      }

      const url =
        normalizarUrl(
          urlEnlace,
        );

      if (
        !url ||
        url ===
          'https://'
      ) {
        setErrorEnlace(
          'Ingresa un enlace válido.',
        );

        return;
      }

      const texto =
        textoEnlace.trim() ||
        url;

      const editor =
        editorRef.current;

      if (
        !editor
      ) {
        return;
      }

      enfocar();

      const seleccion =
        window.getSelection();

      if (
        seleccion &&
        seleccionRef.current
      ) {
        seleccion.removeAllRanges();
        seleccion.addRange(
          seleccionRef.current,
        );
      }

      const htmlEnlace =
        `<a href="${escaparHtml(
          url,
        )}" target="_blank" rel="noopener noreferrer">${escaparHtml(
          texto,
        )}</a>`;

      document.execCommand(
        'insertHTML',
        false,
        htmlEnlace,
      );

      const html =
        editor.innerHTML;

      onChange(
        normalizarHtml(
          html,
        ),
      );

      seleccionRef.current =
        null;

      cerrarModalEnlace();
    };

  const manejarEntrada =
    () => {
      const html =
        editorRef.current
          ?.innerHTML ??
        '';

      onChange(
        normalizarHtml(
          html,
        ),
      );
    };

  return (
    <>
      <div
        className={`ete-rich ${
          deshabilitado
            ? 'is-disabled'
            : ''
        }`}
      >
        <div className="ete-rich__toolbar">
          <div className="ete-rich__group">
            <button
              type="button"
              title="Deshacer"
              disabled={
                deshabilitado
              }
              onMouseDown={(
                evento,
              ) =>
                evento.preventDefault()
              }
              onClick={() =>
                ejecutar(
                  'undo',
                )
              }
            >
              <Undo2
                size={16}
              />
            </button>

            <button
              type="button"
              title="Rehacer"
              disabled={
                deshabilitado
              }
              onMouseDown={(
                evento,
              ) =>
                evento.preventDefault()
              }
              onClick={() =>
                ejecutar(
                  'redo',
                )
              }
            >
              <Redo2
                size={16}
              />
            </button>
          </div>

          <span className="ete-rich__separator" />

          <div className="ete-rich__group">
            <button
              type="button"
              title="Negrita"
              disabled={
                deshabilitado
              }
              onMouseDown={(
                evento,
              ) =>
                evento.preventDefault()
              }
              onClick={() =>
                ejecutar(
                  'bold',
                )
              }
            >
              <Bold
                size={16}
              />
            </button>

            <button
              type="button"
              title="Cursiva"
              disabled={
                deshabilitado
              }
              onMouseDown={(
                evento,
              ) =>
                evento.preventDefault()
              }
              onClick={() =>
                ejecutar(
                  'italic',
                )
              }
            >
              <Italic
                size={16}
              />
            </button>

            <button
              type="button"
              title="Subrayado"
              disabled={
                deshabilitado
              }
              onMouseDown={(
                evento,
              ) =>
                evento.preventDefault()
              }
              onClick={() =>
                ejecutar(
                  'underline',
                )
              }
            >
              <Underline
                size={16}
              />
            </button>
          </div>

          <span className="ete-rich__separator" />

          <div className="ete-rich__group">
            <button
              type="button"
              title="Párrafo"
              disabled={
                deshabilitado
              }
              onMouseDown={(
                evento,
              ) =>
                evento.preventDefault()
              }
              onClick={() =>
                formatoBloque(
                  'P',
                )
              }
            >
              <span className="ete-rich__text-button">
                P
              </span>
            </button>

            <button
              type="button"
              title="Subtítulo"
              disabled={
                deshabilitado
              }
              onMouseDown={(
                evento,
              ) =>
                evento.preventDefault()
              }
              onClick={() =>
                formatoBloque(
                  'H2',
                )
              }
            >
              <Heading2
                size={17}
              />
            </button>

            <button
              type="button"
              title="Cita"
              disabled={
                deshabilitado
              }
              onMouseDown={(
                evento,
              ) =>
                evento.preventDefault()
              }
              onClick={() =>
                formatoBloque(
                  'BLOCKQUOTE',
                )
              }
            >
              <Quote
                size={16}
              />
            </button>
          </div>

          <span className="ete-rich__separator" />

          <div className="ete-rich__group">
            <button
              type="button"
              title="Lista con viñetas"
              disabled={
                deshabilitado
              }
              onMouseDown={(
                evento,
              ) =>
                evento.preventDefault()
              }
              onClick={() =>
                ejecutar(
                  'insertUnorderedList',
                )
              }
            >
              <List
                size={17}
              />
            </button>

            <button
              type="button"
              title="Lista numerada"
              disabled={
                deshabilitado
              }
              onMouseDown={(
                evento,
              ) =>
                evento.preventDefault()
              }
              onClick={() =>
                ejecutar(
                  'insertOrderedList',
                )
              }
            >
              <ListOrdered
                size={17}
              />
            </button>
          </div>

          <span className="ete-rich__separator" />

          <div className="ete-rich__group">
            <button
              type="button"
              title="Alinear a la izquierda"
              disabled={
                deshabilitado
              }
              onMouseDown={(
                evento,
              ) =>
                evento.preventDefault()
              }
              onClick={() =>
                ejecutar(
                  'justifyLeft',
                )
              }
            >
              <AlignLeft
                size={17}
              />
            </button>

            <button
              type="button"
              title="Centrar"
              disabled={
                deshabilitado
              }
              onMouseDown={(
                evento,
              ) =>
                evento.preventDefault()
              }
              onClick={() =>
                ejecutar(
                  'justifyCenter',
                )
              }
            >
              <AlignCenter
                size={17}
              />
            </button>

            <button
              type="button"
              title="Alinear a la derecha"
              disabled={
                deshabilitado
              }
              onMouseDown={(
                evento,
              ) =>
                evento.preventDefault()
              }
              onClick={() =>
                ejecutar(
                  'justifyRight',
                )
              }
            >
              <AlignRight
                size={17}
              />
            </button>
          </div>

          <span className="ete-rich__separator" />

          <div className="ete-rich__group">
            <button
              type="button"
              title="Insertar enlace"
              disabled={
                deshabilitado
              }
              onMouseDown={(
                evento,
              ) =>
                evento.preventDefault()
              }
              onClick={
                abrirModalEnlace
              }
            >
              <Link2
                size={16}
              />
            </button>

            <button
              type="button"
              title="Limpiar formato"
              disabled={
                deshabilitado
              }
              onMouseDown={(
                evento,
              ) =>
                evento.preventDefault()
              }
              onClick={() =>
                ejecutar(
                  'removeFormat',
                )
              }
            >
              <RemoveFormatting
                size={17}
              />
            </button>
          </div>
        </div>

        <div className="ete-rich__editor-wrap">
          {!normalizarHtml(
            valor,
          ) && (
            <span className="ete-rich__placeholder">
              {
                placeholder
              }
            </span>
          )}

          <div
            ref={
              editorRef
            }
            className="ete-rich__editor"
            contentEditable={
              !deshabilitado
            }
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            data-placeholder={
              placeholder
            }
            style={{
              minHeight:
                `${altoMinimo}px`,
            }}
            onInput={
              manejarEntrada
            }
          />
        </div>
      </div>

      {modalEnlace && (
        <div
          className="ete-link-modal__backdrop"
          role="presentation"
          onMouseDown={(
            evento,
          ) => {
            if (
              evento.target ===
              evento.currentTarget
            ) {
              cerrarModalEnlace();
            }
          }}
        >
          <section
            className="ete-link-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ete-link-modal-title"
          >
            <header className="ete-link-modal__header">
              <div>
                <span className="ete-link-modal__icon">
                  <Link2
                    size={18}
                  />
                </span>

                <div>
                  <strong id="ete-link-modal-title">
                    Insertar enlace
                  </strong>

                  <small>
                    Vincula un texto de tu respuesta con una fuente externa.
                  </small>
                </div>
              </div>

              <button
                type="button"
                className="ete-link-modal__close"
                title="Cerrar"
                onClick={
                  cerrarModalEnlace
                }
              >
                <X
                  size={17}
                />
              </button>
            </header>

            <div className="ete-link-modal__body">
              <label>
                <span>
                  Texto a mostrar
                </span>

                <input
                  value={
                    textoEnlace
                  }
                  placeholder="Ej.: Código Civil boliviano"
                  onChange={(
                    evento,
                  ) =>
                    setTextoEnlace(
                      evento.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Enlace
                </span>

                <input
                  autoFocus
                  value={
                    urlEnlace
                  }
                  placeholder="https://..."
                  onChange={(
                    evento,
                  ) => {
                    setUrlEnlace(
                      evento.target.value,
                    );

                    if (
                      errorEnlace
                    ) {
                      setErrorEnlace(
                        '',
                      );
                    }
                  }}
                  onKeyDown={(
                    evento,
                  ) => {
                    if (
                      evento.key ===
                        'Enter'
                    ) {
                      evento.preventDefault();
                      confirmarEnlace();
                    }
                  }}
                />
              </label>

              {errorEnlace && (
                <p className="ete-link-modal__error">
                  {
                    errorEnlace
                  }
                </p>
              )}
            </div>

            <footer className="ete-link-modal__footer">
              <button
                type="button"
                className="ete-link-modal__secondary"
                onClick={
                  cerrarModalEnlace
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="ete-link-modal__primary"
                onClick={
                  confirmarEnlace
                }
              >
                <Link2
                  size={15}
                />

                Insertar enlace
              </button>
            </footer>
          </section>
        </div>
      )}

      <style>{`
        .ete-rich {
          overflow: hidden;
          border: 1px solid var(--app-border);
          border-radius: 14px;
          background: var(--app-surface);
          transition:
            border-color .16s ease,
            box-shadow .16s ease;
        }

        .ete-rich:focus-within {
          border-color:
            color-mix(
              in srgb,
              var(--app-accent) 58%,
              var(--app-border)
            );
          box-shadow:
            0 0 0 3px
            color-mix(
              in srgb,
              var(--app-accent) 10%,
              transparent
            );
        }

        .ete-rich.is-disabled {
          opacity: .74;
        }

        .ete-rich__toolbar {
          min-height: 46px;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 5px;
          padding: 7px 9px;
          border-bottom:
            1px solid
            var(--app-border);
          background:
            color-mix(
              in srgb,
              var(--app-accent-soft) 42%,
              var(--app-surface)
            );
        }

        .ete-rich__group {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .ete-rich__separator {
          width: 1px;
          height: 24px;
          margin: 0 2px;
          background:
            color-mix(
              in srgb,
              var(--app-accent) 25%,
              var(--app-border)
            );
        }

        .ete-rich__toolbar button {
          width: 32px;
          height: 32px;
          display: inline-grid;
          place-items: center;
          padding: 0;
          border: 1px solid transparent;
          border-radius: 8px;
          color:
            var(--app-accent-dark);
          background:
            transparent;
          cursor: pointer;
          transition:
            border-color .14s ease,
            color .14s ease,
            background .14s ease;
        }

        .ete-rich__toolbar button:hover:not(:disabled) {
          border-color:
            color-mix(
              in srgb,
              var(--app-accent) 24%,
              var(--app-border)
            );
          color:
            var(--app-accent-dark);
          background:
            var(--app-accent-soft);
        }

        .ete-rich__toolbar button:disabled {
          cursor:
            not-allowed;
          opacity:
            .5;
        }

        .ete-rich__text-button {
          font-size:
            14px;
          font-weight:
            900;
        }

        .ete-rich__editor-wrap {
          position:
            relative;
          background:
            var(--app-surface);
        }

        .ete-rich__placeholder {
          position:
            absolute;
          top:
            18px;
          left:
            18px;
          right:
            18px;
          color:
            var(--app-text-muted);
          font-size:
            var(--app-font-body);
          pointer-events:
            none;
          user-select:
            none;
        }

        .ete-rich__editor {
          padding:
            17px 18px 22px;
          outline:
            none;
          color:
            var(--app-text);
          font-size:
            var(--app-font-body);
          line-height:
            1.72;
          overflow-wrap:
            anywhere;
        }

        .ete-rich__editor p {
          margin:
            0 0 10px;
        }

        .ete-rich__editor h2 {
          margin:
            16px 0 8px;
          font-size:
            18px;
          line-height:
            1.35;
        }

        .ete-rich__editor ul,
        .ete-rich__editor ol {
          margin:
            10px 0 12px;
          padding-left:
            30px;
        }

        .ete-rich__editor li {
          margin:
            5px 0;
          padding-left:
            3px;
        }

        .ete-rich__editor li::marker {
          color:
            var(--app-accent-dark);
          font-weight:
            850;
        }

        .ete-rich__editor ul:has(li:only-child:empty),
        .ete-rich__editor ol:has(li:only-child:empty) {
          margin-top:
            0;
        }

        .ete-rich__editor blockquote {
          margin:
            12px 0;
          padding:
            10px 13px;
          border-left:
            3px solid
            var(--app-accent);
          border-radius:
            0 9px 9px 0;
          color:
            var(--app-accent-dark);
          background:
            var(--app-accent-soft);
        }

        .ete-rich__editor a {
          color:
            var(--app-accent-dark);
          text-decoration:
            underline;
        }

        .ete-link-modal__backdrop {
          position:
            fixed;
          inset:
            0;
          z-index:
            1400;
          display:
            grid;
          place-items:
            center;
          padding:
            20px;
          background:
            rgba(
              15,
              23,
              42,
              .48
            );
          backdrop-filter:
            blur(
              2px
            );
        }

        .ete-link-modal {
          width:
            min(
              500px,
              100%
            );
          overflow:
            hidden;
          border:
            1px solid
            color-mix(
              in srgb,
              var(--app-accent) 24%,
              var(--app-border)
            );
          border-radius:
            18px;
          background:
            var(--app-surface);
          box-shadow:
            0 24px 70px
            rgba(
              15,
              23,
              42,
              .22
            );
        }

        .ete-link-modal__header {
          display:
            flex;
          align-items:
            flex-start;
          justify-content:
            space-between;
          gap:
            14px;
          padding:
            18px;
          border-bottom:
            1px solid
            var(--app-border);
          background:
            color-mix(
              in srgb,
              var(--app-accent-soft) 52%,
              var(--app-surface)
            );
        }

        .ete-link-modal__header > div {
          min-width:
            0;
          display:
            flex;
          align-items:
            center;
          gap:
            10px;
        }

        .ete-link-modal__icon {
          width:
            38px;
          height:
            38px;
          display:
            grid;
          place-items:
            center;
          flex:
            0 0 38px;
          border-radius:
            11px;
          color:
            var(--app-accent-dark);
          background:
            var(--app-accent-soft);
        }

        .ete-link-modal__header strong,
        .ete-link-modal__header small {
          display:
            block;
        }

        .ete-link-modal__header strong {
          color:
            var(--app-text);
          font-size:
            var(--app-font-md);
        }

        .ete-link-modal__header small {
          margin-top:
            2px;
          color:
            var(--app-text-muted);
          font-size:
            var(--app-font-xs);
          line-height:
            1.4;
        }

        .ete-link-modal__close {
          width:
            34px;
          height:
            34px;
          display:
            grid;
          place-items:
            center;
          flex:
            0 0 34px;
          padding:
            0;
          border:
            1px solid
            var(--app-border);
          border-radius:
            10px;
          color:
            var(--app-text-secondary);
          background:
            var(--app-surface);
          cursor:
            pointer;
        }

        .ete-link-modal__body {
          display:
            grid;
          gap:
            13px;
          padding:
            18px;
        }

        .ete-link-modal__body label {
          display:
            grid;
          gap:
            6px;
        }

        .ete-link-modal__body label > span {
          color:
            var(--app-text-secondary);
          font-size:
            var(--app-font-xs);
          font-weight:
            850;
        }

        .ete-link-modal__body input {
          width:
            100%;
          min-height:
            42px;
          box-sizing:
            border-box;
          padding:
            9px 11px;
          border:
            1px solid
            var(--app-border);
          border-radius:
            10px;
          outline:
            none;
          color:
            var(--app-text);
          background:
            var(--app-surface);
          font:
            inherit;
          font-size:
            var(--app-font-sm);
        }

        .ete-link-modal__body input:focus {
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

        .ete-link-modal__error {
          margin:
            -3px 0 0;
          color:
            var(--app-danger);
          font-size:
            var(--app-font-xs);
        }

        .ete-link-modal__footer {
          display:
            flex;
          align-items:
            center;
          justify-content:
            flex-end;
          gap:
            8px;
          padding:
            14px 18px 18px;
        }

        .ete-link-modal__footer button {
          min-height:
            38px;
          display:
            inline-flex;
          align-items:
            center;
          justify-content:
            center;
          gap:
            6px;
          padding:
            8px 12px;
          border-radius:
            10px;
          font:
            inherit;
          font-size:
            var(--app-font-xs);
          font-weight:
            850;
          cursor:
            pointer;
        }

        .ete-link-modal__secondary {
          border:
            1px solid
            var(--app-border);
          color:
            var(--app-text-secondary);
          background:
            var(--app-surface);
        }

        .ete-link-modal__primary {
          border:
            1px solid
            var(--app-accent);
          color:
            #fff;
          background:
            var(--app-accent);
        }

        .ete-link-modal__primary:hover {
          border-color:
            var(--app-accent-hover);
          background:
            var(--app-accent-hover);
        }

        @media (
          max-width:
            620px
        ) {
          .ete-rich__separator {
            display:
              none;
          }

          .ete-rich__toolbar {
            gap:
              4px;
          }

          .ete-link-modal__footer {
            flex-direction:
              column-reverse;
          }

          .ete-link-modal__footer button {
            width:
              100%;
          }
        }
      `}</style>
    </>
  );
}
