import {
  BookOpen,
  Files,
  Layers3,
  RefreshCw,
  Search,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useAuth,
} from '../../../auth/AuthContext';

import AulaEmptyState from '../../../components/aula/AulaEmptyState';
import AulaHeader from '../../../components/aula/AulaHeader';
import AulaSkeleton from '../../../components/aula/AulaSkeleton';

import AulaToolbar, {
  type OpcionAulaToolbar,
} from '../../../components/aula/AulaToolbar';

import ContenidoRecursoModal from '../../../components/recursos/ContenidoRecursoModal';
import RecursoCard from '../../../components/recursos/RecursoCard';

import Toast, {
  type TipoToast,
} from '../../../components/shared/Toast';

import {
  useAulaContext,
} from '../../../contexts/AulaContext';

import {
  abrirArchivo,
  abrirEnlaceExterno,
  descargarArchivo,
  listarRecursos,
} from '../../../services/recursos/recursos.service';

import type {
  RecursoContenido,
  RecursoCurso,
} from '../../../types/recursos/recursos.types';

import {
  obtenerVersionVigente,
} from '../../../types/recursos/recursos.types';

type FiltroRecursosEstudiante =
  | 'TODOS'
  | 'GENERALES'
  | 'HITO_ACTUAL';

type EstadoToast = {
  visible:
    boolean;

  tipo:
    TipoToast;

  titulo:
    string;

  mensaje?:
    string;
};

export default function RecursosCursoEstudiante() {
  const {
    accessToken,
  } =
    useAuth();

  const {
    curso,
    hitoSeleccionado,
  } =
    useAulaContext();

  const [
    recursos,
    setRecursos,
  ] =
    useState<
      RecursoCurso[]
    >(
      [],
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(
      true,
    );

  const [
    procesando,
    setProcesando,
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
    filtro,
    setFiltro,
  ] =
    useState<
      FiltroRecursosEstudiante
    >(
      'TODOS',
    );

  const [
    recursoAbiertoId,
    setRecursoAbiertoId,
  ] =
    useState<
      number |
      null
    >(
      null,
    );

  const [
    toast,
    setToast,
  ] =
    useState<
      EstadoToast
    >({
      visible:
        false,

      tipo:
        'informacion',

      titulo:
        '',
    });

  const mostrarToast =
    useCallback(
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
      },
      [],
    );

  const cargar =
    useCallback(
      async () => {
        if (
          !accessToken ||
          !curso?.id
        ) {
          setCargando(
            false,
          );

          return;
        }

        try {
          setCargando(
            true,
          );

          const respuesta =
            await listarRecursos(
              curso.id,
              accessToken,
            );

          setRecursos(
            respuesta.filter(
              (
                recurso,
              ) =>
                recurso.estaActivo &&
                recurso.estado ===
                  'ACTIVO' &&
                recurso.visibleParaEstudiantes &&
                recurso.uso !==
                  'SOLO_QUIZZES',
            ),
          );
        } catch (
          error
        ) {
          mostrarToast(
            'error',
            'No se pudieron cargar los recursos',
            error instanceof
              Error
              ? error.message
              : undefined,
          );
        } finally {
          setCargando(
            false,
          );
        }
      },
      [
        accessToken,
        curso?.id,
        mostrarToast,
      ],
    );

  useEffect(
    () => {
      void cargar();
    },
    [
      cargar,
    ],
  );

  const recursoAbierto =
    useMemo(
      () =>
        recursos.find(
          (
            recurso,
          ) =>
            recurso.id ===
            recursoAbiertoId,
        ) ??
        null,
      [
        recursos,
        recursoAbiertoId,
      ],
    );

  const filtros:
    OpcionAulaToolbar<
      FiltroRecursosEstudiante
    >[] = [
      {
        id:
          'TODOS',

        texto:
          'Todos',

        icono:
          Files,

        contador:
          recursos.filter(
            (
              recurso,
            ) =>
              recurso.alcance ===
                'CURSO' ||
              recurso.hitoId ===
                hitoSeleccionado?.id,
          ).length,
      },

      {
        id:
          'GENERALES',

        texto:
          'Generales',

        icono:
          BookOpen,

        contador:
          recursos.filter(
            (
              recurso,
            ) =>
              recurso.alcance ===
              'CURSO',
          ).length,
      },

      {
        id:
          'HITO_ACTUAL',

        texto:
          hitoSeleccionado?.codigo ??
          'Hito actual',

        icono:
          Layers3,

        contador:
          recursos.filter(
            (
              recurso,
            ) =>
              recurso.hitoId ===
              hitoSeleccionado?.id,
          ).length,

        deshabilitada:
          !hitoSeleccionado,
      },
    ];

  const filtrados =
    useMemo(
      () => {
        const termino =
          busqueda
            .trim()
            .toLocaleLowerCase(
              'es',
            );

        return recursos.filter(
          (
            recurso,
          ) => {
            if (
              filtro ===
                'TODOS' &&
              recurso.alcance !==
                'CURSO' &&
              recurso.hitoId !==
                hitoSeleccionado?.id
            ) {
              return false;
            }

            if (
              filtro ===
                'GENERALES' &&
              recurso.alcance !==
                'CURSO'
            ) {
              return false;
            }

            if (
              filtro ===
                'HITO_ACTUAL' &&
              recurso.hitoId !==
                hitoSeleccionado?.id
            ) {
              return false;
            }

            if (
              !termino
            ) {
              return true;
            }

            const texto =
              [
                recurso.titulo,
                recurso.descripcion ??
                  '',
                recurso.hito?.codigo ??
                  '',
                recurso.hito?.nombre ??
                  '',
              ]
                .join(
                  ' ',
                )
                .toLocaleLowerCase(
                  'es',
                );

            return texto.includes(
              termino,
            );
          },
        );
      },
      [
        busqueda,
        filtro,
        hitoSeleccionado?.id,
        recursos,
      ],
    );

  const abrirContenidoArchivo =
    async (
      contenido:
        RecursoContenido,

      descargar =
        false,
    ) => {
      if (
        !accessToken
      ) {
        return;
      }

      const vigente =
        obtenerVersionVigente(
          contenido,
        );

      if (
        !vigente
      ) {
        mostrarToast(
          'advertencia',
          'Archivo no disponible',
          'Este material todavía no tiene una versión disponible.',
        );

        return;
      }

      try {
        setProcesando(
          true,
        );

        if (
          descargar
        ) {
          await descargarArchivo(
            vigente.archivo.id,
            vigente.archivo.nombreOriginal,
            accessToken,
          );
        } else {
          await abrirArchivo(
            vigente.archivo.id,
            accessToken,
          );
        }
      } catch (
        error
      ) {
        mostrarToast(
          'error',
          descargar
            ? 'No fue posible descargar el archivo'
            : 'No fue posible abrir el archivo',
          error instanceof
            Error
            ? error.message
            : undefined,
        );
      } finally {
        setProcesando(
          false,
        );
      }
    };

  if (
    cargando &&
    recursos.length ===
      0
  ) {
    return (
      <AulaSkeleton
        variante="lista"
        cantidad={
          4
        }
      />
    );
  }

  return (
    <section className="recursos-estudiante-page">
      <AulaHeader
        icono={
          Files
        }
        etiqueta="Material académico"
        titulo="Recursos"
        descripcion="Consulta los materiales compartidos por tu docente para el curso y el hito seleccionado."
        informacion={
          hitoSeleccionado
            ? `Hito seleccionado: ${hitoSeleccionado.codigo} · ${hitoSeleccionado.nombre}`
            : 'Aquí encontrarás los materiales generales disponibles durante el semestre.'
        }
        acciones={[
          {
            texto:
              'Actualizar',

            icono:
              RefreshCw,

            onClick: () =>
              void cargar(),

            deshabilitada:
              cargando ||
              procesando,
          },
        ]}
      />

      <div className="recursos-estudiante-page__controles">
        <AulaToolbar
          opciones={
            filtros
          }
          opcionActiva={
            filtro
          }
          onCambiar={
            setFiltro
          }
        />

        <label className="recursos-estudiante-buscador">
          <Search
            size={
              17
            }
          />

          <input
            value={
              busqueda
            }
            placeholder="Buscar por título, descripción o hito..."
            onChange={(
              evento,
            ) =>
              setBusqueda(
                evento.target.value,
              )
            }
          />
        </label>
      </div>

      {filtrados.length ===
      0 ? (
        <AulaEmptyState
          icono={
            Files
          }
          titulo={
            recursos.length ===
            0
              ? 'Aún no hay recursos disponibles'
              : 'No encontramos recursos'
          }
          descripcion={
            recursos.length ===
            0
              ? 'El docente todavía no publicó materiales visibles para estudiantes.'
              : filtro ===
                  'HITO_ACTUAL'
                ? 'No hay recursos disponibles para el hito seleccionado con los criterios actuales.'
                : 'Prueba con otro filtro o término de búsqueda.'
          }
        />
      ) : (
        <div className="recursos-estudiante-grid">
          {filtrados.map(
            (
              recurso,
            ) => (
              <RecursoCard
                key={
                  recurso.id
                }
                recurso={
                  recurso
                }
                esDocente={
                  false
                }
                procesando={
                  procesando
                }
                onAbrirMateriales={() =>
                  setRecursoAbiertoId(
                    recurso.id,
                  )
                }
                onAbrirArchivo={(
                  contenido,
                ) =>
                  void abrirContenidoArchivo(
                    contenido,
                  )
                }
                onDescargarArchivo={(
                  contenido,
                ) =>
                  void abrirContenidoArchivo(
                    contenido,
                    true,
                  )
                }
                onAbrirEnlace={(
                  contenido,
                ) => {
                  if (
                    contenido.urlExterna
                  ) {
                    abrirEnlaceExterno(
                      contenido.urlExterna,
                    );
                  }
                }}
              />
            ),
          )}
        </div>
      )}

      <ContenidoRecursoModal
        abierto={
          Boolean(
            recursoAbierto,
          )
        }
        recurso={
          recursoAbierto
        }
        esDocente={
          false
        }
        bloqueado={
          procesando
        }
        onCerrar={() =>
          setRecursoAbiertoId(
            null,
          )
        }
        onAbrirArchivo={(
          contenido,
        ) =>
          void abrirContenidoArchivo(
            contenido,
          )
        }
        onDescargarArchivo={(
          contenido,
        ) =>
          void abrirContenidoArchivo(
            contenido,
            true,
          )
        }
        onAbrirEnlace={(
          contenido,
        ) => {
          if (
            contenido.urlExterna
          ) {
            abrirEnlaceExterno(
              contenido.urlExterna,
            );
          }
        }}
      />

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
          setToast(
            (
              actual,
            ) => ({
              ...actual,

              visible:
                false,
            }),
          )
        }
      />

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .recursos-estudiante-page {
    position: relative;

    min-width: 0;

    display: grid;
    gap: 16px;
  }

  .recursos-estudiante-page__controles {
    min-width: 0;

    display: grid;
    grid-template-columns:
      minmax(
        0,
        1fr
      )
      minmax(
        280px,
        380px
      );

    align-items: stretch;
    gap: 10px;
  }

  .recursos-estudiante-buscador {
    min-width: 0;
    min-height: 66px;

    display: flex;
    align-items: center;
    gap: 9px;

    padding:
      0
      14px;

    border:
      1px solid
      var(--app-border);

    border-radius:
      18px;

    color:
      var(--app-text-muted);

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow-sm);
  }

  .recursos-estudiante-buscador:focus-within {
    border-color:
      color-mix(
        in srgb,
        var(--app-accent) 42%,
        var(--app-border)
      );

    box-shadow:
      0
      0
      0
      3px
      color-mix(
        in srgb,
        var(--app-accent) 8%,
        transparent
      );
  }

  .recursos-estudiante-buscador input {
    width: 100%;
    min-width: 0;

    border: 0;
    outline: 0;

    color:
      var(--app-text);

    background:
      transparent;

    font: inherit;
    font-size: 11px;
  }

  .recursos-estudiante-buscador input::placeholder {
    color:
      var(--app-text-muted);
  }

  .recursos-estudiante-grid {
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

    gap: 12px;
  }

  @media (
    max-width:
      980px
  ) {
    .recursos-estudiante-grid,
    .recursos-estudiante-page__controles {
      grid-template-columns:
        1fr;
    }
  }
`;
 