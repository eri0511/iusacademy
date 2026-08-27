import type {
  CSSProperties,
} from 'react';

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Files,
  GraduationCap,
  Link2,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

import AulaDropdown, {
  type OpcionAulaDropdown,
} from '../aula/AulaDropdown';

import type {
  RecursoContenido,
  RecursoCurso,
} from '../../types/recursos/recursos.types';

import {
  obtenerCategoriaRecurso,
  obtenerVersionVigente,
} from '../../types/recursos/recursos.types';

type Props = {
  recurso:
    RecursoCurso;

  esDocente:
    boolean;

  procesando?:
    boolean;

  onAbrirMateriales:
    () => void;

  onAbrirArchivo:
    (
      contenido:
        RecursoContenido,
    ) => void;

  onDescargarArchivo:
    (
      contenido:
        RecursoContenido,
    ) => void;

  onAbrirEnlace:
    (
      contenido:
        RecursoContenido,
    ) => void;

  onEditar?:
    () => void;

  onVisibilidad?:
    () => void;

  onArchivar?:
    () => void;

  onReintentarDataset?:
    (
      versionId:
        number,
    ) => void;
};

function formatearBytes(
  bytes:
    number,
): string {
  if (
    !Number.isFinite(
      bytes,
    ) ||
    bytes <=
      0
  ) {
    return '0 KB';
  }

  const unidades = [
    'B',
    'KB',
    'MB',
    'GB',
  ];

  const indice =
    Math.min(
      Math.floor(
        Math.log(
          bytes,
        ) /
          Math.log(
            1024,
          ),
      ),
      unidades.length -
        1,
    );

  const valor =
    bytes /
    1024 **
      indice;

  return `${valor.toFixed(
    indice ===
      0
      ? 0
      : 1,
  )} ${unidades[indice]}`;
}

function obtenerUso(
  recurso:
    RecursoCurso,
) {
  if (
    recurso.uso ===
    'SOLO_QUIZZES'
  ) {
    return {
      texto:
        'Solo Quizzes',

      clase:
        'solo-quizzes',

      icono:
        Sparkles,
    };
  }

  if (
    recurso.uso ===
    'AULA_Y_QUIZZES'
  ) {
    return {
      texto:
        'Aula + Quizzes',

      clase:
        'aula-quizzes',

      icono:
        Sparkles,
    };
  }

  return {
    texto:
      'Solo aula',

    clase:
      'solo-aula',

    icono:
      GraduationCap,
  };
}

export default function RecursoCard({
  recurso,
  esDocente,
  procesando = false,
  onAbrirMateriales,
  onAbrirArchivo,
  onDescargarArchivo,
  onAbrirEnlace,
  onEditar,
  onVisibilidad,
  onArchivar,
  onReintentarDataset,
}: Props) {
  const categoria =
    obtenerCategoriaRecurso(
      recurso.categoria,
    );

  const uso =
    obtenerUso(
      recurso,
    );

  const UsoIcono =
    uso.icono;

  const contenidos =
    recurso.contenidos.filter(
      (
        item,
      ) =>
        item.estaActivo,
    );

  const archivos =
    contenidos.filter(
      (
        item,
      ) =>
        item.tipo ===
        'ARCHIVO',
    );

  const enlaces =
    contenidos.filter(
      (
        item,
      ) =>
        item.tipo ===
        'ENLACE',
    );

  const versionesDataset =
    archivos
      .filter(
        (
          item,
        ) =>
          item.disponibleParaQuiz,
      )
      .map(
        (
          item,
        ) =>
          obtenerVersionVigente(
            item,
          ),
      )
      .filter(
        (
          version,
        ): version is NonNullable<typeof version> =>
          Boolean(
            version,
          ),
      );

  const datasetsListos =
    versionesDataset.filter(
      (
        version,
      ) =>
        version.estadoDataset ===
        'LISTO',
    ).length;

  const datasetsProcesando =
    versionesDataset.filter(
      (
        version,
      ) =>
        version.estadoDataset ===
          'PENDIENTE' ||
        version.estadoDataset ===
          'PROCESANDO',
    );

  const datasetsError =
    versionesDataset.filter(
      (
        version,
      ) =>
        version.estadoDataset ===
        'ERROR',
    );

  const datasetEnProceso =
    datasetsProcesando[
      0
    ] ??
    null;

  const datasetConError =
    datasetsError[
      0
    ] ??
    null;

  const unico =
    contenidos.length ===
    1
      ? contenidos[0]
      : null;

  const vigenteUnico =
    unico?.tipo ===
    'ARCHIVO'
      ? obtenerVersionVigente(
          unico,
        )
      : null;

  const Icono =
    contenidos.length >
    1
      ? Files
      : unico?.tipo ===
          'ENLACE'
        ? Link2
        : FileText;

  const opciones:
    OpcionAulaDropdown[] =
    esDocente
      ? [
          {
            texto:
              'Editar información',

            onClick: () =>
              onEditar?.(),
          },

          {
            texto:
              'Administrar materiales',

            onClick:
              onAbrirMateriales,
          },

          ...(recurso.uso !==
          'SOLO_QUIZZES'
            ? [
                {
                  texto:
                    recurso.visibleParaEstudiantes
                      ? 'Ocultar a estudiantes'
                      : 'Mostrar a estudiantes',

                  onClick: () =>
                    onVisibilidad?.(),
                },
              ]
            : []),

          {
            texto:
              'Archivar recurso',

            peligro:
              true,

            separadorAntes:
              true,

            onClick: () =>
              onArchivar?.(),
          },
        ]
      : [];

  return (
    <article
      className="recurso-card"
      style={
        {
          '--recurso-color':
            categoria.color,

          '--recurso-fondo':
            categoria.fondo,
        } as CSSProperties
      }
    >
      <div className="recurso-card__icono">
        <Icono
          size={
            23
          }
        />
      </div>

      <div className="recurso-card__contenido">
        <div className="recurso-card__cabecera">
          <div className="recurso-card__titulos">
            <div className="recurso-card__badges-superiores">
              <span className="recurso-card__categoria">
                {
                  categoria.etiqueta
                }
              </span>

              <span
                className={`recurso-card__alcance ${
                  recurso.alcance === 'CURSO'
                    ? 'recurso-card__alcance--curso'
                    : recurso.hito?.codigo
                      ? `recurso-card__alcance--${recurso.hito.codigo.toLowerCase()}`
                      : 'recurso-card__alcance--hito'
                }`}
              >
                {recurso.alcance === 'CURSO'
                  ? 'Todo el semestre'
                  : recurso.hito?.codigo ?? 'Hito'}
              </span>

              {esDocente && (
                <span
                  className={`recurso-card__uso ${uso.clase}`}
                >
                  <UsoIcono
                    size={
                      10
                    }
                  />

                  {
                    uso.texto
                  }
                </span>
              )}
            </div>

            <h3>
              {
                recurso.titulo
              }
            </h3>
          </div>

          {esDocente && (
            <AulaDropdown
              opciones={
                opciones
              }
              deshabilitado={
                procesando
              }
              ariaLabel={`Opciones de ${recurso.titulo}`}
            />
          )}
        </div>

        {recurso.descripcion && (
          <p className="recurso-card__descripcion">
            {
              recurso.descripcion
            }
          </p>
        )}

        <div className="recurso-card__meta">
          {contenidos.length ===
            0 && (
            <span>
              Sin materiales
            </span>
          )}

          {archivos.length >
            0 && (
            <span>
              {
                archivos.length
              }{' '}
              {archivos.length ===
              1
                ? 'archivo'
                : 'archivos'}
            </span>
          )}

          {enlaces.length >
            0 && (
            <span>
              {
                enlaces.length
              }{' '}
              {enlaces.length ===
              1
                ? 'enlace'
                : 'enlaces'}
            </span>
          )}

          {vigenteUnico && (
            <>
              <span>
                {vigenteUnico.archivo.extension.toUpperCase()}
              </span>

              <span>
                {formatearBytes(
                  vigenteUnico
                    .archivo
                    .tamanioBytes,
                )}
              </span>

              <span>
                v
                {
                  vigenteUnico.numeroVersion
                }
              </span>
            </>
          )}
        </div>

        {esDocente && (
          <div className="recurso-card__estado">
            {recurso.uso !==
              'SOLO_QUIZZES' && (
              <span
                className={
                  recurso.visibleParaEstudiantes
                    ? 'visible'
                    : 'oculto'
                }
              >
                {recurso.visibleParaEstudiantes ? (
                  <Eye
                    size={
                      13
                    }
                  />
                ) : (
                  <EyeOff
                    size={
                      13
                    }
                  />
                )}

                {recurso.visibleParaEstudiantes
                  ? 'Visible para estudiantes'
                  : 'Oculto para estudiantes'}
              </span>
            )}

            {recurso.uso ===
              'SOLO_QUIZZES' && (
              <span className="privado">
                <EyeOff
                  size={
                    13
                  }
                />

                Privado del docente
              </span>
            )}

            {datasetsListos >
              0 && (
              <span className="quiz">
                <Sparkles
                  size={
                    12
                  }
                />

                {
                  datasetsListos
                }{' '}
                {datasetsListos ===
                1
                  ? 'dataset listo'
                  : 'datasets listos'}
              </span>
            )}
          </div>
        )}

        {esDocente &&
          datasetEnProceso && (
          <div className="recurso-card__dataset recurso-card__dataset--procesando">
            <div className="recurso-card__dataset-cabecera">
              <span>
                <LoaderCircle
                  className="recurso-card__dataset-spinner"
                  size={
                    15
                  }
                />

                <strong>
                  {datasetEnProceso.estadoDataset ===
                  'PENDIENTE'
                    ? 'Dataset pendiente'
                    : 'Preparando dataset'}
                </strong>
              </span>

              <b>
                {Math.max(
                  0,
                  Math.min(
                    100,
                    datasetEnProceso.progresoDataset ??
                      0,
                  ),
                )}%
              </b>
            </div>

            <div className="recurso-card__dataset-barra">
              <i
                style={{
                  width: `${Math.max(
                    2,
                    Math.min(
                      100,
                      datasetEnProceso.progresoDataset ??
                        0,
                    ),
                  )}%`,
                }}
              />
            </div>

            <small>
              {datasetEnProceso.archivo.nombreOriginal} · v{datasetEnProceso.numeroVersion}. Puedes continuar trabajando mientras se procesa.
            </small>
          </div>
        )}

        {esDocente &&
          datasetConError && (
          <div className="recurso-card__dataset recurso-card__dataset--error">
            <div className="recurso-card__dataset-cabecera">
              <span>
                <AlertTriangle
                  size={
                    15
                  }
                />

                <strong>
                  Error al preparar dataset
                </strong>
              </span>
            </div>

            <small>
              {datasetConError.errorDataset ??
                'No fue posible procesar el PDF.'}
            </small>

            {onReintentarDataset && (
              <button
                type="button"
                className="recurso-card__dataset-reintentar"
                disabled={
                  procesando
                }
                onClick={() =>
                  onReintentarDataset(
                    datasetConError.id,
                  )
                }
              >
                <RefreshCw
                  size={
                    13
                  }
                />

                Reintentar
              </button>
            )}
          </div>
        )}

        {esDocente &&
          versionesDataset.length >
            0 &&
          datasetsProcesando.length ===
            0 &&
          datasetsError.length ===
            0 &&
          datasetsListos ===
            versionesDataset.length && (
          <div className="recurso-card__dataset recurso-card__dataset--listo">
            <CheckCircle2
              size={
                15
              }
            />

            <span>
              <strong>
                {datasetsListos ===
                1
                  ? 'Dataset listo para Quizzes'
                  : `${datasetsListos} datasets listos para Quizzes`}
              </strong>

              <small>
                La versión vigente ya puede utilizarse como fuente para crear Quizzes.
              </small>
            </span>
          </div>
        )}

        <div className="recurso-card__acciones">
          {contenidos.length ===
            0 &&
            esDocente && (
              <button
                type="button"
                className="principal-suave"
                disabled={
                  procesando
                }
                onClick={
                  onAbrirMateriales
                }
              >
                <Files
                  size={
                    15
                  }
                />

                Agregar materiales
              </button>
            )}

          {contenidos.length >
            1 && (
            <button
              type="button"
              className="principal-suave"
              disabled={
                procesando
              }
              onClick={
                onAbrirMateriales
              }
            >
              <Files
                size={
                  15
                }
              />

              Ver materiales (
              {
                contenidos.length
              }
              )
            </button>
          )}

          {unico?.tipo ===
            'ARCHIVO' &&
            vigenteUnico && (
              <>
                <button
                  type="button"
                  className="secundario"
                  disabled={
                    procesando
                  }
                  onClick={() =>
                    onAbrirArchivo(
                      unico,
                    )
                  }
                >
                  <Eye
                    size={
                      15
                    }
                  />

                  Ver archivo
                </button>

                {vigenteUnico
                  .archivo
                  .permiteDescarga && (
                  <button
                    type="button"
                    className="secundario"
                    disabled={
                      procesando
                    }
                    onClick={() =>
                      onDescargarArchivo(
                        unico,
                      )
                    }
                  >
                    <Download
                      size={
                        15
                      }
                    />

                    Descargar
                  </button>
                )}

                {esDocente && (
                  <button
                    type="button"
                    className="texto"
                    disabled={
                      procesando
                    }
                    onClick={
                      onAbrirMateriales
                    }
                  >
                    Administrar
                  </button>
                )}
              </>
            )}

          {unico?.tipo ===
            'ENLACE' && (
            <>
              <button
                type="button"
                className="secundario"
                disabled={
                  procesando
                }
                onClick={() =>
                  onAbrirEnlace(
                    unico,
                  )
                }
              >
                <ExternalLink
                  size={
                    15
                  }
                />

                Abrir enlace
              </button>

              {esDocente && (
                <button
                  type="button"
                  className="texto"
                  disabled={
                    procesando
                  }
                  onClick={
                    onAbrirMateriales
                  }
                >
                  Administrar
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <style>
        {styles}
      </style>
    </article>
  );
}

const styles = `
  .recurso-card {
    min-width: 0;

    display: grid;
    grid-template-columns:
      52px
      minmax(
        0,
        1fr
      );
    gap: 14px;

    padding: 17px;

    border:
      1px solid
      var(--app-border);
    border-radius: 20px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow-sm);

    transition:
      border-color .16s ease,
      box-shadow .16s ease,
      transform .16s ease;
  }

  .recurso-card:hover {
    transform:
      translateY(
        -1px
      );

    border-color:
      color-mix(
        in srgb,
        var(--recurso-color) 24%,
        var(--app-border)
      );

    box-shadow:
      var(--app-shadow-md);
  }

  .recurso-card__icono {
    width: 52px;
    height: 52px;

    display: grid;
    place-items: center;

    border:
      1px solid
      color-mix(
        in srgb,
        var(--recurso-color) 20%,
        var(--app-border)
      );
    border-radius: 15px;

    color:
      var(--recurso-color);

    background:
      var(--recurso-fondo);
  }

  .recurso-card__contenido {
    min-width: 0;
  }

  .recurso-card__cabecera {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .recurso-card__titulos {
    min-width: 0;
  }

  .recurso-card__badges-superiores {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .recurso-card__categoria,
  .recurso-card__alcance,
  .recurso-card__uso {
    min-height: 22px;

    display: inline-flex;
    align-items: center;
    gap: 4px;

    padding:
      3px
      8px;

    border-radius: 999px;

    font-size: 8px;
    font-weight: 900;
    letter-spacing: .05em;
    text-transform: uppercase;
  }

  .recurso-card__categoria {
    color:
      var(--recurso-color);

    background:
      var(--recurso-fondo);
  }

  .recurso-card__alcance {
    border: 1px solid transparent;
  }

  .recurso-card__alcance--curso {
    color: #087f73;
    border-color: #b7e4dc;
    background: #e7f7f3;
  }

  .recurso-card__alcance--h1 {
    color: #9b67e8;
    border-color: #ddcdf7;
    background: #f2eafb;
  }

  .recurso-card__alcance--h2 {
    color: #e65300;
    border-color: #ffc49f;
    background: #fff0e6;
  }

  .recurso-card__alcance--h3 {
    color: #2457df;
    border-color: #c4d2fa;
    background: #e8eefc;
  }

  .recurso-card__alcance--h4 {
    color: #0c943f;
    border-color: #c4e8cf;
    background: #e3f4e8;
  }

  .recurso-card__alcance--h5 {
    color: #df1f68;
    border-color: #f5c8d9;
    background: #fbe4ed;
  }

  .recurso-card__alcance--hito {
    color: var(--app-text-secondary);
    border-color: var(--app-border);
    background: var(--app-surface-alt);
  }

  .recurso-card__uso.solo-aula {
    color:
      var(--app-text-secondary);

    background:
      var(--app-surface-alt);
  }

  .recurso-card__uso.aula-quizzes,
  .recurso-card__uso.solo-quizzes {
    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .recurso-card h3 {
    margin:
      6px
      0
      0;

    color:
      var(--app-text);

    font-size: 17px;
    font-weight: 850;
    line-height: 1.25;
  }

  .recurso-card__descripcion {
    margin:
      7px
      0
      0;

    color:
      var(--app-text-soft);

    font-size: 11px;
    line-height: 1.5;
  }

  .recurso-card__meta,
  .recurso-card__estado,
  .recurso-card__acciones {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 7px;
  }

  .recurso-card__meta {
    margin-top: 9px;

    color:
      var(--app-text-muted);

    font-size: 9px;
  }

  .recurso-card__meta
  span:not(:last-child)::after {
    content: '·';

    margin-left: 7px;
  }

  .recurso-card__estado {
    margin-top: 9px;
  }

  .recurso-card__estado span {
    min-height: 25px;

    display: inline-flex;
    align-items: center;
    gap: 5px;

    padding:
      4px
      8px;

    border-radius: 999px;

    font-size: 8px;
    font-weight: 850;
  }

  .recurso-card__estado .visible {
    color:
      var(--app-success);

    background:
      var(--app-success-bg);
  }

  .recurso-card__estado .oculto,
  .recurso-card__estado .privado {
    color:
      var(--app-text-soft);

    background:
      var(--app-surface-alt);
  }

  .recurso-card__estado .quiz {
    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .recurso-card__dataset {
    margin-top: 10px;
    display: grid;
    gap: 7px;
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .recurso-card__dataset-cabecera {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .recurso-card__dataset-cabecera > span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .recurso-card__dataset strong {
    font-size: 9.5px;
    font-weight: 850;
  }

  .recurso-card__dataset small {
    color: var(--app-text-muted);
    font-size: 8.5px;
    line-height: 1.45;
  }

  .recurso-card__dataset b {
    color: var(--app-accent-dark);
    font-size: 9px;
  }

  .recurso-card__dataset--procesando {
    border-color: color-mix(in srgb, var(--app-accent) 24%, var(--app-border));
    color: var(--app-accent-dark);
    background: color-mix(in srgb, var(--app-accent-soft) 65%, var(--app-surface));
  }

  .recurso-card__dataset-spinner {
    animation: recursoDatasetSpin 1s linear infinite;
  }

  .recurso-card__dataset-barra {
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background: color-mix(in srgb, var(--app-accent) 12%, var(--app-border-soft));
  }

  .recurso-card__dataset-barra i {
    height: 100%;
    display: block;
    border-radius: inherit;
    background: var(--app-accent);
    transition: width .25s ease;
  }

  .recurso-card__dataset--error {
    border-color: color-mix(in srgb, var(--app-danger) 24%, var(--app-border));
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .recurso-card__dataset--listo {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    color: var(--app-success);
    border-color: color-mix(in srgb, var(--app-success) 22%, var(--app-border));
    background: var(--app-success-bg);
  }

  .recurso-card__dataset--listo > span {
    display: grid;
    gap: 2px;
  }

  .recurso-card__dataset-reintentar {
    width: max-content;
    min-height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 6px 9px;
    border: 1px solid color-mix(in srgb, var(--app-danger) 35%, var(--app-border));
    border-radius: 9px;
    color: var(--app-danger);
    background: var(--app-surface);
    font: inherit;
    font-size: 8.5px;
    font-weight: 850;
    cursor: pointer;
  }

  @keyframes recursoDatasetSpin {
    to {
      transform: rotate(360deg);
    }
  }

  .recurso-card__acciones {
    margin-top: 12px;
  }

  .recurso-card__acciones button {
    min-height: 34px;

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    padding:
      7px
      10px;

    border-radius: 10px;

    font-family: inherit;
    font-size: 9.5px;
    font-weight: 800;

    cursor: pointer;
  }

  .recurso-card__acciones button:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .recurso-card__acciones .secundario,
  .recurso-card__acciones .principal-suave {
    border:
      1px solid
      var(--app-border-strong);

    color:
      var(--app-text-secondary);

    background:
      var(--app-surface);
  }

  .recurso-card__acciones .principal-suave {
    border-color:
      color-mix(
        in srgb,
        var(--recurso-color) 35%,
        var(--app-border)
      );

    color:
      var(--recurso-color);

    background:
      var(--recurso-fondo);
  }

  .recurso-card__acciones .texto {
    border: 0;

    color:
      var(--recurso-color);

    background:
      transparent;
  }

  @media (
    max-width:
      620px
  ) {
    .recurso-card {
      grid-template-columns:
        1fr;
    }
  }

  @media (
    prefers-reduced-motion:
      reduce
  ) {
    .recurso-card {
      transition: none;
    }

    .recurso-card:hover {
      transform: none;
    }

    .recurso-card__dataset-spinner {
      animation: none;
    }
  }
`;