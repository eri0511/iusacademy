import {
  ArrowLeft,
  ArrowRight,
  Check,
  Dice5,
  FolderPlus,
  GraduationCap,
  Layers3,
  LoaderCircle,
  Minus,
  Plus,
  AlertCircle,
  Scale,
  Sparkles,
  Users,
  UserRoundCheck,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import AulaModal from '../aula/AulaModal';
import Toast from '../shared/Toast';

import type {
  AlcanceConjuntoGrupo,
  CrearConjuntoGrupoDatos,
  CriterioDistribucionGrupo,
  MetodoCreacionGrupo,
  RespuestaPrevisualizacionGrupos,
  TipoEvaluacionGrupo,
  ValidacionesCreacionGrupos,
} from '../../types/grupos/grupos.types';

type HitoFormulario = {
  id: number;
  codigo: string;
  nombre: string;
};

type FormularioConjuntoGrupoProps = {
  abierto: boolean;
  hitoActual: HitoFormulario | null;
  procesando: boolean;
  previsualizacion: RespuestaPrevisualizacionGrupos | null;
  validaciones: ValidacionesCreacionGrupos | null;
  onCerrar: () => void;
  onPrevisualizar: (
    datos: {
      criterio: CriterioDistribucionGrupo;
      cantidadGrupos?: number;
      integrantesPorGrupo?: number;
    },
  ) => Promise<RespuestaPrevisualizacionGrupos>;
  onGuardar: (
    datos: CrearConjuntoGrupoDatos,
  ) => Promise<void>;
  onLimpiarPrevisualizacion: () => void;
};

type PasoAsistente = 1 | 2 | 3;

type GrupoManualFormulario = {
  nombre:
    string;

  estudianteIds:
    number[];
};

type EstadoFormulario = {
  nombre: string;
  descripcion: string;
  tipoEvaluacion: TipoEvaluacionGrupo;
  alcance: AlcanceConjuntoGrupo;
  hitoId: number | null;
  metodoCreacion: MetodoCreacionGrupo;
  criterioDistribucion: CriterioDistribucionGrupo;
  cantidadGrupos: number;
  integrantesPorGrupo: number;
  requiereRepresentante: boolean;
};

const crearEstadoInicial = (
  hitoActual:
    HitoFormulario | null,
  validaciones:
    ValidacionesCreacionGrupos | null,
): EstadoFormulario => {
  const procesualDisponible =
    validaciones?.procesual.disponible !==
    false;

  const tipoEvaluacion:
    TipoEvaluacionGrupo =
      procesualDisponible
        ? 'PROCESUAL'
        : 'CONTINUA';

  const hitoValidacion =
    validaciones?.continua.hitos.find(
      (
        hito,
      ) =>
        hito.id ===
        hitoActual?.id,
    ) ??
    null;

  const continuaSemestralDisponible =
    validaciones
      ? validaciones.continua.puedeCrearSemestral
      : true;

  const continuaHitoDisponible =
    Boolean(
      hitoActual,
    ) &&
    (
      validaciones
        ? validaciones.continua.puedeCrearPorHito &&
          !hitoValidacion?.ocupado
        : true
    );

  const alcance:
    AlcanceConjuntoGrupo =
      tipoEvaluacion ===
        'PROCESUAL'
        ? 'CURSO'
        : continuaSemestralDisponible
          ? 'CURSO'
          : continuaHitoDisponible
            ? 'HITO'
            : 'CURSO';

  const totalEstudiantes =
    validaciones?.totalEstudiantes ??
    0;

  const cantidadRecomendada =
    Math.max(
      2,
      Math.min(
        Math.max(
          2,
          Math.floor(
            totalEstudiantes /
            2,
          ),
        ),
        Math.round(
          Math.sqrt(
            Math.max(
              totalEstudiantes,
              4,
            ),
          ),
        ),
      ),
    );

  return {
    nombre:
      '',

    descripcion:
      '',

    tipoEvaluacion,

    alcance,

    hitoId:
      alcance ===
        'HITO'
        ? hitoActual?.id ??
          null
        : null,

    metodoCreacion:
      'ALEATORIO',

    criterioDistribucion:
      'CANTIDAD_GRUPOS',

    cantidadGrupos:
      cantidadRecomendada,

    integrantesPorGrupo:
      Math.max(
        2,
        Math.ceil(
          totalEstudiantes /
          cantidadRecomendada,
        ),
      ),

    requiereRepresentante:
      false,
  };
};

export default function FormularioConjuntoGrupo({
  abierto,
  hitoActual,
  procesando,
  previsualizacion,
  validaciones,
  onCerrar,
  onPrevisualizar,
  onGuardar,
  onLimpiarPrevisualizacion,
}: FormularioConjuntoGrupoProps) {
  const [paso, setPaso] = useState<PasoAsistente>(1);
  const [formulario, setFormulario] = useState<EstadoFormulario>(
    crearEstadoInicial(
      hitoActual,
      validaciones,
    ),
  );
  const [toast, setToast] = useState({
    visible: false,
    mensaje: '',
  });

  const cerrarToast = () =>
    setToast((actual) => ({
      ...actual,
      visible: false,
    }));

  const mostrarAdvertencia = (
    mensaje:
      string,
  ) => {
    setToast({
      visible:
        true,

      mensaje,
    });
  };

  const [
    gruposManuales,
    setGruposManuales,
  ] =
    useState<GrupoManualFormulario[]>(
      [],
    );

  const abiertoAnteriorRef =
    useRef(
      false,
    );
  const limpiarRef = useRef(onLimpiarPrevisualizacion);

  useEffect(() => {
    limpiarRef.current = onLimpiarPrevisualizacion;
  }, [onLimpiarPrevisualizacion]);

  /*
   * Solo reinicia cuando el modal pasa realmente de cerrado a abierto.
   * Antes se reiniciaba cada vez que llegaba la previsualización porque
   * la función recibida desde el hook cambiaba de referencia.
   */
  useEffect(() => {
    const acabaDeAbrir = abierto && !abiertoAnteriorRef.current;

    if (acabaDeAbrir) {
      setPaso(1);
      setFormulario(
        crearEstadoInicial(
          hitoActual,
          validaciones,
        ),
      );
      setGruposManuales(
        [],
      );

      limpiarRef.current();
    }

    abiertoAnteriorRef.current = abierto;
  }, [
    abierto,
    hitoActual?.id,
    validaciones,
  ]);

  const distribucion = previsualizacion?.distribucion ?? null;
  const totalEstudiantes = previsualizacion?.estudiantes.length ?? 0;

  const subtituloPaso = useMemo(() => {
    if (paso === 1) {
      return 'Define el propósito académico y el alcance del conjunto.';
    }

    if (paso === 2) {
      return 'Configura una distribución coherente con la cantidad de estudiantes.';
    }

    return 'Comprueba la organización antes de crear los grupos.';
  }, [paso]);

  const actualizarCampo = <K extends keyof EstadoFormulario>(
    campo: K,
    valor: EstadoFormulario[K],
  ) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
    if (
      campo === 'criterioDistribucion' ||
      campo === 'cantidadGrupos' ||
      campo === 'integrantesPorGrupo' ||
      campo === 'metodoCreacion'
    ) {
      limpiarRef.current();
    }
  };

  const seleccionarTipoEvaluacion =
    (
      tipoEvaluacion:
        TipoEvaluacionGrupo,
    ) => {
      const hitoValidacion =
        validaciones?.continua.hitos.find(
          (
            hito,
          ) =>
            hito.id ===
            hitoActual?.id,
        ) ??
        null;

      const puedeUsarSemestre =
        validaciones
          ? validaciones.continua.puedeCrearSemestral
          : true;

      const puedeUsarHito =
        Boolean(
          hitoActual,
        ) &&
        (
          validaciones
            ? validaciones.continua.puedeCrearPorHito &&
              !hitoValidacion?.ocupado
            : true
        );

      const alcance:
        AlcanceConjuntoGrupo =
          tipoEvaluacion ===
            'PROCESUAL'
            ? 'CURSO'
            : puedeUsarSemestre
              ? 'CURSO'
              : puedeUsarHito
                ? 'HITO'
                : 'CURSO';

      setFormulario(
        (
          actual,
        ) => ({
          ...actual,

          tipoEvaluacion,

          alcance,

          hitoId:
            alcance ===
              'HITO'
              ? hitoActual?.id ??
                null
              : null,
        }),
      );

      setGruposManuales(
        [],
      );

      limpiarRef.current();

    };

  const hitoActualValidacion =
    validaciones?.continua.hitos.find(
      (
        hito,
      ) =>
        hito.id ===
        hitoActual?.id,
    ) ??
    null;

  const procesualDeshabilitado =
    validaciones?.procesual.disponible ===
    false;

  const continuaSemestralDeshabilitada =
    validaciones
      ? !validaciones.continua.puedeCrearSemestral
      : false;

  const continuaHitoDeshabilitada =
    !hitoActual ||
    (
      validaciones
        ? !validaciones.continua.puedeCrearPorHito ||
          Boolean(
            hitoActualValidacion?.ocupado,
          )
        : false
    );

  const totalEstudiantesValidacion =
    validaciones?.totalEstudiantes ??
    previsualizacion?.estudiantes.length ??
    0;

  const maximoGrupos =
    Math.max(
      2,
      Math.floor(
        totalEstudiantesValidacion /
        2,
      ),
    );

  const recomendaciones =
    useMemo(
      () => {
        if (
          totalEstudiantesValidacion <
          4
        ) {
          return [];
        }

        const candidatos =
          new Set<number>([
            Math.max(
              2,
              Math.round(
                Math.sqrt(
                  totalEstudiantesValidacion,
                ),
              ),
            ),
            Math.max(
              2,
              Math.ceil(
                totalEstudiantesValidacion /
                4,
              ),
            ),
            Math.max(
              2,
              Math.ceil(
                totalEstudiantesValidacion /
                5,
              ),
            ),
          ]);

        return Array.from(
          candidatos,
        )
          .filter(
            (
              cantidad,
            ) =>
              cantidad <=
              maximoGrupos,
          )
          .slice(
            0,
            3,
          )
          .map(
            (
              cantidad,
              indice,
            ) => ({
              cantidad,
              minimo:
                Math.floor(
                  totalEstudiantesValidacion /
                  cantidad,
                ),
              maximo:
                Math.ceil(
                  totalEstudiantesValidacion /
                  cantidad,
                ),
              recomendada:
                indice ===
                0,
            }),
          );
      },
      [
        maximoGrupos,
        totalEstudiantesValidacion,
      ],
    );

  const crearGruposManuales =
    (
      cantidad:
        number,
    ): GrupoManualFormulario[] =>
      Array.from(
        {
          length:
            Math.max(
              2,
              cantidad,
            ),
        },
        (
          _,
          indice,
        ) => ({
          nombre:
            `Grupo ${indice + 1}`,

          estudianteIds:
            [],
        }),
      );

  const obtenerGrupoEstudiante =
    (
      estudianteId:
        number,
    ): number =>
      gruposManuales.findIndex(
        (
          grupo,
        ) =>
          grupo.estudianteIds.includes(
            estudianteId,
          ),
      );

  const asignarEstudianteManual =
    (
      estudianteId:
        number,
      grupoIndice:
        number,
    ) => {
      setGruposManuales(
        (
          actuales,
        ) =>
          actuales.map(
            (
              grupo,
              indice,
            ) => ({
              ...grupo,

              estudianteIds:
                indice ===
                  grupoIndice
                  ? Array.from(
                      new Set([
                        ...grupo.estudianteIds,
                        estudianteId,
                      ]),
                    )
                  : grupo.estudianteIds.filter(
                      (
                        id,
                      ) =>
                        id !==
                        estudianteId,
                    ),
            }),
          ),
      );

    };

  const cambiarNombreGrupoManual =
    (
      grupoIndice:
        number,
      nombre:
        string,
    ) => {
      setGruposManuales(
        (
          actuales,
        ) =>
          actuales.map(
            (
              grupo,
              indice,
            ) =>
              indice ===
                grupoIndice
                ? {
                    ...grupo,

                    nombre,
                  }
                : grupo,
          ),
      );
    };

  const cambiarCantidad =
    (
      incremento:
        number,
    ) => {
      const campo:
        'cantidadGrupos' |
        'integrantesPorGrupo' =
          formulario.criterioDistribucion ===
          'CANTIDAD_GRUPOS'
            ? 'cantidadGrupos'
            : 'integrantesPorGrupo';

      const actual =
        formulario[
          campo
        ];

      const maximo =
        formulario.criterioDistribucion ===
        'CANTIDAD_GRUPOS'
          ? maximoGrupos
          : Math.max(
              2,
              totalEstudiantesValidacion,
            );

      actualizarCampo(
        campo,
        Math.min(
          maximo,
          Math.max(
            2,
            actual +
            incremento,
          ),
        ),
      );

      if (
        formulario.metodoCreacion ===
        'MANUAL'
      ) {
        setGruposManuales(
          [],
        );
      }
    };

  if (!abierto) {
    return null;
  }

  const validarPasoUno = () => {
    if (
      formulario.nombre.trim().length <
      3
    ) {
      mostrarAdvertencia(
        'El nombre debe tener al menos 3 caracteres.',
      );

      return false;
    }

    if (
      formulario.tipoEvaluacion ===
        'PROCESUAL' &&
      procesualDeshabilitado
    ) {
      mostrarAdvertencia(
        'El curso ya tiene un conjunto procesual.',
      );

      return false;
    }

    if (
      formulario.tipoEvaluacion ===
        'PROCESUAL' &&
      formulario.alcance !==
        'CURSO'
    ) {
      mostrarAdvertencia(
        'El conjunto procesual debe abarcar todo el semestre.',
      );

      return false;
    }

    if (
      formulario.tipoEvaluacion ===
        'CONTINUA' &&
      formulario.alcance ===
        'CURSO' &&
      continuaSemestralDeshabilitada
    ) {
      mostrarAdvertencia(
        validaciones?.continua.modalidad ===
          'POR_HITOS'
          ? 'Ya existen conjuntos continuos por hito; no puedes crear uno semestral.'
          : 'Ya existe un conjunto continuo semestral.',
      );

      return false;
    }

    if (
      formulario.tipoEvaluacion ===
        'CONTINUA' &&
      formulario.alcance ===
        'HITO' &&
      continuaHitoDeshabilitada
    ) {
      mostrarAdvertencia(
        validaciones?.continua.semestralExiste
          ? 'Ya existe un conjunto continuo semestral.'
          : hitoActualValidacion?.ocupado
            ? `El ${hitoActualValidacion.codigo} ya tiene un conjunto continuo.`
            : 'Debes seleccionar un hito disponible.',
      );

      return false;
    }

    if (
      formulario.alcance ===
        'HITO' &&
      !formulario.hitoId
    ) {
      mostrarAdvertencia(
        'Debes seleccionar un hito válido.',
      );

      return false;
    }

    return true;
  };

  const continuar = async () => {
    if (paso === 1) {
      if (!validarPasoUno()) {
        return;
      }

      setPaso(2);
      return;
    }

    if (
      paso ===
      2
    ) {
      try {
        if (
          formulario.metodoCreacion ===
          'MANUAL'
        ) {
          const vista =
            await onPrevisualizar({
              criterio:
                'CANTIDAD_GRUPOS',

              cantidadGrupos:
                formulario.cantidadGrupos,
            });

          setGruposManuales(
            crearGruposManuales(
              formulario.cantidadGrupos,
            ),
          );

          if (
            vista.estudiantes.length ===
            0
          ) {
            mostrarAdvertencia(
              'No existen estudiantes activos para asignar.',
            );

            return;
          }

          setPaso(
            3,
          );

          return;
        }

        await onPrevisualizar(
          formulario.criterioDistribucion === 'CANTIDAD_GRUPOS'
            ? {
                criterio: 'CANTIDAD_GRUPOS',
                cantidadGrupos: formulario.cantidadGrupos,
              }
            : {
                criterio: 'INTEGRANTES_POR_GRUPO',
                integrantesPorGrupo: formulario.integrantesPorGrupo,
              },
        );

        setPaso(3);
      } catch (problema) {
        mostrarAdvertencia(
          problema instanceof Error
            ? problema.message
            : 'No fue posible calcular la distribución.',
        );
      }
    }
  };

  const volver = () => {
    setPaso((actual) => (actual === 3 ? 2 : 1));
  };

  const guardar = async () => {
    try {
      const datos: CrearConjuntoGrupoDatos = {
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim() || undefined,
        tipoEvaluacion: formulario.tipoEvaluacion,
        alcance: formulario.alcance,
        hitoId:
          formulario.alcance === 'HITO'
            ? formulario.hitoId ?? undefined
            : undefined,
        metodoCreacion: formulario.metodoCreacion,
        requiereRepresentante: formulario.requiereRepresentante,
      };

      if (formulario.metodoCreacion === 'ALEATORIO') {
        datos.criterioDistribucion = formulario.criterioDistribucion;

        if (formulario.criterioDistribucion === 'CANTIDAD_GRUPOS') {
          datos.cantidadGruposObjetivo = formulario.cantidadGrupos;
        } else {
          datos.integrantesPorGrupoObjetivo = formulario.integrantesPorGrupo;
        }
      } else {
        const estudiantes =
          previsualizacion?.estudiantes ??
          [];

        const totalAsignados =
          gruposManuales.reduce(
            (
              acumulado,
              grupo,
            ) =>
              acumulado +
              grupo.estudianteIds.length,
            0,
          );

        if (
          estudiantes.length >
            0 &&
          totalAsignados !==
            estudiantes.length
        ) {
          mostrarAdvertencia(
            `Debes asignar los ${estudiantes.length} estudiantes antes de crear el conjunto.`,
          );

          return;
        }

        if (
          gruposManuales.some(
            (
              grupo,
            ) =>
              grupo.nombre.trim().length <
              2,
          )
        ) {
          mostrarAdvertencia(
            'Todos los grupos deben tener un nombre válido.',
          );

          return;
        }

        datos.criterioDistribucion =
          'CANTIDAD_GRUPOS';

        datos.cantidadGruposObjetivo =
          gruposManuales.length;

        datos.grupos =
          gruposManuales.map(
            (
              grupo,
            ) => ({
              nombre:
                grupo.nombre.trim(),

              estudianteIds:
                grupo.estudianteIds,
            }),
          );
      }

      await onGuardar(
        datos,
      );
    } catch (problema) {
      mostrarAdvertencia(
        problema instanceof Error
          ? problema.message
          : 'No fue posible guardar el conjunto.',
      );
    }
  };

  return (
    <>
    <AulaModal
      abierto={
        abierto
      }
      ancho="amplio"
      icono={
        FolderPlus
      }
      etiqueta="Organización académica"
      titulo="Crear conjunto de grupos"
      descripcion={
        subtituloPaso
      }
      bloqueado={
        procesando
      }
      ariaLabelledBy="grupo-wizard-title"
      onCerrar={
        onCerrar
      }
      pasos={
        <>
<div className="grupo-wizard__steps">
          {[
            ['Propósito', 1],
            ['Distribución', 2],
            ['Confirmación', 3],
          ].map(([titulo, numero]) => {
            const numeroPaso = numero as PasoAsistente;
            const completado = paso > numeroPaso;
            const activo = paso === numeroPaso;

            return (
              <div
                key={numeroPaso}
                className={`${activo ? 'activo' : ''} ${
                  completado ? 'completado' : ''
                }`}
              >
                <span>{completado ? <Check size={14} /> : numeroPaso}</span>
                <small>{titulo}</small>
              </div>
            );
          })}
        </div>
        </>
      }
      footer={
        <>

          <button
            type="button"
            className="grupo-btn secundario"
            disabled={procesando}
            onClick={paso === 1 ? onCerrar : volver}
          >
            {paso > 1 && <ArrowLeft size={16} />}
            {paso === 1 ? 'Cancelar' : 'Volver'}
          </button>

          {paso < 3 ? (
            <button
              type="button"
              className="grupo-btn primario"
              disabled={procesando}
              onClick={() => void continuar()}
            >
              {procesando ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <ArrowRight size={16} />
              )}
              {paso === 2 && formulario.metodoCreacion === 'ALEATORIO'
                ? 'Calcular y continuar'
                : 'Continuar'}
            </button>
          ) : (
            <button
              type="button"
              className="grupo-btn primario"
              disabled={
                procesando ||
                (
                  formulario.metodoCreacion ===
                    'ALEATORIO' &&
                  !distribucion
                ) ||
                (
                  formulario.metodoCreacion ===
                    'MANUAL' &&
                  (
                    !previsualizacion ||
                    gruposManuales.reduce(
                      (
                        total,
                        grupo,
                      ) =>
                        total +
                        grupo.estudianteIds.length,
                      0,
                    ) !==
                      previsualizacion.estudiantes.length
                  )
                )
              }
              onClick={() => void guardar()}
            >
              {procesando ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <Sparkles size={16} />
              )}
              Crear conjunto
            </button>
          )}

        </>
      }
    >
      <div className="grupo-wizard__body">

          {paso === 1 && (
            <div className="grupo-wizard__panel">
              <CabeceraSeccion
                icono={GraduationCap}
                titulo="Tipo de evaluación"
                descripcion="Define cómo se reutilizará este conjunto en actividades y calificaciones."
              />

              <div className="grupo-choice-grid evaluacion">
                <ChoiceCard
                  seleccionado={formulario.tipoEvaluacion === 'PROCESUAL'}
                  icono={Scale}
                  titulo="Evaluación procesual"
                  etiqueta={
                    procesualDeshabilitado
                      ? 'Ya creado'
                      : 'Único'
                  }
                  descripcion={
                    procesualDeshabilitado
                      ? `Ya existe: ${validaciones?.procesual.conjunto?.nombre ?? 'conjunto procesual'}.`
                      : 'Un único conjunto permanente para todo el semestre.'
                  }
                  deshabilitado={procesualDeshabilitado}
                  onClick={() => seleccionarTipoEvaluacion('PROCESUAL')}
                />

                <ChoiceCard
                  seleccionado={formulario.tipoEvaluacion === 'CONTINUA'}
                  icono={Sparkles}
                  titulo="Evaluación continua"
                  etiqueta="Continua"
                  descripcion="Equipos para tareas, foros y actividades continuas."
                  onClick={() => seleccionarTipoEvaluacion('CONTINUA')}
                />
              </div>

              {validaciones && (
                <div className="grupo-reglas">
                  <AlertCircle size={18} />

                  <div>
                    <strong>
                      Reglas del curso
                    </strong>

                    <span>
                      Procesual: un único conjunto semestral. Continua: puedes usar un conjunto semestral o varios por hito, pero no ambas modalidades.
                    </span>
                  </div>
                </div>
              )}

              <div className="grupo-form-grid">
                <label className="grupo-field">
                  <span>Nombre del conjunto</span>
                  <input
                    value={formulario.nombre}
                    maxLength={120}
                    placeholder={
                      formulario.tipoEvaluacion === 'PROCESUAL'
                        ? 'Ej. Equipos de proyecto procesual'
                        : 'Ej. Equipos de análisis H2'
                    }
                    autoFocus
                    onChange={(evento) =>
                      actualizarCampo('nombre', evento.target.value)
                    }
                  />
                  <small>{formulario.nombre.length}/120</small>
                </label>

                <label className="grupo-field">
                  <span>Descripción opcional</span>
                  <textarea
                    value={formulario.descripcion}
                    maxLength={500}
                    placeholder="Explica brevemente cómo se utilizarán estos grupos."
                    onChange={(evento) =>
                      actualizarCampo('descripcion', evento.target.value)
                    }
                  />
                  <small>{formulario.descripcion.length}/500</small>
                </label>
              </div>

              <CabeceraSeccion
                icono={Layers3}
                titulo="Alcance del conjunto"
                descripcion="Elige si estará disponible durante todo el semestre o solamente en el hito seleccionado." 
              />

              <div className="grupo-choice-grid alcance">
                <ChoiceCard
                  seleccionado={
                    formulario.alcance ===
                      'CURSO' &&
                    !(
                      formulario.tipoEvaluacion ===
                        'CONTINUA' &&
                      continuaSemestralDeshabilitada
                    )
                  }
                  icono={Users}
                  titulo="Todo el semestre"
                  etiqueta={
                    formulario.tipoEvaluacion ===
                      'PROCESUAL'
                      ? 'Obligatorio'
                      : undefined
                  }
                  descripcion={
                    formulario.tipoEvaluacion === 'PROCESUAL'
                      ? 'Alcance obligatorio para el conjunto procesual.'
                      : continuaSemestralDeshabilitada
                        ? validaciones?.continua.modalidad === 'POR_HITOS'
                          ? 'No disponible porque ya existen conjuntos por hito.'
                          : 'Ya existe un conjunto continuo semestral.'
                        : 'Disponible en todos los hitos del curso.'
                  }
                  deshabilitado={
                    formulario.tipoEvaluacion === 'CONTINUA' &&
                    continuaSemestralDeshabilitada
                  }
                  onClick={() => actualizarCampo('alcance', 'CURSO')}
                />

                <ChoiceCard
                  seleccionado={
                    formulario.alcance ===
                      'HITO' &&
                    !continuaHitoDeshabilitada
                  }
                  icono={Layers3}
                  titulo="Solo el hito actual"
                  descripcion={
                    hitoActual
                      ? `${hitoActual.codigo} · ${hitoActual.nombre}`
                      : 'No hay un hito seleccionado.'
                  }
                  deshabilitado={
                    formulario.tipoEvaluacion === 'PROCESUAL' ||
                    continuaHitoDeshabilitada
                  }
                  onClick={() => {
                    actualizarCampo('alcance', 'HITO');
                    actualizarCampo('hitoId', hitoActual?.id ?? null);
                  }}
                />
              </div>

              {formulario.tipoEvaluacion === 'CONTINUA' && (
                <div className="grupo-affinity-note">
                  <UserRoundCheck size={18} />
                  <div>
                    <strong>También podrás usar grupos por afinidad</strong>
                    <small>
                      Esa opción se habilitará al crear una tarea o foro continuo.
                    </small>
                  </div>
                </div>
              )}
            </div>
          )}

          {paso === 2 && (
            <div className="grupo-wizard__panel">
              <CabeceraSeccion
                icono={Dice5}
                titulo="¿Cómo deseas formar los grupos?"
                descripcion="Puedes sortearlos equilibradamente o crear la estructura para asignarlos después."
              />

              <div className="grupo-choice-grid metodo">
                <ChoiceCard
                  seleccionado={formulario.metodoCreacion === 'ALEATORIO'}
                  icono={Dice5}
                  titulo="Sorteo equilibrado"
                  etiqueta="Recomendado"
                  descripcion="Distribuye automáticamente a los estudiantes y evita grupos desproporcionados."
                  onClick={() => actualizarCampo('metodoCreacion', 'ALEATORIO')}
                />

                <ChoiceCard
                  seleccionado={formulario.metodoCreacion === 'MANUAL'}
                  icono={Users}
                  titulo="Asignación manual"
                  descripcion="Crea los grupos vacíos y asigna cada estudiante desde una lista."
                  onClick={() => actualizarCampo('metodoCreacion', 'MANUAL')}
                />
              </div>

              {formulario.metodoCreacion === 'ALEATORIO' ? (
                <div className="grupo-distribution-panel">
                  <div className="grupo-distribution-modes">
                    <button
                      type="button"
                      className={
                        formulario.criterioDistribucion === 'CANTIDAD_GRUPOS'
                          ? 'activo'
                          : ''
                      }
                      aria-pressed={
                        formulario.criterioDistribucion === 'CANTIDAD_GRUPOS'
                      }
                      onClick={() =>
                        actualizarCampo(
                          'criterioDistribucion',
                          'CANTIDAD_GRUPOS',
                        )
                      }
                    >
                      <span />
                      <div>
                        <strong>
                          Por cantidad de grupos
                        </strong>
                        <small>
                          Indica cuántos equipos deseas formar.
                        </small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={
                        formulario.criterioDistribucion ===
                        'INTEGRANTES_POR_GRUPO'
                          ? 'activo'
                          : ''
                      }
                      aria-pressed={
                        formulario.criterioDistribucion ===
                        'INTEGRANTES_POR_GRUPO'
                      }
                      onClick={() =>
                        actualizarCampo(
                          'criterioDistribucion',
                          'INTEGRANTES_POR_GRUPO',
                        )
                      }
                    >
                      <span />
                      <div>
                        <strong>
                          Por integrantes
                        </strong>
                        <small>
                          Define el tamaño aproximado de cada equipo.
                        </small>
                      </div>
                    </button>
                  </div>

                  <div className="grupo-counter-card">
                    <span>
                      {formulario.criterioDistribucion === 'CANTIDAD_GRUPOS'
                        ? 'Cantidad de grupos'
                        : 'Integrantes por grupo'}
                    </span>

                    <div className="grupo-counter">
                      <button
                        type="button"
                        aria-label="Disminuir"
                        onClick={() =>
                          cambiarCantidad(
                            -1,
                          )
                        }
                      >
                        <Minus size={17} />
                      </button>

                      <strong>
                        {formulario.criterioDistribucion === 'CANTIDAD_GRUPOS'
                          ? formulario.cantidadGrupos
                          : formulario.integrantesPorGrupo}
                      </strong>

                      <button
                        type="button"
                        aria-label="Aumentar"
                        onClick={() =>
                          cambiarCantidad(
                            1,
                          )
                        }
                      >
                        <Plus size={17} />
                      </button>
                    </div>

                    <small>
                      {totalEstudiantesValidacion} estudiantes activos.
                    </small>
                  </div>

                  {recomendaciones.length > 0 && (
                    <div className="grupo-recommendations">
                      <header>
                        <strong>
                          Distribuciones sugeridas
                        </strong>

                        <span>
                          Opciones equilibradas
                        </span>
                      </header>

                      <div>
                        {recomendaciones.map((opcion) => (
                          <button
                            key={opcion.cantidad}
                            type="button"
                            className={
                              formulario.criterioDistribucion ===
                                'CANTIDAD_GRUPOS' &&
                              formulario.cantidadGrupos ===
                                opcion.cantidad
                                ? 'seleccionado'
                                : ''
                            }
                            onClick={() => {
                              actualizarCampo(
                                'criterioDistribucion',
                                'CANTIDAD_GRUPOS',
                              );

                              actualizarCampo(
                                'cantidadGrupos',
                                opcion.cantidad,
                              );
                            }}
                          >
                            {opcion.recomendada && (
                              <em>
                                Recomendado
                              </em>
                            )}

                            <strong>
                              {opcion.cantidad} grupos
                            </strong>

                            <small>
                              {opcion.minimo === opcion.maximo
                                ? `${opcion.minimo} integrantes por grupo`
                                : `${opcion.minimo}-${opcion.maximo} integrantes`}
                            </small>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grupo-manual-config">
                  <div>
                    <span>
                      Cantidad de grupos
                    </span>

                    <strong>
                      Define la estructura antes de asignar estudiantes.
                    </strong>
                  </div>

                  <div className="grupo-counter">
                    <button
                      type="button"
                      aria-label="Disminuir cantidad de grupos"
                      onClick={() =>
                        cambiarCantidad(
                          -1,
                        )
                      }
                    >
                      <Minus
                        size={17}
                      />
                    </button>

                    <strong>
                      {formulario.cantidadGrupos}
                    </strong>

                    <button
                      type="button"
                      aria-label="Aumentar cantidad de grupos"
                      onClick={() =>
                        cambiarCantidad(
                          1,
                        )
                      }
                    >
                      <Plus
                        size={17}
                      />
                    </button>
                  </div>

                  <small>
                    En el siguiente paso asignarás cada estudiante desde una lista.
                  </small>
                </div>
              )}

              <label className="grupo-representative">
                <input
                  type="checkbox"
                  checked={formulario.requiereRepresentante}
                  onChange={(evento) =>
                    actualizarCampo('requiereRepresentante', evento.target.checked)
                  }
                />
                <UserRoundCheck size={20} />
                <div>
                  <strong>Designar representante por grupo</strong>
                  <small>
                    Podrá entregar o publicar en nombre del equipo cuando una
                    actividad lo requiera.
                  </small>
                </div>
              </label>
            </div>
          )}

          {paso === 3 && (
            <div className="grupo-wizard__panel">
              <CabeceraSeccion
                icono={Check}
                titulo="Todo listo para crear"
                descripcion="Revisa la clasificación, el alcance y la distribución final."
              />

              <div className="grupo-summary-grid">
                <SummaryItem titulo="Conjunto" valor={formulario.nombre} />
                <SummaryItem
                  titulo="Evaluación"
                  valor={
                    formulario.tipoEvaluacion === 'PROCESUAL'
                      ? 'Procesual'
                      : 'Continua'
                  }
                />
                <SummaryItem
                  titulo="Alcance"
                  valor={
                    formulario.alcance === 'CURSO'
                      ? 'Todo el semestre'
                      : hitoActual
                        ? `${hitoActual.codigo} · ${hitoActual.nombre}`
                        : 'Hito actual'
                  }
                />
                <SummaryItem
                  titulo="Formación"
                  valor={
                    formulario.metodoCreacion === 'ALEATORIO'
                      ? 'Sorteo equilibrado'
                      : 'Asignación manual'
                  }
                />
              </div>

              {formulario.metodoCreacion ===
                'MANUAL' &&
              previsualizacion ? (
                <div className="grupo-manual-editor">
                  <header>
                    <div>
                      <strong>
                        Asignación manual
                      </strong>

                      <small>
                        Selecciona el grupo de cada estudiante.
                      </small>
                    </div>

                    <span>
                      {
                        gruposManuales.reduce(
                          (
                            total,
                            grupo,
                          ) =>
                            total +
                            grupo.estudianteIds.length,
                          0,
                        )
                      }
                      /
                      {
                        previsualizacion.estudiantes.length
                      }
                      {' '}
                      asignados
                    </span>
                  </header>

                  <div className="grupo-manual-editor__layout">
                    <section className="grupo-manual-estudiantes">
                      {previsualizacion.estudiantes.map(
                        (
                          estudiante,
                        ) => {
                          const grupoIndice =
                            obtenerGrupoEstudiante(
                              estudiante.id,
                            );

                          return (
                            <article
                              key={
                                estudiante.id
                              }
                            >
                              <span>
                                {estudiante.nombres
                                  .charAt(
                                    0,
                                  )
                                  .toUpperCase()}
                                {estudiante.apellidoPaterno
                                  .charAt(
                                    0,
                                  )
                                  .toUpperCase()}
                              </span>

                              <div>
                                <strong>
                                  {estudiante.nombres}
                                  {' '}
                                  {estudiante.apellidoPaterno}
                                </strong>

                                <small>
                                  {estudiante.correo}
                                </small>
                              </div>

                              <select
                                value={
                                  grupoIndice
                                }
                                onChange={(
                                  evento,
                                ) =>
                                  asignarEstudianteManual(
                                    estudiante.id,
                                    Number(
                                      evento.target.value,
                                    ),
                                  )
                                }
                              >
                                <option value={-1}>
                                  Sin asignar
                                </option>

                                {gruposManuales.map(
                                  (
                                    grupo,
                                    indice,
                                  ) => (
                                    <option
                                      key={
                                        indice
                                      }
                                      value={
                                        indice
                                      }
                                    >
                                      {grupo.nombre}
                                    </option>
                                  ),
                                )}
                              </select>
                            </article>
                          );
                        },
                      )}
                    </section>

                    <aside className="grupo-manual-grupos">
                      {gruposManuales.map(
                        (
                          grupo,
                          indice,
                        ) => (
                          <article
                            key={
                              indice
                            }
                          >
                            <span>
                              G
                              {indice +
                              1}
                            </span>

                            <div>
                              <input
                                value={
                                  grupo.nombre
                                }
                                maxLength={
                                  80
                                }
                                aria-label={`Nombre del grupo ${indice + 1}`}
                                onChange={(
                                  evento,
                                ) =>
                                  cambiarNombreGrupoManual(
                                    indice,
                                    evento.target.value,
                                  )
                                }
                              />

                              <small>
                                {
                                  grupo.estudianteIds.length
                                }
                                {' '}
                                {grupo.estudianteIds.length ===
                                1
                                  ? 'integrante'
                                  : 'integrantes'}
                              </small>
                            </div>
                          </article>
                        ),
                      )}
                    </aside>
                  </div>
                </div>
              ) : formulario.metodoCreacion === 'ALEATORIO' && distribucion ? (
                <div className="grupo-preview">
                  <header>
                    <div>
                      <strong>Distribución propuesta</strong>
                      <small>
                        {totalEstudiantes} estudiantes · {distribucion.cantidadGrupos}{' '}
                        grupos
                      </small>
                    </div>
                    <span>
                      <Check size={13} /> Equilibrada
                    </span>
                  </header>

                  <div className="grupo-preview__grid">
                    {distribucion.grupos.map((grupo) => (
                      <article key={grupo.numeroGrupo}>
                        <span>G{grupo.numeroGrupo}</span>
                        <div>
                          <strong>Grupo {grupo.numeroGrupo}</strong>
                          <small>{grupo.cantidadIntegrantes} integrantes</small>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grupo-manual-summary">
                  <Users
                    size={21}
                  />

                  <div>
                    <strong>
                      Preparando asignación
                    </strong>

                    <small>
                      Regresa al paso anterior y vuelve a continuar para cargar los estudiantes.
                    </small>
                  </div>
                </div>
              )}
            </div>
          )}
</div>

      <style>{styles}</style>
    </AulaModal>

    <Toast
      visible={toast.visible}
      tipo="advertencia"
      titulo="Revisa los datos"
      mensaje={toast.mensaje}
      onCerrar={cerrarToast}
    />
    </>
  );
}

type CabeceraSeccionProps = {
  icono: typeof Users;
  titulo: string;
  descripcion: string;
};

function CabeceraSeccion({
  icono: Icono,
  titulo,
  descripcion,
}: CabeceraSeccionProps) {
  return (
    <div className="grupo-section-title">
      <span><Icono size={18} /></span>
      <div>
        <h3>{titulo}</h3>
        <p>{descripcion}</p>
      </div>
    </div>
  );
}

type ChoiceCardProps = {
  seleccionado: boolean;
  icono: typeof Users;
  titulo: string;
  descripcion: string;
  etiqueta?: string;
  deshabilitado?: boolean;
  onClick: () => void;
};

function ChoiceCard({
  seleccionado,
  icono: Icono,
  titulo,
  descripcion,
  etiqueta,
  deshabilitado = false,
  onClick,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      className={`grupo-choice ${seleccionado ? 'seleccionado' : ''}`}
      disabled={deshabilitado}
      onClick={onClick}
    >
      <span className="grupo-choice__icon"><Icono size={21} /></span>
      <div>
        <header>
          <strong>{titulo}</strong>
          {etiqueta && <em>{etiqueta}</em>}
        </header>
        <small>{descripcion}</small>
      </div>
      {seleccionado && <span className="grupo-choice__check"><Check size={14} /></span>}
    </button>
  );
}

function SummaryItem({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

const styles = `
  .grupo-wizard__steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    padding: 8px 18px;
    border-bottom: 1px solid var(--app-border-soft, #efe7df);
    background: var(--app-surface-alt, #fffaf4);
  }

  .grupo-wizard__steps > div {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--app-text-muted, #94a3b8);
  }

  .grupo-wizard__steps span {
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 50%;
    background: var(--app-card, #fffdf9);
    font-size: 10px;
    font-weight: 900;
  }

  .grupo-wizard__steps small {
    font-size: 10px;
    font-weight: 850;
  }

  .grupo-wizard__steps .activo,
  .grupo-wizard__steps .completado {
    color: var(--app-accent-dark, #c96829);
  }

  .grupo-wizard__steps .activo span,
  .grupo-wizard__steps .completado span {
    border-color: var(--app-accent, #f18b4b);
    color: #fff;
    background: var(--app-accent, #f18b4b);
  }

  .grupo-wizard__body {
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }

  .grupo-wizard__panel {
    display: grid;
    gap: 10px;
  }

  .grupo-section-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .grupo-section-title > span {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: 11px;
  }

  .grupo-section-title h3 {
    margin: 0;
    font-size: 16px;
    line-height: 1.2;
  }

  .grupo-section-title p {
    margin: 3px 0 0;
    color: var(--app-text-muted, #94a3b8);
    font-size: 11px;
    line-height: 1.4;
  }

  .grupo-choice-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .grupo-choice {
    position: relative;
    min-height: 70px;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    padding: 11px 13px;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 15px;
    color: var(--app-text-secondary, #334155);
    background: var(--app-card, #fffdf9);
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      transform .15s ease,
      border-color .15s ease,
      background .15s ease;
  }

  .grupo-choice:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: var(--app-accent, #f18b4b);
  }

  .grupo-choice.seleccionado {
    border-color: var(--app-accent, #f18b4b);
    background:
      color-mix(
        in srgb,
        var(--app-accent-soft, #fff0df) 42%,
        var(--app-card, #fffdf9)
      );
    box-shadow: inset 0 0 0 1px var(--app-accent, #f18b4b);
  }

  .grupo-choice:disabled {
    opacity: .42;
    cursor: not-allowed;
  }

  .grupo-choice__icon {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: var(--app-accent-dark, #c96829);
    background: var(--app-accent-soft, #fff0df);
  }

  .grupo-choice header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 7px;
    padding-right: 23px;
  }

  .grupo-choice strong {
    font-size: 13px;
    line-height: 1.25;
  }

  .grupo-choice em {
    padding: 4px 7px;
    border-radius: 999px;
    color: var(--app-accent-dark, #c96829);
    background: var(--app-accent-soft, #fff0df);
    font-size: 8px;
    font-style: normal;
    font-weight: 900;
    text-transform: uppercase;
  }

  .grupo-choice small {
    display: block;
    margin-top: 4px;
    color: var(--app-text-muted, #94a3b8);
    font-size: 10px;
    line-height: 1.35;
  }

  .grupo-choice__check {
    position: absolute;
    top: 9px;
    right: 9px;
    width: 25px;
    height: 25px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #fff;
    background: var(--app-accent, #f18b4b);
  }

  .grupo-form-grid {
    display: grid;
    grid-template-columns: .9fr 1.1fr;
    gap: 10px;
  }

  .grupo-field {
    position: relative;
    display: grid;
    gap: 6px;
  }

  .grupo-field > span {
    color: var(--app-text-secondary, #334155);
    font-size: 12px;
    font-weight: 850;
  }

  .grupo-field input,
  .grupo-field textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--app-input-border, #edd8c3);
    border-radius: 12px;
    outline: none;
    color: var(--app-text, #0f172a);
    background: var(--app-input-bg, #fffefa);
    font-family: inherit;
    font-size: 12px;
  }

  .grupo-field input {
    min-height: 44px;
    padding: 0 12px;
  }

  .grupo-field textarea {
    min-height: 62px;
    max-height: 82px;
    padding: 11px 12px;
    resize: vertical;
    line-height: 1.45;
  }

  .grupo-field input:focus,
  .grupo-field textarea:focus {
    border-color: var(--app-accent, #f18b4b);
    box-shadow:
      0 0 0 3px
      color-mix(
        in srgb,
        var(--app-accent, #f18b4b) 13%,
        transparent
      );
  }

  .grupo-field > small {
    position: absolute;
    right: 9px;
    bottom: 6px;
    color: var(--app-text-muted, #94a3b8);
    font-size: 9px;
    pointer-events: none;
  }

  .grupo-field textarea + small {
    bottom: 7px;
  }

  .grupo-affinity-note,
  .grupo-manual-summary {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border:
      1px solid
      color-mix(
        in srgb,
        var(--app-accent, #f18b4b) 25%,
        var(--app-border, #eadfd4)
      );
    border-radius: 13px;
    color: var(--app-accent-dark, #c96829);
    background: var(--app-accent-softer, #fff8ef);
  }

  .grupo-affinity-note strong,
  .grupo-affinity-note small,
  .grupo-manual-summary strong,
  .grupo-manual-summary small {
    display: block;
  }

  .grupo-affinity-note strong,
  .grupo-manual-summary strong {
    font-size: 12px;
  }

  .grupo-affinity-note small,
  .grupo-manual-summary small {
    margin-top: 2px;
    color: var(--app-text-soft, #64748b);
    font-size: 10px;
    line-height: 1.4;
  }

  .grupo-distribution-box {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(220px, .75fr);
    gap: 12px;
    padding: 13px;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 15px;
    background: var(--app-surface-alt, #fffaf4);
  }

  .grupo-distribution-box.manual {
    grid-template-columns: minmax(260px, 420px);
  }

  .grupo-segmented {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 5px;
    padding: 4px;
    border-radius: 12px;
    background: var(--app-card, #fffdf9);
  }

  .grupo-segmented button {
    min-height: 44px;
    border: none;
    border-radius: 9px;
    color: var(--app-text-soft, #64748b);
    background: transparent;
    font-family: inherit;
    font-size: 11px;
    font-weight: 850;
    cursor: pointer;
  }

  .grupo-segmented button.activo {
    color: var(--app-accent-dark, #c96829);
    background: var(--app-accent-soft, #fff0df);
  }

  .grupo-number-control {
    display: grid;
    gap: 6px;
  }

  .grupo-number-control > span {
    color: var(--app-text-secondary, #334155);
    font-size: 12px;
    font-weight: 850;
  }

  .grupo-number-control input {
    width: 100%;
    min-height: 47px;
    box-sizing: border-box;
    padding: 0 12px;
    border: 1px solid var(--app-input-border, #edd8c3);
    border-radius: 12px;
    outline: none;
    color: var(--app-text, #0f172a);
    background: var(--app-input-bg, #fffefa);
    font-family: inherit;
    font-size: 19px;
    font-weight: 900;
  }

  .grupo-number-control small {
    color: var(--app-text-muted, #94a3b8);
    font-size: 10px;
    line-height: 1.4;
  }

  .grupo-manual-config {
    display: grid;
    grid-template-columns:
      minmax(
        0,
        1fr
      )
      auto;
    gap: 10px 18px;
    align-items: center;
    padding: 13px;
    border:
      1px solid
      var(
        --app-border,
        #eadfd4
      );
    border-radius: 15px;
    background:
      var(
        --app-surface-alt,
        #fffaf4
      );
  }

  .grupo-manual-config > div:first-child span,
  .grupo-manual-config > div:first-child strong {
    display: block;
  }

  .grupo-manual-config > div:first-child span {
    color:
      var(
        --app-accent-dark,
        #c96829
      );
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .grupo-manual-config > div:first-child strong {
    margin-top: 4px;
    color:
      var(
        --app-text-secondary,
        #334155
      );
    font-size: 12px;
  }

  .grupo-manual-config > small {
    grid-column:
      1
      /
      -1;
    color:
      var(
        --app-text-muted,
        #94a3b8
      );
    font-size: 10px;
  }

  .grupo-manual-editor {
    min-height: 0;
    display: grid;
    grid-template-rows:
      auto
      minmax(
        0,
        1fr
      );
    overflow: hidden;
    border:
      1px solid
      var(
        --app-border,
        #eadfd4
      );
    border-radius: 15px;
    background:
      var(
        --app-surface-alt,
        #fffaf4
      );
  }

  .grupo-manual-editor > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 13px;
    border-bottom:
      1px solid
      var(
        --app-border-soft,
        #efe7df
      );
  }

  .grupo-manual-editor > header strong,
  .grupo-manual-editor > header small {
    display: block;
  }

  .grupo-manual-editor > header strong {
    font-size: 13px;
  }

  .grupo-manual-editor > header small {
    margin-top: 3px;
    color:
      var(
        --app-text-muted,
        #94a3b8
      );
    font-size: 9px;
  }

  .grupo-manual-editor > header > span {
    padding: 6px 9px;
    border-radius: 999px;
    color:
      var(
        --app-accent-dark,
        #c96829
      );
    background:
      var(
        --app-accent-soft,
        #fff0df
      );
    font-size: 9px;
    font-weight: 850;
  }

  .grupo-manual-editor__layout {
    min-height: 0;
    display: grid;
    grid-template-columns:
      minmax(
        0,
        1.55fr
      )
      minmax(
        250px,
        .65fr
      );
    gap: 10px;
    padding: 10px;
  }

  .grupo-manual-estudiantes {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 7px;
    align-content: start;
  }

  .grupo-manual-estudiantes article {
    min-width: 0;
    display: grid;
    grid-template-columns:
      34px
      minmax(
        0,
        1fr
      )
      118px;
    gap: 8px;
    align-items: center;
    padding: 8px;
    border:
      1px solid
      var(
        --app-border-soft,
        #efe7df
      );
    border-radius: 11px;
    background:
      var(
        --app-card,
        #fffdf9
      );
  }

  .grupo-manual-estudiantes article > span {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color:
      var(
        --app-accent-dark,
        #c96829
      );
    background:
      var(
        --app-accent-soft,
        #fff0df
      );
    font-size: 9px;
    font-weight: 900;
  }

  .grupo-manual-estudiantes article div {
    min-width: 0;
  }

  .grupo-manual-estudiantes strong,
  .grupo-manual-estudiantes small {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .grupo-manual-estudiantes strong {
    font-size: 10px;
  }

  .grupo-manual-estudiantes small {
    margin-top: 2px;
    color:
      var(
        --app-text-muted,
        #94a3b8
      );
    font-size: 8px;
  }

  .grupo-manual-estudiantes select {
    min-width: 0;
    min-height: 34px;
    border:
      1px solid
      var(
        --app-input-border,
        #edd8c3
      );
    border-radius: 9px;
    outline: none;
    color:
      var(
        --app-text-secondary,
        #334155
      );
    background:
      var(
        --app-input-bg,
        #fffefa
      );
    font-family: inherit;
    font-size: 9px;
    font-weight: 750;
  }

  .grupo-manual-grupos {
    display: grid;
    gap: 7px;
    align-content: start;
  }

  .grupo-manual-grupos article {
    display: grid;
    grid-template-columns:
      34px
      minmax(
        0,
        1fr
      );
    gap: 8px;
    align-items: center;
    padding: 8px;
    border:
      1px solid
      var(
        --app-border-soft,
        #efe7df
      );
    border-radius: 11px;
    background:
      var(
        --app-card,
        #fffdf9
      );
  }

  .grupo-manual-grupos article > span {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: #fff;
    background:
      var(
        --app-accent,
        #f18b4b
      );
    font-size: 9px;
    font-weight: 900;
  }

  .grupo-manual-grupos input {
    width: 100%;
    box-sizing: border-box;
    border: none;
    border-bottom:
      1px solid
      var(
        --app-border-soft,
        #efe7df
      );
    outline: none;
    color:
      var(
        --app-text,
        #0f172a
      );
    background: transparent;
    font-family: inherit;
    font-size: 10px;
    font-weight: 850;
  }

  .grupo-manual-grupos small {
    display: block;
    margin-top: 3px;
    color:
      var(
        --app-text-muted,
        #94a3b8
      );
    font-size: 8px;
  }

  .grupo-representative {
    display: grid;
    grid-template-columns: 18px 36px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    padding: 11px 12px;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 13px;
    background: var(--app-surface-alt, #fffaf4);
    cursor: pointer;
  }

  .grupo-representative input {
    width: 17px;
    height: 17px;
    accent-color: var(--app-accent, #f18b4b);
  }

  .grupo-representative > svg {
    color: var(--app-accent-dark, #c96829);
  }

  .grupo-representative strong,
  .grupo-representative small {
    display: block;
  }

  .grupo-representative strong {
    font-size: 12px;
  }

  .grupo-representative small {
    margin-top: 2px;
    color: var(--app-text-muted, #94a3b8);
    font-size: 10px;
  }

  .grupo-summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .grupo-summary-grid > div {
    padding: 11px;
    border: 1px solid var(--app-border-soft, #efe7df);
    border-radius: 12px;
    background: var(--app-surface-alt, #fffaf4);
  }

  .grupo-summary-grid span,
  .grupo-summary-grid strong {
    display: block;
  }

  .grupo-summary-grid span {
    color: var(--app-text-muted, #94a3b8);
    font-size: 9px;
  }

  .grupo-summary-grid strong {
    margin-top: 4px;
    font-size: 12px;
  }

  .grupo-preview {
    overflow: hidden;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 15px;
  }

  .grupo-preview > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 11px 13px;
    background: var(--app-surface-alt, #fffaf4);
  }

  .grupo-preview header strong,
  .grupo-preview header small {
    display: block;
  }

  .grupo-preview header strong {
    font-size: 13px;
  }

  .grupo-preview header small {
    margin-top: 3px;
    color: var(--app-text-muted, #94a3b8);
    font-size: 10px;
  }

  .grupo-preview header > span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 8px;
    border-radius: 999px;
    color: var(--app-success, #15803d);
    background: var(--app-success-bg, #ecfdf3);
    font-size: 9px;
    font-weight: 850;
  }

  .grupo-preview__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    padding: 11px;
  }

  .grupo-preview article {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px;
    border: 1px solid var(--app-border-soft, #efe7df);
    border-radius: 11px;
  }

  .grupo-preview article > span {
    width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 9px;
    color: var(--app-accent-dark, #c96829);
    background: var(--app-accent-soft, #fff0df);
    font-size: 10px;
    font-weight: 900;
  }

  .grupo-preview article strong,
  .grupo-preview article small {
    display: block;
  }

  .grupo-preview article strong {
    font-size: 11px;
  }

  .grupo-preview article small {
    margin-top: 2px;
    color: var(--app-text-muted, #94a3b8);
    font-size: 9px;
  }

  .grupo-btn {
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-width: 118px;
    max-width: 190px;
    padding: 9px 15px;
    border-radius: 12px;
    font-family: inherit;
    font-size: 11px;
    font-weight: 850;
    cursor: pointer;
  }

  .grupo-btn.secundario {
    border: 1px solid var(--app-border-strong, #dfc7b0);
    color: var(--app-text-secondary, #334155);
    background: var(--app-card, #fffdf9);
  }

  .grupo-btn.primario {
    border: none;
    color: #fff;
    background:
      linear-gradient(
        135deg,
        var(--app-accent, #f18b4b),
        var(--app-accent-hover, #e8702b)
      );
  }

  .grupo-btn:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .spin {
    animation: spin .8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (
    min-width:
      761px
  ) and (
    min-height:
      720px
  ) {
    .grupo-wizard__panel {
      height: 100%;
      align-content: start;
    }
  }

    .grupo-wizard__body {
      overflow-y: auto;
    }
  }

  @media (max-width: 760px) {
    .grupo-choice-grid,
    .grupo-form-grid,
    .grupo-distribution-box {
      grid-template-columns: 1fr;
    }

    .grupo-summary-grid,
    .grupo-preview__grid,
    .grupo-manual-editor__layout,
    .grupo-manual-estudiantes {
      grid-template-columns:
        1fr;
    }
  }

  @media (max-width: 520px) {
    .grupo-wizard__steps small {
      display: none;
    }

  }

  .grupo-reglas {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    padding: 10px 12px;
    border:
      1px solid
      color-mix(
        in srgb,
        var(--app-accent, #f18b4b) 24%,
        var(--app-border, #eadfd4)
      );
    border-radius: 12px;
    color: var(--app-accent-dark, #c96829);
    background: var(--app-accent-softer, #fff8ef);
  }

  .grupo-reglas strong,
  .grupo-reglas span {
    display: block;
  }

  .grupo-reglas strong {
    font-size: 11px;
  }

  .grupo-reglas span {
    margin-top: 2px;
    color: var(--app-text-soft, #64748b);
    font-size: 10px;
    line-height: 1.4;
  }

  .grupo-distribution-panel {
    display: grid;
    grid-template-columns:
      minmax(0, 1.2fr)
      minmax(190px, .55fr);
    gap: 10px;
    padding: 11px;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 15px;
    background: var(--app-surface-alt, #fffaf4);
  }

  .grupo-distribution-modes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .grupo-distribution-modes button {
    display: grid;
    grid-template-columns: 18px minmax(0, 1fr);
    gap: 8px;
    align-items: start;
    padding: 11px;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 12px;
    color: var(--app-text-secondary, #334155);
    background: var(--app-card, #fffdf9);
    font-family: inherit;
    text-align: left;
    cursor: pointer;
  }

  .grupo-distribution-modes button > span {
    width: 15px;
    height: 15px;
    margin-top: 1px;
    border: 2px solid var(--app-border-strong, #dfc7b0);
    border-radius: 50%;
    background: var(--app-card, #fffdf9);
  }

  .grupo-distribution-modes button.activo {
    border-color: var(--app-accent, #f18b4b);
    background: var(--app-accent-soft, #fff0df);
  }

  .grupo-distribution-modes button.activo > span {
    border: 4px solid var(--app-accent, #f18b4b);
  }

  .grupo-distribution-modes strong,
  .grupo-distribution-modes small {
    display: block;
  }

  .grupo-distribution-modes strong {
    font-size: 11px;
  }

  .grupo-distribution-modes small {
    margin-top: 3px;
    color: var(--app-text-muted, #94a3b8);
    font-size: 9px;
    line-height: 1.35;
  }

  .grupo-counter-card {
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 7px;
    padding: 10px;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 12px;
    background: var(--app-card, #fffdf9);
  }

  .grupo-counter-card > span {
    color: var(--app-text-secondary, #334155);
    font-size: 10px;
    font-weight: 850;
  }

  .grupo-counter-card > small {
    color: var(--app-text-muted, #94a3b8);
    font-size: 9px;
  }

  .grupo-counter {
    display: grid;
    grid-template-columns: 34px 48px 34px;
    gap: 7px;
    align-items: center;
  }

  .grupo-counter button {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 10px;
    color: var(--app-accent-dark, #c96829);
    background: var(--app-accent-soft, #fff0df);
    cursor: pointer;
  }

  .grupo-counter strong {
    color: var(--app-text, #0f172a);
    font-size: 22px;
    text-align: center;
  }

  .grupo-recommendations {
    grid-column: 1 / -1;
    display: grid;
    gap: 8px;
  }

  .grupo-recommendations > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .grupo-recommendations header strong {
    font-size: 11px;
  }

  .grupo-recommendations header span {
    color: var(--app-text-muted, #94a3b8);
    font-size: 9px;
  }

  .grupo-recommendations > div {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px;
  }

  .grupo-recommendations button {
    position: relative;
    padding: 10px;
    border: 1px solid var(--app-border, #eadfd4);
    border-radius: 11px;
    color: var(--app-text-secondary, #334155);
    background: var(--app-card, #fffdf9);
    font-family: inherit;
    text-align: left;
    cursor: pointer;
  }

  .grupo-recommendations button.seleccionado {
    border-color: var(--app-accent, #f18b4b);
    background: var(--app-accent-soft, #fff0df);
  }

  .grupo-recommendations em,
  .grupo-recommendations strong,
  .grupo-recommendations small {
    display: block;
  }

  .grupo-recommendations em {
    margin-bottom: 4px;
    color: var(--app-accent-dark, #c96829);
    font-size: 8px;
    font-style: normal;
    font-weight: 900;
    text-transform: uppercase;
  }

  .grupo-recommendations strong {
    font-size: 11px;
  }

  .grupo-recommendations small {
    margin-top: 3px;
    color: var(--app-text-muted, #94a3b8);
    font-size: 9px;
  }

  @media (max-width: 760px) {
    .grupo-distribution-panel,
    .grupo-distribution-modes {
      grid-template-columns: 1fr;
    }

    .grupo-recommendations > div {
      grid-template-columns: 1fr;
    }
  }



  /* Formulario de grupos compacto y armónico */
  .grupo-wizard__steps {
    padding: 7px 16px;
  }

  .grupo-wizard__body {
    padding: 0;
  }

  .grupo-wizard__panel {
    gap: 8px;
  }

  .grupo-section-title > span {
    width: 34px;
    height: 34px;
  }

  .grupo-section-title h3 {
    font-size: 15px;
  }

  .grupo-section-title p {
    font-size: 10px;
  }

  .grupo-choice {
    min-height: 62px;
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 8px;
    padding: 9px 11px;
    border-radius: 13px;
  }

  .grupo-choice__icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .grupo-choice strong {
    font-size: 12px;
  }

  .grupo-choice small {
    font-size: 9px;
  }

  .grupo-reglas,
  .grupo-affinity-note,
  .grupo-representative {
    padding: 8px 10px;
  }

  .grupo-form-grid {
    grid-template-columns: 1fr 1fr;
    gap: 9px;
  }

  .grupo-field input {
    min-height: 40px;
  }

  .grupo-field textarea {
    min-height: 55px;
    max-height: 65px;
    resize: none;
  }

  .grupo-distribution-panel {
    grid-template-columns: minmax(0, 1fr) 230px;
    gap: 8px;
    padding: 9px;
  }

  .grupo-distribution-modes button {
    min-height: 76px;
    padding: 9px;
  }

  .grupo-recommendations > div {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .grupo-recommendations button {
    min-height: 58px;
    padding: 8px 10px;
  }

  .grupo-counter-card {
    padding: 8px;
  }

  .grupo-btn {
    min-width: 112px;
    max-width: 178px;
    min-height: 39px;
    padding: 8px 13px;
  }

  @media (max-width: 760px) {
    .grupo-choice-grid,
    .grupo-form-grid,
    .grupo-distribution-panel,
    .grupo-distribution-modes {
      grid-template-columns: 1fr;
    }
  }
`;