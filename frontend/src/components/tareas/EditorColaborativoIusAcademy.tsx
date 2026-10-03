import {
  CheckCircle2,
  Circle,
  UsersRound,
} from 'lucide-react';

import type {
  CSSProperties,
} from 'react';

import {
  useMemo,
} from 'react';

import EditorTextoEnriquecidoTarea from './EditorTextoEnriquecidoTarea';

type UsuarioColaborativo = {
  id: number;
  nombre: string;
  color?: string;
  enLinea?: boolean;
};

type ActividadAutor = {
  usuarioId: number;
  nombre: string;
  color: string;
  ediciones: number;
  ultimaEdicion: string;
};

type DocumentoCompartidoEstado = {
  version: 1;
  formato: 'IUSACADEMY_COLABORATIVO';
  html: string;
  actividad: ActividadAutor[];
  actualizadoEn: string | null;
};

type Props = {
  valor: string;
  usuario:
    | {
        id: number;
        nombre: string;
      }
    | null;
  colaboradores?: UsuarioColaborativo[];
  onChange: (
    valor:
      string,
  ) => void;
  deshabilitado?: boolean;
  placeholder?: string;
  titulo?: string;
  descripcion?: string;
  altoMinimo?: number;
};

const COLORES_AUTORES = [
  '#ea580c',
  '#2563eb',
  '#16a34a',
  '#9333ea',
  '#0891b2',
  '#c026d3',
  '#65a30d',
  '#dc2626',
];

function colorDeAutor(
  usuarioId:
    number,
) {
  const indice =
    Math.abs(
      usuarioId,
    ) %
    COLORES_AUTORES.length;

  return COLORES_AUTORES[
    indice
  ];
}

function estadoInicial():
  DocumentoCompartidoEstado {
  return {
    version:
      1,
    formato:
      'IUSACADEMY_COLABORATIVO',
    html:
      '',
    actividad:
      [],
    actualizadoEn:
      null,
  };
}

function parsearEstado(
  valor:
    string,
):
  DocumentoCompartidoEstado {
  if (
    !valor.trim()
  ) {
    return estadoInicial();
  }

  try {
    const analizado =
      JSON.parse(
        valor,
      ) as Partial<DocumentoCompartidoEstado>;

    if (
      analizado.formato ===
        'IUSACADEMY_COLABORATIVO' &&
      typeof analizado.html ===
        'string'
    ) {
      return {
        version:
          1,
        formato:
          'IUSACADEMY_COLABORATIVO',
        html:
          analizado.html,
        actividad:
          Array.isArray(
            analizado.actividad,
          )
            ? analizado.actividad
            : [],
        actualizadoEn:
          typeof analizado.actualizadoEn ===
            'string'
            ? analizado.actualizadoEn
            : null,
      };
    }
  } catch {
    return {
      ...estadoInicial(),
      html:
        valor,
    };
  }

  return {
    ...estadoInicial(),
    html:
      valor,
  };
}

function serializarEstado(
  estado:
    DocumentoCompartidoEstado,
) {
  return JSON.stringify(
    estado,
  );
}

export default function EditorColaborativoIusAcademy({
  valor,
  usuario,
  colaboradores = [],
  onChange,
  deshabilitado = false,
  placeholder = 'Escriban aquí la respuesta del equipo...',
  titulo = 'Respuesta del equipo',
  descripcion = 'Todos los integrantes trabajan sobre el mismo contenido.',
  altoMinimo = 380,
}: Props) {
  const estado =
    useMemo(
      () =>
        parsearEstado(
          valor,
        ),
      [
        valor,
      ],
    );

  const colaboradoresNormalizados =
    useMemo(
      () => {
        const mapa =
          new Map<
            number,
            UsuarioColaborativo
          >();

        colaboradores.forEach(
          (
            colaborador,
          ) => {
            mapa.set(
              colaborador.id,
              {
                ...colaborador,
                color:
                  colaborador.color ??
                  colorDeAutor(
                    colaborador.id,
                  ),
              },
            );
          },
        );

        estado.actividad.forEach(
          (
            autor,
          ) => {
            if (
              !mapa.has(
                autor.usuarioId,
              )
            ) {
              mapa.set(
                autor.usuarioId,
                {
                  id:
                    autor.usuarioId,
                  nombre:
                    autor.nombre,
                  color:
                    autor.color,
                  enLinea:
                    false,
                },
              );
            }
          },
        );

        if (
          usuario &&
          !mapa.has(
            usuario.id,
          )
        ) {
          mapa.set(
            usuario.id,
            {
              id:
                usuario.id,
              nombre:
                usuario.nombre,
              color:
                colorDeAutor(
                  usuario.id,
                ),
              enLinea:
                true,
            },
          );
        }

        return Array.from(
          mapa.values(),
        );
      },
      [
        colaboradores,
        estado.actividad,
        usuario,
      ],
    );

  const actualizarContenido =
    (
      html:
        string,
    ) => {
      if (
        deshabilitado ||
        !usuario
      ) {
        return;
      }

      const ahora =
        new Date().toISOString();

      const color =
        colorDeAutor(
          usuario.id,
        );

      const existente =
        estado.actividad.find(
          (
            autor,
          ) =>
            autor.usuarioId ===
            usuario.id,
        );

      const actividad =
        existente
          ? estado.actividad.map(
              (
                autor,
              ) =>
                autor.usuarioId ===
                  usuario.id
                  ? {
                      ...autor,
                      nombre:
                        usuario.nombre,
                      color,
                      ediciones:
                        autor.ediciones +
                        1,
                      ultimaEdicion:
                        ahora,
                    }
                  : autor,
            )
          : [
              ...estado.actividad,
              {
                usuarioId:
                  usuario.id,
                nombre:
                  usuario.nombre,
                color,
                ediciones:
                  1,
                ultimaEdicion:
                  ahora,
              },
            ];

      onChange(
        serializarEstado({
          ...estado,
          html,
          actividad,
          actualizadoEn:
            ahora,
        }),
      );
    };

  return (
    <section className="editor-colaborativo-ius">
      <header className="editor-colaborativo-ius__cabecera">
        <div className="editor-colaborativo-ius__identidad">
          <span className="editor-colaborativo-ius__icono">
            <UsersRound
              size={18}
            />
          </span>

          <div>
            <strong>
              {titulo}
            </strong>

            <small>
              {descripcion}
            </small>
          </div>
        </div>

        <div className="editor-colaborativo-ius__presencia">
          <span className="editor-colaborativo-ius__presencia-texto">
            <Circle
              size={8}
              fill="currentColor"
            />

            {
              colaboradoresNormalizados.filter(
                (
                  colaborador,
                ) =>
                  colaborador.enLinea,
              ).length
            } en línea
          </span>

          <div className="editor-colaborativo-ius__avatares">
            {colaboradoresNormalizados
              .slice(
                0,
                5,
              )
              .map(
                (
                  colaborador,
                ) => (
                  <span
                    key={
                      colaborador.id
                    }
                    className={`editor-colaborativo-ius__avatar ${
                      colaborador.enLinea
                        ? 'en-linea'
                        : ''
                    }`}
                    title={`${colaborador.nombre}${
                      colaborador.enLinea
                        ? ' · En línea'
                        : ''
                    }`}
                    style={{
                      '--editor-color-autor':
                        colaborador.color ??
                        colorDeAutor(
                          colaborador.id,
                        ),
                    } as CSSProperties}
                  >
                    {
                      colaborador.nombre
                        .trim()
                        .charAt(
                          0,
                        )
                        .toUpperCase()
                    }
                  </span>
                ),
              )}

            {colaboradoresNormalizados.length >
              5 && (
              <span className="editor-colaborativo-ius__avatar editor-colaborativo-ius__avatar--mas">
                +{
                  colaboradoresNormalizados.length -
                  5
                }
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="editor-colaborativo-ius__editor">
        <EditorTextoEnriquecidoTarea
          valor={
            estado.html
          }
          onChange={
            actualizarContenido
          }
          deshabilitado={
            deshabilitado ||
            !usuario
          }
          placeholder={
            placeholder
          }
          altoMinimo={
            altoMinimo
          }
        />
      </div>

      <footer className="editor-colaborativo-ius__pie">
        <div className="editor-colaborativo-ius__nota">
          <CheckCircle2
            size={14}
          />

          <span>
            Un solo documento compartido para todo el equipo.
          </span>
        </div>

        {estado.actualizadoEn && (
          <span className="editor-colaborativo-ius__guardado">
            Última edición guardada
          </span>
        )}
      </footer>

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .editor-colaborativo-ius {
    display: grid;
    gap: 11px;
    min-width: 0;
  }

  .editor-colaborativo-ius__cabecera {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    padding: 0 2px;
  }

  .editor-colaborativo-ius__identidad {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .editor-colaborativo-ius__icono {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    flex: 0 0 38px;
    border: 1px solid color-mix(
      in srgb,
      var(--app-accent) 18%,
      transparent
    );
    border-radius: 11px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .editor-colaborativo-ius__identidad > div {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .editor-colaborativo-ius__identidad strong {
    color: var(--app-text);
    font-size: 13px;
    line-height: 1.25;
  }

  .editor-colaborativo-ius__identidad small {
    color: var(--app-text-muted);
    font-size: 10px;
    line-height: 1.4;
  }

  .editor-colaborativo-ius__presencia {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .editor-colaborativo-ius__presencia-texto {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--app-success, #15803d);
    font-size: 9.5px;
    font-weight: 800;
    white-space: nowrap;
  }

  .editor-colaborativo-ius__avatares {
    display: flex;
    align-items: center;
    padding-left: 7px;
  }

  .editor-colaborativo-ius__avatar {
    --editor-color-autor: var(--app-accent);

    width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    margin-left: -7px;
    border: 2px solid var(--app-surface);
    border-radius: 999px;
    color: #fff;
    background: var(--editor-color-autor);
    font-size: 10px;
    font-weight: 900;
    box-shadow: 0 2px 8px rgba(15, 23, 42, .10);
    opacity: .56;
    transition:
      opacity .16s ease,
      transform .16s ease,
      box-shadow .16s ease;
  }

  .editor-colaborativo-ius__avatar:hover {
    transform: translateY(-1px);
  }

  .editor-colaborativo-ius__avatar.en-linea {
    opacity: 1;
    box-shadow:
      0 0 0 2px
      color-mix(
        in srgb,
        var(--editor-color-autor) 18%,
        transparent
      );
  }

  .editor-colaborativo-ius__avatar--mas {
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    border-color: var(--app-surface);
    opacity: 1;
  }

  .editor-colaborativo-ius__editor {
    min-width: 0;
  }

  .editor-colaborativo-ius__pie {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 2px;
  }

  .editor-colaborativo-ius__nota {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--app-text-muted);
    font-size: 9px;
    line-height: 1.4;
  }

  .editor-colaborativo-ius__nota svg {
    flex: 0 0 auto;
    color: var(--app-accent);
  }

  .editor-colaborativo-ius__guardado {
    color: var(--app-text-muted);
    font-size: 8.5px;
  }

  @media (max-width: 620px) {
    .editor-colaborativo-ius__cabecera {
      align-items: flex-start;
    }

    .editor-colaborativo-ius__presencia {
      width: 100%;
      justify-content: space-between;
    }

    .editor-colaborativo-ius__pie {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;
