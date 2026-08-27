import {
  Archive,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Files,
  FilePlus2,
  FolderOpen,
  Layers3,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
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
import AulaModal from '../../../components/aula/AulaModal';
import AulaSkeleton from '../../../components/aula/AulaSkeleton';

import AulaToolbar, {
  type OpcionAulaToolbar,
} from '../../../components/aula/AulaToolbar';

import ContenidoRecursoModal from '../../../components/recursos/ContenidoRecursoModal';

import FormularioRecurso, {
  type FormularioRecursoValor,
  type PasoFormularioRecurso,
} from '../../../components/recursos/FormularioRecurso';

import HistorialVersionesRecurso from '../../../components/recursos/HistorialVersionesRecurso';
import RecursoCard from '../../../components/recursos/RecursoCard';
import ReemplazarContenidoModal from '../../../components/recursos/ReemplazarContenidoModal';
import SelectorCategoriaRecurso from '../../../components/recursos/SelectorCategoriaRecurso';

import Toast, {
  type TipoToast,
} from '../../../components/shared/Toast';

import {
  useAulaContext,
} from '../../../contexts/AulaContext';

import {
  abrirArchivo,
  abrirEnlaceExterno,
  actualizarRecurso,
  agregarArchivoRecurso,
  agregarEnlaceRecurso,
  archivarRecurso,
  cambiarVisibilidadRecurso,
  crearRecurso,
  descargarArchivo,
  eliminarContenidoRecurso,
  listarRecursos,
  reemplazarContenidoRecurso,
  reintentarDatasetRecurso,
} from '../../../services/recursos/recursos.service';

import type {
  CategoriaRecursoCurso,
  RecursoContenido,
  RecursoCurso,
  ReemplazarContenidoDatos,
} from '../../../types/recursos/recursos.types';

import {
  obtenerVersionVigente,
} from '../../../types/recursos/recursos.types';

type FiltroAlcance =
  | 'TODOS'
  | 'GENERALES'
  | 'HITO_ACTUAL'
  | 'QUIZZES';

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


const inicial:
  FormularioRecursoValor = {
    titulo:
      '',

    descripcion:
      '',

    /*
     * Este valor solo mantiene compatibilidad con el tipo del formulario.
     * NO se utiliza como selección inicial del catálogo.
     *
     * El modal de categorías utiliza categoriaSeleccionada = null.
     */
    categoria:
      'MATERIAL_COMPLEMENTARIO',

    alcance:
      'HITO',

    uso:
      'AULA',

    hitoId:
      null,

    visibleParaEstudiantes:
      true,

    archivos:
      [],

    enlaces:
      [],
  };

export default function RecursosCurso() {
  const {
    accessToken,
  } =
    useAuth();

  const {
    curso,
    hitoSeleccionado,
    aula,
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
    filtroAlcance,
    setFiltroAlcance,
  ] =
    useState<
      FiltroAlcance
    >(
      'TODOS',
    );

  /*
   * ============================================================
   * CATEGORÍA TEMPORAL DEL SELECTOR
   * ============================================================
   *
   * Esta variable es independiente de formulario.categoria.
   *
   * Nuevo recurso:
   * null -> ninguna opción preseleccionada.
   *
   * Cambio de categoría desde el formulario:
   * toma la categoría actual para mostrarla seleccionada.
   */
  const [
    categoriaSeleccionada,
    setCategoriaSeleccionada,
  ] =
    useState<
      CategoriaRecursoCurso |
      null
    >(
      null,
    );

  const [
    selectorCategoriaAbierto,
    setSelectorCategoriaAbierto,
  ] =
    useState(
      false,
    );

  const [
    formularioAbierto,
    setFormularioAbierto,
  ] =
    useState(
      false,
    );

  const [
    pasoFormulario,
    setPasoFormulario,
  ] =
    useState<
      PasoFormularioRecurso
    >(
      1,
    );

  const [
    recursoEditado,
    setRecursoEditado,
  ] =
    useState<
      RecursoCurso |
      null
    >(
      null,
    );

  const [
    formulario,
    setFormulario,
  ] =
    useState<
      FormularioRecursoValor
    >(
      inicial,
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
    recursoMaterialesId,
    setRecursoMaterialesId,
  ] =
    useState<
      number |
      null
    >(
      null,
    );

  const [
    formularioMateriales,
    setFormularioMateriales,
  ] =
    useState<
      FormularioRecursoValor
    >(
      inicial,
    );

  const [
    contenidoReemplazar,
    setContenidoReemplazar,
  ] =
    useState<
      RecursoContenido |
      null
    >(
      null,
    );

  const [
    contenidoHistorial,
    setContenidoHistorial,
  ] =
    useState<
      RecursoContenido |
      null
    >(
      null,
    );

  const [
    recursoArchivar,
    setRecursoArchivar,
  ] =
    useState<
      RecursoCurso |
      null
    >(
      null,
    );

  const [
    contenidoEliminar,
    setContenidoEliminar,
  ] =
    useState<
      RecursoContenido |
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
            respuesta,
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
            item,
          ) =>
            item.id ===
            recursoAbiertoId,
        ) ??
        null,
      [
        recursos,
        recursoAbiertoId,
      ],
    );

  const recursoMateriales =
    useMemo(
      () =>
        recursos.find(
          (
            item,
          ) =>
            item.id ===
            recursoMaterialesId,
        ) ??
        null,
      [
        recursos,
        recursoMaterialesId,
      ],
    );

  const hayDatasetsProcesando =
    useMemo(
      () =>
        recursos.some(
          (
            recurso,
          ) =>
            recurso.contenidos.some(
              (
                contenido,
              ) => {
                const vigente =
                  obtenerVersionVigente(
                    contenido,
                  );

                return Boolean(
                  contenido.disponibleParaQuiz &&
                    vigente &&
                    (
                      vigente.estadoDataset ===
                        'PENDIENTE' ||
                      vigente.estadoDataset ===
                        'PROCESANDO'
                    ),
                );
              },
            ),
        ),
      [
        recursos,
      ],
    );

  useEffect(
    () => {
      if (
        !hayDatasetsProcesando ||
        !accessToken ||
        !curso?.id
      ) {
        return;
      }

      const intervalo =
        window.setInterval(
          () => {
            void listarRecursos(
              curso.id,
              accessToken,
            )
              .then(
                setRecursos,
              )
              .catch(
                () => {
                  // El refresco visual es auxiliar; el error principal
                  // se maneja desde las acciones explícitas del usuario.
                },
              );
          },
          2500,
        );

      return () => {
        window.clearInterval(
          intervalo,
        );
      };
    },
    [
      hayDatasetsProcesando,
      accessToken,
      curso?.id,
    ],
  );

  const reintentarDataset =
    async (
      versionId:
        number,
    ) => {
      if (
        !accessToken ||
        !curso?.id
      ) {
        return;
      }

      try {
        setProcesando(
          true,
        );

        await reintentarDatasetRecurso(
          curso.id,
          versionId,
          accessToken,
        );

        await cargar();

        mostrarToast(
          'exito',
          'Dataset enviado a procesamiento',
          'Puedes continuar trabajando mientras se vuelve a preparar.',
        );
      } catch (
        error
      ) {
        mostrarToast(
          'error',
          'No fue posible reintentar el dataset',
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

  const hitos =
    aula.planificacion.hitos.map(
      (
        hito,
      ) => ({
        id:
          hito.id,

        codigo:
          hito.codigo,

        nombre:
          hito.nombre,
      }),
    );

  /*
   * ============================================================
   * NUEVO RECURSO
   * ============================================================
   *
   * La categoría del catálogo SIEMPRE empieza en null.
   */
  const abrirCrear =
    () => {
      setRecursoEditado(
        null,
      );

      setCategoriaSeleccionada(
        null,
      );

      setFormulario({
        ...inicial,

        alcance:
          hitoSeleccionado
            ? 'HITO'
            : 'CURSO',

        hitoId:
          hitoSeleccionado?.id ??
          null,
      });

      setPasoFormulario(
        1,
      );

      setFormularioAbierto(
        false,
      );

      setSelectorCategoriaAbierto(
        true,
      );
    };

  const cerrarSelectorCategoria =
    () => {
      setSelectorCategoriaAbierto(
        false,
      );

      /*
       * Si estamos creando, siempre dejamos el selector limpio.
       */
      if (
        !recursoEditado
      ) {
        setCategoriaSeleccionada(
          null,
        );
      }
    };

  const seleccionarCategoria =
    (
      nuevaCategoria:
        CategoriaRecursoCurso,
    ) => {
      setCategoriaSeleccionada(
        nuevaCategoria,
      );

      setFormulario(
        (
          actual,
        ) => ({
          ...actual,

          categoria:
            nuevaCategoria,
        }),
      );

      setSelectorCategoriaAbierto(
        false,
      );

      setPasoFormulario(
        1,
      );

      setFormularioAbierto(
        true,
      );
    };

  const abrirEditar =
    (
      recurso:
        RecursoCurso,
    ) => {
      setRecursoEditado(
        recurso,
      );

      setCategoriaSeleccionada(
        recurso.categoria,
      );

      setFormulario({
        titulo:
          recurso.titulo,

        descripcion:
          recurso.descripcion ??
          '',

        categoria:
          recurso.categoria,

        alcance:
          recurso.alcance,

        uso:
          recurso.uso,

        hitoId:
          recurso.hitoId,

        visibleParaEstudiantes:
          recurso.visibleParaEstudiantes,

        archivos:
          [],

        enlaces:
          [],
      });

      setPasoFormulario(
        1,
      );

      setFormularioAbierto(
        true,
      );
    };

  const abrirCatalogoDesdeFormulario =
    () => {
      /*
       * Al cambiar una categoría existente,
       * sí mostramos la categoría actual como seleccionada.
       */
      setCategoriaSeleccionada(
        formulario.categoria,
      );

      setFormularioAbierto(
        false,
      );

      setSelectorCategoriaAbierto(
        true,
      );
    };

  const validarConfiguracion =
    () => {
      if (
        !formulario.titulo.trim()
      ) {
        mostrarToast(
          'advertencia',
          'Falta el título',
          'Escribe un nombre para el recurso.',
        );

        return false;
      }

      if (
        formulario.alcance ===
          'HITO' &&
        !formulario.hitoId
      ) {
        mostrarToast(
          'advertencia',
          'Selecciona un hito',
          'El recurso debe estar asociado a H1-H5.',
        );

        return false;
      }

      return true;
    };

  const validarMateriales =
    () => {
      const enlaceIncompleto =
        formulario.enlaces.find(
          (
            enlace,
          ) =>
            !enlace.titulo.trim() ||
            !enlace.urlExterna.trim(),
        );

      if (
        enlaceIncompleto
      ) {
        mostrarToast(
          'advertencia',
          'Completa los enlaces',
          'Cada enlace agregado debe tener un título y una URL.',
        );

        return false;
      }

      const archivoSinTitulo =
        formulario.archivos.find(
          (
            item,
          ) =>
            !item.titulo.trim(),
        );

      if (
        archivoSinTitulo
      ) {
        mostrarToast(
          'advertencia',
          'Revisa los archivos',
          'Cada archivo debe tener un título visible.',
        );

        return false;
      }

      return true;
    };

  const irPasoMateriales =
    () => {
      if (
        !validarConfiguracion()
      ) {
        return;
      }

      setPasoFormulario(
        2,
      );
    };

  const guardar =
    async () => {
      if (
        !accessToken ||
        !curso?.id ||
        !validarConfiguracion()
      ) {
        return;
      }

      if (
        !recursoEditado &&
        !validarMateriales()
      ) {
        return;
      }

      try {
        setProcesando(
          true,
        );

        if (
          recursoEditado
        ) {
          await actualizarRecurso(
            curso.id,
            recursoEditado.id,
            accessToken,
            {
              titulo:
                formulario.titulo.trim(),

              descripcion:
                formulario.descripcion.trim(),

              categoria:
                formulario.categoria,

              alcance:
                formulario.alcance,

              uso:
                formulario.uso,

              hitoId:
                formulario.hitoId,

              visibleParaEstudiantes:
                formulario.visibleParaEstudiantes,
            },
          );

          mostrarToast(
            'exito',
            'Recurso actualizado',
          );
        } else {
          const creado =
            await crearRecurso(
              curso.id,
              accessToken,
              {
                titulo:
                  formulario.titulo.trim(),

                descripcion:
                  formulario.descripcion.trim(),

                categoria:
                  formulario.categoria,

                alcance:
                  formulario.alcance,

                uso:
                  formulario.uso,

                hitoId:
                  formulario.hitoId,

                visibleParaEstudiantes:
                  formulario.visibleParaEstudiantes,
              },
            );

          const erroresMateriales:
            string[] = [];

          for (
            const item
            of formulario.archivos
          ) {
            try {
              await agregarArchivoRecurso(
                curso.id,
                creado.id,
                accessToken,
                {
                  ...item,

                  titulo:
                    item.titulo.trim(),

                  descripcion:
                    item.descripcion.trim(),

                  disponibleParaQuiz:
                    formulario.uso !==
                      'AULA' &&
                    item.disponibleParaQuiz,
                },
              );
            } catch (
              error
            ) {
              erroresMateriales.push(
                error instanceof
                  Error
                  ? error.message
                  : `No fue posible subir ${item.archivo.name}.`,
              );
            }
          }

          for (
            const item
            of formulario.enlaces
          ) {
            try {
              await agregarEnlaceRecurso(
                curso.id,
                creado.id,
                accessToken,
                {
                  titulo:
                    item.titulo.trim(),

                  descripcion:
                    item.descripcion.trim(),

                  urlExterna:
                    item.urlExterna.trim(),
                },
              );
            } catch (
              error
            ) {
              erroresMateriales.push(
                error instanceof
                  Error
                  ? error.message
                  : `No fue posible agregar ${item.titulo}.`,
              );
            }
          }

          if (
            erroresMateriales.length >
            0
          ) {
            mostrarToast(
              'advertencia',
              'Recurso creado con materiales pendientes',
              `${erroresMateriales.length} material(es) no pudieron guardarse. Puedes agregarlos después desde “Administrar materiales”.`,
            );
          } else {
            mostrarToast(
              'exito',
              'Recurso creado',
              formulario.archivos.length +
                  formulario.enlaces.length >
                0
                ? 'El recurso y sus materiales se guardaron correctamente.'
                : 'El recurso fue creado. Puedes agregar materiales cuando quieras.',
            );
          }
        }

        setFormularioAbierto(
          false,
        );

        setSelectorCategoriaAbierto(
          false,
        );

        setCategoriaSeleccionada(
          null,
        );

        setPasoFormulario(
          1,
        );

        setRecursoEditado(
          null,
        );

        setFormulario(
          inicial,
        );

        await cargar();
      } catch (
        error
      ) {
        mostrarToast(
          'error',
          'No fue posible guardar',
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

  const abrirAgregarMateriales =
    (
      recurso:
        RecursoCurso,
    ) => {
      setRecursoAbiertoId(
        null,
      );

      setRecursoMaterialesId(
        recurso.id,
      );

      setFormularioMateriales({
        titulo:
          recurso.titulo,

        descripcion:
          recurso.descripcion ??
          '',

        categoria:
          recurso.categoria,

        alcance:
          recurso.alcance,

        uso:
          recurso.uso,

        hitoId:
          recurso.hitoId,

        visibleParaEstudiantes:
          recurso.visibleParaEstudiantes,

        archivos:
          [],

        enlaces:
          [],
      });
    };

  const cerrarAgregarMateriales =
    () => {
      if (
        procesando
      ) {
        return;
      }

      setRecursoMaterialesId(
        null,
      );

      setFormularioMateriales(
        inicial,
      );
    };

  const guardarMateriales =
    async () => {
      if (
        !accessToken ||
        !curso?.id ||
        !recursoMateriales
      ) {
        return;
      }

      if (
        formularioMateriales.archivos.length ===
          0 &&
        formularioMateriales.enlaces.length ===
          0
      ) {
        mostrarToast(
          'advertencia',
          'Agrega al menos un material',
          'Selecciona uno o varios archivos o agrega un enlace.',
        );

        return;
      }

      const enlaceIncompleto =
        formularioMateriales.enlaces.find(
          (
            enlace,
          ) =>
            !enlace.titulo.trim() ||
            !enlace.urlExterna.trim(),
        );

      if (
        enlaceIncompleto
      ) {
        mostrarToast(
          'advertencia',
          'Completa los enlaces',
          'Cada enlace debe tener un título y una URL.',
        );

        return;
      }

      const archivoSinTitulo =
        formularioMateriales.archivos.find(
          (
            item,
          ) =>
            !item.titulo.trim(),
        );

      if (
        archivoSinTitulo
      ) {
        mostrarToast(
          'advertencia',
          'Revisa los archivos',
          'Cada archivo debe tener un título visible.',
        );

        return;
      }

      try {
        setProcesando(
          true,
        );

        const errores:
          string[] =
          [];

        for (
          const item
          of formularioMateriales.archivos
        ) {
          try {
            const esPdf =
              item.archivo.type ===
                'application/pdf' ||
              item.archivo.name
                .toLocaleLowerCase(
                  'es',
                )
                .endsWith(
                  '.pdf',
                );

            await agregarArchivoRecurso(
              curso.id,
              recursoMateriales.id,
              accessToken,
              {
                ...item,

                titulo:
                  item.titulo.trim(),

                descripcion:
                  item.descripcion.trim(),

                disponibleParaQuiz:
                  recursoMateriales.uso !==
                    'AULA' &&
                  esPdf,
              },
            );
          } catch (
            error
          ) {
            errores.push(
              error instanceof
                Error
                ? error.message
                : `No fue posible subir ${item.archivo.name}.`,
            );
          }
        }

        for (
          const item
          of formularioMateriales.enlaces
        ) {
          try {
            await agregarEnlaceRecurso(
              curso.id,
              recursoMateriales.id,
              accessToken,
              {
                titulo:
                  item.titulo.trim(),

                descripcion:
                  item.descripcion.trim(),

                urlExterna:
                  item.urlExterna.trim(),
              },
            );
          } catch (
            error
          ) {
            errores.push(
              error instanceof
                Error
                ? error.message
                : `No fue posible agregar ${item.titulo}.`,
            );
          }
        }

        setRecursoMaterialesId(
          null,
        );

        setFormularioMateriales(
          inicial,
        );

        await cargar();

        if (
          errores.length >
          0
        ) {
          mostrarToast(
            'advertencia',
            'Materiales agregados parcialmente',
            `${errores.length} material(es) no pudieron guardarse.`,
          );

          return;
        }

        const tienePdf =
          formularioMateriales.archivos.some(
            (
              item,
            ) =>
              item.archivo.type ===
                'application/pdf' ||
              item.archivo.name
                .toLocaleLowerCase(
                  'es',
                )
                .endsWith(
                  '.pdf',
                ),
          );

        mostrarToast(
          'exito',
          'Materiales agregados',
          recursoMateriales.uso !==
              'AULA' &&
            tienePdf
            ? 'Los materiales se guardaron. Los PDF se prepararán como datasets en segundo plano.'
            : 'Los materiales se guardaron correctamente.',
        );
      } catch (
        error
      ) {
        mostrarToast(
          'error',
          'No fue posible agregar los materiales',
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
        return;
      }

      try {
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
          'No fue posible abrir el archivo',
          error instanceof
            Error
            ? error.message
            : undefined,
        );
      }
    };

  const reemplazar =
    async (
      datos:
        ReemplazarContenidoDatos,
    ) => {
      if (
        !accessToken ||
        !curso?.id ||
        !recursoAbierto ||
        !contenidoReemplazar
      ) {
        return;
      }

      try {
        setProcesando(
          true,
        );

        await reemplazarContenidoRecurso(
          curso.id,
          recursoAbierto.id,
          contenidoReemplazar.id,
          accessToken,
          datos,
        );

        setContenidoReemplazar(
          null,
        );

        await cargar();

        mostrarToast(
          'exito',
          'Nueva versión guardada',
          'La versión anterior permanece en el historial.',
        );
      } catch (
        error
      ) {
        mostrarToast(
          'error',
          'No fue posible reemplazar el archivo',
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

  const cambiarVisibilidad =
    async (
      recurso:
        RecursoCurso,
    ) => {
      if (
        !accessToken ||
        !curso?.id
      ) {
        return;
      }

      try {
        setProcesando(
          true,
        );

        await cambiarVisibilidadRecurso(
          curso.id,
          recurso.id,
          accessToken,
          !recurso.visibleParaEstudiantes,
        );

        await cargar();

        mostrarToast(
          'exito',
          recurso.visibleParaEstudiantes
            ? 'Recurso ocultado'
            : 'Recurso visible',
          recurso.visibleParaEstudiantes
            ? 'Los estudiantes ya no podrán visualizarlo.'
            : 'Los estudiantes ya pueden visualizarlo.',
        );
      } catch (
        error
      ) {
        mostrarToast(
          'error',
          'No fue posible cambiar la visibilidad',
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

  const confirmarArchivado =
    async () => {
      if (
        !accessToken ||
        !curso?.id ||
        !recursoArchivar
      ) {
        return;
      }

      try {
        setProcesando(
          true,
        );

        await archivarRecurso(
          curso.id,
          recursoArchivar.id,
          accessToken,
        );

        setRecursoArchivar(
          null,
        );

        setRecursoAbiertoId(
          null,
        );

        await cargar();

        mostrarToast(
          'exito',
          'Recurso archivado',
        );
      } catch (
        error
      ) {
        mostrarToast(
          'error',
          'No fue posible archivar',
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

  const confirmarEliminarContenido =
    async () => {
      if (
        !accessToken ||
        !curso?.id ||
        !recursoAbierto ||
        !contenidoEliminar
      ) {
        return;
      }

      try {
        setProcesando(
          true,
        );

        await eliminarContenidoRecurso(
          curso.id,
          recursoAbierto.id,
          contenidoEliminar.id,
          accessToken,
        );

        setContenidoEliminar(
          null,
        );

        await cargar();

        mostrarToast(
          'exito',
          'Contenido retirado',
        );
      } catch (
        error
      ) {
        mostrarToast(
          'error',
          'No fue posible retirar el contenido',
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

  const filtros:
    OpcionAulaToolbar<
      FiltroAlcance
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

      {
        id:
          'QUIZZES',

        texto:
          'Para Quizzes',

        icono:
          Sparkles,

        contador:
          recursos.filter(
            (
              recurso,
            ) =>
              recurso.uso ===
                'AULA_Y_QUIZZES' ||
              recurso.uso ===
                'SOLO_QUIZZES',
          ).length,
      },
    ];

  const filtrados =
    useMemo(
      () => {
        const q =
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
              filtroAlcance ===
                'TODOS' &&
              recurso.alcance !==
                'CURSO' &&
              recurso.hitoId !==
                hitoSeleccionado?.id
            ) {
              return false;
            }

            if (
              filtroAlcance ===
                'GENERALES' &&
              recurso.alcance !==
                'CURSO'
            ) {
              return false;
            }

            if (
              filtroAlcance ===
                'HITO_ACTUAL' &&
              recurso.hitoId !==
                hitoSeleccionado?.id
            ) {
              return false;
            }

            if (
              filtroAlcance ===
                'QUIZZES' &&
              recurso.uso ===
                'AULA'
            ) {
              return false;
            }

            if (
              !q
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
              q,
            );
          },
        );
      },
      [
        recursos,
        filtroAlcance,
        busqueda,
        hitoSeleccionado?.id,
      ],
    );

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
    <section className="recursos-page">
      <AulaHeader
        icono={
          Files
        }
        etiqueta="Material académico"
        titulo="Recursos"
        descripcion="Administra materiales generales del curso y recursos específicos de cada hito. Cada recurso puede agrupar varios archivos y enlaces relacionados."
        informacion={
          hitoSeleccionado
            ? `Hito seleccionado: ${hitoSeleccionado.codigo} · ${hitoSeleccionado.nombre}`
            : 'Puedes crear recursos generales aunque no exista un hito seleccionado.'
        }
        acciones={[
          {
            texto:
              'Nuevo recurso',

            icono:
              Plus,

            variante:
              'primaria',

            onClick:
              abrirCrear,
          },

          {
            texto:
              'Actualizar',

            icono:
              RefreshCw,

            onClick: () =>
              void cargar(),

            deshabilitada:
              cargando,
          },
        ]}
      />

      <div className="recursos-page__controles">
        <AulaToolbar
          opciones={
            filtros
          }
          opcionActiva={
            filtroAlcance
          }
          onCambiar={
            setFiltroAlcance
          }
        />

        <label className="recursos-buscador">
          <Search
            size={
              16
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
              ? 'Aún no hay recursos'
              : 'No encontramos recursos'
          }
          descripcion={
            recursos.length ===
            0
              ? 'Crea el primer recurso y agrupa dentro sus archivos y enlaces relacionados.'
              : 'Prueba con otro filtro o término de búsqueda.'
          }
          accionTexto={
            recursos.length ===
            0
              ? 'Crear primer recurso'
              : undefined
          }
          onAccion={
            recursos.length ===
            0
              ? abrirCrear
              : undefined
          }
        />
      ) : (
        <div className="recursos-grid">
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
                esDocente
                procesando={
                  procesando
                }
                onAbrirMateriales={() => {
                  const contenidosActivos =
                    recurso.contenidos.filter(
                      (
                        contenido,
                      ) =>
                        contenido.estaActivo,
                    );

                  if (
                    contenidosActivos.length ===
                    0
                  ) {
                    abrirAgregarMateriales(
                      recurso,
                    );

                    return;
                  }

                  setRecursoAbiertoId(
                    recurso.id,
                  );
                }}
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
                onEditar={() =>
                  abrirEditar(
                    recurso,
                  )
                }
                onVisibilidad={() =>
                  void cambiarVisibilidad(
                    recurso,
                  )
                }
                onArchivar={() =>
                  setRecursoArchivar(
                    recurso,
                  )
                }
                onReintentarDataset={(
                  versionId,
                ) =>
                  void reintentarDataset(
                    versionId,
                  )
                }
              />
            ),
          )}
        </div>
      )}

      <AulaModal
        abierto={
          selectorCategoriaAbierto
        }
        titulo="Seleccionar tipo de recurso"
        etiqueta="Recursos"
        descripcion="Elige la clasificación antes de continuar."
        icono={
          BookOpen
        }
        ancho="amplio"
        bloqueado={
          procesando
        }
        onCerrar={
          cerrarSelectorCategoria
        }
      >
        <SelectorCategoriaRecurso
          valor={
            categoriaSeleccionada
          }
          modo="catalogo"
          deshabilitado={
            procesando
          }
          onCambiar={
            seleccionarCategoria
          }
        />
      </AulaModal>

      <AulaModal
        abierto={
          formularioAbierto
        }
        titulo={
          recursoEditado
            ? 'Editar recurso'
            : pasoFormulario ===
                1
              ? 'Nuevo recurso'
              : 'Uso y materiales'
        }
        etiqueta={
          recursoEditado
            ? 'Recursos'
            : `Paso ${pasoFormulario} de 2`
        }
        descripcion={
          recursoEditado
            ? 'Actualiza la configuración del recurso sin alterar sus materiales ni versiones.'
            : pasoFormulario ===
                1
              ? 'Configura la información, clasificación y ubicación del recurso.'
              : 'Define el uso y agrega los archivos o enlaces relacionados antes de crear el recurso.'
        }
        icono={
          pasoFormulario ===
            2 &&
          !recursoEditado
            ? FilePlus2
            : FolderOpen
        }
        ancho="amplio"
        bloqueado={
          procesando
        }
        onCerrar={() => {
          setFormularioAbierto(
            false,
          );

          setPasoFormulario(
            1,
          );

          if (
            !recursoEditado
          ) {
            setCategoriaSeleccionada(
              null,
            );
          }
        }}
        footer={
          <div className="modal-actions modal-actions--wizard">
            {!recursoEditado &&
              pasoFormulario ===
                2 ? (
              <button
                className="secondary"
                type="button"
                disabled={
                  procesando
                }
                onClick={() =>
                  setPasoFormulario(
                    1,
                  )
                }
              >
                <ArrowLeft
                  size={
                    14
                  }
                />

                Atrás
              </button>
            ) : (
              <button
                className="secondary"
                type="button"
                disabled={
                  procesando
                }
                onClick={() => {
                  setFormularioAbierto(
                    false,
                  );

                  setPasoFormulario(
                    1,
                  );

                  if (
                    !recursoEditado
                  ) {
                    setCategoriaSeleccionada(
                      null,
                    );
                  }
                }}
              >
                Cancelar
              </button>
            )}

            {recursoEditado ? (
              <button
                type="button"
                disabled={
                  procesando
                }
                onClick={() =>
                  void guardar()
                }
              >
                Guardar cambios
              </button>
            ) : pasoFormulario ===
              1 ? (
              <button
                type="button"
                disabled={
                  procesando
                }
                onClick={
                  irPasoMateriales
                }
              >
                Siguiente

                <ArrowRight
                  size={
                    14
                  }
                />
              </button>
            ) : (
              <button
                type="button"
                disabled={
                  procesando
                }
                onClick={() =>
                  void guardar()
                }
              >
                Crear recurso
              </button>
            )}
          </div>
        }
      >
        {!recursoEditado && (
          <div className="recursos-wizard">
            <div
              className={`recursos-wizard__paso ${
                pasoFormulario ===
                1
                  ? 'activo'
                  : 'completado'
              }`}
            >
              <span>
                1
              </span>

              <div>
                <strong>
                  Configuración
                </strong>

                <small>
                  Información y uso
                </small>
              </div>
            </div>

            <div className="recursos-wizard__linea" />

            <div
              className={`recursos-wizard__paso ${
                pasoFormulario ===
                2
                  ? 'activo'
                  : ''
              }`}
            >
              <span>
                2
              </span>

              <div>
                <strong>
                  Uso y materiales
                </strong>

                <small>
                  Uso, archivos y enlaces
                </small>
              </div>
            </div>
          </div>
        )}

        <FormularioRecurso
          valor={
            formulario
          }
          paso={
            recursoEditado
              ? 1
              : pasoFormulario
          }
          hitos={
            hitos
          }
          editando={
            Boolean(
              recursoEditado,
            )
          }
          deshabilitado={
            procesando
          }
          onChange={
            setFormulario
          }
          onAbrirCatalogoCategoria={
            abrirCatalogoDesdeFormulario
          }
        />
      </AulaModal>

      <ContenidoRecursoModal
        abierto={
          Boolean(
            recursoAbierto,
          )
        }
        recurso={
          recursoAbierto
        }
        esDocente
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
        onAgregarMaterial={() => {
          if (
            recursoAbierto
          ) {
            abrirAgregarMateriales(
              recursoAbierto,
            );
          }
        }}
        onReemplazar={
          setContenidoReemplazar
        }
        onHistorial={
          setContenidoHistorial
        }
        onEliminar={
          setContenidoEliminar
        }
      />

      <AulaModal
        abierto={
          Boolean(
            recursoMateriales,
          )
        }
        titulo="Agregar materiales"
        etiqueta={
          recursoMateriales?.titulo
        }
        descripcion="Agrega archivos y enlaces desde el mismo formulario. Puedes seleccionar varios archivos de una sola vez."
        icono={
          Layers3
        }
        ancho="amplio"
        bloqueado={
          procesando
        }
        onCerrar={
          cerrarAgregarMateriales
        }
        footer={
          <div className="modal-actions">
            <button
              className="secondary"
              type="button"
              disabled={
                procesando
              }
              onClick={
                cerrarAgregarMateriales
              }
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={
                procesando
              }
              onClick={() =>
                void guardarMateriales()
              }
            >
              Agregar materiales
            </button>
          </div>
        }
      >
        <FormularioRecurso
          valor={
            formularioMateriales
          }
          paso={
            2
          }
          hitos={
            hitos
          }
          deshabilitado={
            procesando
          }
          onChange={
            setFormularioMateriales
          }
          onAbrirCatalogoCategoria={() => {}}
        />
      </AulaModal>

      <ReemplazarContenidoModal
        abierto={
          Boolean(
            contenidoReemplazar,
          )
        }
        contenido={
          contenidoReemplazar
        }
        bloqueado={
          procesando
        }
        onCerrar={() =>
          setContenidoReemplazar(
            null,
          )
        }
        onGuardar={(
          datos,
        ) =>
          void reemplazar(
            datos,
          )
        }
      />

      <HistorialVersionesRecurso
        abierto={
          Boolean(
            contenidoHistorial,
          )
        }
        contenido={
          contenidoHistorial
        }
        onCerrar={() =>
          setContenidoHistorial(
            null,
          )
        }
      />

      <AulaModal
        abierto={
          Boolean(
            recursoArchivar,
          )
        }
        titulo="Archivar recurso"
        etiqueta="Confirmación"
        descripcion={
          recursoArchivar
            ? `Se ocultará “${recursoArchivar.titulo}” del aula, conservando su historial.`
            : undefined
        }
        icono={
          Archive
        }
        ancho="compacto"
        bloqueado={
          procesando
        }
        onCerrar={() =>
          setRecursoArchivar(
            null,
          )
        }
        footer={
          <div className="modal-actions">
            <button
              className="secondary"
              type="button"
              disabled={
                procesando
              }
              onClick={() =>
                setRecursoArchivar(
                  null,
                )
              }
            >
              Cancelar
            </button>

            <button
              className="danger"
              type="button"
              disabled={
                procesando
              }
              onClick={() =>
                void confirmarArchivado()
              }
            >
              Archivar
            </button>
          </div>
        }
      >
        <p className="confirm-text">
          Los archivos no se eliminan físicamente. El recurso queda conservado para trazabilidad.
        </p>
      </AulaModal>

      <AulaModal
        abierto={
          Boolean(
            contenidoEliminar,
          )
        }
        titulo="Retirar contenido"
        etiqueta="Confirmación"
        descripcion={
          contenidoEliminar?.titulo
        }
        icono={
          Archive
        }
        ancho="compacto"
        bloqueado={
          procesando
        }
        onCerrar={() =>
          setContenidoEliminar(
            null,
          )
        }
        footer={
          <div className="modal-actions">
            <button
              className="secondary"
              type="button"
              disabled={
                procesando
              }
              onClick={() =>
                setContenidoEliminar(
                  null,
                )
              }
            >
              Cancelar
            </button>

            <button
              className="danger"
              type="button"
              disabled={
                procesando
              }
              onClick={() =>
                void confirmarEliminarContenido()
              }
            >
              Retirar
            </button>
          </div>
        }
      >
        <p className="confirm-text">
          Este material dejará de mostrarse dentro del recurso.
        </p>
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
  .recursos-page {
    position: relative;

    display: grid;
    gap: 16px;

    min-width: 0;
  }

  .recursos-page__controles {
    display: grid;
    grid-template-columns:
      minmax(
        0,
        1fr
      )
      minmax(
        260px,
        360px
      );
    gap: 10px;

    align-items: stretch;
  }

  .recursos-buscador {
    min-height: 66px;

    display: flex;
    align-items: center;
    gap: 8px;

    padding:
      0
      13px;

    border:
      1px solid
      var(--app-border);
    border-radius: 18px;

    color:
      var(--app-text-muted);

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow-sm);
  }

  .recursos-buscador input {
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

  .recursos-grid {
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

  .recursos-wizard {
    display: grid;
    grid-template-columns:
      auto
      minmax(
        30px,
        1fr
      )
      auto;
    align-items: center;
    gap: 9px;

    max-width: 430px;

    margin:
      0
      auto
      2px;
  }

  .recursos-wizard__paso {
    display: flex;
    align-items: center;
    gap: 7px;

    color:
      var(--app-text-muted);
  }

  .recursos-wizard__paso > span {
    width: 26px;
    height: 26px;

    display: grid;
    place-items: center;

    border:
      1px solid
      var(--app-border-strong);
    border-radius: 50%;

    color:
      var(--app-text-muted);

    background:
      var(--app-surface);

    font-size: 8px;
    font-weight: 900;
  }

  .recursos-wizard__paso > div {
    display: grid;
    gap: 1px;
  }

  .recursos-wizard__paso strong {
    color:
      var(--app-text-secondary);

    font-size: 8.8px;
    font-weight: 850;
  }

  .recursos-wizard__paso small {
    color:
      var(--app-text-muted);

    font-size: 7px;
  }

  .recursos-wizard__paso.activo > span,
  .recursos-wizard__paso.completado > span {
    border-color:
      var(--app-accent);

    color: #fff;

    background:
      var(--app-accent);
  }

  .recursos-wizard__paso.activo strong,
  .recursos-wizard__paso.completado strong {
    color:
      var(--app-accent-dark);
  }

  .recursos-wizard__linea {
    height: 1px;

    background:
      var(--app-border-strong);
  }

  .modal-actions {
    width: 100%;

    display: flex;
    justify-content: flex-end;
    gap: 7px;
  }

  .modal-actions button {
    min-height: 38px;

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    padding:
      8px
      12px;

    border: none;
    border-radius: 10px;

    color: #fff;

    background:
      linear-gradient(
        135deg,
        var(--app-accent),
        var(--app-accent-hover)
      );

    font: inherit;
    font-size: 9px;
    font-weight: 850;

    cursor: pointer;
  }

  .modal-actions button:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .modal-actions button.secondary {
    border:
      1px solid
      var(--app-border-strong);

    color:
      var(--app-accent-dark);

    background:
      var(--app-surface);
  }

  .modal-actions button.danger {
    background:
      var(--app-danger);
  }

  .confirm-text {
    margin: 0;

    color:
      var(--app-text-soft);

    font-size: 10px;
    line-height: 1.5;
  }

  @media (
    max-width:
      980px
  ) {
    .recursos-grid {
      grid-template-columns:
        1fr;
    }

    .recursos-page__controles {
      grid-template-columns:
        1fr;
    }

    .recursos-filtro-categoria {
      justify-content:
        stretch;
    }

    .recursos-filtro-categoria select {
      width: 100%;
      min-width: 0;
    }
  }

  @media (
    max-width:
      700px
  ) {
  }

  @media (
    prefers-reduced-motion:
      reduce
  ) {
  }
`;
