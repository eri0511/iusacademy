import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardList,
  FileUp,
  GraduationCap,
  Info,
  Plus,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  Users,
  UsersRound,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import AulaModal from '../aula/AulaModal';
import Toast from '../shared/Toast';
import SelectorTipoTarea from './SelectorTipoTarea';
import ConfiguracionRespuestaEscritaDocente from './ConfiguracionRespuestaEscritaDocente';
import ConfiguracionCasoPracticoDocente from './ConfiguracionCasoPracticoDocente';
import ConfiguracionRedaccionJuridicaDocente from './ConfiguracionRedaccionJuridicaDocente';
import ConfiguracionExposicionDocente from './ConfiguracionExposicionDocente';
import ConfiguracionDocumentoColaborativoDocente from './ConfiguracionDocumentoColaborativoDocente';

import {
  leerConfiguracionRespuesta,
} from '../../utils/tareas/respuestaEscrita';

import {
  leerConfiguracionCaso,
  configCasoInicial,
} from '../../utils/tareas/casoPractico';

import {
  leerConfiguracionRedaccion,
  configRedaccionInicial,
} from '../../utils/tareas/redaccionJuridica';

import {
  leerConfiguracionExposicion,
  configExposicionInicial,
} from '../../utils/tareas/exposicion';

import {
  leerConfiguracionDocumentoColaborativo,
} from '../../utils/tareas/documentoColaborativo';

import {
  tieneConfiguracionComponente,
} from '../../utils/tareas/mixta';

import {
  rubricaIusAcademyPorTipo,
  totalPonderacionRubrica,
} from '../../utils/tareas/rubricasIusAcademy';

import type {
  ConfiguracionRespuestaEscrita,
} from '../../utils/tareas/respuestaEscrita';

import type {
  ConfiguracionCasoPractico,
} from '../../utils/tareas/casoPractico';

import type {
  ConfiguracionRedaccionJuridica,
} from '../../utils/tareas/redaccionJuridica';

import type {
  ConfiguracionExposicion,
} from '../../utils/tareas/exposicion';

import type {
  ConfiguracionDocumentoColaborativo,
} from '../../utils/tareas/documentoColaborativo';

import type {
  CrearRubricaDatos,
} from '../../types/tareas/rubricas.types';

import {
  useAulaContext,
} from '../../contexts/AulaContext';

import useGruposCurso from '../../hooks/grupos/useGruposCurso';

import type {
  CapacidadTarea,
  ComponenteEvaluacion,
  ComponenteTareaFormulario,
  CrearTareaDatos,
  ModalidadNotaTarea,
  ModalidadTarea,
  OrigenGrupoTarea,
  ResponsableEntregaGrupo,
  TareaCurso,
  TipoComponenteTarea,
  TipoDescuentoRetraso,
  TipoTarea,
} from '../../types/tareas/tareas.types';

type Props = {
  abierto: boolean;
  cursoId: number;
  hitoId: number;
  hitoCodigo: string;
  tareaEditar?: TareaCurso | null;
  guardando: boolean;
  onCerrar: () => void;
  onGuardar: (
    datos:
      CrearTareaDatos,
    publicar:
      boolean,
  ) => Promise<void>;
};

type Paso =
  | 1
  | 2
  | 3
  | 4
  | 5;

type ModoRubrica =
  | 'PREDETERMINADA'
  | 'PERSONALIZADA';

const etiquetaTipo = (tipo: TipoTarea) => {
  const etiquetas: Record<TipoTarea, string> = {
    ENTREGA_ARCHIVOS: 'Entrega de archivos',
    RESPUESTA_ESCRITA: 'Respuesta escrita',
    DOCUMENTO_COLABORATIVO: 'Documento colaborativo',
    REDACCION_JURIDICA: 'Redacción jurídica',
    EXPOSICION: 'Exposición',
    CASO_PRACTICO: 'Caso práctico',
    MIXTA: 'Actividad mixta',
    PRESENCIAL: 'Actividad presencial',
  };

  return etiquetas[tipo];
};

const ahoraLocal = () => {
  const fecha =
    new Date(
      Date.now() -
        new Date().getTimezoneOffset() *
          60000,
    );

  return fecha
    .toISOString()
    .slice(
      0,
      16,
    );
};

const sumarDias = (
  dias:
    number,
) => {
  const fecha =
    new Date(
      Date.now() +
        dias *
          86400000 -
        new Date().getTimezoneOffset() *
          60000,
    );

  return fecha
    .toISOString()
    .slice(
      0,
      16,
    );
};

const fechaEsValida = (
  valor:
    string,
) => {
  if (
    !valor
  ) {
    return false;
  }

  return !Number.isNaN(
    new Date(
      valor,
    ).getTime(),
  );
};

const maxFechaInput = (
  ...valores:
    Array<
      string | undefined
    >
) =>
  valores
    .filter(
      (
        valor,
      ): valor is string =>
        Boolean(
          valor,
        ),
    )
    .sort()
    .at(
    -1,
  ) ?? '';

function tamanioArchivo(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const aInputFecha = (
  valor?:
    string | null,
) => {
  if (!valor) {
    return '';
  }

  const fecha =
    new Date(
      valor,
    );

  if (
    Number.isNaN(
      fecha.getTime(),
    )
  ) {
    return '';
  }

  const local =
    new Date(
      fecha.getTime() -
        fecha.getTimezoneOffset() *
          60000,
    );

  return local
    .toISOString()
    .slice(
      0,
      16,
    );
};

type EstadoFormulario = {
  titulo: string;
  descripcion: string;
  instrucciones: string;
  tipo: TipoTarea;
  modalidad: ModalidadTarea;
  origenGrupo: OrigenGrupoTarea;
  conjuntoGrupoId: number | null;
  cantidadMinimaIntegrantes: number;
  cantidadMaximaIntegrantes: number;
  requiereRepresentante: boolean;
  responsableEntregaGrupo: ResponsableEntregaGrupo;
  capacidades: CapacidadTarea[];
  componentes: ComponenteTareaFormulario[];
  esCalificable: boolean;
  componente: ComponenteEvaluacion;
  puntajeMaximo: number;
  modalidadNota: ModalidadNotaTarea;
  porcentajeNotaGrupal: number;
  porcentajeNotaIndividual: number;
  fechaApertura: string;
  fechaLimite: string;
  fechaCierre: string;
  visibleAntesDeApertura: boolean;
  permitirRetrasos: boolean;
  fechaMaximaRetraso: string;
  tipoDescuentoRetraso: TipoDescuentoRetraso;
  valorDescuentoRetraso: number;
  exigirContenidoEditor: boolean;
  exigirArchivo: boolean;
  maximoArchivos: number;
  tamanioMaximoArchivoMb: number;
  extensionesPermitidas: string[];
  permitirEditarEntrega: boolean;
  configRespuesta:
    ConfiguracionRespuestaEscrita | null;
  configCaso:
    ConfiguracionCasoPractico | null;
  configRedaccion:
    ConfiguracionRedaccionJuridica | null;
  configExposicion:
    ConfiguracionExposicion | null;
  configDocumentoColaborativo:
    ConfiguracionDocumentoColaborativo | null;
  archivosConsigna: File[];
  archivoRubrica: File | null;
  modoRubrica: ModoRubrica;
  usarRubrica: boolean;
  rubricaIusAcademy: CrearRubricaDatos;
  archivosExistentes: TareaCurso['archivos'];
  archivosEliminados: number[];
};

function leerNumeroEditable(
  valor:
    string,
) {
  if (
    valor ===
    ''
  ) {
    return Number.NaN;
  }

  return Number(
    valor,
  );
}

function mostrarNumeroEditable(
  valor:
    number,
) {
  return Number.isNaN(
    valor,
  )
    ? ''
    : valor;
}

function normalizarNumeroEditable(
  valor:
    number,
  minimo:
    number,
  maximo:
    number,
  predeterminado:
    number,
) {
  if (
    Number.isNaN(
      valor,
    )
  ) {
    return predeterminado;
  }

  return Math.max(
    minimo,
    Math.min(
      maximo,
      valor,
    ),
  );
}

function inicial(): EstadoFormulario {
  return {
    titulo: '',
    descripcion: '',
    instrucciones: '',
    tipo: 'ENTREGA_ARCHIVOS',
    modalidad: 'INDIVIDUAL',
    origenGrupo: 'NINGUNO',
    conjuntoGrupoId: null,
    cantidadMinimaIntegrantes: 2,
    cantidadMaximaIntegrantes: 5,
    requiereRepresentante: true,
    responsableEntregaGrupo: 'SOLO_REPRESENTANTE',
    capacidades: [],
    componentes: [],
    esCalificable: true,
    componente: 'CONTINUA',
    puntajeMaximo: 100,
    modalidadNota: 'INDIVIDUAL',
    porcentajeNotaGrupal: 100,
    porcentajeNotaIndividual: 0,
    fechaApertura: ahoraLocal(),
    fechaLimite: sumarDias(7),
    fechaCierre: sumarDias(7),
    visibleAntesDeApertura: true,
    permitirRetrasos: false,
    fechaMaximaRetraso: '',
    tipoDescuentoRetraso: 'NINGUNO',
    valorDescuentoRetraso: 0,
    exigirContenidoEditor: true,
    exigirArchivo: true,
    maximoArchivos: 5,
    tamanioMaximoArchivoMb: 30,
    extensionesPermitidas: [
      'pdf',
      'doc',
      'docx',
      'jpg',
      'jpeg',
      'png',
      'ppt',
      'pptx',
    ],
    permitirEditarEntrega: true,
    configRespuesta: null,
    configCaso: null,
    configRedaccion: null,
    configExposicion: null,
    configDocumentoColaborativo: null,
    archivosConsigna: [],
    archivoRubrica: null,
    modoRubrica: 'PREDETERMINADA',
    usarRubrica: false,
    rubricaIusAcademy: rubricaIusAcademyPorTipo('ENTREGA_ARCHIVOS'),
    archivosExistentes: [],
    archivosEliminados: [],
  };
}

function leerTextoConfiguracion<T extends string>(
  configuracion:
    Record<string, unknown> | null,
  clave:
    string,
  valoresPermitidos:
    readonly T[],
  predeterminado:
    T,
): T {
  const valor =
    configuracion?.[
      clave
    ];

  return typeof valor ===
      'string' &&
    valoresPermitidos.includes(
      valor as T,
    )
    ? valor as T
    : predeterminado;
}

function leerNumeroConfiguracion(
  configuracion:
    Record<string, unknown> | null,
  clave:
    string,
  predeterminado:
    number,
) {
  const valor =
    configuracion?.[
      clave
    ];

  return typeof valor ===
      'number' &&
    Number.isFinite(
      valor,
    )
    ? valor
    : predeterminado;
}

function desdeTarea(
  tarea:
    TareaCurso,
): EstadoFormulario {
  return {
    titulo: tarea.titulo,
    descripcion: tarea.descripcion ?? '',
    instrucciones: tarea.instrucciones ?? '',
    tipo: tarea.tipo,
    modalidad: tarea.modalidad,
    origenGrupo: tarea.origenGrupo,
    conjuntoGrupoId: tarea.conjuntoGrupoId,
    cantidadMinimaIntegrantes:
      leerNumeroConfiguracion(
        tarea.configuracionTipo,
        'cantidadMinimaIntegrantes',
        2,
      ),
    cantidadMaximaIntegrantes:
      leerNumeroConfiguracion(
        tarea.configuracionTipo,
        'cantidadMaximaIntegrantes',
        5,
      ),
    requiereRepresentante: tarea.requiereRepresentante,
    responsableEntregaGrupo:
      tarea.origenGrupo ===
        'AFINIDAD'
        ? 'SOLO_REPRESENTANTE'
        : leerTextoConfiguracion<ResponsableEntregaGrupo>(
            tarea.configuracionTipo,
            'responsableEntregaGrupo',
            [
              'SOLO_REPRESENTANTE',
              'CUALQUIER_INTEGRANTE',
            ],
            'SOLO_REPRESENTANTE',
          ),
    capacidades: tarea.capacidades,
    componentes: tarea.componentes.map(
      (
        componente,
      ) => ({
        tipo: componente.tipo,
        titulo: componente.titulo,
        descripcion: componente.descripcion ?? undefined,
        obligatorio: componente.obligatorio,
        configuracion: componente.configuracion ?? undefined,
      }),
    ),
    esCalificable: tarea.esCalificable,
    componente: tarea.componente ?? 'CONTINUA',
    puntajeMaximo: Number(tarea.puntajeMaximo),
    modalidadNota: tarea.modalidadNota,
    porcentajeNotaGrupal: Number(tarea.porcentajeNotaGrupal ?? 100),
    porcentajeNotaIndividual: Number(tarea.porcentajeNotaIndividual ?? 0),
    fechaApertura: aInputFecha(tarea.fechaApertura),
    fechaLimite: aInputFecha(tarea.fechaLimite),
    fechaCierre: aInputFecha(tarea.fechaCierre),
    visibleAntesDeApertura: tarea.visibleAntesDeApertura,
    permitirRetrasos: tarea.permitirRetrasos,
    fechaMaximaRetraso: aInputFecha(tarea.fechaMaximaRetraso),
    tipoDescuentoRetraso: tarea.tipoDescuentoRetraso,
    valorDescuentoRetraso: Number(tarea.valorDescuentoRetraso ?? 0),
    exigirContenidoEditor: tarea.exigirContenidoEditor,
    exigirArchivo: tarea.exigirArchivo,
    maximoArchivos: tarea.maximoArchivos,
    tamanioMaximoArchivoMb: tarea.tamanioMaximoArchivoMb,
    extensionesPermitidas: tarea.extensionesPermitidas,
    permitirEditarEntrega: tarea.permitirEditarEntrega,
    configRespuesta:
      tarea.tipo ===
        'RESPUESTA_ESCRITA'
        ? leerConfiguracionRespuesta(
            tarea.configuracionTipo,
          )
        : null,
    configCaso:
      tarea.tipo ===
        'CASO_PRACTICO'
        ? leerConfiguracionCaso(
            tarea.configuracionTipo,
          )
        : null,
    configRedaccion:
      tarea.tipo ===
        'REDACCION_JURIDICA'
        ? leerConfiguracionRedaccion(
            tarea.configuracionTipo,
          )
        : null,
    configExposicion:
      tarea.tipo ===
        'EXPOSICION'
        ? leerConfiguracionExposicion(
            tarea.configuracionTipo,
          )
        : null,
    configDocumentoColaborativo:
      tarea.tipo ===
        'DOCUMENTO_COLABORATIVO'
        ? leerConfiguracionDocumentoColaborativo(
            tarea.configuracionTipo,
          )
        : null,
    archivosConsigna: [],
    archivoRubrica: null,
    modoRubrica: 'PREDETERMINADA',
    usarRubrica: false,
    rubricaIusAcademy: rubricaIusAcademyPorTipo(tarea.tipo),
    archivosExistentes: tarea.archivos,
    archivosEliminados: [],
  };
}

const tiposComponente: Array<{
  valor: TipoComponenteTarea;
  texto: string;
}> = [
  { valor: 'ARCHIVOS', texto: 'Archivos' },
  { valor: 'TEXTO', texto: 'Respuesta escrita' },
  { valor: 'DOCUMENTO_COLABORATIVO', texto: 'Documento colaborativo' },
  { valor: 'REDACCION_JURIDICA', texto: 'Redacción jurídica' },
  { valor: 'EXPOSICION', texto: 'Exposición' },
  { valor: 'CASO_PRACTICO', texto: 'Caso práctico' },
  { valor: 'PRESENCIAL', texto: 'Presencial' },
];


function componentesIncluyen(
  componentes:
    ComponenteTareaFormulario[],
  tipos:
    TipoComponenteTarea[],
) {
  return componentes.some(
    (
      componente,
    ) =>
      tipos.includes(
        componente.tipo,
      ),
  );
}

function usaArchivosPorConfiguracion(
  tipo:
    TipoTarea,
  capacidades:
    CapacidadTarea[],
  componentes:
    ComponenteTareaFormulario[],
) {
  if (
    tipo ===
      'ENTREGA_ARCHIVOS' ||
    tipo ===
      'EXPOSICION'
  ) {
    return true;
  }

  if (
    tipo ===
      'MIXTA'
  ) {
    return componentesIncluyen(
      componentes,
      [
        'ARCHIVOS',
        'EXPOSICION',
      ],
    );
  }

  return capacidades.includes(
    'ARCHIVOS',
  );
}

function usaEditorPorConfiguracion(
  tipo:
    TipoTarea,
  componentes:
    ComponenteTareaFormulario[],
) {
  if (
    [
      'RESPUESTA_ESCRITA',
      'DOCUMENTO_COLABORATIVO',
      'REDACCION_JURIDICA',
      'CASO_PRACTICO',
    ].includes(
      tipo,
    )
  ) {
    return true;
  }

  if (
    tipo ===
      'MIXTA'
  ) {
    return componentesIncluyen(
      componentes,
      [
        'TEXTO',
        'DOCUMENTO_COLABORATIVO',
        'REDACCION_JURIDICA',
        'CASO_PRACTICO',
      ],
    );
  }

  return false;
}

function permiteRetrasosPorTipo(
  tipo:
    TipoTarea,
) {
  /*
   * Una actividad presencial se registra principalmente por el docente;
   * no existe una "entrega tardía" del estudiante.
   */
  return tipo !==
    'PRESENCIAL';
}

function permiteEdicionEntregaPorTipo(
  tipo:
    TipoTarea,
) {
  return tipo !==
    'PRESENCIAL';
}

function capacidadesOpcionales(
  tipo:
    TipoTarea,
  modalidad:
    ModalidadTarea,
): CapacidadTarea[] {
  const resultado: CapacidadTarea[] = [];

  if (
    [
      'RESPUESTA_ESCRITA',
      'REDACCION_JURIDICA',
      'CASO_PRACTICO',
    ].includes(
      tipo,
    )
  ) {
    resultado.push(
      'ARCHIVOS',
    );
  }

  if (
    modalidad ===
      'GRUPAL' &&
    [
      'RESPUESTA_ESCRITA',
      'REDACCION_JURIDICA',
      'CASO_PRACTICO',
    ].includes(
      tipo,
    )
  ) {
    resultado.push(
      'EDICION_COLABORATIVA',
      'SEGUIMIENTO_AUTORIA',
      'HISTORIAL_VERSIONES',
    );
  }

  return resultado;
}

function ContadorNumero({
  etiqueta,
  valor,
  minimo = 0,
  maximo = 100,
  paso = 1,
  onChange,
}: {
  etiqueta:
    string;
  valor:
    number;
  minimo?:
    number;
  maximo?:
    number;
  paso?:
    number;
  onChange:
    (
      valor:
        number,
    ) => void;
}) {
  const cambiar =
    (
      direccion:
        -1 | 1,
    ) => {
      onChange(
        Math.min(
          maximo,
          Math.max(
            minimo,
            valor +
              direccion *
                paso,
          ),
        ),
      );
    };

  return (
    <div className="tarea-contador">
      <span>
        {etiqueta}
      </span>

      <div>
        <button
          type="button"
          onClick={() =>
            cambiar(
              -1,
            )
          }
          disabled={
            valor <=
            minimo
          }
          aria-label={`Disminuir ${etiqueta}`}
        >
          −
        </button>

        <strong>
          {valor}
        </strong>

        <button
          type="button"
          onClick={() =>
            cambiar(
              1,
            )
          }
          disabled={
            valor >=
            maximo
          }
          aria-label={`Aumentar ${etiqueta}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function FormularioTareaInteligente({
  abierto,
  cursoId,
  hitoId,
  hitoCodigo,
  tareaEditar,
  guardando,
  onCerrar,
  onGuardar,
}: Props) {
  const {
    curso,
  } =
    useAulaContext();

  const [
    paso,
    setPaso,
  ] =
    useState<Paso>(
      1,
    );

  const [
    seleccionandoTipo,
    setSeleccionandoTipo,
  ] =
    useState(
      false,
    );

  const [
    form,
    setForm,
  ] =
    useState<EstadoFormulario>(
      inicial,
    );

  const [
    errorLocal,
    setErrorLocal,
  ] =
    useState<string | null>(
      null,
    );

  const edicionRestringida =
    Boolean(
      tareaEditar?.tieneTrabajoEstudiantil,
    );

  const [
    tipoGrupoPlataforma,
    setTipoGrupoPlataforma,
  ] =
    useState<ComponenteEvaluacion>(
      'CONTINUA',
    );

  const {
    conjuntos,
    cargando:
      cargandoGrupos,
    error:
      errorGrupos,
  } =
    useGruposCurso({
      cursoId,
      hitoId,
      cargarAutomaticamente:
        abierto,
    });

  useEffect(
    () => {
      if (!abierto) {
        return;
      }

      setPaso(
        tareaEditar?.tieneTrabajoEstudiantil
          ? 3
          : 1,
      );

      setSeleccionandoTipo(
        false,
      );

      setErrorLocal(
        null,
      );
      const siguienteFormulario =
        tareaEditar
          ? desdeTarea(
              tareaEditar,
            )
          : inicial();

      setForm(
        siguienteFormulario,
      );

      setTipoGrupoPlataforma(
        siguienteFormulario.componente,
      );
    },
    [
      abierto,
      tareaEditar,
    ],
  );

  const opcionesGrupo =
    useMemo(
      () =>
        conjuntos.filter(
          (
            conjunto,
          ) =>
            conjunto.tipoEvaluacion ===
              tipoGrupoPlataforma &&
            (
              tipoGrupoPlataforma ===
                'CONTINUA'
                ? conjunto.alcance ===
                    'HITO' &&
                  conjunto.hitoId ===
                    hitoId
                : conjunto.alcance ===
                    'CURSO'
            ),
        ),
      [
        conjuntos,
        hitoId,
        tipoGrupoPlataforma,
      ],
    );

  const usaGruposPlataforma =
    form.modalidad ===
      'GRUPAL' &&
    form.origenGrupo ===
      'PLATAFORMA';

  const afinidad =
    form.modalidad ===
      'GRUPAL' &&
    form.origenGrupo ===
      'AFINIDAD';

  useEffect(
    () => {
      if (
        !usaGruposPlataforma
      ) {
        return;
      }

      setForm(
        (
          actual,
        ) => {
          const seleccionValida =
            opcionesGrupo.some(
              (
                conjunto,
              ) =>
                conjunto.id ===
                actual.conjuntoGrupoId,
            );

          if (
            seleccionValida
          ) {
            return actual;
          }

          return {
            ...actual,
            conjuntoGrupoId:
              opcionesGrupo.length ===
                1
                ? opcionesGrupo[0].id
                : null,
          };
        },
      );
    },
    [
      opcionesGrupo,
      usaGruposPlataforma,
    ],
  );

  const usaArchivos =
    usaArchivosPorConfiguracion(
      form.tipo,
      form.capacidades,
      form.componentes,
    );

  const usaEditor =
    usaEditorPorConfiguracion(
      form.tipo,
      form.componentes,
    );

  const permiteRetrasos =
    permiteRetrasosPorTipo(
      form.tipo,
    );

  const permiteEditarEntrega =
    permiteEdicionEntregaPorTipo(
      form.tipo,
    );

  const totalRubricaIusAcademy =
    useMemo(
      () =>
        totalPonderacionRubrica(
          form.rubricaIusAcademy,
        ),
      [form.rubricaIusAcademy],
    );

  const actualizarCriterioRubrica = (
    indice: number,
    cambios: Partial<CrearRubricaDatos['criterios'][number]>,
  ) => {
    setForm((actual) => ({
      ...actual,
      rubricaIusAcademy: {
        ...actual.rubricaIusAcademy,
        criterios: actual.rubricaIusAcademy.criterios.map((criterio, posicion) =>
          posicion === indice
            ? { ...criterio, ...cambios }
            : criterio,
        ),
      },
    }));
  };

  const actualizarNivelRubrica = (
    indiceCriterio: number,
    indiceNivel: number,
    cambios: Partial<CrearRubricaDatos['criterios'][number]['niveles'][number]>,
  ) => {
    setForm((actual) => ({
      ...actual,
      rubricaIusAcademy: {
        ...actual.rubricaIusAcademy,
        criterios: actual.rubricaIusAcademy.criterios.map((criterio, posicion) =>
          posicion === indiceCriterio
            ? {
                ...criterio,
                niveles: criterio.niveles.map((nivel, posicionNivel) =>
                  posicionNivel === indiceNivel
                    ? { ...nivel, ...cambios }
                    : nivel,
                ),
              }
            : criterio,
        ),
      },
    }));
  };

  const agregarCriterioRubrica = () => {
    setForm((actual) => {
      const orden = actual.rubricaIusAcademy.criterios.length;

      return {
        ...actual,
        rubricaIusAcademy: {
          ...actual.rubricaIusAcademy,
          criterios: [
            ...actual.rubricaIusAcademy.criterios,
            {
              orden,
              nombre: 'Nuevo criterio',
              descripcion: 'Describe qué aspecto se evaluará en este criterio.',
              peso: 0,
              niveles: [
                { orden: 0, etiqueta: 'Insuficiente', puntos: 49, descripcion: 'El desempeño no alcanza lo esperado.' },
                { orden: 1, etiqueta: 'Básico', puntos: 69, descripcion: 'El desempeño alcanza parcialmente lo esperado.' },
                { orden: 2, etiqueta: 'Bueno', puntos: 89, descripcion: 'El desempeño cumple adecuadamente lo esperado.' },
                { orden: 3, etiqueta: 'Excelente', puntos: 100, descripcion: 'El desempeño supera de forma sólida lo esperado.' },
              ],
            },
          ],
        },
      };
    });
  };

  const eliminarCriterioRubrica = (indice: number) => {
    setForm((actual) => ({
      ...actual,
      rubricaIusAcademy: {
        ...actual.rubricaIusAcademy,
        criterios: actual.rubricaIusAcademy.criterios
          .filter((_, posicion) => posicion !== indice)
          .map((criterio, orden) => ({ ...criterio, orden })),
      },
    }));
  };

  const restablecerRubricaIusAcademy = () => {
    setForm((actual) => ({
      ...actual,
      rubricaIusAcademy: rubricaIusAcademyPorTipo(actual.tipo),
    }));
  };

  const validarPaso = (
    pasoValidar:
      Paso,
  ) => {
    if (
      pasoValidar ===
        1
    ) {
      if (
        !form.titulo.trim()
      ) {
        return 'Escribe el título de la tarea.';
      }

      if (
        form.tipo ===
          'MIXTA' &&
        form.componentes.length <
          2
      ) {
        return 'Una actividad mixta debe tener al menos dos componentes.';
      }
    }

    if (
      pasoValidar ===
        2 &&
      form.modalidad ===
        'GRUPAL'
    ) {
      if (
        form.origenGrupo ===
          'NINGUNO'
      ) {
        return 'Selecciona de dónde provendrán los grupos.';
      }

      if (
        form.origenGrupo ===
          'PLATAFORMA' &&
        !form.conjuntoGrupoId
      ) {
        return tipoGrupoPlataforma ===
          'CONTINUA'
          ? 'No existe un grupo de evaluación continua seleccionado para este hito.'
          : 'No existe un equipo procesual seleccionado para este curso.';
      }

      if (
        form.origenGrupo ===
          'AFINIDAD'
      ) {
        if (
          form.cantidadMinimaIntegrantes <
          2
        ) {
          return 'El mínimo de integrantes debe ser al menos 2.';
        }

        if (
          form.cantidadMaximaIntegrantes <
          form.cantidadMinimaIntegrantes
        ) {
          return 'El máximo de integrantes debe ser igual o mayor al mínimo.';
        }

        if (
          form.cantidadMaximaIntegrantes >
          curso.estudiantesInscritos
        ) {
          return `El máximo de integrantes no puede superar los ${curso.estudiantesInscritos} estudiantes inscritos.`;
        }
      }
    }

    if (
      pasoValidar ===
        3
    ) {
      if (
        !form.fechaApertura ||
        !form.fechaLimite ||
        !form.fechaCierre
      ) {
        return 'Completa las fechas de la tarea.';
      }

      if (
        !fechaEsValida(
          form.fechaApertura,
        ) ||
        !fechaEsValida(
          form.fechaLimite,
        ) ||
        !fechaEsValida(
          form.fechaCierre,
        )
      ) {
        return 'Revisa las fechas y horas ingresadas.';
      }

      const apertura =
        new Date(
          form.fechaApertura,
        );

      const limite =
        new Date(
          form.fechaLimite,
        );

      const cierre =
        new Date(
          form.fechaCierre,
        );

      const ahora =
        new Date();

      const margenAhora =
        new Date(
          ahora.getTime() -
            60000,
        );

      if (
        !tareaEditar &&
        apertura <
          margenAhora
      ) {
        return 'La apertura de la tarea no puede estar en una fecha u hora pasada.';
      }

      if (
        tareaEditar &&
        form.fechaApertura !==
          aInputFecha(
            tareaEditar.fechaApertura,
          ) &&
        apertura <
          margenAhora
      ) {
        return 'No puedes cambiar la apertura a una fecha u hora pasada.';
      }

      if (
        limite <=
        apertura
      ) {
        return 'La fecha límite debe ser posterior a la apertura.';
      }

      if (
        !tareaEditar &&
        limite <=
          ahora
      ) {
        return 'La fecha límite debe estar en el futuro.';
      }

      if (
        tareaEditar &&
        form.fechaLimite !==
          aInputFecha(
            tareaEditar.fechaLimite,
          ) &&
        limite <=
          ahora
      ) {
        return 'La nueva fecha límite debe estar en el futuro.';
      }

      if (
        cierre <
        limite
      ) {
        return 'El cierre definitivo no puede ser anterior a la fecha límite.';
      }

      if (
        edicionRestringida &&
        tareaEditar &&
        limite <
          new Date(
            tareaEditar.fechaLimite,
          )
      ) {
        return 'La tarea ya tiene entregas. La fecha límite solo puede mantenerse o ampliarse.';
      }

      if (
        edicionRestringida &&
        tareaEditar &&
        cierre <
          new Date(
            tareaEditar.fechaCierre,
          )
      ) {
        return 'La tarea ya tiene entregas. El cierre definitivo solo puede mantenerse o ampliarse.';
      }

      if (
        !tareaEditar &&
        cierre <=
          ahora
      ) {
        return 'El cierre definitivo debe estar en el futuro.';
      }

      if (
        tareaEditar &&
        form.fechaCierre !==
          aInputFecha(
            tareaEditar.fechaCierre,
          ) &&
        cierre <=
          ahora
      ) {
        return 'El nuevo cierre definitivo debe estar en el futuro.';
      }

      if (
        permiteRetrasos &&
        form.permitirRetrasos
      ) {
        if (
          !form.fechaMaximaRetraso
        ) {
          return 'Indica hasta cuándo se aceptarán entregas con retraso.';
        }

        if (
          !fechaEsValida(
            form.fechaMaximaRetraso,
          )
        ) {
          return 'Revisa la fecha y hora máxima de retraso.';
        }

        const retraso =
          new Date(
            form.fechaMaximaRetraso,
          );

        if (
          edicionRestringida &&
          tareaEditar?.fechaMaximaRetraso &&
          retraso <
            new Date(
              tareaEditar.fechaMaximaRetraso,
            )
        ) {
          return 'La tarea ya tiene entregas. El cierre con retraso solo puede mantenerse o ampliarse.';
        }

        if (
          retraso <=
          limite
        ) {
          return 'La fecha máxima de retraso debe ser posterior al límite normal.';
        }

        if (
          retraso >
          cierre
        ) {
          return 'La fecha máxima de retraso no puede superar el cierre definitivo.';
        }

        if (
          !tareaEditar &&
          retraso <=
            ahora
        ) {
          return 'La fecha máxima de retraso debe estar en el futuro.';
        }

        if (
          tareaEditar &&
          form.fechaMaximaRetraso !==
            aInputFecha(
              tareaEditar.fechaMaximaRetraso,
            ) &&
          retraso <=
            ahora
        ) {
          return 'La nueva fecha máxima de retraso debe estar en el futuro.';
        }
      }
    }

    if (
      pasoValidar ===
        4 &&
      form.esCalificable
    ) {
      if (
        form.puntajeMaximo <
          1 ||
        form.puntajeMaximo >
          100
      ) {
        return 'El puntaje máximo debe estar entre 1 y 100.';
      }

      if (
        form.modalidad ===
          'GRUPAL' &&
        form.modalidadNota ===
          'GRUPAL_E_INDIVIDUAL' &&
        form.porcentajeNotaGrupal +
          form.porcentajeNotaIndividual !==
          100
      ) {
        return 'El porcentaje grupal e individual debe sumar 100%.';
      }
    }

    if (
      pasoValidar === 4 &&
      form.tipo === 'EXPOSICION' &&
      form.configExposicion?.estructuraGuiada &&
      form.configExposicion.minPalabras > form.configExposicion.maxPalabras
    ) {
      return 'Las palabras mínimas no pueden superar las palabras máximas.';
    }


    if (
      pasoValidar === 5 &&
      form.esCalificable &&
      form.usarRubrica
    ) {
      if (
        form.modoRubrica === 'PERSONALIZADA' &&
        !form.archivoRubrica
      ) {
        return 'Selecciona un archivo .xlsx o .pdf para la rúbrica personalizada.';
      }

      if (form.modoRubrica === 'PREDETERMINADA') {
        if (form.rubricaIusAcademy.criterios.length === 0) {
          return 'La rúbrica IusAcademy debe tener al menos un criterio.';
        }

        if (totalRubricaIusAcademy !== 100) {
          return 'La ponderación total de la rúbrica IusAcademy debe sumar 100%.';
        }

        for (const criterio of form.rubricaIusAcademy.criterios) {
          if (!criterio.nombre.trim()) {
            return 'Todos los criterios de la rúbrica deben tener un nombre.';
          }

          if (criterio.peso < 0 || criterio.peso > 100) {
            return `Revisa la ponderación del criterio ${criterio.nombre}.`;
          }

          if (criterio.niveles.length < 2) {
            return `El criterio ${criterio.nombre} debe tener al menos dos niveles de desempeño.`;
          }

          for (const nivel of criterio.niveles) {
            if (!nivel.etiqueta.trim()) {
              return `Todos los niveles de ${criterio.nombre} deben tener una etiqueta.`;
            }

            if (nivel.puntos < 0 || nivel.puntos > 100) {
              return `Los puntajes de los niveles de ${criterio.nombre} deben estar entre 0 y 100.`;
            }
          }
        }
      }
    }

    if (pasoValidar === 1) {
      const maximoBytes = form.tamanioMaximoArchivoMb * 1024 * 1024;
      const duplicados = new Set<string>();

      for (const archivo of form.archivosConsigna) {
        if (archivo.size > maximoBytes) {
          return `El archivo ${archivo.name} supera el límite configurado de ${form.tamanioMaximoArchivoMb} MB.`;
        }

        const clave = `${archivo.name.toLowerCase()}-${archivo.size}`;
        if (duplicados.has(clave)) {
          return `El archivo ${archivo.name} está repetido.`;
        }
        duplicados.add(clave);
      }
    }

    return null;
  };

  const avanzar = () => {
    const error =
      validarPaso(
        paso,
      );

    if (error) {
      setErrorLocal(
        error,
      );
      return;
    }

    setErrorLocal(
      null,
    );

    if (
      paso <
      5
    ) {
      setPaso(
        (
          paso +
          1
        ) as Paso,
      );
    }
  };

  const agregarComponente = () => {
    setForm(
      (
        actual,
      ) => ({
        ...actual,
        componentes: [
          ...actual.componentes,
          {
            tipo: 'ARCHIVOS',
            titulo: `Componente ${actual.componentes.length + 1}`,
            obligatorio: true,
          },
        ],
      }),
    );
  };

  const prepararDatos = (
    publicar:
      boolean,
  ): CrearTareaDatos => ({
    hitoId,
    titulo:
      form.titulo.trim(),
    descripcion:
      form.descripcion.trim() ||
      undefined,
    instrucciones:
      form.instrucciones.trim() ||
      undefined,
    tipo:
      form.tipo,
    capacidades:
      form.capacidades,
    configuracionTipo:
      (() => {
        const configuracionBase = {
          ...(
            tareaEditar?.configuracionTipo ??
            {}
          ),
        };

        delete configuracionBase[
          'cantidadMinimaIntegrantes'
        ];

        delete configuracionBase[
          'cantidadMaximaIntegrantes'
        ];

        delete configuracionBase[
          'responsableEntregaGrupo'
        ];

        const configuracionGrupo =
          form.modalidad ===
            'GRUPAL'
            ? {
                responsableEntregaGrupo:
                  form.origenGrupo ===
                    'AFINIDAD'
                    ? 'SOLO_REPRESENTANTE'
                    : form.responsableEntregaGrupo,
              }
            : {};

        const configuracionAfinidad =
          form.modalidad ===
              'GRUPAL' &&
          form.origenGrupo ===
              'AFINIDAD'
            ? {
                cantidadMinimaIntegrantes:
                  form.cantidadMinimaIntegrantes,
                cantidadMaximaIntegrantes:
                  form.cantidadMaximaIntegrantes,
              }
            : {};

        const resultado = {
          ...configuracionBase,
          ...configuracionGrupo,
          ...configuracionAfinidad,
          ...(
            form.tipo ===
              'RESPUESTA_ESCRITA' &&
            form.configRespuesta
              ? {
                  respuestaEscrita:
                    form.configRespuesta,
                }
              : {}
          ),
          ...(
            form.tipo ===
              'CASO_PRACTICO' &&
            form.configCaso
              ? {
                  casoPractico:
                    form.configCaso,
                }
              : {}
          ),
          ...(
            form.tipo ===
              'REDACCION_JURIDICA' &&
            form.configRedaccion
              ? {
                  redaccionJuridica:
                    form.configRedaccion,
                }
              : {}
          ),
          ...(
            form.tipo ===
              'EXPOSICION' &&
            form.configExposicion
              ? {
                  exposicion:
                    form.configExposicion,
                }
              : {}
          ),
          ...(
            form.tipo ===
              'DOCUMENTO_COLABORATIVO' &&
            form.configDocumentoColaborativo
              ? {
                  documentoColaborativo:
                    form.configDocumentoColaborativo,
                }
              : {}
          ),
        };

        return Object.keys(
          resultado,
        ).length >
          0
          ? resultado
          : undefined;
      })(),
    componentes:
      form.tipo ===
      'MIXTA'
        ? form.componentes
        : undefined,
    esCalificable:
      form.esCalificable,
    componente:
      form.esCalificable
        ? form.modalidad ===
            'GRUPAL' &&
          form.origenGrupo ===
            'PLATAFORMA'
          ? tipoGrupoPlataforma
          : form.componente
        : undefined,
    puntajeMaximo:
      form.esCalificable
        ? form.puntajeMaximo
        : undefined,
    modalidad:
      form.modalidad,
    origenGrupo:
      form.modalidad ===
      'GRUPAL'
        ? form.origenGrupo
        : 'NINGUNO',
    conjuntoGrupoId:
      form.modalidad ===
        'GRUPAL' &&
      form.origenGrupo ===
        'PLATAFORMA'
        ? form.conjuntoGrupoId ??
          undefined
        : undefined,
    modalidadNota:
      form.esCalificable
        ? form.modalidad ===
          'INDIVIDUAL'
          ? 'INDIVIDUAL'
          : form.modalidadNota
        : undefined,
    porcentajeNotaGrupal:
      form.esCalificable &&
      form.modalidad ===
        'GRUPAL' &&
      form.modalidadNota ===
        'GRUPAL_E_INDIVIDUAL'
        ? form.porcentajeNotaGrupal
        : undefined,
    porcentajeNotaIndividual:
      form.esCalificable &&
      form.modalidad ===
        'GRUPAL' &&
      form.modalidadNota ===
        'GRUPAL_E_INDIVIDUAL'
        ? form.porcentajeNotaIndividual
        : undefined,
    requiereRepresentante:
      form.modalidad ===
      'GRUPAL'
        ? form.requiereRepresentante
        : false,
    fechaApertura:
      new Date(
        form.fechaApertura,
      ).toISOString(),
    fechaLimite:
      new Date(
        form.fechaLimite,
      ).toISOString(),
    fechaCierre:
      new Date(
        form.fechaCierre,
      ).toISOString(),
    visibleAntesDeApertura:
      form.visibleAntesDeApertura,
    permitirRetrasos:
      permiteRetrasos
        ? form.permitirRetrasos
        : false,
    fechaMaximaRetraso:
      permiteRetrasos &&
      form.permitirRetrasos &&
      form.fechaMaximaRetraso
        ? new Date(
            form.fechaMaximaRetraso,
          ).toISOString()
        : undefined,
    tipoDescuentoRetraso:
      permiteRetrasos &&
      form.permitirRetrasos
        ? form.tipoDescuentoRetraso
        : 'NINGUNO',
    valorDescuentoRetraso:
      permiteRetrasos &&
      form.permitirRetrasos &&
      form.tipoDescuentoRetraso !==
        'NINGUNO'
        ? form.valorDescuentoRetraso
        : undefined,
    exigirContenidoEditor:
      usaEditor
        ? form.exigirContenidoEditor
        : false,
    exigirArchivo:
      usaArchivos
        ? form.exigirArchivo
        : false,
    maximoArchivos:
      usaArchivos
        ? form.maximoArchivos
        : 0,
    tamanioMaximoArchivoMb:
      usaArchivos
        ? form.tamanioMaximoArchivoMb
        : 30,
    extensionesPermitidas:
      usaArchivos
        ? form.extensionesPermitidas
        : [],
    permitirEditarEntrega:
      permiteEditarEntrega
        ? form.permitirEditarEntrega
        : false,
    publicar,
    usarRubrica: form.usarRubrica,
    archivosConsigna: form.archivosConsigna,
    archivosConsignaEliminar: form.archivosEliminados,
    archivoRubrica: form.usarRubrica
      ? form.archivoRubrica
      : null,
    modoRubrica: form.usarRubrica
      ? form.modoRubrica
      : undefined,
    rubricaDatos:
      form.usarRubrica &&
      form.modoRubrica === 'PREDETERMINADA'
        ? form.rubricaIusAcademy
        : undefined,
  });

  const guardar =
    async (
      publicar:
        boolean,
    ) => {
      if (
        edicionRestringida
      ) {
        const error =
          validarPaso(
            3,
          );

        if (
          error
        ) {
          setPaso(
            3,
          );

          setErrorLocal(
            error,
          );

          return;
        }
      } else {
        for (
          let numero = 1;
          numero <= 4;
          numero += 1
        ) {
          const error =
            validarPaso(
              numero as Paso,
            );

          if (
            error
          ) {
            setPaso(
              numero as Paso,
            );

            setErrorLocal(
              error,
            );

            return;
          }
        }
      }

      setErrorLocal(
        null,
      );

      await onGuardar(
        prepararDatos(
          publicar,
        ),
        publicar,
      );
    };

  const cambiarTipoTarea =
    (
      tipo:
        TipoTarea,
    ) => {
      setForm(
        (
          actual,
        ) => ({
          ...actual,
          tipo,

          modalidad:
            tipo ===
              'DOCUMENTO_COLABORATIVO'
              ? 'GRUPAL'
              : actual.modalidad,

          origenGrupo:
            tipo ===
                'DOCUMENTO_COLABORATIVO' &&
            actual.origenGrupo ===
                'NINGUNO'
              ? 'PLATAFORMA'
              : actual.origenGrupo,

          capacidades:
            [],

          componentes:
            tipo ===
              'MIXTA'
              ? actual.componentes.length >=
                  2
                ? actual.componentes
                : [
                    {
                      tipo:
                        'ARCHIVOS',
                      titulo:
                        'Evidencia documental',
                      obligatorio:
                        true,
                    },
                    {
                      tipo:
                        'TEXTO',
                      titulo:
                        'Desarrollo escrito',
                      obligatorio:
                        true,
                    },
                  ]
              : [],

          configRespuesta:
            tipo ===
              'RESPUESTA_ESCRITA'
              ? actual.configRespuesta ??
                {
                  areaDerecho:
                    'OBLIGACIONES',
                  minPalabras:
                    200,
                  maxPalabras:
                    1200,
                  estructuraGuiada:
                    true,
                  exigirCitas:
                    true,
                  minCitas:
                    2,
                  bancoNormativo:
                    [],
                }
              : actual.configRespuesta,

          configCaso:
            tipo ===
              'CASO_PRACTICO'
              ? actual.configCaso ??
                configCasoInicial()
              : actual.configCaso,

          configRedaccion:
            tipo ===
              'REDACCION_JURIDICA'
              ? actual.configRedaccion ??
                configRedaccionInicial()
              : actual.configRedaccion,

          configExposicion:
            tipo ===
              'EXPOSICION'
              ? actual.configExposicion ??
                configExposicionInicial()
              : actual.configExposicion,

          rubricaIusAcademy:
            rubricaIusAcademyPorTipo(tipo),
        }),
      );

      setSeleccionandoTipo(
        false,
      );
    };

  const pasos =
    edicionRestringida ? (
      <div className="tarea-pasos tarea-pasos--restringida">
        <div className="tarea-pasos__unico">
          <span>
            <CalendarDays
              size={14}
            />
          </span>

          <div>
            <strong>
              Fechas y retrasos
            </strong>

            <small>
              La tarea ya tiene trabajo registrado; solo están disponibles los ajustes operativos.
            </small>
          </div>
        </div>
      </div>
    ) : (
      <div className="tarea-pasos">
        {[1, 2, 3, 4, 5].map(
          (
            numero,
          ) => (
            <button
              key={numero}
              type="button"
              className={
                paso ===
                numero
                  ? 'activo'
                  : paso >
                      numero
                    ? 'completo'
                    : ''
              }
              onClick={() => {
                if (
                  numero <=
                  paso
                ) {
                  setPaso(
                    numero as Paso,
                  );
                }
              }}
            >
              <span>
                {paso >
                numero ? (
                  <Check
                    size={13}
                  />
                ) : (
                  numero
                )}
              </span>

              {[
                'Información',
                'Participación',
                'Fechas',
                'Evaluación',
                'Rúbrica',
              ][numero - 1]}
            </button>
          ),
        )}
      </div>
    );

  return (
    <>
      <AulaModal
      abierto={abierto}
      titulo={
        seleccionandoTipo
          ? 'Selecciona el tipo de actividad'
          : tareaEditar
            ? 'Editar tarea'
            : 'Crear tarea'
      }
      etiqueta={
        seleccionandoTipo
          ? 'Tareas'
          : `Tareas · ${hitoCodigo}`
      }
      descripcion={
        seleccionandoTipo
          ? 'Cada tipo habilita una experiencia distinta para desarrollar y entregar el trabajo.'
          : edicionRestringida
            ? 'Esta tarea ya tiene entregas. Puedes ampliar fechas, gestionar retrasos y definir si la entrega puede editarse.'
            : 'Configura una actividad adaptada a la experiencia académica que quieres desarrollar.'
      }
      icono={
        seleccionandoTipo
          ? Sparkles
          : ClipboardList
      }
      ancho="amplio"
      pasos={
        seleccionandoTipo
          ? undefined
          : pasos
      }
      bloqueado={guardando}
      onCerrar={() => {
        if (
          seleccionandoTipo
        ) {
          setSeleccionandoTipo(
            false,
          );

          return;
        }

        onCerrar();
      }}
      footer={
        seleccionandoTipo
          ? undefined
          : edicionRestringida
            ? (
              <div className="tarea-footer">
                <button
                  type="button"
                  className="secundario"
                  disabled={
                    guardando
                  }
                  onClick={
                    onCerrar
                  }
                >
                  Cancelar
                </button>

                <div className="tarea-footer__derecha">
                  <button
                    type="button"
                    className="primario"
                    disabled={
                      guardando
                    }
                    onClick={() =>
                      void guardar(
                        true,
                      )
                    }
                  >
                    <Save
                      size={15}
                    />
                    Guardar cambios
                  </button>
                </div>
              </div>
            )
            : (
              <div className="tarea-footer">
                <button
                  type="button"
                  className="secundario"
                  disabled={
                    guardando ||
                    paso ===
                      1
                  }
                  onClick={() =>
                    setPaso(
                      (
                        paso -
                        1
                      ) as Paso,
                    )
                  }
                >
                  <ArrowLeft
                    size={15}
                  />
                  Anterior
                </button>

                <div className="tarea-footer__derecha">
                  {paso <
                  5 ? (
                    <button
                      type="button"
                      className="primario"
                      disabled={guardando}
                      onClick={avanzar}
                    >
                      Continuar
                      <ArrowRight
                        size={15}
                      />
                    </button>
                  ) : (
                    <>
                      {!tareaEditar && (
                        <button
                          type="button"
                          className="secundario"
                          disabled={guardando}
                          onClick={() =>
                            void guardar(
                              false,
                            )
                          }
                        >
                          <Save
                            size={15}
                          />
                          Guardar borrador
                        </button>
                      )}

                      <button
                        type="button"
                        className="primario"
                        disabled={guardando}
                        onClick={() =>
                          void guardar(
                            true,
                          )
                        }
                      >
                        <GraduationCap
                          size={15}
                        />
                        {tareaEditar
                          ? 'Guardar cambios'
                          : 'Publicar tarea'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
      }
    >
      <div className="tarea-form">
        {seleccionandoTipo ? (
          <SelectorTipoTarea
            modo="catalogo"
            valor={
              form.tipo
            }
            onCambiar={
              cambiarTipoTarea
            }
          />
        ) : (
          <>
        {paso ===
          1 && (
          <div className="tarea-form__seccion">
            <div className="tarea-form__titulo">
              <Settings2
                size={18}
              />
              <div>
                <strong>
                  ¿Qué actividad realizarán tus estudiantes?
                </strong>
                <small>
                  El tipo define la experiencia; después podrás complementar sus capacidades.
                </small>
              </div>
            </div>

            <SelectorTipoTarea
              modo="compacto"
              valor={
                form.tipo
              }
              onCambiar={
                cambiarTipoTarea
              }
              onAbrirCatalogo={() =>
                setSeleccionandoTipo(
                  true,
                )
              }
            />

            <div className="tarea-form__grid dos">
              <label>
                <span>Título *</span>
                <input
                  value={form.titulo}
                  maxLength={180}
                  placeholder="Ej. Redacción colaborativa de memorial"
                  onChange={(
                    evento,
                  ) =>
                    setForm(
                      (
                        actual,
                      ) => ({
                        ...actual,
                        titulo: evento.target.value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>Descripción</span>
                <input
                  value={form.descripcion}
                  maxLength={4000}
                  placeholder="Resumen breve de la actividad"
                  onChange={(
                    evento,
                  ) =>
                    setForm(
                      (
                        actual,
                      ) => ({
                        ...actual,
                        descripcion: evento.target.value,
                      }),
                    )
                  }
                />
              </label>
            </div>

            <label>
              <span>Instrucciones</span>
              <textarea
                value={form.instrucciones}
                maxLength={10000}
                rows={4}
                placeholder="Explica qué debe realizarse, criterios, formato y cualquier consideración importante."
                onChange={(
                  evento,
                ) =>
                  setForm(
                    (
                      actual,
                    ) => ({
                      ...actual,
                      instrucciones: evento.target.value,
                    }),
                  )
                }
              />
            </label>

            <div className="tarea-adjunto-config">
              <div>
                <strong>Material de la consigna</strong>
                <small>Adjunta PDFs, documentos o imágenes con instrucciones para tus estudiantes.</small>
              </div>

              <label className="tarea-adjunto-config__selector">
                <FileUp size={16} />
                <span>Agregar otro archivo</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp"
                  onChange={(evento) =>
                    setForm((actual) => {
                      const archivos = Array.from(evento.target.files ?? []);
                      const existentes = new Set(
                        actual.archivosConsigna.map(
                          (archivo) => `${archivo.name.toLowerCase()}-${archivo.size}`,
                        ),
                      );

                      return {
                        ...actual,
                        archivosConsigna: [
                          ...actual.archivosConsigna,
                          ...archivos.filter(
                            (archivo) =>
                              !existentes.has(`${archivo.name.toLowerCase()}-${archivo.size}`),
                          ),
                        ],
                      };
                    })
                  }
                />
              </label>

              {form.archivosConsigna.length > 0 && (
                <div className="tarea-adjunto-config__archivos">
                  {form.archivosConsigna.map((archivo, indice) => (
                    <div className="tarea-adjunto-config__archivo" key={`${archivo.name}-${archivo.size}-${indice}`}>
                      <FileUp size={16} />
                      <span>
                        <strong>{archivo.name}</strong>
                        <small>{archivo.name.split('.').pop()?.toUpperCase()} · {tamanioArchivo(archivo.size)}</small>
                      </span>
                      <button
                        type="button"
                        aria-label={`Eliminar ${archivo.name}`}
                        onClick={() =>
                          setForm((actual) => ({
                            ...actual,
                            archivosConsigna: actual.archivosConsigna.filter((_, i) => i !== indice),
                          }))
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {form.archivosExistentes.length > 0 && (
                <div className="tarea-adjunto-config__archivos">
                  {form.archivosExistentes.map((archivo) => (
                    <div className="tarea-adjunto-config__archivo tarea-adjunto-config__archivo--existente" key={archivo.id}>
                      <FileUp size={16} />
                      <span>
                        <strong>{archivo.nombreOriginal}</strong>
                        <small>{archivo.extension.toUpperCase()} · {tamanioArchivo(archivo.tamanioBytes)} · Guardado</small>
                      </span>
                      <button
                        type="button"
                        aria-label={`Eliminar ${archivo.nombreOriginal}`}
                        onClick={() =>
                          setForm((actual) => ({
                            ...actual,
                            archivosExistentes: actual.archivosExistentes.filter((item) => item.id !== archivo.id),
                            archivosEliminados: [...actual.archivosEliminados, archivo.id],
                          }))
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {form.tipo ===
              'MIXTA' && (
              <div className="tarea-componentes">
                <div className="tarea-componentes__encabezado">
                  <div>
                    <strong>Componentes de la actividad</strong>
                    <small>Una tarea mixta combina dos o más evidencias.</small>
                  </div>

                  <button
                    type="button"
                    onClick={agregarComponente}
                  >
                    <Plus
                      size={14}
                    />
                    Agregar
                  </button>
                </div>

                {form.componentes.map(
                  (
                    componente,
                    indice,
                  ) => (
                    <div
                      key={`${indice}-${componente.tipo}`}
                      className="tarea-componente"
                    >
                      <select
                        value={componente.tipo}
                        onChange={(
                          evento,
                        ) =>
                          setForm(
                            (
                              actual,
                            ) => ({
                              ...actual,
                              componentes: actual.componentes.map(
                                (
                                  item,
                                  i,
                                ) =>
                                  i ===
                                  indice
                                    ? {
                                        ...item,
                                        tipo: evento.target.value as TipoComponenteTarea,
                                      }
                                    : item,
                              ),
                            }),
                          )
                        }
                      >
                        {tiposComponente.map(
                          (
                            opcion,
                          ) => (
                            <option
                              key={opcion.valor}
                              value={opcion.valor}
                            >
                              {opcion.texto}
                            </option>
                          ),
                        )}
                      </select>

                      <input
                        value={componente.titulo}
                        maxLength={140}
                        placeholder="Nombre del componente"
                        onChange={(
                          evento,
                        ) =>
                          setForm(
                            (
                              actual,
                            ) => ({
                              ...actual,
                              componentes: actual.componentes.map(
                                (
                                  item,
                                  i,
                                ) =>
                                  i ===
                                  indice
                                    ? {
                                        ...item,
                                        titulo: evento.target.value,
                                      }
                                    : item,
                              ),
                            }),
                          )
                        }
                      />

                      <button
                        type="button"
                        className="icono-peligro"
                        disabled={
                          form.componentes.length <=
                          2
                        }
                        onClick={() =>
                          setForm(
                            (
                              actual,
                            ) => ({
                              ...actual,
                              componentes: actual.componentes.filter(
                                (
                                  _,
                                  i,
                                ) =>
                                  i !==
                                  indice,
                              ),
                            }),
                          )
                        }
                      >
                        <Trash2
                          size={15}
                        />
                      </button>

                      {tieneConfiguracionComponente(
                        componente.tipo,
                      ) && (
                        <div className="tarea-componente__config">
                          {componente.tipo ===
                            'TEXTO' && (
                            <ConfiguracionRespuestaEscritaDocente
                              valor={
                                (componente.configuracion?.['respuestaEscrita'] as ConfiguracionRespuestaEscrita) ??
                                null
                              }
                              onChange={(
                                nueva,
                              ) =>
                                setForm(
                                  (
                                    actual,
                                  ) => ({
                                    ...actual,
                                    componentes: actual.componentes.map(
                                      (
                                        item,
                                        i,
                                      ) =>
                                        i ===
                                        indice
                                          ? {
                                              ...item,
                                              configuracion: {
                                                ...item.configuracion,
                                                respuestaEscrita:
                                                  nueva,
                                              },
                                            }
                                          : item,
                                    ),
                                  }),
                                )
                              }
                            />
                          )}

                          {componente.tipo ===
                            'DOCUMENTO_COLABORATIVO' && (
                            <ConfiguracionDocumentoColaborativoDocente
                              valor={
                                (componente.configuracion?.['documentoColaborativo'] as ConfiguracionDocumentoColaborativo) ??
                                null
                              }
                              onChange={(
                                nueva,
                              ) =>
                                setForm(
                                  (
                                    actual,
                                  ) => ({
                                    ...actual,
                                    componentes: actual.componentes.map(
                                      (
                                        item,
                                        i,
                                      ) =>
                                        i ===
                                        indice
                                          ? {
                                              ...item,
                                              configuracion: {
                                                ...item.configuracion,
                                                documentoColaborativo:
                                                  nueva,
                                              },
                                            }
                                          : item,
                                    ),
                                  }),
                                )
                              }
                            />
                          )}

                          {componente.tipo ===
                            'CASO_PRACTICO' && (
                            <ConfiguracionCasoPracticoDocente
                              valor={
                                (componente.configuracion?.['casoPractico'] as ConfiguracionCasoPractico) ??
                                null
                              }
                              onChange={(
                                nueva,
                              ) =>
                                setForm(
                                  (
                                    actual,
                                  ) => ({
                                    ...actual,
                                    componentes: actual.componentes.map(
                                      (
                                        item,
                                        i,
                                      ) =>
                                        i ===
                                        indice
                                          ? {
                                              ...item,
                                              configuracion: {
                                                ...item.configuracion,
                                                casoPractico:
                                                  nueva,
                                              },
                                            }
                                          : item,
                                    ),
                                  }),
                                )
                              }
                            />
                          )}

                          {componente.tipo ===
                            'REDACCION_JURIDICA' && (
                            <ConfiguracionRedaccionJuridicaDocente
                              valor={
                                (componente.configuracion?.['redaccionJuridica'] as ConfiguracionRedaccionJuridica) ??
                                null
                              }
                              onChange={(
                                nueva,
                              ) =>
                                setForm(
                                  (
                                    actual,
                                  ) => ({
                                    ...actual,
                                    componentes: actual.componentes.map(
                                      (
                                        item,
                                        i,
                                      ) =>
                                        i ===
                                        indice
                                          ? {
                                              ...item,
                                              configuracion: {
                                                ...item.configuracion,
                                                redaccionJuridica:
                                                  nueva,
                                              },
                                            }
                                          : item,
                                    ),
                                  }),
                                )
                              }
                            />
                          )}

                          {componente.tipo ===
                            'EXPOSICION' && (
                            <ConfiguracionExposicionDocente
                              valor={
                                (componente.configuracion?.['exposicion'] as ConfiguracionExposicion) ??
                                null
                              }
                              onChange={(
                                nueva,
                              ) =>
                                setForm(
                                  (
                                    actual,
                                  ) => ({
                                    ...actual,
                                    componentes: actual.componentes.map(
                                      (
                                        item,
                                        i,
                                      ) =>
                                        i ===
                                        indice
                                          ? {
                                              ...item,
                                              configuracion: {
                                                ...item.configuracion,
                                                exposicion:
                                                  nueva,
                                              },
                                            }
                                          : item,
                                    ),
                                  }),
                                )
                              }
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        )}

        {paso ===
          2 && (
          <div className="tarea-form__seccion tarea-participacion">
            <div className="tarea-form__titulo">
              <UsersRound
                size={18}
              />

              <div>
                <strong>
                  Modalidad y participación
                </strong>

                <small>
                  Define si la entrega será individual o utilizará equipos del curso.
                </small>
              </div>
            </div>

            <div className="tarea-participacion__subtitulo">
              Elige cómo realizarán la tarea
            </div>

            <div className="tarea-modalidad-opciones">
              <button
                type="button"
                className={
                  form.modalidad ===
                  'INDIVIDUAL'
                    ? 'activo'
                    : ''
                }
                disabled={
                  form.tipo ===
                  'DOCUMENTO_COLABORATIVO'
                }
                onClick={() =>
                  setForm(
                    (
                      actual,
                    ) => ({
                      ...actual,
                      modalidad:
                        'INDIVIDUAL',
                      origenGrupo:
                        'NINGUNO',
                      conjuntoGrupoId:
                        null,
                      requiereRepresentante:
                        false,
                      modalidadNota:
                        'INDIVIDUAL',
                      porcentajeNotaGrupal:
                        100,
                      porcentajeNotaIndividual:
                        0,
                      capacidades:
                        actual.capacidades.filter(
                          (
                            capacidad,
                          ) =>
                            ![
                              'EDICION_COLABORATIVA',
                              'SEGUIMIENTO_AUTORIA',
                              'HISTORIAL_VERSIONES',
                            ].includes(
                              capacidad,
                            ),
                        ),
                    }),
                  )
                }
              >
                <span className="tarea-modalidad-opciones__icono">
                  <Users
                    size={18}
                  />
                </span>

                <span>
                  <strong>
                    Individual
                  </strong>

                  <small>
                    Cada estudiante realiza y entrega su propia actividad.
                  </small>
                </span>
              </button>

              <button
                type="button"
                className={
                  form.modalidad ===
                  'GRUPAL'
                    ? 'activo'
                    : ''
                }
                onClick={() =>
                  setForm(
                    (
                      actual,
                    ) => ({
                      ...actual,
                      modalidad:
                        'GRUPAL',
                      origenGrupo:
                        actual.origenGrupo ===
                          'AFINIDAD'
                          ? 'AFINIDAD'
                          : 'PLATAFORMA',
                      requiereRepresentante:
                        true,
                      modalidadNota:
                        actual.modalidadNota ===
                          'INDIVIDUAL'
                          ? 'GRUPAL'
                          : actual.modalidadNota,
                    }),
                  )
                }
              >
                <span className="tarea-modalidad-opciones__icono">
                  <UsersRound
                    size={18}
                  />
                </span>

                <span>
                  <strong>
                    Grupal
                  </strong>

                  <small>
                    Una sola entrega representa al equipo y queda asociada a sus integrantes.
                  </small>
                </span>
              </button>
            </div>

            {form.tipo ===
              'DOCUMENTO_COLABORATIVO' && (
              <div className="tarea-nota tarea-nota--informativa">
                <Info
                  size={17}
                />

                <span>
                  El documento colaborativo requiere modalidad grupal para registrar autoría e historial por integrante.
                </span>
              </div>
            )}

            {form.modalidad ===
              'GRUPAL' && (
              <div
                className={`tarea-grupos-config ${
                  afinidad
                    ? 'tarea-grupos-config--afinidad'
                    : ''
                }`}
              >
                <label>
                  <span>
                    Origen de los grupos
                  </span>

                  <select
                    value={
                      form.origenGrupo
                    }
                    onChange={(
                      evento,
                    ) => {
                      const origen =
                        evento.target.value as OrigenGrupoTarea;

                      setForm(
                        (
                          actual,
                        ) => ({
                          ...actual,
                          origenGrupo:
                            origen,
                          conjuntoGrupoId:
                            origen ===
                              'PLATAFORMA'
                              ? actual.conjuntoGrupoId
                              : null,
                          cantidadMinimaIntegrantes:
                            origen ===
                              'AFINIDAD'
                              ? Math.max(
                                  2,
                                  actual.cantidadMinimaIntegrantes,
                                )
                              : actual.cantidadMinimaIntegrantes,
                          cantidadMaximaIntegrantes:
                            origen ===
                              'AFINIDAD'
                              ? Math.min(
                                  Math.max(
                                    actual.cantidadMaximaIntegrantes,
                                    Math.max(
                                      2,
                                      actual.cantidadMinimaIntegrantes,
                                    ),
                                  ),
                                  Math.max(
                                    2,
                                    curso.estudiantesInscritos,
                                  ),
                                )
                              : actual.cantidadMaximaIntegrantes,
                          requiereRepresentante:
                            true,

                          responsableEntregaGrupo:
                            origen ===
                              'AFINIDAD'
                              ? 'SOLO_REPRESENTANTE'
                              : actual.responsableEntregaGrupo,
                        }),
                      );
                    }}
                  >
                    <option value="PLATAFORMA">
                      Grupos de plataforma
                    </option>

                    <option value="AFINIDAD">
                      Equipos de afinidad
                    </option>
                  </select>
                </label>

                {usaGruposPlataforma && (
                  <div className="tarea-grupos-plataforma">
                    <div className="tarea-grupos-plataforma__cabecera">
                      <div>
                        <strong>
                          Grupo que realizará la tarea
                        </strong>

                        <small>
                          Usa la misma organización académica aprobada en Foro.
                        </small>
                      </div>
                    </div>

                    <div
                      className="tarea-tipo-grupo"
                      role="group"
                      aria-label="Tipo de grupo"
                    >
                      {(
                        [
                          'CONTINUA',
                          'PROCESUAL',
                        ] as ComponenteEvaluacion[]
                      ).map(
                        (
                          tipo,
                        ) => (
                          <button
                            key={
                              tipo
                            }
                            type="button"
                            className={
                              tipoGrupoPlataforma ===
                              tipo
                                ? 'activo'
                                : ''
                            }
                            onClick={() => {
                              setTipoGrupoPlataforma(
                                tipo,
                              );

                              setForm(
                                (
                                  actual,
                                ) => ({
                                  ...actual,
                                  componente:
                                    tipo,
                                  conjuntoGrupoId:
                                    null,
                                }),
                              );
                            }}
                          >
                            {tipo ===
                            'CONTINUA'
                              ? 'Grupos del hito'
                              : 'Equipo procesual del semestre'}
                          </button>
                        ),
                      )}
                    </div>

                    {cargandoGrupos ? (
                      <div className="tarea-nota">
                        <Info
                          size={17}
                        />

                        Cargando grupos registrados…
                      </div>
                    ) : errorGrupos ? (
                      <div className="tarea-aviso">
                        <Info
                          size={17}
                        />

                        <span>
                          {errorGrupos}
                        </span>
                      </div>
                    ) : opcionesGrupo.length ===
                      0 ? (
                      <div className="tarea-aviso">
                        <Info
                          size={17}
                        />

                        <span>
                          <strong>
                            {tipoGrupoPlataforma ===
                            'CONTINUA'
                              ? 'No hay grupos disponibles para este hito.'
                              : 'No hay un equipo procesual disponible.'}
                          </strong>

                          <small>
                            {tipoGrupoPlataforma ===
                            'CONTINUA'
                              ? 'Primero registra los grupos de evaluación continua correspondientes al hito.'
                              : 'Primero registra el equipo procesual que se utilizará durante el semestre.'}
                          </small>
                        </span>
                      </div>
                    ) : opcionesGrupo.length >
                      1 ? (
                      <label className="tarea-selector-conjunto">
                        <span>
                          Selecciona el conjunto de grupos
                        </span>

                        <select
                          value={
                            form.conjuntoGrupoId ??
                            ''
                          }
                          onChange={(
                            evento,
                          ) =>
                            setForm(
                              (
                                actual,
                              ) => ({
                                ...actual,
                                conjuntoGrupoId:
                                  evento.target.value
                                    ? Number(
                                        evento.target.value,
                                      )
                                    : null,
                              }),
                            )
                          }
                        >
                          <option value="">
                            Seleccionar…
                          </option>

                          {opcionesGrupo.map(
                            (
                              conjunto,
                            ) => (
                              <option
                                key={
                                  conjunto.id
                                }
                                value={
                                  conjunto.id
                                }
                              >
                                {conjunto.nombre} · {conjunto.totalGrupos} equipos
                              </option>
                            ),
                          )}
                        </select>

                        <small>
                          La tarea utilizará exactamente este conjunto.
                        </small>
                      </label>
                    ) : (
                      <div className="tarea-grupo-confirmado">
                        <Check
                          size={18}
                        />

                        <div>
                          <strong>
                            {opcionesGrupo[0].nombre}
                          </strong>

                          <small>
                            {opcionesGrupo[0].alcance ===
                            'CURSO'
                              ? 'Todo el semestre'
                              : opcionesGrupo[0].hito?.nombre ??
                                hitoCodigo}
                            {' · '}
                            {opcionesGrupo[0].totalGrupos} equipos
                            {' · '}
                            {opcionesGrupo[0].totalIntegrantes} estudiantes
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {afinidad && (
                  <div className="tarea-afinidad">
                    <div className="tarea-afinidad__cabecera">
                      <span className="tarea-afinidad__icono">
                        <UsersRound
                          size={19}
                        />
                      </span>

                      <div>
                        <strong>
                          Equipos por afinidad
                        </strong>

                        <small>
                          Los estudiantes conformarán su equipo para esta tarea antes de realizar la primera entrega.
                        </small>
                      </div>
                    </div>

                    <div className="tarea-afinidad__metricas">
                      <div className="tarea-total-alumnos">
                        <span>
                          Total alumnos
                        </span>

                        <div>
                          <UsersRound
                            size={20}
                          />

                          <strong>
                            {
                              curso.estudiantesInscritos
                            }
                          </strong>
                        </div>

                        <small>
                          Estudiantes inscritos en el curso
                        </small>
                      </div>

                      <ContadorNumero
                        etiqueta="Mínimo de integrantes"
                        minimo={2}
                        maximo={
                          Math.max(
                            2,
                            curso.estudiantesInscritos,
                          )
                        }
                        valor={
                          form.cantidadMinimaIntegrantes
                        }
                        onChange={(
                          valor,
                        ) =>
                          setForm(
                            (
                              actual,
                            ) => ({
                              ...actual,
                              cantidadMinimaIntegrantes:
                                valor,
                              cantidadMaximaIntegrantes:
                                Math.max(
                                  valor,
                                  actual.cantidadMaximaIntegrantes,
                                ),
                            }),
                          )
                        }
                      />

                      <ContadorNumero
                        etiqueta="Máximo de integrantes"
                        minimo={
                          Math.max(
                            2,
                            form.cantidadMinimaIntegrantes,
                          )
                        }
                        maximo={
                          Math.max(
                            2,
                            curso.estudiantesInscritos,
                          )
                        }
                        valor={
                          form.cantidadMaximaIntegrantes
                        }
                        onChange={(
                          valor,
                        ) =>
                          setForm(
                            (
                              actual,
                            ) => ({
                              ...actual,
                              cantidadMaximaIntegrantes:
                                valor,
                            }),
                          )
                        }
                      />
                    </div>

                    <div className="tarea-afinidad__reglas">
                      <div>
                        <Check
                          size={16}
                        />

                        <span>
                          <strong>
                            Representante obligatorio
                          </strong>

                          <small>
                            El creador del equipo será el representante inicial y realizará la entrega oficial.
                          </small>
                        </span>
                      </div>

                      <div>
                        <Check
                          size={16}
                        />

                        <span>
                          <strong>
                            Registro directo
                          </strong>

                          <small>
                            La conformación no requerirá aprobación adicional del docente.
                          </small>
                        </span>
                      </div>

                      <div>
                        <Check
                          size={16}
                        />

                        <span>
                          <strong>
                            Composición protegida
                          </strong>

                          <small>
                            Al existir una entrega, la composición utilizada quedará preservada para la evidencia y la nota.
                          </small>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {usaGruposPlataforma &&
                  form.tipo !==
                    'DOCUMENTO_COLABORATIVO' && (
                  <div className="tarea-responsable-entrega">
                    <div className="tarea-responsable-entrega__texto">
                      <strong>
                        ¿Quién puede realizar la entrega?
                      </strong>

                      <small>
                        La tarea mantiene una sola entrega oficial por grupo.
                      </small>
                    </div>

                    <select
                      value={
                        form.responsableEntregaGrupo
                      }
                      onChange={(
                        evento,
                      ) =>
                        setForm(
                          (
                            actual,
                          ) => ({
                            ...actual,

                            responsableEntregaGrupo:
                              evento.target.value as ResponsableEntregaGrupo,
                          }),
                        )
                      }
                    >
                      <option value="SOLO_REPRESENTANTE">
                        Solo el representante
                      </option>

                      <option value="CUALQUIER_INTEGRANTE">
                        Cualquier integrante
                      </option>
                    </select>
                  </div>
                )}

                <div className="tarea-regla-representante">
                  <Check
                    size={18}
                  />

                  <span>
                    {form.tipo ===
                    'DOCUMENTO_COLABORATIVO' ? (
                      <>
                        <strong>
                          Participación colaborativa de todo el grupo
                        </strong>

                        <small>
                          Todos los integrantes del grupo redactan juntos el documento.
                          El reporte resaltará el aporte de cada estudiante.
                        </small>
                      </>
                    ) : (
                      <>
                        <strong>
                          {afinidad
                            ? 'Entrega oficial por el representante'
                            : form.responsableEntregaGrupo ===
                                'SOLO_REPRESENTANTE'
                              ? 'Entrega oficial por el representante'
                              : 'Entrega oficial por cualquier integrante'}
                        </strong>

                        <small>
                          {afinidad
                            ? 'El creador del equipo será el representante inicial y realizará la única entrega oficial del equipo.'
                            : form.responsableEntregaGrupo ===
                                'SOLO_REPRESENTANTE'
                              ? 'Solo el representante podrá crear o reemplazar la entrega oficial del equipo.'
                              : 'Cualquier integrante podrá crear o reemplazar la única entrega oficial mientras la tarea permita cambios.'}
                        </small>
                      </>
                    )}
                  </span>
                </div>
              </div>
            )}

            {capacidadesOpcionales(
              form.tipo,
              form.modalidad,
            ).length >
              0 && (
              <div className="tarea-capacidades tarea-capacidades--foro">
                <div>
                  <strong>
                    Capacidades adicionales
                  </strong>

                  <small>
                    Activa herramientas complementarias según la experiencia elegida.
                  </small>
                </div>

                <div className="tarea-capacidades__grid">
                  {capacidadesOpcionales(
                    form.tipo,
                    form.modalidad,
                  ).map(
                    (
                      capacidad,
                    ) => (
                      <label
                        key={
                          capacidad
                        }
                        className="tarea-capacidad-opcion"
                      >
                        <input
                          type="checkbox"
                          checked={
                            form.capacidades.includes(
                              capacidad,
                            )
                          }
                          onChange={(
                            evento,
                          ) =>
                            setForm(
                              (
                                actual,
                              ) => ({
                                ...actual,
                                capacidades:
                                  evento.target.checked
                                    ? Array.from(
                                        new Set(
                                          [
                                            ...actual.capacidades,
                                            capacidad,
                                          ],
                                        ),
                                      )
                                    : actual.capacidades.filter(
                                        (
                                          item,
                                        ) =>
                                          item !==
                                          capacidad,
                                      ),
                              }),
                            )
                          }
                        />

                        <span className="tarea-capacidad-opcion__check">
                          {form.capacidades.includes(
                            capacidad,
                          ) && (
                            <Check
                              size={14}
                            />
                          )}
                        </span>

                        <span>
                          {capacidad
                            .toLowerCase()
                            .replaceAll(
                              '_',
                              ' ',
                            )}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {paso ===
          3 && (
          <div className="tarea-form__seccion tarea-fechas">
            {edicionRestringida && (
              <div className="tarea-edicion-restringida">
                <Info
                  size={18}
                />

                <div>
                  <strong>
                    Edición limitada por entregas existentes
                  </strong>

                  <p>
                    Ya existe trabajo de estudiantes. Para proteger esas entregas, no puedes cambiar la actividad, los grupos, la evaluación, el puntaje ni los requisitos. Solo puedes ampliar las fechas, gestionar retrasos y permitir o impedir la edición de la entrega.
                  </p>
                </div>
              </div>
            )}

            <div className="tarea-form__titulo">
              <CalendarDays
                size={18}
              />

              <div>
                <strong>
                  Fechas y retrasos
                </strong>

                <small>
                  Define cuándo inicia la actividad, cuál es su fecha límite y si existe tolerancia.
                </small>
              </div>
            </div>

            <div className="tarea-fechas__grid">
              <label className="tarea-fecha-card">
                <span className="tarea-fecha-card__titulo">
                  Apertura de la tarea
                </span>

                <input
                  type="datetime-local"
                  disabled={
                    edicionRestringida
                  }
                  min={
                    !tareaEditar ||
                    (
                      tareaEditar &&
                      new Date(
                        tareaEditar.fechaApertura,
                      ) >
                        new Date()
                    )
                      ? ahoraLocal()
                      : undefined
                  }
                  value={
                    form.fechaApertura
                  }
                  onChange={(
                    evento,
                  ) =>
                    setForm(
                      (
                        actual,
                      ) => ({
                        ...actual,
                        fechaApertura:
                          evento.target.value,
                      }),
                    )
                  }
                />

                <small>
                  Desde este momento el estudiante podrá realizar la actividad.
                </small>
              </label>

              <label className="tarea-fecha-card">
                <span className="tarea-fecha-card__titulo">
                  Fecha límite
                </span>

                <input
                  type="datetime-local"
                  min={
                    edicionRestringida &&
                    tareaEditar
                      ? aInputFecha(
                          tareaEditar.fechaLimite,
                        )
                      : maxFechaInput(
                          form.fechaApertura,
                          ahoraLocal(),
                        ) ||
                        undefined
                  }
                  value={
                    form.fechaLimite
                  }
                  onChange={(
                    evento,
                  ) => {
                    const nuevaFecha =
                      evento.target.value;

                    setForm(
                      (
                        actual,
                      ) => ({
                        ...actual,
                        fechaLimite:
                          nuevaFecha,
                        fechaCierre:
                          actual.permitirRetrasos &&
                          permiteRetrasos
                            ? actual.fechaCierre
                            : nuevaFecha,
                        fechaMaximaRetraso:
                          actual.permitirRetrasos &&
                          permiteRetrasos
                            ? actual.fechaMaximaRetraso
                            : '',
                      }),
                    );
                  }}
                />

                <small>
                  Hasta aquí la entrega se considera dentro del plazo normal.
                </small>
              </label>
            </div>

            {permiteRetrasos ? (
              <>
                <div className="tarea-retraso-card">
                  <label className="tarea-switch">
                    <span>
                      <strong>
                        Aceptar entregas con retraso
                      </strong>

                      <small>
                        Añade un segundo cierre para aceptar entregas tardías después de la fecha límite.
                      </small>
                    </span>

                    <input
                      type="checkbox"
                      disabled={
                        edicionRestringida &&
                        Boolean(
                          tareaEditar?.permitirRetrasos,
                        )
                      }
                      checked={
                        form.permitirRetrasos
                      }
                      onChange={(
                        evento,
                      ) => {
                        const activo =
                          evento.target.checked;

                        setForm(
                          (
                            actual,
                          ) => ({
                            ...actual,
                            permitirRetrasos:
                              activo,
                            fechaMaximaRetraso:
                              activo
                                ? actual.fechaMaximaRetraso ||
                                  actual.fechaCierre ||
                                  actual.fechaLimite
                                : '',
                            fechaCierre:
                              activo
                                ? actual.fechaMaximaRetraso ||
                                  actual.fechaCierre ||
                                  actual.fechaLimite
                                : actual.fechaLimite,
                            tipoDescuentoRetraso:
                              activo
                                ? actual.tipoDescuentoRetraso
                                : 'NINGUNO',
                            valorDescuentoRetraso:
                              activo
                                ? actual.valorDescuentoRetraso
                                : 0,
                          }),
                        );
                      }}
                    />

                    <i>
                      <b />
                    </i>
                  </label>
                </div>

                {form.permitirRetrasos && (
                  <div className="tarea-retraso-panel">
                    <div className="tarea-retraso-panel__titulo">
                      <span>
                        Configuración del retraso
                      </span>

                      <small>
                        Define hasta cuándo se aceptará y si tendrá penalización.
                      </small>
                    </div>

                    <div className="tarea-retraso-panel__grid">
                      <label className="tarea-fecha-card tarea-fecha-card--compacta">
                        <span className="tarea-fecha-card__titulo">
                          Cierre con retraso
                        </span>

                        <input
                          type="datetime-local"
                          min={
                            edicionRestringida
                              ? undefined
                              : maxFechaInput(
                                  form.fechaLimite,
                                  ahoraLocal(),
                                ) ||
                                undefined
                          }
                          value={
                            form.fechaMaximaRetraso
                          }
                          onChange={(
                            evento,
                          ) => {
                            const nuevaFecha =
                              evento.target.value;

                            setForm(
                              (
                                actual,
                              ) => {
                                const cierreActual =
                                  actual.fechaCierre;

                                const nuevoCierre =
                                  !cierreActual ||
                                  new Date(
                                    nuevaFecha,
                                  ) >
                                    new Date(
                                      cierreActual,
                                    )
                                    ? nuevaFecha
                                    : cierreActual;

                                return {
                                  ...actual,
                                  fechaMaximaRetraso:
                                    nuevaFecha,
                                  fechaCierre:
                                    nuevoCierre,
                                };
                              },
                            );

                            setErrorLocal(
                              null,
                            );
                          }}
                        />

                        <small>
                          Último momento permitido para una entrega tardía.
                        </small>
                      </label>

                      <label className="tarea-retraso-panel__campo">
                        <span>
                          Tipo de descuento
                        </span>

                        <select
                          value={
                            form.tipoDescuentoRetraso
                          }
                          onChange={(
                            evento,
                          ) =>
                            setForm(
                              (
                                actual,
                              ) => ({
                                ...actual,
                                tipoDescuentoRetraso:
                                  evento.target.value as TipoDescuentoRetraso,
                                valorDescuentoRetraso:
                                  0,
                              }),
                            )
                          }
                        >
                          <option value="NINGUNO">
                            Sin descuento
                          </option>

                          <option value="PUNTOS_FIJOS">
                            Puntos fijos
                          </option>

                          <option value="PORCENTAJE">
                            Porcentaje
                          </option>

                          <option value="POR_HORA">
                            Por hora
                          </option>

                          <option value="POR_DIA">
                            Por día
                          </option>

                          <option value="NOTA_MAXIMA">
                            Nota máxima
                          </option>
                        </select>

                        <small>
                          Elige cómo afectará el retraso a la nota final.
                        </small>
                      </label>

                      {form.tipoDescuentoRetraso !==
                        'NINGUNO' && (
                        <label className="tarea-retraso-panel__campo tarea-retraso-panel__valor">
                          <span>
                            {form.tipoDescuentoRetraso ===
                            'PORCENTAJE'
                              ? 'Porcentaje'
                              : form.tipoDescuentoRetraso ===
                                  'POR_HORA'
                                ? 'Puntos por hora'
                                : form.tipoDescuentoRetraso ===
                                    'POR_DIA'
                                  ? 'Puntos por día'
                                  : form.tipoDescuentoRetraso ===
                                      'NOTA_MAXIMA'
                                    ? 'Nota máxima'
                                    : 'Puntos a descontar'}
                          </span>

                          <div className="tarea-valor-compacto">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={
                                form.tipoDescuentoRetraso ===
                                  'POR_HORA' ||
                                form.tipoDescuentoRetraso ===
                                  'POR_DIA'
                                  ? 0.5
                                  : 1
                              }
                              value={
                                mostrarNumeroEditable(
                                  form.valorDescuentoRetraso,
                                )
                              }
                              onChange={(
                                evento,
                              ) =>
                                setForm(
                                  (
                                    actual,
                                  ) => ({
                                    ...actual,
                                    valorDescuentoRetraso:
                                      leerNumeroEditable(
                                        evento.target.value,
                                      ),
                                  }),
                                )
                              }
                            onBlur={() =>
                                setForm(
                                  (
                                    actual,
                                  ) => ({
                                    ...actual,

                                    valorDescuentoRetraso:
                                      normalizarNumeroEditable(
                                        actual.valorDescuentoRetraso,
                                        0,
                                        100,
                                        0,
                                      ),
                                  }),
                                )
                              }
                            />

                            <span>
                              {form.tipoDescuentoRetraso ===
                              'PORCENTAJE'
                                ? '%'
                                : form.tipoDescuentoRetraso ===
                                    'POR_HORA'
                                  ? 'pts/h'
                                  : form.tipoDescuentoRetraso ===
                                      'POR_DIA'
                                    ? 'pts/día'
                                    : form.tipoDescuentoRetraso ===
                                        'NOTA_MAXIMA'
                                      ? '/100'
                                      : 'pts'}
                            </span>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="tarea-nota tarea-nota--informativa">
                <Info
                  size={17}
                />

                <span>
                  Esta actividad se registra principalmente por el docente, por lo que no necesita reglas de entrega tardía.
                </span>
              </div>
            )}

            <div className="tarea-fechas__preferencias">
              <div className="tarea-visibilidad-compacta">
                <div>
                  <strong>
                    Visibilidad antes de la apertura
                  </strong>

                  <small>
                    Decide si los estudiantes podrán conocer la actividad antes de que comience.
                  </small>
                </div>

                <select
                  disabled={
                    edicionRestringida
                  }
                  value={
                    form.visibleAntesDeApertura
                      ? 'PUBLICACION'
                      : 'APERTURA'
                  }
                  onChange={(
                    evento,
                  ) =>
                    setForm(
                      (
                        actual,
                      ) => ({
                        ...actual,
                        visibleAntesDeApertura:
                          evento.target.value ===
                          'PUBLICACION',
                      }),
                    )
                  }
                >
                  <option value="PUBLICACION">
                    Mostrar desde la publicación
                  </option>

                  <option value="APERTURA">
                    Mostrar desde la apertura
                  </option>
                </select>
              </div>

              {permiteEditarEntrega && (
                <label className="tarea-switch">
                  <span>
                    <strong>
                      Permitir reemplazar o editar la entrega
                    </strong>

                    <small>
                      Solo estará disponible mientras la tarea permanezca abierta y dentro de las reglas configuradas.
                    </small>
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      form.permitirEditarEntrega
                    }
                    onChange={(
                      evento,
                    ) =>
                      setForm(
                        (
                          actual,
                        ) => ({
                          ...actual,
                          permitirEditarEntrega:
                            evento.target.checked,
                        }),
                      )
                    }
                  />

                  <i>
                    <b />
                  </i>
                </label>
              )}
            </div>
          </div>
        )}

        {paso ===
          4 && (
          <div className="tarea-form__seccion tarea-evaluacion">
            <div className="tarea-form__titulo">
              <GraduationCap
                size={18}
              />

              <div>
                <strong>
                  Calificación y evidencias
                </strong>

                <small>
                  Configura únicamente la evaluación y las evidencias que realmente necesita este tipo de actividad.
                </small>
              </div>
            </div>

            <label className="tarea-switch tarea-switch--destacado">
              <span>
                <strong>
                  Actividad calificable
                </strong>

                <small>
                  Si está activa, la tarea se conectará con ActividadCalificable y el libro general de notas.
                </small>
              </span>

              <input
                type="checkbox"
                checked={
                  form.esCalificable
                }
                onChange={(
                  evento,
                ) =>
                  setForm(
                    (
                      actual,
                    ) => ({
                      ...actual,
                      esCalificable:
                        evento.target.checked,
                    }),
                  )
                }
              />

              <i>
                <b />
              </i>
            </label>

             {form.esCalificable && (
               <div className="tarea-evaluacion__panel">
                 <div className="tarea-evaluacion__grid">
                  <label>
                    <span>
                      Componente
                    </span>

                    <select
                      value={
                        form.modalidad ===
                            'GRUPAL' &&
                        form.origenGrupo ===
                            'PLATAFORMA'
                          ? tipoGrupoPlataforma
                          : form.componente
                      }
                      disabled={
                        form.modalidad ===
                          'GRUPAL' &&
                        form.origenGrupo ===
                          'PLATAFORMA'
                      }
                      onChange={(
                        evento,
                      ) =>
                        setForm(
                          (
                            actual,
                          ) => ({
                            ...actual,
                            componente:
                              evento.target.value as ComponenteEvaluacion,
                          }),
                        )
                      }
                    >
                      <option value="CONTINUA">
                        Evaluación continua
                      </option>

                      <option value="PROCESUAL">
                        Evaluación procesual
                      </option>
                    </select>

                    <small>
                      {form.modalidad ===
                        'GRUPAL' &&
                      form.origenGrupo ===
                        'PLATAFORMA'
                        ? 'Se sincroniza con el tipo de grupo elegido en Participación.'
                        : 'Indica en qué componente del hito participará la actividad.'}
                    </small>
                  </label>

                  <label>
                    <span>
                      Puntaje máximo
                    </span>

                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={
                                mostrarNumeroEditable(
                                  form.puntajeMaximo,
                                )
                              }
                      onChange={(
                        evento,
                      ) =>
                        setForm(
                          (
                            actual,
                          ) => ({
                            ...actual,
                            puntajeMaximo:
                              leerNumeroEditable(
                                evento.target.value,
                              ),
                          }),
                        )
                      }
                    onBlur={() =>
                                setForm(
                                  (
                                    actual,
                                  ) => ({
                                    ...actual,

                                    puntajeMaximo:
                                      normalizarNumeroEditable(
                                        actual.puntajeMaximo,
                                        1,
                                        100,
                                        100,
                                      ),
                                  }),
                                )
                              }
                            />

                    <small>
                      La calificación final se almacenará sobre este puntaje.
                    </small>
                  </label>

                  {form.modalidad ===
                    'GRUPAL' && (
                    <label>
                      <span>
                        Modalidad de nota
                      </span>

                      <select
                        value={
                          form.modalidadNota
                        }
                        onChange={(
                          evento,
                        ) =>
                          setForm(
                            (
                              actual,
                            ) => ({
                              ...actual,
                              modalidadNota:
                                evento.target.value as ModalidadNotaTarea,
                            }),
                          )
                        }
                      >
                        <option value="GRUPAL">
                          Misma nota grupal
                        </option>

                        <option value="GRUPAL_E_INDIVIDUAL">
                          Nota grupal + ajuste individual
                        </option>
                      </select>

                      <small>
                        Define si todos reciben la misma nota base o si luego se permitirá un ajuste individual.
                      </small>
                    </label>
                  )}
                </div>

                {form.modalidad ===
                  'GRUPAL' &&
                  form.modalidadNota ===
                    'GRUPAL_E_INDIVIDUAL' && (
                  <div className="tarea-pesos">
                    <div>
                      <strong>
                        Distribución de la nota
                      </strong>

                      <small>
                        Ambos porcentajes deben sumar 100 %.
                      </small>
                    </div>

                    <div className="tarea-pesos__grid">
                      <label>
                        <span>
                          Peso grupal
                        </span>

                        <div className="tarea-peso-campo">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              mostrarNumeroEditable(
                                form.porcentajeNotaGrupal,
                              )
                            }
                            onChange={(evento) => {
                              const valor =
                                leerNumeroEditable(
                                  evento.target.value,
                                );

                              setForm(
                                (
                                  actual,
                                ) => ({
                                  ...actual,
                                  porcentajeNotaGrupal:
                                    valor,
                                  porcentajeNotaIndividual:
                                    Number.isNaN(
                                      valor,
                                    )
                                      ? actual.porcentajeNotaIndividual
                                      : 100 - valor,
                                }),
                              );
                            }}
                            onBlur={() =>
                              setForm(
                                (
                                  actual,
                                ) => ({
                                  ...actual,
                                  porcentajeNotaGrupal:
                                    normalizarNumeroEditable(
                                      actual.porcentajeNotaGrupal,
                                      0,
                                      100,
                                      50,
                                    ),
                                }),
                              )
                            }
                          />

                          <span>
                            %
                          </span>
                        </div>
                      </label>

                      <label>
                        <span>
                          Peso individual
                        </span>

                        <div className="tarea-peso-campo">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              mostrarNumeroEditable(
                                form.porcentajeNotaIndividual,
                              )
                            }
                            onChange={(evento) => {
                              const valor =
                                leerNumeroEditable(
                                  evento.target.value,
                                );

                              setForm(
                                (
                                  actual,
                                ) => ({
                                  ...actual,
                                  porcentajeNotaIndividual:
                                    valor,
                                  porcentajeNotaGrupal:
                                    Number.isNaN(
                                      valor,
                                    )
                                      ? actual.porcentajeNotaGrupal
                                      : 100 - valor,
                                }),
                              );
                            }}
                            onBlur={() =>
                              setForm(
                                (
                                  actual,
                                ) => ({
                                  ...actual,
                                  porcentajeNotaIndividual:
                                    normalizarNumeroEditable(
                                      actual.porcentajeNotaIndividual,
                                      0,
                                      100,
                                      50,
                                    ),
                                }),
                              )
                            }
                          />

                          <span>
                            %
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {form.tipo === 'EXPOSICION' && (
              <div className="tarea-config-especifica tarea-config-especifica--exposicion">
                <div className="tarea-config-especifica__encabezado">
                  <span>
                    <strong>Exposición</strong>
                    <small>Configura la dinámica y, opcionalmente, el guion que preparará el estudiante.</small>
                  </span>
                </div>

                <ConfiguracionExposicionDocente
                  valor={form.configExposicion}
                  onChange={(
                    configuracion: ConfiguracionExposicion,
                  ) =>
                    setForm((actual) => ({
                      ...actual,
                      configExposicion: configuracion,
                    }))
                  }
                />
              </div>
            )}

            {(usaEditor ||
              usaArchivos ||
              form.tipo ===
                'PRESENCIAL') && (
              <div className="tarea-evidencias">
                <div className="tarea-evidencias__titulo">
                  <FileUp
                    size={17}
                  />

                  <div>
                    <strong>
                      Evidencias de la actividad
                    </strong>

                    <small>
                      Solo aparecen las opciones compatibles con el tipo seleccionado.
                    </small>
                  </div>
                </div>

                {form.tipo ===
                  'PRESENCIAL' ? (
                  <div className="tarea-nota tarea-nota--informativa">
                    <Info
                      size={17}
                    />

                    <span>
                      La evidencia principal será registrada directamente por el docente. No se solicitan archivos ni contenido de editor al estudiante.
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="tarea-evidencias__switches">
                      {usaEditor && (
                        <label className="tarea-switch">
                          <span>
                            <strong>
                              Exigir contenido del editor
                            </strong>

                            <small>
                              La entrega no podrá finalizarse sin el desarrollo solicitado dentro de IusAcademy.
                            </small>
                          </span>

                          <input
                            type="checkbox"
                            checked={
                              form.exigirContenidoEditor
                            }
                            onChange={(
                              evento,
                            ) =>
                              setForm(
                                (
                                  actual,
                                ) => ({
                                  ...actual,
                                  exigirContenidoEditor:
                                    evento.target.checked,
                                }),
                              )
                            }
                          />

                          <i>
                            <b />
                          </i>
                        </label>
                      )}

                      {usaArchivos && (
                        <label className="tarea-switch">
                          <span>
                            <strong>
                              Exigir al menos un archivo
                            </strong>

                            <small>
                              La entrega no podrá completarse sin una evidencia documental.
                            </small>
                          </span>

                          <input
                            type="checkbox"
                            checked={
                              form.exigirArchivo
                            }
                            onChange={(
                              evento,
                            ) =>
                              setForm(
                                (
                                  actual,
                                ) => ({
                                  ...actual,
                                  exigirArchivo:
                                    evento.target.checked,
                                }),
                              )
                            }
                          />

                          <i>
                            <b />
                          </i>
                        </label>
                      )}
                    </div>

                    {usaArchivos && (
                      <div className="tarea-archivos-config">
                        <div className="tarea-archivos-config__nota">
                          <Info
                            size={16}
                          />

                          <span>
                            Límites de los archivos que podrá entregar el estudiante.
                          </span>
                        </div>

                        <div className="tarea-archivos-config__grid">
                          <label>
                            <span>
                              Máximo de archivos
                            </span>

                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={
                                mostrarNumeroEditable(
                                  form.maximoArchivos,
                                )
                              }
                              onChange={(
                                evento,
                              ) =>
                                setForm(
                                  (
                                    actual,
                                  ) => ({
                                    ...actual,
                                    maximoArchivos:
                                      leerNumeroEditable(
                                        evento.target.value,
                                      ),
                                  }),
                                )
                              }
                            onBlur={() =>
                                setForm(
                                  (
                                    actual,
                                  ) => ({
                                    ...actual,

                                    maximoArchivos:
                                      normalizarNumeroEditable(
                                        actual.maximoArchivos,
                                        1,
                                        20,
                                        5,
                                      ),
                                  }),
                                )
                              }
                            />
                          </label>

                          <label>
                            <span>
                              Tamaño máximo
                            </span>

                            <div className="tarea-archivo-unidad">
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={
                                mostrarNumeroEditable(
                                  form.tamanioMaximoArchivoMb,
                                )
                              }
                                onChange={(
                                  evento,
                                ) =>
                                  setForm(
                                    (
                                      actual,
                                    ) => ({
                                      ...actual,
                                      tamanioMaximoArchivoMb:
                                        leerNumeroEditable(
                                          evento.target.value,
                                        ),
                                    }),
                                  )
                                }
                              onBlur={() =>
                                setForm(
                                  (
                                    actual,
                                  ) => ({
                                    ...actual,

                                    tamanioMaximoArchivoMb:
                                      normalizarNumeroEditable(
                                        actual.tamanioMaximoArchivoMb,
                                        1,
                                        50,
                                        30,
                                      ),
                                  }),
                                )
                              }
                            />

                              <span>
                                MB
                              </span>
                            </div>
                          </label>
                        </div>

                        <fieldset className="tarea-formatos">
                          <legend>
                            Formatos permitidos
                          </legend>

                          <div>
                            {[
                              'pdf',
                              'doc',
                              'docx',
                              'jpg',
                              'jpeg',
                              'png',
                              'ppt',
                              'pptx',
                            ].map(
                              (
                                extension,
                              ) => {
                                const seleccionado =
                                  form.extensionesPermitidas.includes(
                                    extension,
                                  );

                                return (
                                  <label
                                    key={
                                      extension
                                    }
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        seleccionado
                                      }
                                      onChange={(
                                        evento,
                                      ) =>
                                        setForm(
                                          (
                                            actual,
                                          ) => ({
                                            ...actual,
                                            extensionesPermitidas:
                                              evento.target.checked
                                                ? Array.from(
                                                    new Set(
                                                      [
                                                        ...actual.extensionesPermitidas,
                                                        extension,
                                                      ],
                                                    ),
                                                  )
                                                : actual.extensionesPermitidas.filter(
                                                    (
                                                      item,
                                                    ) =>
                                                      item !==
                                                      extension,
                                                  ),
                                          }),
                                        )
                                      }
                                    />

                                    <span className="tarea-formato-check">
                                      {seleccionado && (
                                        <Check
                                          size={14}
                                        />
                                      )}
                                    </span>

                                    <strong>
                                      {extension.toUpperCase()}
                                    </strong>
                                  </label>
                                );
                              },
                            )}
                          </div>
                        </fieldset>
                      </div>
                    )}

                    {(form.tipo ===
                      'DOCUMENTO_COLABORATIVO' ||
                      (
                        form.modalidad ===
                          'GRUPAL' &&
                        usaEditor
                      )) && (
                      <div className="tarea-colaboracion-avanzada">
                        <Check
                          size={17}
                        />

                        <span>
                          <strong>
                            Colaboración avanzada preparada
                          </strong>

                          <small>
                            Autoría por fragmentos, historial de versiones y exportación PDF limpia o con contribuciones resaltadas se habilitarán en la etapa de entrega colaborativa.
                          </small>
                        </span>
                      </div>
                    )}

                    {form.tipo ===
                      'RESPUESTA_ESCRITA' && (
                      <ConfiguracionRespuestaEscritaDocente
                        valor={
                          form.configRespuesta
                        }
                        onChange={(
                          configuracion:
                            ConfiguracionRespuestaEscrita,
                        ) =>
                          setForm(
                            (
                              actual,
                            ) => ({
                              ...actual,
                              configRespuesta:
                                configuracion,
                            }),
                          )
                        }
                      />
                    )}

                    {form.tipo ===
                      'CASO_PRACTICO' && (
                      <ConfiguracionCasoPracticoDocente
                        valor={
                          form.configCaso
                        }
                        onChange={(
                          configuracion:
                            ConfiguracionCasoPractico,
                        ) =>
                          setForm(
                            (
                              actual,
                            ) => ({
                              ...actual,
                              configCaso:
                                configuracion,
                            }),
                          )
                        }
                      />
                    )}

                    {form.tipo ===
                      'REDACCION_JURIDICA' && (
                      <ConfiguracionRedaccionJuridicaDocente
                        valor={
                          form.configRedaccion
                        }
                        onChange={(
                          configuracion:
                            ConfiguracionRedaccionJuridica,
                        ) =>
                          setForm(
                            (
                              actual,
                            ) => ({
                              ...actual,
                              configRedaccion:
                                configuracion,
                            }),
                          )
                        }
                      />
                    )}

                    {form.tipo ===
                      'DOCUMENTO_COLABORATIVO' && (
                      <ConfiguracionDocumentoColaborativoDocente
                        valor={
                          form.configDocumentoColaborativo
                        }
                        onChange={(
                          configuracion:
                            | ConfiguracionDocumentoColaborativo
                            | null,
                        ) =>
                          setForm(
                            (
                              actual,
                            ) => ({
                              ...actual,
                              configDocumentoColaborativo:
                                configuracion,
                            }),
                          )
                        }
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {paso === 5 && (
          <div className="tarea-form__seccion tarea-rubrica-paso">
            <div className="tarea-form__titulo">
              <GraduationCap size={18} />

              <div>
                <strong>Rúbrica de evaluación</strong>
                <small>
                  Define cómo se evaluará la actividad mediante criterios, ponderaciones y niveles de desempeño.
                </small>
              </div>
            </div>

            {!form.esCalificable ? (
              <div className="tarea-nota tarea-nota--informativa">
                <Info size={17} />
                <span>
                  Esta actividad no es calificable. Si deseas utilizar una rúbrica, vuelve a Evaluación y activa la calificación.
                </span>
              </div>
            ) : (
              <>
                <label className="tarea-switch tarea-switch--destacado">
                  <span>
                    <strong>Usar rúbrica</strong>
                    <small>
                      Actívala para evaluar la tarea por criterios. Si la desactivas, la nota se asignará directamente sobre {form.puntajeMaximo || 100} puntos.
                    </small>
                  </span>

                  <input
                    type="checkbox"
                    checked={form.usarRubrica}
                    onChange={(evento) =>
                      setForm((actual) => ({
                        ...actual,
                        usarRubrica: evento.target.checked,
                      }))
                    }
                  />

                  <i><b /></i>
                </label>

                {!form.usarRubrica ? (
                  <div className="tarea-rubrica-bloque__sin-rubrica">
                    La actividad se calificará sin rúbrica. Podrás asignar directamente una nota sobre {form.puntajeMaximo || 100} puntos.
                  </div>
                ) : (
                  <>
                    <div className="tarea-rubrica-selector">
                      <div className="tarea-rubrica-selector__titulo">
                        <strong>¿Cómo quieres crear la rúbrica?</strong>
                        <small>
                          Parte de una plantilla editable de IusAcademy o importa la rúbrica propia del docente desde Excel.
                        </small>
                      </div>

                      <div className="tarea-rubrica-selector__opciones">
                        <label className={form.modoRubrica === 'PREDETERMINADA' ? 'activa' : ''}>
                          <input
                            type="radio"
                            name="modo-rubrica"
                            checked={form.modoRubrica === 'PREDETERMINADA'}
                            onChange={() =>
                              setForm((actual) => ({
                                ...actual,
                                modoRubrica: 'PREDETERMINADA',
                                archivoRubrica: null,
                              }))
                            }
                          />

                          <span>
                            <b>Rúbrica IusAcademy</b>
                            <small>
                              Carga una plantilla sugerida según el tipo de tarea y personalízala antes de publicar.
                            </small>
                          </span>
                        </label>

                        <label className={form.modoRubrica === 'PERSONALIZADA' ? 'activa' : ''}>
                          <input
                            type="radio"
                            name="modo-rubrica"
                            checked={form.modoRubrica === 'PERSONALIZADA'}
                            onChange={() =>
                              setForm((actual) => ({
                                ...actual,
                                modoRubrica: 'PERSONALIZADA',
                              }))
                            }
                          />

                          <span>
                            <b>Rúbrica personalizada</b>
                            <small>
                              Importa criterios, niveles y ponderaciones desde un archivo Excel o PDF.
                            </small>
                          </span>
                        </label>
                      </div>
                    </div>

                    {form.modoRubrica === 'PREDETERMINADA' && (
                      <div className="tarea-rubrica-editor">
                        <div className="tarea-rubrica-editor__cabecera">
                          <div>
                            <strong>Plantilla sugerida para {etiquetaTipo(form.tipo)}</strong>
                            <small>
                              Puedes cambiar el nombre, la descripción, el porcentaje y los niveles de cada criterio.
                            </small>
                          </div>

                          <button
                            type="button"
                            className="tarea-rubrica-editor__restablecer"
                            onClick={restablecerRubricaIusAcademy}
                          >
                            Restablecer plantilla
                          </button>
                        </div>

                        <label className="tarea-rubrica-editor__nombre">
                          <span>Nombre de la rúbrica</span>
                          <input
                            value={form.rubricaIusAcademy.nombre}
                            maxLength={180}
                            onChange={(evento) =>
                              setForm((actual) => ({
                                ...actual,
                                rubricaIusAcademy: {
                                  ...actual.rubricaIusAcademy,
                                  nombre: evento.target.value,
                                },
                              }))
                            }
                          />
                        </label>

                        <div className="tarea-rubrica-editor__resumen">
                          <span>
                            <strong>{form.rubricaIusAcademy.criterios.length}</strong>
                            <small>criterios</small>
                          </span>

                          <span className={totalRubricaIusAcademy === 100 ? 'valida' : 'invalida'}>
                            <strong>{totalRubricaIusAcademy}%</strong>
                            <small>{totalRubricaIusAcademy === 100 ? 'ponderación válida' : 'debe sumar 100%'}</small>
                          </span>
                        </div>

                        <div className="tarea-rubrica-editor__criterios">
                          {form.rubricaIusAcademy.criterios.map((criterio, indiceCriterio) => (
                            <details
                              key={`${criterio.orden}-${indiceCriterio}`}
                              className="tarea-rubrica-editor__criterio"
                              open={indiceCriterio === 0}
                            >
                              <summary>
                                <span className="tarea-rubrica-editor__numero">{indiceCriterio + 1}</span>
                                <span>
                                  <strong>{criterio.nombre || 'Criterio sin nombre'}</strong>
                                  <small>{criterio.descripcion || 'Sin descripción'}</small>
                                </span>
                                <b>{criterio.peso}%</b>
                              </summary>

                              <div className="tarea-rubrica-editor__contenido">
                                <div className="tarea-rubrica-editor__grid">
                                  <label>
                                    <span>Nombre del criterio</span>
                                    <input
                                      value={criterio.nombre}
                                      maxLength={160}
                                      onChange={(evento) =>
                                        actualizarCriterioRubrica(indiceCriterio, {
                                          nombre: evento.target.value,
                                        })
                                      }
                                    />
                                  </label>

                                  <label>
                                    <span>Ponderación</span>
                                    <div className="tarea-peso-campo">
                                      <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={mostrarNumeroEditable(criterio.peso)}
                                        onChange={(evento) =>
                                          actualizarCriterioRubrica(indiceCriterio, {
                                            peso: leerNumeroEditable(evento.target.value),
                                          })
                                        }
                                        onBlur={() =>
                                          actualizarCriterioRubrica(indiceCriterio, {
                                            peso: normalizarNumeroEditable(criterio.peso, 0, 100, 0),
                                          })
                                        }
                                      />
                                      <span>%</span>
                                    </div>
                                  </label>
                                </div>

                                <label className="tarea-rubrica-editor__descripcion">
                                  <span>Descripción</span>
                                  <textarea
                                    rows={2}
                                    value={criterio.descripcion ?? ''}
                                    maxLength={600}
                                    onChange={(evento) =>
                                      actualizarCriterioRubrica(indiceCriterio, {
                                        descripcion: evento.target.value,
                                      })
                                    }
                                  />
                                </label>

                                <div className="tarea-rubrica-editor__niveles-titulo">
                                  <div>
                                    <strong>Niveles de desempeño</strong>
                                    <small>Edita la etiqueta, el puntaje máximo y la descripción de cada nivel.</small>
                                  </div>
                                </div>

                                <div className="tarea-rubrica-editor__niveles">
                                  {criterio.niveles.map((nivel, indiceNivel) => (
                                    <div
                                      key={`${indiceCriterio}-${nivel.orden}-${indiceNivel}`}
                                      className="tarea-rubrica-editor__nivel"
                                    >
                                      <div className="tarea-rubrica-editor__nivel-grid">
                                        <label>
                                          <span>Nivel</span>
                                          <input
                                            value={nivel.etiqueta}
                                            maxLength={80}
                                            onChange={(evento) =>
                                              actualizarNivelRubrica(indiceCriterio, indiceNivel, {
                                                etiqueta: evento.target.value,
                                              })
                                            }
                                          />
                                        </label>

                                        <label>
                                          <span>Puntaje hasta</span>
                                          <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={mostrarNumeroEditable(nivel.puntos)}
                                            onChange={(evento) =>
                                              actualizarNivelRubrica(indiceCriterio, indiceNivel, {
                                                puntos: leerNumeroEditable(evento.target.value),
                                              })
                                            }
                                            onBlur={() =>
                                              actualizarNivelRubrica(indiceCriterio, indiceNivel, {
                                                puntos: normalizarNumeroEditable(nivel.puntos, 0, 100, 100),
                                              })
                                            }
                                          />
                                        </label>
                                      </div>

                                      <label>
                                        <span>Descripción del nivel</span>
                                        <textarea
                                          rows={2}
                                          value={nivel.descripcion ?? ''}
                                          maxLength={600}
                                          onChange={(evento) =>
                                            actualizarNivelRubrica(indiceCriterio, indiceNivel, {
                                              descripcion: evento.target.value,
                                            })
                                          }
                                        />
                                      </label>
                                    </div>
                                  ))}
                                </div>

                                <div className="tarea-rubrica-editor__acciones-criterio">
                                  <button
                                    type="button"
                                    className="peligro"
                                    disabled={form.rubricaIusAcademy.criterios.length <= 1}
                                    onClick={() => eliminarCriterioRubrica(indiceCriterio)}
                                  >
                                    <Trash2 size={14} />
                                    Eliminar criterio
                                  </button>
                                </div>
                              </div>
                            </details>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="tarea-rubrica-editor__agregar"
                          onClick={agregarCriterioRubrica}
                        >
                          <Plus size={15} />
                          Agregar criterio
                        </button>

                        <div className={`tarea-rubrica-editor__total ${totalRubricaIusAcademy === 100 ? 'valida' : 'invalida'}`}>
                          <span>
                            <strong>Ponderación total</strong>
                            <small>
                              {totalRubricaIusAcademy === 100
                                ? 'La rúbrica está lista para utilizarse.'
                                : 'Ajusta los porcentajes hasta completar exactamente 100%.'}
                            </small>
                          </span>
                          <b>{totalRubricaIusAcademy}%</b>
                        </div>
                      </div>
                    )}

                    {form.modoRubrica === 'PERSONALIZADA' && (
                      <div className="tarea-adjunto-config tarea-adjunto-config--rubrica">
                        <div>
                          <strong>Importar rúbrica desde Excel o PDF</strong>
                          <small>
                            Selecciona un archivo .xlsx o .pdf. En PDF se admite texto seleccionable; los PDF escaneados requieren OCR.
                          </small>
                        </div>

                        <label className="tarea-adjunto-config__selector">
                          <FileUp size={16} />
                          <span>{form.archivoRubrica ? 'Reemplazar archivo' : 'Seleccionar archivo'}</span>
                          <input
                            type="file"
                            accept=".xlsx,.pdf"
                            onChange={(evento) =>
                              setForm((actual) => ({
                                ...actual,
                                archivoRubrica: evento.target.files?.[0] ?? null,
                              }))
                            }
                          />
                        </label>

                        {form.archivoRubrica && (
                          <div className="tarea-adjunto-config__archivo">
                            <FileUp size={16} />
                            <span>
                              <strong>{form.archivoRubrica.name}</strong>
                              <small>
                                {form.archivoRubrica.name.toLowerCase().endsWith('.pdf')
                                  ? 'PDF'
                                  : 'Excel'}{' · '}
                                {tamanioArchivo(form.archivoRubrica.size)}
                              </small>
                            </span>
                            <button
                              type="button"
                              aria-label="Eliminar archivo de rúbrica seleccionado"
                              onClick={() =>
                                setForm((actual) => ({ ...actual, archivoRubrica: null }))
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
          </>
        )}
      </div>

        <style>
          {styles}
        </style>
      </AulaModal>

      <Toast
        visible={Boolean(errorLocal)}
        tipo="advertencia"
        titulo="Revisa los datos"
        mensaje={errorLocal ?? ''}
        duracion={5000}
        onCerrar={() =>
          setErrorLocal(
            null,
          )
        }
      />
    </>
  );
}

const styles = `
  .tarea-form input[type='number'] {
    appearance: textfield;
    -moz-appearance: textfield;
  }

  .tarea-form input[type='number']::-webkit-inner-spin-button,
  .tarea-form input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }


  .tarea-pasos--restringida {
    display: block;
    padding: 8px 18px;
  }

  .tarea-pasos__unico {
    display: flex;
    align-items: center;
    gap: 10px;

    padding: 9px 11px;

    border: 1px solid var(--app-warning-border);
    border-radius: 12px;

    background: var(--app-warning-bg);
  }

  .tarea-pasos__unico > span {
    width: 30px;
    height: 30px;

    display: grid;
    place-items: center;

    flex: 0 0 30px;

    border-radius: 9px;

    color: var(--app-warning-strong);

    background: var(--app-surface);
  }

  .tarea-pasos__unico strong,
  .tarea-pasos__unico small {
    display: block;
  }

  .tarea-pasos__unico strong {
    color: var(--app-text);
    font-size: 10.5px;
  }

  .tarea-pasos__unico small {
    margin-top: 2px;

    color: var(--app-text-soft);

    font-size: 8.5px;
  }

  .tarea-edicion-restringida {
    display: flex;
    align-items: flex-start;
    gap: 9px;

    padding: 10px 11px;

    border: 1px solid var(--app-warning-border);
    border-radius: 12px;

    color: var(--app-warning-strong);

    background: var(--app-warning-bg);
  }

  .tarea-edicion-restringida > svg {
    flex: 0 0 auto;

    margin-top: 1px;
  }

  .tarea-edicion-restringida strong {
    display: block;

    color: var(--app-text);

    font-size: 10px;
  }

  .tarea-edicion-restringida p {
    margin: 3px 0 0;

    color: var(--app-text-soft);

    font-size: 8.5px;
    line-height: 1.45;
  }

  .tarea-form input:disabled,
  .tarea-form select:disabled,
  .tarea-form textarea:disabled {
    opacity: .68;

    cursor: not-allowed;

    background: var(--app-surface-disabled);
  }


  /* ============================================================
   * PASOS
   * Mantiene el mismo lenguaje visual del formulario de Foro.
   * ============================================================ */
  .tarea-pasos {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    padding: 8px 18px;
  }

  .tarea-pasos button {
    min-width: 0;
    min-height: 30px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    padding: 2px 0;
    border: 0;
    border-radius: 0;
    color: var(--app-text-muted);
    background: transparent;
    font: inherit;
    font-size: 10px;
    font-weight: 850;
    cursor: pointer;
    transition: color .18s ease;
  }

  .tarea-pasos button:hover {
    color: var(--app-accent-dark);
  }

  .tarea-pasos button span {
    width: 26px;
    height: 26px;
    flex: 0 0 26px;
    display: grid;
    place-items: center;
    border: 1px solid var(--app-border-strong);
    border-radius: 50%;
    color: inherit;
    background: var(--app-card, var(--app-surface));
    font-size: 10px;
    font-weight: 900;
    transition: all .18s ease;
  }

  .tarea-pasos button.activo,
  .tarea-pasos button.completo {
    color: var(--app-accent-dark);
  }

  .tarea-pasos button.activo span,
  .tarea-pasos button.completo span {
    border-color: var(--app-accent);
    color: #fff;
    background: var(--app-accent);
    box-shadow: 0 5px 12px color-mix(in srgb, var(--app-accent) 24%, transparent);
  }

  /* ============================================================
   * ÁREA DESPLAZABLE DEL FORMULARIO
   * AulaModal mantiene header/pasos/footer fijos. Solo este bloque
   * se desplaza, exactamente como en Foro.
   * ============================================================ */
  .tarea-form {
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 4px 4px 20px 0;
    color: var(--app-text);
    scrollbar-width: thin;
    scrollbar-color: var(--app-border-strong) transparent;
    scrollbar-gutter: stable;
    overscroll-behavior: contain;
    scroll-padding-top: 10px;
  }

  .tarea-form::-webkit-scrollbar {
    width: 8px;
  }

  .tarea-form::-webkit-scrollbar-track {
    background: transparent;
  }

  .tarea-form::-webkit-scrollbar-thumb {
    border: 2px solid transparent;
    border-radius: 999px;
    background: var(--app-border-strong);
    background-clip: padding-box;
  }

  .tarea-form__seccion {
    min-width: 0;
    display: grid;
    align-content: start;
    gap: 14px;
    padding: 2px 2px 6px;
  }

  .tarea-adjunto-config {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 13px 14px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .tarea-adjunto-config > div {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  .tarea-adjunto-config strong {
    color: var(--app-text);
    font-size: 13px;
  }

  .tarea-adjunto-config small {
    color: var(--app-text-muted);
    font-size: 11px;
    line-height: 1.4;
  }

  .tarea-adjunto-config__selector {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
    padding: 8px 11px;
    border: 1px solid var(--app-accent);
    border-radius: 9px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .tarea-adjunto-config__selector:hover {
    background: var(--app-accent-soft);
  }

  .tarea-adjunto-config__selector input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .tarea-adjunto-config__archivos {
    display: grid;
    gap: 6px;
    width: 100%;
  }

  .tarea-adjunto-config__archivo {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
    padding: 8px 10px;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    background: var(--app-surface);
  }

  .tarea-adjunto-config__archivo > svg {
    flex-shrink: 0;
    color: var(--app-accent-dark);
  }

  .tarea-adjunto-config__archivo > span {
    display: grid;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  .tarea-adjunto-config__archivo strong,
  .tarea-adjunto-config__archivo small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tarea-adjunto-config__archivo button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 7px;
    color: var(--app-danger);
    background: var(--app-danger-bg);
    cursor: pointer;
  }

  .tarea-adjunto-config__archivo button:hover {
    filter: brightness(.96);
  }

  .tarea-config-especifica {
    display: grid;
    gap: 10px;
    margin-top: 2px;
  }

  .tarea-config-especifica__encabezado {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .tarea-config-especifica__encabezado > span {
    display: grid;
    gap: 3px;
  }

  .tarea-config-especifica__encabezado strong {
    color: var(--app-text);
    font-size: 13px;
  }

  .tarea-config-especifica__encabezado small {
    color: var(--app-text-muted);
    font-size: 11px;
    line-height: 1.45;
  }

  .tarea-rubrica-bloque {
    display: grid;
    gap: 10px;
    padding-top: 4px;
    border-top: 1px solid var(--app-border);
  }

  .tarea-rubrica-bloque__cabecera {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .tarea-rubrica-bloque__cabecera > div {
    display: grid;
    gap: 3px;
  }

  .tarea-rubrica-bloque__cabecera strong {
    color: var(--app-text);
    font-size: 13px;
  }

  .tarea-rubrica-bloque__cabecera small {
    color: var(--app-text-muted);
    font-size: 11px;
    line-height: 1.45;
  }

  .tarea-rubrica-bloque__sin-rubrica {
    padding: 9px 11px;
    border: 1px solid var(--app-border);
    border-radius: 9px;
    color: var(--app-text-muted);
    background: var(--app-surface-alt);
    font-size: 11px;
    line-height: 1.45;
  }

  .tarea-rubrica-iusacademy {
    display: grid;
    gap: 12px;
    padding: 14px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface);
  }

  .tarea-rubrica-iusacademy__cabecera {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .tarea-rubrica-iusacademy__icono {
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    background: var(--app-accent-soft);
    color: var(--app-accent-dark);
  }

  .tarea-rubrica-iusacademy__cabecera > span:nth-child(2) {
    display: grid;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  .tarea-rubrica-iusacademy__cabecera strong {
    color: var(--app-text);
    font-size: 12px;
  }

  .tarea-rubrica-iusacademy__cabecera small {
    color: var(--app-text-muted);
    font-size: 10px;
    line-height: 1.4;
  }

  .tarea-rubrica-iusacademy__estado {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex: 0 0 auto;
    padding: 6px 8px;
    border-radius: 999px;
    background: rgba(34, 197, 94, .10);
    color: #15803d;
    font-size: 10px;
    font-weight: 700;
  }

  .tarea-rubrica-iusacademy__resumen {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--app-border);
  }

  .tarea-rubrica-iusacademy__resumen > div {
    display: grid;
    gap: 2px;
  }

  .tarea-rubrica-iusacademy__resumen strong {
    font-size: 12px;
  }

  .tarea-rubrica-iusacademy__resumen small {
    font-size: 10px;
  }

  .tarea-rubrica-iusacademy__resumen > span {
    flex: 0 0 auto;
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
  }

  .tarea-rubrica-iusacademy__resumen > span.valida {
    color: #15803d;
    background: rgba(34, 197, 94, .10);
  }

  .tarea-rubrica-iusacademy__resumen > span.invalida {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .tarea-rubrica-iusacademy__criterios {
    display: grid;
    gap: 8px;
  }

  .tarea-rubrica-iusacademy__criterio {
    display: grid;
    gap: 9px;
    padding: 11px 12px;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    background: var(--app-surface-alt);
  }

  .tarea-rubrica-iusacademy__criterio-principal {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: start;
    gap: 9px;
  }

  .tarea-rubrica-iusacademy__numero {
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    border-radius: 7px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 10px;
    font-weight: 800;
  }

  .tarea-rubrica-iusacademy__criterio-principal > span:nth-child(2) {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  .tarea-rubrica-iusacademy__criterio-principal strong {
    font-size: 11px;
  }

  .tarea-rubrica-iusacademy__criterio-principal small {
    font-size: 10px;
    line-height: 1.4;
  }

  .tarea-rubrica-iusacademy__criterio-principal > b {
    color: var(--app-accent-dark);
    font-size: 12px;
  }

  .tarea-rubrica-iusacademy__niveles {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 5px;
    padding-left: 33px;
  }

  .tarea-rubrica-iusacademy__niveles > span {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
    min-width: 0;
    padding: 5px 7px;
    border: 1px solid var(--app-border);
    border-radius: 7px;
    color: var(--app-text-muted);
    background: var(--app-surface);
    font-size: 9px;
  }

  .tarea-rubrica-iusacademy__niveles b {
    color: var(--app-text);
    font-size: 9px;
  }

  .tarea-rubrica-iusacademy__pie {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    color: var(--app-text-muted);
    font-size: 10px;
    line-height: 1.4;
  }

  .tarea-rubrica-iusacademy__pie svg {
    flex: 0 0 auto;
    margin-top: 1px;
    color: var(--app-accent-dark);
  }

  .tarea-rubrica-selector {
    display: grid;
    gap: 10px;
    padding: 13px 14px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .tarea-rubrica-selector__titulo {
    display: grid;
    gap: 3px;
  }

  .tarea-rubrica-selector__titulo strong {
    color: var(--app-text);
    font-size: 13px;
  }

  .tarea-rubrica-selector__titulo small {
    color: var(--app-text-muted);
    font-size: 11px;
  }

  .tarea-rubrica-selector__opciones {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .tarea-rubrica-selector__opciones label {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    min-height: 72px;
    padding: 12px;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    background: var(--app-surface);
    cursor: pointer;
  }

  .tarea-rubrica-selector__opciones label.activa {
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--app-accent) 18%, transparent);
  }

  .tarea-rubrica-selector__opciones label.activa::after {
    content: '✓';
    position: absolute;
    top: 10px;
    right: 10px;
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--app-accent);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
  }

  .tarea-rubrica-selector__opciones input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .tarea-rubrica-selector__opciones span {
    display: grid;
    gap: 2px;
  }

  .tarea-rubrica-selector__opciones b {
    color: var(--app-text);
    font-size: 12px;
  }

  .tarea-rubrica-selector__opciones small {
    color: var(--app-text-muted);
    font-size: 10px;
    line-height: 1.35;
  }

  @media (max-width: 620px) {
    .tarea-adjunto-config {
      align-items: stretch;
      flex-direction: column;
    }

    .tarea-adjunto-config__selector {
      justify-content: center;
    }

    .tarea-rubrica-iusacademy__cabecera,
    .tarea-rubrica-iusacademy__resumen {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .tarea-rubrica-iusacademy__niveles {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      padding-left: 0;
    }

    .tarea-rubrica-selector__opciones,
    .tarea-rubrica-editor__niveles,
    .tarea-rubrica-editor__grid,
    .tarea-rubrica-editor__nivel-grid {
      grid-template-columns: 1fr;
    }

    .tarea-rubrica-editor__cabecera,
    .tarea-rubrica-editor__resumen,
    .tarea-rubrica-editor__total {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  .tarea-form__titulo {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    color: var(--app-accent-dark);
  }

  .tarea-form__titulo > svg {
    width: 36px;
    height: 36px;
    padding: 8px;
    box-sizing: border-box;
    border: 1px solid color-mix(in srgb, var(--app-accent) 18%, transparent);
    border-radius: 12px;
    background: var(--app-accent-soft);
  }

  .tarea-form__titulo strong {
    display: block;
    color: var(--app-text);
    font-size: 16px;
    line-height: 1.2;
  }

  .tarea-form__titulo small {
    display: block;
    margin-top: 3px;
    color: var(--app-text-muted);
    font-size: 11px;
    line-height: 1.4;
  }

  .tarea-form__subtitulo {
    display: flex;
    align-items: center;
    gap: 7px;
    padding-top: 3px;
    color: var(--app-text);
    font-size: 11px;
    font-weight: 850;
  }


  .tarea-form__nota {
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    color: var(--app-text-soft);
    background: var(--app-surface-alt);
    font-size: 9.5px;
    line-height: 1.5;
  }

  .tarea-form__nota.autoría strong {
    display: block;
    margin-bottom: 3px;
    color: var(--app-accent-dark);
  }

  /* ============================================================
   * CAMPOS
   * ============================================================ */
  .tarea-form__grid {
    display: grid;
    gap: 10px 12px;
  }

  .tarea-form__grid.dos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tarea-form__grid.tres {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .tarea-form label {
    min-width: 0;
    display: grid;
    gap: 5px;
    color: var(--app-text-secondary);
    font-size: 11px;
    font-weight: 800;
  }

  .tarea-form label > span:first-child {
    color: var(--app-text-secondary);
    font-size: 11px;
    font-weight: 800;
  }

  .tarea-form input:not([type='checkbox']),
  .tarea-form textarea,
  .tarea-form select {
    width: 100%;
    min-width: 0;
    min-height: 40px;
    box-sizing: border-box;
    padding: 8px 11px;
    border: 1px solid var(--app-border-strong);
    border-radius: 11px;
    outline: none;
    color: var(--app-text);
    background: var(--app-surface);
    font: inherit;
    font-size: 11px;
    font-weight: 400;
  }

  .tarea-form textarea {
    min-height: 72px;
    max-height: 120px;
    resize: vertical;
    line-height: 1.5;
  }

  .tarea-form input:focus,
  .tarea-form textarea:focus,
  .tarea-form select:focus {
    border-color: var(--app-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-accent) 12%, transparent);
  }

  .tarea-form label > small {
    color: var(--app-text-muted);
    font-size: 8.5px;
    font-weight: 500;
  }

  /* ============================================================
   * MODALIDAD
   * ============================================================ */
  .tarea-segmentado {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .tarea-segmentado button {
    min-height: 40px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font: inherit;
    font-size: 11px;
    font-weight: 650;
    cursor: pointer;
  }

  .tarea-segmentado button.activo {
    border-color: var(--app-accent);
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    box-shadow: 0 0 0 1px var(--app-accent);
  }

  .tarea-segmentado button:disabled {
    opacity: .45;
    cursor: not-allowed;
  }

  /* ============================================================
   * CHECKS / CAPACIDADES
   * ============================================================ */
  .tarea-check {
    grid-template-columns: 18px minmax(0, 1fr) !important;
    align-items: flex-start;
    gap: 9px !important;
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface-alt);
    cursor: pointer;
  }

  .tarea-check.destacado {
    border-color: color-mix(in srgb, var(--app-accent) 24%, var(--app-border));
    background: color-mix(in srgb, var(--app-accent-soft) 42%, var(--app-surface));
  }

  .tarea-check.compacto {
    padding: 8px 10px;
  }

  .tarea-check input {
    margin-top: 2px;
    accent-color: var(--app-accent);
  }

  .tarea-check span {
    display: block;
  }

  .tarea-check strong {
    display: block;
    color: var(--app-text);
    font-size: 10px;
  }

  .tarea-check small {
    display: block;
    margin-top: 3px;
    color: var(--app-text-soft);
    font-size: 8.5px;
    line-height: 1.4;
  }

  .tarea-capacidades {
    display: grid;
    gap: 8px;
  }

  .tarea-capacidades > strong {
    font-size: 11px;
  }

  .tarea-capacidades > small {
    margin-top: -4px;
    color: var(--app-text-soft);
    font-size: 8.5px;
  }

  .tarea-capacidades > div {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
  }

  /* ============================================================
   * COMPONENTES DE ACTIVIDAD MIXTA
   * ============================================================ */
  .tarea-componentes {
    display: grid;
    gap: 8px;
    padding: 11px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .tarea-componentes__encabezado {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .tarea-componentes__encabezado strong {
    display: block;
    font-size: 11px;
  }

  .tarea-componentes__encabezado small {
    display: block;
    margin-top: 2px;
    color: var(--app-text-soft);
    font-size: 8.5px;
  }

  .tarea-componentes__encabezado button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 8px 10px;
    border: 0;
    border-radius: 9px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font: inherit;
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
  }

  .tarea-componente {
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr) 38px;
    gap: 7px;
  }

  .tarea-componente__config {
    grid-column: 1 / -1;
    margin-top: 6px;
    padding: 9px;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    background: var(--app-surface);
  }

  .tarea-componente .icono-peligro {
    border: 1px solid var(--app-danger-border);
    border-radius: 9px;
    color: var(--app-danger);
    background: var(--app-danger-bg);
    cursor: pointer;
  }

  .tarea-componente .icono-peligro:disabled {
    opacity: .35;
    cursor: not-allowed;
  }

  /* ============================================================
   * FOOTER FIJO DEL AULAMODAL
   * ============================================================ */
  .tarea-footer {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .tarea-footer__derecha {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .tarea-footer button {
    min-width: 118px;
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 9px 15px;
    border-radius: 12px;
    font: inherit;
    font-size: 11px;
    font-weight: 750;
    cursor: pointer;
  }

  .tarea-footer button.secundario {
    border: 1px solid var(--app-border-strong);
    color: var(--app-text-secondary);
    background: var(--app-surface);
  }

  .tarea-footer button.primario {
    border: 0;
    color: #fff;
    background: linear-gradient(135deg, var(--app-accent), var(--app-accent-hover));
  }

  .tarea-footer button:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  /* ============================================================
   * RESPONSIVE
   * ============================================================ */

  .tarea-participacion {
    gap: 12px;
  }

  .tarea-participacion__subtitulo {
    margin-top: -2px;
    color: var(--app-text-secondary);
    font-size: 11px;
    font-weight: 800;
  }

  .tarea-modalidad-opciones {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 10px;
  }

  .tarea-modalidad-opciones > button {
    min-width: 0;
    min-height: 72px;
    display: grid;
    grid-template-columns:
      38px
      minmax(
        0,
        1fr
      );
    align-items: center;
    gap: 10px;
    padding: 11px 13px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    color: var(--app-text);
    background: var(--app-surface-alt);
    text-align: left;
    font: inherit;
    cursor: pointer;
    transition:
      border-color
      .16s
      ease,
      background
      .16s
      ease,
      box-shadow
      .16s
      ease;
  }

  .tarea-modalidad-opciones > button:hover {
    border-color:
      color-mix(
        in srgb,
        var(--app-accent) 45%,
        var(--app-border)
      );
  }

  .tarea-modalidad-opciones > button.activo {
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
    box-shadow:
      0 0 0 1px
      var(--app-accent);
  }

  .tarea-modalidad-opciones > button:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  .tarea-modalidad-opciones__icono {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border: 1px solid var(--app-border);
    border-radius: 11px;
    color: var(--app-text-muted);
    background: var(--app-surface);
  }

  .tarea-modalidad-opciones > button.activo
  .tarea-modalidad-opciones__icono {
    border-color:
      color-mix(
        in srgb,
        var(--app-accent) 38%,
        var(--app-border)
      );
    color: var(--app-accent-dark);
    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 72%,
        var(--app-surface)
      );
  }

  .tarea-modalidad-opciones > button > span:last-child {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  .tarea-modalidad-opciones strong {
    font-size: 11px;
  }

  .tarea-modalidad-opciones small {
    color: var(--app-text-muted);
    font-size: 9px;
    line-height: 1.4;
  }

  .tarea-grupos-config {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 10px 12px;
    padding: 11px 12px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .tarea-grupos-config > label {
    min-width: 0;
    display: grid;
    gap: 5px;
  }

  .tarea-grupos-config > label > span,
  .tarea-selector-conjunto > span {
    color: var(--app-text-secondary);
    font-size: 10px;
    font-weight: 800;
  }

  .tarea-grupos-config select,
  .tarea-selector-conjunto select {
    width: 100%;
    min-width: 0;
    min-height: 40px;
    box-sizing: border-box;
    padding: 8px 11px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    outline: 0;
    color: var(--app-text);
    background: var(--app-surface);
    font: inherit;
    font-size: 10.5px;
    font-weight: 500;
  }

  .tarea-grupos-config select:focus,
  .tarea-selector-conjunto select:focus {
    border-color: var(--app-accent);
    box-shadow:
      0 0 0 3px
      color-mix(
        in srgb,
        var(--app-accent) 12%,
        transparent
      );
  }

  .tarea-grupos-plataforma,
  .tarea-afinidad,
  .tarea-regla-representante {
    grid-column:
      1 / -1;
  }

  .tarea-grupos-plataforma {
    display: grid;
    gap: 9px;
    padding: 10px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-background-subtle, var(--app-surface));
  }

  .tarea-grupos-plataforma__cabecera {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .tarea-grupos-plataforma__cabecera strong {
    display: block;
    font-size: 10.5px;
  }

  .tarea-grupos-plataforma__cabecera small {
    display: block;
    margin-top: 2px;
    color: var(--app-text-muted);
    font-size: 8.5px;
  }

  .tarea-tipo-grupo {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 8px;
  }

  .tarea-tipo-grupo button {
    min-height: 38px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font: inherit;
    font-size: 10.5px;
    font-weight: 600;
    cursor: pointer;
  }

  .tarea-tipo-grupo button.activo {
    border-color: var(--app-accent);
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    box-shadow:
      0 0 0 1px
      var(--app-accent);
  }

  .tarea-nota,
  .tarea-aviso {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 11px;
    border-radius: 12px;
    font-size: 9.5px;
    line-height: 1.45;
  }

  .tarea-nota {
    color: var(--app-text-secondary);
    background: var(--app-accent-soft);
  }

  .tarea-nota--informativa {
    margin-top: -2px;
  }

  .tarea-aviso {
    border: 1px solid
      var(
        --app-warning-border,
        #f1d992
      );
    color:
      var(
        --app-warning-strong,
        #8a5b13
      );
    background:
      var(
        --app-warning-bg,
        #fff8df
      );
  }

  .tarea-aviso > span {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .tarea-aviso strong {
    font-size: 9.5px;
  }

  .tarea-aviso small {
    font-size: 8.5px;
    line-height: 1.4;
  }

  .tarea-selector-conjunto {
    display: grid;
    gap: 5px;
  }

  .tarea-selector-conjunto small {
    color: var(--app-text-muted);
    font-size: 8.5px;
  }

  .tarea-grupo-confirmado {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid
      var(
        --app-success-border,
        #b9e2c8
      );
    border-radius: 11px;
    color:
      var(
        --app-success,
        #246a43
      );
    background:
      var(
        --app-success-bg,
        #eaf8ef
      );
  }

  .tarea-grupo-confirmado > div {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .tarea-grupo-confirmado strong {
    font-size: 10.5px;
  }

  .tarea-grupo-confirmado small {
    color:
      color-mix(
        in srgb,
        var(--app-success, #246a43) 76%,
        var(--app-text-muted)
      );
    font-size: 8.5px;
  }

  .tarea-afinidad {
    display: grid;
    gap: 9px;
  }

  .tarea-afinidad__cabecera {
    display: grid;
    grid-template-columns:
      38px
      minmax(
        0,
        1fr
      );
    align-items: center;
    gap: 9px;
  }

  .tarea-afinidad__icono {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .tarea-afinidad__cabecera strong {
    display: block;
    font-size: 10.5px;
  }

  .tarea-afinidad__cabecera small {
    display: block;
    margin-top: 2px;
    color: var(--app-text-muted);
    font-size: 8.5px;
    line-height: 1.4;
  }

  .tarea-afinidad__metricas {
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

  .tarea-total-alumnos,
  .tarea-contador {
    min-height: 86px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 5px;
    padding: 9px 11px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    background: var(--app-surface);
  }

  .tarea-total-alumnos > span,
  .tarea-contador > span {
    color: var(--app-text-secondary);
    font-size: 10.5px;
    font-weight: 800;
  }

  .tarea-total-alumnos > div {
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--app-accent-dark);
  }

  .tarea-total-alumnos strong {
    color: var(--app-text);
    font-size: 20px;
  }

  .tarea-total-alumnos small {
    color: var(--app-text-muted);
    font-size: 8.3px;
  }

  .tarea-contador > div {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .tarea-contador button {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 1px solid
      color-mix(
        in srgb,
        var(--app-accent) 40%,
        var(--app-border)
      );
    border-radius: 11px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font: inherit;
    font-size: 21px;
    line-height: 1;
    cursor: pointer;
  }

  .tarea-contador button:disabled {
    opacity: .38;
    cursor: not-allowed;
  }

  .tarea-contador strong {
    min-width: 27px;
    color: var(--app-text);
    font-size: 20px;
    text-align: center;
  }

  .tarea-afinidad__reglas {
    display: grid;
    grid-template-columns:
      repeat(
        3,
        minmax(
          0,
          1fr
        )
      );
    gap: 8px;
    padding: 9px;
    border: 1px solid
      var(
        --app-success-border,
        #b9e2c8
      );
    border-radius: 13px;
    background:
      var(
        --app-success-bg,
        #f2fbf5
      );
  }

  .tarea-afinidad__reglas > div {
    min-width: 0;
    display: grid;
    grid-template-columns:
      20px
      minmax(
        0,
        1fr
      );
    align-items: start;
    gap: 6px;
    padding: 8px;
    border-radius: 10px;
    color:
      var(
        --app-success,
        #246a43
      );
    background:
      color-mix(
        in srgb,
        var(--app-surface) 76%,
        transparent
      );
  }

  .tarea-afinidad__reglas > div > span {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .tarea-afinidad__reglas strong {
    font-size: 9.5px;
  }

  .tarea-afinidad__reglas small {
    color:
      color-mix(
        in srgb,
        var(--app-success, #246a43) 76%,
        var(--app-text-muted)
      );
    font-size: 8px;
    line-height: 1.35;
  }

  .tarea-regla-representante {
    display: grid;
    grid-template-columns:
      22px
      minmax(
        0,
        1fr
      );
    align-items: start;
    gap: 8px;
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
  }

  .tarea-regla-representante > svg {
    margin-top: 1px;
    color: var(--app-accent-dark);
  }

  .tarea-regla-representante > span {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .tarea-regla-representante strong {
    color: var(--app-text);
    font-size: 10px;
  }

  .tarea-regla-representante small {
    color: var(--app-text-muted);
    font-size: 8.5px;
    line-height: 1.4;
  }

  .tarea-capacidades--foro {
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    background: var(--app-surface-alt);
  }

  .tarea-capacidades--foro > div:first-child {
    display: grid;
    gap: 2px;
  }

  .tarea-capacidades--foro > div:first-child strong {
    font-size: 10.5px;
  }

  .tarea-capacidades--foro > div:first-child small {
    color: var(--app-text-muted);
    font-size: 8.5px;
  }

  .tarea-capacidades__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .tarea-capacidad-opcion {
    position: relative;
    display: inline-flex !important;
    grid-template-columns: none !important;
    align-items: center;
    gap: 6px !important;
    min-height: 34px;
    padding: 6px 9px;
    border: 1px solid var(--app-border);
    border-radius: 9px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font-size: 8.5px;
    font-weight: 700;
    cursor: pointer;
  }

  .tarea-capacidad-opcion input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .tarea-capacidad-opcion__check {
    width: 18px;
    height: 18px;
    display: grid;
    place-items: center;
    border: 1px solid var(--app-border-strong);
    border-radius: 5px;
    color: white;
    background: var(--app-surface);
  }

  .tarea-capacidad-opcion
  input:checked
  + .tarea-capacidad-opcion__check {
    border-color: var(--app-accent);
    background: var(--app-accent);
  }

  @media (max-width: 760px) {
    .tarea-pasos {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .tarea-form__grid.dos,
    .tarea-form__grid.tres,
    .tarea-capacidades > div {
      grid-template-columns: 1fr;
    }

    .tarea-componente {
      grid-template-columns: 1fr 1fr 38px;
    }
  }


  /* ============================================================
   * FECHAS - mismo lenguaje visual que Crear Foro
   * ============================================================ */
  .tarea-fechas {
    gap: 12px;
  }

  .tarea-fechas__grid {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 10px;
  }

  .tarea-fecha-card {
    min-width: 0;
    display: grid !important;
    align-content: start;
    gap: 7px !important;
    padding: 11px 12px;
    border: 1px solid var(--app-border);
    border-radius: 15px;
    background: var(--app-surface-alt);
  }

  .tarea-fecha-card__titulo {
    color: var(--app-text-secondary) !important;
    font-size: 10.5px !important;
    font-weight: 850 !important;
  }

  .tarea-fecha-card input {
    width: 100%;
    min-width: 0;
    min-height: 44px;
    box-sizing: border-box;
    padding: 8px 10px;
    border: 1px solid var(--app-border-strong);
    border-radius: 11px;
    outline: 0;
    color: var(--app-text);
    background: var(--app-surface);
    font: inherit;
    font-size: 10.5px;
    font-weight: 600;
    color-scheme: light;
  }

  .tarea-fecha-card input:focus {
    border-color: var(--app-accent);
    box-shadow:
      0 0 0 3px
      color-mix(
        in srgb,
        var(--app-accent) 12%,
        transparent
      );
  }

  .tarea-fecha-card small {
    min-height: 25px;
    color: var(--app-text-muted);
    font-size: 8.4px;
    font-weight: 500;
    line-height: 1.4;
  }

  .tarea-fecha-card--compacta {
    background: var(--app-surface);
  }

  .tarea-retraso-card {
    margin-top: 1px;
  }

  .tarea-switch {
    position: relative;
    min-height: 50px;
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    gap: 12px !important;
    padding: 9px 11px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface-alt);
    cursor: pointer;
  }

  .tarea-switch--destacado {
    border-color:
      color-mix(
        in srgb,
        var(--app-accent) 24%,
        var(--app-border)
      );
    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 38%,
        var(--app-surface)
      );
  }

  .tarea-switch > span {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .tarea-switch strong {
    color: var(--app-text);
    font-size: 10px;
    font-weight: 800;
  }

  .tarea-switch small {
    color: var(--app-text-muted);
    font-size: 8.4px;
    font-weight: 500;
    line-height: 1.4;
  }

  .tarea-switch > input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .tarea-switch > i {
    width: 38px;
    height: 21px;
    flex: 0 0 auto;
    padding: 2px;
    border-radius: 20px;
    background: var(--app-border-strong);
    transition: .18s ease;
  }

  .tarea-switch > i b {
    display: block;
    width: 17px;
    height: 17px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 4px #0002;
    transition: .18s ease;
  }

  .tarea-switch > input:checked + i {
    background: var(--app-accent);
  }

  .tarea-switch > input:checked + i b {
    transform:
      translateX(
        17px
      );
  }

  .tarea-retraso-panel {
    display: grid;
    gap: 9px;
    padding: 11px 12px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--app-accent) 24%,
        var(--app-border)
      );
    border-radius: 14px;
    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 40%,
        var(--app-surface)
      );
  }

  .tarea-retraso-panel__titulo {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }

  .tarea-retraso-panel__titulo > span {
    color: var(--app-accent-dark);
    font-size: 10.5px;
    font-weight: 850;
  }

  .tarea-retraso-panel__titulo > small {
    color: var(--app-text-muted);
    font-size: 8.3px;
  }

  .tarea-retraso-panel__grid {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 9px;
  }

  .tarea-retraso-panel__campo {
    min-width: 0;
    display: grid !important;
    align-content: start;
    gap: 7px !important;
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    background: var(--app-surface);
  }

  .tarea-retraso-panel__campo > span:first-child {
    color: var(--app-text-secondary) !important;
    font-size: 10px !important;
    font-weight: 800 !important;
  }

  .tarea-retraso-panel__campo select {
    width: 100%;
    min-width: 0;
    min-height: 42px;
    padding: 8px 10px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    outline: 0;
    color: var(--app-text);
    background: var(--app-surface);
    font: inherit;
    font-size: 10.5px;
  }

  .tarea-retraso-panel__campo small {
    color: var(--app-text-muted);
    font-size: 8.2px;
    line-height: 1.4;
  }

  .tarea-retraso-panel__valor {
    grid-column:
      1 / -1;
  }

  .tarea-valor-compacto,
  .tarea-peso-campo,
  .tarea-archivo-unidad {
    width: fit-content;
    display: grid;
    grid-template-columns:
      112px
      auto;
    align-items: center;
    gap: 8px;
  }

  .tarea-valor-compacto input,
  .tarea-peso-campo input,
  .tarea-archivo-unidad input {
    width: 112px !important;
    min-width: 112px !important;
    min-height: 42px;
  }

  .tarea-valor-compacto > span,
  .tarea-peso-campo > span,
  .tarea-archivo-unidad > span {
    color: var(--app-accent-dark);
    font-size: 10.5px;
    font-weight: 850;
  }

  .tarea-fechas__preferencias {
    display: grid;
    gap: 9px;
  }

  .tarea-visibilidad-compacta {
    display: grid;
    grid-template-columns:
      minmax(
        0,
        1fr
      )
      minmax(
        230px,
        .72fr
      );
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .tarea-visibilidad-compacta > div {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  .tarea-visibilidad-compacta strong {
    font-size: 10px;
  }

  .tarea-visibilidad-compacta small {
    color: var(--app-text-muted);
    font-size: 8.4px;
    line-height: 1.4;
  }

  .tarea-visibilidad-compacta select {
    width: 100%;
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid var(--app-border-strong);
    border-radius: 11px;
    outline: 0;
    color: var(--app-text);
    background: var(--app-surface);
    font: inherit;
    font-size: 10px;
    font-weight: 650;
  }

  /* ============================================================
   * EVALUACIÓN
   * ============================================================ */
  .tarea-evaluacion {
    gap: 12px;
  }

  .tarea-evaluacion__panel {
    display: grid;
    gap: 10px;
    padding: 11px 12px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .tarea-evaluacion__grid {
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

  .tarea-evaluacion__grid > label,
  .tarea-archivos-config__grid > label,
  .tarea-pesos__grid > label {
    min-width: 0;
    display: grid;
    gap: 5px;
  }

  .tarea-evaluacion__grid > label > span:first-child,
  .tarea-archivos-config__grid > label > span:first-child,
  .tarea-pesos__grid > label > span:first-child {
    color: var(--app-text-secondary);
    font-size: 10px;
    font-weight: 800;
  }

  .tarea-evaluacion__grid input,
  .tarea-evaluacion__grid select,
  .tarea-archivos-config__grid input,
  .tarea-pesos__grid input {
    width: 100%;
    min-width: 0;
    min-height: 40px;
    box-sizing: border-box;
    padding: 8px 10px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    outline: 0;
    color: var(--app-text);
    background: var(--app-surface);
    font: inherit;
    font-size: 10.5px;
  }

  .tarea-evaluacion__grid small {
    color: var(--app-text-muted);
    font-size: 8px;
    line-height: 1.35;
  }

  .tarea-pesos {
    display: grid;
    gap: 8px;
    padding: 10px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--app-accent) 20%,
        var(--app-border)
      );
    border-radius: 12px;
    background: var(--app-surface);
  }

  .tarea-pesos > div:first-child {
    display: grid;
    gap: 2px;
  }

  .tarea-pesos > div:first-child strong {
    font-size: 10px;
  }

  .tarea-pesos > div:first-child small {
    color: var(--app-text-muted);
    font-size: 8.3px;
  }

  .tarea-pesos__grid {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 10px;
  }

  .tarea-evidencias {
    display: grid;
    gap: 9px;
  }

  .tarea-evidencias__titulo {
    display: grid;
    grid-template-columns:
      34px
      minmax(
        0,
        1fr
      );
    align-items: center;
    gap: 8px;
  }

  .tarea-evidencias__titulo > svg {
    width: 34px;
    height: 34px;
    padding: 7px;
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .tarea-evidencias__titulo > div {
    display: grid;
    gap: 2px;
  }

  .tarea-evidencias__titulo strong {
    font-size: 10.5px;
  }

  .tarea-evidencias__titulo small {
    color: var(--app-text-muted);
    font-size: 8.4px;
  }

  .tarea-evidencias__switches {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 9px;
  }

  .tarea-archivos-config {
    display: grid;
    gap: 9px;
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    background: var(--app-surface-alt);
  }

  .tarea-archivos-config__nota {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--app-text-secondary);
    font-size: 8.8px;
  }

  .tarea-archivos-config__grid {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 10px;
  }

  .tarea-formatos {
    margin: 0;
    padding: 8px 9px 9px;
    border: 1px solid var(--app-border);
    border-radius: 11px;
  }

  .tarea-formatos legend {
    padding: 0 5px;
    color: var(--app-text-muted);
    font-size: 8.5px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .tarea-formatos > div {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .tarea-formatos label {
    position: relative;
    display: inline-flex !important;
    align-items: center;
    gap: 6px !important;
    min-width: 74px;
    padding: 7px 9px;
    border: 1px solid var(--app-border);
    border-radius: 8px;
    background: var(--app-surface);
    cursor: pointer;
  }

  .tarea-formatos input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .tarea-formato-check {
    width: 18px;
    height: 18px;
    display: grid;
    place-items: center;
    border: 1px solid var(--app-border-strong);
    border-radius: 5px;
    color: white;
    background: var(--app-surface);
  }

  .tarea-formatos
  input:checked
  + .tarea-formato-check {
    border-color: var(--app-accent);
    background: var(--app-accent);
  }

  .tarea-formatos strong {
    font-size: 8.5px;
  }

  .tarea-colaboracion-avanzada {
    display: grid;
    grid-template-columns:
      22px
      minmax(
        0,
        1fr
      );
    align-items: start;
    gap: 8px;
    padding: 9px 10px;
    border: 1px solid
      var(
        --app-success-border,
        #b9e2c8
      );
    border-radius: 11px;
    color:
      var(
        --app-success,
        #246a43
      );
    background:
      var(
        --app-success-bg,
        #eaf8ef
      );
  }

  .tarea-colaboracion-avanzada > span {
    display: grid;
    gap: 2px;
  }

  .tarea-colaboracion-avanzada strong {
    font-size: 9.5px;
  }

  .tarea-colaboracion-avanzada small {
    font-size: 8px;
    line-height: 1.4;
  }

  .tarea-responsable-entrega {
    grid-column:
      1 / -1;
    display: grid;
    grid-template-columns:
      minmax(
        0,
        1fr
      )
      minmax(
        250px,
        .75fr
      );
    align-items: center;
    gap: 12px;
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface);
  }

  .tarea-responsable-entrega__texto {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .tarea-responsable-entrega__texto strong {
    font-size: 10px;
  }

  .tarea-responsable-entrega__texto small {
    color: var(--app-text-muted);
    font-size: 8.5px;
  }

  .tarea-responsable-entrega select {
    width: 100%;
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    outline: 0;
    color: var(--app-text);
    background: var(--app-surface);
    font: inherit;
    font-size: 10px;
  }

  @media (max-width: 760px) {
    .tarea-afinidad__metricas {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 520px) {
    .tarea-pasos {
      gap: 6px;
      padding-inline: 10px;
    }

    .tarea-pasos button {
      font-size: 9px;
    }

    .tarea-componente {
      grid-template-columns: 1fr;
    }

    .tarea-footer {
      align-items: stretch;
      flex-direction: column;
    }

    .tarea-footer__derecha {
      display: grid;
      grid-template-columns: 1fr;
    }
  }

  .tarea-rubrica-paso {
    gap: 16px;
  }

  .tarea-rubrica-editor {
    display: grid;
    gap: 14px;
    padding: 14px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .tarea-rubrica-editor__cabecera,
  .tarea-rubrica-editor__resumen,
  .tarea-rubrica-editor__total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .tarea-rubrica-editor__cabecera > div,
  .tarea-rubrica-editor__cabecera span,
  .tarea-rubrica-editor__resumen span,
  .tarea-rubrica-editor__total span {
    display: grid;
    gap: 3px;
  }

  .tarea-rubrica-editor__cabecera strong,
  .tarea-rubrica-editor__total strong {
    color: var(--app-text);
    font-size: 13px;
  }

  .tarea-rubrica-editor__cabecera small,
  .tarea-rubrica-editor__total small {
    color: var(--app-text-muted);
    font-size: 10.5px;
    line-height: 1.4;
  }

  .tarea-rubrica-editor__restablecer,
  .tarea-rubrica-editor__agregar,
  .tarea-rubrica-editor__acciones-criterio button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 34px;
    padding: 7px 11px;
    border: 1px solid var(--app-border-strong);
    border-radius: 9px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font: inherit;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .tarea-rubrica-editor__restablecer:hover,
  .tarea-rubrica-editor__agregar:hover {
    border-color: var(--app-accent);
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .tarea-rubrica-editor__nombre,
  .tarea-rubrica-editor__descripcion,
  .tarea-rubrica-editor__nivel label,
  .tarea-rubrica-editor__grid label {
    display: grid;
    gap: 6px;
  }

  .tarea-rubrica-editor__nombre > span,
  .tarea-rubrica-editor__descripcion > span,
  .tarea-rubrica-editor__nivel label > span,
  .tarea-rubrica-editor__grid label > span {
    color: var(--app-text-secondary);
    font-size: 10px;
    font-weight: 850;
  }

  .tarea-rubrica-editor__resumen {
    padding: 10px 12px;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    background: var(--app-surface);
  }

  .tarea-rubrica-editor__resumen span {
    min-width: 120px;
  }

  .tarea-rubrica-editor__resumen strong {
    color: var(--app-text);
    font-size: 15px;
  }

  .tarea-rubrica-editor__resumen small {
    color: var(--app-text-muted);
    font-size: 9.5px;
  }

  .tarea-rubrica-editor__resumen .valida strong,
  .tarea-rubrica-editor__total.valida > b {
    color: var(--app-success, #15803d);
  }

  .tarea-rubrica-editor__resumen .invalida strong,
  .tarea-rubrica-editor__total.invalida > b {
    color: var(--app-danger);
  }

  .tarea-rubrica-editor__criterios {
    display: grid;
    gap: 10px;
  }

  .tarea-rubrica-editor__criterio {
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface);
  }

  .tarea-rubrica-editor__criterio[open] {
    border-color: color-mix(in srgb, var(--app-accent) 45%, var(--app-border));
  }

  .tarea-rubrica-editor__criterio summary {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 11px 12px;
    list-style: none;
    cursor: pointer;
  }

  .tarea-rubrica-editor__criterio summary::-webkit-details-marker {
    display: none;
  }

  .tarea-rubrica-editor__criterio summary > span:nth-child(2) {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .tarea-rubrica-editor__criterio summary strong,
  .tarea-rubrica-editor__criterio summary small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tarea-rubrica-editor__criterio summary strong {
    color: var(--app-text);
    font-size: 11.5px;
  }

  .tarea-rubrica-editor__criterio summary small {
    color: var(--app-text-muted);
    font-size: 9.5px;
  }

  .tarea-rubrica-editor__criterio summary > b {
    color: var(--app-accent-dark);
    font-size: 12px;
  }

  .tarea-rubrica-editor__numero {
    width: 25px;
    height: 25px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 10px;
    font-weight: 900;
  }

  .tarea-rubrica-editor__contenido {
    display: grid;
    gap: 12px;
    padding: 12px;
    border-top: 1px solid var(--app-border);
    background: var(--app-surface-alt);
  }

  .tarea-rubrica-editor__grid,
  .tarea-rubrica-editor__nivel-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 150px;
    gap: 10px;
  }

  .tarea-rubrica-editor__niveles-titulo > div {
    display: grid;
    gap: 3px;
  }

  .tarea-rubrica-editor__niveles-titulo strong {
    color: var(--app-text);
    font-size: 11px;
  }

  .tarea-rubrica-editor__niveles-titulo small {
    color: var(--app-text-muted);
    font-size: 9.5px;
  }

  .tarea-rubrica-editor__niveles {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .tarea-rubrica-editor__nivel {
    display: grid;
    gap: 8px;
    padding: 10px;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    background: var(--app-surface);
  }

  .tarea-rubrica-editor__acciones-criterio {
    display: flex;
    justify-content: flex-end;
  }

  .tarea-rubrica-editor__acciones-criterio button.peligro {
    border-color: color-mix(in srgb, var(--app-danger) 35%, var(--app-border));
    color: var(--app-danger);
  }

  .tarea-rubrica-editor__acciones-criterio button:disabled {
    opacity: .45;
    cursor: not-allowed;
  }

  .tarea-rubrica-editor__agregar {
    justify-self: start;
  }

  .tarea-rubrica-editor__total {
    padding: 11px 12px;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    background: var(--app-surface);
  }

  .tarea-rubrica-editor__total > b {
    font-size: 18px;
  }

`;
